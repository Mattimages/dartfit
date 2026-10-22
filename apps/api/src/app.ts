import express, { type NextFunction, type Request, type Response } from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import type { ZodType } from 'zod';
import {
  ENGINE_VERSION,
  buildExplainInput,
  fit as runFit,
  priceTiers,
  proTwin,
  recommend,
  sensitivity,
  tierBoundsUsd,
  type Answers,
  type Fit,
  type Measurements,
} from '@dartfit/engine';
import { activeVariants, offersFor, pros, resolveOffer, specCheckFor } from './catalogue.js';
import { checkSigned, randomToken, sha256 } from './crypto.js';
import type { Db } from './db.js';
import { adminEmails, type Env } from './env.js';
import { explain, type ExplainClient } from './explain.js';
import { enqueue } from './jobs.js';
import type { Mailer } from './mail.js';
import { t, type Lang } from './i18n.js';
import { photoRouter, servablePhotos, type Fetcher } from './photos.js';
import { handSamplesCsv, saveHandSample } from './samples.js';
import {
  AdminVariantRequest,
  ExplainRequest,
  FeedbackRequest,
  FitRequest,
  LoginRequest,
  OptinsRequest,
  PushSubscribeRequest,
} from './schemas.js';

export interface AppDeps {
  db: Db;
  env: Env;
  mailer: Mailer;
  explainClient: ExplainClient | null;
  /** Fetch used by the photo proxy (tests pass a stub). */
  photoFetch?: Fetcher;
  /** Runs due background jobs; set where there is no in-process worker (Vercel). */
  runJobs?: () => Promise<void>;
}

interface User {
  id: string;
  email: string;
  lang: Lang;
  alerts_email: boolean;
  alerts_push: boolean;
  feedback_email: boolean;
}
type Req = Request & { user?: User };

const COOKIE = 'df_session';
const SESSION_DAYS = 30;
const WEB_DIST = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'web', 'dist');

