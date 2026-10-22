/**
 * Prices. The catalogue stores product-page prices in US dollars; the site talks euros.
 * Rate: ECB euro reference rate of 16 Sep 2026, 1 EUR = 1.1537 USD (published via Banca d'Italia).
 * Used only for guide prices ("≈ €") and the price classes, never for a checkout.
 */
export const USD_PER_EUR = 1.1537;

/** Price classes in euros: budget up to €50, standard up to €100, premium above. */
export const PRICE_CLASS_EUR = { budgetMax: 50, standardMax: 80 } as const;

export const tierBoundsUsd = () => ({
  budgetMaxUsd: PRICE_CLASS_EUR.budgetMax * USD_PER_EUR,
  standardMaxUsd: PRICE_CLASS_EUR.standardMax * USD_PER_EUR,
});
