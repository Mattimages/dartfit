import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { loadCatalogue } from '@dartfit/catalogue';
import {
  barrelMetrics,
  classify,
  config,
  density,
  enforcePhysics,
  fit,
  massRange,
  shapeProfile,
  solveIdeal,
  variantBarrel,
  type Answers,
} from '../src/index.js';
import { baseAnswers, hand } from './helpers.js';

const { variants } = loadCatalogue();

describe('alloy density', () => {
  it('rises with tungsten content and treats 0% as brass', () => {
    expect(density(85)).toBeLessThan(density(90));
    expect(density(90)).toBeLessThan(density(95));
    expect(density(95)).toBeLessThan(density(97));
    expect(density(0)).toBe(config.physics.density.brass);
    expect(density(90)).toBeCloseTo(17.05, 2);
  });
});

describe('barrel model against real darts', () => {
  const straight = variants.filter((v) => v.shape === 'straight' && v.tungstenPct >= 80);
  const errors = straight.map((v) => variantBarrel(v).massG / v.weightG - 1);

  it('predicts the listed weight of catalogue straight barrels within 5% (median)', () => {
    const abs = errors.map(Math.abs).sort((a, b) => a - b);
    expect(straight.length).toBeGreaterThanOrEqual(25);
    expect(abs[abs.length >> 1]!).toBeLessThan(0.05);
  });

  it('gets at least 75% of them within 10%', () => {
    const within = errors.filter((e) => Math.abs(e) <= 0.1).length / errors.length;
    expect(within).toBeGreaterThanOrEqual(0.75);
  });

  it('puts the centre of gravity of front-loaded shapes ahead of straight ones', () => {
    const s = barrelMetrics({ lengthMm: 48, diameterMm: 7, profile: shapeProfile('straight', 'centre') }, 90);
    const t = barrelMetrics({ lengthMm: 48, diameterMm: 7, profile: shapeProfile('torpedo', 'front') }, 90);
    const rear = barrelMetrics({ lengthMm: 48, diameterMm: 7, profile: shapeProfile('tapered', 'rear') }, 90);
    expect(t.cogFrac).toBeLessThan(s.cogFrac);
    expect(rear.cogFrac).toBeGreaterThan(s.cogFrac);
  });
});

describe('buildable range', () => {
  it('a heavier range for longer, thicker and denser barrels', () => {
    const base = massRange(48, 6.8, 90);
    expect(base[0]).toBeLessThan(base[1]);
    expect(massRange(52, 6.8, 90)[1]).toBeGreaterThan(base[1]);
    expect(massRange(48, 7.2, 90)[1]).toBeGreaterThan(base[1]);
    expect(massRange(48, 6.8, 95)[1]).toBeGreaterThan(base[1]);
  });

  it('every catalogue tungsten dart lies inside or close to the range for its size', () => {
    const outside = variants
      .filter((v) => v.tungstenPct >= 80)
      .filter((v) => {
        const [lo, hi] = massRange(v.lengthMm, v.diameterMm, v.tungstenPct);
        return v.weightG < lo * 0.9 || v.weightG > hi * 1.1;
      })
      .filter((v) => !v.specCheck)
      .map((v) => v.id);
    // Anything far out is flagged by the spec check (and never recommended); at most two borderline
    // listings remain unflagged (rd-javelin-25, one80-vhd-ice-dragon-20: within the flag ratio).
    expect(outside.length).toBeLessThanOrEqual(2);
  });
});

describe('enforcePhysics', () => {
  const limits = { length: [36, 60] as [number, number], diameter: [5.6, 8.5] as [number, number], weight: [14, 32] as [number, number] };

  it('leaves a buildable target alone', () => {
    const r = enforcePhysics({ mu: 22, sigma: 2 }, { mu: 48, sigma: 3 }, { mu: 6.8, sigma: 0.4 }, limits);
    expect(r.adjusted).toBe(false);
    expect(r.tungstenPct).toBe(90);
    expect(r.w).toBe(22);
  });

  it('a heavy, short, slim target gets 95% tungsten or is moved to something buildable', () => {
    const r = enforcePhysics({ mu: 26, sigma: 1 }, { mu: 44, sigma: 3 }, { mu: 6.3, sigma: 0.3 }, limits);
    const [lo, hi] = massRange(r.l, r.d, r.tungstenPct);
    expect(r.w).toBeGreaterThanOrEqual(lo - 0.05);
    expect(r.w).toBeLessThanOrEqual(hi + 0.05);
    expect(r.adjusted || r.tungstenPct === 95).toBe(true);
  });

  it('a target that fits at 95% but not 90% is offered 95% when that is clearly closer', () => {
    const r = enforcePhysics({ mu: 25, sigma: 0.8 }, { mu: 46, sigma: 1.5 }, { mu: 6.6, sigma: 0.2 }, limits);
    expect(r.tungstenPct).toBe(95);
  });
});