function parse<T>(schema: ZodType<T>, data: unknown, res: Response): T | null {
  const r = schema.safeParse(data);
  if (!r.success) {
    res.status(400).json({
      error: 'invalid_request',
      issues: r.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`),
    });
    return null;
  }
  return r.data;
}

function cookies(req: Request): Record<string, string> {
  const out: Record<string, string> = {};
  for (const part of (req.headers.cookie ?? '').split(';')) {
    const i = part.indexOf('=');
    if (i > 0) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}

const wrap =
  (fn: (req: Req, res: Response) => Promise<unknown>) => (req: Request, res: Response, next: NextFunction) =>
    fn(req as Req, res).catch(next);

export function createApp(deps: AppDeps) {
  const { db, env, mailer } = deps;
  const app = express();
  const admins = adminEmails(env);
  const secure = env.PUBLIC_URL.startsWith('https://');
  const publicOrigin = new URL(env.PUBLIC_URL).origin;
  if (env.TRUST_PROXY) app.set('trust proxy', 1);
  app.disable('x-powered-by');

  app.use(
    helmet({
      contentSecurityPolicy: {
        useDefaults: false,
        directives: {
          defaultSrc: ["'self'"],
          // MediaPipe runs as WebAssembly: 'wasm-unsafe-eval' allows compiling wasm, not JS eval.
          scriptSrc: ["'self'", "'wasm-unsafe-eval'"],
          workerSrc: ["'self'", 'blob:'],
          styleSrc: ["'self'"],
          fontSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'blob:'],
          mediaSrc: ["'self'", 'blob:'],
          // Fallback model download if the self-hosted copy is missing.
          connectSrc: ["'self'", 'https://storage.googleapis.com'],
          frameAncestors: ["'none'"],
          baseUri: ["'self'"],
          formAction: ["'self'"],
          objectSrc: ["'none'"],
          upgradeInsecureRequests: secure ? [] : null,
        },
      },
      crossOriginEmbedderPolicy: false,
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    }),
  );
  app.use((_req, res, next) => {
    res.setHeader('Permissions-Policy', 'camera=(self), microphone=(), geolocation=(), payment=()');
    next();
  });
  app.use(express.json({ limit: '32kb' }));

  // CSRF: browsers always send Origin on cross-site POSTs; reject any that is not ours.
  app.use((req, res, next) => {
    if (req.method === 'GET' || req.method === 'HEAD') return next();
    const origin = req.headers.origin;
    if (origin && origin !== publicOrigin) return res.status(403).json({ error: 'bad_origin' });
    next();
  });

  // Session
  app.use((req: Request, _res: Response, next: NextFunction) => {
    const sid = cookies(req)[COOKIE];
    if (!sid) return next();
    db.query<User>(
      `SELECT u.id, u.email, u.lang, u.alerts_email, u.alerts_push, u.feedback_email FROM sessions s JOIN users u ON u.id = s.user_id
       WHERE s.id_hash=$1 AND s.expires_at > now()`,
      [sha256(sid)],
    )
      .then((rows) => {
        if (rows[0]) (req as Req).user = rows[0];
        next();
      })
      .catch(next);
  });

  const limiter = (windowMin: number, max: number) =>
    rateLimit({ windowMs: windowMin * 60_000, limit: max, standardHeaders: 'draft-8', legacyHeaders: false });

  const country = (req: Request, body?: string) =>
    (
      body ??
      (req.headers['cf-ipcountry'] as string | undefined) ??
      (req.headers['x-vercel-ip-country'] as string | undefined) ??
      env.DEFAULT_COUNTRY
    ).toUpperCase();

  // ── Health & catalogue ───────────────────────────────────────────────
  app.get('/api/health', (_req, res) => res.json({ ok: true, engine: ENGINE_VERSION, db: db.kind }));
  app.use(photoRouter(env, deps.photoFetch));

  // Vercel Cron calls this with "Authorization: Bearer $CRON_SECRET". Without a secret it does not exist.
  app.get(
    '/api/cron/jobs',
    wrap(async (req, res) => {
      const secret = env.CRON_SECRET;
      if (!deps.runJobs || !secret || req.headers.authorization !== `Bearer ${secret}`)
        return void res.status(404).json({ error: 'not_found' });
      await deps.runJobs();
      res.json({ ok: true });
    }),
  );
  const photoModels = [...servablePhotos(env)];

  app.get(
    '/api/catalogue',
    wrap(async (_req, res) => {
      res.setHeader('Cache-Control', 'public, max-age=300');
      res.json({
        engineVersion: ENGINE_VERSION,
        variants: await activeVariants(db),
        pros: pros(),
        photos: photoModels,
      });
    }),
  );

  // ── Fit ──────────────────────────────────────────────────────────────
  async function buildResult(f: Fit, answers: Answers, m: Measurements | undefined, cty: string) {
    const variants = await activeVariants(db);
    const rec = recommend(f, variants, { budgetUsd: answers.budgetUsd });
    const withOffers = await Promise.all(
      rec.picks.map(async (p) => ({ ...p, offers: await offersFor(db, env, p.variant, cty) })),
    );
    // A dart without an affiliate link is not shown.
    const picks = withOffers.filter((p) => p.offers.length > 0);
    // Each price class shows a dart with a real photo when one fits; the drawing is the fallback.
    const photoSet = new Set(photoModels);
    const pref = priceTiers(
      f,
      variants.filter((v) => photoSet.has(v.modelId)),
      tierBoundsUsd(),
    );
    const any = priceTiers(f, variants, tierBoundsUsd());
    const raw = {
      budget: pref.budget ?? any.budget,
      standard: pref.standard ?? any.standard,
      premium: pref.premium ?? any.premium,
    };
    const tiers = Object.fromEntries(
      await Promise.all(
        Object.entries(raw).map(async ([k, s]) => {
          if (!s) return [k, null];
          const offers = await offersFor(db, env, s.variant, cty);
          return [k, offers.length ? { ...s, offers } : null];
        }),
      ),
    );
    const twin = proTwin(f, pros(), variants);
    const whatIf = sensitivity(m, answers, variants, { budgetUsd: answers.budgetUsd }).slice(0, 4);
    return { fit: f, recommendation: { ...rec, picks }, tiers, proTwin: twin, whatIf, country: cty };
  }

  app.post(
    '/api/fit',
    limiter(15, 120),
    wrap(async (req, res) => {
      const body = parse(FitRequest, req.body, res);
      if (!body) return;
      // A current dart picked from the catalogue gets its specs from our data, not the client.
      const cur = body.answers.current;
      if (cur?.variantId) {
        const v = (await activeVariants(db)).find((x) => x.id === cur.variantId);
        if (v) {
          body.answers.current = {
            ...cur,
            weightG: v.weightG,
            lengthMm: v.lengthMm,
            diameterMm: v.diameterMm,
            ...(v.gripIntensity !== null ? { gripIntensity: v.gripIntensity } : {}),
            ...(v.balance ? { balance: v.balance } : {}),
          };
        } else delete body.answers.current!.variantId;
      }
      const f = runFit(body.measurements, body.answers);
      const cty = country(req, body.country);
      const result = await buildResult(f, body.answers, body.measurements, cty);
      const id = randomUUID();
      await db.query(
        `INSERT INTO fits(id, user_id, engine_version, measurements, answers, result, best_variant_id, country, lang)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [
          id,
          req.user?.id ?? null,
          ENGINE_VERSION,
          body.measurements ? JSON.stringify(body.measurements) : null,
          JSON.stringify(body.answers),
          JSON.stringify(f),
          result.recommendation.picks[0]?.variant.id ?? null,
          cty,
          body.lang,
        ],
      );
      await saveHandSample(db, f, body, cty, result.recommendation.picks[0]?.variant.id ?? null).catch((e) =>
        console.error('hand sample not saved', e),
      );
      res.json({ id, saved: !!req.user, ...result });
    }),
  );

  app.get(
    '/api/fit/:id',
    wrap(async (req, res) => {
      const id = String(req.params.id);
      if (!/^[0-9a-f-]{36}$/.test(id)) return res.status(404).json({ error: 'not_found' });
      const row = (
        await db.query<{
          user_id: string | null;
          measurements: Measurements | null;
          answers: Answers;
          country: string;
          lang: Lang;
        }>('SELECT user_id, measurements, answers, country, lang FROM fits WHERE id=$1', [id])
      )[0];
      // Saved fits are private to their owner; anonymous fits are reachable only by their unguessable id.
      if (!row || (row.user_id && row.user_id !== req.user?.id))
        return res.status(404).json({ error: 'not_found' });
      const f = runFit(row.measurements ?? undefined, row.answers);
      res.json({
        id,
        saved: !!row.user_id,
        lang: row.lang,
        measurements: row.measurements,
        answers: row.answers,
        ...(await buildResult(f, row.answers, row.measurements ?? undefined, row.country)),
      });
    }),
  );

  // ── Explanation (server-side, grounded) ──────────────────────────────
  app.post(
    '/api/explain',
    limiter(15, 60),
    wrap(async (req, res) => {
      const body = parse(ExplainRequest, req.body, res);
      if (!body) return;
      const row = (
        await db.query<{
          user_id: string | null;
          measurements: Measurements | null;
          answers: Answers;
          lang: Lang;
        }>('SELECT user_id, measurements, answers, lang FROM fits WHERE id=$1', [body.fitId])
      )[0];
      if (!row || (row.user_id && row.user_id !== req.user?.id))
        return res.status(404).json({ error: 'not_found' });
      const lang = body.lang ?? row.lang;
      const variants = await activeVariants(db);
      const f = runFit(row.measurements ?? undefined, row.answers);
      const rec = recommend(f, variants, { budgetUsd: row.answers.budgetUsd });
      const pick = body.variantId ? rec.picks.find((p) => p.variant.id === body.variantId) : rec.picks[0];
      if (!pick) return res.status(404).json({ error: 'no_pick' });
      const cached = (
        await db.query<{ text: string; source: 'ai' | 'template' }>(
          'SELECT text, source FROM explanations WHERE fit_id=$1 AND variant_id=$2 AND lang=$3',
          [body.fitId, pick.variant.id, lang],
        )
      )[0];
      if (cached) return res.json(cached);
      const m = row.measurements;
      const input = buildExplainInput(
        lang,
        f,
        row.answers,
        pick,
        proTwin(f, pros(), variants),
        m ? { handLengthMm: m.handLengthMm, middleLengthMm: m.middleLengthMm } : null,
      );
      const out = await explain(input, deps.explainClient);
      await db.query(
        'INSERT INTO explanations(fit_id, variant_id, lang, text, source) VALUES ($1,$2,$3,$4,$5) ON CONFLICT DO NOTHING',
        [body.fitId, pick.variant.id, lang, out.text, out.source],
      );
      res.json({ text: out.text, source: out.source });
    }),
  );

  // ── Outbound click redirect ──────────────────────────────────────────
  app.get(
    '/go/:offerId',
    limiter(1, 60),
    wrap(async (req, res) => {
      const offerId = String(req.params.offerId);
      const target = await resolveOffer(db, env, offerId);
      if (!target) return res.status(404).send('Offer not found');
      const fitId =
        typeof req.query.fit === 'string' && /^[0-9a-f-]{36}$/.test(req.query.fit) ? req.query.fit : null;
      const fitExists = fitId
        ? (await db.query('SELECT 1 FROM fits WHERE id=$1', [fitId])).length > 0
        : false;
      await db.query(
        'INSERT INTO clicks(fit_id, user_id, offer_id, variant_id, retailer, country) VALUES ($1,$2,$3,$4,$5,$6)',
        [
          fitExists ? fitId : null,
          req.user?.id ?? null,
          offerId,
          target.variantId,
          target.retailer,
          country(req),
        ],
      );
      if (req.user?.feedback_email) {
        await enqueue(
          db,
          'feedback_email',
          { userId: req.user.id, fitId: fitExists ? fitId : '' },
          {
            runAt: new Date(Date.now() + 14 * 864e5),
            dedupeKey: `feedback:${req.user.id}:${new Date().toISOString().slice(0, 7)}`,
          },
        );
      }
      res.setHeader('Referrer-Policy', 'no-referrer');
      res.redirect(302, target.url);
    }),
  );

  // ── Accounts: magic link only, no passwords ──────────────────────────
  app.post(
    '/api/auth/request',
    limiter(15, 10),
    wrap(async (req, res) => {
      const body = parse(LoginRequest, req.body, res);
      if (!body) return;
      const recent = await db.query(
        `SELECT 1 FROM login_tokens WHERE email=$1 AND expires_at > now() - interval '40 minutes'`,
        [body.email],
      );
      // Same answer either way, so the endpoint does not reveal who has an account.
      if (recent.length < 3) {
        const token = randomToken();
        await db.query(
          `INSERT INTO login_tokens(token_hash, email, payload, expires_at) VALUES ($1,$2,$3, now() + interval '20 minutes')`,
          [
            sha256(token),
            body.email,
            JSON.stringify({
              fitId: body.fitId,
              lang: body.lang,
              alertsEmail: body.alertsEmail,
              feedbackEmail: body.feedbackEmail,
              consentVersion: body.consentVersion,
            }),
          ],
        );
        await mailer.send({
          to: body.email,
          kind: 'login',
          subject: t(body.lang, 'login.subject'),
          text: t(body.lang, 'login.body', { url: `${env.PUBLIC_URL}/api/auth/verify?token=${token}` }),
        });
      }
      res.json({ ok: true });
    }),
  );

  app.get(
    '/api/auth/verify',
    wrap(async (req, res) => {
      const token = typeof req.query.token === 'string' ? req.query.token : '';
      const row = (
        await db.query<{
          email: string;
          payload: {
            fitId?: string;
            lang?: Lang;
            alertsEmail?: boolean;
            feedbackEmail?: boolean;
            consentVersion?: string;
          };
        }>(
          `UPDATE login_tokens SET used_at=now() WHERE token_hash=$1 AND used_at IS NULL AND expires_at > now() RETURNING email, payload`,
          [sha256(token)],
        )
      )[0];
      if (!row) return res.redirect(302, '/#/signin?error=expired');
      const p = row.payload;
      let user = (await db.query<{ id: string }>('SELECT id FROM users WHERE email=$1', [row.email]))[0];
      if (!user) {
        user = { id: randomUUID() };
        await db.query('INSERT INTO users(id, email, lang) VALUES ($1,$2,$3)', [
          user.id,
          row.email,
          p.lang ?? 'nl',
        ]);
      }
      await setOptins(
        user.id,
        { alertsEmail: p.alertsEmail, feedbackEmail: p.feedbackEmail },
        p.consentVersion ?? 'unknown',
        true,
      );
      await db.query('UPDATE users SET last_seen_at=now() WHERE id=$1', [user.id]);
      if (p.fitId)
        await db.query('UPDATE fits SET user_id=$1 WHERE id=$2 AND user_id IS NULL', [user.id, p.fitId]);
      const sid = randomToken();
      await db.query(
        `INSERT INTO sessions(id_hash, user_id, expires_at) VALUES ($1,$2, now() + interval '${SESSION_DAYS} days')`,
        [sha256(sid), user.id],
      );
      res.cookie(COOKIE, sid, {
        httpOnly: true,
        secure,
        sameSite: 'lax',
        maxAge: SESSION_DAYS * 864e5,
        path: '/',
      });
      res.redirect(302, p.fitId ? `/#/fit/${p.fitId}?saved=1` : '/#/me');
    }),
  );

  app.post(
    '/api/auth/logout',
    wrap(async (req, res) => {
      const sid = cookies(req)[COOKIE];
      if (sid) await db.query('DELETE FROM sessions WHERE id_hash=$1', [sha256(sid)]);
      res.clearCookie(COOKIE, { path: '/' });
      res.json({ ok: true });
    }),
  );

  async function setOptins(
    userId: string,
    o: { alertsEmail?: boolean; alertsPush?: boolean; feedbackEmail?: boolean },
    version: string,
    onlyGrant = false,
  ) {
    const map = {
      alertsEmail: 'alerts_email',
      alertsPush: 'alerts_push',
      feedbackEmail: 'feedback_email',
    } as const;
    for (const [k, col] of Object.entries(map) as Array<[keyof typeof map, string]>) {
      const v = o[k];
      if (v === undefined || (onlyGrant && !v)) continue;
      await db.query(`UPDATE users SET ${col}=$2 WHERE id=$1`, [userId, v]);
      await db.query('INSERT INTO consents(user_id, kind, granted, wording_version) VALUES ($1,$2,$3,$4)', [
        userId,
        col,
        v,
        version,
      ]);
    }
  }

  const requireUser = (req: Req, res: Response): User | null => {
    if (!req.user) {
      res.status(401).json({ error: 'sign_in_required' });
      return null;
    }
    return req.user;
  };

  app.get(
    '/api/me',
    wrap(async (req, res) => {
      if (!req.user) return res.json({ user: null });
      const fits = await db.query(
        `SELECT f.id, f.created_at, f.best_variant_id, m.brand, m.name, v.weight_g
         FROM fits f LEFT JOIN dart_variants v ON v.id=f.best_variant_id LEFT JOIN dart_models m ON m.id=v.model_id
         WHERE f.user_id=$1 ORDER BY f.created_at DESC LIMIT 20`,
        [req.user.id],
      );
      res.json({ user: { ...req.user, admin: admins.has(req.user.email) }, fits });
    }),
  );

  app.post(
    '/api/me/optins',
    wrap(async (req, res) => {
      const u = requireUser(req, res);
      if (!u) return;
      const body = parse(OptinsRequest, req.body, res);
      if (!body) return;
      await setOptins(u.id, body, body.consentVersion);
      res.json({ ok: true });
    }),
  );

  app.post(
    '/api/me/fits/:id/save',
    wrap(async (req, res) => {
      const u = requireUser(req, res);
      if (!u) return;
      const r = await db.query(
        'UPDATE fits SET user_id=$1 WHERE id=$2 AND (user_id IS NULL OR user_id=$1) RETURNING id',
        [u.id, String(req.params.id)],
      );
      if (!r.length) return res.status(404).json({ error: 'not_found' });
      res.json({ ok: true });
    }),
  );

  // GDPR: export and erase.
  app.get(
    '/api/me/export',
    wrap(async (req, res) => {
      const u = requireUser(req, res);
      if (!u) return;
      const q = (sql: string) => db.query(sql, [u.id]);
      res.setHeader('Content-Disposition', 'attachment; filename="dartfit-export.json"');
      res.json({
        user: (
          await q(
            'SELECT id, email, lang, alerts_email, alerts_push, feedback_email, created_at FROM users WHERE id=$1',
          )
        )[0],
        consents: await q(
          'SELECT kind, granted, wording_version, created_at FROM consents WHERE user_id=$1 ORDER BY id',
        ),
        fits: await q(
          'SELECT id, created_at, engine_version, measurements, answers, best_variant_id FROM fits WHERE user_id=$1',
        ),
        clicks: await q('SELECT offer_id, variant_id, retailer, created_at FROM clicks WHERE user_id=$1'),
        feedback: await q(
          'SELECT variant_id, bought, weight_g, feel, created_at FROM feedback WHERE user_id=$1',
        ),
      });
    }),
  );

  app.delete(
    '/api/me',
    wrap(async (req, res) => {
      const u = requireUser(req, res);
      if (!u) return;
      await db.query('DELETE FROM users WHERE id=$1', [u.id]); // cascades to fits, sessions, consents, subscriptions
      res.clearCookie(COOKIE, { path: '/' });
      res.json({ ok: true });
    }),
  );

  // ── Web push ─────────────────────────────────────────────────────────
  app.get('/api/push/key', (_req, res) => res.json({ publicKey: env.VAPID_PUBLIC_KEY ?? null }));

  app.post(
    '/api/push/subscribe',
    wrap(async (req, res) => {
      const u = requireUser(req, res);
      if (!u) return;
      const body = parse(PushSubscribeRequest, req.body, res);
      if (!body) return;
      await db.query(
        `INSERT INTO push_subscriptions(endpoint, user_id, p256dh, auth) VALUES ($1,$2,$3,$4)
         ON CONFLICT (endpoint) DO UPDATE SET user_id=$2, p256dh=$3, auth=$4`,
        [body.endpoint, u.id, body.keys.p256dh, body.keys.auth],
      );
      await setOptins(u.id, { alertsPush: true }, 'push-2026-10-v1');
      res.json({ ok: true });
    }),
  );

  // ── One-click unsubscribe (GET from the email, POST from List-Unsubscribe-Post) ─
  const unsubscribe = wrap(async (req, res) => {
    const q = { ...req.query, ...(typeof req.body === 'object' ? req.body : {}) } as Record<string, unknown>;
    const userId = checkSigned(env.SESSION_SECRET, 'unsub', q);
    if (!userId) return res.status(400).send('Invalid link');
    const what = q.x === 'feedback' ? { feedbackEmail: false } : { alertsEmail: false, alertsPush: false };
    await setOptins(userId, what, 'unsubscribe-link');
    const lang = ((await db.query<{ lang: Lang }>('SELECT lang FROM users WHERE id=$1', [userId]))[0]?.lang ??
      'nl') as Lang;
    res.type('text/plain; charset=utf-8').send(t(lang, 'unsub.done'));
  });
  app.get('/api/unsubscribe', unsubscribe);
  app.post('/api/unsubscribe', express.urlencoded({ extended: false }), unsubscribe);

  // ── Feedback (signed link from the two-week email, no login needed) ──
  app.post(
    '/api/feedback',
    limiter(15, 20),
    wrap(async (req, res) => {
      const body = parse(FeedbackRequest, req.body, res);
      if (!body) return;
      const userId = checkSigned(env.SESSION_SECRET, 'feedback', body);
      if (!userId) return res.status(400).json({ error: 'bad_signature' });
      const fitId = body.x && /^[0-9a-f-]{36}$/.test(body.x) ? body.x : null;
      await db.query(
        'INSERT INTO feedback(user_id, fit_id, variant_id, bought, weight_g, feel, engine_version) VALUES ($1,$2,$3,$4,$5,$6,$7)',
        [
          userId,
          fitId,
          body.variantId ?? null,
          body.bought,
          body.weightG ?? null,
          body.feel ?? null,
          ENGINE_VERSION,
        ],
      );
      res.json({ ok: true });
    }),
  );

  // ── Admin ────────────────────────────────────────────────────────────
  const requireAdmin = (req: Req, res: Response) => {
    const u = requireUser(req, res);
    if (!u) return null;
    if (!admins.has(u.email)) {
      res.status(403).json({ error: 'admin_only' });
      return null;
    }
    return u;
  };

  app.post(
    '/api/admin/variants',
    wrap(async (req, res) => {
      if (!requireAdmin(req, res)) return;
      const v = parse(AdminVariantRequest, req.body, res);
      if (!v) return;
      await db.query(
        `INSERT INTO dart_models(id, brand, name, tip, shape, balance) VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (id) DO NOTHING`,
        [v.modelId, v.brand, v.model, v.tip, v.shape, v.balance],
      );
      const check = specCheckFor({ ...v, specCheck: undefined });
      await db.query(
        `INSERT INTO dart_variants(id, model_id, weight_g, length_mm, diameter_mm, grip, tungsten_pct, price_usd, source_url, verified_at, origin, spec_check)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9, current_date, 'admin', $10)`,
        [
          v.id,
          v.modelId,
          v.weightG,
          v.lengthMm,
          v.diameterMm,
          v.gripIntensity,
          v.tungstenPct,
          v.priceUsd,
          v.sourceUrl,
          check ? JSON.stringify(check) : null,
        ],
      );
      await db.query(
        `INSERT INTO offers(id, variant_id, retailer, country, url, price, currency) VALUES ($1,$2,'source','*',$3,$4,'USD') ON CONFLICT DO NOTHING`,
        [`source:${v.id}`, v.id, v.sourceUrl, v.priceUsd],
      );
      // A listing the physics model cannot reconcile is stored but never alerted until re-checked.
      if (!check)
        await enqueue(db, 'new_variant_alerts', { variantId: v.id }, { dedupeKey: `alerts:${v.id}` });
      res.status(201).json({ ok: true, id: v.id, specCheck: check });
    }),
  );

  // Anonymous hand measurements for calibration and research (admins only), as CSV.
  app.get(
    '/api/admin/hand-samples.csv',
    wrap(async (req, res) => {
      if (!requireAdmin(req, res)) return;
      const rows = await db.query<Record<string, unknown>>('SELECT * FROM hand_samples ORDER BY id');
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="dartfit-hand-samples.csv"');
      res.send(handSamplesCsv(rows));
    }),
  );

  app.get(
    '/api/admin/stats',
    wrap(async (req, res) => {
      if (!requireAdmin(req, res)) return;
      const one = async (sql: string) => Number((await db.query<{ n: number }>(sql))[0]?.n ?? 0);
      res.json({
        fits: await one('SELECT count(*)::int AS n FROM fits'),
        savedFits: await one('SELECT count(*)::int AS n FROM fits WHERE user_id IS NOT NULL'),
        users: await one('SELECT count(*)::int AS n FROM users'),
        clicks: await one('SELECT count(*)::int AS n FROM clicks'),
        clicksByRetailer: await db.query(
          'SELECT retailer, count(*)::int AS n FROM clicks GROUP BY retailer ORDER BY n DESC',
        ),
        feelByWeight: await db.query(
          `SELECT weight_g::float8 AS weight_g, feel, count(*)::int AS n FROM feedback WHERE weight_g IS NOT NULL GROUP BY weight_g, feel ORDER BY weight_g, feel`,
        ),
        deadOffers: await one('SELECT count(*)::int AS n FROM offers WHERE NOT live'),
        failedJobs: await db.query(
          `SELECT kind, last_error, created_at FROM jobs WHERE status='failed' ORDER BY id DESC LIMIT 20`,
        ),
      });
    }),
  );

  // ── Web app ──────────────────────────────────────────────────────────
  if (existsSync(WEB_DIST)) {
    app.use(
      express.static(WEB_DIST, {
        index: 'index.html',
        setHeaders(res, path) {
          if (/\/assets\//.test(path)) res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
          if (path.endsWith('sw.js') || path.endsWith('index.html'))
            res.setHeader('Cache-Control', 'no-cache');
        },
      }),
    );
  }

  app.use('/api', (_req, res) => res.status(404).json({ error: 'not_found' }));

  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    if (env.NODE_ENV !== 'test') console.error(err);
    res.status(500).json({ error: 'server_error' });
  });

  return app;
}
