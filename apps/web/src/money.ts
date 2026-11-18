import { USD_PER_EUR } from '@dartfit/engine';
import { getCountry } from './region';

export { USD_PER_EUR, PRICE_CLASS_EUR } from '@dartfit/engine';

export const usdToEur = (usd: number) => usd / USD_PER_EUR;
export const eurToUsd = (eur: number) => eur * USD_PER_EUR;

/** Whole euros, rounded to 5 above €50 so it never looks more exact than it is. */
export function approxEur(usd: number): number {
  const e = usdToEur(usd);
  return e >= 50 ? Math.round(e / 5) * 5 : Math.round(e);
}

/** Whole dollars, rounded to 5 above $50 (the catalogue's own currency). */
function approxUsd(usd: number): number {
  return usd >= 50 ? Math.round(usd / 5) * 5 : Math.round(usd);
}

/**
 * A guide price in the visitor's currency: dollars for US visitors (the catalogue stores dollars,
 * so no conversion), euros everywhere else. "≈" marks it as a guide, never a checkout price.
 */
export function priceLabel(usd: number, o: { approx?: boolean } = {}): string {
  const s = getCountry() === 'US' ? `$${approxUsd(usd)}` : `€${approxEur(usd)}`;
  return o.approx === false ? s : `≈ ${s}`;
}

/** A price-class boundary given in euros, shown in the visitor's currency. */
export function boundLabel(eurAmount: number): string {
  return getCountry() === 'US' ? `$${approxUsd(eurToUsd(eurAmount))}` : `€${eurAmount}`;
}

/** Budget choices offered on the questions screen, in euros (null = no limit). */
export const BUDGETS_EUR = [null, 50, 100, 150] as const;
