/** Prints what the engine recommends for every test persona. Used for the expert review (gate G2). */
import { fit, recommend, proTwin, sensitivity } from '@dartfit/engine';
import { loadCatalogue } from '@dartfit/catalogue';
import { personas } from '../packages/engine/test/personas.js';

const { variants, pros } = loadCatalogue();
for (const p of personas) {
  const f = fit(p.m, p.a);
  const r = recommend(f, variants, { budgetUsd: p.a.budgetUsd });
  const twin = proTwin(f, pros, variants);
  const w = sensitivity(p.m, p.a, variants, { budgetUsd: p.a.budgetUsd });
  console.log(`\n${p.id} ${p.label}`);
  console.log(
    `  fit: ${f.weight.band.join('–')} g · ${f.length.band.join('–')} mm · Ø${f.diameter.band.join('–')} · grip ${f.grip.band.join('–')} · ${f.preferredBalance} · conf ${f.confidence}`,
  );
  for (const k of r.picks) {
    const v = k.variant;
    console.log(
      `  ${k.role.padEnd(11)} ${(v.brand + ' ' + v.model).padEnd(52)} ${v.weightG}g ${v.lengthMm}mm Ø${v.diameterMm} g${v.gripIntensity ?? '?'} ${v.balance ?? '?'}/${v.shape ?? '?'}  cost ${k.cost} ${k.quality}  [${k.why.map((y) => y.kind[0] + ':' + y.dim).join(' ')}]`,
    );
  }
  if (twin) console.log(`  twin: ${twin.pro.name} (${twin.scored.variant.model} ${twin.scored.variant.weightG}g, cost ${twin.scored.cost})`);
  if (w.length) console.log(`  what-if: ${w.slice(0, 3).map((x) => `${x.question}=${x.answer}→${x.newBestName}`).join(' | ')}`);
}
