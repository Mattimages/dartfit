/**
 * The fitting procedure, shown step by step. Each line is a real reason from the engine; as the
 * lines for a dimension appear, that dimension's band moves from the full range players use to the
 * band the engine computed. Then the ideal barrel is drawn.
 */
import type { Reason } from '@dartfit/engine';
import { h, reducedMotion, s } from '../h';
import { num, t } from '../i18n';
import { go } from '../router';
import { session } from '../store';
import { createFit } from '../api';
import { dartDrawing } from '../draw/dart';
import { reasonText, shapeName } from './words';

type Dim = 'weight' | 'length' | 'diameter' | 'grip';
const SCALES: Record<Dim, { range: [number, number]; unit: string; digits: number; label: 'r.weight' | 'r.length' | 'r.diameter' | 'r.grip' }> = {
  weight: { range: [16, 28], unit: 'g', digits: 0, label: 'r.weight' },
  length: { range: [36, 60], unit: 'mm', digits: 0, label: 'r.length' },
  diameter: { range: [5.6, 8.5], unit: 'mm', digits: 1, label: 'r.diameter' },
  grip: { range: [1, 5], unit: '', digits: 0, label: 'r.grip' },
};

function liveBand(dim: Dim) {
  const sc = SCALES[dim];
  const W = 600;
  const X = (v: number) => 6 + ((v - sc.range[0]) / (sc.range[1] - sc.range[0])) * (W - 12);
  const rect = s('rect', { class: 'bandrect', x: X(sc.range[0]), y: 5, width: X(sc.range[1]) - X(sc.range[0]), height: 14, rx: 2 });
  const value = h('b', { class: 'num' }, '…');
  const el = h(
    'div',
    { class: 'bandrow' },
    h('div', { class: 'top' }, h('span', null, t(sc.label)), value),
    s('svg', { viewBox: `0 0 ${W} 34`, preserveAspectRatio: 'none', 'aria-hidden': 'true' }, s('line', { class: 'track', x1: 6, x2: W - 6, y1: 12, y2: 12 }), rect),
  );
  const set = ([lo, hi]: [number, number], showValue: boolean) => {
    const w = Math.max(6, X(hi) - X(lo));
    rect.setAttribute('x', String(X(lo) - (w === 6 ? 3 : 0)));
    rect.setAttribute('width', String(w));
    if (showValue) value.textContent = `${lo === hi ? num(lo, sc.digits) : `${num(lo, sc.digits)}–${num(hi, sc.digits)}`} ${sc.unit}`.trim();
  };
  return { el, set };
}

const lerp = (a: [number, number], b: [number, number], p: number): [number, number] => [a[0] + (b[0] - a[0]) * p, a[1] + (b[1] - a[1]) * p];

export async function fittingView(root: HTMLElement) {
  const s0 = session();
  if (!s0.answers) return go('/questions');
  const bands = { weight: liveBand('weight'), length: liveBand('length'), diameter: liveBand('diameter'), grip: liveBand('grip') };
  const list = h('ol', { class: 'evidence', 'aria-live': 'polite' });
  const sheet = h('figure', { class: 'sheet', hidden: true });
  const next = h('a', { class: 'btn', hidden: true }, t('fitting.done'));
  const err = h('p', { class: 'error', role: 'alert', hidden: true }, t('q.error'));
  root.append(
    h(
      'section',
      { class: 'stack' },
      h('h1', null, t('fitting.title')),
      h('p', { class: 'lead' }, t('fitting.lead')),
      h('div', { class: 'bands' }, bands.weight.el, bands.length.el, bands.diameter.el, bands.grip.el),
      list,
      sheet,
      err,
      h('div', { class: 'actions' }, next),
    ),
  );

  let result;
  try {
    result = await createFit(s0.measurements, s0.answers);
  } catch {
    err.hidden = false;
    return;
  }
  const f = result.fit;
  const finals: Record<Dim, [number, number]> = { weight: f.weight.band, length: f.length.band, diameter: f.diameter.band, grip: f.grip.band };
  const steps: Array<{ r: Reason; text: string }> = f.reasons.flatMap((r) => {
    const text = reasonText(r);
    return text ? [{ r, text }] : [];
  });
  const perDim = (d: Dim) => steps.filter((x) => x.r.dim === d || (x.r.code.startsWith('physics') && d !== 'grip')).length;
  const seen: Record<Dim, number> = { weight: 0, length: 0, diameter: 0, grip: 0 };
  const items = steps.map((x) => h('li', { hidden: true }, x.text));
  list.append(...items);

  const fast = reducedMotion();
  for (let i = 0; i < steps.length; i++) {
    const { r } = steps[i]!;
    items[i]!.hidden = false;
    items[i]!.classList.add('done');
    const dims: Dim[] = r.code.startsWith('physics') ? ['weight', 'length', 'diameter'] : r.dim in finals ? [r.dim as Dim] : [];
    for (const d of dims) {
      seen[d]++;
      const p = seen[d] / Math.max(1, perDim(d));
      bands[d].set(lerp(SCALES[d].range, finals[d], p), p >= 1);
    }
    if (!fast) await new Promise((res) => setTimeout(res, 420));
  }
  (Object.keys(finals) as Dim[]).forEach((d) => bands[d].set(finals[d], true));

  const best = result.recommendation.picks[0];
  sheet.append(
    dartDrawing({
      ideal: f.barrel,
      lengthBand: f.length.band,
      diameterBand: f.diameter.band,
      animate: !fast,
      caption: `${num(f.barrel.massG, 0)} g · ${f.physics.tungstenPct}% tungsten · ${shapeName(f.barrel.shape)}`,
    }),
  );
  sheet.hidden = false;
  const target = `/fit/${result.id ?? 'local'}`;
  next.setAttribute('href', `#${target}`);
  next.hidden = false;
  void best;
  next.focus();
}
