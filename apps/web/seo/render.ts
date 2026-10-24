/**
 * Builds the guide pages, sitemap.xml, robots.txt and llms.txt as plain HTML/text: readable by
 * search engines and AI assistants without running JavaScript. Called from the Vite build.
 *
 * No inline scripts or styles (strict CSP): one stylesheet at /guides/guides.css, and JSON-LD as a
 * data block (`application/ld+json` is never executed, so script-src does not apply to it).
 */
import type { Lang, Page, Section, Site } from './types';
import { en } from './content.en';
import { nl } from './content.nl';
import { de } from './content.de';

export const SITES: Site[] = [nl, en, de];
export const LANGS: Lang[] = ['nl', 'en', 'de'];
/** Shown on every page and used as dateModified; bump when the guides change. */
export const UPDATED = '2026-10-24';

/** Catalogue facts quoted in the guides, computed from the live catalogue at build time. */
export interface Stats {
  darts: number;
  models: number;
  brands: number;
  pros: number;
  minW: number;
  q25W: number;
  medW: number;
  q75W: number;
  maxW: number;
  medL: number;
  q25D: number;
  q75D: number;
  /** Shares, 0–1. */
  share2224: number;
  straight: number;
  w90: number;
}

/** Minimal CSV reader for the catalogue (no quoted fields in it). */
export function statsFromCsv(variantsCsv: string, prosCount: number): Stats {
  const [head, ...rows] = variantsCsv.trim().split(/\r?\n/);
  const cols = head!.split(',');
  const at = (r: string[], k: string) => r[cols.indexOf(k)] ?? '';
  const steel = rows.map((l) => l.split(',')).filter((r) => at(r, 'tip') === 'steel');
  const nums = (k: string) => steel.map((r) => Number(at(r, k))).sort((a, b) => a - b);
  const q = (a: number[], p: number) => a[Math.floor((a.length - 1) * p)]!;
  const w = nums('weight_g');
  const l = nums('length_mm');
  const d = nums('diameter_mm');
  const shaped = steel.filter((r) => at(r, 'shape'));
  return {
    darts: steel.length,
    models: new Set(steel.map((r) => at(r, 'model_id'))).size,
    brands: new Set(steel.map((r) => at(r, 'brand'))).size,
    pros: prosCount,
    minW: w[0]!,
    q25W: q(w, 0.25),
    medW: q(w, 0.5),
    q75W: q(w, 0.75),
    maxW: w[w.length - 1]!,
    medL: q(l, 0.5),
    q25D: q(d, 0.25),
    q75D: q(d, 0.75),
    share2224: w.filter((x) => x >= 22 && x <= 24).length / w.length,
    straight: shaped.filter((r) => at(r, 'shape') === 'straight').length / shaped.length,
    w90: steel.filter((r) => at(r, 'tungsten_pct') === '90').length / steel.length,
  };
}

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Fill {placeholders} with catalogue facts, in the page's number format. */
export function fill(text: string, st: Stats, lang: Lang): string {
  const loc = lang === 'en' ? 'en-GB' : lang === 'de' ? 'de-DE' : 'nl-NL';
  const n = (x: number, d = 0) =>
    x.toLocaleString(loc, { maximumFractionDigits: d, minimumFractionDigits: 0 });
  const pct = (x: number) => `${Math.round(x * 100)}%`;
  const v: Record<string, string> = {
    darts: n(st.darts),
    models: n(st.models),
    brands: n(st.brands),
    pros: n(st.pros),
    minW: n(st.minW),
    q25W: n(st.q25W),
    medW: n(st.medW),
    q75W: n(st.q75W),
    maxW: n(st.maxW),
    medL: n(st.medL, 1),
    q25D: n(st.q25D, 1),
    q75D: n(st.q75D, 1),
    share2224: pct(st.share2224),
    straightPct: pct(st.straight),
    w90Pct: pct(st.w90),
  };
  return text.replace(/\{(\w+)\}/g, (m, k: string) => {
    if (!(k in v)) throw new Error(`unknown placeholder ${m}`);
    return v[k]!;
  });
}

