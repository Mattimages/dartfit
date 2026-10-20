/**
 * Technical drawing of a barrel: the ideal (red, your fit) with its tolerance envelope, optionally a
 * real dart drawn over it at the same scale (green). Everything is computed from the engine's
 * geometry, so what you see is what was matched.
 */
import { radiusAt, type IdealBarrel, type Profile } from '@dartfit/engine';
import { s } from '../h';
import { num, t } from '../i18n';

export interface Outline {
  lengthMm: number;
  diameterMm: number;
  profile: Profile;
}

interface DrawingOptions {
  ideal: IdealBarrel;
  lengthBand: [number, number];
  diameterBand: [number, number];
  match?: Outline & { label: string };
  animate?: boolean;
  /** Title-block line under the title, e.g. "22 g · 90% tungsten". */
  caption?: string;
}

const W = 480;
const POINT_MM = 10;
const SHAFT_MM = 9;

/** Closed outline path of a barrel at scale `k` px/mm, front at x0, centreline at cy. */
export function barrelPath(o: Outline, x0: number, cy: number, k: number, steps = 90): string {
  const R = (o.diameterMm / 2) * k;
  const L = o.lengthMm * k;
  const top: string[] = [];
  const bottom: string[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const r = R * radiusAt(o.profile, t);
    const x = (x0 + t * L).toFixed(1);
    top.push(`${x},${(cy - r).toFixed(1)}`);
    bottom.push(`${x},${(cy + r).toFixed(1)}`);
  }
  return `M${top.join('L')}L${bottom.reverse().join('L')}Z`;
}

function arrow(x1: number, y1: number, x2: number, y2: number, cls = 'dim'): SVGElement {
  // Dimension line with arrowheads at both ends.
  const a = Math.atan2(y2 - y1, x2 - x1);
  const head = (x: number, y: number, dir: number) => {
    const l = 7;
    const w = 0.42;
    return `M${x},${y}L${x - l * Math.cos(dir - w)},${y - l * Math.sin(dir - w)}M${x},${y}L${x - l * Math.cos(dir + w)},${y - l * Math.sin(dir + w)}`;
  };
  return s('path', {
    class: cls,
    d: `M${x1},${y1}L${x2},${y2}${head(x2, y2, a)}${head(x1, y1, a + Math.PI)}`,
  });
}

function line(x1: number, y1: number, x2: number, y2: number, cls: string, style?: string): SVGElement {
  return s('line', { x1, y1, x2, y2, class: cls, style });
}

function text(
  x: number,
  y: number,
  str: string,
  cls: string,
  anchor: 'start' | 'middle' | 'end' = 'middle',
  style?: string,
) {
  return s('text', { x, y, class: cls, 'text-anchor': anchor, style }, str);
}

