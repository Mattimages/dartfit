import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { createApp } from '../src/app.js';
import { syncCatalogue } from '../src/catalogue.js';
import { migrate, openDb, type Db } from '../src/db.js';
import { loadEnv, type Env } from '../src/env.js';
import type { ExplainClient } from '../src/explain.js';
import { runDueJobs, scheduleDaily, type Pusher } from '../src/jobs.js';
import { createMailer } from '../src/mail.js';

const answers = {
  tip: 'steel',
  hold: 'middle',
  fingers: 3,
  throwStyle: 'unsure',
  moisture: 'normal',
  gripFeel: 3,
  thickness: 'auto',
};
const measurements = {
  handLengthMm: 185,
  palmWidthMm: 78,
  indexLengthMm: 78,
  middleLengthMm: 85,
  thumbIndexSpanMm: 120,
  spreadMm: 1.1,
  samples: 18,
  calibrated: false,
};

let db: Db;
let env: Env;
let app: Express;
let fakeAi: { next: string; calls: number } = { next: '', calls: 0 };
const pushes: object[] = [];

const client: ExplainClient = {
  async complete() {
    fakeAi.calls++;
    return fakeAi.next;
  },
};
const pusher: Pusher = {
  async send(_s, p) {
    pushes.push(p);
    return 'ok';
  },
};
const jobDeps = () => ({
  db,
  env,
  mailer: createMailer(db, env),
  pusher,
  fetchStatus: async (u: string) =>
    u.includes('rd-javelin-21') || u.includes('red-dragon-javelin-steel-tip-darts-21gm') ? 404 : 200,
});

async function outbox(to: string) {
  return db.query<{ subject: string; body_text: string; kind: string }>(
    'SELECT subject, body_text, kind FROM outbox WHERE to_email=$1 ORDER BY id',
    [to],
  );
}

async function signIn(agent: ReturnType<typeof request.agent>, email: string, extra: object = {}) {
  await agent
    .post('/api/auth/request')
    .send({ email, confirmsAge16: true, ...extra })
    .expect(200);
  const mails = await outbox(email);
  const link = mails.at(-1)!.body_text.match(/token=([\w-]+)/)![1];
  return agent.get(`/api/auth/verify?token=${link}`).expect(302);
}

beforeAll(async () => {
  env = loadEnv({ NODE_ENV: 'test', ADMIN_EMAILS: 'admin@example.com', PUBLIC_URL: 'http://localhost:3000' });
  db = await openDb({});
  await migrate(db);
  await syncCatalogue(db);
  app = createApp({ db, env, mailer: createMailer(db, env), explainClient: client });
});
afterAll(async () => db.close());

