export type TipType = 'steel' | 'soft';
export type HoldPosition = 'front' | 'middle' | 'rear';
export type ThrowStyle = 'flat' | 'arc' | 'unsure';
export type Moisture = 'dry' | 'normal' | 'sweaty';
export type Thickness = 'slim' | 'standard' | 'chunky' | 'auto';
export type Feel = 'too_light' | 'right' | 'too_heavy';
export type Balance = 'front' | 'centre' | 'rear';
export type Shape = 'straight' | 'torpedo' | 'tapered';
export type HandTier = 'small' | 'medium' | 'large';
export type Dim = 'weight' | 'length' | 'diameter' | 'grip' | 'balance' | 'shape';

/** Hand measurements in millimetres, after card scaling and calibration. */
export interface Measurements {
  handLengthMm: number;
  palmWidthMm: number;
  indexLengthMm: number;
  middleLengthMm: number;
  thumbIndexSpanMm: number;
  /** Robust spread (median absolute deviation) of hand length across captured frames, mm. */
  spreadMm: number;
  /** Number of frames that passed the quality gates. */
  samples: number;
  /** True when a tape-measure calibration has been applied (see scripts/calibrate.ts). */
  calibrated: boolean;
}

export interface CurrentDart {
  weightG: number;
  lengthMm?: number;
  feel: Feel;
}

export interface Answers {
  tip: TipType;
  hold: HoldPosition;
  fingers: 2 | 3 | 4;
  throwStyle: ThrowStyle;
  moisture: Moisture;
  /** 1 = smooth, 5 = very grippy. Same scale retailers publish as "grip intensity". */
  gripFeel: 1 | 2 | 3 | 4 | 5;
  thickness: Thickness;
  current?: CurrentDart;
  budgetUsd?: number;
}

/** A target value with uncertainty. `band` is the range we tell the user to try. */
export interface Estimate {
  mu: number;
  sigma: number;
  band: [number, number];
}

export interface Reason {
  code: string;
  dim: Dim | 'confidence';
  /** Signed change this rule made to the estimate's centre, in the dimension's unit. */
  effect?: number;
  params: Record<string, number | string>;
}

export interface Fit {
  engineVersion: string;
  tip: TipType;
  weight: Estimate;
  length: Estimate;
  diameter: Estimate;
  grip: Estimate;
  balance: Record<Balance, number>;
  shape: Record<Shape, number>;
  preferredBalance: Balance;
  handTier: HandTier | null;
  confidence: 'high' | 'medium' | 'low';
  confidenceScore: number;
  reasons: Reason[];
}

export interface Variant {
  id: string;
  modelId: string;
  brand: string;
  model: string;
  tip: TipType;
  weightG: number;
  lengthMm: number;
  diameterMm: number;
  shape: Shape | null;
  balance: Balance | null;
  gripIntensity: number | null;
  tungstenPct: number;
  priceUsd: number | null;
  sourceUrl: string;
}

export interface Pro {
  id: string;
  name: string;
  country: string;
  /** Variant id of the pro's dart in the catalogue. */
  variantId: string;
  /** True when sources confirm this is the exact dart they play; false = their signature line. */
  exactDart: boolean;
  playingWeightG: number | null;
  sourceUrl: string;
}

export type Quality = 'excellent' | 'good' | 'fair' | 'poor';

export interface DimCheck {
  dim: Dim;
  status: 'in' | 'near' | 'out' | 'unknown';
  value: number | string | null;
  term: number;
}

export interface ScoredVariant {
  variant: Variant;
  cost: number;
  quality: Quality;
  checks: DimCheck[];
}

export interface PickReason {
  kind: 'strength' | 'compromise';
  dim: Dim;
  value: number | string;
  band?: [number, number];
  preferred?: string;
}

export interface Pick extends ScoredVariant {
  role: 'best' | 'alternative' | 'value' | 'branch_out';
  why: PickReason[];
}

export interface Recommendation {
  picks: Pick[];
  considered: number;
  filteredOut: { tip: number; budget: number };
  /** 'thin' = our catalogue has no close match for this fit yet; the UI says so instead of overselling. */
  coverage: 'good' | 'thin' | 'none';
}
