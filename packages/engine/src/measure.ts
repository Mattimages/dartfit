/**
 * Pure measurement maths shared by the phone (live scan) and the tests.
 * Landmark indices follow MediaPipe Hand Landmarker: 0 wrist, 1–4 thumb, 5–8 index,
 * 9–12 middle, 13–16 ring, 17–20 little finger.
 */
import type { Measurements } from './types.js';

export interface Pt {
  x: number;
  y: number;
}
export interface Landmark extends Pt {
  z: number;
}

/** ISO/IEC 7810 ID-1: every bank, debit and ID card. */
export const CARD_MM = { long: 85.6, short: 53.98 } as const;
export const CARD_ASPECT = CARD_MM.long / CARD_MM.short;

export const dist = (a: Pt, b: Pt) => Math.hypot(a.x - b.x, a.y - b.y);
const chain = (pts: Pt[]) => pts.slice(1).reduce((s, p, i) => s + dist(pts[i] as Pt, p), 0);

export type DimKey = 'handLength' | 'palmWidth' | 'indexLength' | 'middleLength' | 'thumbIndexSpan';
export type Dims = Record<DimKey, number>;

function px(lm: Landmark[], i: number, w: number, h: number): Pt {
  const p = lm[i];
  if (!p) throw new Error(`missing landmark ${i}`);
  return { x: p.x * w, y: p.y * h };
}

/** Hand dimensions in pixels from normalised landmarks on a w×h image. */
export function handDimensionsPx(lm: Landmark[], w: number, h: number): Dims {
  const P = (i: number) => px(lm, i, w, h);
  return {
    handLength: dist(P(0), P(12)),
    palmWidth: dist(P(5), P(17)),
    indexLength: chain([P(5), P(6), P(7), P(8)]),
    middleLength: chain([P(9), P(10), P(11), P(12)]),
    thumbIndexSpan: dist(P(4), P(8)),
  };
}

export type Gate = 'no_hand' | 'out_of_frame' | 'fingers_closed' | 'fingers_bent' | 'hand_tilted';

/** Quality gates for one frame. Returns the first failing gate, or null when the frame is usable. */
export function checkHandFrame(lm: Landmark[] | undefined): Gate | null {
  if (!lm || lm.length < 21) return 'no_hand';
  if (lm.some((p) => p.x < 0.02 || p.x > 0.98 || p.y < 0.02 || p.y > 0.98)) return 'out_of_frame';
  const v = (a: number, b: number) => {
    const pa = lm[a] as Landmark;
    const pb = lm[b] as Landmark;
    return { x: pb.x - pa.x, y: pb.y - pa.y };
  };
  const angle = (a: Pt, b: Pt) =>
    (Math.acos(Math.max(-1, Math.min(1, (a.x * b.x + a.y * b.y) / (Math.hypot(a.x, a.y) * Math.hypot(b.x, b.y))))) *
      180) /
    Math.PI;
  if (angle(v(5, 8), v(17, 20)) < 18) return 'fingers_closed';
  const straight = (i: number) => {
    const pts = [lm[i], lm[i + 1], lm[i + 2], lm[i + 3]] as Pt[];
    return dist(pts[0] as Pt, pts[3] as Pt) / chain(pts);
  };
  if (straight(5) < 0.9 || straight(9) < 0.9) return 'fingers_bent';
  // Relative depth: on a flat hand the fingertips sit at roughly the wrist's depth.
  const span = dist(lm[0] as Pt, lm[12] as Pt);
  const zRange = Math.max(...[4, 8, 12, 16, 20].map((i) => Math.abs((lm[i] as Landmark).z - (lm[0] as Landmark).z)));
  if (span > 0 && zRange / span > 0.35) return 'hand_tilted';
  return null;
}

export interface CardScale {
  mmPerPx: number;
  /** Relative error of the long/short ratio vs a real card. Large = card tilted or mis-detected. */
  aspectError: number;
  /** Difference between opposite sides as a fraction; large = perspective (phone not parallel). */
  skew: number;
}

export function cardScaleFromBox(widthPx: number, heightPx: number): CardScale {
  const long = Math.max(widthPx, heightPx);
  const short = Math.min(widthPx, heightPx);
  return {
    mmPerPx: (CARD_MM.long / long + CARD_MM.short / short) / 2,
    aspectError: long / short / CARD_ASPECT - 1,
    skew: 0,
  };
}

