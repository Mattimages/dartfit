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
/** Finger widths at the base, mm, for a 185 mm hand (thumb, index, middle, ring, little). */
const FINGER_W = [21, 18, 18.5, 17, 15];

/** Skin tones for the drawing: base, highlight, shade, nail. */
export const SKIN_TONES = [
  ['#f0cdb4', '#fbe5d6', '#cc9c80', '#f8e0d8'],
  ['#e3b896', '#f3d5be', '#b9805e', '#f4dbd1'],
  ['#c68d68', '#dcab89', '#9a6343', '#e6c7b8'],
  ['#a06a48', '#bf8c6a', '#74462c', '#d2ac99'],
  ['#6f4731', '#8f5f45', '#4a2c1c', '#b88f7c'],
] as const;

type V = MmPoint;
const add = (a: V, b: V): V => ({ x: a.x + b.x, y: a.y + b.y });
const sub = (a: V, b: V): V => ({ x: a.x - b.x, y: a.y - b.y });
const mul = (a: V, k: number): V => ({ x: a.x * k, y: a.y * k });
const lerp = (a: V, b: V, t: number): V => add(a, mul(sub(b, a), t));
const unit = (a: V): V => {
  const l = Math.hypot(a.x, a.y) || 1;
  return { x: a.x / l, y: a.y / l };
};
const f1 = (n: number) => n.toFixed(1);

/** A closed Catmull-Rom spline through the points, as cubic Béziers: smooth, no corners. */
function smoothClosed(ps: V[]): string {
  const n = ps.length;
  const at = (i: number) => ps[(i + n) % n]!;
  let d = `M${f1(ps[0]!.x)},${f1(ps[0]!.y)}`;
  for (let i = 0; i < n; i++) {
    const p0 = at(i - 1);
    const p1 = at(i);
    const p2 = at(i + 1);
    const p3 = at(i + 2);
    const c1 = add(p1, mul(sub(p2, p0), 1 / 6));
    const c2 = sub(p2, mul(sub(p3, p1), 1 / 6));
    d += `C${f1(c1.x)},${f1(c1.y)} ${f1(c2.x)},${f1(c2.y)} ${f1(p2.x)},${f1(p2.y)}`;
  }
  return `${d}Z`;
}

/**
 * The back of a hand traced around the landmarks: tapered fingers with round tips, webbing
 * between them, the bulge of the thumb muscle, and the forearm running out of frame.
 * Works for any orientation and for left or right hands (sides are taken from the landmarks).
 */
function handGeometry(pts: V[], k: number) {
  const P = (i: number) => pts[i]!;
  const across = unit(sub(P(17), P(5))); // towards the little finger
  const side = (d: V) => {
    const n = { x: -d.y, y: d.x };
    return n.x * across.x + n.y * across.y < 0 ? mul(n, -1) : n;
  };
  const axis = unit(sub(P(9), P(0))); // up the hand
  const nA = side(axis);
  const fingers = FINGERS.map((f, i) => {
    const c = f.map(P);
    const d = [0, 1, 2].map((j) => unit(sub(c[j + 1]!, c[j]!)));
    const dTip = d[2]!;
    const n = [side(d[0]!), side(unit(add(d[0]!, d[1]!))), side(unit(add(d[1]!, d[2]!))), side(dTip)];
    const w = FINGER_W[i]! * k;
    const wt = w * 0.8; // fingertips are narrower than the base
    const tip = c[3]!;
    const edge = (sgn: -1 | 1) => ({
      web: add(lerp(c[0]!, c[1]!, 0.3), mul(n[0]!, (sgn * w) / 2)),
      pip: add(c[1]!, mul(n[1]!, sgn * w * 0.465)),
      dip: add(c[2]!, mul(n[2]!, sgn * w * 0.43)),
      near: add(sub(tip, mul(dTip, wt * 0.5)), mul(n[3]!, (sgn * wt) / 2)),
      shoulder: add(sub(tip, mul(dTip, wt * 0.1)), mul(n[3]!, sgn * wt * 0.36)),
    });
    return { c, d, n, w, wt, tip, apex: add(tip, mul(dTip, 0.6 * k)), L: edge(-1), R: edge(1) };
  });
  const [T, I, M, Rg, Pk] = fingers as [
    (typeof fingers)[0],
    (typeof fingers)[0],
    (typeof fingers)[0],
    (typeof fingers)[0],
    (typeof fingers)[0],
  ];
  const up = (f: typeof T) => [
    f.L.pip,
    f.L.dip,
    f.L.near,
    f.L.shoulder,
    f.apex,
    f.R.shoulder,
    f.R.near,
    f.R.dip,
    f.R.pip,
  ];
  const web = (a: typeof T, b: typeof T) => [
    a.R.web,
    sub(lerp(a.R.web, b.L.web, 0.5), mul(axis, 2.5 * k)),
    b.L.web,
  ];
  // Thumb: a fuller outer edge (the thenar muscle) and a deep web towards the index finger.
  const tw = T.w;
  const thumb = [
    sub(T.c[0]!, mul(T.n[0]!, tw * 0.66)),
    sub(T.c[1]!, mul(T.n[1]!, tw * 0.52)),
    sub(T.c[2]!, mul(T.n[2]!, tw * 0.47)),
    T.L.near,
    T.L.shoulder,
    T.apex,
    T.R.shoulder,
    T.R.near,
    add(T.c[2]!, mul(T.n[2]!, tw * 0.45)),
    add(T.c[1]!, mul(T.n[1]!, tw * 0.47)),
    sub(
      lerp(add(T.c[1]!, mul(T.n[1]!, tw * 0.5)), add(I.c[0]!, mul(I.n[0]!, -I.w * 0.55)), 0.5),
      mul(axis, 3 * k),
    ),
    add(I.c[0]!, mul(I.n[0]!, -I.w * 0.55)),
  ];
  const outline = [
    add(sub(P(0), mul(nA, 29 * k)), mul(axis, -44 * k)),
    sub(P(0), mul(nA, 28.5 * k)),
    ...thumb,
    ...up(I),
    ...web(I, M),
    ...up(M),
    ...web(M, Rg),
    ...up(Rg),
    ...web(Rg, Pk),
    ...up(Pk),
    add(Pk.c[0]!, mul(Pk.n[0]!, Pk.w * 0.62)),
    add(lerp(add(P(17), mul(nA, 9 * k)), add(P(0), mul(nA, 28 * k)), 0.5), mul(nA, 2.5 * k)),
    add(P(0), mul(nA, 28.5 * k)),
    add(add(P(0), mul(nA, 29 * k)), mul(axis, -44 * k)),
  ];
  return { fingers, outline, axis, nA, P };
}

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

