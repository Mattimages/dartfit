import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// public/pre.js paints the home header and title before the app loads; its words must be the app's.
const web = join(__dirname, '..');
const pre = readFileSync(join(web, 'public', 'pre.js'), 'utf8');
const html = readFileSync(join(web, 'index.html'), 'utf8');
const nlEn = readFileSync(join(web, 'src', 'i18n.ts'), 'utf8');
const de = readFileSync(join(web, 'src', 'i18n.de.ts'), 'utf8');

/** Every value of a key in a source file, in order (NL then EN in i18n.ts). */
const values = (src: string, key: string) =>
  [...src.matchAll(new RegExp(`'${key.replace('.', '\\.')}':\\s*'([^']*)'`, 'g'))].map((m) => m[1]!);

describe('static first paint (pre.js)', () => {
  it('uses the app’s own words for the title, the menu and the skip link', () => {
    const [nlTitle, enTitle] = values(nlEn, 'land.title');
    const [deTitle] = values(de, 'land.title');
    expect(pre).toContain(`h1: '${nlTitle}'`);
    expect(pre).toContain(`h1: '${deTitle}'`);
    expect(html).toContain(`<h1 id="pre-h1">${enTitle}</h1>`);
    const [nlMe, enMe] = values(nlEn, 'nav.me');
    expect(pre).toContain(`me: '${nlMe}'`);
    expect(pre).toContain(`me: '${values(de, 'nav.me')[0]}'`);
    expect(html).toContain(`id="pre-me">${enMe}</a>`);
    const [nlSkip] = values(nlEn, 'a11y.skip');
    expect(pre).toContain(`skip: '${nlSkip}'`);
    expect(pre).toContain(`skip: '${values(de, 'a11y.skip')[0]}'`);
  });

  it('is a same-origin file loaded right after the title (no inline script under the CSP)', () => {
    expect(html).toMatch(/<h1 id="pre-h1">[^<]+<\/h1><\/section>\s*<\/main>\s*<script src="\.\/pre\.js"><\/script>/);
    expect(html).not.toMatch(/<script>(?!\s*<\/script>)/);
  });
});
