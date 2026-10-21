/**
 * Illustrations, all drawn from data: a hand from 21 landmarks, a complete dart from a barrel's real
 * profile (length, diameter, shape, grip), and small pictograms for the answer tiles.
 * No bitmaps, so it stays sharp, themeable and allowed under the strict CSP.
 */
import { radiusAt, type Profile } from '@dartfit/engine';
import { s } from '../h';

export type MmPoint = { x: number; y: number };

let gid = 0;

// ── Hand ────────────────────────────────────────────────────────────────

/** An average right hand, palm down, wrist crease at (0,0), in mm (hand length 185 mm). */
const TEMPLATE: MmPoint[] = [
  { x: 0, y: 0 },
  { x: -26, y: -22 },
  { x: -46, y: -42 },
  { x: -60, y: -60 },
  { x: -70, y: -77 },
  { x: -22, y: -96 },
  { x: -27, y: -128 },
  { x: -30, y: -150 },
  { x: -32, y: -170 },
  { x: 0, y: -100 },
  { x: 1, y: -135 },
  { x: 2, y: -160 },
  { x: 2, y: -185 },
  { x: 20, y: -94 },
  { x: 24, y: -126 },
  { x: 26, y: -148 },
  { x: 28, y: -167 },
  { x: 38, y: -84 },
  { x: 45, y: -108 },
  { x: 49, y: -124 },
  { x: 52, y: -141 },
];
const FINGERS = [
  [1, 2, 3, 4],
  [5, 6, 7, 8],
  [9, 10, 11, 12],
  [13, 14, 15, 16],
  [17, 18, 19, 20],
];
const FINGER_W = [19, 17, 18, 17, 15];

/** Template landmarks scaled to a hand length. */
export function templateHand(lengthMm = 185): MmPoint[] {
  const k = lengthMm / 185;
  return TEMPLATE.map((p) => ({ x: p.x * k, y: p.y * k }));
}

interface HandOpts {
  points?: MmPoint[];
  lengthMm?: number;
  /** Red landmark dots, as the scanner sees them. */
  dots?: boolean;
  /** Wrist-to-fingertip measuring line with its value. */
  measure?: string;
  className?: string;
}

