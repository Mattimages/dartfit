/**
 * #/ad : a 9:16 motion ad (TikTok / Reels / Shorts), only in the demo build. Not a tour of the
 * site: a hook, the scan, three quick answers, the match, the pro reveal and the address, in about
 * 19 seconds. Everything comes from the real engine for one persona, so the numbers are true.
 * Recorded to video by scripts/tiktok/ad.mjs.
 *
 *   #/ad?L=178&h=180&hold=rear&f=4&throw=flat&g=1      (hand length mm, height cm, answers)
 */
import type { Answers, Measurements } from '@dartfit/engine';
import { h } from '../h';
import { getLang, num, t } from '../i18n';
import { createFit, variants } from '../api';
import { boardSvg } from '../draw/checkout';
import { handArt, SKIN_TONES, templateHand } from '../draw/art';
import { proArt } from '../draw/pro-art';
import { variantArt } from '../score';
import { castFor } from './hero-scan';
import { dartName } from './words';

const COPY = {
  nl: {
    hook: ['Gooi jij', 'met de', 'verkeerde', 'dart?'],
    scan: 'Scan je hand naast een pasje',
    hand: 'Hand',
    asks: '3 tikken over hoe je gooit',
    finding: 'We zoeken jouw dart',
    best: 'Beste match',
    like: 'Je gooit als',
    cta: 'Welke prof ben jij?',
    sub: 'Gratis, in 1 minuut',
  },
  en: {
    hook: ['Are you', 'throwing', 'the wrong', 'dart?'],
    scan: 'Scan your hand next to a bank card',
    hand: 'Hand',
    asks: '3 taps on how you throw',
    finding: 'Finding your dart',
    best: 'Best match',
    like: 'You throw like',
    cta: 'Which pro are you?',
    sub: 'Free, in 1 minute',
  },
  de: {
    hook: ['Wirfst du', 'mit dem', 'falschen', 'Dart?'],
    scan: 'Scanne deine Hand neben einer Bankkarte',
    hand: 'Hand',
    asks: '3 Tipps, wie du wirfst',
    finding: 'Wir suchen deinen Dart',
    best: 'Bester Match',
    like: 'Du wirfst wie',
    cta: 'Welcher Profi bist du?',
    sub: 'Kostenlos, in 1 Minute',
  },
};

