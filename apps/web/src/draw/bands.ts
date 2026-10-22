/** One scale per dimension: the full range players use, your band in red, a matched dart in green. */
import { s, h } from '../h';
import { num } from '../i18n';

export interface BandSpec {
  label: string;
  unit: string;
  scale: [number, number];
  ticks: number[];
  band: [number, number];
  digits?: number;
  match?: number | null;
  why?: string;
}

export function bandRow(b: BandSpec): HTMLElement {
  const W = 600;
  const pad = 6;
  const X = (v: number) => pad + ((v - b.scale[0]) / (b.scale[1] - b.scale[0])) * (W - 2 * pad);
  const [lo, hi] = b.band;
  const minW = 6;
  const x = X(lo);
  const w = Math.max(minW, X(hi) - X(lo));
  const svg = s(
    'svg',
    { viewBox: `0 0 ${W} 34`, preserveAspectRatio: 'none', 'aria-hidden': 'true' },
    s('line', { class: 'track', x1: pad, x2: W - pad, y1: 12, y2: 12 }),
    ...b.ticks.map((tk) => s('line', { class: 'tick', x1: X(tk), x2: X(tk), y1: 7, y2: 17 })),
    s('rect', { class: 'bandrect', x: x - (w === minW ? minW / 2 : 0), y: 5, width: w, height: 14, rx: 2 }),
    b.match !== undefined && b.match !== null
      ? s('circle', { class: 'dot-match', cx: X(b.match), cy: 12, r: 5 })
      : null,
  );
  const labels = h(
    'div',
    { class: 'scale-ends', 'aria-hidden': 'true' },
    h('span', null, `${num(b.scale[0], b.digits ?? 0)} ${b.unit}`),
    h('span', null, `${num(b.scale[1], b.digits ?? 0)} ${b.unit}`),
  );
  const value =
    lo === hi ? `${num(lo, b.digits ?? 0)}` : `${num(lo, b.digits ?? 0)}–${num(hi, b.digits ?? 0)}`;
  return h(
    'div',
    { class: 'bandrow' },
    h(
      'div',
      { class: 'top' },
      h('span', null, b.label),
      h('b', { class: 'num' }, `${value} ${b.unit}`.trim()),
    ),
    svg,
    labels,
    b.why ? h('p', { class: 'why' }, b.why) : null,
  );
}
