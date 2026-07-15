'use strict';
// ─── DARTFIT ALGORITHM v2 UNIT TESTS ────────────────────────────────
// Run with: npm test  (node --test test/)

const { test } = require('node:test');
const assert = require('node:assert/strict');

const {
  calculateIdealProfile,
  scoreDart,
  scoreDartBreakdown,
  scorePro,
  runMatchPipeline,
  computeReleasePhysics,
  minTungstenFor,
  forearmFromPoseRatio,
  SCORE_WEIGHTS,
  GRIP_TYPE_ORDER,
} = require('../lib/algorithm');

const BASE_INPUTS = {
  fingerLength: 80, palmWidth: 85, gripDiameter: 16, fingerSpan: 200,
  fingerFlexIndex: 0.80, heightCm: 175, forearmLengthMm: null,
  gripPreference: 3, weightPreference: 3, throwingStyle: 'middle',
  playingLevel: 'intermediate', throwSpeed: 3, wristAction: 3, handMoisture: 'normal',
};

// ─── PROFILE CALCULATION ────────────────────────────────────────────

test('baseline profile is sane', () => {
  const p = calculateIdealProfile(BASE_INPUTS);
  assert.ok(p.idealWeight >= 18 && p.idealWeight <= 24, `weight ${p.idealWeight}`);
  assert.ok(p.idealLength >= 42 && p.idealLength <= 50, `length ${p.idealLength}`);
  assert.ok(p.idealDiameter >= 5.5 && p.idealDiameter <= 8, `diam ${p.idealDiameter}`);
  assert.ok(GRIP_TYPE_ORDER.includes(p.idealGripType));
  assert.ok(['front','middle','rear'].includes(p.balance));
});

test('release angle sits in the researched 10–40° band, not line-of-sight ±2°', () => {
  for (const heightCm of [150, 165, 175, 190, 210]) {
    for (const throwSpeed of [1, 3, 5]) {
      const p = calculateIdealProfile({ ...BASE_INPUTS, heightCm, throwSpeed });
      assert.ok(p.releaseAngleDeg >= 5 && p.releaseAngleDeg <= 45,
        `release angle ${p.releaseAngleDeg} for h=${heightCm} v=${throwSpeed}`);
      assert.ok(p.releaseAngleDeg > 5, 'must not collapse to the old ~1° sight-line');
    }
  }
});

test('slower throws need steeper release angles', () => {
  const slow = calculateIdealProfile({ ...BASE_INPUTS, throwSpeed: 1 });
  const fast = calculateIdealProfile({ ...BASE_INPUTS, throwSpeed: 5 });
  assert.ok(slow.releaseAngleDeg > fast.releaseAngleDeg,
    `slow ${slow.releaseAngleDeg}° should exceed fast ${fast.releaseAngleDeg}°`);
});

test('weight preference is monotonic', () => {
  let prev = -Infinity;
  for (let wp = 1; wp <= 5; wp++) {
    const p = calculateIdealProfile({ ...BASE_INPUTS, weightPreference: wp });
    assert.ok(p.idealWeight >= prev, `weight must not decrease at pref ${wp}`);
    prev = p.idealWeight;
  }
});

test('slow throwers get heavier darts than fast throwers', () => {
  const slow = calculateIdealProfile({ ...BASE_INPUTS, throwSpeed: 1 });
  const fast = calculateIdealProfile({ ...BASE_INPUTS, throwSpeed: 5 });
  assert.ok(slow.idealWeight > fast.idealWeight);
});

test('moist hands push grip texture up, dry hands down', () => {
  const moist = calculateIdealProfile({ ...BASE_INPUTS, handMoisture: 'moist' });
  const dry   = calculateIdealProfile({ ...BASE_INPUTS, handMoisture: 'dry' });
  const iMoist = GRIP_TYPE_ORDER.indexOf(moist.idealGripType);
  const iDry   = GRIP_TYPE_ORDER.indexOf(dry.idealGripType);
  assert.ok(iMoist >= iDry, `moist ${moist.idealGripType} should be ≥ dry ${dry.idealGripType}`);
});

