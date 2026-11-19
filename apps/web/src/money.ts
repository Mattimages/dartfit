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
 * Pounds per euro for guide prices on amazon.co.uk. A rough, rounded rate: every price is shown
 * with "≈" and the shop has the real one, so it only has to be in the right neighbourhood.
 */
export const GBP_PER_EUR = 0.85;

/** Whole pounds, rounded to 5 above £50, like the other currencies. */
function approxGbp(eur: number): number {
  const p = eur * GBP_PER_EUR;
  return p >= 50 ? Math.round(p / 5) * 5 : Math.round(p);
}

/**
 * A guide price in the visitor's currency: dollars for US visitors (the catalogue stores dollars,
 * so no conversion), pounds for the UK (its shop is amazon.co.uk), euros everywhere else.
 * "≈" marks it as a guide, never a checkout price.
 */
export function priceLabel(usd: number, o: { approx?: boolean } = {}): string {
  const c = getCountry();
  const s =
    c === 'US' ? `$${approxUsd(usd)}` : c === 'GB' ? `£${approxGbp(usdToEur(usd))}` : `€${approxEur(usd)}`;
  return o.approx === false ? s : `≈ ${s}`;
}

/** A price-class boundary given in euros, shown in the visitor's currency. */
export function boundLabel(eurAmount: number): string {
  const c = getCountry();
  if (c === 'US') return `$${approxUsd(eurToUsd(eurAmount))}`;
  if (c === 'GB') return `£${approxGbp(eurAmount)}`;
  return `€${eurAmount}`;
}

/** Budget choices offered on the questions screen, in euros (null = no limit). */
export const BUDGETS_EUR = [null, 50, 100, 150] as const;
