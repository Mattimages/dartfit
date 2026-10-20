import { readdirSync, readFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export interface Db {
  query<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<T[]>;
  exec(sql: string): Promise<void>;
  close(): Promise<void>;
  kind: 'pg' | 'pglite';
}

/** Postgres in production (DATABASE_URL), embedded PGlite in dev/test. Same SQL either way. */
export async function openDb(opts: { url?: string; pgliteDir?: string }): Promise<Db> {
  if (opts.url) {
    const pg = await import('pg');
    const pool = new pg.default.Pool({ connectionString: opts.url, max: 10 });
    // numeric → number (all our numerics are small specs and prices)
    pg.default.types.setTypeParser(1700, (v: string) => Number(v));
    pg.default.types.setTypeParser(20, (v: string) => Number(v));
    return {
      kind: 'pg',
      async query(sql, params) {
        return (await pool.query(sql, params as unknown[])).rows;
      },
      async exec(sql) {
        await pool.query(sql);
      },
      close: () => pool.end(),
    };
  }
  const { PGlite, types } = await import('@electric-sql/pglite');
  if (opts.pgliteDir) mkdirSync(opts.pgliteDir, { recursive: true });
  const db = new PGlite(opts.pgliteDir, {
    parsers: { [types.NUMERIC]: (v: string) => Number(v), [types.INT8]: (v: string) => Number(v) },
  });
  await db.waitReady;
  return {
    kind: 'pglite',
    async query(sql, params) {
      return (await db.query(sql, params as unknown[])).rows as never;
    },
    async exec(sql) {
      await db.exec(sql);
    },
    close: () => db.close(),
  };
}

const MIGRATIONS = join(dirname(fileURLToPath(import.meta.url)), '..', 'migrations');

export async function migrate(db: Db): Promise<string[]> {
  await db.exec(
    'CREATE TABLE IF NOT EXISTS schema_migrations (name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())',
  );
  const done = new Set((await db.query<{ name: string }>('SELECT name FROM schema_migrations')).map((r) => r.name));
  const applied: string[] = [];
  for (const file of readdirSync(MIGRATIONS).filter((f) => f.endsWith('.sql')).sort()) {
    if (done.has(file)) continue;
    await db.exec(readFileSync(join(MIGRATIONS, file), 'utf8'));
    await db.query('INSERT INTO schema_migrations(name) VALUES ($1) ON CONFLICT DO NOTHING', [file]);
    applied.push(file);
  }
  return applied;
}
