import { describe, expect, it } from 'vitest';
import { loadCatalogue } from '@dartfit/catalogue';
import {
  fit,
  recommend,
  scoreVariant,
  proTwin,
  sensitivity,
  priceTiers,
  type Variant,
} from '../src/index.js';
import { baseAnswers, hand } from './helpers.js';
import { personas } from './personas.js';

const { variants, pros } = loadCatalogue();
const byId = (id: string) => variants.find((v) => v.id === id) as Variant;

describe('scoreVariant', () => {
  it('a variant at the fit centre with preferred balance and shape costs ~0', () => {
    const f = fit(hand(185), baseAnswers);
    const ideal: Variant = {
      ...byId('target-littler-g1-22'),
      weightG: f.weight.mu,
      lengthMm: f.length.mu,
      diameterMm: f.diameter.mu,
      gripIntensity: f.grip.mu,
      balance: 'centre',
      shape: 'straight',
    };
    expect(scoreVariant(f, ideal).cost).toBeLessThan(0.01);
  });

  it('missing grip data never beats a known one-step miss', () => {
    const f = fit(hand(185), { ...baseAnswers, gripFeel: 4 });
    const known = { ...byId('target-littler-g1-22'), gripIntensity: 3 };
    const unknown = { ...known, id: 'x', gripIntensity: null };
    const gripTerm = (v: Variant) => scoreVariant(f, v).checks.find((c) => c.dim === 'grip')!.term;
    expect(gripTerm(unknown)).toBeGreaterThanOrEqual(gripTerm(known) * 0.9);
  });

  it('labels in-band, near and out-of-band dimensions', () => {
    const f = fit(hand(185), baseAnswers); // weight band 21–23
    const check = (w: number) =>
      scoreVariant(f, { ...byId('target-littler-g1-22'), weightG: w }).checks.find((c) => c.dim === 'weight')!
        .status;
    expect(check(22)).toBe('in');
    expect(check(23.4)).toBe('near');
    expect(check(26)).toBe('out');
  });
});

describe('recommend', () => {
  it('returns distinct models with roles, best first', () => {
    const r = recommend(fit(hand(185), baseAnswers), variants);
    expect(r.picks[0]?.role).toBe('best');
    const models = r.picks.map((p) => p.variant.modelId);
    expect(new Set(models).size).toBe(models.length);
    expect(r.picks.length).toBeGreaterThanOrEqual(3);
    expect(r.coverage).toBe('good');
  });

  it('the value pick is cheaper than the best pick', () => {
    const r = recommend(fit(hand(185), baseAnswers), variants);
    const best = r.picks.find((p) => p.role === 'best')!;
    const value = r.picks.find((p) => p.role === 'value');
    if (value) expect(value.variant.priceUsd!).toBeLessThan(best.variant.priceUsd!);
  });

  it('the branch-out pick differs from the best in shape or brand', () => {
    const r = recommend(fit(hand(185), baseAnswers), variants);
    const best = r.picks.find((p) => p.role === 'best')!.variant;
    const b = r.picks.find((p) => p.role === 'branch_out');
    if (b) expect(b.variant.shape !== best.shape || b.variant.brand !== best.brand).toBe(true);
  });

  it('a budget excludes over-budget and unpriced darts', () => {
    const r = recommend(fit(hand(185), baseAnswers), variants, { budgetUsd: 60 });
    for (const p of r.picks) {
      expect(p.variant.priceUsd).not.toBeNull();
      expect(p.variant.priceUsd!).toBeLessThanOrEqual(60);
    }
    expect(r.filteredOut.budget).toBeGreaterThan(0);
  });

  it('reports no coverage for soft tip (no soft darts catalogued yet)', () => {
    const r = recommend(fit(hand(185), { ...baseAnswers, tip: 'soft' }), variants);
    expect(r.picks).toEqual([]);
    expect(r.coverage).toBe('none');
  });

  it('respects the availability filter', () => {
    const only = new Set(['rd-javelin-21', 'rd-javelin-23']);
    const r = recommend(fit(hand(185), baseAnswers), variants, { available: only });
    expect(r.picks.map((p) => p.variant.id)).toEqual([expect.stringMatching(/^rd-javelin/)]);
  });

  it('every pick explains itself with at least one strength', () => {
    const r = recommend(fit(hand(185), baseAnswers), variants);
    for (const p of r.picks) expect(p.why.some((w) => w.kind === 'strength')).toBe(true);
  });
});

