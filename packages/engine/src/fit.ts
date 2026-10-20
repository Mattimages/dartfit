import { config as defaultConfig, ENGINE_VERSION, type EngineConfig } from './config.js';
import type {
  Answers,
  Balance,
  Estimate,
  Fit,
  HandTier,
  Measurements,
  Reason,
  Shape,
} from './types.js';

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const round = (v: number, step: number) => Math.round(v / step) * step;
const fix = (v: number, step: number) => Number(round(v, step).toFixed(step < 1 ? 2 : 0));

/** Combine two normal estimates by precision weighting. */
export function combine(a: { mu: number; sigma: number }, b: { mu: number; sigma: number }) {
  const wa = 1 / (a.sigma * a.sigma);
  const wb = 1 / (b.sigma * b.sigma);
  return { mu: (a.mu * wa + b.mu * wb) / (wa + wb), sigma: Math.sqrt(1 / (wa + wb)) };
}

function band(
  mu: number,
  sigma: number,
  minHalf: number,
  factor: number,
  step: number,
  lo: number,
  hi: number,
): [number, number] {
  const half = Math.max(minHalf, sigma * factor);
  const a = clamp(fix(mu - half, step), lo, hi);
  const b = clamp(fix(mu + half, step), lo, hi);
  return [a, Math.max(a, b)];
}

/** Ratio of measurement spread to population spread; feeds uncertainty when hand size drives a rule. */
function zSigma(m: Measurements, refSigma: number) {
  return Math.max(m.spreadMm, 0.5) / refSigma;
}

export function handTier(m: Measurements | undefined, cfg: EngineConfig = defaultConfig): HandTier | null {
  if (!m) return null;
  const z = (m.handLengthMm - cfg.reference.handLength.mu) / cfg.reference.handLength.sigma;
  if (z <= cfg.reference.tierZ.small) return 'small';
  if (z >= cfg.reference.tierZ.large) return 'large';
  return 'medium';
}

