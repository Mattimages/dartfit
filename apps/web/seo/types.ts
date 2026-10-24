/**
 * Guide pages: real, crawlable HTML at /nl/…, /en/…, /de/… (search engines and AI assistants do
 * not read the app's hash routes). Written as data, rendered at build time by ./render.ts.
 *
 * Text may use {placeholders} for catalogue facts (filled from the live catalogue at build time,
 * so a number on a guide page is never out of date): see `Stats` in ./render.ts.
 */
export type Lang = 'nl' | 'en' | 'de';
export type PageKey = 'guide' | 'algorithm' | 'why' | 'weight' | 'gift';

export interface Section {
  /** Phrased the way people ask it, so it can be quoted as the answer. */
  h2: string;
  p?: string[];
  list?: string[];
  /** Paragraphs after the list (a conclusion). */
  after?: string[];
  table?: { head: string[]; rows: string[][]; caption?: string };
}

export interface Page {
  key: PageKey;
  slug: string;
  /** ≤ 60 characters, the search term first. */
  title: string;
  /** 110–160 characters. */
  description: string;
  h1: string;
  /** The direct answer, first thing on the page (what an assistant quotes). */
  answer: string;
  sections: Section[];
  faq: Array<[q: string, a: string]>;
}

export interface Site {
  lang: Lang;
  /** BCP 47 for hreflang / og:locale. */
  locale: string;
  hub: { slug: ''; title: string; description: string; h1: string; intro: string };
  pages: Page[];
  ui: {
    cta: string;
    ctaSub: string;
    ctaGift: string;
    related: string;
    faq: string;
    updated: string;
    home: string;
    guides: string;
    disclosure: string;
    langName: string;
    skip: string;
  };
}