describe('proTwin and sensitivity', () => {
  it('a player happy with a 23 g, 52 mm dart gets a twin whose dart is 23 g and within 2 mm', () => {
    const f = fit(hand(185), { ...baseAnswers, current: { weightG: 23, lengthMm: 52, feel: 'right' } });
    const v = proTwin(f, pros, variants)!.scored.variant;
    expect(v.weightG).toBe(23);
    expect(Math.abs(v.lengthMm - 52)).toBeLessThanOrEqual(2);
  });

  it('a slim-barrel player happy with 23 g / 52 mm gets a pro with a slim ~23 g, ~50 mm dart', () => {
    const f = fit(hand(185), {
      ...baseAnswers,
      thickness: 'slim',
      current: { weightG: 23, lengthMm: 52, feel: 'right' },
    });
    const v = proTwin(f, pros, variants)!.scored.variant;
    expect(Math.abs(v.weightG - 23)).toBeLessThanOrEqual(1);
    expect(Math.abs(v.lengthMm - 51)).toBeLessThanOrEqual(2.5);
    expect(v.diameterMm).toBeLessThanOrEqual(6.8);
  });

  it('what-if reports answers that would change the top pick', () => {
    const w = sensitivity(hand(185), baseAnswers, variants);
    expect(w.length).toBeGreaterThan(0);
    expect(
      w.every((x) => x.newBestId !== recommend(fit(hand(185), baseAnswers), variants).picks[0]!.variant.id),
    ).toBe(true);
  });
});

/**
 * Golden personas. Expectations are written as a fitter would judge them (direction and range),
 * not as frozen engine output, so honest tuning does not break them but nonsense does.
 */
describe('personas (gate G2 fixtures)', () => {
  const run = (id: string) => {
    const p = personas.find((x) => x.id === id)!;
    const f = fit(p.m, p.a);
    const r = recommend(f, variants, { budgetUsd: p.a.budgetUsd });
    return { f, r, best: r.picks[0]?.variant };
  };

  it('p01 small-hand 2-finger front pinch → short, front-leaning, not heavy', () => {
    const { f, best } = run('p01');
    expect(f.length.band[1]).toBeLessThanOrEqual(45);
    expect(f.preferredBalance).toBe('front');
    expect(best!.lengthMm).toBeLessThanOrEqual(47);
    expect(best!.weightG).toBeLessThanOrEqual(23);
  });
  it('p02 large 4-finger rear grip → long barrel, rear balance preferred', () => {
    const { f, best } = run('p02');
    expect(f.length.band[0]).toBeGreaterThanOrEqual(53);
    expect(f.preferredBalance).toBe('rear');
    expect(best!.lengthMm).toBeGreaterThanOrEqual(50);
  });
  it('p03 average → 21–23 g, straight centre-balanced dart, excellent fit', () => {
    const { f, r, best } = run('p03');
    expect(f.weight.band).toEqual([21, 23]);
    expect(best!.shape).toBe('straight');
    expect(r.picks[0]!.quality).toBe('excellent');
  });
  it('p04 sweaty, wants grip → best has grip ≥ 4', () => {
    expect(run('p04').best!.gripIntensity!).toBeGreaterThanOrEqual(4);
  });
  it('p05 smooth → best has grip ≤ 2', () => {
    expect(run('p05').best!.gripIntensity!).toBeLessThanOrEqual(2);
  });
  it('p06 26 g too heavy → band 23–25, best 24 g', () => {
    const { f, best } = run('p06');
    expect(f.weight.band).toEqual([23, 25]);
    expect(best!.weightG).toBe(24);
  });
  it('p07 18 g too light → around 20 g', () => {
    const { f, best } = run('p07');
    expect(f.weight.mu).toBeGreaterThan(19);
    expect(f.weight.mu).toBeLessThan(21);
    expect(best!.weightG).toBeLessThanOrEqual(21);
  });
  it('p08 happy with 23 g / 52 mm → a 23 g dart near 52 mm', () => {
    const { best } = run('p08');
    expect(best!.weightG).toBe(23);
    expect(Math.abs(best!.lengthMm - 52)).toBeLessThanOrEqual(1.5);
  });
  it('p09 no scan, no current dart → low confidence, still a sensible default', () => {
    const { f, best } = run('p09');
    expect(f.confidence).toBe('low');
    expect(best!.weightG).toBeGreaterThanOrEqual(21);
    expect(best!.weightG).toBeLessThanOrEqual(23);
  });
  it('p10 slim → best ≤ 6.6 mm', () => {
    expect(run('p10').best!.diameterMm).toBeLessThanOrEqual(6.6);
  });
  it('p11 chunky → best ≥ 7.2 mm', () => {
    expect(run('p11').best!.diameterMm).toBeGreaterThanOrEqual(7.2);
  });
  it('p12 heavy front flat thrower → 25–27 g, front balance', () => {
    const { f, best } = run('p12');
    expect(f.weight.band).toEqual([25, 27]);
    expect(best!.balance).toBe('front');
    expect(best!.weightG).toBeGreaterThanOrEqual(25);
  });
  it('p13 rear grip → never a front-weighted best pick', () => {
    expect(run('p13').best!.balance).not.toBe('front');
  });
  it('p14 budget $60 → budget darts found, all picks priced within budget', () => {
    const { r } = run('p14');
    expect(r.picks.length).toBeGreaterThan(0);
    r.picks.forEach((p) => expect(p.variant.priceUsd!).toBeLessThanOrEqual(60));
  });
  it('p15 large hand flat → heavier band than p16 small hand arc', () => {
    expect(run('p15').f.weight.mu - run('p16').f.weight.mu).toBeGreaterThan(2);
  });
  it('p16 small hand arc → ≤ 21 g best', () => {
    expect(run('p16').best!.weightG).toBeLessThanOrEqual(21);
  });
  it('p17 front grip, grip 4 → front-weighted best with grip ≥ 3', () => {
    const b = run('p17').best!;
    expect(b.balance).toBe('front');
    expect(b.gripIntensity!).toBeGreaterThanOrEqual(3);
  });
  it('p18 4 fingers, long fingers → ≥ 52 mm', () => {
    expect(run('p18').best!.lengthMm).toBeGreaterThanOrEqual(52);
  });
  it('p19 2 fingers, short fingers → ≤ 45 mm', () => {
    expect(run('p19').best!.lengthMm).toBeLessThanOrEqual(45);
  });
  it('p20 soft tip → lighter band, no picks yet', () => {
    const { f, r } = run('p20');
    expect(f.weight.band[1]).toBeLessThanOrEqual(20);
    expect(r.coverage).toBe('none');
  });
});

