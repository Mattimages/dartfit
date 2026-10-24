import { h } from '../h';
import { t } from '../i18n';
import { getCountry } from '../region';
import { DEMO } from '../api';

/**
 * Partner banners that only show in one country. Darting.com (US) for now. Built in our own
 * markup: no third-party script or image, so the strict CSP and the privacy promise hold. The click
 * goes through /go, which logs it and adds the affiliate ID on the server.
 */
export function partnerBanner(): HTMLElement | null {
  if (getCountry() !== 'US') return null;
  const href = DEMO ? 'https://www.darting.com/' : '/go/partner%3Adarting';
  return h(
    'a',
    { class: 'partner', href, rel: 'sponsored noopener', target: '_blank' },
    h('span', { class: 'partner-tag' }, t('partner.tag')),
    h('b', { class: 'partner-name' }, 'Darting.com'),
    h('span', { class: 'partner-sub' }, t('partner.darting.sub')),
    h('span', { class: 'partner-go' }, t('partner.darting.go')),
  );
}
