import { fit } from '@dartfit/engine';
import { h } from '../h';
import { num, t } from '../i18n';
import { dartDrawing } from '../draw/dart';
import { variants } from '../api';
import { clearSession } from '../store';
import { shapeName } from './words';

/** A worked example for the hero: the ideal barrel for an average hand and grip. */
function example() {
  const f = fit(
    {
      handLengthMm: 185,
      palmWidthMm: 78,
      indexLengthMm: 78,
      middleLengthMm: 85,
      thumbIndexSpanMm: 120,
      spreadMm: 1,
      samples: 18,
      calibrated: false,
    },
    {
      tip: 'steel',
      hold: 'middle',
      fingers: 3,
      throwStyle: 'unsure',
      moisture: 'normal',
      gripFeel: 3,
      thickness: 'auto',
    },
  );
  return dartDrawing({
    ideal: f.barrel,
    lengthBand: f.length.band,
    diameterBand: f.diameter.band,
    animate: true,
    caption: `${num(f.barrel.massG, 0)} g · ${f.physics.tungstenPct}% tungsten · ${shapeName(f.barrel.shape)}`,
  });
}

export function homeView(root: HTMLElement) {
  const n = variants().length;
  root.append(
    h(
      'section',
      { class: 'hero stack' },
      h('h1', null, t('home.title')),
      h('p', { class: 'lead' }, t('home.lead')),
      h('figure', { class: 'sheet' }, example(), h('figcaption', null, t('home.example'))),
      h(
        'div',
        { class: 'actions' },
        h('a', { class: 'btn', href: '#/scan', onclick: () => clearSession() }, t('home.start')),
        h('a', { class: 'btn ghost', href: '#/questions', onclick: () => clearSession() }, t('home.skip')),
      ),
      h('p', { class: 'small' }, t('home.privacy')),
    ),
    h(
      'section',
      { class: 'stack' },
      h('h2', null, t('home.how.title')),
      h(
        'ol',
        { class: 'steps' },
        h('li', null, t('home.how1')),
        h('li', null, t('home.how2')),
        h('li', null, t('home.how4')),
        h('li', null, t('home.how3', { n })),
      ),
    ),
  );
}