/**
 * The back of a hand, drawn from its landmarks: one smooth outline, soft light from the top left,
 * nails, knuckle creases and tendons. Skin tone comes from CSS (--skin, --skin-hi, --skin-shade,
 * --nail on the svg), so a page can vary it without new markup.
 */
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
  const g = handGeometry(pts, k);
  const P = g.P;
  const id = `hf${++gid}`;
  const light = sub(lerp(P(0), P(9), 0.62), mul(g.nA, 8 * k));
  const fadeFrom = add(P(0), mul(g.axis, 8 * k));
  const fadeTo = sub(P(0), mul(g.axis, 24 * k));
  const line = (d: string, cls: string, w: number) =>
    s('path', { class: cls, d, 'stroke-width': (w * k).toFixed(2) });

  const details: SVGElement[] = [];
  // Tendons fanning from the wrist to the knuckles of the four fingers.
  g.fingers.slice(1).forEach((f, i) => {
    const from = add(add(P(0), mul(g.axis, 16 * k)), mul(g.nA, (i - 1.5) * 6 * k));
    const to = sub(f.c[0]!, mul(f.d[0]!, 7 * k));
    const mid = add(lerp(from, to, 0.5), mul(g.nA, (i - 1.5) * 1.5 * k));
    details.push(
      line(
        `M${f1(from.x)},${f1(from.y)}Q${f1(mid.x)},${f1(mid.y)} ${f1(to.x)},${f1(to.y)}`,
        'hand-tendon',
        2.2,
      ),
    );
  });
  g.fingers.forEach((f, i) => {
    const [c0, c1, c2] = f.c as [V, V, V, V];
    const [d0, d1, d2] = f.d as [V, V, V];
    // Knuckle: a soft highlight on the bump.
    if (i > 0) {
      const kc = add(c0, mul(d0, 1.5 * k));
      const ang = (Math.atan2(d0.y, d0.x) * 180) / Math.PI + 90;
      details.push(
        s('ellipse', {
          class: 'hand-knuckle',
          cx: f1(kc.x),
          cy: f1(kc.y),
          rx: f1(f.w * 0.34),
          ry: f1(f.w * 0.22),
          transform: `rotate(${ang.toFixed(0)} ${f1(kc.x)} ${f1(kc.y)})`,
        }),
      );
    }
    // Wrinkles over the finger joints, curving towards the tip.
    const creases = (c: V, d: V, n: V, w: number, offs: number[]) =>
      offs
        .map((o) => {
          const m = add(c, mul(d, o * k));
          const a = sub(m, mul(n, w));
          const b = add(m, mul(n, w));
          const q = add(m, mul(d, 1.3 * k));
          return `M${f1(a.x)},${f1(a.y)}Q${f1(q.x)},${f1(q.y)} ${f1(b.x)},${f1(b.y)}`;
        })
        .join('');
    const n1 = f.n[1]!;
    const n2 = f.n[2]!;
    if (i === 0) details.push(line(creases(c2, d1, n2, f.w * 0.26, [-1, 0.6]), 'hand-crease', 0.6));
    else {
      details.push(line(creases(c1, d1, n1, f.w * 0.27, [-1.6, 0, 1.6]), 'hand-crease', 0.6));
      details.push(line(creases(c2, d2, n2, f.w * 0.22, [-0.6, 0.8]), 'hand-crease', 0.5));
    }
    // Nail: a rounded rectangle on the last phalanx.
    const dt = f.d[2]!;
    const nt = f.n[3]!;
    const len = Math.min(Math.hypot(f.tip.x - c2.x, f.tip.y - c2.y) * 0.55, (i === 0 ? 13 : 11.5) * k);
    const ctr = sub(f.tip, mul(dt, 1.6 * k + len / 2));
    const a = len / 2;
    const b = f.wt * 0.33;
    const ring: V[] = [];
    for (let j = 0; j < 20; j++) {
      const th = (j / 20) * Math.PI * 2;
      const cu = Math.cos(th);
      const sv = Math.sin(th);
      const u = a * Math.sign(cu) * Math.abs(cu) ** (2 / 3.2);
      const v = b * Math.sign(sv) * Math.abs(sv) ** (2 / 3.2);
      ring.push(add(ctr, add(mul(dt, u), mul(nt, v))));
    }
    details.push(
      s('path', { class: 'hand-nail', d: smoothClosed(ring), 'stroke-width': (0.5 * k).toFixed(2) }),
    );
  });

  const children: SVGElement[] = [
    s(
      'defs',
      null,
      s(
        'radialGradient',
        { id: `${id}s`, gradientUnits: 'userSpaceOnUse', cx: f1(light.x), cy: f1(light.y), r: f1(125 * k) },
        s('stop', { offset: 0, class: 'skin-hi' }),
        s('stop', { offset: 0.5, class: 'skin-base' }),
        s('stop', { offset: 1, class: 'skin-shade' }),
      ),
      s(
        'linearGradient',
        {
          id: `${id}f`,
          gradientUnits: 'userSpaceOnUse',
          x1: f1(fadeFrom.x),
          y1: f1(fadeFrom.y),
          x2: f1(fadeTo.x),
          y2: f1(fadeTo.y),
        },
        s('stop', { offset: 0, class: 'fade-0' }),
        s('stop', { offset: 1, class: 'fade-1' }),
      ),
      s(
        'mask',
        {
          id: `${id}m`,
          maskUnits: 'userSpaceOnUse',
          x: f1(minX - 50),
          y: f1(minY - 50),
          width: f1(maxX - minX + 100),
          height: f1(maxY - minY + 100),
        },
        s('rect', {
          x: f1(minX - 50),
          y: f1(minY - 50),
          width: f1(maxX - minX + 100),
          height: f1(maxY - minY + 100),
          fill: `url(#${id}f)`,
        }),
      ),
    ),
    s(
      'g',
      { mask: `url(#${id}m)` },
      s('path', {
        class: 'hand-skin',
        d: smoothClosed(g.outline),
        fill: `url(#${id}s)`,
        'stroke-width': (0.9 * k).toFixed(2),
      }),
      ...details,
    ),
  ];
  if (o.dots) {
    // The scan skeleton: thin lines between the landmarks the detector finds.
    const bones = [
      [0, 1],
      [0, 5],
      [0, 17],
      [5, 9],
      [9, 13],
      [13, 17],
      ...FINGERS.flatMap((f) => f.slice(1).map((n, j) => [f[j]!, n])),
    ];
    children.push(
      s('path', {
        class: 'hand-bone',
        d: bones
          .map(
            ([a, b]) =>
              `M${P(a!).x.toFixed(1)},${P(a!).y.toFixed(1)}L${P(b!).x.toFixed(1)},${P(b!).y.toFixed(1)}`,
          )
          .join(''),
        'stroke-width': (1.1 * k).toFixed(2),
      }),
    );
  }
  if (o.dots)
    pts.forEach((p, i) =>
      children.push(s('circle', { class: 'hand-dot', cx: p.x, cy: p.y, r: 2.3 * k, style: `--i:${i}` })),
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
