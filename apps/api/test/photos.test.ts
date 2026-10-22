import { describe, expect, it } from 'vitest';
import express from 'express';
import request from 'supertest';
import type { Photo } from '@dartfit/catalogue';
import { loadEnv } from '../src/env.js';
import { photoRouter, servablePhotos, upstreamUrl, type Fetcher } from '../src/photos.js';

const photos: Photo[] = [
  { modelId: 'a', url: 'https://cdn.shopify.com/s/files/a.jpg?v=1', source: 'azdarts', cleared: false },
  { modelId: 'b', url: 'https://media.s-bol.com/b.jpg', source: 'bol', cleared: true },
];

function stub(type = 'image/jpeg', status = 200) {
  const calls: string[] = [];
  const f: Fetcher = async (url) => {
    calls.push(url);
    return new Response(new Uint8Array([1, 2, 3]), { status, headers: { 'content-type': type } });
  };
  return { f, calls };
}

const appWith = (env: Record<string, string>, f: Fetcher) =>
  express().use(photoRouter(loadEnv({ NODE_ENV: 'test', ...env }), f, photos));

describe('photo proxy', () => {
  it('serves all photos by default; PREVIEW_PHOTOS=false limits it to cleared ones', async () => {
    const { f } = stub();
    const app = appWith({ PREVIEW_PHOTOS: 'false' }, f);
    await request(app).get('/img/a').expect(404);
    await request(app).get('/img/b').expect(200);
    const env = (v?: string) => loadEnv({ NODE_ENV: 'test', ...(v ? { PREVIEW_PHOTOS: v } : {}) });
    expect([...servablePhotos(env('false'), photos)]).toEqual(['b']);
    expect([...servablePhotos(env(), photos)]).toEqual(['a', 'b']);
  });

  it('fetches server-side once, then serves from cache with long caching', async () => {
    const { f, calls } = stub();
    const app = appWith({ PREVIEW_PHOTOS: 'true' }, f);
    const r = await request(app).get('/img/a?w=400').expect(200);
    expect(r.headers['content-type']).toMatch(/^image\/jpeg/);
    expect(r.headers['cache-control']).toContain('max-age=604800');
    await request(app).get('/img/a?w=400').expect(200);
    expect(calls).toHaveLength(1);
    expect(calls[0]).toContain('width=400');
  });

  it('refuses anything that is not an image and unknown models', async () => {
    const app = appWith({ PREVIEW_PHOTOS: 'true' }, stub('text/html').f);
    await request(app).get('/img/a').expect(502);
    await request(app).get('/img/nope').expect(404);
    await request(appWith({ PREVIEW_PHOTOS: 'true' }, stub('image/png', 500).f))
      .get('/img/a')
      .expect(502);
  });

  it('only asks Shopify to resize; other hosts get the url as is', () => {
    expect(upstreamUrl(photos[0]!, 800)).toBe('https://cdn.shopify.com/s/files/a.jpg?v=1&width=800');
    expect(upstreamUrl(photos[1]!, 800)).toBe('https://media.s-bol.com/b.jpg');
  });
});
