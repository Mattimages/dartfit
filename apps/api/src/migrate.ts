import { syncCatalogue } from './catalogue.js';
import { migrate, openDb } from './db.js';
import { loadEnv } from './env.js';

const env = loadEnv();
const db = await openDb({ url: env.DATABASE_URL, pgliteDir: env.PGLITE_DIR ?? '.data/pglite' });
const applied = await migrate(db);
console.log(applied.length ? `applied: ${applied.join(', ')}` : 'schema up to date');
console.log(`catalogue synced: ${await syncCatalogue(db)} variants`);
await db.close();