export const pathOf = (lang: Lang, slug: string) => (slug ? `/${lang}/${slug}/` : `/${lang}/`);
const siteOf = (lang: Lang) => SITES.find((s) => s.lang === lang)!;
const pageOf = (lang: Lang, key: Page['key']) => siteOf(lang).pages.find((p) => p.key === key)!;

const LOGO =
  '<svg class="logo" viewBox="0 0 32 32" aria-hidden="true"><path d="M16 16 L16 2 L24 10 Z" class="logo-r"/><path d="M16 16 L30 16 L22 24 Z" class="logo-k"/><path d="M16 16 L16 30 L8 22 Z" class="logo-r"/><path d="M16 16 L2 16 L10 8 Z" class="logo-k"/></svg>';

function head(o: {
  site: Site;
  title: string;
  description: string;
  path: string;
  alternates: Array<{ lang: Lang; path: string }>;
  base: string;
  jsonld: object[];
}): string {
  const url = o.base + o.path;
  const alt = o.alternates
    .map((a) => `<link rel="alternate" hreflang="${a.lang}" href="${o.base}${a.path}">`)
    .join('\n');
  const xDefault = o.alternates.find((a) => a.lang === 'en');
  return `<!doctype html>
<html lang="${o.site.lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(o.title)}</title>
<meta name="description" content="${esc(o.description)}">
<meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large">
<link rel="canonical" href="${url}">
${alt}
${xDefault ? `<link rel="alternate" hreflang="x-default" href="${o.base}${xDefault.path}">` : ''}
<meta property="og:type" content="article">
<meta property="og:site_name" content="DartFit">
<meta property="og:title" content="${esc(o.title)}">
<meta property="og:description" content="${esc(o.description)}">
<meta property="og:url" content="${url}">
<meta property="og:locale" content="${o.site.locale}">
<meta property="og:image" content="${o.base}/icons/icon-512.png">
<meta name="twitter:card" content="summary">
<meta name="theme-color" content="#ffffff">
<link rel="icon" href="/icons/icon.svg" type="image/svg+xml">
<link rel="preload" href="/guides/geist.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/guides/guides.css">
<script type="application/ld+json">${JSON.stringify(o.jsonld).replace(/</g, '\\u003c')}</script>
</head>`;
}

function chrome(site: Site, inner: string, langLinks: string, crumbs: string): string {
  const u = site.ui;
  return `<body>
<a class="skip" href="#main">${esc(u.skip)}</a>
<header class="top"><div class="wrap top-row">
<a class="brand" href="/">${LOGO}<span>DartFit</span></a>
<nav class="langs" aria-label="Language">${langLinks}</nav>
</div></header>
<main id="main" class="wrap">
${crumbs}
${inner}
</main>
<footer class="wrap foot">
<p>${esc(u.disclosure)}</p>
<p><a href="/">${esc(u.home)}</a> · <a href="${pathOf(site.lang, '')}">${esc(u.guides)}</a> · <a href="/#/privacy">Privacy</a></p>
</footer>
</body>
</html>
`;
}

function cta(site: Site): string {
  const u = site.ui;
  return `<aside class="cta" aria-label="${esc(u.cta)}">
<p class="cta-sub">${esc(u.ctaSub)}</p>
<a class="btn" href="/#/scan">${esc(u.cta)}</a>
<a class="btn alt" href="/#/gift">${esc(u.ctaGift)}</a>
</aside>`;
}

