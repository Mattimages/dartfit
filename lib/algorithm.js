'use strict';

// ═══════════════════════════════════════════════════════════════════
//  DARTFIT BIOMECHANICAL ALGORITHM v1.0
//  Calculates ideal dart specifications from hand + body measurements
//  and questionnaire responses.
// ═══════════════════════════════════════════════════════════════════

const GRIP_TYPE_ORDER = ['smooth','micro_grip','fine_knurl','medium_knurl','aggressive_knurl','shark_cut','ringed'];
const BOARD_BULLSEYE_HEIGHT_MM = 1730;
const OCHE_DISTANCE_MM = 2370;

// ─────────────────────────────────────────────────────────────────
// 1. IDEAL PROFILE CALCULATION
// ─────────────────────────────────────────────────────────────────
function calculateIdealProfile(inputs) {
  const {
    // Hand biometrics (mm)
    fingerLength = 80,
    palmWidth = 85,
    gripDiameter = 16,
    fingerSpan = 200,
    fingerFlexIndex = 0.75,
    throwAngleDeg = 15,

    // Physical
    heightCm = 175,

    // Arm image analysis
    forearmLengthMm = null,

    // Questionnaire (1-5 scale)
    gripPreference = 3,   // 1=smooth, 5=very aggressive
    weightPreference = 3, // 1=very light, 5=very heavy
    throwingStyle = 'middle', // 'front' | 'middle' | 'rear'
    playingLevel = 'intermediate', // beginner|intermediate|advanced|professional
  } = inputs;

  const heightMm = heightCm * 10;

  // ── FOREARM ESTIMATION ──────────────────────────────────────────
  // If not provided from image, estimate from height ratio
  // Typical forearm/height ratio: 0.142–0.158 (shorter/taller people)
  const fLen = forearmLengthMm || (heightMm * 0.148);
  const leverageRatio = fLen / heightMm;

  // ── NATURAL THROW ANGLE ─────────────────────────────────────────
  // Eye height ≈ 93.5% of total height (standing, eyes-forward)
  const eyeHeightMm = heightMm * 0.935;
  const deltaY = BOARD_BULLSEYE_HEIGHT_MM - eyeHeightMm; // negative = looking down
  const naturalThrowAngle = Math.atan2(deltaY, OCHE_DISTANCE_MM) * (180 / Math.PI);

  // ── WEIGHT ─────────────────────────────────────────────────────
  // Base: 20g for average anatomy
  // Palm width: wider = heavier dart for stability
  const palmNorm = (palmWidth - 85) / 15;                  // -1 to +1
  // Finger length: longer fingers = longer grip reach = less need for heavy dart
  const fingerNorm = (fingerLength - 80) / 20;             // -1 to +1
  // Height: taller players typically throw with more power, can use slightly heavier
  const heightNorm = (heightCm - 175) / 25;                // -1 to +1
  // Forearm leverage: longer forearm = more lever arm = can use lighter dart
  const leverageNorm = (leverageRatio - 0.148) / 0.012;    // -1 to +1
  // Weight questionnaire (1–5 → -4 to +4g)
  const weightPrefGrams = (weightPreference - 3) * 2;

  const rawWeight = 20
    + palmNorm   * 2.5
    - fingerNorm * 0.8
    + heightNorm * 1.2
    - leverageNorm * 1.5
    + weightPrefGrams;

  const idealWeight = Math.round(clamp(rawWeight, 14, 28));

  // ── LENGTH ─────────────────────────────────────────────────────
  // Longer fingers → longer barrel needed to reach full grip
  const rawLength = 45
    + (fingerLength - 80) / 20 * 10
    + (throwingStyle === 'front' ? -3 : throwingStyle === 'rear' ? 4 : 0)
    + (palmWidth - 85) / 15 * 2;

  const idealLength = Math.round(clamp(rawLength, 38, 58));

  // ── DIAMETER ───────────────────────────────────────────────────
  // Grip diameter of the hand (knuckle-to-knuckle narrowest point)
  // Maps to ideal barrel diameter
  const rawDiameter = 5.5 + (gripDiameter - 13) / 8 * 3.5;
  const idealDiameter = parseFloat(clamp(rawDiameter, 5.2, 9.0).toFixed(1));

  // ── GRIP TEXTURE ───────────────────────────────────────────────
  // Primary driver: questionnaire preference (1-5)
  // Modifier: grip diameter — larger hand = barrel rolls more = more grip needed
  const gripMod = gripDiameter > 18 ? -0.5 : gripDiameter < 13 ? 0.5 : 0;
  const rawGrip = gripPreference + gripMod;
  const gripIndex = Math.round(clamp(rawGrip, 1, 6)) - 1;
  const idealGripType = GRIP_TYPE_ORDER[gripIndex] || 'medium_knurl';

  // ── BALANCE POINT ──────────────────────────────────────────────
  // Primary driver: throwing style (where they grip the barrel)
  // Secondary modifiers: forearm leverage and throw angle deviation
  let balance;
  // Only compute throw angle diff when user explicitly provides throwAngleDeg
  const userThrowAngle = throwAngleDeg !== null && throwAngleDeg !== undefined;
  const throwAngleDiff = userThrowAngle ? (throwAngleDeg - naturalThrowAngle) : 0;
  const isHighRelease = throwAngleDiff > 8;
  const isLowRelease  = throwAngleDiff < -8;
  const isLongForearm = leverageRatio > 0.155;
  const isShortForearm = leverageRatio < 0.140;

  if (throwingStyle === 'front') {
    // Front grippers benefit from front-weighted unless long forearm pushes to middle
    balance = isLongForearm ? 'middle' : 'front';
  } else if (throwingStyle === 'rear') {
    // Rear grippers benefit from rear-weighted unless short forearm pushes to middle
    balance = isShortForearm ? 'middle' : 'rear';
  } else {
    // Middle grip: modifier from release angle or forearm
    if (isHighRelease || isShortForearm) balance = 'front';
    else if (isLowRelease || isLongForearm) balance = 'rear';
    else balance = 'middle';
  }

  // ── BARREL SHAPE ───────────────────────────────────────────────
  // Shape is driven by weight range + throwing style modifier
  let barrelShape;
  if (idealWeight < 18) {
    barrelShape = 'teardrop';
  } else if (idealWeight < 21) {
    barrelShape = throwingStyle === 'front' ? 'torpedo' : throwingStyle === 'rear' ? 'bomb' : 'teardrop';
  } else if (idealWeight < 24) {
    barrelShape = throwingStyle === 'front' ? 'torpedo' : throwingStyle === 'rear' ? 'bomb' : 'straight';
  } else {
    barrelShape = throwingStyle === 'front' ? 'straight' : throwingStyle === 'rear' ? 'bomb' : 'straight';
  }

  return {
    // Inputs echo
    fingerLength, palmWidth, gripDiameter, fingerSpan,
    fingerFlexIndex, throwAngleDeg, heightCm, leverageRatio,

    // Computed
    naturalThrowAngle: parseFloat(naturalThrowAngle.toFixed(2)),
    forearmLengthMm: Math.round(fLen),

    // Ideal specs
    idealWeight,
    idealLength,
    idealDiameter,
    idealGripType,
    balance,
    barrelShape,
  };
}

