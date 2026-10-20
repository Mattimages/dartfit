import { fit as runFit, recommend, scoreVariant, type Answers, type Fit, type Measurements } from '@dartfit/engine';
import { activeVariants } from './catalogue.js';
import { signedParams } from './crypto.js';
import type { Db } from './db.js';
import type { Env } from './env.js';
import type { Mailer } from './mail.js';
import { t, type Lang } from './i18n.js';

export interface Pusher {
  send(sub: { endpoint: string; p256dh: string; auth: string }, payload: object): Promise<'ok' | 'gone'>;
}

export async function webPusher(env: Env): Promise<Pusher | null> {
  if (!env.VAPID_PUBLIC_KEY || !env.VAPID_PRIVATE_KEY) return null;
  const wp = (await import('web-push')).default;
  wp.setVapidDetails(env.VAPID_SUBJECT, env.VAPID_PUBLIC_KEY, env.VAPID_PRIVATE_KEY);
  return {
    async send(sub, payload) {
      try {
        await wp.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, JSON.stringify(payload));
        return 'ok';
      } catch (e) {
        const code = (e as { statusCode?: number }).statusCode;
        if (code === 404 || code === 410) return 'gone';
        throw e;
      }
    },
  };
}

export interface JobDeps {
  db: Db;
  env: Env;
  mailer: Mailer;
  pusher: Pusher | null;
  /** Injected for the link checker so tests never hit the network. */
  fetchStatus: (url: string) => Promise<number>;
  now?: () => Date;
}

export async function enqueue(db: Db, kind: string, payload: object = {}, opts: { runAt?: Date; dedupeKey?: string } = {}) {
  await db.query(
    `INSERT INTO jobs(kind, payload, run_at, dedupe_key) VALUES ($1,$2,$3,$4) ON CONFLICT (dedupe_key) DO NOTHING`,
    [kind, JSON.stringify(payload), (opts.runAt ?? new Date()).toISOString(), opts.dedupeKey ?? null],
  );
}

interface JobRow {
  id: number;
  kind: string;
  payload: Record<string, unknown>;
  attempts: number;
}

async function claim(db: Db, now: Date): Promise<JobRow | null> {
  const rows = await db.query<JobRow>(
    `UPDATE jobs SET status='running', attempts=attempts+1
     WHERE id = (SELECT id FROM jobs WHERE status='queued' AND run_at <= $1 ORDER BY run_at, id LIMIT 1 FOR UPDATE SKIP LOCKED)
     RETURNING id, kind, payload, attempts`,
    [now.toISOString()],
  );
  return rows[0] ?? null;
}

const handlers: Record<string, (d: JobDeps, p: Record<string, unknown>) => Promise<void>> = {
  new_variant_alerts: alertForVariant,
  link_check: linkCheck,
  feedback_email: feedbackEmail,
  retention: retention,
};

/** Run every due job once. Returns the number processed. */
export async function runDueJobs(d: JobDeps, max = 100): Promise<number> {
  let n = 0;
  const now = d.now?.() ?? new Date();
  for (; n < max; n++) {
    const job = await claim(d.db, now);
    if (!job) break;
    try {
      const h = handlers[job.kind];
      if (!h) throw new Error(`unknown job kind ${job.kind}`);
      await h(d, job.payload);
      await d.db.query(`UPDATE jobs SET status='done', last_error=NULL WHERE id=$1`, [job.id]);
    } catch (e) {
      const retry = job.attempts < 3;
      await d.db.query(
        `UPDATE jobs SET status=$2, last_error=$3, run_at = now() + interval '10 minutes' WHERE id=$1`,
        [job.id, retry ? 'queued' : 'failed', String((e as Error).message).slice(0, 500)],
      );
    }
  }
  return n;
}

/** Schedule the recurring housekeeping jobs once per day (dedupe keys make this idempotent). */
export async function scheduleDaily(db: Db, now = new Date()) {
  const day = now.toISOString().slice(0, 10);
  const at3 = new Date(`${day}T03:00:00Z`);
  const runAt = at3 < now ? new Date(at3.getTime() + 864e5) : at3;
  await enqueue(db, 'link_check', {}, { runAt, dedupeKey: `link_check:${runAt.toISOString().slice(0, 10)}` });
  await enqueue(db, 'retention', {}, { runAt, dedupeKey: `retention:${runAt.toISOString().slice(0, 10)}` });
}

/**
 * New dart launched: score it against every opted-in user's LATEST fit, alert only when it would
 * enter their top three with a good or excellent fit. The alert_sends primary key guarantees one
 * alert per user per variant even if the job runs twice.
 */