const CSS = `
.ad{position:fixed;inset:0;z-index:2147483000;overflow:hidden;color:#fff;font-family:"Geist Variable",system-ui,sans-serif;
  background:radial-gradient(120% 80% at 50% 0%,#1d3762 0%,#0f1b2d 55%,#0a121f 100%)}
.ad *{box-sizing:border-box}
.ad-scene{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:0 7vw;opacity:0}
.ad-hook{align-items:flex-start;justify-content:flex-start;padding-top:22vh;gap:0}
.ad-hook span{display:block;font-size:17vw;line-height:.95;font-weight:650;letter-spacing:-.055em;opacity:0}
.ad-hook span.red{color:#ff2d46}
.ad-board{position:absolute;left:50%;bottom:-38vw;width:96vw;height:96vw;margin-left:-48vw;opacity:.95}
.ad-fly{position:absolute;width:62vw;left:19vw;bottom:44vw;transform-origin:0% 50%}
.ad-title{position:absolute;top:9vh;left:7vw;right:7vw;font-size:8.4vw;line-height:1.05;font-weight:650;letter-spacing:-.04em;text-align:center;text-wrap:balance}
.ad-handbox{position:relative;width:74vw;height:96vw;margin-top:8vh}
.ad-handbox svg.hand{position:absolute;inset:0;width:100%;height:100%}
.ad-card{position:absolute;right:-6vw;bottom:6vw;width:34vw;aspect-ratio:85.6/54;border-radius:2.4vw;
  background:linear-gradient(135deg,#3d6fd8,#1c3f8f);box-shadow:0 2vw 6vw rgb(0 0 0/.5);transform:rotate(-8deg)}
.ad-card::before{content:"";position:absolute;left:3.4vw;top:5vw;width:6vw;height:4.4vw;border-radius:1vw;background:linear-gradient(135deg,#f6d77a,#c69a2c)}
.ad-scanline{position:absolute;left:-6vw;right:-6vw;height:1.2vw;top:0;border-radius:1vw;background:#2ee59d;box-shadow:0 0 6vw 2vw rgb(46 229 157/.55)}
.ad-measure{position:absolute;bottom:10vh;left:0;right:0;text-align:center;font-size:13vw;font-weight:650;letter-spacing:-.05em;font-variant-numeric:tabular-nums}
.ad-measure small{display:block;font-size:5vw;font-weight:550;letter-spacing:-.01em;color:#9fb0c8}
.ad-q{position:absolute;left:6vw;right:6vw;top:32vh;display:grid;gap:5vw;opacity:0}
.ad-q h3{margin:0;font-size:12.5vw;line-height:1;font-weight:650;letter-spacing:-.05em}
.ad-opts{display:grid;grid-template-columns:repeat(3,1fr);gap:2.6vw}
.ad-opt{padding:6.5vw 1vw;border-radius:4.4vw;background:rgb(255 255 255/.1);box-shadow:inset 0 0 0 1px rgb(255 255 255/.18);
  text-align:center;font-size:6.2vw;font-weight:650;transition:background .2s,transform .2s}
.ad-opt.on{background:#e3122c;box-shadow:none;transform:scale(1.06)}
.ad-tap{position:absolute;width:16vw;height:16vw;margin:-8vw 0 0 -8vw;border-radius:50%;background:rgb(255 255 255/.6);pointer-events:none}
.ad-dartrow{position:relative;width:112%;height:40vw;margin-top:2vh}
.ad-dartrow svg{position:absolute;left:0;top:0;width:100%;height:100%}
.ad-pct{font-size:30vw;line-height:.9;font-weight:650;letter-spacing:-.06em;font-variant-numeric:tabular-nums;margin-top:4vh}
.ad-pct.win{color:#2ee59d}
.ad-dname{margin-top:3vw;font-size:6.4vw;font-weight:600;letter-spacing:-.03em;text-align:center;text-wrap:balance;min-height:16vw}
.ad-badge{margin-top:2vw;padding:1.6vw 4vw;border-radius:99px;background:#2ee59d;color:#0a121f;font-size:4.6vw;font-weight:650;opacity:0}
.ad-like{font-size:7vw;font-weight:600;color:#c5d1e2;letter-spacing:-.02em}
.ad-pro .pro-art{width:78vw;margin:4vw 0;border-radius:5vw;box-shadow:0 0 0 1.2vw #fff,0 6vw 14vw rgb(0 0 0/.6)}
.ad-proname{font-size:14vw;line-height:.95;font-weight:650;letter-spacing:-.055em;text-align:center;text-wrap:balance}
.ad-flash{position:absolute;inset:0;background:#fff;opacity:0;pointer-events:none}
.ad-cta h2{margin:0;font-size:14vw;line-height:.95;font-weight:650;letter-spacing:-.055em;text-align:center;text-wrap:balance}
.ad-cta p{margin:5vw 0 9vw;font-size:6vw;font-weight:550;color:#c5d1e2}
.ad-url{padding:4.4vw 8vw;border-radius:99px;background:#e3122c;font-size:8vw;font-weight:650;letter-spacing:-.035em;box-shadow:0 3vw 9vw rgb(227 18 44/.45)}
.ad-mark{position:absolute;bottom:7vh;font-size:5.4vw;font-weight:650;letter-spacing:-.03em;opacity:.85}
`;

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const EASE_OUT = 'cubic-bezier(0.2, 0.8, 0.2, 1)';
const POP = 'cubic-bezier(0.34, 1.56, 0.64, 1)';

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
  const best = result.recommendation.picks[0];
  if (!best) return;
  const pool = variants().filter((v) => v.tip === 'steel' && !v.specCheck);
  const c = castFor(
    result.fit,
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

  const style = document.createElement('style');
  style.textContent = CSS;
  const ad = h('div', { class: 'ad', 'aria-hidden': 'true' });
  root.append(style, ad);
  const show = (el: HTMLElement, ms = 220) =>
    el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: ms, fill: 'forwards' }).finished;
  const hide = (el: HTMLElement, ms = 220) =>
    el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: ms, fill: 'forwards' }).finished;

  // 1. Hook: four words slam in, a dart thunks into the board.
  const hook = h('div', { class: 'ad-scene ad-hook' });
  const words = C.hook.map((w, i) => h('span', { class: i === 2 ? 'red' : '' }, w));
  const board = boardSvg('ad-board');
  const fly = variantArt(best.variant, 'ad-fly') as unknown as HTMLElement;
  hook.append(...words, board, fly);
  ad.append(hook);
  hook.style.opacity = '1';
  fly.style.opacity = '0';
  for (const w of words) {
    w.animate(
      [
        { opacity: 0, transform: 'scale(1.7) translateY(2vw)' },
        { opacity: 1, transform: 'scale(1)' },
      ],
      { duration: 260, easing: EASE_OUT, fill: 'forwards' },
    );
    await wait(250);
  }
  fly.style.opacity = '1';
  await fly.animate(
    [{ transform: 'translate(70vw, -30vw) rotate(-14deg)' }, { transform: 'translate(0, 0) rotate(28deg)' }],
    { duration: 380, easing: 'cubic-bezier(0.5, 0, 0.9, 0.6)', fill: 'forwards' },
  ).finished;
  hook.animate(
    [
      { transform: 'translate(0,0)' },
      { transform: 'translate(-2vw,1vw)' },
      { transform: 'translate(2vw,-1vw)' },
      { transform: 'translate(-1vw,0)' },
      { transform: 'translate(0,0)' },
    ],
    { duration: 260 },
  );
  await wait(900);
  await hide(hook, 200);

  // 2. The scan: the hand next to the card, a scan line, the dots and the length counting up.
  const scan = h('div', { class: 'ad-scene' });
  const hand = handArt({ lengthMm: L, dots: true });
  hand.classList.add('hand');
  const [skin, hi, shade, nail] = SKIN_TONES[1];
  hand.style.cssText = `--skin:${skin};--skin-hi:${hi};--skin-shade:${shade};--nail:${nail}`;
  const line = h('div', { class: 'ad-scanline' });
  const box = h('div', { class: 'ad-handbox' }, hand, h('div', { class: 'ad-card' }), line);
  const meas = h('div', { class: 'ad-measure' }, '0 mm', h('small', null, C.hand));
  scan.append(h('div', { class: 'ad-title' }, C.scan), box, meas);
  ad.append(scan);
  await show(scan, 200);
  hand.querySelectorAll<SVGElement>('.hand-dot').forEach((d) => (d.style.opacity = '0'));
  const sweep = line.animate([{ top: '4%' }, { top: '94%' }, { top: '4%' }], {
    duration: 1500,
    easing: 'ease-in-out',
  });
  const dots = [...hand.querySelectorAll<SVGElement>('.hand-dot')];
  const t0 = performance.now();
  for (;;) {
    const p = Math.min(1, (performance.now() - t0) / 1500);
    meas.firstChild!.textContent = `${num(Math.round(L * (1 - Math.pow(1 - p, 3))))} mm`;
    dots.forEach((d, i) => {
      if (i / dots.length <= p) d.style.opacity = '1';
    });
    if (p >= 1) break;
    await wait(40);
  }
  await sweep.finished;
  line.remove();
  meas.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.12)' }, { transform: 'scale(1)' }], {
    duration: 300,
    easing: POP,
  });
  await wait(700);
  await hide(scan, 200);

  // 3. Three questions, one tap each.
  const qs = h('div', { class: 'ad-scene' });
  qs.append(h('div', { class: 'ad-title' }, C.asks));
  ad.append(qs);
  await show(qs, 150);
  const ask = async (title: string, opts: Array<[string, string]>, pick: string) => {
    const cells = opts.map(([v, label]) => h('div', { class: 'ad-opt', 'data-v': v }, label));
    const card = h('div', { class: 'ad-q' }, h('h3', null, title), h('div', { class: 'ad-opts' }, ...cells));
    qs.append(card);
    await card.animate(
      [
        { opacity: 0, transform: 'translateX(30vw)' },
        { opacity: 1, transform: 'none' },
      ],
      { duration: 260, easing: EASE_OUT, fill: 'forwards' },
    ).finished;
    await wait(260);
    const on = cells.find((x) => x.dataset.v === pick) ?? cells[0]!;
    const r = on.getBoundingClientRect();
    const tap = h('div', { class: 'ad-tap' });
    tap.style.cssText = `left:${r.left + r.width / 2}px;top:${r.top + r.height / 2}px`;
    ad.append(tap);
    tap.animate(
      [
        { transform: 'scale(.3)', opacity: 1 },
        { transform: 'scale(1.6)', opacity: 0 },
      ],
      { duration: 450, fill: 'forwards' },
    );
    on.classList.add('on');
    await wait(420);
    tap.remove();
    await card.animate(
      [
        { opacity: 1, transform: 'none' },
        { opacity: 0, transform: 'translateX(-30vw)' },
      ],
      { duration: 200, easing: 'ease-in', fill: 'forwards' },
    ).finished;
    card.remove();
  };
  await ask(
    t('q.hold'),
    (['front', 'middle', 'rear'] as const).map((v) => [v, t(`q.hold.${v}`)]),
    a.hold,
  );
  await ask(
    t('q.fingers'),
    ([2, 3, 4] as const).map((v) => [String(v), t('q.fingers.unit', { n: v })]),
    String(a.fingers),
  );
  await ask(
    t('q.throw'),
    (['flat', 'arc', 'unsure'] as const).map((v) => [v, t(`q.throw.${v}`)]),
    a.throwStyle,
  );
  await hide(qs, 150);

  // 4. The match: three real darts, the score climbing to the best one.
  const match = h('div', { class: 'ad-scene' });
  const row = h('div', { class: 'ad-dartrow' });
  const pct = h('div', { class: 'ad-pct' }, '0%');
  const dname = h('div', { class: 'ad-dname' });
  const badge = h('div', { class: 'ad-badge' }, C.best);
  match.append(h('div', { class: 'ad-title' }, C.finding), row, pct, dname, badge);
  ad.append(match);
  await show(match, 150);
  let from = 0;
  for (const [i, b] of c.barrels.entries()) {
    const last = i === c.barrels.length - 1;
    const art = variantArt(b.v) as unknown as HTMLElement;
    row.replaceChildren(art);
    dname.textContent = dartName(b.v);
    art.animate([{ transform: 'translateX(90vw)' }, { transform: 'none' }], {
      duration: 300,
      easing: EASE_OUT,
    });
    const to = b.m.total;
    const s0 = performance.now();
    for (;;) {
      const p = Math.min(1, (performance.now() - s0) / 520);
      pct.textContent = `${Math.round(from + (to - from) * (1 - Math.pow(1 - p, 3)))}%`;
      if (p >= 1) break;
      await wait(30);
    }
    from = to;
    if (last) {
      pct.classList.add('win');
      pct.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.15)' }, { transform: 'scale(1)' }], {
        duration: 380,
        easing: POP,
      });
      badge.animate(
        [
          { opacity: 0, transform: 'translateY(3vw)' },
          { opacity: 1, transform: 'none' },
        ],
        { duration: 260, fill: 'forwards' },
      );
      await wait(1100);
    } else {
      await wait(380);
      await art.animate([{ transform: 'none' }, { transform: 'translateX(-90vw)' }], {
        duration: 220,
        easing: 'ease-in',
        fill: 'forwards',
      }).finished;
    }
  }
  await hide(match, 180);

  // 5. The reveal: flash, the player card slams in, the name.
  const pro = h('div', { class: 'ad-scene ad-pro' });
  const card = proArt(c.twin) as unknown as HTMLElement;
  const name = h('div', { class: 'ad-proname' }, c.twin.name);
  const like = h('div', { class: 'ad-like' }, C.like);
  const flash = h('div', { class: 'ad-flash' });
  pro.append(like, card, name);
  ad.append(pro, flash);
  pro.style.opacity = '1';
  like.style.opacity = '0';
  name.style.opacity = '0';
  flash.animate([{ opacity: 0.9 }, { opacity: 0 }], { duration: 420, fill: 'forwards' });
  await card.animate(
    [
      { transform: 'scale(2.4) rotate(-10deg)', opacity: 0 },
      { transform: 'scale(1) rotate(0)', opacity: 1 },
    ],
    { duration: 420, easing: POP, fill: 'forwards' },
  ).finished;
  like.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200, fill: 'forwards' });
  name.animate(
    [
      { opacity: 0, transform: 'translateY(6vw)' },
      { opacity: 1, transform: 'none' },
    ],
    { duration: 300, easing: EASE_OUT, fill: 'forwards' },
  );
  await wait(1900);
  await hide(pro, 200);

  // 6. The ask.
  const cta = h('div', { class: 'ad-scene ad-cta' });
  const url = h('div', { class: 'ad-url' }, 'findyourdarts.com');
  cta.append(h('h2', null, C.cta), h('p', null, C.sub), url, h('div', { class: 'ad-mark' }, 'DartFit'));
  ad.append(cta);
  await show(cta, 200);
  url.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.07)' }, { transform: 'scale(1)' }], {
    duration: 900,
    iterations: 3,
    easing: 'ease-in-out',
  });
  await wait(2700);
  document.body.dataset.adDone = '1';
}
