import { h } from '../h';
import { num, t, type Key } from '../i18n';
import { variants } from '../api';
import { approxEur } from '../money';
import { variantArt } from '../score';
import { dartName } from './words';

export function dartsView(root: HTMLElement) {
  const all = [...variants()].sort((a, b) => dartName(a).localeCompare(dartName(b)) || a.weightG - b.weightG);
  const q = h('input', {
    type: 'search',
    id: 'q',
    placeholder: t('darts.search'),
    autocomplete: 'off',
  }) as HTMLInputElement;
  const list = h('ul', { class: 'grid2' });
  const count = h('p', { class: 'small', 'aria-live': 'polite' });
  const ranges: Array<[string, number, number]> = [
    ['all', 0, 99],
    ['light', 0, 20.5],
    ['mid', 20.5, 23.5],
    ['heavy', 23.5, 99],
  ];
  let range = 'all';
  const chips = h(
    'div',
    { class: 'chips', role: 'group', 'aria-label': t('darts.filter') },
    ...ranges.map(([key]) => {
      const b = h(
        'button',
        { class: 'chip', type: 'button', 'aria-pressed': String(key === 'all') },
        t(`darts.w.${key}` as Key),
      );
      b.addEventListener('click', () => {
        range = key;
        chips.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
        render();
      });
      return b;
    }),
  );
  const render = () => {
    const s = q.value.trim().toLowerCase();
    const [, lo, hi] = ranges.find((r) => r[0] === range) ?? ranges[0]!;
    const shown = all.filter(
      (v) => (!s || `${v.brand} ${v.model}`.toLowerCase().includes(s)) && v.weightG >= lo && v.weightG < hi,
    );
    count.textContent = t('darts.count', { n: shown.length });
    list.replaceChildren(
      ...shown.map((v) =>
        h(
          'li',
          { class: 'card' },
          h(
            'a',
            { href: v.sourceUrl, target: '_blank', rel: 'noopener' },
            variantArt(v),
            h('h2', null, dartName(v)),
          ),
          h(
            'p',
            { class: 'small num' },
            `${num(v.weightG)} g · ${num(v.lengthMm)} mm · Ø ${num(v.diameterMm, 1)}`,
          ),
          v.priceUsd ? h('p', { class: 'small' }, `≈ €${approxEur(v.priceUsd)}`) : null,
          v.specCheck ? h('p', { class: 'flag small' }, t('darts.check')) : null,
        ),
      ),
    );
    if (!shown.length) list.append(h('li', { class: 'small' }, t('darts.empty')));
  };
  q.addEventListener('input', render);
  root.append(
    h(
      'section',
      { class: 'stack' },
      h('h1', null, t('darts.title')),
      h('label', { class: 'visually-hidden', for: 'q' }, t('darts.search')),
      q,
      chips,
      count,
      list,
    ),
  );
  render();
}
