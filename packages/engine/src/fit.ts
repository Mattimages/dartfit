import { config as defaultConfig, ENGINE_VERSION, type EngineConfig } from './config.js';
import { massRange, solveIdeal } from './barrel.js';
import type {
  Answers,
  Balance,
  Estimate,
  Fit,
  HandTier,
  Measurements,
  Physics,
  Reason,
  Setup,
  Shape,
} from './types.js';

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const round = (v: number, step: number) => Math.round(v / step) * step;
const fix = (v: number, step: number) => Number(round(v, step).toFixed(step < 1 ? 2 : 0));
const r2 = (v: number) => Number(v.toFixed(2));

interface Normal {
  mu: number;
  sigma: number;
}

/** Combine two normal estimates by precision weighting. */
export function combine(a: Normal, b: Normal): Normal {
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

/**
 * Move a (weight, length, thickness) target that no barrel can have to the nearest one that can.
 * "Nearest" is measured in standard deviations of each estimate, so the least certain dimension
 * gives way first. Tries the standard alloy, then the premium one, and keeps premium only when it
 * is clearly closer to what the player asked for.
 */
export function enforcePhysics(
  w: Normal,
  l: Normal,
  d: Normal,
  limits: { length: [number, number]; diameter: [number, number]; weight: [number, number] },
  cfg: EngineConfig = defaultConfig,
): { w: number; l: number; d: number; tungstenPct: number; adjusted: boolean; cost: number } {
  const P = cfg.physics;
  const search = (pct: number) => {
    const [lo, hi] = massRange(l.mu, d.mu, pct, cfg);
    if (w.mu >= lo && w.mu <= hi) return { w: w.mu, l: l.mu, d: d.mu, cost: 0 };
    let best = { w: w.mu, l: l.mu, d: d.mu, cost: Infinity };
    const lMin = Math.max(limits.length[0], l.mu - 3 * l.sigma);
    const lMax = Math.min(limits.length[1], l.mu + 3 * l.sigma);
    const dMin = Math.max(limits.diameter[0], d.mu - 3 * d.sigma);
    const dMax = Math.min(limits.diameter[1], d.mu + 3 * d.sigma);
    for (let L = lMin; L <= lMax + 1e-9; L += P.grid.lengthStep) {
      for (let D = dMin; D <= dMax + 1e-9; D += P.grid.diameterStep) {
        const [a, b] = massRange(L, D, pct, cfg);
        const W = clamp(clamp(w.mu, a, b), limits.weight[0], limits.weight[1]);
        if (W < a - 1e-6 || W > b + 1e-6) continue;
        const cost = ((W - w.mu) / w.sigma) ** 2 + ((L - l.mu) / l.sigma) ** 2 + ((D - d.mu) / d.sigma) ** 2;
        if (cost < best.cost) best = { w: W, l: L, d: D, cost };
      }
    }
    return best;
  };
  const std = search(P.standardTungsten);
  if (std.cost === 0) return { ...std, tungstenPct: P.standardTungsten, adjusted: false };
  const prem = search(P.premiumTungsten);
  const usePrem = prem.cost + P.upgradeGain < std.cost;
  const pick = usePrem ? prem : std;
  if (!Number.isFinite(pick.cost)) return { w: w.mu, l: l.mu, d: d.mu, cost: Infinity, tungstenPct: P.standardTungsten, adjusted: false };
  return { ...pick, tungstenPct: usePrem ? P.premiumTungsten : P.standardTungsten, adjusted: pick.cost > 0 };
}

/** Where the fingers sit along the barrel, mm from the front. */
export function gripZone(
  m: Measurements | undefined,
  answers: Answers,
  lengthMm: number,
  cfg: EngineConfig = defaultConfig,
): [number, number] {
  const Z = cfg.gripZone;
  const knuckleSpacing = (m?.palmWidthMm ?? cfg.reference.palmWidth.mu) / 3;
  const tip = knuckleSpacing * Z.tipShare;
  const contacts = Math.max(1, answers.fingers - 1); // the thumb sits opposite the other fingers
  const len = Math.min(lengthMm, tip * contacts * Z.overlap + Z.margin);
  const anchor = Z.start[answers.hold] * lengthMm;
  let a = answers.hold === 'front' ? anchor : answers.hold === 'rear' ? anchor - len : anchor - len / 2;
  a = clamp(a, 0, lengthMm - len);
  return [Number(a.toFixed(1)), Number((a + len).toFixed(1))];
}

export function setupFor(answers: Answers, weightMid: number, cfg: EngineConfig = defaultConfig): Setup {
  const S = cfg.setup;
  const shaft = S.shaft[answers.throwStyle];
  let flight = S.flight[answers.throwStyle];
  // Very light and very heavy barrels both want the steadier standard flight.
  if (weightMid <= S.lightDartG || weightMid >= S.heavyDartG) flight = 'standard';
  const longPoint = answers.hold === 'front';
  return {
    shaft,
    shaftMm: [...S.shaftMm[shaft]] as [number, number],
    flight,
    pointMm: [...(longPoint ? S.pointMm.long : S.pointMm.standard)] as [number, number],
    longPoint,
  };
}

export function fit(
  measurements: Measurements | undefined,
  answers: Answers,
  cfg: EngineConfig = defaultConfig,
): Fit {
  const reasons: Reason[] = [];
  const m = measurements;
  const cur = answers.current;
  const ref = cfg.reference;
  const handZ = m ? (m.handLengthMm - ref.handLength.mu) / ref.handLength.sigma : null;
  const fingerZ = m ? (m.middleLengthMm - ref.middleLength.mu) / ref.middleLength.sigma : null;
  const palmZ = m ? (m.palmWidthMm - ref.palmWidth.mu) / ref.palmWidth.sigma : null;

  // ── Weight ─────────────────────────────────────────────────────────
  const W = cfg.weight;
  const wPrior = answers.tip === 'steel' ? W.steel : W.soft;
  let w: Normal = { mu: wPrior.mu, sigma: wPrior.sigma };
  reasons.push({ code: 'weight_prior', dim: 'weight', params: { mu: wPrior.mu, tip: answers.tip } });

  if (cur) {
    const shift = cur.feel === 'too_light' ? W.feelShift : cur.feel === 'too_heavy' ? -W.feelShift : 0;
    const before = w.mu;
    w = combine(w, { mu: cur.weightG + shift, sigma: W.currentSigma });
    reasons.push({
      code: 'weight_current',
      dim: 'weight',
      effect: r2(w.mu - before),
      params: { current: cur.weightG, feel: cur.feel, shift },
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
    w.sigma = Math.hypot(w.sigma, W.handPerZ * zSigma(m, ref.handLength.sigma));
    if (Math.abs(shift) >= 0.1) {
      reasons.push({ code: 'weight_hand', dim: 'weight', effect: r2(shift), params: { handLengthMm: Math.round(m.handLengthMm) } });
    }
  } else if (!cur) {
    w.sigma = Math.hypot(w.sigma, W.missingHandSigma);
  }
  const wLimits = answers.tip === 'steel' ? W.steel : W.soft;
  w.mu = clamp(w.mu, wLimits.min, wLimits.max);

  // ── Length ─────────────────────────────────────────────────────────
  const L = cfg.length;
  let l: Normal = { mu: L.byFingers[answers.fingers] as number, sigma: L.sigma };
  reasons.push({ code: 'length_fingers', dim: 'length', params: { fingers: answers.fingers, mu: l.mu } });
  const holdShift = L.hold[answers.hold];
  if (holdShift !== 0) {
    l.mu += holdShift;
    reasons.push({ code: 'length_hold', dim: 'length', effect: holdShift, params: { hold: answers.hold } });
  }
  if (fingerZ !== null && palmZ !== null && m) {
    // Longer fingers reach further along the barrel; wider fingers cover more of it.
    const shift = clamp(L.fingerPerZ * fingerZ + L.palmPerZ * palmZ, -L.fingerCap, L.fingerCap);
    l.mu += shift;
    l.sigma = Math.hypot(l.sigma, L.fingerPerZ * zSigma(m, ref.middleLength.sigma));
    if (Math.abs(shift) >= 0.25) {
      reasons.push({
        code: 'length_finger',
        dim: 'length',
        effect: r2(shift),
        params: { middleLengthMm: Math.round(m.middleLengthMm), palmWidthMm: Math.round(m.palmWidthMm) },
      });
    }
  } else {
    l.sigma = Math.hypot(l.sigma, L.missingHandSigma);
  }
  if (cur?.lengthMm) {
    const step = cur.lengthFeel === 'too_short' ? L.feelStep : cur.lengthFeel === 'too_long' ? -L.feelStep : 0;
    const sigma = cur.lengthFeel && cur.lengthFeel !== 'right' ? L.feelSigma : L.currentSigma;
    const before = l.mu;
    l = combine(l, { mu: cur.lengthMm + step, sigma });
    reasons.push({
      code: 'length_current',
      dim: 'length',
      effect: r2(l.mu - before),
      params: { current: cur.lengthMm, feel: cur.lengthFeel ?? 'right' },
    });
  }
  l.mu = clamp(l.mu, L.min, L.max);

  // ── Diameter ───────────────────────────────────────────────────────
  const D = cfg.diameter;
  let d: Normal;
  if (answers.thickness !== 'auto') {
    d = { mu: D.chosen[answers.thickness], sigma: D.chosenSigma };
    reasons.push({ code: 'diameter_chosen', dim: 'diameter', params: { thickness: answers.thickness } });
  } else if (handZ !== null && palmZ !== null && m) {
    const shift = clamp(D.autoPerZ * handZ + D.palmPerZ * palmZ, -0.5, 0.5);
    d = { mu: D.autoMu + shift, sigma: D.autoSigma };
    reasons.push({
      code: 'diameter_hand',
      dim: 'diameter',
      effect: r2(shift),
      params: { handLengthMm: Math.round(m.handLengthMm), palmWidthMm: Math.round(m.palmWidthMm) },
    });
  } else {
    d = { mu: D.autoMu, sigma: D.autoSigma * 1.25 };
    reasons.push({ code: 'diameter_default', dim: 'diameter', params: {} });
  }
  if (cur?.diameterMm) {
    const step = cur.thicknessFeel === 'too_thin' ? D.feelStep : cur.thicknessFeel === 'too_thick' ? -D.feelStep : 0;
    const before = d.mu;
    d = combine(d, { mu: cur.diameterMm + step, sigma: D.currentSigma * (step ? 1.4 : 1) });
    reasons.push({
      code: 'diameter_current',
      dim: 'diameter',
      effect: r2(d.mu - before),
      params: { current: cur.diameterMm, feel: cur.thicknessFeel ?? 'right' },
    });
  }
  d.mu = clamp(d.mu, D.min, D.max);

  // ── Physics: the three must describe a barrel that can exist ───────
  const phys = enforcePhysics(w, l, d, {
    length: [L.min, L.max],
    diameter: [D.min, D.max],
    weight: [wLimits.min, wLimits.max],
  }, cfg);
  if (phys.adjusted) {
    reasons.push({
      code: 'physics_adjusted',
      dim: 'weight',
      params: {
        weightFrom: r2(w.mu),
        weightTo: r2(phys.w),
        lengthFrom: r2(l.mu),
        lengthTo: r2(phys.l),
        diameterFrom: r2(d.mu),
        diameterTo: r2(phys.d),
      },
    });
    w = { ...w, mu: phys.w };
    l = { ...l, mu: phys.l };
    d = { ...d, mu: phys.d };
  }
  if (phys.tungstenPct !== cfg.physics.standardTungsten) {
    reasons.push({ code: 'physics_tungsten', dim: 'weight', params: { pct: phys.tungstenPct } });
  }

  const weight: Estimate = {
    mu: r2(w.mu),
    sigma: r2(w.sigma),
    band: band(w.mu, w.sigma, W.bandMinHalf, W.bandSigmaFactor, 1, wLimits.min, wLimits.max),
  };
  const length: Estimate = {
    mu: r2(l.mu),
    sigma: r2(l.sigma),
    band: band(l.mu, l.sigma, L.bandMinHalf, L.bandSigmaFactor, 1, L.min, L.max),
  };
  const diameter: Estimate = {
    mu: r2(d.mu),
    sigma: r2(d.sigma),
    band: band(d.mu, d.sigma, D.bandMinHalf, D.bandSigmaFactor, 0.1, D.min, D.max),
  };

  // ── Grip ───────────────────────────────────────────────────────────
  const G = cfg.grip;
  const moistShift = G.moisture[answers.moisture];
  let g: Normal = { mu: answers.gripFeel + moistShift, sigma: G.sigma };
  reasons.push({ code: 'grip_feel', dim: 'grip', params: { feel: answers.gripFeel } });
  if (moistShift !== 0) {
    reasons.push({ code: 'grip_moisture', dim: 'grip', effect: moistShift, params: { moisture: answers.moisture } });
  }
  if (cur?.gripIntensity) {
    const step = cur.gripFeel === 'too_smooth' ? G.feelStep : cur.gripFeel === 'too_sharp' ? -G.feelStep : 0;
    const before = g.mu;
    g = combine(g, { mu: cur.gripIntensity + step, sigma: G.currentSigma });
    reasons.push({
      code: 'grip_current',
      dim: 'grip',
      effect: r2(g.mu - before),
      params: { current: cur.gripIntensity, feel: cur.gripFeel ?? 'right' },
    });
  }
  const gMu = clamp(g.mu, G.min, G.max);
  const grip: Estimate = {
    mu: r2(gMu),
    sigma: r2(g.sigma),
    band: band(gMu, g.sigma, G.bandMinHalf, G.bandSigmaFactor, 1, G.min, G.max),
  };

  // ── Balance & shape ────────────────────────────────────────────────
  const B = cfg.balance;
  const bal: Record<Balance, number> = { ...B[answers.hold] };
  const normalise = () => {
    const total = bal.front + bal.centre + bal.rear;
    (Object.keys(bal) as Balance[]).forEach((k) => (bal[k] = bal[k] / total));
  };
  if (answers.throwStyle === 'flat') {
    bal.front += B.flatFrontNudge;
    normalise();
  }
  const likesCurrent =
    cur?.balance &&
    cur.feel === 'right' &&
    (cur.gripFeel ?? 'right') === 'right' &&
    (cur.thicknessFeel ?? 'right') === 'right' &&
    (cur.lengthFeel ?? 'right') === 'right';
  if (likesCurrent && cur?.balance) {
    bal[cur.balance] += B.currentNudge;
    normalise();
    reasons.push({ code: 'balance_current', dim: 'balance', params: { balance: cur.balance } });
  }
  const preferredBalance = (Object.keys(bal) as Balance[]).reduce((a, b) => (bal[b] > bal[a] ? b : a));
  reasons.push({ code: 'balance_hold', dim: 'balance', params: { hold: answers.hold, balance: preferredBalance } });

  const shape: Record<Shape, number> = { straight: 0, torpedo: 0, tapered: 0, bomb: 0, scalloped: 0 };
  (Object.keys(bal) as Balance[]).forEach((b) => {
    const table = cfg.shape[b] as Record<Shape, number>;
    (Object.keys(table) as Shape[]).forEach((s) => (shape[s] += bal[b] * table[s]));
  });

  // ── The ideal barrel ───────────────────────────────────────────────
  const cogFrac = (Object.keys(bal) as Balance[]).reduce((s, b) => s + bal[b] * B.cogFrac[b], 0);
  const zone = gripZone(m, answers, l.mu, cfg);
  const barrel = solveIdeal(
    { massG: w.mu, lengthMm: r2(l.mu), diameterMm: r2(d.mu), cogFrac, tungstenPct: phys.tungstenPct },
    zone,
    cfg,
  );
  const range = massRange(l.mu, d.mu, phys.tungstenPct, cfg);
  const physics: Physics = {
    tungstenPct: phys.tungstenPct,
    adjusted: phys.adjusted,
    massRange: [Number(range[0].toFixed(1)), Number(range[1].toFixed(1))],
  };

  // ── Setup ──────────────────────────────────────────────────────────
  const setup = setupFor(answers, w.mu, cfg);

  // ── Confidence ─────────────────────────────────────────────────────
  const C = cfg.confidence;
  let score: number = C.base;
  if (m) score += C.handMeasured;
  if (m && m.spreadMm <= C.lowSpreadMm) score += C.lowSpread;
  if (m?.calibrated) score += C.calibrated;
  if (cur) score += C.currentDart;
  score = Math.min(1, score);
  const confidence = score >= C.high ? 'high' : score >= C.medium ? 'medium' : 'low';
  reasons.push({
    code: 'confidence',
    dim: 'confidence',
    params: {
      measured: m ? 'yes' : 'no',
      current: cur ? 'yes' : 'no',
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
    physics,
    barrel,
    setup,
  };
}
