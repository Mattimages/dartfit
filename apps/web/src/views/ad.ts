/**
 * #/ad : a 9:16 motion ad (TikTok / Reels / Shorts), only in the demo build. The story is the
 * maths: a dart falls out of the board, the hand is scanned, every parameter goes into a HUD, the
 * model narrows weight, length and thickness, the catalogue is searched, darts land on the board
 * with the match %, and the pro is revealed. All numbers come from the real engine for one persona.
 * The last frame is the first frame (an empty board), so the video loops.
 * Recorded to video by scripts/tiktok/ad.mjs, which can supply the pro's photo (window.__adPhoto).
 *
 *   #/ad?L=178&h=180&hold=rear&f=4&throw=flat&g=1      (hand length mm, height cm, answers)
 */
import { scoreVariant, type Answers, type Measurements } from '@dartfit/engine';
import { h, s } from '../h';
import { getLang, num } from '../i18n';
import { createFit, variants } from '../api';
import { boardSvg } from '../draw/checkout';
import { dartArt, handArt, SKIN_TONES, templateHand } from '../draw/art';
import { proArt } from '../draw/pro-art';
import { variantArt } from '../score';
import { castFor, checkoutWin } from './hero-scan';
import { dartName, shapeName } from './words';

declare global {
  interface Window {
    __adPhoto?: { src: string; credit: string };
  }
}

const COPY = {
  nl: {
    hook: ['Gooi jij', 'met de', 'verkeerde', 'dart?'],
    fell: 'Valt eruit.',
    scan: 'Handscan',
    points: '21 punten gemeten',
    input: 'Parameters',
    rows: {
      hand: 'Handlengte',
      palm: 'Handpalm',
      ratio: 'Vinger / palm',
      span: 'Spanwijdte',
      height: 'Lengte',
      angle: 'Werphoek',
      hold: 'Positie',
      fingers: 'Vingers',
      throw: 'Worp',
      grip: 'Grip',
    },
    hold: { front: 'voor', middle: 'midden', rear: 'achter' },
    throw: { flat: 'vlak', arc: 'boog', unsure: 'onbekend' },
    model: 'Model',
    weight: 'Gewicht',
    length: 'Lengte',
    thick: 'Dikte',
    ideal: 'Jouw ideale barrel',
    search: 'Catalogus doorzoeken',
    darts: 'darts',
    best: 'Beste match',
    like: 'Je gooit als',
    cta: 'Welke prof ben jij?',
    sub: 'Gratis, in 1 minuut',
  },
  en: {
    hook: ['Are you', 'throwing', 'the wrong', 'dart?'],
    fell: 'It falls out.',
    scan: 'Hand scan',
    points: '21 points measured',
    input: 'Parameters',
    rows: {
      hand: 'Hand length',
      palm: 'Palm',
      ratio: 'Finger / palm',
      span: 'Span',
      height: 'Height',
      angle: 'Launch angle',
      hold: 'Hold',
      fingers: 'Fingers',
      throw: 'Throw',
      grip: 'Grip',
    },
    hold: { front: 'front', middle: 'middle', rear: 'rear' },
    throw: { flat: 'flat', arc: 'arc', unsure: 'unknown' },
    model: 'Model',
    weight: 'Weight',
    length: 'Length',
    thick: 'Thickness',
    ideal: 'Your ideal barrel',
    search: 'Searching the catalogue',
    darts: 'darts',
    best: 'Best match',
    like: 'You throw like',
    cta: 'Which pro are you?',
    sub: 'Free, in 1 minute',
  },
  de: {
    hook: ['Wirfst du', 'mit dem', 'falschen', 'Dart?'],
    fell: 'Er fällt raus.',
    scan: 'Handscan',
    points: '21 Punkte gemessen',
    input: 'Parameter',
    rows: {
      hand: 'Handlänge',
      palm: 'Handfläche',
      ratio: 'Finger / Hand',
      span: 'Spannweite',
      height: 'Größe',
      angle: 'Abwurfwinkel',
      hold: 'Griffposition',
      fingers: 'Finger',
      throw: 'Wurf',
      grip: 'Grip',
    },
    hold: { front: 'vorne', middle: 'Mitte', rear: 'hinten' },
    throw: { flat: 'flach', arc: 'Bogen', unsure: 'unbekannt' },
    model: 'Modell',
    weight: 'Gewicht',
    length: 'Länge',
    thick: 'Dicke',
    ideal: 'Dein idealer Barrel',
    search: 'Katalog wird durchsucht',
    darts: 'Darts',
    best: 'Bester Match',
    like: 'Du wirfst wie',
    cta: 'Welcher Profi bist du?',
    sub: 'Kostenlos, in 1 Minute',
  },
};

