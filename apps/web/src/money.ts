import { USD_PER_EUR } from '@dartfit/engine';

export { USD_PER_EUR, PRICE_CLASS_EUR } from '@dartfit/engine';

export const usdToEur = (usd: number) => usd / USD_PER_EUR;
export const eurToUsd = (eur: number) => eur * USD_PER_EUR;

/** Whole euros, rounded to 5 above €50 so it never looks more exact than it is. */
export function approxEur(usd: number): number {
  const e = usdToEur(usd);
  return e >= 50 ? Math.round(e / 5) * 5 : Math.round(e);
}

/** Budget choices offered on the questions screen, in euros (null = no limit). */
export const BUDGETS_EUR = [null, 50, 100, 150] as const;
