import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildGuides, LANGS, SITES, statsFromCsv } from '../seo/render';
import { catalogueRows } from '../seo/pro-pages';

const data = join(__dirname, '..', '..', '..', 'packages', 'catalogue', 'data');
const csv = readFileSync(join(data, 'variants.csv'), 'utf8');
const prosJson = readFileSync(join(data, 'pros.json'), 'utf8');
const stats = statsFromCsv(csv, (JSON.parse(prosJson) as unknown[]).length);
const cat = catalogueRows(csv, prosJson);
const base = 'https://dartfit.example';
const files = buildGuides(stats, base, cat);
const html = Object.entries(files).filter(([f]) => f.endsWith('.html'));

describe('guide pages (SEO)', () => {
  it('has a hub, eight guides, a pro index and a page per pro in every language', () => {
    expect(html).toHaveLength(LANGS.length * (1 + 11 + 1 + cat.pros.length));
    for (const s of SITES) expect(new Set(s.pages.map((p) => p.key)).size).toBe(11);
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
      expect(title.length, `${file} title`).toBeLessThanOrEqual(65);
      expect(desc.length, `${file} description`).toBeGreaterThanOrEqual(100);
      expect(desc.length, `${file} description`).toBeLessThanOrEqual(165);
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
  });

  it('quotes catalogue facts from the live catalogue, with no placeholders left', () => {
    for (const [file, page] of Object.entries(files)) expect(page, file).not.toMatch(/\{[a-zA-Z0-9]+\}/);
    expect(files['en/what-weight-darts/index.html']).toContain(`${stats.darts} darts`);
  });

  it('lists every guide in the sitemap and welcomes AI crawlers', () => {
    for (const [file] of html)
      expect(files['sitemap.xml']).toContain(`<loc>${base}/${file.replace(/index\.html$/, '')}</loc>`);
    for (const bot of ['GPTBot', 'ClaudeBot', 'PerplexityBot', 'Google-Extended'])
      expect(files['robots.txt']).toContain(`User-agent: ${bot}\nAllow: /`);
    expect(files['robots.txt']).toContain(`Sitemap: ${base}/sitemap.xml`);
    expect(files['llms.txt']).toMatch(/^# DartFit/);
  });
});
