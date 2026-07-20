'use strict';

// ═══════════════════════════════════════════════════════════════════
//  DARTFIT BIOMECHANICAL ALGORITHM v2.0
//
//  Calculates ideal dart specifications from hand + body measurements
//  and questionnaire responses, then scores every catalog dart against
//  that ideal profile.
//
//  Research basis (see docs/dartfit_audit.docx):
//   • Release strategy: PMC 2017 — optimal release speed 5.1–5.5 m/s,
//     release angle 17–37° before vertical arm position
//   • Oscillation tuning: James & Potts 2018, Sports Engineering —
//     dart pitch-oscillation wavelength ≈ 2.16 m matches oche distance
//   • Grip force / wrist angle: J. Neurophysiology 2020
//   • Joint kinematics: Huang et al. 2024, J. Human Sport & Exercise
//   • Anthropometry: ANSUR II 2012, Greiner 1991
// ═══════════════════════════════════════════════════════════════════

const GRIP_TYPE_ORDER = ['smooth','micro_grip','fine_knurl','medium_knurl','aggressive_knurl','shark_cut','ringed'];
const BOARD_BULLSEYE_HEIGHT_MM = 1730;
const OCHE_DISTANCE_MM = 2370;
const GRAVITY = 9.81; // m/s²

// Mean forearm(ulna)/height ratio, ISAK population data
const FOREARM_HEIGHT_RATIO = 0.148;

// ─────────────────────────────────────────────────────────────────
// INPUT SANITISATION
// Every numeric input is clamped to an anatomically plausible band so
// a wild value (bad scan, malicious request) degrades gracefully
// instead of producing an absurd recommendation.
// ─────────────────────────────────────────────────────────────────
const INPUT_BOUNDS = {
  fingerLength:    [55, 110],   // mm — middle finger, MCP→tip
  palmWidth:       [60, 120],   // mm — index MCP → pinky MCP
  gripDiameter:    [10, 26],    // mm — narrowest knuckle arch
  fingerSpan:      [140, 280],  // mm — thumb tip → pinky tip
  fingerFlexIndex: [0.5, 1.0],  // chord/chain ratio, 1 = dead straight
  heightCm:        [140, 220],
  forearmLengthMm: [180, 360],  // elbow crease → wrist crease
  gripPreference:  [1, 5],
  weightPreference:[1, 5],
  throwSpeed:      [1, 5],      // 1 = slow lob … 5 = fast flat
  wristAction:     [1, 5],      // 1 = locked wrist … 5 = heavy snap
};

function clampInput(name, value, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  const [lo, hi] = INPUT_BOUNDS[name];
  return Math.min(hi, Math.max(lo, n));
}

const VALID_STYLES = ['front', 'middle', 'rear', 'varies'];
const VALID_LEVELS = ['beginner', 'intermediate', 'advanced', 'competitive'];
const VALID_MOISTURE = ['dry', 'normal', 'moist'];

