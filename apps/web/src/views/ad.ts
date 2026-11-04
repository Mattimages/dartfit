/**
 * #/ad : a 9:16 motion ad (TikTok / Reels / Shorts), only in the demo build. Playful but clean:
 * the real board and darts in their own colours, soft round lines, three typefaces (a chunky
 * display face for the big words, handwriting for the little notes, Geist for the numbers) and
 * almost no words. A step rail at the top (hand → maths → dart → pro) keeps the viewer oriented,
 * and each scene slides on to the next.
 *
 * The story: a dart falls out of the board, the hand is scanned next to a pasje, the numbers fly
 * into the model, three bell curves narrow, the catalogue is crossed off down to one dart, darts
 * land on the board with the match %, and the pro is revealed with their real photo (the
 * renderer's window.__adPhoto, else the site's credited photo, else the player card). All numbers
 * come from the real engine for one persona. The last frame is the first frame (the empty board),
 * so the video loops. Recorded by scripts/tiktok/ad.mjs, which injects the two extra faces
 * (AdHand: Caveat, AdDisplay: Bricolage Grotesque); the site itself never loads them.
 *
 *   #/ad?L=178&h=180&hold=rear&f=4&throw=flat&g=1      (hand length mm, height cm, answers)
 */
import { scoreVariant, type Answers, type Measurements } from '@dartfit/engine';
import { h, s } from '../h';
import { getLang, num } from '../i18n';
import { createFit, variants } from '../api';
import { boardSvg } from '../draw/checkout';
import { handArt, templateHand } from '../draw/art';
import { proArt } from '../draw/pro-art';
import { creditText, proPhoto } from '../draw/pro-photo';
import { variantArt } from '../score';
import { castFor, checkoutWin } from './hero-scan';
import { dartName } from './words';

declare global {
  interface Window {
    __adPhoto?: { src: string; credit: string };
  }
}

const COPY = {
  nl: {
    hook: 'Verkeerde dart?',
    like: 'Je gooit als',
    cta: 'Welke prof ben jij?',
    steps: ['hand', 'rekenen', 'dart', 'prof'],
    hand: 'jouw hand',
    dims: ['gewicht', 'lengte', 'dikte'],
    darts: 'darts',
    dart: 'dart',
    pick: 'deze!',
  },
  en: {
    hook: 'Wrong dart?',
    like: 'You throw like',
    cta: 'Which pro are you?',
    steps: ['hand', 'maths', 'dart', 'pro'],
    hand: 'your hand',
    dims: ['weight', 'length', 'thickness'],
    darts: 'darts',
    dart: 'dart',
    pick: 'this one!',
  },
  de: {
    hook: 'Falscher Dart?',
    like: 'Du wirfst wie',
    cta: 'Welcher Profi bist du?',
    steps: ['Hand', 'Mathe', 'Dart', 'Profi'],
    hand: 'deine Hand',
    dims: ['Gewicht', 'Länge', 'Dicke'],
    darts: 'Darts',
    dart: 'Dart',
    pick: 'der hier!',
  },
};

