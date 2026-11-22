/**
 * Pro pages: "Which darts does Luke Littler throw?" for every player in pros.json, in every
 * language, from the catalogue's own specs. A pro's catalogue dart is his signature model unless
 * pros.json marks it as the exact dart he throws; a reported playing weight is quoted with its source.
 */
import type { Lang, Site } from './types';
import { PRO_COPY } from './pros';
import { LANGS, UPDATED, app, chrome, cta, esc, head, org, pathOf, siteOf, website } from './render';
import type { PageKey } from './types';
import type { EngineFacts } from './samples';
import { PRICE_CLASS } from './landing';

export interface VariantRowLite {
  id: string;
  modelId: string;
  brand: string;
  model: string;
  weight: number;
  length: number;
  diameter: number;
  shape: string;
  balance: string;
  grip: number | null;
  tungsten: number;
}
export interface ProRowLite {
  id: string;
  name: string;
  country: string;
  variantId: string;
  exactDart: boolean;
  playingWeightG: number | null;
  sourceUrl: string;
}
export interface ProPhotoLite {
  file: string;
  author: string;
  license: string;
  licenseUrl: string;
  source: string;
  cropped: boolean;
}
export interface CatalogueRows {
  variants: VariantRowLite[];
  pros: ProRowLite[];
  /** Pro photos (pro-photos.json), served from /pros/. */
  photos: Record<string, ProPhotoLite>;
}

/** Steel-tip rows from variants.csv (no quoted fields in it). */
export function catalogueRows(variantsCsv: string, prosJson: string, photosJson = '{}'): CatalogueRows {
  const [headLine, ...rows] = variantsCsv.trim().split(/\r?\n/);
  const cols = headLine!.split(',');
  const variants = rows
    .map((l) => {
      const r = l.split(',');
      const at = (k: string) => r[cols.indexOf(k)] ?? '';
      return {
        id: at('id'),
        modelId: at('model_id'),
        brand: at('brand'),
        model: at('model'),
        tip: at('tip'),
        weight: Number(at('weight_g')),
        length: Number(at('length_mm')),
        diameter: Number(at('diameter_mm')),
        shape: at('shape'),
        balance: at('balance'),
        grip: at('grip') ? Number(at('grip')) : null,
        tungsten: Number(at('tungsten_pct')),
      };
    })
    .filter((v) => v.tip === 'steel')
    .map(({ tip: _tip, ...v }) => v);
  const ids = new Set(variants.map((v) => v.id));
  const pros = (JSON.parse(prosJson) as ProRowLite[]).filter((p) => ids.has(p.variantId));
  return { variants, pros, photos: JSON.parse(photosJson) as Record<string, ProPhotoLite> };
}

const PHOTO_WORD = { nl: ['Foto', 'bijgesneden'], en: ['Photo', 'cropped'], de: ['Foto', 'zugeschnitten'] };

/** "Foto: <author>, <licence> (bijgesneden)" with links to the original and the licence. */
export function photoCreditHtml(p: ProPhotoLite, lang: Lang): string {
  const [w, cropped] = PHOTO_WORD[lang];
  return `${w}: <a href="${esc(p.source)}" rel="noopener">${esc(p.author)}</a>, <a href="${esc(p.licenseUrl)}" rel="license noopener">${esc(p.license)}</a>${p.cropped ? ` (${cropped})` : ''}`;
}

export const proSlug = (name: string) =>
  name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

export const proPaths = {
  index: (lang: Lang) => `/${lang}/${PRO_COPY[lang].slug}/`,
  pro: (lang: Lang, p: Pick<ProRowLite, 'name'>) => `/${lang}/${PRO_COPY[lang].slug}/${proSlug(p.name)}/`,
};

const locOf = (lang: Lang) => (lang === 'en' ? 'en-GB' : lang === 'de' ? 'de-DE' : 'nl-NL');
const num = (lang: Lang, x: number, d = 1) =>
  x.toLocaleString(locOf(lang), { maximumFractionDigits: d, minimumFractionDigits: 0 });

