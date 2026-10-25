/**
 * Three topic guides per language (barrel shapes, grip, tungsten), kept apart from the main
 * content files so each stays readable.
 */
import type { Lang, Page } from './types';

export const TOPICS: Record<Lang, Page[]> = {
  en: [
    {
      key: 'shapes',
      slug: 'barrel-shapes-explained',
      title: 'Dart barrel shapes explained: torpedo, straight, bomb',
      description:
        'Straight, torpedo, bomb, tapered or scalloped: what each dart barrel shape does, where the weight sits and which grip it suits. With catalogue data.',
      h1: 'Dart barrel shapes explained',
      answer:
        'A barrel’s shape decides where its weight sits under your fingers. Straight barrels spread it evenly and suit a middle grip; torpedoes put it at the front for a front grip; tapered barrels thin towards the back for a rear grip; a bomb has one fat point for a compact grip with short fingers; scalloped barrels add a waist to give your fingers a fixed spot. {straightPct} of the darts in the DartFit catalogue are straight.',
      sections: [
        {
          h2: 'What is a straight barrel?',
          p: [
            'The same thickness from front to back, so the weight is spread evenly and the balance point is in the middle. It is the most common shape and the easiest to start with: it forgives a grip that moves a little. Long fingers that spread along the barrel feel at home on it.',
          ],
        },
        {
          h2: 'What is a torpedo barrel?',
          p: [
            'Thickest towards the front and tapering to the back. The weight sits forward, which suits players who hold the dart near the front and like it to pull towards the board.',
          ],
        },
        {
          h2: 'What is a bomb barrel?',
          p: [
            'One fat point in the middle, thinner towards both ends. It gives a compact grip a clear place to hold, which suits short fingers for the palm. Bombs are rare: only a handful of darts in our catalogue have this shape.',
          ],
        },
        {
          h2: 'What is a tapered barrel?',
          p: [
            'Thick at the front and thinning steadily to the back, longer and slimmer than a torpedo. It suits players who hold the dart further back, because the thin rear leaves room for the fingers.',
          ],
        },
        {
          h2: 'What is a scalloped barrel?',
          p: [
            'A mostly straight barrel with a narrower waist or concave section. The waist is a fixed spot that your fingers find without looking.',
          ],
        },
        {
          h2: 'Which barrel shape suits me?',
          list: [
            'Hold at the front: torpedo, or a front-weighted barrel.',
            'Hold in the middle: straight.',
            'Hold at the back: tapered.',
            'Compact grip, short fingers: bomb or torpedo.',
            'Long fingers spread along the barrel: straight.',
          ],
          after: [
            'DartFit combines your hold with your measured hand and draws your ideal barrel, labelled with the nearest of these shapes.',
          ],
        },
      ],
      faq: [
        [
          'Which barrel shape is best?',
          'None is best for everyone. The best shape puts the weight where your fingers are: torpedo for a front grip, straight for the middle, tapered for the back.',
        ],
        [
          'Torpedo or straight barrel?',
          'Torpedo if you hold the dart at the front and want the weight forward; straight if you hold it in the middle or are still finding your grip.',
        ],
        [
          'Are bomb barrels good for beginners?',
          'They suit a compact grip with short fingers. Most beginners do better on a straight barrel until their grip settles.',
        ],
      ],
    },
    {
      key: 'grip',
      slug: 'dart-grip-knurling',
      title: 'Dart grip and knurling: how much grip do you need?',
      description:
        'Smooth, ringed or knurled: how much grip your darts need depends on your skin and release. How to choose, and what too much or too little grip does.',
      h1: 'How much grip should my darts have?',
      answer:
        'Enough that the dart does not slip, and no more: too little grip and the dart slides as you release, too much and it sticks to your fingers or wears your skin. Dry hands usually need more grip, as do players who throw hard. DartFit rates grip from 1 (smooth) to 5 (very grippy) and matches it to your preference.',
      sections: [
        {
          h2: 'What is knurling on a dart?',
          p: [
            'Knurling is the pattern cut into the barrel: rings, grooves, cross-hatching or fine micro-grip. Deeper and sharper cuts grip more. The cuts also remove metal, so a heavily machined barrel is a little lighter than a smooth one of the same size.',
          ],
        },
        {
          h2: 'How do I know if I need more grip?',
          list: [
            'The dart slides forward in your fingers at release: more grip.',
            'You squeeze harder than you would like to hold it: more grip.',
            'The dart sticks or drags off your fingertips: less grip.',
            'Your fingertips are sore after a session: less grip.',
          ],
        },
        {
          h2: 'Does grip have to be the same along the barrel?',
          p: [
            'No. Many barrels have grip only where the fingers go and smooth sections elsewhere. If you hold the dart at the front, grip at the front matters most.',
          ],
        },
      ],
      faq: [
        [
          'Are smooth darts better?',
          'Only if your fingers hold them without slipping. Most players like a medium grip; smooth suits a light, relaxed grip.',
        ],
        [
          'Do sweaty hands need more grip?',
          'Often, yes; a dart grip wax or a slightly rougher barrel helps. Too sharp a barrel can still stick, so go one step at a time.',
        ],
      ],
    },
    {
      key: 'tungsten',
      slug: 'tungsten-percentage-darts',
      title: '80, 90 or 95% tungsten darts: what is the difference?',
      description:
        'What the tungsten percentage of a dart changes: a slimmer barrel at the same weight. 90% versus 95% versus brass, with densities and catalogue data.',
      h1: '80, 90 or 95% tungsten: what is the difference?',
      answer:
        'The tungsten percentage changes how dense the barrel is, and so how slim it can be at the same weight. At the same weight and length, a 95% barrel is about 3% thinner than a 90% one, and a brass barrel is about 40% thicker. 90% is the standard ({w90Pct} of the DartFit catalogue); 95% is worth it for heavy darts that you want to keep slim.',
      sections: [
        {
          h2: 'How dense is a tungsten dart?',
          table: {
            caption: 'Densities DartFit uses for its barrel model (g/cm³, ASTM B777 tungsten alloys)',
            head: ['Material', 'Density'],
            rows: [
              ['80% tungsten', '15.05'],
              ['90% tungsten', '17.05'],
              ['95% tungsten', '18.05'],
              ['Brass', '8.5'],
            ],
          },
          after: [
            'Weight is volume times density. For the same weight and length, the barrel’s thickness scales with one over the square root of the density, which is where the 3% and 40% come from.',
          ],
        },
        {
          h2: 'Is 95% tungsten worth it?',
          p: [
            'For heavy darts, yes: a 26 g dart in 95% stays slim enough for most grips. For a 22 g dart the difference is small, and 90% is usually the better buy. {w95Pct} of our catalogue is 95% tungsten.',
          ],
        },
        {
          h2: 'Are brass darts bad?',
          p: [
            'Not bad, just thick and usually light. They are cheap and fine to try the game, but at a normal steel-tip weight the barrel gets fat. Most players move to tungsten quickly.',
          ],
        },
      ],
      faq: [
        [
          'What tungsten percentage should I buy?',
          '90% for almost everyone. Choose 95% if you want a heavy dart that stays slim.',
        ],
        [
          'Does more tungsten make a dart better?',
          'It makes it slimmer at the same weight, and usually more expensive. It does not change how the dart flies beyond that.',
        ],
      ],
    },
  ],
  nl: [
    {
      key: 'shapes',
      slug: 'barrelvormen-uitgelegd',
      title: 'Barrelvormen uitgelegd: torpedo, recht, bomb en taps',
      description:
        'Recht, torpedo, bomb, taps of scalloped: wat elke barrelvorm doet, waar het gewicht zit en bij welke grip hij past. Met data uit onze catalogus.',
      h1: 'Barrelvormen van darts uitgelegd',
      answer:
        'De vorm van een barrel bepaalt waar het gewicht onder je vingers zit. Een rechte barrel verdeelt het gelijk en past bij een grip in het midden; een torpedo legt het voorin voor een grip voorin; een tapse barrel loopt dunner naar achteren voor een grip achterin; een bomb heeft één dik punt voor een compacte grip met korte vingers; een scalloped barrel heeft een taille die je vingers een vaste plek geeft. {straightPct} van de darts in de DartFit-catalogus is recht.',
      sections: [
        {
          h2: 'Wat is een rechte barrel?',
          p: [
            'Van voor tot achter even dik, dus het gewicht is gelijk verdeeld en het zwaartepunt zit in het midden. Het is de meest voorkomende vorm en de makkelijkste om mee te beginnen: hij vergeeft een grip die een beetje verschuift. Lange vingers die zich over de barrel spreiden, voelen zich er thuis.',
          ],
        },
        {
          h2: 'Wat is een torpedo barrel?',
          p: [
            'Het dikst naar voren en smaller naar achteren. Het gewicht zit voorin, en dat past bij spelers die de dart voorin vasthouden en willen dat hij naar het bord trekt.',
          ],
        },
        {
          h2: 'Wat is een bomb barrel?',
          p: [
            'Eén dik punt in het midden, dunner naar beide kanten. Het geeft een compacte grip een duidelijke plek, en dat past bij korte vingers voor je handpalm. Bombs zijn zeldzaam: maar een handvol darts in onze catalogus heeft deze vorm.',
          ],
        },
        {
          h2: 'Wat is een tapse barrel?',
          p: [
            'Dik voorin en geleidelijk dunner naar achteren, langer en slanker dan een torpedo. Hij past bij spelers die de dart verder naar achteren vasthouden, want de dunne achterkant laat ruimte voor je vingers.',
          ],
        },
        {
          h2: 'Wat is een scalloped barrel?',
          p: [
            'Een grotendeels rechte barrel met een smallere taille of een holle zone. Die taille is een vaste plek die je vingers zonder kijken vinden.',
          ],
        },
        {
          h2: 'Welke barrelvorm past bij mij?',
          list: [
            'Grip voorin: torpedo, of een barrel die voorzwaar is.',
            'Grip in het midden: recht.',
            'Grip achterin: taps.',
            'Compacte grip, korte vingers: bomb of torpedo.',
            'Lange vingers over de barrel: recht.',
          ],
          after: [
            'DartFit combineert je grip met je gemeten hand en tekent je ideale barrel, met de vorm die er het dichtst bij komt.',
          ],
        },
      ],
      faq: [
        [
          'Welke barrelvorm is het beste?',
          'Geen enkele is voor iedereen het beste. De beste vorm legt het gewicht waar je vingers zitten: torpedo bij een grip voorin, recht in het midden, taps achterin.',
        ],
        [
          'Torpedo of rechte barrel?',
          'Torpedo als je de dart voorin vasthoudt en het gewicht naar voren wilt; recht als je hem in het midden vasthoudt of je grip nog zoekt.',
        ],
        [
          'Zijn bomb barrels goed voor beginners?',
          'Ze passen bij een compacte grip met korte vingers. De meeste beginners doen het beter met een rechte barrel tot hun grip vastligt.',
        ],
      ],
    },
    {
      key: 'grip',
      slug: 'grip-en-knurling',
      title: 'Grip en knurling van darts: hoeveel grip heb je nodig?',
      description:
        'Glad, met ringen of geknurld: hoeveel grip je darts nodig hebben hangt af van je huid en je release. Zo kies je, en dit doet te veel of te weinig grip.',
      h1: 'Hoeveel grip moeten mijn darts hebben?',
      answer:
        'Genoeg dat de dart niet glipt, en niet meer: te weinig grip en de dart schuift weg bij het loslaten, te veel en hij blijft aan je vingers hangen of schuurt je huid. Droge handen hebben meestal meer grip nodig, net als spelers die hard gooien. DartFit geeft grip een cijfer van 1 (glad) tot 5 (heel ruw) en zoekt darts bij wat jij fijn vindt.',
      sections: [
        {
          h2: 'Wat is knurling op een dart?',
          p: [
            'Knurling is het patroon dat in de barrel is gefreesd: ringen, groeven, ruitjes of fijne micro-grip. Diepere en scherpere sneden geven meer grip. Ze halen ook metaal weg, dus een zwaar bewerkte barrel is iets lichter dan een gladde van hetzelfde formaat.',
          ],
        },
        {
          h2: 'Hoe weet ik of ik meer grip nodig heb?',
          list: [
            'De dart schuift naar voren in je vingers bij het loslaten: meer grip.',
            'Je knijpt harder dan je wilt om hem vast te houden: meer grip.',
            'De dart blijft hangen of sleept van je vingertoppen: minder grip.',
            'Je vingertoppen doen pijn na een avond: minder grip.',
          ],
        },
        {
          h2: 'Moet de grip over de hele barrel hetzelfde zijn?',
          p: [
            'Nee. Veel barrels hebben alleen grip waar je vingers zitten en zijn elders glad. Houd je de dart voorin vast, dan telt de grip voorin het meest.',
          ],
        },
      ],
      faq: [
        [
          'Zijn gladde darts beter?',
          'Alleen als je vingers ze vasthouden zonder te glippen. De meeste spelers houden van een gemiddelde grip; glad past bij een lichte, ontspannen grip.',
        ],
        [
          'Hebben zweterige handen meer grip nodig?',
          'Vaak wel; grip-wax of een iets ruwere barrel helpt. Een te scherpe barrel kan nog steeds blijven hangen, dus ga stap voor stap.',
        ],
      ],
    },
    {
      key: 'tungsten',
      slug: 'tungsten-percentage',
      title: '80, 90 of 95% tungsten darts: wat is het verschil?',
      description:
        'Wat het tungstenpercentage van een dart verandert: een slankere barrel bij hetzelfde gewicht. 90% tegen 95% tegen messing, met dichtheden en data.',
      h1: '80, 90 of 95% tungsten: wat is het verschil?',
      answer:
        'Het tungstenpercentage bepaalt hoe zwaar de barrel is voor zijn formaat, en dus hoe slank hij kan zijn bij hetzelfde gewicht. Bij hetzelfde gewicht en dezelfde lengte is een barrel van 95% ongeveer 3% dunner dan een van 90%, en een messing barrel ongeveer 40% dikker. 90% is de standaard ({w90Pct} van de DartFit-catalogus); 95% loont bij zware darts die je slank wilt houden.',
      sections: [
        {
          h2: 'Hoe zwaar is tungsten?',
          table: {
            caption:
              'Dichtheden in het barrelmodel van DartFit (g/cm³, tungstenlegeringen volgens ASTM B777)',
            head: ['Materiaal', 'Dichtheid'],
            rows: [
              ['80% tungsten', '15,05'],
              ['90% tungsten', '17,05'],
              ['95% tungsten', '18,05'],
              ['Messing', '8,5'],
            ],
          },
          after: [
            'Gewicht is volume maal dichtheid. Bij hetzelfde gewicht en dezelfde lengte schaalt de dikte van de barrel met één gedeeld door de wortel van de dichtheid; daar komen die 3% en 40% vandaan.',
          ],
        },
        {
          h2: 'Is 95% tungsten het waard?',
          p: [
            'Bij zware darts wel: een dart van 26 gram in 95% blijft slank genoeg voor de meeste grips. Bij een dart van 22 gram is het verschil klein en is 90% meestal de betere koop. {w95Pct} van onze catalogus is 95% tungsten.',
          ],
        },
        {
          h2: 'Zijn messing darts slecht?',
          p: [
            'Niet slecht, wel dik en meestal licht. Ze zijn goedkoop en prima om het spel te proberen, maar op een normaal steeltip-gewicht wordt de barrel dik. De meeste spelers stappen snel over op tungsten.',
          ],
        },
      ],
      faq: [
        [
          'Welk tungstenpercentage moet ik kopen?',
          '90% voor bijna iedereen. Kies 95% als je een zware dart wilt die slank blijft.',
        ],
        [
          'Maakt meer tungsten een dart beter?',
          'Hij wordt slanker bij hetzelfde gewicht, en meestal duurder. Verder verandert het niets aan hoe de dart vliegt.',
        ],
      ],
    },
  ],
  de: [
    {
      key: 'shapes',
      slug: 'barrelformen-erklaert',
      title: 'Barrelformen erklärt: Torpedo, gerade, Bomb, konisch',
      description:
        'Gerade, Torpedo, Bomb, konisch oder scalloped: was jede Barrelform bewirkt, wo das Gewicht sitzt und zu welchem Griff sie passt. Mit Katalogdaten.',
      h1: 'Barrelformen bei Darts erklärt',
      answer:
        'Die Form eines Barrels bestimmt, wo das Gewicht unter deinen Fingern sitzt. Ein gerader Barrel verteilt es gleichmäßig und passt zu einem Griff in der Mitte; ein Torpedo legt es nach vorne für einen Griff vorne; ein konischer Barrel wird nach hinten dünner für einen Griff hinten; eine Bomb hat einen dicken Punkt für einen kompakten Griff mit kurzen Fingern; ein Scalloped-Barrel hat eine Taille, die deinen Fingern eine feste Stelle gibt. {straightPct} der Darts im DartFit-Katalog sind gerade.',
      sections: [
        {
          h2: 'Was ist ein gerader Barrel?',
          p: [
            'Von vorne bis hinten gleich dick, also ist das Gewicht gleichmäßig verteilt und der Schwerpunkt liegt in der Mitte. Es ist die häufigste Form und die einfachste für den Anfang: Sie verzeiht einen Griff, der etwas wandert. Lange Finger, die sich über den Barrel verteilen, fühlen sich darauf wohl.',
          ],
        },
        {
          h2: 'Was ist ein Torpedo-Barrel?',
          p: [
            'Vorne am dicksten und nach hinten schmaler. Das Gewicht sitzt vorne, was zu Spielern passt, die den Dart vorne halten und mögen, dass er zum Board zieht.',
          ],
        },
        {
          h2: 'Was ist ein Bomb-Barrel?',
          p: [
            'Ein dicker Punkt in der Mitte, zu beiden Enden dünner. Er gibt einem kompakten Griff eine klare Stelle, was zu kurzen Fingern im Verhältnis zur Handfläche passt. Bombs sind selten: nur eine Handvoll Darts in unserem Katalog hat diese Form.',
          ],
        },
        {
          h2: 'Was ist ein konischer Barrel?',
          p: [
            'Vorne dick und nach hinten gleichmäßig dünner, länger und schlanker als ein Torpedo. Er passt zu Spielern, die den Dart weiter hinten halten, denn das dünne Ende lässt Platz für die Finger.',
          ],
        },
        {
          h2: 'Was ist ein Scalloped-Barrel?',
          p: [
            'Ein überwiegend gerader Barrel mit einer schmaleren Taille oder einer Mulde. Die Taille ist eine feste Stelle, die deine Finger ohne Hinsehen finden.',
          ],
        },
        {
          h2: 'Welche Barrelform passt zu mir?',
          list: [
            'Griff vorne: Torpedo oder ein frontlastiger Barrel.',
            'Griff in der Mitte: gerade.',
            'Griff hinten: konisch.',
            'Kompakter Griff, kurze Finger: Bomb oder Torpedo.',
            'Lange Finger über den Barrel verteilt: gerade.',
          ],
          after: [
            'DartFit verbindet deinen Griff mit deiner gemessenen Hand und zeichnet deinen idealen Barrel, beschriftet mit der nächstliegenden dieser Formen.',
          ],
        },
      ],
      faq: [
        [
          'Welche Barrelform ist die beste?',
          'Keine ist für alle die beste. Die beste Form legt das Gewicht dorthin, wo deine Finger sind: Torpedo bei einem Griff vorne, gerade in der Mitte, konisch hinten.',
        ],
        [
          'Torpedo oder gerader Barrel?',
          'Torpedo, wenn du den Dart vorne hältst und das Gewicht vorne willst; gerade, wenn du ihn in der Mitte hältst oder deinen Griff noch suchst.',
        ],
        [
          'Sind Bomb-Barrels gut für Anfänger?',
          'Sie passen zu einem kompakten Griff mit kurzen Fingern. Die meisten Anfänger kommen mit einem geraden Barrel besser zurecht, bis ihr Griff sitzt.',
        ],
      ],
    },
    {
      key: 'grip',
      slug: 'dart-grip-raendelung',
      title: 'Grip und Rändelung bei Darts: wie viel Grip brauchst du?',
      description:
        'Glatt, mit Ringen oder gerändelt: wie viel Grip deine Darts brauchen, hängt von deiner Haut und deinem Abwurf ab. So wählst du, und was zu viel Grip bewirkt.',
      h1: 'Wie viel Grip sollten meine Darts haben?',
      answer:
        'Genug, dass der Dart nicht rutscht, und nicht mehr: zu wenig Grip und der Dart gleitet beim Abwurf weg, zu viel und er bleibt an den Fingern hängen oder reibt die Haut auf. Trockene Hände brauchen meist mehr Grip, ebenso Spieler, die hart werfen. DartFit bewertet Grip von 1 (glatt) bis 5 (sehr griffig) und gleicht ihn mit deiner Vorliebe ab.',
      sections: [
        {
          h2: 'Was ist die Rändelung eines Darts?',
          p: [
            'Die Rändelung ist das Muster im Barrel: Ringe, Rillen, Kreuzschliff oder feiner Micro-Grip. Tiefere und schärfere Schnitte greifen stärker. Sie tragen auch Metall ab, deshalb ist ein stark bearbeiteter Barrel etwas leichter als ein glatter derselben Größe.',
          ],
        },
        {
          h2: 'Woran merke ich, dass ich mehr Grip brauche?',
          list: [
            'Der Dart rutscht beim Abwurf in deinen Fingern nach vorne: mehr Grip.',
            'Du drückst fester zu, als dir lieb ist: mehr Grip.',
            'Der Dart bleibt hängen oder schleift über die Fingerspitzen: weniger Grip.',
            'Deine Fingerspitzen tun nach einem Abend weh: weniger Grip.',
          ],
        },
        {
          h2: 'Muss der Grip über den ganzen Barrel gleich sein?',
          p: [
            'Nein. Viele Barrels haben nur dort Grip, wo die Finger liegen, und sind sonst glatt. Hältst du den Dart vorne, zählt der Grip vorne am meisten.',
          ],
        },
      ],
      faq: [
        [
          'Sind glatte Darts besser?',
          'Nur wenn deine Finger sie halten, ohne zu rutschen. Die meisten Spieler mögen einen mittleren Grip; glatt passt zu einem leichten, lockeren Griff.',
        ],
        [
          'Brauchen schwitzige Hände mehr Grip?',
          'Oft ja; Grip-Wachs oder ein etwas rauerer Barrel hilft. Ein zu scharfer Barrel kann trotzdem hängen bleiben, also geh Schritt für Schritt vor.',
        ],
      ],
    },
    {
      key: 'tungsten',
      slug: 'wolfram-anteil-darts',
      title: '80, 90 oder 95% Wolfram: was ist der Unterschied?',
      description:
        'Was der Wolframanteil eines Darts verändert: ein schlankerer Barrel bei gleichem Gewicht. 90% gegen 95% gegen Messing, mit Dichten und Katalogdaten.',
      h1: '80, 90 oder 95% Wolfram: was ist der Unterschied?',
      answer:
        'Der Wolframanteil bestimmt, wie dicht der Barrel ist, und damit, wie schlank er bei gleichem Gewicht sein kann. Bei gleichem Gewicht und gleicher Länge ist ein Barrel aus 95% etwa 3% dünner als einer aus 90%, und ein Messingbarrel etwa 40% dicker. 90% ist der Standard ({w90Pct} des DartFit-Katalogs); 95% lohnt sich bei schweren Darts, die schlank bleiben sollen.',
      sections: [
        {
          h2: 'Wie dicht ist ein Wolfram-Dart?',
          table: {
            caption: 'Dichten im Barrel-Modell von DartFit (g/cm³, Wolframlegierungen nach ASTM B777)',
            head: ['Material', 'Dichte'],
            rows: [
              ['80% Wolfram', '15,05'],
              ['90% Wolfram', '17,05'],
              ['95% Wolfram', '18,05'],
              ['Messing', '8,5'],
            ],
          },
          after: [
            'Gewicht ist Volumen mal Dichte. Bei gleichem Gewicht und gleicher Länge skaliert die Dicke des Barrels mit eins durch die Wurzel der Dichte; daher kommen die 3% und 40%.',
          ],
        },
        {
          h2: 'Lohnt sich 95% Wolfram?',
          p: [
            'Bei schweren Darts ja: ein 26-Gramm-Dart aus 95% bleibt für die meisten Griffe schlank genug. Bei einem 22-Gramm-Dart ist der Unterschied klein, und 90% ist meist der bessere Kauf. {w95Pct} unseres Katalogs sind 95% Wolfram.',
          ],
        },
        {
          h2: 'Sind Messingdarts schlecht?',
          p: [
            'Nicht schlecht, aber dick und meist leicht. Sie sind günstig und gut zum Ausprobieren, aber bei einem normalen Steeldart-Gewicht wird der Barrel dick. Die meisten Spieler wechseln schnell zu Wolfram.',
          ],
        },
      ],
      faq: [
        [
          'Welchen Wolframanteil soll ich kaufen?',
          '90% für fast alle. Nimm 95%, wenn du einen schweren Dart willst, der schlank bleibt.',
        ],
        [
          'Macht mehr Wolfram einen Dart besser?',
          'Er wird bei gleichem Gewicht schlanker und meist teurer. Am Flug ändert das darüber hinaus nichts.',
        ],
      ],
    },
  ],
};
