import '@fontsource-variable/archivo/wdth.css';
import './styles.css';
import { h, mount } from './h';
import { getLang, LANGS, setLang, t, type Lang } from './i18n';
import { COUNTRIES, getCountry, setCountry } from './region';
import { route, start, render } from './router';
import { DEMO, refreshCatalogue } from './api';
import { homeView } from './views/home';
import { scanView } from './views/scan';
import { manualView } from './views/manual';
import { handView } from './views/hand';
import { questionsView } from './views/questions';
import { fittingView } from './views/fitting';
import { resultView } from './views/result';
import { dartsView } from './views/darts';
import { methodView } from './views/method';
import { privacyView } from './views/privacy';
import { signinView, meView } from './views/account';

route('/', homeView);
route('/scan', scanView);
route('/manual', manualView);
route('/hand', handView);
route('/questions', questionsView);
route('/fitting', fittingView);
route('/fit/:id', resultView);
route('/darts', dartsView);
route('/method', methodView);
route('/privacy', privacyView);
route('/signin', signinView);
route('/me', meView);

/** The DartFit mark: a dart flight seen end-on, four vanes. */
export function mark(): SVGElement {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', '0 0 32 32');
  svg.setAttribute('aria-hidden', 'true');
  const vane = (d: string, fill: string) => {
    const p = document.createElementNS(ns, 'path');
    p.setAttribute('d', d);
    p.setAttribute('fill', fill);
    svg.append(p);
  };
  vane('M16 16 L16 2 L24 10 Z', 'var(--red)');
  vane('M16 16 L30 16 L22 24 Z', 'var(--ink)');
  vane('M16 16 L16 30 L8 22 Z', 'var(--red)');
  vane('M16 16 L2 16 L10 8 Z', 'var(--ink)');
  return svg;
}

function layout() {
  const app = document.getElementById('app');
  if (!app) return;
  // Country (which shops) and language, in one small panel.
  const countrySel = h(
    'select',
    { id: 'region-country', 'aria-label': t('region.country') },
    ...COUNTRIES.map((c) => h('option', { value: c.code, selected: c.code === getCountry() }, c.name)),
  ) as HTMLSelectElement;
  const langSel = h(
    'select',
    { id: 'region-lang', 'aria-label': t('region.lang') },
    ...LANGS.map((l) => h('option', { value: l.id, selected: l.id === getLang() }, l.name)),
  ) as HTMLSelectElement;
  const apply = () => {
    setCountry(countrySel.value);
    setLang(langSel.value as Lang);
    layout();
    void render();
  };
  countrySel.addEventListener('change', apply);
  langSel.addEventListener('change', apply);
  const langBtn = h(
    'details',
    { class: 'region' },
    h('summary', { 'aria-label': t('region.label') }, `${getCountry()} · ${getLang().toUpperCase()}`),
    h(
      'div',
      { class: 'region-panel' },
      h('label', { for: 'region-country' }, t('region.country')),
      countrySel,
      h('label', { for: 'region-lang' }, t('region.lang')),
      langSel,
      h('p', { class: 'small' }, t('region.note')),
    ),
  );
  mount(
    app,
    h(
      'header',
      { class: 'site-header' },
      h('a', { class: 'wordmark', href: '#/', 'aria-label': 'DartFit' }, mark(), 'DartFit'),
      h(
        'nav',
        { 'aria-label': 'Menu' },
        h('a', { href: '#/darts' }, t('nav.darts.short')),
        DEMO ? null : h('a', { href: '#/me' }, t('nav.me')),
        langBtn,
      ),
    ),
    h('main', { id: 'main' }),
    h(
      'footer',
      { class: 'site-footer' },
      h('p', { class: 'small' }, t('footer.disclosure')),
      h(
        'div',
        { class: 'links small' },
        h('a', { href: '#/method' }, t('footer.method')),
        h('a', { href: '#/privacy' }, t('footer.privacy')),
        h('a', { href: '#/darts' }, t('nav.darts')),
      ),
    ),
  );
}

layout();
start(() => {});
void refreshCatalogue();

if (!DEMO && 'serviceWorker' in navigator && import.meta.env.PROD) {
  navigator.serviceWorker.register('/sw.js').catch(() => {});
}
