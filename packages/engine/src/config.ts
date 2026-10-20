/**
 * Every number the engine uses lives here, and every number has a provenance entry below.
 *   sourced   — taken from a cited source
 *   heuristic — an expert rule of thumb; a starting point to be tuned
 *   tuned     — fitted from user feedback (none yet at launch)
 * A unit test fails if a numeric leaf has no provenance entry.
 */
export const ENGINE_VERSION = '2.0.0';

export const config = {
  reference: {
    // Landmark-chain lengths (MediaPipe joints, not skin edges). Recalibrate with scripts/calibrate.ts.
    handLength: { mu: 185, sigma: 12 },
    middleLength: { mu: 85, sigma: 7 },
    tierZ: { small: -0.75, large: 0.75 },
  },
  weight: {
    steel: { mu: 22, sigma: 2, min: 14, max: 32 },
    soft: { mu: 18, sigma: 1.5, min: 14, max: 22 },
    currentSigma: 1,
    feelShift: 2,
    throwShift: { flat: 0.75, arc: -0.75, unsure: 0 },
    handPerZ: 0.6,
    handCap: 1.2,
    missingHandSigma: 0.6,
    bandMinHalf: 1,
    bandSigmaFactor: 0.67,
  },
  length: {
    byFingers: { 2: 44, 3: 48, 4: 52 },
    sigma: 3,
    fingerPerZ: 1.5,
    fingerCap: 3,
    hold: { front: -1.5, middle: 0, rear: 2 },
    currentSigma: 2,
    missingHandSigma: 1.5,
    min: 36,
    max: 60,
    bandMinHalf: 2,
    bandSigmaFactor: 0.67,
  },
  diameter: {
    chosen: { slim: 6.3, standard: 6.8, chunky: 7.4 },
    chosenSigma: 0.3,
    autoMu: 6.8,
    autoPerZ: 0.25,
    autoSigma: 0.4,
    min: 5.6,
    max: 8.5,
    bandMinHalf: 0.25,
    bandSigmaFactor: 0.67,
  },
  grip: {
    moisture: { dry: 0, normal: 0, sweaty: 1 },
    sigma: 0.75,
    min: 1,
    max: 5,
    bandMinHalf: 0.5,
    bandSigmaFactor: 0.67,
  },
  balance: {
    front: { front: 0.7, centre: 0.25, rear: 0.05 },
    middle: { front: 0.25, centre: 0.6, rear: 0.15 },
    rear: { front: 0.05, centre: 0.35, rear: 0.6 },
    flatFrontNudge: 0.1,
  },
  shape: {
    front: { torpedo: 0.5, tapered: 0.35, straight: 0.15 },
    centre: { straight: 0.6, tapered: 0.25, torpedo: 0.15 },
    rear: { tapered: 0.5, straight: 0.35, torpedo: 0.15 },
  },
  confidence: {
    base: 0.35,
    handMeasured: 0.25,
    lowSpread: 0.15,
    lowSpreadMm: 2,
    calibrated: 0.1,
    currentDart: 0.25,
    high: 0.75,
    medium: 0.5,
  },
  match: {
    tolerance: { weight: 0.75, length: 2, diameter: 0.25, grip: 0.75 },
    weights: { weight: 3, length: 2, diameter: 1.5, grip: 1, balance: 1, shape: 0.5 },
    unknownGripAssumed: 3,
    unknownSurcharge: 0.25,
    unknownBalanceP: 0.33,
    minP: 0.02,
    quality: { excellent: 2, good: 5, fair: 10 },
    nearFactor: 1.5,
    valueSlack: 2.5,
    branchOutSlack: 6,
    strongTerm: 0.5,
  },
} as const;

type P = 'sourced' | 'heuristic' | 'tuned';
interface Prov {
  p: P;
  note: string;
}

