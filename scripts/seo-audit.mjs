#!/usr/bin/env node
// SEO checks over the built site (apps/web/dist). Run after `npm run build`:
//   node scripts/seo-audit.mjs [distDir] [--json]
// Errors fail the run (exit 1); warnings are printed only.
// Checks: one <title> ≤ 60 and description ≤ 155 chars (warn past 58 / 152), self canonical, reciprocal
// hreflang with one x-default per cluster, one <h1>, valid JSON-LD (no Product without offers / review /
// rating), internal links that resolve, rel="sponsored" on shop links, img alt + size, foreign-language
// words in visible text, and a sitemap that lists exactly the indexable pages.
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';

const dist = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 'apps/web/dist';
const asJson = process.argv.includes('--json');
const SITE = (process.env.SITE_URL || 'https://findyourdarts.com').replace(/\/$/, '');
const SHOPS = /amazon\.|darting\.com|bol\.com|a-zdarts|dartshopper|dartsdirect|target-darts/i;
const SKIP_DIRS = new Set(['assets', 'mediapipe', 'icons', 'pros', 'guides']);

const errors = [];
const warnings = [];
const err = (page, msg) => errors.push(`${page}: ${msg}`);
const warn = (page, msg) => warnings.push(`${page}: ${msg}`);

function htmlFiles(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) {
      if (dir === dist && SKIP_DIRS.has(name)) continue;
      htmlFiles(p, out);
    } else if (name.endsWith('.html') && !/^google[0-9a-f]+\.html$/.test(name)) out.push(p);
  }
  return out;
}

const decode = (s) =>
  s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&#x27;|&rsquo;|&lsquo;/g, "'")
    .replace(/&nbsp;/g, ' ');
const attr = (tag, name) => {
  const m = tag.match(new RegExp(`\\s${name}=("([^"]*)"|'([^']*)')`, 'i'));
  return m ? decode(m[2] ?? m[3] ?? '') : null;
};
const urlOf = (file) => {
  let p = '/' + relative(dist, file).replace(/\\/g, '/');
  p = p.replace(/index\.html$/, '');
  return SITE + p;
};
const fileOf = (url) => {
  if (!url.startsWith(SITE)) return null;
  let p = url.slice(SITE.length).split('#')[0].split('?')[0] || '/';
  const f = p.endsWith('/') ? join(dist, p, 'index.html') : join(dist, p);
  return existsSync(f) ? f : existsSync(join(dist, p, 'index.html')) ? join(dist, p, 'index.html') : null;
};

// Small, distinctive function words per language (lower case, matched as whole words).
const MARKERS = {
  en: ['the', 'your', 'which', 'with', 'you', 'and', 'that', 'this', 'for'],
  nl: ['jouw', 'welke', 'het', 'een', 'je', 'niet', 'voor', 'ook', 'wat', 'bij'],
  de: ['und', 'nicht', 'deine', 'dein', 'welcher', 'welche', 'ist', 'mit', 'für', 'auch'],
};
function languageShare(text) {
  const words = text.toLowerCase().match(/[a-zäöüßéèë']+/g) ?? [];
  const counts = { en: 0, nl: 0, de: 0 };
  for (const w of words) for (const l of Object.keys(MARKERS)) if (MARKERS[l].includes(w)) counts[l]++;
  return { words: words.length, counts };
}

const pages = new Map();
for (const file of htmlFiles(dist)) {
  const src = readFileSync(file, 'utf8');
  const url = urlOf(file);
  const name = url.slice(SITE.length) || '/';
  const head = src.slice(0, src.indexOf('</head>') + 1 || 4000);
  const lang = (src.match(/<html[^>]*\slang="([^"]+)"/i) || [])[1] ?? null;
  const titles = [...head.matchAll(/<title>([\s\S]*?)<\/title>/gi)].map((m) => decode(m[1].trim()));
  const desc = [...head.matchAll(/<meta[^>]+name="description"[^>]*>/gi)].map((m) => attr(m[0], 'content'));
  const robots = [...head.matchAll(/<meta[^>]+name="robots"[^>]*>/gi)].map((m) => attr(m[0], 'content'))[0] ?? '';
  const canon = [...head.matchAll(/<link[^>]+rel="canonical"[^>]*>/gi)].map((m) => attr(m[0], 'href'));
  const alts = [...head.matchAll(/<link[^>]+rel="alternate"[^>]+hreflang=[^>]*>/gi)].map((m) => ({
    lang: attr(m[0], 'hreflang'),
    href: attr(m[0], 'href'),
  }));
  const ld = [...src.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi)].map((m) => m[1]);
  // Visible text: drop scripts, styles, noscript is visible to crawlers so it stays.
  const body = src.slice(src.indexOf('<body'));
  const text = decode(
    body
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<nav class="langs"[\s\S]*?<\/nav>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' '),
  );
  const h1 = (body.match(/<h1[\s>]/gi) || []).length;
  const links = [...body.matchAll(/<a\s[^>]*>/gi)].map((m) => m[0]);
  const imgs = [...body.matchAll(/<img\s[^>]*>/gi)].map((m) => m[0]);
  pages.set(url, { file, url, name, lang, titles, desc, robots, canon, alts, ld, text, h1, links, imgs, src });
}

