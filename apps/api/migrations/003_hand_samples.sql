-- Anonymous hand measurements, kept to calibrate and improve the fitting. No account, no fit id,
-- no exact time (month only), no image: a row cannot be traced back to a person or a session.
-- Not touched by the 90-day retention job.
CREATE TABLE IF NOT EXISTS hand_samples (
  id                 bigserial PRIMARY KEY,
  month              text NOT NULL,
  country            text,
  engine_version     text NOT NULL,
  source             text NOT NULL CHECK (source IN ('scan','manual','height','none')),
  hand_length_mm     smallint,
  palm_width_mm      smallint,
  index_length_mm    smallint,
  middle_length_mm   smallint,
  thumb_index_span_mm smallint,
  height_cm          smallint,
  forearm_cm         smallint,
  answers            jsonb NOT NULL,
  ideal_weight_g     real,
  ideal_length_mm    real,
  ideal_diameter_mm  real,
  best_variant_id    text
);
CREATE INDEX IF NOT EXISTS hand_samples_month ON hand_samples(month);
