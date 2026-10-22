/** Standalone job worker for when the API runs on more than one instance (set RUN_WORKER=false there). */
import { openDb } from './db.js';
import { loadEnv } from './env.js';
import { runDueJobs, scheduleDaily, webPusher } from './jobs.js';
import { createMailer } from './mail.js';

const env = loadEnv();
const db = await openDb({ url: env.DATABASE_URL, pgliteDir: env.PGLITE_DIR ?? '.data/pglite' });
const deps = {
  db,
  env,
  mailer: createMailer(db, env),
  pusher: await webPusher(env),
  fetchStatus: async (url: string) =>
    (await fetch(url, { method: 'HEAD', redirect: 'follow', signal: AbortSignal.timeout(10_000) })).status,
};
for (;;) {
  await scheduleDaily(db);
  const n = await runDueJobs(deps);
  if (n) console.log(`ran ${n} jobs`);
  await new Promise((r) => setTimeout(r, 15_000));
}