describe('ideal barrel', () => {
  it('weighs what the fit asks for and balances where the grip wants', () => {
    for (const hold of ['front', 'middle', 'rear'] as const) {
      const f = fit(hand(185), { ...baseAnswers, hold });
      expect(Math.abs(f.barrel.massG - f.weight.mu) / f.weight.mu).toBeLessThan(0.03);
      const target = config.balance.cogFrac[f.preferredBalance];
      expect(Math.abs(f.barrel.cogFrac - target)).toBeLessThan(0.04);
    }
  });

  it('front grip puts the centre of gravity ahead of a rear grip', () => {
    const front = fit(hand(185), { ...baseAnswers, hold: 'front' });
    const rear = fit(hand(185), { ...baseAnswers, hold: 'rear' });
    expect(front.barrel.cogFrac).toBeLessThan(rear.barrel.cogFrac);
  });

  it('the grip zone sits on the barrel and follows the hold', () => {
    const front = fit(hand(185), { ...baseAnswers, hold: 'front' });
    const rear = fit(hand(185), { ...baseAnswers, hold: 'rear' });
    for (const f of [front, rear]) {
      expect(f.barrel.gripZone[0]).toBeGreaterThanOrEqual(0);
      expect(f.barrel.gripZone[1]).toBeLessThanOrEqual(f.barrel.lengthMm + 1e-9);
    }
    expect(front.barrel.gripZone[0]).toBeLessThan(rear.barrel.gripZone[0]);
  });

  it('more fingers on the barrel need a longer grip zone', () => {
    const z = (fingers: 2 | 3 | 4) => {
      const f = fit(hand(185), { ...baseAnswers, fingers });
      return f.barrel.gripZone[1] - f.barrel.gripZone[0];
    };
    expect(z(3)).toBeGreaterThan(z(2));
    expect(z(4)).toBeGreaterThanOrEqual(z(3));
  });

  it('solves a front-loaded profile for a front centre of gravity', () => {
    const b = solveIdeal({ massG: 22, lengthMm: 48, diameterMm: 7.2, cogFrac: 0.44, tungstenPct: 90 }, [4, 30]);
    expect(b.profile.rear).toBeGreaterThan(b.profile.front);
    expect(['torpedo', 'tapered', 'bomb']).toContain(b.shape);
  });

  it('classifies textbook profiles', () => {
    const base = { endFront: 0.75, endRear: 0.75, waist: 0 };
    expect(classify({ ...base, front: 0.06, rear: 0.06 })).toBe('straight');
    expect(classify({ ...base, front: 0.18, rear: 0.55 })).toBe('torpedo');
    expect(classify({ ...base, front: 0.35, rear: 0.4 })).toBe('bomb');
    expect(classify({ ...base, front: 0.06, rear: 0.06, waist: 0.08 })).toBe('scalloped');
  });
});

const answersArb: fc.Arbitrary<Answers> = fc.record({
  tip: fc.constant('steel' as const),
  hold: fc.constantFrom('front' as const, 'middle' as const, 'rear' as const),
  fingers: fc.constantFrom(2 as const, 3 as const, 4 as const),
  throwStyle: fc.constantFrom('flat' as const, 'arc' as const, 'unsure' as const),
  moisture: fc.constantFrom('dry' as const, 'normal' as const, 'sweaty' as const),
  gripFeel: fc.constantFrom(1 as const, 2 as const, 3 as const, 4 as const, 5 as const),
  thickness: fc.constantFrom('slim' as const, 'standard' as const, 'chunky' as const, 'auto' as const),
});

describe('physics properties', () => {
  it('every steel fit describes a barrel that can be made', () => {
    fc.assert(
      fc.property(
        answersArb,
        fc.double({ min: 150, max: 225, noNaN: true }),
        fc.option(fc.integer({ min: 16, max: 30 }), { nil: undefined }),
        (a, h, cw) => {
          const f = fit(hand(h), cw ? { ...a, current: { weightG: cw, feel: 'right' } } : a);
          const [lo, hi] = massRange(f.length.mu, f.diameter.mu, f.physics.tungstenPct);
          return f.weight.mu >= lo - 0.1 && f.weight.mu <= hi + 0.1;
        },
      ),
      { numRuns: 60 },
    );
  });
});
