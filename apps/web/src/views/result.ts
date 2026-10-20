import { variantBarrel, type Pick as RecPick } from '@dartfit/engine';
import { h } from '../h';
import { getLang, num, range, t, type Key } from '../i18n';
import { go } from '../router';
import { DEMO, explain, getFit, type FitResult, type Offer } from '../api';
import { dartDrawing } from '../draw/dart';
import { bandRow } from '../draw/bands';
import { balanceName, dartName, material, reasonText, shapeName } from './words';

const k = (s: string) => s as Key;

function offerButton(o: Offer, fitId: string | null): HTMLElement {
  const label =
    o.kind === 'search' ? t('r.search', { shop: o.retailerName }) : t('r.buy', { shop: o.retailerName });
  const href = DEMO || !fitId ? o.goUrl : `${o.goUrl}?fit=${encodeURIComponent(fitId)}`;
  return h(
    'a',
    { class: o.kind === 'product' ? 'btn ghost' : 'btn', href, target: '_blank', rel: 'noopener sponsored' },
    h('span', null, label),
    o.price !== null && o.currency === 'USD'
      ? h('span', { class: 'num small' }, `$${num(o.price, 2)}`)
      : null,
  );
}

function pickBlock(r: FitResult, p: RecPick & { offers: Offer[] }): HTMLElement {
  const v = p.variant;
  const checks = p.checks.filter((c) => c.dim !== 'shape');
  const checkText = (c: (typeof checks)[number]) => {
    const dimName = t(k(`r.dim.${c.dim}`));
    if (c.status === 'unknown') return `${dimName}: ${t('r.unknown')}`;
    if (c.dim === 'balance') return `${dimName}: ${balanceName(String(c.value))}`;
    const unit = c.dim === 'weight' ? 'g' : c.dim === 'grip' ? '' : 'mm';
    return `${dimName}: ${num(Number(c.value), c.dim === 'diameter' ? 2 : 1)} ${unit}`.trim();
  };
  return h(
    'article',
    { class: 'pick' },
    h('p', { class: 'role' }, `${t(k(`r.role.${p.role}`))} · ${t(k(`r.quality.${p.quality}`))}`),
    h('h3', null, dartName(v)),
    h(
      'p',
      { class: 'specs num' },
      h('span', null, `${num(v.weightG)} g`),
      h('span', null, `${num(v.lengthMm)} mm`),
      h('span', null, `Ø ${num(v.diameterMm, 2)}`),
      h('span', null, shapeName(v.shape)),
      h('span', null, material(v)),
    ),
    h(
      'ul',
      { class: 'checks' },
      ...checks.map((c) => h('li', { class: c.status === 'unknown' ? 'near' : c.status }, checkText(c))),
    ),
    h('div', { class: 'offers' }, ...p.offers.slice(0, 3).map((o) => offerButton(o, r.id))),
    h(
      'p',
      { class: 'small' },
      h('a', { href: v.sourceUrl, target: '_blank', rel: 'noopener' }, t('r.source')),
      v.verifiedAt ? ` · ${v.verifiedAt}` : '',
    ),
  );
}

