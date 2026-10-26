// Records a 9:16 phone video of the DartFit flow for TikTok/Reels: the landing film (the animated
// hand scan), the questions tapped in one by one, the fitting film, the result and the
// "Je gooit als" page. One video per persona, each landing on a different pro.
//
//   node scripts/build-preview.mjs <dir>            (single-file build with photos inlined)
//   node scripts/tiktok/record.mjs <dir>/index.html <out-dir> [persona-id ...]
//
// Writes <out-dir>/<id>.mp4 (1080×1920, H.264, 30 fps). Needs ffmpeg and Playwright.
/* global sessionStorage, location, scrollBy */
import { createRequire } from 'node:module';
// Playwright is installed globally on the build machine, not as a repo dependency.
const { chromium } = createRequire(import.meta.url)('playwright');
import { createServer } from 'node:http';
import { execFileSync } from 'node:child_process';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const [file, out, ...only] = process.argv.slice(2);
/** VIDEO_LANG=en records the English site (UK shop) with English captions; default Dutch. */
const LANG = process.env.VIDEO_LANG === 'en' ? 'en' : 'nl';
const TEXT = {
  nl: {
    locale: 'nl-NL',
    country: 'NL',
    hook: 'Welke dart past bij mijn hand?',
    questions: '5 vragen over hoe ik gooi',
    film: 'Nu de match…',
    result: 'Mijn perfecte dart',
    pro: (n) => `Ik gooi als ${n}!`,
    like: 'Ik gooi als',
    cta: 'Welke dart past bij jou? findyourdarts.com',
  },
  en: {
    locale: 'en-GB',
    country: 'GB',
    hook: 'Which dart fits my hand?',
    questions: '5 questions about how I throw',
    film: 'Now the match…',
    result: 'My perfect dart',
    pro: (n) => `I throw like ${n}!`,
    like: 'I throw like',
    cta: 'Which dart fits you? findyourdarts.com',
  },
}[LANG];
const SUFFIX = LANG === 'nl' ? '' : `-${LANG}`;
if (!file || !out) throw new Error('usage: record.mjs <index.html> <out-dir> [persona ...]');

/** Hand length (mm) and answers found with scripts/tiktok/search.ts, so each lands on its pro. */
export const PERSONAS = [
  { id: 'littler', L: 178, height: 180, hold: 'rear', fingers: '4', throw: 'flat', grip: 1 },
  { id: 'rvb', L: 170, height: 176, hold: 'front', fingers: '4', throw: 'flat', grip: 3 },
  { id: 'humphries', L: 170, height: 172, hold: 'front', fingers: '2', throw: 'flat', grip: 3 },
  { id: 'cross', L: 185, height: 184, hold: 'middle', fingers: '3', throw: 'flat', grip: 3 },
];

const hand = (L) => {
  const s = L / 185;
  return {
    handLengthMm: L,
    palmWidthMm: 78 * s,
    indexLengthMm: 78 * s,
    middleLengthMm: 85 * s,
    thumbIndexSpanMm: 120 * s,
    spreadMm: 1.2,
    samples: 18,
    calibrated: true,
  };
};

