import type { Site } from './types';

export const de: Site = {
  lang: 'de',
  locale: 'de_DE',
  hub: {
    slug: '',
    title: 'Darts auswählen: Ratgeber von DartFit',
    description:
      'Welcher Dart passt zu dir? Ratgeber zu Dartgewicht, Barrelform, Grip und wie DartFit Darts zu deiner Hand findet. Auch: Darts als Geschenk.',
    h1: 'Ratgeber zur Wahl deiner Darts',
    intro:
      'Kurze, ehrliche Ratgeber, um einen Dart zu finden, der zu dir passt: welches Gewicht, welche Barrelform zu deinem Griff gehört und wie DartFit deine Hand neben einer Bankkarte misst, um dich mit {models} echten Dartmodellen abzugleichen.',
  },
  ui: {
    cta: 'Meinen Dart finden',
    ctaSub:
      'Kostenlos, etwa zwei Minuten. Miss deine Hand neben einer Bankkarte; das Foto bleibt auf deinem Handy.',
    ctaGift: 'Kaufst du für jemand anderen?',
    related: 'Weitere Ratgeber',
    faq: 'Häufige Fragen',
    updated: 'Zuletzt aktualisiert',
    home: 'DartFit',
    guides: 'Ratgeber',
    disclosure: 'Shop-Links können uns eine Provision bringen. Das ändert nie die Rangfolge.',
    langName: 'Deutsch',
    skip: 'Zum Inhalt',
  },
  pages: [
    {
      key: 'guide',
      slug: 'welcher-dart-passt-zu-mir',
      title: 'Welcher Dart passt zu mir? Darts passend zur Hand finden',
      description:
        'So findest du Darts, die zu dir passen: Gewicht, Länge, Dicke, Barrelform und Grip, abgestimmt auf deine Hand und deinen Griff. Kostenlos mit DartFit.',
      h1: 'Welcher Dart passt zu mir?',
      answer:
        'Zu dir passt der Dart, dessen Gewicht, Länge, Dicke, Barrelform und Grip zu deiner Hand und zu deinem Griff und Wurf passen. Ein guter Start für Steeldarts sind 22 bis 24 Gramm ({share2224} der {darts} Darts in unserem Katalog liegen in diesem Bereich), ein Barrel, das lang genug für die Finger ist, mit denen du greifst, und eine Form, die dazu passt, wo du ihn hältst. DartFit rechnet das für dich aus: Du misst deine Hand neben einer Bankkarte, beantwortest fünf Fragen und bekommst deinen idealen Dart plus die echten Darts, die ihm am nächsten kommen, in drei Preisklassen.',
      sections: [
        {
          h2: 'Was macht einen passenden Dart aus?',
          p: [
            'Fünf Dinge bestimmen, wie ein Dart in der Hand liegt. Der Rest (Farbe, Marke, der Profi auf der Packung) ist Geschmackssache.',
          ],
          list: [
            'Gewicht: wie viel Kraft der Wurf kostet und wie stabil der Dart fliegt. Steeldarts wiegen meist 18 bis 26 Gramm; die Mitte unseres Katalogs liegt bei {medW} Gramm.',
            'Länge: deine Finger brauchen Platz. Mit zwei Fingern am Barrel reicht ein kürzerer, mit vier willst du einen längeren. Der mittlere Barrel in unserem Katalog misst {medL} mm.',
            'Dicke (Durchmesser): eine breite Hand mag oft einen etwas dickeren Barrel, eine schmale Hand einen dünneren. Die meisten Barrels haben {q25D} bis {q75D} mm.',
            'Barrelform: gerade, Torpedo, Bomb, konisch oder scalloped. Die Form legt das Gewicht dorthin, wo deine Finger sind.',
            'Grip (Rändelung): von glatt bis rau. Rauer Grip hilft, wenn der Dart rutscht; zu scharf ermüdet die Finger.',
          ],
        },
        {
          h2: 'Wie finde ich einen Dart, der zu meiner Hand passt?',
          p: [
            'Im Laden lässt dich ein Berater Darts ausprobieren, bis einer passt. Das funktioniert, aber die meisten kaufen online und können nichts testen. DartFit gibt dir deshalb einen gut begründeten Ausgangspunkt:',
          ],
          list: [
            'Hand messen: Leg deine Hand neben eine Bankkarte, und dein Handy erkennt 21 Punkte auf deiner Hand. Die Karte (85,6 × 53,98 mm) ist das Lineal. Das Foto verlässt dein Handy nie.',
            'Fünf Fragen beantworten: deine Körpergröße, wo du den Dart hältst, mit wie vielen Fingern, wie er fliegt und wie viel Grip du magst.',
            'Deinen idealen Dart sehen: Gewicht, Länge, Dicke, Form und Balance, maßstabsgetreu gezeichnet.',
            'Echte Darts vergleichen: Jeder Dart im Katalog bekommt einen Match-Wert (Passform, Stil und Gesamt), mit dem besten Treffer in Budget, Standard und Premium.',
          ],
        },
        {
          h2: 'Wo du den Dart hältst, bestimmt die Form',
          p: [
            'Wer den Dart vorne hält, mag das Gewicht meist nach vorne: einen Torpedo oder einen frontlastigen Barrel. In der Mitte halten passt zu einem geraden Barrel. Hinten halten passt zu einem konischen Barrel mit dem Gewicht weiter hinten. Deine Hand verschiebt das weiter: kurze Finger im Verhältnis zur Handfläche und ein kompakter Griff tendieren zu Bomb oder Torpedo, lange Finger, die sich über den Barrel verteilen, zu gerade.',
          ],
          table: {
            caption: 'Barrelformen im DartFit-Katalog ({darts} Steeldarts)',
            head: ['Form', 'Wo das Gewicht sitzt', 'Passt zu'],
            rows: [
              [
                'Gerade ({straightPct} der Darts)',
                'Gleichmäßig über den Barrel',
                'Griff in der Mitte, lange Finger',
              ],
              ['Torpedo', 'Vorne, nach hinten schmaler', 'Griff vorne'],
              ['Bomb', 'Ein dicker Punkt in der Mitte', 'Kompakter Griff, kurze Finger'],
              ['Konisch', 'Vorne, nach hinten dünner', 'Griff hinten'],
              ['Scalloped', 'Gerade mit Taille für die Finger', 'Spieler, die eine feste Stelle wollen'],
            ],
          },
        },
        {
          h2: 'Welche Darts sind am besten für Anfänger?',
          p: [
            'Fang in der Mitte an: etwa 22 bis 24 Gramm, ein gerader Barrel um 50 mm und ein mittlerer Grip, aus 90% Wolfram (Tungsten). Das verzeiht viel, während du deinen Griff findest, und die meisten Darts sind darauf ausgelegt ({w90Pct} unseres Katalogs sind 90% Wolfram). Weißt du einmal, wo du den Dart hältst und wie er fliegt, führt dich ein Fitting zu etwas Persönlicherem.',
          ],
        },
      ],
      faq: [
        [
          'Welcher Dart passt zu mir?',
          'Der Dart, dessen Gewicht, Länge, Dicke, Form und Grip zu deiner Hand und deinem Griff passen. DartFit misst deine Hand neben einer Bankkarte, stellt fünf Fragen und sortiert {darts} echte Darts danach, wie gut sie zu dir passen.',
        ],
        [
          'Wie finde ich Darts, die zu meiner Hand passen?',
          'Miss deine Hand mit DartFit neben einer Bankkarte und beantworte fünf Fragen zu Griff und Wurf. Du bekommst deinen idealen Dart und die echten Dartpfeile, die am besten dazu passen, in jeder Preisklasse.',
        ],
        [
          'Welche Dartpfeile soll ich kaufen?',
          'Kauf Darts, die zu deiner Hand und deinem Griff passen, nicht den Dart deines Lieblingsprofis. Wenn du unsicher bist, fang mit 22 bis 24 Gramm, einem geraden Barrel und 90% Wolfram an.',
        ],
        [
          'Spielt die Größe meiner Hand eine Rolle?',
          'Ja, vor allem für Länge und Dicke: längere Finger wollen einen längeren Barrel, eine breitere Hand oft einen etwas dickeren. Auf das Gewicht hat die Handgröße weniger Einfluss.',
        ],
        [
          'Ist DartFit kostenlos?',
          'Ja. Das Fitting ist kostenlos. Kaufst du über einen Shop-Link, bekommen wir eventuell eine Provision; das ändert nie die Rangfolge.',
        ],
        [
          'Was passiert mit dem Foto meiner Hand?',
          'Nichts verlässt dein Handy. Die Hand wird auf deinem Gerät erkannt, und nur die Maße in Millimetern werden verwendet.',
        ],
      ],
    },
    {
      key: 'algorithm',
      slug: 'wie-dartfit-funktioniert',
      title: 'Wie DartFit funktioniert: der Dart-Fitting-Algorithmus',
      description:
        'Wie DartFit aus einem Foto deiner Hand neben einer Bankkarte deinen idealen Dart macht: Handmessung, Unsicherheit, Barrel-Physik und Match-Werte.',
      h1: 'Wie der DartFit-Algorithmus deinen Dart wählt',
      answer:
        'DartFit misst deine Hand mit der Handykamera, mit einer Bankkarte als Lineal, und verbindet diese Maße mit deinen Antworten zu einer Schätzung von Gewicht, Länge und Dicke, die zu dir passen, jeweils mit einer Unsicherheit. Ein physikalisches Modell eines echten Barrels (Dichte von Wolfram, Bohrungen, Form) sorgt dafür, dass dein idealer Dart auch gebaut werden kann. Danach bekommt jeder Dart im Katalog einen Match-Wert im Vergleich zu diesem Ideal.',
      sections: [
        {
          h2: 'Schritt 1: deine Hand messen',
          p: [
            'Dein Handy erkennt 21 Punkte auf deiner Hand (MediaPipe, direkt auf dem Gerät). Eine Bankkarte misst immer 85,6 × 53,98 mm (ISO/IEC 7810 ID-1) und dient deshalb als Lineal im Foto. DartFit nimmt den Median vieler Bilder und verwirft Ausreißer. Das Bild verlässt dein Handy nie; nur die Maße in Millimetern werden verwendet.',
            'Keine Karte zur Hand? Du kannst auch ohne scannen; DartFit behält dann nur die Proportionen deiner Hand, schätzt die Größe aus deiner Körpergröße und sagt dir, dass es ungenauer ist.',
          ],
        },
        {
          h2: 'Schritt 2: von Antworten zu Maßen',
          p: [
            'Jeder Hinweis ist eine Schätzung mit einer Unsicherheit: deine Handgröße, wo du den Dart hältst, mit wie vielen Fingern, wie er fliegt und wie viel Grip du magst. DartFit verbindet sie, gewichtet danach, wie sicher sie sind. Der Ausgangspunkt für Steeldarts sind 22 Gramm; deine Hand und dein Wurf verschieben ihn von dort.',
          ],
          list: [
            'Die Länge folgt deinen Fingern: etwa 44 mm mit zwei Fingern am Barrel, 48 mm mit drei und 52 mm mit vier, angepasst an deine Fingerlänge und wo du hältst.',
            'Die Dicke folgt deiner Hand: um 6,8 mm, etwas dicker für breite Hände.',
            'Ohne Scan schätzen wir deine Hand aus deiner Körpergröße (eine Hand ist im Schnitt etwa 10,75% der Körpergröße).',
          ],
        },
        {
          h2: 'Schritt 3: Physik, damit dein idealer Dart existieren kann',
          p: [
            'Gewicht, Länge und Dicke hängen zusammen: Ein Barrel ist Metall mit einer Dichte. DartFit rechnet einen Barrel mit der Dichte von Wolframlegierungen (ASTM B777), den Bohrungen für Spitze und Gewinde und dem Profil. Kalibriert an 34 geraden Barrels sagt es deren angegebenes Gewicht auf etwa 7% genau voraus. Lässt sich dein Wunsch nicht in 90% Wolfram bauen, versucht es 95%; Darts, deren angegebenes Gewicht nicht zu den Maßen passt, werden erst nach einer Prüfung empfohlen.',
          ],
        },
        {
          h2: 'Schritt 4: dein idealer Barrel und seine Form',
          p: [
            'DartFit sucht das Profil (wie stark Vorder- und Rückseite konisch zulaufen), das genau dein Gewicht trifft und den Schwerpunkt dorthin legt, wo dein Griff ihn will, mit einer Tendenz zur Form, die dein Griff und deine Hand nahelegen: Torpedo bei einem Griff vorne, gerade in der Mitte, konisch hinten, Bomb bei einem kompakten Griff mit kurzen Fingern.',
          ],
        },
        {
          h2: 'Schritt 5: der Match-Wert',
          p: [
            'Jeder echte Dart bekommt pro Maß einen Abstand zu deinem Ideal, in Standardabweichungen und gewichtet danach, wie stark du den Unterschied spüren würdest. Daraus werden drei Zahlen: Passform (Gewicht, Länge, Dicke), Stil (Barreltyp, Grip, Balance) und gesamt. Im Ergebnis steht der beste Gesamtwert je Preisklasse: Budget (bis 50 €), Standard (bis 80 €) und Premium.',
          ],
        },
        {
          h2: 'Was DartFit nicht behauptet',
          p: [
            'Es gibt keine Studie, die Handgröße in das perfekte Dartgewicht übersetzt. DartFit gibt dir einen begründeten Ausgangspunkt und eine kurze Liste zum Ausprobieren, mit den Gründen. Jede Faustregel im Modell steht mit ihrer Quelle auf der Methodenseite in der App, und wir passen sie mit dem an, was Spieler uns nach dem Kauf erzählen.',
          ],
        },
      ],
      faq: [
        [
          'Wie genau ist DartFit?',
          'Die Bankkarte macht aus dem Foto echte Millimeter, und DartFit nimmt den Median vieler Bilder; wir prüfen das gegen Hände, die mit dem Maßband gemessen wurden. Die Barrel-Physik sagt angegebene Gewichte auf etwa 7% genau voraus. Der Schritt von der Hand zum perfekten Gewicht ist eine begründete Schätzung, kein Gesetz; deshalb bekommst du eine kurze Liste.',
        ],
        [
          'Warum eine Bankkarte?',
          'Jede Bankkarte ist gleich groß (85,6 × 53,98 mm), damit kann ein Handyfoto in echten Millimetern messen.',
        ],
        [
          'Welche Darts sind im Katalog?',
          '{darts} Steeldarts ({models} Modelle) von {brands} Marken, darunter Target, Winmau, Red Dragon, Unicorn, Harrows und Bulls.',
        ],
        [
          'Speichert DartFit mein Foto?',
          'Nein. Die Hand wird auf deinem Handy erkannt, und nur die Maße werden verwendet.',
        ],
      ],
    },
    {
      key: 'why',
      slug: 'warum-der-richtige-dart',
      title: 'Warum ein passender Dart besser fliegt',
      description:
        'Warum Darts, die zu deiner Hand passen, helfen: ein wiederholbarer Griff, ein sauberer Abwurf und weniger Ermüdung. Was ein unpassender Dart bewirkt.',
      h1: 'Warum du einen Dart willst, der zu dir passt',
      answer:
        'Mit einem Dart, der zu deiner Hand passt, greifst du ihn bei jedem Wurf gleich, und darauf baut konstantes Darten auf. Ist der Barrel zu kurz, drängen sich deine Finger; zu lang, und sie rutschen auf den Schaft. Zu schwer ermüdet den Arm, zu leicht macht jeden kleinen Fehler sichtbar. Ein passender Dart nimmt diese Variablen weg, damit dein Training in den Wurf geht und nicht in den Kampf mit dem Dart.',
      sections: [
        {
          h2: 'Was macht ein unpassender Dart?',
          list: [
            'Zu kurz für deinen Griff: deine Finger berühren Schaft oder Spitze, und der Griff verschiebt sich von Wurf zu Wurf.',
            'Zu lang: das Gewicht sitzt weg von deinen Fingern, und der Dart wackelt aus der Hand.',
            'Zu schwer: du drückst statt zu werfen, und dein Arm ermüdet an einem langen Abend.',
            'Zu leicht: jede kleine Änderung beim Abwurf siehst du auf dem Board.',
            'Grip zu glatt oder zu scharf: der Dart rutscht, oder er bleibt beim Loslassen an den Fingern hängen.',
          ],
        },
        {
          h2: 'Warum Konstanz beim Griff beginnt',
          p: [
            'Darts heißt, eine Bewegung immer wieder zu wiederholen. Das gelingt nur, wenn du ohne hinzusehen jedes Mal denselben Griff findest. Ein Barrel, dessen Länge zu deinen Fingern passt und dessen Form das Gewicht unter deine Finger legt, gibt dir diese feste Stelle.',
          ],
        },
        {
          h2: 'Werde ich mit einem besseren Dart besser?',
          p: [
            'Nicht von allein. Ein passender Dart fügt kein Talent hinzu; er nimmt Widerstand weg. Spieler merken es oft als Dart, der sofort "gut liegt", wodurch Training mehr bringt. Wirfst du seit Jahren dieselben Darts und fühlen sie sich gut an, behalte sie.',
          ],
        },
        {
          h2: 'Woran erkenne ich, ob meine Darts passen?',
          list: [
            'Du findest deinen Griff, ohne hinzusehen.',
            'Deine Finger liegen am Barrel, nicht am Schaft oder an der Spitze.',
            'Der Dart verlässt deine Hand sauber, ohne hängen zu bleiben.',
            'Dein Arm ist nach einem langen Abend nicht müde.',
          ],
          after: [
            'Stimmt einer dieser Punkte nicht, sind zwei Minuten Fitting es wert. DartFit vergleicht deine Hand und deinen Griff mit {darts} echten Darts.',
          ],
        },
      ],
      faq: [
        [
          'Warum ist das Gewicht eines Darts wichtig?',
          'Das Gewicht bestimmt, wie viel Kraft der Wurf kostet und wie stabil der Dart fliegt. Zu schwer ermüdet, zu leicht macht kleine Fehler sichtbar.',
        ],
        [
          'Werfen Profis gefittete Darts?',
          'Profis werfen meist einen Signature-Dart, der um ihren eigenen Griff gebaut ist. DartFit zeigt, welcher Profi denselben Typ Dart wirft wie du.',
        ],
        [
          'Wie oft sollte ich die Darts wechseln?',
          'Nur wenn etwas nicht passt: der Griff verschiebt sich, der Dart rutscht oder der Arm ermüdet. Häufiges Wechseln erschwert einen wiederholbaren Wurf.',
        ],
      ],
    },
    {
      key: 'weight',
      slug: 'welches-dartgewicht',
      title: 'Welches Dartgewicht ist richtig? Ratgeber für Steeldarts',
      description:
        'Welches Dartgewicht wählen: die meisten Steeldarts wiegen 20 bis 26 Gramm. Wie Wurf, Griff und Hand das richtige Gewicht bestimmen, mit Daten von {darts} Darts.',
      h1: 'Welches Dartgewicht ist das richtige für mich?',
      answer:
        'Fang bei Steeldarts mit 22 bis 24 Gramm an: {share2224} der {darts} Darts im DartFit-Katalog liegen in diesem Bereich, der Median liegt bei {medW} Gramm. Ein flacher, schneller Wurf passt oft zu einem etwas schwereren Dart, ein Wurf im Bogen zu einem etwas leichteren. Dein aktueller Dart ist der beste Hinweis: Fühlt er sich zu leicht oder zu schwer an, geh etwa 2 Gramm weiter.',
      sections: [
        {
          h2: 'Wie schwer sind die meisten Darts?',
          table: {
            caption: 'Gewichte im DartFit-Katalog ({darts} Steeldarts)',
            head: ['', 'Gewicht'],
            rows: [
              ['Leichtester', '{minW} g'],
              ['Ein Viertel der Darts bis', '{q25W} g'],
              ['Median', '{medW} g'],
              ['Drei Viertel bis', '{q75W} g'],
              ['Schwerster', '{maxW} g'],
            ],
          },
        },
        {
          h2: 'Was bestimmt das richtige Gewicht für dich?',
          list: [
            'Wie der Dart fliegt: ein flacher, direkter Wurf passt oft zu etwas mehr Gewicht, ein hoher Bogen zu etwas weniger.',
            'Deine Hand: größere Hände vertragen oft etwas mehr Gewicht; der Effekt ist klein.',
            'Dein aktueller Dart: fühlt er sich zu leicht oder zu schwer an, sollte der nächste etwa 2 Gramm schwerer oder leichter sein.',
            'Ermüdung: wird dein Arm an langen Abenden müde, nimm einen leichteren.',
          ],
        },
        {
          h2: 'Schwere oder leichte Darts: was ist besser?',
          p: [
            'Keins von beiden. Schwerere Darts fliegen stabiler und verzeihen kleine Fehler, kosten aber mehr Kraft. Leichtere Darts verlangen einen präziseren Abwurf. Das richtige Gewicht ist das, das du den ganzen Abend gleich werfen kannst.',
          ],
        },
        {
          h2: 'Warum der Wolframanteil wichtig ist',
          p: [
            'Wolfram (Tungsten) ist sehr dicht, also bedeutet mehr Wolfram einen schlankeren Barrel bei gleichem Gewicht. 90% Wolfram ist der Standard ({w90Pct} unseres Katalogs); mit 95% bleibt auch ein schwerer Dart schlank. Messingdarts sind günstiger, aber bei gleichem Gewicht viel dicker.',
          ],
        },
      ],
      faq: [
        [
          'Welches Dartgewicht ist gut für Anfänger?',
          'Etwa 22 bis 24 Gramm bei Steeldarts. Das ist die Mitte des Marktes und verzeiht viel, während du deinen Griff findest.',
        ],
        [
          'Sind 18-Gramm-Darts zu leicht?',
          'Nicht, wenn sie zu deinem Wurf passen. Leichte Darts passen zu einem schnellen, präzisen Abwurf; die meisten Spieler fangen schwerer an.',
        ],
        [
          'Wie schwer darf ein Steeldart höchstens sein?',
          'Nach den Regeln der meisten Turniere darf ein Steeldart bis zu 50 Gramm wiegen, aber fast alle Darts im Handel wiegen 18 bis 30 Gramm.',
        ],
      ],
    },
    {
      key: 'gift',
      slug: 'darts-als-geschenk',
      title: 'Darts als Geschenk: passend wählen, ohne die Hand zu messen',
      description:
        'Darts verschenken? Wähle ein Set, das passt, anhand von Körpergröße, Handtyp und wie der Spieler den Dart hält. Kostenloses Geschenk-Fitting mit DartFit.',
      h1: 'Darts als Geschenk kaufen',
      answer:
        'Um Darts zu kaufen, die zu jemand anderem passen, brauchst du vier Dinge, die du wahrscheinlich weißt: wie groß der Spieler ist, ob seine Hände lang und schlank oder kurz und kräftig sind, wo er den Dart hält und wie er fliegt. DartFit hat einen Geschenkmodus, der genau das fragt, ohne Handscan, und die am besten passenden Darts in drei Preisklassen zeigt.',
      sections: [
        {
          h2: 'Was muss ich über den Spieler wissen?',
          list: [
            'Körpergröße: die Größe einer Hand folgt der Körpergröße gut genug für eine erste Schätzung.',
            'Handtyp: lange, schlanke Hände passen zu einem geraderen, schlankeren Barrel; kurze, kräftige Hände zu einer etwas dickeren Bomb oder einem Torpedo.',
            'Wo er den Dart hält (vorne, Mitte oder hinten), wenn du es weißt. Weißt du es nicht, ist das auch in Ordnung.',
            'Seinen aktuellen Dart, wenn du heimlich das Gewicht auf der Packung sehen kannst.',
          ],
        },
        {
          h2: 'Und wenn ich nicht weiß, wie er wirft?',
          p: [
            'Wähle "Weiß nicht". DartFit nimmt dann die häufigste Antwort und zeigt eine sichere Wahl in der Mitte. Ein gerader Barrel mit etwa 22 bis 24 Gramm passt zu den meisten Spielern.',
          ],
        },
        {
          h2: 'Welche Preisklasse ist ein gutes Geschenk?',
          p: [
            'DartFit zeigt den besten Treffer je Klasse: Budget (bis 50 €), Standard (bis 80 €) und Premium. Standard ist für die meisten Geschenke die beste Wahl: 90% Wolfram, schlank und langlebig.',
          ],
        },
      ],
      faq: [
        [
          'Kann ich Darts für jemanden kaufen, ohne seine Hand zu messen?',
          'Ja. Mit Körpergröße und Handtyp macht DartFit eine gute Schätzung; sie ist ungenauer als ein Scan, also wähle ein Gewicht in der Mitte.',
        ],
        [
          'Welche Darts sind ein gutes Geschenk?',
          'Ein Set aus 90% Wolfram mit etwa 22 bis 24 Gramm und einem geraden oder leicht torpedoförmigen Barrel passt zu den meisten Spielern.',
        ],
      ],
    },
  ],
};