/** Corners in order: top-left, top-right, bottom-right, bottom-left (pixels). */
export function cardScaleFromCorners(c: [Pt, Pt, Pt, Pt]): CardScale {
  const [tl, tr, br, bl] = c;
  const top = dist(tl, tr);
  const bottom = dist(bl, br);
  const left = dist(tl, bl);
  const right = dist(tr, br);
  const horiz = (top + bottom) / 2;
  const vert = (left + right) / 2;
  const long = Math.max(horiz, vert);
  const short = Math.min(horiz, vert);
  const skew = Math.max(Math.abs(top - bottom) / horiz, Math.abs(left - right) / vert);
  return {
    mmPerPx: (CARD_MM.long / long + CARD_MM.short / short) / 2,
    aspectError: long / short / CARD_ASPECT - 1,
    skew,
  };
}

export const SCALE_LIMITS = { maxAspectError: 0.06, maxSkew: 0.06 } as const;

export function scaleProblem(s: CardScale): 'card_aspect' | 'card_skew' | null {
  if (Math.abs(s.aspectError) > SCALE_LIMITS.maxAspectError) return 'card_aspect';
  if (s.skew > SCALE_LIMITS.maxSkew) return 'card_skew';
  return null;
}

export interface LinearCal {
  a: number;
  b: number;
}
export interface Calibration {
  calibrated: boolean;
  dims: Record<DimKey, LinearCal>;
  /** How many tape-measured hands the fit used. */
  n: number;
}

export const IDENTITY_CALIBRATION: Calibration = {
  calibrated: false,
  n: 0,
  dims: {
    handLength: { a: 1, b: 0 },
    palmWidth: { a: 1, b: 0 },
    indexLength: { a: 1, b: 0 },
    middleLength: { a: 1, b: 0 },
    thumbIndexSpan: { a: 1, b: 0 },
  },
};

export function toMm(dimsPx: Dims, mmPerPx: number, cal: Calibration = IDENTITY_CALIBRATION): Dims {
  const out = {} as Dims;
  for (const k of Object.keys(dimsPx) as DimKey[]) {
    const c = cal.dims[k];
    out[k] = c.a * dimsPx[k] * mmPerPx + c.b;
  }
  return out;
}

export function median(xs: number[]): number {
  if (!xs.length) return NaN;
  const s = [...xs].sort((a, b) => a - b);
  const mid = s.length >> 1;
  return s.length % 2 ? (s[mid] as number) : ((s[mid - 1] as number) + (s[mid] as number)) / 2;
}

/** Robust sigma estimate: 1.4826 × median absolute deviation. */
export function robustSigma(xs: number[]): number {
  const m = median(xs);
  return 1.4826 * median(xs.map((x) => Math.abs(x - m)));
}

/**
 * Aggregate per-frame measurements (mm) into one Measurements object:
 * median per dimension after dropping frames whose hand length is > 3 robust sigmas away.
 */
export function aggregate(frames: Dims[], calibrated: boolean): Measurements | null {
  if (frames.length < 3) return null;
  const hl = frames.map((f) => f.handLength);
  const m = median(hl);
  const s = Math.max(robustSigma(hl), 0.25);
  const kept = frames.filter((f) => Math.abs(f.handLength - m) <= 3 * s);
  if (kept.length < 3) return null;
  const med = (k: DimKey) => median(kept.map((f) => f[k]));
  return {
    handLengthMm: Number(med('handLength').toFixed(1)),
    palmWidthMm: Number(med('palmWidth').toFixed(1)),
    indexLengthMm: Number(med('indexLength').toFixed(1)),
    middleLengthMm: Number(med('middleLength').toFixed(1)),
    thumbIndexSpanMm: Number(med('thumbIndexSpan').toFixed(1)),
    spreadMm: Number(robustSigma(kept.map((f) => f.handLength)).toFixed(2)),
    samples: kept.length,
    calibrated,
  };
}

/**
 * Least-squares line through (measured, true) pairs; used by scripts/calibrate.ts after
 * tape-measuring a group of hands.
 */
export function fitLine(pairs: Array<[number, number]>): LinearCal & { r2: number } {
  const n = pairs.length;
  if (n < 2) return { a: 1, b: 0, r2: 0 };
  const mx = pairs.reduce((s, p) => s + p[0], 0) / n;
  const my = pairs.reduce((s, p) => s + p[1], 0) / n;
  let sxy = 0;
  let sxx = 0;
  let syy = 0;
  for (const [x, y] of pairs) {
    sxy += (x - mx) * (y - my);
    sxx += (x - mx) ** 2;
    syy += (y - my) ** 2;
  }
  const a = sxx === 0 ? 1 : sxy / sxx;
  const b = my - a * mx;
  const r2 = sxx === 0 || syy === 0 ? 0 : (sxy * sxy) / (sxx * syy);
  return { a, b, r2 };
}
