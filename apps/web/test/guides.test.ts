import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildGuides, LANGS, SITES, statsFromCsv } from '../seo/render';
import { catalogueRows } from '../seo/pro-pages';
import { engineFacts } from '../seo/samples';
import { GUIDE_LINKS } from '../src/guide-links';

const data = join(__dirname, '..', '..', '..', 'packages', 'catalogue', 'data');
const csv = readFileSync(join(data, 'variants.csv'), 'utf8');
const prosJson = readFileSync(join(data, 'pros.json'), 'utf8');
const stats = statsFromCsv(csv, (JSON.parse(prosJson) as unknown[]).length);
const cat = catalogueRows(csv, prosJson, readFileSync(join(data, 'pro-photos.json'), 'utf8'));
const base = 'https://dartfit.example';
const facts = engineFacts();
const files = buildGuides(stats, base, cat, facts);
const html = Object.entries(files).filter(([f]) => f.endsWith('.html'));

describe('guide pages (SEO)', () => {
  it('has a hub, eighteen guides, a pro index and a page per pro in every language', () => {
    expect(html).toHaveLength(LANGS.length * (1 + 18 + 1 + cat.pros.length));
    for (const s of SITES) expect(new Set(s.pages.map((p) => p.key)).size).toBe(18);
    for (const s of SITES) expect(new Set(s.pages.map((p) => p.slug)).size).toBe(18);
    expect(cat.pros.length).toBeGreaterThan(20);
  });

  it('checkout table: every finish, and the bogey numbers the copy names', () => {
    const page = files['en/darts-checkout-chart/index.html']!;
    expect(page).toContain('<th scope="row">170</th><td>3</td><td>T20 · T20 · Bull</td>');
    const none = [...page.matchAll(/<th scope="row">(\d+)<\/th><td>–<\/td>/g)].map((m) => Number(m[1]));
    expect(none).toEqual([169, 168, 166, 165, 163, 162, 159]);
  });

  it('pro pages quote the dart from the catalogue', () => {
    const p = files['nl/profs/luke-littler/index.html']!;
    expect(p).toContain('Welke darts gooit Luke Littler?');
    expect(p).toContain('Target Luke Littler G1');
    expect(files['de/profis/beau-greaves/index.html']).toContain('Beau Greaves');
    expect(files['nl/profs/dimitri-van-den-bergh/index.html']).toContain('Dimitri Van den Bergh');
    expect(files['en/pros/index.html']).toContain('/en/pros/michael-van-gerwen/');
  });

  it('every page has a title, a description, a canonical and all language alternates', () => {
    for (const [file, page] of html) {
      const title = page.match(/<title>([^<]+)<\/title>/)![1]!;
      const desc = page.match(/<meta name="description" content="([^"]+)"/)![1]!;
      expect(title.length, `${file} title`).toBeLessThanOrEqual(58);
      expect(desc.length, `${file} description`).toBeGreaterThanOrEqual(100);
      expect(desc.length, `${file} description`).toBeLessThanOrEqual(152);
      expect(page).toContain(`<link rel="canonical" href="${base}/${file.replace(/index\.html$/, '')}">`);
      for (const l of LANGS)
        expect(page, `${file} hreflang ${l}`).toMatch(new RegExp(`hreflang="${l}" href="${base}/${l}/`));
      expect(page).toContain('hreflang="x-default"');
    }
  });

  it('keeps the strict CSP: no inline styles or scripts, only a JSON-LD data block that parses', () => {
    for (const [file, page] of html) {
      expect(page, file).not.toMatch(/\sstyle="/);
      const scripts = [...page.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)];
      // Only the JSON-LD data block and the same-origin analytics script (no inline code).
      const ok = (m: RegExpMatchArray) =>
        m[1]!.includes('application/ld+json') ||
        (m[1]!.includes('src="/_vercel/insights/script.js"') && !m[2]!.trim());
      expect(scripts.every(ok), file).toBe(true);
      for (const m of scripts.filter((x) => x[1]!.includes('ld+json')))
        expect(() => JSON.parse(m[2]!)).not.toThrow();
    }
  });

  it('answers the questions people ask, in their words', () => {
    const lower = (f: string) => files[f]!.toLowerCase();
    expect(lower('nl/welke-dart-past-bij-mij/index.html')).toContain('welke dart past bij mij');
    expect(lower('nl/welke-dart-past-bij-mij/index.html')).toContain('hoe vind ik een dart die bij me past');
    expect(lower('en/which-darts-are-right-for-me/index.html')).toContain('which darts are right for me');
    expect(lower('de/welcher-dart-passt-zu-mir/index.html')).toContain('welcher dart passt zu mir');
    expect(lower('nl/welk-gewicht-dart/index.html')).toContain('welk gewicht dart');
    expect(lower('nl/barrelvormen-uitgelegd/index.html')).toContain('torpedo of rechte barrel');
    expect(lower('nl/darts-voor-beginners/index.html')).toContain('welk gewicht darts voor een beginner');
    expect(lower('nl/dartbord-ophangen/index.html')).toContain('hoe hoog hangt een dartbord');
    expect(lower('en/how-to-hang-a-dartboard/index.html')).toContain('how high should a dartboard be from the floor');
    expect(lower('en/best-darts-for-beginners/index.html')).toContain('what weight darts should a beginner use');
    expect(lower('de/dartscheibe-aufhaengen/index.html')).toContain('wie hoch hängt eine dartscheibe');
    expect(lower('de/steeldart-oder-softdart/index.html')).toContain('steeldart oder softdart');
  });

  it('opens every page with the welcome banner', () => {
    for (const [file, page] of html) expect(page, file).toContain('class="welcome"');
    expect(files['nl/index.html']).toContain('Welkom bij Find Your Darts');
    expect(files['en/how-to-throw-darts/index.html']).toContain('Finally, a good use of AI');
    expect(files['de/darts-pflegen/index.html']).toContain('Willkommen bei Find Your Darts');
  });

  it('quotes catalogue facts from the live catalogue, with no placeholders left', () => {
    for (const [file, page] of Object.entries(files)) expect(page, file).not.toMatch(/\{[a-zA-Z0-9]+\}/);
    expect(files['en/what-weight-darts/index.html']).toContain(`${stats.darts} darts`);
  });

  it('lists every page in the sitemaps (an index over core, guides and pros) and welcomes AI crawlers', () => {
    const maps = ['sitemap-core.xml', 'sitemap-guides.xml', 'sitemap-pros.xml'];
    for (const m of maps) expect(files['sitemap.xml']).toContain(`<loc>${base}/${m}</loc>`);
    expect(files['sitemap-index.xml']).toBe(files['sitemap.xml']);
    const all = maps.map((m) => files[m]).join('');
    expect(all).toContain(`<loc>${base}/</loc>`);
    for (const [file] of html)
      expect(all).toContain(`<loc>${base}/${file.replace(/index\.html$/, '')}</loc>`);
    for (const bot of ['GPTBot', 'ClaudeBot', 'PerplexityBot', 'Google-Extended'])
      expect(files['robots.txt']).toContain(`User-agent: ${bot}\nAllow: /`);
    expect(files['robots.txt']).toContain(`Sitemap: ${base}/sitemap.xml`);
    expect(files['llms.txt']).toMatch(/^# DartFit/);
    expect(files['llms-full.txt']).toContain('| Luke Littler | Target Luke Littler G1 |');
  });

  it('landing pages lead with the tool, real sample fits, and the root as x-default', () => {
    expect(facts.samples).toHaveLength(9);
    for (const l of LANGS) {
      const page = files[`${l}/index.html`]!;
      expect(page).toContain(`<link rel="alternate" hreflang="x-default" href="${base}/">`);
      expect(page).toContain('id="samples"');
      expect(page).toContain(`href="/#/scan?lang=${l}"`);
      expect(page).toContain('"@type":"FAQPage"');
      expect(page).toContain('"featureList"');
    }
    expect(files['en/index.html']).toContain('<h1>Find darts that fit your hand</h1>');
    expect(files['nl/index.html']).toContain('<h1>Vind darts die bij je hand passen</h1>');
    // Guides keep the English page as x-default.
    expect(files['nl/welk-gewicht-dart/index.html']).toContain(
      `hreflang="x-default" href="${base}/en/what-weight-darts/"`,
    );
  });

  it('pro pages: catalogue benchmark, spec links into the guides, alternatives with deltas, no Product schema', () => {
    const p = files['en/pros/luke-littler/index.html']!;
    expect(p).toContain('id="compare"');
    expect(p).toMatch(/heavier than \d+% of the \d+ steel-tip darts/);
    expect(p).toContain('<a href="/en/what-weight-darts/">Weight</a>');
    expect(p).toContain('<a href="/en/barrel-shapes-explained/">Shape</a>');
    expect(p).toMatch(/<span class="nw">\d+ g \((±0|[+−][\d.]+)\)<\/span>/);
    expect(p).toContain('"@type":"ItemList"');
    for (const [file, page] of html) expect(page, file).not.toContain('"@type":"Product"');
  });

  it('guides link to the pros whose darts show the topic', () => {
    expect(files['en/what-weight-darts/index.html']).toContain('href="/en/pros/');
    expect(files['nl/barrelvormen-uitgelegd/index.html']).toContain('href="/nl/profs/');
    expect(files['de/wolfram-anteil-darts/index.html']).toContain('href="/de/profis/');
    expect(files['en/darts-checkout-chart/index.html']).toContain('Know your outs?');
  });

  it('the app footer links only to built guide pages', () => {
    for (const l of LANGS)
      for (const [path] of GUIDE_LINKS[l]) expect(files[`${path.slice(1)}index.html`], path).toBeDefined();
  });
});