const NAVY = '#13233f';
const INK = '#fdf8ee';
const RED = '#ff4d5e';
const GREEN = '#3ee6a0';
const SUN = '#ffd166';
const HAND = 'AdHand,"Caveat","Segoe Print","Comic Sans MS",cursive';
const DISPLAY = 'AdDisplay,"Bricolage Grotesque","Geist Variable",system-ui,sans-serif';
const CSS = `
.ad{position:fixed;inset:0;z-index:2147483000;overflow:hidden;color:${INK};
  font-family:"Geist Variable",system-ui,sans-serif;
  background:
    radial-gradient(55vw 55vw at 8% 12%,#ff4d5e2e,transparent 70%),
    radial-gradient(70vw 70vw at 100% 70%,#3ee6a024,transparent 70%),
    radial-gradient(circle at 1px 1px,#ffffff14 1.2px,transparent 1.6px) 0 0/6vw 6vw,
    ${NAVY}}
.ad *{box-sizing:border-box}
.ad-scene{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;opacity:0}
.ad-hand-note{font-family:${HAND};font-weight:700}
.ad-big{font-family:${DISPLAY};font-weight:800;letter-spacing:-.025em;line-height:.92;text-align:center}
.ad-rail{position:absolute;top:5.5vh;left:7vw;right:7vw;display:grid;grid-template-columns:repeat(4,1fr);opacity:0;z-index:5}
.ad-step{position:relative;display:grid;justify-items:center;gap:1.4vw;color:#ffffff66;transition:color .3s}
.ad-step::before{content:"";position:absolute;top:2.1vw;left:-50%;right:50%;height:.7vw;border-radius:1vw;background:#ffffff26;z-index:-1}
.ad-step:first-child::before{display:none}
.ad-step i{display:block;width:4.9vw;height:4.9vw;border-radius:50%;background:${NAVY};box-shadow:inset 0 0 0 .7vw #ffffff40;transition:transform .35s cubic-bezier(.34,1.56,.64,1),background .3s,box-shadow .3s}
.ad-step span{font-family:${HAND};font-weight:700;font-size:7vw;line-height:1}
.ad-step.done{color:#ffffffb0}
.ad-step.done::before,.ad-step.on::before{background:${GREEN}}
.ad-step.done i{background:${GREEN};box-shadow:none}
.ad-step.on{color:${INK}}
.ad-step.on i{background:${RED};box-shadow:0 0 0 1.4vw #ff4d5e40;transform:scale(1.25)}
.ad-hook .ad-big{position:absolute;top:15vh;left:4vw;right:4vw;font-size:17vw;transform:rotate(-3deg);opacity:0}
.ad-squig{position:absolute;top:calc(15vh + 34vw);left:18vw;width:64vw;height:6vw;overflow:visible}
.ad-squig path{fill:none;stroke:${RED};stroke-width:5;stroke-linecap:round;vector-effect:non-scaling-stroke}
.ad-board{position:absolute;left:50%;bottom:-30vw;width:96vw;height:96vw;margin-left:-48vw;overflow:visible;filter:drop-shadow(0 4vw 6vw #0008)}
.ad-fly{position:absolute;width:56vw;left:24vw;bottom:44vw;transform-origin:0% 50%;opacity:0;filter:drop-shadow(0 2vw 2vw #0006)}
.ad-handbox{position:relative;width:70vw;height:96vw;margin-top:6vh;
  --skin:#e3b896;--skin-hi:#f3d5be;--skin-shade:#b9805e;--nail:#f4dbd1}
.ad-handbox svg.hand{position:absolute;inset:0;width:100%;height:100%;filter:drop-shadow(0 3vw 4vw #0007)}
.ad-handbox .hand-dot{fill:${GREEN}}
.ad-scanbar{position:absolute;left:-6vw;right:-6vw;height:1vw;border-radius:1vw;background:${GREEN};box-shadow:0 0 4vw 1.4vw #3ee6a088;opacity:0}
.ad-dim{position:absolute;overflow:visible}
.ad-dim path{stroke:${SUN};stroke-width:3.4px;vector-effect:non-scaling-stroke;fill:none;stroke-linecap:round;stroke-linejoin:round}
.ad-pill{position:absolute;padding:1.2vw 3vw;border-radius:9vw;background:${INK};color:${NAVY};font-weight:650;font-size:6.6vw;letter-spacing:-.03em;font-variant-numeric:tabular-nums;white-space:nowrap;opacity:0;box-shadow:0 1.6vw 4vw #0006}
.ad-card{position:absolute;right:-8vw;bottom:2vw;width:32vw;aspect-ratio:85.6/54;border-radius:2.6vw;
  background:linear-gradient(135deg,#4f7cff,#7a4dff);box-shadow:0 2vw 5vw #0007,inset 0 0 0 .4vw #ffffff40;transform:rotate(-9deg);opacity:0}
.ad-card::before{content:"";position:absolute;left:3vw;top:4vw;width:6vw;height:4.4vw;border-radius:1vw;background:linear-gradient(135deg,#ffe29a,#d9a441)}
.ad-note{position:absolute;padding:0 3vw 1vw 1vw;font-size:9vw;color:${SUN};white-space:nowrap;opacity:0}
.ad-arrow{position:absolute;overflow:visible;opacity:0}
.ad-arrow path{fill:none;stroke:${SUN};stroke-width:3.2px;stroke-linecap:round;stroke-linejoin:round;vector-effect:non-scaling-stroke}
.ad-core{position:absolute;left:50%;top:52%;width:48vw;height:48vw;margin:-24vw 0 0 -24vw;overflow:visible}
.ad-core circle{fill:none;stroke-width:3.2px;vector-effect:non-scaling-stroke;stroke-linecap:round}
.ad-glow{position:absolute;left:50%;top:52%;width:20vw;height:20vw;margin:-10vw 0 0 -10vw;border-radius:50%;
  background:radial-gradient(circle,#fff 0,#3ee6a0 35%,#3ee6a000 70%);opacity:.2}
.ad-chip{position:absolute;padding:1.4vw 3.4vw;border-radius:9vw;font-weight:650;font-size:8vw;letter-spacing:-.03em;font-variant-numeric:tabular-nums;white-space:nowrap;transform:translate(-50%,-50%);opacity:0;box-shadow:0 1.6vw 4vw #0005}
.ad-curves{display:grid;gap:6vw;width:84vw;margin-top:8vh}
.ad-curve{display:grid;grid-template-columns:1fr 30vw;grid-template-rows:auto auto;align-items:end;column-gap:3vw}
.ad-curve .ad-hand-note{grid-column:1/-1;font-size:7vw;color:#ffffffb0;line-height:1;margin-bottom:-1vw}
.ad-curve svg{width:100%;height:18vw;overflow:visible}
.ad-curve .area{stroke:none}
.ad-curve .line{fill:none;stroke-width:3.4px;stroke-linecap:round;vector-effect:non-scaling-stroke}
.ad-curve b{font-family:${DISPLAY};font-weight:800;font-size:10vw;letter-spacing:-.03em;text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}
.ad-formula{margin-top:8vw;font-family:${HAND};font-weight:700;font-size:8vw;color:${SUN};transform:rotate(-2deg);clip-path:inset(0 100% 0 0)}
.ad-grid{display:grid;grid-template-columns:repeat(10,1fr);gap:2.6vw 1.6vw;width:86vw;margin-top:8vh}
.ad-mini{position:relative;height:5vw;transition:opacity .25s,transform .25s}
.ad-mini svg{width:100%;height:100%;overflow:visible}
.ad-mini line{stroke-width:2.6px;vector-effect:non-scaling-stroke;stroke-linecap:round}
.ad-mini.x{opacity:.14;transform:scale(.7)}
.ad-mini.win{opacity:1}
.ad-mini.win::before{content:"";position:absolute;inset:-3.4vw -1vw;border-radius:50%;box-shadow:0 0 0 .8vw ${GREEN},0 0 5vw ${GREEN}}
.ad-count{margin-top:7vw;display:flex;align-items:baseline;gap:2.6vw}
.ad-count b{font-family:${DISPLAY};font-weight:800;font-size:22vw;letter-spacing:-.04em;line-height:1;font-variant-numeric:tabular-nums;color:${INK}}
.ad-count span{font-family:${HAND};font-weight:700;font-size:9vw;color:#ffffffb0}
.ad-pick{font-size:6.6vw;font-weight:600;letter-spacing:-.02em;text-align:center;margin-top:1vw;opacity:0}
.ad-match .bw{background:none}
.ad-match .bw-hit{width:82vw}
.ad-match .bw-word{font-family:${DISPLAY};font-weight:800;font-size:22vw;letter-spacing:-.04em;color:${GREEN};text-shadow:0 1vw 6vw #3ee6a066}
.ad-pro{justify-content:flex-end;padding-bottom:8vh}
.ad-photo{position:absolute;left:9vw;right:9vw;top:16vh;height:45vh;border-radius:6vw;overflow:hidden;
  box-shadow:0 0 0 1.6vw ${INK},0 6vw 12vw #000a;transform:rotate(-3deg);background:#1d3762}
.ad-photo img{width:100%;height:100%;object-fit:cover;object-position:50% 20%}
.ad-credit{position:absolute;left:0;right:0;bottom:0;padding:8vw 3vw 2vw;text-align:right;font-weight:500;font-size:2.5vw;color:#fffd;background:linear-gradient(to top,#000a,#0000)}
.ad-pro .pro-art{width:74vw;margin-bottom:5vh;border-radius:6vw;box-shadow:0 0 0 1.6vw ${INK}}
.ad-like{font-family:${HAND};font-weight:700;font-size:11vw;color:${SUN};transform:rotate(-4deg);opacity:0}
.ad-proname{font-size:15vw;margin-top:1vw;opacity:0}
.ad-pct{margin-top:4vw;padding:1.6vw 5vw;border-radius:9vw;background:${GREEN};color:${NAVY};font-family:${DISPLAY};font-weight:800;font-size:9vw;letter-spacing:-.03em;opacity:0}
.ad-cta .ad-big{font-size:15vw;padding:0 6vw;opacity:0}
.ad-url{margin-top:9vw;padding:2.4vw 6vw;border-radius:9vw;background:${INK};color:${NAVY};font-weight:650;font-size:7.4vw;letter-spacing:-.03em;opacity:0;box-shadow:0 2vw 6vw #0006}
`;

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const EASE_OUT = 'cubic-bezier(0.2, 0.8, 0.2, 1)';
const POP = 'cubic-bezier(0.34, 1.56, 0.64, 1)';
const show = (el: Element, ms = 280, from = 'translateY(4vw) scale(.9)', to = 'none') =>
  el.animate(
    [
      { opacity: 0, transform: from },
      { opacity: 1, transform: to },
    ],
    { duration: ms, easing: POP, fill: 'forwards' },
  );
