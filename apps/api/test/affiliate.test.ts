import { describe, expect, it } from 'vitest';
import { loadCatalogue } from '@dartfit/catalogue';
import { affiliate, affiliateReady, PARTNER_BANNERS } from '../src/catalogue.js';
import { loadEnv } from '../src/env.js';

const env = loadEnv({
  NODE_ENV: 'test',
  AMAZON_TAG_FR: 'dartfit-21',
  EBAY_CAMPAIGN_ID: '5338000000',
  DARTSCORNER_DEEPLINK: 'https://track.example/t?a=1&url={url}',
  BOL_PARTNER_SITE_ID: '12345',
  DARTING_AFF_ID: '4311',
});
const shop = (id: string) => loadCatalogue().retailers.find((r) => r.id === id)!;

describe('affiliate tagging', () => {
  it('Amazon: adds the marketplace tag', () => {
    const u = new URL(affiliate(env, 'amazon_fr', 'https://www.amazon.fr/s?k=target%20darts'));
    expect(u.searchParams.get('tag')).toBe('dartfit-21');
    expect(u.searchParams.get('k')).toBe('target darts');
  });
  it('eBay: Partner Network parameters with the site rotation ID', () => {
    const u = new URL(affiliate(env, 'ebay_de', 'https://www.ebay.de/sch/i.html?_nkw=x'));
    expect(u.searchParams.get('campid')).toBe('5338000000');
    expect(u.searchParams.get('mkrid')).toBe(shop('ebay_de').ebayRotation);
    expect(u.searchParams.get('mkevt')).toBe('1');
  });
  it('network deeplink: the target URL goes into the template, encoded', () => {
    const out = affiliate(env, 'dartscorner_eu', 'https://dartscorner.de/search?q=a b');
    expect(out).toBe(
      `https://track.example/t?a=1&url=${encodeURIComponent('https://dartscorner.de/search?q=a b')}`,
    );
  });
  it('bol.com: partner click link', () => {
    expect(affiliate(env, 'bol', 'https://www.bol.com/nl/nl/s/?searchtext=x')).toMatch(
      /^https:\/\/partner\.bol\.com\/click\/click\?.*s=12345/,
    );
  });
  it('Darting.com (US): the affiliate ID rides on the link; the banner keeps its banner ID', () => {
    const u = new URL(affiliate(env, 'darting_us', 'https://www.darting.com/'));
    expect(u.searchParams.get('AffId')).toBe('4311');
    const b = new URL(affiliate(env, 'darting_us', PARTNER_BANNERS['partner:darting']!.url));
    expect(b.searchParams.get('AffId')).toBe('4311');
    expect(b.searchParams.get('AFFBanId')).toBe('10025');
    expect(shop('darting_us').countries).toEqual(['US']);
  });
  it('untagged and unchanged when no ID is set', () => {
    expect(affiliate(env, 'amazon_de', 'https://www.amazon.de/s?k=x')).toBe('https://www.amazon.de/s?k=x');
  });
  it('production links a shop only once its ID is set; a shop without a programme never', () => {
    const prod = { ...env, NODE_ENV: 'production' } as typeof env;
    expect(affiliateReady(prod, shop('amazon_fr'))).toBe(true);
    expect(affiliateReady(prod, shop('amazon_de'))).toBe(false);
    expect(affiliateReady(env, shop('azdarts'))).toBe(false);
  });
  it('ALLOW_UNTAGGED_LINKS: shops without an ID yet are linked plainly; spec-only sources never', () => {
    const base = {
      NODE_ENV: 'production',
      DATABASE_URL: 'postgres://x',
      PUBLIC_URL: 'https://x.test',
      SESSION_SECRET: 'p'.repeat(40),
    };
    const strict = loadEnv(base);
    const open = loadEnv({ ...base, ALLOW_UNTAGGED_LINKS: 'true' });
    expect(affiliateReady(strict, shop('bol'))).toBe(false);
    expect(affiliateReady(open, shop('bol'))).toBe(true);
    expect(affiliateReady(open, shop('azdarts'))).toBe(false);
    expect(affiliate(open, 'bol', 'https://www.bol.com/nl/s/?searchtext=x')).toBe(
      'https://www.bol.com/nl/s/?searchtext=x',
    );
  });
  it('every EU+ country has at least one affiliate shop', () => {
    const { retailers } = loadCatalogue();
    const countries = [
      'AT',
      'BE',
      'BG',
      'HR',
      'CY',
      'CZ',
      'DK',
      'EE',
      'FI',
      'FR',
      'DE',
      'GR',
      'HU',
      'IE',
      'IT',
      'LV',
      'LT',
      'LU',
      'MT',
      'NL',
      'PL',
      'PT',
      'RO',
      'SK',
      'SI',
      'ES',
      'SE',
      'CH',
      'NO',
      'GB',
    ];
    for (const c of countries)
      expect(
        retailers.some((r) => r.affiliateType && r.countries.includes(c)),
        c,
      ).toBe(true);
  });
});
