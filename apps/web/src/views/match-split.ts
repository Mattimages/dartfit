import { matchBreakdown, type MatchPart, type ScoredVariant } from '@dartfit/engine';
import { h } from '../h';
import { t, type Key } from '../i18n';

const k = (s: string) => s as Key;
const MARK = { in: '✓', near: '~', out: '✕', unknown: '?' } as const;
const ITEM: Record<string, Key> = {
  weight: k('r.split.weight'),
  length: k('r.split.length'),
  diameter: k('r.split.diameter'),
  shape: k('r.split.type'),
  grip: k('r.split.grip'),
  balance: k('r.split.balance'),
};

/**
 * Three columns under a dart: shape match (weight, length, thickness), style match (type,
 * knurling, balance) and the total. Each item shows whether it matches the ideal.
 */
export function matchSplit(sv: ScoredVariant): HTMLElement {
  const b = matchBreakdown(sv);
  const col = (title: string, p: MatchPart, cls: string) =>
    h(
      'div',
      { class: `ms-col ${cls}` },
      h('span', { class: 'ms-title' }, title),
      h('b', { class: 'ms-pct' }, `${p.pct}%`),
      h(
        'ul',
        { class: 'ms-items' },
        ...p.items.map((it) =>
          h(
            'li',
            { class: `ms-${it.status}` },
            h('span', { class: 'ms-mark', 'aria-hidden': 'true' }, MARK[it.status]),
            h('span', null, t(ITEM[it.dim] ?? k(it.dim))),
            h('span', { class: 'sr-only' }, ` (${t(k(`r.split.${it.status}`))})`),
          ),
        ),
      ),
    );
  return h(
    'div',
    { class: 'match-split' },
    col(t('r.split.shape'), b.shape, 'shape'),
    col(t('r.split.style'), b.style, 'style'),
    h(
      'div',
      { class: `ms-col total q-${sv.quality}` },
      h('span', { class: 'ms-title' }, t('r.split.total')),
      h('b', { class: 'ms-pct' }, `${b.total}%`),
      h('span', { class: 'ms-quality' }, t(k(`r.quality.${sv.quality}`))),
    ),
  );
}