// ─────────────────────────────────────────────────────────────────
// RELEASE PHYSICS
// Given the player's height, forearm length and throw speed, solve
// the projectile equation for the release angle that lands the dart
// on the bullseye. This replaces v1's line-of-sight angle (≈ ±2°),
// which was not a throw angle at all.
// ─────────────────────────────────────────────────────────────────
function computeReleasePhysics({ heightMm, forearmMm, throwSpeed }) {
  // Release point: roughly eye level minus a hand's breadth, arm
  // extended toward the board at release (Huang 2024 kinematics).
  const releaseHeightMm = heightMm * 0.90;
  // The hand is in front of the oche by most of the forearm at release.
  const horizontalMm = Math.max(1200, OCHE_DISTANCE_MM - forearmMm * 0.85);

  // Map self-assessed throw speed (1–5) onto measured release speeds.
  // PMC 2017: skilled throwers release at 5.1–5.5 m/s. The floor is
  // 5.0 m/s — below that a dart physically cannot reach the board on
  // the flat trajectory root (max range v²/g ≈ 2.15 m at 4.6 m/s).
  const releaseSpeed = 5.0 + (throwSpeed - 1) * 0.35; // 5.0 … 6.4 m/s

  // Projectile targeting: tanθ = (v² − √(v⁴ − g(g·d² + 2Δy·v²))) / (g·d)
  // Minus root = the flat, fast trajectory every dart player uses.
  const d  = horizontalMm / 1000;                       // m
  const dy = (BOARD_BULLSEYE_HEIGHT_MM - releaseHeightMm) / 1000; // m
  const v2 = releaseSpeed * releaseSpeed;
  const disc = v2 * v2 - GRAVITY * (GRAVITY * d * d + 2 * dy * v2);

  let releaseAngleDeg;
  if (disc >= 0) {
    releaseAngleDeg = Math.atan((v2 - Math.sqrt(disc)) / (GRAVITY * d)) * 180 / Math.PI;
  } else {
    // Speed too low to reach the bull on the flat root — max-range angle.
    releaseAngleDeg = Math.atan(v2 / (GRAVITY * d)) * 180 / Math.PI;
  }
  releaseAngleDeg = clamp(releaseAngleDeg, 5, 45);

  // Board-arrival pitch: how nose-down the dart arrives if it flew a
  // clean parabola. Used by the shaft/flight oscillation model.
  const t = d / (releaseSpeed * Math.cos(releaseAngleDeg * Math.PI / 180));
  const vyEnd = releaseSpeed * Math.sin(releaseAngleDeg * Math.PI / 180) - GRAVITY * t;
  const arrivalAngleDeg = Math.atan2(vyEnd, releaseSpeed * Math.cos(releaseAngleDeg * Math.PI / 180)) * 180 / Math.PI;

  return {
    releaseSpeed: round1(releaseSpeed),
    releaseAngleDeg: round1(releaseAngleDeg),
    arrivalAngleDeg: round1(arrivalAngleDeg),
    releaseHeightMm: Math.round(releaseHeightMm),
    flightDistanceMm: Math.round(horizontalMm),
  };
}

// ─────────────────────────────────────────────────────────────────
// TUNGSTEN DENSITY MODEL
// Alloy density is close to linear in tungsten fraction over the
// 80–97% range sold as darts: ~15.2 g/cc @80%, ~17.1 @90%, ~18.0 @95%.
// ─────────────────────────────────────────────────────────────────
function tungstenDensity(pct) { return 4.5 + 0.142 * pct; }

// Barrels are not solid cylinders — bore, taper and grip cuts remove
// material. Empirical fill factor from measuring real barrels ≈ 0.80.
const BARREL_FILL_FACTOR = 0.80;

function minTungstenFor(weightG, lengthMm, diameterMm, playingLevel) {
  const volumeCc = Math.PI * Math.pow(diameterMm / 20, 2) * (lengthMm / 10) * BARREL_FILL_FACTOR;
  const requiredRho = weightG / volumeCc;
  const geometricPct = Math.ceil((requiredRho - 4.5) / 0.142);
  // Skill floor: better players benefit from denser (slimmer) barrels
  // for tighter grouping around trebles.
  const levelFloor = { beginner: 80, intermediate: 85, advanced: 90, competitive: 90 }[playingLevel] || 85;
  return clamp(Math.max(geometricPct, levelFloor), 80, 97);
}