describe('fit', () => {
  it('returns bands, picks with offers, a pro twin and what-ifs, and stores only numbers', async () => {
    const r = await request(app).post('/api/fit').send({ measurements, answers, lang: 'nl' }).expect(200);
    expect(r.body.fit.weight.band).toEqual([21, 23]);
    expect(r.body.recommendation.picks[0].role).toBe('best');
    expect(r.body.recommendation.picks[0].offers.map((o: { retailer: string }) => o.retailer)).toContain(
      'bol',
    );
    expect(r.body.proTwin.pro.name).toBeTruthy();
    const row = (
      await db.query<{ measurements: object }>('SELECT measurements FROM fits WHERE id=$1', [r.body.id])
    )[0]!;
    expect(Object.keys(row.measurements).sort()).toEqual(Object.keys(measurements).sort());
  });

  it('rejects out-of-range input', async () => {
    await request(app)
      .post('/api/fit')
      .send({ answers: { ...answers, fingers: 7 } })
      .expect(400);
    await request(app)
      .post('/api/fit')
      .send({ measurements: { ...measurements, handLengthMm: 900 }, answers })
      .expect(400);
  });

  it('uses the country header for local offers', async () => {
    const r = await request(app).post('/api/fit').set('cf-ipcountry', 'DE').send({ answers }).expect(200);
    expect(r.body.country).toBe('DE');
    const shops = r.body.recommendation.picks[0].offers.map((o: { retailer: string }) => o.retailer);
    // Darts specialists first, then the big marketplaces; never more than three.
    expect(shops[0]).toBe('dartscorner_eu');
    expect(shops).toContain('amazon_de');
    expect(shops.length).toBeLessThanOrEqual(3);
  });

  it('returns the ideal barrel, physics and setup', async () => {
    const r = await request(app).post('/api/fit').send({ measurements, answers }).expect(200);
    expect(r.body.fit.barrel.gripZone).toHaveLength(2);
    expect(r.body.fit.physics.tungstenPct).toBe(90);
    expect(['short', 'inbetween', 'medium']).toContain(r.body.fit.setup.shaft);
  });

  it('fills a current dart picked from the catalogue from our own data', async () => {
    const r = await request(app)
      .post('/api/fit')
      .send({
        answers: {
          ...answers,
          current: { variantId: 'target-littler-g1-23', weightG: 30, feel: 'right', gripFeel: 'too_smooth' },
        },
      })
      .expect(200);
    const reason = r.body.fit.reasons.find((x: { code: string }) => x.code === 'grip_current');
    expect(reason.params.current).toBe(3);
    const w = r.body.fit.reasons.find((x: { code: string }) => x.code === 'weight_current');
    expect(w.params.current).toBe(23);
  });

  it('never recommends a listing whose weight does not fit its size', async () => {
    const r = await request(app)
      .post('/api/fit')
      .send({ answers: { ...answers, fingers: 4, hold: 'rear', throwStyle: 'arc' } })
      .expect(200);
    expect(r.body.recommendation.picks.map((p: { variant: { id: string } }) => p.variant.id)).not.toContain(
      'rd-furnace-24',
    );
    expect(r.body.recommendation.filteredOut.specCheck).toBeGreaterThan(0);
  });

  it('blocks cross-site POSTs', async () => {
    await request(app).post('/api/fit').set('Origin', 'https://evil.example').send({ answers }).expect(403);
  });

  it('sets a strict CSP that still allows WebAssembly', async () => {
    const r = await request(app).get('/api/health').expect(200);
    expect(r.headers['content-security-policy']).toContain("'wasm-unsafe-eval'");
    expect(r.headers['content-security-policy']).not.toContain("'unsafe-inline'");
  });
});

describe('explain', () => {
  it('accepts an AI answer whose numbers are all in the input', async () => {
    const fit = await request(app).post('/api/fit').send({ measurements, answers, lang: 'en' }).expect(200);
    const best = fit.body.recommendation.picks[0].variant;
    fakeAi = {
      next: `The ${best.brand} ${best.model} at ${best.weightG} g sits inside your 21–23 g band. It suits a three-finger middle grip.`,
      calls: 0,
    };
    const r = await request(app).post('/api/explain').send({ fitId: fit.body.id }).expect(200);
    expect(r.body.source).toBe('ai');
  });

  it('falls back to the grounded template when the AI invents numbers twice, and caches', async () => {
    const fit = await request(app)
      .post('/api/fit')
      .send({ measurements, answers: { ...answers, hold: 'front' }, lang: 'nl' })
      .expect(200);
    fakeAi = {
      next: 'Deze dart verbetert je gemiddelde met 12,5 punten en je release met 37 graden, gegarandeerd.',
      calls: 0,
    };
    const r = await request(app).post('/api/explain').send({ fitId: fit.body.id }).expect(200);
    expect(r.body.source).toBe('template');
    expect(fakeAi.calls).toBe(2);
    expect(r.body.text).toMatch(/Je houdt de dart vooraan vast/);
    await request(app).post('/api/explain').send({ fitId: fit.body.id }).expect(200);
    expect(fakeAi.calls).toBe(2); // cached
  });
});

describe('click-outs', () => {
  it('logs the click and redirects to a search at the local shop', async () => {
    const fit = await request(app).post('/api/fit').send({ answers }).expect(200);
    const offer = fit.body.recommendation.picks[0].offers.find(
      (o: { retailer: string }) => o.retailer === 'bol',
    );
    const r = await request(app).get(`${offer.goUrl}?fit=${fit.body.id}`).expect(302);
    expect(r.headers.location).toMatch(/^https:\/\/www\.bol\.com\/nl\/nl\/s\/\?searchtext=/);
    const clicks = await db.query('SELECT * FROM clicks WHERE fit_id=$1', [fit.body.id]);
    expect(clicks).toHaveLength(1);
  });

  it('never redirects to a shop without an affiliate programme', async () => {
    await request(app).get('/go/azdarts%3Atarget-littler-g1-23').expect(404);
  });

  it('only returns affiliate shop offers', async () => {
    const r = await request(app).post('/api/fit').set('cf-ipcountry', 'NL').send({ answers }).expect(200);
    expect(r.body.recommendation.picks.length).toBeGreaterThan(0);
    for (const p of r.body.recommendation.picks)
      expect(
        p.offers.every((o: { retailer: string }) =>
          ['dartscorner_eu', 'bol', 'amazon_nl', 'ebay_nl'].includes(o.retailer),
        ),
      ).toBe(true);
  });

  it('404s an unknown offer', async () => {
    await request(app).get('/go/nope').expect(404);
  });
});