export function fit(
  measurements: Measurements | undefined,
  answers: Answers,
  cfg: EngineConfig = defaultConfig,
): Fit {
  const reasons: Reason[] = [];
  const m = measurements;
  const handZ = m ? (m.handLengthMm - cfg.reference.handLength.mu) / cfg.reference.handLength.sigma : null;
  const fingerZ = m
    ? (m.middleLengthMm - cfg.reference.middleLength.mu) / cfg.reference.middleLength.sigma
    : null;

  // ── Weight ─────────────────────────────────────────────────────────
  const W = cfg.weight;
  const wPrior = answers.tip === 'steel' ? W.steel : W.soft;
  let w = { mu: wPrior.mu, sigma: wPrior.sigma };
  reasons.push({ code: 'weight_prior', dim: 'weight', params: { mu: wPrior.mu, tip: answers.tip } });

  if (answers.current) {
    const shift = answers.current.feel === 'too_light' ? W.feelShift : answers.current.feel === 'too_heavy' ? -W.feelShift : 0;
    const anchor = { mu: answers.current.weightG + shift, sigma: W.currentSigma };
    const before = w.mu;
    w = combine(w, anchor);
    reasons.push({
      code: 'weight_current',
      dim: 'weight',
      effect: Number((w.mu - before).toFixed(2)),
      params: { current: answers.current.weightG, feel: answers.current.feel, shift },
    });
  }

  const throwShift = W.throwShift[answers.throwStyle];
  if (throwShift !== 0) {
    w.mu += throwShift;
    reasons.push({ code: 'weight_throw', dim: 'weight', effect: throwShift, params: { style: answers.throwStyle } });
  }

  if (handZ !== null && m) {
    const shift = clamp(W.handPerZ * handZ, -W.handCap, W.handCap);
    w.mu += shift;
    w.sigma = Math.hypot(w.sigma, W.handPerZ * zSigma(m, cfg.reference.handLength.sigma));
    if (Math.abs(shift) >= 0.1) {
      reasons.push({
        code: 'weight_hand',
        dim: 'weight',
        effect: Number(shift.toFixed(2)),
        params: { handLengthMm: Math.round(m.handLengthMm) },
      });
    }
  } else if (!answers.current) {
    w.sigma = Math.hypot(w.sigma, W.missingHandSigma);
  }
  const wLimits = answers.tip === 'steel' ? W.steel : W.soft;
  w.mu = clamp(w.mu, wLimits.min, wLimits.max);
  const weight: Estimate = {
    mu: Number(w.mu.toFixed(2)),
    sigma: Number(w.sigma.toFixed(2)),
    band: band(w.mu, w.sigma, W.bandMinHalf, W.bandSigmaFactor, 1, wLimits.min, wLimits.max),
  };

  // ── Length ─────────────────────────────────────────────────────────
  const L = cfg.length;
  let l = { mu: L.byFingers[answers.fingers] as number, sigma: L.sigma };
  reasons.push({ code: 'length_fingers', dim: 'length', params: { fingers: answers.fingers, mu: l.mu } });
  const holdShift = L.hold[answers.hold];
  if (holdShift !== 0) {
    l.mu += holdShift;
    reasons.push({ code: 'length_hold', dim: 'length', effect: holdShift, params: { hold: answers.hold } });
  }
  if (fingerZ !== null && m) {
    const shift = clamp(L.fingerPerZ * fingerZ, -L.fingerCap, L.fingerCap);
    l.mu += shift;
    l.sigma = Math.hypot(l.sigma, L.fingerPerZ * zSigma(m, cfg.reference.middleLength.sigma));
    if (Math.abs(shift) >= 0.25) {
      reasons.push({
        code: 'length_finger',
        dim: 'length',
        effect: Number(shift.toFixed(2)),
        params: { middleLengthMm: Math.round(m.middleLengthMm) },
      });
    }
  } else {
    l.sigma = Math.hypot(l.sigma, L.missingHandSigma);
  }
  if (answers.current?.lengthMm) {
    const before = l.mu;
    l = combine(l, { mu: answers.current.lengthMm, sigma: L.currentSigma });
    reasons.push({
      code: 'length_current',
      dim: 'length',
      effect: Number((l.mu - before).toFixed(2)),
      params: { current: answers.current.lengthMm },
    });
  }
  l.mu = clamp(l.mu, L.min, L.max);
  const length: Estimate = {
    mu: Number(l.mu.toFixed(2)),
    sigma: Number(l.sigma.toFixed(2)),
    band: band(l.mu, l.sigma, L.bandMinHalf, L.bandSigmaFactor, 1, L.min, L.max),
  };

  // ── Diameter ───────────────────────────────────────────────────────
  const D = cfg.diameter;
  let d: { mu: number; sigma: number };
  if (answers.thickness !== 'auto') {
    d = { mu: D.chosen[answers.thickness], sigma: D.chosenSigma };
    reasons.push({ code: 'diameter_chosen', dim: 'diameter', params: { thickness: answers.thickness } });
  } else if (handZ !== null && m) {
    const shift = clamp(D.autoPerZ * handZ, -0.5, 0.5);
    d = { mu: D.autoMu + shift, sigma: D.autoSigma };
    reasons.push({
      code: 'diameter_hand',
      dim: 'diameter',
      effect: Number(shift.toFixed(2)),
      params: { handLengthMm: Math.round(m.handLengthMm) },
    });
  } else {
    d = { mu: D.autoMu, sigma: D.autoSigma * 1.25 };
    reasons.push({ code: 'diameter_default', dim: 'diameter', params: {} });
  }
  d.mu = clamp(d.mu, D.min, D.max);
  const diameter: Estimate = {
    mu: Number(d.mu.toFixed(2)),
    sigma: Number(d.sigma.toFixed(2)),
    band: band(d.mu, d.sigma, D.bandMinHalf, D.bandSigmaFactor, 0.1, D.min, D.max),
  };

  // ── Grip ───────────────────────────────────────────────────────────
  const G = cfg.grip;
  const moistShift = G.moisture[answers.moisture];
  const gMu = clamp(answers.gripFeel + moistShift, G.min, G.max);
  reasons.push({ code: 'grip_feel', dim: 'grip', params: { feel: answers.gripFeel } });
  if (moistShift !== 0) {
    reasons.push({ code: 'grip_moisture', dim: 'grip', effect: moistShift, params: { moisture: answers.moisture } });
  }
  const grip: Estimate = {
    mu: gMu,
    sigma: G.sigma,
    band: band(gMu, G.sigma, G.bandMinHalf, G.bandSigmaFactor, 1, G.min, G.max),
  };

  // ── Balance & shape ────────────────────────────────────────────────
  const B = cfg.balance;
  const bal: Record<Balance, number> = { ...B[answers.hold] };
  if (answers.throwStyle === 'flat') {
    bal.front += B.flatFrontNudge;
    const total = bal.front + bal.centre + bal.rear;
    (Object.keys(bal) as Balance[]).forEach((k) => (bal[k] = bal[k] / total));
  }
  const preferredBalance = (Object.keys(bal) as Balance[]).reduce((a, b) => (bal[b] > bal[a] ? b : a));
  reasons.push({ code: 'balance_hold', dim: 'balance', params: { hold: answers.hold, balance: preferredBalance } });

  const shape: Record<Shape, number> = { straight: 0, torpedo: 0, tapered: 0 };
  (Object.keys(bal) as Balance[]).forEach((b) => {
    const table = cfg.shape[b];
    (Object.keys(table) as Shape[]).forEach((s) => (shape[s] += bal[b] * table[s]));
  });

  // ── Confidence ─────────────────────────────────────────────────────
  const C = cfg.confidence;
  let score = C.base;
  if (m) score += C.handMeasured;
  if (m && m.spreadMm <= C.lowSpreadMm) score += C.lowSpread;
  if (m?.calibrated) score += C.calibrated;
  if (answers.current) score += C.currentDart;
  score = Math.min(1, score);
  const confidence = score >= C.high ? 'high' : score >= C.medium ? 'medium' : 'low';
  reasons.push({
    code: 'confidence',
    dim: 'confidence',
    params: {
      measured: m ? 'yes' : 'no',
      current: answers.current ? 'yes' : 'no',
      spreadMm: m ? Number(m.spreadMm.toFixed(1)) : 'n/a',
    },
  });

  return {
    engineVersion: ENGINE_VERSION,
    tip: answers.tip,
    weight,
    length,
    diameter,
    grip,
    balance: bal,
    shape,
    preferredBalance,
    handTier: handTier(m, cfg),
    confidence,
    confidenceScore: Number(score.toFixed(2)),
    reasons,
  };
}
