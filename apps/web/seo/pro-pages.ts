/**
 * Pro pages: "Which darts does Luke Littler throw?" for every player in pros.json, in every
 * language, from the catalogue's own specs. A pro's catalogue dart is his signature model unless
 * pros.json marks it as the exact dart he throws; a reported playing weight is quoted with its source.
 */
import type { Lang, Site } from './types';
import { PRO_COPY } from './pros';
import { LANGS, UPDATED, app, chrome, cta, esc, head, org, pathOf } from './render';

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
export interface CatalogueRows {
  variants: VariantRowLite[];
  pros: ProRowLite[];
}

/** Steel-tip rows from variants.csv (no quoted fields in it). */
export function catalogueRows(variantsCsv: string, prosJson: string): CatalogueRows {
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
  return { variants, pros };
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
const clip = (s: string, max = 160) => (s.length <= max ? s : `${s.slice(0, s.lastIndexOf(' ', max - 1))}…`);
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

export function renderProPage(site: Site, pro: ProRowLite, cat: CatalogueRows, base: string): string {
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
  const rows: Array<[string, string]> = [
    [c.specs.weight, `${V.w} g`],
    [c.specs.length, `${V.L} mm`],
    [c.specs.diameter, `${V.D} mm`],
    ...(v.shape ? [[c.specs.shape, SHAPE_NAME[lang][v.shape] ?? v.shape] as [string, string]] : []),
    [c.specs.tungsten, `${v.tungsten}%`],
    ...(v.grip ? [[c.specs.grip, String(v.grip)] as [string, string]] : []),
    ...(v.balance
      ? [[c.specs.balance, c.balance[v.balance as keyof typeof c.balance]] as [string, string]]
      : []),
  ];
  const suits = [
    v.shape ? c.suits.hold[v.shape as keyof typeof c.suits.hold] : '',
    f(v.length <= 46 ? c.suits.fingers.short : v.length <= 50 ? c.suits.fingers.mid : c.suits.fingers.long),
    f(v.diameter <= 6.5 ? c.suits.thick.slim : v.diameter >= 7.2 ? c.suits.thick.chunky : c.suits.thick.mid),
  ].filter(Boolean);
  const sim = similar(v, cat.variants);
  const others = cat.pros
    .filter((p) => p.id !== pro.id)
    .map((p) => `<li><a href="${proPaths.pro(lang, p)}">${esc(p.name)}</a></li>`)
    .join('');
  const title = f(c.title).length <= 65 ? f(c.title) : f(SHORT_TITLE[lang]);
  const description = clip(f(c.description));
  const crumbs = `<nav class="crumbs" aria-label="Breadcrumb"><a href="/">DartFit</a> › <a href="${pathOf(lang, '')}">${esc(site.ui.guides)}</a> › <a href="${proPaths.index(lang)}">${esc(tpl(c.index.h1, {}, lang))}</a></nav>`;
  const faq = c.faq.map(([q, a]) => [f(q), f(a)] as const);
  const inner = `<article>
<h1>${esc(f(c.h1))}</h1>
<p class="answer">${esc(answer)}</p>
${cta(site)}
<section><h2>${esc(f(c.specsH2))}</h2>
<div class="table"><table><tbody>${rows.map(([k, x]) => `<tr><th scope="row">${esc(k)}</th><td>${esc(x)}</td></tr>`).join('')}</tbody></table></div></section>
<section><h2>${esc(f(c.suitsH2))}</h2><ul>${suits.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></section>
${
  sim.length
    ? `<section><h2>${esc(f(c.similarH2))}</h2><p>${esc(c.similarIntro)}</p><ul>${sim
        .map(
          (x) =>
            `<li>${esc(`${x.brand} ${x.model}`)}: ${num(lang, x.weight)} g, ${num(lang, x.length)} mm, ${num(lang, x.diameter)} mm</li>`,
        )
        .join('')}</ul></section>`
    : ''
}
<section><h2>${esc(f(c.fitH2))}</h2><p>${esc(f(c.fitP))}</p></section>
<section class="faq"><h2 id="faq">${esc(site.ui.faq)}</h2>
${faq.map(([q, a]) => `<h3>${esc(q)}</h3>\n<p>${esc(a)}</p>`).join('\n')}
</section>
<p class="updated">${esc(site.ui.updated)}: <time datetime="${UPDATED}">${new Date(UPDATED).toLocaleDateString(locOf(lang), { day: 'numeric', month: 'long', year: 'numeric' })}</time> · DartFit</p>
</article>
${cta(site)}
<nav class="related" aria-label="${esc(tpl(c.index.h1, {}, lang))}"><h2>${esc(tpl(c.index.h1, {}, lang))}</h2><ul class="pros">${others}</ul></nav>`;
  const jsonld = [
    {
      '@context': 'https://schema.org',
      '@graph': [
        org(base),
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
            {
              '@type': 'Product',
              name: V.model,
              brand: { '@type': 'Brand', name: v.brand },
              category: 'Steel-tip darts',
              weight: { '@type': 'QuantitativeValue', value: v.weight, unitCode: 'GRM' },
              additionalProperty: [
                { '@type': 'PropertyValue', name: 'Barrel length', value: v.length, unitCode: 'MMT' },
                { '@type': 'PropertyValue', name: 'Diameter', value: v.diameter, unitCode: 'MMT' },
                { '@type': 'PropertyValue', name: 'Tungsten', value: `${v.tungsten}%` },
              ],
            },
          ],
        },
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
            { '@type': 'ListItem', position: 1, name: 'DartFit', item: `${base}/` },
            { '@type': 'ListItem', position: 2, name: site.ui.guides, item: base + pathOf(lang, '') },
            {
              '@type': 'ListItem',
              position: 3,
              name: tpl(c.index.h1, {}, lang),
              item: base + proPaths.index(lang),
            },
            { '@type': 'ListItem', position: 4, name: pro.name, item: url },
          ],
        },
      ],
    },
  ];
  return (
    head({ site, title, description, path, alternates, base, jsonld }) +
    chrome(site, inner, langLinks(site, alternates), crumbs)
  );
}

function indexVars(cat: CatalogueRows, lang: Lang): Record<string, string> {
  const ws = cat.pros.map((p) => cat.variants.find((v) => v.id === p.variantId)!.weight);
  return { n: String(cat.pros.length), minW: num(lang, Math.min(...ws)), maxW: num(lang, Math.max(...ws)) };
}

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
      return `<tr><th scope="row"><a href="${proPaths.pro(lang, p)}">${esc(p.name)}</a></th><td>${esc(`${v.brand} ${v.model}`)}</td><td>${num(lang, v.weight)} g</td></tr>`;
    })
    .join('');
  const crumbs = `<nav class="crumbs" aria-label="Breadcrumb"><a href="/">DartFit</a> › <a href="${pathOf(lang, '')}">${esc(site.ui.guides)}</a></nav>`;
  const inner = `<h1>${esc(f(c.index.h1))}</h1>
<p class="answer">${esc(f(c.index.answer))}</p>
${cta(site)}
<div class="table"><table><thead><tr>${c.index.col.map((x) => `<th scope="col">${esc(x)}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table></div>`;
  const jsonld = [
    {
      '@context': 'https://schema.org',
      '@graph': [
        org(base),
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
