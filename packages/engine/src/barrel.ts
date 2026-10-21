/**
 * A physical model of a dart barrel.
 *
 * A barrel is a solid of revolution: radius r(x) along its length x (0 = point end). Its mass is
 *   m = ρ · k · (∫ π r(x)² dx − bore volume)
 * where ρ is the alloy density, the bore is the point hole at the front and the 2BA thread at the
 * back, and k (< 1) is the share of metal left after grip machining. k is calibrated on the
 * catalogue's straight barrels, so the model is anchored on real, listed darts.
 *
 * This lets the engine answer three questions the old model could not:
 *  1. Is a target (weight, length, thickness) physically possible at 90% tungsten? At 95%?
 *  2. What does the theoretical ideal barrel look like (its profile, centre of gravity, grip zone)?
 *  3. Where is the centre of gravity of a catalogue dart, given its listed shape?
 */
import { config as defaultConfig, type EngineConfig } from './config.js';
import type { Balance, IdealBarrel, Profile, Shape, Variant } from './types.js';

/*
 * Profile: radius as fractions of the maximum radius — rises over the front taper (`front`, a
 * fraction of the length), stays flat, falls over the rear taper (`rear`). `endFront`/`endRear` are
 * the radii at the very ends; `waist` is the depth of a mid-barrel dip (scalloped barrels).
 */

export interface BarrelGeometry {
  lengthMm: number;
  diameterMm: number;
  profile: Profile;
}

export interface BarrelMetrics {
  massG: number;
  /** Centre of gravity, mm from the front (point end) of the barrel. */
  cogMm: number;
  /** Centre of gravity as a fraction of the length (0.5 = centre). */
  cogFrac: number;
}

/** Density of the barrel alloy in g/cm³. Brass when tungsten is 0. */
export function density(tungstenPct: number, cfg: EngineConfig = defaultConfig): number {
  const table = cfg.physics.density;
  if (tungstenPct <= 0) return table.brass;
  const pts: Array<[number, number]> = [
    [80, table.w80],
    [85, table.w85],
    [90, table.w90],
    [92.5, table.w925],
    [95, table.w95],
    [97, table.w97],
  ];
  if (tungstenPct <= pts[0]![0]) return pts[0]![1];
  for (let i = 1; i < pts.length; i++) {
    const [x1, y1] = pts[i]!;
    const [x0, y0] = pts[i - 1]!;
    if (tungstenPct <= x1) return y0 + ((tungstenPct - x0) / (x1 - x0)) * (y1 - y0);
  }
  return pts.at(-1)![1];
}

/** Radius fraction (0..1) at position t ∈ [0,1] along the barrel. */
export function radiusAt(p: Profile, t: number): number {
  let f = 1;
  if (p.front > 0 && t < p.front) f = p.endFront + (1 - p.endFront) * (t / p.front);
  else if (p.rear > 0 && t > 1 - p.rear) f = p.endRear + (1 - p.endRear) * ((1 - t) / p.rear);
  if (p.waist > 0) {
    // A smooth dip centred between the tapers.
    const mid = (p.front + (1 - p.rear)) / 2;
    const half = Math.max(0.05, (1 - p.rear - p.front) / 2);
    const u = (t - mid) / half;
    if (Math.abs(u) < 1) f -= p.waist * 0.5 * (1 + Math.cos(Math.PI * u));
  }
  return Math.max(0, f);
}

const STEPS = 240;

/**
 * Mass and centre of gravity of a barrel. Bores are subtracted at their positions so they shift the
 * centre of gravity the way they do in a real barrel (the rear thread removes more metal).
 */
