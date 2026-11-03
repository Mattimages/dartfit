/**
 * #/ad : a 9:16 motion ad (TikTok / Reels / Shorts), only in the demo build. Drawn like a pub
 * chalkboard, almost no words: a dart falls out of the board, the hand is measured in chalk, the
 * numbers fly into the model, three bell curves narrow, the catalogue is crossed off down to one
 * dart, darts land on the board with the match %, and the pro (a real photo when the renderer
 * passes one in window.__adPhoto) is revealed. All numbers come from the real engine for one
 * persona. The last frame is the first frame (the empty board), so the video loops.
 * Recorded by scripts/tiktok/ad.mjs, which also injects the handwriting font (AdHand).
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
import { variantArt } from '../score';
import { castFor, checkoutWin } from './hero-scan';
import { dartName } from './words';

declare global {
  interface Window {
    __adPhoto?: { src: string; credit: string };
  }
}

const COPY = {
  nl: { hook: 'Verkeerde dart?', like: 'Je gooit als', cta: 'Welke prof ben jij?' },
  en: { hook: 'Wrong dart?', like: 'You throw like', cta: 'Which pro are you?' },
  de: { hook: 'Falscher Dart?', like: 'Du wirfst wie', cta: 'Welcher Profi bist du?' },
};

const CHALK = '#f3efe4';
const RED = '#ff5a68';
const GREEN = '#5df0b0';
const CSS = `
.ad{position:fixed;inset:0;z-index:2147483000;overflow:hidden;color:${CHALK};
  font-family:AdHand,"Caveat","Segoe Print","Comic Sans MS",cursive;font-weight:700;
  background:radial-gradient(130% 90% at 50% 30%,#2a3a35 0%,#1c2925 55%,#121b18 100%)}
.ad *{box-sizing:border-box}
.ad-dust{position:absolute;inset:0;opacity:.5;pointer-events:none}
.ad-scene{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;opacity:0}
.ad .chalk{filter:url(#ad-rough)}
.ad .chalk *{fill:none!important;stroke:${CHALK}!important;stroke-width:2.2px!important;vector-effect:non-scaling-stroke;stroke-linecap:round;stroke-linejoin:round}
.ad .chalk .bc-red{fill:${RED}55!important;stroke:${RED}!important}
.ad .chalk .bc-green{fill:${GREEN}40!important;stroke:${GREEN}!important}
.ad .chalk .bc-num{fill:${CHALK}!important;stroke:none!important;font-family:inherit;font-weight:700}
.ad .chalk .hand-dot{fill:${RED}!important;stroke:none!important}
.ad .chalk .bw-flight,.ad .chalk .dart-flight{fill:${RED}66!important;stroke:${RED}!important}
.ad-word{font-size:19vw;line-height:.9;letter-spacing:-.01em;text-align:center;text-shadow:0 0 .4vw ${CHALK}88}
.ad-board{position:absolute;left:50%;bottom:-36vw;width:100vw;height:100vw;margin-left:-50vw}
.ad-fly{position:absolute;width:56vw;left:24vw;bottom:46vw;transform-origin:0% 50%;opacity:0}
.ad-hook .ad-word{position:absolute;top:16vh;left:0;right:0;opacity:0}
.ad-handbox{position:relative;width:74vw;height:100vw}
.ad-handbox svg.hand{position:absolute;inset:0;width:100%;height:100%}
.ad-dim{position:absolute;overflow:visible}
.ad-dim line,.ad-dim path{stroke:${GREEN};stroke-width:2.4px;vector-effect:non-scaling-stroke;fill:none;stroke-linecap:round}
.ad-num{position:absolute;font-size:9vw;color:${GREEN};white-space:nowrap;opacity:0;text-shadow:0 0 .4vw ${GREEN}88}
.ad-card{position:absolute;right:-4vw;bottom:4vw;width:34vw;aspect-ratio:85.6/54;border:.6vw solid ${CHALK};border-radius:2.4vw;transform:rotate(-8deg);opacity:0}
.ad-card::before{content:"";position:absolute;left:3vw;top:4.4vw;width:6vw;height:4.4vw;border:.5vw solid ${CHALK};border-radius:1vw}
.ad-core{position:absolute;left:50%;top:50%;width:44vw;height:44vw;margin:-22vw 0 0 -22vw}
.ad-core circle{fill:none;stroke:${GREEN};stroke-width:2.4px;vector-effect:non-scaling-stroke}
.ad-chip{position:absolute;font-size:10vw;white-space:nowrap;transform:translate(-50%,-50%);opacity:0}
.ad-curves{display:grid;gap:5vw;width:84vw}
.ad-curve{display:grid;grid-template-columns:1fr 34vw;align-items:end;gap:3vw}
.ad-curve svg{width:100%;height:20vw;overflow:visible}
.ad-curve path{fill:none;stroke:${CHALK};stroke-width:2.6px;vector-effect:non-scaling-stroke}
.ad-curve b{font-size:11vw;font-weight:700;text-align:right;color:${GREEN}}
.ad-formula{margin-top:7vw;font-size:7.4vw;color:${CHALK};clip-path:inset(0 100% 0 0)}
.ad-grid{display:grid;grid-template-columns:repeat(10,1fr);gap:2.2vw 1.4vw;width:86vw}
.ad-mini{position:relative;height:5.2vw}
.ad-mini svg{width:100%;height:100%;overflow:visible}
.ad-mini line{stroke:${CHALK};stroke-width:2px;vector-effect:non-scaling-stroke;stroke-linecap:round}
.ad-mini.x::after{content:"✕";position:absolute;inset:-2vw 0 0;text-align:center;font-size:7vw;line-height:1;color:${RED}}
.ad-mini.win{outline:.7vw solid ${GREEN};outline-offset:1.4vw;border-radius:50%}
.ad-count{margin-top:6vw;font-size:12vw;color:${GREEN}}
.ad-pick{font-size:8vw;text-align:center;margin-top:2vw;opacity:0}
.ad-match .bw{background:none}
.ad-match .bw-hit{width:84vw}
.ad-match .bw-word{font-family:inherit;font-weight:700;font-size:20vw;color:${GREEN};text-shadow:0 0 .6vw ${GREEN}}
.ad-pro{justify-content:flex-end;padding-bottom:9vh}
.ad-photo{position:absolute;left:6vw;right:6vw;top:6vh;height:52vh;border:1vw solid ${CHALK};border-radius:4vw;overflow:hidden;filter:url(#ad-rough);transform:rotate(-2deg)}
.ad-photo img{width:100%;height:100%;object-fit:cover;object-position:50% 22%}
.ad-credit{position:absolute;right:2.4vw;bottom:1.6vw;font-family:system-ui,sans-serif;font-weight:500;font-size:2.4vw;color:#fffc;text-shadow:0 1px 3px #000}aa}
.ad-pro .pro-art{width:78vw;margin-bottom:6vh;border-radius:5vw}
.ad-like{font-size:9vw;opacity:0}
.ad-proname{font-size:17vw;line-height:.9;text-align:center;opacity:0;text-shadow:0 0 .4vw ${CHALK}88}
.ad-pct{font-size:12vw;color:${GREEN};opacity:0}
.ad-cta .ad-word{font-size:15vw;padding:0 6vw}
.ad-url{margin-top:9vw;font-size:11vw;color:${GREEN};padding-bottom:1vw;border-bottom:.8vw solid ${GREEN};opacity:0}
`;

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const EASE_OUT = 'cubic-bezier(0.2, 0.8, 0.2, 1)';
const POP = 'cubic-bezier(0.34, 1.56, 0.64, 1)';
const show = (el: Element, ms = 260, from = 'translateY(3vw)') =>
  el.animate(
    [
      { opacity: 0, transform: from },
      { opacity: 1, transform: 'none' },
    ],
    { duration: ms, easing: EASE_OUT, fill: 'forwards' },
  );
/** Chalk being written: a left-to-right reveal. */
const write = (el: Element, ms = 500) =>
  el.animate(
    [
      { clipPath: 'inset(0 100% 0 0)', opacity: 1 },
      { clipPath: 'inset(0 0 0 0)', opacity: 1 },
    ],
    {
      duration: ms,
      easing: 'linear',
      fill: 'forwards',
    },
  );
