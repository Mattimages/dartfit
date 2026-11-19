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
import {
  matchBreakdown,
  measurementsFromHeight,
  variantBarrel,
  scoreVariant,
  type Answers,
  type HandType,
  type Measurements,
  type Variant,
} from '@dartfit/engine';
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

/** Themed and gift copy. Christmas and the World Championship (11 Dec – 3 Jan, Alexandra Palace)
 *  without any event branding; gift ads talk to the buyer, who estimates the player's hand. */
const VARIANT = {
  nl: {
    hook: { xmas: 'Wat wil je voor kerst?', wc: 'WK‑koorts?' },
    giftHook: {
      '': 'Kan jouw darter wel wat hulp gebruiken?',
      xmas: 'Kan jouw darter wel wat hulp gebruiken?',
      wc: 'Kan jouw darter wel wat hulp gebruiken?',
    },
    giftPromise: 'Vind de perfecte dart',
    fitting: 'Wij proberen elke dart',
    wrapped: 'Ingepakt.',
    estimate: 'Schat de hand',
    height: 'lengte',
    giftLike: 'Gooit als',
    giftIdeal: 'de ideale dart',
    ask: { xmas: 'Zet hem op je verlanglijst', wc: 'Welke prof ben jij?' },
    giftAsk: { '': 'Het perfecte cadeau', xmas: 'Het perfecte kerstcadeau', wc: 'Op tijd voor het WK' },
    free: { xmas: 'gratis · 1 minuut', wc: 'gratis · klaar voor het WK' },
    giftFree: 'gratis · zonder meten',
    dates: 'WK · 11 dec – 3 jan',
    worlds: 'Net op tijd voor het WK',
  },
  en: {
    hook: { xmas: 'Darts for Christmas?', wc: 'Worlds fever?' },
    giftHook: {
      '': 'Could your darts mate use some help?',
      xmas: 'Could your darts mate use some help?',
      wc: 'Could your darts mate use some help?',
    },
    giftPromise: 'Find their perfect dart',
    fitting: 'We try every dart',
    wrapped: 'Wrapped.',
    estimate: 'Guess their hand',
    height: 'height',
    giftLike: 'Throws like',
    giftIdeal: 'the ideal dart',
    ask: { xmas: 'Put it on your wish list', wc: 'Which pro are you?' },
    giftAsk: { '': 'The perfect gift', xmas: 'The perfect Christmas gift', wc: 'In time for the Worlds' },
    free: { xmas: 'free · 1 minute', wc: 'free · ready for the Worlds' },
    giftFree: 'free · no measuring',
    dates: 'Worlds · 11 Dec – 3 Jan',
    worlds: 'Just in time for the Worlds',
  },
  de: {
    hook: { xmas: 'Darts zu Weihnachten?', wc: 'WM‑Fieber?' },
    giftHook: {
      '': 'Braucht dein Darts-Freund Hilfe?',
      xmas: 'Braucht dein Darts-Freund Hilfe?',
      wc: 'Braucht dein Darts-Freund Hilfe?',
    },
    giftPromise: 'Finde den perfekten Dart',
    fitting: 'Wir testen jeden Dart',
    wrapped: 'Eingepackt.',
    estimate: 'Schätz die Hand',
    height: 'Größe',
    giftLike: 'Wirft wie',
    giftIdeal: 'der ideale Dart',
    ask: { xmas: 'Ab auf den Wunschzettel', wc: 'Welcher Profi bist du?' },
    giftAsk: {
      '': 'Das perfekte Geschenk',
      xmas: 'Das perfekte Weihnachtsgeschenk',
      wc: 'Rechtzeitig zur WM',
    },
    free: { xmas: 'gratis · 1 Minute', wc: 'gratis · bereit für die WM' },
    giftFree: 'gratis · ohne Messen',
    dates: 'WM · 11. Dez – 3. Jan',
    worlds: 'Pünktlich zur WM',
  },
};
type Theme = '' | 'xmas' | 'wc';

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
  text-shadow:0 1vw 5vw #0009;text-wrap:balance;opacity:0}
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
.ad-name{flex-shrink:0;margin-top:4.5vw;min-height:15vw;font-family:${DISPLAY};font-weight:800;font-size:12.5vw;letter-spacing:-.03em;line-height:.92;text-align:center;padding:0 5vw;opacity:0}
.ad-pct{flex-shrink:0;margin-top:4vw;padding:1.4vw 5vw;border-radius:9vw;background:${GREEN};color:${NAVY};font-family:${DISPLAY};font-weight:800;font-size:9vw;letter-spacing:-.03em;opacity:0}
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
.ad-cap.hook.roomy{height:21vh;top:13vh}
.ad-cap.hook.long{font-size:13.5vw}
.ad-cap.hook.mid{font-size:15vw}
.ad-squig.roomy{top:35.5vh}
.roomy .ad-board{top:42vh}
.roomy .ad-fly{top:calc(42vh + 21vw)}
.ad-tag{position:absolute;z-index:6;left:0;right:0;top:calc(14vh + 21vw + 8.5vh);text-align:center;font-family:${HAND};font-weight:700;font-size:8.4vw;color:${SUN};transform:rotate(-3deg);opacity:0}
.roomy .ad-tag{top:38.2vh}
.ad-gift .ad-handbox{width:46vw;height:63vw}
.ad-gift .ad-opts{flex-wrap:wrap;row-gap:2.4vw;margin-top:5vw}
.ad-gift .ad-opt{font-size:5.2vw;padding:2.4vw 3.8vw}
.ad-quiz.ad-gift .ad-opt{font-size:5.4vw;padding:2.4vw 4vw}
.ad-hnote{position:absolute;left:-19vw;top:22%;display:grid;justify-items:center;gap:.6vw;opacity:0}
.ad-hnote span{font-family:${HAND};font-weight:700;font-size:6.4vw;color:${SUN};line-height:1}
.ad-hnote .ad-pill{position:static;opacity:1}
.ad-dring{background:#edf2f9}
.ad-dring img{object-fit:contain;object-position:50% 50%;inset:12%;width:76%;height:76%;border-radius:0}
.ad-pcard{position:relative}
.ad-bow{position:absolute;right:-2.4vw;top:-4.6vw;width:13vw;height:10vw;overflow:visible;filter:drop-shadow(0 1vw 1.4vw #0006)}
/* Christmas: a warm red glow, falling snow, fairy lights over the top, a hat on the board. */
.ad.t-xmas{background:radial-gradient(90vw 70vh at 50% 46%,#7d2030 0,#3d1426 42%,transparent 76%),#0a1d1a}
.ad-snow{position:absolute;inset:0;z-index:5;pointer-events:none;overflow:hidden}
.ad-snow i{position:absolute;top:-4vh;border-radius:50%;background:#fff;opacity:.85;animation:ad-fall linear infinite}
@keyframes ad-fall{to{transform:translate3d(var(--dx),110vh,0)}}
.ad-lights{position:absolute;z-index:5;left:-4vw;right:-4vw;top:2.4vh;width:108vw;height:9vh;overflow:visible;pointer-events:none}
.ad-lights path{fill:none;stroke:#1d3a2c;stroke-width:3px;vector-effect:non-scaling-stroke}
.ad-lights circle{animation:ad-blink 1.1s ease-in-out infinite alternate}
@keyframes ad-blink{from{opacity:.35}to{opacity:1}}
.ad-hat{position:absolute;z-index:2;left:calc(50% + 16vw);top:calc(var(--bt,35vh) - 9vw);width:40vw;height:34vw;overflow:visible;transform:rotate(24deg);filter:drop-shadow(0 2vw 3vw #0008)}
.roomy .ad-hat{--bt:42vh}
.ad-board-wrap{position:absolute;inset:0}
/* World Championship: a dark arena, sweeping spotlights, camera flashes in the crowd. */
.ad.t-wc{background:radial-gradient(80vw 60vh at 50% 48%,#3b2b72 0,#1b1340 45%,transparent 78%),#07060f}
.ad-beams{position:absolute;inset:0;z-index:1;pointer-events:none;overflow:hidden}
.ad-beams i{position:absolute;top:-8vh;width:60vw;height:120vh;transform-origin:50% 0;
  background:linear-gradient(to bottom,#fff6d633,#fff6d600 80%);clip-path:polygon(44% 0,56% 0,100% 100%,0 100%);animation:ad-sweep 3.6s ease-in-out infinite alternate}
.ad-beams i:nth-child(1){left:-22vw;--a:-18deg;--b:10deg}
.ad-beams i:nth-child(2){right:-22vw;--a:18deg;--b:-10deg;animation-delay:-1.8s}
@keyframes ad-sweep{from{transform:rotate(var(--a))}to{transform:rotate(var(--b))}}
.ad-crowd{position:absolute;left:0;right:0;bottom:0;height:20vh;z-index:1;pointer-events:none;
  background:radial-gradient(60vw 12vh at 50% 100%,#000c,transparent)}
.ad-crowd i{position:absolute;width:1.6vw;height:1.6vw;border-radius:50%;background:#fff;box-shadow:0 0 3vw 1.4vw #fff8;opacity:0;animation:ad-pop 2.6s ease-out infinite}
@keyframes ad-pop{0%,86%{opacity:0;transform:scale(.4)}90%{opacity:1;transform:scale(1)}100%{opacity:0;transform:scale(.6)}}
.t-wc .ad-url{background:#ffcf5a;box-shadow:0 2vw 8vw #ffcf5a55}
.ad-cap.hook.xlong{font-size:11.6vw}
/* Gift: real darts tried over the ideal outline, then the winner wrapped. */
.ad-fitlabel{font-family:${HAND};font-weight:700;font-size:7.4vw;color:#7ef2c4;margin-bottom:1vw}
.ad-fitsvg{width:94vw;height:auto;overflow:visible}
.ad-fitsvg .ideal{fill:#2ee59d26;stroke:#2ee59d;stroke-width:1.6;stroke-dasharray:5 3}
.ad-fitsvg .cand{fill:#ffffff40;stroke:#fff;stroke-width:2;transition:fill .18s,stroke .18s}
.ad-fitsvg .cand.miss{stroke:${RED};fill:#ff4d5e38}
.ad-fitsvg .cand.hit{stroke:${GREEN};fill:#3ee6a070}
.ad-fitrow{display:grid;grid-template-columns:20vw minmax(0,1fr) auto;align-items:center;gap:3.4vw;width:88vw;margin-top:8vw;padding:2.4vw 4.4vw 2.4vw 2.4vw;border-radius:5vw;background:#fff;color:#0f1b2d;box-shadow:0 3vw 8vw #0009;opacity:0}
.ad-fitrow .ph{position:relative;width:20vw;aspect-ratio:1;border-radius:3.4vw;background:#edf2f9;overflow:hidden}
.ad-fitrow .ph img,.ad-fitrow .ph svg{position:absolute;inset:6%;width:88%;height:88%;object-fit:contain}
.ad-fitrow b{font-weight:650;font-size:5vw;line-height:1.08;letter-spacing:-.02em;text-wrap:balance}
.ad-fitrow strong{font-family:${DISPLAY};font-weight:800;font-size:11vw;letter-spacing:-.03em;color:#9aa6b8;font-variant-numeric:tabular-nums}
.ad-fitrow.hit{box-shadow:0 0 0 1.2vw ${GREEN},0 3vw 8vw #0009}
.ad-fitrow.hit strong{color:#0a8f5a}
.ad-box{position:relative;width:70vw;height:92vw}
.ad-boxpic{position:absolute;z-index:1;left:12vw;top:0;width:46vw;aspect-ratio:1;border-radius:5vw;background:#edf2f9;box-shadow:0 0 0 1vw ${GREEN},0 4vw 10vw #000a;overflow:hidden}
.ad-boxpic img,.ad-boxpic svg{position:absolute;inset:6%;width:88%;height:88%;object-fit:contain}
.ad-boxbody{position:absolute;z-index:2;left:0;bottom:0;width:70vw;height:42vw;overflow:visible;filter:drop-shadow(0 4vw 7vw #000b)}
.ad-lid{position:absolute;z-index:3;left:-3vw;top:28vw;width:76vw;height:26.6vw;overflow:visible;opacity:0;filter:drop-shadow(0 2vw 3vw #0008)}
.ad-bigbow{position:absolute;z-index:4;left:20vw;top:12vw;width:30vw;height:23vw;overflow:visible;opacity:0;transform-origin:50% 90%}
.ad-spark{position:absolute;z-index:5;left:50%;top:44%;width:5vw;height:5vw;margin:-2.5vw 0 0 -2.5vw;opacity:0}
.ad-spark path{fill:${SUN}}
.ad-boxname{margin-top:5vw;font-size:6.4vw;font-weight:650;letter-spacing:-.03em;line-height:1.08;text-align:center;text-wrap:balance;padding:0 6vw;opacity:0}
.ad-match .bw{background:none}
.ad-match .bw-hit{width:76vw}
.ad-match .bw-word{font-family:${DISPLAY};font-weight:800;font-size:22vw;letter-spacing:-.04em;color:${GREEN};text-shadow:0 1vw 6vw #3ee6a066}
.ad-final{position:absolute;left:0;right:0;top:12.5vh;height:65vh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1.8vw}
.ad-final .ad-ring{width:27vw;box-shadow:0 0 0 1vw ${INK},0 4vw 10vw #000a}
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
.ad-pcard b{font-weight:650;font-size:3.9vw;line-height:1.08;letter-spacing:-.025em;text-wrap:balance}
.ad-pcard p{margin:0;display:flex;align-items:center;gap:1.6vw;font-size:3.7vw;color:#5b6b82;white-space:nowrap}
.ad-pcard em{padding:.5vw 2.4vw;border-radius:9vw;color:#fff;font-style:normal;font-weight:600;font-size:3.3vw}
.ad-pcard strong{font-family:${DISPLAY};font-weight:800;font-size:8.4vw;letter-spacing:-.03em;color:#0a8f5a}
.ad-ask{font-family:${DISPLAY};font-weight:800;font-size:17vw;letter-spacing:-.03em;line-height:.9;text-align:center;text-wrap:balance;padding:0 5vw;opacity:0}
.ad-url{margin-top:8vw;padding:2.8vw 7vw;border-radius:9vw;background:${GREEN};color:${NAVY};font-weight:700;font-size:8vw;letter-spacing:-.03em;opacity:0;box-shadow:0 2vw 8vw #3ee6a055}
.ad-free{margin-top:4vw;font-family:${HAND};font-weight:700;font-size:8vw;color:${SUN};transform:rotate(-3deg);opacity:0}
.ad-worlds{margin-top:5vw;padding:1.6vw 4vw;border-radius:99px;background:rgb(255 255 255/.12);box-shadow:inset 0 0 0 .5vw rgb(255 209 102/.6);font-family:${DISPLAY};font-weight:800;font-size:5.6vw;color:${INK};opacity:0}
.ad-w{display:inline-block}
`;

/** Everything 10 % more time (owner, 19 Nov): every pause and every animation runs at this pace. */
const PACE = 1.1;
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms * PACE));
const later = (fn: () => void, ms: number) => setTimeout(fn, ms * PACE);
/** Element.animate at the ad's pace (the ad view is the only page that installs it). */
function paceAnimations() {
  const orig = Element.prototype.animate;
  if ((orig as { paced?: boolean }).paced) return;
  const paced = function (this: Element, k: Keyframe[] | PropertyIndexedKeyframes | null, o?: number | KeyframeAnimationOptions) {
    const opts =
      typeof o === 'number'
        ? o * PACE
        : o
          ? { ...o, duration: typeof o.duration === 'number' ? o.duration * PACE : o.duration, delay: (o.delay ?? 0) * PACE }
          : o;
    return orig.call(this, k, opts);
  };
  (paced as { paced?: boolean }).paced = true;
  Element.prototype.animate = paced as typeof orig;
}
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
  paceAnimations();
  const lang = (getLang() as keyof typeof COPY) in COPY ? (getLang() as keyof typeof COPY) : 'en';
  const C = COPY[lang];
  const V = VARIANT[lang];
  const theme: Theme = q.get('theme') === 'xmas' || q.get('theme') === 'wc' ? (q.get('theme') as Theme) : '';
  // A gift ad: the buyer guesses (height, hand type, "not sure" where they don't know); the fit
  // comes from the same estimate the site's gift flow uses.
  const gift = q.get('gift') === '1';
  const n = (k: string, d: number) => Number(q.get(k) ?? d);
  const unsureHold = q.get('hold') === 'unsure';
  const unsureFingers = q.get('f') === 'unsure';
  const handType = (
    ['slender', 'average', 'stubby'].includes(q.get('ht') ?? '') ? q.get('ht') : 'average'
  ) as HandType;
  const heightCm = n('h', 180);
  const L0 = n('L', 185);
  const k = L0 / 185;
  const m: Measurements = gift
    ? measurementsFromHeight(heightCm)
    : {
        handLengthMm: L0,
        palmWidthMm: 78 * k,
        indexLengthMm: 78 * k,
        middleLengthMm: 85 * k,
        thumbIndexSpanMm: 120 * k,
        spreadMm: 1.2,
        samples: 18,
        calibrated: true,
      };
  const L = Math.round(m.handLengthMm);
  const a: Answers = {
    tip: 'steel',
    hold: (unsureHold ? 'middle' : (q.get('hold') ?? 'middle')) as Answers['hold'],
    fingers: (unsureFingers ? 3 : n('f', 3)) as Answers['fingers'],
    throwStyle: (q.get('throw') ?? 'flat') as Answers['throwStyle'],
    moisture: 'normal',
    gripFeel: n('g', 3) as Answers['gripFeel'],
    thickness: 'auto',
    heightCm,
    ...(gift ? { handType } : {}),
  };
  const hookText = gift ? V.giftHook[theme] : theme ? V.hook[theme] : C.hook;
  const promiseText = gift ? V.giftPromise : C.promise;
  const likeText = gift ? V.giftLike : C.like;
  const askText = gift ? V.giftAsk[theme] : theme ? V.ask[theme] : C.promise;
  const freeText = gift ? V.giftFree : theme ? V.free[theme] : C.free;
  const result = await createFit(m, a);
  const f = result.fit;
  // The ad only recommends darts with a proper product photo (bundled into the page).
  const all = variants().filter((v) => v.tip === 'steel' && !v.specCheck);
  // Signature darts of players the site no longer lists as pros stay out of the ads.
  const listed = new Set(pros().map((p) => p.name.split(' ').at(-1)!.toLowerCase()));
  const unlisted = (v: Variant) => /koltsov/i.test(dartName(v)) && !listed.has('koltsov');
  const pool = all.filter((v) => photoOf(v) && !unlisted(v));
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
  const ad = h('div', { class: `ad${theme ? ` t-${theme}` : ''}`, 'aria-hidden': 'true' });
  root.append(style, ad);
  // Themed backdrop: snow and fairy lights, or arena spotlights and camera flashes. Fixed seeds, so
  // every render is the same.
  let seed = 11;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  if (theme === 'xmas') {
    const snow = h('div', { class: 'ad-snow' });
    for (let i = 0; i < 46; i++) {
      const flake = h('i');
      const size = 0.7 + rnd() * 1.6;
      const dur = 6 + rnd() * 6;
      flake.style.cssText = `left:${(rnd() * 100).toFixed(1)}vw;width:${size.toFixed(2)}vw;height:${size.toFixed(2)}vw;--dx:${((rnd() - 0.5) * 16).toFixed(1)}vw;animation-duration:${dur.toFixed(1)}s;animation-delay:-${(rnd() * dur).toFixed(1)}s;opacity:${(0.45 + rnd() * 0.5).toFixed(2)}`;
      snow.append(flake);
    }
    const bulbs = Array.from({ length: 11 }, (_, i) => {
      const x = 4 + i * 9.2;
      const y = 22 + Math.sin((x / 100) * Math.PI) * 26;
      const col = ['#ff4d5e', '#ffd166', '#3ee6a0', '#7fb4ff'][i % 4]!;
      const c = s('circle', { cx: x, cy: y + 5, r: 2.3, fill: col });
      c.style.animationDelay = `${-(i % 3) * 0.37}s`;
      c.style.filter = `drop-shadow(0 0 1.6px ${col})`;
      return c;
    });
    ad.append(
      snow,
      s(
        'svg',
        { class: 'ad-lights', viewBox: '0 0 100 60', preserveAspectRatio: 'none' },
        s('path', { d: 'M0,20Q50,62 100,20' }),
        ...bulbs,
      ),
    );
  } else if (theme === 'wc') {
    const crowd = h('div', { class: 'ad-crowd' });
    for (let i = 0; i < 18; i++) {
      const f = h('i');
      f.style.cssText = `left:${(rnd() * 96).toFixed(1)}vw;bottom:${(rnd() * 15).toFixed(1)}vh;animation-delay:-${(rnd() * 2.6).toFixed(2)}s;animation-duration:${(2 + rnd() * 1.6).toFixed(2)}s`;
      crowd.append(f);
    }
    ad.append(h('div', { class: 'ad-beams' }, h('i'), h('i')), crowd);
  }
  /** The board, with a Santa hat on it at Christmas. */
  const board = () => {
    const wrap = h('div', { class: 'ad-board-wrap' }, boardSvg('ad-board bc-board'));
    if (theme === 'xmas')
      wrap.append(
        s(
          'svg',
          { class: 'ad-hat', viewBox: '0 0 100 85' },
          s('path', {
            d: 'M14,68C22,36 40,10 70,6C84,4 94,14 92,30C80,22 66,26 60,44L56,68Z',
            fill: '#e3122c',
          }),
          s('path', { d: 'M60,44C66,26 80,22 92,30', fill: 'none', stroke: '#a30b1f', 'stroke-width': 3 }),
          s('rect', { x: 6, y: 62, width: 60, height: 16, rx: 8, fill: '#fdf8ee' }),
          s('circle', { cx: 92, cy: 34, r: 9, fill: '#fdf8ee' }),
        ),
      );
    return wrap;
  };
  const longHook = hookText.length > 14;
  // A long hook, or one with the dates under it, needs the board lower.
  const roomy = longHook || theme === 'wc';
  /** A cut: the old scene pushes towards the viewer and is gone, the new one settles in. */
  // Each cut sounds different (owner, 19 Nov: the one sliding sound got boring).
  const CUT_SOUNDS =
    theme === 'xmas'
      ? ['jingle:0', 'glock:2', 'jingle:1', 'tom:1', 'jingle:2', 'glock:4', 'jingle:3', 'tom:2']
      : ['swish', 'tom:0', 'click', 'glock:1', 'tom:2', 'swish', 'glock:3', 'tom:1'];
  let cutN = 0;
  let pipN = 0;
  const cut = async (from: HTMLElement, to: HTMLElement, ms = 200) => {
    ad.append(to);
    cue(CUT_SOUNDS[cutN++ % CUT_SOUNDS.length]!);
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
    // A slow camera push while the scene plays, so nothing ever sits dead still.
    to.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.035)' }], {
      duration: 5000,
      easing: 'ease-out',
      fill: 'forwards',
    });
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
    if (typeof text === 'string' && text.includes(' ')) {
      const words = text.split(' ').map((w) => h('span', { class: 'ad-w' }, w));
      // One inline run (the caption is a flex box): the words wrap like ordinary text.
      cap.replaceChildren(
        h('span', null, ...words.flatMap((w, i) => (i ? [document.createTextNode(' '), w] : [w]))),
      );
      words.forEach((w, i) =>
        w.animate(
          [
            { opacity: 0, transform: 'translateY(4vw) scale(.6) rotate(-4deg)' },
            { opacity: 1, transform: 'none' },
          ],
          { duration: 320, delay: 60 * i, easing: POP, fill: 'backwards' },
        ),
      );
    } else cap.replaceChildren(text);
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
      cue('click');
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
  if (roomy) {
    hook.classList.add('roomy');
    squig.classList.add('roomy');
  }
  const tag = theme === 'wc' ? h('div', { class: 'ad-tag' }, V.dates) : null;
  hook.append(board(), fly, squig, ...(tag ? [tag] : []));
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
  cap.classList.toggle('roomy', roomy);
  cap.classList.toggle('long', longHook);
  cap.classList.toggle('xlong', hookText.length > 26);
  cap.classList.toggle('mid', !longHook && hookText.length > 9);
  cap.style.transform = 'rotate(-3deg)';
  setCap(hookText, 'scale(1.7)');
  drawIn(sq, 220, 160);
  if (tag) show(tag, 300, 'rotate(-3deg) scale(.6)', 'rotate(-3deg)');
  if (theme === 'xmas') cue('bell');
  if (theme === 'wc') cue('roar');
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
  // A question takes longer to read than "Verkeerde dart?".
  // The gift hook is the line people love: twice the time on screen (owner, 18 Nov).
  await wait(gift ? 2600 : 120);

  // ── Promise: the faces spin. "Welke prof ben jij?"
  const promise = scene();
  const qm = h('div', { class: 'ad-qm' }, '?');
  // A gift buyer asks which dart, so their ring spins real darts; everyone else's spins pros.
  const dartPics = pool
    .slice(0, 40)
    .filter((_, i) => i % 5 === 0)
    .slice(0, 8);
  const dartRing = h(
    'div',
    { class: 'ad-ring ad-dring' },
    ...dartPics.map((v) => h('img', { src: photoOf(v)!, alt: '' })),
  );
  const promiseRing = gift ? dartRing : ring;
  promiseRing.append(qm);
  promise.append(h('div', { class: 'ad-stage' }, promiseRing));
  face(0);
  hide(cap, 100);
  squig.remove();
  tag?.remove();
  await cut(hook, promise, 180);
  cap.classList.remove('hook', 'long', 'roomy', 'mid', 'xlong');
  cap.style.transform = '';
  setCap(promiseText);
  if (gift) {
    const imgs = [...dartRing.querySelectorAll('img')];
    for (let i = 0; i < 14; i++) {
      imgs.forEach((im, j) => im.classList.toggle('on', j === i % imgs.length));
      cue(i % 2 ? 'click' : `glock:${i % 6}`);
      await wait(95);
    }
  } else {
    show(credit, 300, 'none');
    await spin(1350);
  }

  // ── Hand: scanned next to the pasje, two measurements (a gift buyer estimates it instead).
  const scan = scene(gift ? 'ad-gift' : '');
  hide(credit, 120);
  if (gift) {
    // ── Estimate: the buyer picks the hand type (the drawing follows) and the height.
    const ghand = handArt({ lengthMm: L, dots: false });
    ghand.classList.add('hand');
    const types: HandType[] = ['slender', 'average', 'stubby'];
    const shape = { slender: 'scale(.84,1.05)', average: 'none', stubby: 'scale(1.14,.9)' };
    const pills = types.map((x) => h('div', { class: 'ad-opt' }, t(`q.hand.${x}`)));
    const hnote = h(
      'div',
      { class: 'ad-hnote' },
      h('span', null, V.height),
      h('div', { class: 'ad-pill' }, `${heightCm} cm`),
    );
    const gbox = h('div', { class: 'ad-handbox' }, ghand, hnote);
    scan.append(h('div', { class: 'ad-stage' }, gbox, h('div', { class: 'ad-opts' }, ...pills)));
    hide(cap, 100);
    await cut(promise, scan);
    prog.style.opacity = '1';
    setSeg(0);
    setCap(V.estimate);
    ghand.style.transformOrigin = '50% 100%';
    show(ghand, 300, 'translateY(6vw) scale(.9)');
    pills.forEach((p, i) =>
      p.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 140, delay: 120 + i * 40, fill: 'both' }),
    );
    await wait(420);
    const taps: HandType[] = handType === 'average' ? ['stubby', 'average'] : ['average', handType];
    let from = 'none';
    for (const x of taps) {
      const pill = pills[types.indexOf(x)]!;
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
      cue(`pip:${pipN++}`);
      ghand.animate([{ transform: from }, { transform: shape[x] }], {
        duration: 260,
        easing: POP,
        fill: 'forwards',
      });
      from = shape[x];
      await wait(420);
    }
    show(hnote, 260, 'translateX(-6vw) scale(.8)');
    cue('glock:3');
    await wait(700);
  } else {
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
      cue(`pip:${pipN++ + 2}`);
      await wait(200);
    }
    await wait(340);
  }

  // ── Three questions (not in the gift ad: the buyer's story is the hand, the maths, the dart).
  let prev: HTMLElement = scan;
  if (!gift) {
    const quiz = scene(gift ? 'ad-quiz ad-gift' : 'ad-quiz');
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
    // Gift buyers get "Weet ik niet", which the site reads as the most common answer.
    const unsure = t('q.hand.unsure');
    const beats: Beat[] = [
      {
        focus: 'hold',
        options: [
          ...holds.map((x) => ({ label: t(`q.hold.${x}`), set: { hold: x } as Partial<Answers> })),
          ...(gift ? [{ label: unsure, set: { hold: 'middle' } as Partial<Answers> }] : []),
        ],
        taps: [gift && unsureHold ? 3 : holds.indexOf(a.hold)],
        zoom: 1.3,
      },
      {
        focus: 'fingers',
        options: [
          ...fingerOpts.map((x) => ({ label: String(x), set: { fingers: x as Answers['fingers'] } })),
          ...(gift ? [{ label: unsure, set: { fingers: 3 as Answers['fingers'] } }] : []),
        ],
        taps: [gift && unsureFingers ? 4 : fingerOpts.indexOf(a.fingers)],
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
        cue(`pip:${pipN++}`);
        cur = { ...cur, ...beat.options[idx]!.set };
        live.update(cur, beat.focus);
        await wait(beat.focus === 'gripFeel' && ti < beat.taps.length - 1 ? 160 : 320);
      }
    }
    await wait(120);
    prev = quiz;
  }

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
    `${gift ? '≈ ' : ''}${num(L, 0)} mm`,
    `${gift ? '≈ ' : ''}${num(m.palmWidthMm, 0)} mm`,
    gift ? t(`q.hand.${handType}`) : num(m.middleLengthMm / m.palmWidthMm, 2),
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
  await cut(prev, core);
  setSeg(gift ? 1 : 2);
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
  cue('glock:0');
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
  cue('glock:5');
  await wait(380);

  let beforeFinal: HTMLElement;
  if (gift) {
    // ── Fitting: real darts tried over the ideal outline, one by one, until one fits.
    const fitScene = scene();
    const dpI = idealDartPaths(c.ideal);
    const overlay = s('path', { class: 'cand' }) as unknown as SVGPathElement;
    const fitSvg = s(
      'svg',
      { class: 'ad-fitsvg', viewBox: '0 24 320 56' },
      s('path', { d: dpI.point, fill: '#b8c0cc' }),
      s('path', { d: dpI.shaft, fill: '#50627d' }),
      s('path', { d: dpI.barrel, class: 'ideal' }),
      overlay,
    );
    const fitPic = h('span', { class: 'ph' });
    const fitName = h('b');
    const fitPct = h('strong', null, '0%');
    const fitRow = h('div', { class: 'ad-fitrow' }, fitPic, h('div', null, fitName), fitPct);
    fitScene.append(
      h('div', { class: 'ad-stage' }, h('span', { class: 'ad-fitlabel' }, V.giftIdeal), fitSvg, fitRow),
    );
    hide(cap, 100);
    await cut(model, fitScene);
    setSeg(2);
    setCap(V.fitting);
    await wait(200);
    // Clear misses first (about 55, 70 and 84 %, other brands where possible), then the winner, so
    // a red "no" never sits a few points under the green "yes".
    const tried = new Set([top.v.id]);
    const brands = new Set([top.v.brand]);
    const scoredPool = pool.map((v) => ({
      v,
      shape: variantBarrel(v),
      m: { total: matchBreakdown(scoreVariant(f, v)).total },
    }));
    const ladder = [55, 70, 84].flatMap((target) => {
      const pick = (avoid: boolean) =>
        scoredPool
          .filter(
            (x) =>
              !tried.has(x.v.id) &&
              // Never show the twin's own signature dart as a miss.
              !dartName(x.v).toLowerCase().includes(twin.name.split(' ').at(-1)!.toLowerCase()) &&
              x.m.total < top.m.total - 8 &&
              (!avoid || !brands.has(x.v.brand)),
          )
          .sort((a, b) => Math.abs(a.m.total - target) - Math.abs(b.m.total - target))[0];
      const x = pick(true) ?? pick(false);
      if (!x) return [];
      tried.add(x.v.id);
      brands.add(x.v.brand);
      return [x];
    });
    const trials = [...ladder.sort((a, b) => a.m.total - b.m.total), top];
    for (const [i, b] of trials.entries()) {
      const last = i === trials.length - 1;
      overlay.setAttribute('d', idealDartPaths(b.shape).barrel);
      overlay.classList.remove('miss', 'hit');
      fitPic.replaceChildren(picture(b.v));
      fitName.textContent = dartName(b.v);
      fitPct.textContent = '0%';
      cue(`tock:${i}`);
      overlay.animate(
        [
          { transform: 'translateX(320px)', opacity: 0 },
          { transform: 'translateX(0)', opacity: 1 },
        ],
        { duration: 280, easing: OUT, fill: 'forwards' },
      );
      fitRow.animate(
        [
          { opacity: 0, transform: 'translateY(6vw)' },
          { opacity: 1, transform: 'none' },
        ],
        { duration: 240, easing: OUT, fill: 'forwards' },
      );
      await wait(200);
      let lastTick = 0;
      const t1 = performance.now();
      for (;;) {
        const p = Math.min(1, (performance.now() - t1) / (last ? 600 : 420));
        const shown = Math.round(b.m.total * (1 - Math.pow(1 - p, 3)));
        if (shown >= lastTick + 7) {
          cue(`cnt:${shown}`);
          lastTick = shown;
        }
        fitPct.textContent = `${shown}%`;
        if (p >= 1) break;
        await wait(30);
      }
      if (!last) {
        overlay.classList.add('miss');
        cue('nope');
        overlay.animate(
          [
            { transform: 'translateX(0)' },
            { transform: 'translateX(-4px)' },
            { transform: 'translateX(4px)' },
            { transform: 'translateX(0)' },
          ],
          { duration: 200 },
        );
        await wait(240);
        overlay.animate(
          [
            { transform: 'translateX(0)', opacity: 1 },
            { transform: 'translateX(-320px)', opacity: 0 },
          ],
          { duration: 220, easing: 'ease-in', fill: 'forwards' },
        );
        await fitRow.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 180, fill: 'forwards' }).finished;
      } else {
        overlay.classList.add('hit');
        fitRow.classList.add('hit');
        cue('ding');
        cue('tada');
        if (theme === 'xmas') cue('bell');
        bang(0.35);
        punch(fitRow, 1.06, 300);
        await wait(950);
      }
    }
    beforeFinal = fitScene;
  } else {
    // ── The match: darts on the board and the %.
    const match = scene('ad-match');
    const win = checkoutWin(proPct);
    const wordEl = win.el.querySelector('.bw-word');
    if (wordEl) wordEl.textContent = `${proPct}%`;
    match.append(h('div', { class: 'ad-stage' }, win.el));
    hide(cap, 100);
    await cut(model, match, 160);
    [150, 500, 850].forEach((d, i) => later(() => cue(`thud:${i}`), d));
    later(() => cue('cheer'), 1100);
    await wait(Math.max(900, win.ms - 950));

    // ── The pro: the faces spin again, slow down, and land. The hook, answered.
    const pro = scene();
    qm.remove();
    const name = h('div', { class: 'ad-name' }, twin.name);
    // Long names get a smaller face, and a name that still needs two lines gets a smaller ring, so
    // the name and the "% match" pill never overlap (owner, 19 Nov: Luke Humphries).
    if (twin.name.length > 12) name.style.fontSize = '10vw';
    if (twin.name.length > 17) {
      name.style.fontSize = '9.5vw';
      ring.style.width = '50vw';
    }
    const pct = h('div', { class: 'ad-pct' }, `${proPct}% match`);
    pro.append(h('div', { class: 'ad-stage' }, ring, name, pct));
    await cut(match, pro, 160);
    setSeg(3);
    setCap(`${likeText}…`);
    show(credit, 300, 'none');
    await spin(520, 80);
    for (const step of [110, 150, 200, 270, 350]) {
      face((at + 1) % (faces.length - 1));
      await wait(step);
    }
    face(faces.length - 1);
    ring.classList.add('lock');
    cue('tada');
    cue(theme === 'xmas' ? 'bell' : 'win');
    if (theme === 'wc') cue('roar');
    bang(0.45);
    punch(ring, 1.12, 320);
    show(name, 300, 'translateY(6vw) scale(.7)');
    await wait(300);
    show(pct, 240, 'scale(.4)');
    await wait(950);

    // Straight on to the three best darts (owner, 18 Nov): no catalogue countdown in between.
    beforeFinal = pro;
  }

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
        ...(theme === 'xmas' && o.best
          ? [
              s(
                'svg',
                { class: 'ad-bow', viewBox: '0 0 60 46' },
                s('path', { d: 'M30,20C18,2 2,4 4,16C6,28 22,26 30,20Z', fill: '#e3122c' }),
                s('path', { d: 'M30,20C42,2 58,4 56,16C54,28 38,26 30,20Z', fill: '#e3122c' }),
                s('path', { d: 'M26,22L16,44L24,40L28,46L31,24Z', fill: '#c40d22' }),
                s('path', { d: 'M34,22L44,44L36,40L32,46L29,24Z', fill: '#c40d22' }),
                s('circle', { cx: 30, cy: 21, r: 6, fill: '#ff4d5e' }),
              ),
            ]
          : []),
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
    h('span', null, gift ? V.giftIdeal : C.ideal),
  );
  const who = h('div', { class: 'ad-who' }, `${likeText}: `, h('b', null, twin.name));
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
  await cut(beforeFinal, final);
  setSeg(gift ? 3 : 4);
  show(credit, 300, 'none');
  for (const pc of pcards) {
    show(pc, 260, 'translateY(10vw) scale(.94)');
    cue('pluck');
    await wait(180);
  }
  // The final darts get an extra second (owner, 19 Nov).
  await wait(2100);

  // ── Gift: the top dart drops into a box, the lid comes down, the bow pops. "Ingepakt."
  let beforeAsk: HTMLElement = final;
  if (gift) {
    const boxScene = scene();
    const boxPic = h('div', { class: 'ad-boxpic' }, picture(top.v));
    const body = s(
      'svg',
      { class: 'ad-boxbody', viewBox: '0 0 200 120' },
      s('rect', { x: 0, y: 0, width: 200, height: 120, rx: 8, fill: '#e3122c' }),
      s('rect', { x: 150, y: 0, width: 50, height: 120, rx: 8, fill: '#b70d22' }),
      s('rect', { x: 88, y: 0, width: 24, height: 120, fill: '#ffd166' }),
      s('rect', { x: 0, y: 0, width: 200, height: 10, fill: '#000', 'fill-opacity': 0.18 }),
    );
    const lid = s(
      'svg',
      { class: 'ad-lid', viewBox: '0 0 200 70' },
      s('rect', { x: 0, y: 10, width: 200, height: 52, rx: 9, fill: '#ff2e45' }),
      s('rect', { x: 150, y: 10, width: 50, height: 52, rx: 9, fill: '#d0142b' }),
      s('rect', { x: 88, y: 10, width: 24, height: 52, fill: '#ffd166' }),
    );
    const bigBow = s(
      'svg',
      { class: 'ad-bigbow', viewBox: '0 0 60 46' },
      s('path', { d: 'M30,24C16,2 0,6 2,18C4,30 22,30 30,24Z', fill: '#ffd166' }),
      s('path', { d: 'M30,24C44,2 60,6 58,18C56,30 38,30 30,24Z', fill: '#ffd166' }),
      s('path', { d: 'M30,24C22,10 12,12 13,18C14,24 24,26 30,24Z', fill: '#e8b23f' }),
      s('path', { d: 'M30,24C38,10 48,12 47,18C46,24 36,26 30,24Z', fill: '#e8b23f' }),
      s('circle', { cx: 30, cy: 25, r: 6.5, fill: '#f5c04f' }),
    );
    const sparks = Array.from({ length: 10 }, () =>
      s(
        'svg',
        { class: 'ad-spark', viewBox: '0 0 20 20' },
        s('path', { d: 'M10,0L12,8L20,10L12,12L10,20L8,12L0,10L8,8Z' }),
      ),
    );
    const box = h('div', { class: 'ad-box' }, boxPic, body, lid, bigBow, ...sparks);
    const boxName = h('div', { class: 'ad-boxname' }, dartName(top.v));
    boxScene.append(h('div', { class: 'ad-stage' }, box, boxName));
    hide(cap, 100);
    hide(credit, 120);
    await cut(final, boxScene);
    setSeg(4);
    show(boxPic, 280, 'scale(.6)');
    body.animate(
      [
        { transform: 'translateY(30vw)', opacity: 0 },
        { transform: 'none', opacity: 1 },
      ],
      { duration: 320, easing: OUT, fill: 'forwards' },
    );
    await wait(560);
    // In it goes, behind the front of the box.
    cue('plop');
    await boxPic.animate(
      [
        { transform: 'none' },
        { transform: 'translateY(-4vw) rotate(-6deg)', offset: 0.3 },
        { transform: 'translateY(24vw) scale(.7) rotate(3deg)', opacity: 1, offset: 0.85 },
        { transform: 'translateY(28vw) scale(.68) rotate(3deg)', opacity: 0 },
      ],
      { duration: 420, easing: 'ease-in', fill: 'forwards' },
    ).finished;
    // The lid comes down with a bounce.
    await lid.animate(
      [
        { transform: 'translateY(-70vw) rotate(-10deg)', opacity: 1 },
        { transform: 'translateY(2vw) rotate(1deg)', opacity: 1, offset: 0.75 },
        { transform: 'none', opacity: 1 },
      ],
      { duration: 380, easing: 'ease-in', fill: 'forwards' },
    ).finished;
    cue('boing');
    box.animate([{ transform: 'none' }, { transform: 'scale(1.04,.96)' }, { transform: 'none' }], {
      duration: 220,
      easing: OUT,
    });
    bigBow.animate(
      [
        { transform: 'scale(0) rotate(-20deg)', opacity: 1 },
        { transform: 'scale(1) rotate(0)', opacity: 1 },
      ],
      { duration: 360, easing: POP, fill: 'forwards' },
    );
    cue('tada');
    cue('sparkle');
    if (theme === 'xmas') cue('jingle:1');
    bang(0.3);
    sparks.forEach((sp, i) => {
      const ang = (i / sparks.length) * Math.PI * 2;
      sp.animate(
        [
          { transform: 'translate(0,0) scale(.3)', opacity: 1 },
          { transform: `translate(${Math.cos(ang) * 42}vw, ${Math.sin(ang) * 36}vw) scale(1)`, opacity: 0 },
        ],
        { duration: 700, delay: 80, easing: OUT, fill: 'forwards' },
      );
    });
    setCap(V.wrapped);
    await wait(260);
    show(boxName, 260);
    box.animate(
      [{ transform: 'none' }, { transform: 'rotate(-2deg) scale(1.02)' }, { transform: 'rotate(2deg) scale(1.02)' }, { transform: 'none' }],
      { duration: 700, delay: 300, easing: 'ease-in-out' },
    );
    await wait(1250);
    hide(cap, 100);
    beforeAsk = boxScene;
  }

  // ── The ask, then the empty board again: the first frame, so the video loops.
  const cta = scene();
  const ask = h('div', { class: 'ad-ask' }, askText);
  // Sized by the longest word as well, so "Weihnachtsgeschenk" never runs off the screen.
  const longest = Math.max(...askText.split(/\s+/).map((w) => w.length));
  const askVw = Math.min(askText.length > 18 ? 12.5 : 17, 88 / (longest * 0.56));
  ask.style.fontSize = `${askVw.toFixed(1)}vw`;
  const url = h('div', { class: 'ad-url' }, 'findyourdarts.com');
  const free = h('div', { class: 'ad-free' }, freeText);
  const worlds = theme === 'xmas' ? h('div', { class: 'ad-worlds' }, V.worlds) : null;
  cta.append(h('div', { class: 'ad-stage' }, ask, url, free, worlds));
  hide(prog, 160);
  hide(credit, 160);
  await cut(beforeAsk, cta);
  show(ask, 320, 'scale(.6) rotate(4deg)');
  await wait(320);
  show(url, 260);
  cue('tada');
  await wait(220);
  show(free, 240, 'rotate(-3deg) scale(.6)', 'rotate(-3deg)');
  if (worlds) {
    await wait(300);
    cue('sparkle');
    show(worlds, 300, 'translateY(4vw) scale(.7)');
  }
  // The website slide gets the time (owner, 19 Nov: "more time on the website slide").
  await wait(worlds ? 3300 : 3000);
  const back = scene(roomy ? 'roomy' : '');
  back.append(board());
  await cut(cta, back, 260);
  await wait(320);
  document.body.dataset.adPro = twin.name;
  document.body.dataset.adPct = String(proPct);
  document.body.dataset.adDone = '1';
}
