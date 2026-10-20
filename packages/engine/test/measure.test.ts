import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import {
  aggregate,
  CARD_MM,
  cardScaleFromBox,
  cardScaleFromCorners,
  checkHandFrame,
  detectCard,
  fitLine,
  handDimensionsPx,
  median,
  robustSigma,
  scaleProblem,
  toMm,
  type Dims,
  type Landmark,
} from '../src/index.js';

/** A synthetic flat open hand (normalised coords on a 1000×1000 image), fingers spread. */
function syntheticHand(scale = 1, cx = 0.5, cy = 0.75): Landmark[] {
  const lm: Landmark[] = [{ x: cx, y: cy, z: 0 }];
  // thumb: 1–4 out to the left
  for (let i = 1; i <= 4; i++) lm.push({ x: cx - 0.06 * i * scale, y: cy - 0.04 * i * scale, z: 0 });
  // fingers: index, middle, ring, little; base row then 3 segments upward and fanned
  const bases = [-0.06, -0.02, 0.02, 0.06];
  const angles = [-14, -4, 6, 16];
  bases.forEach((bx, f) => {
    const base = { x: cx + bx * scale, y: cy - 0.2 * scale };
    const a = ((angles[f] as number) * Math.PI) / 180;
    lm.push({ ...base, z: 0 });
    for (let s = 1; s <= 3; s++) {
      lm.push({ x: base.x + Math.sin(a) * 0.035 * s * scale, y: base.y - Math.cos(a) * 0.035 * s * scale, z: 0 });
    }
  });
  return lm;
}

describe('hand geometry', () => {
  it('measures a synthetic hand in pixels', () => {
    const d = handDimensionsPx(syntheticHand(), 1000, 1000);
    expect(d.palmWidth).toBeCloseTo(120, 0); // index base −0.06 to little base +0.06
    expect(d.middleLength).toBeCloseTo(105, 0); // 3 × 35 px
  });

  it('accepts a flat spread hand', () => {
    expect(checkHandFrame(syntheticHand())).toBeNull();
  });

  it('rejects missing, cropped, closed and tilted hands', () => {
    expect(checkHandFrame(undefined)).toBe('no_hand');
    expect(checkHandFrame(syntheticHand(1, 0.99))).toBe('out_of_frame');
    const closed = syntheticHand().map((p, i) => (i >= 5 ? { ...p, x: 0.5 + (p.x - 0.5) * 0.05 } : p));
    expect(checkHandFrame(closed)).toBe('fingers_closed');
    const tilted = syntheticHand().map((p, i) => ([4, 8, 12, 16, 20].includes(i) ? { ...p, z: -0.2 } : p));
    expect(checkHandFrame(tilted)).toBe('hand_tilted');
  });

  it('rejects bent fingers', () => {
    const lm = syntheticHand();
    lm[11] = { ...(lm[11] as Landmark), x: (lm[11] as Landmark).x + 0.05 };
    expect(checkHandFrame(lm)).toBe('fingers_bent');
  });
});

describe('card scale', () => {
  it('converts a perfect card box to mm per pixel', () => {
    const s = cardScaleFromBox(856, 539.8);
    expect(s.mmPerPx).toBeCloseTo(0.1, 4);
    expect(Math.abs(s.aspectError)).toBeLessThan(1e-3);
    expect(scaleProblem(s)).toBeNull();
  });

  it('flags a card that is not card-shaped', () => {
    expect(scaleProblem(cardScaleFromBox(800, 600))).toBe('card_aspect');
  });

  it('flags perspective from tapped corners', () => {
    const s = cardScaleFromCorners([
      { x: 0, y: 0 },
      { x: 900, y: 0 },
      { x: 856, y: 540 },
      { x: 44, y: 540 },
    ]);
    expect(scaleProblem(s)).toBe('card_skew');
  });

  it('corner scale is invariant to rotation', () => {
    fc.assert(
      fc.property(fc.double({ min: 0, max: Math.PI * 2, noNaN: true }), (t) => {
        const rot = (x: number, y: number) => ({ x: x * Math.cos(t) - y * Math.sin(t), y: x * Math.sin(t) + y * Math.cos(t) });
        const s = cardScaleFromCorners([rot(0, 0), rot(428, 0), rot(428, 269.9), rot(0, 269.9)]);
        return Math.abs(s.mmPerPx - 0.2) < 1e-6 && s.skew < 1e-9;
      }),
    );
  });
});