// ─────────────────────────────────────────────────────────────────
// 1. IDEAL PROFILE CALCULATION
// ─────────────────────────────────────────────────────────────────
function calculateIdealProfile(rawInputs) {
  const inputs = rawInputs || {};

  // ── Sanitise every input ────────────────────────────────────────
  const fingerLength     = clampInput('fingerLength',     inputs.fingerLength,     80);
  const palmWidth        = clampInput('palmWidth',        inputs.palmWidth,        85);
  const gripDiameter     = clampInput('gripDiameter',     inputs.gripDiameter,     16);
  const fingerSpan       = clampInput('fingerSpan',       inputs.fingerSpan,       200);
  const fingerFlexIndex  = clampInput('fingerFlexIndex',  inputs.fingerFlexIndex,  0.80);
  const heightCm         = clampInput('heightCm',         inputs.heightCm,         175);
  const gripPreference   = clampInput('gripPreference',   inputs.gripPreference,   3);
  const weightPreference = clampInput('weightPreference', inputs.weightPreference, 3);
  const throwSpeed       = clampInput('throwSpeed',       inputs.throwSpeed,       3);
  const wristAction      = clampInput('wristAction',      inputs.wristAction,      3);
  const throwingStyle    = VALID_STYLES.includes(inputs.throwingStyle) ? inputs.throwingStyle : 'middle';
  const playingLevel     = VALID_LEVELS.includes(inputs.playingLevel) ? inputs.playingLevel : 'intermediate';
  const handMoisture     = VALID_MOISTURE.includes(inputs.handMoisture) ? inputs.handMoisture : 'normal';

  const heightMm = heightCm * 10;
  // 'varies' maps to 'middle': adaptive grippers are best served by a
  // centre-balanced dart that tolerates any grip position.
  const effectiveStyle = (throwingStyle === 'varies') ? 'middle' : throwingStyle;

  // ── Forearm & leverage ──────────────────────────────────────────
  const forearmProvided = Number.isFinite(Number(inputs.forearmLengthMm)) && Number(inputs.forearmLengthMm) > 0;
  const fLen = forearmProvided
    ? clampInput('forearmLengthMm', inputs.forearmLengthMm, heightMm * FOREARM_HEIGHT_RATIO)
    : heightMm * FOREARM_HEIGHT_RATIO;
  const leverageRatio = fLen / heightMm;

  // ── Release physics ─────────────────────────────────────────────
  const physics = computeReleasePhysics({ heightMm, forearmMm: fLen, throwSpeed });

  // ── WEIGHT ──────────────────────────────────────────────────────
  const palmNorm     = (palmWidth - 85) / 15;       // wider palm → heavier for stability
  const fingerNorm   = (fingerLength - 80) / 20;    // longer fingers → more grip reach, less mass needed
  const heightNorm   = (heightCm - 175) / 25;       // taller → more arm speed available
  const leverageNorm = (leverageRatio - FOREARM_HEIGHT_RATIO) / 0.012; // longer lever → lighter dart
  const weightPrefGrams = (weightPreference - 3) * 2;   // ±4 g
  const levelWeightMod = { competitive: -1.5, advanced: -0.5, beginner: 1.0 }[playingLevel] || 0;
  // Slow throwers need more momentum for a stable arc; fast flat
  // throwers control lighter darts better (research audit item 3).
  const speedWeightMod = (3 - throwSpeed) * 0.9;        // ±1.8 g
  // A strong wrist snap adds release speed for free → lighter dart.
  const snapWeightMod = (3 - wristAction) * 0.4;        // ±0.8 g

  const rawWeight = 20
    + palmNorm   * 2.5
    - fingerNorm * 0.8
    + heightNorm * 1.2
    - leverageNorm * 1.5
    + weightPrefGrams
    + levelWeightMod
    + speedWeightMod
    + snapWeightMod;
  const idealWeight = Math.round(clamp(rawWeight, 14, 28));

  // ── LENGTH ──────────────────────────────────────────────────────
  const spanNorm = (fingerSpan - 200) / 40;
  const rawLength = 45
    + (fingerLength - 80) / 20 * 10   // longer fingers → longer barrel to seat all fingers
    + spanNorm * 2
    + (effectiveStyle === 'front' ? -3 : effectiveStyle === 'rear' ? 4 : 0)
    + (palmWidth - 85) / 15 * 2;
  const idealLength = Math.round(clamp(rawLength, 38, 58));

  // ── DIAMETER ────────────────────────────────────────────────────
  const rawDiameter = 5.5 + (gripDiameter - 13) / 8 * 3.5;
  const idealDiameter = round1(clamp(rawDiameter, 5.2, 8.5));

  // ── GRIP TEXTURE ────────────────────────────────────────────────
  // Base: stated preference. Modifiers:
  //  • hand size vs barrel: bigger hands roll the barrel more → more texture
  //  • flex: tightly curled fingers already grip hard → less texture
  //  • level: advanced players favour finer control surfaces
  //  • moisture (audit item 4): sweaty hands slip on smooth barrels;
  //    very dry hands over-stick on aggressive knurl
  //  • wrist snap (audit item 1): a hard snap torques the barrel out
  //    of the fingers — needs more bite to keep release consistent
  const moistureMod = { dry: -0.5, normal: 0, moist: 1.0 }[handMoisture];
  const snapGripMod = wristAction >= 4 ? 0.5 : wristAction <= 2 ? -0.25 : 0;
  const gripMod = (gripDiameter > 18 ? -0.5 : gripDiameter < 13 ? 0.5 : 0)
                + (fingerFlexIndex < 0.70 ? -0.5 : fingerFlexIndex > 0.90 ? 0.5 : 0)
                + ((playingLevel === 'advanced' || playingLevel === 'competitive') ? 0.5 : 0)
                + moistureMod
                + snapGripMod;
  const rawGrip = gripPreference + gripMod;
  const gripIndex = Math.round(clamp(rawGrip, 1, 6)) - 1;
  const idealGripType = GRIP_TYPE_ORDER[gripIndex] || 'medium_knurl';

  // ── BALANCE POINT ───────────────────────────────────────────────
  // Primary: where they hold the barrel — CoG should sit under the
  // fingers. Modifiers: steep arcs favour front balance (nose-over),
  // very flat fast throws tolerate rear; short levers push front.
  // Thresholds calibrated to the projectile model's real output band
  // (~19° at 6.4 m/s up to ~36° at 5.0 m/s).
  const isSteepArc = physics.releaseAngleDeg > 30;
  const isFlatArc  = physics.releaseAngleDeg < 21;
  const isLongForearm  = leverageRatio > 0.155;
  const isShortForearm = leverageRatio < 0.140;
  const isLowFlex  = fingerFlexIndex < 0.72;  // curled release → front-heavy path
  const isWideSpan = fingerSpan > 220;

  let balance;
  if (effectiveStyle === 'front') {
    balance = isLongForearm ? 'middle' : 'front';
  } else if (effectiveStyle === 'rear') {
    balance = isShortForearm ? 'middle' : 'rear';
  } else if (isSteepArc || isShortForearm || isLowFlex || isWideSpan) {
    balance = 'front';
  } else if (isFlatArc || isLongForearm) {
    balance = 'rear';
  } else {
    balance = 'middle';
  }

  // ── BARREL SHAPE ────────────────────────────────────────────────
  let barrelShape;
  if (idealWeight < 18) {
    barrelShape = 'teardrop';
  } else if (idealWeight < 21) {
    barrelShape = effectiveStyle === 'front' ? 'torpedo' : effectiveStyle === 'rear' ? 'bomb' : 'teardrop';
  } else if (idealWeight < 24) {
    barrelShape = effectiveStyle === 'front' ? 'torpedo' : effectiveStyle === 'rear' ? 'bomb' : 'straight';
  } else {
    barrelShape = effectiveStyle === 'rear' ? 'bomb' : 'straight';
  }

  // ── TUNGSTEN (audit item 5) ─────────────────────────────────────
  const idealTungstenPct = minTungstenFor(idealWeight, idealLength, idealDiameter, playingLevel);

  // ── SHAFT + FLIGHT (audit items 2 & 6) ──────────────────────────
  const setup = recommendShaftFlight({
    idealWeight, idealLength, balance,
    releaseAngleDeg: physics.releaseAngleDeg,
    arrivalAngleDeg: physics.arrivalAngleDeg,
    throwSpeed, wristAction,
  });

  // ── THROWER ARCHETYPE ───────────────────────────────────────────
  const archetype = classifyArchetype({
    releaseAngleDeg: physics.releaseAngleDeg, throwSpeed, wristAction,
    idealWeight, balance, effectiveStyle, playingLevel,
  });

  // ── FIT CONFIDENCE ──────────────────────────────────────────────
  // Honest signal of how much of this profile is measured vs estimated.
  const handMeasured = inputs.handMeasured === true;
  let fitConfidence = 50;                      // questionnaire alone
  const confidenceHints = [];
  if (handMeasured) fitConfidence += 30;
  else confidenceHints.push('Scan your hand with the camera to replace population estimates with your real geometry (+30%)');
  if (forearmProvided) fitConfidence += 20;
  else confidenceHints.push('Add a forearm measurement (arm scan or tape measure) to personalise your leverage model (+20%)');

  return {
    // Inputs echo (sanitised values, so the client sees what was used)
    fingerLength, palmWidth, gripDiameter, fingerSpan,
    fingerFlexIndex, heightCm, leverageRatio: round3(leverageRatio),
    throwSpeed, wristAction, handMoisture, throwingStyle, playingLevel,

    // Computed physics
    forearmLengthMm: Math.round(fLen),
    forearmMeasured: forearmProvided,
    naturalThrowAngle: physics.releaseAngleDeg, // kept for API compatibility
    releaseAngleDeg: physics.releaseAngleDeg,
    releaseSpeedMs: physics.releaseSpeed,
    arrivalAngleDeg: physics.arrivalAngleDeg,
    releaseHeightMm: physics.releaseHeightMm,
    flightDistanceMm: physics.flightDistanceMm,

    // Ideal barrel
    idealWeight,
    idealLength,
    idealDiameter,
    idealGripType,
    idealTungstenPct,
    balance,
    barrelShape,

    // Full-setup recommendation
    idealShaft: setup.shaft,
    idealFlight: setup.flight,
    setupRationale: setup.rationale,

    // Thrower identity + honesty about estimate quality
    archetype,
    fitConfidence: clamp(fitConfidence, 0, 100),
    confidenceHints,
  };
}

