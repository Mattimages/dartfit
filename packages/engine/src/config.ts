/**
 * Every number the engine uses lives here, and every number has a provenance entry below.
 *   sourced   — taken from a cited source
 *   heuristic — an expert rule of thumb; a starting point to be tuned
 *   tuned     — fitted from user feedback (none yet at launch)
 * A unit test fails if a numeric leaf has no provenance entry.
 */
export const ENGINE_VERSION = '3.4.0';

export const config = {
  reference: {
    // Landmark-chain lengths (MediaPipe joints, not skin edges). Recalibrate with scripts/calibrate.ts.
    handLength: { mu: 185, sigma: 12 },
    middleLength: { mu: 85, sigma: 7 },
    palmWidth: { mu: 78, sigma: 6 },
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
    palmPerZ: 1,
    feelStep: 4,
    feelSigma: 2.5,
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
    palmPerZ: 0.15,
    currentSigma: 0.25,
    feelStep: 0.5,
    min: 5.6,
    max: 8.5,
    bandMinHalf: 0.25,
    bandSigmaFactor: 0.67,
  },
  grip: {
    moisture: { dry: 0.5, normal: 0, sweaty: 1 },
    sigma: 0.75,
    currentSigma: 0.5,
    feelStep: 1,
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
    currentNudge: 0.15,
    cogFrac: { front: 0.45, centre: 0.5, rear: 0.55 },
  },
  shape: {
    front: { torpedo: 0.4, tapered: 0.25, bomb: 0.2, straight: 0.1, scalloped: 0.05 },
    centre: { straight: 0.5, scalloped: 0.15, tapered: 0.15, bomb: 0.1, torpedo: 0.1 },
    rear: { tapered: 0.45, straight: 0.3, bomb: 0.1, torpedo: 0.1, scalloped: 0.05 },
  },
  // Hand proportions → barrel shape. Short, broad fingers and a compact grip want one clear fat
  // point (bomb, torpedo); long fingers spread along the barrel want it straight.
  handShape: {
    // Middle finger / knuckle width of the reference hand (85 / 78 mm) and its spread between people.
    ratioRef: 1.09,
    ratioCv: 0.06,
    zClamp: 2,
    // Per z of stubbiness (positive = shorter fingers for the palm).
    stubby: { bomb: 0.08, torpedo: 0.04, straight: -0.08, scalloped: -0.02, tapered: -0.03 },
    // Share of the barrel the fingers cover: below mid is compact, above is long.
    spreadMid: 0.85,
    spreadHalf: 0.15,
    compact: { bomb: 0.12, torpedo: 0.08, straight: -0.12, scalloped: -0.03, tapered: -0.05 },
    long: { straight: 0.1, scalloped: 0.05, bomb: -0.08, torpedo: -0.04, tapered: -0.03 },
    floor: 0.01,
    // Solver: how hard the ideal barrel leans towards the preferred shape's profile, and how far the
    // diameter may move for it (a bomb is fatter in the middle at the same weight).
    solverPull: 5,
    diameterFlex: { down: 0.3, up: 0.7 },
    diameterSigma: 0.35,
  },
  // Hand type picked in words (no scan): how many SD of finger-to-palm proportion it stands for.
  // Half of it shortens or lengthens the fingers, half widens or narrows the palm.
  handType: { slender: -1.5, stubby: 1.5 },
  physics: {
    // Alloy density in g/cm³.
    density: { w80: 15.05, w85: 16.05, w90: 17.05, w925: 17.5, w95: 18.05, w97: 18.55, brass: 8.5 },
    bore: { frontDiaMm: 2.3, frontDepthMm: 11, rearDiaMm: 3.9, rearDepthMm: 9 },
    // Share of metal left after grip machining. Calibrated on the catalogue: see calibrateMachining().
    machiningFactor: 0.876,
    // Deeper grip machining removes more metal: k × (1 − gripSlope × (grip − 3)).
    gripSlope: 0.03,
    shapes: {
      endRatio: 0.75,
      straight: { front: 0.06, rear: 0.06 },
      torpedo: { front: 0.15, rear: 0.45 },
      tapered: { front: 0.04, rear: 0.55 },
      bomb: { front: 0.35, rear: 0.4 },
      scallopWaist: 0.08,
      lightest: { front: 0.4, rear: 0.55, end: 0.55 },
      solver: { min: 0.04, max: 0.8, step: 0.02 },
    },
    // A target needs 95% tungsten when that makes it buildable at a fit cost this much lower.
    upgradeGain: 1,
    standardTungsten: 90,
    premiumTungsten: 95,
    grid: { lengthStep: 0.5, diameterStep: 0.05 },
    // Listed/model weight ratios outside this range are flagged for a listing re-check.
    specCheck: [0.78, 1.25],
  },
  gripZone: {
    // Fingertip width as a share of knuckle spacing (landmark 5–17 distance / 3).
    tipShare: 0.72,
    overlap: 0.9,
    margin: 3,
    start: { front: 0.08, middle: 0.5, rear: 0.92 },
  },
  setup: {
    shaft: { flat: 'short', unsure: 'inbetween', arc: 'medium' },
    shaftMm: { short: [28, 35], inbetween: [35, 41], medium: [41, 48] },
    flight: { flat: 'slim', unsure: 'standard', arc: 'standard' },
    lightDartG: 20,
    heavyDartG: 24,
    pointMm: { standard: [30, 32], long: [35, 41] },
  },
  body: {
    // Anthropometry.
    handPerHeight: 0.1075,
    handFromHeightSigma: 8,
    mismatchSigmas: 3,
    forearmPerHeight: 0.146,
    eyeBelowTopCm: 12,
    // Throw geometry (metres, m/s², rad/s).
    bullHeightM: 1.73,
    ocheM: 2.37,
    reachM: 0.45,
    gravity: 9.81,
    elbowOmega: 18.2,
    reference: { heightCm: 178 },
    angleSpanDeg: 7,
    styleThreshold: 0.35,
    limits: { heightCm: [130, 220], forearmCm: [18, 36] },
  },
  confidence: {
    base: 0.35,
    heightKnown: 0.05,
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
    // Cost → 0–100% for display: 100·exp(−cost / displayScale). Excellent (cost ≤ 2) ≈ 85–100%.
    displayScale: 12,
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
  'reference.middleLength': {
    p: 'heuristic',
    note: 'Approximate landmark chain MCP→tip; replace after calibration.',
  },
  'reference.palmWidth': {
    p: 'heuristic',
    note: 'Approximate landmark 5–17 (knuckle) distance; replace after calibration.',
  },
  'reference.tierZ': { p: 'heuristic', note: 'Roughly the bottom and top 23% of hands.' },
  'body.handPerHeight': {
    p: 'sourced',
    note: 'Hand length / stature: men 18.48/170.24 cm = 0.1086, women 16.86/159.01 cm = 0.1060 (bioRxiv 10.1101/2025.06.03.657765, n=195); midpoint.',
  },
  'body.handFromHeightSigma': {
    p: 'sourced',
    note: 'Same study: hand-length SD ≈ 1.0 cm, stature SEE from hand 4.4 cm vs stature SD 5.8 cm → r ≈ 0.65 → residual ≈ 7.6 mm.',
  },
  'body.mismatchSigmas': {
    p: 'heuristic',
    note: 'A scan more than 3 spreads from the height estimate is worth re-measuring.',
  },
  'body.forearmPerHeight': {
    p: 'heuristic',
    note: 'Classic segment proportion (forearm ≈ 0.146 × stature, Drillis & Contini); used only when no forearm is entered.',
  },
  'body.eyeBelowTopCm': {
    p: 'heuristic',
    note: 'Darts are released near eye level; adult eye height ≈ stature − 12 cm.',
  },
  'body.bullHeightM': {
    p: 'sourced',
    note: 'Bullseye centre 1.73 m above the floor (WDF/PDC rules; Smeets et al. 2002).',
  },
  'body.ocheM': {
    p: 'sourced',
    note: 'Throw line 2.37 m from the board face (WDF/PDC rules; Smeets et al. 2002).',
  },
  'body.reachM': {
    p: 'heuristic',
    note: 'Lean plus arm extension puts the release point about 0.45 m in front of the oche.',
  },
  'body.gravity': { p: 'sourced', note: 'Standard gravity.' },
  'body.elbowOmega': {
    p: 'sourced',
    note: 'Hand speed at release 5.8–6.7 m/s (Smeets et al. 2002, Exp Brain Res; model 6.5 m/s) over the reference lever (forearm + half hand ≈ 0.36 m) → 18.2 rad/s. Gives a 15.5° launch for the reference build, inside the 13–18° measured in professionals (arXiv 2604.01130).',
  },
  'body.reference': {
    p: 'heuristic',
    note: 'Reference adult player 1.78 m; flatness is relative to this build.',
  },
  'body.angleSpanDeg': {
    p: 'heuristic',
    note: '±7° launch angle from the reference counts as clearly flat / clearly arced.',
  },
  'body.styleThreshold': {
    p: 'heuristic',
    note: 'Geometry only decides the style when it leans clearly one way.',
  },
  'body.limits': { p: 'heuristic', note: 'Accepted input ranges for adults.' },
  'confidence.heightKnown': {
    p: 'heuristic',
    note: 'Height adds a little: hand-size estimate and release geometry.',
  },
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
  'weight.throwShift': {
    p: 'heuristic',
    note: 'Flat, fast throwers tend to prefer heavier; lobbers lighter.',
  },
  'weight.handPerZ': { p: 'heuristic', note: 'Small effect of hand size on comfortable mass.' },
  'weight.handCap': { p: 'heuristic', note: 'Hand size never moves weight more than ±1.2 g.' },
  'weight.missingHandSigma': { p: 'heuristic', note: 'Extra uncertainty when the hand was not measured.' },
  'weight.band': { p: 'heuristic', note: 'Band ≈ 50% interval, at least ±1 g.' },
  'length.byFingers': { p: 'heuristic', note: 'More fingers on the barrel need more barrel.' },
  'length.sigma': { p: 'heuristic', note: 'Spread of barrel lengths for one grip type.' },
  'length.fingerPerZ': { p: 'heuristic', note: 'Longer fingers reach further along the barrel.' },
  'length.fingerCap': { p: 'heuristic', note: 'Finger length never moves length more than ±3 mm.' },
  'length.hold': {
    p: 'heuristic',
    note: 'Rear grippers need barrel behind the fingers; front grippers less.',
  },
  'length.currentSigma': { p: 'heuristic', note: 'Current barrel length is strong evidence.' },
  'length.missingHandSigma': { p: 'heuristic', note: 'Extra uncertainty without a hand scan.' },
  'length.palmPerZ': { p: 'heuristic', note: 'Wider fingers cover more barrel.' },
  'length.feelStep': { p: 'heuristic', note: 'Too short / too long moves about 4 mm.' },
  'length.feelSigma': { p: 'heuristic', note: 'Length feel is softer evidence than a listed length.' },
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
  'diameter.palmPerZ': { p: 'heuristic', note: 'Wider knuckles tolerate thicker barrels.' },
  'diameter.currentSigma': { p: 'heuristic', note: 'Thickness of a dart you know is strong evidence.' },
  'diameter.feelStep': { p: 'heuristic', note: 'Too thin / too thick moves about 0.5 mm.' },
  'diameter.min': { p: 'heuristic', note: 'Thinnest common barrels.' },
  'diameter.max': { p: 'heuristic', note: 'Thickest common barrels.' },
  'diameter.band': { p: 'heuristic', note: 'Band ≈ 50% interval.' },
  'grip.moisture': {
    p: 'heuristic',
    note: 'Sweaty hands need one step more grip; very dry skin also slips on metal, so half a step.',
  },
  'grip.currentSigma': { p: 'heuristic', note: 'A grip you already know is strong evidence.' },
  'grip.feelStep': { p: 'heuristic', note: 'Too smooth / too sharp moves one step on the 1–5 scale.' },
  'grip.sigma': { p: 'heuristic', note: 'People rarely distinguish grip steps closer than this.' },
  'grip.min': { p: 'sourced', note: 'Retail grip-intensity scale runs 1–5 (A-Z Darts listings).' },
  'grip.max': { p: 'sourced', note: 'Retail grip-intensity scale runs 1–5 (A-Z Darts listings).' },
  'grip.band': { p: 'heuristic', note: 'Band ≈ 50% interval.' },
  'balance.front': { p: 'heuristic', note: 'Front grippers usually prefer front-loaded barrels.' },
  'balance.middle': { p: 'heuristic', note: 'Middle grippers usually prefer centre balance.' },
  'balance.rear': { p: 'heuristic', note: 'Rear grippers usually prefer rear or centre balance.' },
  'balance.currentNudge': { p: 'heuristic', note: 'A dart that feels right pulls balance towards its own.' },
  'balance.cogFrac': {
    p: 'heuristic',
    note: 'Centre of gravity targets for front, centre and rear balance.',
  },
  'balance.flatFrontNudge': { p: 'heuristic', note: 'Flat throwers lean slightly towards front weight.' },
  'physics.density': {
    p: 'sourced',
    note: 'ASTM B777 tungsten heavy alloy classes 1–4 (90, 92.5, 95, 97% W), class midpoints; 80/85% extrapolated; brass ≈ 8.5.',
  },
  'physics.bore': {
    p: 'heuristic',
    note: 'Fixed steel point hole and 2BA thread (4.7 mm major, ≈3.9 mm minor) depths.',
  },
  'physics.machiningFactor': {
    p: 'tuned',
    note: 'Median listed/solid mass ratio over 34 catalogue straight barrels (20 Oct 2026); interquartile spread ±7%.',
  },
  'physics.gripSlope': {
    p: 'heuristic',
    note: 'Catalogue calibration suggests up to 0.07 per grip step but gains little; 0.03 is used to avoid overfitting.',
  },
  'physics.shapes': { p: 'heuristic', note: 'Taper lengths that reproduce each shop shape class.' },
  'handShape.ratioRef': {
    p: 'sourced',
    note: 'Derived from reference.middleLength.mu / reference.palmWidth.mu (85 / 78).',
  },
  'handShape.ratioCv': {
    p: 'heuristic',
    note: 'Finger-to-palm proportion varies less than size; ≈6% between adults is assumed until gate G1 measures it.',
  },
  'handShape.zClamp': { p: 'heuristic', note: 'Proportions beyond 2 SD are treated as 2 SD.' },
  'handShape.stubby': {
    p: 'heuristic',
    note: 'Fitting advice: short, thick fingers grip a fat point (bomb/torpedo) more easily than a long straight barrel.',
  },
  'handShape.spreadMid': {
    p: 'heuristic',
    note: 'Typical 3-finger grip covers about 80% of a 46 mm barrel.',
  },
  'handShape.spreadHalf': {
    p: 'heuristic',
    note: 'Grip spread range that maps to fully compact or fully long.',
  },
  'handShape.compact': {
    p: 'heuristic',
    note: 'A compact grip wants one clear grip point: bomb or torpedo.',
  },
  'handShape.long': {
    p: 'heuristic',
    note: 'Four fingers spread along the barrel suit straight or scalloped.',
  },
  'handShape.floor': { p: 'heuristic', note: 'No shape drops to zero.' },
  'handType.slender': {
    p: 'heuristic',
    note: '"Long and slender" read as 1.5 SD longer fingers for the palm (about the 93rd percentile). Words are vague, so not further.',
  },
  'handType.stubby': {
    p: 'heuristic',
    note: '"Short and stubby" read as 1.5 SD shorter fingers for the palm, mirror of slender.',
  },
  'handShape.solverPull': {
    p: 'heuristic',
    note: 'Weight of the preferred-shape profile in the ideal-barrel solver, against mass and balance.',
  },
  'handShape.diameterFlex': {
    p: 'heuristic',
    note: 'How far the ideal diameter may move from the fitted one to make the preferred shape at the target weight.',
  },
  'handShape.diameterSigma': { p: 'heuristic', note: 'Cost scale for moving the diameter.' },
  'physics.upgradeGain': { p: 'heuristic', note: 'Recommend 95% tungsten only when it clearly helps.' },
  'physics.standardTungsten': { p: 'heuristic', note: 'Most barrels are 90% tungsten.' },
  'physics.premiumTungsten': { p: 'heuristic', note: 'The common premium alloy.' },
  'physics.specCheck': {
    p: 'heuristic',
    note: 'About three times the catalogue spread of the listed/model ratio.',
  },
  'physics.grid': { p: 'heuristic', note: 'Resolution of the feasibility search.' },
  gripZone: { p: 'heuristic', note: 'Fingertip width and finger placement along the barrel.' },
  setup: {
    p: 'heuristic',
    note: 'Common fitting advice: harder, flatter throws suit shorter shafts and smaller flights; lofted throws longer shafts and standard flights.',
  },
  'shape.front': { p: 'heuristic', note: 'Front weight comes from torpedo or front-tapered barrels.' },
  'shape.centre': { p: 'heuristic', note: 'Centre balance usually means a straight barrel.' },
  'shape.rear': { p: 'heuristic', note: 'Rear weight comes from rear-tapered barrels.' },
  confidence: { p: 'heuristic', note: 'How much each kind of evidence narrows the fit.' },
  'match.tolerance': { p: 'heuristic', note: 'Differences a player is unlikely to feel.' },
  'match.weights': { p: 'heuristic', note: 'Weight matters most, then length; shape least.' },
  'match.unknownGripAssumed': { p: 'heuristic', note: 'Most listed barrels are grip 3 (catalogue median).' },
  'match.unknownSurcharge': { p: 'heuristic', note: 'Penalty for a value the listing does not give.' },
  'match.unknownBalanceP': { p: 'heuristic', note: 'Unknown balance treated as a 1-in-3 guess.' },
  'match.minP': { p: 'heuristic', note: 'Floor so one mismatch never dominates.' },
  'match.quality': { p: 'heuristic', note: 'Cost thresholds for the quality label.' },
  'match.nearFactor': {
    p: 'heuristic',
    note: 'Outside the band but within 1.5× its half-width counts as near.',
  },
  'match.displayScale': {
    p: 'heuristic',
    note: 'Maps the quality bands to readable percentages: excellent ≈ 85–100, good ≈ 66–85, fair ≈ 43–66.',
  },
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