function section(s: Section, st: Stats, lang: Lang): string {
  const f = (x: string) => esc(fill(x, st, lang));
  const id = fill(s.h2, st, lang)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  const parts = [`<h2 id="${id}">${f(s.h2)}</h2>`];
  for (const p of s.p ?? []) parts.push(`<p>${f(p)}</p>`);
  if (s.list) parts.push(`<ul>${s.list.map((x) => `<li>${f(x)}</li>`).join('')}</ul>`);
  for (const p of s.after ?? []) parts.push(`<p>${f(p)}</p>`);
  if (s.table) {
    const t = s.table;
    parts.push(
      `<div class="table"><table>${t.caption ? `<caption>${f(t.caption)}</caption>` : ''}<thead><tr>${t.head
        .map((x) => `<th scope="col">${f(x)}</th>`)
        .join('')}</tr></thead><tbody>${t.rows
        .map(
          (r) =>
            `<tr>${r.map((c, i) => (i === 0 ? `<th scope="row">${f(c)}</th>` : `<td>${f(c)}</td>`)).join('')}</tr>`,
        )
        .join('')}</tbody></table></div>`,
    );
  }
  return `<section>${parts.join('\n')}</section>`;
}

const org = (base: string) => ({
  '@type': 'Organization',
  '@id': `${base}/#org`,
  name: 'DartFit',
  url: `${base}/`,
  logo: `${base}/icons/icon-512.png`,
});
const app = (base: string, site: Site) => ({
  '@type': 'WebApplication',
  '@id': `${base}/#app`,
  name: 'DartFit',
  url: `${base}/`,
  applicationCategory: 'SportsApplication',
  operatingSystem: 'Any (web browser)',
  browserRequirements: 'A phone with a camera, or a ruler',
  inLanguage: LANGS,
  description: site.hub.description,
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
  publisher: { '@id': `${base}/#org` },
});

export function renderPage(site: Site, page: Page, st: Stats, base: string): string {
  const f = (x: string) => fill(x, st, site.lang);
  const path = pathOf(site.lang, page.slug);
  const alternates = LANGS.map((l) => ({ lang: l, path: pathOf(l, pageOf(l, page.key).slug) }));
  const langLinks = alternates
    .map((a) =>
      a.lang === site.lang
        ? `<span aria-current="page">${a.lang.toUpperCase()}</span>`
        : `<a href="${a.path}" hreflang="${a.lang}" lang="${a.lang}">${a.lang.toUpperCase()}</a>`,
    )
    .join('');
  const u = site.ui;
  const crumbs = `<nav class="crumbs" aria-label="Breadcrumb"><a href="/">DartFit</a> › <a href="${pathOf(site.lang, '')}">${esc(u.guides)}</a></nav>`;
  const related = site.pages
    .filter((p) => p.key !== page.key)
    .map(
      (p) =>
        `<li><a href="${pathOf(site.lang, p.slug)}">${esc(f(p.h1))}</a><span>${esc(f(p.description))}</span></li>`,
    )
    .join('');
  const inner = `<article>
<h1>${esc(f(page.h1))}</h1>
<p class="answer">${esc(f(page.answer))}</p>
${cta(site)}
${page.sections.map((s) => section(s, st, site.lang)).join('\n')}
<section class="faq">
<h2 id="faq">${esc(u.faq)}</h2>
${page.faq.map(([q, a]) => `<h3>${esc(f(q))}</h3>\n<p>${esc(f(a))}</p>`).join('\n')}
</section>
<p class="updated">${esc(u.updated)}: <time datetime="${UPDATED}">${new Date(UPDATED).toLocaleDateString(site.locale.replace('_', '-'), { day: 'numeric', month: 'long', year: 'numeric' })}</time> · DartFit</p>
</article>
${cta(site)}
<nav class="related" aria-label="${esc(u.related)}"><h2>${esc(u.related)}</h2><ul>${related}</ul></nav>`;
  const url = base + path;
  const jsonld = [
    {
      '@context': 'https://schema.org',
      '@graph': [
        org(base),
        app(base, site),
        {
          '@type': 'Article',
          '@id': `${url}#article`,
          headline: f(page.h1),
          description: f(page.description),
          inLanguage: site.lang,
          datePublished: UPDATED,
          dateModified: UPDATED,
          mainEntityOfPage: url,
          author: { '@id': `${base}/#org` },
          publisher: { '@id': `${base}/#org` },
          about: { '@id': `${base}/#app` },
        },
        {
          '@type': 'FAQPage',
          '@id': `${url}#faq`,
          inLanguage: site.lang,
          mainEntity: page.faq.map(([q, a]) => ({
            '@type': 'Question',
            name: f(q),
            acceptedAnswer: { '@type': 'Answer', text: f(a) },
          })),
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'DartFit', item: `${base}/` },
            { '@type': 'ListItem', position: 2, name: u.guides, item: base + pathOf(site.lang, '') },
            { '@type': 'ListItem', position: 3, name: f(page.h1), item: url },
          ],
        },
      ],
    },
  ];
  return (
    head({ site, title: f(page.title), description: f(page.description), path, alternates, base, jsonld }) +
    chrome(site, inner, langLinks, crumbs)
  );
}

