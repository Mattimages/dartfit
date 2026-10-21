/**
 * Grounding for the AI explanation. The server sends `ExplainInput` to the model and rejects any
 * reply that contains a number not present in the input. `templateExplanation` is the deterministic
 * fallback (and is held to the same rule by tests).
 */
import type { Fit, Answers, Pick as RecPick } from './types.js';
import type { ProTwin } from './match.js';

export type Lang = 'nl' | 'en';

export interface ExplainInput {
  lang: Lang;
  answers: Pick<Answers, 'hold' | 'fingers' | 'throwStyle' | 'moisture' | 'gripFeel'> & {
    currentWeightG?: number;
    currentFeel?: string;
  };
  hand: { lengthMm: number; middleFingerMm: number } | null;
  bands: {
    weightG: [number, number];
    lengthMm: [number, number];
    diameterMm: [number, number];
    grip: [number, number];
  };
  preferredBalance: string;
  confidence: string;
  pick: {
    name: string;
    weightG: number;
    lengthMm: number;
    diameterMm: number;
    grip: number | null;
    balance: string | null;
    shape: string | null;
    quality: string;
    strengths: string[];
    compromise: string | null;
  };
  proTwin: { name: string; dart: string; exactDart: boolean } | null;
  ideal: {
    lengthMm: number;
    diameterMm: number;
    massG: number;
    cogMm: number;
    shape: string;
    tungstenPct: number;
    adjusted: boolean;
  };
  setup: { shaft: string; shaftMm: [number, number]; flight: string };
}

export function buildExplainInput(
  lang: Lang,
  f: Fit,
  answers: Answers,
  pick: RecPick,
  twin: ProTwin | null,
  hand: { handLengthMm: number; middleLengthMm: number } | null,
): ExplainInput {
  const v = pick.variant;
  return {
    lang,
    answers: {
      hold: answers.hold,
      fingers: answers.fingers,
      throwStyle: answers.throwStyle,
      moisture: answers.moisture,
      gripFeel: answers.gripFeel,
      ...(answers.current
        ? { currentWeightG: answers.current.weightG, currentFeel: answers.current.feel }
        : {}),
    },
    hand: hand
      ? { lengthMm: Math.round(hand.handLengthMm), middleFingerMm: Math.round(hand.middleLengthMm) }
      : null,
    bands: {
      weightG: f.weight.band,
      lengthMm: f.length.band,
      diameterMm: f.diameter.band,
      grip: f.grip.band,
    },
    preferredBalance: f.preferredBalance,
    confidence: f.confidence,
    pick: {
      name: `${v.brand} ${v.model}`,
      weightG: v.weightG,
      lengthMm: v.lengthMm,
      diameterMm: v.diameterMm,
      grip: v.gripIntensity,
      balance: v.balance,
      shape: v.shape,
      quality: pick.quality,
      strengths: pick.why.filter((w) => w.kind === 'strength').map((w) => w.dim),
      compromise: pick.why.find((w) => w.kind === 'compromise')?.dim ?? null,
    },
    proTwin: twin
      ? {
          name: twin.pro.name,
          dart: `${twin.scored.variant.brand} ${twin.scored.variant.model}`,
          exactDart: twin.pro.exactDart,
        }
      : null,
    ideal: {
      lengthMm: Math.round(f.barrel.lengthMm),
      diameterMm: Number(f.barrel.diameterMm.toFixed(1)),
      massG: Math.round(f.barrel.massG),
      cogMm: Math.round(f.barrel.cogMm),
      shape: f.barrel.shape,
      tungstenPct: f.physics.tungstenPct,
      adjusted: f.physics.adjusted,
    },
    setup: { shaft: f.setup.shaft, shaftMm: f.setup.shaftMm, flight: f.setup.flight },
  };
}

/** Numbers in prose: Dutch writes decimals with a comma, English with a point. */
const NUM = /\d+(?:[.,]\d+)?/g;
/** Numbers in JSON: commas separate array items, so only a point is a decimal. */
const JSON_NUM = /\d+(?:\.\d+)?/g;
const toNum = (s: string) => Number(s.replace(',', '.'));

/** Every number that appears anywhere in the input, including inside product names. */
export function allowedNumbers(input: unknown): Set<number> {
  const out = new Set<number>();
  for (const m of JSON.stringify(input).match(JSON_NUM) ?? []) {
    const n = toNum(m);
    out.add(n);
    out.add(Math.round(n));
    out.add(Number(n.toFixed(1)));
  }
  return out;
}

/** Numbers in `text` that are not supported by the input. Empty array = safe to show. */
export function findUnsupportedNumbers(text: string, allowed: Set<number>): string[] {
  return (text.match(NUM) ?? []).filter((m) => !allowed.has(toNum(m)));
}

const fmt = (lang: Lang, n: number) => (lang === 'nl' ? String(n).replace('.', ',') : String(n));
const range = (lang: Lang, [a, b]: [number, number], unit: string) =>
  a === b ? `${fmt(lang, a)} ${unit}` : `${fmt(lang, a)}–${fmt(lang, b)} ${unit}`;

