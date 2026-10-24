/** Flow state for one fitting session. Kept in sessionStorage so a reload doesn't lose it. */
import type { Answers, Measurements, Pt } from '@dartfit/engine';

export interface Session {
  measurements?: Measurements;
  /** Measured hand on the table plane, mm. Only for drawing; never sent anywhere. */
  landmarksMm?: Pt[];
  answers?: Answers;
  /** Name of the catalogue dart the player picked as their current one. */
  currentName?: string;
  /** Price class to open the result on; 'any' = the class of the best overall fit. */
  priceClass?: 'budget' | 'standard' | 'premium' | 'any';
  /** Buying for someone else: no scan, the questions ask about "the player". */
  gift?: boolean;
  /** The email sign-up was shown at the start of a fitting film this visit. */
  alertsAsked?: boolean;
  /** They signed up for alerts this visit (confirmation mail on its way). */
  alertsSent?: boolean;
}

const KEY = 'df_session';
let mem: Session = {};

function read(): Session {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (raw) mem = JSON.parse(raw) as Session;
  } catch {
    /* storage unavailable: keep the in-memory copy */
  }
  return mem;
}

export const session = (): Session => read();

export function update(patch: Partial<Session>) {
  mem = { ...read(), ...patch };
  try {
    sessionStorage.setItem(KEY, JSON.stringify(mem));
  } catch {
    /* ignore */
  }
}

export function clearSession() {
  mem = {};
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
