import {
  silhouetteOverlap,
  tierBoundsUsd,
  variantBarrel,
  type Fit,
  type Pick as RecPick,
  type Variant,
} from '@dartfit/engine';
import { h } from '../h';
import { getLang, num, range, t, type Key } from '../i18n';
import { go } from '../router';
import { session } from '../store';
import { DEMO, explain, getFit, type FitResult, type Offer } from '../api';
import { dartDrawing } from '../draw/dart';
import { bandRow } from '../draw/bands';
import { balanceName, dartName, reasonText, shapeName } from './words';
import { approxEur } from '../money';
import { matchPct } from '../score';
import { dartMedia } from '../media';
import { alertSignup } from './alert-signup';
import { matchSplit } from './match-split';
import { partnerBanner } from './partner';

const k = (s: string) => s as Key;
type FullPick = RecPick & { offers: Offer[] };

const priceText = (usd: number) => `≈ €${approxEur(usd)}`;

function offerLink(o: Offer, fitId: string | null, primary: boolean): HTMLElement {
  const href = DEMO || !fitId ? o.goUrl : `${o.goUrl}?fit=${encodeURIComponent(fitId)}`;
  return h(
    'a',
    { class: primary ? 'btn' : 'btn ghost', href, target: '_blank', rel: 'noopener sponsored' },
    h(
      'span',
      null,
      o.kind === 'search' ? t('r.search', { shop: o.retailerName }) : t('r.buy', { shop: o.retailerName }),
    ),
    o.price !== null && o.currency === 'USD' ? h('span', { class: 'price' }, priceText(o.price)) : null,
  );
}

const spec = (value: string, unit: string, label: string) =>
  h('div', null, h('b', null, value, h('small', null, unit)), h('span', null, label));

function altCard(r: FitResult, p: FullPick): HTMLElement {
  const v = p.variant;
  const o = p.offers[0];
  return h(
    'article',
    { class: 'card' },
    h(
      'div',
      { class: 'meta' },
      h('span', { class: 'small' }, t(k(`r.role.${p.role}`))),
      h('b', { class: `q-${p.quality}` }, `${matchPct(p.cost)}%`),
    ),
    dartMedia(v),
    h('h3', null, dartName(v)),
    h(
      'p',
      { class: 'specline' },
      h('span', null, `${num(v.weightG)} g`),
      h('span', null, `${num(v.lengthMm)} mm`),
      h('span', null, `Ø ${num(v.diameterMm, 1)}`),
    ),
    v.priceUsd
      ? h(
          'p',
          { class: 'price-line alt-price' },
          h('b', null, priceText(v.priceUsd)),
          h('span', null, t('r.guide')),
        )
      : null,
    o ? offerLink(o, r.id, false) : null,
  );
}

type TierKey = 'budget' | 'standard' | 'premium';
const TIERS: TierKey[] = ['budget', 'standard', 'premium'];

/** Which price class a price falls in (same bounds as the engine). */
function tierOf(usd: number | null): TierKey | null {
  if (usd === null) return null;
  const b = tierBoundsUsd();
  return usd <= b.budgetMaxUsd ? 'budget' : usd <= b.standardMaxUsd ? 'standard' : 'premium';
}

/**
 * "Model match": this dart's outline drawn over the player's mathematically ideal barrel, with how
 * much of the two silhouettes coincide.
 */
function matchView(f: Fit, v: Variant): HTMLElement {
  const g = variantBarrel(v);
  const overlap = Math.round(100 * silhouetteOverlap(f.barrel, g));
  return h(
    'div',
    { class: 'match-view' },
    h('p', { class: 'overlap' }, h('b', null, `${overlap}%`), h('span', null, t('r.overlap'))),
    dartDrawing({
      ideal: f.barrel,
      lengthBand: f.length.band,
      diameterBand: f.diameter.band,
      animate: false,
      match: { ...g, label: dartName(v) },
    }),
    h(
      'div',
      { class: 'legend', 'aria-hidden': 'true' },
      h('span', null, h('i', { class: 'l-ideal' }), t('r.legend.zone')),
      h('span', null, h('i', { class: 'l-match' }), t('r.legend.this')),
    ),
  );
}

/** The big product view: photo or model match, with the switch. */
const productMedia = (f: Fit, v: Variant) =>
  dartMedia(v, { width: 800, toggle: true, model: matchView(f, v), modelLabel: t('media.match') });

/**
 * The answer, in three price classes: a tab per class, each showing the best-fitting dart in it
 * (only darts we can link to through an affiliate shop).
 */
