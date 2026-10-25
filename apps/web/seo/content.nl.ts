import type { Site } from './types';

export const nl: Site = {
  lang: 'nl',
  locale: 'nl_NL',
  hub: {
    slug: '',
    title: 'Darts kiezen: gidsen van DartFit',
    description:
      'Welke dart past bij jou? Gidsen over dartgewicht, barrelvorm, grip en hoe DartFit darts bij je hand zoekt. Ook: darts kopen als cadeau.',
    h1: 'Gidsen voor het kiezen van darts',
    intro:
      'Korte, eerlijke gidsen om een dart te vinden die bij je past: welk gewicht, welke barrelvorm bij je grip hoort en hoe DartFit je hand naast een pasje meet om je te matchen met {models} echte dartmodellen.',
  },
  ui: {
    cta: 'Vind mijn dart',
    ctaSub: 'Gratis, ongeveer twee minuten. Meet je hand naast een pasje; de foto blijft op je telefoon.',
    ctaGift: 'Koop je voor iemand anders?',
    related: 'Meer gidsen',
    faq: 'Veelgestelde vragen',
    updated: 'Laatst bijgewerkt',
    home: 'DartFit',
    guides: 'Gidsen',
    disclosure: 'Winkellinks kunnen ons commissie opleveren. Dat verandert de ranglijst nooit.',
    langName: 'Nederlands',
    skip: 'Naar de inhoud',
  },
  pages: [
    {
      key: 'guide',
      slug: 'welke-dart-past-bij-mij',
      title: 'Welke dart past bij mij? Vind een dart die bij je hand past',
      description:
        'Zo vind je een dart die bij je past: gewicht, lengte, dikte, barrelvorm en grip, afgestemd op je hand en hoe je de dart vasthoudt. Gratis met DartFit.',
      h1: 'Welke dart past bij mij?',
      answer:
        'De dart die bij je past, is de dart waarvan het gewicht, de lengte, de dikte, de barrelvorm en de grip passen bij je hand en bij hoe je vasthoudt en gooit. Een goed startpunt voor steeltip is 22 tot 24 gram ({share2224} van de {darts} darts in onze catalogus zit daartussen), een barrel die lang genoeg is voor de vingers waarmee je grijpt, en een vorm die past bij waar je hem vasthoudt. DartFit rekent dit voor je uit: je meet je hand naast een pasje, beantwoordt vijf vragen en krijgt je ideale dart plus de echte darts die er het dichtst bij komen, in drie prijsklassen.',
      sections: [
        {
          h2: 'Wat maakt dat een dart bij je past?',
          p: [
            'Vijf dingen bepalen hoe een dart in je hand ligt. De rest (kleur, merk, de prof op de doos) is smaak.',
          ],
          list: [
            'Gewicht: hoeveel kracht de worp kost en hoe stabiel de dart vliegt. Steeltip darts wegen meestal 18 tot 26 gram; het midden van onze catalogus is {medW} gram.',
            'Lengte: je vingers hebben ruimte nodig. Met twee vingers op de barrel werkt een kortere barrel, met vier wil je een langere. De mediane barrel in onze catalogus is {medL} mm.',
            'Dikte (diameter): een brede hand wil vaak een iets dikkere barrel, een smalle hand een dunnere. De meeste barrels zijn {q25D} tot {q75D} mm.',
            'Barrelvorm: recht, torpedo, bomb, taps of scalloped. De vorm legt het gewicht waar je vingers zitten.',
            'Grip (knurling): van glad tot ruw. Ruwe grip helpt als de dart wegglijdt; te scherp vermoeit je vingers.',
          ],
        },
        {
          h2: 'Hoe vind ik een dart die bij mijn hand past?',
          p: [
            'In een winkel laat een fitter je darts proberen tot er een goed voelt. Dat werkt, maar de meeste mensen kopen online en kunnen niets proberen. DartFit geeft je daarom een goed onderbouwd startpunt:',
          ],
          list: [
            'Meet je hand: leg je hand naast een pasje en je telefoon vindt 21 punten op je hand. Het pasje (85,6 × 53,98 mm) is de liniaal. De foto verlaat je telefoon nooit.',
            'Beantwoord vijf vragen: je lengte, waar je de dart vasthoudt, met hoeveel vingers, hoe hij vliegt en hoeveel grip je fijn vindt.',
            'Zie je ideale dart: gewicht, lengte, dikte, vorm en balans, op schaal getekend.',
            'Vergelijk echte darts: elke dart in de catalogus krijgt een matchscore (pasvorm, stijl en totaal), met de beste match in budget, standaard en premium.',
          ],
        },
        {
          h2: 'Waar je de dart vasthoudt, bepaalt de vorm',
          p: [
            'Wie de dart voorin vasthoudt, wil het gewicht meestal naar voren: een torpedo of een barrel die voorzwaar is. In het midden vasthouden past bij een rechte barrel. Achterin vasthouden past bij een tapse barrel met het gewicht verder naar achteren. Je hand stuurt dit verder bij: korte vingers voor je handpalm en een compacte grip neigen naar een bomb of torpedo, lange vingers die zich over de barrel spreiden naar recht.',
          ],
          table: {
            caption: 'Barrelvormen in de DartFit-catalogus ({darts} steeltip darts)',
            head: ['Vorm', 'Waar het gewicht zit', 'Past bij'],
            rows: [
              [
                'Recht ({straightPct} van de darts)',
                'Gelijk over de barrel',
                'Grip in het midden, lange vingers',
              ],
              ['Torpedo', 'Voorin, smaller naar achteren', 'Grip voorin'],
              ['Bomb', 'Eén dik punt in het midden', 'Compacte grip, korte vingers'],
              ['Taps', 'Voorin, dunner naar achteren', 'Grip achterin'],
              ['Scalloped', 'Recht met een taille voor je vingers', 'Spelers die een vaste plek willen'],
            ],
          },
        },
        {
          h2: 'Welke darts zijn het beste voor beginners?',
          p: [
            'Begin in het midden: ongeveer 22 tot 24 gram, een rechte barrel van rond de 50 mm en een gemiddelde grip, in 90% tungsten. Dat vergeeft veel terwijl je je grip vindt, en de meeste darts zijn daaromheen gebouwd ({w90Pct} van onze catalogus is 90% tungsten). Weet je eenmaal waar je de dart vasthoudt en hoe hij vliegt, dan wijst een fitting je naar iets persoonlijkers.',
          ],
        },
      ],
      faq: [
        [
          'Welke dart past bij mij?',
          'De dart waarvan gewicht, lengte, dikte, vorm en grip passen bij je hand en je grip. DartFit meet je hand naast een pasje, stelt vijf vragen en zet {darts} echte darts op volgorde van hoe goed ze bij je passen.',
        ],
        [
          'Hoe vind ik een dart die bij me past?',
          'Meet je hand naast een pasje met DartFit en beantwoord vijf vragen over je grip en worp. Je krijgt je ideale dart en de echte darts (dartpijlen) die er het best bij passen, per prijsklasse.',
        ],
        [
          'Welke darts moet ik kopen?',
          'Koop darts die bij je hand en grip passen, niet de dart van je favoriete prof. Weet je het niet, begin dan met 22 tot 24 gram, een rechte barrel en 90% tungsten.',
        ],
        [
          'Kan ik een passende dart vinden zonder hem te proberen?',
          'Je kunt dichtbij komen. Een fitting op basis van je handmaat en grip geeft je een korte lijst die past; de laatste keuze is nog steeds hoe hij voelt als je gooit.',
        ],
        [
          'Maakt de grootte van mijn hand uit voor darts?',
          'Ja, vooral voor lengte en dikte: langere vingers willen een langere barrel, een bredere hand vaak een iets dikkere. Op het gewicht heeft je handmaat minder effect.',
        ],
        [
          'Is DartFit gratis?',
          'Ja. De fitting is gratis. Koop je via een winkellink, dan kunnen wij commissie krijgen; dat verandert de ranglijst nooit.',
        ],
        [
          'Wat gebeurt er met de foto van mijn hand?',
          'Niets verlaat je telefoon. Je hand wordt op je toestel herkend en alleen de maten in millimeters worden gebruikt.',
        ],
      ],
    },
    {
      key: 'algorithm',
      slug: 'hoe-werkt-dartfit',
      title: 'Hoe werkt DartFit? Het dart-fitting-algoritme uitgelegd',
      description:
        'Hoe DartFit van een foto van je hand naast een pasje je ideale dart maakt: handmeting, onzekerheid, barrelnatuurkunde en matchscores.',
      h1: 'Hoe het DartFit-algoritme je dart kiest',
      answer:
        'DartFit meet je hand met de camera van je telefoon, met een pasje als liniaal, en combineert die maten met je antwoorden tot een schatting van het gewicht, de lengte en de dikte die bij je passen, elk met een onzekerheid. Een natuurkundig model van een echte barrel (dichtheid van tungsten, boringen, vorm) zorgt dat je ideale dart ook echt gemaakt kan worden. Daarna krijgt elke dart in de catalogus een matchscore ten opzichte van dat ideaal.',
      sections: [
        {
          h2: 'Stap 1: je hand meten',
          p: [
            'Je telefoon herkent 21 punten op je hand (MediaPipe, op je toestel). Een pasje is altijd 85,6 × 53,98 mm (ISO/IEC 7810 ID-1), dus het werkt als liniaal in de foto. DartFit neemt de mediaan van veel beelden en gooit uitschieters weg. Het beeld verlaat je telefoon nooit; alleen de maten in millimeters worden gebruikt.',
            'Geen pasje bij de hand? Je kunt ook zonder scannen; DartFit houdt dan alleen de verhoudingen van je hand over, schat de grootte uit je lengte en zegt erbij dat het minder precies is.',
          ],
        },
        {
          h2: 'Stap 2: van antwoorden naar maten',
          p: [
            'Elke aanwijzing is een schatting met een onzekerheid: je handmaat, waar je de dart vasthoudt, met hoeveel vingers, hoe hij vliegt en hoeveel grip je fijn vindt. DartFit combineert ze op gewicht van hun zekerheid. Het startpunt voor steeltip is 22 gram; je hand en je worp schuiven het van daaruit.',
          ],
          list: [
            'De lengte volgt je vingers: ongeveer 44 mm met twee vingers op de barrel, 48 mm met drie en 52 mm met vier, bijgesteld voor je vingerlengte en waar je vasthoudt.',
            'De dikte volgt je hand: rond de 6,8 mm, iets dikker voor brede handen.',
            'Zonder scan schatten we je hand uit je lengte (een hand is gemiddeld ongeveer 10,75% van je lichaamslengte).',
          ],
        },
        {
          h2: 'Stap 3: natuurkunde, zodat je ideale dart kan bestaan',
          p: [
            'Gewicht, lengte en dikte hangen samen: een barrel is metaal met een dichtheid. DartFit rekent een barrel door met de dichtheid van tungstenlegeringen (ASTM B777), de boringen voor punt en schroefdraad en het profiel. Gekalibreerd op 34 rechte barrels voorspelt het hun opgegeven gewicht binnen ongeveer 7%. Kan je wens niet in 90% tungsten, dan probeert het 95%; darts waarvan het opgegeven gewicht niet bij de maten past, worden niet aangeraden tot ze gecontroleerd zijn.',
          ],
        },
        {
          h2: 'Stap 4: je ideale barrel en zijn vorm',
          p: [
            'DartFit zoekt het profiel (hoe ver voor- en achterkant taps toelopen) dat precies je gewicht haalt en het zwaartepunt legt waar je grip het wil, met een voorkeur voor de vorm die je grip en je hand aangeven: torpedo bij een grip voorin, recht in het midden, taps achterin, bomb bij een compacte grip met korte vingers.',
          ],
        },
        {
          h2: 'Stap 5: de matchscore',
          p: [
            'Elke echte dart krijgt per maat een afstand tot je ideaal, in standaardafwijkingen en gewogen naar hoeveel je het verschil zou voelen. Dat worden drie getallen: pasvorm (gewicht, lengte, dikte), stijl (type barrel, grip, balans) en het totaal. In je resultaat staat het beste totaal per prijsklasse: budget (tot €50), standaard (tot €80) en premium.',
          ],
        },
        {
          h2: 'Wat DartFit niet beweert',
          p: [
            'Er bestaat geen onderzoek dat handmaat omzet in het perfecte dartgewicht. DartFit geeft je een onderbouwd startpunt en een korte lijst om te proberen, met de redenen erbij. Elke vuistregel in het model staat met zijn bron op de methodepagina in de app, en we stellen ze bij met wat spelers ons na hun aankoop vertellen.',
          ],
        },
      ],
      faq: [
        [
          'Hoe nauwkeurig is DartFit?',
          'Het pasje maakt van de foto echte millimeters en DartFit neemt de mediaan van veel beelden; we controleren het tegen handen die met een meetlint zijn gemeten. De barrelnatuurkunde voorspelt opgegeven gewichten binnen ongeveer 7%. De stap van hand naar perfect gewicht is een onderbouwde schatting, geen wet; daarom krijg je een korte lijst.',
        ],
        [
          'Waarom een pasje?',
          'Elk pasje is even groot (85,6 × 53,98 mm), dus daarmee kan een telefoonfoto in echte millimeters meten.',
        ],
        [
          'Welke darts zitten in de catalogus?',
          '{darts} steeltip darts ({models} modellen) van {brands} merken, waaronder Target, Winmau, Red Dragon, Unicorn, Harrows en Bulls.',
        ],
        [
          'Bewaart DartFit mijn foto?',
          'Nee. Je hand wordt op je telefoon herkend en alleen de maten worden gebruikt.',
        ],
      ],
    },
    {
      key: 'why',
      slug: 'waarom-een-passende-dart',
      title: 'Waarom een dart die bij je past beter gooit',
      description:
        'Waarom een dart die bij je hand past helpt: een herhaalbare grip, een schone release en minder vermoeidheid. Wat een slecht passende dart doet.',
      h1: 'Waarom je een dart wilt die bij je past',
      answer:
        'Met een dart die bij je hand past, pak je hem elke worp op dezelfde manier vast, en daar is constant darten op gebouwd. Is de barrel te kort, dan zitten je vingers op elkaar; te lang, en ze schuiven naar de shaft. Te zwaar vermoeit je arm, te licht laat elke kleine fout zien. Een passende dart haalt die variabelen weg, zodat je oefening in je worp gaat en niet in vechten met je dart.',
      sections: [
        {
          h2: 'Wat doet een dart die niet past?',
          list: [
            'Te kort voor je grip: je vingers raken de shaft of de punt, en je grip verschuift van worp tot worp.',
            'Te lang: het gewicht zit weg van je vingers en de dart wiebelt uit je hand.',
            'Te zwaar: je duwt in plaats van gooit, en je arm wordt moe in een lange avond.',
            'Te licht: elke kleine verandering in je release zie je op het bord.',
            'Grip te glad of te scherp: de dart glipt weg, of blijft aan je vingers hangen bij het loslaten.',
          ],
        },
        {
          h2: 'Waarom constant gooien begint bij je grip',
          p: [
            'Darten is één beweging steeds herhalen. Dat lukt alleen als je zonder te kijken elke keer dezelfde grip vindt. Een barrel waarvan de lengte bij je vingers past en waarvan de vorm het gewicht onder je vingers legt, geeft je die vaste plek.',
          ],
        },
        {
          h2: 'Word ik beter met een betere dart?',
          p: [
            'Niet vanzelf. Een passende dart voegt geen talent toe; hij haalt weerstand weg. Spelers merken het vaak als een dart die meteen "goed ligt", waardoor oefenen meer oplevert. Gooi je al jaren met dezelfde darts en voelen ze goed, houd ze dan.',
          ],
        },
        {
          h2: 'Hoe weet ik of mijn darts passen?',
          list: [
            'Je vindt je grip zonder te kijken.',
            'Je vingers zitten op de barrel, niet op de shaft of de punt.',
            'De dart verlaat je hand schoon, zonder te blijven hangen.',
            'Je arm is niet moe na een lange avond.',
          ],
          after: [
            'Klopt een van deze niet, dan is een fitting twee minuten waard. DartFit vergelijkt je hand en grip met {darts} echte darts.',
          ],
        },
      ],
      faq: [
        [
          'Waarom maakt het gewicht van een dart uit?',
          'Het gewicht bepaalt hoeveel kracht de worp kost en hoe stabiel de dart vliegt. Te zwaar vermoeit, te licht laat kleine fouten zien.',
        ],
        [
          'Gooien profs met gefitte darts?',
          'Profs gooien meestal een signature-dart die rond hun eigen grip is gebouwd. DartFit laat zien welke prof hetzelfde type dart gooit als jij.',
        ],
        [
          'Hoe vaak moet ik van dart wisselen?',
          'Alleen als iets niet past: je grip verschuift, de dart glipt of je arm wordt moe. Vaak wisselen maakt het moeilijker om een herhaalbare worp op te bouwen.',
        ],
      ],
    },
    {
      key: 'weight',
      slug: 'welk-gewicht-dart',
      title: 'Welk gewicht dart moet ik nemen? Gids voor steeltip',
      description:
        'Welk dartgewicht kies je: de meeste steeltip darts wegen 20 tot 26 gram. Hoe je worp, grip en hand het juiste gewicht bepalen, met data van {darts} darts.',
      h1: 'Welk gewicht dart moet ik nemen?',
      answer:
        'Begin bij steeltip tussen de 22 en 24 gram: {share2224} van de {darts} darts in de DartFit-catalogus zit daartussen en de mediaan is {medW} gram. Een vlakke, snelle worp past vaak bij een iets zwaardere dart, een worp met een boog bij een iets lichtere. Je huidige dart is de beste aanwijzing: voelt hij te licht of te zwaar, schuif dan ongeveer 2 gram op.',
      sections: [
        {
          h2: 'Hoe zwaar zijn de meeste darts?',
          table: {
            caption: 'Gewichten in de DartFit-catalogus ({darts} steeltip darts)',
            head: ['', 'Gewicht'],
            rows: [
              ['Lichtste', '{minW} g'],
              ['Een kwart van de darts tot', '{q25W} g'],
              ['Mediaan', '{medW} g'],
              ['Driekwart tot', '{q75W} g'],
              ['Zwaarste', '{maxW} g'],
            ],
          },
        },
        {
          h2: 'Wat bepaalt het juiste gewicht voor jou?',
          list: [
            'Hoe de dart vliegt: een vlakke, directe worp past vaak bij iets meer gewicht, een hoge boog bij iets minder.',
            'Je hand: grotere handen kunnen vaak iets meer gewicht aan; het effect is klein.',
            'Je huidige dart: voelt hij te licht of te zwaar, dan moet de volgende ongeveer 2 gram zwaarder of lichter.',
            'Vermoeidheid: wordt je arm moe in lange avonden, kies dan lichter.',
          ],
        },
        {
          h2: 'Zware of lichte darts: wat is beter?',
          p: [
            'Geen van beide. Zwaardere darts vliegen stabieler en vangen kleine fouten op, maar kosten meer kracht. Lichtere darts vragen een preciezere release. Het juiste gewicht is het gewicht dat je de hele avond op dezelfde manier kunt gooien.',
          ],
        },
        {
          h2: 'Waarom het tungstenpercentage uitmaakt',
          p: [
            'Tungsten is heel zwaar voor zijn formaat, dus meer tungsten betekent een slankere barrel bij hetzelfde gewicht. 90% tungsten is de standaard ({w90Pct} van onze catalogus); met 95% blijft een zware dart slank. Messing darts zijn goedkoper, maar veel dikker bij hetzelfde gewicht.',
          ],
        },
      ],
      faq: [
        [
          'Welk gewicht dart is goed voor een beginner?',
          'Ongeveer 22 tot 24 gram bij steeltip. Dat is het midden van de markt en vergeeft veel terwijl je je grip vindt.',
        ],
        [
          'Zijn darts van 18 gram te licht?',
          'Niet als ze bij je worp passen. Lichte darts passen bij een snelle, precieze release; de meeste spelers beginnen zwaarder.',
        ],
        [
          'Wat is het maximale gewicht van een steeltip dart?',
          'Volgens de regels die de meeste toernooien gebruiken mag een steeltip dart tot 50 gram wegen, maar bijna alle darts in de winkel wegen 18 tot 30 gram.',
        ],
      ],
    },
    {
      key: 'gift',
      slug: 'darts-als-cadeau',
      title: 'Darts als cadeau: kiezen zonder zijn hand te meten',
      description:
        'Darts cadeau geven? Kies een set die past op basis van lengte, handtype en hoe hij de dart vasthoudt. Gratis cadeau-fitting met DartFit.',
      h1: 'Darts kopen als cadeau',
      answer:
        'Om darts te kopen die bij iemand anders passen, heb je vier dingen nodig die je waarschijnlijk weet: hoe lang de speler is, of zijn handen lang en slank of kort en stevig zijn, waar hij de dart vasthoudt en hoe die vliegt. DartFit heeft een cadeaustand die precies dit vraagt, zonder handscan, en laat de best passende darts zien in drie prijsklassen.',
      sections: [
        {
          h2: 'Wat moet ik weten over de speler?',
          list: [
            'Lengte: de grootte van een hand volgt de lichaamslengte goed genoeg voor een eerste schatting.',
            'Handtype: lange, slanke handen passen bij een rechtere, slankere barrel; korte, stevige handen bij een bomb of torpedo die iets dikker is.',
            'Waar hij de dart vasthoudt (voorin, midden of achterin), als je dat weet. Weet je het niet, dan is dat ook goed.',
            'Zijn huidige dart, als je stiekem het gewicht op de doos kunt zien.',
          ],
        },
        {
          h2: 'En als ik niet weet hoe hij gooit?',
          p: [
            'Kies "Weet ik niet". DartFit gebruikt dan het meest voorkomende antwoord en laat een veilige keuze in het midden zien. Een rechte barrel van ongeveer 22 tot 24 gram past bij de meeste spelers.',
          ],
        },
        {
          h2: 'Welke prijsklasse is een goed cadeau?',
          p: [
            'DartFit laat de beste match per klasse zien: budget (tot €50), standaard (tot €80) en premium. Standaard is voor de meeste cadeaus de beste keuze: 90% tungsten, slank en duurzaam.',
          ],
        },
      ],
      faq: [
        [
          'Kan ik darts voor iemand kopen zonder zijn hand te meten?',
          'Ja. Met zijn lengte en handtype maakt DartFit een goede schatting; die is minder precies dan een scan, dus kies een gewicht in het midden.',
        ],
        [
          'Welke darts zijn een goed cadeau?',
          'Een set van 90% tungsten van ongeveer 22 tot 24 gram met een rechte of licht torpedovormige barrel past bij de meeste spelers.',
        ],
      ],
    },
  ],
};