describe('accounts, saving and alerts (Phase 4 end-to-end)', () => {
  const email = 'player@example.com';
  // Agents are created once the app exists (it is built in the top-level beforeAll).
  let user: ReturnType<typeof request.agent>;
  let admin: ReturnType<typeof request.agent>;
  let fitId = '';
  beforeAll(() => {
    user = request.agent(app);
    admin = request.agent(app);
  });

  it('fit → magic link (age gate + opt-in) → fit saved to the account', async () => {
    const fit = await user.post('/api/fit').send({ measurements, answers }).expect(200);
    fitId = fit.body.id;
    await user.post('/api/auth/request').send({ email, alertsEmail: true }).expect(400); // no age confirmation
    const res = await signIn(user, email, { fitId, alertsEmail: true, feedbackEmail: true });
    expect(res.headers.location).toBe(`/#/fit/${fitId}?saved=1`);
    const me = await user.get('/api/me').expect(200);
    expect(me.body.user.alerts_email).toBe(true);
    expect(me.body.fits[0].id).toBe(fitId);
    const consents = await db.query('SELECT kind, granted FROM consents');
    expect(consents).toEqual(expect.arrayContaining([{ kind: 'alerts_email', granted: true }]));
  });

  it('"keep me posted" under a result: confirm email, alerts on, back to the fit', async () => {
    const other = request.agent(app);
    const fit = await other.post('/api/fit').send({ measurements, answers }).expect(200);
    const mail = 'posted@example.com';
    await other
      .post('/api/auth/request')
      .send({ email: mail, fitId: fit.body.id, purpose: 'alerts', confirmsAge16: true, lang: 'en' })
      .expect(200);
    const sent = (await outbox(mail))[0]!;
    expect(sent.subject).toBe('Confirm your dart alert');
    expect(sent.body_text).toMatch(/even better/);
    const token = sent.body_text.match(/token=([\w-]+)/)![1];
    const r = await other.get(`/api/auth/verify?token=${token}`).expect(302);
    expect(r.headers.location).toBe(`/#/fit/${fit.body.id}?saved=1&alerts=1`);
    expect((await other.get('/api/me').expect(200)).body.user.alerts_email).toBe(true);
  });

  it('a login link works once only', async () => {
    const mails = await outbox(email);
    const token = mails.find((m) => m.kind === 'login')!.body_text.match(/token=([\w-]+)/)![1];
    const r = await request(app).get(`/api/auth/verify?token=${token}`).expect(302);
    expect(r.headers.location).toContain('error=expired');
  });

  it('a saved fit is private to its owner', async () => {
    await request(app).get(`/api/fit/${fitId}`).expect(404);
    await user.get(`/api/fit/${fitId}`).expect(200);
  });

  it('non-admins cannot add darts', async () => {
    await user.post('/api/admin/variants').send({}).expect(403);
  });

  it('admin launches a matching dart → exactly one alert, even when jobs run twice', async () => {
    await signIn(admin, 'admin@example.com');
    const v = {
      id: 'test-launch-22',
      modelId: 'test-launch',
      brand: 'Testbrand',
      model: 'Launch Straight',
      tip: 'steel',
      weightG: 22,
      lengthMm: 48.5,
      diameterMm: 6.8,
      shape: 'straight',
      balance: 'centre',
      gripIntensity: 3,
      tungstenPct: 90,
      priceUsd: 80,
      sourceUrl: 'https://example.com/launch-22',
    };
    await admin.post('/api/admin/variants').send(v).expect(201);
    await admin.post('/api/admin/variants').send(v).expect(500); // duplicate id is refused by the database
    await runDueJobs(jobDeps());
    await runDueJobs(jobDeps());
    const alerts = (await outbox(email)).filter((m) => m.kind === 'alert');
    expect(alerts).toHaveLength(1);
    expect(alerts[0]!.subject).toContain('Testbrand Launch Straight 22 g');
    expect(alerts[0]!.body_text).toMatch(/api\/unsubscribe\?u=/);
  });

  it('a non-matching launch sends nothing', async () => {
    await admin
      .post('/api/admin/variants')
      .send({
        id: 'test-heavy-32',
        modelId: 'test-heavy',
        brand: 'Testbrand',
        model: 'Brick',
        tip: 'steel',
        weightG: 32,
        lengthMm: 38,
        diameterMm: 8.4,
        shape: 'tapered',
        balance: 'rear',
        gripIntensity: 5,
        tungstenPct: 80,
        priceUsd: 20,
        sourceUrl: 'https://example.com/brick',
      })
      .expect(201);
    await runDueJobs(jobDeps());
    expect((await outbox(email)).filter((m) => m.kind === 'alert')).toHaveLength(1);
  });

  it('one-click unsubscribe stops further alerts', async () => {
    const link = (await outbox(email))
      .find((m) => m.kind === 'alert')!
      .body_text.match(/(\/api\/unsubscribe\?\S+)/)![1]!;
    await request(app).get(link).expect(200);
    await admin
      .post('/api/admin/variants')
      .send({
        id: 'test-launch2-22',
        modelId: 'test-launch2',
        brand: 'Otherbrand',
        model: 'Launch Two',
        tip: 'steel',
        weightG: 22,
        lengthMm: 48.5,
        diameterMm: 6.8,
        shape: 'straight',
        balance: 'centre',
        gripIntensity: 3,
        tungstenPct: 90,
        priceUsd: 70,
        sourceUrl: 'https://example.com/launch2',
      })
      .expect(201);
    await runDueJobs(jobDeps());
    expect((await outbox(email)).filter((m) => m.kind === 'alert')).toHaveLength(1);
    await request(app)
      .get(link.replace(/s=[^&]+/, 's=forged'))
      .expect(400);
  });

  it('a click-out by an opted-in user schedules the two-week feedback email', async () => {
    await user.get(`/go/search%3Abol%3Atarget-littler-g1-22?fit=${fitId}`).expect(302);
    const jobs = await db.query<{ run_at: Date }>(`SELECT run_at FROM jobs WHERE kind='feedback_email'`);
    expect(jobs).toHaveLength(1);
    expect(new Date(jobs[0]!.run_at).getTime() - Date.now()).toBeGreaterThan(13 * 864e5);
    // Run it as if two weeks had passed, then submit feedback through the signed link.
    await runDueJobs({ ...jobDeps(), now: () => new Date(Date.now() + 15 * 864e5) });
    const mail = (await outbox(email)).find((m) => m.kind === 'feedback')!;
    const q = new URLSearchParams(mail.body_text.match(/feedback\?(\S+)/)![1]!);
    await request(app)
      .post('/api/feedback')
      .send({ u: q.get('u'), x: q.get('x'), s: q.get('s'), bought: true, weightG: 22, feel: 'right' })
      .expect(200);
    await request(app)
      .post('/api/feedback')
      .send({ u: q.get('u'), x: q.get('x'), s: 'forged', bought: true })
      .expect(400);
  });

  it('admin stats show fits, clicks and feedback', async () => {
    const s = await admin.get('/api/admin/stats').expect(200);
    expect(s.body.fits).toBeGreaterThan(3);
    expect(s.body.clicks).toBeGreaterThan(0);
    expect(s.body.feelByWeight).toEqual([{ weight_g: 22, feel: 'right', n: 1 }]);
  });

  it('GDPR export contains the fit and consents; delete erases the account', async () => {
    const ex = await user.get('/api/me/export').expect(200);
    expect(ex.body.fits).toHaveLength(1);
    expect(ex.body.consents.length).toBeGreaterThan(0);
    await user.delete('/api/me').expect(200);
    expect(await db.query('SELECT 1 FROM users WHERE email=$1', [email])).toHaveLength(0);
    expect(await db.query('SELECT 1 FROM fits WHERE id=$1', [fitId])).toHaveLength(0);
  });
});

