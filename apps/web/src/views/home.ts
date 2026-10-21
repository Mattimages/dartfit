import { fit } from '@dartfit/engine';
import { h } from '../h';
import { num, t } from '../i18n';
import { variants } from '../api';
import { clearSession } from '../store';
import { dartArt, handArt } from '../draw/art';
import { approxEur } from '../money';
import { variantArt } from '../score';
import { dartName } from './words';

/** The ideal dart for an average hand, drawn as the hero product shot. */
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
  return dartArt({ ...f.barrel, grip: 3, tone: 0, dim: `${num(f.barrel.lengthMm, 0)} mm` });
}

/** The shelf: the priciest dart of each brand first, then the next round, so brands alternate. */
function shelf() {
  const byBrand = new Map<string, ReturnType<typeof variants>>();
  const seen = new Set<string>();
  for (const v of [...variants()].sort((a, b) => (b.priceUsd ?? 0) - (a.priceUsd ?? 0))) {
    if (v.specCheck || v.tip !== 'steel' || seen.has(dartName(v))) continue;
    seen.add(dartName(v));
    byBrand.set(v.brand, [...(byBrand.get(v.brand) ?? []), v]);
  }
  const out = [];
  for (let round = 0; out.length < 8 && round < 4; round++)
    for (const list of byBrand.values()) if (list[round] && out.length < 8) out.push(list[round]!);
  return out;
}

export function homeView(root: HTMLElement) {
  const all = variants();
  root.append(
    h(
      'section',
      { class: 'hero' },
      h('h1', null, t('home.title')),
      h('p', { class: 'lead' }, t('home.lead', { n: all.length })),
      h('div', { class: 'stage-box' }, handArt({ dots: true, className: 'scan' }), exampleDart()),
      h(
        'div',
        { class: 'hero-cta' },
        h('a', { class: 'btn block', href: '#/scan', onclick: () => clearSession() }, t('home.start')),
        h('a', { class: 'btn link', href: '#/questions', onclick: () => clearSession() }, t('home.skip')),
      ),
    ),
    h(
      'section',
      null,
      h(
        'div',
        { class: 'section-head' },
        h('h2', null, t('home.shelf', { n: all.length })),
        h('a', { href: '#/darts' }, t('home.shelf.all')),
      ),
      h(
        'div',
        { class: 'rail' },
        ...shelf().map((v) =>
          h(
            'a',
            { class: 'card', href: '#/darts', style: 'text-decoration:none' },
            h('div', { class: 'stage-box' }, variantArt(v)),
            h('h3', null, dartName(v)),
            h(
              'p',
              { class: 'specline' },
              h('span', null, `${num(v.weightG)} g`),
              v.priceUsd ? h('span', { class: 'eur' }, `≈ €${approxEur(v.priceUsd)}`) : null,
            ),
          ),
        ),
      ),
    ),
    h(
      'section',
      null,
      h('h2', { class: 'section-head' }, t('home.how')),
      h(
        'ol',
        { class: 'steps' },
        h(
          'li',
          null,
          h('div', null, h('b', null, t('home.how1')), h('span', { class: 'small' }, t('home.how1.s'))),
        ),
        h(
          'li',
          null,
          h('div', null, h('b', null, t('home.how2')), h('span', { class: 'small' }, t('home.how2.s'))),
        ),
        h(
          'li',
          null,
          h('div', null, h('b', null, t('home.how3')), h('span', { class: 'small' }, t('home.how3.s'))),
        ),
      ),
    ),
  );
}
