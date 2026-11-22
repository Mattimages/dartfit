/**
 * Locale landing pages (/en/, /nl/, /de/): the DartFit tool first (what it does, how it measures,
 * what it suggests for real heights and grips, straight from the engine), then the guides. Also the
 * copy for the guide → pro links and the CTA on the utility pages (checkout chart, rules, calendar).
 *
 * Only `import type` from ./samples: the Vite config cannot load the engine, it gets the facts as JSON.
 */
import type { Lang } from './types';
import type { EngineFacts, Hold, PriceClass } from './samples';

export interface LandingCopy {
  title: string;
  description: string;
  h1: string;
  answer: string;
  stepsH2: string;
  steps: [string, string, string];
  samplesH2: string;
  samplesP: string;
  cols: [string, string, string];
  holds: Record<Hold, string>;
  match: string;
  guidesH2: string;
  prosH2: string;
  faq: Array<[string, string]>;
  /** WebApplication description and feature list (structured data). */
  appDescription: string;
  features: string[];
}

export const LANDING: Record<Lang, LandingCopy> = {
  en: {
    title: 'Free dart finder: darts that fit your hand | DartFit',
    description:
      'Photograph your hand next to a bank card, answer a few questions and see which of {darts} steel-tip darts fit you. Free, and your photo stays on your phone.',
    h1: 'Find darts that fit your hand',
    answer:
      'DartFit is a free dart finder for your phone. You photograph your hand next to a bank card, answer a few questions about how you hold and throw, and get your ideal dart (weight, length, thickness and barrel shape) plus the closest of {darts} real steel-tip darts from {brands} brands, in three price classes. The photo never leaves your phone.',
    stepsH2: 'How does DartFit measure your hand?',
    steps: [
      'Lay your hand flat next to any bank card and take a photo. The card is 85.6 mm wide, so it gives the scale; your phone finds 21 points on your hand and measures your fingers and palm in millimetres. No card? DartFit then sizes your hand from your height, less precisely.',
      'Answer a few questions: where you hold the dart, how many fingers touch it, how you throw and how much grip you like.',
      'The model turns that into a range for weight, length and thickness, checks that a real barrel can be made to it and scores every dart in the catalogue. You see the best one per price class, and the pro whose dart is closest.',
    ],
    samplesH2: 'Which darts suit which hand?',
    samplesP:
      'What DartFit suggests from height alone, for three fingers on the barrel and an average hand. A scan of your own hand narrows these ranges.',
    cols: ['Player', 'Ideal dart', 'Best match in the catalogue'],
    holds: { front: 'grip at the front', middle: 'grip in the middle', rear: 'grip at the back' },
    match: 'match',
    guidesH2: 'Guides to choosing darts',
    prosH2: 'Which darts do the pros throw?',
    faq: [
      [
        'Is DartFit free?',
        'Yes. Measuring your hand and seeing your darts costs nothing and needs no app or account. Shop links may earn us a commission; it never changes the ranking.',
      ],
      [
        'Does my photo leave my phone?',
        'No. Your hand is measured on your phone, and only the measurements in millimetres are sent to work out your fit.',
      ],
      [
        'Which darts does DartFit compare?',
        '{darts} steel-tip darts from {brands} brands, from {minW} g to {maxW} g, each with its weight, length, thickness, barrel shape, grip and tungsten content.',
      ],
      [
        'Do I need a bank card?',
        'The card is the ruler: any card in the standard 85.6 × 54 mm size works. Cover your name and number. Without a card DartFit sizes your hand from your height, which is less precise.',
      ],
    ],
    appDescription:
      'Free dart fitting on your phone: measures your hand next to a bank card, asks how you hold and throw, and ranks {darts} steel-tip darts in three price classes.',
    features: [
      'Hand measurement from a photo next to a bank card, on the device',
      'Questions on hold, fingers, throw and grip',
      'Ideal weight, barrel length and thickness, each with a range',
      'Ranking of {darts} steel-tip darts in three price classes',
      'The pro whose dart is closest to yours',
      'Gift mode without a hand scan',
    ],
  },
  nl: {
    title: 'Dartfinder: gratis darts die bij je hand passen | DartFit',
    description:
      'Maak een foto van je hand naast een pasje, beantwoord een paar vragen en zie welke van {darts} darts bij je passen. Gratis; je foto blijft op je telefoon.',
    h1: 'Vind darts die bij je hand passen',
    answer:
      'DartFit is een gratis dartfinder voor je telefoon. Je maakt een foto van je hand naast een pasje, beantwoordt een paar vragen over hoe je de dart vasthoudt en gooit, en krijgt je ideale dart (gewicht, lengte, dikte en barrelvorm) plus de best passende van {darts} echte steeltip darts van {brands} merken, in drie prijsklassen. De foto verlaat je telefoon nooit.',
    stepsH2: 'Hoe meet DartFit je hand?',
    steps: [
      'Leg je hand plat naast een gewoon pasje en maak een foto. Het pasje is 85,6 mm breed en geeft zo de maat; je telefoon vindt 21 punten op je hand en meet je vingers en handpalm in millimeters. Geen pasje? Dan schat DartFit je hand uit je lengte, minder precies.',
      'Beantwoord een paar vragen: waar je de dart vasthoudt, met hoeveel vingers, hoe je gooit en hoeveel grip je fijn vindt.',
      'Het model maakt daar een bereik van voor gewicht, lengte en dikte, controleert of een echte barrel zo gemaakt kan worden en geeft elke dart in de catalogus een score. Je ziet de beste per prijsklasse, en de prof met de dart die het dichtst in de buurt komt.',
    ],
    samplesH2: 'Welke dart past bij welke hand?',
    samplesP:
      'Wat DartFit voorstelt op basis van alleen je lichaamslengte, met drie vingers op de barrel en een gemiddelde hand. Een scan van je eigen hand maakt deze bereiken kleiner.',
    cols: ['Speler', 'Ideale dart', 'Beste match in de catalogus'],
    holds: { front: 'grip voorin', middle: 'grip in het midden', rear: 'grip achterin' },
    match: 'match',
    guidesH2: 'Gidsen over darts kiezen',
    prosH2: 'Met welke darts gooien de profs?',
    faq: [
      [
        'Is DartFit gratis?',
        'Ja. Je hand meten en je darts zien kost niets, en je hebt geen app of account nodig. Winkellinks kunnen ons een commissie opleveren; dat verandert nooit de volgorde.',
      ],
      [
        'Gaat mijn foto van mijn telefoon af?',
        'Nee. Je hand wordt op je telefoon gemeten, en alleen de maten in millimeters worden verstuurd om je fit uit te rekenen.',
      ],
      [
        'Welke darts vergelijkt DartFit?',
        '{darts} steeltip darts van {brands} merken, van {minW} tot {maxW} gram, elk met gewicht, lengte, dikte, barrelvorm, grip en tungstenpercentage.',
      ],
      [
        'Heb ik een pasje nodig?',
        'Het pasje is de liniaal: elk pasje in het standaardformaat van 85,6 × 54 mm werkt. Dek je naam en nummer af. Zonder pasje schat DartFit je hand uit je lengte, en dat is minder precies.',
      ],
    ],
    appDescription:
      'Gratis dartfitting op je telefoon: meet je hand naast een pasje, vraagt hoe je de dart vasthoudt en gooit, en zet {darts} steeltip darts op volgorde in drie prijsklassen.',
    features: [
      'Je hand meten op een foto naast een pasje, op je eigen telefoon',
      'Vragen over vasthouden, vingers, worp en grip',
      'Ideaal gewicht, barrellengte en dikte, elk met een bereik',
      'Rangorde van {darts} steeltip darts in drie prijsklassen',
      'De prof met de dart die het dichtst bij de jouwe ligt',
      'Cadeaustand zonder handscan',
    ],
  },
  de: {
    title: 'Dart-Finder: Darts, die zu deiner Hand passen | DartFit',
    description:
      'Fotografiere deine Hand neben einer Bankkarte, beantworte ein paar Fragen und sieh, welche von {darts} Darts passen. Kostenlos; das Foto bleibt bei dir.',
    h1: 'Finde Darts, die zu deiner Hand passen',
    answer:
      'DartFit ist ein kostenloser Dart-Finder fürs Handy. Du fotografierst deine Hand neben einer Bankkarte, beantwortest ein paar Fragen dazu, wie du den Dart hältst und wirfst, und bekommst deinen idealen Dart (Gewicht, Länge, Dicke und Barrelform) plus die passendsten von {darts} echten Steeldarts von {brands} Marken, in drei Preisklassen. Das Foto verlässt dein Handy nie.',
    stepsH2: 'Wie misst DartFit deine Hand?',
    steps: [
      'Leg deine Hand flach neben eine beliebige Bankkarte und mach ein Foto. Die Karte ist 85,6 mm breit und liefert so den Maßstab; dein Handy findet 21 Punkte an deiner Hand und misst Finger und Handfläche in Millimetern. Keine Karte? Dann schätzt DartFit deine Hand aus deiner Körpergröße, weniger genau.',
      'Beantworte ein paar Fragen: wo du den Dart greifst, mit wie vielen Fingern, wie du wirfst und wie viel Grip du magst.',
      'Das Modell macht daraus einen Bereich für Gewicht, Länge und Dicke, prüft, ob sich ein echter Barrel so bauen lässt, und bewertet jeden Dart im Katalog. Du siehst den besten pro Preisklasse und den Profi, dessen Dart am nächsten liegt.',
    ],
    samplesH2: 'Welcher Dart passt zu welcher Hand?',
    samplesP:
      'Was DartFit allein aus der Körpergröße vorschlägt, bei drei Fingern am Barrel und einer durchschnittlichen Hand. Ein Scan deiner eigenen Hand macht die Bereiche enger.',
    cols: ['Spieler', 'Idealer Dart', 'Beste Wahl im Katalog'],
    holds: { front: 'Griff vorne', middle: 'Griff in der Mitte', rear: 'Griff hinten' },
    match: 'Match',
    guidesH2: 'Ratgeber zur Dartwahl',
    prosH2: 'Mit welchen Darts werfen die Profis?',
    faq: [
      [
        'Ist DartFit kostenlos?',
        'Ja. Hand messen und deine Darts sehen kostet nichts, und du brauchst weder App noch Konto. Shop-Links können uns eine Provision bringen; an der Reihenfolge ändert das nie etwas.',
      ],
      [
        'Verlässt mein Foto das Handy?',
        'Nein. Deine Hand wird auf dem Handy vermessen, und nur die Maße in Millimetern werden verschickt, um deinen Fit zu berechnen.',
      ],
      [
        'Welche Darts vergleicht DartFit?',
        '{darts} Steeldarts von {brands} Marken, von {minW} bis {maxW} Gramm, jeweils mit Gewicht, Länge, Dicke, Barrelform, Grip und Wolframanteil.',
      ],
      [
        'Brauche ich eine Bankkarte?',
        'Die Karte ist das Lineal: Jede Karte im Standardformat 85,6 × 54 mm geht. Deck Name und Nummer ab. Ohne Karte schätzt DartFit deine Hand aus deiner Körpergröße, das ist weniger genau.',
      ],
    ],
    appDescription:
      'Kostenloses Dart-Fitting auf dem Handy: misst deine Hand neben einer Bankkarte, fragt, wie du den Dart hältst und wirfst, und ordnet {darts} Steeldarts in drei Preisklassen.',
    features: [
      'Handmessung auf einem Foto neben einer Bankkarte, auf dem eigenen Gerät',
      'Fragen zu Griffposition, Fingern, Wurf und Grip',
      'Ideales Gewicht, Barrellänge und Dicke, jeweils mit Bereich',
      'Rangfolge von {darts} Steeldarts in drei Preisklassen',
      'Der Profi, dessen Dart deinem am nächsten liegt',
      'Geschenkmodus ohne Handscan',
    ],
  },
};