describe('housekeeping jobs', () => {
  it('the nightly link check hides dead offers', async () => {
    await scheduleDaily(db, new Date(Date.now() - 864e5 * 2));
    await db.query(`UPDATE jobs SET run_at = now() - interval '1 minute' WHERE kind='link_check'`);
    await runDueJobs(jobDeps());
    const dead = await db.query<{ id: string }>('SELECT id FROM offers WHERE NOT live');
    expect(dead.map((d) => d.id)).toEqual(['azdarts:rd-javelin-21']);
    const fit = await request(app).post('/api/fit').send({ answers }).expect(200);
    for (const p of fit.body.recommendation.picks) {
      expect(p.offers.map((o: { id: string }) => o.id)).not.toContain('azdarts:rd-javelin-21');
    }
  });

  it('scheduling daily jobs is idempotent', async () => {
    const before = (await db.query('SELECT 1 FROM jobs')).length;
    await scheduleDaily(db);
    await scheduleDaily(db);
    const after = (await db.query('SELECT 1 FROM jobs')).length;
    expect(after - before).toBeLessThanOrEqual(2);
  });
});

describe('push', () => {
  it('subscribing requires sign-in', async () => {
    await request(app)
      .post('/api/push/subscribe')
      .send({ endpoint: 'https://push.example/x', keys: { p256dh: 'p'.repeat(20), auth: 'a'.repeat(10) } })
      .expect(401);
    expect(pushes).toEqual([]);
  });
});

