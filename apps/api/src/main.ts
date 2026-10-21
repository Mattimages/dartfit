import { createApp } from './app.js';
import { syncCatalogue } from './catalogue.js';
import { migrate, openDb } from './db.js';
import { loadEnv } from './env.js';
import { anthropicClient } from './explain.js';
import { runDueJobs, scheduleDaily, webPusher } from './jobs.js';
import { createMailer } from './mail.js';

const env = loadEnv();
const db = await openDb({ url: env.DATABASE_URL, pgliteDir: env.PGLITE_DIR ?? '.data/pglite' });
const applied = await migrate(db);
if (applied.length) console.log(`migrations applied: ${applied.join(', ')}`);
console.log(`catalogue synced: ${await syncCatalogue(db)} variants`);

const mailer = createMailer(db, env);
const explainClient = env.ANTHROPIC_API_KEY
  ? await anthropicClient(env.ANTHROPIC_API_KEY, env.EXPLAIN_MODEL)
  : null;
if (!explainClient) console.log('ANTHROPIC_API_KEY not set: explanations use the grounded template.');

const app = createApp({ db, env, mailer, explainClient });
const server = app.listen(env.PORT, () =>
  console.log(`DartFit on ${env.PUBLIC_URL} (port ${env.PORT}, db ${db.kind})`),
);

// In-process worker: fine for one instance. Run `npm run worker -w apps/api` separately when scaling out.
if (env.RUN_WORKER) {
  const pusher = await webPusher(env);
  const deps = {
    db,
    env,
    mailer,
    pusher,
    fetchStatus: async (url: string) =>
      (await fetch(url, { method: 'HEAD', redirect: 'follow', signal: AbortSignal.timeout(10_000) })).status,
  };
  const tick = async () => {
    try {
      await scheduleDaily(db);
      await runDueJobs(deps);
    } catch (e) {
      console.error('worker tick failed', e);
    }
  };
  setInterval(tick, 30_000).unref();
  void tick();
}

const shutdown = () => server.close(() => db.close().then(() => process.exit(0)));
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