export function dartDrawing(o: DrawingOptions): SVGElement {
  const b = o.ideal;
  const maxL = Math.max(o.lengthBand[1], b.lengthMm, o.match?.lengthMm ?? 0);
  const maxD = Math.max(o.diameterBand[1], b.diameterMm, o.match?.diameterMm ?? 0);
  const k = Math.min(9, (W - 32) / (POINT_MM + maxL + SHAFT_MM));
  const x0 = 16 + POINT_MM * k;
  const R = (maxD / 2) * k;
  const cy = 62 + R;
  const yLen = cy + R + 52;
  const tbH = 44;
  const tbY = yLen + 32;
  const H = tbY + tbH + 8;
  const d = (n: number) => `--d:${n}s`;

  const ideal: Outline = { lengthMm: b.lengthMm, diameterMm: b.diameterMm, profile: b.profile };
  const lo: Outline = { ...ideal, lengthMm: o.lengthBand[0], diameterMm: o.diameterBand[0] };
  const hi: Outline = { ...ideal, lengthMm: o.lengthBand[1], diameterMm: o.diameterBand[1] };
  const xEnd = x0 + b.lengthMm * k;
  const rMax = (b.diameterMm / 2) * k;

  // Point (front) and shaft stub (back), both cut off with a break line.
  const pointR = 1.2 * k;
  const point = s('path', {
    class: 'part',
    d: `M${x0},${cy - pointR}L${16 + 2 * k},${cy - 0.5}L${16},${cy}L${16 + 2 * k},${cy + 0.5}L${x0},${cy + pointR}Z`,
  });
  const shaftR = 2.6 * k;
  const shaftX2 = x0 + maxL * k + SHAFT_MM * k;
  const shaft = s('path', {
    class: 'part',
    d: `M${xEnd},${cy - shaftR}L${shaftX2},${cy - shaftR}L${shaftX2 - 4},${cy}L${shaftX2},${cy + shaftR}L${xEnd},${cy + shaftR}Z`,
  });

  // Grip zone: machined rings across the barrel, denser for a grippier target.
  const [gz0, gz1] = b.gripZone;
  const rings: SVGElement[] = [];
  const pitch = 1.6; // mm between rings at grip 3
  for (let x = gz0 + pitch / 2; x < gz1; x += pitch) {
    const t = x / b.lengthMm;
    const r = rMax * radiusAt(b.profile, t);
    rings.push(line(x0 + x * k, cy - r + 1, x0 + x * k, cy + r - 1, 'grip'));
  }

  // Centre of gravity symbol: circle with two filled quadrants.
  const cx = x0 + b.cogMm * k;
  const cr = 6.5;
  const cog = s(
    'g',
    { class: 'cog', style: d(1.0) },
    s('circle', { cx, cy, r: cr, fill: 'var(--paper)', stroke: 'var(--ink)', 'stroke-width': 1.2 }),
    s('path', {
      d: `M${cx},${cy}L${cx + cr},${cy}A${cr},${cr} 0 0 1 ${cx},${cy + cr}Z M${cx},${cy}L${cx - cr},${cy}A${cr},${cr} 0 0 1 ${cx},${cy - cr}Z`,
    }),
  );

  // Dimensions.
  const yCog = cy - R - 30;
  // Diameter is dimensioned at the rear end of the flat (thickest) part: clear of the CoG
  // dimension, which runs from the front. The label sits to the right of the arrow.
  const xMaxPos = Math.max(x0 + 4, x0 + ((1 - b.profile.rear) * b.lengthMm - 2) * k);
  const dAnchor = 'start' as const;
  const dTextX = xMaxPos + 8;
  const dims = s(
    'g',
    null,
    // overall length, below
    line(x0, cy + rMax + 4, x0, yLen + 6, 'dim', d(0.2)),
    line(xEnd, cy + rMax + 4, xEnd, yLen + 6, 'dim', d(0.2)),
    s('g', { style: d(0.3) }, arrow(x0, yLen, xEnd, yLen)),
    text((x0 + xEnd) / 2, yLen - 6, `${num(b.lengthMm)} mm`, 'dimtext', 'middle', d(0.3)),
    text(
      (x0 + xEnd) / 2,
      yLen + 18,
      t('draw.band', { lo: num(o.lengthBand[0]), hi: num(o.lengthBand[1]) }),
      'note',
      'middle',
      d(0.3),
    ),
    // diameter, vertical across the thickest point
    s('g', { style: d(0.5) }, arrow(xMaxPos, cy - rMax, xMaxPos, cy + rMax)),
    text(dTextX, cy - rMax - 8, `Ø ${num(b.diameterMm)}`, 'dimtext', dAnchor, d(0.5)),
    // centre of gravity from the front, above
    line(x0, cy - rMax - 4, x0, yCog - 6, 'dim', d(0.7)),
    line(cx, cy - cr - 2, cx, yCog - 6, 'dim', d(0.7)),
    s('g', { style: d(0.8) }, arrow(x0, yCog, cx, yCog)),
    text((x0 + cx) / 2, yCog - 7, t('draw.cog', { mm: num(b.cogMm) }), 'dimtext', 'middle', d(0.8)),
    // grip zone bracket under the barrel, inside the length dimension
    s('path', {
      class: 'dim',
      style: d(0.9),
      d: `M${x0 + gz0 * k},${cy + rMax + 8}l0,5L${x0 + gz1 * k},${cy + rMax + 13}l0,-5`,
    }),
    text(x0 + ((gz0 + gz1) / 2) * k, cy + rMax + 27, t('draw.grip'), 'note', 'middle', d(0.9)),
  );

  const kids: Array<SVGElement | null> = [
    line(14, cy, W - 14, cy, 'centre'),
    point,
    shaft,
    s('path', { class: 'band', d: barrelPath(hi, x0, cy, k) }),
    s('path', { class: 'band', d: barrelPath(lo, x0, cy, k) }),
    s('path', { class: 'ideal', d: barrelPath(ideal, x0, cy, k), style: `${d(0)};--len:1600` }),
    s('g', null, ...rings),
    o.match
      ? s('path', { class: 'match', d: barrelPath(o.match, x0, cy, k), style: `${d(1.2)};--len:1600` })
      : null,
    cog,
    dims,
  ];

  // Title block, bottom right, like a workshop drawing.
  const tbW = 214;
  const tbX = W - tbW - 8;
  kids.push(
    s(
      'g',
      { class: 'titleblock' },
      s('rect', { x: tbX, y: tbY, width: tbW, height: tbH }),
      s('line', { x1: tbX, y1: tbY + 21, x2: tbX + tbW, y2: tbY + 21, stroke: 'var(--ink)' }),
      text(tbX + 8, tbY + 15, t('draw.title'), 'tb-strong', 'start'),
      text(tbX + 8, tbY + 37, o.caption ?? '', 'tb', 'start'),
      text(tbX + tbW - 8, tbY + 15, 'DartFit', 'tb', 'end'),
    ),
  );

  return s(
    'svg',
    {
      class: `drawing${o.animate ? ' draw-in' : ''}`,
      viewBox: `0 0 ${W} ${H}`,
      role: 'img',
      'aria-label': t('r.drawing'),
    },
    s('title', null, t('r.drawing')),
    ...kids.filter(Boolean),
  );
}
