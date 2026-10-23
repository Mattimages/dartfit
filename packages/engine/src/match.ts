import { config as defaultConfig, type EngineConfig } from './config.js';
import { fit as runFit } from './fit.js';
import type {
  Answers,
  Dim,
  DimCheck,
  Estimate,
  Fit,
  Measurements,
  Pick,
  PickReason,
  Pro,
  Quality,
  Recommendation,
  ScoredVariant,
  Shape,
  Variant,
} from './types.js';

type NumDim = 'weight' | 'length' | 'diameter' | 'grip';

function numericValue(v: Variant, dim: NumDim): number | null {
  switch (dim) {
    case 'weight':
      return v.weightG;
    case 'length':
      return v.lengthMm;
    case 'diameter':
      return v.diameterMm;
    case 'grip':
      return v.gripIntensity;
  }
}

function status(value: number, est: Estimate, near: number): DimCheck['status'] {
  const [lo, hi] = est.band;
  if (value >= lo && value <= hi) return 'in';
  const half = Math.max((hi - lo) / 2, 0.01);
  const dist = value < lo ? lo - value : value - hi;
  return dist <= half * (near - 1) + 1e-9 ? 'near' : 'out';
}

/** Score one variant against a fit. Lower cost is better; 0 is a perfect match. */
export function scoreVariant(f: Fit, v: Variant, cfg: EngineConfig = defaultConfig): ScoredVariant {
  const M = cfg.match;
  const checks: DimCheck[] = [];
  let cost = 0;

  for (const dim of ['weight', 'length', 'diameter', 'grip'] as NumDim[]) {
    const est = f[dim];
    const val = numericValue(v, dim);
    if (val === null) {
      // Missing data must never beat a known value: score it as the catalogue-typical value,
      // then add a surcharge for not knowing.
      const assumed = dim === 'grip' ? M.unknownGripAssumed : est.mu;
      const s = Math.hypot(est.sigma, M.tolerance[dim]);
      const z = (assumed - est.mu) / s;
      const term = M.weights[dim] * z * z + M.unknownSurcharge;
      cost += term;
      checks.push({ dim, status: 'unknown', value: null, term: Number(term.toFixed(3)) });
      continue;
    }
    const s = Math.hypot(est.sigma, M.tolerance[dim]);
    const z = (val - est.mu) / s;
    const term = M.weights[dim] * z * z;
    cost += term;
    checks.push({ dim, status: status(val, est, M.nearFactor), value: val, term: Number(term.toFixed(3)) });
  }

  // Categorical dims: penalty relative to the most-preferred option, so the best option costs 0.
  const pMaxBal = Math.max(...Object.values(f.balance));
  const pBal = v.balance ? f.balance[v.balance] : M.unknownBalanceP;
  const balTerm = M.weights.balance * Math.max(0, Math.log(pMaxBal / Math.max(pBal, M.minP)));
  cost += balTerm;
  checks.push({
    dim: 'balance',
    status: !v.balance ? 'unknown' : v.balance === f.preferredBalance ? 'in' : balTerm < 1 ? 'near' : 'out',
    value: v.balance,
    term: Number(balTerm.toFixed(3)),
  });

  const pMaxShape = Math.max(...Object.values(f.shape));
  const pShape = v.shape ? f.shape[v.shape] : M.unknownBalanceP * pMaxShape;
  const shapeTerm = M.weights.shape * Math.max(0, Math.log(pMaxShape / Math.max(pShape, M.minP)));
  cost += shapeTerm;
  const bestShape = topShape(f);
  checks.push({
    dim: 'shape',
    status: !v.shape ? 'unknown' : v.shape === bestShape ? 'in' : shapeTerm < 0.5 ? 'near' : 'out',
    value: v.shape,
    term: Number(shapeTerm.toFixed(3)),
  });

  return { variant: v, cost: Number(cost.toFixed(3)), quality: qualityOf(cost, cfg), checks };
}

const SHAPE_DIMS = ['weight', 'length', 'diameter'] as const;
const STYLE_DIMS = ['shape', 'grip', 'balance'] as const;

export interface MatchPart {
  pct: number;
  items: Array<{ dim: DimCheck['dim']; status: DimCheck['status'] }>;
}
/** A dart's match split in two: shape (weight, length, thickness) and style (shape type, knurling, balance). */
export interface MatchBreakdown {
  shape: MatchPart;
  style: MatchPart;
  total: number;
}

export const matchPctOf = (cost: number, scale: number) =>
  Math.max(1, Math.min(99, Math.round(100 * Math.exp(-cost / scale))));

/**
 * The total is the usual match score. Each part uses the same curve with its share of the match
 * weights, so the total is the weighted geometric mean of the two (shape ≈ 72%, style ≈ 28%).
 */