// ─────────────────────────────────────────────────────────────────
// THROWER ARCHETYPE CLASSIFICATION
// Two physical axes — trajectory (release angle) and delivery power
// (speed + wrist) — plus grip position, mapped onto six recognisable
// thrower identities. Purely descriptive: it names the mechanics the
// numbers already describe, which players can sanity-check at the oche.
// ─────────────────────────────────────────────────────────────────
const ARCHETYPES = {
  rainmaker: {
    id: 'rainmaker', name: 'The Rainmaker', emoji: '🌧️',
    tagline: 'High looping arc that drops onto the treble from above',
    proExample: 'Gary Anderson',
    detail: 'You throw a pronounced parabola. Heavier, front-balanced darts keep the nose tracking through the drop, and drag-heavy flights stop tail-wag at apex.',
  },
  laser: {
    id: 'laser', name: 'The Laser', emoji: '⚡',
    tagline: 'Flat, fast delivery on a near-straight line',
    proExample: 'Michael van Gerwen',
    detail: 'Your dart barely rises. Slim flights and lighter barrels reward your pace; too much drag makes a flat throw fall short.',
  },
  sniper: {
    id: 'sniper', name: 'The Sniper', emoji: '🎯',
    tagline: 'Front-grip precision with a controlled wrist snap',
    proExample: 'Luke Littler',
    detail: 'You aim down the barrel and release with wrist acceleration. Front-weighted torpedos with real bite under the fingertips give the snap something to push against.',
  },
  freight: {
    id: 'freight', name: 'The Freight Train', emoji: '🚂',
    tagline: 'Rear-grip power delivery that muscles the dart in',
    proExample: 'Ryan Searle',
    detail: 'You load from the back of the barrel and drive through it. Long rear-weighted barrels with aggressive texture stay locked in your grip at full power.',
  },
  metronome: {
    id: 'metronome', name: 'The Metronome', emoji: '⚙️',
    tagline: 'Repeatable, rhythm-driven pendulum throw',
    proExample: 'James Wade',
    detail: 'Consistency is your weapon. Centre-balanced straight barrels reproduce identically throw after throw — nothing exotic, everything repeatable.',
  },
  surgeon: {
    id: 'surgeon', name: 'The Surgeon', emoji: '🔬',
    tagline: 'Light-touch finesse with minimal grip pressure',
    proExample: 'Fallon Sherrock',
    detail: 'You place darts rather than throw them. Lighter barrels with subtle texture respond to your touch without demanding force.',
  },
};

