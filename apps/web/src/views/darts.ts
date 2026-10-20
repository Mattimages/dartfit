import { h } from '../h';
import { num, t } from '../i18n';
import { variants } from '../api';
import { balanceName, dartName, material, shapeName } from './words';

export function dartsView(root: HTMLElement) {
  const all = [...variants()].sort((a, b) => dartName(a).localeCompare(dartName(b)) || a.weightG - b.weightG);
  const models = new Set(all.map((v) => v.modelId)).size;
  const q = h('input', { type: 'search', id: 'q', placeholder: t('darts.search'), autocomplete: 'off' }) as HTMLInputElement;
  const body = h('tbody');
  const render = () => {
    const s = q.value.trim().toLowerCase();
    body.replaceChildren(
      ...all
        .filter((v) => !s || `${v.brand} ${v.model}`.toLowerCase().includes(s))
        .map((v) =>
          h(
            'tr',
            null,
            h(
              'td',
              null,
              h('a', { href: v.sourceUrl, target: '_blank', rel: 'noopener' }, dartName(v)),
              v.specCheck ? h('div', { class: 'flag small' }, t('darts.check')) : null,
            ),
            h('td', { class: 'r' }, `${num(v.weightG)} g`),
            h('td', { class: 'r' }, num(v.lengthMm)),
            h('td', { class: 'r' }, num(v.diameterMm, 2)),
            h('td', { class: 'r' }, v.gripIntensity === null ? '–' : num(v.gripIntensity)),
            h('td', null, `${balanceName(v.balance)} · ${shapeName(v.shape)}`),
            h('td', null, material(v)),
            h('td', null, v.verifiedAt ?? ''),
          ),
        ),
    );
  };
  q.addEventListener('input', render);
  root.append(
    h(
      'section',
      { class: 'stack' },
      h('h1', null, t('darts.title')),
      h('p', { class: 'lead' }, t('darts.lead', { n: all.length, m: models })),
      h('label', { class: 'visually-hidden', for: 'q' }, t('darts.search')),
      q,
      h(
        'div',
        { class: 'table-wrap' },
        h(
          'table',
          null,
          h(
            'thead',
            null,
            h(
              'tr',
              null,
              h('th', null, t('darts.col.dart')),
              h('th', { class: 'r' }, t('darts.col.weight')),
              h('th', { class: 'r' }, `${t('darts.col.length')} mm`),
              h('th', { class: 'r' }, `${t('darts.col.diameter')} mm`),
              h('th', { class: 'r' }, t('darts.col.grip')),
              h('th', null, t('darts.col.balance')),
              h('th', null, t('darts.col.alloy')),
              h('th', null, t('darts.col.checked')),
            ),
          ),
          body,
        ),
      ),
    ),
  );
  render();
}