export function matchBreakdown(s: ScoredVariant, cfg: EngineConfig = defaultConfig): MatchBreakdown {
  const W = cfg.match.weights;
  const all = Object.values(W).reduce((a, b) => a + b, 0);
  const part = (dims: readonly DimCheck['dim'][]): MatchPart => {
    const share = dims.reduce((a, d) => a + (W as Record<string, number>)[d]!, 0) / all;
    const checks = dims.map((d) => s.checks.find((c) => c.dim === d)).filter((c): c is DimCheck => !!c);
    const cost = checks.reduce((a, c) => a + c.term, 0);
    return {
      pct: matchPctOf(cost, cfg.match.displayScale * share),
      items: checks.map((c) => ({ dim: c.dim, status: c.status })),
    };
  };
  return {
    shape: part(SHAPE_DIMS),
    style: part(STYLE_DIMS),
    total: matchPctOf(s.cost, cfg.match.displayScale),
  };
}

export function topShape(f: Fit): Shape {
  return (Object.keys(f.shape) as Shape[]).reduce((a, b) => (f.shape[b] > f.shape[a] ? b : a));
}

export function qualityOf(cost: number, cfg: EngineConfig = defaultConfig): Quality {
  const q = cfg.match.quality;
  return cost <= q.excellent ? 'excellent' : cost <= q.good ? 'good' : cost <= q.fair ? 'fair' : 'poor';
}

function explain(f: Fit, s: ScoredVariant, cfg: EngineConfig): PickReason[] {
  const why: PickReason[] = [];
  const measurable = s.checks.filter((c) => c.status !== 'unknown');
  // Strengths: the two in-band dims with the smallest terms, weight and length first on ties.
  const order: Dim[] = ['weight', 'length', 'diameter', 'grip', 'balance', 'shape'];
  const strengths = measurable
    .filter((c) => c.status === 'in')
    .sort((a, b) => a.term - b.term || order.indexOf(a.dim) - order.indexOf(b.dim))
    .slice(0, 2);
  for (const c of strengths) why.push(reasonFor(f, c, 'strength'));
  const worst = [...measurable].sort((a, b) => b.term - a.term)[0];
  if (worst && worst.term >= cfg.match.strongTerm && worst.status !== 'in') {
    why.push(reasonFor(f, worst, 'compromise'));
  }
  return why;
}

function reasonFor(f: Fit, c: DimCheck, kind: PickReason['kind']): PickReason {
  if (c.dim === 'balance')
    return { kind, dim: c.dim, value: c.value ?? 'unknown', preferred: f.preferredBalance };
  if (c.dim === 'shape') return { kind, dim: c.dim, value: c.value ?? 'unknown', preferred: topShape(f) };
  const est = f[c.dim as NumDim];
  return { kind, dim: c.dim, value: c.value as number, band: est.band };
}

export interface RecommendOptions {
  budgetUsd?: number;
  /** Variant ids that have at least one live offer for the user's country. Omit to skip this filter. */
  available?: Set<string>;
}

/**
 * Rank the catalogue and return up to four distinct picks:
 * best, the next-best alternative, a value pick (cheapest close match) and a branch-out pick
 * (a different barrel shape or brand that still fits well) so users can explore.
 */
export function recommend(
  f: Fit,
  variants: Variant[],
  opts: RecommendOptions = {},
  cfg: EngineConfig = defaultConfig,
): Recommendation {
  const filteredOut = { tip: 0, budget: 0, specCheck: 0 };
  const pool = variants.filter((v) => {
    if (v.tip !== f.tip) return (filteredOut.tip++, false);
    // With a budget set, an unknown price cannot be shown as "within budget".
    if (opts.budgetUsd !== undefined && (v.priceUsd === null || v.priceUsd > opts.budgetUsd))
      return (filteredOut.budget++, false);
    if (opts.available && !opts.available.has(v.id)) return false;
    if (v.specCheck) return (filteredOut.specCheck++, false);
    return true;
  });

  // Best weight variant per model.
  const byModel = new Map<string, ScoredVariant>();
  for (const v of pool) {
    const s = scoreVariant(f, v, cfg);
    const prev = byModel.get(v.modelId);
    if (!prev || s.cost < prev.cost) byModel.set(v.modelId, s);
  }
  const ranked = [...byModel.values()].sort(
    (a, b) => a.cost - b.cost || a.variant.id.localeCompare(b.variant.id),
  );
  const picks: Pick[] = [];
  const used = new Set<string>();
  const add = (s: ScoredVariant | undefined, role: Pick['role']) => {
    if (!s || used.has(s.variant.modelId)) return;
    used.add(s.variant.modelId);
    picks.push({ ...s, role, why: explain(f, s, cfg) });
  };

  const best = ranked[0];
  add(best, 'best');
  if (best) {
    const value = ranked
      .filter((s) => !used.has(s.variant.modelId) && s.variant.priceUsd !== null)
      .filter((s) => s.cost <= best.cost + cfg.match.valueSlack)
      .filter((s) => best.variant.priceUsd === null || (s.variant.priceUsd as number) < best.variant.priceUsd)
      .sort((a, b) => (a.variant.priceUsd as number) - (b.variant.priceUsd as number))[0];
    const alternative = ranked.find((s) => !used.has(s.variant.modelId) && s !== value);
    add(alternative, 'alternative');
    add(value, 'value');
    const branch = ranked.find(
      (s) =>
        !used.has(s.variant.modelId) &&
        s.cost <= best.cost + cfg.match.branchOutSlack &&
        (s.variant.shape !== best.variant.shape || s.variant.brand !== best.variant.brand),
    );
    add(branch, 'branch_out');
  }
  const coverage: Recommendation['coverage'] = !best
    ? 'none'
    : best.quality === 'excellent' || best.quality === 'good'
      ? 'good'
      : 'thin';
  return { picks, considered: pool.length, filteredOut, coverage };
}

