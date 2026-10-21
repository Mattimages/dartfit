import { fit } from '@dartfit/engine';
import { h, s } from '../h';
import { t } from '../i18n';
import { variants } from '../api';
import { clearSession } from '../store';
import { dartArt, handArt, pictogram } from '../draw/art';

/** The ideal dart for an average hand, drawn as the hero image. */
function exampleDart() {
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
  return dartArt({ ...f.barrel, grip: 3, tone: 0 });
}

const target = () =>
  s(
    'svg',
    { viewBox: '0 0 52 52', 'aria-hidden': 'true' },
    s('circle', { cx: 26, cy: 26, r: 24, class: 'ico-path' }),
    s('circle', { cx: 26, cy: 26, r: 15, class: 'ico-line' }),
    s('circle', { cx: 26, cy: 26, r: 5, class: 'ico-accent' }),
  );

export function homeView(root: HTMLElement) {
  const all = variants();
  const brands = new Set(all.map((v) => v.brand)).size;
  root.append(
    h(
      'section',
      { class: 'hero' },
      h('h1', null, h('span', null, t('home.t1')), h('span', null, t('home.t2'))),
      h('p', { class: 'lead' }, t('home.lead')),
      h('div', { class: 'hero-art' }, handArt({ dots: true, className: 'scan' }), exampleDart()),
      h(
        'div',
        { class: 'hero-cta' },
        h('a', { class: 'btn block', href: '#/scan', onclick: () => clearSession() }, t('home.start')),
        h('a', { class: 'btn link', href: '#/questions', onclick: () => clearSession() }, t('home.skip')),
      ),
    ),
    h(
      'section',
      { class: 'stats', 'aria-label': t('home.stats') },
      h('div', null, h('b', null, String(all.length)), h('span', null, t('home.stat.darts'))),
      h('div', null, h('b', null, String(brands)), h('span', null, t('home.stat.brands'))),
      h('div', null, h('b', null, '21'), h('span', null, t('home.stat.points'))),
    ),
    h(
      'ol',
      { class: 'how', 'aria-label': t('home.how') },
      h('li', null, handArt({ lengthMm: 185 }), t('home.how1')),
      h('li', null, pictogram('hold', 'middle'), t('home.how2')),
      h('li', null, target(), t('home.how3')),
    ),
  );
}