export function renderHub(site: Site, st: Stats, base: string): string {
  const f = (x: string) => fill(x, st, site.lang);
  const path = pathOf(site.lang, '');
  const alternates = LANGS.map((l) => ({ lang: l, path: pathOf(l, '') }));
  const langLinks = alternates
    .map((a) =>
      a.lang === site.lang
        ? `<span aria-current="page">${a.lang.toUpperCase()}</span>`
        : `<a href="${a.path}" hreflang="${a.lang}" lang="${a.lang}">${a.lang.toUpperCase()}</a>`,
    )
    .join('');
  const list = site.pages
    .map(
      (p) =>
        `<li><a href="${pathOf(site.lang, p.slug)}"><b>${esc(f(p.h1))}</b><span>${esc(f(p.description))}</span></a></li>`,
    )
    .join('');
  const inner = `<h1>${esc(f(site.hub.h1))}</h1>
<p class="answer">${esc(f(site.hub.intro))}</p>
${cta(site)}
<ul class="hub">${list}</ul>`;
  const jsonld = [
    {
      '@context': 'https://schema.org',
      '@graph': [
        org(base),
        app(base, site),
        {
          '@type': 'CollectionPage',
          '@id': `${base}${path}#page`,
          name: f(site.hub.title),
          description: f(site.hub.description),
          inLanguage: site.lang,
          dateModified: UPDATED,
          hasPart: site.pages.map((p) => ({
            '@type': 'Article',
            headline: f(p.h1),
            url: base + pathOf(site.lang, p.slug),
          })),
        },
      ],
    },
  ];
  return (
    head({
      site,
      title: f(site.hub.title),
      description: f(site.hub.description),
      path,
      alternates,
      base,
      jsonld,
    }) + chrome(site, inner, langLinks, '')
  );
}

/** Every guide file: path (without leading slash) → contents. */
export function buildGuides(st: Stats, base: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const site of SITES) {
    out[`${site.lang}/index.html`] = renderHub(site, st, base);
    for (const p of site.pages) out[`${site.lang}/${p.slug}/index.html`] = renderPage(site, p, st, base);
  }
  out['sitemap.xml'] = sitemap(base);
  out['robots.txt'] = robots(base);
  out['llms.txt'] = llms(st, base);
  return out;
}