function tierHero(r: FitResult, start: TierKey | null): HTMLElement | null {
  const tiers = r.tiers;
  if (!tiers) return null;
  const available = TIERS.filter((x) => tiers[x]);
  if (!available.length) return null;
  let cur: TierKey = start && tiers[start] ? start : available[0]!;
  const panel = h('div', { class: 'tier-body', role: 'tabpanel', id: 'tier-panel', tabindex: 0 });
  const tabs = h(
    'div',
    { class: 'tabs', role: 'tablist', 'aria-label': t('r.tiers') },
    ...TIERS.map((x) => {
      const sv = tiers[x];
      const b = h(
        'button',
        {
          class: 'tab',
          type: 'button',
          role: 'tab',
          id: `tab-${x}`,
          'aria-controls': 'tier-panel',
          disabled: !sv,
        },
        h('span', { class: 'tab-name' }, t(k(`r.tier.${x}`))),
        h(
          'span',
          { class: 'tab-sub' },
          sv?.variant.priceUsd ? priceText(sv.variant.priceUsd) : t('r.tier.none'),
        ),
      );
      b.addEventListener('click', () => {
        cur = x;
        show();
      });
      return b;
    }),
  );
  tabs.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    const i = available.indexOf(cur);
    cur = available[(i + (e.key === 'ArrowRight' ? 1 : available.length - 1)) % available.length]!;
    show();
    tabs.querySelector<HTMLElement>(`#tab-${cur}`)?.focus();
  });
  const show = () => {
    tabs.querySelectorAll('button').forEach((b) => {
      const on = b.id === `tab-${cur}`;
      b.setAttribute('aria-selected', String(on));
      b.tabIndex = on ? 0 : -1;
    });
    panel.setAttribute('aria-labelledby', `tab-${cur}`);
    const sv = tiers[cur]!;
    const v = sv.variant;
    const kids: Array<HTMLElement | null> = [
      h('h2', { class: 'dart-name' }, dartName(v)),
      productMedia(r.fit, v),
      matchSplit(sv),
      h(
        'div',
        { class: 'specs3' },
        spec(num(v.weightG), 'g', t('fit.r.weight')),
        spec(num(v.lengthMm), 'mm', t('fit.r.length')),
        spec(num(v.diameterMm, 1), 'mm', t('fit.r.diameter')),
      ),
      v.priceUsd
        ? h('p', { class: 'price-line' }, h('b', null, priceText(v.priceUsd)), h('span', null, t('r.guide')))
        : null,
      h('div', { class: 'offers' }, ...sv.offers.slice(0, 2).map((o, i) => offerLink(o, r.id, i === 0))),
    ];
    panel.replaceChildren(...kids.filter((x): x is HTMLElement => x !== null));
  };
  show();
  return h('section', { class: 'r-hero' }, h('h1', { class: 'visually-hidden' }, t('r.title')), tabs, panel);
}

