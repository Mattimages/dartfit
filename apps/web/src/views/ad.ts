/**
 * #/ad : a 9:16 motion ad (TikTok / Reels / Shorts), only in the demo build. Fast, about 23 s,
 * built from the site's own pieces so the viewer sees the real experience:
 *
 *   hook      "Verkeerde dart?": the questionnaire's realistic dart slams into the board and falls out
 *   hand      the hand scanned next to a pasje, two measurements
 *   vragen    the real questionnaire card tapped through: hold zone, fingers, knurling 1→5, live
 *   rekenen   the numbers fly into the model, three bell curves narrow
 *   dart      a wall of real dart photos knocked out down to one, then the darts on the board + %
 *   prof      the pro's real photo, then the film's last frame: photo, your ideal dart, three price
 *             classes with their real photos
 *   ask       "Welke prof ben jij?" + findyourdarts.com, then the empty board again (it loops)
 *
 * Playful but clean: the real board and darts in their own colours, soft round lines, three faces
 * (AdDisplay: Bricolage Grotesque for the big words, AdHand: Caveat for little notes, Geist for the
 * numbers; scripts/tiktok/ad.mjs injects the first two, the site never loads them) and a step rail
 * so the viewer keeps track. All numbers come from the real engine for one persona. The pro photo is
 * the renderer's window.__adPhoto, else the site's credited photo, else the player card.
 *
 *   #/ad?L=178&h=180&hold=rear&f=4&throw=flat&g=1      (hand length mm, height cm, answers)
 */
import { scoreVariant, type Answers, type Measurements, type Variant } from '@dartfit/engine';
import { h, s } from '../h';
import { getLang, num, t } from '../i18n';
import { createFit, variants } from '../api';
import { boardSvg } from '../draw/checkout';
import { handArt, templateHand } from '../draw/art';
import { proArt } from '../draw/pro-art';
import { creditText, proPhoto } from '../draw/pro-photo';
import { photoUrl } from '../media';
import { approxEur } from '../money';
import { castFor, checkoutWin, idealDartPaths } from './hero-scan';
import { quizDart } from './quiz-dart';
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
    steps: ['hand', 'vragen', 'rekenen', 'dart', 'prof'],
    hand: 'jouw hand',
    dims: ['gewicht', 'lengte', 'dikte'],
    darts: 'darts',
    dart: 'dart',
    pick: 'deze!',
    ideal: 'jouw ideale dart',
    tap: 'tik',
  },
  en: {
    hook: 'Wrong dart?',
    like: 'You throw like',
    cta: 'Which pro are you?',
    steps: ['hand', 'quiz', 'maths', 'dart', 'pro'],
    hand: 'your hand',
    dims: ['weight', 'length', 'thickness'],
    darts: 'darts',
    dart: 'dart',
    pick: 'this one!',
    ideal: 'your ideal dart',
    tap: 'tap',
  },
  de: {
    hook: 'Falscher Dart?',
    like: 'Du wirfst wie',
    cta: 'Welcher Profi bist du?',
    steps: ['Hand', 'Fragen', 'Mathe', 'Dart', 'Profi'],
    hand: 'deine Hand',
    dims: ['Gewicht', 'Länge', 'Dicke'],
    darts: 'Darts',
    dart: 'Dart',
    pick: 'der hier!',
    ideal: 'dein idealer Dart',
    tap: 'tipp',
  },
};