const CYAN = '#5ee7ff';
const CSS = `
.ad{position:fixed;inset:0;z-index:2147483000;overflow:hidden;color:#fff;font-family:"Geist Variable",system-ui,sans-serif;
  background:radial-gradient(120% 80% at 50% 0%,#14284a 0%,#0b1626 55%,#070d18 100%);font-variant-numeric:tabular-nums}
.ad *{box-sizing:border-box}
.ad-grid{position:absolute;inset:0;opacity:.16;background-image:linear-gradient(${CYAN}33 1px,transparent 1px),linear-gradient(90deg,${CYAN}33 1px,transparent 1px);background-size:9vw 9vw}
.ad-scene{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:0 7vw;opacity:0}
.ad-hook{align-items:flex-start;justify-content:flex-start;padding-top:20vh}
.ad-hook span{display:block;font-size:17vw;line-height:.95;font-weight:650;letter-spacing:-.055em;opacity:0}
.ad-hook span.red{color:#ff2d46}
.ad-fell{margin-top:4vw;font-size:7vw;font-weight:600;color:#ff2d46;opacity:0}
.ad-board{position:absolute;left:50%;bottom:-38vw;width:96vw;height:96vw;margin-left:-48vw;z-index:1}
.ad-fly{position:absolute;width:56vw;left:22vw;bottom:44vw;transform-origin:0% 50%;z-index:2;opacity:0}
.ad-hud-title{position:absolute;top:7vh;left:7vw;right:7vw;display:flex;flex-direction:column;gap:1vw;
  color:${CYAN};font-size:4.4vw;font-weight:600;letter-spacing:.14em;text-transform:uppercase}
.ad-hud-title b{font-size:8vw;letter-spacing:-.03em;text-transform:none;color:#fff;font-weight:650}
.ad-handbox{position:relative;width:70vw;height:92vw;margin-top:2vh}
.ad-handbox svg.hand{position:absolute;inset:0;width:100%;height:100%}
.ad-ring{position:absolute;left:50%;top:50%;border-radius:50%;border:.5vw dashed ${CYAN}88;pointer-events:none}
.ad-scanline{position:absolute;left:-8vw;right:-8vw;height:.8vw;top:0;background:${CYAN};box-shadow:0 0 6vw 2vw ${CYAN}88}
.ad-tag{position:absolute;padding:.6vw 1.6vw;border-radius:1.2vw;background:#07111fcc;box-shadow:0 0 0 1px ${CYAN}99;
  color:${CYAN};font-size:3.2vw;font-weight:600;white-space:nowrap;opacity:0}
.ad-meas{position:absolute;bottom:8vh;left:7vw;right:7vw;display:grid;grid-template-columns:1fr 1fr;gap:2vw 4vw}
.ad-meas div{font-size:3.6vw;color:#9fb0c8;font-weight:550;opacity:0}
.ad-meas b{display:block;color:#fff;font-size:8vw;font-weight:650;letter-spacing:-.04em}
.ad-panel{width:100%;display:grid;gap:1.4vw;margin-top:6vh}
.ad-row{display:flex;justify-content:space-between;align-items:baseline;padding:2.2vw 3.4vw;border-radius:2.6vw;
  background:${CYAN}12;box-shadow:inset 0 0 0 1px ${CYAN}40;opacity:0}
.ad-row span{font-size:4.4vw;color:#9fb0c8;font-weight:550}
.ad-row b{font-size:6.4vw;font-weight:650;letter-spacing:-.03em}
.ad-row.hit{box-shadow:inset 0 0 0 1px ${CYAN}}
.ad-feed{position:absolute;left:7vw;right:7vw;bottom:4vh;font-size:3.2vw;color:${CYAN};opacity:.8;line-height:1.5;white-space:nowrap;overflow:hidden}
.ad-curves{width:100%;display:grid;gap:3vw;margin-top:4vh}
.ad-curve{display:grid;grid-template-columns:1fr auto;align-items:end;gap:1vw 3vw}
.ad-curve span{grid-column:1/-1;font-size:3.8vw;color:#9fb0c8;font-weight:550;letter-spacing:.04em;text-transform:uppercase}
.ad-curve svg{width:100%;height:16vw;overflow:visible}
.ad-curve b{font-size:8vw;font-weight:650;letter-spacing:-.04em;min-width:30vw;text-align:right}
.ad-curve small{display:block;font-size:3.4vw;color:${CYAN};font-weight:600;letter-spacing:0;text-align:right}
.ad-formula{margin-top:4vw;font-size:4.2vw;color:${CYAN};text-align:center;min-height:6vw}
.ad-ideal{width:100%;margin-top:3vw;opacity:0}
.ad-ideal svg{width:100%;height:auto}
.ad-ideal p{margin:1vw 0 0;text-align:center;font-size:4.4vw;color:#c5d1e2;font-weight:550}
.ad-list{width:100%;height:96vw;overflow:hidden;margin-top:4vh;position:relative;
  -webkit-mask:linear-gradient(transparent,#000 18%,#000 82%,transparent);mask:linear-gradient(transparent,#000 18%,#000 82%,transparent)}
.ad-list ol{list-style:none;margin:0;padding:0;position:absolute;left:0;right:0;top:0}
.ad-list li{display:flex;justify-content:space-between;gap:3vw;padding:2.4vw 3vw;font-size:4.6vw;font-weight:550;color:#c5d1e2;border-bottom:1px solid ${CYAN}22}
.ad-list li b{color:${CYAN};font-weight:600}
.ad-list li.top{color:#fff;background:#2ee59d22;box-shadow:inset 0 0 0 .5vw #2ee59d;border-radius:2vw}
.ad-list li.top b{color:#2ee59d}
.ad-count{margin-top:2vw;font-size:4.4vw;color:#9fb0c8}
.ad-match .bw{background:none;z-index:1}
.ad-match .bw-hit{width:80vw}
.ad-match .bw-word{font-size:15vw}
.ad-found{position:absolute;left:7vw;right:7vw;bottom:9vh;display:grid;justify-items:center;gap:2vw}
.ad-dname{font-size:6.4vw;font-weight:600;letter-spacing:-.03em;text-align:center;text-wrap:balance;opacity:0}
.ad-badge{padding:1.6vw 4vw;border-radius:99px;background:#2ee59d;color:#0a121f;font-size:4.6vw;font-weight:650;opacity:0}
.ad-pro{justify-content:flex-end;padding-bottom:12vh}
.ad-photo{position:absolute;inset:0;background:#0b1626}
.ad-photo img{width:100%;height:100%;object-fit:cover;object-position:50% 20%}
.ad-photo::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgb(7 13 24/0) 35%,#070d18 88%)}
.ad-credit{position:absolute;top:2.4vh;right:3vw;font-size:2.6vw;color:rgb(255 255 255/.75);text-shadow:0 1px 3px #000}
.ad-pro .pro-art{width:78vw;margin:4vw 0;border-radius:5vw;box-shadow:0 0 0 1.2vw #fff,0 6vw 14vw rgb(0 0 0/.6)}
.ad-like{position:relative;font-size:7vw;font-weight:600;color:#c5d1e2;letter-spacing:-.02em}
.ad-proname{position:relative;font-size:15vw;line-height:.92;font-weight:650;letter-spacing:-.055em;text-align:center;text-wrap:balance}
.ad-pmatch{position:relative;margin-top:3vw;font-size:7vw;font-weight:650;color:#2ee59d}
.ad-flash{position:absolute;inset:0;background:#fff;opacity:0;pointer-events:none;z-index:5}
.ad-cta h2{margin:0;font-size:14vw;line-height:.95;font-weight:650;letter-spacing:-.055em;text-align:center;text-wrap:balance}
.ad-cta p{margin:5vw 0 9vw;font-size:6vw;font-weight:550;color:#c5d1e2}
.ad-url{padding:4.4vw 8vw;border-radius:99px;background:#e3122c;font-size:8vw;font-weight:650;letter-spacing:-.035em;box-shadow:0 3vw 9vw rgb(227 18 44/.45)}
`;

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const EASE_OUT = 'cubic-bezier(0.2, 0.8, 0.2, 1)';
const POP = 'cubic-bezier(0.34, 1.56, 0.64, 1)';
const rise = (el: Element, ms = 260, dy = '3vw') =>
  el.animate(
    [
      { opacity: 0, transform: `translateY(${dy})` },
      { opacity: 1, transform: 'none' },
    ],
    { duration: ms, easing: EASE_OUT, fill: 'forwards' },
  );
