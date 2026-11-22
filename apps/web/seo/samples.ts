/**
 * Sample fits for the locale landing pages: what the real engine recommends for a player of a
 * given height (hand estimated from height, three fingers, average hand, no other answers) for each
 * place they hold the dart. Run at build time through tsx (the Vite config cannot import the engine
 * directly), and printed as JSON when run as a script.
 */
import {
  fit,
  recommend,
  measurementsFromHeight,
  matchPctOf,
  config,
  USD_PER_EUR,
  PRICE_CLASS_EUR,
} from '@dartfit/engine';
import { loadCatalogue } from '@dartfit/catalogue';

export type Hold = 'front' | 'middle' | 'rear';
export interface SampleFit {
  heightCm: number;
  hold: Hold;
  weight: [number, number];
  length: [number, number];
  diameter: [number, number];
  /** The best dart in the catalogue for that fit. */
  dart: { brand: string; model: string; weightG: number; lengthMm: number; diameterMm: number };
  matchPct: number;
}

export const SAMPLE_HEIGHTS = [165, 178, 192] as const;
export const SAMPLE_HOLDS: Hold[] = ['front', 'middle', 'rear'];

export function sampleFits(): SampleFit[] {
  const { variants } = loadCatalogue();
  const out: SampleFit[] = [];
  for (const heightCm of SAMPLE_HEIGHTS)
    for (const hold of SAMPLE_HOLDS) {
      const f = fit(measurementsFromHeight(heightCm), {
        tip: 'steel',
        hold,
        fingers: 3,
        throwStyle: 'unsure',
        moisture: 'normal',
        gripFeel: 3,
        thickness: 'auto',
        heightCm,
      });
      const best = recommend(f, variants).picks[0];
      if (!best) continue;
      const v = best.variant;
      out.push({
        heightCm,
        hold,
        weight: f.weight.band,
        length: f.length.band,
        diameter: f.diameter.band,
        dart: { brand: v.brand, model: v.model, weightG: v.weightG, lengthMm: v.lengthMm, diameterMm: v.diameterMm },
        matchPct: matchPctOf(best.cost, config.match.displayScale),
      });
    }
  return out;
}

export type PriceClass = 'budget' | 'standard' | 'premium';
/** Guide price per catalogue dart: whole euros (rounded to 5 above €50, like the app) and its class. */
export function guidePrices(): Record<string, { eur: number; tier: PriceClass }> {
  const out: Record<string, { eur: number; tier: PriceClass }> = {};
  for (const v of loadCatalogue().variants) {
    if (v.priceUsd === null) continue;
    const e = v.priceUsd / USD_PER_EUR;
    const tier: PriceClass =
      e <= PRICE_CLASS_EUR.budgetMax ? 'budget' : e <= PRICE_CLASS_EUR.standardMax ? 'standard' : 'premium';
    out[v.id] = { eur: e >= 50 ? Math.round(e / 5) * 5 : Math.round(e), tier };
  }
  return out;
}

export interface EngineFacts {
  samples: SampleFit[];
  prices: Record<string, { eur: number; tier: PriceClass }>;
  /** Listings whose stated weight fails the barrel physics check (left out of fits). */
  flagged: string[];
}
export const engineFacts = (): EngineFacts => ({
  samples: sampleFits(),
  prices: guidePrices(),
  flagged: loadCatalogue()
    .variants.filter((v) => v.specCheck)
    .map((v) => v.id),
});

if (process.argv[1] && /samples\.ts$/.test(process.argv[1])) process.stdout.write(JSON.stringify(engineFacts()));
