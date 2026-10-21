/**
 * Catalogue prices come from the product page in US dollars. Dutch players think in euros, so the
 * site shows an approximate euro amount next to the dollar price and asks the budget in euros.
 * Rate: ECB euro reference rate 16 Sep 2026, 1 EUR = 1.1537 USD (via Banca d'Italia). Approximate on
 * purpose: shown as "≈ €", never used for a checkout.
 */
export const USD_PER_EUR = 1.1537;

export const usdToEur = (usd: number) => usd / USD_PER_EUR;
export const eurToUsd = (eur: number) => eur * USD_PER_EUR;

/** Whole euros, rounded to 5 above €50 so it never looks more exact than it is. */
export function approxEur(usd: number): number {
  const e = usdToEur(usd);
  return e >= 50 ? Math.round(e / 5) * 5 : Math.round(e);
}

/** Budget choices offered on the questions screen, in euros (null = no limit). */
export const BUDGETS_EUR = [null, 60, 100, 150] as const;