/** Where a source quote comes from, by name. */
function sourceName(url: string): string {
  const host = new URL(url).hostname.replace(/^www\./, '');
  if (host.endsWith('wikipedia.org')) return 'Wikipedia';
  if (host.includes('skysports')) return 'Sky Sports';
  return host;
}

function vars(lang: Lang, pro: ProRowLite, v: VariantRowLite): Record<string, string> {
  const c = PRO_COPY[lang];
  return {
    name: pro.name,
    model: `${v.brand} ${v.model}`,
    w: num(lang, v.weight),
    L: num(lang, v.length),
    D: num(lang, v.diameter),
    shape: c.shapes[(v.shape || 'straight') as keyof typeof c.shapes] ?? v.shape,
    t: String(v.tungsten),
    pw: pro.playingWeightG ? num(lang, pro.playingWeightG) : '',
    src: sourceName(pro.sourceUrl),
  };
}

function tpl(text: string, v: Record<string, string>, lang: Lang): string {
  const out = text.replace(/\{(\w+)\}/g, (m, k: string) => {
    if (!(k in v)) throw new Error(`unknown placeholder ${m}`);
    return v[k]!;
  });
  // German compounds: "Torpedo- Barrel" → "Torpedo-Barrel".
  return lang === 'de' ? out.replace(/- (Barrel)/g, '-$1') : out;
}

/** Keep meta descriptions inside what search results show. */
const clip = (s: string, max = 152) => (s.length <= max ? s : `${s.slice(0, s.lastIndexOf(' ', max - 1))}…`);
/** The first candidate that fits, so a title or description is never cut mid-sentence. */
const firstFit = (cands: string[], max: number) => cands.find((c) => c.length <= max) ?? clip(cands[cands.length - 1]!, max);

/** Copy for the catalogue benchmark, the similar-darts table, the CTA and the meta templates. */
const EXTRA: Record<
  Lang,
  {
    titles: string[];
    descriptions: string[];
    benchH2: string;
    benchLead: string;
    benchCols: [string, string, string, string];
    ratio: string;
    ratioNote: string;
    simCols: [string, string, string];
    simIntro: string;
    guidePrice: string;
    cta: string;
  }
