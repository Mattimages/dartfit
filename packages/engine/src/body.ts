/**
 * Body size in the fit.
 *
 *  1. Height → hand size, when there is no scan (anthropometric ratio; wide on purpose), and a
 *     consistency check when there is one.
 *  2. Height + forearm → the throw's geometry. Release height follows from stature, release speed
 *     from the elbow lever (forearm + half the hand). Projectile physics then gives the launch angle
 *     needed to reach the bull from there. A higher release and a longer lever need a flatter
 *     launch; a low release and short lever need an arc. That predicts throw style for players who
 *     answer "not sure", which moves weight and setup the same way the throw-style answer does.
 */
import { config as defaultConfig } from './config.js';
import type { Answers, Measurements, ThrowStyle, Trajectory } from './types.js';

type EngineConfig = typeof defaultConfig;

const clamp = (x: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, x));

/** Hand length (mm) expected from stature, with its spread. */
export function handFromHeight(heightCm: number, cfg: EngineConfig = defaultConfig) {
  return { mu: heightCm * 10 * cfg.body.handPerHeight, sigma: cfg.body.handFromHeightSigma };
}

/**
 * Estimated measurements from height alone (no scan): every dimension scaled from the reference
 * hand, with the height-to-hand spread as the measurement spread, so downstream evidence is weak.
 */
export function measurementsFromHeight(heightCm: number, cfg: EngineConfig = defaultConfig): Measurements {
  const hand = handFromHeight(heightCm, cfg);
  const s = hand.mu / cfg.reference.handLength.mu;
  const r1 = (x: number) => Number(x.toFixed(1));
  return {
    handLengthMm: r1(hand.mu),
    palmWidthMm: r1(cfg.reference.palmWidth.mu * s),
    indexLengthMm: r1(78 * s),
    middleLengthMm: r1(cfg.reference.middleLength.mu * s),
    thumbIndexSpanMm: r1(120 * s),
    spreadMm: hand.sigma,
    samples: 0,
    calibrated: false,
    estimatedFrom: 'height',
  };
}

/** Launch angle (rad) that reaches a target Δh above the release point at horizontal distance D. */
export function launchAngle(D: number, dh: number, v: number, g: number): number {
  const a = (g * D * D) / (2 * v * v);
  const disc = D * D - 4 * a * (dh + a);
  // Out of reach at this speed: the steepest useful angle (45°) is the honest answer.
  if (disc < 0) return Math.PI / 4;
  return Math.atan((D - Math.sqrt(disc)) / (2 * a));
}

function angleFor(heightCm: number, forearmCm: number, handMm: number, cfg: EngineConfig) {
  const B = cfg.body;
  const releaseHeightM = (heightCm - B.eyeBelowTopCm) / 100;
  const leverM = (forearmCm + handMm / 20) / 100;
  const v = B.elbowOmega * leverM;
  const D = B.ocheM - B.reachM;
  const angle = launchAngle(D, B.bullHeightM - releaseHeightM, v, B.gravity);
  return { releaseHeightM, v, angleDeg: (angle * 180) / Math.PI };
}

/** The throw's geometry from body size. Null without a height. */
export function trajectory(
  answers: Pick<Answers, 'heightCm' | 'forearmCm'>,
  m: Measurements | undefined,
  cfg: EngineConfig = defaultConfig,
): Trajectory | null {
  const B = cfg.body;
  const H = answers.heightCm;
  if (!H) return null;
  const handMm = m?.handLengthMm ?? handFromHeight(H, cfg).mu;
  const forearmEstimated = !answers.forearmCm;
  const forearmCm = answers.forearmCm ?? H * B.forearmPerHeight;
  const me = angleFor(H, forearmCm, handMm, cfg);
  const refH = B.reference.heightCm;
  const ref = angleFor(refH, refH * B.forearmPerHeight, handFromHeight(refH, cfg).mu, cfg);
  return {
    heightCm: H,
    forearmCm: Number(forearmCm.toFixed(1)),
    forearmEstimated,
    releaseHeightM: Number(me.releaseHeightM.toFixed(2)),
    releaseSpeedMs: Number(me.v.toFixed(1)),
    angleDeg: Number(me.angleDeg.toFixed(1)),
    referenceAngleDeg: Number(ref.angleDeg.toFixed(1)),
    flatness: Number(clamp((ref.angleDeg - me.angleDeg) / B.angleSpanDeg, -1, 1).toFixed(2)),
  };
}

/** Throw style to use: what the player said, else what their geometry suggests. */
export function effectiveThrowStyle(
  answers: Answers,
  traj: Trajectory | null,
  cfg: EngineConfig = defaultConfig,
): ThrowStyle {
  if (answers.throwStyle !== 'unsure' || !traj) return answers.throwStyle;
  if (traj.flatness >= cfg.body.styleThreshold) return 'flat';
  if (traj.flatness <= -cfg.body.styleThreshold) return 'arc';
  return 'unsure';
}
