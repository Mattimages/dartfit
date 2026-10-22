import { z } from 'zod';

const bool = z.union([z.boolean(), z.string()]).transform((v) => v === true || v === 'true' || v === '1');

export const EnvSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().default(3000),
    PUBLIC_URL: z.string().url().default('http://localhost:3000'),
    /** Postgres URL in production. When empty, an embedded PGlite database is used (dev/test). */
    DATABASE_URL: z.string().optional(),
    PGLITE_DIR: z.string().optional(),
    SESSION_SECRET: z.string().min(32).default('dev-only-secret-change-me-0123456789abcdef'),
    ADMIN_EMAILS: z.string().default(''),
    ANTHROPIC_API_KEY: z.string().optional(),
    EXPLAIN_MODEL: z.string().default('claude-haiku-5-5'),
    SMTP_URL: z.string().optional(),
    MAIL_FROM: z.string().default('DartFit <noreply@example.com>'),
    VAPID_PUBLIC_KEY: z.string().optional(),
    VAPID_PRIVATE_KEY: z.string().optional(),
    VAPID_SUBJECT: z.string().default('mailto:admin@example.com'),
    BOL_PARTNER_SITE_ID: z.string().optional(),
    AMAZON_TAG_NL: z.string().optional(),
    AMAZON_TAG_DE: z.string().optional(),
    AMAZON_TAG_UK: z.string().optional(),
    DEFAULT_COUNTRY: z.string().length(2).default('NL'),
    RUN_WORKER: bool.default(true),
    TRUST_PROXY: bool.default(false),
    /** Show every product photo in photos.csv, also those not from an affiliate feed (default on). */
    PREVIEW_PHOTOS: bool.default(true),
    /** Set on Vercel: Vercel Cron sends it as a bearer token to /api/cron/jobs. */
    CRON_SECRET: z.string().min(16).optional(),
    /** Legal name, KvK number and address shown in emails and the footer. */
    COMPANY_LINE: z.string().default('DartFit · KvK-nummer volgt · contact@example.com'),
    // Affiliate IDs for the other shops (AMAZON_TAG_FR, EBAY_CAMPAIGN_ID, DARTSCORNER_DEEPLINK, …)
    // are read by name from packages/catalogue/data/retailers.json, so the schema lets them through.
  })
  .passthrough();

export type Env = z.infer<typeof EnvSchema>;

export function loadEnv(source: Record<string, string | undefined> = process.env): Env {
  const env = EnvSchema.parse(source);
  if (env.NODE_ENV === 'production') {
    if (env.SESSION_SECRET.startsWith('dev-only'))
      throw new Error('SESSION_SECRET must be set in production');
    if (!env.DATABASE_URL) throw new Error('DATABASE_URL must be set in production');
    if (!env.PUBLIC_URL.startsWith('https://')) throw new Error('PUBLIC_URL must be https in production');
  }
  return env;
}

export const adminEmails = (env: Env) =>
  new Set(
    env.ADMIN_EMAILS.split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean),
  );