// ─────────────────────────────────────────────────────────────────
// 2. DART SCORING
// ─────────────────────────────────────────────────────────────────
function scoreDart(dart, profile) {
  // Weight: 35% — most critical biomechanical factor
  const weightDiff = Math.abs(dart.weight - profile.idealWeight);
  const weightScore = Math.max(0, 100 - weightDiff * 14);

  // Length: 20% — determines grip reach
  const lengthDiff = Math.abs(dart.length_mm - profile.idealLength);
  const lengthScore = Math.max(0, 100 - lengthDiff * 4.5);

  // Diameter: 15% — determines finger wrap comfort
  const diamDiff = Math.abs(dart.diameter_mm - profile.idealDiameter);
  const diamScore = Math.max(0, 100 - diamDiff * 22);

  // Grip type: 15%
  const idealIdx = GRIP_TYPE_ORDER.indexOf(profile.idealGripType);
  const dartIdx  = GRIP_TYPE_ORDER.indexOf(dart.grip_type);
  const gripDiff = Math.abs(idealIdx - dartIdx);
  const gripScore = gripDiff === 0 ? 100 : gripDiff === 1 ? 70 : Math.max(0, 100 - gripDiff * 30);

  // Balance: 10%
  const balanceScore = dart.balance_point === profile.balance ? 100 :
    (dart.balance_point === 'middle' || profile.balance === 'middle') ? 62 : 30;

  // Barrel shape: 5%
  const shapeScore = dart.barrel_shape === profile.barrelShape ? 100 :
    shapeFamily(dart.barrel_shape) === shapeFamily(profile.barrelShape) ? 65 : 40;

  const total = (
    weightScore  * 0.35 +
    lengthScore  * 0.20 +
    diamScore    * 0.15 +
    gripScore    * 0.15 +
    balanceScore * 0.10 +
    shapeScore   * 0.05
  );

  return Math.round(clamp(total, 0, 100));
}

function shapeFamily(shape) {
  if (['teardrop','torpedo'].includes(shape)) return 'tapered_front';
  if (['bomb','shark'].includes(shape)) return 'tapered_rear';
  return 'straight';
}

