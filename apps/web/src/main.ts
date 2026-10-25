import '@fontsource-variable/geist/wght.css';
import './styles.css';
import { h, mount } from './h';
import { getLang, LANGS, t } from './i18n';
import { COUNTRIES, getCountry, hasChosenCountry } from './region';
import { openRegionPicker } from './views/region-picker';
import { route, start, render, go, current } from './router';
import { inject, pageview } from '@vercel/analytics';
import { clearSession, update } from './store';
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
// Buying a gift: no scan; the questionnaire asks about the player instead.
route('/gift', () => {
  clearSession();
  update({ gift: true });
  go('/questions');
});
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
  // Country (which shops) and language: the globe opens the picker.
  const langBtn = h(
    'button',
    {
      type: 'button',
      class: 'region-btn',
      'aria-haspopup': 'dialog',
      'aria-label': `${t('region.label')}: ${COUNTRIES.find((c) => c.code === getCountry())?.name ?? getCountry()}, ${LANGS.find((l) => l.id === getLang())?.name ?? getLang()}`,
    },
    h(
      'svg',
      { class: 'globe', viewBox: '0 0 16 16', 'aria-hidden': 'true' },
      h('circle', { cx: 8, cy: 8, r: 6.5 }),
      h('path', {
        d: 'M1.5 8h13M8 1.5c2 2 2.8 4.2 2.8 6.5S10 12.5 8 14.5M8 1.5C6 3.5 5.2 5.7 5.2 8S6 12.5 8 14.5',
      }),
    ),
    getCountry(),
  );
  langBtn.addEventListener('click', () => openRegionPicker(refreshAll));
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
        h('a', { href: `/${getLang()}/` }, t('footer.guides')),
        h('a', { href: '#/method' }, t('footer.method')),
        h('a', { href: '#/privacy' }, t('footer.privacy')),
        h('a', { href: '#/darts' }, t('nav.darts')),
      ),
    ),
  );
}

function refreshAll() {
  layout();
  void render();
}

layout();
const routeOf = (path: string) => path.replace(/^\/fit\/[^/]+/, '/fit/[id]');
// Visitor counts (Vercel Web Analytics: cookieless, aggregated). Hash routes are sent as paths,
// and ids are replaced by the route pattern, so no fit id ever leaves the page.
if (!DEMO) {
  inject({
    mode: import.meta.env.PROD ? 'production' : 'development',
    disableAutoTrack: true,
    beforeSend: (e) => ({ ...e, url: location.origin + routeOf(current().path) }),
  });
}
start((path) => {
  if (!DEMO) pageview({ route: routeOf(path), path: routeOf(path) });
});
// First visit: ask where they shop (the browser's guess is pre-selected).
if (!hasChosenCountry()) openRegionPicker(refreshAll, true);
void refreshCatalogue();

if (!DEMO && 'serviceWorker' in navigator && import.meta.env.PROD) {
  navigator.serviceWorker.register('/sw.js').catch(() => {});
}
