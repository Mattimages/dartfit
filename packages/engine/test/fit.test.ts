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
    const f = fit(hand(185), { ...baseAnswers, thickness: 'slim', current: { weightG: 18, feel: 'right' } });
    expect(f.diameter.mu).toBe(config.diameter.chosen.slim);
    const big = fit(hand(215), { ...baseAnswers, thickness: 'slim' });
    const auto = fit(hand(215), baseAnswers);
    // Physics may thicken a slim target a little when the weight would not fit; it stays slim.
    expect(big.diameter.mu).toBeLessThan(config.diameter.chosen.slim + 0.25);
    expect(big.diameter.mu).toBeLessThan(auto.diameter.mu);
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
      fc.property(
        answersArb,
        fc.double({ min: 150, max: 225, noNaN: true }),
        fc.double({ min: 0, max: 30, noNaN: true }),
        (a, h, d) => {
          const small = fit(hand(h), a);
          const big = fit(hand(h + d), a);
          // The physics projection snaps the barrel to a 0.5 mm length grid; when the best
          // diameter tips to the next 0.05 mm step the length can drop by one grid step. That is
          // resolution, not a trend: allow exactly one step.
          return big.length.mu >= small.length.mu - config.physics.grid.lengthStep - 1e-9;
        },
      ),
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
      fc.property(
        answersArb,
        (a) =>
          fit(undefined, { ...a, moisture: 'sweaty' }).grip.mu >=
          fit(undefined, { ...a, moisture: 'dry' }).grip.mu,
      ),
    );
  });

  it('every estimate stays within its configured limits and probabilities sum to 1', () => {
    fc.assert(
      fc.property(
        answersArb,
        fc.option(fc.double({ min: 120, max: 260, noNaN: true }), { nil: undefined }),
        (a, h) => {
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
        },
      ),
    );
  });

  it('is deterministic', () => {
    fc.assert(
      fc.property(answersArb, (a) => JSON.stringify(fit(hand(185), a)) === JSON.stringify(fit(hand(185), a))),
    );
  });
});

describe('v3: current dart, dry hands and setup', () => {
  it('a current dart that feels too smooth raises the grip target', () => {
    const base = { ...baseAnswers, current: { weightG: 22, feel: 'right' as const, gripIntensity: 3 } };
    const right = fit(hand(185), base);
    const smooth = fit(hand(185), { ...base, current: { ...base.current, gripFeel: 'too_smooth' as const } });
    expect(smooth.grip.mu).toBeGreaterThan(right.grip.mu + 0.3);
    expect(smooth.reasons.some((r) => r.code === 'grip_current')).toBe(true);
  });

  it('a current barrel that feels too thin raises the thickness target', () => {
    const base = { ...baseAnswers, current: { weightG: 22, feel: 'right' as const, diameterMm: 6.4 } };
    const right = fit(hand(185), base);
    const thin = fit(hand(185), {
      ...base,
      current: { ...base.current, thicknessFeel: 'too_thin' as const },
    });
    expect(thin.diameter.mu).toBeGreaterThan(right.diameter.mu + 0.15);
  });

  it('a current barrel that feels too short lengthens the target', () => {
    const base = { ...baseAnswers, current: { weightG: 22, feel: 'right' as const, lengthMm: 44 } };
    const right = fit(hand(185), base);
    const short = fit(hand(185), { ...base, current: { ...base.current, lengthFeel: 'too_short' as const } });
    expect(short.length.mu).toBeGreaterThan(right.length.mu + 1);
  });

  it('a dart that feels right pulls balance towards its own', () => {
    const plain = fit(hand(185), baseAnswers);
    const liked = fit(hand(185), {
      ...baseAnswers,
      current: { weightG: 22, feel: 'right', balance: 'front' },
    });
    expect(liked.balance.front).toBeGreaterThan(plain.balance.front);
  });

  it('very dry hands get half a grip step', () => {
    const n = fit(hand(185), baseAnswers);
    const d = fit(hand(185), { ...baseAnswers, moisture: 'dry' });
    expect(d.grip.mu - n.grip.mu).toBeCloseTo(0.5);
  });

  it('flat throwers get a short shaft, lofted throwers a medium one', () => {
    expect(fit(hand(185), { ...baseAnswers, throwStyle: 'flat' }).setup.shaft).toBe('short');
    expect(fit(hand(185), { ...baseAnswers, throwStyle: 'arc' }).setup.shaft).toBe('medium');
    expect(fit(hand(185), baseAnswers).setup.shaft).toBe('inbetween');
  });

  it('heavy darts keep a standard flight even for flat throwers', () => {
    const f = fit(hand(185), { ...baseAnswers, throwStyle: 'flat', current: { weightG: 26, feel: 'right' } });
    expect(f.setup.flight).toBe('standard');
    expect(fit(hand(185), { ...baseAnswers, throwStyle: 'flat' }).setup.flight).toBe('slim');
  });

  it('front grippers are offered a longer point', () => {
    expect(fit(hand(185), { ...baseAnswers, hold: 'front' }).setup.longPoint).toBe(true);
    expect(fit(hand(185), baseAnswers).setup.longPoint).toBe(false);
  });

  it('wider knuckles lengthen the barrel a little', () => {
    const narrow = fit(hand(185, { palmWidthMm: 70 }), baseAnswers);
    const wide = fit(hand(185, { palmWidthMm: 86 }), baseAnswers);
    expect(wide.length.mu).toBeGreaterThan(narrow.length.mu);
  });
});

