/**
 * Guides → pro pages: a short, data-driven section on the guides whose subject a pro's dart shows
 * (weight, barrel shape, length and thickness, tungsten, grip), linking to those pros' pages. Built
 * from the catalogue at build time, so it changes when a pro's dart does.
 */
import type { Lang, PageKey } from './types';
import { esc } from './render';
import { proPaths, type CatalogueRows, type ProRowLite, type VariantRowLite } from './pro-pages';

type Key = Extract<PageKey, 'weight' | 'shapes' | 'size' | 'tungsten' | 'grip'>;
const KEYS: Key[] = ['weight', 'shapes', 'size', 'tungsten', 'grip'];

const COPY: Record<
  Lang,
  Record<Key, { h2: string; lead: string }> & {
    light: string;
    heavy: string;
    long: string;
    short: string;
    smooth: string;
    grippy: string;
    shapeNames: Record<string, string>;
    note: string;
  }
> = {
  en: {
    weight: {
      h2: 'How heavy are the pros’ darts?',
      lead: 'Among the {n} pros in our catalogue, the lightest dart weighs {min} g and the heaviest {max} g.',
    },
    shapes: { h2: 'Which pros throw which barrel shape?', lead: 'The {n} pros’ darts in our catalogue, by barrel shape.' },
    size: {
      h2: 'Which pros throw long or short barrels?',
      lead: 'Barrel lengths among the {n} pros’ darts run from {min} mm to {max} mm.',
    },
    tungsten: {
      h2: 'Which pros throw 95% tungsten?',
      lead: '{k} of the {n} pros’ darts in our catalogue are 95% tungsten or more; the others are 90%.',
    },
    grip: {
      h2: 'Which pros throw smooth or grippy darts?',
      lead: 'On the 1–5 grip scale the {n} pros’ darts run from {min} to {max}.',
    },
    light: 'Lightest',
    heavy: 'Heaviest',
    long: 'Longest',
    short: 'Shortest',
    smooth: 'Smoothest',
    grippy: 'Grippiest',
    shapeNames: { straight: 'Straight', torpedo: 'Torpedo', tapered: 'Tapered', bomb: 'Bomb', scalloped: 'Scalloped' },
    note: 'Their own (signature) dart as listed in the DartFit catalogue.',
  },
  nl: {
    weight: {
      h2: 'Hoe zwaar zijn de darts van de profs?',
      lead: 'Van de {n} profs in onze catalogus weegt de lichtste dart {min} g en de zwaarste {max} g.',
    },
    shapes: { h2: 'Welke profs gooien met welke barrelvorm?', lead: 'De darts van de {n} profs in onze catalogus, per barrelvorm.' },
    size: {
      h2: 'Welke profs gooien met lange of korte barrels?',
      lead: 'De barrels van de {n} profs zijn {min} tot {max} mm lang.',
    },
    tungsten: {
      h2: 'Welke profs gooien met 95% tungsten?',
      lead: '{k} van de {n} profdarts in onze catalogus zijn 95% tungsten of meer; de rest is 90%.',
    },
    grip: {
      h2: 'Welke profs gooien met gladde of grippy darts?',
      lead: 'Op de gripschaal van 1 tot 5 lopen de darts van de {n} profs van {min} tot {max}.',
    },
    light: 'Lichtst',
    heavy: 'Zwaarst',
    long: 'Langst',
    short: 'Kortst',
    smooth: 'Gladst',
    grippy: 'Meeste grip',
    shapeNames: { straight: 'Recht', torpedo: 'Torpedo', tapered: 'Taps', bomb: 'Bomb', scalloped: 'Scalloped' },
    note: 'Hun eigen (signature)dart zoals die in de DartFit-catalogus staat.',
  },
  de: {
    weight: {
      h2: 'Wie schwer sind die Darts der Profis?',
      lead: 'Unter den {n} Profis in unserem Katalog wiegt der leichteste Dart {min} g und der schwerste {max} g.',
    },
    shapes: { h2: 'Welche Profis werfen welche Barrelform?', lead: 'Die Darts der {n} Profis in unserem Katalog, nach Barrelform.' },
    size: {
      h2: 'Welche Profis werfen lange oder kurze Barrels?',
      lead: 'Die Barrels der {n} Profis sind {min} bis {max} mm lang.',
    },
    tungsten: {
      h2: 'Welche Profis werfen 95% Wolfram?',
      lead: '{k} der {n} Profi-Darts in unserem Katalog haben 95% Wolfram oder mehr, die übrigen 90%.',
    },
    grip: {
      h2: 'Welche Profis werfen glatte oder griffige Darts?',
      lead: 'Auf der Grip-Skala von 1 bis 5 reichen die Darts der {n} Profis von {min} bis {max}.',
    },
    light: 'Am leichtesten',
    heavy: 'Am schwersten',
    long: 'Am längsten',
    short: 'Am kürzesten',
    smooth: 'Am glattesten',
    grippy: 'Am griffigsten',
    shapeNames: { straight: 'Gerade', torpedo: 'Torpedo', tapered: 'Konisch', bomb: 'Bomb', scalloped: 'Scalloped' },
    note: 'Ihr eigener (Signature-)Dart, wie er im DartFit-Katalog steht.',
  },
};

