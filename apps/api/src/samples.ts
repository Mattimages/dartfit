/**
 * Anonymous hand samples: one row per fitting, kept to calibrate the scan and improve the engine.
 * Only rounded numbers and multiple-choice answers; no account, no fit id, no timestamp finer than
 * the month, no free text. See migrations/003_hand_samples.sql.
 */
import type { Answers, Fit, Measurements } from '@dartfit/engine';
import type { Db } from './db.js';

const r0 = (v: number | undefined | null) =>
  typeof v === 'number' && Number.isFinite(v) ? Math.round(v) : null;
const r1 = (v: number | undefined | null) =>
  typeof v === 'number' && Number.isFinite(v) ? Math.round(v * 10) / 10 : null;

/** The answers that describe how someone throws; nothing typed, nothing about their current shop. */
const KEEP: Array<keyof Answers> = [
  'tip',
  'hold',
  'fingers',
  'throwStyle',
  'moisture',
  'gripFeel',
  'thickness',
  'budgetUsd',
];

export function sampleRow(
  f: Fit,
  body: { measurements?: Measurements; answers: Answers },
  country: string | null,
  bestVariantId: string | null,
  now = new Date(),
) {
  const m = body.measurements;
  const a = body.answers;
  const source = m ? ((m.samples ?? 0) > 0 ? 'scan' : 'manual') : a.heightCm ? 'height' : 'none';
  const answers: Record<string, unknown> = {};
  for (const k of KEEP) if (a[k] !== undefined) answers[k] = a[k];
  if (a.current?.weightG) answers.currentWeightG = r1(a.current.weightG);
  return {
    month: now.toISOString().slice(0, 7),
    country,
    source,
    hand_length_mm: r0(m?.handLengthMm),
    palm_width_mm: r0(m?.palmWidthMm),
    index_length_mm: r0(m?.indexLengthMm),
    middle_length_mm: r0(m?.middleLengthMm),
    thumb_index_span_mm: r0(m?.thumbIndexSpanMm),
    height_cm: r0(a.heightCm),
    forearm_cm: r0(a.forearmCm),
    answers,
    ideal_weight_g: r1(f.barrel.massG),
    ideal_length_mm: r1(f.barrel.lengthMm),
    ideal_diameter_mm: r1(f.barrel.diameterMm),
    best_variant_id: bestVariantId,
  };
}

export async function saveHandSample(
  db: Db,
  f: Fit,
  body: { measurements?: Measurements; answers: Answers },
  country: string | null,
  bestVariantId: string | null,
  engineVersion = f.engineVersion,
) {
  const s = sampleRow(f, body, country, bestVariantId);
  await db.query(
    `INSERT INTO hand_samples(month, country, engine_version, source, hand_length_mm, palm_width_mm, index_length_mm,
       middle_length_mm, thumb_index_span_mm, height_cm, forearm_cm, answers, ideal_weight_g, ideal_length_mm,
       ideal_diameter_mm, best_variant_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)`,
    [
      s.month,
      s.country,
      engineVersion,
      s.source,
      s.hand_length_mm,
      s.palm_width_mm,
      s.index_length_mm,
      s.middle_length_mm,
      s.thumb_index_span_mm,
      s.height_cm,
      s.forearm_cm,
      JSON.stringify(s.answers),
      s.ideal_weight_g,
      s.ideal_length_mm,
      s.ideal_diameter_mm,
      s.best_variant_id,
    ],
  );
}

const COLS = [
  'month',
  'country',
  'engine_version',
  'source',
  'hand_length_mm',
  'palm_width_mm',
  'index_length_mm',
  'middle_length_mm',
  'thumb_index_span_mm',
  'height_cm',
  'forearm_cm',
  'hold',
  'fingers',
  'throwStyle',
  'moisture',
  'gripFeel',
  'thickness',
  'currentWeightG',
  'ideal_weight_g',
  'ideal_length_mm',
  'ideal_diameter_mm',
  'best_variant_id',
];

/** Flat CSV, one sample per line, answers spread into their own columns. */
export function handSamplesCsv(rows: Record<string, unknown>[]): string {
  const cell = (v: unknown) => {
    if (v === null || v === undefined) return '';
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = rows.map((r) => {
    const a = (typeof r.answers === 'string' ? JSON.parse(r.answers) : r.answers) as Record<string, unknown>;
    return COLS.map((c) => cell(c in r ? r[c] : a?.[c])).join(',');
  });
  return [COLS.join(','), ...lines].join('\n') + '\n';
}
