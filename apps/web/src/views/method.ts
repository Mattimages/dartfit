/**
 * How DartFit works, written for players, followed by every coefficient the engine uses with its
 * provenance (sourced, heuristic, tuned) — generated from the engine config, so it can't drift.
 */
import { config, ENGINE_VERSION, numericLeaves, provenanceOf } from '@dartfit/engine';
import { h } from '../h';
import { getLang } from '../i18n';

const COPY = {
  nl: {
    title: 'Hoe DartFit werkt',
    lead: 'Eerlijk gezegd: er bestaat geen onderzoek dat handmaat omzet in het perfecte dartgewicht. Fitters in de winkel laten je proberen. DartFit geeft je een goed onderbouwd startpunt en een korte lijst om te proberen, met de redenen erbij.',
    sections: [
      [
        '1. Je hand meten',
        'Je telefoon herkent 21 punten op je hand (MediaPipe, op je toestel). Je pasje is 85,6 × 53,98 mm (ISO/IEC 7810 ID-1) en dient als liniaal. Wijs je de hoeken zelf aan, dan corrigeren we ook voor perspectief. We nemen de mediaan van 18 beelden en gooien uitschieters weg. Het beeld verlaat je telefoon nooit.',
      ],
      [
        '2. Van antwoorden naar maten',
        'Elke aanwijzing (je huidige dart, je grip, je handmaat, je worp) is een schatting met een onzekerheid. We combineren ze op gewicht van hun zekerheid. Je huidige dart weegt het zwaarst, want die heb je echt gegooid.',
      ],
      [
        '3. Natuurkunde',
        'Gewicht, lengte en dikte hangen samen: een barrel is metaal met een dichtheid. Ons model rekent met de dichtheid van tungstenlegeringen (ASTM B777), de boringen voor punt en schroefdraad en de vorm. Het voorspelt het opgegeven gewicht van 34 rechte barrels uit de catalogus binnen ongeveer 7%. Vraag je iets dat niet kan, dan schuiven we naar de dichtstbijzijnde barrel die wel kan, of zeggen we dat je 95% tungsten nodig hebt.',
      ],
      [
        'Lengte en onderarm',
        'Zonder scan schatten we je hand uit je lengte: gemiddeld 10,75% van je lichaamslengte (mannen 10,9%, vrouwen 10,6%, studie onder 195 volwassenen, bioRxiv 2025), met een marge van ±8 mm. Met scan controleren we die twee tegen elkaar. Je lengte bepaalt ook waar je loslaat (ongeveer ooghoogte), je onderarm en hand hoe snel. Met de natuurkunde van een worp (bull op 1,73 m, oche op 2,37 m, losslaatsnelheid zoals gemeten bij profs) rekenen we uit onder welke hoek jij moet gooien. Weet je niet hoe je dart vliegt, dan beslist die hoek of je richting een vlakke of een boogworp zit.',
      ],
      [
        '4. Je ideale barrel',
        'We zoeken de vorm (hoe lang de voor- en achterkant taps toelopen) die precies je gewicht haalt en het zwaartepunt legt waar je grip het wil. Dat is de rode tekening.',
      ],
      [
        '5. Matchen',
        'Elke dart in de catalogus, per gewicht, krijgt een afstand tot je ideaal: hoeveel standaardafwijkingen hij afwijkt per maat, gewogen naar hoe goed je het voelt. Darts waarvan het opgegeven gewicht niet bij de maten past, slaan we over tot de gegevens gecontroleerd zijn.',
      ],
      [
        '6. Wat we niet weten',
        'Of je in een boog of vlak gooit, verandert wel je shaft en flight maar het effect op gewicht is klein en onzeker. Alle regels hieronder met "vuistregel" zijn startpunten; we stellen ze bij met wat spelers ons na hun aankoop vertellen.',
      ],
    ],
    table: 'Elke waarde die het model gebruikt',
    cols: ['Waarde', 'Bron', 'Toelichting'],
    p: { sourced: 'bron', heuristic: 'vuistregel', tuned: 'afgesteld' },
    version: 'Modelversie',
  },
  en: {
    title: 'How DartFit works',
    lead: 'To be straight with you: no study turns hand size into the perfect dart weight. Shop fitters let you try. DartFit gives you a well-reasoned starting point and a short list to try, with the reasons.',
    sections: [
      [
        '1. Measuring your hand',
        'Your phone finds 21 points on your hand (MediaPipe, on your device). Your bank card is 85.6 × 53.98 mm (ISO/IEC 7810 ID-1) and acts as the ruler. When you point out its corners, we correct for perspective too. We take the median of 18 frames and drop outliers. The image never leaves your phone.',
      ],
      [
        '2. From answers to sizes',
        'Every clue (your current dart, your grip, your hand size, your throw) is an estimate with an uncertainty. We combine them weighted by how certain they are. Your current dart counts most, because you have actually thrown it.',
      ],
      [
        '3. Physics',
        'Weight, length and thickness are tied together: a barrel is metal with a density. Our model uses the density of tungsten alloys (ASTM B777), the bores for the point and thread, and the shape. It predicts the listed weight of 34 straight barrels in the catalogue to within about 7%. Ask for something that cannot be made and we move to the closest barrel that can, or tell you that you need 95% tungsten.',
      ],
      [
        'Height and forearm',
        'Without a scan we estimate your hand from your height: on average 10.75% of stature (men 10.9%, women 10.6%, study of 195 adults, bioRxiv 2025), give or take 8 mm. With a scan we check the two against each other. Your height also sets where you release (about eye level), your forearm and hand how fast. With the physics of a throw (bull at 1.73 m, oche at 2.37 m, release speeds as measured in professionals) we work out the angle you have to throw at. If you don’t know how your dart flies, that angle decides whether you lean towards a flat or an arcing throw.',
      ],
      [
        '4. Your ideal barrel',
        'We search for the shape (how far the front and back taper) that hits your weight exactly and puts the centre of gravity where your grip wants it. That is the red drawing.',
      ],
      [
        '5. Matching',
        'Every dart in the catalogue, weight by weight, gets a distance to your ideal: how many standard deviations it is off on each size, weighted by how much you would feel it. Darts whose listed weight does not fit their listed size are skipped until the listing is checked.',
      ],
      [
        '6. What we don’t know',
        'Whether you throw flat or in an arc changes your shaft and flight, but its effect on weight is small and uncertain. Every rule marked "rule of thumb" below is a starting point; we tune them with what players tell us after they buy.',
      ],
    ],
    table: 'Every value the model uses',
    cols: ['Value', 'Source', 'Note'],
    p: { sourced: 'source', heuristic: 'rule of thumb', tuned: 'tuned' },
    version: 'Model version',
  },
} as const;