/** Count a number up in place. */
async function countTo(el: Element, to: number, ms: number, fmt: (v: number) => string) {
  const t0 = performance.now();
  for (;;) {
    const p = Math.min(1, (performance.now() - t0) / ms);
    el.textContent = fmt(to * (1 - Math.pow(1 - p, 3)));
    if (p >= 1) return;
    await wait(30);
  }
}

export async function adView(root: HTMLElement, _p: Record<string, string>, q: URLSearchParams) {
  const lang = getLang();
  const C = COPY[lang as keyof typeof COPY] ?? COPY.en;
  const n = (k: string, d: number) => Number(q.get(k) ?? d);
  const L = n('L', 185);
  const k = L / 185;
  const m: Measurements = {
    handLengthMm: L,
    palmWidthMm: 78 * k,
    indexLengthMm: 78 * k,
    middleLengthMm: 85 * k,
    thumbIndexSpanMm: 120 * k,
    spreadMm: 1.2,
    samples: 18,
    calibrated: true,
  };
  const a: Answers = {
    tip: 'steel',
    hold: (q.get('hold') ?? 'middle') as Answers['hold'],
    fingers: n('f', 3) as Answers['fingers'],
    throwStyle: (q.get('throw') ?? 'flat') as Answers['throwStyle'],
    moisture: 'normal',
    gripFeel: n('g', 3) as Answers['gripFeel'],
    thickness: 'auto',
    heightCm: n('h', 180),
  };
  const result = await createFit(m, a);
  const f = result.fit;
  const best = result.recommendation.picks[0];
  if (!best) return;
  const pool = variants().filter((v) => v.tip === 'steel' && !v.specCheck);
  const c = castFor(
    f,
    pool,
    {
      lengthMm: L,
      length: L,
      knuckles: m.palmWidthMm,
      index: m.indexLengthMm,
      points: templateHand(L),
      tone: 1,
    },
    { hold: a.hold, fingers: a.fingers, throwStyle: a.throwStyle, gripFeel: a.gripFeel },
    { best, tiers: result.tiers ?? {} },
    2,
  );
  if (!c?.twin) return;
  const top = c.barrels[c.barrels.length - 1]!;

  const style = document.createElement('style');
  style.textContent = CSS;
  const ad = h('div', { class: 'ad', 'aria-hidden': 'true' }, h('div', { class: 'ad-grid' }));
  root.append(style, ad);
  const fade = (el: HTMLElement, to: 0 | 1, ms = 220) =>
    el.animate([{ opacity: to ? 0 : 1 }, { opacity: to }], { duration: ms, fill: 'forwards' }).finished;

  // 0/1. The loop's first frame: the empty board. The hook slams in, a dart hits the board and
  // falls out.
  const hook = h('div', { class: 'ad-scene ad-hook' });
  const words = C.hook.map((w, i) => h('span', { class: i === 2 ? 'red' : '' }, w));
  const fell = h('div', { class: 'ad-fell' }, C.fell);
  const board = boardSvg('ad-board');
  const fly = variantArt(best.variant, 'ad-fly') as unknown as HTMLElement;
  hook.append(...words, fell, board, fly);
  ad.append(hook);
  hook.style.opacity = '1';
  await wait(350);
  for (const w of words) {
    w.animate(
      [
        { opacity: 0, transform: 'scale(1.7) translateY(2vw)' },
        { opacity: 1, transform: 'scale(1)' },
      ],
      { duration: 240, easing: EASE_OUT, fill: 'forwards' },
    );
    await wait(230);
  }
  fly.style.opacity = '1';
  await fly.animate(
    [{ transform: 'translate(70vw, -30vw) rotate(-14deg)' }, { transform: 'translate(0, 0) rotate(26deg)' }],
    { duration: 340, easing: 'cubic-bezier(0.5, 0, 0.9, 0.6)', fill: 'forwards' },
  ).finished;
  // It sticks for a beat, wobbles…
  await fly.animate(
    [
      { transform: 'rotate(26deg)' },
      { transform: 'rotate(31deg)' },
      { transform: 'rotate(23deg)' },
      { transform: 'rotate(27deg)' },
    ],
    { duration: 420, fill: 'forwards' },
  ).finished;
  // …and drops out of the board.
  fly.animate(
    [
      { transform: 'rotate(27deg)' },
      { transform: 'translate(4vw, 6vw) rotate(60deg)', offset: 0.25 },
      { transform: 'translate(10vw, 120vw) rotate(160deg)' },
    ],
    { duration: 760, easing: 'cubic-bezier(0.5, 0, 0.9, 0.5)', fill: 'forwards' },
  );
  await wait(220);
  rise(fell, 220);
  await wait(900);
  await fade(hook, 0, 200);

  // 2. The scan, as a HUD: 21 landmarks, rings, the measurements read off.
  const scan = h('div', { class: 'ad-scene' });
  const hand = handArt({ lengthMm: L, dots: true });
  hand.classList.add('hand');
  const [skin, hi, shade, nail] = SKIN_TONES[1];
  hand.style.cssText = `--skin:${skin};--skin-hi:${hi};--skin-shade:${shade};--nail:${nail}`;
  const line = h('div', { class: 'ad-scanline' });
  const rings = [64, 84].map((w) => {
    const r = h('div', { class: 'ad-ring' });
    r.style.cssText = `width:${w}vw;height:${w}vw;margin:-${w / 2}vw 0 0 -${w / 2}vw`;
    return r;
  });
  const tags = [
    ['P0', 46, 92],
    ['P5', 18, 46],
    ['P8', 30, 6],
    ['P12', 52, 2],
    ['P20', 82, 22],
    ['P4', -8, 48],
  ].map(([lbl, x, y]) => {
    const tg = h(
      'div',
      { class: 'ad-tag' },
      `${lbl} ${num(Number(x) * k * 1.9, 1)},${num(Number(y) * k * 1.9, 1)}`,
    );
    tg.style.cssText = `left:${x}%;top:${y}%`;
    return tg;
  });
  const box = h('div', { class: 'ad-handbox' }, ...rings, hand, line, ...tags);
  const meas = [
    [C.rows.hand, `${num(L, 1)} mm`],
    [C.rows.palm, `${num(m.palmWidthMm, 1)} mm`],
    [C.rows.ratio, num(m.middleLengthMm / m.palmWidthMm, 2)],
    [C.rows.span, `${num(m.thumbIndexSpanMm, 1)} mm`],
  ].map(([lbl, v]) => h('div', null, lbl, h('b', null, v)));
  scan.append(
    h('div', { class: 'ad-hud-title' }, h('b', null, C.scan), C.points),
    box,
    h('div', { class: 'ad-meas' }, ...meas),
  );
  ad.append(scan);
  await fade(scan, 1, 160);
  rings.forEach((r, i) =>
    r.animate([{ transform: 'rotate(0)' }, { transform: `rotate(${i ? -120 : 160}deg)` }], {
      duration: 3200,
      fill: 'forwards',
    }),
  );
  const dots = [...hand.querySelectorAll<SVGElement>('.hand-dot')];
  dots.forEach((d) => (d.style.opacity = '0'));
  const sweep = line.animate([{ top: '0%' }, { top: '100%' }], {
    duration: 1100,
    easing: 'ease-in-out',
    fill: 'forwards',
  });
  const t0 = performance.now();
  while (performance.now() - t0 < 1100) {
    const p = (performance.now() - t0) / 1100;
    dots.forEach((d, i) => i / dots.length <= p && (d.style.opacity = '1'));
    await wait(40);
  }
  dots.forEach((d) => (d.style.opacity = '1'));
  await sweep.finished;
  line.remove();
  for (const tg of tags) {
    rise(tg, 160, '1vw');
    await wait(70);
  }
  for (const el of meas) {
    rise(el, 200);
    await wait(150);
  }
  await wait(650);
  await fade(scan, 0, 160);

  // 3. Every parameter into the model.
  const params = h('div', { class: 'ad-scene' });
  const tr = f.trajectory;
  const rows: Array<[string, string]> = [
    [C.rows.hand, `${num(L, 1)} mm`],
    [C.rows.palm, `${num(m.palmWidthMm, 1)} mm`],
    [C.rows.ratio, num(m.middleLengthMm / m.palmWidthMm, 2)],
    [C.rows.height, `${a.heightCm} cm`],
    ...(tr ? ([[C.rows.angle, `${num(tr.angleDeg, 1)}°`]] as Array<[string, string]>) : []),
    [C.rows.hold, C.hold[a.hold]],
    [C.rows.fingers, String(a.fingers)],
    [C.rows.throw, C.throw[a.throwStyle]],
    [C.rows.grip, `${a.gripFeel} / 5`],
  ];
  const rowEls = rows.map(([lbl, v]) => h('div', { class: 'ad-row' }, h('span', null, lbl), h('b', null, v)));
  const feed = h('div', { class: 'ad-feed' });
  params.append(
    h('div', { class: 'ad-hud-title' }, h('b', null, C.input), `${rows.length} / ${rows.length}`),
    h('div', { class: 'ad-panel' }, ...rowEls),
    feed,
  );
  ad.append(params);
  await fade(params, 1, 150);
  const feedLines = [
    `x = [${rows.map(([, v]) => v.replace(/[^0-9.,]/g, '') || '·').join(', ')}]`,
    `N(μ, σ²) × ${rows.length}`,
  ];
  for (const [i, el] of rowEls.entries()) {
    rise(el, 170, '2vw');
    el.classList.add('hit');
    setTimeout(() => el.classList.remove('hit'), 260);
    feed.textContent = feedLines[i % feedLines.length]!;
    await wait(160);
  }
  await wait(650);
  await fade(params, 0, 150);

  // 4. The model: three Gaussians narrowing onto weight, length and thickness; then the barrel.
  const model = h('div', { class: 'ad-scene' });
  const dims = [
    { label: C.weight, e: f.weight, unit: 'g', dp: 1 },
    { label: C.length, e: f.length, unit: 'mm', dp: 1 },
    { label: C.thick, e: f.diameter, unit: 'mm', dp: 2 },
  ];
  const curves = dims.map((d) => {
    const path = s('path', { fill: `${CYAN}22`, stroke: CYAN, 'stroke-width': 1.4 });
    const mu = s('line', { y1: 0, y2: 40, stroke: '#fff', 'stroke-width': 0.8, 'stroke-dasharray': '2 2' });
    const svg = s('svg', { viewBox: '0 0 200 40', preserveAspectRatio: 'none' }, path, mu);
    const val = h('b', null, '0');
    const sig = h('small', null, '');
    return {
      d,
      path,
      mu,
      el: h('div', { class: 'ad-curve' }, h('span', null, d.label), svg, h('div', null, val, sig)),
      val,
      sig,
    };
  });
  const formula = h('div', { class: 'ad-formula' });
  const ideal = dartArt({
    lengthMm: f.barrel.lengthMm,
    diameterMm: f.barrel.diameterMm,
    profile: f.barrel.profile,
    grip: Math.round(f.grip.mu) as 1 | 2 | 3 | 4 | 5,
    soft: false,
    tone: 0,
  });
  const idealBox = h(
    'div',
    { class: 'ad-ideal' },
    ideal,
    h(
      'p',
      null,
      `${num(f.barrel.massG, 1)} g · ${num(f.barrel.lengthMm, 1)} mm · Ø ${num(f.barrel.diameterMm, 2)} · ${f.barrel.tungstenPct}% W · ${shapeName(f.barrel.shape)}`,
    ),
  );
  model.append(
    h('div', { class: 'ad-hud-title' }, h('b', null, C.model), 'Gauss · physics'),
    h('div', { class: 'ad-curves' }, ...curves.map((x) => x.el)),
    formula,
    idealBox,
  );
  ad.append(model);
  await fade(model, 1, 150);
  const formulas = [
    'P(w | hand, answers) ∝ Π N(xᵢ; μᵢ, σᵢ)',
    'm = ρ(W) · ∫ π r(x)² dx · 0.876',
    `min Σ ((x − μ) / σ)²  →  ${f.barrel.tungstenPct}% W`,
  ];
  const draw = (x: (typeof curves)[number], spread: number) => {
    const { mu, sigma } = x.d.e;
    const sd = sigma * spread;
    const lo = mu - 4 * sigma * 3;
    const hi = mu + 4 * sigma * 3;
    const pts: string[] = [];
    for (let i = 0; i <= 60; i++) {
      const xv = lo + ((hi - lo) * i) / 60;
      const y = Math.exp(-0.5 * ((xv - mu) / sd) ** 2) / spread;
      pts.push(`${((i / 60) * 200).toFixed(1)},${(40 - y * 36).toFixed(1)}`);
    }
    x.path.setAttribute('d', `M0,40L${pts.join('L')}L200,40Z`);
    x.mu.setAttribute('x1', '100');
    x.mu.setAttribute('x2', '100');
  };
  const m0 = performance.now();
  let fi = -1;
  for (;;) {
    const p = Math.min(1, (performance.now() - m0) / 1700);
    const e = 1 - Math.pow(1 - p, 3);
    for (const x of curves) {
      draw(x, 3 - 2 * e);
      x.val.textContent = `${num(x.d.e.mu * e, x.d.dp)} ${x.d.unit}`;
      x.sig.textContent = `σ ${num(x.d.e.sigma * (3 - 2 * e), x.d.dp)}`;
    }
    const want = Math.min(formulas.length - 1, Math.floor(p * formulas.length));
    if (want !== fi) {
      fi = want;
      formula.textContent = formulas[fi]!;
      rise(formula, 160, '1vw');
    }
    if (p >= 1) break;
    await wait(30);
  }
  idealBox.animate(
    [
      { opacity: 0, transform: 'scaleX(0.2)' },
      { opacity: 1, transform: 'none' },
    ],
    { duration: 380, easing: POP, fill: 'forwards' },
  );
  await wait(1300);
  await fade(model, 0, 150);

  // 5. The catalogue search: every dart scored, the list running down to the best one.
  const ranked = pool
    .map((v) => ({ v, cost: scoreVariant(f, v).cost }))
    .sort((x, y) => y.cost - x.cost)
    .slice(-14);
  const list = h('ol');
  ranked.forEach((x, i) =>
    list.append(
      h(
        'li',
        { class: i === ranked.length - 1 ? 'top' : '' },
        h('span', null, dartName(x.v)),
        h('b', null, num(x.cost, 2)),
      ),
    ),
  );
  const count = h('div', { class: 'ad-count' }, `0 ${C.darts}`);
  const search = h('div', { class: 'ad-scene' });
  search.append(
    h('div', { class: 'ad-hud-title' }, h('b', null, C.search), 'cost ↓'),
    h('div', { class: 'ad-list' }, list),
    count,
  );
  ad.append(search);
  await fade(search, 1, 150);
  const rowH = (list.firstElementChild as HTMLElement).getBoundingClientRect().height;
  const listH = (list.parentElement as HTMLElement).getBoundingClientRect().height;
  // End with the best dart (the last row) in the lower middle of the window.
  const shift = Math.max(0, rowH * ranked.length - listH * 0.7);
  list.animate([{ transform: 'translateY(0)' }, { transform: `translateY(-${shift}px)` }], {
    duration: 1500,
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
    fill: 'forwards',
  });
  await countTo(count, pool.length, 1500, (v) => `${Math.round(v)} ${C.darts}`);
  await wait(700);
  await fade(search, 0, 150);

  // 6. The match: darts landing on the board and "92% match", then the dart it found.
  const match = h('div', { class: 'ad-scene ad-match' });
  const win = checkoutWin(top.m.total);
  const dname = h('div', { class: 'ad-dname' }, dartName(top.v));
  const badge = h('div', { class: 'ad-badge' }, C.best);
  match.append(win.el, h('div', { class: 'ad-found' }, dname, badge));
  ad.append(match);
  match.style.opacity = '1';
  await wait(win.ms - 600);
  rise(dname, 260);
  rise(badge, 260);
  await wait(1100);
  await fade(match, 0, 160);

  // 7. The reveal: the pro (photo when supplied, else the player card) and the name.
  const pro = h('div', { class: 'ad-scene ad-pro' });
  const photo = window.__adPhoto;
  const flash = h('div', { class: 'ad-flash' });
  const like = h('div', { class: 'ad-like' }, C.like);
  const name = h('div', { class: 'ad-proname' }, c.twin.name);
  const pm = h('div', { class: 'ad-pmatch' }, `${top.m.total}% match`);
  let hero: HTMLElement;
  if (photo) {
    const img = h('img', { src: photo.src, alt: '' });
    hero = h('div', { class: 'ad-photo' }, img);
    pro.append(hero, like, name, pm);
    if (photo.credit) pro.append(h('div', { class: 'ad-credit' }, photo.credit));
  } else {
    hero = proArt(c.twin) as unknown as HTMLElement;
    pro.style.justifyContent = 'center';
    pro.style.paddingBottom = '0';
    pro.append(like, hero, name, pm);
  }
  ad.append(pro, flash);
  [like, name, pm].forEach((x) => (x.style.opacity = '0'));
  pro.style.opacity = '1';
  flash.animate([{ opacity: 0.95 }, { opacity: 0 }], { duration: 450, fill: 'forwards' });
  await hero.animate(
    photo
      ? [
          { transform: 'scale(1.35)', opacity: 0 },
          { transform: 'scale(1)', opacity: 1 },
        ]
      : [
          { transform: 'scale(2.4) rotate(-10deg)', opacity: 0 },
          { transform: 'scale(1) rotate(0)', opacity: 1 },
        ],
    { duration: 480, easing: photo ? EASE_OUT : POP, fill: 'forwards' },
  ).finished;
  rise(like, 200);
  await wait(120);
  rise(name, 300, '6vw');
  await wait(260);
  rise(pm, 260);
  await wait(1700);
  await fade(pro, 0, 200);

  // 8. The ask, then back to the empty board: the first frame again, so the video loops.
  const cta = h('div', { class: 'ad-scene ad-cta' });
  const url = h('div', { class: 'ad-url' }, 'findyourdarts.com');
  cta.append(h('h2', null, C.cta), h('p', null, C.sub), url);
  ad.append(cta);
  await fade(cta, 1, 200);
  url.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.07)' }, { transform: 'scale(1)' }], {
    duration: 900,
    iterations: 2,
    easing: 'ease-in-out',
  });
  await wait(2000);
  await fade(cta, 0, 250);
  const back = h('div', { class: 'ad-scene ad-hook' }, boardSvg('ad-board'));
  ad.append(back);
  await fade(back, 1, 300);
  await wait(350);
  document.body.dataset.adDone = '1';
}