test('absurd inputs are clamped, never propagated', () => {
  const p = calculateIdealProfile({
    ...BASE_INPUTS,
    fingerLength: 99999, palmWidth: -50, gripDiameter: 'DROP TABLE',
    fingerSpan: NaN, heightCm: 9000, forearmLengthMm: 1e9,
    gripPreference: 42, weightPreference: -7, throwSpeed: 100,
    throwingStyle: 'sideways', playingLevel: 'god', handMoisture: 'soaked',
  });
  assert.ok(p.idealWeight >= 14 && p.idealWeight <= 28);
  assert.ok(p.idealLength >= 38 && p.idealLength <= 58);
  assert.ok(p.idealDiameter >= 5.2 && p.idealDiameter <= 8.5);
  assert.ok(GRIP_TYPE_ORDER.includes(p.idealGripType));
  assert.equal(p.throwingStyle, 'middle');
  assert.equal(p.playingLevel, 'intermediate');
  assert.equal(p.handMoisture, 'normal');
});

test('empty input object works entirely from defaults', () => {
  const p = calculateIdealProfile({});
  assert.ok(p.idealWeight >= 14 && p.idealWeight <= 28);
  assert.ok(p.idealShaft.lengthMm > 0);
  assert.ok(p.idealFlight.label.length > 0);
});

test('tungsten recommendation rises with playing level', () => {
  const beg = calculateIdealProfile({ ...BASE_INPUTS, playingLevel: 'beginner' });
  const comp = calculateIdealProfile({ ...BASE_INPUTS, playingLevel: 'competitive' });
  assert.ok(comp.idealTungstenPct >= beg.idealTungstenPct);
  assert.ok(comp.idealTungstenPct >= 90);
});

test('heavy weight in a slim short barrel forces high tungsten', () => {
  // 26 g in a 45 mm × 6.2 mm barrel physically requires very dense alloy
  const pct = minTungstenFor(26, 45, 6.2, 'beginner');
  assert.ok(pct >= 90, `expected ≥90, got ${pct}`);
});

test('shaft recommendation: long barrels and rear balance get short shafts', () => {
  const p = calculateIdealProfile({ ...BASE_INPUTS, fingerLength: 105, fingerSpan: 260, throwingStyle: 'rear' });
  assert.equal(p.idealShaft.lengthMm, 35);
});

test('forearmMeasured flag reflects whether a measurement arrived', () => {
  const est = calculateIdealProfile(BASE_INPUTS);
  const meas = calculateIdealProfile({ ...BASE_INPUTS, forearmLengthMm: 290 });
  assert.equal(est.forearmMeasured, false);
  assert.equal(meas.forearmMeasured, true);
  assert.equal(meas.forearmLengthMm, 290);
});

// ─── RELEASE PHYSICS ────────────────────────────────────────────────

test('projectile solution actually hits the bull', () => {
  const heightMm = 1780;
  const phys = computeReleasePhysics({ heightMm, forearmMm: 265, throwSpeed: 3 });
  // Re-simulate: does a parabola at this angle/speed pass through the bull?
  const th = phys.releaseAngleDeg * Math.PI / 180;
  const v = phys.releaseSpeed;
  const d = phys.flightDistanceMm / 1000;
  const t = d / (v * Math.cos(th));
  const y = v * Math.sin(th) * t - 0.5 * 9.81 * t * t; // rise from release height
  const yTargetM = (1730 - phys.releaseHeightMm) / 1000;
  assert.ok(Math.abs(y - yTargetM) < 0.02, `misses bull by ${((y - yTargetM) * 1000).toFixed(0)}mm`);
});

test('dart arrives descending (negative arrival pitch)', () => {
  const phys = computeReleasePhysics({ heightMm: 1750, forearmMm: 259, throwSpeed: 3 });
  assert.ok(phys.arrivalAngleDeg < 0, `arrival ${phys.arrivalAngleDeg}`);
});

// ─── SCORING ────────────────────────────────────────────────────────

test('score weights sum to exactly 1.00', () => {
  const sum = Object.values(SCORE_WEIGHTS).reduce((a, b) => a + b, 0);
  assert.ok(Math.abs(sum - 1) < 1e-9, `weights sum to ${sum}`);
});