/** Handwriting appearing: a left-to-right reveal. */
const write = (el: Element, ms = 500) =>
  el.animate(
    [
      { clipPath: 'inset(0 100% 0 0)', opacity: 1 },
      { clipPath: 'inset(0 0 0 0)', opacity: 1 },
    ],
    { duration: ms, easing: 'ease-out', fill: 'forwards' },
  );
/** A line being drawn. */
function drawIn(path: SVGGeometryElement, ms: number, delay = 0) {
  const len = path.getTotalLength?.() ?? 400;
  path.style.strokeDasharray = `${len}`;
  path.style.strokeDashoffset = `${len}`;
  return path.animate([{ strokeDashoffset: len }, { strokeDashoffset: 0 }], {
    duration: ms,
    delay,
    easing: 'ease-out',
    fill: 'forwards',
  });
}
/** A hand-drawn arrow (a gentle curve with a head), pointing towards the end of the path. */
function arrow(d: string, head: string, css: string) {
  const el = s(
    'svg',
    { class: 'ad-arrow', viewBox: '0 0 100 100', preserveAspectRatio: 'none' },
    s('path', { d }),
    s('path', { d: head }),
  );
  el.style.cssText = css;
  return el;
}

export async function adView(root: HTMLElement, _p: Record<string, string>, q: URLSearchParams) {
  const C = COPY[getLang() as keyof typeof COPY] ?? COPY.en;
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
  const twin = c.twin;
  const top = c.barrels[c.barrels.length - 1]!;

  const style = document.createElement('style');
  style.textContent = CSS;
  const ad = h('div', { class: 'ad', 'aria-hidden': 'true' });
  root.append(style, ad);
  const fade = (el: HTMLElement, to: 0 | 1, ms = 220) =>
    el.animate([{ opacity: to ? 0 : 1 }, { opacity: to }], { duration: ms, fill: 'forwards' }).finished;
  /** The story moves on: this scene slides out to the left as the next one slides in. */
  const slide = async (from: HTMLElement, to: HTMLElement, ms = 380) => {
    ad.append(to);
    from.animate(
      [
        { opacity: 1, transform: 'none' },
        { opacity: 0, transform: 'translateX(-24vw)' },
      ],
      { duration: ms, easing: EASE_OUT, fill: 'forwards' },
    );
    await to.animate(
      [
        { opacity: 0, transform: 'translateX(24vw)' },
        { opacity: 1, transform: 'none' },
      ],
      { duration: ms, easing: EASE_OUT, fill: 'forwards' },
    ).finished;
    from.remove();
  };

  // The step rail: where we are in the story.
  const steps = C.steps.map((label) => h('div', { class: 'ad-step' }, h('i'), h('span', null, label)));
  const rail = h('div', { class: 'ad-rail' }, ...steps);
  ad.append(rail);
  const setStep = (i: number) =>
    steps.forEach((el, j) => {
      el.classList.toggle('done', j < i);
      el.classList.toggle('on', j === i);
    });

  // 1. The loop's first frame is the empty board. "Verkeerde dart?", the dart hits and falls out.
  const hook = h('div', { class: 'ad-scene ad-hook' });
  const word = h('div', { class: 'ad-big' }, C.hook);
  const squig = s(
    'svg',
    { class: 'ad-squig', viewBox: '0 0 100 10', preserveAspectRatio: 'none' },
    s('path', { d: 'M2,6C12,1 18,10 28,5S44,1 54,6S70,10 80,5S94,2 98,5' }),
  );
  const fly = variantArt(best.variant, 'ad-fly') as unknown as HTMLElement;
  hook.append(boardSvg('ad-board bc-board'), word, squig, fly);
  ad.append(hook);
  hook.style.opacity = '1';
  (squig.querySelector('path') as SVGPathElement).style.strokeDasharray = '400';
  (squig.querySelector('path') as SVGPathElement).style.strokeDashoffset = '400';
  await wait(350);
  show(word, 420, 'rotate(-3deg) scale(.6)', 'rotate(-3deg)');
  drawIn(squig.querySelector('path') as SVGPathElement, 380, 260);
  await wait(500);
  fly.style.opacity = '1';
  await fly.animate(
    [{ transform: 'translate(70vw, -34vw) rotate(-14deg)' }, { transform: 'translate(0, 0) rotate(26deg)' }],
    { duration: 320, easing: 'cubic-bezier(0.5, 0, 0.9, 0.6)', fill: 'forwards' },
  ).finished;
  await fly.animate(
    [
      { transform: 'rotate(26deg)' },
      { transform: 'rotate(32deg)' },
      { transform: 'rotate(22deg)' },
      { transform: 'rotate(27deg)' },
    ],
    { duration: 420, fill: 'forwards' },
  ).finished;
  await fly.animate(
    [
      { transform: 'rotate(27deg)' },
      { transform: 'translate(4vw, 6vw) rotate(62deg)', offset: 0.25 },
      { transform: 'translate(10vw, 130vw) rotate(170deg)' },
    ],
    { duration: 720, easing: 'cubic-bezier(0.5, 0, 0.9, 0.5)', fill: 'forwards' },
  ).finished;

  // 2. Your hand: scanned next to the pasje, then the two measurements.
  const scan = h('div', { class: 'ad-scene' });
  const hand = handArt({ lengthMm: L, dots: true });
  hand.classList.add('hand');
  const card = h('div', { class: 'ad-card' });
  const bar = h('div', { class: 'ad-scanbar' });
  const dimL = s(
    'svg',
    { class: 'ad-dim', viewBox: '0 0 10 100', preserveAspectRatio: 'none' },
    s('path', { d: 'M5,1V99M1.5,5L5,1L8.5,5M1.5,95L5,99L8.5,95' }),
  );
  dimL.style.cssText = 'right:-8vw;top:4%;width:4vw;height:86%';
  const dimW = s(
    'svg',
    { class: 'ad-dim', viewBox: '0 0 100 10', preserveAspectRatio: 'none' },
    s('path', { d: 'M1,5H99M5,1.5L1,5L5,8.5M95,1.5L99,5L95,8.5' }),
  );
  dimW.style.cssText = 'left:22%;top:62%;width:52%;height:4vw';
  const pillL = h('div', { class: 'ad-pill' }, `${num(L, 0)} mm`);
  pillL.style.cssText = 'right:-12vw;top:-12vw';
  const pillW = h('div', { class: 'ad-pill' }, `${num(m.palmWidthMm, 0)} mm`);
  pillW.style.cssText = 'left:28%;top:67%';
  const note = h('div', { class: 'ad-note ad-hand-note' }, C.hand);
  note.style.cssText = 'left:-6vw;top:-6vw;transform:rotate(-8deg)';
  const noteArrow = arrow('M10,10C30,20 50,40 70,80', 'M52,74L70,80L72,62', 'left:6vw;top:6vw;width:12vw;height:14vw');
  const box = h('div', { class: 'ad-handbox' }, hand, bar, card, dimL, dimW, pillL, pillW, note, noteArrow);
  scan.append(box);
  rail.style.opacity = '1';
  setStep(0);
  rail.animate([{ opacity: 0, transform: 'translateY(-4vw)' }, { opacity: 1, transform: 'none' }], {
    duration: 320,
    easing: EASE_OUT,
  });
  hand.style.clipPath = 'inset(100% 0 0 0)';
  for (const d of [dimL, dimW]) {
    const p = d.querySelector('path') as SVGPathElement;
    p.style.strokeDasharray = '1000';
    p.style.strokeDashoffset = '1000';
  }
  await slide(hook, scan, 340);
  // The scan line sweeps up and the hand appears behind it.
  hand.animate([{ clipPath: 'inset(100% 0 0 0)' }, { clipPath: 'inset(0 0 0 0)' }], {
    duration: 900,
    easing: 'ease-in-out',
    fill: 'forwards',
  });
  bar.animate(
    [
      { top: '100%', opacity: 1 },
      { top: '0%', opacity: 1, offset: 0.92 },
      { top: '0%', opacity: 0 },
    ],
    { duration: 980, easing: 'ease-in-out', fill: 'forwards' },
  );
  const dots = [...hand.querySelectorAll<SVGElement>('.hand-dot')];
  dots.forEach((d, i) =>
    d.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 120, delay: 700 + i * 26, fill: 'both' }),
  );
  await wait(500);
  show(card, 300, 'rotate(-9deg) translateY(8vw)', 'rotate(-9deg)');
  write(note, 360);
  drawIn(noteArrow.querySelector('path') as SVGPathElement, 300, 200);
  noteArrow.style.opacity = '1';
  await wait(600);
  for (const [dim, label] of [
    [dimL, pillL],
    [dimW, pillW],
  ] as const) {
    drawIn(dim.querySelector('path')!, 360);
    await wait(220);
    show(label, 300);
    await wait(260);
  }
  await wait(650);

  // 3. The maths: the numbers fly into the model, which spins up…
  const core = h('div', { class: 'ad-scene' });
  const glow = h('div', { class: 'ad-glow' });
  const ring = s(
    'svg',
    { class: 'ad-core', viewBox: '0 0 100 100' },
    s('circle', { cx: 50, cy: 50, r: 46, stroke: GREEN, 'stroke-dasharray': '14 9' }),
    s('circle', { cx: 50, cy: 50, r: 35, stroke: INK, 'stroke-opacity': 0.55 }),
    s('circle', { cx: 50, cy: 50, r: 24, stroke: RED, 'stroke-dasharray': '3 6' }),
  );
  const tr = f.trajectory;
  const values = [
    `${num(L, 0)} mm`,
    `${num(m.palmWidthMm, 0)} mm`,
    num(m.middleLengthMm / m.palmWidthMm, 2),
    `${a.heightCm} cm`,
    tr ? `${num(tr.angleDeg, 0)}°` : '·',
    `${a.fingers}×`,
    `${a.gripFeel}/5`,
  ];
  const tints = [
    [INK, NAVY],
    [GREEN, NAVY],
    [SUN, NAVY],
    [INK, NAVY],
    [RED, INK],
    [GREEN, NAVY],
    [SUN, NAVY],
  ];
  const spots = [
    [24, 32],
    [76, 31],
    [84, 54],
    [74, 78],
    [26, 79],
    [15, 55],
    [50, 25],
  ];
  const chips = values.map((v, i) => {
    const el = h('div', { class: 'ad-chip' }, v);
    el.style.cssText = `left:${spots[i]![0]}%;top:${spots[i]![1]}%;background:${tints[i]![0]};color:${tints[i]![1]}`;
    return el;
  });
  core.append(glow, ring, ...chips);
  setStep(1);
  await slide(scan, core, 340);
  ring.animate([{ transform: 'rotate(0) scale(.6)' }, { transform: 'rotate(240deg) scale(1)' }], {
    duration: 2000,
    easing: EASE_OUT,
    fill: 'forwards',
  });
  for (const el of chips) {
    show(el, 220, 'translate(-50%,-50%) scale(.3)', 'translate(-50%,-50%)');
    await wait(100);
  }
  await wait(300);
  await Promise.all(
    chips.map(
      (el, i) =>
        el.animate(
          [
            {
              left: `${spots[i]![0]}%`,
              top: `${spots[i]![1]}%`,
              opacity: 1,
              transform: 'translate(-50%,-50%) scale(1)',
            },
            { left: '50%', top: '52%', opacity: 0, transform: 'translate(-50%,-50%) scale(.2)' },
          ],
          { duration: 520, delay: i * 40, easing: 'cubic-bezier(0.6, 0, 0.9, 0.4)', fill: 'forwards' },
        ).finished,
    ),
  );
  glow.animate(
    [
      { opacity: 0.2, transform: 'scale(1)' },
      { opacity: 1, transform: 'scale(2.4)' },
    ],
    { duration: 320, easing: EASE_OUT, fill: 'forwards' },
  );
  await ring.animate(
    [{ transform: 'rotate(240deg) scale(1)' }, { transform: 'rotate(300deg) scale(1.15)' }],
    { duration: 320, fill: 'forwards' },
  ).finished;

  // …and out come three bell curves, narrowing on weight, length and thickness.
  const model = h('div', { class: 'ad-scene' });
  const dims = [
    { e: f.weight, unit: 'g', dp: 1, col: GREEN },
    { e: f.length, unit: 'mm', dp: 0, col: SUN },
    { e: f.diameter, unit: 'mm', dp: 1, col: RED },
  ];
  const curves = dims.map((d, i) => {
    const line = s('path', { class: 'line', stroke: d.col }) as unknown as SVGPathElement;
    const area = s('path', { class: 'area', fill: d.col, 'fill-opacity': 0.22 }) as unknown as SVGPathElement;
    const val = h('b', null, '');
    val.style.color = d.col;
    return {
      d,
      line,
      area,
      val,
      el: h(
        'div',
        { class: 'ad-curve' },
        h('span', { class: 'ad-hand-note' }, C.dims[i]),
        s('svg', { viewBox: '0 0 200 40', preserveAspectRatio: 'none' }, area, line),
        val,
      ),
    };
  });
  const formula = h('div', { class: 'ad-formula' }, 'Σ ((x − μ) / σ)² → min');
  model.append(h('div', { class: 'ad-curves' }, ...curves.map((x) => x.el)), formula);
  await slide(core, model, 300);
  const bell = (spread: number) => {
    const pts: string[] = [];
    for (let i = 0; i <= 50; i++) {
      const x = (i / 50) * 6 - 3;
      const y = Math.exp(-0.5 * (x / (spread * 0.6)) ** 2);
      pts.push(`${((i / 50) * 200).toFixed(1)},${(40 - y * 36).toFixed(1)}`);
    }
    return `M${pts.join('L')}`;
  };
  curves.forEach((x, i) => {
    x.line.setAttribute('d', bell(3));
    x.area.setAttribute('d', `${bell(3)}L200,40L0,40Z`);
    drawIn(x.line, 500, i * 90);
    x.area.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 400, delay: 300, fill: 'both' });
  });
  write(formula, 900);
  const t0 = performance.now();
  for (;;) {
    const p = Math.min(1, (performance.now() - t0) / 1600);
    const e = 1 - Math.pow(1 - p, 3);
    for (const x of curves) {
      if (p > 0.35) {
        x.line.style.strokeDasharray = '';
        x.line.style.strokeDashoffset = '';
        const d = bell(3 - 2.4 * e);
        x.line.setAttribute('d', d);
        x.area.setAttribute('d', `${d}L200,40L0,40Z`);
      }
      x.val.textContent = `${num(x.d.e.mu * e, x.d.dp)} ${x.d.unit}`;
    }
    if (p >= 1) break;
    await wait(30);
  }
  await wait(900);

  // 4. Your dart: the whole catalogue, crossed off until one is left.
  const ranked = pool.map((v) => ({ v, cost: scoreVariant(f, v).cost })).sort((x, y) => x.cost - y.cost);
  const cells = Math.min(100, ranked.length);
  const winAt = 46;
  const palette = [INK, RED, GREEN, SUN, '#8fb3ff'];
  const minis = Array.from({ length: cells }, (_, i) => {
    const col = palette[(i * 7) % palette.length]!;
    return h(
      'div',
      { class: 'ad-mini' },
      s(
        'svg',
        { viewBox: '0 0 40 10' },
        s('line', { x1: 2, y1: 5, x2: 38, y2: 5, stroke: '#ffffff80' }),
        s('line', { x1: 11, y1: 5, x2: 23, y2: 5, stroke: col, 'stroke-width': '7px' }),
      ),
    );
  });
  const grid = h('div', { class: 'ad-grid' }, ...minis);
  const countN = h('b', null, String(ranked.length));
  const countWord = h('span', null, C.darts);
  const count = h('div', { class: 'ad-count' }, countN, countWord);
  const pick = h('div', { class: 'ad-pick' }, dartName(top.v));
  const pickNote = h('div', { class: 'ad-note ad-hand-note' }, C.pick);
  const search = h('div', { class: 'ad-scene' }, grid, count, pick);
  setStep(2);
  await slide(model, search, 320);
  const order = minis.map((_, i) => i).filter((i) => i !== winAt);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor((((i * 7919) % 104729) / 104729) * (i + 1));
    [order[i], order[j]] = [order[j]!, order[i]!];
  }
  const s0 = performance.now();
  let done = 0;
  while (done < order.length) {
    const p = Math.min(1, (performance.now() - s0) / 1500);
    const want = Math.round(order.length * p);
    for (; done < want; done++) minis[order[done]!]!.classList.add('x');
    countN.textContent = String(Math.max(1, Math.round(ranked.length - (ranked.length - 1) * p)));
    await wait(30);
  }
  countWord.textContent = C.dart;
  const winner = minis[winAt]!;
  winner.classList.add('win');
  winner.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.8)' }, { transform: 'scale(1.4)' }], {
    duration: 420,
    easing: POP,
    fill: 'forwards',
  });
  // "deze!" with an arrow at the winner.
  const wr = winner.getBoundingClientRect();
  const vw = innerWidth / 100;
  pickNote.style.cssText = `left:${(wr.left / vw - 30).toFixed(1)}vw;top:${(wr.top / vw - 22).toFixed(1)}vw;transform:rotate(-6deg)`;
  const pickArrow = arrow(
    'M10,10C40,10 70,30 85,85',
    'M68,78L85,85L88,66',
    `left:${(wr.left / vw - 12).toFixed(1)}vw;top:${(wr.top / vw - 13).toFixed(1)}vw;width:12vw;height:11vw`,
  );
  search.append(pickNote, pickArrow);
  write(pickNote, 300);
  pickArrow.style.opacity = '1';
  drawIn(pickArrow.querySelector('path') as SVGPathElement, 260, 150);
  show(pick, 300);
  await wait(1200);

  // The match: darts on the board and "83%".
  const match = h('div', { class: 'ad-scene ad-match' });
  const win = checkoutWin(top.m.total);
  const wordEl = win.el.querySelector('.bw-word');
  if (wordEl) wordEl.textContent = `${top.m.total}%`;
  match.append(win.el);
  await slide(search, match, 300);
  await wait(win.ms - 300);

  // 5. Your pro: their photo (or the player card), the name, the %.
  const pro = h('div', { class: 'ad-scene ad-pro' });
  const own = proPhoto(twin.id);
  const photo = window.__adPhoto ?? (own ? { src: own.file, credit: creditText(own) } : null);
  const like = h('div', { class: 'ad-like' }, C.like);
  const name = h('div', { class: 'ad-big ad-proname' }, twin.name);
  // Long names (Raymond van Barneveld) wrap: smaller, so the stack stays clear of the photo.
  if (twin.name.length > 14) name.style.fontSize = '11.5vw';
  const pct = h('div', { class: 'ad-pct' }, `${top.m.total}%`);
  let hero: HTMLElement;
  if (photo) {
    hero = h(
      'div',
      { class: 'ad-photo' },
      h('img', { src: photo.src, alt: '' }),
      photo.credit ? h('div', { class: 'ad-credit' }, photo.credit) : null,
    );
  } else {
    hero = proArt(twin) as unknown as HTMLElement;
    pro.style.justifyContent = 'center';
    pro.style.paddingBottom = '0';
  }
  pro.append(hero, like, name, pct);
  hero.style.opacity = '0';
  setStep(3);
  await slide(match, pro, 300);
  await hero.animate(
    [
      { transform: 'scale(.4) rotate(-14deg)', opacity: 0 },
      { transform: 'scale(1) rotate(-3deg)', opacity: 1 },
    ],
    { duration: 520, easing: POP, fill: 'forwards' },
  ).finished;
  write(like, 320);
  await wait(260);
  show(name, 380, 'translateY(6vw) scale(.7)');
  await wait(420);
  show(pct, 300, 'scale(.4)');
  await wait(1900);

  // 6. The ask, then the empty board again: the first frame, so the video loops.
  const cta = h('div', { class: 'ad-scene ad-cta' });
  const ask = h('div', { class: 'ad-big' }, C.cta);
  const url = h('div', { class: 'ad-url' }, 'findyourdarts.com');
  cta.append(ask, url);
  rail.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 250, fill: 'forwards' });
  await slide(pro, cta, 320);
  show(ask, 460, 'scale(.6) rotate(4deg)');
  await wait(520);
  show(url, 360);
  await wait(2000);
  await fade(cta, 0, 250);
  const back = h('div', { class: 'ad-scene ad-hook' }, boardSvg('ad-board bc-board'));
  ad.append(back);
  await fade(back, 1, 300);
  await wait(350);
  document.body.dataset.adPro = twin.name;
  document.body.dataset.adDone = '1';
}