export async function resultView(root: HTMLElement, params: Record<string, string>) {
  let r: FitResult;
  try {
    r = await getFit(params.id ?? '');
  } catch {
    return go('/questions');
  }
  const f = r.fit;
  const best = r.recommendation.picks[0];
  const lang = getLang();

  // ── Ideal barrel, with the best match drawn over it ───────────────
  const bestGeo = best ? variantBarrel(best.variant) : null;
  const drawing = dartDrawing({
    ideal: f.barrel,
    lengthBand: f.length.band,
    diameterBand: f.diameter.band,
    animate: false,
    caption: `${num(f.barrel.massG, 0)} g · ${f.physics.tungstenPct}% tungsten · ${shapeName(f.barrel.shape)}`,
    match:
      bestGeo && best
        ? { ...bestGeo, label: `${dartName(best.variant)} ${num(best.variant.weightG)} g` }
        : undefined,
  });
  const physicsNotes = f.reasons
    .filter((x) => x.code.startsWith('physics'))
    .map((x) => reasonText(x))
    .filter(Boolean) as string[];

  // ── Bands ─────────────────────────────────────────────────────────
  const why = (dim: string) =>
    f.reasons
      .filter(
        (x) =>
          x.dim === dim && x.code !== 'weight_prior' && x.code !== 'length_fingers' && x.code !== 'grip_feel',
      )
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

  // ── Explanation (AI, grounded; template in the demo) ───────────────
  const explainP = h('p', { class: 'explain', 'aria-busy': 'true' }, t('r.explain.loading'));
  const explainSrc = h('p', { class: 'small', hidden: true }, t('r.explain.ai'));
  if (best) {
    explain(r, best, lang)
      .then((e) => {
        explainP.textContent = e.text;
        explainP.setAttribute('aria-busy', 'false');
        explainSrc.hidden = e.source !== 'ai';
      })
      .catch(() => {
        explainP.textContent = t('error.generic');
        explainP.setAttribute('aria-busy', 'false');
      });
  }

  // ── Setup ─────────────────────────────────────────────────────────
  const su = f.setup;
  const setup = h(
    'div',
    { class: 'setup' },
    h(
      'div',
      null,
      h('span', { class: 'small' }, t('r.setup.shaft')),
      h('b', null, t(k(`r.setup.${su.shaft}`))),
      h('span', { class: 'num small' }, range(su.shaftMm, 'mm', 0)),
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
      su.longPoint ? h('span', { class: 'small' }, t('r.setup.longpoint')) : null,
    ),
  );

  // ── Pro twin and what-ifs ─────────────────────────────────────────
  const twin = r.proTwin;
  const whatIf = r.whatIf.slice(0, 3).map((w) => {
    const a =
      w.question === 'hold'
        ? t(k(`q.hold.${w.answer}`)).toLowerCase()
        : w.question === 'throwStyle'
          ? t(k(`word.${w.answer}`))
          : w.question === 'thickness'
            ? t(k(`q.thickness.${w.answer}`)).toLowerCase()
            : String(w.answer);
    return h(
      'li',
      null,
      `${t(k(`r.whatif.${w.question}`), { a })}, ${t('r.whatif.then', { name: w.newBestName })}.`,
    );
  });

  const copyBtn = h('button', { class: 'btn ghost', type: 'button' }, t('r.share'));
  copyBtn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(location.href);
      copyBtn.textContent = t('r.copied');
    } catch {
      /* clipboard blocked: the address bar still has the link */
    }
  });

  const picks = r.recommendation.picks;
  const confKey = f.confidence;
  const sections: Array<HTMLElement | null> = [
    h(
      'section',
      { class: 'stack' },
      h('h1', null, t('r.title')),
      h(
        'div',
        { class: 'confidence' },
        h('span', { class: `pill ${confKey}` }, t(k(`r.confidence.${confKey}`))),
        h('p', { class: 'small' }, t(k(`r.confidence.why.${confKey}`))),
      ),
    ),
    h(
      'section',
      { class: 'stack' },
      h('h2', null, t('r.ideal.title')),
      h(
        'p',
        null,
        t('r.ideal.lead', {
          L: num(f.barrel.lengthMm),
          D: num(f.barrel.diameterMm),
          g: num(f.barrel.massG, 0),
          cog: num(f.barrel.cogMm, 0),
        }),
      ),
      h(
        'figure',
        { class: 'sheet' },
        drawing,
        h(
          'div',
          { class: 'legend', 'aria-hidden': 'true' },
          h('span', null, h('i', { class: 'l-ideal' }), t('r.legend.zone')),
          best
            ? h(
                'span',
                null,
                h('i', { class: 'l-match' }),
                `${t('r.legend.best')}: ${dartName(best.variant)} ${num(best.variant.weightG)} g`,
              )
            : null,
        ),
      ),
      ...physicsNotes.map((n) => h('p', { class: 'callout' }, n)),
      best ? h('p', { class: 'small' }, t('r.ideal.compare')) : null,
    ),
    h(
      'section',
      { class: 'stack' },
      h('h2', null, t('r.bands')),
      bands,
      h('p', null, `${t('r.balance')}: ${balanceName(f.preferredBalance)}.`),
    ),
    h(
      'section',
      { class: 'stack' },
      h('h2', null, t('r.match.title')),
      h('p', { class: 'small' }, t('r.match.lead', { n: r.recommendation.considered })),
      r.recommendation.coverage === 'none'
        ? h('p', { class: 'callout' }, t('r.none', { tip: t(k(`q.tip.${f.tip}`)) }))
        : r.recommendation.coverage === 'thin'
          ? h('p', { class: 'callout' }, t('r.thin'))
          : null,
      ...picks.map((p) => pickBlock(r, p)),
      h('p', { class: 'disclosure' }, t('r.disclosure')),
      r.recommendation.filteredOut.specCheck
        ? h('p', { class: 'small' }, t('r.flagged', { n: r.recommendation.filteredOut.specCheck }))
        : null,
    ),
    best ? h('section', { class: 'stack' }, h('h2', null, t('r.explain')), explainP, explainSrc) : null,
    h(
      'section',
      { class: 'stack' },
      h('h2', null, t('r.setup.title')),
      setup,
      h('p', { class: 'small' }, t('r.setup.note')),
    ),
    twin
      ? h(
          'section',
          { class: 'stack twin' },
          h('h2', null, t('r.twin')),
          h('strong', null, twin.pro.name),
          h(
            'p',
            null,
            t(twin.pro.exactDart ? 'r.twin.exact' : 'r.twin.line', {
              dart: `${dartName(twin.scored.variant)} ${num(twin.scored.variant.weightG)} g`,
            }),
          ),
          h('p', { class: 'small' }, t('r.twin.note')),
        )
      : null,
    whatIf.length
      ? h(
          'section',
          { class: 'stack' },
          h('h2', null, t('r.whatif')),
          h('ul', { class: 'whatif' }, ...whatIf),
        )
      : null,
    h(
      'section',
      { class: 'actions' },
      DEMO || r.saved || !r.id
        ? null
        : h('a', { class: 'btn', href: `#/signin?fit=${encodeURIComponent(r.id)}` }, t('r.save')),
      r.saved ? h('p', { class: 'small' }, t('r.saved')) : null,
      DEMO ? null : copyBtn,
      h('a', { class: 'btn link', href: '#/' }, t('r.again')),
      h('a', { class: 'btn link', href: '#/method' }, t('r.method')),
    ),
  ];
  root.append(...sections.filter((x): x is HTMLElement => x !== null));
}