export function methodView(root: HTMLElement) {
  const c = COPY[getLang() === 'nl' ? 'nl' : 'en'];
  const leaves = numericLeaves(config);
  // One row per provenance entry, listing its values.
  const groups = new Map<string, { p: string; note: string; values: string[] }>();
  for (const path of leaves) {
    const prov = provenanceOf(path);
    if (!prov) continue;
    const key = prov.note;
    const value = path.split('.').reduce<unknown>((o, part) => (o as Record<string, unknown>)[part], config);
    const g = groups.get(key) ?? { p: prov.p, note: prov.note, values: [] };
    g.values.push(`${path} = ${String(value)}`);
    groups.set(key, g);
  }
  const rows = [...groups.values()].map((g) =>
    h(
      'tr',
      null,
      h(
        'td',
        null,
        h('code', { class: 'small' }, g.values.slice(0, 4).join(', ') + (g.values.length > 4 ? ' …' : '')),
      ),
      h('td', null, c.p[g.p as keyof typeof c.p]),
      h('td', { class: 'small' }, g.note),
    ),
  );
  root.append(
    h(
      'section',
      { class: 'stack' },
      h('h1', null, c.title),
      h('p', { class: 'lead' }, c.lead),
      ...c.sections.flatMap(([title, body]) => [h('h2', { class: 'h-sub' }, title), h('p', null, body)]),
    ),
    h(
      'section',
      { class: 'stack' },
      h('h2', null, c.table),
      h('p', { class: 'small' }, `${c.version} ${ENGINE_VERSION}`),
      h(
        'div',
        { class: 'table-wrap', tabindex: 0, role: 'region', 'aria-label': c.table },
        h(
          'table',
          null,
          h('thead', null, h('tr', null, ...c.cols.map((x) => h('th', null, x)))),
          h('tbody', null, ...rows),
        ),
      ),
    ),
  );
}
