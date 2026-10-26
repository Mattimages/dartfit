// Renders the motion ad (#/ad in the demo build, apps/web/src/views/ad.ts) to 1080×1920 video:
// a hook, the scan, three taps, the match, the pro reveal and the address, about 19 s.
//
//   node scripts/build-preview.mjs <dir>
//   VIDEO_LANG=nl|en|de node scripts/tiktok/ad.mjs <dir>/index.html <out-dir> [persona ...]
//
// Writes <out-dir>/ad-<persona>-<lang>.mp4. Same capture as record.mjs: CDP screencast at 3×
// device pixels, the page clock slowed so the screencast keeps up, then played back at real speed.
/* global URLSearchParams, location */
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { execFileSync } from 'node:child_process';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const { chromium } = createRequire(import.meta.url)('playwright');
const [file, out, ...only] = process.argv.slice(2);
if (!file || !out) throw new Error('usage: ad.mjs <index.html> <out-dir> [persona ...]');
const LANG = ['nl', 'en', 'de'].includes(process.env.VIDEO_LANG) ? process.env.VIDEO_LANG : 'nl';
const COUNTRY = { nl: 'NL', en: 'GB', de: 'DE' }[LANG];

/** Hand length (mm), height and answers that land on each pro (scripts/tiktok/search.ts). */
const PERSONAS = [
  { id: 'littler', L: 178, h: 180, hold: 'rear', f: 4, throw: 'flat', g: 1 },
  { id: 'rvb', L: 170, h: 176, hold: 'front', f: 4, throw: 'flat', g: 3 },
  { id: 'humphries', L: 170, h: 172, hold: 'front', f: 2, throw: 'flat', g: 3 },
  { id: 'cross', L: 185, h: 184, hold: 'middle', f: 3, throw: 'flat', g: 3 },
];

const SLOW = 4;
const CLOCK = `(() => {
  const k = ${SLOW};
  const rn = performance.now.bind(performance);
  const p0 = rn();
  const d0 = Date.now();
  const now = () => p0 + (rn() - p0) / k;
  performance.now = now;
  const RealDate = Date;
  const fake = () => d0 + (rn() - p0) / k;
  globalThis.Date = class extends RealDate {
    constructor(...a) { if (a.length) super(...a); else super(fake()); }
    static now() { return fake(); }
  };
  const st = setTimeout, si = setInterval, raf = requestAnimationFrame;
  globalThis.setTimeout = (f, ms = 0, ...a) => st(f, ms * k, ...a);
  globalThis.setInterval = (f, ms = 0, ...a) => si(f, ms * k, ...a);
  globalThis.requestAnimationFrame = (cb) => raf(() => cb(now()));
  try { localStorage.setItem('df_country', '${COUNTRY}'); localStorage.setItem('df_lang', '${LANG}'); } catch {}
})();`;

const html = await readFile(file);
const server = createServer((_q, r) => {
  r.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
  r.end(html);
}).listen(4672);
await mkdir(out, { recursive: true });
const b = await chromium.launch({ args: ['--force-device-scale-factor=3'] });

for (const P of PERSONAS.filter((x) => !only.length || only.includes(x.id))) {
  const dir = join(out, `raw-ad-${P.id}`);
  await rm(dir, { recursive: true, force: true });
  await mkdir(dir, { recursive: true });
  const ctx = await b.newContext({
    viewport: { width: 360, height: 640 },
    deviceScaleFactor: 3,
    locale: { nl: 'nl-NL', en: 'en-GB', de: 'de-DE' }[LANG],
  });
  await ctx.addInitScript(CLOCK);
  const p = await ctx.newPage();
  const errors = [];
  p.on('pageerror', (e) => errors.push(e.message));
  // Load the app first (fonts, catalogue), then start the ad with the screencast running.
  await p.goto('http://localhost:4672/');
  await p.waitForSelector('#main');
  const frames = [];
  const cdp = await ctx.newCDPSession(p);
  cdp.on('Page.screencastFrame', async (e) => {
    frames.push({ t: e.metadata.timestamp, data: e.data });
    await cdp.send('Page.screencastFrameAck', { sessionId: e.sessionId }).catch(() => {});
  });
  await cdp.send('Animation.enable');
  await cdp.send('Animation.setPlaybackRate', { playbackRate: 1 / SLOW });
  const q = new URLSearchParams({ L: P.L, h: P.h, hold: P.hold, f: P.f, throw: P.throw, g: P.g });
  await p.evaluate((hash) => (location.hash = hash), `#/ad?${q}`);
  await p.waitForSelector('.ad');
  const start = Date.now() / 1000;
  await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 80, maxWidth: 1080, maxHeight: 1920 });
  await p.waitForFunction(() => document.body.dataset.adDone === '1', null, { timeout: 60000 * SLOW });
  const end = Date.now() / 1000;
  await cdp.send('Page.stopScreencast');
  const pro = await p.locator('.ad-proname').textContent();
  await ctx.close();
  if (errors.length) console.log(`${P.id}: page errors`, errors);

  const kept = frames.filter((fr) => fr.t >= start && fr.t <= end);
  const lines = ['ffconcat version 1.0'];
  for (const [j, fr] of kept.entries()) {
    const fn = `f${String(j).padStart(5, '0')}.jpg`;
    await writeFile(join(dir, fn), Buffer.from(fr.data, 'base64'));
    const next = kept[j + 1]?.t ?? end;
    lines.push(`file ${fn}`, `duration ${Math.max(0.001, (next - fr.t) / SLOW).toFixed(4)}`);
  }
  lines.push(lines.at(-2));
  await writeFile(join(dir, 'list.txt'), lines.join('\n'));
  const mp4 = join(out, `ad-${P.id}-${LANG}.mp4`);
  execFileSync('ffmpeg', [
    '-y',
    '-loglevel',
    'error',
    '-f',
    'concat',
    '-safe',
    '0',
    '-i',
    join(dir, 'list.txt'),
    '-vf',
    'scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:#0f1b2d,fps=30,format=yuv420p',
    '-c:v',
    'libx264',
    '-preset',
    'slow',
    '-crf',
    '19',
    '-movflags',
    '+faststart',
    mp4,
  ]);
  await rm(dir, { recursive: true, force: true });
  console.log(
    `${P.id} (${LANG}): ${pro?.trim()} · ${((end - start) / SLOW).toFixed(1)} s, ${kept.length} frames → ${mp4}`,
  );
}
await b.close();
server.close();
