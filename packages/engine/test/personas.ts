import type { Answers, Measurements } from '../src/index.js';
import { baseAnswers, hand } from './helpers.js';

export interface Persona {
  id: string;
  label: string;
  m?: Measurements;
  a: Answers;
}

const A = (o: Partial<Answers>): Answers => ({ ...baseAnswers, ...o });

export const personas: Persona[] = [
  { id: 'p01', label: 'Small hand, 2-finger front pinch, flat throw', m: hand(165), a: A({ fingers: 2, hold: 'front', throwStyle: 'flat' }) },
  { id: 'p02', label: 'Large hand, 4-finger rear grip, arc throw', m: hand(208), a: A({ fingers: 4, hold: 'rear', throwStyle: 'arc' }) },
  { id: 'p03', label: 'Average hand, 3-finger middle, unsure', m: hand(185), a: A({}) },
  { id: 'p04', label: 'Sweaty hands, wants grip', m: hand(185), a: A({ moisture: 'sweaty', gripFeel: 4 }) },
  { id: 'p05', label: 'Likes smooth barrels', m: hand(185), a: A({ gripFeel: 1, moisture: 'dry' }) },
  { id: 'p06', label: 'Current 26 g feels too heavy', m: hand(190), a: A({ current: { weightG: 26, feel: 'too_heavy' } }) },
  { id: 'p07', label: 'Current 18 g feels too light', m: hand(175), a: A({ current: { weightG: 18, feel: 'too_light' } }) },
  { id: 'p08', label: 'Current 23 g feels right, 52 mm barrel', m: hand(185), a: A({ current: { weightG: 23, lengthMm: 52, feel: 'right' } }) },
  { id: 'p09', label: 'No scan, no current dart', a: A({}) },
  { id: 'p10', label: 'Wants a slim barrel', m: hand(185), a: A({ thickness: 'slim' }) },
  { id: 'p11', label: 'Wants a chunky barrel', m: hand(185), a: A({ thickness: 'chunky' }) },
  { id: 'p12', label: 'Front grip, flat, heavy current 25 g right', m: hand(195), a: A({ hold: 'front', throwStyle: 'flat', current: { weightG: 25, feel: 'right' } }) },
  { id: 'p13', label: 'Rear grip, 3 fingers', m: hand(185), a: A({ hold: 'rear' }) },
  { id: 'p14', label: 'Budget under $60', m: hand(185), a: A({ budgetUsd: 60 }) },
  { id: 'p15', label: 'Large hand, middle grip, flat', m: hand(205), a: A({ throwStyle: 'flat' }) },
  { id: 'p16', label: 'Small hand, middle grip, arc', m: hand(162), a: A({ throwStyle: 'arc' }) },
  { id: 'p17', label: 'Front grip, 3 fingers, grip 4', m: hand(185), a: A({ hold: 'front', gripFeel: 4 }) },
  { id: 'p18', label: '4 fingers middle, long fingers', m: hand(185, { middleLengthMm: 97 }), a: A({ fingers: 4 }) },
  { id: 'p19', label: '2 fingers middle, short fingers', m: hand(185, { middleLengthMm: 74 }), a: A({ fingers: 2 }) },
  { id: 'p20', label: 'Soft tip player (no soft darts in catalogue yet)', m: hand(185), a: A({ tip: 'soft' }) },
];
