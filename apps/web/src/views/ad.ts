/**
 * #/ad : a 9:16 motion ad (TikTok / Reels / Shorts), only in the demo build. About 21 s, cut for
 * a feed: motion in the first frame, the promise inside two seconds, one big caption per beat (it
 * is watched muted), everything that matters inside the apps' safe area (top 12%, bottom 22% and
 * the right edge stay free for their buttons), and a pay-off that answers the hook.
 *
 *   0.0  hook      a dart thuds into the board, "Verkeerde dart?", and it drops out
 *   1.4  promise   pro faces spinning in a ring: "Welke prof ben jij?"
 *   3.2  hand      "Scan je hand": the hand next to a pasje, two measurements
 *   5.6  vragen    "3 vragen": the real questionnaire dart, tapped; the knurling cuts deeper
 *   8.2  rekenen   the numbers fly into the model; three bell curves narrow
 *  11.0  match     darts land on the board, the % (how close the pro's dart is to your fit)
 *  12.6  prof      the ring of faces spins again, slows, and lands: "Je gooit als …"
 *  15.0  dart      "312 darts" counts down to "1 dart" over a wall of real product photos
 *  17.6  result    the site's final frame: pro, ideal dart, three price classes
 *  19.4  ask       "Welke prof ben jij?" findyourdarts.com, then the empty board (it loops)
 *
 * Built from the site's own pieces (board, questionnaire dart, product photos, credited pro
 * photos), numbers from the real engine for one persona. Three faces: AdDisplay (Bricolage
 * Grotesque) for captions, AdHand (Caveat) for the odd note, Geist for numbers;
 * scripts/tiktok/ad.mjs injects the first two and adds the sound from the cues logged here
 * (window.__adCues). No DartFit wordmark.
 *
 *   #/ad?L=178&h=180&hold=rear&f=4&throw=flat&g=1      (hand length mm, height cm, answers)
 */
import { scoreVariant, type Answers, type Measurements, type Variant } from '@dartfit/engine';
import { proPhotos } from 'virtual:dartfit-catalogue';
import { h, s } from '../h';
import { getLang, num, t } from '../i18n';
import { createFit, pros, variants } from '../api';
import { boardSvg } from '../draw/checkout';
import { handArt, templateHand } from '../draw/art';
import { proArtUrl } from '../draw/pro-art';
import { creditText } from '../draw/pro-photo';
import { photoUrl } from '../media';
import { approxEur } from '../money';
import { castFor, checkoutWin, idealDartPaths } from './hero-scan';
import { quizDart } from './quiz-dart';
import { matchPct, variantArt } from '../score';
import { dartName } from './words';

declare global {
  interface Window {
    __adPhoto?: { src: string; credit: string };
    __adCues?: Array<{ t: number; k: string }>;
  }
}

const COPY = {
  nl: {
    hook: 'Verkeerde dart?',
    promise: 'Welke prof ben jij?',
    scan: 'Scan je hand',
    quiz: '3 vragen',
    maths: 'Wij rekenen',
    darts: 'darts',
    dart: 'dart',
    like: 'Je gooit als',
    free: 'gratis · 1 minuut',
    dims: ['gewicht', 'lengte', 'dikte'],
    ideal: 'jouw ideale dart',
    photos: 'Foto’s',
  },
  en: {
    hook: 'Wrong dart?',
    promise: 'Which pro are you?',
    scan: 'Scan your hand',
    quiz: '3 questions',
    maths: 'We do the maths',
    darts: 'darts',
    dart: 'dart',
    like: 'You throw like',
    free: 'free · 1 minute',
    dims: ['weight', 'length', 'thickness'],
    ideal: 'your ideal dart',
    photos: 'Photos',
  },
  de: {
    hook: 'Falscher Dart?',
    promise: 'Welcher Profi bist du?',
    scan: 'Scan deine Hand',
    quiz: '3 Fragen',
    maths: 'Wir rechnen',
    darts: 'Darts',
    dart: 'Dart',
    like: 'Du wirfst wie',
    free: 'gratis · 1 Minute',
    dims: ['Gewicht', 'Länge', 'Dicke'],
    ideal: 'dein idealer Dart',
    photos: 'Fotos',
  },
};

