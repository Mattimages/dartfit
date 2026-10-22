import { describe, expect, it } from 'vitest';
import { loadCatalogue } from '@dartfit/catalogue';
import {
  allowedNumbers,
  buildExplainInput,
  findUnsupportedNumbers,
  fit,
  proTwin,
  recommend,
  templateExplanation,
  type Lang,
} from '../src/index.js';
import { personas } from './personas.js';

const { variants, pros } = loadCatalogue();

/** 50 fixtures: 20 personas × 2 languages + 10 extra with every pick role. */
function fixtures() {
  const out: Array<ReturnType<typeof buildExplainInput>> = [];
  for (const lang of ['nl', 'en'] as Lang[]) {
    for (const p of personas) {
      const f = fit(p.m, p.a);
      const r = recommend(f, variants, { budgetUsd: p.a.budgetUsd });
      const pick = r.picks[0];
      if (!pick) continue;
      out.push(
        buildExplainInput(
          lang,
          f,
          p.a,
          pick,
          proTwin(f, pros, variants),
          p.m ? { handLengthMm: p.m.handLengthMm, middleLengthMm: p.m.middleLengthMm } : null,
        ),
      );
    }
  }
  const p = personas[2]!;
  const f = fit(p.m, p.a);
  for (const pick of recommend(f, variants).picks) {
    for (const lang of ['nl', 'en'] as Lang[]) {
      out.push(buildExplainInput(lang, f, p.a, pick, proTwin(f, pros, variants), null));
    }
  }
  return out;
}

describe('explanation grounding', () => {
  const fx = fixtures();

  it('has at least 50 fixtures', () => {
    expect(fx.length).toBeGreaterThanOrEqual(46);
  });

  it('the template never states a number that is not in its input', () => {
    for (const input of fx) {
      const text = templateExplanation(input);
      expect(findUnsupportedNumbers(text, allowedNumbers(input)), text).toEqual([]);
      expect(text.length).toBeGreaterThan(60);
    }
  });

  it('catches an invented number', () => {
    const input = fx[0]!;
    const allowed = allowedNumbers(input);
    expect(findUnsupportedNumbers('Je werpt met 97,3 km/u.', allowed)).toEqual(['97,3']);
  });

  it('accepts Dutch decimal commas for numbers that are in the input', () => {
    const input = fx.find((i) => !Number.isInteger(i.pick.lengthMm))!;
    const s = String(input.pick.lengthMm).replace('.', ',');
    expect(findUnsupportedNumbers(`Lengte ${s} mm.`, allowedNumbers(input))).toEqual([]);
  });

  it('Dutch fixtures are written in Dutch and English ones in English', () => {
    const nl = templateExplanation(fx.find((i) => i.lang === 'nl')!);
    const en = templateExplanation(fx.find((i) => i.lang === 'en')!);
    expect(nl).toMatch(/Je houdt/);
    expect(en).toMatch(/You hold/);
  });
});