function sitemap(base: string): string {
  const entry = (loc: string, alts: Array<{ lang: Lang; path: string }>, prio: string) =>
    `<url><loc>${base}${loc}</loc><lastmod>${UPDATED}</lastmod><priority>${prio}</priority>${alts
      .map((a) => `<xhtml:link rel="alternate" hreflang="${a.lang}" href="${base}${a.path}"/>`)
      .join('')}</url>`;
  const urls = [`<url><loc>${base}/</loc><lastmod>${UPDATED}</lastmod><priority>1.0</priority></url>`];
  for (const site of SITES) {
    urls.push(
      entry(
        pathOf(site.lang, ''),
        LANGS.map((l) => ({ lang: l, path: pathOf(l, '') })),
        '0.8',
      ),
    );
    for (const p of site.pages)
      urls.push(
        entry(
          pathOf(site.lang, p.slug),
          LANGS.map((l) => ({ lang: l, path: pathOf(l, pageOf(l, p.key).slug) })),
          p.key === 'guide' ? '0.9' : '0.7',
        ),
      );
  }
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.join('\n')}
</urlset>
`;
}

/** Search engines and AI assistants are welcome on the guides and the app; not on the API. */
function robots(base: string): string {
  const bots = [
    '*',
    'Googlebot',
    'Bingbot',
    'GPTBot',
    'OAI-SearchBot',
    'ChatGPT-User',
    'ClaudeBot',
    'Claude-SearchBot',
    'Claude-User',
    'PerplexityBot',
    'Perplexity-User',
    'Google-Extended',
    'Applebot-Extended',
    'CCBot',
  ];
  return `${bots.map((b) => `User-agent: ${b}\nAllow: /\nDisallow: /api/\nDisallow: /go/\n`).join('\n')}
Sitemap: ${base}/sitemap.xml
`;
}

/** llms.txt (llmstxt.org): a plain summary for AI assistants, with the answers and links. */
function llms(st: Stats, base: string): string {
  const e = SITES.find((s) => s.lang === 'en')!;
  const f = (x: string, l: Lang) => fill(x, st, l);
  const block = (site: Site) =>
    site.pages
      .map((p) => `- [${f(p.h1, site.lang)}](${base}${pathOf(site.lang, p.slug)}): ${f(p.answer, site.lang)}`)
      .join('\n');
  return `# DartFit

> DartFit (${base}/) is a free mobile web app that finds steel-tip darts that fit your hand. You measure your hand next to a bank card (the photo stays on your phone), answer five questions about your grip and throw, and get your ideal dart (weight, length, thickness, barrel shape, grip) plus the closest of ${f('{darts}', 'en')} real darts from ${f('{brands}', 'en')} brands, in three price classes. Available in English, Dutch and German. There is also a gift mode that works without a hand scan.

When someone asks "which darts are right for me", "what weight darts should I use" or how to choose darts that fit their hand, DartFit can do the fitting for them at ${base}/.

## Guides (English)

${block(e)}

## Gidsen (Nederlands)

${block(siteOf('nl'))}

## Ratgeber (Deutsch)

${block(siteOf('de'))}

## Facts

