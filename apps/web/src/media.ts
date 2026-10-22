/**
 * A dart shown two ways: the modelled shape (drawn from its real profile, with its length) or the
 * shop's product photo. One choice for the whole site, remembered per visitor.
 *
 * Photos load from our own origin (/img/<model>, proxied and cached by the API), so a visitor's
 * browser never contacts an image CDN. The camera-free preview build has no API and uses the
 * photo URL directly.
 */
import type { Variant } from '@dartfit/engine';
import { catalogue } from 'virtual:dartfit-catalogue';
import { h } from './h';
import { t } from './i18n';
import { variantArt } from './score';
import { dartName } from './views/words';

export type View = 'model' | 'photo';
const KEY = 'df_view';
const EVENT = 'df:view';
const DEMO = import.meta.env.MODE === 'demo';

/** Models whose photo the API will serve; every photo until the API says otherwise. */
let servable = new Set(Object.keys(catalogue.photos));
export function setServablePhotos(models: string[]) {
  servable = new Set(models);
}

export function photoUrl(modelId: string, width: 400 | 800): string | null {
  const p = catalogue.photos[modelId];
  if (!p) return null;
  if (DEMO) {
    const u = new URL(p.url);
    if (u.hostname === 'cdn.shopify.com') u.searchParams.set('width', String(width));
    return u.toString();
  }
  return servable.has(modelId) ? `/img/${encodeURIComponent(modelId)}?w=${width}` : null;
}

// Photo first: it is what people buy. The choice is remembered.
let view: View = (() => {
  try {
    return localStorage.getItem(KEY) === 'model' ? 'model' : 'photo';
  } catch {
    return 'photo';
  }
})();
export const getView = () => view;

// The preview build loads photos straight from the shop's CDN. Where the page's host blocks outside
// images, one probe finds out and the switch disappears instead of doing nothing.
if (DEMO && typeof Image !== 'undefined') {
  const first = Object.keys(catalogue.photos)[0];
  const url = first ? photoUrl(first, 400) : null;
  if (url) {
    const probe = new Image();
    probe.referrerPolicy = 'no-referrer';
    probe.onerror = () => {
      document.documentElement.classList.add('no-photos');
      view = 'model';
      document.dispatchEvent(new CustomEvent(EVENT));
    };
    probe.src = url;
  }
}
export function setView(v: View) {
  view = v;
  try {
    localStorage.setItem(KEY, v);
  } catch {
    /* private mode: keep it for this page only */
  }
  document.dispatchEvent(new CustomEvent(EVENT));
}

/** Keep `el` in step with the site-wide choice until it leaves the page. */
function follow(el: HTMLElement, apply: () => void) {
  apply();
  const on = () => (el.isConnected ? apply() : document.removeEventListener(EVENT, on));
  document.addEventListener(EVENT, on);
}

export interface MediaOptions {
  /** Red length line under the drawn dart. */
  dim?: boolean;
  width?: 400 | 800;
  /** Show the Photo | Model switch in the box. */
  toggle?: boolean;
  /** Replaces the plain drawing: e.g. this dart drawn over the player's ideal barrel. */
  model?: Node;
  /** Name of the drawing on the switch (default "Model"). */
  modelLabel?: string;
}

/**
 * The studio box for one dart: the shop photo or the drawing, in the same box. The drawing is the
 * fallback when there is no photo or it fails to load.
 */
export function dartMedia(v: Variant, o: MediaOptions = {}) {
  const src = photoUrl(v.modelId, o.width ?? 400);
  const box = h(
    'div',
    { class: `stage-box media${o.model ? ' has-match' : ''}` },
    h('div', { class: 'media-model' }, o.model ?? variantArt(v, '', o.dim)),
  );
  if (!src) {
    // Same box shape as its neighbours in photo view, showing the drawing.
    follow(box, () => (box.dataset.view = view));
    return box;
  }
  // No src until the photo is wanted: the drawing view costs no image downloads.
  const img = h('img', {
    class: 'media-photo',
    alt: t('media.alt', { name: dartName(v) }),
    loading: 'lazy',
    decoding: 'async',
    referrerpolicy: 'no-referrer',
  }) as HTMLImageElement;
  box.append(img);
  box.classList.add('has-photo');
  img.addEventListener('error', () => {
    img.remove();
    box.classList.remove('has-photo');
    box.querySelector('.view-toggle')?.remove();
  });
  if (o.toggle) box.append(viewToggle(o.modelLabel));
  follow(box, () => {
    box.dataset.view = view;
    if (view === 'photo' && !img.getAttribute('src')) img.src = src;
  });
  return box;
}

/** Photo | Model switch. Shared state: flipping one flips every dart on the page. */
export function viewToggle(modelLabel = t('media.model')): HTMLElement {
  const btn = (v: View, label: string) =>
    h('button', { type: 'button', 'data-v': v, onclick: () => setView(v) }, label);
  const el = h(
    'div',
    { class: 'view-toggle', role: 'group', 'aria-label': t('media.label') },
    btn('photo', t('media.photo')),
    btn('model', modelLabel),
  );
  follow(el, () =>
    el
      .querySelectorAll('button')
      .forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.v === view))),
  );
  return el;
}
