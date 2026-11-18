/**
 * Seven practical guides per language (18 Nov): darts for beginners, shafts and flights, throwing
 * technique, steel tip vs soft tip, barrel length and thickness, care, and hanging a board. They
 * answer what people search for and lead to the fitting. Board and oche measurements match the
 * rules page (WDF playing rules, sourced in events.ts); catalogue numbers are {placeholders}.
 */
import type { Lang, Page } from './types';

export const ARTICLES: Record<Lang, Page[]> = {
  en: [
    {
      key: 'beginners',
      slug: 'best-darts-for-beginners',
      title: 'Best darts for beginners: weight, shape and price',
      description:
        'Which darts should a beginner buy? A sensible starting weight, barrel shape, tungsten and budget, and how to fit your first real set to your own hand.',
      h1: 'Which darts should a beginner buy?',
      answer:
        'Start with a steel-tip set of about 22 to 24 g with a straight barrel of 80 or 90% tungsten, medium shafts and standard flights. That suits most hands and grips while you find your throw; {share2224} of the darts in the DartFit catalogue sit in that weight range. Spend about €30 to €60: cheaper brass darts are thick and bulky, and pricier sets only pay off once your grip has settled.',
      sections: [
        {
          h2: 'What weight should a beginner start with?',
          p: [
            'Most players start between 22 and 24 g. Lighter darts ask for a quicker, more precise arm; heavier ones forgive a shaky release but tire you over a long session. The middle half of our catalogue weighs {q25W} to {q75W} g, so you are in good company.',
          ],
        },
        {
          h2: 'Which barrel shape is easiest to learn with?',
          p: [
            'A straight barrel. It is the same thickness from front to back, so it forgives a grip that still moves while you learn. Once you know where your fingers want to be, a torpedo (front grip) or a tapered barrel (rear grip) may suit you better.',
          ],
        },
        {
          h2: 'Brass, nickel-silver or tungsten?',
          p: [
            'Tungsten is much denser, so a tungsten barrel is slimmer at the same weight and your darts sit closer together in the board. Brass darts are cheap but fat; nickel-silver sits in between. 80 to 90% tungsten is the sweet spot for a first real set: {w90Pct} of our catalogue is 90%.',
          ],
        },
        {
          h2: 'How much should my first darts cost?',
          list: [
            'Under €25: brass or low tungsten, fine to try the game.',
            'About €30 to €60: 80 to 90% tungsten, the best value for most beginners.',
            'Over €80: 95% tungsten, pro models and special finishes, worth it once your grip has settled.',
          ],
        },
        {
          h2: 'What else does a beginner need?',
          list: [
            'Spare flights and shafts: they break, and a bent flight changes how the dart flies.',
            'A sisal (bristle) board hung with the bull at 1.73 m and the oche 2.37 m away.',
            'A checkout chart, to learn which double to leave.',
          ],
        },
        {
          h2: 'When should I fit darts to my hand?',
          p: [
            'Once you have thrown for a few weeks and your grip repeats. Then your hold, the fingers you use and the size of your hand say a lot about the barrel that suits you. DartFit measures your hand next to a bank card and works it out in about two minutes, for free.',
          ],
        },
      ],
      faq: [
        [
          'What weight darts should a beginner use?',
          'About 22 to 24 g. It is the middle of what is sold and suits most throws while you learn.',
        ],
        [
          'Are cheap darts bad for beginners?',
          'Not bad, just bulky: brass darts are thick for their weight. A 90% tungsten set from about €30 is slimmer and lasts longer.',
        ],
        [
          'Should beginners buy a pro player’s darts?',
          'Only if the specs suit you. A pro model is tuned to that player’s grip; compare its weight, length and shape with your own fit first.',
        ],
      ],
    },
    {
      key: 'setup',
      slug: 'dart-shafts-and-flights',
      title: 'Dart shafts and flights explained: length and shape',
      description:
        'Short, medium or long shafts; standard, slim or kite flights: how the back of the dart changes its flight, and how to match it to your barrel and throw.',
      h1: 'Dart shafts and flights explained',
      answer:
        'The shaft and flight steer the back of the dart. A longer shaft or a bigger flight adds drag behind the barrel, so the dart straightens quickly and flies on a higher arc; a shorter shaft or a smaller flight lets it fly faster and flatter but forgives less. Most players start with medium shafts and standard flights and change one thing at a time.',
      sections: [
        {
          h2: 'Which shaft length should I use?',
          list: [
            'Short (about 35 mm): a compact dart for a flat, fast throw; flights clash less in tight groups.',
            'Medium (about 45 to 48 mm): the default, and where most players start.',
            'Long (about 50 mm and up): more steering at the back, for a lob or a dart that wobbles.',
          ],
          after: ['Brands measure differently, so compare millimetres rather than names.'],
        },
        {
          h2: 'Nylon, aluminium, carbon or spinning shafts?',
          p: [
            'Nylon is cheap and light but can snap; aluminium is strong but can bend and work loose; carbon and composite shafts are light and stiff. Spinning shafts let the flight turn when another dart hits it, so fewer darts bounce off. O-rings or shaft rings stop shafts working loose.',
          ],
        },
        {
          h2: 'What do the different flight shapes do?',
          list: [
            'Standard: the biggest area, the most stable, a higher arc.',
            'Kite and pear: a little less area, a touch faster.',
            'Slim: much less drag, for a fast, flat throw with a steady release.',
            'Small standard: compact, for tight groups.',
          ],
        },
        {
          h2: 'How do I match shafts and flights to my barrel?',
          p: [
            'Heavier and front-weighted darts carry themselves and can take smaller flights; light darts and rear grips usually need more area at the back to stay straight. If your darts wobble in the air, add area at the back (a longer shaft or a bigger flight); if they lose speed and drop, take some away.',
          ],
        },
        {
          h2: 'Does DartFit suggest shafts and flights?',
          p: [
            'Yes. Next to your ideal barrel it suggests a shaft length and a flight shape for your hold and throw: the same set-up you see on the dart while you answer the questions.',
          ],
        },
      ],
      faq: [
        [
          'Do longer shafts make darts more stable?',
          'They move the flight further back, which straightens the dart sooner. Too long and it over-corrects and flies on a high arc.',
        ],
        [
          'Which flights do the pros use?',
          'Most use standard or slightly smaller shapes, but it differs per player and per throw; there is no single pro flight.',
        ],
        [
          'How often should I replace flights?',
          'As soon as one is torn, bent or creased: a damaged flight changes how the dart flies.',
        ],
      ],
    },
    {
      key: 'technique',
      slug: 'how-to-throw-darts',
      title: 'How to throw darts better: stance, grip, release',
      description:
        'How to throw darts better: a steady stance, a grip you can repeat, a clean release and a follow-through. Simple checks for beginners and club players.',
      h1: 'How to throw darts better',
      answer:
        'Good darts is repeating the same throw. Stand side-on with your throwing-side foot forward, hold the dart with a grip you can copy every time, keep your upper arm still and move your forearm in one smooth line towards the target. Release at the same point every throw and let your hand follow through.',
      sections: [
        {
          h2: 'How should I stand at the oche?',
          p: [
            'Put your throwing-side foot forward against the oche, with most of your weight on it, and turn your body sideways or at an angle. Stay still while you throw: a lean is fine as long as it is the same every time.',
          ],
        },
        {
          h2: 'How do I hold a dart?',
          p: [
            'Most players use three or four fingers: the thumb under the barrel, one or two fingers on top and the rest resting on the barrel or shaft. Hold it firmly enough to control it and loosely enough that it leaves your hand cleanly. Where you hold it decides which barrel shape suits you.',
          ],
        },
        {
          h2: 'What is the right throwing motion?',
          list: [
            'Aim: line up your eye, the dart and the target.',
            'Draw back: bring the dart back towards your eye; the elbow stays where it is.',
            'Accelerate: one smooth push forward, without a jerk.',
            'Release: let go at the same point every throw, just before your arm is straight.',
            'Follow through: point your hand at the target after the dart has gone.',
          ],
        },
        {
          h2: 'Why do my darts go left, right, high or low?',
          list: [
            'Left or right: the elbow moves sideways, or the wrist turns.',
            'High: a late release, or pushing upwards.',
            'Low: an early release, or the elbow dropping.',
            'All over the board: the grip changes from dart to dart.',
          ],
        },
        {
          h2: 'Does the dart itself make a difference?',
          p: [
            'Yes, once your throw repeats. A dart that is too heavy makes you push, one that is too light makes you snatch, and the wrong shape moves your fingers. A dart that fits your hand lets the same throw land in the same place.',
          ],
        },
      ],
      faq: [
        [
          'Should I flick my wrist when I throw?',
          'A little wrist at the end is natural; a big flick is hard to repeat. Let the forearm do the work.',
        ],
        [
          'Should my elbow move when I throw darts?',
          'Keep the upper arm still. The elbow may rise a little at the end as you follow through.',
        ],
        [
          'How do I aim in darts?',
          'Look at the exact spot you want to hit, not the whole segment, and line the dart up with it before you throw.',
        ],
      ],
    },
    {
      key: 'steelsoft',
      slug: 'steel-tip-vs-soft-tip-darts',
      title: 'Steel-tip vs soft-tip darts: the differences',
      description:
        'Steel tip or soft tip? How the darts, boards, weights and throwing distance differ, which one the televised tours play, and what that means for your first set.',
      h1: 'Steel-tip vs soft-tip darts',
      answer:
        'Steel-tip darts have metal points and are thrown at a sisal board from 2.37 m; it is what the televised PDC and WDF events play. Soft-tip darts have plastic points for electronic boards that keep the score; they are lighter (usually no more than about 18 to 20 g) and the throwing distance is often 2.44 m. DartFit fits steel-tip darts.',
      sections: [
        {
          h2: 'What is the difference between steel tip and soft tip?',
          table: {
            head: ['', 'Steel tip', 'Soft tip'],
            rows: [
              ['Point', 'Steel', 'Plastic'],
              ['Board', 'Sisal (bristle)', 'Electronic, with holes'],
              ['Usual weight', '18 to 30 g (at most 50 g)', '16 to 20 g'],
              ['Throwing distance', '2.37 m', 'Often 2.44 m'],
              ['Scoring', 'By hand or in an app', 'The board counts'],
            ],
          },
        },
        {
          h2: 'Can you use soft-tip darts on a sisal board?',
          p: [
            'Not well: plastic points bend and break in sisal. Some barrels take both kinds of point with a conversion point, but the weight and balance change.',
          ],
        },
        {
          h2: 'Which is better for beginners?',
          p: [
            'Soft tip is fun in a bar or at home on an electronic board that keeps the score. If you want to play in a club or a league, or play the way the pros do, start with steel tip: the darts feel different, and habits carry over.',
          ],
        },
        {
          h2: 'Which do the pros play?',
          p: [
            'The televised tours are steel tip. Soft tip has its own scene and is especially popular in Asia and in bars across Europe.',
          ],
        },
      ],
      faq: [
        [
          'Are soft-tip darts lighter?',
          'Yes, usually 16 to 20 g, because electronic boards and their leagues limit the weight.',
        ],
        [
          'Is the throwing distance the same?',
          'No: steel tip is 2.37 m; soft tip is often 2.44 m, depending on the rules you play by.',
        ],
        [
          'Can I convert steel-tip darts to soft tip?',
          'Some barrels take screw-in soft-tip points, but the weight and balance change; soft-tip darts made for it are lighter.',
        ],
      ],
    },
    {
      key: 'size',
      slug: 'dart-barrel-length-and-thickness',
      title: 'Dart barrel length and thickness: what fits you',
      description:
        'Long or short, slim or thick? What barrel length and diameter do to your grip and grouping, the usual sizes across {darts} darts, and how your hand sets them.',
      h1: 'Dart barrel length and thickness',
      answer:
        'Barrel length decides how much room your fingers get; thickness decides how much there is to hold. The median steel-tip barrel in the DartFit catalogue is {medL} mm long, and the middle half is {q25D} to {q75D} mm thick. Long fingers that spread along the dart suit a longer barrel, a compact grip a shorter one; slimmer barrels group tighter, thicker ones are easier to feel.',
      sections: [
        {
          h2: 'How long should a dart barrel be?',
          p: [
            'Long enough for every finger that touches it. A two-finger front grip is happy on a short barrel; a four-finger grip spread along the dart wants a long one. Too short and your last finger ends up on the shaft; too long and the weight spreads further than your grip.',
          ],
        },
        {
          h2: 'Should I choose a thin or a thick barrel?',
          list: [
            'Slim (under about 6.5 mm): tighter groups and fewer deflections, but it asks for a precise grip.',
            'Medium (about 6.5 to 7.5 mm): the common range.',
            'Thick (over about 7.5 mm): more to hold, comfortable for big hands and for feel.',
          ],
        },
        {
          h2: 'Why are tungsten darts slimmer?',
          p: [
            'Tungsten is more than twice as dense as brass, so the same weight fits in a much thinner barrel. A higher tungsten percentage makes it slimmer still: {w95Pct} of our catalogue is 95%.',
          ],
        },
        {
          h2: 'How do length, thickness and weight relate?',
          p: [
            'They are tied together: in the same material, a longer or thicker barrel is heavier. That is why DartFit calculates the three together, and checks every listing in its catalogue against what its size and alloy can weigh.',
          ],
        },
        {
          h2: 'How does my hand decide?',
          p: [
            'The length of your fingers against your palm tells whether you spread along the barrel or hold it compact; the size of your hand tells how much barrel you can hold. DartFit measures both next to a bank card and draws your ideal barrel in millimetres.',
          ],
        },
      ],
      faq: [
        [
          'How long is an average dart barrel?',
          'About {medL} mm, the median of the {darts} steel-tip darts in the DartFit catalogue.',
        ],
        [
          'Do thin darts group better?',
          'They take up less room in the board, so they block each other less; you do need a grip that does not slip.',
        ],
        [
          'Are long barrels better for long fingers?',
          'Often, yes: long fingers spread along the barrel and want room for each fingertip.',
        ],
      ],
    },
    {
      key: 'care',
      slug: 'dart-maintenance',
      title: 'Dart maintenance: points, grip, shafts and board',
      description:
        'How to look after darts and a dartboard: sharpen points the right way, clean the knurling, stop shafts working loose and rotate the board so it lasts.',
      h1: 'How to look after your darts',
      answer:
        'Keep steel points slightly rounded rather than needle-sharp, clean the grip now and then with a soft brush and a little soapy water, ring or tighten your shafts so they do not work loose, replace flights as soon as they bend, and rotate your sisal board regularly so the 20 does not wear out first.',
      sections: [
        {
          h2: 'Should I sharpen my dart points?',
          p: [
            'Lightly. A point with a fine, slightly rounded tip slides between the sisal fibres; a needle-sharp one can catch and bend, and a blunt or burred one bounces out. Roll the point over a dart sharpener a few times at a shallow angle, and no more.',
          ],
        },
        {
          h2: 'How do I clean the grip on my darts?',
          p: [
            'Unscrew the shafts and points, scrub the barrels with a soft toothbrush in warm water with a drop of washing-up liquid, then rinse and dry them straight away. Skin oil and chalk fill the knurling and make the grip feel smooth.',
          ],
        },
        {
          h2: 'Why do my shafts keep coming loose?',
          p: [
            'The throw and every impact shake them. Use O-rings or shaft rings, tighten them by hand (not with pliers) and check them every session. Aluminium shafts loosen more easily than nylon.',
          ],
        },
        {
          h2: 'When should I replace flights and shafts?',
          p: [
            'Replace flights that are torn, creased or no longer flat, and shafts that are bent or cracked: both change how the dart flies, and they deflect the next dart.',
          ],
        },
        {
          h2: 'How do I make a dartboard last longer?',
          list: [
            'Turn the board every few weeks so the 20 area does not wear first, and put the number ring back with the 20 at the top.',
            'Never soak a sisal board: water swells the fibres and makes it wear faster.',
            'Pull darts straight out with a slight twist, not sideways.',
            'Keep the board out of direct sunlight and away from radiators.',
          ],
        },
      ],
      faq: [
        [
          'How often should I clean my darts?',
          'When the grip starts to feel smooth: for most players every few weeks.',
        ],
        [
          'Should I wet my dartboard?',
          'No. Water swells sisal and makes it wear faster, despite the old advice.',
        ],
        [
          'Why do my darts bounce out?',
          'Worn or burred points, a hard worn patch on the board, or hitting the wire. Smooth the points and turn the board.',
        ],
      ],
    },
    {
      key: 'board',
      slug: 'how-to-hang-a-dartboard',
      title: 'How to hang a dartboard: height and distance',
      description:
        'Hang a dartboard right: 1.73 m to the bull, 2.37 m to the oche, the 2.93 m diagonal check, lighting without shadows, and protecting your wall and floor.',
      h1: 'How to hang a dartboard',
      answer:
        'Hang the board so the centre of the bull is 1.73 m above the floor, with the 20 at the top, and mark the oche 2.37 m from the face of the board. Check it with the diagonal: from the bull to the back of the oche at floor level is 2.93 m. Light the board from the front or from both sides so the darts cast no shadows, and fit a surround to protect the wall.',
      sections: [
        {
          h2: 'How high does a dartboard hang?',
          p: ['1.73 m from the floor to the centre of the bull.'],
        },
        {
          h2: 'Where does the oche go?',
          p: [
            '2.37 m from the face of the board (not from the wall), measured along the floor to the back edge of the throw line. A strip of tape works; a raised oche bar is easier to feel with your foot.',
          ],
        },
        {
          h2: 'How do I mount a dartboard?',
          list: [
            'Fix the bracket to the wall at the height the board’s instructions give, so the bull ends up at 1.73 m.',
            'Hang the board with the 20 at the top.',
            'Check that it hangs level and does not rock.',
            'Measure the diagonal from the bull to the back of the oche: 2.93 m.',
          ],
        },
        {
          h2: 'What lighting does a dartboard need?',
          p: [
            'Light from the front or from both sides, so the darts in the board cast no shadow over the segments. A ring light around the board does exactly that.',
          ],
        },
        {
          h2: 'How do I protect the wall and the floor?',
          p: [
            'A surround (a foam or rubber ring around the board) catches the darts that miss, and a mat at the oche saves the floor and your points.',
          ],
        },
        {
          h2: 'How much room do I need for darts?',
          p: [
            'About 3 m from the wall to the back of where you stand, and about 1.5 m of width, so there is room for the throwing arm and for a second player.',
          ],
        },
      ],
      faq: [
        ['How high should a dartboard be from the floor?', '1.73 m to the centre of the bull.'],
        ['How far do you stand from a dartboard?', '2.37 m from the face of the board to the back of the oche.'],
        [
          'What is the diagonal measurement for a dartboard?',
          '2.93 m from the centre of the bull to the back of the oche at floor level.',
        ],
      ],
    },
  ],

  nl: [
    {
      key: 'beginners',
      slug: 'darts-voor-beginners',
      title: 'Darts voor beginners: welk gewicht, welke vorm?',
      description:
        'Welke darts koop je als beginner? Een goed startgewicht, barrelvorm, tungsten en budget, en hoe je je eerste echte set laat passen bij je eigen hand.',
      h1: 'Welke darts koop je als beginner?',
      answer:
        'Begin met een steeltip-set van ongeveer 22 tot 24 gram met een rechte barrel van 80 of 90% tungsten, medium shafts en standaard flights. Dat past bij de meeste handen en grepen terwijl je je worp vindt; {share2224} van de darts in de DartFit-catalogus zit in dat gewicht. Reken op ongeveer €30 tot €60: goedkopere messing darts zijn dik en grof, en duurdere sets lonen pas als je grip vastligt.',
      sections: [
        {
          h2: 'Met welk gewicht begin je als beginner?',
          p: [
            'De meeste spelers beginnen tussen 22 en 24 gram. Lichtere darts vragen een snellere, preciezere arm; zwaardere vergeven een onrustige release maar worden zwaar in een lange sessie. De middelste helft van onze catalogus weegt {q25W} tot {q75W} gram, dus je zit goed.',
          ],
        },
        {
          h2: 'Met welke barrelvorm leer je het makkelijkst?',
          p: [
            'Met een rechte barrel. Die is van voor tot achter even dik en vergeeft een grip die nog verschuift terwijl je leert. Weet je eenmaal waar je vingers willen zitten, dan past een torpedo (grip voorin) of een taps toelopende barrel (grip achterin) misschien beter.',
          ],
        },
        {
          h2: 'Messing, nikkel-zilver of tungsten?',
          p: [
            'Tungsten is veel zwaarder per volume, dus een tungsten barrel is dunner bij hetzelfde gewicht en je darts zitten dichter bij elkaar in het bord. Messing darts zijn goedkoop maar dik; nikkel-zilver zit ertussenin. 80 tot 90% tungsten is de beste keus voor een eerste echte set: {w90Pct} van onze catalogus is 90%.',
          ],
        },
        {
          h2: 'Hoeveel kosten je eerste darts?',
          list: [
            'Onder €25: messing of weinig tungsten, prima om het spel te proberen.',
            'Ongeveer €30 tot €60: 80 tot 90% tungsten, de beste waarde voor de meeste beginners.',
            'Boven €80: 95% tungsten, prof-modellen en speciale coatings, de moeite waard als je grip vastligt.',
          ],
        },
        {
          h2: 'Wat heb je als beginner nog meer nodig?',
          list: [
            'Reserve-flights en -shafts: ze breken, en een kromme flight verandert hoe de dart vliegt.',
            'Een sisalbord, opgehangen met de bull op 1,73 m en de oche op 2,37 m.',
            'Een uitgooitabel, om te leren welke dubbel je overlaat.',
          ],
        },
        {
          h2: 'Wanneer laat je darts passen bij je hand?',
          p: [
            'Als je een paar weken gooit en je grip zich herhaalt. Dan zeggen je grip, het aantal vingers en de grootte van je hand veel over de barrel die bij je past. DartFit meet je hand naast een pasje en rekent het in ongeveer twee minuten uit, gratis.',
          ],
        },
      ],
      faq: [
        [
          'Welk gewicht darts voor een beginner?',
          'Ongeveer 22 tot 24 gram. Dat is het midden van wat er verkocht wordt en past bij de meeste worpen terwijl je leert.',
        ],
        [
          'Zijn goedkope darts slecht voor beginners?',
          'Niet slecht, wel grof: messing darts zijn dik voor hun gewicht. Een set van 90% tungsten vanaf ongeveer €30 is dunner en gaat langer mee.',
        ],
        [
          'Moet je als beginner de darts van een prof kopen?',
          'Alleen als de maten bij je passen. Een prof-model is afgestemd op de grip van die speler; vergelijk gewicht, lengte en vorm eerst met je eigen fit.',
        ],
      ],
    },
    {
      key: 'setup',
      slug: 'shafts-en-flights',
      title: 'Shafts en flights uitgelegd: lengte en vorm',
      description:
        'Korte, medium of lange shafts; standaard, slim of kite flights: hoe de achterkant van je dart de vlucht verandert, en hoe je die afstemt op barrel en worp.',
      h1: 'Shafts en flights uitgelegd',
      answer:
        'De shaft en de flight sturen de achterkant van de dart. Een langere shaft of een grotere flight geeft meer weerstand achter de barrel, zodat de dart snel rechttrekt en met een hogere boog vliegt; een kortere shaft of kleinere flight vliegt sneller en vlakker maar vergeeft minder. De meeste spelers beginnen met medium shafts en standaard flights en veranderen één ding tegelijk.',
      sections: [
        {
          h2: 'Welke shaftlengte past bij mij?',
          list: [
            'Kort (ongeveer 35 mm): een compacte dart voor een vlakke, snelle worp; flights botsen minder in een strakke groep.',
            'Medium (ongeveer 45 tot 48 mm): de standaard, en waar de meeste spelers beginnen.',
            'Lang (ongeveer 50 mm en meer): meer sturing achterin, voor een boogworp of een dart die slingert.',
          ],
          after: ['Merken meten verschillend, dus vergelijk millimeters in plaats van namen.'],
        },
        {
          h2: 'Nylon, aluminium, carbon of draaiende shafts?',
          p: [
            'Nylon is goedkoop en licht maar kan breken; aluminium is sterk maar kan verbuigen en losdraaien; carbon en composiet zijn licht en stijf. Bij draaiende (spinning) shafts draait de flight weg als een andere dart hem raakt, zodat er minder afketsen. O-ringen of shaftringen voorkomen dat shafts losdraaien.',
          ],
        },
        {
          h2: 'Wat doen de verschillende flightvormen?',
          list: [
            'Standaard: het grootste oppervlak, het stabielst, een hogere boog.',
            'Kite en pear: iets minder oppervlak, iets sneller.',
            'Slim: veel minder weerstand, voor een snelle, vlakke worp met een rustige release.',
            'Small standard: compact, voor strakke groepen.',
          ],
        },
        {
          h2: 'Hoe stem ik shafts en flights af op mijn barrel?',
          p: [
            'Zware en voorlastige darts dragen zichzelf en kunnen kleinere flights hebben; lichte darts en een grip achterin hebben meestal meer oppervlak achterin nodig om recht te blijven. Slingert je dart in de lucht, geef de achterkant dan meer oppervlak (langere shaft of grotere flight); verliest hij snelheid en zakt hij, haal er dan wat af.',
          ],
        },
        {
          h2: 'Raadt DartFit ook shafts en flights aan?',
          p: [
            'Ja. Naast je ideale barrel krijg je een shaftlengte en flightvorm voor je grip en worp: dezelfde opbouw die je op de dart ziet terwijl je de vragen beantwoordt.',
          ],
        },
      ],
      faq: [
        [
          'Maken langere shafts een dart stabieler?',
          'Ze zetten de flight verder naar achteren, zodat de dart eerder rechttrekt. Te lang en hij corrigeert te veel en vliegt met een hoge boog.',
        ],
        [
          'Welke flights gebruiken de profs?',
          'De meesten standaard of iets kleinere vormen, maar het verschilt per speler en per worp; er is niet één prof-flight.',
        ],
        [
          'Hoe vaak vervang je flights?',
          'Zodra er een gescheurd, krom of geknikt is: een beschadigde flight verandert hoe de dart vliegt.',
        ],
      ],
    },
    {
      key: 'technique',
      slug: 'beter-darts-gooien',
      title: 'Beter darts gooien: stand, grip en release',
      description:
        'Zo gooi je beter darts: een stevige stand, een grip die je kunt herhalen, een schone release en doorzwaaien. Simpele checks voor beginners en clubspelers.',
      h1: 'Hoe gooi je beter darts?',
      answer:
        'Goed darten is dezelfde worp herhalen. Sta zijwaarts met je werpvoet voor, houd de dart vast met een grip die je elke keer kunt nadoen, houd je bovenarm stil en beweeg je onderarm in één vloeiende lijn naar het doel. Laat elke worp op hetzelfde punt los en zwaai je hand door.',
      sections: [
        {
          h2: 'Hoe sta je bij de oche?',
          p: [
            'Zet je voet aan de kant van je werphand voor, tegen de oche, met het meeste gewicht erop, en draai je lichaam zijwaarts of schuin. Blijf stil staan terwijl je gooit: een beetje voorover leunen mag, zolang het elke keer hetzelfde is.',
          ],
        },
        {
          h2: 'Hoe houd je een dart vast?',
          p: [
            'De meeste spelers gebruiken drie of vier vingers: de duim onder de barrel, een of twee vingers erop en de rest tegen de barrel of shaft. Houd hem stevig genoeg om hem te sturen en los genoeg dat hij schoon uit je hand gaat. Waar je hem vasthoudt, bepaalt welke barrelvorm bij je past.',
          ],
        },
        {
          h2: 'Wat is de juiste werpbeweging?',
          list: [
            'Richten: oog, dart en doel op één lijn.',
            'Terughalen: breng de dart terug richting je oog; je elleboog blijft waar hij is.',
            'Versnellen: één vloeiende beweging naar voren, zonder ruk.',
            'Loslaten: elke worp op hetzelfde punt, net voordat je arm gestrekt is.',
            'Doorzwaaien: wijs met je hand naar het doel als de dart weg is.',
          ],
        },
        {
          h2: 'Waarom gaan mijn darts links, rechts, hoog of laag?',
          list: [
            'Links of rechts: je elleboog beweegt opzij, of je pols draait.',
            'Hoog: te laat loslaten, of omhoog duwen.',
            'Laag: te vroeg loslaten, of je elleboog zakt.',
            'Overal op het bord: je grip verschilt per dart.',
          ],
        },
        {
          h2: 'Maakt de dart zelf uit?',
          p: [
            'Ja, zodra je worp zich herhaalt. Een te zware dart laat je duwen, een te lichte laat je rukken, en een verkeerde vorm verschuift je vingers. Met een dart die bij je hand past, landt dezelfde worp op dezelfde plek.',
          ],
        },
      ],
      faq: [
        [
          'Moet je je pols gebruiken bij het darten?',
          'Een beetje pols aan het eind is normaal; een grote polsbeweging is lastig te herhalen. Laat je onderarm het werk doen.',
        ],
        [
          'Mag je elleboog bewegen bij het gooien?',
          'Houd je bovenarm stil. Aan het eind mag je elleboog iets omhoog komen als je doorzwaait.',
        ],
        [
          'Hoe richt je bij darts?',
          'Kijk naar het precieze punt dat je wilt raken, niet naar het hele vak, en breng de dart ermee op één lijn voordat je gooit.',
        ],
      ],
    },
    {
      key: 'steelsoft',
      slug: 'steeltip-of-softtip',
      title: 'Steeltip of softtip darts: de verschillen',
      description:
        'Steeltip of softtip? Hoe de darts, borden, gewichten en werpafstand verschillen, wat de profs op tv spelen en wat dat betekent voor je eerste set darts.',
      h1: 'Steeltip of softtip darts?',
      answer:
        'Steeltip darts hebben een stalen punt en gooi je op een sisalbord vanaf 2,37 m; dat spelen de profs op tv bij de PDC en de WDF. Softtip darts hebben een plastic punt voor elektronische borden die zelf de score bijhouden; ze zijn lichter (meestal hooguit 18 tot 20 gram) en de werpafstand is vaak 2,44 m. DartFit zoekt steeltip darts voor je.',
      sections: [
        {
          h2: 'Wat is het verschil tussen steeltip en softtip?',
          table: {
            head: ['', 'Steeltip', 'Softtip'],
            rows: [
              ['Punt', 'Staal', 'Plastic'],
              ['Bord', 'Sisal', 'Elektronisch, met gaatjes'],
              ['Gebruikelijk gewicht', '18 tot 30 g (hooguit 50 g)', '16 tot 20 g'],
              ['Werpafstand', '2,37 m', 'Vaak 2,44 m'],
              ['Score', 'Zelf tellen of met een app', 'Het bord telt'],
            ],
          },
        },
        {
          h2: 'Kun je softtip darts op een sisalbord gooien?',
          p: [
            'Niet goed: plastic punten buigen en breken in sisal. Sommige barrels nemen allebei de punten met een conversiepunt, maar het gewicht en de balans veranderen dan.',
          ],
        },
        {
          h2: 'Wat is beter voor beginners?',
          p: [
            'Softtip is leuk in de kroeg of thuis op een elektronisch bord dat de score bijhoudt. Wil je in een club of competitie spelen, of spelen zoals de profs, begin dan met steeltip: de darts voelen anders, en gewoontes neem je mee.',
          ],
        },
        {
          h2: 'Wat spelen de profs?',
          p: [
            'De toernooien op tv zijn steeltip. Softtip heeft een eigen scene en is vooral populair in Azië en in kroegen in heel Europa.',
          ],
        },
      ],
      faq: [
        [
          'Zijn softtip darts lichter?',
          'Ja, meestal 16 tot 20 gram, omdat elektronische borden en hun competities het gewicht beperken.',
        ],
        [
          'Is de werpafstand hetzelfde?',
          'Nee: bij steeltip 2,37 m, bij softtip vaak 2,44 m, afhankelijk van de regels waarmee je speelt.',
        ],
        [
          'Kun je steeltip darts ombouwen naar softtip?',
          'Sommige barrels nemen schroefpunten voor softtip, maar het gewicht en de balans veranderen; echte softtip darts zijn lichter.',
        ],
      ],
    },
    {
      key: 'size',
      slug: 'dart-lengte-en-dikte',
      title: 'Lengte en dikte van een dart: wat past bij jou?',
      description:
        'Lang of kort, dun of dik? Wat de lengte en dikte van een barrel doen met je grip en je groepering, de gangbare maten van {darts} darts, en hoe je hand ze bepaalt.',
      h1: 'Lengte en dikte van een dart',
      answer:
        'De lengte van de barrel bepaalt hoeveel ruimte je vingers krijgen, de dikte hoeveel je vastpakt. De mediane steeltip-barrel in de DartFit-catalogus is {medL} mm lang, en de middelste helft is {q25D} tot {q75D} mm dik. Lange vingers die zich over de dart spreiden, passen bij een langere barrel, een compacte grip bij een kortere; dunnere barrels groeperen strakker, dikkere voel je beter.',
      sections: [
        {
          h2: 'Hoe lang moet een barrel zijn?',
          p: [
            'Lang genoeg voor elke vinger die hem raakt. Een grip voorin met twee vingers kan prima met een korte barrel; een grip met vier vingers over de hele dart wil een lange. Te kort en je laatste vinger komt op de shaft; te lang en het gewicht zit verder uit elkaar dan je grip.',
          ],
        },
        {
          h2: 'Kies je een dunne of een dikke barrel?',
          list: [
            'Dun (onder ongeveer 6,5 mm): strakkere groepen en minder afketsen, maar je hebt een precieze grip nodig.',
            'Gemiddeld (ongeveer 6,5 tot 7,5 mm): de gangbare maat.',
            'Dik (boven ongeveer 7,5 mm): meer om vast te houden, fijn voor grote handen en voor gevoel.',
          ],
        },
        {
          h2: 'Waarom zijn tungsten darts dunner?',
          p: [
            'Tungsten is ruim twee keer zo zwaar als messing, dus hetzelfde gewicht past in een veel dunnere barrel. Hoe hoger het tungsten-percentage, hoe dunner: {w95Pct} van onze catalogus is 95%.',
          ],
        },
        {
          h2: 'Hoe hangen lengte, dikte en gewicht samen?',
          p: [
            'Ze horen bij elkaar: in hetzelfde materiaal is een langere of dikkere barrel zwaarder. Daarom rekent DartFit de drie samen uit, en controleert het elke dart in de catalogus op wat zijn maat en legering kunnen wegen.',
          ],
        },
        {
          h2: 'Hoe bepaalt je hand het?',
          p: [
            'De lengte van je vingers ten opzichte van je handpalm zegt of je je over de barrel spreidt of compact vasthoudt; de grootte van je hand zegt hoeveel barrel je vastpakt. DartFit meet allebei naast een pasje en tekent je ideale barrel in millimeters.',
          ],
        },
      ],
      faq: [
        [
          'Hoe lang is een gemiddelde barrel?',
          'Ongeveer {medL} mm, het midden van de {darts} steeltip darts in de DartFit-catalogus.',
        ],
        [
          'Groeperen dunne darts beter?',
          'Ze nemen minder ruimte in het bord, dus ze zitten elkaar minder in de weg; je hebt wel een grip nodig die niet wegglijdt.',
        ],
        [
          'Zijn lange barrels beter voor lange vingers?',
          'Vaak wel: lange vingers spreiden zich over de barrel en willen ruimte voor elke vingertop.',
        ],
      ],
    },
    {
      key: 'care',
      slug: 'darts-onderhouden',
      title: 'Darts onderhouden: punten, grip, shafts en bord',
      description:
        'Zo onderhoud je darts en een dartbord: punten goed slijpen, de grip schoonmaken, shafts vast laten zitten en het bord draaien zodat het langer meegaat.',
      h1: 'Hoe onderhoud je je darts?',
      answer:
        'Houd stalen punten licht afgerond in plaats van naaldscherp, maak de grip af en toe schoon met een zacht borsteltje en een beetje zeepwater, zet je shafts vast met ringetjes, vervang flights zodra ze krom zijn, en draai je sisalbord regelmatig zodat de 20 niet als eerste slijt.',
      sections: [
        {
          h2: 'Moet je dartpunten slijpen?',
          p: [
            'Een beetje. Een punt met een fijne, licht afgeronde tip glijdt tussen de sisalvezels; een naaldscherpe kan haken en verbuigen, en een botte of bramige punt stuitert eruit. Rol de punt een paar keer onder een vlakke hoek over een dartslijper, en niet meer.',
          ],
        },
        {
          h2: 'Hoe maak je de grip van je darts schoon?',
          p: [
            'Draai de shafts en punten eraf, borstel de barrels met een zachte tandenborstel in warm water met een druppel afwasmiddel, spoel ze af en droog ze meteen. Huidvet en krijt vullen de grip en maken hem glad.',
          ],
        },
        {
          h2: 'Waarom draaien mijn shafts steeds los?',
          p: [
            'Door de worp en elke inslag. Gebruik O-ringen of shaftringen, draai ze met de hand vast (niet met een tang) en controleer ze elke sessie. Aluminium shafts draaien sneller los dan nylon.',
          ],
        },
        {
          h2: 'Wanneer vervang je flights en shafts?',
          p: [
            'Vervang flights die gescheurd, geknikt of niet meer vlak zijn, en shafts die krom of gebarsten zijn: allebei veranderen ze hoe de dart vliegt, en ze laten de volgende dart afketsen.',
          ],
        },
        {
          h2: 'Hoe gaat een dartbord langer mee?',
          list: [
            'Draai het bord om de paar weken zodat de 20 niet als eerste slijt, en zet de cijferring terug met de 20 bovenaan.',
            'Maak een sisalbord nooit nat: water laat de vezels zwellen en het bord sneller slijten.',
            'Trek darts recht uit het bord met een lichte draai, niet schuin.',
            'Hang het bord uit de volle zon en niet boven een verwarming.',
          ],
        },
      ],
      faq: [
        [
          'Hoe vaak moet je darts schoonmaken?',
          'Zodra de grip glad aanvoelt: voor de meeste spelers om de paar weken.',
        ],
        [
          'Moet je een dartbord nat maken?',
          'Nee. Water laat sisal zwellen en sneller slijten, ook al hoor je het nog weleens.',
        ],
        [
          'Waarom stuiteren mijn darts uit het bord?',
          'Versleten of bramige punten, een harde versleten plek in het bord, of de draad raken. Maak de punten glad en draai het bord.',
        ],
      ],
    },
    {
      key: 'board',
      slug: 'dartbord-ophangen',
      title: 'Dartbord ophangen: hoogte en afstand',
      description:
        'Zo hang je een dartbord goed op: 1,73 m tot de bull, 2,37 m tot de oche, de controle met de diagonaal van 2,93 m, licht zonder schaduw en een beschermde muur.',
      h1: 'Hoe hang je een dartbord op?',
      answer:
        'Hang het bord zo dat het midden van de bull 1,73 m boven de vloer zit, met de 20 bovenaan, en leg de oche op 2,37 m van de voorkant van het bord. Controleer het met de diagonaal: van de bull tot de achterkant van de oche op de vloer is 2,93 m. Verlicht het bord van voren of van twee kanten zodat de darts geen schaduw geven, en bescherm de muur met een surround.',
      sections: [
        {
          h2: 'Hoe hoog hangt een dartbord?',
          p: ['1,73 m van de vloer tot het midden van de bull.'],
        },
        {
          h2: 'Waar ligt de oche?',
          p: [
            'Op 2,37 m van de voorkant van het bord (niet van de muur), langs de vloer gemeten tot de achterkant van de werplijn. Een strook tape werkt; een verhoogde oche voel je makkelijker met je voet.',
          ],
        },
        {
          h2: 'Hoe monteer je een dartbord?',
          list: [
            'Schroef de beugel aan de muur op de hoogte uit de handleiding van het bord, zodat de bull op 1,73 m uitkomt.',
            'Hang het bord op met de 20 bovenaan.',
            'Controleer of het recht hangt en niet wiebelt.',
            'Meet de diagonaal van de bull tot de achterkant van de oche: 2,93 m.',
          ],
        },
        {
          h2: 'Welke verlichting heeft een dartbord nodig?',
          p: [
            'Licht van voren of van twee kanten, zodat de darts in het bord geen schaduw over de vakken geven. Een ringlamp rond het bord doet precies dat.',
          ],
        },
        {
          h2: 'Hoe bescherm je de muur en de vloer?',
          p: [
            'Een surround (een ring van schuim of rubber om het bord) vangt de darts die missen, en een dartmat bij de oche spaart de vloer en je punten.',
          ],
        },
        {
          h2: 'Hoeveel ruimte heb je nodig om te darten?',
          p: [
            'Ongeveer 3 m vanaf de muur tot achter de plek waar je staat, en ongeveer 1,5 m breed, zodat er ruimte is voor je werparm en voor een tweede speler.',
          ],
        },
      ],
      faq: [
        ['Hoe hoog hangt een dartbord van de grond?', '1,73 m tot het midden van de bull.'],
        ['Hoe ver sta je van een dartbord?', '2,37 m van de voorkant van het bord tot de achterkant van de oche.'],
        [
          'Wat is de diagonaal bij een dartbord?',
          '2,93 m van het midden van de bull tot de achterkant van de oche, op de vloer.',
        ],
      ],
    },
  ],

  de: [
    {
      key: 'beginners',
      slug: 'darts-fuer-anfaenger',
      title: 'Darts für Anfänger: welches Gewicht, welche Form?',
      description:
        'Welche Darts kaufen Anfänger? Ein gutes Startgewicht, Barrelform, Wolfram und Budget, und wie dein erstes richtiges Set zu deiner eigenen Hand passt.',
      h1: 'Welche Darts sollten Anfänger kaufen?',
      answer:
        'Fang mit einem Steeldart-Set von etwa 22 bis 24 g an, mit geradem Barrel aus 80 oder 90 % Wolfram, mittleren Schäften und Standard-Flights. Das passt zu den meisten Händen und Griffen, während du deinen Wurf findest; {share2224} der Darts im DartFit-Katalog liegen in diesem Gewicht. Rechne mit etwa 30 bis 60 €: billigere Messing-Darts sind dick, teurere Sets lohnen sich erst, wenn dein Griff steht.',
      sections: [
        {
          h2: 'Mit welchem Gewicht fangen Anfänger an?',
          p: [
            'Die meisten Spieler beginnen zwischen 22 und 24 g. Leichtere Darts verlangen einen schnelleren, genaueren Arm; schwerere verzeihen ein unruhiges Loslassen, ermüden aber in einer langen Session. Die mittlere Hälfte unseres Katalogs wiegt {q25W} bis {q75W} g.',
          ],
        },
        {
          h2: 'Mit welcher Barrelform lernt man am leichtesten?',
          p: [
            'Mit einem geraden Barrel. Es ist vorne wie hinten gleich dick und verzeiht einen Griff, der beim Lernen noch wandert. Weißt du, wo deine Finger hinwollen, passt vielleicht ein Torpedo (Griff vorne) oder ein konisches Barrel (Griff hinten) besser.',
          ],
        },
        {
          h2: 'Messing, Neusilber oder Wolfram?',
          p: [
            'Wolfram ist viel dichter, deshalb ist ein Wolfram-Barrel bei gleichem Gewicht schlanker und deine Darts stecken enger beieinander. Messing-Darts sind günstig, aber dick; Neusilber liegt dazwischen. 80 bis 90 % Wolfram ist die beste Wahl für ein erstes richtiges Set: {w90Pct} unseres Katalogs sind 90 %.',
          ],
        },
        {
          h2: 'Wie viel kosten die ersten Darts?',
          list: [
            'Unter 25 €: Messing oder wenig Wolfram, gut zum Ausprobieren.',
            'Etwa 30 bis 60 €: 80 bis 90 % Wolfram, das beste Preis-Leistungs-Verhältnis für die meisten Anfänger.',
            'Über 80 €: 95 % Wolfram, Profi-Modelle und besondere Beschichtungen, lohnend, wenn dein Griff steht.',
          ],
        },
        {
          h2: 'Was brauchen Anfänger sonst noch?',
          list: [
            'Ersatz-Flights und -Schäfte: Sie gehen kaputt, und ein verbogener Flight ändert den Flug.',
            'Eine Sisalscheibe, aufgehängt mit dem Bull auf 1,73 m und der Abwurflinie 2,37 m entfernt.',
            'Eine Checkout-Tabelle, um zu lernen, welches Doppel du dir stellst.',
          ],
        },
        {
          h2: 'Wann passt man Darts an die Hand an?',
          p: [
            'Wenn du ein paar Wochen geworfen hast und dein Griff sich wiederholt. Dann sagen Griff, Fingerzahl und Handgröße viel über das passende Barrel. DartFit misst deine Hand neben einer Bankkarte und rechnet es in etwa zwei Minuten aus, kostenlos.',
          ],
        },
      ],
      faq: [
        [
          'Welches Dartgewicht für Anfänger?',
          'Etwa 22 bis 24 g. Das ist die Mitte des Angebots und passt beim Lernen zu den meisten Würfen.',
        ],
        [
          'Sind billige Darts schlecht für Anfänger?',
          'Nicht schlecht, aber klobig: Messing-Darts sind für ihr Gewicht dick. Ein Set mit 90 % Wolfram ab etwa 30 € ist schlanker und hält länger.',
        ],
        [
          'Sollten Anfänger die Darts eines Profis kaufen?',
          'Nur wenn die Maße zu dir passen. Ein Profi-Modell ist auf den Griff dieses Spielers abgestimmt; vergleiche Gewicht, Länge und Form zuerst mit deinem eigenen Fit.',
        ],
      ],
    },
    {
      key: 'setup',
      slug: 'schaefte-und-flights',
      title: 'Dart-Schäfte und Flights erklärt: Länge und Form',
      description:
        'Kurze, mittlere oder lange Schäfte; Standard-, Slim- oder Kite-Flights: wie das Heck des Darts den Flug verändert und wie du es auf Barrel und Wurf abstimmst.',
      h1: 'Dart-Schäfte und Flights erklärt',
      answer:
        'Schaft und Flight steuern das Heck des Darts. Ein längerer Schaft oder ein größerer Flight bringt mehr Luftwiderstand hinter das Barrel, der Dart richtet sich schnell aus und fliegt in einem höheren Bogen; ein kürzerer Schaft oder kleinerer Flight fliegt schneller und flacher, verzeiht aber weniger. Die meisten fangen mit mittleren Schäften und Standard-Flights an und ändern immer nur eine Sache.',
      sections: [
        {
          h2: 'Welche Schaftlänge passt zu mir?',
          list: [
            'Kurz (etwa 35 mm): ein kompakter Dart für einen flachen, schnellen Wurf; Flights stoßen in engen Gruppen seltener zusammen.',
            'Mittel (etwa 45 bis 48 mm): der Standard, mit dem die meisten anfangen.',
            'Lang (etwa 50 mm und mehr): mehr Steuerung hinten, für einen Bogenwurf oder einen Dart, der flattert.',
          ],
          after: ['Hersteller messen unterschiedlich, vergleiche also Millimeter statt Namen.'],
        },
        {
          h2: 'Nylon, Aluminium, Carbon oder drehende Schäfte?',
          p: [
            'Nylon ist günstig und leicht, kann aber brechen; Aluminium ist stabil, kann sich aber verbiegen und lockern; Carbon und Composite sind leicht und steif. Bei drehenden (Spin-)Schäften dreht sich der Flight weg, wenn ein anderer Dart ihn trifft, so prallen weniger ab. O-Ringe oder Schaftringe verhindern, dass sich Schäfte lösen.',
          ],
        },
        {
          h2: 'Was bewirken die Flight-Formen?',
          list: [
            'Standard: die größte Fläche, am stabilsten, ein höherer Bogen.',
            'Kite und Pear: etwas weniger Fläche, etwas schneller.',
            'Slim: viel weniger Widerstand, für einen schnellen, flachen Wurf mit ruhigem Loslassen.',
            'Small Standard: kompakt, für enge Gruppen.',
          ],
        },
        {
          h2: 'Wie stimme ich Schaft und Flight auf mein Barrel ab?',
          p: [
            'Schwere und kopflastige Darts tragen sich selbst und vertragen kleinere Flights; leichte Darts und ein Griff hinten brauchen meist mehr Fläche am Heck, um gerade zu bleiben. Flattert dein Dart in der Luft, gib dem Heck mehr Fläche (längerer Schaft oder größerer Flight); verliert er Tempo und sackt ab, nimm etwas weg.',
          ],
        },
        {
          h2: 'Schlägt DartFit auch Schäfte und Flights vor?',
          p: [
            'Ja. Neben deinem idealen Barrel bekommst du eine Schaftlänge und eine Flight-Form für deinen Griff und Wurf: denselben Aufbau, den du am Dart siehst, während du die Fragen beantwortest.',
          ],
        },
      ],
      faq: [
        [
          'Machen längere Schäfte den Dart stabiler?',
          'Sie setzen den Flight weiter nach hinten, der Dart richtet sich früher aus. Zu lang, und er korrigiert zu stark und fliegt in einem hohen Bogen.',
        ],
        [
          'Welche Flights benutzen die Profis?',
          'Die meisten Standard- oder etwas kleinere Formen, aber das ist je nach Spieler und Wurf verschieden; den einen Profi-Flight gibt es nicht.',
        ],
        [
          'Wie oft sollte man Flights wechseln?',
          'Sobald einer eingerissen, verbogen oder geknickt ist: Ein beschädigter Flight verändert den Flug.',
        ],
      ],
    },
    {
      key: 'technique',
      slug: 'besser-darts-werfen',
      title: 'Besser Darts werfen: Stand, Griff und Loslassen',
      description:
        'So wirfst du besser Darts: fester Stand, ein Griff, den du wiederholen kannst, sauberes Loslassen und Durchschwingen. Einfache Checks für Anfänger.',
      h1: 'Wie wirft man besser Darts?',
      answer:
        'Gutes Darts heißt, denselben Wurf zu wiederholen. Stell dich seitlich mit dem Fuß der Wurfseite vorne, halte den Dart mit einem Griff, den du jedes Mal nachmachen kannst, halte den Oberarm ruhig und bewege den Unterarm in einer fließenden Linie zum Ziel. Lass bei jedem Wurf am selben Punkt los und schwing mit der Hand durch.',
      sections: [
        {
          h2: 'Wie steht man an der Abwurflinie?',
          p: [
            'Setz den Fuß deiner Wurfseite nach vorne an die Linie, mit dem meisten Gewicht darauf, und dreh den Körper seitlich oder schräg. Bleib beim Werfen ruhig stehen: Ein leichtes Vorlehnen ist in Ordnung, solange es jedes Mal gleich ist.',
          ],
        },
        {
          h2: 'Wie hält man einen Dart?',
          p: [
            'Die meisten Spieler nutzen drei oder vier Finger: den Daumen unter dem Barrel, ein oder zwei Finger darauf und den Rest am Barrel oder Schaft. Halte ihn fest genug, um ihn zu führen, und locker genug, dass er sauber aus der Hand geht. Wo du ihn hältst, entscheidet, welche Barrelform zu dir passt.',
          ],
        },
        {
          h2: 'Was ist die richtige Wurfbewegung?',
          list: [
            'Zielen: Auge, Dart und Ziel auf einer Linie.',
            'Ausholen: Dart zurück Richtung Auge; der Ellbogen bleibt, wo er ist.',
            'Beschleunigen: eine fließende Bewegung nach vorne, ohne Ruck.',
            'Loslassen: bei jedem Wurf am selben Punkt, kurz bevor der Arm gestreckt ist.',
            'Durchschwingen: Zeig mit der Hand zum Ziel, wenn der Dart weg ist.',
          ],
        },
        {
          h2: 'Warum gehen meine Darts links, rechts, hoch oder tief?',
          list: [
            'Links oder rechts: Der Ellbogen wandert zur Seite, oder das Handgelenk dreht.',
            'Hoch: zu spät losgelassen oder nach oben gedrückt.',
            'Tief: zu früh losgelassen, oder der Ellbogen sackt ab.',
            'Überall auf der Scheibe: Der Griff ändert sich von Dart zu Dart.',
          ],
        },
        {
          h2: 'Macht der Dart selbst einen Unterschied?',
          p: [
            'Ja, sobald dein Wurf sich wiederholt. Ein zu schwerer Dart lässt dich drücken, ein zu leichter lässt dich reißen, und die falsche Form verschiebt deine Finger. Mit einem Dart, der zu deiner Hand passt, landet derselbe Wurf an derselben Stelle.',
          ],
        },
      ],
      faq: [
        [
          'Sollte man beim Darts das Handgelenk einsetzen?',
          'Etwas Handgelenk am Ende ist normal; ein großer Schnapper ist schwer zu wiederholen. Lass den Unterarm die Arbeit machen.',
        ],
        [
          'Darf sich der Ellbogen beim Werfen bewegen?',
          'Halte den Oberarm ruhig. Am Ende darf der Ellbogen beim Durchschwingen etwas steigen.',
        ],
        [
          'Wie zielt man beim Darts?',
          'Schau auf den genauen Punkt, den du treffen willst, nicht auf das ganze Feld, und bring den Dart vor dem Wurf damit auf eine Linie.',
        ],
      ],
    },
    {
      key: 'steelsoft',
      slug: 'steeldart-oder-softdart',
      title: 'Steeldart oder Softdart: die Unterschiede',
      description:
        'Steeldart oder Softdart? Wie sich Darts, Scheiben, Gewicht und Wurfabstand unterscheiden, was die Profis spielen und was das für dein erstes Set heißt.',
      h1: 'Steeldart oder Softdart?',
      answer:
        'Steeldarts haben eine Metallspitze und werden aus 2,37 m auf eine Sisalscheibe geworfen; das spielen die Profis im Fernsehen bei PDC und WDF. Softdarts haben eine Kunststoffspitze für elektronische Automaten, die selbst zählen; sie sind leichter (meist höchstens etwa 18 bis 20 g), und der Wurfabstand beträgt oft 2,44 m. DartFit sucht Steeldarts für dich.',
      sections: [
        {
          h2: 'Was ist der Unterschied zwischen Steeldart und Softdart?',
          table: {
            head: ['', 'Steeldart', 'Softdart'],
            rows: [
              ['Spitze', 'Stahl', 'Kunststoff'],
              ['Scheibe', 'Sisal', 'Elektronisch, mit Löchern'],
              ['Übliches Gewicht', '18 bis 30 g (höchstens 50 g)', '16 bis 20 g'],
              ['Wurfabstand', '2,37 m', 'Oft 2,44 m'],
              ['Zählen', 'Selbst oder per App', 'Der Automat zählt'],
            ],
          },
        },
        {
          h2: 'Kann man Softdarts auf eine Sisalscheibe werfen?',
          p: [
            'Nicht gut: Kunststoffspitzen biegen und brechen im Sisal. Manche Barrels nehmen mit einer Umbauspitze beide Spitzen auf, aber Gewicht und Balance ändern sich.',
          ],
        },
        {
          h2: 'Was ist besser für Anfänger?',
          p: [
            'Softdart macht in der Kneipe oder zu Hause am Automaten Spaß, der den Punktestand führt. Willst du im Verein oder in einer Liga spielen, oder so wie die Profis, fang mit Steeldart an: Die Darts fühlen sich anders an, und Gewohnheiten nimmst du mit.',
          ],
        },
        {
          h2: 'Was spielen die Profis?',
          p: [
            'Die Turniere im Fernsehen sind Steeldart. Softdart hat eine eigene Szene und ist besonders in Asien und in Kneipen in ganz Europa beliebt.',
          ],
        },
      ],
      faq: [
        [
          'Sind Softdarts leichter?',
          'Ja, meist 16 bis 20 g, weil elektronische Automaten und ihre Ligen das Gewicht begrenzen.',
        ],
        [
          'Ist der Wurfabstand gleich?',
          'Nein: beim Steeldart 2,37 m, beim Softdart oft 2,44 m, je nach Regelwerk.',
        ],
        [
          'Kann man Steeldarts zu Softdarts umbauen?',
          'Manche Barrels nehmen Schraubspitzen für Softdart, aber Gewicht und Balance ändern sich; echte Softdarts sind leichter.',
        ],
      ],
    },
    {
      key: 'size',
      slug: 'dart-laenge-und-dicke',
      title: 'Länge und Dicke eines Darts: was passt zu dir?',
      description:
        'Lang oder kurz, schlank oder dick? Was Länge und Durchmesser des Barrels mit Griff und Gruppierung machen, die üblichen Maße und wie deine Hand sie bestimmt.',
      h1: 'Länge und Dicke eines Darts',
      answer:
        'Die Barrellänge bestimmt, wie viel Platz deine Finger haben, die Dicke, wie viel du in der Hand hast. Das mittlere Steeldart-Barrel im DartFit-Katalog ist {medL} mm lang, und die mittlere Hälfte ist {q25D} bis {q75D} mm dick. Lange Finger, die sich über den Dart verteilen, passen zu einem längeren Barrel, ein kompakter Griff zu einem kürzeren; schlanke Barrels gruppieren enger, dicke spürt man besser.',
      sections: [
        {
          h2: 'Wie lang sollte ein Barrel sein?',
          p: [
            'Lang genug für jeden Finger, der es berührt. Ein Griff vorne mit zwei Fingern kommt mit einem kurzen Barrel aus; ein Griff mit vier Fingern über den ganzen Dart will ein langes. Zu kurz, und dein letzter Finger landet auf dem Schaft; zu lang, und das Gewicht verteilt sich weiter als dein Griff.',
          ],
        },
        {
          h2: 'Schlankes oder dickes Barrel?',
          list: [
            'Schlank (unter etwa 6,5 mm): engere Gruppen und weniger Abpraller, verlangt aber einen genauen Griff.',
            'Mittel (etwa 6,5 bis 7,5 mm): der übliche Bereich.',
            'Dick (über etwa 7,5 mm): mehr zum Festhalten, angenehm für große Hände und fürs Gefühl.',
          ],
        },
        {
          h2: 'Warum sind Wolfram-Darts schlanker?',
          p: [
            'Wolfram ist mehr als doppelt so dicht wie Messing, also passt dasselbe Gewicht in ein viel dünneres Barrel. Je höher der Wolfram-Anteil, desto schlanker: {w95Pct} unseres Katalogs sind 95 %.',
          ],
        },
        {
          h2: 'Wie hängen Länge, Dicke und Gewicht zusammen?',
          p: [
            'Sie gehören zusammen: Im selben Material ist ein längeres oder dickeres Barrel schwerer. Deshalb rechnet DartFit alle drei zusammen und prüft jeden Dart im Katalog darauf, was seine Maße und seine Legierung wiegen können.',
          ],
        },
        {
          h2: 'Wie bestimmt deine Hand das?',
          p: [
            'Die Länge deiner Finger im Verhältnis zur Handfläche zeigt, ob du dich über das Barrel verteilst oder kompakt greifst; die Größe deiner Hand zeigt, wie viel Barrel du hältst. DartFit misst beides neben einer Bankkarte und zeichnet dein ideales Barrel in Millimetern.',
          ],
        },
      ],
      faq: [
        [
          'Wie lang ist ein durchschnittliches Barrel?',
          'Etwa {medL} mm, die Mitte der {darts} Steeldarts im DartFit-Katalog.',
        ],
        [
          'Gruppieren schlanke Darts besser?',
          'Sie brauchen weniger Platz in der Scheibe und stören sich weniger; du brauchst aber einen Griff, der nicht rutscht.',
        ],
        [
          'Sind lange Barrels besser für lange Finger?',
          'Oft ja: Lange Finger verteilen sich über das Barrel und wollen Platz für jede Fingerspitze.',
        ],
      ],
    },
    {
      key: 'care',
      slug: 'darts-pflegen',
      title: 'Darts pflegen: Spitzen, Griff, Schäfte, Scheibe',
      description:
        'So pflegst du Darts und Dartscheibe: Spitzen richtig schärfen, die Rändelung reinigen, Schäfte fest halten und die Scheibe drehen, damit sie länger hält.',
      h1: 'Wie pflegt man seine Darts?',
      answer:
        'Halte Stahlspitzen leicht abgerundet statt nadelspitz, reinige den Griff ab und zu mit einer weichen Bürste und etwas Seifenwasser, sichere deine Schäfte mit Ringen, wechsle Flights, sobald sie verbogen sind, und dreh deine Sisalscheibe regelmäßig, damit die 20 nicht zuerst verschleißt.',
      sections: [
        {
          h2: 'Sollte man Dartspitzen schärfen?',
          p: [
            'Ein wenig. Eine Spitze mit feiner, leicht abgerundeter Spitze gleitet zwischen die Sisalfasern; eine nadelspitze kann haken und sich verbiegen, eine stumpfe oder gratige prallt ab. Roll die Spitze ein paar Mal in flachem Winkel über einen Dartschärfer, mehr nicht.',
          ],
        },
        {
          h2: 'Wie reinigt man den Griff der Darts?',
          p: [
            'Schraub Schäfte und Spitzen ab, schrubb die Barrels mit einer weichen Zahnbürste in warmem Wasser mit einem Tropfen Spülmittel, spül sie ab und trockne sie sofort. Hautfett und Kreide füllen die Rändelung und machen den Griff glatt.',
          ],
        },
        {
          h2: 'Warum lösen sich meine Schäfte ständig?',
          p: [
            'Durch den Wurf und jeden Einschlag. Nutze O-Ringe oder Schaftringe, zieh sie von Hand fest (nicht mit der Zange) und prüfe sie jede Session. Aluminiumschäfte lockern sich schneller als Nylon.',
          ],
        },
        {
          h2: 'Wann wechselt man Flights und Schäfte?',
          p: [
            'Wechsle Flights, die eingerissen, geknickt oder nicht mehr flach sind, und Schäfte, die verbogen oder gerissen sind: Beides verändert den Flug, und der nächste Dart prallt daran ab.',
          ],
        },
        {
          h2: 'Wie hält eine Dartscheibe länger?',
          list: [
            'Dreh die Scheibe alle paar Wochen, damit der Bereich um die 20 nicht zuerst verschleißt, und setz den Zahlenring mit der 20 oben wieder auf.',
            'Mach eine Sisalscheibe nie nass: Wasser lässt die Fasern quellen und die Scheibe schneller verschleißen.',
            'Zieh Darts gerade mit einer leichten Drehung heraus, nicht schräg.',
            'Häng die Scheibe nicht in die pralle Sonne und nicht über eine Heizung.',
          ],
        },
      ],
      faq: [
        [
          'Wie oft sollte man Darts reinigen?',
          'Wenn sich der Griff glatt anfühlt: für die meisten Spieler alle paar Wochen.',
        ],
        [
          'Sollte man eine Dartscheibe befeuchten?',
          'Nein. Wasser lässt Sisal quellen und schneller verschleißen, auch wenn man es noch oft hört.',
        ],
        [
          'Warum prallen meine Darts ab?',
          'Abgenutzte oder gratige Spitzen, eine harte, verschlissene Stelle in der Scheibe oder ein Treffer auf den Draht. Glätte die Spitzen und dreh die Scheibe.',
        ],
      ],
    },
    {
      key: 'board',
      slug: 'dartscheibe-aufhaengen',
      title: 'Dartscheibe aufhängen: Höhe und Abstand',
      description:
        'So hängst du eine Dartscheibe richtig auf: 1,73 m bis zum Bull, 2,37 m bis zur Abwurflinie, die Diagonale von 2,93 m, Licht ohne Schatten und Wandschutz.',
      h1: 'Wie hängt man eine Dartscheibe auf?',
      answer:
        'Häng die Scheibe so auf, dass die Mitte des Bulls 1,73 m über dem Boden liegt, mit der 20 oben, und markier die Abwurflinie 2,37 m vor der Vorderseite der Scheibe. Prüf es mit der Diagonale: vom Bull bis zur Hinterkante der Abwurflinie am Boden sind es 2,93 m. Beleuchte die Scheibe von vorne oder von zwei Seiten, damit die Darts keine Schatten werfen, und schütze die Wand mit einem Surround.',
      sections: [
        {
          h2: 'Wie hoch hängt eine Dartscheibe?',
          p: ['1,73 m vom Boden bis zur Mitte des Bulls.'],
        },
        {
          h2: 'Wo liegt die Abwurflinie?',
          p: [
            '2,37 m vor der Vorderseite der Scheibe (nicht der Wand), am Boden gemessen bis zur Hinterkante der Linie. Ein Klebestreifen reicht; eine erhöhte Abwurfleiste spürst du besser mit dem Fuß.',
          ],
        },
        {
          h2: 'Wie montiert man eine Dartscheibe?',
          list: [
            'Schraub die Halterung in der Höhe an die Wand, die die Anleitung der Scheibe angibt, sodass der Bull auf 1,73 m kommt.',
            'Häng die Scheibe mit der 20 oben auf.',
            'Prüf, ob sie gerade hängt und nicht wackelt.',
            'Miss die Diagonale vom Bull bis zur Hinterkante der Abwurflinie: 2,93 m.',
          ],
        },
        {
          h2: 'Welche Beleuchtung braucht eine Dartscheibe?',
          p: [
            'Licht von vorne oder von zwei Seiten, damit die Darts in der Scheibe keine Schatten über die Felder werfen. Ein Ringlicht um die Scheibe macht genau das.',
          ],
        },
        {
          h2: 'Wie schützt man Wand und Boden?',
          p: [
            'Ein Surround (ein Ring aus Schaumstoff oder Gummi um die Scheibe) fängt Fehlwürfe ab, und eine Dartmatte an der Abwurflinie schont Boden und Spitzen.',
          ],
        },
        {
          h2: 'Wie viel Platz braucht man zum Darten?',
          p: [
            'Etwa 3 m von der Wand bis hinter deinen Standplatz und etwa 1,5 m Breite, damit Platz für den Wurfarm und einen zweiten Spieler bleibt.',
          ],
        },
      ],
      faq: [
        ['Wie hoch hängt eine Dartscheibe vom Boden?', '1,73 m bis zur Mitte des Bulls.'],
        ['Wie weit steht man von der Dartscheibe entfernt?', '2,37 m von der Vorderseite der Scheibe bis zur Hinterkante der Abwurflinie.'],
        [
          'Wie lang ist die Diagonale bei einer Dartscheibe?',
          '2,93 m von der Mitte des Bulls bis zur Hinterkante der Abwurflinie am Boden.',
        ],
      ],
    },
  ],
};