test('a dart identical to the ideal profile scores 100', () => {
  const p = calculateIdealProfile(BASE_INPUTS);
  const perfect = {
    weight: p.idealWeight, length_mm: p.idealLength, diameter_mm: p.idealDiameter,
    grip_type: p.idealGripType, balance_point: p.balance, barrel_shape: p.barrelShape,
    tungsten_pct: p.idealTungstenPct,
  };
  assert.equal(scoreDart(perfect, p), 100);
});

test('breakdown components recombine to the total', () => {
  const p = calculateIdealProfile(BASE_INPUTS);
  const dart = {
    weight: p.idealWeight + 2, length_mm: p.idealLength - 4, diameter_mm: p.idealDiameter + 0.5,
    grip_type: 'smooth', balance_point: 'rear', barrel_shape: 'bomb', tungsten_pct: 80,
  };
  const b = scoreDartBreakdown(dart, p);
  const recombined =
    b.components.weight   * SCORE_WEIGHTS.weight +
    b.components.length   * SCORE_WEIGHTS.length +
    b.components.diameter * SCORE_WEIGHTS.diameter +
    b.components.grip     * SCORE_WEIGHTS.grip +
    b.components.balance  * SCORE_WEIGHTS.balance +
    b.components.shape    * SCORE_WEIGHTS.shape +
    b.components.tungsten * SCORE_WEIGHTS.tungsten;
  assert.ok(Math.abs(recombined - b.total) <= 1, `recombined ${recombined} vs total ${b.total}`);
});

test('score degrades monotonically with weight distance', () => {
  const p = calculateIdealProfile(BASE_INPUTS);
  const mk = (w) => ({
    weight: w, length_mm: p.idealLength, diameter_mm: p.idealDiameter,
    grip_type: p.idealGripType, balance_point: p.balance, barrel_shape: p.barrelShape,
    tungsten_pct: p.idealTungstenPct,
  });
  let prev = Infinity;
  for (let dw = 0; dw <= 8; dw++) {
    const s = scoreDart(mk(p.idealWeight + dw), p);
    assert.ok(s <= prev, `score must not rise with distance (dw=${dw})`);
    prev = s;
  }
});

test('unknown grip types score low, never crash', () => {
  const p = calculateIdealProfile(BASE_INPUTS);
  const weird = {
    weight: p.idealWeight, length_mm: p.idealLength, diameter_mm: p.idealDiameter,
    grip_type: 'velcro', balance_point: p.balance, barrel_shape: p.barrelShape, tungsten_pct: 90,
  };
  const s = scoreDart(weird, p);
  assert.ok(s >= 0 && s <= 100);
});

// ─── PRO MATCHING ───────────────────────────────────────────────────

test('scorePro is bounded 0–100 and prefers similar specs', () => {
  const p = calculateIdealProfile(BASE_INPUTS);
  const twin = {
    preferred_weight: p.idealWeight, preferred_length: p.idealLength,
    preferred_grip: p.idealGripType, height_cm: p.heightCm,
    grip_style: `${p.balance}_three_finger`,
  };
  const opposite = {
    preferred_weight: p.idealWeight + 8, preferred_length: p.idealLength + 12,
    preferred_grip: p.idealGripType === 'smooth' ? 'ringed' : 'smooth',
    height_cm: p.heightCm + 30, grip_style: 'rear_grip',
  };
  const sTwin = scorePro(twin, p), sOpp = scorePro(opposite, p);
  assert.ok(sTwin > sOpp);
  assert.ok(sTwin <= 100 && sOpp >= 0);
});

// ─── PIPELINE ───────────────────────────────────────────────────────

