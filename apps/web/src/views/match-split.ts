import { matchBreakdown, type ScoredVariant } from '@dartfit/engine';
import { h } from '../h';
import { t, type Key } from '../i18n';

const k = (s: string) => s as Key;

/**
 * Three columns under a dart: shape match (weight, length, thickness), style match (type,
 * knurling, balance) and the total, which is the usual match score.
 */
export function matchSplit(sv: ScoredVariant): HTMLElement {
  const b = matchBreakdown(sv);
  const col = (title: string, pct: number, cls: string, extra?: HTMLElement) =>
    h(
      'div',
      { class: `ms-col ${cls}` },
      h('span', { class: 'ms-title' }, title),
      h('b', { class: 'ms-pct' }, `${pct}%`),
      extra ?? null,
    );
  return h(
    'div',
    { class: 'match-split' },
    col(t('r.split.shape'), b.shape.pct, 'shape', h('span', { class: 'ms-sub' }, t('r.split.shape.sub'))),
    col(t('r.split.style'), b.style.pct, 'style', h('span', { class: 'ms-sub' }, t('r.split.style.sub'))),
    col(
      t('r.split.total'),
      b.total,
      `total q-${sv.quality}`,
      h('span', { class: 'ms-quality' }, t(k(`r.quality.${sv.quality}`))),
    ),
  );
}
