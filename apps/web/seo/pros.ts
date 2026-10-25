/** Copy for the pro pages ("which darts does Luke Littler throw?"), one block per language. */
import type { Lang, ProCopy } from './types';

export const PRO_COPY: Record<Lang, ProCopy> = {
  en: {
    slug: 'pros',
    index: {
      title: 'Which darts do the pros throw? Weights and barrels',
      description:
        'The darts of {n} professional players: weight, length, barrel shape and tungsten of each signature dart, and whether that dart would fit your hand.',
      h1: 'Which darts do the pros throw?',
      answer:
        'The signature darts of the {n} professionals below weigh between {minW} and {maxW} g; most are straight barrels of 90% tungsten. A pro’s dart is built around the player’s own grip, so it fits you only if your hand and hold are similar. DartFit tells you which pro throws the same type of dart as you.',
      col: ['Player', 'Dart', 'Weight'],
    },
    title: '{name} darts: weight, barrel and specs',
    description:
      'Which darts does {name} throw? The {model}: {w} g, {L} mm, {shape} barrel, {t}% tungsten. Does it fit your hand? Check for free with DartFit.',
    h1: 'Which darts does {name} throw?',
    answerExact:
      '{name} throws the {model}: {w} g, {L} mm long and {D} mm thick, a {shape} barrel in {t}% tungsten.',
    answerSignature:
      '{name}’s signature dart is the {model}: {w} g, {L} mm long and {D} mm thick, a {shape} barrel in {t}% tungsten.',
    answerPlaying: 'According to {src}, {name} plays with {pw} g.',
    answerFit:
      'Whether it suits you depends on your hand and grip; DartFit compares it with your hand for free.',
    specsH2: 'Specs of the {model}',
    specs: {
      weight: 'Weight',
      length: 'Barrel length',
      diameter: 'Thickness',
      shape: 'Shape',
      tungsten: 'Tungsten',
      grip: 'Grip (1–5)',
      balance: 'Balance',
    },
    suitsH2: 'Who does {name}’s dart suit?',
    suits: {
      hold: {
        straight: 'A straight barrel suits a grip in the middle and long fingers.',
        torpedo: 'A torpedo puts the weight forward and suits a grip at the front.',
        tapered: 'A tapered barrel leaves room at the back and suits a rear grip.',
        bomb: 'A bomb suits a compact grip with short fingers.',
        scalloped: 'The scalloped waist gives your fingers a fixed spot.',
      },
      fingers: {
        short: 'At {L} mm it is short: comfortable with two or three fingers on the barrel.',
        mid: 'At {L} mm it is a medium length: room for three fingers.',
        long: 'At {L} mm it is long: room for three or four fingers.',
      },
      thick: {
        slim: 'At {D} mm it is slim, which suits slender hands and a light grip.',
        mid: 'At {D} mm it is a medium thickness.',
        chunky: 'At {D} mm it is thick, which suits broad hands.',
      },
    },
    similarH2: 'Darts like the {model}',
    similarIntro: 'The closest darts in the DartFit catalogue by weight, length, thickness and shape:',
    fitH2: 'Does {name}’s dart fit me?',
    fitP: 'A pro picks a dart around their own grip, so the right dart for you is the one that fits your hand. DartFit measures your hand next to a bank card, asks five questions and shows the darts that fit you best, and which pro throws the same type of dart as you.',
    faq: [
      ['How heavy is {name}’s dart?', 'The {model} weighs {w} g.'],
      [
        'What darts does {name} use?',
        '{name}’s dart is the {model}, a {shape} barrel of {L} mm in {t}% tungsten.',
      ],
      [
        'Should I buy the same darts as {name}?',
        'Only if they fit your hand and grip. Check with DartFit first: it compares the {model} with your own hand.',
      ],
    ],
    shapes: {
      straight: 'straight',
      torpedo: 'torpedo',
      tapered: 'tapered',
      bomb: 'bomb',
      scalloped: 'scalloped',
    },
    balance: { front: 'front-weighted', centre: 'centre', rear: 'rear-weighted' },
  },
  nl: {
    slug: 'profs',
    index: {
      title: 'Welke darts gooien de profs? Gewichten en barrels',
      description:
        'De darts van {n} profs: gewicht, lengte, barrelvorm en tungsten van elke signature-dart, en of die dart bij jouw hand zou passen.',
      h1: 'Welke darts gooien de profs?',
      answer:
        'De signature-darts van de {n} profs hieronder wegen tussen {minW} en {maxW} gram; de meeste zijn rechte barrels van 90% tungsten. De dart van een prof is gebouwd rond diens eigen grip, dus hij past alleen bij jou als je hand en grip erop lijken. DartFit vertelt je welke prof hetzelfde type dart gooit als jij.',
      col: ['Speler', 'Dart', 'Gewicht'],
    },
    title: 'Darts van {name}: gewicht, barrel en specificaties',
    description:
      'Welke darts gooit {name}? De {model}: {w} gram, {L} mm, {shape} barrel, {t}% tungsten. Past hij bij jouw hand? Check het gratis met DartFit.',
    h1: 'Welke darts gooit {name}?',
    answerExact:
      '{name} gooit de {model}: {w} gram, {L} mm lang en {D} mm dik, een {shape} barrel van {t}% tungsten.',
    answerSignature:
      'De signature-dart van {name} is de {model}: {w} gram, {L} mm lang en {D} mm dik, een {shape} barrel van {t}% tungsten.',
    answerPlaying: 'Volgens {src} gooit {name} zelf met {pw} gram.',
    answerFit:
      'Of hij bij jou past, hangt af van je hand en grip; DartFit vergelijkt hem gratis met jouw hand.',
    specsH2: 'Specificaties van de {model}',
    specs: {
      weight: 'Gewicht',
      length: 'Lengte barrel',
      diameter: 'Dikte',
      shape: 'Vorm',
      tungsten: 'Tungsten',
      grip: 'Grip (1–5)',
      balance: 'Balans',
    },
    suitsH2: 'Voor wie is de dart van {name} geschikt?',
    suits: {
      hold: {
        straight: 'Een rechte barrel past bij een grip in het midden en lange vingers.',
        torpedo: 'Een torpedo legt het gewicht naar voren en past bij een grip voorin.',
        tapered: 'Een tapse barrel laat achterin ruimte en past bij een grip achterin.',
        bomb: 'Een bomb past bij een compacte grip met korte vingers.',
        scalloped: 'De taille van een scalloped barrel geeft je vingers een vaste plek.',
      },
      fingers: {
        short: 'Met {L} mm is hij kort: prettig met twee of drie vingers op de barrel.',
        mid: 'Met {L} mm is hij gemiddeld lang: ruimte voor drie vingers.',
        long: 'Met {L} mm is hij lang: ruimte voor drie of vier vingers.',
      },
      thick: {
        slim: 'Met {D} mm is hij slank, en dat past bij smalle handen en een lichte grip.',
        mid: 'Met {D} mm is hij gemiddeld dik.',
        chunky: 'Met {D} mm is hij dik, en dat past bij brede handen.',
      },
    },
    similarH2: 'Darts die op de {model} lijken',
    similarIntro:
      'De darts in de DartFit-catalogus die er qua gewicht, lengte, dikte en vorm het dichtst bij komen:',
    fitH2: 'Past de dart van {name} bij mij?',
    fitP: 'Een prof kiest een dart rond de eigen grip, dus de juiste dart voor jou is de dart die bij jouw hand past. DartFit meet je hand naast een pasje, stelt vijf vragen en laat zien welke darts het best bij je passen, en welke prof hetzelfde type dart gooit als jij.',
    faq: [
      ['Hoe zwaar is de dart van {name}?', 'De {model} weegt {w} gram.'],
      [
        'Welke darts gebruikt {name}?',
        'De dart van {name} is de {model}, een {shape} barrel van {L} mm in {t}% tungsten.',
      ],
      [
        'Moet ik dezelfde darts kopen als {name}?',
        'Alleen als ze bij je hand en grip passen. Check het eerst met DartFit: die vergelijkt de {model} met jouw hand.',
      ],
    ],
    shapes: {
      straight: 'rechte',
      torpedo: 'torpedo',
      tapered: 'tapse',
      bomb: 'bomb',
      scalloped: 'scalloped',
    },
    balance: { front: 'voorzwaar', centre: 'midden', rear: 'achterzwaar' },
  },
  de: {
    slug: 'profis',
    index: {
      title: 'Welche Darts werfen die Profis? Gewichte und Barrels',
      description:
        'Die Darts von {n} Profis: Gewicht, Länge, Barrelform und Wolframanteil jedes Signature-Darts, und ob dieser Dart zu deiner Hand passen würde.',
      h1: 'Welche Darts werfen die Profis?',
      answer:
        'Die Signature-Darts der {n} Profis unten wiegen zwischen {minW} und {maxW} Gramm; die meisten sind gerade Barrels aus 90% Wolfram. Der Dart eines Profis ist um den eigenen Griff gebaut, deshalb passt er zu dir nur, wenn deine Hand und dein Griff ähnlich sind. DartFit sagt dir, welcher Profi denselben Typ Dart wirft wie du.',
      col: ['Spieler', 'Dart', 'Gewicht'],
    },
    title: 'Darts von {name}: Gewicht, Barrel und Daten',
    description:
      'Welche Darts wirft {name}? Der {model}: {w} Gramm, {L} mm, {shape} Barrel, {t}% Wolfram. Passt er zu deiner Hand? Kostenlos prüfen mit DartFit.',
    h1: 'Welche Darts wirft {name}?',
    answerExact:
      '{name} wirft den {model}: {w} Gramm, {L} mm lang und {D} mm dick, ein {shape} Barrel aus {t}% Wolfram.',
    answerSignature:
      'Der Signature-Dart von {name} ist der {model}: {w} Gramm, {L} mm lang und {D} mm dick, ein {shape} Barrel aus {t}% Wolfram.',
    answerPlaying: 'Laut {src} spielt {name} selbst mit {pw} Gramm.',
    answerFit:
      'Ob er zu dir passt, hängt von deiner Hand und deinem Griff ab; DartFit vergleicht ihn kostenlos mit deiner Hand.',
    specsH2: 'Daten des {model}',
    specs: {
      weight: 'Gewicht',
      length: 'Barrellänge',
      diameter: 'Dicke',
      shape: 'Form',
      tungsten: 'Wolfram',
      grip: 'Grip (1–5)',
      balance: 'Balance',
    },
    suitsH2: 'Für wen eignet sich der Dart von {name}?',
    suits: {
      hold: {
        straight: 'Ein gerader Barrel passt zu einem Griff in der Mitte und langen Fingern.',
        torpedo: 'Ein Torpedo legt das Gewicht nach vorne und passt zu einem Griff vorne.',
        tapered: 'Ein konischer Barrel lässt hinten Platz und passt zu einem Griff hinten.',
        bomb: 'Eine Bomb passt zu einem kompakten Griff mit kurzen Fingern.',
        scalloped: 'Die Taille eines Scalloped-Barrels gibt deinen Fingern eine feste Stelle.',
      },
      fingers: {
        short: 'Mit {L} mm ist er kurz: angenehm mit zwei oder drei Fingern am Barrel.',
        mid: 'Mit {L} mm ist er mittellang: Platz für drei Finger.',
        long: 'Mit {L} mm ist er lang: Platz für drei oder vier Finger.',
      },
      thick: {
        slim: 'Mit {D} mm ist er schlank, was zu schmalen Händen und einem leichten Griff passt.',
        mid: 'Mit {D} mm ist er mitteldick.',
        chunky: 'Mit {D} mm ist er dick, was zu breiten Händen passt.',
      },
    },
    similarH2: 'Darts wie der {model}',
    similarIntro: 'Die Darts im DartFit-Katalog, die nach Gewicht, Länge, Dicke und Form am nächsten kommen:',
    fitH2: 'Passt der Dart von {name} zu mir?',
    fitP: 'Profis wählen ihren Dart um den eigenen Griff, deshalb ist der richtige Dart für dich der, der zu deiner Hand passt. DartFit misst deine Hand neben einer Bankkarte, stellt fünf Fragen und zeigt, welche Darts am besten zu dir passen, und welcher Profi denselben Typ Dart wirft wie du.',
    faq: [
      ['Wie schwer ist der Dart von {name}?', 'Der {model} wiegt {w} Gramm.'],
      [
        'Welche Darts benutzt {name}?',
        'Der Dart von {name} ist der {model}, ein {shape} Barrel mit {L} mm aus {t}% Wolfram.',
      ],
      [
        'Soll ich dieselben Darts kaufen wie {name}?',
        'Nur wenn sie zu deiner Hand und deinem Griff passen. Prüf es zuerst mit DartFit: Es vergleicht den {model} mit deiner Hand.',
      ],
    ],
    shapes: {
      straight: 'gerader',
      torpedo: 'Torpedo-',
      tapered: 'konischer',
      bomb: 'Bomb-',
      scalloped: 'Scalloped-',
    },
    balance: { front: 'frontlastig', centre: 'mittig', rear: 'hecklastig' },
  },
};
