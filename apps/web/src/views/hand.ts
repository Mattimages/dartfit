import { h } from '../h';
import { num, t, type Key } from '../i18n';
import { go } from '../router';
import { session } from '../store';
import { handArt } from '../draw/art';
import { config, type Measurements } from '@dartfit/engine';

/** Scanned without a card: no sizes to show, only the proportion we did measure, and the warning. */
function unscaledNote(m: Measurements) {
  const ratio = m.middleLengthMm / m.palmWidthMm;
  const ref = config.handShape.ratioRef;
  const pct = Math.round((ratio / ref - 1) * 100);
  const line =
    Math.abs(pct) < 3
      ? t('analyse.ratio.avg')
      : t(pct > 0 ? 'analyse.ratio.long' : 'analyse.ratio.short', { n: Math.abs(pct) });
  return h(
    'div',
    { class: 'unscaled-note' },
    h('p', { class: 'unscaled-ratio' }, line),
    h('p', { class: 'unscaled-warn', role: 'note' }, t('analyse.unscaled')),
  );
}

export function handView(root: HTMLElement) {
  const { measurements: m, landmarksMm } = session();
  if (!m) return go('/scan');
  const readout = (key: Key, v: number) =>
    h(
      'div',
      { class: 'readout' },
      h('dt', null, t(key)),
      h('dd', { class: 'num' }, num(v, 0), h('small', null, 'mm')),
    );
  root.append(
    h(
      'section',
      { class: 'stack' },
      h('h1', null, t('analyse.title')),
      h(
        'div',
        { class: 'measure-art' },
        handArt({
          points: landmarksMm?.length === 21 ? landmarksMm : undefined,
          lengthMm: m.handLengthMm,
          dots: true,
          className: 'scan',
        }),
      ),
      m.unscaled ? unscaledNote(m) : null,
      m.unscaled
        ? null
        : h(
            'dl',
            { class: 'readouts' },
            readout('analyse.handLength', m.handLengthMm),
            readout('analyse.palmWidth', m.palmWidthMm),
            readout('analyse.middleLength', m.middleLengthMm),
            readout('analyse.indexLength', m.indexLengthMm),
          ),
      m.unscaled
        ? null
        : h('p', { class: 'small' }, t('analyse.spread', { n: m.samples, s: num(m.spreadMm, 1) })),
      h(
        'div',
        { class: 'hero-cta' },
        h('a', { class: 'btn block', href: '#/questions' }, t('analyse.next')),
        h('a', { class: 'btn link', href: '#/scan' }, t('r.again')),
      ),
    ),
  );
}