> = {
  en: {
    titles: ['{name} darts: specs, grip and similar darts', '{name} darts: specs and similar darts', '{name} darts: specs'],
    descriptions: [
      'Which darts does {name} throw? The {model}: {w} g, {L} mm, {shape} barrel, {t}% tungsten, compared with {n} darts. Does it fit your hand?',
      '{name} throws the {model}: {w} g, {L} mm, {t}% tungsten, compared with {n} darts, plus the closest alternatives.',
      '{name} throws the {model}: {w} g, {L} mm, {t}% tungsten. Specs and similar darts.',
    ],
    benchH2: 'How does {name}’s dart compare with other darts?',
    benchLead:
      'At {w} g the {model} is heavier than {bw}% of the {n} steel-tip darts in the DartFit catalogue (median {mw} g), and at {L} mm longer than {bl}% of them (median {ml} mm).',
    benchCols: ['', 'This dart', 'Catalogue median', 'Darts below it'],
    ratio: 'Length ÷ thickness',
    ratioNote:
      'A higher length ÷ thickness means a longer, slimmer barrel; a lower one a shorter, chunkier barrel.',
    simCols: ['Dart', 'Weight · length · thickness · tungsten', 'Price class'],
    simIntro:
      'The closest darts of other models in the DartFit catalogue, with the difference from the {model} in brackets:',
    guidePrice: 'guide price',
    cta: 'Does {name}’s dart suit your hand? Measure it next to a bank card and see, in about a minute, for free.',
  },
  nl: {
    titles: ['Darts van {name}: specs, grip en alternatieven', 'Darts van {name}: specs en alternatieven', 'Darts van {name}: specs'],
    descriptions: [
      'Met welke darts gooit {name}? De {model}: {w} g, {L} mm, {shape} barrel, {t}% tungsten, vergeleken met {n} darts. Past hij bij jouw hand?',
      '{name} gooit met de {model}: {w} g, {L} mm, {t}% tungsten, vergeleken met {n} darts, plus de beste alternatieven.',
      '{name} gooit met de {model}: {w} g, {L} mm, {t}% tungsten. Specs en vergelijkbare darts.',
    ],
    benchH2: 'Hoe verhoudt de dart van {name} zich tot andere darts?',
    benchLead:
      'Met {w} g is de {model} zwaarder dan {bw}% van de {n} steeltip darts in de DartFit-catalogus (mediaan {mw} g), en met {L} mm langer dan {bl}% (mediaan {ml} mm).',
    benchCols: ['', 'Deze dart', 'Mediaan catalogus', 'Darts eronder'],
    ratio: 'Lengte ÷ dikte',
    ratioNote: 'Hoe hoger lengte ÷ dikte, hoe langer en slanker de barrel; hoe lager, hoe korter en dikker.',
    simCols: ['Dart', 'Gewicht · lengte · dikte · tungsten', 'Prijsklasse'],
    simIntro: 'De dichtstbijzijnde darts van andere modellen in de DartFit-catalogus, met tussen haakjes het verschil met de {model}:',
    guidePrice: 'richtprijs',
    cta: 'Past de dart van {name} bij jouw hand? Meet je hand naast een pasje en zie het in ongeveer een minuut, gratis.',
  },
  de: {
    titles: ['{name} Darts: Specs, Grip und Alternativen', '{name} Darts: Specs und Alternativen', '{name} Darts: Specs'],
    descriptions: [
      'Mit welchen Darts wirft {name}? Der {model}: {w} g, {L} mm, {shape} Barrel, {t}% Wolfram, verglichen mit {n} Darts. Passt er zu deiner Hand?',
      '{name} wirft den {model}: {w} g, {L} mm, {t}% Wolfram, verglichen mit {n} Darts, plus die nächsten Alternativen.',
      '{name} wirft den {model}: {w} g, {L} mm, {t}% Wolfram. Daten und ähnliche Darts.',
    ],
    benchH2: 'Wie schneidet der Dart von {name} im Vergleich ab?',
    benchLead:
      'Mit {w} g ist der {model} schwerer als {bw}% der {n} Steeldarts im DartFit-Katalog (Median {mw} g) und mit {L} mm länger als {bl}% (Median {ml} mm).',
    benchCols: ['', 'Dieser Dart', 'Median im Katalog', 'Darts darunter'],
    ratio: 'Länge ÷ Dicke',
    ratioNote: 'Je höher Länge ÷ Dicke, desto länger und schlanker der Barrel; je niedriger, desto kürzer und dicker.',
    simCols: ['Dart', 'Gewicht · Länge · Dicke · Wolfram', 'Preisklasse'],
    simIntro: 'Die nächsten Darts anderer Modelle im DartFit-Katalog, in Klammern der Unterschied zum {model}:',
    guidePrice: 'Richtpreis',
    cta: 'Passt der Dart von {name} zu deiner Hand? Miss sie neben einer Bankkarte und sieh es in etwa einer Minute, kostenlos.',
  },
};

/** The guide that explains each spec, linked from the spec table's row labels. */
const SPEC_GUIDE: Record<string, PageKey> = {
  weight: 'weight',
  length: 'size',
  diameter: 'size',
  shape: 'shapes',
  tungsten: 'tungsten',
  grip: 'grip',
  balance: 'shapes',
};
const guidePath = (lang: Lang, key: PageKey) => pathOf(lang, siteOf(lang).pages.find((p) => p.key === key)!.slug);

const median = (a: number[]) => {
  const s = [...a].sort((x, y) => x - y);
  const m = s.length >> 1;
  return s.length % 2 ? s[m]! : (s[m - 1]! + s[m]!) / 2;
};
const below = (a: number[], x: number) => Math.round((100 * a.filter((y) => y < x).length) / a.length);
/** "+0.5", "−1.2", "±0" in the page's number format. */
const delta = (lang: Lang, d: number, digits = 1) => {
  const r = Number(d.toFixed(digits));
  return r === 0 ? '±0' : `${r > 0 ? '+' : '−'}${num(lang, Math.abs(r), digits)}`;
};
/** Shape as a table value (the copy's `shapes` are adjectives for running text). */
const SHAPE_NAME: Record<Lang, Record<string, string>> = {
  en: { straight: 'Straight', torpedo: 'Torpedo', tapered: 'Tapered', bomb: 'Bomb', scalloped: 'Scalloped' },
  nl: { straight: 'Recht', torpedo: 'Torpedo', tapered: 'Taps', bomb: 'Bomb', scalloped: 'Scalloped' },
  de: { straight: 'Gerade', torpedo: 'Torpedo', tapered: 'Konisch', bomb: 'Bomb', scalloped: 'Scalloped' },
};
const SHORT_TITLE: Record<Lang, string> = {
  en: '{name} darts: weight and specs',
  nl: 'Darts van {name}: gewicht en specs',
  de: 'Darts von {name}: Gewicht und Daten',
};