export function barrelMetrics(
  g: BarrelGeometry,
  tungstenPct: number,
  cfg: EngineConfig = defaultConfig,
  gripIntensity: number | null = null,
): BarrelMetrics {
  const P = cfg.physics;
  const R = g.diameterMm / 2;
  const L = g.lengthMm;
  const dx = L / STEPS;
  const boreF = Math.PI * (P.bore.frontDiaMm / 2) ** 2;
  const boreR = Math.PI * (P.bore.rearDiaMm / 2) ** 2;
  let vol = 0;
  let moment = 0;
  for (let i = 0; i < STEPS; i++) {
    const x = (i + 0.5) * dx;
    const r = R * radiusAt(g.profile, x / L);
    let area = Math.PI * r * r;
    if (x < P.bore.frontDepthMm) area -= Math.min(area, boreF);
    if (x > L - P.bore.rearDepthMm) area -= Math.min(area, boreR);
    vol += area * dx;
    moment += area * dx * x;
  }
  const k = P.machiningFactor * (1 - P.gripSlope * ((gripIntensity ?? 3) - 3));
  const massG = (density(tungstenPct, cfg) * k * vol) / 1000;
  const cogMm = vol > 0 ? moment / vol : L / 2;
  return { massG, cogMm, cogFrac: cogMm / L };
}

/** Reference profile for each listed shape class. Used to draw catalogue darts and to bound mass. */
export function shapeProfile(
  shape: Shape | null,
  balance: Balance | null,
  cfg: EngineConfig = defaultConfig,
): Profile {
  const S = cfg.physics.shapes;
  const base = { endFront: S.endRatio, endRear: S.endRatio, waist: 0 };
  switch (shape) {
    case 'torpedo':
      return { ...base, ...S.torpedo };
    case 'tapered':
      // Retailers use "tapered" for both directions; the listed balance tells which end is heavy.
      return balance === 'rear'
        ? { ...base, front: S.tapered.rear, rear: S.tapered.front }
        : { ...base, ...S.tapered };
    case 'bomb':
      return { ...base, ...S.bomb };
    case 'scalloped':
      return { ...base, ...S.straight, waist: S.scallopWaist };
    case 'straight':
    default:
      return { ...base, ...S.straight };
  }
}

/** Heaviest and lightest barrel of this length and thickness that still looks like a dart. */
export function massRange(
  lengthMm: number,
  diameterMm: number,
  tungstenPct: number,
  cfg: EngineConfig = defaultConfig,
): [number, number] {
  const S = cfg.physics.shapes;
  const heavy = barrelMetrics(
    { lengthMm, diameterMm, profile: { ...S.straight, endFront: S.endRatio, endRear: S.endRatio, waist: 0 } },
    tungstenPct,
    cfg,
  );
  const light = barrelMetrics(
    {
      lengthMm,
      diameterMm,
      profile: {
        front: S.lightest.front,
        rear: S.lightest.rear,
        endFront: S.lightest.end,
        endRear: S.lightest.end,
        waist: 0,
      },
    },
    tungstenPct,
    cfg,
  );
  return [light.massG, heavy.massG];
}

/** Classify a solved profile into the shape names shops use. */
export function classify(p: Profile): Shape {
  if (p.waist > 0.03) return 'scalloped';
  const flat = 1 - p.front - p.rear;
  if (p.front >= 0.25 && p.rear >= 0.3 && flat < 0.4) return 'bomb';
  if (p.rear - p.front >= 0.3 && flat < 0.45) return p.front >= 0.15 ? 'torpedo' : 'tapered';
  if (p.front - p.rear >= 0.3 && flat < 0.45) return 'tapered';
  return 'straight';
}

/**
 * Solve the profile of the ideal barrel: the tapers that make a barrel of the given length and
 * thickness weigh exactly the target and put the centre of gravity where the grip wants it.
 * Grid search over the two taper lengths; small, deterministic and fast (≈ 2,000 evaluations).
 */
