/**
 * Answer-first leads: for every guide section whose own first paragraph is not a 40–60 word
 * standalone answer (it opens with a list, a table, or a short line), the answer an assistant or an
 * AI overview can quote, shown right under the question heading. Keyed `<page key>:<section index>`.
 * Only facts the section itself states; {placeholders} come from the live catalogue.
 * `test/guides.test.ts` checks that every section in every language opens with 40–60 words.
 */
import type { Lang } from './types';

export const LEADS: Record<Lang, Record<string, string>> = {
  en: {
    'guide:0':
      'Five things decide whether a dart fits you: its weight, its barrel length, its thickness, the barrel shape and the grip. Colour, brand and the pro on the box are taste. Most steel-tip darts weigh 18 to 26 g, and the middle of our catalogue sits at {medW} g, with barrels around {medL} mm long.',
    'guide:1':
      'You find a dart that fits your hand by trying darts until one feels right, or by measuring. DartFit measures your hand next to a bank card on your phone, asks five questions about how you hold and throw, draws your ideal dart and scores every dart in the catalogue against it.',
    'guide:2':
      'Where you hold the dart points to its shape. A grip at the front suits a torpedo or a front-weighted barrel, a grip in the middle a straight barrel, and a grip at the back a tapered one. Short fingers and a compact grip lean towards a bomb; long fingers spread along the barrel lean straight.',
    'guide:3':
      'A beginner does best with a dart from the middle of the market: about 22 to 24 g, a straight barrel of around 50 mm, a medium grip and 90% tungsten. That forgives a grip that still moves. Once you know where you hold the dart and how it flies, a fitting can point to something more personal.',
    'algorithm:2':
      'DartFit checks that your ideal dart can actually be made. It models a barrel from the density of tungsten alloys, the bores for point and thread, and its profile, and predicts listed weights to within about 7%. If 90% tungsten cannot reach your weight it tries 95%, and listings whose weight does not fit their size are kept out.',
    'why:0':
      'A dart that doesn’t fit makes you compensate. Too short and your fingers touch the shaft or the point; too long and it wobbles out of your hand; too heavy and your arm tires; too light and every small change in your release shows on the board; the wrong grip slips or sticks.',
    'why:3':
      'Your current darts fit if you can find your grip without looking, your fingers sit on the barrel rather than the shaft or point, the dart leaves your hand cleanly without sticking, and your arm isn’t tired after a long session. If one of these fails, a two-minute fitting is worth it.',
    'weight:0':
      'Most steel-tip darts weigh between {q25W} and {q75W} g: that is the middle half of the {darts} darts in our catalogue. The median is {medW} g, the lightest dart weighs {minW} g and the heaviest {maxW} g, so a dart in the middle range is a perfectly normal choice to start from.',
    'weight:1':
      'Four things move your right weight: how the dart flies, your hand, your current dart and fatigue. A flat, direct throw tends to suit a little more weight and a high arc a little less, and large hands handle slightly more. If your current dart feels wrong, change by about 2 g, and go lighter if your arm tires.',
    'weight:2':
      'Neither heavy nor light darts are better. Heavier darts fly more steadily and forgive small errors in your release, but they take more effort over a long evening. Lighter darts need a more precise release and reward a quick arm. The right weight is the one you can throw the same way all night.',
    'gift:0':
      'To pick darts for someone else you need four things: their height, their hand type (long and slender, or short and stubby), where they hold the dart if you know it, and the weight of their current darts if you can sneak a look at the box. Not knowing some of these is fine.',
    'gift:1':
      'If you don’t know how they throw, choose “Not sure” in DartFit. It then uses the most common answer and shows a safe middle choice. For most players that is a straight barrel of about 22 to 24 g, which is also where most of the darts in our catalogue sit.',
    'gift:2':
      'Standard is the sweet spot for most presents. DartFit shows the best match in each price class: budget up to €50, standard up to €80 and premium above that. A standard dart is usually 90% tungsten, slim and durable, so it feels like a real step up without a pro-model price.',
    'beginners:3':
      'Your first proper darts can cost about €30 to €60: that buys 80 to 90% tungsten, the best value for most beginners. Under €25 you get brass or low tungsten, which is fine for trying the game. Over €80 buys 95% tungsten and pro models, worth it once your grip has settled.',
    'beginners:4':
      'Besides darts, a beginner needs spare flights and shafts, because they break and a bent flight changes how the dart flies. You also need a sisal board hung with the bull at 1.73 m and the oche 2.37 m away, and a checkout chart to learn which double to leave.',
    'setup:0':
      'Most players start with a medium shaft of about 45 to 48 mm. A short shaft of about 35 mm makes a compact dart for a flat, fast throw, and a long one of 50 mm and up gives more steering at the back for a lob or a wobbling dart. Compare millimetres, because brands name lengths differently.',
    'setup:2':
      'The flight shape sets how much drag the back of the dart has. A standard flight has the biggest area, the most stability and a higher arc. Kite and pear shapes are a touch faster, slim flights suit a fast and flat throw, and small standard flights keep tight groups from clashing.',
    'setup:4':
      'Yes. Next to your ideal barrel, DartFit suggests a shaft length and a flight shape that suit your hold and your throw. It is the same set-up you see on the dart drawing while you answer the questions, so you can buy barrel, shaft and flights as one matched set.',
    'technique:2':
      'A good throwing motion has five steps. Aim by lining up your eye, the dart and the target; draw the dart back towards your eye with the elbow still; accelerate in one smooth push; release at the same point every time, just before your arm is straight; then follow through towards the target.',
    'technique:3':
      'Where your darts miss tells you what moved. Darts drifting left or right usually mean the elbow moves sideways or the wrist turns. High darts come from a late release or pushing upwards, low ones from an early release or a dropping elbow, and darts all over the board from a grip that changes.',
    'steelsoft:0':
      'Steel-tip darts have steel points, weigh about 18 to 30 g and are thrown at a sisal board from 2.37 m, with the score kept by hand or in an app. Soft-tip darts have plastic points, usually weigh 16 to 20 g and go at an electronic board, often from 2.44 m, that counts the score.',
    'steelsoft:1':
      'Soft-tip darts don’t work well on a sisal board: their plastic points bend and break in the bristle. Some barrels take both kinds of point with a conversion point, so one set can play both games, but changing the point changes the weight and balance, so the dart will feel different.',
    'steelsoft:3':
      'The pros you see on television play steel tip: the televised tours all use sisal boards and steel points. Soft tip has its own scene and its own leagues, and it is especially popular in Asia and in bars across Europe, but the tournaments on TV are steel tip.',
    'size:1':
      'Choose by your hand and grip; most barrels are medium, about 6.5 to 7.5 mm thick. A slim barrel under about 6.5 mm groups tighter and deflects less but asks for a precise grip. A thick one over about 7.5 mm gives more to hold and suits big hands and players who like feel.',
    'size:2':
      'Tungsten darts are slimmer because tungsten is more than twice as dense as brass, so the same weight fits in a much thinner barrel. The higher the tungsten percentage, the slimmer the barrel can be: {w95Pct} of the darts in our catalogue are 95% tungsten, and most of the rest are 90%.',
    'size:3':
      'Length, thickness and weight are tied together: in the same material, a longer or thicker barrel is heavier. You cannot change one without the others, which is why DartFit calculates all three together and checks every listing in its catalogue against what a barrel of that size and alloy can weigh.',
    'care:2':
      'Shafts work loose because the throw and every impact shake them. Fit O-rings or shaft rings, tighten the shafts by hand rather than with pliers, and check them at the start of every session. Aluminium shafts loosen more easily than nylon ones, so they need checking more often.',
    'care:3':
      'Replace a flight as soon as it is torn, creased or no longer flat, and a shaft as soon as it is bent or cracked. Both change how the dart flies, and a damaged flight also deflects the next dart, so a few spares in your case are worth having.',
    'care:4':
      'A sisal board lasts longer if you turn it every few weeks so the 20 area doesn’t wear first, never soak it, pull darts straight out with a slight twist, and keep it away from direct sunlight and radiators. After turning it, put the number ring back with the 20 at the top.',
    'board:0':
      'A dartboard hangs with the centre of the bull 1.73 m above the floor: the official height for steel-tip darts. Measure to the middle of the bull, not to the top of the board, and check it with the diagonal, which is 2.93 m from the bull to the back of the oche at floor level.',
    'board:2':
      'Mount a dartboard by fixing its bracket at the height the instructions give, so the bull ends up at 1.73 m, and hang the board with the 20 at the top. Check that it hangs level and doesn’t rock, then measure the diagonal from the bull to the back of the oche: it should be 2.93 m.',
    'board:3':
      'A dartboard needs light from the front or from both sides, so the darts already in the board cast no shadow over the segments you are aiming at. A ring light fitted around the board does exactly that, and it is the easiest way to light a board at home.',
    'board:4':
      'Protect the wall with a surround, a foam or rubber ring around the board that catches the darts that miss, and protect the floor with a mat at the oche. The mat also saves your points from hitting tiles or concrete when a dart bounces out or falls.',
    'board:5':
      'You need about 3 m from the wall to the back of where you stand, and about 1.5 m of width. That gives the 2.37 m throwing distance plus room behind the oche, and space for your throwing arm and for a second player to stand clear.',
    'shapes:1':
      'A torpedo barrel is thickest towards the front and tapers towards the back, so the weight sits forward. It suits players who hold the dart near the front and like the dart to pull towards the board, because the weight stays just ahead of their fingers.',
    'shapes:3':
      'A tapered barrel is thick at the front and thins steadily to the back; it is longer and slimmer than a torpedo. It suits players who hold the dart further back, because the thin rear section leaves room for the fingers while the weight stays forward of the grip.',
    'shapes:4':
      'A scalloped barrel is a mostly straight barrel with a narrower waist or a concave section. That waist gives your fingers a fixed spot they can find without looking, which helps players who want to hold the dart in exactly the same place on every throw.',
    'shapes:5':
      'Your hold decides most of it: a grip at the front suits a torpedo or a front-weighted barrel, a grip in the middle a straight barrel, and a grip at the back a tapered one. A compact grip with short fingers leans to a bomb or torpedo, long fingers along the barrel to straight.',
    'grip:1':
      'You need more grip if the dart slides forward in your fingers at release, or if you squeeze harder than you would like just to hold it. You need less grip if the dart sticks or drags off your fingertips, or if your fingertips are sore after a session.',
    'grip:2':
      'No, the grip doesn’t have to be the same along the whole barrel. Many barrels have knurling only where the fingers go and smooth sections elsewhere. If you hold the dart at the front, the grip at the front matters most; if you hold it further back, the rear rings do the work.',
    'tungsten:0':
      'A 90% tungsten alloy has a density of about 17.05 g/cm³, against 18.05 for 95% tungsten, 15.05 for 80% and 8.5 for brass. At the same weight and length, a 95% barrel is therefore about 3% slimmer than a 90% one, and a brass barrel about 40% thicker.',
    'tungsten:1':
      '95% tungsten is worth it for heavy darts: a 26 g dart in 95% stays slim enough for most grips. For a dart of around 22 g the difference is small and 90% is usually the better buy, which is why only {w95Pct} of the darts in our catalogue are 95% tungsten.',
    'tungsten:2':
      'Brass darts aren’t bad, just thick and usually light. They are cheap and fine for trying the game, but brass is about half as dense as 90% tungsten, so at a normal steel-tip weight the barrel gets fat. That is why most players move to tungsten quickly.',
    'events:0':
      'The big tournaments still to come this season are the Grand Slam of Darts in Wolverhampton (14–22 November 2026), the Players Championship Finals in Minehead (27–29 November 2026) and the World Darts Championship at Alexandra Palace in London, from 11 December 2026 to 3 January 2027.',
    'events:2':
      'Luke Littler won almost everything in 2026: the World Championship (7–1 against Gian van Veen in the final), the World Masters, the UK Open and the Premier League. He also won the World Cup of Darts for England with Luke Humphries, 10–5 against the Netherlands.',
    'rules:0':
      'A dartboard hangs with the centre of the bull 1.73 m above the floor, the official height in steel-tip darts. To check it, measure the diagonal from the bull to the back of the oche at floor level: it should be 2.93 m. The oche itself sits 2.37 m from the face of the board.',
    'rules:1':
      'The oche, the throw line, is 2.37 m from the board. Measure along the floor from the back edge of the throw line to a plumb line dropped from the face of the board, not from the wall. With the bull at 1.73 m, the diagonal from the bull to the oche is 2.93 m.',
    'rules:2':
      'In 501 each player starts on 501 and throws three darts per turn, and the score is subtracted. You must finish exactly on zero with a double (the outer ring) or the bull, which counts as double 25. A turn that would go below zero, reach zero without a double, or leave 1 is a bust.',
    'rules:3':
      'A steel-tip dart may weigh at most 50 g and be at most 30.5 cm long. Almost every dart on sale weighs far less: in the DartFit catalogue the median is {medW} g and the heaviest is {maxW} g, so a normal set never comes close to the limits.',
    'checkout:0':
      'Seven scores of 170 or less cannot be finished in three darts: 169, 168, 166, 165, 163, 162 and 159. Above 170 nothing can be checked out at all. Players call these bogey numbers and plan their scoring to leave something else, ideally a number with a clean route to a double.',
  },
  nl: {
    'guide:0':
      'Vijf dingen bepalen of een dart bij je past: het gewicht, de lengte van de barrel, de dikte, de barrelvorm en de grip. Kleur, merk en de prof op de doos zijn smaak. De meeste steeltip darts wegen 18 tot 26 gram; het midden van onze catalogus ligt op {medW} gram, met barrels van ongeveer {medL} mm.',
    'guide:1':
      'Een dart die bij je hand past vind je door darts te proberen tot er een goed voelt, of door te meten. DartFit meet je hand naast een pasje op je telefoon, stelt vijf vragen over hoe je de dart vasthoudt en gooit, tekent je ideale dart en geeft elke dart in de catalogus daar een score op.',
    'guide:2':
      'Waar je de dart vasthoudt, wijst de vorm aan. Een grip voorin past bij een torpedo of een barrel met het gewicht naar voren, een grip in het midden bij een rechte barrel en een grip achterin bij een taps toelopende. Korte vingers en een compacte grip neigen naar een bomb, lange vingers naar recht.',
    'guide:3':
      'Als beginner zit je goed met een dart uit het midden van de markt: ongeveer 22 tot 24 gram, een rechte barrel van zo’n 50 mm, een gemiddelde grip en 90% tungsten. Die vergeeft een grip die nog verschuift. Weet je eenmaal waar je de dart vasthoudt en hoe hij vliegt, dan wijst een fitting iets persoonlijkers aan.',
    'algorithm:2':
      'DartFit controleert of je ideale dart ook echt gemaakt kan worden. Het rekent een barrel door met de dichtheid van tungstenlegeringen, de boringen voor punt en schroefdraad en het profiel, en voorspelt opgegeven gewichten tot op ongeveer 7%. Lukt je gewicht niet in 90% tungsten, dan probeert het 95%; darts met een onmogelijk gewicht blijven buiten beeld.',
    'why:0':
      'Met een dart die niet past ga je compenseren. Te kort en je vingers raken de shaft of de punt; te lang en hij wiebelt uit je hand; te zwaar en je arm wordt moe; te licht en elk klein verschil in je release zie je terug op het bord; verkeerde grip glijdt weg of blijft plakken.',
    'why:3':
      'Je huidige darts passen als je je grip zonder kijken vindt, je vingers op de barrel zitten en niet op de shaft of de punt, de dart schoon uit je hand gaat zonder te plakken en je arm na een lange avond niet moe is. Klopt een van deze niet, dan is een fitting van twee minuten de moeite waard.',
    'weight:0':
      'De meeste steeltip darts wegen tussen {q25W} en {q75W} gram: dat is de middelste helft van de {darts} darts in onze catalogus. De mediaan is {medW} gram, de lichtste dart weegt {minW} gram en de zwaarste {maxW} gram, dus een dart uit het middengebied is een heel normale keuze om mee te beginnen.',
    'weight:1':
      'Vier dingen verschuiven jouw juiste gewicht: hoe de dart vliegt, je hand, je huidige dart en vermoeidheid. Een vlakke, directe worp past vaak bij iets meer gewicht en een hoge boog bij iets minder, en grote handen kunnen wat meer aan. Voelt je huidige dart niet goed, ga dan ongeveer 2 gram omhoog of omlaag.',
    'weight:2':
      'Zware en lichte darts zijn geen van beide beter. Zwaardere darts vliegen stabieler en vergeven kleine foutjes in je release, maar kosten meer kracht op een lange avond. Lichtere darts vragen een preciezere release en belonen een snelle arm. Het juiste gewicht is het gewicht dat je de hele avond op dezelfde manier gooit.',
    'gift:0':
      'Om darts voor iemand anders te kiezen heb je vier dingen nodig: de lengte van de speler, het handtype (lang en slank of kort en stevig), waar hij of zij de dart vasthoudt als je dat weet, en het gewicht van de huidige darts als je stiekem op de doos kunt kijken. Weet je niet alles, geen probleem.',
    'gift:1':
      'Weet je niet hoe de speler gooit, kies dan “Weet ik niet” in DartFit. Dan gebruikt DartFit het meest voorkomende antwoord en laat het een veilige middenkeuze zien. Voor de meeste spelers is dat een rechte barrel van ongeveer 22 tot 24 gram, en daar zitten ook de meeste darts in onze catalogus.',
    'gift:2':
      'Standaard is voor de meeste cadeaus de beste keus. DartFit laat in elke prijsklasse de beste match zien: budget tot €50, standaard tot €80 en premium daarboven. Een standaard dart is meestal 90% tungsten, slank en duurzaam, dus het voelt als een echte stap vooruit zonder de prijs van een profmodel.',
    'beginners:3':
      'Je eerste echte darts mogen ongeveer €30 tot €60 kosten: daarvoor krijg je 80 tot 90% tungsten, voor de meeste beginners de beste koop. Onder de €25 krijg je messing of weinig tungsten, prima om het spel te proberen. Boven de €80 koop je 95% tungsten en profmodellen, de moeite waard zodra je grip vastligt.',
    'beginners:4':
      'Naast darts heeft een beginner reserveflights en -shafts nodig, want die breken en een verbogen flight verandert hoe de dart vliegt. Verder een sisal bord met de bull op 1,73 m en de oche op 2,37 m afstand, en een uitgooitabel om te leren welke dubbel je moet overlaten.',
    'setup:0':
      'De meeste spelers beginnen met een medium shaft van ongeveer 45 tot 48 mm. Een korte shaft van zo’n 35 mm maakt een compacte dart voor een vlakke, snelle worp, en een lange van 50 mm of meer geeft achterin meer sturing voor een boogworp of een dart die wiebelt. Vergelijk millimeters, want merken noemen lengtes verschillend.',
    'setup:2':
      'De vorm van de flight bepaalt hoeveel weerstand de achterkant van de dart heeft. Een standaard flight heeft het grootste oppervlak, de meeste stabiliteit en een hogere boog. Kite- en peervormen zijn iets sneller, slim flights passen bij een snelle, vlakke worp en kleine standaard flights botsen minder in strakke groepjes.',
    'setup:4':
      'Ja. Naast je ideale barrel stelt DartFit een shaftlengte en een flightvorm voor die passen bij hoe je de dart vasthoudt en gooit. Het is dezelfde opbouw die je op de getekende dart ziet terwijl je de vragen beantwoordt, zodat je barrel, shaft en flights als één passende set kunt kopen.',
    'technique:2':
      'Een goede worp heeft vijf stappen. Richt door je oog, de dart en het doel op één lijn te brengen; breng de dart terug naar je oog terwijl je elleboog stil blijft; versnel in één soepele beweging; laat elke keer op hetzelfde punt los, net voor je arm gestrekt is; en zwaai daarna door richting het doel.',
    'technique:3':
      'Waar je darts missen, vertelt je wat er bewoog. Gaan ze naar links of rechts, dan beweegt je elleboog opzij of draait je pols. Te hoog komt door laat loslaten of omhoog duwen, te laag door te vroeg loslaten of een zakkende elleboog, en overal op het bord door een grip die steeds verandert.',
    'steelsoft:0':
      'Steeltip darts hebben een stalen punt, wegen ongeveer 18 tot 30 gram en worden van 2,37 m op een sisal bord gegooid; de score houd je zelf of in een app bij. Softtip darts hebben een plastic punt, wegen meestal 16 tot 20 gram en gaan op een elektronisch bord, vaak van 2,44 m, dat zelf telt.',
    'steelsoft:1':
      'Softtip darts werken niet goed op een sisal bord: de plastic punten buigen en breken in de vezels. Sommige barrels kunnen met een conversiepunt allebei de soorten punt hebben, zodat je met één set beide spellen kunt spelen, maar een andere punt verandert het gewicht en de balans, dus de dart voelt anders.',
    'steelsoft:3':
      'De profs die je op televisie ziet, spelen steeltip: de uitgezonden tours gebruiken allemaal sisal borden en stalen punten. Softtip heeft een eigen scene en eigen competities en is vooral populair in Azië en in cafés in heel Europa, maar de toernooien op tv zijn steeltip.',
    'size:1':
      'Kies op je hand en je grip; de meeste barrels zijn medium, ongeveer 6,5 tot 7,5 mm dik. Een slanke barrel onder de 6,5 mm groepeert strakker en ketst minder af, maar vraagt een precieze grip. Een dikke barrel boven de 7,5 mm geeft meer houvast en past bij grote handen en spelers die veel gevoel willen.',
    'size:2':
      'Tungsten darts zijn slanker omdat tungsten meer dan twee keer zo zwaar is als messing, zodat hetzelfde gewicht in een veel dunnere barrel past. Hoe hoger het tungstenpercentage, hoe slanker de barrel kan zijn: {w95Pct} van de darts in onze catalogus is 95% tungsten en de meeste andere zijn 90%.',
    'size:3':
      'Lengte, dikte en gewicht hangen aan elkaar: in hetzelfde materiaal is een langere of dikkere barrel zwaarder. Je kunt er dus niet één veranderen zonder de andere, en daarom rekent DartFit ze samen uit en controleert het elke dart in de catalogus op wat een barrel van die maat en legering kan wegen.',
    'care:1':
      'Je maakt de grip schoon door shafts en punten los te draaien en de barrels met een zachte tandenborstel in warm water met een druppel afwasmiddel te schrobben. Spoel en droog ze daarna meteen af. Huidvet en krijt vullen langzaam de knurling, en daardoor voelt de grip van een dart na een tijdje gladder.',
    'care:2':
      'Shafts draaien los omdat de worp en elke inslag ze laten trillen. Gebruik O-ringen of shaftringen, draai de shafts met de hand vast in plaats van met een tang, en controleer ze aan het begin van elke sessie. Aluminium shafts gaan sneller los dan nylon, dus die moet je vaker nakijken.',
    'care:3':
      'Vervang een flight zodra hij gescheurd, gekreukt of niet meer plat is, en een shaft zodra hij krom of gebarsten is. Allebei veranderen ze hoe de dart vliegt, en een beschadigde flight ketst ook de volgende dart af, dus een paar reserves in je koker zijn de moeite waard.',
    'care:4':
      'Een sisal bord gaat langer mee als je het om de paar weken draait zodat het vak van de 20 niet als eerste slijt, het nooit nat maakt, darts recht en met een kleine draai uittrekt en het uit de zon en weg van de verwarming houdt. Zet na het draaien de nummerring terug met de 20 bovenaan.',
    'board:0':
      'Een dartbord hangt met het midden van de bull op 1,73 m boven de vloer: de officiële hoogte bij steeltip darts. Meet tot het midden van de bull, niet tot de bovenkant van het bord, en controleer het met de diagonaal: van de bull tot de achterkant van de oche op de vloer is dat 2,93 m.',
    'board:1':
      'De oche ligt 2,37 m van de voorkant van het bord, niet van de muur, gemeten over de vloer tot de achterkant van de werplijn. Een strook tape is genoeg om hem aan te geven; een verhoogde oche-lat voel je makkelijker met je voet terwijl je gooit, zodat je altijd op dezelfde plek staat.',
    'board:2':
      'Je hangt een dartbord op door de beugel op de hoogte uit de handleiding aan de muur te zetten, zodat de bull op 1,73 m uitkomt, en het bord met de 20 bovenaan op te hangen. Controleer of het recht hangt en niet wiebelt, en meet dan de diagonaal van de bull naar de achterkant van de oche: 2,93 m.',
    'board:3':
      'Een dartbord heeft licht van voren of van twee kanten nodig, zodat de darts die al in het bord zitten geen schaduw over de vakken werpen waar je op mikt. Een ringlamp om het bord doet precies dat, en het is de makkelijkste manier om een bord thuis goed te verlichten.',
    'board:4':
      'Bescherm de muur met een surround, een ring van schuim of rubber rond het bord die de missers opvangt, en de vloer met een mat bij de oche. Die mat spaart ook je punten als een dart uit het bord valt of terugstuitert op tegels of beton.',
    'board:5':
      'Je hebt ongeveer 3 m nodig van de muur tot achter de plek waar je staat, en ongeveer 1,5 m breedte. Dat geeft de werpafstand van 2,37 m plus ruimte achter de oche, en plek voor je werparm en voor een tweede speler die er even naast staat.',
    'shapes:1':
      'Een torpedobarrel is voorin het dikst en loopt naar achteren taps toe, zodat het gewicht naar voren zit. Hij past bij spelers die de dart voorin vasthouden en graag voelen dat de dart naar het bord trekt, omdat het gewicht dan net voor hun vingers zit.',
    'shapes:3':
      'Een taps toelopende barrel is voorin dik en wordt naar achteren steeds dunner; hij is langer en slanker dan een torpedo. Hij past bij spelers die de dart verder achterin vasthouden, omdat het dunne achterstuk ruimte laat voor de vingers terwijl het gewicht voor de grip blijft.',
    'shapes:4':
      'Een scalloped barrel is een grotendeels rechte barrel met een smallere taille of een holle zone. Die taille geeft je vingers een vaste plek die ze zonder kijken vinden, en dat helpt spelers die de dart bij elke worp precies op dezelfde plek willen vasthouden.',
    'shapes:5':
      'Hoe je de dart vasthoudt, bepaalt het meeste: een grip voorin past bij een torpedo of een barrel met het gewicht naar voren, een grip in het midden bij een rechte barrel en een grip achterin bij een taps toelopende. Een compacte grip met korte vingers neigt naar een bomb, lange vingers naar recht.',
    'grip:1':
      'Je hebt meer grip nodig als de dart bij het loslaten naar voren glijdt in je vingers, of als je harder knijpt dan je zou willen om hem vast te houden. Je hebt minder grip nodig als de dart aan je vingertoppen blijft hangen of plakt, of als je vingertoppen na een sessie pijn doen.',
    'grip:2':
      'Nee, de grip hoeft niet over de hele barrel hetzelfde te zijn. Veel barrels hebben alleen knurling waar je vingers komen en gladde stukken op de rest. Houd je de dart voorin vast, dan telt de grip voorin het meest; houd je hem verder achterin, dan doen de ringen achterin het werk.',
    'tungsten:0':
      'Een legering met 90% tungsten heeft een dichtheid van ongeveer 17,05 g/cm³, tegen 18,05 voor 95% tungsten, 15,05 voor 80% en 8,5 voor messing. Bij hetzelfde gewicht en dezelfde lengte is een barrel van 95% daardoor ongeveer 3% slanker dan een van 90%, en een messing barrel ongeveer 40% dikker.',
    'tungsten:2':
      'Messing darts zijn niet slecht, alleen dik en meestal licht. Ze zijn goedkoop en prima om het spel te proberen, maar messing is ongeveer half zo zwaar als 90% tungsten, dus bij een normaal steeltip gewicht wordt de barrel dik. Daarom stappen de meeste spelers al snel over op tungsten.',
    'events:0':
      'De grote toernooien die dit seizoen nog komen, zijn de Grand Slam of Darts in Wolverhampton (14–22 november 2026), de Players Championship Finals in Minehead (27–29 november 2026) en het WK darts in Alexandra Palace in Londen, van 11 december 2026 tot 3 januari 2027.',
    'events:2':
      'Luke Littler won in 2026 bijna alles: het WK (7–1 tegen Gian van Veen in de finale), de World Masters, de UK Open en de Premier League. Daarnaast won hij met Luke Humphries voor Engeland de World Cup of Darts, met 10–5 tegen Nederland.',
    'rules:0':
      'Een dartbord hangt met het midden van de bull op 1,73 m boven de vloer, de officiële hoogte bij steeltip darts. Controleer het met de diagonaal van de bull naar de achterkant van de oche op vloerhoogte: die moet 2,93 m zijn. De oche zelf ligt 2,37 m van de voorkant van het bord.',
    'rules:1':
      'De oche, de werplijn, ligt 2,37 m van het bord. Meet over de vloer van de achterkant van de werplijn tot een schietlood vanaf de voorkant van het bord, dus niet vanaf de muur. Met de bull op 1,73 m is de diagonaal van de bull tot de oche 2,93 m.',
    'rules:2':
      'Bij 501 begint elke speler op 501 en gooit hij drie darts per beurt; de score gaat eraf. Je moet precies op nul eindigen met een dubbel (de buitenste ring) of de bull, die telt als dubbel 25. Een beurt die onder nul zou komen, zonder dubbel op nul uitkomt of 1 overlaat, is bust.',
    'rules:3':
      'Een steeltip dart mag maximaal 50 gram wegen en maximaal 30,5 cm lang zijn. Bijna elke dart in de winkel weegt veel minder: in de DartFit-catalogus is de mediaan {medW} gram en weegt de zwaarste {maxW} gram, dus met een normale set kom je nooit in de buurt van die grenzen.',
    'checkout:0':
      'Zeven scores van 170 of lager kun je niet in drie darts uitgooien: 169, 168, 166, 165, 163, 162 en 159. Boven de 170 kan helemaal niets uit. Spelers noemen dit lastige getallen en plannen hun scores zo dat ze iets anders overlaten, het liefst een getal met een simpele route naar een dubbel.',
  },
  de: {
    'guide:0':
      'Fünf Dinge entscheiden, ob ein Dart zu dir passt: das Gewicht, die Länge des Barrels, die Dicke, die Barrelform und der Grip. Farbe, Marke und der Profi auf der Packung sind Geschmackssache. Die meisten Steeldarts wiegen 18 bis 26 Gramm; die Mitte unseres Katalogs liegt bei {medW} Gramm, mit Barrels von etwa {medL} mm.',
    'guide:1':
      'Einen Dart, der zu deiner Hand passt, findest du durch Ausprobieren, bis sich einer richtig anfühlt, oder durch Messen. DartFit misst deine Hand neben einer Bankkarte auf deinem Handy, stellt fünf Fragen dazu, wie du hältst und wirfst, zeichnet deinen idealen Dart und bewertet jeden Dart im Katalog danach.',
    'guide:2':
      'Wo du den Dart greifst, gibt die Form vor. Ein Griff vorne passt zu einem Torpedo oder einem frontlastigen Barrel, ein Griff in der Mitte zu einem geraden Barrel und ein Griff hinten zu einem konischen. Kurze Finger und ein kompakter Griff tendieren zur Bomb, lange Finger entlang des Barrels zu gerade.',
    'guide:3':
      'Als Anfänger fährst du am besten mit einem Dart aus der Mitte des Marktes: etwa 22 bis 24 Gramm, ein gerader Barrel von rund 50 mm, mittlerer Grip und 90% Wolfram. Der verzeiht einen Griff, der noch wandert. Weißt du erst, wo du greifst und wie der Dart fliegt, zeigt ein Fitting etwas Persönlicheres.',
    'algorithm:2':
      'DartFit prüft, ob sich dein idealer Dart auch wirklich bauen lässt. Es rechnet einen Barrel aus der Dichte von Wolframlegierungen, den Bohrungen für Spitze und Gewinde und dem Profil und trifft angegebene Gewichte auf etwa 7%. Reicht 90% Wolfram nicht für dein Gewicht, versucht es 95%; Angebote mit unmöglichem Gewicht bleiben außen vor.',
    'why:0':
      'Mit einem Dart, der nicht passt, gleichst du ständig aus. Zu kurz, und deine Finger berühren Schaft oder Spitze; zu lang, und er wackelt aus der Hand; zu schwer, und dein Arm wird müde; zu leicht, und jede kleine Änderung beim Abwurf zeigt sich auf der Scheibe; falscher Grip rutscht oder klebt.',
    'why:3':
      'Deine jetzigen Darts passen, wenn du deinen Griff ohne Hinsehen findest, deine Finger auf dem Barrel liegen statt auf Schaft oder Spitze, der Dart sauber und ohne Kleben die Hand verlässt und dein Arm nach einem langen Abend nicht müde ist. Klappt eins davon nicht, lohnt sich ein Fitting von zwei Minuten.',
    'weight:0':
      'Die meisten Steeldarts wiegen zwischen {q25W} und {q75W} Gramm: Das ist die mittlere Hälfte der {darts} Darts in unserem Katalog. Der Median liegt bei {medW} Gramm, der leichteste Dart wiegt {minW} Gramm und der schwerste {maxW} Gramm, ein Dart aus dem mittleren Bereich ist also ein ganz normaler Startpunkt.',
    'weight:1':
      'Vier Dinge verschieben dein richtiges Gewicht: wie der Dart fliegt, deine Hand, dein jetziger Dart und Ermüdung. Ein flacher, direkter Wurf passt oft zu etwas mehr Gewicht, ein hoher Bogen zu etwas weniger, und große Hände vertragen etwas mehr. Fühlt sich dein Dart falsch an, geh etwa 2 Gramm rauf oder runter.',
    'weight:2':
      'Weder schwere noch leichte Darts sind besser. Schwerere Darts fliegen stabiler und verzeihen kleine Fehler beim Abwurf, kosten aber über einen langen Abend mehr Kraft. Leichtere Darts verlangen einen präziseren Abwurf und belohnen einen schnellen Arm. Das richtige Gewicht ist das, mit dem du den ganzen Abend gleich wirfst.',
    'gift:0':
      'Um Darts für jemand anderen auszusuchen, brauchst du vier Dinge: die Körpergröße, den Handtyp (lang und schlank oder kurz und kräftig), wo der Spieler den Dart greift, wenn du es weißt, und das Gewicht seiner jetzigen Darts, falls du heimlich auf die Packung schauen kannst. Fehlt etwas davon, ist das kein Problem.',
    'gift:1':
      'Weißt du nicht, wie der Spieler wirft, wähle in DartFit „Weiß ich nicht“. Dann nimmt DartFit die häufigste Antwort und zeigt eine sichere Wahl aus der Mitte. Für die meisten Spieler ist das ein gerader Barrel von etwa 22 bis 24 Gramm, und dort liegen auch die meisten Darts in unserem Katalog.',
    'gift:2':
      'Standard ist für die meisten Geschenke die beste Wahl. DartFit zeigt in jeder Preisklasse den besten Treffer: Budget bis 50 €, Standard bis 80 € und Premium darüber. Ein Standard-Dart ist meist aus 90% Wolfram, schlank und langlebig, er fühlt sich also wie ein echter Schritt nach vorn an, ohne den Preis eines Profimodells.',
    'beginners:0':
      'Als Anfänger startest du am besten zwischen 22 und 24 Gramm. Leichtere Darts verlangen einen schnelleren, präziseren Arm, schwerere verzeihen einen wackligen Abwurf, machen dich aber über einen langen Abend müde. Die mittlere Hälfte des DartFit-Katalogs wiegt {q25W} bis {q75W} Gramm, damit bist du in guter Gesellschaft.',
    'beginners:1':
      'Am leichtesten lernst du mit einem geraden Barrel. Er ist von vorne bis hinten gleich dick und verzeiht deshalb einen Griff, der beim Lernen noch wandert. Weißt du erst, wo deine Finger hinwollen, passt vielleicht ein Torpedo für einen Griff vorne oder ein konischer Barrel für einen Griff hinten besser.',
    'beginners:3':
      'Deine ersten richtigen Darts dürfen etwa 30 bis 60 € kosten: Dafür bekommst du 80 bis 90% Wolfram, für die meisten Anfänger das beste Preis-Leistungs-Verhältnis. Unter 25 € gibt es Messing oder wenig Wolfram, gut zum Ausprobieren. Über 80 € kaufst du 95% Wolfram und Profimodelle, das lohnt sich, sobald dein Griff sitzt.',
    'beginners:4':
      'Neben den Darts braucht ein Anfänger Ersatz-Flights und -Schäfte, denn die gehen kaputt, und ein verbogener Flight verändert den Flug. Dazu kommen eine Sisalscheibe mit dem Bull auf 1,73 m und der Abwurflinie in 2,37 m Abstand sowie eine Checkout-Tabelle, um zu lernen, welches Doppel man stehen lässt.',
    'beginners:5':
      'Passe Darts an deine Hand an, sobald du ein paar Wochen geworfen hast und dein Griff sich wiederholt. Dann sagen deine Griffposition, die Zahl deiner Finger am Barrel und die Größe deiner Hand viel über den Barrel, der zu dir passt. DartFit misst deine Hand neben einer Bankkarte und rechnet es kostenlos aus.',
    'setup:0':
      'Die meisten Spieler fangen mit einem mittleren Schaft von etwa 45 bis 48 mm an. Ein kurzer Schaft von rund 35 mm macht einen kompakten Dart für einen flachen, schnellen Wurf, ein langer ab 50 mm gibt hinten mehr Führung für einen Bogenwurf oder einen wackelnden Dart. Vergleiche Millimeter, denn Marken benennen Längen unterschiedlich.',
    'setup:2':
      'Die Form des Flights bestimmt, wie viel Luftwiderstand das Heck des Darts hat. Ein Standard-Flight hat die größte Fläche, die meiste Stabilität und einen höheren Bogen. Kite- und Birnenformen sind etwas schneller, Slim-Flights passen zu einem schnellen, flachen Wurf, und kleine Standard-Flights stoßen in engen Gruppen seltener zusammen.',
    'setup:4':
      'Ja. Neben deinem idealen Barrel schlägt DartFit eine Schaftlänge und eine Flightform vor, die zu deiner Griffposition und deinem Wurf passen. Es ist derselbe Aufbau, den du auf dem gezeichneten Dart siehst, während du die Fragen beantwortest, sodass du Barrel, Schaft und Flights als ein passendes Set kaufen kannst.',
    'technique:0':
      'Stell den Fuß deiner Wurfseite vorne an die Abwurflinie, mit dem meisten Gewicht darauf, und dreh deinen Körper seitlich oder schräg zur Scheibe. Bleib beim Werfen ruhig stehen: Nach vorne lehnen ist in Ordnung, solange du dich bei jedem Dart auf dieselbe Weise lehnst und dein Oberkörper nicht mitschwingt.',
    'technique:2':
      'Ein guter Wurf hat fünf Schritte. Ziele, indem du Auge, Dart und Ziel auf eine Linie bringst; führe den Dart zum Auge zurück, während der Ellbogen ruhig bleibt; beschleunige in einer fließenden Bewegung; lass jedes Mal am selben Punkt los, kurz bevor der Arm gestreckt ist; und schwing danach zum Ziel durch.',
    'technique:3':
      'Wohin deine Darts danebengehen, verrät, was sich bewegt hat. Gehen sie nach links oder rechts, bewegt sich meist der Ellbogen seitlich oder das Handgelenk dreht. Zu hoch kommt von spätem Loslassen oder Hochdrücken, zu tief von frühem Loslassen oder einem sinkenden Ellbogen, und überall auf der Scheibe von einem wechselnden Griff.',
    'steelsoft:0':
      'Steeldarts haben eine Stahlspitze, wiegen etwa 18 bis 30 Gramm und werden aus 2,37 m auf eine Sisalscheibe geworfen; die Punkte zählst du selbst oder in einer App. Softdarts haben eine Kunststoffspitze, wiegen meist 16 bis 20 Gramm und fliegen auf eine elektronische Scheibe, oft aus 2,44 m, die selbst zählt.',
    'steelsoft:1':
      'Softdarts funktionieren auf einer Sisalscheibe schlecht: Die Kunststoffspitzen verbiegen und brechen in den Fasern. Manche Barrels nehmen mit einer Umbauspitze beide Spitzenarten auf, sodass ein Set für beide Spiele reicht, aber eine andere Spitze verändert Gewicht und Balance, der Dart fühlt sich also anders an.',
    'steelsoft:3':
      'Die Profis, die du im Fernsehen siehst, spielen Steeldarts: Die übertragenen Touren nutzen alle Sisalscheiben und Stahlspitzen. Softdarts haben eine eigene Szene und eigene Ligen und sind besonders in Asien und in Kneipen in ganz Europa beliebt, aber die Turniere im Fernsehen sind Steeldarts.',
    'size:1':
      'Wähle nach Hand und Griff; die meisten Barrels sind mittel, etwa 6,5 bis 7,5 mm dick. Ein schlanker Barrel unter etwa 6,5 mm gruppiert enger und prallt seltener ab, verlangt aber einen präzisen Griff. Ein dicker über etwa 7,5 mm gibt mehr in die Hand und passt zu großen Händen und Spielern, die viel Gefühl wollen.',
    'size:2':
      'Wolframdarts sind schlanker, weil Wolfram mehr als doppelt so dicht ist wie Messing, sodass dasselbe Gewicht in einen viel dünneren Barrel passt. Je höher der Wolframanteil, desto schlanker kann der Barrel sein: {w95Pct} der Darts in unserem Katalog haben 95% Wolfram, die meisten anderen 90%.',
    'size:3':
      'Länge, Dicke und Gewicht hängen zusammen: Im selben Material ist ein längerer oder dickerer Barrel schwerer. Du kannst also nichts davon ändern, ohne die anderen zu ändern, und deshalb berechnet DartFit alle drei zusammen und prüft jedes Angebot im Katalog darauf, was ein Barrel dieser Größe und Legierung wiegen kann.',
    'care:1':
      'Den Grip reinigst du, indem du Schäfte und Spitzen abschraubst und die Barrels mit einer weichen Zahnbürste in warmem Wasser mit einem Tropfen Spülmittel schrubbst. Spül und trockne sie danach sofort ab. Hautfett und Kreide füllen nach und nach die Rändelung, deshalb fühlt sich der Grip eines Darts mit der Zeit glatter an.',
    'care:2':
      'Schäfte lockern sich, weil der Wurf und jeder Einschlag sie erschüttern. Nutze O-Ringe oder Schaftringe, zieh die Schäfte von Hand fest statt mit der Zange und prüf sie zu Beginn jeder Session. Aluminiumschäfte lockern sich leichter als Nylonschäfte, die musst du also öfter kontrollieren.',
    'care:3':
      'Tausche einen Flight aus, sobald er eingerissen, geknickt oder nicht mehr flach ist, und einen Schaft, sobald er verbogen oder gerissen ist. Beides verändert den Flug des Darts, und ein beschädigter Flight lenkt außerdem den nächsten Dart ab, ein paar Ersatzteile im Etui lohnen sich also.',
    'care:4':
      'Eine Sisalscheibe hält länger, wenn du sie alle paar Wochen drehst, damit das Feld der 20 nicht zuerst verschleißt, sie nie nass machst, Darts gerade und mit einer leichten Drehung herausziehst und sie vor direkter Sonne und Heizkörpern schützt. Setz den Zahlenring nach dem Drehen mit der 20 oben wieder auf.',
    'board:0':
      'Eine Dartscheibe hängt mit der Mitte des Bulls 1,73 m über dem Boden: die offizielle Höhe bei Steeldarts. Miss bis zur Mitte des Bulls, nicht bis zur Oberkante der Scheibe, und prüf es mit der Diagonale: Vom Bull bis zur Hinterkante der Abwurflinie auf dem Boden sind es 2,93 m.',
    'board:1':
      'Die Abwurflinie liegt 2,37 m von der Vorderseite der Scheibe entfernt, nicht von der Wand, gemessen über den Boden bis zur Hinterkante der Linie. Ein Streifen Klebeband reicht zum Markieren; eine erhöhte Oche-Leiste spürst du beim Werfen leichter mit dem Fuß, sodass du immer an derselben Stelle stehst.',
    'board:2':
      'Du hängst eine Dartscheibe auf, indem du die Halterung in der Höhe aus der Anleitung an die Wand schraubst, sodass der Bull bei 1,73 m landet, und die Scheibe mit der 20 oben einhängst. Prüf, ob sie gerade hängt und nicht wackelt, und miss dann die Diagonale vom Bull zur Hinterkante der Abwurflinie: 2,93 m.',
    'board:3':
      'Eine Dartscheibe braucht Licht von vorne oder von beiden Seiten, damit die Darts, die schon in der Scheibe stecken, keinen Schatten auf die Felder werfen, auf die du zielst. Ein Ringlicht um die Scheibe macht genau das, und es ist die einfachste Art, eine Scheibe zu Hause gut auszuleuchten.',
    'board:4':
      'Schütze die Wand mit einem Surround, einem Ring aus Schaumstoff oder Gummi um die Scheibe, der die Fehlwürfe auffängt, und den Boden mit einer Matte an der Abwurflinie. Die Matte schont auch deine Spitzen, wenn ein Dart herausfällt oder abprallt und sonst auf Fliesen oder Beton landen würde.',
    'board:5':
      'Du brauchst etwa 3 m von der Wand bis hinter deinen Standplatz und etwa 1,5 m Breite. Das ergibt die Wurfdistanz von 2,37 m plus Platz hinter der Abwurflinie, Raum für deinen Wurfarm und Platz für einen zweiten Spieler, der daneben stehen kann.',
    'shapes:1':
      'Ein Torpedo-Barrel ist vorne am dicksten und läuft nach hinten schmal zu, sodass das Gewicht vorne sitzt. Er passt zu Spielern, die den Dart vorne greifen und spüren wollen, wie er zur Scheibe zieht, weil das Gewicht dann direkt vor ihren Fingern liegt.',
    'shapes:3':
      'Ein konischer Barrel ist vorne dick und wird nach hinten gleichmäßig dünner; er ist länger und schlanker als ein Torpedo. Er passt zu Spielern, die den Dart weiter hinten greifen, weil das dünne Heck Platz für die Finger lässt, während das Gewicht vor dem Griff bleibt.',
    'shapes:4':
      'Ein Scalloped-Barrel ist ein weitgehend gerader Barrel mit einer schmaleren Taille oder einer nach innen gewölbten Zone. Diese Taille gibt deinen Fingern einen festen Platz, den sie ohne Hinsehen finden, und das hilft Spielern, die den Dart bei jedem Wurf genau gleich greifen wollen.',
    'shapes:5':
      'Deine Griffposition entscheidet das meiste: Ein Griff vorne passt zu einem Torpedo oder einem frontlastigen Barrel, ein Griff in der Mitte zu einem geraden und ein Griff hinten zu einem konischen Barrel. Ein kompakter Griff mit kurzen Fingern tendiert zur Bomb oder zum Torpedo, lange Finger entlang des Barrels zu gerade.',
    'grip:0':
      'Rändelung ist das Muster, das in einen Barrel geschnitten wird, damit deine Finger Halt finden: Ringe, Rillen, Kreuzmuster oder feiner Micro-Grip. Tiefere und schärfere Schnitte greifen stärker. Weil die Schnitte Metall abtragen, ist ein stark bearbeiteter Barrel außerdem etwas leichter als ein glatter Barrel derselben Größe.',
    'grip:1':
      'Du brauchst mehr Grip, wenn der Dart beim Abwurf in deinen Fingern nach vorne rutscht oder du fester drückst, als dir lieb ist, nur um ihn zu halten. Du brauchst weniger Grip, wenn der Dart an deinen Fingerspitzen hängen bleibt oder klebt oder deine Fingerspitzen nach einer Session wehtun.',
    'grip:2':
      'Nein, der Grip muss nicht über den ganzen Barrel gleich sein. Viele Barrels haben nur dort Rändelung, wo die Finger liegen, und glatte Stücke am Rest. Greifst du den Dart vorne, zählt der Grip vorne am meisten; greifst du weiter hinten, erledigen die hinteren Ringe die Arbeit.',
    'tungsten:0':
      'Eine Legierung mit 90% Wolfram hat eine Dichte von etwa 17,05 g/cm³, gegenüber 18,05 bei 95% Wolfram, 15,05 bei 80% und 8,5 bei Messing. Bei gleichem Gewicht und gleicher Länge ist ein Barrel aus 95% deshalb etwa 3% schlanker als einer aus 90%, und ein Messingbarrel etwa 40% dicker.',
    'tungsten:1':
      '95% Wolfram lohnt sich bei schweren Darts: Ein 26-Gramm-Dart aus 95% bleibt schlank genug für die meisten Griffe. Bei einem Dart um 22 Gramm ist der Unterschied klein, und 90% ist meist der bessere Kauf, deshalb haben nur {w95Pct} der Darts in unserem Katalog 95% Wolfram.',
    'tungsten:2':
      'Messingdarts sind nicht schlecht, nur dick und meist leicht. Sie sind günstig und gut zum Ausprobieren, aber Messing ist nur etwa halb so dicht wie 90% Wolfram, sodass der Barrel bei einem normalen Steeldart-Gewicht dick wird. Deshalb steigen die meisten Spieler schnell auf Wolfram um.',
    'events:0':
      'Die großen Turniere, die in dieser Saison noch kommen, sind der Grand Slam of Darts in Wolverhampton (14.–22. November 2026), die Players Championship Finals in Minehead (27.–29. November 2026) und die Darts-WM im Alexandra Palace in London, vom 11. Dezember 2026 bis 3. Januar 2027.',
    'events:2':
      'Luke Littler hat 2026 fast alles gewonnen: die WM (7:1 gegen Gian van Veen im Finale), die World Masters, die UK Open und die Premier League. Außerdem gewann er mit Luke Humphries für England den World Cup of Darts, mit 10:5 gegen die Niederlande.',
    'rules:0':
      'Eine Dartscheibe hängt mit der Mitte des Bulls 1,73 m über dem Boden, die offizielle Höhe bei Steeldarts. Prüf es mit der Diagonale vom Bull zur Hinterkante der Abwurflinie auf Bodenhöhe: Sie muss 2,93 m betragen. Die Abwurflinie selbst liegt 2,37 m von der Vorderseite der Scheibe entfernt.',
    'rules:1':
      'Die Abwurflinie, das Oche, liegt 2,37 m von der Scheibe entfernt. Gemessen wird über den Boden von der Hinterkante der Linie bis zu einem Lot von der Vorderseite der Scheibe, also nicht von der Wand. Mit dem Bull auf 1,73 m beträgt die Diagonale vom Bull bis zur Abwurflinie 2,93 m.',
    'rules:2':
      'Bei 501 startet jeder Spieler mit 501 Punkten und wirft drei Darts pro Aufnahme; die Punkte werden abgezogen. Du musst genau auf null mit einem Doppel (dem äußeren Ring) oder dem Bull beenden, der als Doppel 25 zählt. Eine Aufnahme, die unter null ginge, ohne Doppel auf null käme oder 1 übrig ließe, ist Bust.',
    'rules:3':
      'Ein Steeldart darf höchstens 50 Gramm wiegen und höchstens 30,5 cm lang sein. Fast jeder Dart im Handel wiegt viel weniger: Im DartFit-Katalog liegt der Median bei {medW} Gramm und der schwerste wiegt {maxW} Gramm, ein normales Set kommt diesen Grenzen also nie nahe.',
    'checkout:0':
      'Sieben Reste von 170 oder weniger lassen sich nicht mit drei Darts beenden: 169, 168, 166, 165, 163, 162 und 159. Über 170 geht überhaupt nichts mehr. Spieler nennen sie Bogey-Zahlen und planen ihre Aufnahmen so, dass sie etwas anderes stehen lassen, am liebsten einen Rest mit einem einfachen Weg zum Doppel.',
  },
};