/** The three closest catalogue darts of another model (weight, length, thickness, shape). */
function similar(v: VariantRowLite, all: VariantRowLite[]): VariantRowLite[] {
  const seen = new Set([v.modelId]);
  return all
    .filter((x) => x.modelId !== v.modelId)
    .map((x) => ({
      x,
      d:
        Math.abs(x.weight - v.weight) +
        Math.abs(x.length - v.length) / 3 +
        Math.abs(x.diameter - v.diameter) / 0.3 +
        (x.shape === v.shape ? 0 : 1),
    }))
    .sort((a, b) => a.d - b.d)
    .map((a) => a.x)
    .filter((x) => (seen.has(x.modelId) ? false : (seen.add(x.modelId), true)))
    .slice(0, 3);
}

function langLinks(site: Site, alternates: Array<{ lang: Lang; path: string }>): string {
  return alternates
    .map((a) =>
      a.lang === site.lang
        ? `<span aria-current="page">${a.lang.toUpperCase()}</span>`
        : `<a href="${a.path}" hreflang="${a.lang}" lang="${a.lang}">${a.lang.toUpperCase()}</a>`,
    )
    .join('');
}

export function renderProPage(
  site: Site,
  pro: ProRowLite,
  cat: CatalogueRows,
  base: string,
  facts?: EngineFacts,
): string {
  const lang = site.lang;
  const c = PRO_COPY[lang];
  const v = cat.variants.find((x) => x.id === pro.variantId)!;
  const V = vars(lang, pro, v);
  const f = (x: string) => tpl(x, V, lang);
  const path = proPaths.pro(lang, pro);
  const url = base + path;
  const alternates = LANGS.map((l) => ({ lang: l, path: proPaths.pro(l, pro) }));
  const answer = [
    f(pro.exactDart ? c.answerExact : c.answerSignature),
    pro.playingWeightG && pro.playingWeightG !== v.weight ? f(c.answerPlaying) : '',
    f(c.answerFit),
  ]
    .filter(Boolean)
    .join(' ');
  const X = EXTRA[lang];
  const rows: Array<[keyof typeof SPEC_GUIDE, string, string]> = [
    ['weight', c.specs.weight, `${V.w} g`],
    ['length', c.specs.length, `${V.L} mm`],
    ['diameter', c.specs.diameter, `${V.D} mm`],
    ...(v.shape ? [['shape', c.specs.shape, SHAPE_NAME[lang][v.shape] ?? v.shape] as [string, string, string]] : []),
    ['tungsten', c.specs.tungsten, `${v.tungsten}%`],
    ...(v.grip ? [['grip', c.specs.grip, String(v.grip)] as [string, string, string]] : []),
    ...(v.balance
      ? [['balance', c.specs.balance, c.balance[v.balance as keyof typeof c.balance]] as [string, string, string]]
      : []),
  ];
  // Against the whole steel-tip catalogue: unique numbers per pro, computed at build time.
  const all = cat.variants;
  const ws = all.map((x) => x.weight);
  const ls = all.map((x) => x.length);
  const ds = all.map((x) => x.diameter);
  const rs = all.map((x) => x.length / x.diameter);
  const ts = all.map((x) => x.tungsten);
  const ratio = v.length / v.diameter;
  const BV = {
    ...V,
    n: String(all.length),
    bw: String(below(ws, v.weight)),
    mw: num(lang, median(ws)),
    bl: String(below(ls, v.length)),
    ml: num(lang, median(ls)),
  };
  const bench: Array<[string, string, string, string]> = [
    [c.specs.weight, `${V.w} g`, `${num(lang, median(ws))} g`, `${below(ws, v.weight)}%`],
    [c.specs.length, `${V.L} mm`, `${num(lang, median(ls))} mm`, `${below(ls, v.length)}%`],
    [c.specs.diameter, `${V.D} mm`, `${num(lang, median(ds), 2)} mm`, `${below(ds, v.diameter)}%`],
    [X.ratio, num(lang, ratio, 1), num(lang, median(rs), 1), `${below(rs, ratio)}%`],
    [c.specs.tungsten, `${v.tungsten}%`, `${num(lang, median(ts), 0)}%`, `${below(ts, v.tungsten)}%`],
  ];
  const suits = [
    v.shape ? c.suits.hold[v.shape as keyof typeof c.suits.hold] : '',
    f(v.length <= 46 ? c.suits.fingers.short : v.length <= 50 ? c.suits.fingers.mid : c.suits.fingers.long),
    f(v.diameter <= 6.5 ? c.suits.thick.slim : v.diameter >= 7.2 ? c.suits.thick.chunky : c.suits.thick.mid),
  ].filter(Boolean);
  const sim = similar(v, cat.variants);
  const others = cat.pros
    .filter((p) => p.id !== pro.id)
    .map(
      (p) =>
        `<li><a href="${proPaths.pro(lang, p)}">${cat.photos[p.id] ? `<img src="${cat.photos[p.id]!.file}" alt="" width="96" height="96" loading="lazy">` : ''}${esc(p.name)}</a></li>`,
    )
    .join('');
  const title = firstFit([...X.titles, SHORT_TITLE[lang]].map((t) => tpl(t, V, lang)), 58);
  const description = firstFit(X.descriptions.map((t) => tpl(t, BV, lang)), 152);
  const crumbs = `<nav class="crumbs" aria-label="Breadcrumb"><a href="${pathOf(lang, '')}">DartFit</a> › <a href="${proPaths.index(lang)}">${esc(tpl(c.index.h1, {}, lang))}</a> › <span aria-current="page">${esc(pro.name)}</span></nav>`;
  const price = (id: string) => {
    const pr = facts?.prices[id];
    return pr ? `${PRICE_CLASS[lang][pr.tier]} · ≈ €${pr.eur} ${X.guidePrice}` : '–';
  };
  const faq = c.faq.map(([q, a]) => [f(q), f(a)] as const);
  const photo = cat.photos[pro.id];
  const figure = photo
    ? `<figure class="pro-photo"><img src="${photo.file}" alt="${esc(pro.name)}" width="480" height="600" fetchpriority="high"><figcaption>${photoCreditHtml(photo, lang)}</figcaption></figure>\n`
    : '';
  const inner = `<article>
<h1>${esc(f(c.h1))}</h1>
${figure}<p class="answer">${esc(answer)}</p>
${cta(site, f(X.cta))}
<section><h2 id="specs">${esc(f(c.specsH2))}</h2>
<div class="table"><table><tbody>${rows.map(([key, k, x]) => `<tr><th scope="row"><a href="${guidePath(lang, SPEC_GUIDE[key]!)}">${esc(k)}</a></th><td>${esc(x)}</td></tr>`).join('')}</tbody></table></div></section>
<section><h2 id="compare">${esc(f(X.benchH2))}</h2><p>${esc(tpl(X.benchLead, BV, lang))}</p>
<div class="table"><table><thead><tr>${X.benchCols.map((h) => `<th scope="col">${esc(h)}</th>`).join('')}</tr></thead><tbody>${bench
  .map(([k, a, m, b]) => `<tr><th scope="row">${esc(k)}</th><td>${esc(a)}</td><td>${esc(m)}</td><td>${esc(b)}</td></tr>`)
  .join('')}</tbody></table></div><p class="bench-note">${esc(X.ratioNote)}</p></section>
<section><h2>${esc(f(c.suitsH2))}</h2><ul>${suits.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></section>
${
  sim.length
    ? `<section><h2 id="similar">${esc(f(c.similarH2))}</h2><p>${esc(f(X.simIntro))}</p><div class="table"><table><thead><tr>${X.simCols
        .map((h) => `<th scope="col">${esc(h)}</th>`)
        .join('')}</tr></thead><tbody>${sim
        .map(
          (x) =>
            `<tr><th scope="row">${esc(`${x.brand} ${x.model}`)}</th><td><span class="nw">${num(lang, x.weight)} g (${delta(lang, x.weight - v.weight)})</span> · <span class="nw">${num(lang, x.length)} mm (${delta(lang, x.length - v.length)})</span> · <span class="nw">${num(lang, x.diameter, 2)} mm (${delta(lang, x.diameter - v.diameter, 2)})</span> · <span class="nw">${x.tungsten}%</span></td><td>${esc(price(x.id))}</td></tr>`,
        )
        .join('')}</tbody></table></div></section>`
    : ''
}
<section><h2>${esc(f(c.fitH2))}</h2><p>${esc(f(c.fitP))}</p></section>
<section class="faq"><h2 id="faq">${esc(site.ui.faq)}</h2>
${faq.map(([q, a]) => `<h3>${esc(q)}</h3>\n<p>${esc(a)}</p>`).join('\n')}
</section>
<p class="updated">${esc(site.ui.updated)}: <time datetime="${UPDATED}">${new Date(UPDATED).toLocaleDateString(locOf(lang), { day: 'numeric', month: 'long', year: 'numeric' })}</time> · DartFit</p>
</article>
${cta(site, f(X.cta))}
<nav class="related" aria-label="${esc(tpl(c.index.h1, {}, lang))}"><h2>${esc(tpl(c.index.h1, {}, lang))}</h2><ul class="pros">${others}</ul></nav>`;
  const jsonld = [
    {
      '@context': 'https://schema.org',
      '@graph': [
        org(base),
        website(base),
        app(base, site),
        {
          '@type': 'Article',
          '@id': `${url}#article`,
          headline: f(c.h1),
          description,
          inLanguage: lang,
          datePublished: UPDATED,
          dateModified: UPDATED,
          mainEntityOfPage: url,
          author: { '@id': `${base}/#org` },
          publisher: { '@id': `${base}/#org` },
          about: [
            { '@type': 'Person', name: pro.name, jobTitle: 'Professional darts player' },
            // A Thing, not a Product: this page sells nothing and shows no live price, and Google
            // flags a Product without offers, review or rating as invalid.
            {
              '@type': 'Thing',
              name: V.model,
              description: `${v.brand} steel-tip dart: ${v.weight} g, ${v.length} mm barrel, ${v.diameter} mm, ${v.tungsten}% tungsten${v.shape ? `, ${v.shape} barrel` : ''}.`,
            },
          ],
        },
        ...(sim.length
          ? [
              {
                '@type': 'ItemList',
                '@id': `${url}#similar`,
                name: f(c.similarH2),
                itemListOrder: 'https://schema.org/ItemListOrderAscending',
                numberOfItems: sim.length,
                itemListElement: sim.map((x, i) => ({
                  '@type': 'ListItem',
                  position: i + 1,
                  name: `${x.brand} ${x.model}`,
                  description: `${x.weight} g, ${x.length} mm, ${x.diameter} mm, ${x.tungsten}% tungsten`,
                })),
              },
            ]
          : []),
        {
          '@type': 'FAQPage',
          '@id': `${url}#faq`,
          inLanguage: lang,
          mainEntity: faq.map(([q, a]) => ({
            '@type': 'Question',
            name: q,
            acceptedAnswer: { '@type': 'Answer', text: a },
          })),
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'DartFit', item: base + pathOf(lang, '') },
            {
              '@type': 'ListItem',
              position: 2,
              name: tpl(c.index.h1, {}, lang),
              item: base + proPaths.index(lang),
            },
            { '@type': 'ListItem', position: 3, name: pro.name, item: url },
          ],
        },
      ],
    },
  ];
  return (
    head({
      site,
      title,
      description,
      path,
      alternates,
      base,
      jsonld,
      image: photo ? { url: base + photo.file, width: 480, height: 600 } : undefined,
    }) + chrome(site, inner, langLinks(site, alternates), crumbs)
  );
}