describe('priceTiers', () => {
  const bounds = { budgetMaxUsd: 58, standardMaxUsd: 115 };
  it('picks the lowest-cost dart within each price class', () => {
    const f = fit(hand(185), baseAnswers);
    const tiers = priceTiers(f, variants, bounds);
    for (const [tier, s] of Object.entries(tiers)) {
      if (!s) continue;
      const p = s.variant.priceUsd!;
      if (tier === 'budget') expect(p).toBeLessThanOrEqual(bounds.budgetMaxUsd);
      if (tier === 'standard') expect(p > bounds.budgetMaxUsd && p <= bounds.standardMaxUsd).toBe(true);
      if (tier === 'premium') expect(p).toBeGreaterThan(bounds.standardMaxUsd);
      const same = variants.filter(
        (v) =>
          v.tip === 'steel' &&
          !v.specCheck &&
          v.priceUsd !== null &&
          (tier === 'budget'
            ? v.priceUsd <= 58
            : tier === 'standard'
              ? v.priceUsd > 58 && v.priceUsd <= 115
              : v.priceUsd > 115),
      );
      expect(Math.min(...same.map((v) => scoreVariant(f, v).cost))).toBeCloseTo(s.cost, 6);
    }
  });
  it('respects the allowed filter and never returns flagged listings', () => {
    const f = fit(hand(185), baseAnswers);
    const none = priceTiers(f, variants, bounds, () => false);
    expect(none).toEqual({ budget: null, standard: null, premium: null });
    const all = priceTiers(f, variants, bounds);
    expect(Object.values(all).every((s) => !s || !s.variant.specCheck)).toBe(true);
  });
});

describe('match breakdown: shape, style, total', () => {
  it('splits the score into shape and style, and the total is the usual score', async () => {
    const { fit: runFit, recommend, matchBreakdown, matchPctOf, config: cfg } = await import('../src/index.js');
    const { baseAnswers, hand } = await import('./helpers.js');
    const { loadCatalogue } = await import('@dartfit/catalogue');
    const f = runFit(hand(186), baseAnswers);
    const picks = recommend(f, loadCatalogue().variants).picks;
    for (const p of picks) {
      const b = matchBreakdown(p);
      expect(b.total).toBe(matchPctOf(p.cost, cfg.match.displayScale));
      expect(b.shape.items.map((i) => i.dim)).toEqual(['weight', 'length', 'diameter']);
      expect(b.style.items.map((i) => i.dim)).toEqual(['shape', 'grip', 'balance']);
      // Total is the weighted geometric mean of the parts (shape ≈ 72%, style ≈ 28%), within rounding.
      const geo = 100 * (b.shape.pct / 100) ** (6.5 / 9) * (b.style.pct / 100) ** (2.5 / 9);
      expect(Math.abs(geo - b.total)).toBeLessThan(2.5);
    }
  });
});
