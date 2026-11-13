/** Gift personas (height + hand type, no scan; "not sure" falls back to middle / 3 fingers) and
 *  the pro twin each lands on, for the gift ads. */
import { config, fit, matchPctOf, measurementsFromHeight, proTwin } from '@dartfit/engine';
import { loadCatalogue } from '@dartfit/catalogue';
import { baseAnswers } from '../../packages/engine/test/helpers.js';

const { variants, pros } = loadCatalogue();
const seen = new Map<string, string[]>();
for (const heightCm of [168, 175, 182, 189, 196])
  for (const handType of ['slender', 'average', 'stubby'] as const)
    for (const hold of ['front', 'middle', 'rear'] as const)
      for (const fingers of [2, 3, 4] as const)
        for (const gripFeel of [1, 3, 5] as const) {
          const a = {
            ...baseAnswers,
            hold,
            fingers,
            throwStyle: 'flat' as const,
            gripFeel,
            heightCm,
            handType,
          };
          const tw = proTwin(fit(measurementsFromHeight(heightCm), a), pros, variants);
          if (!tw) continue;
          const k = tw.pro.name;
          const list = seen.get(k) ?? [];
          const pct = Math.round(matchPctOf(tw.scored.cost, config.match.displayScale));
          list.push(`${pct}% h${heightCm} ${handType} ${hold} ${fingers}f g${gripFeel}`);
          seen.set(k, list);
        }
for (const [k, v] of [...seen].sort()) console.log(k.padEnd(24), v.sort().reverse().slice(0, 3).join(' | '));