function classifyArchetype({ releaseAngleDeg, throwSpeed, wristAction, idealWeight, balance, effectiveStyle, playingLevel }) {
  const power = (throwSpeed + wristAction) / 2;    // 1–5
  if (idealWeight <= 18 && power <= 3)                      return ARCHETYPES.surgeon;
  if (effectiveStyle === 'rear' || (balance === 'rear' && idealWeight >= 24)) return ARCHETYPES.freight;
  if (releaseAngleDeg >= 30 && throwSpeed <= 2)             return ARCHETYPES.rainmaker;
  if (releaseAngleDeg <= 22.5 && throwSpeed >= 4)           return ARCHETYPES.laser;
  if (effectiveStyle === 'front' && wristAction >= 4)       return ARCHETYPES.sniper;
  return ARCHETYPES.metronome;
}

// ─────────────────────────────────────────────────────────────────
// SHAFT + FLIGHT RECOMMENDATION — oscillation tuning
//
// James & Potts 2018 (Sports Engineering): a thrown dart pitches
// about its CoG with an oscillation wavelength of ~2.16 m — nearly
// the oche distance — so setup changes that speed up or slow down
// that oscillation decide whether the dart arrives nose-down (clean
// scoring position) or tail-down (bounce-outs, blocked trebles).
//
// Longer shafts + bigger flights move aero drag rearward: stronger
// pitch correction, faster oscillation. Short shafts + slim flights
// damp it. We tune toward the setup whose correction matches the
// player's parabolic arrival pitch.
// ─────────────────────────────────────────────────────────────────
function recommendShaftFlight({ idealWeight, idealLength, balance, releaseAngleDeg, arrivalAngleDeg, throwSpeed, wristAction }) {
  // How much nose-down correction does this trajectory need?
  // Steep lob → dart arrives pitching down already → less correction.
  // Flat fast throw → arrives flat/tail-proud → needs aero correction.
  const neededCorrection = clamp(18 + arrivalAngleDeg, 0, 24); // arrival is negative (descending)

  // Shaft length (standard trade sizes, mm)
  let shaft;
  if (idealLength >= 52 || balance === 'rear') {
    // Long barrel or rear CoG: keep the moment arm short or the dart fishtails
    shaft = { lengthMm: 35, label: 'Short (35mm)' };
  } else if (idealLength <= 42 && balance === 'front' && neededCorrection > 12) {
    shaft = { lengthMm: 48, label: 'Long (48mm)' };
  } else {
    shaft = { lengthMm: 41, label: 'Medium (41mm)' };
  }

  // Flight size
  let flight;
  const wantsDrag = idealWeight >= 24 || throwSpeed <= 2 || releaseAngleDeg > 22;
  const wantsSlim = idealWeight <= 18 || (throwSpeed >= 4 && releaseAngleDeg < 14);
  if (wantsDrag && !wantsSlim) {
    flight = { shape: 'standard', areaCm2: 38, label: 'Standard (No.2)' };
  } else if (wantsSlim && !wantsDrag) {
    flight = { shape: 'slim', areaCm2: 26, label: 'Slim' };
  } else {
    flight = { shape: 'kite', areaCm2: 32, label: 'Kite' };
  }

  const rationale =
    `A ${releaseAngleDeg.toFixed(0)}° release arriving at ${Math.abs(arrivalAngleDeg).toFixed(0)}° nose-down ` +
    `pairs best with a ${shaft.label.toLowerCase()} shaft and ${flight.label.toLowerCase()} flights — ` +
    `this keeps the dart's pitch oscillation (≈2.16 m wavelength, James & Potts 2018) in phase with the ` +
    `oche so it lands point-first without tail-wag.`;

  return { shaft, flight, rationale };
}

