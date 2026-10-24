/**
 * A real dartboard and a darts checkout: the throws that score exactly N, finishing on a double,
 * the way a player would go out (98 = T20, D19).
 */
import { s } from '../h';

export interface Hit {
  /** 1 single, 2 double, 3 treble. */
  m: 1 | 2 | 3;
  /** 1–20, or 25 for the bull. */
  n: number;
}

/** Clockwise from the top. */
export const ORDER = [20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5];
const val = (h: Hit) => h.m * h.n;
const desc = Array.from({ length: 20 }, (_, i) => 20 - i);
// Doubles players like to leave first, then the rest; the bull last.
const FINISH: Hit[] = [
  ...[20, 16, 18, 12, 10, 8, 19, 17, 14, 15, 13, 11, 9, 7, 6, 5, 4, 3, 2, 1].map((n) => ({
    m: 2 as const,
    n,
  })),
  { m: 2, n: 25 },
];
const SET_UP: Hit[] = [
  ...desc.map((n) => ({ m: 3 as const, n })),
  { m: 1, n: 25 },
  ...desc.map((n) => ({ m: 1 as const, n })),
  { m: 2, n: 25 },
];

/** Fewest darts that score exactly `n` and end on a double; null when it can't be done. */
export function checkout(n: number): Hit[] | null {
  for (const f of FINISH) if (val(f) === n) return [f];
  for (const f of FINISH) for (const a of SET_UP) if (val(a) + val(f) === n) return [a, f];
  for (const f of FINISH)
    for (const a of SET_UP) for (const b of SET_UP) if (val(a) + val(b) + val(f) === n) return [a, b, f];
  return null;
}

export const hitLabel = (h: Hit) =>
  h.n === 25 ? (h.m === 2 ? 'Bull' : '25') : `${h.m === 3 ? 'T' : h.m === 2 ? 'D' : ''}${h.n}`;
export const hitValue = val;

// Board radii in a −50…50 box (rings a little wider than real life, so a hit reads at phone size).
const R = { bull: 2.6, outer: 6, trebIn: 25.5, trebOut: 29.5, dblIn: 40.5, dblOut: 45, numbers: 48.4 };
const rad = (deg: number) => (deg * Math.PI) / 180;
const at = (r: number, deg: number) => [r * Math.cos(rad(deg)), r * Math.sin(rad(deg))] as const;

function sector(r0: number, r1: number, a0: number, a1: number) {
  const [x0, y0] = at(r1, a0);
  const [x1, y1] = at(r1, a1);
  const [x2, y2] = at(r0, a1);
  const [x3, y3] = at(r0, a0);
  const f = (v: number) => v.toFixed(2);
  return `M${f(x0)},${f(y0)}A${r1},${r1} 0 0 1 ${f(x1)},${f(y1)}L${f(x2)},${f(y2)}A${r0},${r0} 0 0 0 ${f(x3)},${f(y3)}Z`;
}

/** Centre angle of a number's segment (degrees, SVG: 0 = right, clockwise). */
const angleOf = (n: number) => -90 + ORDER.indexOf(n) * 18;

/** Where a hit lands on the board. */
export function hitPoint(h: Hit): [number, number] {
  if (h.n === 25) return h.m === 2 ? [0, 0] : [0, -(R.bull + R.outer) / 2];
  const r =
    h.m === 3 ? (R.trebIn + R.trebOut) / 2 : h.m === 2 ? (R.dblIn + R.dblOut) / 2 : (R.trebOut + R.dblIn) / 2;
  const [x, y] = at(r, angleOf(h.n));
  return [x, y];
}

export function boardSvg(cls: string): SVGSVGElement {
  const svg = s('svg', { viewBox: '-52 -52 104 104', class: cls, 'aria-hidden': 'true' }) as SVGSVGElement;
  svg.append(s('circle', { r: 51.5, class: 'bc-rim' }));
  ORDER.forEach((n, i) => {
    const a0 = -99 + i * 18;
    const a1 = a0 + 18;
    const even = i % 2 === 0;
    svg.append(
      s('path', { d: sector(R.outer, R.trebIn, a0, a1), class: even ? 'bc-dark' : 'bc-light' }),
      s('path', { d: sector(R.trebIn, R.trebOut, a0, a1), class: even ? 'bc-red' : 'bc-green' }),
      s('path', { d: sector(R.trebOut, R.dblIn, a0, a1), class: even ? 'bc-dark' : 'bc-light' }),
      s('path', { d: sector(R.dblIn, R.dblOut, a0, a1), class: even ? 'bc-red' : 'bc-green' }),
    );
    const [x, y] = at(R.numbers, angleOf(n));
    svg.append(s('text', { x: x.toFixed(2), y: (y + 1.6).toFixed(2), class: 'bc-num' }, String(n)));
  });
  svg.append(s('circle', { r: R.outer, class: 'bc-green' }), s('circle', { r: R.bull, class: 'bc-red' }));
  return svg;
}
