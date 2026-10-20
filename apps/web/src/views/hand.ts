import { h } from '../h';
import { num, t, type Key } from '../i18n';
import { go } from '../router';
import { session } from '../store';
import { handDrawing } from '../draw/hand';

export function handView(root: HTMLElement) {
  const { measurements: m, landmarksMm } = session();
  if (!m) return go('/scan');
  const readout = (key: Key, v: number) =>
    h('div', { class: 'readout' }, h('dt', null, t(key)), h('dd', { class: 'num' }, num(v, 0), h('small', null, 'mm')));
  root.append(
    h(
      'section',
      { class: 'stack' },
      h('h1', null, t('analyse.title')),
      landmarksMm?.length === 21 ? h('figure', { class: 'sheet' }, handDrawing(landmarksMm, m)) : null,
      h(
        'dl',
        { class: 'readouts' },
        readout('analyse.handLength', m.handLengthMm),
        readout('analyse.palmWidth', m.palmWidthMm),
        readout('analyse.middleLength', m.middleLengthMm),
        readout('analyse.indexLength', m.indexLengthMm),
      ),
      h('p', { class: 'small' }, t('analyse.spread', { n: m.samples, s: num(m.spreadMm, 1) })),
      m.calibrated ? null : h('p', { class: 'small' }, t('analyse.uncalibrated')),
      h('div', { class: 'actions' }, h('a', { class: 'btn', href: '#/questions' }, t('analyse.next')), h('a', { class: 'btn link', href: '#/scan' }, t('r.again'))),
    ),
  );
}
