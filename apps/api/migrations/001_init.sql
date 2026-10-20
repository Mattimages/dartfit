-- DartFit v2 schema. Postgres (managed, EU region) in production; PGlite in dev and tests.

CREATE TABLE IF NOT EXISTS dart_models (
  id          text PRIMARY KEY,
  brand       text NOT NULL,
  name        text NOT NULL,
  tip         text NOT NULL CHECK (tip IN ('steel','soft')),
  shape       text CHECK (shape IN ('straight','torpedo','tapered')),
  balance     text CHECK (balance IN ('front','centre','rear')),
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS dart_variants (
  id            text PRIMARY KEY,
  model_id      text NOT NULL REFERENCES dart_models(id) ON DELETE CASCADE,
  weight_g      numeric NOT NULL,
  length_mm     numeric NOT NULL,
  diameter_mm   numeric NOT NULL,
  grip          numeric,
  tungsten_pct  numeric NOT NULL,
  price_usd     numeric,
  source_url    text NOT NULL,
  verified_at   date NOT NULL,
  origin        text NOT NULL DEFAULT 'catalogue' CHECK (origin IN ('catalogue','admin')),
  active        boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS offers (
  id            text PRIMARY KEY,
  variant_id    text NOT NULL REFERENCES dart_variants(id) ON DELETE CASCADE,
  retailer      text NOT NULL,
  country       text NOT NULL,           -- ISO-3166 alpha-2, or '*' for ships-everywhere listings
  url           text NOT NULL,
  price         numeric,
  currency      text,
  live          boolean NOT NULL DEFAULT true,
  last_checked  timestamptz,
  last_status   integer
);
CREATE INDEX IF NOT EXISTS offers_variant ON offers(variant_id);

CREATE TABLE IF NOT EXISTS users (
  id              uuid PRIMARY KEY,
  email           text NOT NULL UNIQUE,
  lang            text NOT NULL DEFAULT 'nl',
  alerts_email    boolean NOT NULL DEFAULT false,
  alerts_push     boolean NOT NULL DEFAULT false,
  feedback_email  boolean NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now(),
  last_seen_at    timestamptz NOT NULL DEFAULT now()
);

-- Append-only consent log: what the person agreed to, when, and which wording they saw.
CREATE TABLE IF NOT EXISTS consents (
  id               bigserial PRIMARY KEY,
  user_id          uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind             text NOT NULL,
  granted          boolean NOT NULL,
  wording_version  text NOT NULL,
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS login_tokens (
  token_hash  text PRIMARY KEY,
  email       text NOT NULL,
  payload     jsonb NOT NULL DEFAULT '{}',
  expires_at  timestamptz NOT NULL,
  used_at     timestamptz
);

CREATE TABLE IF NOT EXISTS sessions (
  id_hash     text PRIMARY KEY,
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at  timestamptz NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Only numbers and answers are stored: no images, ever.
CREATE TABLE IF NOT EXISTS fits (
  id               uuid PRIMARY KEY,
  user_id          uuid REFERENCES users(id) ON DELETE CASCADE,
  engine_version   text NOT NULL,
  measurements     jsonb,
  answers          jsonb NOT NULL,
  result           jsonb NOT NULL,
  best_variant_id  text,
  country          text,
  lang             text NOT NULL DEFAULT 'nl',
  created_at       timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS fits_user ON fits(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS explanations (
  fit_id      uuid NOT NULL REFERENCES fits(id) ON DELETE CASCADE,
  variant_id  text NOT NULL,
  lang        text NOT NULL,
  text        text NOT NULL,
  source      text NOT NULL CHECK (source IN ('ai','template')),
  created_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (fit_id, variant_id, lang)
);

CREATE TABLE IF NOT EXISTS clicks (
  id          bigserial PRIMARY KEY,
  fit_id      uuid REFERENCES fits(id) ON DELETE SET NULL,
  user_id     uuid REFERENCES users(id) ON DELETE SET NULL,
  offer_id    text NOT NULL,
  variant_id  text NOT NULL,
  retailer    text NOT NULL,
  country     text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS feedback (
  id          bigserial PRIMARY KEY,
  user_id     uuid REFERENCES users(id) ON DELETE CASCADE,
  fit_id      uuid REFERENCES fits(id) ON DELETE SET NULL,
  variant_id  text,
  bought      boolean,
  weight_g    numeric,
  feel        text CHECK (feel IN ('too_light','right','too_heavy')),
  engine_version text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS push_subscriptions (
  endpoint    text PRIMARY KEY,
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  p256dh      text NOT NULL,
  auth        text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- One alert per user per variant, enforced by the database.
CREATE TABLE IF NOT EXISTS alert_sends (
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  variant_id  text NOT NULL REFERENCES dart_variants(id) ON DELETE CASCADE,
  channel     text NOT NULL,
  sent_at     timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, variant_id)
);

CREATE TABLE IF NOT EXISTS jobs (
  id          bigserial PRIMARY KEY,
  kind        text NOT NULL,
  payload     jsonb NOT NULL DEFAULT '{}',
  run_at      timestamptz NOT NULL DEFAULT now(),
  status      text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','running','done','failed')),
  attempts    integer NOT NULL DEFAULT 0,
  last_error  text,
  dedupe_key  text UNIQUE,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS jobs_ready ON jobs(status, run_at);

-- Every email that leaves the system, for audit and for dev without SMTP.
CREATE TABLE IF NOT EXISTS outbox (
  id          bigserial PRIMARY KEY,
  to_email    text NOT NULL,
  subject     text NOT NULL,
  kind        text NOT NULL,
  body_text   text NOT NULL,
  sent        boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS schema_migrations (
  name        text PRIMARY KEY,
  applied_at  timestamptz NOT NULL DEFAULT now()
);
