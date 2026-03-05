'use strict';
// ═══════════════════════════════════════════════════════════════
//  DARTFIT — DART DATA SCHEMA + VALIDATOR
//  Every dart entering the catalog must pass validate(dart).
//  Returns { ok: true } or { ok: false, errors: string[] }
// ═══════════════════════════════════════════════════════════════

const VALID_GRIPS    = ['smooth','micro_grip','fine_knurl','medium_knurl','aggressive_knurl','shark_cut','ringed'];
const VALID_SHAPES   = ['straight','torpedo','teardrop','bomb','bullet','shark'];
const VALID_BALANCE  = ['front','middle','rear'];
const VALID_SURFACES = ['natural','pvd_coated','dimpled','titanium_coated','gold_plated'];

// Realistic human-verified ranges for competition darts
const RANGES = {
  weight:       [12, 50],   // grams
  length_mm:    [30, 80],   // barrel only
  diameter_mm:  [4.5, 12],  // barrel
  tungsten_pct: [70, 99],   // % tungsten content
  price_gbp:    [5, 250],   // retail GBP
};

/**
 * Validate a raw dart object against the catalog schema.
 * @param {object} dart
 * @returns {{ ok: boolean, errors: string[], warnings: string[] }}
 */
function validate(dart) {
  const errors = [];
  const warnings = [];

  // Required strings
  for (const f of ['brand','name']) {
    if (!dart[f] || typeof dart[f] !== 'string' || !dart[f].trim())
      errors.push(`Missing required string: ${f}`);
  }

  // Required numbers in range
  for (const [f, [lo, hi]] of Object.entries(RANGES)) {
    const v = parseFloat(dart[f]);
    if (isNaN(v))           errors.push(`${f} is required and must be a number`);
    else if (v < lo || v > hi) errors.push(`${f} out of range: ${v} (expected ${lo}–${hi})`);
  }

  // Controlled vocabularies
  if (!VALID_GRIPS.includes(dart.grip_type))
    errors.push(`grip_type "${dart.grip_type}" not in [${VALID_GRIPS.join(', ')}]`);
  if (!VALID_SHAPES.includes(dart.barrel_shape))
    errors.push(`barrel_shape "${dart.barrel_shape}" not in [${VALID_SHAPES.join(', ')}]`);
  if (!VALID_BALANCE.includes(dart.balance_point))
    errors.push(`balance_point "${dart.balance_point}" not in [${VALID_BALANCE.join(', ')}]`);
  if (dart.surface && !VALID_SURFACES.includes(dart.surface))
    warnings.push(`surface "${dart.surface}" not in known list — will be stored as-is`);

  // buy_url — warn if missing or not a URL
  if (!dart.buy_url) warnings.push('buy_url is missing');
  else if (!dart.buy_url.startsWith('http')) errors.push(`buy_url must start with http(s)`);

  // Soft warnings for data quality
  if (dart.description && dart.description.length < 20)
    warnings.push('description is very short — consider expanding');
  if (!dart.tags) warnings.push('tags field missing — search/filter will be degraded');

  return { ok: errors.length === 0, errors, warnings };
}

/**
 * Normalise a raw scraped/imported dart to match catalog conventions.
 * Fills in sensible defaults where possible.
 */
function normalise(raw) {
  return {
    brand:         (raw.brand || '').trim(),
    name:          (raw.name  || '').trim(),
    weight:        parseFloat(raw.weight),
    length_mm:     parseFloat(raw.length_mm || raw.length),
    diameter_mm:   parseFloat(raw.diameter_mm || raw.diameter),
    grip_type:     (raw.grip_type || 'medium_knurl').toLowerCase().replace(/\s+/g,'_'),
    barrel_shape:  (raw.barrel_shape || raw.shape || 'straight').toLowerCase(),
    balance_point: (raw.balance_point || raw.balance || 'middle').toLowerCase(),
    tungsten_pct:  parseFloat(raw.tungsten_pct || raw.tungsten || 90),
    surface:       (raw.surface || 'natural').toLowerCase(),
    price_gbp:     parseFloat(raw.price_gbp || raw.price),
    buy_url:       (raw.buy_url || raw.url || '').trim(),
    pro_player:    raw.pro_player || null,
    tags:          raw.tags || '',
    description:   (raw.description || '').trim(),
    released:      raw.released || new Date().toISOString().slice(0,10),
    // Provenance metadata (stripped before DB insert)
    _source:       raw._source || 'manual',
    _scraped_at:   raw._scraped_at || new Date().toISOString(),
    _confidence:   raw._confidence || 'medium',  // low | medium | high
  };
}

module.exports = { validate, normalise, VALID_GRIPS, VALID_SHAPES, VALID_BALANCE, VALID_SURFACES, RANGES };