/** A line being drawn. */
function drawIn(path: SVGGeometryElement, ms: number) {
  const len = path.getTotalLength?.() ?? 400;
  path.style.strokeDasharray = `${len}`;
  return path.animate([{ strokeDashoffset: len }, { strokeDashoffset: 0 }], {
    duration: ms,
    easing: 'ease-out',
    fill: 'forwards',
  });
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
  const top = c.barrels[c.barrels.length - 1]!;

  const style = document.createElement('style');
  style.textContent = CSS;
  // The chalk: a rough edge on every line, and dust on the board.
  const defs = s(
    'svg',
    { width: 0, height: 0, style: 'position:absolute' },
    s(
      'filter',
      { id: 'ad-rough' },
      s('feTurbulence', { type: 'fractalNoise', baseFrequency: 0.9, numOctaves: 2, result: 'n' }),
      s('feDisplacementMap', { in: 'SourceGraphic', in2: 'n', scale: 3 }),
    ),
  );
  const dust = s(
    'svg',
    { class: 'ad-dust', viewBox: '0 0 100 100', preserveAspectRatio: 'none' },
    s(
      'filter',
      { id: 'ad-dustf' },
      s('feTurbulence', { type: 'fractalNoise', baseFrequency: 0.35, numOctaves: 3 }),
    ),
    s('rect', { width: 100, height: 100, filter: 'url(#ad-dustf)', opacity: 0.08 }),
  );
  const ad = h('div', { class: 'ad', 'aria-hidden': 'true' }, defs, dust);
  root.append(style, ad);
  const fade = (el: HTMLElement, to: 0 | 1, ms = 220) =>
    el.animate([{ opacity: to ? 0 : 1 }, { opacity: to }], { duration: ms, fill: 'forwards' }).finished;
  const chalkBoard = () => {
    const b = boardSvg('ad-board chalk');
    return b;
  };

  // 1. The loop's first frame is the empty board. "Verkeerde dart?", the dart hits and falls out.
  const hook = h('div', { class: 'ad-scene ad-hook' });
  const word = h('div', { class: 'ad-word' }, C.hook);
  const fly = variantArt(best.variant, 'ad-fly chalk') as unknown as HTMLElement;
  hook.append(word, chalkBoard(), fly);
  ad.append(hook);
  hook.style.opacity = '1';
  await wait(350);
  write(word, 420);
  await wait(450);
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
  await fade(hook, 0, 200);

  // 2. The scan, in chalk: the hand drawn, the pasje beside it, two dimension lines with numbers.
  const scan = h('div', { class: 'ad-scene' });
  const hand = handArt({ lengthMm: L, dots: true });
  hand.classList.add('hand', 'chalk');
  const card = h('div', { class: 'ad-card' });
  const dimL = s(
    'svg',
    { class: 'ad-dim', viewBox: '0 0 10 100', preserveAspectRatio: 'none' },
    s('path', { d: 'M5,0V100M1,4L5,0L9,4M1,96L5,100L9,96' }),
  );
  dimL.style.cssText = 'right:-7vw;top:4%;width:4vw;height:86%';
  const dimW = s(
    'svg',
    { class: 'ad-dim', viewBox: '0 0 100 10', preserveAspectRatio: 'none' },
    s('path', { d: 'M0,5H100M4,1L0,5L4,9M96,1L100,5L96,9' }),
  );
  dimW.style.cssText = 'left:22%;top:62%;width:52%;height:4vw';
  const numL = h('div', { class: 'ad-num' }, `${num(L, 0)} mm`);
  numL.style.cssText = 'right:-8vw;top:-11vw';
  const numW = h('div', { class: 'ad-num' }, `${num(m.palmWidthMm, 0)} mm`);
  numW.style.cssText = 'left:30%;top:66%';
  const box = h('div', { class: 'ad-handbox' }, hand, card, dimL, dimW, numL, numW);
  scan.append(box);
  ad.append(scan);
  scan.style.opacity = '1';
  const strokes = [...hand.querySelectorAll<SVGGeometryElement>('path')];
  strokes.forEach((p) => drawIn(p, 900));
  const dots = [...hand.querySelectorAll<SVGElement>('.hand-dot')];
  dots.forEach((d, i) =>
    d.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 120, delay: 500 + i * 28, fill: 'both' }),
  );
  await wait(700);
  show(card, 260, 'rotate(-8deg) translateY(6vw)');
  await wait(400);
  for (const [dim, label] of [
    [dimL, numL],
    [dimW, numW],
  ] as const) {
    drawIn(dim.querySelector('path')!, 380);
    await wait(250);
    show(label, 220);
    await wait(250);
  }
  await wait(700);
  await fade(scan, 0, 160);

  // 3. The numbers fly into the model: a chalk core that spins up.
  const core = h('div', { class: 'ad-scene' });
  const ring = s(
    'svg',
    { class: 'ad-core', viewBox: '0 0 100 100' },
    s('circle', { cx: 50, cy: 50, r: 46, 'stroke-dasharray': '6 5' }),
    s('circle', { cx: 50, cy: 50, r: 34 }),
    s('circle', { cx: 50, cy: 50, r: 22, 'stroke-dasharray': '2 4' }),
  );
  const tr = f.trajectory;
  const values = [
    `${num(L, 0)}`,
    `${num(m.palmWidthMm, 0)}`,
    num(m.middleLengthMm / m.palmWidthMm, 2),
    `${a.heightCm}`,
    tr ? `${num(tr.angleDeg, 0)}°` : '·',
    `${a.fingers}×`,
    `${a.gripFeel}/5`,
  ];
  const spots = [
    [18, 16],
    [76, 14],
    [84, 44],
    [80, 80],
    [22, 84],
    [12, 50],
    [50, 10],
  ];
  const chips = values.map((v, i) => {
    const el = h('div', { class: 'ad-chip' }, v);
    el.style.cssText = `left:${spots[i]![0]}%;top:${spots[i]![1]}%`;
    return el;
  });
  core.append(ring, ...chips);
  ad.append(core);
  core.style.opacity = '1';
  ring.animate([{ transform: 'rotate(0) scale(.6)' }, { transform: 'rotate(240deg) scale(1)' }], {
    duration: 2000,
    easing: EASE_OUT,
    fill: 'forwards',
  });
  for (const el of chips) {
    show(el, 160, 'translate(-50%,-50%) scale(1.6)');
    el.animate([{ transform: 'translate(-50%,-50%)' }, { transform: 'translate(-50%,-50%)' }], {
      duration: 1,
    });
    await wait(110);
  }
  await wait(250);
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
          { duration: 520, delay: i * 40, easing: 'cubic-bezier(0.6, 0, 0.9, 0.4)', fill: 'forwards' },
        ).finished,
    ),
  );
  await ring.animate(
    [{ transform: 'rotate(240deg) scale(1)' }, { transform: 'rotate(300deg) scale(1.25)', opacity: 0 }],
    {
      duration: 300,
      fill: 'forwards',
    },
  ).finished;
  core.remove();

  // 4. The maths: three bell curves narrowing on weight, length and thickness.
  const model = h('div', { class: 'ad-scene' });
  const dims = [
    { e: f.weight, unit: 'g', dp: 1 },
    { e: f.length, unit: 'mm', dp: 0 },
    { e: f.diameter, unit: 'mm', dp: 1 },
  ];
  const curves = dims.map((d) => {
    const path = s('path', {}) as unknown as SVGPathElement;
    const val = h('b', null, '');
    return {
      d,
      path,
      val,
      el: h(
        'div',
        { class: 'ad-curve' },
        s('svg', { viewBox: '0 0 200 40', preserveAspectRatio: 'none' }, path),
        val,
      ),
    };
  });
  const formula = h('div', { class: 'ad-formula' }, 'Σ ((x − μ) / σ)² → min');
  model.append(h('div', { class: 'ad-curves' }, ...curves.map((x) => x.el)), formula);
  ad.append(model);
  model.style.opacity = '1';
  const bell = (spread: number) => {
    const pts: string[] = [];
    for (let i = 0; i <= 50; i++) {
      const x = (i / 50) * 6 - 3;
      const y = Math.exp(-0.5 * (x / (spread * 0.6)) ** 2);
      pts.push(`${((i / 50) * 200).toFixed(1)},${(40 - y * 36).toFixed(1)}`);
    }
    return `M${pts.join('L')}`;
  };
  curves.forEach((x) => {
    x.path.setAttribute('d', bell(3));
    drawIn(x.path, 500);
  });
  write(formula, 900);
  const t0 = performance.now();
  for (;;) {
    const p = Math.min(1, (performance.now() - t0) / 1500);
    const e = 1 - Math.pow(1 - p, 3);
    for (const x of curves) {
      if (p > 0.3) {
        x.path.style.strokeDasharray = '';
        x.path.setAttribute('d', bell(3 - 2.4 * e));
      }
      x.val.textContent = `${num(x.d.e.mu * e, x.d.dp)} ${x.d.unit}`;
    }
    if (p >= 1) break;
    await wait(30);
  }
  await wait(900);
  await fade(model, 0, 160);

  // 5. The catalogue: every dart on the board, crossed off until one is left.
  const ranked = pool.map((v) => ({ v, cost: scoreVariant(f, v).cost })).sort((x, y) => x.cost - y.cost);
  const cells = Math.min(100, ranked.length);
  const winAt = 46;
  const grid = h('div', { class: 'ad-grid' });
  const minis = Array.from({ length: cells }, () => {
    const el = h(
      'div',
      { class: 'ad-mini' },
      s(
        'svg',
        { viewBox: '0 0 40 10' },
        s('line', { x1: 2, y1: 5, x2: 38, y2: 5 }),
        s('line', { x1: 12, y1: 3, x2: 22, y2: 3 }),
        s('line', { x1: 12, y1: 7, x2: 22, y2: 7 }),
      ),
    );
    return el;
  });
  grid.append(...minis);
  const count = h('div', { class: 'ad-count' }, String(ranked.length));
  const pick = h('div', { class: 'ad-pick' }, dartName(top.v));
  const search = h('div', { class: 'ad-scene' }, grid, count, pick);
  ad.append(search);
  await fade(search, 1, 150);
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
    count.textContent = String(Math.max(1, Math.round(ranked.length - (ranked.length - 1) * p)));
    await wait(30);
  }
  minis[winAt]!.classList.add('win');
  minis[winAt]!.animate(
    [{ transform: 'scale(1)' }, { transform: 'scale(1.6)' }, { transform: 'scale(1.2)' }],
    {
      duration: 420,
      easing: POP,
      fill: 'forwards',
    },
  );
  show(pick, 260);
  await wait(1100);
  await fade(search, 0, 160);

  // 6. The match: darts on the board and "83%".
  const match = h('div', { class: 'ad-scene ad-match' });
  const win = checkoutWin(top.m.total);
  win.el.querySelector('svg')?.classList.add('chalk');
  const wordEl = win.el.querySelector('.bw-word');
  if (wordEl) wordEl.textContent = `${top.m.total}%`;
  match.append(win.el);
  ad.append(match);
  match.style.opacity = '1';
  await wait(win.ms - 200);
  await fade(match, 0, 160);

  // 7. The pro: their photo (or the player card), the name, the %.
  const pro = h('div', { class: 'ad-scene ad-pro' });
  const photo = window.__adPhoto;
  const like = h('div', { class: 'ad-like' }, C.like);
  const name = h('div', { class: 'ad-proname' }, c.twin.name);
  const pct = h('div', { class: 'ad-pct' }, `${top.m.total}%`);
  let hero: HTMLElement;
  if (photo) {
    hero = h(
      'div',
      { class: 'ad-photo' },
      h('img', { src: photo.src, alt: '' }),
      photo.credit ? h('div', { class: 'ad-credit' }, photo.credit) : null,
    );
    pro.append(hero, like, name, pct);
  } else {
    hero = proArt(c.twin) as unknown as HTMLElement;
    pro.style.justifyContent = 'center';
    pro.style.paddingBottom = '0';
    pro.append(hero, like, name, pct);
  }
  ad.append(pro);
  pro.style.opacity = '1';
  await hero.animate(
    [
      { transform: 'scale(1.5) rotate(-8deg)', opacity: 0 },
      { transform: 'scale(1) rotate(-2deg)', opacity: 1 },
    ],
    { duration: 460, easing: POP, fill: 'forwards' },
  ).finished;
  write(like, 300);
  await wait(250);
  write(name, 520);
  await wait(500);
  show(pct, 240);
  await wait(1800);
  await fade(pro, 0, 200);

  // 8. The ask, then the empty board again: the first frame, so the video loops.
  const cta = h('div', { class: 'ad-scene ad-cta' });
  const ask = h('div', { class: 'ad-word' }, C.cta);
  const url = h('div', { class: 'ad-url' }, 'findyourdarts.com');
  cta.append(ask, url);
  ad.append(cta);
  cta.style.opacity = '1';
  write(ask, 600);
  await wait(650);
  write(url, 500);
  await wait(2000);
  await fade(cta, 0, 250);
  const back = h('div', { class: 'ad-scene ad-hook' }, chalkBoard());
  ad.append(back);
  await fade(back, 1, 300);
  await wait(350);
  document.body.dataset.adDone = '1';
}
