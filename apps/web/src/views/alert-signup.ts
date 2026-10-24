import { h } from '../h';
import { t } from '../i18n';
import { DEMO, requestLogin, setOptins } from '../api';
import { markSigned } from './buy-gate';

/**
 * "Keep me posted" box at the end of a result. Double opt-in: the server emails a confirmation
 * link, and only that link turns alerts on (and saves the fit to the address). An alert goes out
 * only when a new dart becomes this person's best match.
 */
export function alertSignup(fitId: string | undefined, opts: { saved: boolean; justConfirmed: boolean }) {
  const box = h('section', { class: 'alert-signup', 'aria-labelledby': 'alert-title' });
  const title = h('h2', { id: 'alert-title' }, t('r.alert.title'));
  const sub = h('p', null, t('r.alert.sub'));
  const msg = h('p', { class: 'alert-msg', role: 'status' });

  if (opts.justConfirmed) {
    box.classList.add('done');
    box.append(title, h('p', null, t('r.alert.on')));
    return box;
  }

  // Already signed in: one tap, no email round trip.
  if (opts.saved) {
    const on = h('button', { class: 'btn block', type: 'button' }, t('r.alert.send'));
    on.addEventListener('click', async () => {
      on.setAttribute('disabled', '');
      try {
        await setOptins({ alertsEmail: true });
        box.classList.add('done');
        msg.textContent = t('r.alert.on');
        on.remove();
      } catch {
        on.removeAttribute('disabled');
        msg.textContent = t('r.alert.error');
      }
    });
    box.append(title, sub, on, msg);
    return box;
  }

  const email = h('input', {
    type: 'email',
    id: 'alert-email',
    name: 'email',
    autocomplete: 'email',
    inputmode: 'email',
    required: true,
    placeholder: t('r.alert.placeholder'),
  }) as HTMLInputElement;
  const age = h('input', { type: 'checkbox', id: 'alert-age' }) as HTMLInputElement;
  const send = h('button', { class: 'btn', type: 'submit' }, t('r.alert.send'));
  const form = h(
    'form',
    { class: 'alert-form', novalidate: true },
    h('label', { class: 'sr-only', for: 'alert-email' }, t('r.alert.email')),
    h('div', { class: 'alert-row' }, email, send),
    h('label', { class: 'check', for: 'alert-age' }, age, h('span', null, t('r.alert.age'))),
    msg,
    h(
      'p',
      { class: 'alert-fine' },
      t('r.alert.fine'),
      ' ',
      h('a', { href: '#/privacy' }, t('signin.privacy')),
    ),
  );
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    msg.classList.remove('error');
    if (!/^\S+@\S+\.\S+$/.test(email.value.trim())) {
      msg.classList.add('error');
      msg.textContent = t('r.alert.bad');
      email.focus();
      return;
    }
    if (!age.checked) {
      msg.classList.add('error');
      msg.textContent = t('r.alert.needage');
      age.focus();
      return;
    }
    if (DEMO) {
      msg.textContent = t('r.alert.demo');
      return;
    }
    send.setAttribute('disabled', '');
    try {
      await requestLogin({
        email: email.value.trim(),
        fitId,
        purpose: 'alerts',
        alertsEmail: true,
        feedbackEmail: false,
        confirmsAge16: true,
      });
      box.classList.add('sent');
      markSigned();
      msg.textContent = t('r.alert.sent', { email: email.value.trim() });
    } catch {
      send.removeAttribute('disabled');
      msg.classList.add('error');
      msg.textContent = t('r.alert.error');
    }
  });
  box.append(title, sub, form);
  return box;
}
