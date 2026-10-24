import type { Site } from './types';

export const en: Site = {
  lang: 'en',
  locale: 'en_GB',
  hub: {
    slug: '',
    title: 'Choosing darts: guides from DartFit',
    description:
      'Which darts are right for you? Guides on dart weight, barrel shape, grip and how DartFit matches darts to your hand, plus buying darts as a gift.',
    h1: 'Guides to choosing darts',
    intro:
      'Short, honest guides to finding darts that fit you: what weight to pick, which barrel shape suits your grip, and how DartFit measures your hand next to a bank card to match you to {models} real dart models.',
  },
  ui: {
    cta: 'Find my dart',
    ctaSub: 'Free, about two minutes. Measure your hand next to a bank card; the photo stays on your phone.',
    ctaGift: 'Buying for someone else?',
    related: 'More guides',
    faq: 'Frequently asked questions',
    updated: 'Last updated',
    home: 'DartFit',
    guides: 'Guides',
    disclosure: 'Shop links may earn us a commission. It never changes the ranking.',
    langName: 'English',
    skip: 'Skip to content',
  },
  pages: [
    {
      key: 'guide',
      slug: 'which-darts-are-right-for-me',
      title: 'Which darts are right for me? Find darts that fit your hand',
      description:
        'How to choose darts that fit: weight, length, thickness, barrel shape and grip, matched to your hand and how you hold the dart. Free fitting with DartFit.',
      h1: 'Which darts are right for me?',
      answer:
        'The darts that suit you are the ones whose weight, length, thickness, barrel shape and grip match your hand and the way you hold and throw. A good start for steel tip is 22 to 24 g ({share2224} of the {darts} darts in our catalogue sit in that range), a barrel long enough for the fingers you grip with, and a shape that matches where you hold it. DartFit works this out for you: you measure your hand next to a bank card, answer five questions and get your ideal dart plus the closest real darts in three price classes.',
      sections: [
        {
          h2: 'What makes a dart fit you?',
          p: [
            'Five things decide how a dart feels in your hand. Everything else (colour, brand, the pro on the box) is taste.',
          ],
          list: [
            'Weight: how much effort the throw takes and how stable the dart flies. Steel-tip darts are usually 18 to 26 g; the middle of our catalogue is {medW} g.',
            'Length: your fingers need room. With two fingers on the barrel a shorter barrel works; with four you want a longer one. The median barrel in our catalogue is {medL} mm.',
            'Thickness (diameter): a broad hand often prefers a slightly thicker barrel, a slim hand a thinner one. Most barrels are between {q25D} and {q75D} mm.',
            'Barrel shape: straight, torpedo, bomb, tapered or scalloped. The shape puts the weight where your fingers are.',
            'Grip (knurling): smooth to rough. Rough grip helps if the dart slips; too sharp tires your fingers.',
          ],
        },
        {
          h2: 'How do I find a dart that fits my hand?',
          p: [
            'In a shop, a fitter lets you try darts until one feels right. That works, but most people buy online and cannot try. DartFit gives you a well-reasoned starting point instead:',
          ],
          list: [
            'Measure your hand: put your hand next to a bank card and your phone finds 21 points on your hand. The card (85.6 × 53.98 mm) is the ruler. The photo never leaves your phone.',
            'Answer five questions: your height, where you hold the dart, how many fingers you use, how the dart flies and how much grip you like.',
            'See your ideal dart: weight, length, thickness, shape and balance, drawn to scale.',
            'Compare real darts: every dart in the catalogue gets a match score (shape match, style match and total), with the best match in budget, standard and premium.',
          ],
        },
        {
          h2: 'Where you hold the dart decides the shape',
          p: [
            'Players who hold the dart at the front usually like the weight forward: a torpedo or a front-weighted barrel. Holding it in the middle suits a straight barrel. Holding it at the back suits a tapered barrel with the weight further back. Your hand nudges this further: short fingers for your palm and a compact grip lean towards a bomb or torpedo; long fingers spread along the barrel lean towards straight.',
          ],
          table: {
            caption: 'Barrel shapes in the DartFit catalogue ({darts} steel-tip darts)',
            head: ['Shape', 'Where the weight sits', 'Suits'],
            rows: [
              ['Straight ({straightPct} of darts)', 'Evenly along the barrel', 'Middle grip, long fingers'],
              ['Torpedo', 'Front, tapering to the back', 'Front grip'],
              ['Bomb', 'One fat point in the middle', 'Compact grip, short fingers'],
              ['Tapered', 'Front, thinning to the back', 'Rear grip'],
              ['Scalloped', 'Straight with a waist for the fingers', 'Players who want a fixed spot'],
            ],
          },
        },
        {
          h2: 'Which darts are best for beginners?',
          p: [
            'Start in the middle: about 22 to 24 g, a straight barrel around 50 mm and a medium grip, in 90% tungsten. That is forgiving while you find your grip, and it is what most of the market is built around ({w90Pct} of our catalogue is 90% tungsten). Once you know where you hold the dart and how it flies, a fitting points you to something more personal.',
          ],
        },
      ],
      faq: [
        [
          'Which dart is right for me?',
          'The one whose weight, length, thickness, shape and grip suit your hand and grip. DartFit measures your hand next to a bank card, asks five questions and ranks {darts} real darts by how well they match you.',
        ],
        [
          'How do I find darts that fit my hand?',
          'Measure your hand next to a bank card with DartFit and answer five questions about your grip and throw. You get your ideal dart and the real darts that match it best, in each price class.',
        ],
        [
          'What darts should I buy?',
          'Buy darts that fit your hand and grip, not the dart of your favourite pro. If you are unsure, start with 22 to 24 g, a straight barrel and 90% tungsten.',
        ],
        [
          'Can I find the right dart without trying it?',
          'You can get close. A fitting from your hand size and grip gives you a short list that fits; the final choice is still how it feels when you throw.',
        ],
        [
          'Does the size of my hand matter for darts?',
          'Yes, mostly for length and thickness: longer fingers want a longer barrel, a broader hand often a slightly thicker one. Hand size has a smaller effect on weight.',
        ],
        [
          'Is DartFit free?',
          'Yes. The fitting is free. When you buy through a shop link we may earn a commission, which never changes the ranking.',
        ],
        [
          'What happens to the photo of my hand?',
          'Nothing leaves your phone. The hand is recognised on your device and only the measurements in millimetres are used.',
        ],
      ],
    },
    {
      key: 'algorithm',
      slug: 'how-dartfit-works',
      title: 'How DartFit works: the dart fitting algorithm explained',
      description:
        'How DartFit turns a photo of your hand next to a bank card into your ideal dart: hand measurement, uncertainty, barrel physics and match scores.',
      h1: 'How the DartFit algorithm picks your dart',
      answer:
        'DartFit measures your hand with your phone camera, using a bank card as the ruler, and combines those measurements with your answers into an estimate of the weight, length and thickness that suit you, each with an uncertainty. A physics model of a real barrel (tungsten density, bores, shape) makes sure the ideal dart can actually be made. Every dart in the catalogue then gets a match score against that ideal.',
      sections: [
        {
          h2: 'Step 1: measuring your hand',
          p: [
            'Your phone recognises 21 points on your hand (MediaPipe, running on your device). A bank card is always 85.6 × 53.98 mm (ISO/IEC 7810 ID-1), so it works as a ruler in the photo. DartFit takes the median of many frames and drops outliers. The image never leaves your phone; only the measurements in millimetres are used.',
            'No card at hand? You can scan without one; DartFit then keeps only the proportions of your hand and estimates the size from your height, and tells you the result is less precise.',
          ],
        },
        {
          h2: 'Step 2: from answers to sizes',
          p: [
            'Every clue is an estimate with an uncertainty: your hand size, where you hold the dart, how many fingers you use, how the dart flies and how much grip you like. DartFit combines them weighted by how certain each one is. The starting point for steel tip is 22 g; your hand and throw move it from there.',
          ],
          list: [
            'Length follows your fingers: about 44 mm for two fingers on the barrel, 48 mm for three and 52 mm for four, adjusted for your finger length and where you hold it.',
            'Thickness follows your hand: around 6.8 mm, a little thicker for broad hands.',
            'Without a scan, your hand is estimated from your height (hand length is on average about 10.75% of body height).',
          ],
        },
        {
          h2: 'Step 3: physics, so the ideal dart can exist',
          p: [
            'Weight, length and thickness are tied together: a barrel is metal with a density. DartFit models a barrel from the density of tungsten alloys (ASTM B777), the bores for the point and the thread, and its profile. Calibrated on 34 straight barrels, it predicts their listed weight to within about 7%. If your wish cannot be made in 90% tungsten, it tries 95%; listings whose stated weight does not fit their size are kept out of recommendations until checked.',
          ],
        },
        {
          h2: 'Step 4: your ideal barrel and its shape',
          p: [
            'DartFit searches for the profile (how far the front and back taper) that hits your weight and puts the balance point where your grip wants it, leaning towards the shape your hold and hand suggest: torpedo for a front grip, straight for the middle, tapered for the back, bomb for a compact grip with short fingers.',
          ],
        },
        {
          h2: 'Step 5: the match score',
          p: [
            'Each real dart gets a distance to your ideal on every size, measured in standard deviations and weighted by how much you would feel the difference. That becomes three numbers: shape match (weight, length, thickness), style match (barrel type, grip, balance) and the total. The result shows the best total in each price class: budget (up to €50), standard (up to €80) and premium.',
          ],
        },
        {
          h2: 'What DartFit does not claim',
          p: [
            'No study turns hand size into the perfect dart weight. DartFit gives you a reasoned starting point and a short list to try, with the reasons. Every rule of thumb in the model is listed with its source on the method page in the app, and it is tuned with what players tell us after they buy.',
          ],
        },
      ],
      faq: [
        [
          'How accurate is DartFit?',
          'The bank card turns the photo into real millimetres and DartFit takes the median of many frames; we are checking it against tape-measured hands. The barrel physics predicts listed weights to within about 7%. The step from hand to perfect weight is a reasoned estimate, not a law, which is why you get a short list.',
        ],
        [
          'Why a bank card?',
          'Every bank card has the same size (85.6 × 53.98 mm), so it lets a phone photo measure in real millimetres.',
        ],
        [
          'Which darts are in the catalogue?',
          '{darts} steel-tip darts ({models} models) from {brands} brands, including Target, Winmau, Red Dragon, Unicorn, Harrows and Bulls.',
        ],
        [
          'Does DartFit store my photo?',
          'No. The hand is recognised on your phone and only the measurements are used.',
        ],
      ],
    },
    {
      key: 'why',
      slug: 'why-dart-fit-matters',
      title: 'Why a dart that fits you matters',
      description:
        'Why darts that fit your hand help: a repeatable grip, a cleaner release and less fatigue. What a poorly fitting dart does, and how to find one that fits.',
      h1: 'Why you want a dart that fits you',
      answer:
        'A dart that fits your hand lets you hold it the same way every throw, which is what consistent darts is built on. If the barrel is too short your fingers crowd it, too long and they spread onto the shaft; too heavy and your arm tires, too light and small mistakes show. A fitting dart removes those variables so practice goes into your throw, not into fighting the dart.',
      sections: [
        {
          h2: 'What does a poorly fitting dart do?',
          list: [
            'Too short for your grip: your fingers touch the shaft or the point, and the grip moves from throw to throw.',
            'Too long: the weight sits away from your fingers and the dart wobbles out of your hand.',
            'Too heavy: you push instead of throw, and your arm tires over a long session.',
            'Too light: every small change in release shows on the board.',
            'Grip too smooth or too sharp: the dart slips, or it sticks to your fingers on release.',
          ],
        },
        {
          h2: 'Why consistency comes from the grip',
          p: [
            'Darts is a game of repeating one movement. You can only repeat a throw if you can find the same grip every time without looking. A barrel whose length suits your fingers and whose shape puts the weight under them gives you that fixed spot.',
          ],
        },
        {
          h2: 'Does a better dart make me a better player?',
          p: [
            'Not on its own. A fitting dart does not add skill; it removes friction. Players often notice it as a dart that "sits right" straight away, which makes practice more productive. If you have been throwing the same darts for years and they feel right, keep them.',
          ],
        },
        {
          h2: 'How do I know if my current darts fit?',
          list: [
            'You can find your grip without looking.',
            'Your fingers sit on the barrel, not on the shaft or point.',
            'The dart leaves your hand cleanly, without sticking.',
            'Your arm is not tired after a long session.',
          ],
          after: [
            'If any of these fails, a fitting is worth two minutes. DartFit compares your hand and grip with {darts} real darts.',
          ],
        },
      ],
      faq: [
        [
          'Why does dart weight matter?',
          'Weight changes how much effort the throw takes and how stable the dart flies. Too heavy tires you, too light makes small mistakes visible.',
        ],
        [
          'Do professionals use fitted darts?',
          'Professionals usually throw a signature dart built around their own grip. DartFit shows which pro throws the same type of dart as you.',
        ],
        [
          'How often should I change darts?',
          'Only when something does not fit: the grip moves, the dart slips or your arm tires. Changing darts often makes it harder to build a repeatable throw.',
        ],
      ],
    },
    {
      key: 'weight',
      slug: 'what-weight-darts',
      title: 'What weight darts should I use? A guide for steel tip',
      description:
        'What dart weight to choose: most steel-tip darts are 20 to 26 g. How your throw, grip and hand change the right weight, with data from {darts} darts.',
      h1: 'What weight darts should I use?',
      answer:
        'For steel tip, start between 22 and 24 g: {share2224} of the {darts} darts in the DartFit catalogue are in that range and the median is {medW} g. A flat, fast throw often suits a slightly heavier dart; an arcing throw a slightly lighter one. Your current dart is the best clue: if it feels too light or too heavy, move about 2 g.',
      sections: [
        {
          h2: 'How heavy are most darts?',
          table: {
            caption: 'Weights in the DartFit catalogue ({darts} steel-tip darts)',
            head: ['', 'Weight'],
            rows: [
              ['Lightest', '{minW} g'],
              ['Quarter of darts up to', '{q25W} g'],
              ['Median', '{medW} g'],
              ['Three quarters up to', '{q75W} g'],
              ['Heaviest', '{maxW} g'],
            ],
          },
        },
        {
          h2: 'What changes the right weight for you?',
          list: [
            'How the dart flies: a flat, direct throw tends to suit a little more weight; a high arc a little less.',
            'Your hand: larger hands often handle a little more weight; the effect is small.',
            'Your current dart: if it feels too light or too heavy, the next one should be about 2 g heavier or lighter.',
            'Fatigue: if your arm tires in long sessions, go lighter.',
          ],
        },
        {
          h2: 'Heavy or light darts: which is better?',
          p: [
            'Neither. Heavier darts fly more steadily and resist small errors, but take more effort. Lighter darts need a more precise release. The right weight is the one you can throw the same way all evening.',
          ],
        },
        {
          h2: 'Why tungsten percentage matters for weight',
          p: [
            'Tungsten is very dense, so more tungsten means a slimmer barrel at the same weight. 90% tungsten is the standard ({w90Pct} of our catalogue); 95% lets a heavy dart stay slim. Brass darts are cheaper but much thicker for the same weight.',
          ],
        },
      ],
      faq: [
        [
          'What weight dart should a beginner use?',
          'About 22 to 24 g in steel tip. It is the middle of the market and forgiving while you find your grip.',
        ],
        [
          'Are 18 g darts too light?',
          'Not if they suit your throw. Light darts suit a fast, precise release; most players start heavier.',
        ],
        [
          'What is the maximum weight of a steel-tip dart?',
          'Under the rules most tournaments use, a steel-tip dart may weigh up to 50 g, but almost all darts sold are between 18 and 30 g.',
        ],
      ],
    },
    {
      key: 'gift',
      slug: 'darts-as-a-gift',
      title: 'Darts as a gift: choose without measuring their hand',
      description:
        'Buying darts as a present? Pick a set that fits from their height, hand type and how they hold the dart. Free gift fitting with DartFit.',
      h1: 'Buying darts as a gift',
      answer:
        'To buy darts that fit someone else, you need four things you probably know: how tall they are, whether their hands are long and slender or short and stubby, where they hold the dart and how it flies. DartFit has a gift mode that asks exactly this, without a hand scan, and shows the best matching darts in three price classes.',
      sections: [
        {
          h2: 'What do I need to know about the player?',
          list: [
            'Height: hand size follows height closely enough for a first estimate.',
            'Hand type: long and slender hands suit a straighter, slimmer barrel; short and stubby hands a bomb or torpedo that is a little thicker.',
            'Where they hold the dart (front, middle or back), if you know. Not sure is fine.',
            'Their current dart, if you can sneak a look at the weight on the box.',
          ],
        },
        {
          h2: 'What if I don’t know how they throw?',
          p: [
            'Choose "Not sure". DartFit then uses the most common answer and shows a safe middle choice. A straight barrel of about 22 to 24 g suits most players.',
          ],
        },
        {
          h2: 'Which price class makes a good present?',
          p: [
            'DartFit shows the best match in each class: budget (up to €50), standard (up to €80) and premium. Standard is the sweet spot for most gifts: 90% tungsten, slim and durable.',
          ],
        },
      ],
      faq: [
        [
          'Can I buy darts for someone without measuring their hand?',
          'Yes. With their height and hand type DartFit makes a good estimate; it is less precise than a scan, so pick a middle weight.',
        ],
        [
          'What darts make a good gift?',
          'A 90% tungsten set of about 22 to 24 g with a straight or slightly torpedo barrel suits most players.',
        ],
      ],
    },
  ],
};