/**
 * The page runs SLOW× slower than real time (timers, rAF, Date, CSS animations), so the
 * screencast, which only manages about 10 frames a second at 1080×1920, gets SLOW× more frames
 * per page second. The video is then played back at real speed.
 */
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
})();`;

// A finger-tap circle, so viewers see where the "thumb" goes.
const TAPS = `
addEventListener('DOMContentLoaded', () => {
  const st = document.createElement('style');
  st.textContent = '.tt-tap{position:fixed;z-index:99999;width:46px;height:46px;margin:-23px 0 0 -23px;border-radius:50%;background:rgb(255 255 255/.55);border:2px solid rgb(13 22 38/.35);pointer-events:none;animation:tt 520ms ease-out forwards}@keyframes tt{0%{transform:scale(.4);opacity:1}100%{transform:scale(1.5);opacity:0}}';
  document.head.append(st);
});
window.__tap = (x, y) => {
  const d = document.createElement('div');
  d.className = 'tt-tap';
  d.style.left = x + 'px';
  d.style.top = y + 'px';
  document.body.append(d);
  setTimeout(() => d.remove(), 600);
};
addEventListener('pointerdown', (e) => window.__tap(e.clientX, e.clientY), true);
try { localStorage.setItem('df_country', '__COUNTRY__'); localStorage.setItem('df_lang', '__LANG__'); } catch {}
`;

const PHOTOS = new URL('./photos/', import.meta.url);
/** Photo credits, e.g. { "littler": "Foto: Jane Doe, CC BY-SA 4.0, Wikimedia Commons" }. */
const CREDITS = JSON.parse(await readFile(new URL('credits.json', PHOTOS), 'utf8').catch(() => '{}'));
async function photoFor(id) {
  for (const ext of ['jpg', 'jpeg', 'png', 'webp']) {
    const buf = await readFile(new URL(`${id}.${ext}`, PHOTOS)).catch(() => null);
    if (buf) return `data:image/${ext === 'jpg' ? 'jpeg' : ext};base64,${buf.toString('base64')}`;
  }
  return null;
}

/** TikTok-style text over the video (in the band TikTok leaves free at the top). */
const CAPTIONS = !process.env.NO_CAPTIONS;
function caption(text) {
  let el = document.getElementById('tt-cap');
  if (!text) return el?.remove();
  if (!el) {
    el = document.createElement('div');
    el.id = 'tt-cap';
    el.style.cssText =
      'position:fixed;left:50%;top:64px;transform:translateX(-50%);z-index:2147483646;max-width:300px;padding:8px 14px;border-radius:12px;background:#fff;color:#0d1626;font:650 19px/1.2 "Geist Variable",system-ui,sans-serif;letter-spacing:-.02em;text-align:center;box-shadow:0 6px 24px rgb(13 22 38/.25);pointer-events:none';
    document.body.append(el);
  }
  el.textContent = text;
}
const say = (p, text) => (CAPTIONS ? p.evaluate(caption, text) : null);

/** Runs in the page: a full-screen 9:16 share picture over the app. */
function showCard(c) {
  const el = (tag, css, text) => {
    const e = document.createElement(tag);
    e.style.cssText = css;
    if (text) e.textContent = text;
    return e;
  };
  const root = el(
    'div',
    'position:fixed;inset:0;z-index:2147483647;background:#0f1b2d;color:#fff;font-family:"Geist Variable",system-ui,sans-serif;display:flex;flex-direction:column;overflow:hidden;opacity:0;transition:opacity .45s',
  );
  const top = el('div', 'position:relative;flex:0 0 52%;overflow:hidden;background:#1d3762');
  if (c.photo) {
    const img = el(
      'img',
      'position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:50% 22%',
    );
    img.src = c.photo;
    top.append(img);
  } else {
    const art = document.querySelector('.pm-hero .pro-art')?.cloneNode(true);
    if (art) {
      art.style.cssText =
        'position:absolute;inset:0;width:100%;height:100%;border-radius:0;aspect-ratio:auto';
      art.setAttribute('preserveAspectRatio', 'xMinYMid slice');
      top.append(art);
    }
  }
  top.append(
    el(
      'div',
      'position:absolute;inset:0;background:linear-gradient(180deg,rgb(15 27 45/0) 45%,#0f1b2d 100%)',
    ),
  );
  top.append(
    el(
      'div',
      'position:absolute;left:22px;top:20px;font-weight:650;font-size:17px;letter-spacing:-.02em',
      'DartFit',
    ),
  );
  const textBox = el('div', 'position:absolute;left:22px;right:22px;bottom:14px;display:grid;gap:2px');
  textBox.append(el('div', 'font-size:17px;color:#c5d1e2;font-weight:550', c.like));
  textBox.append(el('div', 'font-size:44px;line-height:1;font-weight:650;letter-spacing:-.045em', c.name));
  top.append(textBox);
  if (c.credit)
    top.append(
      el(
        'div',
        'position:absolute;right:10px;top:22px;font-size:8.5px;color:rgb(255 255 255/.75);text-shadow:0 1px 2px #000',
        c.credit,
      ),
    );
  root.append(top);
  const low = el('div', 'flex:1;display:grid;gap:10px;padding:12px 22px 20px;align-content:start');
  if (c.dartImg) {
    const tile = el(
      'div',
      'position:relative;height:132px;border-radius:16px;background:#edf2f9;overflow:hidden',
    );
    const d = el(
      'img',
      'position:absolute;inset:8px;width:calc(100% - 16px);height:calc(100% - 16px);object-fit:contain;mix-blend-mode:multiply',
    );
    d.src = c.dartImg;
    tile.append(d);
    low.append(tile);
  } else {
    // No shop photo: the dart drawn from its specs, as on the site.
    const art = document.querySelector('.pm-dart .media-model svg')?.cloneNode(true);
    if (art) {
      const tile = el(
        'div',
        'position:relative;height:132px;border-radius:16px;background:#edf2f9;overflow:hidden;display:flex;align-items:center;justify-content:center;padding:10px;box-sizing:border-box',
      );
      art.style.cssText = 'width:100%;height:100%';
      tile.append(art);
      low.append(tile);
    }
  }
  low.append(el('div', 'font-size:15px;color:#c5d1e2;font-weight:550', c.dart));
  low.append(
    el('div', 'font-size:46px;font-weight:650;letter-spacing:-.04em;color:#2ee59d;line-height:1', c.pct),
  );
  low.append(el('div', 'font-size:15px;font-weight:550', c.cta));
  root.append(low);
  document.body.append(root);
  requestAnimationFrame(() => requestAnimationFrame(() => (root.style.opacity = '1')));
}

const html = await readFile(file);
const server = createServer((_q, r) => {
  r.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
  r.end(html);
}).listen(4671);
const U = 'http://localhost:4671/';
await mkdir(out, { recursive: true });
// Without this flag the screencast is captured at CSS pixels (360 × 640), not 3× device pixels.
const b = await chromium.launch({ args: ['--force-device-scale-factor=3'] });
const wait = (p, ms) => p.waitForTimeout(ms * SLOW);

/** Tap the centre of an element with a visible finger circle and a short human pause. */
async function tap(p, loc, pause = 650) {
  await loc.scrollIntoViewIfNeeded();
  const bx = await loc.boundingBox();
  await p.mouse.move(bx.x + bx.width / 2, bx.y + bx.height / 2, { steps: 6 });
  await wait(p, 160);
  await loc.click();
  await wait(p, pause);
}

async function smoothScroll(p, px, ms) {
  const steps = Math.round(ms / 33);
  for (let i = 0; i < steps; i++) {
    await p.evaluate((d) => scrollBy(0, d), px / steps);
    await wait(p, 33);
  }
}

for (const P of PERSONAS.filter((x) => !only.length || only.includes(x.id))) {
  const dir = join(out, `raw-${P.id}`);
  await rm(dir, { recursive: true, force: true });
  await mkdir(dir, { recursive: true });
  // Playwright's own video is only as big as the CSS viewport; the CDP screencast gives the
  // real 3× device pixels, so the phone video is sharp at 1080×1920.
  const ctx = await b.newContext({
    viewport: { width: 360, height: 640 },
    deviceScaleFactor: 3,
    // Not isMobile: the preview page has no viewport meta, so a mobile browser would lay it out
    // at 980 px and zoom out.
    isMobile: false,
    hasTouch: false,
    locale: TEXT.locale,
  });
  await ctx.addInitScript(CLOCK);
  await ctx.addInitScript(TAPS.replace('__COUNTRY__', TEXT.country).replace('__LANG__', LANG));
  const p = await ctx.newPage();
  const frames = [];
  const cdp = await ctx.newCDPSession(p);
  cdp.on('Page.screencastFrame', async (e) => {
    frames.push({ t: e.metadata.timestamp, data: e.data });
    await cdp.send('Page.screencastFrameAck', { sessionId: e.sessionId }).catch(() => {});
  });
  // CSS animations and transitions follow the slow clock too.
  await cdp.send('Animation.enable');
  await cdp.send('Animation.setPlaybackRate', { playbackRate: 1 / SLOW });
  await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 70, maxWidth: 1080, maxHeight: 1920 });
  const marks = {};
  const mark = (k) => (marks[k] = Date.now() / 1000);

  await p.goto(U);
  await p.waitForSelector('.hs-link, .hero-cta');
  await wait(p, 400);
  mark('start');
  await say(p, TEXT.hook);
  // 1. The landing film: the hand scan, the questions, the dart carousel, the pro.
  await wait(p, 11000);
  // 2. "Meet mijn hand": shown as a tap; the measurement itself is set as if a scan was done.
  const cta = p.locator('.hero-cta .btn.block');
  const bx = await cta.boundingBox();
  await p.mouse.move(bx.x + bx.width / 2, bx.y + bx.height / 2, { steps: 8 });
  await p.evaluate(([x, y]) => window.__tap(x, y), [bx.x + bx.width / 2, bx.y + bx.height / 2]);
  await wait(p, 350);
  mark('cut');
  await p.evaluate((m) => {
    sessionStorage.setItem('df_session', JSON.stringify({ measurements: m, alertsAsked: true }));
    location.hash = '#/questions';
  }, hand(P.L));
  await p.waitForSelector('input[name=shop]', { state: 'attached' });
  await wait(p, 300);
  mark('questions');
  await say(p, TEXT.questions);
  // 3. The questions, one tap each.
  // First question: where you buy your darts.
  await tap(p, p.locator(`.step:not([hidden]) input[name=shop][value="${TEXT.country}"]`).locator('..'), 900);
  await tap(p, p.locator('#height'), 200);
  await p.keyboard.type(String(P.height), { delay: 140 * SLOW });
  await wait(p, 500);
  await tap(p, p.locator('.quiz-nav .btn:not(.link):not([hidden])'), 900);
  for (const [name, v] of [
    ['hold', P.hold],
    ['fingers', P.fingers],
    ['throwStyle', P.throw],
  ]) {
    await wait(p, 700);
    await tap(p, p.locator(`.step:not([hidden]) input[name=${name}][value="${v}"]`).locator('..'), 900);
  }
  // Grip slider: a tap on the track at the wanted value, then a nudge with the arrow keys so the
  // value is exact whatever the thumb's hit area.
  const range = p.locator('#gripFeel');
  const rb = await range.boundingBox();
  const xAt = (v) => rb.x + 10 + ((rb.width - 20) * (v - 1)) / 4;
  await p.mouse.move(xAt(P.grip), rb.y + rb.height / 2, { steps: 10 });
  await p.mouse.click(xAt(P.grip), rb.y + rb.height / 2);
  const now = Number(await range.inputValue());
  for (let i = now; i !== P.grip; i += P.grip > i ? 1 : -1)
    await p.keyboard.press(P.grip > i ? 'ArrowRight' : 'ArrowLeft');
  await wait(p, 1100);
  await tap(p, p.locator('.quiz-nav button[type=submit]:not([hidden])'), 200);
  // 4. The fitting film with the player's own result.
  await p.waitForURL(/fitting/);
  mark('film');
  await say(p, TEXT.film);
  await p.locator('.fit-cta:not([hidden])').waitFor({ timeout: 45000 * SLOW });
  await wait(p, 1600);
  await tap(p, p.locator('.fit-cta'), 200);
  // 5. The result, then the pro.
  await p.waitForURL(/#\/fit\//, { timeout: 30000 * SLOW });
  mark('result');
  await say(p, TEXT.result);
  await wait(p, 1500);
  await smoothScroll(p, 420, 1800);
  await wait(p, 600);
  const twin = p.locator('a.twin-link');
  await twin.scrollIntoViewIfNeeded();
  await wait(p, 1400);
  await tap(p, twin, 200);
  await p.waitForURL(/\/pro$/);
  mark('pro');
  await say(p, TEXT.pro((await p.locator('.pm-hero h1').textContent()).trim()));
  await wait(p, 2400);
  await smoothScroll(p, 700, 3000);
  await wait(p, 1500);
  // 6. The share picture, with the player's photo when one is supplied (photos/<id>.jpg).
  const card = {
    like: TEXT.like,
    cta: TEXT.cta,
    photo: await photoFor(P.id),
    credit: CREDITS[P.id] ?? '',
    name: (await p.locator('.pm-hero h1').textContent()).trim(),
    dart: (await p.locator('.pm-hero p:not(.kicker):not(.pm-pct)').first().textContent()).trim(),
    pct: (await p.locator('.pm-pct').textContent()).trim(),
    dartImg:
      (await p
        .locator('.pm-dart img')
        .first()
        .getAttribute('src')
        .catch(() => null)) ?? '',
  };
  await say(p, '');
  await p.evaluate(showCard, card);
  await wait(p, 4200);
  await p.screenshot({ path: join(out, `${P.id}${SUFFIX}-card.png`) });
  mark('end');
  const name = card.name;
  await cdp.send('Page.stopScreencast');
  await ctx.close();

  // Frames arrive only when the page repaints: hold each until the next, keep the hook, drop the
  // instant cut to the questions, and encode for TikTok at a constant 30 fps.
  const keep = ([a, z]) => frames.filter((fr) => fr.t >= a && fr.t <= z);
  const parts = [keep([marks.start, marks.cut]), keep([marks.questions, marks.end])];
  const lines = ['ffconcat version 1.0'];
  let n = 0;
  for (const [i, part] of parts.entries()) {
    const stop = i === 0 ? marks.cut : marks.end;
    for (const [j, fr] of part.entries()) {
      const fn = `f${String(n++).padStart(5, '0')}.jpg`;
      await writeFile(join(dir, fn), Buffer.from(fr.data, 'base64'));
      const next = part[j + 1]?.t ?? stop;
      lines.push(`file ${fn}`, `duration ${Math.max(0.001, (next - fr.t) / SLOW).toFixed(4)}`);
    }
  }
  lines.push(lines.at(-2));
  await writeFile(join(dir, 'list.txt'), lines.join('\n'));
  const mp4 = join(out, `${P.id}${SUFFIX}.mp4`);
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
    'scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:white,fps=30,format=yuv420p',
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
  const secs = (marks.cut - marks.start + marks.end - marks.questions) / SLOW;
  console.log(`${P.id}: ${name?.trim()} · ${secs.toFixed(1)} s, ${frames.length} frames → ${mp4}`);
}
await b.close();
server.close();
