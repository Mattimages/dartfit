/**
 * "Sla je fit op": the pop-up after the fitting film, when the player taps "Bekijk jouw darts".
 * Email, a name for this fit and "stay signed in on this browser". Like "keep me posted" it
 * attaches the fit to a new address at once and mails a 24-hour confirm link that signs in; it
 * never signs anyone in by typing an address. The highlighted "mail me when an even better dart
 * comes out" box (owner, 19 Nov) turns on the new-dart alerts too; it starts unticked, because
 * consent to emails has to be an active choice (GDPR).
 */
import { h } from '../h';
import { t, type Key } from '../i18n';
import { DEMO, requestLogin } from '../api';
import { session, update } from '../store';

const LOCAL = 'df_fits';

/** Fits saved on this browser ("stay signed in" ticked), newest first. */
export function localFits(): Array<{ id: string; name: string; at: number }> {
  try {
    const raw = JSON.parse(localStorage.getItem(LOCAL) ?? '[]');
    return Array.isArray(raw) ? raw.filter((x) => x && typeof x.id === 'string') : [];
  } catch {
    return [];
  }
}

function rememberLocally(id: string, name: string) {
  try {
    const list = [{ id, name, at: Date.now() }, ...localFits().filter((x) => x.id !== id)].slice(0, 20);
    localStorage.setItem(LOCAL, JSON.stringify(list));
  } catch {
    /* storage blocked: the confirm mail still saves it */
  }
}

/** Opens the pop-up; `done` runs once, after saving or "Nu niet". */
export function saveFitPopup(fitId: string | null, done: () => void): void {
  let finished = false;
  const finish = () => {
    if (finished) return;
    finished = true;
    dialog.close();
    dialog.remove();
    done();
  };
  const field = (id: string, label: string, input: HTMLElement) =>
    h('div', { class: 'save-field' }, h('label', { class: 'label', for: id }, label), input);
  const email = h('input', {
    type: 'email',
    id: 'save-email',
    name: 'email',
    autocomplete: 'email',
    inputmode: 'email',
    required: true,
    placeholder: t('r.alert.placeholder'),
  }) as HTMLInputElement;
  const name = h('input', {
    type: 'text',
    id: 'save-name',
    maxlength: 60,
    autocomplete: 'off',
    placeholder: t('save.name.ph'),
  }) as HTMLInputElement;
  const remember = h('input', { type: 'checkbox', id: 'save-remember', checked: true }) as HTMLInputElement;
  const alerts = h('input', { type: 'checkbox', id: 'save-alerts' }) as HTMLInputElement;
  const age = h('input', { type: 'checkbox', id: 'save-age' }) as HTMLInputElement;
  const msg = h('p', { class: 'alert-msg', role: 'status' });
  const go = h('button', { class: 'btn block', type: 'submit' }, t('save.go'));
  const later = h('button', { class: 'btn link', type: 'button' }, t('save.later'));
  later.addEventListener('click', finish);
  const form = h(
    'form',
    { class: 'pop save-fit', novalidate: true },
    h('h2', { id: 'save-title' }, t('save.title')),
    h('p', null, t('save.sub')),
    field('save-email', t('save.email'), email),
    // The sign-up we want most: new darts that fit better, right under the email.
    h(
      'label',
      { class: 'check save-alerts', for: 'save-alerts' },
      alerts,
      h('span', null, h('b', null, t('save.alerts')), h('small', null, t('save.alerts.sub'))),
    ),
    field('save-name', t('save.name'), name),
    h('label', { class: 'check', for: 'save-remember' }, remember, h('span', null, t('save.remember'))),
    h('label', { class: 'check', for: 'save-age' }, age, h('span', null, t('r.alert.age'))),
    msg,
    h('div', { class: 'pop-actions' }, go, later),
    h('p', { class: 'alert-fine' }, h('a', { href: '#/privacy' }, t('signin.privacy'))),
  );
  const dialog = h(
    'dialog',
    { class: 'pop-dialog', 'aria-labelledby': 'save-title' },
    form,
  ) as HTMLDialogElement;
  dialog.addEventListener('cancel', (e) => {
    e.preventDefault();
    finish();
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    msg.classList.remove('error');
    const fail = (key: Key, el: HTMLElement) => {
      msg.classList.add('error');
      msg.textContent = t(key);
      el.focus();
    };
    if (!/^\S+@\S+\.\S+$/.test(email.value.trim())) return fail('r.alert.bad', email);
    if (!age.checked) return fail('r.alert.needage', age);
    const label = name.value.trim();
    go.setAttribute('disabled', '');
    try {
      if (!DEMO)
        await requestLogin({
          email: email.value.trim(),
          fitId: fitId ?? undefined,
          purpose: 'save',
          fitName: label || undefined,
          remember: remember.checked,
          alertsEmail: alerts.checked,
          feedbackEmail: false,
          confirmsAge16: true,
        });
      if (remember.checked && fitId) rememberLocally(fitId, label);
      // The "keep me posted" box at the end of the result then only says it's on.
      if (alerts.checked && !session().alertsSent) update({ alertsSent: true });
      msg.textContent = t(alerts.checked ? 'save.check.alerts' : 'save.check');
      later.remove();
      setTimeout(finish, 2200);
    } catch {
      go.removeAttribute('disabled');
      fail('r.alert.error', email);
    }
  });

  document.body.append(dialog);
  dialog.showModal();
  email.focus();
}