const indexable = (p) => !/noindex/i.test(p.robots);
for (const p of pages.values()) {
  const n = p.name;
  if (!p.lang) err(n, 'no <html lang>');
  if (p.titles.length !== 1) err(n, `${p.titles.length} <title> tags`);
  const t = p.titles[0] ?? '';
  if (t.length > 60) err(n, `title ${t.length} chars: "${t}"`);
  else if (t.length > 58) warn(n, `title ${t.length} chars: "${t}"`);
  if (p.desc.length !== 1) err(n, `${p.desc.length} meta descriptions`);
  const d = p.desc[0] ?? '';
  if (d.length > 155) err(n, `description ${d.length} chars`);
  else if (d.length > 152) warn(n, `description ${d.length} chars`);
  if (d.length < 70) warn(n, `description only ${d.length} chars`);
  if (/…$/.test(d)) warn(n, 'description ends in "…" (cut off)');
  if (indexable(p)) {
    if (p.canon.length !== 1) err(n, `${p.canon.length} canonicals`);
    else if (p.canon[0] !== p.url) err(n, `canonical ${p.canon[0]} is not the page itself`);
  }
  if (p.h1 !== 1) err(n, `${p.h1} <h1> elements (noscript counts)`);

  // hreflang: self listed under its own lang, every target exists and lists this page back.
  if (p.alts.length) {
    const self = p.alts.find((a) => a.href === p.url);
    if (!self) err(n, 'hreflang set does not include the page itself');
    const xd = p.alts.filter((a) => a.lang === 'x-default');
    if (xd.length !== 1) err(n, `${xd.length} x-default links`);
    for (const a of p.alts) {
      if (a.lang === 'x-default') continue;
      const target = pages.get(a.href);
      if (!target) {
        err(n, `hreflang ${a.lang} → ${a.href} is not a built page`);
        continue;
      }
      if (target.lang && target.lang !== a.lang) err(n, `hreflang ${a.lang} → page with lang="${target.lang}"`);
      if (!target.alts.some((b) => b.href === p.url)) err(n, `hreflang ${a.lang} → ${target.name} has no return link`);
      const txd = target.alts.find((b) => b.lang === 'x-default')?.href;
      if (xd[0] && txd !== xd[0].href) err(n, `x-default differs from ${target.name} (${xd[0].href} vs ${txd})`);
    }
  } else if (indexable(p)) warn(n, 'no hreflang links');

  // JSON-LD
  for (const block of p.ld) {
    let data;
    try {
      data = JSON.parse(block);
    } catch (e) {
      err(n, `JSON-LD does not parse: ${e.message}`);
      continue;
    }
    const nodes = [];
    const walk = (x) => {
      if (Array.isArray(x)) return x.forEach(walk);
      if (x && typeof x === 'object') {
        if (x['@type']) nodes.push(x);
        Object.values(x).forEach(walk);
      }
    };
    walk(data);
    for (const node of nodes) {
      const types = [].concat(node['@type']);
      if (types.includes('Product') && !node.offers && !node.review && !node.aggregateRating)
        err(n, `JSON-LD Product "${node.name}" has no offers, review or aggregateRating (invalid for Google)`);
      if (types.includes('FAQPage')) {
        for (const q of [].concat(node.mainEntity ?? [])) {
          const qn = q.name ?? '';
          if (!p.text.includes(qn.slice(0, 40))) err(n, `FAQ question not visible on the page: "${qn}"`);
        }
      }
      if ((types.includes('Article') || types.includes('TechArticle')) && node['@id']) {
        for (const k of ['headline', 'dateModified', 'author', 'inLanguage'])
          if (!node[k]) warn(n, `Article without ${k}`);
        if (node.headline && node.headline.length > 110) err(n, `Article headline over 110 chars`);
      }
      if (types.includes('BreadcrumbList')) {
        for (const li of node.itemListElement ?? [])
          if (li.item && typeof li.item === 'string' && !pages.has(li.item)) err(n, `breadcrumb ${li.item} not a page`);
      }
    }
  }

  // Links
  for (const a of p.links) {
    const href = attr(a, 'href');
    if (!href || href.startsWith('#') || href.startsWith('mailto:')) continue;
    if (href.startsWith('/') && !href.startsWith('//')) {
      const path = href.split('#')[0].split('?')[0];
      if (path === '/' || path.startsWith('/api/') || path.startsWith('/go/') || path.startsWith('/_vercel/')) continue;
      if (!fileOf(SITE + path) && !existsSync(join(dist, path))) err(n, `internal link ${href} does not resolve`);
      continue;
    }
    if (/^https?:/.test(href)) {
      const rel = (attr(a, 'rel') ?? '').split(/\s+/);
      if (SHOPS.test(href) && !rel.includes('sponsored')) err(n, `shop link without rel="sponsored": ${href}`);
      if (attr(a, 'target') === '_blank' && !rel.includes('noopener')) warn(n, `target=_blank without noopener: ${href}`);
    }
  }
  for (const img of p.imgs) {
    if (attr(img, 'alt') === null) err(n, `img without alt: ${attr(img, 'src')}`);
    if (!attr(img, 'width') || !attr(img, 'height')) warn(n, `img without width/height: ${attr(img, 'src')}`);
  }

  // Mixed language: the page's own markers must dominate; foreign markers per 100 words.
  if (p.lang) {
    const own = p.lang.slice(0, 2);
    const { words, counts } = languageShare(p.text);
    for (const other of Object.keys(counts)) {
      if (other === own || !MARKERS[own]) continue;
      if (counts[other] > Math.max(4, counts[own] * 0.08))
        err(n, `${counts[other]} ${other} marker words vs ${counts[own]} ${own} in ${words} words (mixed language?)`);
    }
  }
}