describe('robust aggregation', () => {
  const frame = (hl: number): Dims => ({
    handLength: hl,
    palmWidth: 80,
    indexLength: 75,
    middleLength: 85,
    thumbIndexSpan: 120,
  });

  it('median and robust sigma', () => {
    expect(median([3, 1, 2])).toBe(2);
    expect(median([1, 2, 3, 4])).toBe(2.5);
    expect(robustSigma([10, 10, 10, 10])).toBe(0);
  });

  it('drops outlier frames and reports spread', () => {
    const frames = [185, 186, 184, 185.5, 184.5, 185, 230].map(frame);
    const m = aggregate(frames, false)!;
    expect(m.handLengthMm).toBeCloseTo(185, 0);
    expect(m.samples).toBe(6);
    expect(m.spreadMm).toBeLessThan(1.5);
  });

  it('needs at least three usable frames', () => {
    expect(aggregate([frame(185), frame(186)], false)).toBeNull();
  });

  it('applies calibration linearly', () => {
    const cal = {
      calibrated: true,
      n: 10,
      dims: {
        handLength: { a: 1, b: 0 },
        palmWidth: { a: 1.1, b: 2 },
        indexLength: { a: 1, b: 0 },
        middleLength: { a: 1, b: 0 },
        thumbIndexSpan: { a: 1, b: 0 },
      },
    };
    const mm = toMm({ handLength: 1000, palmWidth: 700, indexLength: 0, middleLength: 0, thumbIndexSpan: 0 }, 0.1, cal);
    expect(mm.palmWidth).toBeCloseTo(79);
  });

  it('fitLine recovers a known line', () => {
    const l = fitLine([
      [70, 79],
      [80, 90],
      [90, 101],
    ]);
    expect(l.a).toBeCloseTo(1.1);
    expect(l.b).toBeCloseTo(2);
    expect(l.r2).toBeCloseTo(1);
  });
});

describe('detectCard (synthetic image)', () => {
  function image(w: number, h: number, card: { x: number; y: number; w: number; h: number }, seed = 7) {
    let s = seed;
    const rnd = () => ((s = (s * 1103515245 + 12345) % 2 ** 31) / 2 ** 31);
    const g = new Uint8ClampedArray(w * h);
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const inCard = x >= card.x && x < card.x + card.w && y >= card.y && y < card.y + card.h;
        // Card with some printed text-like stripes inside, noisy wood-ish background outside.
        const stripe = inCard && y > card.y + 20 && y < card.y + 26 && x > card.x + 15 && x < card.x + 90 ? -60 : 0;
        g[y * w + x] = (inCard ? 205 + stripe : 95 + 25 * Math.sin(x / 9)) + rnd() * 18;
      }
    return g;
  }

  it('finds a card inside the guide to within 2 px and gives the right scale', () => {
    const card = { x: 60, y: 50, w: 254, h: 160 }; // 254/160 ≈ 1.5875
    const g = image(400, 300, card);
    const d = detectCard(g, 400, { x: 20, y: 15, w: 340, h: 240 })!;
    expect(d).not.toBeNull();
    expect(Math.abs(d.box.x - card.x)).toBeLessThanOrEqual(2);
    expect(Math.abs(d.box.y - card.y)).toBeLessThanOrEqual(2);
    expect(Math.abs(d.box.w - card.w)).toBeLessThanOrEqual(3);
    expect(Math.abs(d.box.h - card.h)).toBeLessThanOrEqual(3);
    expect(d.scale.mmPerPx).toBeCloseTo(CARD_MM.long / card.w, 2);
  });

  it('returns null when there is no card', () => {
    const g = new Uint8ClampedArray(400 * 300).fill(120);
    expect(detectCard(g, 400, { x: 20, y: 15, w: 340, h: 240 })).toBeNull();
  });

  it('rejects a square object', () => {
    const g = image(400, 300, { x: 80, y: 40, w: 200, h: 200 });
    expect(detectCard(g, 400, { x: 20, y: 15, w: 340, h: 270 })).toBeNull();
  });
});
