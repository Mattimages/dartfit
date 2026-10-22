import { loadCatalogue, type Retailer } from '@dartfit/catalogue';
import { physicsOutliers, type Pro, type Variant } from '@dartfit/engine';
import type { Db } from './db.js';
import type { Env } from './env.js';

/** Upsert the bundled, source-verified catalogue into the database. Admin-added variants are kept. */
export async function syncCatalogue(db: Db): Promise<number> {
  const { variants } = loadCatalogue();
  for (const v of variants) {
    await db.query(
      `INSERT INTO dart_models(id, brand, name, tip, shape, balance) VALUES ($1,$2,$3,$4,$5,$6)
       ON CONFLICT (id) DO UPDATE SET brand=$2, name=$3, tip=$4, shape=$5, balance=$6`,
      [v.modelId, v.brand, v.model, v.tip, v.shape, v.balance],
    );
    await db.query(
      `INSERT INTO dart_variants(id, model_id, weight_g, length_mm, diameter_mm, grip, tungsten_pct, price_usd, source_url, verified_at, origin, spec_check)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'catalogue',$11)
       ON CONFLICT (id) DO UPDATE SET weight_g=$3, length_mm=$4, diameter_mm=$5, grip=$6, tungsten_pct=$7, price_usd=$8, source_url=$9, verified_at=$10, spec_check=$11`,
      [
        v.id,
        v.modelId,
        v.weightG,
        v.lengthMm,
        v.diameterMm,
        v.gripIntensity,
        v.tungstenPct,
        v.priceUsd,
        v.sourceUrl,
        v.verifiedAt ?? '2026-10-19',
        v.specCheck ? JSON.stringify(v.specCheck) : null,
      ],
    );
    // The source page is also a real product offer (A-Z Darts ships internationally from the US).
    await db.query(
      `INSERT INTO offers(id, variant_id, retailer, country, url, price, currency) VALUES ($1,$2,'azdarts','*',$3,$4,'USD')
       ON CONFLICT (id) DO UPDATE SET url=$3, price=$4`,
      [`azdarts:${v.id}`, v.id, v.sourceUrl, v.priceUsd],
    );
  }
  return variants.length;
}

interface VariantRow {
  id: string;
  model_id: string;
  brand: string;
  name: string;
  tip: 'steel' | 'soft';
  shape: Variant['shape'];
  balance: Variant['balance'];
  weight_g: number;
  length_mm: number;
  diameter_mm: number;
  grip: number | null;
  tungsten_pct: number;
  price_usd: number | null;
  source_url: string;
  verified_at: string | Date;
  spec_check: { listedG: number; modelG: number } | null;
}

export async function activeVariants(db: Db): Promise<Variant[]> {
  const rows = await db.query<VariantRow>(
    `SELECT v.*, m.brand, m.name, m.tip, m.shape, m.balance
     FROM dart_variants v JOIN dart_models m ON m.id = v.model_id WHERE v.active ORDER BY v.id`,
  );
  return rows.map((r) => ({
    id: r.id,
    modelId: r.model_id,
    brand: r.brand,
    model: r.name,
    tip: r.tip,
    // Coerce at the boundary: drivers may return NUMERIC columns as strings.
    weightG: Number(r.weight_g),
    lengthMm: Number(r.length_mm),
    diameterMm: Number(r.diameter_mm),
    shape: r.shape,
    balance: r.balance,
    gripIntensity: r.grip === null ? null : Number(r.grip),
    tungstenPct: Number(r.tungsten_pct),
    priceUsd: r.price_usd === null ? null : Number(r.price_usd),
    sourceUrl: r.source_url,
    verifiedAt:
      typeof r.verified_at === 'string'
        ? r.verified_at.slice(0, 10)
        : r.verified_at.toISOString().slice(0, 10),
    ...(r.spec_check ? { specCheck: r.spec_check } : {}),
  }));
}

/** Physics check for a single new listing (admin form). */
export function specCheckFor(v: Variant): { listedG: number; modelG: number } | null {
  const o = physicsOutliers([v])[0];
  return o ? { listedG: o.listedG, modelG: o.modelG } : null;
}

export function pros(): Pro[] {
  return loadCatalogue().pros;
}

export interface Offer {
  id: string;
  retailer: string;
  retailerName: string;
  kind: 'product' | 'search';
  country: string;
  price: number | null;
  currency: string | null;
  /** Where the user lands; always reached via /go/:id so the click is logged. */
  goUrl: string;
}

const retailerName = (id: string, list: Retailer[]) => list.find((r) => r.id === id)?.name ?? id;

/** At most this many shop buttons per dart: specialists first, then marketplaces. */
export const MAX_SHOPS = 3;

/**
 * Only shops we earn from are linked: a retailer needs an affiliate programme (affiliateEnv), and in
 * production its affiliate ID must be configured. Anything else is never shown as a shop link.
 */
