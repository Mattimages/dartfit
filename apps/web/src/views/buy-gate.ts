/**
 * The first tap on a buy button opens a short email sign-in: save the fit and hear when an even
 * better fitting dart arrives (double opt-in, as "keep me posted"). It never blocks buying: both
 * buttons are real links to the shop, so the shop opens in a new tab either way, and it only shows
 * once per visit and never for signed-in players.
 */
import { h } from '../h';
import { t } from '../i18n';
import { DEMO, requestLogin } from '../api';

const SEEN = 'df_buygate';
const SIGNED = 'df_signed';

const get = (s: Storage, k: string) => {
  try {
    return s.getItem(k);
  } catch {
    return '1'; // no storage: never nag
  }
};
const set = (s: Storage, k: string) => {
  try {
    s.setItem(k, '1');
  } catch {
    /* ignore */
  }
};

/** Mark a link as a buy button; `saved` when the fit already belongs to a signed-in player. */
export function buyLink(a: HTMLElement, fitId: string | null, shop = 'Amazon', saved = false): HTMLElement {
  a.dataset.buy = shop;
  if (fitId) a.dataset.fit = fitId;
  if (saved) a.dataset.saved = '1';
  return a;
}

/** The player confirmed or signed in: never show the gate again on this device. */
export function markSigned() {
  set(localStorage, SIGNED);
}

export function installBuyGate() {
  document.addEventListener('click', (e) => {
    const a = (e.target as HTMLElement | null)?.closest<HTMLAnchorElement>('a[data-buy]');
    if (!a || a.dataset.saved || get(sessionStorage, SEEN) || get(localStorage, SIGNED)) return;
    e.preventDefault();
    set(sessionStorage, SEEN);
    open(a.href, a.dataset.fit, a.dataset.buy || 'Amazon');
  });
}

function open(href: string, fitId: string | undefined, shop: string) {
  document.querySelector('dialog.buy-dialog')?.remove();
  const dialog = h('dialog', { class: 'buy-dialog', 'aria-labelledby': 'buy-title' }) as HTMLDialogElement;
  const close = () => {
    dialog.close();
    dialog.remove();
  };
  const email = h('input', {
    type: 'email',
    id: 'buy-email',
    autocomplete: 'email',
    inputmode: 'email',
    placeholder: t('r.alert.placeholder'),
  }) as HTMLInputElement;
  const age = h('input', { type: 'checkbox', id: 'buy-age' }) as HTMLInputElement;
  const msg = h('p', { class: 'buy-msg', role: 'status' });
  // Both are real links, so the shop opens from the tap itself (no pop-up blocker).
  const save = h(
    'a',
    { class: 'btn block', href, target: '_blank', rel: 'noopener sponsored' },
    t('buy.save', { shop }),
  );
  const skip = h(
    'a',
    { class: 'btn link', href, target: '_blank', rel: 'noopener sponsored' },
    t('buy.skip', { shop }),
  );
  save.addEventListener('click', (e) => {
    msg.classList.remove('error');
    if (!/^\S+@\S+\.\S+$/.test(email.value.trim())) {
      e.preventDefault();
      msg.classList.add('error');
      msg.textContent = t('r.alert.bad');
      email.focus();
      return;
    }
    if (!age.checked) {
      e.preventDefault();
      msg.classList.add('error');
      msg.textContent = t('r.alert.needage');
      age.focus();
      return;
    }
    // The shop opens in a new tab; this page stays, so the request finishes.
    if (!DEMO)
      void requestLogin({
        email: email.value.trim(),
        fitId,
        purpose: 'alerts',
        alertsEmail: true,
        feedbackEmail: false,
        confirmsAge16: true,
      }).catch(() => {});
    set(localStorage, SIGNED);
    close();
    if (!DEMO) toast(t('buy.sent', { email: email.value.trim() }));
  });
  const clear = () => {
    msg.textContent = '';
    msg.classList.remove('error');
  };
  email.addEventListener('input', clear);
  age.addEventListener('change', clear);
  skip.addEventListener('click', () => close());
  const x = h('button', { type: 'button', class: 'rp-close', 'aria-label': t('region.close') }, '×');
  x.addEventListener('click', close);
  dialog.addEventListener('cancel', (e) => {
    e.preventDefault();
    close();
  });
  dialog.append(
    h(
      'div',
      { class: 'buy' },
      x,
      h('h2', { id: 'buy-title' }, t('buy.title')),
      h('p', { class: 'buy-sub' }, t('buy.sub')),
      h('label', { class: 'visually-hidden', for: 'buy-email' }, t('r.alert.email')),
      email,
      h('label', { class: 'check', for: 'buy-age' }, age, h('span', null, t('r.alert.age'))),
      msg,
      save,
      skip,
    ),
  );
  document.body.append(dialog);
  dialog.showModal();
  email.focus();
}

function toast(text: string) {
  const el = h('div', { class: 'toast', role: 'status' }, text);
  document.body.append(el);
  setTimeout(() => el.classList.add('out'), 3800);
  setTimeout(() => el.remove(), 4300);
}
