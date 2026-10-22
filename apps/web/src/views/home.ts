import type { Variant } from '@dartfit/engine';
import { h } from '../h';
import { num, t, type Key } from '../i18n';
import { pros, variants } from '../api';
import { clearSession } from '../store';
import { approxEur, PRICE_CLASS_EUR } from '../money';
import { dartMedia, photoUrl } from '../media';
import { dartName } from './words';

type Tier = 'budget' | 'standard' | 'premium';

const eur = (v: Variant) => (v.priceUsd ? approxEur(v.priceUsd) : null);
const tierOf = (v: Variant): Tier | null => {
  const e = eur(v);
  if (e === null) return null;
  return e <= PRICE_CLASS_EUR.budgetMax
    ? 'budget'
    : e <= PRICE_CLASS_EUR.standardMax
      ? 'standard'
      : 'premium';
};

/** Darts we can show with a real photo, one per model, steel tip, specs that check out. */
function showable(): Variant[] {
  const seen = new Set<string>();
  return variants().filter((v) => {
    if (v.tip !== 'steel' || v.specCheck || seen.has(v.modelId) || !photoUrl(v.modelId, 400)) return false;
    seen.add(v.modelId);
    return true;
  });
}

/** One good-looking example per price class: the best-known dart in it, or the priciest. */
function tierPicks(all: Variant[]): Record<Tier, Variant | undefined> {
  const prefer: Record<Tier, string[]> = {
    budget: ['target-buzz-03', 'target-buzz-01', 'one80-griptron-gt2'],
    standard: ['one80-jesus-noguera-signature', 'winmau-joe-cullen', 'winmau-noppert-sig2'],
    premium: ['target-littler-g1', 'rd-humphries-tx4', 'winmau-mvg-ts-pro'],
  };
  const out = {} as Record<Tier, Variant | undefined>;
  for (const tier of ['budget', 'standard', 'premium'] as Tier[]) {
    const inTier = all.filter((v) => tierOf(v) === tier);
    out[tier] =
      prefer[tier].map((id) => inTier.find((v) => v.modelId === id)).find(Boolean) ??
      inTier.sort((a, b) => (b.priceUsd ?? 0) - (a.priceUsd ?? 0))[0];
  }
  return out;
}

/** Three real darts fanned out from their points, like a set in your hand. */
function heroFan(picks: Variant[]) {
  const fan = h('div', { class: 'fan', 'aria-hidden': 'true' });
  picks.forEach((v, i) => {
    const src = photoUrl(v.modelId, 800);
    if (src) fan.append(h('img', { class: `fan-${i}`, src, alt: '', decoding: 'async' }));
  });
  fan.append(
    h('span', { class: 'fan-chip match' }, h('b', null, '96%'), t('land.chip.match')),
    h('span', { class: 'fan-chip spec' }, '22 g · 48,5 mm'),
  );
  return fan;
}

const start = () => clearSession();

export function homeView(root: HTMLElement) {
  const all = showable();
  const picks = tierPicks(all);
  const fanDarts = [picks.budget, picks.premium, picks.standard].filter((v): v is Variant => !!v);
  const brands = new Set(variants().map((v) => v.brand)).size;

  const tierCard = (tier: Tier) => {
    const v = picks[tier];
    if (!v) return null;
    const max =
      tier === 'budget'
        ? PRICE_CLASS_EUR.budgetMax
        : tier === 'standard'
          ? PRICE_CLASS_EUR.standardMax
          : null;
    return h(
      'li',
      { class: `tier-card tier-${tier}` },
      h(
        'div',
        { class: 'tier-top' },
        h('b', null, t(`land.tier.${tier}` as Key)),
        h('span', null, max ? t('land.tier.upto', { eur: max }) : t('land.tier.top')),
      ),
      dartMedia(v),
      h('p', { class: 'tier-name' }, dartName(v)),
      h(
        'p',
        { class: 'tier-meta' },
        `${num(v.weightG)} g`,
        eur(v) ? h('span', { class: 'eur' }, `€${eur(v)}`) : null,
      ),
    );
  };

  // Pros whose dart we can show, best known first (the list is already in that order).
  const proCards = pros()
    .map((p) => ({ p, v: variants().find((v) => v.id === p.variantId) }))
    .filter((x): x is { p: (typeof x)['p']; v: Variant } => !!x.v && !!photoUrl(x.v.modelId, 400))
    .slice(0, 8);

  root.append(
    h(
      'section',
      { class: 'land-hero' },
      h('h1', null, t('land.title')),
      h('p', { class: 'lead' }, t('land.lead')),
      heroFan(fanDarts),
      h(
        'div',
        { class: 'hero-cta' },
        h('a', { class: 'btn block', href: '#/scan', onclick: start }, t('land.cta')),
        h('a', { class: 'btn link', href: '#/manual', onclick: start }, t('land.cta.manual')),
      ),
      h(
        'ul',
        { class: 'proof' },
        h('li', null, h('b', null, String(variants().length)), t('land.proof.darts')),
        h('li', null, h('b', null, String(brands)), t('land.proof.brands')),
        h('li', null, h('b', null, '2'), t('land.proof.minutes')),
      ),
    ),

    h(
      'section',
      { class: 'land-block' },
      h('h2', null, t('land.how.title')),
      h(
        'ol',
        { class: 'steps' },
        ...[1, 2, 3].map((n) =>
          h(
            'li',
            null,
            h(
              'div',
              null,
              h('b', null, t(`land.how${n}` as Key)),
              h('span', { class: 'small' }, t(`land.how${n}.s` as Key)),
            ),
          ),
        ),
      ),
    ),

    h(
      'section',
      { class: 'land-block' },
      h('h2', null, t('land.tiers.title')),
      h('p', { class: 'sub' }, t('land.tiers.sub')),
      h('ul', { class: 'tier-cards' }, tierCard('budget'), tierCard('standard'), tierCard('premium')),
    ),

    proCards.length
      ? h(
          'section',
          { class: 'land-block' },
          h('h2', null, t('land.pros.title')),
          h('p', { class: 'sub' }, t('land.pros.sub')),
          h(
            'div',
            { class: 'rail pro-rail' },
            ...proCards.map(({ p, v }) =>
              h(
                'div',
                { class: 'card pro-card' },
                dartMedia(v),
                h('h3', null, p.name),
                h('p', { class: 'small' }, dartName(v)),
              ),
            ),
          ),
        )
      : '',

    h(
      'section',
      { class: 'land-block' },
      h(
        'div',
        { class: 'section-head' },
        h('h2', null, t('land.shelf.title')),
        h('a', { href: '#/darts' }, t('land.shelf.all', { n: variants().length })),
      ),
      h(
        'div',
        { class: 'rail' },
        ...all
          .filter((v) => !fanDarts.includes(v))
          .sort((a, b) => (b.priceUsd ?? 0) - (a.priceUsd ?? 0))
          .slice(0, 10)
          .map((v) =>
            h(
              'a',
              { class: 'card', href: '#/darts' },
              dartMedia(v),
              h('h3', null, dartName(v)),
              h(
                'p',
                { class: 'specline' },
                h('span', null, `${num(v.weightG)} g`),
                eur(v) ? h('span', { class: 'eur' }, `€${eur(v)}`) : null,
              ),
            ),
          ),
      ),
    ),

    h(
      'section',
      { class: 'land-end' },
      h('h2', null, t('land.end.title')),
      h('p', null, t('land.end.sub')),
      h('a', { class: 'btn block', href: '#/scan', onclick: start }, t('land.cta')),
    ),
  );
}
