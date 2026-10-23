import { describe, expect, it } from 'vitest';
import { loadCatalogue, parseCsv, validatePros, validateVariants } from '../src/index.js';

describe('csv parser', () => {
  it('handles quotes, escaped quotes and CRLF', () => {
    const rows = parseCsv('a,b\r\n"x, y","he said ""hi"""\r\n1,\n');
    expect(rows).toEqual([
      { a: 'x, y', b: 'he said "hi"' },
      { a: '1', b: '' },
    ]);
  });
});

describe('bundled catalogue', () => {
  const { variants, pros } = loadCatalogue();

  it('loads with no validation issues', () => {
    expect(variants.length).toBeGreaterThanOrEqual(40);
    expect(pros.length).toBeGreaterThanOrEqual(5);
  });

  it('every row has an https source and a verified date', () => {
    for (const v of variants) expect(v.sourceUrl).toMatch(/^https:\/\//);
  });

  it('the world top four are present with the weights their sources state', () => {
    const w = (id: string) =>
      variants.find((v) => v.id === pros.find((p) => p.id === id)!.variantId)!.weightG;
    expect(w('littler')).toBe(23);
    expect(w('humphries')).toBe(22);
    expect(w('vanveen')).toBe(21);
    expect(w('price')).toBe(23);
  });

  it('only Littler is marked as an exact dart (the others are signature lines)', () => {
    expect(pros.filter((p) => p.exactDart).map((p) => p.id)).toEqual(['littler']);
  });
});

describe('validation rejects bad data', () => {
  const good = {
    id: 'x-1',
    model_id: 'x',
    brand: 'Brand',
    model: 'Model',
    tip: 'steel',
    weight_g: '22',
    length_mm: '50',
    diameter_mm: '6.5',
    shape: 'straight',
    balance: 'centre',
    grip: '3',
    tungsten_pct: '90',
    price_usd: '50',
    source_url: 'https://example.com/x',
    verified_at: '2026-10-19',
  };

  it('accepts a good row and optional blanks', () => {
    const r = validateVariants([good, { ...good, id: 'x-2', grip: '', balance: '', price_usd: '' }]);
    expect(r.issues).toEqual([]);
    expect(r.variants[1]!.gripIntensity).toBeNull();
  });

  it('rejects a row without a source', () => {
    expect(validateVariants([{ ...good, source_url: '' }]).issues).toHaveLength(1);
  });

  it('rejects impossible specs and unknown enums', () => {
    expect(validateVariants([{ ...good, weight_g: '200' }]).issues).toHaveLength(1);
    expect(validateVariants([{ ...good, shape: 'banana' }]).issues).toHaveLength(1);
  });

  it('rejects duplicate ids and inconsistent model names', () => {
    expect(validateVariants([good, good]).issues.some((i) => i.message === 'duplicate id')).toBe(true);
    expect(validateVariants([good, { ...good, id: 'x-2', model: 'Other' }]).issues).toHaveLength(1);
  });

  it('rejects a pro pointing at a missing variant', () => {
    const { variants } = validateVariants([good]);
    const r = validatePros(
      [
        {
          id: 'abc',
          name: 'Some One',
          country: 'NED',
          variantId: 'nope',
          exactDart: false,
          playingWeightG: null,
          sourceUrl: 'https://x.y',
        },
      ],
      variants,
    );
    expect(r.issues).toHaveLength(1);
  });
});