async function alertForVariant(d: JobDeps, p: Record<string, unknown>) {
  const variantId = String(p.variantId);
  const variants = await activeVariants(d.db);
  const v = variants.find((x) => x.id === variantId);
  if (!v) return;
  const latest = await d.db.query<{
    user_id: string;
    email: string;
    lang: Lang;
    alerts_email: boolean;
    alerts_push: boolean;
    measurements: Measurements | null;
    answers: Answers;
    fit_id: string;
  }>(
    `SELECT DISTINCT ON (f.user_id) f.user_id, u.email, u.lang, u.alerts_email, u.alerts_push, f.measurements, f.answers, f.id AS fit_id
     FROM fits f JOIN users u ON u.id = f.user_id
     WHERE (u.alerts_email OR u.alerts_push)
     ORDER BY f.user_id, f.created_at DESC`,
  );
  for (const row of latest) {
    // Recompute with today's engine so alerts follow the current rules.
    const f: Fit = runFit(row.measurements ?? undefined, row.answers);
    if (f.tip !== v.tip) continue;
    const s = scoreVariant(f, v);
    if (s.quality !== 'excellent' && s.quality !== 'good') continue;
    const top = recommend(f, variants).picks.slice(0, 3);
    if (!top.some((x) => x.variant.modelId === v.modelId)) continue;
    const inserted = await d.db.query(
      `INSERT INTO alert_sends(user_id, variant_id, channel) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING RETURNING user_id`,
      [row.user_id, v.id, row.alerts_email ? 'email' : 'push'],
    );
    if (!inserted.length) continue;
    const name = `${v.brand} ${v.model} ${v.weightG} g`;
    const url = `${d.env.PUBLIC_URL}/#/fit/${row.fit_id}`;
    if (row.alerts_email) {
      await d.mailer.send({
        to: row.email,
        kind: 'alert',
        subject: t(row.lang, 'alert.subject', { name }),
        text: t(row.lang, 'alert.body', { name, quality: t(row.lang, `quality.${s.quality}`), url }),
        unsubscribeUrl: `${d.env.PUBLIC_URL}/api/unsubscribe?${signedParams(d.env.SESSION_SECRET, 'unsub', row.user_id, 'alerts')}`,
      });
    }
    if (row.alerts_push && d.pusher) {
      const subs = await d.db.query<{ endpoint: string; p256dh: string; auth: string }>(
        'SELECT endpoint, p256dh, auth FROM push_subscriptions WHERE user_id=$1',
        [row.user_id],
      );
      for (const sub of subs) {
        const r = await d.pusher.send(sub, { title: t(row.lang, 'alert.subject', { name }), url });
        if (r === 'gone') await d.db.query('DELETE FROM push_subscriptions WHERE endpoint=$1', [sub.endpoint]);
      }
    }
  }
}

/** Nightly: check every product offer still resolves; hide dead ones, restore recovered ones. */
async function linkCheck(d: JobDeps) {
  const offers = await d.db.query<{ id: string; url: string }>('SELECT id, url FROM offers');
  for (const o of offers) {
    let status = 0;
    try {
      status = await d.fetchStatus(o.url);
    } catch {
      status = 0;
    }
    const live = status >= 200 && status < 400;
    await d.db.query('UPDATE offers SET live=$2, last_status=$3, last_checked=now() WHERE id=$1', [o.id, live, status]);
  }
}

/** Two weeks after a click-out: ask opted-in users what they bought and how it feels. */
async function feedbackEmail(d: JobDeps, p: Record<string, unknown>) {
  const userId = String(p.userId);
  const u = (await d.db.query<{ email: string; lang: Lang; feedback_email: boolean }>(
    'SELECT email, lang, feedback_email FROM users WHERE id=$1',
    [userId],
  ))[0];
  if (!u?.feedback_email) return;
  const fitId = String(p.fitId ?? '');
  const link = `${d.env.PUBLIC_URL}/#/feedback?${signedParams(d.env.SESSION_SECRET, 'feedback', userId, fitId)}`;
  await d.mailer.send({
    to: u.email,
    kind: 'feedback',
    subject: t(u.lang, 'feedback.subject'),
    text: t(u.lang, 'feedback.body', { url: link }),
    unsubscribeUrl: `${d.env.PUBLIC_URL}/api/unsubscribe?${signedParams(d.env.SESSION_SECRET, 'unsub', userId, 'feedback')}`,
  });
}

/** Privacy retention: anonymous fits after 90 days; accounts inactive for 24 months; spent tokens. */
async function retention(d: JobDeps) {
  await d.db.query(`DELETE FROM fits WHERE user_id IS NULL AND created_at < now() - interval '90 days'`);
  await d.db.query(`DELETE FROM users WHERE last_seen_at < now() - interval '24 months'`);
  await d.db.query(`DELETE FROM login_tokens WHERE expires_at < now() - interval '1 day'`);
  await d.db.query(`DELETE FROM sessions WHERE expires_at < now()`);
  await d.db.query(`DELETE FROM jobs WHERE status='done' AND created_at < now() - interval '30 days'`);
}