// Sitemap(s): every <loc> is a built, indexable, self-canonical page; every indexable page is listed.
const locs = new Set();
const readSitemap = (file) => {
  const xml = readFileSync(file, 'utf8');
  for (const m of xml.matchAll(/<sitemap>\s*<loc>([^<]+)<\/loc>/g)) {
    const f = fileOf(m[1]) ?? join(dist, m[1].slice(SITE.length));
    if (!existsSync(f)) err('sitemap', `child sitemap ${m[1]} missing`);
    else readSitemap(f);
  }
  for (const m of xml.matchAll(/<url>\s*<loc>([^<]+)<\/loc>/g)) locs.add(m[1]);
};
const smIndex = join(dist, 'sitemap-index.xml');
if (existsSync(smIndex)) readSitemap(smIndex);
else if (existsSync(join(dist, 'sitemap.xml'))) readSitemap(join(dist, 'sitemap.xml'));
else err('sitemap', 'no sitemap.xml');
for (const loc of locs) {
  const p = pages.get(loc);
  if (!p) err('sitemap', `${loc} is not a built page`);
  else if (!indexable(p)) err('sitemap', `${loc} is noindex`);
}
for (const p of pages.values()) if (indexable(p) && !locs.has(p.url)) err('sitemap', `${p.name} missing from the sitemap`);
const robotsTxt = existsSync(join(dist, 'robots.txt')) ? readFileSync(join(dist, 'robots.txt'), 'utf8') : '';
if (!/Sitemap:\s*https?:\/\/\S+/.test(robotsTxt)) err('robots.txt', 'no Sitemap line');
for (const bot of ['Googlebot', 'Bingbot', 'OAI-SearchBot', 'PerplexityBot', 'ClaudeBot'])
  if (new RegExp(`User-agent: ${bot}\\s+Disallow: /\\s`).test(robotsTxt)) err('robots.txt', `${bot} is blocked`);

if (asJson) console.log(JSON.stringify({ pages: pages.size, sitemap: locs.size, errors, warnings }, null, 1));
else {
  for (const w of warnings) console.log('warn  ' + w);
  for (const e of errors) console.log('ERROR ' + e);
  console.log(`\n${pages.size} pages, ${locs.size} sitemap URLs, ${errors.length} errors, ${warnings.length} warnings`);
}
process.exit(errors.length ? 1 : 0);
