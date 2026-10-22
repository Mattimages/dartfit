import type { Answers, Measurements } from '../src/index.js';

export const baseAnswers: Answers = {
  tip: 'steel',
  hold: 'middle',
  fingers: 3,
  throwStyle: 'unsure',
  moisture: 'normal',
  gripFeel: 3,
  thickness: 'auto',
};

export function hand(lengthMm: number, overrides: Partial<Measurements> = {}): Measurements {
  const s = lengthMm / 185;
  return {
    handLengthMm: lengthMm,
    palmWidthMm: 78 * s,
    indexLengthMm: 78 * s,
    middleLengthMm: 85 * s,
    thumbIndexSpanMm: 120 * s,
    spreadMm: 1.2,
    samples: 20,
    calibrated: false,
    ...overrides,
  };
}