export function solveIdeal(
  target: { massG: number; lengthMm: number; diameterMm: number; cogFrac: number; tungstenPct: number },
  gripZone: [number, number],
  cfg: EngineConfig = defaultConfig,
): IdealBarrel {
  const S = cfg.physics.shapes;
  let best: { p: Profile; m: BarrelMetrics; err: number; cost: number } | null = null;
  for (let f = S.solver.min; f <= S.solver.max + 1e-9; f += S.solver.step) {
    for (let r = S.solver.min; r <= S.solver.max + 1e-9; r += S.solver.step) {
      if (f + r > 0.97) continue;
      const p: Profile = { front: f, rear: r, endFront: S.endRatio, endRear: S.endRatio, waist: 0 };
      const m = barrelMetrics(
        { lengthMm: target.lengthMm, diameterMm: target.diameterMm, profile: p },
        target.tungstenPct,
        cfg,
      );
      const err = (m.massG - target.massG) / target.massG;
      // Mass must be right (it is what the player feels most); then the centre of gravity;
      // then prefer the simplest shape (short tapers) among equals.
      const cost = (err / 0.01) ** 2 + ((m.cogFrac - target.cogFrac) / 0.01) ** 2 + 0.5 * (f + r);
      if (!best || cost < best.cost) best = { p, m, err, cost };
    }
  }
  const b = best!;
  return {
    lengthMm: target.lengthMm,
    diameterMm: target.diameterMm,
    massG: Number(b.m.massG.toFixed(1)),
    tungstenPct: target.tungstenPct,
    profile: roundProfile(b.p),
    cogMm: Number(b.m.cogMm.toFixed(1)),
    cogFrac: Number(b.m.cogFrac.toFixed(3)),
    shape: classify(b.p),
    gripZone,
    massError: Number(b.err.toFixed(3)),
  };
}

const roundProfile = (p: Profile): Profile => ({
  front: Number(p.front.toFixed(3)),
  rear: Number(p.rear.toFixed(3)),
  endFront: p.endFront,
  endRear: p.endRear,
  waist: p.waist,
});

/** Estimated geometry and centre of gravity of a catalogue dart from its listed shape. */
export function variantBarrel(v: Variant, cfg: EngineConfig = defaultConfig): BarrelGeometry & BarrelMetrics {
  const profile = shapeProfile(v.shape, v.balance, cfg);
  const g = { lengthMm: v.lengthMm, diameterMm: v.diameterMm, profile };
  return { ...g, ...barrelMetrics(g, v.tungstenPct, cfg, v.gripIntensity) };
}

/**
 * Calibrate the machining factor k on catalogue barrels of a given shape: the median ratio of the
 * listed mass to the mass a solid barrel of that profile would have (k = 1).
 */
export function calibrateMachining(
  variants: Variant[],
  cfg: EngineConfig = defaultConfig,
): { k: number; gripSlope: number; n: number; spread: number } {
  const straight = variants.filter((v) => v.shape === 'straight' && v.tungstenPct >= 80);
  const stats = (slope: number) => {
    const unit = {
      ...cfg,
      physics: { ...cfg.physics, machiningFactor: 1, gripSlope: slope },
    } as unknown as EngineConfig;
    const ratios = straight
      .map((v) => {
        const solid = barrelMetrics(
          { lengthMm: v.lengthMm, diameterMm: v.diameterMm, profile: shapeProfile('straight', null, cfg) },
          v.tungstenPct,
          unit,
          v.gripIntensity,
        ).massG;
        return v.weightG / solid;
      })
      .sort((a, b) => a - b);
    const mid = ratios[ratios.length >> 1] ?? 1;
    const q1 = ratios[Math.floor(ratios.length * 0.25)] ?? mid;
    const q3 = ratios[Math.floor(ratios.length * 0.75)] ?? mid;
    return { k: mid, spread: (q3 - q1) / mid };
  };
  let best = { slope: 0, ...stats(0) };
  for (let s = 0.005; s <= 0.08 + 1e-9; s += 0.005) {
    const r = stats(s);
    if (r.spread < best.spread - 1e-6) best = { slope: s, ...r };
  }
  return { k: best.k, gripSlope: Number(best.slope.toFixed(3)), n: straight.length, spread: best.spread };
}

/**
 * Listings whose weight cannot be right for their size and alloy. Returns the ratio listed/model
 * for every flagged variant. Thresholds come from config.physics.specCheck.
 */
export function physicsOutliers(
  variants: Variant[],
  cfg: EngineConfig = defaultConfig,
): Array<{ id: string; listedG: number; modelG: number; ratio: number }> {
  const [lo, hi] = cfg.physics.specCheck;
  return variants
    .map((v) => {
      const modelG = variantBarrel(v, cfg).massG;
      return {
        id: v.id,
        listedG: v.weightG,
        modelG: Number(modelG.toFixed(1)),
        ratio: Number((v.weightG / modelG).toFixed(3)),
      };
    })
    .filter((r) => r.ratio < lo || r.ratio > hi);
}