/** Provenance by config path prefix. The longest matching prefix wins. */
export const provenance: Record<string, Prov> = {
  'reference.handLength': {
    p: 'heuristic',
    note: 'Approximate adult mixed-population wrist-to-middle-tip landmark length; replace after calibration.',
  },
  'reference.middleLength': { p: 'heuristic', note: 'Approximate landmark chain MCP→tip; replace after calibration.' },
  'reference.tierZ': { p: 'heuristic', note: 'Roughly the bottom and top 23% of hands.' },
  'weight.steel.mu': {
    p: 'sourced',
    note: 'PDC world top 4 (11 Oct 2026) throw 21–23 g: Littler 23, Humphries 22, Van Veen 21, Price 23.',
  },
  'weight.steel.sigma': { p: 'heuristic', note: 'Most adult steel-tip players use 20–26 g.' },
  'weight.steel.min': { p: 'heuristic', note: 'Lightest steel barrels commonly sold.' },
  'weight.steel.max': { p: 'heuristic', note: 'Heaviest steel barrels commonly sold.' },
  'weight.soft': { p: 'heuristic', note: 'Soft-tip machines and leagues usually cap around 20–22 g.' },
  'weight.currentSigma': { p: 'heuristic', note: 'A dart you already throw is strong evidence.' },
  'weight.feelShift': { p: 'heuristic', note: 'Fitters typically move 2 g when a dart feels wrong.' },
  'weight.throwShift': { p: 'heuristic', note: 'Flat, fast throwers tend to prefer heavier; lobbers lighter.' },
  'weight.handPerZ': { p: 'heuristic', note: 'Small effect of hand size on comfortable mass.' },
  'weight.handCap': { p: 'heuristic', note: 'Hand size never moves weight more than ±1.2 g.' },
  'weight.missingHandSigma': { p: 'heuristic', note: 'Extra uncertainty when the hand was not measured.' },
  'weight.band': { p: 'heuristic', note: 'Band ≈ 50% interval, at least ±1 g.' },
  'length.byFingers': { p: 'heuristic', note: 'More fingers on the barrel need more barrel.' },
  'length.sigma': { p: 'heuristic', note: 'Spread of barrel lengths for one grip type.' },
  'length.fingerPerZ': { p: 'heuristic', note: 'Longer fingers reach further along the barrel.' },
  'length.fingerCap': { p: 'heuristic', note: 'Finger length never moves length more than ±3 mm.' },
  'length.hold': { p: 'heuristic', note: 'Rear grippers need barrel behind the fingers; front grippers less.' },
  'length.currentSigma': { p: 'heuristic', note: 'Current barrel length is strong evidence.' },
  'length.missingHandSigma': { p: 'heuristic', note: 'Extra uncertainty without a hand scan.' },
  'length.min': { p: 'heuristic', note: 'Shortest common barrels.' },
  'length.max': { p: 'heuristic', note: 'Longest common barrels.' },
  'length.band': { p: 'heuristic', note: 'Band ≈ 50% interval, at least ±2 mm.' },
  'diameter.chosen': {
    p: 'heuristic',
    note: 'Retail slim/standard/chunky ranges; Littler G1 is 6.5 mm (Sky Sports, 2025).',
  },
  'diameter.chosenSigma': { p: 'heuristic', note: 'Stated thickness preference is strong evidence.' },
  'diameter.autoMu': { p: 'heuristic', note: 'Standard barrel thickness when nothing else is known.' },
  'diameter.autoPerZ': { p: 'heuristic', note: 'Bigger hands tolerate thicker barrels.' },
  'diameter.autoSigma': { p: 'heuristic', note: 'Thickness is a loose guess without a stated preference.' },
  'diameter.min': { p: 'heuristic', note: 'Thinnest common barrels.' },
  'diameter.max': { p: 'heuristic', note: 'Thickest common barrels.' },
  'diameter.band': { p: 'heuristic', note: 'Band ≈ 50% interval.' },
  'grip.moisture': { p: 'heuristic', note: 'Sweaty hands need one step more grip.' },
  'grip.sigma': { p: 'heuristic', note: 'People rarely distinguish grip steps closer than this.' },
  'grip.min': { p: 'sourced', note: 'Retail grip-intensity scale runs 1–5 (A-Z Darts listings).' },
  'grip.max': { p: 'sourced', note: 'Retail grip-intensity scale runs 1–5 (A-Z Darts listings).' },
  'grip.band': { p: 'heuristic', note: 'Band ≈ 50% interval.' },
  'balance.front': { p: 'heuristic', note: 'Front grippers usually prefer front-loaded barrels.' },
  'balance.middle': { p: 'heuristic', note: 'Middle grippers usually prefer centre balance.' },
  'balance.rear': { p: 'heuristic', note: 'Rear grippers usually prefer rear or centre balance.' },
  'balance.flatFrontNudge': { p: 'heuristic', note: 'Flat throwers lean slightly towards front weight.' },
  'shape.front': { p: 'heuristic', note: 'Front weight comes from torpedo or front-tapered barrels.' },
  'shape.centre': { p: 'heuristic', note: 'Centre balance usually means a straight barrel.' },
  'shape.rear': { p: 'heuristic', note: 'Rear weight comes from rear-tapered barrels.' },
  'confidence': { p: 'heuristic', note: 'How much each kind of evidence narrows the fit.' },
  'match.tolerance': { p: 'heuristic', note: 'Differences a player is unlikely to feel.' },
  'match.weights': { p: 'heuristic', note: 'Weight matters most, then length; shape least.' },
  'match.unknownGripAssumed': { p: 'heuristic', note: 'Most listed barrels are grip 3 (catalogue median).' },
  'match.unknownSurcharge': { p: 'heuristic', note: 'Penalty for a value the listing does not give.' },
  'match.unknownBalanceP': { p: 'heuristic', note: 'Unknown balance treated as a 1-in-3 guess.' },
  'match.minP': { p: 'heuristic', note: 'Floor so one mismatch never dominates.' },
  'match.quality': { p: 'heuristic', note: 'Cost thresholds for the quality label.' },
  'match.nearFactor': { p: 'heuristic', note: 'Outside the band but within 1.5× its half-width counts as near.' },
  'match.valueSlack': { p: 'heuristic', note: 'A value pick may cost this much more fit than the best.' },
  'match.branchOutSlack': { p: 'heuristic', note: 'A branch-out pick may cost this much more fit.' },
  'match.strongTerm': { p: 'heuristic', note: 'Terms above this are reported as compromises.' },
};

export function provenanceOf(path: string): Prov | undefined {
  let best: string | undefined;
  for (const key of Object.keys(provenance)) {
    if ((path === key || path.startsWith(key + '.')) && (!best || key.length > best.length)) best = key;
  }
  if (!best) {
    // band keys: 'weight.bandMinHalf' etc. map to 'weight.band'
    const m = path.match(/^(\w+)\.band/);
    if (m && provenance[`${m[1]}.band`]) return provenance[`${m[1]}.band`];
    return undefined;
  }
  return provenance[best];
}

export function numericLeaves(obj: unknown, prefix = ''): string[] {
  if (typeof obj === 'number') return [prefix];
  if (obj && typeof obj === 'object') {
    return Object.entries(obj).flatMap(([k, v]) => numericLeaves(v, prefix ? `${prefix}.${k}` : k));
  }
  return [];
}

export type EngineConfig = typeof config;
