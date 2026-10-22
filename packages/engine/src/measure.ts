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
    (Math.acos(
      Math.max(-1, Math.min(1, (a.x * b.x + a.y * b.y) / (Math.hypot(a.x, a.y) * Math.hypot(b.x, b.y)))),
    ) *
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
  const zRange = Math.max(
    ...[4, 8, 12, 16, 20].map((i) => Math.abs((lm[i] as Landmark).z - (lm[0] as Landmark).z)),
  );
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

/* ── Perspective correction ──────────────────────────────────────────
 * With the card's four corners we know a plane-to-plane mapping (homography) from image pixels
 * to millimetres on the table. Landmarks mapped through it are free of the perspective error a
 * single px→mm scale leaves when the phone is not held exactly parallel to the table.
 */
export type Homography = [number, number, number, number, number, number, number, number, number];

function solve(A: number[][], b: number[]): number[] {
  const n = b.length;
  const M = A.map((row, i) => [...row, b[i]!]);
  for (let c = 0; c < n; c++) {
    let p = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(M[r]![c]!) > Math.abs(M[p]![c]!)) p = r;
    if (Math.abs(M[p]![c]!) < 1e-12) throw new Error('degenerate corners');
    [M[c], M[p]] = [M[p]!, M[c]!];
    for (let r = 0; r < n; r++) {
      if (r === c) continue;
      const f = M[r]![c]! / M[c]![c]!;
      for (let k = c; k <= n; k++) M[r]![k] = M[r]![k]! - f * M[c]![k]!;
    }
  }
  return M.map((row, i) => row[n]! / row[i]!);
}

/** Homography mapping the four `src` points onto the four `dst` points. */
export function homography(src: [Pt, Pt, Pt, Pt], dst: [Pt, Pt, Pt, Pt]): Homography {
  const A: number[][] = [];
  const b: number[] = [];
  for (let i = 0; i < 4; i++) {
    const { x, y } = src[i]!;
    const { x: u, y: v } = dst[i]!;
    A.push([x, y, 1, 0, 0, 0, -u * x, -u * y]);
    b.push(u);
    A.push([0, 0, 0, x, y, 1, -v * x, -v * y]);
    b.push(v);
  }
  const h = solve(A, b);
  return [h[0]!, h[1]!, h[2]!, h[3]!, h[4]!, h[5]!, h[6]!, h[7]!, 1];
}

export function applyH(H: Homography, p: Pt): Pt {
  const w = H[6] * p.x + H[7] * p.y + H[8];
  return { x: (H[0] * p.x + H[1] * p.y + H[2]) / w, y: (H[3] * p.x + H[4] * p.y + H[5]) / w };
}

/**
 * Image → table-millimetre homography from card corners (TL, TR, BR, BL in pixels). The longer
 * pair of sides is taken as the card's 85.6 mm edge, whichever way the card lies.
 */
export function cardHomography(c: [Pt, Pt, Pt, Pt]): Homography {
  const [tl, tr, br, bl] = c;
  const horiz = (dist(tl, tr) + dist(bl, br)) / 2;
  const vert = (dist(tl, bl) + dist(tr, br)) / 2;
  const [w, h] = horiz >= vert ? [CARD_MM.long, CARD_MM.short] : [CARD_MM.short, CARD_MM.long];
  return homography(c, [
    { x: 0, y: 0 },
    { x: w, y: 0 },
    { x: w, y: h },
    { x: 0, y: h },
  ]);
}

/** Landmarks (normalised to a w×h image) mapped to table millimetres. */
export function landmarksToMm(lm: Landmark[], w: number, h: number, H: Homography): Pt[] {
  return lm.map((p) => applyH(H, { x: p.x * w, y: p.y * h }));
}

/** Hand dimensions in millimetres from landmarks already on the table plane. */
export function handDimensionsFromMm(P: Pt[]): Dims {
  const at = (i: number) => P[i] as Pt;
  return {
    handLength: dist(at(0), at(12)),
    palmWidth: dist(at(5), at(17)),
    indexLength: chain([at(5), at(6), at(7), at(8)]),
    middleLength: chain([at(9), at(10), at(11), at(12)]),
    thumbIndexSpan: dist(at(4), at(8)),
  };
}

/** Apply a calibration to dimensions that are already in millimetres. */
export function calibrate(d: Dims, cal: Calibration = IDENTITY_CALIBRATION): Dims {
  const out = {} as Dims;
  for (const k of Object.keys(d) as DimKey[]) out[k] = cal.dims[k].a * d[k] + cal.dims[k].b;
  return out;
}

/** Per-landmark median across frames (for drawing the measured hand). */
export function medianLandmarks(frames: Pt[][]): Pt[] {
  const n = frames[0]?.length ?? 0;
  return Array.from({ length: n }, (_, i) => ({
    x: median(frames.map((f) => f[i]!.x)),
    y: median(frames.map((f) => f[i]!.y)),
  }));
}

/** True when any hand landmark falls inside the card quadrilateral (hand lying on the card). */
export function handOnCard(lm: Landmark[], w: number, h: number, quad: [Pt, Pt, Pt, Pt]): boolean {
  const inside = (p: Pt) => {
    let sign = 0;
    for (let i = 0; i < 4; i++) {
      const a = quad[i]!;
      const b = quad[(i + 1) % 4]!;
      const cross = (b.x - a.x) * (p.y - a.y) - (b.y - a.y) * (p.x - a.x);
      const s = Math.sign(cross);
      if (s === 0) continue;
      if (sign === 0) sign = s;
      else if (s !== sign) return false;
    }
    return true;
  };
  return lm.some((p) => inside({ x: p.x * w, y: p.y * h }));
}