const loc = (lang: Lang) => (lang === 'en' ? 'en-GB' : lang === 'de' ? 'de-DE' : 'nl-NL');
const n = (lang: Lang, x: number, d = 1) => x.toLocaleString(loc(lang), { maximumFractionDigits: d });
const sub = (s: string, v: Record<string, string>) => s.replace(/\{(\w+)\}/g, (_, k: string) => v[k] ?? '');

/** The pro-examples section for a guide, or '' when the guide has none. */
export function proExamples(key: PageKey, lang: Lang, cat: CatalogueRows): string {
  if (!KEYS.includes(key as Key)) return '';
  const c = COPY[lang];
  const rows = cat.pros
    .map((p) => ({ p, v: cat.variants.find((x) => x.id === p.variantId) }))
    .filter((x): x is { p: ProRowLite; v: VariantRowLite } => !!x.v);
  if (rows.length < 6) return '';
  const link = (p: ProRowLite, spec: string) =>
    `<a href="${proPaths.pro(lang, p)}">${esc(p.name)}</a> <span>(${esc(spec)})</span>`;
  const by = (f: (v: VariantRowLite) => number) => [...rows].sort((a, b) => f(a.v) - f(b.v) || a.p.name.localeCompare(b.p.name));
  const pair = (labelLow: string, labelHigh: string, f: (v: VariantRowLite) => number, spec: (v: VariantRowLite) => string) => {
    const s = by(f);
    const low = s.slice(0, 3);
    const high = s.slice(-3).reverse();
    return `<ul class="pro-ex"><li><b>${esc(labelLow)}:</b> ${low.map((r) => link(r.p, spec(r.v))).join(', ')}</li><li><b>${esc(labelHigh)}:</b> ${high.map((r) => link(r.p, spec(r.v))).join(', ')}</li></ul>`;
  };
  const N = String(rows.length);
  let lead = '';
  let body = '';
  const k = key as Key;
  if (k === 'weight') {
    const ws = rows.map((r) => r.v.weight);
    lead = sub(c.weight.lead, { n: N, min: n(lang, Math.min(...ws)), max: n(lang, Math.max(...ws)) });
    body = pair(c.light, c.heavy, (v) => v.weight, (v) => `${n(lang, v.weight)} g`);
  } else if (k === 'size') {
    const ls = rows.map((r) => r.v.length);
    lead = sub(c.size.lead, { n: N, min: n(lang, Math.min(...ls)), max: n(lang, Math.max(...ls)) });
    body = pair(c.short, c.long, (v) => v.length, (v) => `${n(lang, v.length)} mm × ${n(lang, v.diameter, 2)} mm`);
  } else if (k === 'grip') {
    const g = rows.filter((r) => r.v.grip !== null);
    if (g.length < 6) return '';
    const gs = g.map((r) => r.v.grip!);
    lead = sub(c.grip.lead, { n: String(g.length), min: n(lang, Math.min(...gs)), max: n(lang, Math.max(...gs)) });
    const s = [...g].sort((a, b) => a.v.grip! - b.v.grip! || a.p.name.localeCompare(b.p.name));
    const fmt = (r: (typeof g)[number]) => link(r.p, `${r.v.grip}/5`);
    body = `<ul class="pro-ex"><li><b>${esc(c.smooth)}:</b> ${s.slice(0, 3).map(fmt).join(', ')}</li><li><b>${esc(c.grippy)}:</b> ${s.slice(-3).reverse().map(fmt).join(', ')}</li></ul>`;
  } else if (k === 'tungsten') {
    const hi = rows.filter((r) => r.v.tungsten >= 95).sort((a, b) => a.p.name.localeCompare(b.p.name));
    if (!hi.length) return '';
    lead = sub(c.tungsten.lead, { n: N, k: String(hi.length) });
    body = `<ul class="pro-ex">${hi.map((r) => `<li>${link(r.p, `${r.v.tungsten}%`)}</li>`).join('')}</ul>`;
  } else if (k === 'shapes') {
    lead = sub(c.shapes.lead, { n: N });
    const groups = new Map<string, typeof rows>();
    for (const r of rows) if (r.v.shape) groups.set(r.v.shape, [...(groups.get(r.v.shape) ?? []), r]);
    body = `<ul class="pro-ex">${[...groups.entries()]
      .sort((a, b) => b[1].length - a[1].length)
      .map(
        ([shape, list]) =>
          `<li><b>${esc(c.shapeNames[shape] ?? shape)} (${list.length}):</b> ${list
            .sort((a, b) => a.p.name.localeCompare(b.p.name))
            .map((r) => `<a href="${proPaths.pro(lang, r.p)}">${esc(r.p.name)}</a>`)
            .join(', ')}</li>`,
      )
      .join('')}</ul>`;
  }
  return `<section class="pro-examples"><h2 id="pros">${esc(c[k].h2)}</h2><p>${esc(lead)}</p>${body}<p class="note">${esc(c.note)}</p></section>`;
}
