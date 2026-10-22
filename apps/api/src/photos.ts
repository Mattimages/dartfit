/**
 * Product photos, served from our own origin.
 *
 * The browser only ever loads /img/<model>: the server fetches the photo from the shop's image
 * host and caches it. Visitors make no request to a third party (no IP or referrer leaves for an
 * image CDN) and the Content-Security-Policy can keep img-src to 'self'.
 *
 * A photo is only served when its source allows it (cleared = an affiliate feed's image) or when
 * PREVIEW_PHOTOS is on, for previews before the affiliate feeds are connected.
 */
import { Router } from 'express';
import { loadCatalogue, PHOTO_HOSTS, type Photo } from '@dartfit/catalogue';
import type { Env } from './env.js';

const WIDTHS = [400, 800] as const;
const MAX_BYTES = 3 * 1024 * 1024;
const MAX_ENTRIES = 300;
const TTL_MS = 7 * 24 * 3600 * 1000;

interface Entry {
  type: string;
  body: Buffer;
  at: number;
}

export type Fetcher = (url: string, init: { signal: AbortSignal }) => Promise<Response>;

export function photosAllowed(env: Env): boolean {
  const v = (env as Record<string, unknown>).PREVIEW_PHOTOS;
  return v === true || v === 'true' || v === '1';
}

/** Model ids that have a photo this server will serve. */
export function servablePhotos(env: Env, photos: Photo[] = loadCatalogue().photos): Set<string> {
  const preview = photosAllowed(env);
  return new Set(photos.filter((p) => p.cleared || preview).map((p) => p.modelId));
}

/** The upstream URL at the wanted width (Shopify's CDN resizes on request). */
export function upstreamUrl(photo: Photo, width: number): string {
  const u = new URL(photo.url);
  if (u.hostname === 'cdn.shopify.com') u.searchParams.set('width', String(width));
  return u.toString();
}

export function photoRouter(env: Env, fetcher: Fetcher = fetch, photos: Photo[] = loadCatalogue().photos) {
  const router = Router();
  const byModel = new Map(photos.map((p) => [p.modelId, p]));
  const servable = servablePhotos(env, photos);
  const cache = new Map<string, Entry>();

  router.get('/img/:model', async (req, res) => {
    const model = req.params.model;
    const photo = byModel.get(model);
    if (!photo || !servable.has(model)) return void res.sendStatus(404);
    const width = WIDTHS.includes(Number(req.query.w) as 400) ? Number(req.query.w) : 800;
    const key = `${model}@${width}`;

    let hit = cache.get(key);
    if (!hit || Date.now() - hit.at > TTL_MS) {
      const url = upstreamUrl(photo, width);
      if (!PHOTO_HOSTS.includes(new URL(url).hostname)) return void res.sendStatus(404);
      try {
        const r = await fetcher(url, { signal: AbortSignal.timeout(8000) });
        const type = r.headers.get('content-type') ?? '';
        if (!r.ok || !/^image\/(jpeg|png|webp|avif)$/.test(type.split(';')[0]!.trim()))
          return void res.sendStatus(502);
        const body = Buffer.from(await r.arrayBuffer());
        if (body.length > MAX_BYTES) return void res.sendStatus(502);
        hit = { type, body, at: Date.now() };
        cache.delete(key);
        cache.set(key, hit);
        // Oldest entry goes first once the cache is full.
        if (cache.size > MAX_ENTRIES) cache.delete(cache.keys().next().value!);
      } catch {
        return void res.sendStatus(502);
      }
    }
    res.setHeader('Cache-Control', 'public, max-age=604800');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.type(hit.type).send(hit.body);
  });

  return router;
}