// ─────────────────────────────────────────────────────────────────
// 2. DART SCORING (v2 weights — must sum to 1.00)
//    weight .30 | length .18 | diameter .14 | grip .14
//    balance .10 | shape .06 | tungsten .08
// ─────────────────────────────────────────────────────────────────
const SCORE_WEIGHTS = {
  weight: 0.30, length: 0.18, diameter: 0.14, grip: 0.14,
  balance: 0.10, shape: 0.06, tungsten: 0.08,
};

function scoreDartBreakdown(dart, profile) {
  // Weight: 10 pts lost per gram — a 10 g miss scores zero.
  const weightScore = Math.max(0, 100 - Math.abs(dart.weight - profile.idealWeight) * 10);

  // Length: grip-reach fit.
  const lengthScore = Math.max(0, 100 - Math.abs(dart.length_mm - profile.idealLength) * 4.5);

  // Diameter: finger-wrap comfort.
  const diamScore = Math.max(0, 100 - Math.abs(dart.diameter_mm - profile.idealDiameter) * 22);

  // Grip texture: distance along the texture ladder.
  const idealIdx = GRIP_TYPE_ORDER.indexOf(profile.idealGripType);
  const dartIdx  = GRIP_TYPE_ORDER.indexOf(dart.grip_type);
  const gripDiff = (idealIdx < 0 || dartIdx < 0) ? 3 : Math.abs(idealIdx - dartIdx);
  const gripScore = gripDiff === 0 ? 100 : gripDiff === 1 ? 70 : Math.max(0, 100 - gripDiff * 30);

  // Balance point.
  const balanceScore = dart.balance_point === profile.balance ? 100 :
    (dart.balance_point === 'middle' || profile.balance === 'middle') ? 62 : 30;

  // Barrel shape family.
  const shapeScore = dart.barrel_shape === profile.barrelShape ? 100 :
    shapeFamily(dart.barrel_shape) === shapeFamily(profile.barrelShape) ? 65 : 40;

  // Tungsten density: full marks at/above the recommended minimum,
  // 6 pts lost per point below it (an 80% barrel vs a 90% target = 40).
  const idealPct = profile.idealTungstenPct || 85;
  const tungstenScore = dart.tungsten_pct >= idealPct
    ? 100
    : Math.max(0, 100 - (idealPct - dart.tungsten_pct) * 6);

  const total = Math.round(clamp(
    weightScore   * SCORE_WEIGHTS.weight +
    lengthScore   * SCORE_WEIGHTS.length +
    diamScore     * SCORE_WEIGHTS.diameter +
    gripScore     * SCORE_WEIGHTS.grip +
    balanceScore  * SCORE_WEIGHTS.balance +
    shapeScore    * SCORE_WEIGHTS.shape +
    tungstenScore * SCORE_WEIGHTS.tungsten,
    0, 100));

  return {
    total,
    components: {
      weight:   Math.round(weightScore),
      length:   Math.round(lengthScore),
      diameter: Math.round(diamScore),
      grip:     Math.round(gripScore),
      balance:  Math.round(balanceScore),
      shape:    Math.round(shapeScore),
      tungsten: Math.round(tungstenScore),
    },
  };
}

