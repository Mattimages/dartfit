/** The measured hand, drawn from its landmarks in millimetres, with the two key dimensions. */
import { s } from '../h';
import { num, t } from '../i18n';

export type MmPoint = { x: number; y: number };

const BONES: Array<[number, number]> = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16],
  [13, 17], [17, 18], [18, 19], [19, 20],
  [0, 17],
];

export function handDrawing(pts: MmPoint[], dims: { handLengthMm: number; palmWidthMm: number }): SVGElement {
  const xs = pts.map((p) => p.x);
  const ys = pts.map((p) => p.y);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const w = Math.max(...xs) - minX;
  const h = Math.max(...ys) - minY;
  const pad = 26;
  const k = Math.min(360 / w, 380 / h);
  const P = (i: number) => {
    const p = pts[i]!;
    return { x: pad + (p.x - minX) * k, y: pad + (p.y - minY) * k };
  };
  const W = w * k + 2 * pad + 90;
  const H = h * k + 2 * pad;
  const bones = BONES.map(([a, b]) => {
    const p = P(a);
    const q = P(b);
    return s('line', { x1: p.x, y1: p.y, x2: q.x, y2: q.y, stroke: 'var(--steel)', 'stroke-width': 2.5, 'stroke-linecap': 'round' });
  });
  const joints = pts.map((_, i) => {
    const p = P(i);
    return s('circle', { cx: p.x, cy: p.y, r: i === 0 || i % 4 === 0 ? 4 : 3, fill: 'var(--red)' });
  });
  const dim = (a: number, b: number, label: string, off: number) => {
    const p = P(a);
    const q = P(b);
    const ang = Math.atan2(q.y - p.y, q.x - p.x);
    const nx = -Math.sin(ang) * off;
    const ny = Math.cos(ang) * off;
    const mx = (p.x + q.x) / 2 + nx * 1.6;
    const my = (p.y + q.y) / 2 + ny * 1.6;
    return s(
      'g',
      null,
      s('line', { class: 'dim', x1: p.x + nx, y1: p.y + ny, x2: q.x + nx, y2: q.y + ny }),
      s('text', { class: 'dimtext', x: mx, y: my, 'text-anchor': 'middle', 'dominant-baseline': 'middle' }, label),
    );
  };
  return s(
    'svg',
    { class: 'drawing', viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': t('analyse.drawing') },
    s('title', null, t('analyse.drawing')),
    ...bones,
    ...joints,
    dim(0, 12, `${num(dims.handLengthMm, 0)} mm`, 34),
    dim(5, 17, `${num(dims.palmWidthMm, 0)} mm`, -22),
  );
}