/** The CTA line on the utility pages (checkout chart, rules, calendar): from their intent to a fit. */
export const UTILITY_CTA: Record<Lang, { checkout: string; other: string }> = {
  en: {
    checkout:
      'Know your outs? Then check that your darts fit too: DartFit compares {darts} darts with your hand in about a minute, for free.',
    other:
      'Ready for the oche? Check that your darts fit your hand: DartFit compares {darts} darts with your hand in about a minute, for free.',
  },
  nl: {
    checkout:
      'Ken je je uitgooien? Kijk dan ook of je darts passen: DartFit vergelijkt {darts} darts met je hand in ongeveer een minuut, gratis.',
    other:
      'Klaar voor de oche? Kijk of je darts bij je hand passen: DartFit vergelijkt {darts} darts met je hand in ongeveer een minuut, gratis.',
  },
  de: {
    checkout:
      'Du kennst deine Finishes? Dann prüf auch, ob deine Darts passen: DartFit vergleicht {darts} Darts mit deiner Hand in etwa einer Minute, kostenlos.',
    other:
      'Bereit fürs Oche? Prüf, ob deine Darts zu deiner Hand passen: DartFit vergleicht {darts} Darts mit deiner Hand in etwa einer Minute, kostenlos.',
  },
};

/** Price classes as the guides name them, with the app's euro bounds. */
export const PRICE_CLASS: Record<Lang, Record<PriceClass, string>> = {
  en: { budget: 'Budget', standard: 'Standard', premium: 'Premium' },
  nl: { budget: 'Budget', standard: 'Standaard', premium: 'Premium' },
  de: { budget: 'Budget', standard: 'Standard', premium: 'Premium' },
};

export type { EngineFacts };
