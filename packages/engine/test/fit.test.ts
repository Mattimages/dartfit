import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { config, fit, numericLeaves, provenanceOf, combine, type Answers } from '../src/index.js';
import { baseAnswers, hand } from './helpers.js';

describe('config provenance', () => {
  it('every numeric coefficient has a provenance entry', () => {
    const missing = numericLeaves(config).filter((p) => !provenanceOf(p));
    expect(missing).toEqual([]);
  });
});

describe('combine', () => {
  it('precision-weights two estimates', () => {
    const c = combine({ mu: 20, sigma: 2 }, { mu: 24, sigma: 2 });
    expect(c.mu).toBeCloseTo(22);
    expect(c.sigma).toBeCloseTo(Math.SQRT2);
  });
  it('a tight anchor dominates a loose prior', () => {
    const c = combine({ mu: 22, sigma: 2 }, { mu: 18, sigma: 1 });
    expect(c.mu).toBeCloseTo(18.8);
  });
});

describe('fit rules', () => {
  it('defaults a steel fit to the 21–23 g band the top four throw', () => {
    const f = fit(hand(185), baseAnswers);
    expect(f.weight.band).toEqual([21, 23]);
    expect(f.preferredBalance).toBe('centre');
  });

  it('soft tip starts lighter', () => {
    const f = fit(undefined, { ...baseAnswers, tip: 'soft' });
    expect(f.weight.mu).toBeLessThan(19);
  });

  it('moves weight up 2 g when the current dart feels too light', () => {
    const right = fit(undefined, { ...baseAnswers, current: { weightG: 22, feel: 'right' } });
    const light = fit(undefined, { ...baseAnswers, current: { weightG: 22, feel: 'too_light' } });
    expect(light.weight.mu - right.weight.mu).toBeGreaterThan(1.2);
    expect(light.reasons.some((r) => r.code === 'weight_current')).toBe(true);
  });

  it('a known current dart raises confidence', () => {
    const without = fit(hand(185), baseAnswers);
    const withDart = fit(hand(185), { ...baseAnswers, current: { weightG: 23, feel: 'right' } });
    expect(withDart.confidenceScore).toBeGreaterThan(without.confidenceScore);
    expect(withDart.weight.sigma).toBeLessThan(without.weight.sigma);
  });

  it('no scan and no current dart gives low confidence and a wider band', () => {
    const f = fit(undefined, baseAnswers);
    expect(f.confidence).toBe('low');
    const scanned = fit(hand(185), baseAnswers);
    expect(f.length.sigma).toBeGreaterThan(scanned.length.sigma);
  });

  it('two-finger front grippers get a shorter barrel than four-finger rear grippers', () => {
    const a = fit(hand(185), { ...baseAnswers, fingers: 2, hold: 'front' });
    const b = fit(hand(185), { ...baseAnswers, fingers: 4, hold: 'rear' });
    expect(b.length.mu - a.length.mu).toBeGreaterThan(8);
    expect(a.preferredBalance).toBe('front');
    expect(b.preferredBalance).toBe('rear');
  });

  it('sweaty hands get one more grip step', () => {
    const n = fit(hand(185), baseAnswers);
    const s = fit(hand(185), { ...baseAnswers, moisture: 'sweaty' });
    expect(s.grip.mu - n.grip.mu).toBe(1);
  });

  it('a stated thickness wins over the hand-size default', () => {
    const f = fit(hand(215), { ...baseAnswers, thickness: 'slim' });
    expect(f.diameter.mu).toBe(config.diameter.chosen.slim);
  });

  it('classifies hand tiers', () => {
    expect(fit(hand(165), baseAnswers).handTier).toBe('small');
    expect(fit(hand(185), baseAnswers).handTier).toBe('medium');
    expect(fit(hand(205), baseAnswers).handTier).toBe('large');
  });

  it('bands always contain the estimate and stay in limits', () => {
    const f = fit(hand(185), baseAnswers);
    for (const e of [f.weight, f.length, f.diameter, f.grip]) {
      expect(e.band[0]).toBeLessThanOrEqual(Math.round(e.mu * 10) / 10 + 0.5);
      expect(e.band[1]).toBeGreaterThanOrEqual(Math.round(e.mu * 10) / 10 - 0.5);
    }
  });
});

const answersArb: fc.Arbitrary<Answers> = fc.record({
  tip: fc.constantFrom('steel' as const, 'soft' as const),
  hold: fc.constantFrom('front' as const, 'middle' as const, 'rear' as const),
  fingers: fc.constantFrom(2 as const, 3 as const, 4 as const),
  throwStyle: fc.constantFrom('flat' as const, 'arc' as const, 'unsure' as const),
  moisture: fc.constantFrom('dry' as const, 'normal' as const, 'sweaty' as const),
  gripFeel: fc.constantFrom(1 as const, 2 as const, 3 as const, 4 as const, 5 as const),
  thickness: fc.constantFrom('slim' as const, 'standard' as const, 'chunky' as const, 'auto' as const),
});

describe('fit properties', () => {
  it('a longer hand never gets a shorter length band (all else equal)', () => {
    fc.assert(
      fc.property(answersArb, fc.double({ min: 150, max: 225, noNaN: true }), fc.double({ min: 0, max: 30, noNaN: true }), (a, h, d) => {
        const small = fit(hand(h), a);
        const big = fit(hand(h + d), a);
        return big.length.mu >= small.length.mu - 1e-9;
      }),
    );
  });

  it('more fingers never shortens the barrel', () => {
    fc.assert(
      fc.property(answersArb, (a) => {
        const f2 = fit(hand(185), { ...a, fingers: 2 });
        const f4 = fit(hand(185), { ...a, fingers: 4 });
        return f4.length.mu > f2.length.mu;
      }),
    );
  });

  it('sweatier hands never get less grip', () => {
    fc.assert(
      fc.property(answersArb, (a) => fit(undefined, { ...a, moisture: 'sweaty' }).grip.mu >= fit(undefined, { ...a, moisture: 'dry' }).grip.mu),
    );
  });

  it('every estimate stays within its configured limits and probabilities sum to 1', () => {
    fc.assert(
      fc.property(answersArb, fc.option(fc.double({ min: 120, max: 260, noNaN: true }), { nil: undefined }), (a, h) => {
        const f = fit(h ? hand(h) : undefined, a);
        const lim = a.tip === 'steel' ? config.weight.steel : config.weight.soft;
        const p = f.balance.front + f.balance.centre + f.balance.rear;
        return (
          f.weight.band[0] >= lim.min &&
          f.weight.band[1] <= lim.max &&
          f.length.band[0] >= config.length.min &&
          f.length.band[1] <= config.length.max &&
          f.grip.band[0] >= 1 &&
          f.grip.band[1] <= 5 &&
          Math.abs(p - 1) < 1e-9
        );
      }),
    );
  });

  it('is deterministic', () => {
    fc.assert(fc.property(answersArb, (a) => JSON.stringify(fit(hand(185), a)) === JSON.stringify(fit(hand(185), a))));
  });
});