const T = {
  nl: {
    hold: { front: 'vooraan', middle: 'in het midden', rear: 'achteraan' },
    balance: {
      front: 'met het gewicht naar voren',
      centre: 'in balans',
      rear: 'met het gewicht naar achteren',
    },
    shape: {
      straight: 'rechte',
      torpedo: 'torpedo',
      tapered: 'taps toelopende',
      bomb: 'bom',
      scalloped: 'getailleerde',
    },
    shaft: { short: 'korte', inbetween: 'tussenmaat', medium: 'medium' },
    flight: { slim: 'slanke', standard: 'standaard' },
    dim: {
      weight: 'het gewicht',
      length: 'de lengte',
      diameter: 'de dikte',
      grip: 'de grip',
      balance: 'de balans',
      shape: 'de vorm',
    },
    quality: { excellent: 'uitstekend', good: 'goed', fair: 'redelijk', poor: 'matig' },
  },
  en: {
    hold: { front: 'at the front', middle: 'in the middle', rear: 'at the back' },
    balance: { front: 'front-weighted', centre: 'centre-balanced', rear: 'rear-weighted' },
    shape: {
      straight: 'straight',
      torpedo: 'torpedo',
      tapered: 'tapered',
      bomb: 'bomb',
      scalloped: 'scalloped',
    },
    shaft: { short: 'short', inbetween: 'in-between', medium: 'medium' },
    flight: { slim: 'slim', standard: 'standard' },
    dim: {
      weight: 'weight',
      length: 'length',
      diameter: 'thickness',
      grip: 'grip',
      balance: 'balance',
      shape: 'shape',
    },
    quality: { excellent: 'excellent', good: 'good', fair: 'fair', poor: 'weak' },
  },
} as const;

/** Deterministic, grounded explanation. Used when the AI is off, slow or fails validation. */
export function templateExplanation(i: ExplainInput): string {
  const t = T[i.lang];
  const lang = i.lang;
  const hold = t.hold[i.answers.hold];
  const bal = t.balance[i.preferredBalance as keyof typeof t.balance] ?? i.preferredBalance;
  const dimName = (d: string) => t.dim[d as keyof typeof t.dim] ?? d;
  const strengths = i.pick.strengths.map(dimName);
  const q = t.quality[i.pick.quality as keyof typeof t.quality] ?? i.pick.quality;
  const parts: string[] = [];
  if (lang === 'nl') {
    parts.push(
      `Je houdt de dart ${hold} vast met ${i.answers.fingers} vingers, dus we zoeken een barrel van ${range(lang, i.bands.lengthMm, 'mm')}, ${range(lang, i.bands.weightG, 'gram')}, ${bal}.`,
    );
    if (i.hand) parts.push(`Je hand meet ${i.hand.lengthMm} mm van pols tot middelvingertop.`);
    if (i.ideal) {
      parts.push(
        `Je ideale barrel is een ${t.shape[i.ideal.shape as keyof typeof t.shape] ?? i.ideal.shape} vorm van ${i.ideal.lengthMm} mm met het zwaartepunt op ${i.ideal.cogMm} mm vanaf de punt.`,
      );
      if (i.ideal.tungstenPct >= 95)
        parts.push(`Zo zwaar en zo slank kan alleen met ${i.ideal.tungstenPct}% tungsten.`);
    }
    parts.push(
      `De ${i.pick.name} (${fmt(lang, i.pick.weightG)} g, ${fmt(lang, i.pick.lengthMm)} mm) past ${q}${strengths.length ? `, vooral op ${strengths.join(' en ')}` : ''}.`,
    );
    if (i.pick.compromise) parts.push(`Het grootste compromis zit in ${dimName(i.pick.compromise)}.`);
    if (i.proTwin)
      parts.push(
        `Qua specs zit je het dichtst bij ${i.proTwin.exactDart ? 'de dart' : 'de signature-lijn'} van ${i.proTwin.name}.`,
      );
    if (i.setup)
      parts.push(
        `Begin met ${t.shaft[i.setup.shaft as keyof typeof t.shaft]} shafts (${i.setup.shaftMm[0]}–${i.setup.shaftMm[1]} mm) en ${t.flight[i.setup.flight as keyof typeof t.flight]} flights.`,
      );
  } else {
    parts.push(
      `You hold the dart ${hold} with ${i.answers.fingers} fingers, so we look for a ${range(lang, i.bands.lengthMm, 'mm')} barrel at ${range(lang, i.bands.weightG, 'g')}, ${bal}.`,
    );
    if (i.hand) parts.push(`Your hand measures ${i.hand.lengthMm} mm from wrist to middle fingertip.`);
    if (i.ideal) {
      parts.push(
        `Your ideal barrel is a ${t.shape[i.ideal.shape as keyof typeof t.shape] ?? i.ideal.shape} ${i.ideal.lengthMm} mm barrel with its centre of gravity ${i.ideal.cogMm} mm from the point.`,
      );
      if (i.ideal.tungstenPct >= 95)
        parts.push(`That weight in that slim a barrel needs ${i.ideal.tungstenPct}% tungsten.`);
    }
    parts.push(
      `The ${i.pick.name} (${i.pick.weightG} g, ${i.pick.lengthMm} mm) is ${/^[aeiou]/i.test(q) ? 'an' : 'a'} ${q} fit${strengths.length ? `, strongest on ${strengths.join(' and ')}` : ''}.`,
    );
    if (i.pick.compromise) parts.push(`The biggest compromise is ${dimName(i.pick.compromise)}.`);
    if (i.proTwin)
      parts.push(
        `On specs you are closest to ${i.proTwin.exactDart ? 'the dart' : 'the signature range'} of ${i.proTwin.name}.`,
      );
    if (i.setup)
      parts.push(
        `Start with ${t.shaft[i.setup.shaft as keyof typeof t.shaft]} shafts (${i.setup.shaftMm[0]}–${i.setup.shaftMm[1]} mm) and ${t.flight[i.setup.flight as keyof typeof t.flight]} flights.`,
      );
  }
  return parts.join(' ');
}