/** A filled hand silhouette (fingers are thick round strokes over a palm polygon). */
export function handArt(o: HandOpts = {}): SVGElement {
  const pts = o.points ?? templateHand(o.lengthMm);
  const k = (o.lengthMm ?? 185) / 185;
  const xs = pts.map((p) => p.x);
  const ys = pts.map((p) => p.y);
  const pad = 16 * k;
  const minX = Math.min(...xs) - pad - (o.measure ? 26 * k : 0);
  const maxX = Math.max(...xs) + pad + (o.measure ? 30 * k : 0);
  const minY = Math.min(...ys) - pad;
  const maxY = Math.max(...ys) + 26 * k;
  const P = (i: number) => pts[i]!;
  const palm = [0, 1, 2, 5, 9, 13, 17]
    .map((i, j) => `${j ? 'L' : 'M'}${P(i).x.toFixed(1)},${P(i).y.toFixed(1)}`)
    .join('');
  const wrist = `M${(P(0).x - 24 * k).toFixed(1)},${(P(0).y + 26 * k).toFixed(1)}L${(P(0).x - 22 * k).toFixed(1)},${(P(0).y - 6 * k).toFixed(1)}L${(P(0).x + 30 * k).toFixed(1)},${(P(0).y - 14 * k).toFixed(1)}L${(P(0).x + 28 * k).toFixed(1)},${(P(0).y + 26 * k).toFixed(1)}Z`;
  const fingers = FINGERS.map((f, i) => {
    const chain = f.map(P);
    if (i === 0) chain.unshift({ x: (P(0).x + P(1).x) / 2, y: (P(0).y + P(1).y) / 2 });
    return s('path', {
      class: 'hand-finger',
      d: chain.map((p, n) => `${n ? 'L' : 'M'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(''),
      'stroke-width': (FINGER_W[i]! * k).toFixed(1),
    });
  });
  const fade = `hf${++gid}`;
  const children: SVGElement[] = [
    s(
      'defs',
      null,
      s(
        'linearGradient',
        { id: fade, x1: 0, y1: 0, x2: 0, y2: 1 },
        s('stop', { offset: 0, class: 'wrist-0' }),
        s('stop', { offset: 1, class: 'wrist-1' }),
      ),
    ),
    s('path', { class: 'hand-wrist', d: wrist, fill: `url(#${fade})` }),
    s('path', { class: 'hand-skin', d: `${palm}Z`, 'stroke-width': (14 * k).toFixed(1) }),
    ...fingers,
  ];
  if (o.dots)
    pts.forEach((p, i) =>
      children.push(s('circle', { class: 'hand-dot', cx: p.x, cy: p.y, r: 2.6 * k, style: `--i:${i}` })),
    );
  if (o.measure) {
    const x = Math.max(...xs) + 18 * k;
    const top = P(12).y;
    children.push(
      s('path', {
        class: 'hand-measure',
        d: `M${x},${P(0).y}L${x},${top}M${x - 5 * k},${P(0).y}L${x + 5 * k},${P(0).y}M${x - 5 * k},${top}L${x + 5 * k},${top}`,
      }),
      s('path', {
        class: 'hand-guide',
        d: `M${P(12).x},${top}L${x},${top}M${P(0).x},${P(0).y}L${x},${P(0).y}`,
      }),
      s(
        'text',
        {
          class: 'hand-label',
          x: x + 7 * k,
          y: (P(0).y + top) / 2,
          'font-size': 11 * k,
          transform: `rotate(-90 ${x + 7 * k} ${(P(0).y + top) / 2})`,
          'text-anchor': 'middle',
        },
        o.measure,
      ),
    );
  }
  return s(
    'svg',
    {
      class: `hand-art ${o.className ?? ''}`.trim(),
      viewBox: `${minX.toFixed(1)} ${minY.toFixed(1)} ${(maxX - minX).toFixed(1)} ${(maxY - minY).toFixed(1)}`,
      'aria-hidden': 'true',
    },
    ...children,
  );
}

// ── Dart ────────────────────────────────────────────────────────────────

export interface DartShape {
  lengthMm: number;
  diameterMm: number;
  profile: Profile;
  grip?: number | null;
  soft?: boolean;
  /** Flight colour, 0–3. */
  tone?: number;
  /** Red measuring line under the barrel with this label, e.g. "48 mm". */
  dim?: string;
}

const POINT = 32;
const SHAFT = 34;

/** Deterministic flight colour from an id, so a dart always looks the same. */
export const toneFor = (id: string) => [...id].reduce((a, c) => a + c.charCodeAt(0), 0) % 4;

/** A complete dart, side view, point left. Same scale for every dart (1 unit = 1 mm). */
export function dartArt(d: DartShape, className = ''): SVGElement {
  const id = `g${++gid}`;
  const cy = 20;
  const x0 = POINT;
  const L = d.lengthMm;
  const R = d.diameterMm / 2;
  const steps = 60;
  const top: string[] = [];
  const bot: string[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const r = R * radiusAt(d.profile, t);
    top.push(`${(x0 + t * L).toFixed(2)},${(cy - r).toFixed(2)}`);
    bot.push(`${(x0 + t * L).toFixed(2)},${(cy + r).toFixed(2)}`);
  }
  const barrel = `M${top.join('L')}L${bot.reverse().join('L')}Z`;
  // Grip rings across the middle of the barrel; more grip, more rings.
  const n = d.grip ? 4 + d.grip * 3 : 7;
  const rings: SVGElement[] = [];
  for (let i = 0; i < n; i++) {
    const t = 0.22 + (0.56 * i) / Math.max(1, n - 1);
    const r = R * radiusAt(d.profile, t) * 0.97;
    const x = x0 + t * L;
    rings.push(s('line', { class: 'dart-ring', x1: x, x2: x, y1: cy - r, y2: cy + r }));
  }
  const sx = x0 + L;
  const point = d.soft
    ? `M${x0},${cy - 1.6}L6,${cy - 1.1}Q3,${cy} 6,${cy + 1.1}L${x0},${cy + 1.6}Z`
    : `M${x0},${cy - 1.1}L2,${cy - 0.25}L0,${cy}L2,${cy + 0.25}L${x0},${cy + 1.1}Z`;
  const shaft = `M${sx},${cy - 2.7}L${sx + SHAFT},${cy - 2.2}L${sx + SHAFT},${cy + 2.2}L${sx},${cy + 2.7}Z`;
  const fx = sx + SHAFT;
  const flight = `M${fx - 30},${cy - 1.5}L${fx - 13},${cy - 16}L${fx + 7},${cy - 17.5}L${fx + 7},${cy + 17.5}L${fx - 13},${cy + 16}L${fx - 30},${cy + 1.5}Z`;
  const total = fx + 9;
  const H = d.dim ? 54 : 44;
  // The dimension line spans the barrel exactly: what you see is the length that was matched.
  const dimY = 45;
  const dim = d.dim
    ? [
        s('path', {
          class: 'dart-dim',
          d: `M${x0},${dimY}L${sx},${dimY}M${x0},${dimY - 2.2}L${x0},${dimY + 2.2}M${sx},${dimY - 2.2}L${sx},${dimY + 2.2}`,
        }),
        s('text', { class: 'dart-dimtext', x: (x0 + sx) / 2, y: dimY + 6.6, 'text-anchor': 'middle' }, d.dim),
      ]
    : [];
  return s(
    'svg',
    { class: `dart-art ${className}`.trim(), viewBox: `-1 0 ${total} ${H}`, 'aria-hidden': 'true' },
    s(
      'defs',
      null,
      s(
        'linearGradient',
        { id, x1: 0, y1: 0, x2: 0, y2: 1 },
        s('stop', { offset: 0, class: 'steel-0' }),
        s('stop', { offset: 0.42, class: 'steel-1' }),
        s('stop', { offset: 1, class: 'steel-2' }),
      ),
      s(
        'radialGradient',
        { id: `${id}s` },
        s('stop', { offset: 0, class: 'shadow-0' }),
        s('stop', { offset: 1, class: 'shadow-1' }),
      ),
    ),
    s('ellipse', { cx: (x0 + total) / 2, cy: 39, rx: (total - x0) * 0.55, ry: 2.6, fill: `url(#${id}s)` }),
    ...dim,
    s('path', { class: `dart-flight tone-${d.tone ?? 0}`, d: flight }),
    s('path', { class: 'dart-shaft', d: shaft }),
    s('path', { class: 'dart-point', d: point }),
    s('path', { class: 'dart-barrel', d: barrel, fill: `url(#${id})` }),
    ...rings,
  );
}

// ── Pictograms for the answer tiles (64 × 32) ───────────────────────────

const ico = (...c: SVGElement[]) =>
  s('svg', { class: 'ico', viewBox: '0 0 64 32', 'aria-hidden': 'true' }, ...c);
const bar = (y = 16, h = 8) =>
  s('rect', { class: 'ico-bar', x: 16, y: y - h / 2, width: 30, height: h, rx: 2 });
const tipLine = s('path', { class: 'ico-line', d: 'M4,16L16,16' });

export function pictogram(kind: string, value: string): SVGElement | null {
  switch (kind) {
    case 'tip':
      return value === 'soft'
        ? ico(
            s('path', { class: 'ico-fill', d: 'M5,14Q2,16 5,18L16,18L16,14Z' }),
            bar(),
            s('path', { class: 'ico-line', d: 'M46,16L60,16' }),
          )
        : ico(
            s('path', { class: 'ico-fill', d: 'M2,16L16,14.6L16,17.4Z' }),
            bar(),
            s('path', { class: 'ico-line', d: 'M46,16L60,16' }),
          );
    case 'hold': {
      const x = value === 'front' ? 22 : value === 'middle' ? 31 : 40;
      return ico(tipLine, bar(), s('ellipse', { class: 'ico-accent', cx: x, cy: 16, rx: 7, ry: 9.5 }));
    }
    case 'fingers': {
      const n = Number(value);
      const xs = n === 2 ? [24, 38] : n === 3 ? [21, 31, 41] : [19, 27, 35, 43];
      return ico(tipLine, bar(), ...xs.map((x) => s('circle', { class: 'ico-accent', cx: x, cy: 16, r: 4 })));
    }
    case 'throwStyle':
      if (value === 'flat')
        return ico(
          s('path', { class: 'ico-path', d: 'M4,20L56,15' }),
          s('path', { class: 'ico-line', d: 'M60,4L60,28' }),
        );
      if (value === 'arc')
        return ico(
          s('path', { class: 'ico-path', d: 'M4,24Q30,-6 56,16' }),
          s('path', { class: 'ico-line', d: 'M60,4L60,28' }),
        );
      return ico(
        s('path', { class: 'ico-path dashed', d: 'M4,20L56,15M4,24Q30,-6 56,16' }),
        s('path', { class: 'ico-line', d: 'M60,4L60,28' }),
      );
    case 'moisture': {
      const drop = (x: number) =>
        s('path', {
          class: 'ico-accent',
          d: `M${x},6Q${x + 6},15 ${x + 6},19A6,6 0 0 1 ${x - 6},19Q${x - 6},15 ${x},6Z`,
        });
      if (value === 'dry')
        return ico(
          s('circle', { class: 'ico-path', cx: 32, cy: 16, r: 8 }),
          s('path', {
            class: 'ico-line',
            d: 'M32,2L32,5M32,27L32,30M18,16L21,16M43,16L46,16M22,6L24,8M40,24L42,26M42,6L40,8M24,24L22,26',
          }),
        );
      return value === 'normal' ? ico(drop(32)) : ico(drop(18), drop(32), drop(46));
    }
    case 'gripFeel': {
      const n = Number(value) * 2;
      return ico(
        tipLine,
        bar(16, 10),
        ...Array.from({ length: n }, (_, i) => {
          const x = 19 + (24 * i) / Math.max(1, n - 1);
          return s('line', { class: 'ico-groove', x1: x, x2: x, y1: 11.5, y2: 20.5 });
        }),
      );
    }
    case 'thickness': {
      if (value === 'auto')
        return ico(
          tipLine,
          s('rect', { class: 'ico-path dashed', x: 16, y: 10, width: 30, height: 12, rx: 2 }),
          s('rect', { class: 'ico-bar', x: 16, y: 13, width: 30, height: 6, rx: 2 }),
        );
      const h = value === 'slim' ? 6 : value === 'standard' ? 9 : 13;
      return ico(tipLine, bar(16, h));
    }
    default:
      return null;
  }
}