export async function resultView(root: HTMLElement, params: Record<string, string>, query?: URLSearchParams) {
  let r: FitResult;
  try {
    r = await getFit(params.id ?? '');
  } catch {
    return go('/questions');
  }
  const f = r.fit;
  const picks = r.recommendation.picks as FullPick[];
  const best = picks[0];
  const lang = getLang();

  // ── Explanation (AI, grounded; template in the demo) ───────────────
  const explainP = h('p', { class: 'explain', 'aria-busy': 'true' }, t('r.explain.loading'));
  if (best)
    explain(r, best, lang)
      .then((e) => {
        explainP.textContent = e.text;
        explainP.setAttribute('aria-busy', 'false');
      })
      .catch(() => {
        explainP.textContent = t('error.generic');
        explainP.setAttribute('aria-busy', 'false');
      });

  const pc = session().priceClass;
  const hero = tierHero(r, pc && pc !== 'any' ? pc : tierOf(best?.variant.priceUsd ?? null));

  const why = (dim: string) =>
    f.reasons
      .filter((x) => x.dim === dim && !['weight_prior', 'length_fingers', 'grip_feel'].includes(x.code))
      .map(reasonText)
      .filter(Boolean)
      .join(' ');
  const bands = h(
    'div',
    { class: 'bands' },
    bandRow({
      label: t('r.weight'),
      unit: 'g',
      scale: [16, 28],
      ticks: [18, 20, 22, 24, 26],
      band: f.weight.band,
      match: best?.variant.weightG,
      why: why('weight'),
    }),
    bandRow({
      label: t('r.length'),
      unit: 'mm',
      scale: [36, 60],
      ticks: [40, 45, 50, 55],
      band: f.length.band,
      match: best?.variant.lengthMm,
      why: why('length'),
    }),
    bandRow({
      label: t('r.diameter'),
      unit: 'mm',
      digits: 1,
      scale: [5.6, 8.5],
      ticks: [6, 6.5, 7, 7.5, 8],
      band: f.diameter.band,
      match: best?.variant.diameterMm,
      why: why('diameter'),
    }),
    bandRow({
      label: t('r.grip'),
      unit: '',
      scale: [1, 5],
      ticks: [2, 3, 4],
      band: f.grip.band,
      match: best?.variant.gripIntensity,
      why: why('grip'),
    }),
  );
  const su = f.setup;
  const setup = h(
    'div',
    { class: 'setup' },
    h(
      'div',
      null,
      h('span', { class: 'small' }, t('r.setup.shaft')),
      h('b', null, t(k(`r.setup.${su.shaft}`))),
      h('span', { class: 'small num' }, range(su.shaftMm, 'mm', 0)),
    ),
    h(
      'div',
      null,
      h('span', { class: 'small' }, t('r.setup.flight')),
      h('b', null, t(k(`r.setup.${su.flight}`))),
    ),
    h(
      'div',
      null,
      h('span', { class: 'small' }, t('r.setup.point')),
      h('b', { class: 'num' }, range(su.pointMm, 'mm', 0)),
    ),
  );
  const whatIf = r.whatIf.slice(0, 3).map((w) => {
    const a =
      w.question === 'hold'
        ? t(k(`q.hold.${w.answer}`)).toLowerCase()
        : w.question === 'throwStyle'
          ? t(k(`word.${w.answer}`))
          : w.question === 'thickness'
            ? t(k(`q.thickness.${w.answer}`)).toLowerCase()
            : String(w.answer);
    return h('li', null, `${t(k(`r.whatif.${w.question}`), { a })}: ${w.newBestName}`);
  });
  const physics = f.reasons
    .filter((x) => x.code.startsWith('physics'))
    .map(reasonText)
    .filter(Boolean) as string[];

  const more = (title: string, ...body: Array<HTMLElement | null | false>) =>
    h('details', { class: 'more' }, h('summary', null, title), h('div', null, ...body));

  const twin = r.proTwin;
  const v = best?.variant;
  const copyBtn = h('button', { class: 'btn ghost', type: 'button' }, t('r.share'));
  copyBtn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(location.href);
      copyBtn.textContent = t('r.copied');
    } catch {
      /* clipboard blocked: the address bar still has the link */
    }
  });

  // Scanned without a card: say so first, with the way to a precise result.
  const unscaled = f.reasons.some((x) => x.code === 'hand_unscaled' || x.code === 'hand_unscaled_height')
    ? h(
        'p',
        { class: 'unscaled-warn', role: 'note' },
        t('r.unscaled'),
        ' ',
        h('a', { href: '#/scan' }, t('r.unscaled.again')),
      )
    : null;
  const parts: Array<HTMLElement | null> = [
    unscaled,
    // Email sign-up first, then the darts.
    alertSignup(r.id ?? undefined, { saved: !!r.saved, justConfirmed: query?.get('alerts') === '1' }),
    hero ??
      (v && best
        ? h(
            'section',
            { class: 'r-hero' },
            h('h1', null, dartName(v)),
            productMedia(f, v),
            matchSplit(best),
            h(
              'div',
              { class: 'specs3' },
              spec(num(v.weightG), 'g', t('fit.r.weight')),
              spec(num(v.lengthMm), 'mm', t('fit.r.length')),
              spec(num(v.diameterMm, 1), 'mm', t('fit.r.diameter')),
            ),
            h(
              'div',
              { class: 'offers' },
              ...best.offers.slice(0, 2).map((o, i) => offerLink(o, r.id, i === 0)),
            ),
          )
        : h(
            'section',
            { class: 'r-hero' },
            h('h1', null, t('r.title')),
            h('p', { class: 'callout' }, t('r.none', { tip: t(k(`q.tip.${f.tip}`)) })),
          )),
    twin
      ? h(
          'section',
          { class: 'twin', 'aria-labelledby': 'twin-name' },
          h('p', { class: 'kicker' }, t('r.twin')),
          h('h2', { id: 'twin-name' }, twin.pro.name),
          h('p', null, `${dartName(twin.scored.variant)} ${num(twin.scored.variant.weightG)} g`),
        )
      : null,
    picks.length > 1
      ? h(
          'section',
          { class: 'stack' },
          h('h2', null, t('r.alts.title')),
          h('div', { class: 'rail' }, ...picks.slice(1).map((p) => altCard(r, p))),
        )
      : null,
    h(
      'section',
      null,
      best ? more(t('r.explain'), explainP) : null,
      more(
        t('r.more.sizes'),
        h(
          'p',
          { class: 'small' },
          t('r.ideal.short', {
            L: num(f.barrel.lengthMm),
            D: num(f.barrel.diameterMm),
            g: num(f.barrel.massG, 0),
            shape: shapeName(f.barrel.shape),
          }),
        ),
        ...physics.map((n) => h('p', { class: 'callout' }, n)),
        bands,
        h('p', { class: 'small' }, `${t('r.balance')}: ${balanceName(f.preferredBalance)}`),
      ),
      more(t('r.setup.title'), setup),
      whatIf.length ? more(t('r.whatif'), h('ul', { class: 'whatif' }, ...whatIf)) : null,
    ),
    partnerBanner(),
    h(
      'section',
      { class: 'r-actions' },
      DEMO ? null : copyBtn,
      h('a', { class: 'btn ghost block', href: '#/' }, t('r.again')),
      h(
        'p',
        { class: 'disclosure' },
        t('r.disclosure.short'),
        ' ',
        h('a', { href: '#/method' }, t('r.method')),
      ),
    ),
  ];
  root.append(...parts.filter((x): x is HTMLElement => x !== null));
}
