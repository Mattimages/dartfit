/**
 * The catalogue page (/en/darts/, /nl/darts/, /de/darts/): every steel-tip dart DartFit scores, by
 * brand, with its specs and price class, the pro who throws it, and a note on the listings whose
 * stated weight fails the barrel physics check. One crawlable page instead of faceted weight or
 * shape pages (audit 22 Nov), which would only repeat the guides.
 */
import type { Lang, Site } from './types';
import { LANGS, UPDATED, chrome, cta, esc, fill, head, org, pathOf, website, type Stats } from './render';
import { proPaths, type CatalogueRows, type VariantRowLite } from './pro-pages';
import { PRICE_CLASS, type EngineFacts } from './landing';

export const CATALOGUE_SLUG = 'darts';
export const cataloguePath = (lang: Lang) => pathOf(lang, CATALOGUE_SLUG);

interface CatalogueCopy {
  title: string;
  description: string;
  h1: string;
  answer: string;
  brandH2: string;
  cols: [string, string, string, string];
  pro: string;
  grip: string;
  flagged: string;
  priceNote: string;
  shapes: Record<string, string>;
  faq: Array<[string, string]>;
  link: string;
}

export const CATALOGUE: Record<Lang, CatalogueCopy> = {
  en: {
    title: 'Steel-tip darts compared: all {darts}, with full specs',
    description:
      'Every steel-tip dart in the DartFit catalogue: weight, barrel length, thickness, shape, tungsten, grip and price class of {darts} darts from {brands} brands.',
    h1: 'All {darts} steel-tip darts in the DartFit catalogue',
    answer:
      'The DartFit catalogue holds {darts} steel-tip darts ({models} models) from {brands} brands, weighing {minW} to {maxW} g with a median of {medW} g. {straightPct} are straight barrels and {w90Pct} are 90% tungsten. Each dart below lists its weight, length, thickness, shape, tungsten, grip and price class, and DartFit scores every one against your hand.',
    brandH2: 'Which {brand} darts are in the catalogue?',
    cols: ['Dart', 'Weight, length, thickness', 'Shape, tungsten, grip', 'Price class'],
    pro: '{name}’s dart',
    grip: 'grip',
    flagged: 'The listed weight doesn’t fit this barrel’s size, so DartFit leaves it out of fits until it is checked.',
    priceNote:
      'Price classes: Budget up to €50, Standard up to €80, Premium above. Prices are guide prices; the shop shows the real one.',
    shapes: { straight: 'straight', torpedo: 'torpedo', tapered: 'tapered', bomb: 'bomb', scalloped: 'scalloped' },
    faq: [
      [
        'What is the most common dart weight?',
        'The median steel-tip dart in the catalogue weighs {medW} g, and {share2224} of them weigh 22 to 24 g.',
      ],
      [
        'Which of these darts fits me?',
        'The one that fits your hand and grip. DartFit measures your hand next to a bank card and ranks all {darts} darts for you, free, in about a minute.',
      ],
    ],
    link: 'All {darts} darts compared',
  },
  nl: {
    title: 'Steeltip darts vergeleken: alle {darts} met hun specs',
    description:
      'Alle steeltip darts in de DartFit-catalogus: gewicht, barrellengte, dikte, vorm, tungsten, grip en prijsklasse van {darts} darts van {brands} merken.',
    h1: 'Alle {darts} steeltip darts in de DartFit-catalogus',
    answer:
      'De DartFit-catalogus telt {darts} steeltip darts ({models} modellen) van {brands} merken, van {minW} tot {maxW} gram, met een mediaan van {medW} gram. {straightPct} heeft een rechte barrel en {w90Pct} is 90% tungsten. Bij elke dart hieronder staan gewicht, lengte, dikte, vorm, tungsten, grip en prijsklasse, en DartFit vergelijkt ze allemaal met jouw hand.',
    brandH2: 'Welke darts van {brand} staan in de catalogus?',
    cols: ['Dart', 'Gewicht, lengte, dikte', 'Vorm, tungsten, grip', 'Prijsklasse'],
    pro: 'De dart van {name}',
    grip: 'grip',
    flagged: 'Het opgegeven gewicht past niet bij de maat van deze barrel, dus DartFit laat hem buiten de fits tot het is nagekeken.',
    priceNote:
      'Prijsklassen: Budget tot €50, Standaard tot €80, Premium daarboven. Het zijn richtprijzen; de winkel toont de echte prijs.',
    shapes: { straight: 'recht', torpedo: 'torpedo', tapered: 'taps', bomb: 'bomb', scalloped: 'scalloped' },
    faq: [
      [
        'Wat is het meest gangbare dartgewicht?',
        'De mediaan in de catalogus is {medW} gram, en {share2224} van de steeltip darts weegt 22 tot 24 gram.',
      ],
      [
        'Welke van deze darts past bij mij?',
        'De dart die bij je hand en grip past. DartFit meet je hand naast een pasje en zet alle {darts} darts voor je op volgorde, gratis en in ongeveer een minuut.',
      ],
    ],
    link: 'Alle {darts} darts vergeleken',
  },
  de: {
    title: 'Steeldarts im Vergleich: alle {darts} mit allen Daten',
    description:
      'Alle Steeldarts im DartFit-Katalog: Gewicht, Barrellänge, Dicke, Form, Wolfram, Grip und Preisklasse von {darts} Darts von {brands} Marken.',
    h1: 'Alle {darts} Steeldarts im DartFit-Katalog',
    answer:
      'Der DartFit-Katalog umfasst {darts} Steeldarts ({models} Modelle) von {brands} Marken, von {minW} bis {maxW} Gramm, im Median {medW} Gramm. {straightPct} haben einen geraden Barrel und {w90Pct} sind aus 90% Wolfram. Zu jedem Dart unten stehen Gewicht, Länge, Dicke, Form, Wolfram, Grip und Preisklasse, und DartFit vergleicht jeden einzelnen mit deiner Hand.',
    brandH2: 'Welche Darts von {brand} stehen im Katalog?',
    cols: ['Dart', 'Gewicht, Länge, Dicke', 'Form, Wolfram, Grip', 'Preisklasse'],
    pro: 'Der Dart von {name}',
    grip: 'Grip',
    flagged: 'Das angegebene Gewicht passt nicht zur Größe dieses Barrels, daher lässt DartFit ihn bis zur Prüfung aus den Fits.',
    priceNote:
      'Preisklassen: Budget bis 50 €, Standard bis 80 €, Premium darüber. Es sind Richtpreise; der Shop zeigt den echten Preis.',
    shapes: { straight: 'gerade', torpedo: 'Torpedo', tapered: 'konisch', bomb: 'Bomb', scalloped: 'Scalloped' },
    faq: [
      [
        'Welches Dartgewicht ist am häufigsten?',
        'Der Median im Katalog liegt bei {medW} Gramm, und {share2224} der Steeldarts wiegen 22 bis 24 Gramm.',
      ],
      [
        'Welcher dieser Darts passt zu mir?',
        'Der, der zu deiner Hand und deinem Griff passt. DartFit misst deine Hand neben einer Bankkarte und ordnet alle {darts} Darts für dich, kostenlos und in etwa einer Minute.',
      ],
    ],
    link: 'Alle {darts} Darts im Vergleich',
  },
};

