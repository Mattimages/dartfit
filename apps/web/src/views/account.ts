import { h } from '../h';
import { t } from '../i18n';
import { go } from '../router';
import { DEMO, deleteAccount, logout, me, requestLogin, setOptins } from '../api';

export function signinView(root: HTMLElement, _p: Record<string, string>, query: URLSearchParams) {
  if (DEMO) return go('/');
  const fitId = query.get('fit') ?? undefined;
  const email = h('input', { type: 'email', id: 'email', autocomplete: 'email', required: true }) as HTMLInputElement;
  const box = (id: string, label: string) =>
    h('label', { class: 'check', for: id }, h('input', { type: 'checkbox', id }), h('span', null, label));
  const alerts = box('alerts', t('signin.alerts'));
  const feedback = box('feedback', t('signin.feedback'));
  const age = box('age', t('signin.age'));
  const msg = h('p', { role: 'status' });
  if (query.get('error') === 'expired') msg.textContent = t('signin.expired');
  const checked = (el: HTMLElement) => (el.querySelector('input') as HTMLInputElement).checked;
  const form = h(
    'form',
    { class: 'stack', novalidate: true },
    h('label', { class: 'label', for: 'email' }, t('signin.email')),
    email,
    alerts,
    feedback,
    age,
    h('button', { class: 'btn', type: 'submit' }, t('signin.send')),
    msg,
    h('p', { class: 'small' }, h('a', { href: '#/privacy' }, t('signin.privacy'))),
  );
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!email.value.includes('@') || !checked(age)) {
      msg.className = 'error';
      msg.textContent = t('signin.error');
      return;
    }
    try {
      await requestLogin({ email: email.value, fitId, alertsEmail: checked(alerts), feedbackEmail: checked(feedback), confirmsAge16: true });
      msg.className = '';
      msg.textContent = t('signin.sent');
    } catch {
      msg.className = 'error';
      msg.textContent = t('signin.error');
    }
  });
  root.append(h('section', { class: 'stack' }, h('h1', null, t('signin.title')), h('p', { class: 'lead' }, t('signin.lead')), form));
}

export async function meView(root: HTMLElement) {
  if (DEMO) return go('/');
  const data = await me().catch(() => ({ user: null }));
  if (!data.user) return go('/signin');
  const u = data.user;
  const toggle = (id: string, label: string, on: boolean, key: 'alertsEmail' | 'feedbackEmail') => {
    const input = h('input', { type: 'checkbox', id, checked: on }) as HTMLInputElement;
    input.addEventListener('change', () => void setOptins({ [key]: input.checked }));
    return h('label', { class: 'check', for: id }, input, h('span', null, label));
  };
  const del = h('button', { class: 'btn ghost', type: 'button' }, t('me.delete'));
  del.addEventListener('click', async () => {
    if (!window.confirm(t('me.delete.confirm'))) return;
    await deleteAccount();
    go('/');
  });
  const out = h('button', { class: 'btn link', type: 'button' }, t('me.signout'));
  out.addEventListener('click', async () => {
    await logout();
    go('/');
  });
  const fits = 'fits' in data && data.fits ? data.fits : [];
  root.append(
    h(
      'section',
      { class: 'stack' },
      h('h1', null, t('me.title')),
      h('p', { class: 'small' }, u.email),
      fits.length
        ? h(
            'ul',
            { class: 'whatif' },
            ...fits.map((f) =>
              h('li', null, h('a', { href: `#/fit/${f.id}` }, `${new Date(f.created_at).toLocaleDateString()} · ${f.brand ?? ''} ${f.name ?? ''} ${f.weight_g ? `${f.weight_g} g` : ''}`)),
            ),
          )
        : h('p', null, t('me.empty')),
      toggle('al', t('me.alerts'), u.alerts_email, 'alertsEmail'),
      toggle('fb', t('me.feedback'), u.feedback_email, 'feedbackEmail'),
      h('div', { class: 'actions' }, h('a', { class: 'btn ghost', href: '/api/me/export' }, t('me.export')), del, out),
    ),
  );
}