const NAVY = '#13233f';
const INK = '#fdf8ee';
const RED = '#ff4d5e';
const GREEN = '#3ee6a0';
const SUN = '#ffd166';
const HAND = 'AdHand,"Caveat","Segoe Print","Comic Sans MS",cursive';
const DISPLAY = 'AdDisplay,"Bricolage Grotesque","Geist Variable",system-ui,sans-serif';
const TIER_BG = { budget: '#0f9d63', standard: '#1f5fd6', premium: '#e3122c' } as const;
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
.ad-rail{position:absolute;top:5vh;left:5vw;right:5vw;display:grid;grid-template-columns:repeat(5,1fr);opacity:0;z-index:5}
.ad-step{position:relative;display:grid;justify-items:center;gap:1.4vw;color:#ffffff66;transition:color .25s}
.ad-step::before{content:"";position:absolute;top:2vw;left:-50%;right:50%;height:.7vw;border-radius:1vw;background:#ffffff26;z-index:-1}
.ad-step:first-child::before{display:none}
.ad-step i{display:block;width:4.6vw;height:4.6vw;border-radius:50%;background:${NAVY};box-shadow:inset 0 0 0 .7vw #ffffff40;transition:transform .3s cubic-bezier(.34,1.56,.64,1),background .25s,box-shadow .25s}
.ad-step span{font-family:${HAND};font-weight:700;font-size:6.2vw;line-height:1;white-space:nowrap}
.ad-step.done{color:#ffffffb0}
.ad-step.done::before,.ad-step.on::before{background:${GREEN}}
.ad-step.done i{background:${GREEN};box-shadow:none}
.ad-step.on{color:${INK}}
.ad-step.on i{background:${RED};box-shadow:0 0 0 1.4vw #ff4d5e40;transform:scale(1.25)}
.ad-hook .ad-big{position:absolute;top:15vh;left:4vw;right:4vw;font-size:17vw;transform:rotate(-3deg);opacity:0}
.ad-squig{position:absolute;top:calc(15vh + 34vw);left:18vw;width:64vw;height:6vw;overflow:visible}
.ad-squig path{fill:none;stroke:${RED};stroke-width:5;stroke-linecap:round;vector-effect:non-scaling-stroke}
.ad-board{position:absolute;left:50%;bottom:-30vw;width:96vw;height:96vw;margin-left:-48vw;overflow:visible;filter:drop-shadow(0 4vw 6vw #0008)}
.ad-fly{position:absolute;width:70vw;left:22vw;bottom:41vw;transform-origin:0% 50%;opacity:0;filter:drop-shadow(0 2vw 2.4vw #0007)}
.ad-fly .qd-path,.ad-fly .qd-hold{display:none}
.ad-flash{position:absolute;inset:0;background:#fff;opacity:0;pointer-events:none}
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
.ad-quiz{gap:6vw;padding-top:6vh}
.ad-q{font-size:11vw;min-height:12vw;padding:0 5vw}
.ad .ad-quiz .qd{position:relative;top:auto;width:92vw;padding:5vw 4vw 3vw;border-radius:6vw;overflow:hidden;box-shadow:0 5vw 12vw #0009,inset 0 0 0 .3vw #ffffff1c}
.ad-quiz .qd-svg{transform-origin:40% 52%}
.ad-opts{display:flex;gap:2.6vw;justify-content:center;flex-wrap:wrap;width:92vw;min-height:15vw}
.ad-opt{position:relative;min-width:14vw;padding:2.6vw 4.6vw;border-radius:9vw;background:#ffffff14;box-shadow:inset 0 0 0 .4vw #ffffff30;font-weight:650;font-size:6.2vw;letter-spacing:-.02em;text-align:center;transition:background .18s,color .18s,transform .18s}
.ad-opt.on{background:${RED};box-shadow:none;transform:scale(1.08)}
.ad-tapdot{position:absolute;left:50%;top:50%;width:10vw;height:10vw;margin:-5vw 0 0 -5vw;border-radius:50%;background:#fff;opacity:0;pointer-events:none}
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
.ad-wall{display:grid;grid-template-columns:repeat(4,1fr);gap:2.4vw;width:90vw;margin-top:9vh}
.ad-tile{position:relative;aspect-ratio:1;border-radius:4vw;background:#edf2f9;overflow:hidden;box-shadow:0 1.6vw 4vw #0006;transition:opacity .2s,transform .2s,filter .2s}
.ad-tile img{position:absolute;inset:6%;width:88%;height:88%;object-fit:contain}
.ad-tile.x{opacity:.28;transform:scale(.86);filter:grayscale(1)}
.ad-tile.x::after{content:"✕";position:absolute;inset:0;display:grid;place-items:center;font-family:${DISPLAY};font-weight:800;font-size:16vw;color:${RED};filter:none}
.ad-tile.win{box-shadow:0 0 0 1.2vw ${GREEN},0 0 8vw ${GREEN}}
.ad-count{margin-top:5vw;display:flex;align-items:baseline;gap:2.6vw}
.ad-count b{font-family:${DISPLAY};font-weight:800;font-size:20vw;letter-spacing:-.04em;line-height:1;font-variant-numeric:tabular-nums;color:${INK}}
.ad-count span{font-family:${HAND};font-weight:700;font-size:9vw;color:#ffffffb0}
.ad-hero{position:absolute;left:14vw;right:14vw;top:24vh;aspect-ratio:1;border-radius:7vw;background:#edf2f9;box-shadow:0 0 0 1.4vw ${GREEN},0 6vw 14vw #000a;opacity:0}
.ad-hero img{position:absolute;inset:6%;width:88%;height:88%;object-fit:contain}
.ad-heroname{position:absolute;left:5vw;right:5vw;top:calc(24vh + 82vw);font-size:9vw;font-weight:650;letter-spacing:-.03em;text-align:center;opacity:0}
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
.ad-final{justify-content:flex-start;padding:12.5vh 4vw 0;gap:2.4vw}
.ad-banner{position:relative;width:92vw;height:26vh;border-radius:5vw;overflow:hidden;box-shadow:0 0 0 1vw ${INK},0 4vw 10vw #0009;background:#1d3762}
.ad-banner img{width:100%;height:100%;object-fit:cover;object-position:50% 22%}
.ad-banner p{position:absolute;left:3vw;bottom:3vw;margin:0;padding:1.6vw 3.6vw;border-radius:9vw;background:#0a121fd0;font-weight:600;font-size:5.4vw;white-space:nowrap}
.ad-banner p b{font-weight:700}
.ad-ideal{width:92vw;display:grid;justify-items:start;margin-top:1vw}
.ad-ideal span{font-family:${HAND};font-weight:700;font-size:7vw;color:${SUN};margin-left:4vw;line-height:1}
.ad-ideal svg{width:92vw;height:auto;overflow:visible}
.ad-pcard{display:grid;grid-template-columns:17vw minmax(0,1fr) auto;align-items:center;gap:3.4vw;width:92vw;padding:2vw 4vw 2vw 2vw;border-radius:5vw;background:#fff;color:${NAVY};box-shadow:0 3vw 8vw #0008;opacity:0}
.ad-pcard.best{box-shadow:0 0 0 1vw ${GREEN},0 3vw 8vw #0008}
.ad-pcard .ph{position:relative;width:17vw;aspect-ratio:1;border-radius:3.4vw;background:#edf2f9;overflow:hidden}
.ad-pcard .ph img{position:absolute;inset:6%;width:88%;height:88%;object-fit:contain}
.ad-pcard div{display:grid;gap:.6vw;min-width:0}
.ad-pcard em{justify-self:start;padding:.6vw 2.6vw;border-radius:9vw;color:#fff;font-style:normal;font-weight:600;font-size:3.6vw}
.ad-pcard b{font-weight:650;font-size:5vw;letter-spacing:-.02em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ad-pcard small{font-size:4vw;color:#5b6b82}
.ad-pcard strong{font-family:${DISPLAY};font-weight:800;font-size:10vw;letter-spacing:-.03em;color:#0a8f5a}
.ad-cta .ad-big{font-size:15vw;padding:0 6vw;opacity:0}
.ad-url{margin-top:9vw;padding:2.4vw 6vw;border-radius:9vw;background:${INK};color:${NAVY};font-weight:650;font-size:7.4vw;letter-spacing:-.03em;opacity:0;box-shadow:0 2vw 6vw #0006}
`;

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const EASE_OUT = 'cubic-bezier(0.2, 0.8, 0.2, 1)';
const POP = 'cubic-bezier(0.34, 1.56, 0.64, 1)';
const show = (el: Element, ms = 260, from = 'translateY(4vw) scale(.9)', to = 'none') =>
  el.animate(
    [
      { opacity: 0, transform: from },
      { opacity: 1, transform: to },
    ],
    { duration: ms, easing: POP, fill: 'forwards' },
  );
/** Handwriting appearing: a left-to-right reveal. */
const write = (el: Element, ms = 400) =>
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
/** A hand-drawn arrow (a gentle curve with a head). */
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
/** A dart's product photo on a light tile, or null when it has none. */
const photoOf = (v: Variant) => {
  const src = photoUrl(v.modelId, 400);
  // Only photos bundled into the page: the renderer has no network.
  return src && !/^https?:/.test(src) ? src : null;
};

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
  const slide = async (from: HTMLElement, to: HTMLElement, ms = 260) => {
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
  const punch = (el: Element, k = 1.06, ms = 220) =>
    el.animate([{ transform: 'scale(1)' }, { transform: `scale(${k})` }, { transform: 'scale(1)' }], {
      duration: ms,
      easing: EASE_OUT,
    });

  // The step rail: where we are in the story.
  const steps = C.steps.map((label) => h('div', { class: 'ad-step' }, h('i'), h('span', null, label)));
  const rail = h('div', { class: 'ad-rail' }, ...steps);
  ad.append(rail);
  const setStep = (i: number) =>
    steps.forEach((el, j) => {
      el.classList.toggle('done', j < i);
      el.classList.toggle('on', j === i);
    });

  // ── 1. Hook: the empty board (the loop's first frame), "Verkeerde dart?", and the realistic
  //       dart from the questionnaire slams in, shudders, and falls out.
  const hook = h('div', { class: 'ad-scene ad-hook' });
  const word = h('div', { class: 'ad-big' }, C.hook);
  const squig = s(
    'svg',
    { class: 'ad-squig', viewBox: '0 0 100 10', preserveAspectRatio: 'none' },
    s('path', { d: 'M2,6C12,1 18,10 28,5S44,1 54,6S70,10 80,5S94,2 98,5' }),
  );
  const flyDart = quizDart();
  flyDart.update({ ...a, hold: 'middle', gripFeel: 3 }, null);
  const fly = h('div', { class: 'ad-fly' }, flyDart.el.querySelector('svg')!);
  const flash = h('div', { class: 'ad-flash' });
  hook.append(boardSvg('ad-board bc-board'), word, squig, fly, flash);
  ad.append(hook);
  hook.style.opacity = '1';
  const sq = squig.querySelector('path') as SVGPathElement;
  sq.style.strokeDasharray = '400';
  sq.style.strokeDashoffset = '400';
  await wait(250);
  show(word, 300, 'rotate(-3deg) scale(1.6)', 'rotate(-3deg)');
  drawIn(sq, 260, 180);
  await wait(320);
  fly.style.opacity = '1';
  await fly.animate(
    [{ transform: 'translate(70vw, -40vw) rotate(-16deg)' }, { transform: 'translate(0, 0) rotate(26deg)' }],
    { duration: 240, easing: 'cubic-bezier(0.5, 0, 0.9, 0.6)', fill: 'forwards' },
  ).finished;
  // Impact: a flash and a jolt.
  flash.animate([{ opacity: 0.35 }, { opacity: 0 }], { duration: 160 });
  hook.animate(
    [
      { transform: 'translate(0,0)' },
      { transform: 'translate(-1.6vw,1vw)' },
      { transform: 'translate(1.2vw,-.6vw)' },
      { transform: 'translate(0,0)' },
    ],
    { duration: 200 },
  );
  await fly.animate(
    [
      { transform: 'rotate(26deg)' },
      { transform: 'rotate(33deg)' },
      { transform: 'rotate(21deg)' },
      { transform: 'rotate(27deg)' },
    ],
    { duration: 340, fill: 'forwards' },
  ).finished;
  await fly.animate(
    [
      { transform: 'rotate(27deg)' },
      { transform: 'translate(4vw, 6vw) rotate(62deg)', offset: 0.25 },
      { transform: 'translate(10vw, 130vw) rotate(170deg)' },
    ],
    { duration: 560, easing: 'cubic-bezier(0.5, 0, 0.9, 0.5)', fill: 'forwards' },
  ).finished;

  // ── 2. Your hand: scanned next to the pasje, then the two measurements.
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
  const noteArrow = arrow(
    'M10,10C30,20 50,40 70,80',
    'M52,74L70,80L72,62',
    'left:6vw;top:6vw;width:12vw;height:14vw',
  );
  const box = h('div', { class: 'ad-handbox' }, hand, bar, card, dimL, dimW, pillL, pillW, note, noteArrow);
  scan.append(box);
  rail.style.opacity = '1';
  setStep(0);
  rail.animate(
    [
      { opacity: 0, transform: 'translateY(-4vw)' },
      { opacity: 1, transform: 'none' },
    ],
    {
      duration: 260,
      easing: EASE_OUT,
    },
  );
  hand.style.clipPath = 'inset(100% 0 0 0)';
  for (const d of [dimL, dimW]) {
    const p = d.querySelector('path') as SVGPathElement;
    p.style.strokeDasharray = '1000';
    p.style.strokeDashoffset = '1000';
  }
  await slide(hook, scan, 240);
  hand.animate([{ clipPath: 'inset(100% 0 0 0)' }, { clipPath: 'inset(0 0 0 0)' }], {
    duration: 650,
    easing: 'ease-in-out',
    fill: 'forwards',
  });
  bar.animate(
    [
      { top: '100%', opacity: 1 },
      { top: '0%', opacity: 1, offset: 0.92 },
      { top: '0%', opacity: 0 },
    ],
    { duration: 720, easing: 'ease-in-out', fill: 'forwards' },
  );
  [...hand.querySelectorAll<SVGElement>('.hand-dot')].forEach((d, i) =>
    d.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 100, delay: 500 + i * 18, fill: 'both' }),
  );
  await wait(380);
  show(card, 240, 'rotate(-9deg) translateY(8vw)', 'rotate(-9deg)');
  write(note, 280);
  drawIn(noteArrow.querySelector('path') as SVGPathElement, 240, 150);
  noteArrow.style.opacity = '1';
  await wait(420);
  for (const [dim, label] of [
    [dimL, pillL],
    [dimW, pillW],
  ] as const) {
    drawIn(dim.querySelector('path')!, 260);
    await wait(160);
    show(label, 240);
    await wait(180);
  }
  await wait(380);

  // ── 3. The questions: the real questionnaire card, tapped through. The dart follows every
  //       answer: the hold zone moves, the finger pads change, the knurling cuts deeper.
  const quiz = h('div', { class: 'ad-scene ad-quiz' });
  const qTitle = h('div', { class: 'ad-big ad-q' });
  const live = quizDart();
  let cur: Answers = { ...a, hold: 'middle', fingers: 3, gripFeel: 1 };
  live.update(cur, 'hold');
  const opts = h('div', { class: 'ad-opts' });
  quiz.append(qTitle, live.el, opts);
  setStep(1);
  await slide(scan, quiz, 240);
  type Beat = {
    title: string;
    focus: 'hold' | 'fingers' | 'gripFeel';
    options: Array<{ label: string; set: Partial<Answers> }>;
    taps: number[];
  };
  const holds: Answers['hold'][] = ['front', 'middle', 'rear'];
  const holdTaps = [holds.indexOf(a.hold) === 0 ? 2 : 0, holds.indexOf(a.hold)];
  const beats: Beat[] = [
    {
      title: t('q.hold'),
      focus: 'hold',
      options: holds.map((x) => ({ label: t(`q.hold.${x}`), set: { hold: x } })),
      taps: holdTaps,
    },
    {
      title: t('q.fingers'),
      focus: 'fingers',
      options: [2, 3, 4, 5].map((x) => ({ label: String(x), set: { fingers: x as Answers['fingers'] } })),
      taps: [a.fingers === 2 ? 2 : 0, [2, 3, 4, 5].indexOf(a.fingers)],
    },
    {
      title: t('q.grip'),
      focus: 'gripFeel',
      options: [1, 2, 3, 4, 5].map((x) => ({
        label: String(x),
        set: { gripFeel: x as Answers['gripFeel'] },
      })),
      // Run the knurling up through every cut, then settle on the answer.
      taps: [1, 2, 3, 4, a.gripFeel - 1],
    },
  ];
  for (const [bi, beat] of beats.entries()) {
    qTitle.textContent = beat.title;
    show(qTitle, 220, 'translateY(-3vw) scale(.92)');
    const pills = beat.options.map((o) => h('div', { class: 'ad-opt' }, o.label));
    opts.replaceChildren(...pills);
    pills.forEach((p, i) =>
      p.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 160, delay: i * 30, fill: 'both' }),
    );
    live.update(cur, beat.focus);
    // The camera leans in on the barrel, closest for the knurling.
    const zoom = beat.focus === 'gripFeel' ? 1.9 : 1.35;
    live.el
      .querySelector('svg')!
      .animate([{ transform: `scale(${bi ? 1.35 : 1})` }, { transform: `scale(${zoom})` }], {
        duration: 360,
        easing: EASE_OUT,
        fill: 'forwards',
      });
    await wait(260);
    for (const [ti, idx] of beat.taps.entries()) {
      const pill = pills[idx]!;
      pills.forEach((p) => p.classList.toggle('on', p === pill));
      const dot = h('i', { class: 'ad-tapdot' });
      pill.append(dot);
      dot.animate(
        [
          { opacity: 0.55, transform: 'scale(.3)' },
          { opacity: 0, transform: 'scale(2.2)' },
        ],
        { duration: 320, easing: EASE_OUT, fill: 'forwards' },
      );
      cur = { ...cur, ...beat.options[idx]!.set };
      live.update(cur, beat.focus);
      await wait(beat.focus === 'gripFeel' && ti < beat.taps.length - 1 ? 220 : 380);
    }
    if (bi < beats.length - 1) await fade(qTitle, 0, 100);
  }
  await wait(260);

  // ── 4. The maths: every number flies into the model, and out come three bell curves.
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
  setStep(2);
  await slide(quiz, core, 240);
  ring.animate([{ transform: 'rotate(0) scale(.6)' }, { transform: 'rotate(240deg) scale(1)' }], {
    duration: 1400,
    easing: EASE_OUT,
    fill: 'forwards',
  });
  for (const el of chips) {
    show(el, 180, 'translate(-50%,-50%) scale(.3)', 'translate(-50%,-50%)');
    await wait(70);
  }
  await wait(180);
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
          { duration: 420, delay: i * 30, easing: 'cubic-bezier(0.6, 0, 0.9, 0.4)', fill: 'forwards' },
        ).finished,
    ),
  );
  glow.animate(
    [
      { opacity: 0.2, transform: 'scale(1)' },
      { opacity: 1, transform: 'scale(2.4)' },
    ],
    { duration: 260, easing: EASE_OUT, fill: 'forwards' },
  );
  await ring.animate(
    [{ transform: 'rotate(240deg) scale(1)' }, { transform: 'rotate(300deg) scale(1.15)' }],
    {
      duration: 260,
      fill: 'forwards',
    },
  ).finished;

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
  await slide(core, model, 220);
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
    drawIn(x.line, 380, i * 70);
    x.area.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300, delay: 220, fill: 'both' });
  });
  write(formula, 700);
  const t0 = performance.now();
  for (;;) {
    const p = Math.min(1, (performance.now() - t0) / 1200);
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
  curves.forEach((x) => punch(x.val, 1.12));
  await wait(560);

  // ── 5. The catalogue as a wall of real darts, knocked out until one is left, which comes
  //       forward big.
  const ranked = pool.map((v) => ({ v, cost: scoreVariant(f, v).cost })).sort((x, y) => x.cost - y.cost);
  const seen = new Set<string>([top.v.modelId]);
  const others = ranked
    .filter((x) => photoOf(x.v) && !seen.has(x.v.modelId) && seen.add(x.v.modelId))
    .map((x) => x.v);
  // Spread the field: the near misses and the long shots, not just the top of the list.
  const field = Array.from({ length: 15 }, (_, i) => others[Math.floor((i * others.length) / 15)]!).filter(
    Boolean,
  );
  const winAt = 9;
  const wallDarts: Variant[] = [...field.slice(0, winAt), top.v, ...field.slice(winAt)].slice(0, 16);
  const tiles = wallDarts.map((v) => {
    const src = photoOf(v);
    return h('div', { class: 'ad-tile' }, src ? h('img', { src, alt: '' }) : null);
  });
  const wall = h('div', { class: 'ad-wall' }, ...tiles);
  const countN = h('b', null, String(ranked.length));
  const countWord = h('span', null, C.darts);
  const count = h('div', { class: 'ad-count' }, countN, countWord);
  const search = h('div', { class: 'ad-scene' }, wall, count);
  setStep(3);
  await slide(model, search, 240);
  tiles.forEach((tl, i) =>
    tl.animate(
      [
        { opacity: 0, transform: 'scale(.6)' },
        { opacity: 1, transform: 'none' },
      ],
      {
        duration: 220,
        delay: i * 22,
        easing: POP,
        fill: 'backwards',
      },
    ),
  );
  await wait(420);
  const order = tiles.map((_, i) => i).filter((i) => i !== winAt);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor((((i * 7919) % 104729) / 104729) * (i + 1));
    [order[i], order[j]] = [order[j]!, order[i]!];
  }
  // Knocked out one by one, faster and faster, the counter racing down with them.
  for (const [i, idx] of order.entries()) {
    tiles[idx]!.classList.add('x');
    countN.textContent = String(
      Math.max(2, Math.round(ranked.length - ((ranked.length - 1) * (i + 1)) / order.length)),
    );
    await wait(Math.max(40, 150 - i * 9));
  }
  countN.textContent = '1';
  countWord.textContent = C.dart;
  punch(count, 1.15, 260);
  const winTile = tiles[winAt]!;
  winTile.classList.add('win');
  punch(winTile, 1.12, 260);
  await wait(320);
  // The winner comes forward, big, with its name.
  const heroSrc = photoOf(top.v);
  const heroTile = h('div', { class: 'ad-hero' }, heroSrc ? h('img', { src: heroSrc, alt: '' }) : null);
  const heroName = h('div', { class: 'ad-heroname' }, dartName(top.v));
  const pickNote = h('div', { class: 'ad-note ad-hand-note' }, C.pick);
  pickNote.style.cssText = 'left:8vw;top:calc(24vh - 13vw);transform:rotate(-8deg)';
  search.append(heroTile, heroName, pickNote);
  const wr = winTile.getBoundingClientRect();
  const hr = { left: innerWidth * 0.14, top: innerHeight * 0.24, w: innerWidth * 0.72 };
  wall.animate([{ opacity: 1 }, { opacity: 0.15 }], { duration: 260, fill: 'forwards' });
  count.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 200, fill: 'forwards' });
  await heroTile.animate(
    [
      {
        opacity: 1,
        transform: `translate(${wr.left - hr.left}px, ${wr.top - hr.top}px) scale(${wr.width / hr.w})`,
        transformOrigin: '0 0',
      },
      { opacity: 1, transform: 'none', transformOrigin: '0 0' },
    ],
    { duration: 360, easing: POP, fill: 'forwards' },
  ).finished;
  show(heroName, 260);
  write(pickNote, 260);
  await wait(750);

  // The match: darts on the board and the %.
  const match = h('div', { class: 'ad-scene ad-match' });
  const win = checkoutWin(top.m.total);
  const wordEl = win.el.querySelector('.bw-word');
  if (wordEl) wordEl.textContent = `${top.m.total}%`;
  match.append(win.el);
  await slide(search, match, 220);
  await wait(win.ms - 500);

  // ── 6. The pro: their real photo, the name, the %.
  const pro = h('div', { class: 'ad-scene ad-pro' });
  const own = proPhoto(twin.id);
  const photo = window.__adPhoto ?? (own ? { src: own.file, credit: creditText(own) } : null);
  const like = h('div', { class: 'ad-like' }, C.like);
  const name = h('div', { class: 'ad-big ad-proname' }, twin.name);
  // Long names (Raymond van Barneveld) wrap: smaller, so the stack stays clear of the photo.
  if (twin.name.length > 14) name.style.fontSize = '11.5vw';
  const pct = h('div', { class: 'ad-pct' }, `${top.m.total}%`);
  const hero = photo
    ? h(
        'div',
        { class: 'ad-photo' },
        h('img', { src: photo.src, alt: '' }),
        photo.credit ? h('div', { class: 'ad-credit' }, photo.credit) : null,
      )
    : (proArt(twin) as unknown as HTMLElement);
  if (!photo) {
    pro.style.justifyContent = 'center';
    pro.style.paddingBottom = '0';
  }
  pro.append(hero, like, name, pct);
  hero.style.opacity = '0';
  setStep(4);
  await slide(match, pro, 220);
  flash.remove();
  await hero.animate(
    [
      { transform: 'scale(.4) rotate(-14deg)', opacity: 0 },
      { transform: 'scale(1) rotate(-3deg)', opacity: 1 },
    ],
    { duration: 420, easing: POP, fill: 'forwards' },
  ).finished;
  write(like, 260);
  await wait(200);
  show(name, 320, 'translateY(6vw) scale(.7)');
  await wait(320);
  show(pct, 260, 'scale(.4)');
  await wait(900);

  // ── 7. The film's last frame: the pro up top, your ideal dart, your three price classes.
  const final = h('div', { class: 'ad-scene ad-final' });
  const banner = h(
    'div',
    { class: 'ad-banner' },
    photo ? h('img', { src: photo.src, alt: '' }) : proArt(twin),
    h('p', null, `${C.like}: `, h('b', null, twin.name)),
  );
  const dp = idealDartPaths(c.ideal);
  const idealSvg = s(
    'svg',
    { viewBox: '0 30 320 46' },
    s('path', { d: dp.point, fill: '#b8c0cc' }),
    s('path', { d: dp.shaft, fill: '#50627d' }),
    s('path', { d: dp.barrel, fill: '#2ee59d4d', stroke: '#2ee59d', 'stroke-width': 1.6 }),
  );
  const ideal = h('div', { class: 'ad-ideal' }, h('span', null, C.ideal), idealSvg);
  const pcards = c.options.slice(0, 3).map((o) => {
    const src = photoOf(o.v);
    const eur = o.v.priceUsd ? approxEur(o.v.priceUsd) : null;
    const tier = h('em', null, t(`land.tier.${o.tier}`));
    tier.style.background = TIER_BG[o.tier];
    return h(
      'div',
      { class: `ad-pcard${o.best ? ' best' : ''}` },
      h('span', { class: 'ph' }, src ? h('img', { src, alt: '' }) : null),
      h(
        'div',
        null,
        tier,
        h('b', null, dartName(o.v)),
        h('small', null, `${num(o.v.weightG)} g${eur ? ` · €${eur}` : ''}`),
      ),
      h('strong', null, `${o.m.total}%`),
    );
  });
  final.append(banner, ideal, ...pcards);
  ideal.style.opacity = '0';
  await slide(pro, final, 240);
  show(ideal, 260, 'translateX(-10vw)');
  await wait(200);
  for (const pc of pcards) {
    show(pc, 300, 'translateY(10vw) scale(.94)');
    await wait(230);
  }
  await wait(1150);

  // ── 8. The ask, then the empty board again: the first frame, so the video loops.
  const cta = h('div', { class: 'ad-scene ad-cta' });
  const ask = h('div', { class: 'ad-big' }, C.cta);
  const url = h('div', { class: 'ad-url' }, 'findyourdarts.com');
  cta.append(ask, url);
  rail.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 220, fill: 'forwards' });
  await slide(final, cta, 260);
  show(ask, 380, 'scale(.6) rotate(4deg)');
  await wait(420);
  show(url, 300);
  punch(url, 1.08, 300);
  await wait(1400);
  await fade(cta, 0, 220);
  const back = h('div', { class: 'ad-scene ad-hook' }, boardSvg('ad-board bc-board'));
  ad.append(back);
  await fade(back, 1, 260);
  await wait(300);
  document.body.dataset.adPro = twin.name;
  document.body.dataset.adDone = '1';
}
