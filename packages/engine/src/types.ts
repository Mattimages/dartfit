export type TipType = 'steel' | 'soft';
export type HoldPosition = 'front' | 'middle' | 'rear';
export type ThrowStyle = 'flat' | 'arc' | 'unsure';
export type Moisture = 'dry' | 'normal' | 'sweaty';
export type Thickness = 'slim' | 'standard' | 'chunky' | 'auto';
export type Feel = 'too_light' | 'right' | 'too_heavy';
export type Balance = 'front' | 'centre' | 'rear';
export type Shape = 'straight' | 'torpedo' | 'tapered' | 'bomb' | 'scalloped';
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
  /** Set when these numbers were estimated (from height) rather than measured. */
  estimatedFrom?: 'height';
  /**
   * Scanned without a bank card: the proportions are measured, the size is not. The numbers are
   * in reference scale (hand length = reference mean); the fit rescales them to the player's
   * height when known and widens the spread.
   */
  unscaled?: boolean;
}

export type GripFeelCurrent = 'too_smooth' | 'right' | 'too_sharp';
export type ThicknessFeel = 'too_thin' | 'right' | 'too_thick';
export type LengthFeel = 'too_short' | 'right' | 'too_long';

/**
 * The dart the player throws now. Picking it from the catalogue fills every spec; otherwise the
 * player types the weight (and optionally the length). Each "feel" is optional.
 */
export interface CurrentDart {
  variantId?: string;
  weightG: number;
  lengthMm?: number;
  diameterMm?: number;
  gripIntensity?: number;
  balance?: Balance;
  /** How the weight feels. */
  feel: Feel;
  gripFeel?: GripFeelCurrent;
  thicknessFeel?: ThicknessFeel;
  lengthFeel?: LengthFeel;
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
  /** Body height in cm (optional): hand-size estimate without a scan, and release height. */
  heightCm?: number;
  /** Forearm length in cm, elbow crease to wrist crease (optional): the throwing lever. */
  forearmCm?: number;
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

export interface Profile {
  front: number;
  rear: number;
  endFront: number;
  endRear: number;
  waist: number;
}

/** The theoretical ideal barrel: the shape the engine would machine for this player. */
export interface IdealBarrel {
  lengthMm: number;
  diameterMm: number;
  massG: number;
  tungstenPct: number;
  profile: Profile;
  cogMm: number;
  cogFrac: number;
  shape: Shape;
  gripZone: [number, number];
  massError: number;
}

export interface Physics {
  /** Alloy the target needs: 90 is standard, 95 when the target is too heavy for its size at 90%. */
  tungstenPct: number;
  /** True when the independent estimates described a barrel that cannot be made and were moved. */
  adjusted: boolean;
  /** Lightest and heaviest buildable barrel at the target length and thickness, grams. */
  massRange: [number, number];
}

export type ShaftLength = 'short' | 'inbetween' | 'medium';
export type FlightShape = 'slim' | 'standard';

export interface Setup {
  shaft: ShaftLength;
  shaftMm: [number, number];
  flight: FlightShape;
  pointMm: [number, number];
  /** True when a longer point is suggested so a front-gripping finger has room. */
  longPoint: boolean;
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
  physics: Physics;
  barrel: IdealBarrel;
  setup: Setup;
  /** The throw's geometry from body size, when the height is known. */
  trajectory: Trajectory | null;
  /** Throw style used for weight and setup: the answer, or what the geometry suggests. */
  throwStyle: ThrowStyle;
}

export interface Trajectory {
  heightCm: number;
  forearmCm: number;
  forearmEstimated: boolean;
  releaseHeightM: number;
  releaseSpeedMs: number;
  /** Launch angle (degrees above horizontal) that reaches the bull. */
  angleDeg: number;
  /** Launch angle for the reference build, for comparison. */
  referenceAngleDeg: number;
  /** −1 = needs a clear arc … 0 = typical … +1 = can throw flat. */
  flatness: number;
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
  /** Date the specs were checked against the source page (YYYY-MM-DD). */
  verifiedAt?: string;
  /**
   * Set when the listed weight does not fit the listed size and alloy (barrel physics model).
   * Such darts stay browsable but are not recommended until the listing is re-checked.
   */
  specCheck?: { listedG: number; modelG: number };
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
  filteredOut: { tip: number; budget: number; specCheck: number };
  /** 'thin' = our catalogue has no close match for this fit yet; the UI says so instead of overselling. */
  coverage: 'good' | 'thin' | 'none';
}