export function affiliateReady(env: Env, r: Retailer): boolean {
  if (!r.affiliateEnv) return false;
  if (env.NODE_ENV !== 'production') return true;
  return Boolean((env as unknown as Record<string, string | undefined>)[r.affiliateEnv]);
}

/**
 * Offers for a variant in a country: local shops first (searches when no verified product page
 * exists), then verified product pages. Affiliate shops only.
 */
export async function offersFor(db: Db, env: Env, variant: Variant, country: string): Promise<Offer[]> {
  const { retailers } = loadCatalogue();
  const ready = new Set(retailers.filter((r) => affiliateReady(env, r)).map((r) => r.id));
  const local: Offer[] = retailers
    .filter((r) => r.kind === 'search' && r.countries.includes(country) && ready.has(r.id))
    .sort((a, b) => (a.priority ?? 9) - (b.priority ?? 9))
    .slice(0, MAX_SHOPS)
    .map((r) => ({
      id: `search:${r.id}:${variant.id}`,
      retailer: r.id,
      retailerName: r.name,
      kind: 'search' as const,
      country,
      price: null,
      currency: null,
      goUrl: `/go/${encodeURIComponent(`search:${r.id}:${variant.id}`)}`,
    }));
  const rows = await db.query<{
    id: string;
    retailer: string;
    country: string;
    price: number | null;
    currency: string | null;
  }>(
    `SELECT id, retailer, country, price, currency FROM offers WHERE variant_id=$1 AND live AND (country=$2 OR country='*')
     ORDER BY (country=$2) DESC, price NULLS LAST`,
    [variant.id, country],
  );
  const product: Offer[] = rows
    .filter((o) => ready.has(o.retailer))
    .map((o) => ({
      id: o.id,
      retailer: o.retailer,
      retailerName: retailerName(o.retailer, retailers),
      kind: 'product',
      country: o.country,
      price: o.price === null ? null : Number(o.price),
      currency: o.currency,
      goUrl: `/go/${encodeURIComponent(o.id)}`,
    }));
  return [...local, ...product];
}

/** Resolve an offer id to its outbound URL, with affiliate tagging when configured. */
export async function resolveOffer(
  db: Db,
  env: Env,
  offerId: string,
): Promise<{ url: string; variantId: string; retailer: string } | null> {
  const { retailers } = loadCatalogue();
  if (offerId.startsWith('search:')) {
    const [, retailerId, variantId] = offerId.split(':');
    const r = retailers.find((x) => x.id === retailerId && x.kind === 'search');
    if (!r?.searchTemplate || !variantId || !affiliateReady(env, r)) return null;
    const v = (
      await db.query<{ brand: string; name: string; weight_g: number }>(
        'SELECT m.brand, m.name, v.weight_g FROM dart_variants v JOIN dart_models m ON m.id=v.model_id WHERE v.id=$1',
        [variantId],
      )
    )[0];
    if (!v) return null;
    const q = encodeURIComponent(`${v.brand} ${v.name} ${v.weight_g}g`);
    return { url: affiliate(env, r.id, r.searchTemplate.replace('{q}', q)), variantId, retailer: r.id };
  }
  const o = (
    await db.query<{ url: string; variant_id: string; retailer: string }>(
      'SELECT url, variant_id, retailer FROM offers WHERE id=$1',
      [offerId],
    )
  )[0];
  const r = retailers.find((x) => x.id === o?.retailer);
  if (!o || !r || !affiliateReady(env, r)) return null;
  return { url: affiliate(env, o.retailer, o.url), variantId: o.variant_id, retailer: o.retailer };
}

/**
 * Affiliate wrapping. Untagged until the IDs are in the environment.
 * Check the bol.com format against the partner dashboard's own link builder before launch.
 */
export function affiliate(env: Env, retailer: string, url: string): string {
  const r = loadCatalogue().retailers.find((x) => x.id === retailer);
  const id = r?.affiliateEnv
    ? (env as unknown as Record<string, string | undefined>)[r.affiliateEnv]
    : undefined;
  if (!r || !id) return url;
  switch (r.affiliateType) {
    case 'bol':
      return `https://partner.bol.com/click/click?p=2&t=url&s=${encodeURIComponent(id)}&f=TXL&url=${encodeURIComponent(url)}&name=dartfit`;
    case 'amazon': {
      const x = new URL(url);
      x.searchParams.set('tag', id);
      return x.toString();
    }
    case 'ebay': {
      // eBay Partner Network link parameters; the rotation ID identifies the eBay site.
      const x = new URL(url);
      x.searchParams.set('mkcid', '1');
      x.searchParams.set('mkrid', r.ebayRotation ?? '');
      x.searchParams.set('campid', id);
      x.searchParams.set('toolid', '10001');
      x.searchParams.set('customid', 'dartfit');
      x.searchParams.set('mkevt', '1');
      return x.toString();
    }
    case 'deeplink':
      // A network deeplink template from the partner dashboard, with {url} where the target goes.
      return id.includes('{url}') ? id.replace('{url}', encodeURIComponent(url)) : url;
    default:
      return url;
  }
}
