import type { Lang } from './i18n';

/**
 * The guides the app footer links to, per language: real HTML pages, so the rendered app (what
 * search engines index of the root) links into the guides and the pro pages. `test/guides.test.ts`
 * checks every path is a built page.
 */
export const GUIDE_LINKS: Record<Lang, Array<[path: string, label: string]>> = {
  en: [
    ['/en/which-darts-are-right-for-me/', 'Which darts suit me?'],
    ['/en/what-weight-darts/', 'Dart weight'],
    ['/en/barrel-shapes-explained/', 'Barrel shapes'],
    ['/en/dart-grip-knurling/', 'Grip and knurling'],
    ['/en/darts-checkout-chart/', 'Checkout chart'],
    ['/en/darts-rules/', 'Darts rules'],
    ['/en/pros/', 'Darts of the pros'],
  ],
  nl: [
    ['/nl/welke-dart-past-bij-mij/', 'Welke dart past bij mij?'],
    ['/nl/welk-gewicht-dart/', 'Dartgewicht'],
    ['/nl/barrelvormen-uitgelegd/', 'Barrelvormen'],
    ['/nl/grip-en-knurling/', 'Grip en knurling'],
    ['/nl/uitgooitabel/', 'Uitgooitabel'],
    ['/nl/darts-regels/', 'Dartregels'],
    ['/nl/profs/', 'Darts van de profs'],
  ],
  de: [
    ['/de/welcher-dart-passt-zu-mir/', 'Welcher Dart passt zu mir?'],
    ['/de/welches-dartgewicht/', 'Dartgewicht'],
    ['/de/barrelformen-erklaert/', 'Barrelformen'],
    ['/de/dart-grip-raendelung/', 'Grip und Rändelung'],
    ['/de/checkout-tabelle/', 'Checkout-Tabelle'],
    ['/de/darts-regeln/', 'Darts-Regeln'],
    ['/de/profis/', 'Darts der Profis'],
  ],
};