const NAVY = '#0f1d36';
const INK = '#fdf8ee';
const RED = '#ff4d5e';
const GREEN = '#3ee6a0';
const SUN = '#ffd166';
const HAND = 'AdHand,"Caveat","Segoe Print","Comic Sans MS",cursive';
const DISPLAY = 'AdDisplay,"Bricolage Grotesque","Geist Variable",system-ui,sans-serif';
const TIER_BG = { budget: '#0f9d63', standard: '#1f5fd6', premium: '#e3122c' } as const;
/** Faces for the ring, best known first. */
const FACES = [
  'vangerwen',
  'littler',
  'vanbarneveld',
  'humphries',
  'price',
  'wright',
  'anderson',
  'bunting',
  'aspinall',
  'smith',
  'cross',
  'taylor',
];
// Layout: 1vh = 1.78vw in 9:16. Safe area: 12vh … 78vh. Captions sit at 13vh, the stage below.
const CSS = `
.ad{position:fixed;inset:0;z-index:2147483000;overflow:hidden;color:${INK};
  font-family:"Geist Variable",system-ui,sans-serif;
  background:
    radial-gradient(90vw 70vh at 50% 46%,#24457a 0,#16294a 45%,transparent 75%),
    ${NAVY}}
.ad::after{content:"";position:absolute;inset:0;pointer-events:none;
  background:radial-gradient(120vw 90vh at 50% 45%,transparent 55%,#060c18cc 100%)}
.ad *{box-sizing:border-box}
.ad-scene{position:absolute;inset:0;opacity:0}
.ad-stage{position:absolute;left:0;right:0;top:25vh;height:52vh;display:flex;flex-direction:column;align-items:center;justify-content:center}
.ad-note{font-family:${HAND};font-weight:700}
.ad-prog{position:absolute;z-index:6;top:10.6vh;left:8vw;right:8vw;display:grid;grid-template-columns:repeat(5,1fr);gap:1.6vw;opacity:0}
.ad-prog i{height:1vw;border-radius:1vw;background:#ffffff2e;overflow:hidden}
.ad-prog i::after{content:"";display:block;height:100%;width:0;background:${INK};border-radius:1vw;transition:width .35s ease-out}
.ad-prog i.on::after{width:100%}
.ad-cap{position:absolute;z-index:6;left:6vw;right:6vw;top:13.2vh;height:11vh;display:grid;place-items:center;
  font-family:${DISPLAY};font-weight:800;font-size:13.5vw;letter-spacing:-.03em;line-height:.9;text-align:center;
  text-shadow:0 1vw 5vw #0009;opacity:0}
.ad-cap.hook{font-size:17vw;top:14vh}
.ad-cap b{font-weight:800;color:${GREEN};font-variant-numeric:tabular-nums}
.ad-squig{position:absolute;z-index:6;top:calc(14vh + 21vw + 5.5vh);left:20vw;width:60vw;height:6vw;overflow:visible}
.ad-squig path{fill:none;stroke:${RED};stroke-width:5;stroke-linecap:round;vector-effect:non-scaling-stroke}
.ad-board{position:absolute;left:50%;top:35vh;width:104vw;height:104vw;margin-left:-52vw;overflow:visible;filter:drop-shadow(0 4vw 7vw #000a)}
.ad-fly{position:absolute;width:86vw;left:33vw;top:calc(35vh + 21vw);transform-origin:0% 50%;opacity:0;filter:drop-shadow(0 2vw 2.4vw #0008)}
.ad-fly .qd-path,.ad-fly .qd-hold{display:none}
.ad-flash{position:absolute;inset:0;z-index:7;background:#fff;opacity:0;pointer-events:none}
.ad-ring{position:relative;width:62vw;aspect-ratio:1;border-radius:50%;background:#1d3762;
  box-shadow:0 0 0 1.4vw ${INK},0 0 0 3.2vw #ffffff1f,0 6vw 14vw #000a}
.ad-ring img{position:absolute;inset:0;width:100%;height:100%;border-radius:50%;object-fit:cover;object-position:50% 18%;opacity:0}
.ad-ring img.on{opacity:1}
.ad-ring.lock{box-shadow:0 0 0 1.6vw ${GREEN},0 0 0 4vw #3ee6a033,0 0 14vw #3ee6a0aa,0 6vw 14vw #000a}
.ad-qm{position:absolute;right:-3vw;top:-3vw;width:17vw;height:17vw;border-radius:50%;display:grid;place-items:center;
  background:${RED};font-family:${DISPLAY};font-weight:800;font-size:12vw;box-shadow:0 2vw 5vw #0008;transform:rotate(10deg)}
.ad-name{margin-top:4.5vw;min-height:15vw;font-family:${DISPLAY};font-weight:800;font-size:12.5vw;letter-spacing:-.03em;line-height:.92;text-align:center;padding:0 5vw;opacity:0}
.ad-pct{margin-top:3vw;padding:1.4vw 5vw;border-radius:9vw;background:${GREEN};color:${NAVY};font-family:${DISPLAY};font-weight:800;font-size:9vw;letter-spacing:-.03em;opacity:0}
.ad-credit{position:absolute;z-index:6;left:8vw;right:8vw;top:81vh;font-weight:500;font-size:2.3vw;line-height:1.25;color:#ffffff8c;text-align:center;opacity:0}
.ad-handbox{position:relative;width:60vw;height:82vw;
  --skin:#e3b896;--skin-hi:#f3d5be;--skin-shade:#b9805e;--nail:#f4dbd1}
.ad-handbox svg.hand{position:absolute;inset:0;width:100%;height:100%;filter:drop-shadow(0 3vw 4vw #0007)}
.ad-handbox .hand-dot{fill:${GREEN}}
.ad-scanbar{position:absolute;left:-8vw;right:-8vw;height:1.2vw;border-radius:1vw;background:${GREEN};box-shadow:0 0 5vw 1.6vw #3ee6a099;opacity:0}
.ad-dim{position:absolute;overflow:visible}
.ad-dim path{stroke:${SUN};stroke-width:3.4px;vector-effect:non-scaling-stroke;fill:none;stroke-linecap:round;stroke-linejoin:round}
.ad-pill{position:absolute;padding:1.2vw 3.2vw;border-radius:9vw;background:${INK};color:${NAVY};font-weight:650;font-size:7vw;letter-spacing:-.03em;font-variant-numeric:tabular-nums;white-space:nowrap;opacity:0;box-shadow:0 1.6vw 4vw #0007}
.ad-card{position:absolute;right:-13vw;bottom:0;width:30vw;aspect-ratio:85.6/54;border-radius:2.6vw;
  background:linear-gradient(135deg,#4f7cff,#7a4dff);box-shadow:0 2vw 5vw #0008,inset 0 0 0 .4vw #ffffff40;transform:rotate(-9deg);opacity:0}
.ad-card::before{content:"";position:absolute;left:3vw;top:4vw;width:6vw;height:4.4vw;border-radius:1vw;background:linear-gradient(135deg,#ffe29a,#d9a441)}
.ad .ad-quiz .qd{position:relative;top:auto;width:88vw;padding:6vw 4vw 4vw;border-radius:6vw;overflow:hidden;box-shadow:0 5vw 12vw #000a,inset 0 0 0 .3vw #ffffff1c}
.ad-quiz .qd-svg{transform-origin:40% 52%}
.ad-opts{display:flex;gap:2.4vw;justify-content:center;width:88vw;min-height:15vw;margin-top:6vw}
.ad-opt{position:relative;min-width:13vw;padding:2.6vw 4.4vw;border-radius:9vw;background:#ffffff14;box-shadow:inset 0 0 0 .4vw #ffffff30;font-weight:650;font-size:6.4vw;letter-spacing:-.02em;text-align:center;transition:background .15s,transform .15s}
.ad-opt.on{background:${RED};box-shadow:none;transform:scale(1.1)}
.ad-tapdot{position:absolute;left:50%;top:50%;width:10vw;height:10vw;margin:-5vw 0 0 -5vw;border-radius:50%;background:#fff;opacity:0;pointer-events:none}
.ad-core{position:absolute;left:50%;top:50%;width:46vw;height:46vw;margin:-23vw 0 0 -23vw;overflow:visible}
.ad-core circle{fill:none;stroke-width:3.4px;vector-effect:non-scaling-stroke;stroke-linecap:round}
.ad-glow{position:absolute;left:50%;top:50%;width:20vw;height:20vw;margin:-10vw 0 0 -10vw;border-radius:50%;
  background:radial-gradient(circle,#fff 0,#3ee6a0 35%,#3ee6a000 70%);opacity:.25}
.ad-chip{position:absolute;padding:1.4vw 3.4vw;border-radius:9vw;font-weight:650;font-size:8vw;letter-spacing:-.03em;font-variant-numeric:tabular-nums;white-space:nowrap;transform:translate(-50%,-50%);opacity:0;box-shadow:0 1.6vw 4vw #0006}
.ad-curves{display:grid;gap:4.5vw;width:80vw}
.ad-curve{display:grid;grid-template-columns:1fr 31vw;grid-template-rows:auto auto;align-items:end;column-gap:3vw}
.ad-curve .ad-note{grid-column:1/-1;font-size:7vw;color:#ffffffb0;line-height:1;margin-bottom:-1vw}
.ad-curve svg{width:100%;height:17vw;overflow:visible}
.ad-curve .line{fill:none;stroke-width:3.6px;stroke-linecap:round;vector-effect:non-scaling-stroke}
.ad-curve b{font-family:${DISPLAY};font-weight:800;font-size:10.5vw;letter-spacing:-.03em;text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}
.ad-wall{display:grid;grid-template-columns:repeat(4,1fr);gap:2.2vw;width:80vw}
.ad-tile{position:relative;aspect-ratio:1;border-radius:3.6vw;background:#edf2f9;overflow:hidden;box-shadow:0 1.6vw 4vw #0007;transition:opacity .18s,transform .18s,filter .18s}
.ad-tile img{position:absolute;inset:6%;width:88%;height:88%;object-fit:contain}
.ad-tile.x{opacity:.22;transform:scale(.84);filter:grayscale(1)}
.ad-tile.x::after{content:"✕";position:absolute;inset:0;display:grid;place-items:center;font-family:${DISPLAY};font-weight:800;font-size:15vw;color:${RED}}
.ad-tile.win{box-shadow:0 0 0 1.2vw ${GREEN},0 0 8vw ${GREEN}}
.ad-hero{position:absolute;left:50%;top:50%;width:66vw;margin:-40vw 0 0 -33vw;aspect-ratio:1;border-radius:7vw;background:#edf2f9;box-shadow:0 0 0 1.4vw ${GREEN},0 6vw 14vw #000b;opacity:0}
.ad-hero img{position:absolute;inset:6%;width:88%;height:88%;object-fit:contain}
.ad-heroname{position:absolute;left:4vw;right:4vw;top:calc(50% + 30vw);font-size:8.4vw;font-weight:650;letter-spacing:-.03em;line-height:1.05;text-align:center;opacity:0}
.ad-match .bw{background:none}
.ad-match .bw-hit{width:76vw}
.ad-match .bw-word{font-family:${DISPLAY};font-weight:800;font-size:22vw;letter-spacing:-.04em;color:${GREEN};text-shadow:0 1vw 6vw #3ee6a066}
.ad-final{position:absolute;left:0;right:0;top:12.5vh;height:65vh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2.2vw}
.ad-final .ad-ring{width:30vw;box-shadow:0 0 0 1vw ${INK},0 4vw 10vw #000a}
.ad-final .ad-ring img{opacity:1}
.ad-who{margin-top:-6vw;position:relative;padding:1.6vw 4.4vw;border-radius:9vw;background:#0a121fe6;box-shadow:inset 0 0 0 .3vw #ffffff40;font-weight:550;font-size:5.4vw;white-space:nowrap}
.ad-who b{font-weight:700}
.ad-ideal{width:84vw;display:grid;justify-items:center;margin:1vw 0}
.ad-ideal svg{width:84vw;height:auto;overflow:visible}
.ad-ideal span{font-weight:600;font-size:3.8vw;color:#7ef2c4;margin-top:.6vw}
.ad-pcard{display:grid;grid-template-columns:16vw minmax(0,1fr) auto;align-items:center;gap:3.2vw;width:84vw;padding:1.8vw 4vw 1.8vw 1.8vw;border-radius:4.6vw;background:#fff;color:#0f1b2d;box-shadow:0 3vw 8vw #0009;opacity:0}
.ad-pcard.best{box-shadow:0 0 0 1vw ${GREEN},0 3vw 8vw #0009}
.ad-pcard .ph{position:relative;width:16vw;aspect-ratio:1;border-radius:3vw;background:#edf2f9;overflow:hidden}
.ad-pcard .ph img,.ad-pcard .ph svg,.ad-tile svg,.ad-hero svg{position:absolute;inset:6%;width:88%;height:88%;object-fit:contain}
.ad-pcard div{display:grid;gap:.8vw;min-width:0}
.ad-pcard b{font-weight:650;font-size:4.4vw;line-height:1.08;letter-spacing:-.02em;display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;overflow:hidden}
.ad-pcard p{margin:0;display:flex;align-items:center;gap:1.6vw;font-size:3.7vw;color:#5b6b82;white-space:nowrap}
.ad-pcard em{padding:.5vw 2.4vw;border-radius:9vw;color:#fff;font-style:normal;font-weight:600;font-size:3.3vw}
.ad-pcard strong{font-family:${DISPLAY};font-weight:800;font-size:8.4vw;letter-spacing:-.03em;color:#0a8f5a}
.ad-ask{font-family:${DISPLAY};font-weight:800;font-size:17vw;letter-spacing:-.03em;line-height:.9;text-align:center;padding:0 5vw;opacity:0}
.ad-url{margin-top:8vw;padding:2.8vw 7vw;border-radius:9vw;background:${GREEN};color:${NAVY};font-weight:700;font-size:8vw;letter-spacing:-.03em;opacity:0;box-shadow:0 2vw 8vw #3ee6a055}
.ad-free{margin-top:4vw;font-family:${HAND};font-weight:700;font-size:8vw;color:${SUN};transform:rotate(-3deg);opacity:0}
`;

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const OUT = 'cubic-bezier(0.2, 0.8, 0.2, 1)';
const POP = 'cubic-bezier(0.34, 1.56, 0.64, 1)';
/** A sound cue for the renderer (thud, tick, pop, whoosh, win), on the page's own clock. */
const cue = (k: string) => (window.__adCues ??= []).push({ t: performance.now(), k });
const show = (el: Element, ms = 240, from = 'translateY(4vw) scale(.88)', to = 'none') =>
  el.animate(
    [
      { opacity: 0, transform: from },
      { opacity: 1, transform: to },
    ],
    { duration: ms, easing: POP, fill: 'forwards' },
  );