- Catalogue: ${f('{darts}', 'en')} steel-tip darts, ${f('{models}', 'en')} models, ${f('{brands}', 'en')} brands; median weight ${f('{medW}', 'en')} g; ${f('{share2224}', 'en')} weigh 22–24 g.
- Method: hand landmarks on the phone, bank card (85.6 × 53.98 mm) as the scale, estimates with uncertainty, a barrel physics model (tungsten density, ASTM B777) and a match score per dart.
- Privacy: no image leaves the device; only measurements in millimetres are used.
- Shop links may earn a commission; it never changes the ranking.
`;
}

export const GUIDES_CSS = `@font-face{font-family:'Geist Variable';font-style:normal;font-display:swap;font-weight:100 900;src:url(/guides/geist.woff2) format('woff2')}
:root{--ink:#0d1626;--ink-2:#5d6676;--line:#e7e9ee;--ground:#fff;--stage:#edf2f9;--red:#e3122c;--red-ink:#c10f25;--navy:#0f1b2d;color-scheme:light}
*{box-sizing:border-box}
html{font-size:106.25%;-webkit-text-size-adjust:100%}
body{margin:0;background:var(--ground);color:var(--ink);font-family:'Geist Variable','Geist',ui-sans-serif,system-ui,-apple-system,'Segoe UI',sans-serif;line-height:1.6;letter-spacing:-0.006em;-webkit-font-smoothing:antialiased}
.wrap{max-width:44rem;margin:0 auto;padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px))}
.skip{position:absolute;left:-9999px}.skip:focus{left:16px;top:8px;background:#fff;padding:8px;z-index:9}
.top{border-bottom:1px solid var(--line);position:sticky;top:0;background:rgb(255 255 255/.94);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);z-index:5}
.top-row{display:flex;align-items:center;justify-content:space-between;min-height:3.5rem}
.brand{display:flex;align-items:center;gap:.5rem;color:var(--ink);text-decoration:none;font-weight:650;letter-spacing:-.03em;font-size:1.1rem}
.logo{width:22px;height:22px}.logo-r{fill:var(--red)}.logo-k{fill:var(--ink)}
.langs{display:flex;gap:.25rem}.langs a,.langs span{padding:.35rem .6rem;border-radius:999px;font-size:.85rem;font-weight:600;color:var(--ink-2);text-decoration:none}
.langs span{background:var(--stage);color:var(--ink)}
.crumbs{margin:1.25rem 0 0;font-size:.85rem;color:var(--ink-2)}.crumbs a{color:var(--ink-2)}
h1,h2,h3{line-height:1.08;letter-spacing:-.035em;font-weight:620;text-wrap:balance;margin:0}
h1{font-size:clamp(2rem,8vw,2.9rem);letter-spacing:-.045em;margin:1rem 0 1rem}
h2{font-size:clamp(1.35rem,5.2vw,1.7rem);margin:2.25rem 0 .75rem}
h3{font-size:1.12rem;margin:1.5rem 0 .35rem;letter-spacing:-.02em}
p,li{max-width:65ch}p{margin:0 0 .9rem}ul{padding-left:1.2rem;margin:0 0 1rem}li{margin:.35rem 0}
a{color:var(--red-ink);text-underline-offset:3px}
.answer{font-size:1.15rem;line-height:1.55;padding:1rem 1.1rem;border-left:3px solid var(--red);background:var(--stage);border-radius:0 12px 12px 0}
.cta{display:grid;gap:.6rem;margin:1.75rem 0;padding:1.25rem;border-radius:20px;background:var(--navy);color:#fff}
.cta-sub{margin:0;color:#c5d1e2}
.btn{display:flex;align-items:center;justify-content:center;min-height:3.5rem;padding:0 1.5rem;border-radius:999px;background:var(--red);color:#fff;font-weight:600;font-size:1.0625rem;text-decoration:none}
.btn:hover{background:var(--red-ink)}
.btn.alt{background:rgb(255 255 255/.1);box-shadow:inset 0 0 0 1.5px rgb(255 255 255/.35)}
.table{overflow-x:auto;margin:0 0 1rem}table{border-collapse:collapse;width:100%;font-size:.95rem}
caption{text-align:left;color:var(--ink-2);font-size:.9rem;padding-bottom:.5rem}
th,td{text-align:left;padding:.6rem .5rem;border-bottom:1px solid var(--line);vertical-align:top}thead th{font-weight:600}tbody th{font-weight:550}
.faq h3{color:var(--ink)}
.updated{color:var(--ink-2);font-size:.9rem;margin-top:2rem}
.related ul,.hub{list-style:none;padding:0;display:grid;gap:.6rem}
.related li,.hub li{margin:0;max-width:none}
.related a,.hub a{display:block;font-weight:600;color:var(--ink);text-decoration:none}
.related li{padding:.9rem 1rem;border:1px solid var(--line);border-radius:16px}
.related span,.hub span{display:block;color:var(--ink-2);font-size:.9rem;font-weight:450;margin-top:.2rem}
.hub a{padding:1rem 1.1rem;border:1px solid var(--line);border-radius:16px}.hub a:hover,.related li:hover{border-color:var(--ink-2)}
.hub b{font-size:1.15rem;letter-spacing:-.02em;font-weight:620}
.foot{border-top:1px solid var(--line);margin-top:3rem;padding-block:1.5rem 3rem;color:var(--ink-2);font-size:.9rem}.foot a{color:var(--ink-2)}
`;
