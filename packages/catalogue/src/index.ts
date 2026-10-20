import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import { physicsOutliers, type Pro, type Variant } from '@dartfit/engine';

const DATA = join(dirname(fileURLToPath(import.meta.url)), '..', 'data');

const num = (lo: number, hi: number) => z.coerce.number().min(lo).max(hi);
const optional = <T extends z.ZodTypeAny>(s: T) =>
  z.preprocess((v) => (v === '' || v === undefined ? null : v), s.nullable());

export const VariantRow = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  model_id: z.string().regex(/^[a-z0-9-]+$/),
  brand: z.string().min(2),
  model: z.string().min(2),
  tip: z.enum(['steel', 'soft']),
  weight_g: num(12, 40),
  length_mm: num(30, 70),
  diameter_mm: num(5, 10),
  shape: optional(z.enum(['straight', 'torpedo', 'tapered', 'bomb', 'scalloped'])),
  balance: optional(z.enum(['front', 'centre', 'rear'])),
  grip: optional(num(1, 5)),
  tungsten_pct: num(0, 100),
  price_usd: optional(num(1, 2000)),
  source_url: z.string().url().startsWith('https://'),
  verified_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});
export type VariantRow = z.infer<typeof VariantRow>;

export const ProRow = z.object({
  id: z.string().regex(/^[a-z]+$/),
  name: z.string().min(3),
  country: z.string().length(3),
  variantId: z.string(),
  exactDart: z.boolean(),
  playingWeightG: z.number().nullable(),
  sourceUrl: z.string().url().startsWith('https://'),
});

export const Retailer = z.object({
  id: z.string(),
  name: z.string(),
  countries: z.array(z.string()),
  kind: z.enum(['product', 'search']),
  currency: z.string().optional(),
  searchTemplate: z.string().optional(),
  affiliateEnv: z.string().nullable(),
});
export type Retailer = z.infer<typeof Retailer>;

/** Minimal RFC-4180 CSV parser (quoted fields, escaped quotes). */
export function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i]!;
    if (q) {
      if (c === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (c === '"') q = false;
      else field += c;
    } else if (c === '"') q = true;
    else if (c === ',') {
      row.push(field);
      field = '';
    }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field);
      field = '';
      if (row.some((f) => f !== '')) rows.push(row);
      row = [];
    } else field += c;
  }
  if (field !== '' || row.length) {
    row.push(field);
    rows.push(row);
  }
  const [head, ...body] = rows;
  if (!head) return [];
  return body.map((r) => Object.fromEntries(head.map((h, i) => [h, r[i] ?? ''])));
}

export interface CatalogueIssue {
  row: number;
  id?: string;
  message: string;
}

export function validateVariants(rows: Record<string, string>[]): { variants: Variant[]; issues: CatalogueIssue[] } {
  const issues: CatalogueIssue[] = [];
  const variants: Variant[] = [];
  const seen = new Set<string>();
  rows.forEach((raw, i) => {
    const r = VariantRow.safeParse(raw);
    if (!r.success) {
      issues.push({ row: i + 2, id: raw.id, message: r.error.issues.map((x) => `${x.path.join('.')}: ${x.message}`).join('; ') });
      return;
    }
    const d = r.data;
    if (seen.has(d.id)) issues.push({ row: i + 2, id: d.id, message: 'duplicate id' });
    seen.add(d.id);
    variants.push({
      id: d.id,
      modelId: d.model_id,
      brand: d.brand,
      model: d.model,
      tip: d.tip,
      weightG: d.weight_g,
      lengthMm: d.length_mm,
      diameterMm: d.diameter_mm,
      shape: d.shape,
      balance: d.balance,
      gripIntensity: d.grip,
      tungstenPct: d.tungsten_pct,
      priceUsd: d.price_usd,
      sourceUrl: d.source_url,
      verifiedAt: d.verified_at,
    });
  });
  // Variants of one model must agree on brand and model name.
  const byModel = new Map<string, Variant>();
  for (const v of variants) {
    const first = byModel.get(v.modelId);
    if (first && (first.brand !== v.brand || first.model !== v.model)) {
      issues.push({ row: 0, id: v.id, message: `model ${v.modelId} has inconsistent brand/name` });
    }
    if (!first) byModel.set(v.modelId, v);
  }
  return { variants, issues };
}

export function validatePros(raw: unknown, variants: Variant[]): { pros: Pro[]; issues: CatalogueIssue[] } {
  const issues: CatalogueIssue[] = [];
  const ids = new Set(variants.map((v) => v.id));
  const parsed = z.array(ProRow).safeParse(raw);
  if (!parsed.success) return { pros: [], issues: [{ row: 0, message: parsed.error.message }] };
  parsed.data.forEach((p, i) => {
    if (!ids.has(p.variantId)) issues.push({ row: i, id: p.id, message: `unknown variant ${p.variantId}` });
  });
  return { pros: parsed.data, issues };
}

let cache: { variants: Variant[]; pros: Pro[]; retailers: Retailer[] } | null = null;

/** Load and validate the bundled catalogue. Throws when any row is invalid. */
export function loadCatalogue() {
  if (cache) return cache;
  const { variants, issues } = validateVariants(parseCsv(readFileSync(join(DATA, 'variants.csv'), 'utf8')));
  const prosRes = validatePros(JSON.parse(readFileSync(join(DATA, 'pros.json'), 'utf8')), variants);
  const retailers = z
    .array(Retailer)
    .parse(JSON.parse(readFileSync(join(DATA, 'retailers.json'), 'utf8')).retailers);
  const all = [...issues, ...prosRes.issues];
  if (all.length) throw new Error(`catalogue invalid:\n${all.map((i) => `  row ${i.row} ${i.id ?? ''}: ${i.message}`).join('\n')}`);
  // Flag listings the barrel physics model cannot reconcile (kept browsable, not recommended).
  const flagged = new Map(physicsOutliers(variants).map((o) => [o.id, o]));
  const checked = variants.map((v) => {
    const o = flagged.get(v.id);
    return o ? { ...v, specCheck: { listedG: o.listedG, modelG: o.modelG } } : v;
  });
  cache = { variants: checked, pros: prosRes.pros, retailers };
  return cache;
}
