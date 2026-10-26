/** Finds hand + answer combinations whose pro twin is each pro (for the TikTok recordings). */
import { fit, proTwin } from '@dartfit/engine';
import { loadCatalogue } from '@dartfit/catalogue';
import { baseAnswers, hand } from '../../packages/engine/test/helpers.js';

const { variants, pros } = loadCatalogue();
const seen = new Map<string, string[]>();
for (const L of [170, 178, 185, 192, 200])
  for (const hold of ['front', 'middle', 'rear'] as const)
    for (const fingers of [2, 3, 4] as const)
      for (const throwStyle of ['flat', 'arc'] as const)
        for (const gripFeel of [1, 3, 5] as const)
          for (const heightCm of [170, 182, 192]) {
            const a = { ...baseAnswers, hold, fingers, throwStyle, gripFeel, heightCm };
            const tw = proTwin(fit(hand(L), a), pros, variants);
            if (!tw) continue;
            const k = tw.pro.name;
            const list = seen.get(k) ?? [];
            if (list.length < 2)
              list.push(
                `L${L} ${hold} ${fingers}f ${throwStyle} g${gripFeel} h${heightCm} cost ${tw.scored.cost}`,
              );
            seen.set(k, list);
          }
for (const [k, v] of [...seen].sort()) console.log(k.padEnd(24), v.join(' | '));