export interface ProTwin {
  pro: Pro;
  scored: ScoredVariant;
}

/** The pro whose dart sits closest to this fit. A spec match, not a claim about how they throw. */
export function proTwin(
  f: Fit,
  pros: Pro[],
  variants: Variant[],
  cfg: EngineConfig = defaultConfig,
): ProTwin | null {
  const byId = new Map(variants.map((v) => [v.id, v]));
  let best: ProTwin | null = null;
  for (const pro of pros) {
    const v = byId.get(pro.variantId);
    if (!v || v.tip !== f.tip) continue;
    const scored = scoreVariant(f, v, cfg);
    if (!best || scored.cost < best.scored.cost) best = { pro, scored };
  }
  return best;
}

export interface WhatIf {
  question: 'hold' | 'throwStyle' | 'thickness' | 'gripFeel' | 'fingers';
  answer: string | number;
  newBestId: string;
  newBestName: string;
}

/**
 * Which single answer change would change the top pick? Shown to users as
 * "if you hold the dart further back, the X becomes the best match".
 */
export function sensitivity(
  m: Measurements | undefined,
  answers: Answers,
  variants: Variant[],
  opts: RecommendOptions = {},
  cfg: EngineConfig = defaultConfig,
): WhatIf[] {
  const baseBest = recommend(runFit(m, answers, cfg), variants, opts, cfg).picks[0]?.variant.id;
  const variantsOf: Array<[WhatIf['question'], Array<string | number>]> = [
    ['hold', ['front', 'middle', 'rear']],
    ['throwStyle', ['flat', 'arc']],
    ['thickness', ['slim', 'standard', 'chunky']],
    ['fingers', [2, 3, 4]],
    ['gripFeel', [answers.gripFeel - 1, answers.gripFeel + 1].filter((g) => g >= 1 && g <= 5)],
  ];
  const out: WhatIf[] = [];
  for (const [q, options] of variantsOf) {
    for (const opt of options) {
      if ((answers as unknown as Record<string, unknown>)[q] === opt) continue;
      const alt = { ...answers, [q]: opt } as Answers;
      const best = recommend(runFit(m, alt, cfg), variants, opts, cfg).picks[0];
      if (best && best.variant.id !== baseBest) {
        out.push({
          question: q,
          answer: opt,
          newBestId: best.variant.id,
          newBestName: `${best.variant.brand} ${best.variant.model}`,
        });
      }
    }
  }
  return out;
}

export type PriceTier = 'budget' | 'standard' | 'premium';

/**
 * The best-fitting dart in each price class. Bounds are the upper price limits of the budget and
 * standard classes, in USD (the catalogue currency). Darts without a known price, of the other tip
 * type, flagged by the spec check, or excluded by `allowed` (e.g. no affiliate offer) are skipped.
 * Ties go to the cheaper dart.
 */
export function priceTiers(
  f: Fit,
  variants: Variant[],
  bounds: { budgetMaxUsd: number; standardMaxUsd: number },
  allowed: (v: Variant) => boolean = () => true,
  cfg: EngineConfig = defaultConfig,
): Record<PriceTier, ScoredVariant | null> {
  const out: Record<PriceTier, ScoredVariant | null> = { budget: null, standard: null, premium: null };
  for (const v of variants) {
    if (v.tip !== f.tip || v.specCheck || v.priceUsd === null || !allowed(v)) continue;
    const tier: PriceTier =
      v.priceUsd <= bounds.budgetMaxUsd
        ? 'budget'
        : v.priceUsd <= bounds.standardMaxUsd
          ? 'standard'
          : 'premium';
    const s = scoreVariant(f, v, cfg);
    const cur = out[tier];
    if (!cur || s.cost < cur.cost || (s.cost === cur.cost && v.priceUsd < (cur.variant.priceUsd ?? Infinity)))
      out[tier] = s;
  }
  return out;
}
