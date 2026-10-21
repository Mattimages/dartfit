import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { fit, handFromHeight, launchAngle, trajectory, type Answers } from '../src/index.js';
import { baseAnswers, hand } from './helpers.js';

const unsure: Answers = { ...baseAnswers, throwStyle: 'unsure' };

describe('launch geometry', () => {
  it('reference build (1.78 m) needs about 15.5°, inside the 13–18° measured in professionals', () => {
    const tr = trajectory({ heightCm: 178 }, undefined)!;
    expect(tr.angleDeg).toBeGreaterThan(13);
    expect(tr.angleDeg).toBeLessThan(18);
    expect(tr.flatness).toBeCloseTo(0, 1);
  });

  it('a level throw at the bull needs only the gravity drop', () => {
    // Release exactly at bull height, 1.92 m away, 6.5 m/s: tiny positive angle.
    const a = (launchAngle(1.92, 0, 6.5, 9.81) * 180) / Math.PI;
    expect(a).toBeGreaterThan(0);
    expect(a).toBeLessThan(15);
  });

  it('taller players need a flatter launch (monotonic)', () => {
    fc.assert(
      fc.property(fc.integer({ min: 150, max: 205 }), fc.integer({ min: 1, max: 15 }), (h, d) => {
        const lo = trajectory({ heightCm: h }, undefined)!;
        const hi = trajectory({ heightCm: h + d }, undefined)!;
        return hi.angleDeg < lo.angleDeg && hi.flatness >= lo.flatness;
      }),
    );
  });

  it('a longer forearm (faster release) flattens the throw for the same height', () => {
    const short = trajectory({ heightCm: 175, forearmCm: 23 }, undefined)!;
    const long = trajectory({ heightCm: 175, forearmCm: 30 }, undefined)!;
    expect(long.releaseSpeedMs).toBeGreaterThan(short.releaseSpeedMs);
    expect(long.angleDeg).toBeLessThan(short.angleDeg);
    expect(short.forearmEstimated).toBe(false);
  });
});

describe('height in the fit', () => {
  it('estimates the hand from height when there is no scan (10.75% of stature)', () => {
    expect(handFromHeight(180).mu).toBeCloseTo(193.5, 1);
    const f = fit(undefined, { ...baseAnswers, heightCm: 180 });
    const r = f.reasons.find((x) => x.code === 'hand_from_height');
    expect(r?.params.handLengthMm).toBe(194);
    expect(f.handTier).not.toBeNull();
  });

  it('a height estimate counts for less than a scan', () => {
    const est = fit(undefined, { ...baseAnswers, heightCm: 180 });
    const scan = fit(hand(193.5), baseAnswers);
    expect(est.confidenceScore).toBeLessThan(scan.confidenceScore);
    expect(est.weight.sigma).toBeGreaterThanOrEqual(scan.weight.sigma);
  });

  it('flags a scan that does not fit the height', () => {
    const f = fit(hand(150), { ...baseAnswers, heightCm: 195 });
    expect(f.reasons.some((x) => x.code === 'hand_height_mismatch')).toBe(true);
    const ok = fit(hand(200), { ...baseAnswers, heightCm: 186 });
    expect(ok.reasons.some((x) => x.code === 'hand_height_mismatch')).toBe(false);
  });

  it('"not sure" how it flies: a tall player gets a heavier target, a short one lighter', () => {
    const tall = fit(hand(200), { ...unsure, heightCm: 198 });
    const short = fit(hand(170), { ...unsure, heightCm: 158 });
    const tallShift = tall.reasons.find((x) => x.code === 'weight_body')?.effect ?? 0;
    const shortShift = short.reasons.find((x) => x.code === 'weight_body')?.effect ?? 0;
    expect(tallShift).toBeGreaterThan(0);
    expect(shortShift).toBeLessThan(0);
    expect(tall.throwStyle).toBe('flat');
    expect(short.throwStyle).toBe('arc');
    expect(tall.setup.shaft).toBe('short');
  });

  it('an explicit throw-style answer wins over the geometry', () => {
    const f = fit(hand(200), { ...baseAnswers, throwStyle: 'arc', heightCm: 198 });
    expect(f.throwStyle).toBe('arc');
    expect(f.reasons.some((x) => x.code === 'weight_body')).toBe(false);
  });

  it('without a height nothing changes', () => {
    const a = fit(hand(185), unsure);
    expect(a.trajectory).toBeNull();
    expect(a.throwStyle).toBe('unsure');
  });
});
