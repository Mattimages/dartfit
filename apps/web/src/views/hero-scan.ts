/**
 * The landing hero, as one short film: a hand is scanned, measurement lines are drawn on it, the
 * measurements become the ideal barrel, three real barrels slide over it (each pausing to show how
 * well it fits), the last is the best match, and it ends on the shop cards: the best match, then
 * the other price classes pushing up beneath it.
 *
 * Every number is real: the engine fits an average hand, the barrels are catalogue darts and the
 * percentages are their silhouette overlap with the ideal.
 */
import {
  fit,
  radiusAt,
  priceTiers,
  recommend,
  silhouetteOverlap,
  tierBoundsUsd,
  variantBarrel,
  type Silhouette,
  type Variant,
} from '@dartfit/engine';
import { handArt, templateHand, type MmPoint } from '../draw/art';
import { h } from '../h';
import { num, t } from '../i18n';
import { approxEur } from '../money';
import { photoUrl } from '../media';
import { dartName } from './words';

const SVG = 'http://www.w3.org/2000/svg';
const s = (tag: string, attrs: Record<string, string | number> = {}, text?: string) => {
  const el = document.createElementNS(SVG, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
  if (text) el.textContent = text;
  return el;
};
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const dist = (a: MmPoint, b: MmPoint) => Math.hypot(a.x - b.x, a.y - b.y);

interface Cast {
  hand: { lengthMm: number; length: number; knuckles: number; index: number; points: MmPoint[] };
  ideal: Silhouette & { massG: number };
  barrels: Array<{ v: Variant; shape: Silhouette; overlap: number }>;
  /** The price classes for the closing shot: the best match first, then the others. */
  options: Array<{ tier: Tier; v: Variant; overlap: number; best: boolean }>;
}
type Tier = 'budget' | 'standard' | 'premium';
const TIERS: Tier[] = ['budget', 'standard', 'premium'];

/** A thrower for one round of the film: a plausible hand and how they hold and throw. */
interface Thrower {
  lengthMm: number;
  hold: 'front' | 'middle' | 'rear';
  fingers: 3 | 4;
  throwStyle: 'flat' | 'arc' | 'unsure';
  gripFeel: 2 | 3 | 4;
}
const FIRST: Thrower = { lengthMm: 186, hold: 'middle', fingers: 3, throwStyle: 'unsure', gripFeel: 3 };
const pickOne = <T>(xs: readonly T[]) => xs[Math.floor(Math.random() * xs.length)]!;
/** Adult hand lengths cluster around 188 mm (about ±9 mm); clipped to 168–206. */
function randomThrower(): Thrower {
  const g = Math.sqrt(-2 * Math.log(1 - Math.random())) * Math.cos(2 * Math.PI * Math.random());
  return {
    lengthMm: Math.round(Math.min(206, Math.max(168, 188 + 9 * g))),
    hold: pickOne(['front', 'middle', 'middle', 'rear'] as const),
    fingers: pickOne([3, 3, 4] as const),
    throwStyle: pickOne(['flat', 'arc', 'unsure'] as const),
    gripFeel: pickOne([2, 3, 3, 4] as const),
  };
}

/** The hand, the ideal and three darts in rising order of fit; the last is the engine's pick. */
function cast(pool: Variant[], who: Thrower = FIRST): Cast | null {
  const points = templateHand(who.lengthMm);
  const hand = {
    lengthMm: who.lengthMm,
    length: dist(points[0]!, points[12]!),
    knuckles: dist(points[5]!, points[17]!),
    index: dist(points[5]!, points[8]!),
    points,
  };
  const f = fit(
    {
      handLengthMm: hand.length,
      palmWidthMm: hand.knuckles,
      indexLengthMm: hand.index,
      middleLengthMm: dist(points[9]!, points[12]!),
      thumbIndexSpanMm: dist(points[4]!, points[8]!),
      spreadMm: 1,
      samples: 18,
      calibrated: false,
    },
    {
      tip: 'steel',
      hold: who.hold,
      fingers: who.fingers,
      throwStyle: who.throwStyle,
      moisture: 'normal',
      gripFeel: who.gripFeel,
      thickness: 'auto',
    },
  );
  const scored = pool.map((v) => {
    const shape = variantBarrel(v);
    return { v, shape, overlap: silhouetteOverlap(f.barrel, shape) };
  });
  const top = recommend(f, pool).picks.map((p) => p.variant.id);
  const best = scored.find((x) => x.v.id === top[0]) ?? [...scored].sort((a, b) => b.overlap - a.overlap)[0];
  if (!best) return null;
  // Two near misses from other brands: a clear miss, then a close one.
  const near = (target: number, avoid: string[]) =>
    scored
      .filter((x) => !avoid.includes(x.v.brand) && x.overlap < best.overlap - 0.04)
      .sort((a, b) => Math.abs(a.overlap - target) - Math.abs(b.overlap - target))[0];
  const first = near(best.overlap - 0.22, [best.v.brand]);
  const second = first && near(best.overlap - 0.1, [best.v.brand, first.v.brand]);
  if (!first || !second) return null;
  // One dart per price class; the best match stands for its own class.
  const bounds = tierBoundsUsd();
  const tierOf = (v: Variant): Tier =>
    (v.priceUsd ?? 0) <= bounds.budgetMaxUsd
      ? 'budget'
      : (v.priceUsd ?? 0) <= bounds.standardMaxUsd
        ? 'standard'
        : 'premium';
  const tiers = priceTiers(f, pool, bounds);
  const bestTier = tierOf(best.v);
  const others = TIERS.filter((k) => k !== bestTier)
    .map((k) => tiers[k])
    .filter((x): x is NonNullable<typeof x> => !!x)
    .map((x) => ({
      tier: tierOf(x.variant),
      v: x.variant,
      overlap: silhouetteOverlap(f.barrel, variantBarrel(x.variant)),
      best: false,
    }));
  return {
    hand,
    ideal: { ...f.barrel },
    barrels: [first, second, best].sort((a, b) => a.overlap - b.overlap),
    options: [{ tier: bestTier, v: best.v, overlap: best.overlap, best: true }, ...others],
  };
}

// Model drawing: 1 mm = K units, point on the left, barrel from X0.
const K = 4.4;
const X0 = 54;
const CY = 52;
function outline(b: Silhouette) {
  const top: string[] = [];
  const bottom: string[] = [];
  for (let i = 0; i <= 64; i++) {
    const u = i / 64;
    const r = (b.diameterMm / 2) * K * radiusAt(b.profile, u);
    const x = (X0 + u * b.lengthMm * K).toFixed(1);
    top.push(`${x},${(CY - r).toFixed(1)}`);
    bottom.push(`${x},${(CY + r).toFixed(1)}`);
  }
  return `M${top.join('L')}L${bottom.reverse().join('L')}Z`;
}

function handLayer(c: Cast) {
  const art = handArt({ lengthMm: c.hand.lengthMm, dots: true, className: 'scan' });
  const vb = art.getAttribute('viewBox')!;
  const p = c.hand.points;
  const over = s('svg', { viewBox: vb, class: 'hs-measure', 'aria-hidden': 'true' });
  const xs = p.map((q) => q.x);
  const rx = Math.max(...xs) + 12;
  const line = (d: string, cls = 'hs-line') => s('path', { d, class: cls, pathLength: 1 });
  const label = (x: number, y: number, text: string, anchor = 'start') =>
    s('text', { x, y, class: 'hs-label', 'text-anchor': anchor }, text);
  const mm = (v: number) => `${num(v, 0)} mm`;
  const groups = [
    // Hand length: a ruler beside the hand, wrist to middle fingertip.
    s('g', { class: 'hs-m' }),
    // Knuckle width.
    s('g', { class: 'hs-m' }),
    // Index finger.
    s('g', { class: 'hs-m' }),
  ];
  groups[0]!.append(
    line(
      `M${rx},${p[0]!.y}L${rx},${p[12]!.y}M${rx - 4},${p[0]!.y}L${rx + 4},${p[0]!.y}M${rx - 4},${p[12]!.y}L${rx + 4},${p[12]!.y}`,
    ),
    (() => {
      // Written along the ruler so it never runs off the edge.
      const y = (p[0]!.y + p[12]!.y) / 2;
      const el = label(rx + 13, y, mm(c.hand.length), 'middle');
      el.setAttribute('transform', `rotate(-90 ${rx + 13} ${y})`);
      return el;
    })(),
  );
  groups[1]!.append(
    line(`M${p[5]!.x},${p[5]!.y}L${p[17]!.x},${p[17]!.y}`),
    label((p[5]!.x + p[17]!.x) / 2, Math.max(p[5]!.y, p[17]!.y) + 14, mm(c.hand.knuckles), 'middle'),
  );
  groups[2]!.append(
    line(`M${p[5]!.x},${p[5]!.y}L${p[6]!.x},${p[6]!.y}L${p[7]!.x},${p[7]!.y}L${p[8]!.x},${p[8]!.y}`),
    label(p[8]!.x - 6, p[8]!.y - 6, mm(c.hand.index), 'end'),
  );
  over.append(...groups);
  const layer = h('div', { class: 'hs-hand' }, art, over, h('div', { class: 'hs-beam' }));
  return { layer, groups };
}

function modelLayer(c: Cast) {
  const svg = s('svg', {
    viewBox: '0 0 320 112',
    class: 'hs-model',
    role: 'img',
    'aria-label': t('hs.aria'),
  });
  const idealEnd = X0 + c.ideal.lengthMm * K;
  const point = s('path', { d: `M14,${CY}L${X0},${CY - 2.6}L${X0},${CY + 2.6}Z`, class: 'hs-point' });
  const shaft = s('rect', {
    x: idealEnd,
    y: CY - 4,
    width: 300 - idealEnd,
    height: 8,
    rx: 2,
    class: 'hs-shaft',
  });
  const ideal = s('path', { d: outline(c.ideal), class: 'hs-ideal', pathLength: 1 });
  const idealLabel = s(
    'text',
    { x: X0, y: 16, class: 'hs-ideal-label' },
    `${t('hs.ideal')} · ${num(c.ideal.lengthMm, 0)} mm · ${num(c.ideal.massG, 0)} g`,
  );
  const cands = c.barrels.map((b) => {
    const g = s('g', { class: 'hs-cand' });
    g.append(
      s('path', { d: outline(b.shape) }),
      s('text', { x: X0, y: 104, class: 'hs-cand-label' }, `${dartName(b.v)} · ${num(b.v.weightG)} g`),
    );
    return g;
  });
  svg.append(point, shaft, ideal, ...cands, idealLabel);
  return { svg, ideal, idealLabel, cands, shaft, point };
}

/** The closing shot: the best match's card, then the other price classes pushing up beneath it. */
function shopCards(c: Cast) {
  const cards = c.options.map((o) => {
    const src = photoUrl(o.v.modelId, 400);
    const eur = o.v.priceUsd ? approxEur(o.v.priceUsd) : null;
    return h(
      'a',
      { class: `hs-card${o.best ? ' best' : ' later'}`, href: '#/scan' },
      src ? h('img', { src, alt: '', decoding: 'async' }) : null,
      h(
        'div',
        null,
        h(
          'span',
          { class: 'hs-card-top' },
          h('span', { class: `hs-tier tier-${o.tier}` }, t(`land.tier.${o.tier}`)),
          h('span', { class: 'hs-card-chip' }, `${Math.round(o.overlap * 100)}% ${t('hs.match')}`),
        ),
        h('b', null, dartName(o.v)),
        h('span', { class: 'hs-card-meta' }, `${num(o.v.weightG)} g${eur ? ` · €${eur}` : ''}`),
      ),
    );
  });
  return {
    box: h('div', { class: 'hs-cards' }, ...cards),
    later: cards.filter((x) => x.classList.contains('later')),
  };
}

/**
 * Build the hero and keep it running: the first round is an average hand, every round after that a
 * new plausible hand, grip and throw. Stops when the hero leaves the page. Null when the catalogue
 * cannot cast the story.
 */
export function heroScan(pool: Variant[]): HTMLElement | null {
  const first = cast(pool);
  if (!first) return null;
  const root = h('div', { class: 'hs', 'aria-label': t('hs.aria'), role: 'img' });
  void (async () => {
    let c: Cast = first;
    for (;;) {
      const finished = await play(root, c);
      if (!finished) return;
      await wait(4200);
      if (!root.isConnected) return;
      root.classList.add('hs-out');
      await wait(450);
      let next: Cast | null = null;
      for (let i = 0; i < 6 && !next; i++) next = cast(pool, randomThrower());
      c = next ?? first;
      root.classList.remove('hs-out');
    }
  })();
  return root;
}

/** One round of the film. Resolves true when it reached the shop card, false when it should stop. */
async function play(root: HTMLElement, c: Cast): Promise<boolean> {
  const { layer: hand, groups } = handLayer(c);
  const model = modelLayer(c);
  const modelBox = h('div', { class: 'hs-modelbox' }, model.svg);
  const step = h('span', { class: 'hs-step' });
  const chip = h('span', { class: 'hs-chip' }, h('b', null, '–'), h('span', null, t('hs.overlap')));
  const cards = shopCards(c);
  root.replaceChildren(h('div', { class: 'hs-stage' }, hand, modelBox, chip, step, cards.box));

  const still = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const alive = () => root.isConnected || !root.dataset.started;
  const setStep = (text: string) => (step.textContent = text);
  const last = model.cands.length - 1;
  const count = async (to: number, ms: number) => {
    const b = chip.firstChild as HTMLElement;
    const t0 = performance.now();
    for (;;) {
      const p = Math.min(1, (performance.now() - t0) / ms);
      b.textContent = `${Math.round(to * (1 - Math.pow(1 - p, 3)))}%`;
      if (p >= 1) break;
      await new Promise((r) => requestAnimationFrame(r));
    }
  };
  root.classList.remove('hs-build', 'hs-end', 'hs-stack');

  if (still) {
    // Reduced motion: the end state, no film.
    root.classList.add('hs-build', 'hs-end', 'hs-stack');
    cards.later.forEach((x) => x.classList.add('in'));
    groups.forEach((g) => g.classList.add('on'));
    chip.classList.add('on');
    model.cands.forEach((g, i) => g.classList.toggle('on', i === last));
    (chip.firstChild as HTMLElement).textContent = `${Math.round(c.barrels[last]!.overlap * 100)}%`;
    chip.classList.add('best');
    setStep(t('hs.step.best'));
    return false;
  }
  root.dataset.started = '1';

  // 1. Scan the hand.
  setStep(t('hs.step.scan'));
  hand.classList.add('scanning');
  await wait(1500);
  if (!alive()) return false;
  // 2. Draw the measurements one by one.
  setStep(t('hs.step.measure'));
  for (const g of groups) {
    g.classList.add('on');
    await wait(520);
    if (!alive()) return false;
  }
  await wait(500);
  // 3. The measurements become the ideal barrel.
  setStep(t('hs.step.model'));
  root.classList.add('hs-build');
  await wait(1300);
  if (!alive()) return false;
  // 4. Three real barrels over the ideal, each pausing to show the fit.
  chip.classList.add('on');
  for (let i = 0; i <= last; i++) {
    setStep(t('hs.step.compare', { i: i + 1, n: last + 1 }));
    const g = model.cands[i]!;
    g.classList.add('on');
    await g.animate([{ transform: 'translateX(320px)' }, { transform: 'translateX(0)' }], {
      duration: 520,
      easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
    }).finished;
    if (!alive()) return false;
    await count(Math.round(c.barrels[i]!.overlap * 100), 520);
    await wait(i === last ? 500 : 900);
    if (!alive()) return false;
    if (i < last) {
      await g.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-320px)' }], {
        duration: 380,
        easing: 'cubic-bezier(0.6, 0, 0.8, 0.2)',
      }).finished;
      g.classList.remove('on');
    }
  }
  chip.classList.add('best');
  setStep(t('hs.step.best'));
  await wait(900);
  if (!alive()) return false;
  // 5. Into the shop card, then the other price classes push up beneath it.
  root.classList.add('hs-end');
  await wait(1300);
  if (!alive()) return false;
  root.classList.add('hs-stack');
  for (const x of cards.later) {
    x.classList.add('in');
    await wait(850);
    if (!alive()) return false;
  }
  return true;
}
