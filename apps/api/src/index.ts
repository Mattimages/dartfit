/**
 * Vercel entry: the API as a function. Vercel's Express support takes the default export; there is
 * no port to open and no in-process worker. Background jobs (link checks, retention, price alerts)
 * run when Vercel Cron calls /api/cron/jobs (see vercel.json). `src/main.ts` stays the entry for
 * Docker and local development.
 */
import { createApp } from './app.js';
import { syncCatalogue } from './catalogue.js';
import { migrate, openDb } from './db.js';
import { loadEnv } from './env.js';
import { anthropicClient } from './explain.js';
import { runDueJobs, scheduleDaily, webPusher } from './jobs.js';
import { createMailer } from './mail.js';

const env = loadEnv();
// Production requires DATABASE_URL (loadEnv enforces it); /tmp is the only writable place otherwise.
const db = await openDb({ url: env.DATABASE_URL, pgliteDir: env.PGLITE_DIR ?? '/tmp/pglite' });
await migrate(db);
await syncCatalogue(db);

const mailer = createMailer(db, env);
const explainClient = env.ANTHROPIC_API_KEY
  ? await anthropicClient(env.ANTHROPIC_API_KEY, env.EXPLAIN_MODEL)
  : null;

async function runJobs() {
  await scheduleDaily(db);
  await runDueJobs({
    db,
    env,
    mailer,
    pusher: await webPusher(env),
    fetchStatus: async (url: string) =>
      (await fetch(url, { method: 'HEAD', redirect: 'follow', signal: AbortSignal.timeout(10_000) })).status,
  });
}

export default createApp({ db, env, mailer, explainClient, runJobs });
