// Renders the motion ad (#/ad in the demo build, apps/web/src/views/ad.ts) to 1080×1920 video:
// a hook, the hand scan, the maths, the catalogue, the match, the pro reveal and the address.
//
//   node scripts/build-preview.mjs <dir>
//   VIDEO_LANG=nl|en|de node scripts/tiktok/ad.mjs <dir>/index.html <out-dir> [persona ...]
//
// Writes <out-dir>/ad-<persona>-<lang>.mp4. Same capture as record.mjs: CDP screencast at 3×
// device pixels, the page clock slowed so the screencast keeps up, then played back at real speed.
/* global URLSearchParams, location, addEventListener */
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { execFileSync } from 'node:child_process';
import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
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

/** The pro's photo for the reveal, when you have one: photos/<persona>.jpg + credits.json. */
const PHOTOS = new URL('./photos/', import.meta.url);
const CREDITS = JSON.parse(await readFile(new URL('credits.json', PHOTOS), 'utf8').catch(() => '{}'));
async function photoFor(id) {
  for (const ext of ['jpg', 'jpeg', 'png', 'webp']) {
    const buf = await readFile(new URL(`${id}.${ext}`, PHOTOS)).catch(() => null);
    if (buf) return `data:image/${ext === 'jpg' ? 'jpeg' : ext};base64,${buf.toString('base64')}`;
  }
  return null;
}

/** The ad's two extra faces, only for the video (the site never loads them): handwriting for the
 *  little notes and a chunky display face for the big words. */
const face = async (family, pkg, file) =>
  (
    await Promise.all(
      ['latin', 'latin-ext'].map(async (sub) => {
        const buf = await readFile(
          new URL(`../../node_modules/@fontsource/${pkg}/files/${file.replace('SUB', sub)}`, import.meta.url),
        );
        return `@font-face{font-family:${family};font-weight:${file.match(/-(\d{3})-/)[1]};src:url(data:font/woff2;base64,${buf.toString('base64')}) format('woff2')}`;
      }),
    )
  ).join('');
const FONT_CSS =
  (await face('AdHand', 'caveat', 'caveat-SUB-700-normal.woff2')) +
  (await face('AdDisplay', 'bricolage-grotesque', 'bricolage-grotesque-SUB-800-normal.woff2'));

/** A mono 16-bit WAV with one synthesised sound per cue. */
function soundtrack(cues, seconds) {
  const SR = 44100;
  const out = new Float32Array(Math.ceil((seconds + 0.5) * SR));
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647) * 2 - 1;
  const put = (at, len, fn) => {
    const i0 = Math.round(at * SR);
    for (let i = 0; i < len * SR && i0 + i < out.length; i++) if (i0 + i >= 0) out[i0 + i] += fn(i / SR);
  };
  const sounds = {
    thud: (at) => {
      let ph = 0;
      let lp = 0;
      put(at, 0.25, (t) => {
        ph += (2 * Math.PI * (45 + 80 * Math.exp(-t / 0.03))) / SR;
        lp += 0.12 * (rnd() - lp);
        return Math.sin(ph) * Math.exp(-t / 0.07) * 0.85 + lp * Math.exp(-t / 0.02) * 1.2;
      });
    },
    tick: (at) => put(at, 0.03, (t) => Math.sin(2 * Math.PI * 2100 * t) * Math.exp(-t / 0.005) * 0.16),
    pop: (at) => {
      let ph = 0;
      put(at, 0.1, (t) => {
        ph += (2 * Math.PI * (480 + 2600 * t)) / SR;
        return Math.sin(ph) * Math.exp(-t / 0.028) * 0.26;
      });
    },
    whoosh: (at) => {
      let lp = 0;
      put(at - 0.06, 0.26, (t) => {
        lp += (0.04 + 0.5 * t) * (rnd() - lp);
        return lp * Math.sin((Math.PI * t) / 0.26) ** 2 * 0.3;
      });
    },
    win: (at) =>
      [523.25, 659.25, 783.99, 1046.5].forEach((f, i) =>
        put(
          at + i * 0.045,
          1.0,
          (t) =>
            (Math.sin(2 * Math.PI * f * t) + 0.3 * Math.sin(4 * Math.PI * f * t)) * Math.exp(-t / 0.3) * 0.13,
        ),
      ),
  };
  for (const c of cues) sounds[c.k]?.(c.t);
  const buf = Buffer.alloc(44 + out.length * 2);
  buf.write('RIFF', 0);
  buf.writeUInt32LE(36 + out.length * 2, 4);
  buf.write('WAVEfmt ', 8);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(1, 22);
  buf.writeUInt32LE(SR, 24);
  buf.writeUInt32LE(SR * 2, 28);
  buf.writeUInt16LE(2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write('data', 36);
  buf.writeUInt32LE(out.length * 2, 40);
  for (let i = 0; i < out.length; i++) buf.writeInt16LE(Math.round(Math.tanh(out[i]) * 32000), 44 + i * 2);
  return buf;
}

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
  // The ad's extra faces, only for the video: not part of the site.
  await ctx.addInitScript((css) => {
    addEventListener('DOMContentLoaded', () => {
      const st = document.createElement('style');
      st.textContent = css;
      document.head.append(st);
    });
  }, FONT_CSS);
  const photo = await photoFor(P.id);
  if (photo)
    await ctx.addInitScript((x) => (window.__adPhoto = x), {
      src: photo,
      credit: (CREDITS[P.id] ?? '').replace(/^Foto:/, LANG === 'en' ? 'Photo:' : 'Foto:'),
    });
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
  const adT0 = await p.evaluate(() => performance.now());
  const start = Date.now() / 1000;
  await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 80, maxWidth: 1080, maxHeight: 1920 });
  await p.waitForFunction(() => document.body.dataset.adDone === '1', null, { timeout: 60000 * SLOW });
  const end = Date.now() / 1000;
  await cdp.send('Page.stopScreencast');
  const pro = await p.evaluate(() => document.body.dataset.adPro);
  const cues = (await p.evaluate(() => window.__adCues ?? [])).map((c) => ({
    t: (c.t - adT0) / 1000,
    k: c.k,
  }));
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
  // Sound: synthesised from the page's cues (a thud for each dart, ticks, pops, a chord on the
  // reveal), so the ad isn't silent in a sound-on feed. Swap in a trending sound in the app.
  const wav = join(dir, 'sfx.wav');
  await writeFile(wav, soundtrack(cues, (end - start) / SLOW));
  const silent = join(dir, 'silent.mp4');
  await rename(mp4, silent);
  execFileSync('ffmpeg', [
    '-y',
    '-loglevel',
    'error',
    '-i',
    silent,
    '-i',
    wav,
    '-c:v',
    'copy',
    '-c:a',
    'aac',
    '-b:a',
    '160k',
    '-shortest',
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