function scoreDart(dart, profile) {
  return scoreDartBreakdown(dart, profile).total;
}

function shapeFamily(shape) {
  if (['teardrop','torpedo','bullet'].includes(shape)) return 'tapered_front';
  if (['bomb','shark'].includes(shape)) return 'tapered_rear';
  return 'straight';
}

// ─────────────────────────────────────────────────────────────────
// 3. PRO PLAYER MATCHING
// ─────────────────────────────────────────────────────────────────
function proBalanceFromStyle(pro) {
  const gs = (pro.grip_style || '');
  if (gs.includes('front')) return 'front';
  if (gs.includes('rear'))  return 'rear';
  return 'middle';
}

function scorePro(pro, profile) {
  // Weight similarity: 30%
  const weightScore = Math.max(0, 100 - Math.abs(pro.preferred_weight - profile.idealWeight) * 12);

  // Length similarity: 15%
  const lengthScore = Math.max(0, 100 - Math.abs(pro.preferred_length - profile.idealLength) * 4);

  // Grip similarity: 20%
  const proGripIdx  = GRIP_TYPE_ORDER.indexOf(pro.preferred_grip);
  const userGripIdx = GRIP_TYPE_ORDER.indexOf(profile.idealGripType);
  const gripDiff    = (proGripIdx < 0 || userGripIdx < 0) ? 3 : Math.abs(proGripIdx - userGripIdx);
  const gripScore   = Math.max(0, 100 - gripDiff * 25);

  // Height similarity: 15% — drives release geometry
  const heightScore = Math.max(0, 100 - Math.abs(pro.height_cm - profile.heightCm) * 2);

  // Grip-position affinity: 20% — from the pro's documented grip style
  const proBalance = proBalanceFromStyle(pro);
  const balanceScore = profile.balance === proBalance ? 100 :
    (profile.balance === 'middle' || proBalance === 'middle') ? 55 : 20;

  return Math.round(
    weightScore  * 0.30 +
    lengthScore  * 0.15 +
    gripScore    * 0.20 +
    heightScore  * 0.15 +
    balanceScore * 0.20
  );
}

// ─────────────────────────────────────────────────────────────────
// 4. FOREARM ESTIMATION (server-side fallback)
//
// v1 pretended to "analyse" the photo by reading its aspect ratio —
// that was noise dressed as measurement. Absolute length cannot be
// recovered from an unscaled photo, so the honest server-side answer
// is the anthropometric estimate. Real measurement happens client-
// side (MediaPipe Pose: elbow–wrist vs shoulder–elbow ratio, which
// is scale-free) or by the user entering a tape measurement.
// ─────────────────────────────────────────────────────────────────
async function analyzeForearmImage(imagePath, heightCm) {
  const h = clampInput('heightCm', heightCm, 175);
  const baseForearm = Math.round(h * 10 * FOREARM_HEIGHT_RATIO);
  try {
    const sharp = require('sharp');
    const meta = await sharp(imagePath).metadata();
    return {
      success: true,
      forearmLengthMm: baseForearm,
      imageWidth: meta.width,
      imageHeight: meta.height,
      method: 'anthropometric_estimate',
      note: 'Server cannot scale an unreferenced photo; estimate is height-based. Client-side pose analysis or manual entry overrides this.',
    };
  } catch (err) {
    return {
      success: false,
      forearmLengthMm: baseForearm,
      method: 'height_only',
      error: err.message,
    };
  }
}