describe('cron (Vercel)', () => {
  it('runs jobs only with the right secret, and does not exist without one', async () => {
    let runs = 0;
    const runJobs = async () => {
      runs++;
    };
    const cronEnv = loadEnv({ NODE_ENV: 'test', CRON_SECRET: 'a-long-enough-cron-secret' });
    const cronApp = createApp({
      db,
      env: cronEnv,
      mailer: createMailer(db, cronEnv),
      explainClient: null,
      runJobs,
    });
    await request(cronApp).get('/api/cron/jobs').expect(404);
    await request(cronApp).get('/api/cron/jobs').set('authorization', 'Bearer wrong').expect(404);
    await request(cronApp)
      .get('/api/cron/jobs')
      .set('authorization', 'Bearer a-long-enough-cron-secret')
      .expect(200);
    expect(runs).toBe(1);
    await request(app)
      .get('/api/cron/jobs')
      .set('authorization', 'Bearer a-long-enough-cron-secret')
      .expect(404);
  });
});

describe('anonymous hand samples', () => {
  it('every fit adds one anonymous row: rounded numbers, month only, no ids', async () => {
    const before = Number(
      (await db.query<{ n: number }>('SELECT count(*)::int AS n FROM hand_samples'))[0]!.n,
    );
    await request(app)
      .post('/api/fit')
      .send({
        measurements: { ...measurements, handLengthMm: 186.4 },
        answers: { ...answers, heightCm: 182.6 },
        lang: 'nl',
      })
      .expect(200);
    const rows = await db.query<Record<string, unknown>>(
      'SELECT * FROM hand_samples ORDER BY id DESC LIMIT 1',
    );
    const after = Number(
      (await db.query<{ n: number }>('SELECT count(*)::int AS n FROM hand_samples'))[0]!.n,
    );
    expect(after).toBe(before + 1);
    const s = rows[0]!;
    expect(s.hand_length_mm).toBe(186);
    expect(s.height_cm).toBe(183);
    expect(s.month).toMatch(/^\d{4}-\d{2}$/);
    expect(s.source).toBe('scan');
    expect(Object.keys(s)).not.toContain('user_id');
    expect(Object.keys(s)).not.toContain('fit_id');
    expect(Object.keys(s)).not.toContain('created_at');
  });

  it('the CSV export is for admins only', async () => {
    await request(app).get('/api/admin/hand-samples.csv').expect(401);
    const admin = request.agent(app);
    await signIn(admin, 'admin@example.com');
    const r = await admin.get('/api/admin/hand-samples.csv').expect(200);
    expect(r.headers['content-type']).toMatch(/text\/csv/);
    const [head, first] = r.text.split('\n');
    expect(head).toContain('hand_length_mm');
    expect(head).not.toContain('user');
    expect(first!.split(',').length).toBe(head!.split(',').length);
  });
});