describe('v3.2: the hand shapes the barrel', () => {
  const stubby = hand(186, { middleLengthMm: 77, palmWidthMm: 83 });
  const slender = hand(186, { middleLengthMm: 92, palmWidthMm: 74 });

  it('short, broad fingers with a compact 3-finger grip get a bomb', () => {
    const f = fit(stubby, { ...baseAnswers, hold: 'middle', fingers: 3 });
    expect(f.barrel.shape).toBe('bomb');
    expect(f.shape.bomb).toBeGreaterThan(f.shape.straight);
    expect(f.reasons.some((r) => r.code === 'shape_compact')).toBe(true);
  });

  it('long fingers spread over the barrel keep it straight', () => {
    const f = fit(slender, { ...baseAnswers, hold: 'middle', fingers: 4 });
    expect(f.barrel.shape).toBe('straight');
    expect(f.reasons.some((r) => r.code === 'shape_long')).toBe(true);
  });

  it('front grippers get a torpedo, rear grippers a front-heavy taper', () => {
    expect(fit(hand(186), { ...baseAnswers, hold: 'front' }).barrel.shape).toBe('torpedo');
    const rear = fit(hand(186), { ...baseAnswers, hold: 'rear' }).barrel;
    expect(rear.shape).toBe('tapered');
    expect(rear.cogFrac).toBeGreaterThan(0.5);
  });

  it('the ideal still weighs what the fit asked for', () => {
    for (const m of [stubby, slender, hand(186)])
      for (const hold of ['front', 'middle', 'rear'] as const) {
        const f = fit(m, { ...baseAnswers, hold });
        expect(Math.abs(f.barrel.massG - f.weight.mu) / f.weight.mu).toBeLessThan(0.03);
      }
  });

  it('estimated hands (from height or manual) do not move the shape', () => {
    const est = fit({ ...stubby, estimatedFrom: 'height' }, baseAnswers);
    expect(est.reasons.some((r) => r.code.startsWith('shape_'))).toBe(false);
  });
});

describe('v3.3: scanned without a card (proportions only)', () => {
  // A stubby hand at reference scale, as the no-card scan delivers it.
  const unscaled = { ...hand(185, { middleLengthMm: 77, palmWidthMm: 83 }), unscaled: true, spreadMm: 1 };

  it('takes the size from height and keeps the measured proportions', () => {
    const f = fit(unscaled, { ...baseAnswers, heightCm: 196 });
    const r = f.reasons.find((x) => x.code === 'hand_unscaled_height');
    expect(r?.params.handLengthMm).toBe(Math.round(196 * 10 * 0.1075));
    // Proportions are real, so the stubby hand still leans to a compact shape.
    expect(f.reasons.some((x) => x.code === 'shape_compact')).toBe(true);
  });

  it('without a height it assumes the reference hand, and says so', () => {
    const f = fit(unscaled, baseAnswers);
    expect(f.reasons.find((x) => x.code === 'hand_unscaled')?.params.handLengthMm).toBe(185);
  });

  it('is less certain than a card scan of the same hand: wider weight band, lower confidence', () => {
    const card = fit({ ...unscaled, unscaled: false }, baseAnswers);
    const none = fit(unscaled, baseAnswers);
    expect(none.weight.sigma).toBeGreaterThan(card.weight.sigma);
    expect(none.confidenceScore).toBeLessThan(card.confidenceScore);
  });
});

describe('v3.4: hand type in words (no scan)', () => {
  const shapeOf = (f: ReturnType<typeof fit>) => f.reasons.map((r) => r.code);

  it('short and stubby leans compact, long and slender leans long, from height alone', () => {
    const stub = fit(undefined, { ...baseAnswers, heightCm: 180, handType: 'stubby' });
    const slim = fit(undefined, { ...baseAnswers, heightCm: 180, handType: 'slender' });
    expect(shapeOf(stub)).toContain('hand_type');
    expect(shapeOf(stub)).toContain('shape_compact');
    expect(stub.barrel.shape).toBe('bomb');
    expect(slim.barrel.shape).toBe('straight');
    expect(slim.barrel.diameterMm).toBeLessThan(stub.barrel.diameterMm);
  });

  it('works without a height (reference hand) and stays an estimate', () => {
    const f = fit(undefined, { ...baseAnswers, handType: 'stubby' });
    expect(f.reasons.find((r) => r.code === 'hand_type')?.params.type).toBe('stubby');
    const scanned = fit(hand(185, { middleLengthMm: 81, palmWidthMm: 82 }), baseAnswers);
    expect(f.confidenceScore).toBeLessThan(scanned.confidenceScore);
  });

  it('average changes nothing, and a scanned hand ignores the words', () => {
    const plain = fit(undefined, { ...baseAnswers, heightCm: 180 });
    const avg = fit(undefined, { ...baseAnswers, heightCm: 180, handType: 'average' });
    expect(avg.barrel).toEqual(plain.barrel);
    const m = hand(190);
    expect(fit(m, { ...baseAnswers, handType: 'stubby' }).barrel).toEqual(fit(m, baseAnswers).barrel);
  });

  it('reshapes a ruler measurement (length kept)', () => {
    const ruler = { ...hand(190), proportions: 'reference' as const };
    const f = fit(ruler, { ...baseAnswers, handType: 'stubby' });
    expect(shapeOf(f)).toContain('hand_type');
  });
});