// ─────────────────────────────────────────────────────────────────
// 3. PRO PLAYER MATCHING
// ─────────────────────────────────────────────────────────────────
function scorePro(pro, profile) {
  // Weight similarity: 30%
  const weightDiff = Math.abs(pro.preferred_weight - profile.idealWeight);
  const weightScore = Math.max(0, 100 - weightDiff * 12);

  // Length similarity: 15%
  const lengthDiff = Math.abs(pro.preferred_length - profile.idealLength);
  const lengthScore = Math.max(0, 100 - lengthDiff * 4);

  // Grip similarity: 20%
  const proGripIdx   = GRIP_TYPE_ORDER.indexOf(pro.preferred_grip);
  const userGripIdx  = GRIP_TYPE_ORDER.indexOf(profile.idealGripType);
  const gripDiff     = Math.abs(proGripIdx - userGripIdx);
  const gripScore    = Math.max(0, 100 - gripDiff * 25);

  // Height similarity: 15% — affects natural angle and dart weight preference
  const heightDiff = Math.abs(pro.height_cm - profile.heightCm);
  const heightScore = Math.max(0, 100 - heightDiff * 2);

  // Balance/throw style affinity: 20% — matches grip position to pro's style
  const proBalance = pro.preferred_weight <= 19 ? 'front' :
    pro.preferred_weight >= 24 ? 'rear' : 'middle';
  const balanceScore = profile.balance === proBalance ? 100 :
    (profile.balance === 'middle' || proBalance === 'middle') ? 55 : 20;

  return Math.round((
    weightScore  * 0.30 +
    lengthScore  * 0.15 +
    gripScore    * 0.20 +
    heightScore  * 0.15 +
    balanceScore * 0.20
  ));
}

// ─────────────────────────────────────────────────────────────────
// 4. IMAGE ANALYSIS — Forearm Length Estimation
// ─────────────────────────────────────────────────────────────────
async function analyzeForearmImage(imagePath, heightCm) {
  try {
    const sharp = require('sharp');
    const meta = await sharp(imagePath).metadata();
    const { width, height: imgHeight } = meta;

    // Estimate forearm as a proportion of image height
    // In a bicep-flex / forearm photo taken at arm's length:
    // - Portrait: forearm typically occupies 55–75% of frame height
    // - Landscape: forearm typically occupies 70–90% of frame width
    const isPortrait = imgHeight > width;
    const dominantDim = isPortrait ? imgHeight : width;

    // Use aspect ratio as a proxy for arm length relative to frame
    // Longer, narrower images → longer forearm relative to upper arm
    const aspectRatio = isPortrait ? (imgHeight / width) : (width / imgHeight);

    // Map aspect ratio (1.0–2.5) to forearm proportion factor (0.92–1.08)
    const aspectNorm = clamp((aspectRatio - 1.0) / 1.5, 0, 1);
    const proportionFactor = 0.92 + aspectNorm * 0.16;

    // Base forearm estimate from height
    const baseForearm = heightCm * 10 * 0.148;
    const estimatedForearm = Math.round(baseForearm * proportionFactor);

    return {
      success: true,
      forearmLengthMm: estimatedForearm,
      imageWidth: width,
      imageHeight: imgHeight,
      aspectRatio: parseFloat(aspectRatio.toFixed(2)),
      method: 'image_analysis',
    };
  } catch (err) {
    // Fallback: pure height-based estimate
    const baseForearm = heightCm * 10 * 0.148;
    return {
      success: false,
      forearmLengthMm: Math.round(baseForearm),
      method: 'height_only',
      error: err.message,
    };
  }
}

// ─────────────────────────────────────────────────────────────────
// 5. FULL MATCH PIPELINE
// ─────────────────────────────────────────────────────────────────
function runMatchPipeline(profile, darts, pros) {
  const scoredDarts = darts
    .map(d => ({ ...d, matchScore: scoreDart(d, profile) }))
    .sort((a, b) => b.matchScore - a.matchScore);

  const scoredPros = pros
    .map(p => ({ ...p, similarity: scorePro(p, profile) }))
    .sort((a, b) => b.similarity - a.similarity);

  return {
    profile,
    topDart: scoredDarts[0],
    alternateDarts: scoredDarts.slice(1, 4),
    topPro: scoredPros[0],
    alternatePros: scoredPros.slice(1, 3),
    allScoredDarts: scoredDarts,
  };
}

// ─────────────────────────────────────────────────────────────────
// UTIL
// ─────────────────────────────────────────────────────────────────
function clamp(v, min, max) { return Math.min(max, Math.max(min, v)); }

module.exports = {
  calculateIdealProfile,
  scoreDart,
  scorePro,
  analyzeForearmImage,
  runMatchPipeline,
};