// Convert a scale-free pose ratio (elbow→wrist / shoulder→elbow) into a
// personalised forearm estimate. Population mean ulna/humerus ≈ 0.80
// (ANSUR II); deviation from it scales the height-based estimate.
function forearmFromPoseRatio(ratio, heightCm) {
  const h = clampInput('heightCm', heightCm, 175);
  const base = h * 10 * FOREARM_HEIGHT_RATIO;
  const r = Number(ratio);
  if (!Number.isFinite(r) || r <= 0) return Math.round(base);
  const deviation = clamp(r / 0.80, 0.85, 1.15); // trust the pose ±15%
  return Math.round(base * deviation);
}

// ─────────────────────────────────────────────────────────────────
// 5. FULL MATCH PIPELINE
// ─────────────────────────────────────────────────────────────────
const BUDGET_MAX  = 25;  // £0–£25  → budget tier
const VALUE_MAX   = 40;  // £25–£40 → value tier
                         // £40+    → premium tier

function runMatchPipeline(profile, darts, pros) {
  const scoredDarts = darts
    .map(d => {
      const s = scoreDartBreakdown(d, profile);
      return { ...d, matchScore: s.total, breakdown: s.components };
    })
    .sort((a, b) => b.matchScore - a.matchScore);

  const scoredPros = pros
    .map(p => ({ ...p, similarity: scorePro(p, profile) }))
    .sort((a, b) => b.similarity - a.similarity);

  const budgetPool  = scoredDarts.filter(d => d.price_gbp != null && d.price_gbp <= BUDGET_MAX);
  const valuePool   = scoredDarts.filter(d => d.price_gbp != null && d.price_gbp > BUDGET_MAX && d.price_gbp <= VALUE_MAX);
  const premiumPool = scoredDarts.filter(d => d.price_gbp != null && d.price_gbp > VALUE_MAX);

  const topDart     = scoredDarts[0] || null;
  const budgetDart  = budgetPool[0]  || null;
  const valueDart   = valuePool[0]   || null;
  const premiumDart = premiumPool[0] || null;

  const featured = new Set([topDart?.id, budgetDart?.id, valueDart?.id, premiumDart?.id]);
  const alternateDarts = scoredDarts.filter(d => !featured.has(d.id)).slice(0, 4);

  return {
    profile,
    topDart,
    budgetDart,
    valueDart,
    premiumDart,
    alternateDarts,
    topPro: scoredPros[0] || null,
    alternatePros: scoredPros.slice(1, 3),
    // Trimmed catalog stats for the client (was: the entire catalog)
    catalogStats: {
      count: scoredDarts.length,
      minWeight: Math.min(...scoredDarts.map(d => d.weight)),
      maxWeight: Math.max(...scoredDarts.map(d => d.weight)),
      scoreP90: percentile(scoredDarts.map(d => d.matchScore), 0.9),
    },
  };
}

// ─────────────────────────────────────────────────────────────────
// UTIL
// ─────────────────────────────────────────────────────────────────
function clamp(v, min, max) { return Math.min(max, Math.max(min, v)); }
function round1(v) { return parseFloat(v.toFixed(1)); }
function round3(v) { return parseFloat(v.toFixed(3)); }
function percentile(arr, p) {
  if (!arr.length) return 0;
  const s = [...arr].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.floor(p * s.length))];
}

module.exports = {
  calculateIdealProfile,
  scoreDart,
  scoreDartBreakdown,
  scorePro,
  analyzeForearmImage,
  forearmFromPoseRatio,
  runMatchPipeline,
  recommendShaftFlight,
  computeReleasePhysics,
  minTungstenFor,
  SCORE_WEIGHTS,
  GRIP_TYPE_ORDER,
  INPUT_BOUNDS,
};