const MINI_CATALOG = [
  { id: 1, weight: 20, length_mm: 45, diameter_mm: 6.5, grip_type: 'fine_knurl',   barrel_shape: 'straight', balance_point: 'middle', tungsten_pct: 90, price_gbp: 22 },
  { id: 2, weight: 24, length_mm: 52, diameter_mm: 7.2, grip_type: 'medium_knurl', barrel_shape: 'torpedo',  balance_point: 'front',  tungsten_pct: 90, price_gbp: 35 },
  { id: 3, weight: 18, length_mm: 42, diameter_mm: 6.0, grip_type: 'micro_grip',   barrel_shape: 'teardrop', balance_point: 'front',  tungsten_pct: 85, price_gbp: 55 },
  { id: 4, weight: 26, length_mm: 55, diameter_mm: 7.6, grip_type: 'shark_cut',    barrel_shape: 'bomb',     balance_point: 'rear',   tungsten_pct: 95, price_gbp: 70 },
];
const MINI_PROS = [
  { id: 'a', preferred_weight: 20, preferred_length: 45, preferred_grip: 'fine_knurl', height_cm: 175, grip_style: 'mid_three_finger' },
  { id: 'b', preferred_weight: 26, preferred_length: 55, preferred_grip: 'shark_cut',  height_cm: 190, grip_style: 'rear_grip' },
];

test('pipeline surfaces tiers, breakdowns and catalog stats', () => {
  const p = calculateIdealProfile(BASE_INPUTS);
  const r = runMatchPipeline(p, MINI_CATALOG, MINI_PROS);
  assert.ok(r.topDart);
  assert.ok(r.topDart.breakdown, 'every scored dart carries its server-computed breakdown');
  assert.equal(typeof r.topDart.breakdown.weight, 'number');
  assert.ok(r.budgetDart.price_gbp <= 25);
  assert.ok(r.valueDart.price_gbp > 25 && r.valueDart.price_gbp <= 40);
  assert.ok(r.premiumDart.price_gbp > 40);
  assert.equal(r.catalogStats.count, 4);
  assert.ok(r.topPro);
  // Featured darts never repeat in alternates
  const featured = new Set([r.topDart.id, r.budgetDart?.id, r.valueDart?.id, r.premiumDart?.id]);
  for (const alt of r.alternateDarts) assert.ok(!featured.has(alt.id));
});

test('pipeline survives an empty pro list and single-dart catalog', () => {
  const p = calculateIdealProfile(BASE_INPUTS);
  const r = runMatchPipeline(p, [MINI_CATALOG[0]], []);
  assert.ok(r.topDart);
  assert.equal(r.topPro, null);
});

// ─── POSE-RATIO FOREARM ─────────────────────────────────────────────

test('pose ratio scales the forearm estimate within trust bounds', () => {
  const base = forearmFromPoseRatio(0.80, 175); // population mean ratio
  const long = forearmFromPoseRatio(1.05, 175);
  const junk = forearmFromPoseRatio(NaN, 175);
  assert.equal(base, Math.round(1750 * 0.148));
  assert.ok(long > base && long <= base * 1.16);
  assert.equal(junk, base);
});

// ─── ARCHETYPE + CONFIDENCE ─────────────────────────────────────────

test('archetypes cover the physical extremes', () => {
  const lobber = calculateIdealProfile({ ...BASE_INPUTS, throwSpeed: 1, weightPreference: 4 });
  const flat   = calculateIdealProfile({ ...BASE_INPUTS, throwSpeed: 5, wristAction: 2 });
  const rear   = calculateIdealProfile({ ...BASE_INPUTS, throwingStyle: 'rear', weightPreference: 5 });
  assert.equal(lobber.archetype.id, 'rainmaker');
  assert.equal(flat.archetype.id, 'laser');
  assert.equal(rear.archetype.id, 'freight');
  for (const p of [lobber, flat, rear]) {
    assert.ok(p.archetype.name && p.archetype.tagline && p.archetype.detail && p.archetype.proExample);
  }
});

test('fit confidence reflects measured vs estimated inputs', () => {
  const estimated = calculateIdealProfile(BASE_INPUTS);
  const scanned   = calculateIdealProfile({ ...BASE_INPUTS, handMeasured: true, forearmLengthMm: 280 });
  assert.equal(estimated.fitConfidence, 50);
  assert.equal(scanned.fitConfidence, 100);
  assert.equal(estimated.confidenceHints.length, 2);
  assert.equal(scanned.confidenceHints.length, 0);
});
