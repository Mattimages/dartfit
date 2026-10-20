/**
 * Card detection without OpenCV: the user lays the card inside an on-screen guide, so we only need
 * to find four strong straight edges inside a known region. We project gradient energy onto rows
 * and columns, pick the strongest pair of peaks on each axis, then re-project inside the found
 * span to refine. Works on a grayscale buffer, so it runs the same in the browser and in tests.
 */
import { CARD_ASPECT, cardScaleFromBox, type CardScale } from './measure.js';

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface CardDetection {
  box: Rect;
  scale: CardScale;
  /** Edge peak strength relative to the median profile; higher is more certain. */
  strength: number;
}

export function toGray(rgba: Uint8ClampedArray, w: number, h: number): Uint8ClampedArray {
  const g = new Uint8ClampedArray(w * h);
  for (let i = 0, j = 0; i < g.length; i++, j += 4) {
    g[i] = (rgba[j]! * 299 + rgba[j + 1]! * 587 + rgba[j + 2]! * 114) / 1000;
  }
  return g;
}

function smooth(p: Float64Array, r = 2): Float64Array {
  const out = new Float64Array(p.length);
  for (let i = 0; i < p.length; i++) {
    let s = 0;
    let n = 0;
    for (let k = -r; k <= r; k++) {
      const j = i + k;
      if (j >= 0 && j < p.length) {
        s += p[j]!;
        n++;
      }
    }
    out[i] = s / n;
  }
  return out;
}

function profiles(g: Uint8ClampedArray, w: number, roi: Rect, xr: [number, number], yr: [number, number]) {
  const rows = new Float64Array(roi.h);
  const cols = new Float64Array(roi.w);
  for (let y = Math.max(1, yr[0]); y < Math.min(roi.h - 1, yr[1]); y++) {
    for (let x = Math.max(1, xr[0]); x < Math.min(roi.w - 1, xr[1]); x++) {
      const gx = roi.x + x;
      const gy = roi.y + y;
      const i = gy * w + gx;
      const dx = Math.abs(g[i + 1]! - g[i - 1]!);
      const dy = Math.abs(g[i + w]! - g[i - w]!);
      rows[y] = rows[y]! + dy;
      cols[x] = cols[x]! + dx;
    }
  }
  return { rows: smooth(rows), cols: smooth(cols) };
}

/** Strongest two peaks at least `minGap` apart; returns [low, high] indices and their mean strength. */
function peakPair(p: Float64Array, minGap: number): { a: number; b: number; s: number } | null {
  let best: { a: number; b: number; s: number } | null = null;
  // Local maxima only, to keep this O(k²) with small k.
  const peaks: number[] = [];
  for (let i = 1; i < p.length - 1; i++) if (p[i]! >= p[i - 1]! && p[i]! >= p[i + 1]! && p[i]! > 0) peaks.push(i);
  peaks.sort((x, y) => p[y]! - p[x]!);
  const top = peaks.slice(0, 12);
  for (let i = 0; i < top.length; i++) {
    for (let j = i + 1; j < top.length; j++) {
      const a = Math.min(top[i]!, top[j]!);
      const b = Math.max(top[i]!, top[j]!);
      if (b - a < minGap) continue;
      const s = (p[a]! + p[b]!) / 2;
      if (!best || s > best.s) best = { a, b, s };
    }
  }
  return best;
}

function medianOf(p: Float64Array): number {
  const s = Array.from(p).sort((a, b) => a - b);
  return s[s.length >> 1] ?? 0;
}

/**
 * Find a landscape card inside `roi` of a grayscale image `g` (width `w`).
 * Returns null when no plausible card is found (aspect off by more than 12% or weak edges).
 */
export function detectCard(g: Uint8ClampedArray, w: number, roi: Rect): CardDetection | null {
  const full: [number, number] = [0, roi.w];
  const fullY: [number, number] = [0, roi.h];
  const p1 = profiles(g, w, roi, full, fullY);
  const cols = peakPair(p1.cols, roi.w * 0.35);
  const rows = peakPair(p1.rows, roi.h * 0.35);
  if (!cols || !rows) return null;
  // Refine: horizontal edges are summed only across the card's columns, vertical edges only across
  // its rows, so background clutter beside the card counts for less.
  const p2 = profiles(g, w, roi, [cols.a + 2, cols.b - 1], fullY);
  const p3 = profiles(g, w, roi, full, [rows.a + 2, rows.b - 1]);
  const rows2 = peakPair(p2.rows, roi.h * 0.35) ?? rows;
  const cols2 = peakPair(p3.cols, roi.w * 0.35) ?? cols;
  const box: Rect = { x: roi.x + cols2.a, y: roi.y + rows2.a, w: cols2.b - cols2.a, h: rows2.b - rows2.a };
  if (box.w <= 0 || box.h <= 0) return null;
  const aspect = box.w / box.h;
  if (Math.abs(aspect / CARD_ASPECT - 1) > 0.12) return null;
  const strength = Math.min(cols2.s / (medianOf(p3.cols) + 1), rows2.s / (medianOf(p2.rows) + 1));
  if (strength < 2) return null;
  return { box, scale: cardScaleFromBox(box.w, box.h), strength: Number(strength.toFixed(2)) };
}