function indexVars(cat: CatalogueRows, lang: Lang): Record<string, string> {
  const ws = cat.pros.map((p) => cat.variants.find((v) => v.id === p.variantId)!.weight);
  return { n: String(cat.pros.length), minW: num(lang, Math.min(...ws)), maxW: num(lang, Math.max(...ws)) };
}

const CREDITS_H2 = { nl: 'Foto’s', en: 'Photos', de: 'Fotos' };
const CREDITS_P = {
  nl: 'De foto’s komen van Wikimedia Commons en staan hier onder hun Creative Commons-licentie, bijgesneden.',
  en: 'The photos come from Wikimedia Commons and are used under their Creative Commons licence, cropped.',
  de: 'Die Fotos stammen von Wikimedia Commons und stehen unter ihrer Creative-Commons-Lizenz, zugeschnitten.',
};

export function renderProIndex(site: Site, cat: CatalogueRows, base: string): string {
  const lang = site.lang;
  const c = PRO_COPY[lang];
  const IV = indexVars(cat, lang);
  const f = (x: string) => tpl(x, IV, lang);
  const path = proPaths.index(lang);
  const alternates = LANGS.map((l) => ({ lang: l, path: proPaths.index(l) }));
  const rows = [...cat.pros]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((p) => {
      const v = cat.variants.find((x) => x.id === p.variantId)!;
      const ph = cat.photos[p.id];
      return `<tr><th scope="row"><a class="pro-row" href="${proPaths.pro(lang, p)}">${ph ? `<img src="${ph.file}" alt="" width="96" height="96" loading="lazy">` : ''}${esc(p.name)}</a></th><td>${esc(`${v.brand} ${v.model}`)}</td><td>${num(lang, v.weight)} g</td></tr>`;
    })
    .join('');
  const crumbs = `<nav class="crumbs" aria-label="Breadcrumb"><a href="${pathOf(lang, '')}">DartFit</a> › <span aria-current="page">${esc(f(c.index.h1))}</span></nav>`;
  const inner = `<h1>${esc(f(c.index.h1))}</h1>
<p class="answer">${esc(f(c.index.answer))}</p>
${cta(site)}
<div class="table"><table><thead><tr>${c.index.col.map((x) => `<th scope="col">${esc(x)}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table></div>
<section class="credits"><h2>${esc(CREDITS_H2[lang])}</h2><p>${esc(CREDITS_P[lang])}</p><ul>${[...cat.pros]
    .sort((a, b) => a.name.localeCompare(b.name))
    .filter((p) => cat.photos[p.id])
    .map((p) => `<li>${esc(p.name)}: ${photoCreditHtml(cat.photos[p.id]!, lang)}</li>`)
    .join('')}</ul></section>`;
  const jsonld = [
    {
      '@context': 'https://schema.org',
      '@graph': [
        org(base),
        website(base),
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'DartFit', item: base + pathOf(lang, '') },
            { '@type': 'ListItem', position: 2, name: f(c.index.h1), item: base + path },
          ],
        },
        {
          '@type': 'CollectionPage',
          '@id': `${base}${path}#page`,
          name: f(c.index.title),
          description: f(c.index.description),
          inLanguage: lang,
          dateModified: UPDATED,
          hasPart: cat.pros.map((p) => ({
            '@type': 'Article',
            headline: tpl(c.h1, { name: p.name }, lang),
            url: base + proPaths.pro(lang, p),
          })),
        },
      ],
    },
  ];
  return (
    head({
      site,
      title: f(c.index.title),
      description: clip(f(c.index.description)),
      path,
      alternates,
      base,
      jsonld,
    }) + chrome(site, inner, langLinks(site, alternates), crumbs)
  );
}

/** The hub's link to the pro index. */
export function proHubItem(site: Site): string {
  const c = PRO_COPY[site.lang];
  const desc = c.index.description.replace(/\{n\}/g, '').replace(/\s+/g, ' ');
  return `<li><a href="${proPaths.index(site.lang)}"><b>${esc(c.index.h1)}</b><span>${esc(desc)}</span></a></li>`;
}