const hide = (el: Element, ms = 140) =>
  el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: ms, fill: 'forwards' }).finished;
const punch = (el: Element, k = 1.1, ms = 220) =>
  el.animate([{ transform: 'scale(1)' }, { transform: `scale(${k})` }, { transform: 'scale(1)' }], {
    duration: ms,
    easing: OUT,
  });
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
/** A dart's product photo, only when it is bundled into the page (the renderer has no network). */
const photoOf = (v: Variant) => {
  const src = photoUrl(v.modelId, 400);
  return src && !/^https?:/.test(src) ? src : null;
};

/** The dart's picture for a tile: its product photo, else the site's drawing of it. */
const picture = (v: Variant): Element => {
  const src = photoOf(v);
  return src ? h('img', { src, alt: '' }) : variantArt(v);
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
  // The ad only recommends darts with a proper product photo (bundled into the page); the counter
  // still counts the whole catalogue.
  const all = variants().filter((v) => v.tip === 'steel' && !v.specCheck);
  const catalogueSize = all.length;
  const pool = all.filter((v) => photoOf(v));
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
    undefined,
    2,
  );
  if (!c?.twin) return;
  const twin = c.twin;
  const top = c.barrels[c.barrels.length - 1]!;
  // How close the pro's own dart is to your fit: the % on the board and under their name.
  const proPct = result.proTwin ? Math.round(matchPct(result.proTwin.scored.cost)) : top.m.total;

  // The faces: the twin (the renderer's photo, else the site's, else the player card) and seven
  // well-known others from the site's credited photos.
  const own = proPhotos[twin.id];
  const twinFace = {
    name: twin.name,
    src: window.__adPhoto?.src ?? own?.file ?? proArtUrl(twin),
    credit: window.__adPhoto?.credit ?? (own ? creditText(own) : ''),
  };
  const names = new Map(pros().map((p) => [p.id, p.name]));
  const others = FACES.filter((id) => id !== twin.id && proPhotos[id] && names.has(id))
    .slice(0, 7)
    .map((id) => ({ name: names.get(id)!, src: proPhotos[id]!.file, credit: creditText(proPhotos[id]!) }));
  const faces = [...others, twinFace];
  const authors = [...new Set(faces.map((x) => x.credit.replace(/^[^:]*:\s*/, '')).filter(Boolean))];

  const style = document.createElement('style');
  style.textContent = CSS;
  const ad = h('div', { class: 'ad', 'aria-hidden': 'true' });
  root.append(style, ad);
  /** A cut: the old scene pushes towards the viewer and is gone, the new one settles in. */
  const cut = async (from: HTMLElement, to: HTMLElement, ms = 200) => {
    ad.append(to);
    cue('whoosh');
    from.animate(
      [
        { opacity: 1, transform: 'scale(1)' },
        { opacity: 0, transform: 'scale(1.12)' },
      ],
      { duration: ms * 0.7, easing: 'ease-in', fill: 'forwards' },
    );
    await to.animate(
      [
        { opacity: 0, transform: 'scale(.9)' },
        { opacity: 1, transform: 'scale(1)' },
      ],
      { duration: ms, easing: OUT, fill: 'forwards' },
    ).finished;
    from.remove();
  };
  const scene = (cls = '') => h('div', { class: `ad-scene ${cls}` });

  // Chrome that stays: progress (five beats, no words), the caption, the photo credits.
  const segs = Array.from({ length: 5 }, () => h('i'));
  const prog = h('div', { class: 'ad-prog' }, ...segs);
  const cap = h('div', { class: 'ad-cap' });
  const credit = h('div', { class: 'ad-credit' }, `${C.photos}: ${authors.join(' · ')}`);
  const flash = h('div', { class: 'ad-flash' });
  ad.append(prog, cap, credit, flash);
  const setSeg = (i: number) => segs.forEach((el, j) => el.classList.toggle('on', j <= i));
  const setCap = (text: string | Node, from = 'translateY(5vw) scale(.8)') => {
    cap.replaceChildren(text);
    // Long captions stay on one line.
    cap.style.fontSize =
      typeof text === 'string' && text.length > 13 && !cap.classList.contains('hook') ? '10.6vw' : '';
    show(cap, 260, from);
  };
  const bang = (strength = 0.3) => flash.animate([{ opacity: strength }, { opacity: 0 }], { duration: 180 });

  /** The ring of faces. spin() flips through them; land() slows down onto the twin. */
  const ringImgs = faces.map((x) => h('img', { src: x.src, alt: '' }));
  const ring = h('div', { class: 'ad-ring' }, ...ringImgs);
  let at = 0;
  const face = (i: number) => {
    at = i % faces.length;
    ringImgs.forEach((im, j) => im.classList.toggle('on', j === at));
    cue('tick');
  };
  const spin = async (ms: number, step = 95) => {
    const t0 = performance.now();
    // Never rest on the twin before the reveal.
    while (performance.now() - t0 < ms) {
      face((at + 1) % (faces.length - 1));
      await wait(step);
    }
  };

  // ── Hook. Frame one is the lit, empty board (also the last frame). The dart is already flying.
  const hook = scene();
  const flyDart = quizDart();
  flyDart.update({ ...a, hold: 'middle', gripFeel: 3 }, null);
  const fly = h('div', { class: 'ad-fly' }, flyDart.el.querySelector('svg')!);
  const squig = s(
    'svg',
    { class: 'ad-squig', viewBox: '0 0 100 10', preserveAspectRatio: 'none' },
    s('path', { d: 'M2,6C12,1 18,10 28,5S44,1 54,6S70,10 80,5S94,2 98,5' }),
  );
  const sq = squig.querySelector('path') as SVGPathElement;
  sq.style.strokeDasharray = '400';
  sq.style.strokeDashoffset = '400';
  hook.append(boardSvg('ad-board bc-board'), fly, squig);
  ad.append(hook);
  hook.style.opacity = '1';
  await wait(120);
  fly.style.opacity = '1';
  await fly.animate(
    [
      { transform: 'translate(80vw, -46vw) rotate(-18deg) scale(1.5)' },
      { transform: 'translate(0, 0) rotate(26deg) scale(1)' },
    ],
    { duration: 220, easing: 'cubic-bezier(0.5, 0, 0.9, 0.6)', fill: 'forwards' },
  ).finished;
  cue('thud');
  bang(0.4);
  ad.animate(
    [
      { transform: 'translate(0,0)' },
      { transform: 'translate(-2vw,1.4vw)' },
      { transform: 'translate(1.4vw,-.8vw)' },
      { transform: 'translate(0,0)' },
    ],
    { duration: 200 },
  );
  cap.classList.add('hook');
  cap.style.transform = 'rotate(-3deg)';
  setCap(C.hook, 'scale(1.7)');
  drawIn(sq, 220, 160);
  await fly.animate(
    [
      { transform: 'rotate(26deg)' },
      { transform: 'rotate(34deg)' },
      { transform: 'rotate(20deg)' },
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
    { duration: 520, easing: 'cubic-bezier(0.5, 0, 0.9, 0.5)', fill: 'forwards' },
  ).finished;
  await wait(120);

  // ── Promise: the faces spin. "Welke prof ben jij?"
  const promise = scene();
  const qm = h('div', { class: 'ad-qm' }, '?');
  ring.append(qm);
  promise.append(h('div', { class: 'ad-stage' }, ring));
  face(0);
  hide(cap, 100);
  squig.remove();
  await cut(hook, promise, 180);
  cap.classList.remove('hook');
  cap.style.transform = '';
  setCap(C.promise);
  show(credit, 300, 'none');
  await spin(1350);

  // ── Hand: scanned next to the pasje, two measurements.
  const scan = scene();
  const hand = handArt({ lengthMm: L, dots: true });
  hand.classList.add('hand');
  const card = h('div', { class: 'ad-card' });
  const bar = h('div', { class: 'ad-scanbar' });
  const dimL = s(
    'svg',
    { class: 'ad-dim', viewBox: '0 0 10 100', preserveAspectRatio: 'none' },
    s('path', { d: 'M5,1V99M1.5,5L5,1L8.5,5M1.5,95L5,99L8.5,95' }),
  );
  dimL.style.cssText = 'left:-9vw;top:4%;width:4vw;height:86%';
  const dimW = s(
    'svg',
    { class: 'ad-dim', viewBox: '0 0 100 10', preserveAspectRatio: 'none' },
    s('path', { d: 'M1,5H99M5,1.5L1,5L5,8.5M95,1.5L99,5L95,8.5' }),
  );
  dimW.style.cssText = 'left:22%;top:62%;width:52%;height:4vw';
  const pillL = h('div', { class: 'ad-pill' }, `${num(L, 0)} mm`);
  pillL.style.cssText = 'left:-17vw;top:34%';
  const pillW = h('div', { class: 'ad-pill' }, `${num(m.palmWidthMm, 0)} mm`);
  pillW.style.cssText = 'left:28%;top:67%';
  scan.append(
    h(
      'div',
      { class: 'ad-stage' },
      h('div', { class: 'ad-handbox' }, hand, bar, card, dimL, dimW, pillL, pillW),
    ),
  );
  hand.style.clipPath = 'inset(100% 0 0 0)';
  for (const d of [dimL, dimW]) {
    const p = d.querySelector('path') as SVGPathElement;
    p.style.strokeDasharray = '1000';
    p.style.strokeDashoffset = '1000';
  }
  hide(credit, 120);
  hide(cap, 100);
  await cut(promise, scan);
  prog.style.opacity = '1';
  setSeg(0);
  setCap(C.scan);
  hand.animate([{ clipPath: 'inset(100% 0 0 0)' }, { clipPath: 'inset(0 0 0 0)' }], {
    duration: 600,
    easing: 'ease-in-out',
    fill: 'forwards',
  });
  bar.animate(
    [
      { top: '100%', opacity: 1 },
      { top: '0%', opacity: 1, offset: 0.92 },
      { top: '0%', opacity: 0 },
    ],
    { duration: 660, easing: 'ease-in-out', fill: 'forwards' },
  );
  [...hand.querySelectorAll<SVGElement>('.hand-dot')].forEach((d, i) =>
    d.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 100, delay: 460 + i * 16, fill: 'both' }),
  );
  await wait(420);
  show(card, 220, 'rotate(-9deg) translateY(8vw)', 'rotate(-9deg)');
  await wait(380);
  for (const [dim, label] of [
    [dimL, pillL],
    [dimW, pillW],
  ] as const) {
    drawIn(dim.querySelector('path')!, 220);
    await wait(140);
    show(label, 220);
    cue('pop');
    await wait(200);
  }
  await wait(340);

  // ── Three questions: the real questionnaire dart follows every tap.
  const quiz = scene('ad-quiz');
  const live = quizDart();
  let cur: Answers = {
    ...a,
    hold: a.hold === 'front' ? 'rear' : 'front',
    fingers: a.fingers === 2 ? 4 : 2,
    gripFeel: 1,
  };
  live.update(cur, 'hold');
  const opts = h('div', { class: 'ad-opts' });
  quiz.append(h('div', { class: 'ad-stage' }, live.el, opts));
  hide(cap, 100);
  await cut(scan, quiz);
  setSeg(1);
  setCap(C.quiz);
  type Beat = {
    focus: 'hold' | 'fingers' | 'gripFeel';
    options: Array<{ label: string; set: Partial<Answers> }>;
    taps: number[];
    zoom: number;
  };
  const holds: Answers['hold'][] = ['front', 'middle', 'rear'];
  const fingerOpts = [2, 3, 4, 5];
  const beats: Beat[] = [
    {
      focus: 'hold',
      options: holds.map((x) => ({ label: t(`q.hold.${x}`), set: { hold: x } })),
      taps: [holds.indexOf(a.hold)],
      zoom: 1.3,
    },
    {
      focus: 'fingers',
      options: fingerOpts.map((x) => ({ label: String(x), set: { fingers: x as Answers['fingers'] } })),
      taps: [fingerOpts.indexOf(a.fingers)],
      zoom: 1.3,
    },
    {
      focus: 'gripFeel',
      options: [1, 2, 3, 4, 5].map((x) => ({
        label: String(x),
        set: { gripFeel: x as Answers['gripFeel'] },
      })),
      // Up through every cut, then back to the answer.
      taps: [1, 2, 3, 4, a.gripFeel - 1],
      zoom: 1.9,
    },
  ];
  let zoomAt = 1;
  for (const beat of beats) {
    const pills = beat.options.map((o) => h('div', { class: 'ad-opt' }, o.label));
    opts.replaceChildren(...pills);
    pills.forEach((p, i) =>
      p.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 120, delay: i * 22, fill: 'both' }),
    );
    live.update(cur, beat.focus);
    live.el
      .querySelector('svg')!
      .animate([{ transform: `scale(${zoomAt})` }, { transform: `scale(${beat.zoom})` }], {
        duration: 300,
        easing: OUT,
        fill: 'forwards',
      });
    zoomAt = beat.zoom;
    await wait(240);
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
        { duration: 300, easing: OUT, fill: 'forwards' },
      );
      cue('pop');
      cur = { ...cur, ...beat.options[idx]!.set };
      live.update(cur, beat.focus);
      await wait(beat.focus === 'gripFeel' && ti < beat.taps.length - 1 ? 160 : 320);
    }
  }
  await wait(120);

  // ── The maths: every number flies into the model, and three bell curves narrow.
  const core = scene();
  const glow = h('div', { class: 'ad-glow' });
  const orbit = s(
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
    [22, 14],
    [76, 12],
    [84, 46],
    [74, 86],
    [26, 88],
    [15, 50],
    [50, 7],
  ];
  const chips = values.map((v, i) => {
    const el = h('div', { class: 'ad-chip' }, v);
    el.style.cssText = `left:${spots[i]![0]}%;top:${spots[i]![1]}%;background:${tints[i]![0]};color:${tints[i]![1]}`;
    return el;
  });
  const coreStage = h('div', { class: 'ad-stage' }, glow, orbit, ...chips);
  coreStage.style.display = 'block';
  core.append(coreStage);
  hide(cap, 100);
  await cut(quiz, core);
  setSeg(2);
  setCap(C.maths);
  orbit.animate([{ transform: 'rotate(0) scale(.6)' }, { transform: 'rotate(260deg) scale(1)' }], {
    duration: 1150,
    easing: OUT,
    fill: 'forwards',
  });
  for (const el of chips) {
    show(el, 160, 'translate(-50%,-50%) scale(.3)', 'translate(-50%,-50%)');
    cue('tick');
    await wait(60);
  }
  await wait(160);
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
            { left: '50%', top: '50%', opacity: 0, transform: 'translate(-50%,-50%) scale(.2)' },
          ],
          { duration: 360, delay: i * 26, easing: 'cubic-bezier(0.6, 0, 0.9, 0.4)', fill: 'forwards' },
        ).finished,
    ),
  );
  cue('pop');
  glow.animate(
    [
      { opacity: 0.25, transform: 'scale(1)' },
      { opacity: 1, transform: 'scale(2.6)' },
    ],
    { duration: 220, easing: OUT, fill: 'forwards' },
  );
  await wait(200);

  const model = scene();
  const dims = [
    { e: f.weight, unit: 'g', dp: 1, col: GREEN },
    { e: f.length, unit: 'mm', dp: 0, col: SUN },
    { e: f.diameter, unit: 'mm', dp: 1, col: RED },
  ];
  const curves = dims.map((d, i) => {
    const line = s('path', { class: 'line', stroke: d.col }) as unknown as SVGPathElement;
    const area = s('path', { fill: d.col, 'fill-opacity': 0.22 }) as unknown as SVGPathElement;
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
        h('span', { class: 'ad-note' }, C.dims[i]),
        s('svg', { viewBox: '0 0 200 40', preserveAspectRatio: 'none' }, area, line),
        val,
      ),
    };
  });
  model.append(h('div', { class: 'ad-stage' }, h('div', { class: 'ad-curves' }, ...curves.map((x) => x.el))));
  await cut(core, model, 160);
  const bell = (spread: number) => {
    const pts: string[] = [];
    for (let i = 0; i <= 50; i++) {
      const x = (i / 50) * 6 - 3;
      const y = Math.exp(-0.5 * (x / (spread * 0.6)) ** 2);
      pts.push(`${((i / 50) * 200).toFixed(1)},${(40 - y * 36).toFixed(1)}`);
    }
    return `M${pts.join('L')}`;
  };
  const t0 = performance.now();
  for (;;) {
    const p = Math.min(1, (performance.now() - t0) / 900);
    const e = 1 - Math.pow(1 - p, 3);
    for (const x of curves) {
      const d = bell(3 - 2.4 * e);
      x.line.setAttribute('d', d);
      x.area.setAttribute('d', `${d}L200,40L0,40Z`);
      x.val.textContent = `${num(x.d.e.mu * e, x.d.dp)} ${x.d.unit}`;
    }
    if (p >= 1) break;
    await wait(30);
  }
  curves.forEach((x) => punch(x.val, 1.14));
  cue('pop');
  await wait(380);

  // ── The match: darts on the board and the %.
  const match = scene('ad-match');
  const win = checkoutWin(proPct);
  const wordEl = win.el.querySelector('.bw-word');
  if (wordEl) wordEl.textContent = `${proPct}%`;
  match.append(h('div', { class: 'ad-stage' }, win.el));
  hide(cap, 100);
  await cut(model, match, 160);
  for (const d of [150, 500, 850]) setTimeout(() => cue('thud'), d);
  await wait(Math.max(900, win.ms - 950));

  // ── The pro: the faces spin again, slow down, and land. The hook, answered.
  const pro = scene();
  qm.remove();
  const name = h('div', { class: 'ad-name' }, twin.name);
  if (twin.name.length > 14) name.style.fontSize = '10vw';
  const pct = h('div', { class: 'ad-pct' }, `${proPct}% match`);
  pro.append(h('div', { class: 'ad-stage' }, ring, name, pct));
  await cut(match, pro, 160);
  setSeg(3);
  setCap(`${C.like}…`);
  show(credit, 300, 'none');
  await spin(520, 80);
  for (const step of [110, 150, 200, 270, 350]) {
    face((at + 1) % (faces.length - 1));
    await wait(step);
  }
  face(faces.length - 1);
  ring.classList.add('lock');
  cue('win');
  bang(0.45);
  punch(ring, 1.12, 320);
  show(name, 300, 'translateY(6vw) scale(.7)');
  await wait(300);
  show(pct, 240, 'scale(.4)');
  await wait(950);

  // ── The catalogue: a wall of real darts, knocked out until one is left. The caption counts.
  const ranked = pool.map((v) => ({ v, cost: scoreVariant(f, v).cost })).sort((x, y) => x.cost - y.cost);
  const seen = new Set<string>([top.v.modelId]);
  const rest = ranked
    .filter((x) => photoOf(x.v) && !seen.has(x.v.modelId) && seen.add(x.v.modelId))
    .map((x) => x.v);
  const field = Array.from({ length: 15 }, (_, i) => rest[Math.floor((i * rest.length) / 15)]!).filter(
    Boolean,
  );
  const winAt = 9;
  const wallDarts: Variant[] = [...field.slice(0, winAt), top.v, ...field.slice(winAt)].slice(0, 16);
  const tiles = wallDarts.map((v) => {
    return h('div', { class: 'ad-tile' }, picture(v));
  });
  const wall = h('div', { class: 'ad-wall' }, ...tiles);
  const search = scene();
  const searchStage = h('div', { class: 'ad-stage' }, wall);
  search.append(searchStage);
  const countN = h('b', null, String(catalogueSize));
  const countWord = document.createTextNode(` ${C.darts}`);
  hide(cap, 100);
  hide(credit, 120);
  await cut(pro, search);
  setSeg(4);
  setCap(h('span', null, countN, countWord));
  tiles.forEach((tl, i) =>
    tl.animate(
      [
        { opacity: 0, transform: 'scale(.6)' },
        { opacity: 1, transform: 'none' },
      ],
      { duration: 200, delay: i * 18, easing: POP, fill: 'backwards' },
    ),
  );
  await wait(520);
  const order = tiles.map((_, i) => i).filter((i) => i !== winAt);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor((((i * 7919) % 104729) / 104729) * (i + 1));
    [order[i], order[j]] = [order[j]!, order[i]!];
  }
  for (const [i, idx] of order.entries()) {
    tiles[idx]!.classList.add('x');
    cue('tick');
    countN.textContent = String(
      Math.max(2, Math.round(catalogueSize - ((catalogueSize - 1) * (i + 1)) / order.length)),
    );
    await wait(Math.max(36, 130 - i * 8));
  }
  countN.textContent = '1';
  countWord.textContent = ` ${C.dart}`;
  punch(cap, 1.18, 260);
  const winTile = tiles[winAt]!;
  winTile.classList.add('win');
  cue('pop');
  await wait(260);
  const heroTile = h('div', { class: 'ad-hero' }, picture(top.v));
  const heroName = h('div', { class: 'ad-heroname' }, dartName(top.v));
  searchStage.append(heroTile, heroName);
  const wr = winTile.getBoundingClientRect();
  const hr = heroTile.getBoundingClientRect();
  wall.animate([{ opacity: 1 }, { opacity: 0.12 }], { duration: 220, fill: 'forwards' });
  await heroTile.animate(
    [
      {
        opacity: 1,
        transform: `translate(${wr.left - hr.left}px, ${wr.top - hr.top}px) scale(${wr.width / hr.width})`,
        transformOrigin: '0 0',
      },
      { opacity: 1, transform: 'none', transformOrigin: '0 0' },
    ],
    { duration: 320, easing: POP, fill: 'forwards' },
  ).finished;
  show(heroName, 220);
  await wait(620);

  // ── The result: the site's final frame. The pro, your ideal dart, three price classes.
  const final = scene();
  const dp = idealDartPaths(c.ideal);
  // Weak matches in another price class don't belong in an ad.
  const pcards = c.options
    .slice(0, 3)
    .filter((o) => o.best || o.m.total >= 60)
    .map((o) => {
      const eur = o.v.priceUsd ? approxEur(o.v.priceUsd) : null;
      const tier = h('em', null, t(`land.tier.${o.tier}`));
      tier.style.background = TIER_BG[o.tier];
      return h(
        'div',
        { class: `ad-pcard${o.best ? ' best' : ''}` },
        h('span', { class: 'ph' }, picture(o.v)),
        h(
          'div',
          null,
          h('b', null, dartName(o.v)),
          h('p', null, tier, `${num(o.v.weightG)} g${eur ? ` · €${eur}` : ''}`),
        ),
        h('strong', null, `${o.m.total}%`),
      );
    });
  const ideal = h(
    'div',
    { class: 'ad-ideal' },
    s(
      'svg',
      { viewBox: '0 30 320 44' },
      s('path', { d: dp.point, fill: '#b8c0cc' }),
      s('path', { d: dp.shaft, fill: '#50627d' }),
      s('path', { d: dp.barrel, fill: '#2ee59d4d', stroke: '#2ee59d', 'stroke-width': 1.6 }),
    ),
    h('span', null, C.ideal),
  );
  const who = h('div', { class: 'ad-who' }, `${C.like}: `, h('b', null, twin.name));
  if (twin.name.length > 14) who.style.fontSize = '4.3vw';
  // Only the twin is on screen now: only their credit.
  credit.textContent = twinFace.credit;
  final.append(
    h(
      'div',
      { class: 'ad-final' },
      h('div', { class: 'ad-ring' }, h('img', { src: twinFace.src, alt: '' })),
      who,
      ideal,
      ...pcards,
    ),
  );
  hide(cap, 100);
  await cut(search, final);
  show(credit, 300, 'none');
  for (const pc of pcards) {
    show(pc, 260, 'translateY(10vw) scale(.94)');
    cue('pop');
    await wait(180);
  }
  await wait(1100);

  // ── The ask, then the empty board again: the first frame, so the video loops.
  const cta = scene();
  const ask = h('div', { class: 'ad-ask' }, C.promise);
  const url = h('div', { class: 'ad-url' }, 'findyourdarts.com');
  const free = h('div', { class: 'ad-free' }, C.free);
  cta.append(h('div', { class: 'ad-stage' }, ask, url, free));
  hide(prog, 160);
  hide(credit, 160);
  await cut(final, cta);
  show(ask, 320, 'scale(.6) rotate(4deg)');
  await wait(320);
  show(url, 260);
  cue('pop');
  await wait(220);
  show(free, 240, 'rotate(-3deg) scale(.6)', 'rotate(-3deg)');
  await wait(1250);
  const back = scene();
  back.append(boardSvg('ad-board bc-board'));
  await cut(cta, back, 260);
  await wait(320);
  document.body.dataset.adPro = twin.name;
  document.body.dataset.adDone = '1';
}