const anchor = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

export function renderCatalogue(site: Site, st: Stats, base: string, cat: CatalogueRows, facts?: EngineFacts): string {
  const lang = site.lang;
  const C = CATALOGUE[lang];
  const f = (x: string) => fill(x, st, lang);
  const sub = (x: string, v: Record<string, string>) => x.replace(/\{(\w+)\}/g, (m, k: string) => v[k] ?? m);
  const path = cataloguePath(lang);
  const url = base + path;
  const alternates = LANGS.map((l) => ({ lang: l, path: cataloguePath(l) }));
  const loc = site.locale.replace('_', '-');
  const n = (x: number, d = 1) => x.toLocaleString(loc, { maximumFractionDigits: d });
  const flagged = new Set(facts?.flagged ?? []);
  const proOf = new Map(cat.pros.map((p) => [p.variantId, p]));
  const brands = [...new Set(cat.variants.map((v) => v.brand))].sort(
    (a, b) =>
      cat.variants.filter((v) => v.brand === b).length - cat.variants.filter((v) => v.brand === a).length ||
      a.localeCompare(b),
  );
  const row = (v: VariantRowLite) => {
    const pro = proOf.get(v.id);
    const pr = facts?.prices[v.id];
    const name = `${esc(`${v.brand} ${v.model}`)}${pro ? `<br><a href="${proPaths.pro(lang, pro)}">${esc(sub(C.pro, { name: pro.name }))}</a>` : ''}${flagged.has(v.id) ? `<br><small>${esc(C.flagged)}</small>` : ''}`;
    const style = [v.shape ? C.shapes[v.shape] ?? v.shape : '', v.tungsten ? `${v.tungsten}%` : '', v.grip ? `${C.grip} ${v.grip}/5` : '']
      .filter(Boolean)
      .map(esc)
      .join('<br>');
    // One value per line: narrow columns on a phone never strand a separator.
    return `<tr><th scope="row">${name}</th><td class="nw">${n(v.weight)} g<br>${n(v.length)} mm<br>${n(v.diameter, 2)} mm</td><td>${style || '–'}</td><td>${pr ? `${esc(PRICE_CLASS[lang][pr.tier])}<br><span class="nw">≈ €${pr.eur}</span>` : '–'}</td></tr>`;
  };
  const sections = brands
    .map((brand) => {
      const list = cat.variants
        .filter((v) => v.brand === brand)
        .sort((a, b) => a.model.localeCompare(b.model) || a.weight - b.weight);
      return `<section><h2 id="${anchor(brand)}">${esc(sub(C.brandH2, { brand }))}</h2>
<div class="table"><table class="catalogue"><thead><tr>${C.cols.map((c) => `<th scope="col">${esc(c)}</th>`).join('')}</tr></thead><tbody>${list.map(row).join('')}</tbody></table></div></section>`;
    })
    .join('\n');
  const toc = `<nav class="brands" aria-label="${esc(C.cols[0])}"><ul>${brands
    .map((b) => `<li><a href="#${anchor(b)}">${esc(b)} <span>(${cat.variants.filter((v) => v.brand === b).length})</span></a></li>`)
    .join('')}</ul></nav>`;
  const faq = C.faq.map(([q, a]) => [f(q), f(a)] as const);
  const crumbs = `<nav class="crumbs" aria-label="Breadcrumb"><a href="${pathOf(lang, '')}">DartFit</a> › <span aria-current="page">${esc(f(C.h1))}</span></nav>`;
  const inner = `<article>
<h1>${esc(f(C.h1))}</h1>
<p class="answer">${esc(f(C.answer))}</p>
${cta(site)}
${toc}
<p class="note">${esc(C.priceNote)}</p>
${sections}
<section class="faq"><h2 id="faq">${esc(site.ui.faq)}</h2>
${faq.map(([q, a]) => `<h3>${esc(q)}</h3>\n<p>${esc(a)}</p>`).join('\n')}
</section>
<p class="updated">${esc(site.ui.updated)}: <time datetime="${UPDATED}">${new Date(UPDATED).toLocaleDateString(loc, { day: 'numeric', month: 'long', year: 'numeric' })}</time> · DartFit</p>
</article>
${cta(site)}`;
  const langLinks = alternates
    .map((a) =>
      a.lang === lang
        ? `<span aria-current="page">${a.lang.toUpperCase()}</span>`
        : `<a href="${a.path}" hreflang="${a.lang}" lang="${a.lang}">${a.lang.toUpperCase()}</a>`,
    )
    .join('');
  const jsonld = [
    {
      '@context': 'https://schema.org',
      '@graph': [
        org(base),
        website(base),
        {
          '@type': 'CollectionPage',
          '@id': `${url}#page`,
          url,
          name: f(C.h1),
          description: f(C.description),
          inLanguage: lang,
          dateModified: UPDATED,
          isPartOf: { '@id': `${base}/#website` },
          mainEntity: { '@id': `${url}#list` },
        },
        {
          // Things, not Products: guide prices only, no offer on this page.
          '@type': 'ItemList',
          '@id': `${url}#list`,
          name: f(C.h1),
          numberOfItems: cat.variants.length,
          itemListElement: brands
            .flatMap((b) => cat.variants.filter((v) => v.brand === b).sort((x, y) => x.model.localeCompare(y.model) || x.weight - y.weight))
            .map((v, i) => ({
              '@type': 'ListItem',
              position: i + 1,
              name: `${v.brand} ${v.model} ${v.weight} g`,
              description: `${v.weight} g, ${v.length} mm, ${v.diameter} mm, ${v.tungsten}% tungsten${v.shape ? `, ${v.shape}` : ''}`,
            })),
        },
        {
          '@type': 'FAQPage',
          '@id': `${url}#faq`,
          inLanguage: lang,
          mainEntity: faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'DartFit', item: base + pathOf(lang, '') },
            { '@type': 'ListItem', position: 2, name: f(C.h1), item: url },
          ],
        },
      ],
    },
  ];
  return (
    head({ site, title: f(C.title), description: f(C.description), path, alternates, base, jsonld }) +
    chrome(site, inner, langLinks, crumbs)
  );
}

/** The landing page's and the pro index's link to the catalogue. */
export function catalogueHubItem(site: Site, st: Stats): string {
  const C = CATALOGUE[site.lang];
  return `<li><a href="${cataloguePath(site.lang)}"><b>${esc(fill(C.link, st, site.lang))}</b><span>${esc(fill(C.description, st, site.lang))}</span></a></li>`;
}

