/**
 * The landing hero, as one short film: a hand is scanned, measurement lines are drawn on it, the
 * measurements become the ideal barrel, three real barrels slide over it (each pausing to show how
 * well it fits), the last is the best match, and it ends on the shop cards: the best match, then
 * the other price classes pushing up beneath it.
 *
 * Every number is real: the engine fits the hand, the barrels are catalogue darts and the
 * percentages are the engine's own match split (shape, style, total), as on the result page.
 */
import {
  fit,
  matchBreakdown,
  radiusAt,
  scoreVariant,
  priceTiers,
  recommend,
  tierBoundsUsd,
  variantBarrel,
  type Silhouette,
  type Variant,
} from '@dartfit/engine';
import { handArt, SKIN_TONES, templateHand, type MmPoint } from '../draw/art';
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

interface Cast {
  hand: {
    lengthMm: number;
    length: number;
    knuckles: number;
    index: number;
    points: MmPoint[];
    tone: number;
  };
  ideal: Silhouette & { massG: number };
  barrels: Array<{ v: Variant; shape: Silhouette; m: Split }>;
  /** The price classes for the closing shot: the best match first, then the others. */
  options: Array<{ tier: Tier; v: Variant; m: Split; best: boolean }>;
  /** The thrower's answers to the two questions the film fills in. */
  who: Thrower;
}
type Tier = 'budget' | 'standard' | 'premium';
/** The engine's match split for one dart, in %: shape (weight, length, thickness), style, total. */
type Split = { shape: number; style: number; total: number };

/** Shape | style | total, the same three columns as the result page. */
function splitRow(m: Split, cls = 'hs-split') {
  const col = (label: string, v: number, key: keyof Split) =>
    h('span', { class: `hs-s hs-s-${key}` }, h('small', null, label), h('b', { 'data-k': key }, `${v}%`));
  return h(
    'span',
    { class: `${cls} hs-split` },
    col(t('r.split.shape'), m.shape, 'shape'),
    col(t('r.split.style'), m.style, 'style'),
    col(t('r.split.total'), m.total, 'total'),
  );
}
const TIERS: Tier[] = ['budget', 'standard', 'premium'];

/** A thrower for one round of the film: a plausible hand and how they hold and throw. */
interface Thrower {
  lengthMm: number;
  hold: 'front' | 'middle' | 'rear';
  fingers: 3 | 4;
  throwStyle: 'flat' | 'arc' | 'unsure';
  gripFeel: 2 | 3 | 4;
  /** Skin tone of the drawn hand, an index into SKIN_TONES. */
  tone: number;
  /** Finger length relative to the palm: below 1 is stubby, above 1 is slender. */
  fingerScale: number;
}
const FIRST: Thrower = {
  lengthMm: 186,
  hold: 'middle',
  fingers: 3,
  throwStyle: 'unsure',
  gripFeel: 3,
  tone: 1,
  fingerScale: 1,
};
const pickOne = <T>(xs: readonly T[]) => xs[Math.floor(Math.random() * xs.length)]!;
/** Adult hand lengths cluster around 188 mm (about ±9 mm); clipped to 168–206. */
const gauss = () => Math.sqrt(-2 * Math.log(1 - Math.random())) * Math.cos(2 * Math.PI * Math.random());
function randomThrower(): Thrower {
  const g = gauss();
  return {
    lengthMm: Math.round(Math.min(206, Math.max(168, 188 + 9 * g))),
    hold: pickOne(['front', 'middle', 'middle', 'rear'] as const),
    fingers: pickOne([3, 3, 4] as const),
    throwStyle: pickOne(['flat', 'arc', 'unsure'] as const),
    gripFeel: pickOne([2, 3, 3, 4] as const),
    tone: Math.floor(Math.random() * SKIN_TONES.length),
    // Finger-to-palm proportion varies about ±6% between adults (handShape.ratioCv); this scale moves it
    // by fk^1.5, so ±4% here; clipped to ±8%.
    fingerScale: Math.min(1.08, Math.max(0.92, 1 + 0.04 * gauss())),
  };
}

/** Stretch or shorten each finger from its knuckle (the thumb from its base) by k. */
function fingersScaled(p: MmPoint[], k: number): MmPoint[] {
  const out = p.map((q) => ({ ...q }));
  for (const chain of [
    [1, 2, 3, 4],
    [5, 6, 7, 8],
    [9, 10, 11, 12],
    [13, 14, 15, 16],
    [17, 18, 19, 20],
  ]) {
    const base = p[chain[0]!]!;
    for (const i of chain.slice(1))
      out[i] = { x: base.x + (p[i]!.x - base.x) * k, y: base.y + (p[i]!.y - base.y) * k };
  }
  return out;
}

/** The hand, the ideal and three darts in rising order of fit; the last is the engine's pick. */
function cast(pool: Variant[], who: Thrower = FIRST): Cast | null {
  // The engine gets real-scale measurements (reference proportions, as a scan would measure them);
  // the drawing gets the same finger proportion, so a stubby hand looks stubby.
  const fk = who.fingerScale;
  const size = who.lengthMm / 185;
  const ref = { palm: 78, middle: 85, index: 78, span: 120 };
  const m = {
    handLengthMm: Math.round(who.lengthMm * (0.55 + 0.45 * fk)),
    palmWidthMm: Number((ref.palm * size * Math.sqrt(1 / fk)).toFixed(1)),
    indexLengthMm: Number((ref.index * size * fk).toFixed(1)),
    middleLengthMm: Number((ref.middle * size * fk).toFixed(1)),
    thumbIndexSpanMm: Number((ref.span * size * fk).toFixed(1)),
    spreadMm: 1,
    samples: 18,
    calibrated: false,
  };
  const points = fingersScaled(templateHand(who.lengthMm), fk);
  const hand = {
    lengthMm: who.lengthMm,
    length: m.handLengthMm,
    knuckles: m.palmWidthMm,
    index: m.indexLengthMm,
    points,
    tone: who.tone,
  };
  const f = fit(m, {
    tip: 'steel',
    hold: who.hold,
    fingers: who.fingers,
    throwStyle: who.throwStyle,
    moisture: 'normal',
    gripFeel: who.gripFeel,
    thickness: 'auto',
  });
  const scored = pool.map((v) => {
    const shape = variantBarrel(v);
    const b = matchBreakdown(scoreVariant(f, v));
    return { v, shape, m: { shape: b.shape.pct, style: b.style.pct, total: b.total } };
  });
  const byId = new Map(scored.map((x) => [x.v.id, x]));
  // One dart per price class, plus the engine's overall pick.
  const bounds = tierBoundsUsd();
  const tierOf = (v: Variant): Tier =>
    (v.priceUsd ?? 0) <= bounds.budgetMaxUsd
      ? 'budget'
      : (v.priceUsd ?? 0) <= bounds.standardMaxUsd
        ? 'standard'
        : 'premium';
  const tiers = priceTiers(f, pool, bounds);
  const topId = recommend(f, pool).picks[0]?.variant.id;
  const candidates = [
    ...(topId && byId.get(topId) ? [byId.get(topId)!] : []),
    ...TIERS.map((k) => tiers[k] && byId.get(tiers[k]!.variant.id)).filter(
      (x): x is (typeof scored)[number] => !!x,
    ),
  ];
  // The film ranks by the % it shows: the best match is the candidate with the most overlap,
  // and every card after it has less, so the numbers only ever go down as the cards push up.
  const best = [...candidates, ...(candidates.length ? [] : scored)].sort((a, b) => b.m.total - a.m.total)[0];
  if (!best) return null;
  // Two near misses from other brands: a clear miss, then a close one.
  const near = (target: number, avoid: string[]) =>
    scored
      .filter((x) => !avoid.includes(x.v.brand) && x.m.total < best.m.total - 4)
      .sort((a, b) => Math.abs(a.m.total - target) - Math.abs(b.m.total - target))[0];
  const first = near(best.m.total - 22, [best.v.brand]);
  const second = first && near(best.m.total - 10, [best.v.brand, first.v.brand]);
  if (!first || !second) return null;
  const bestTier = tierOf(best.v);
  const others = TIERS.filter((k) => k !== bestTier)
    .map((k) => tiers[k] && byId.get(tiers[k]!.variant.id))
    .filter((x): x is (typeof scored)[number] => !!x)
    .map((x) => ({ tier: tierOf(x.v), v: x.v, m: x.m, best: false }))
    .sort((a, b) => b.m.total - a.m.total);
  return {
    hand,
    ideal: { ...f.barrel },
    barrels: [first, second, best].sort((a, b) => a.m.total - b.m.total),
    options: [{ tier: bestTier, v: best.v, m: best.m, best: true }, ...others],
    who,
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
  // A different person each round, so a different skin tone too.
  const [skin, hi, shade, nail] = SKIN_TONES[c.hand.tone % SKIN_TONES.length]!;
  (art as unknown as HTMLElement).style.cssText =
    `--skin:${skin};--skin-hi:${hi};--skin-shade:${shade};--nail:${nail}`;
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
      const el = label(rx + 10, y, mm(c.hand.length), 'middle');
      el.setAttribute('transform', `rotate(90 ${rx + 10} ${y})`);
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

/** The two questions, as the questionnaire asks them; the film taps the thrower's answers. */
function askPanel(who: Thrower) {
  const row = (title: string, options: HTMLElement[], picked: HTMLElement, foot?: HTMLElement) => ({
    row: h(
      'div',
      { class: 'hs-q' },
      h('span', { class: 'hs-q-title' }, title),
      h('span', { class: 'hs-q-opts' }, ...options),
      foot ?? null,
    ),
    pick: picked,
  });
  const holds = (['front', 'middle', 'rear'] as const).map((k) =>
    h('span', { class: 'hs-opt' }, t(`q.hold.${k}`)),
  );
  const hold = row(t('q.hold'), holds, holds[['front', 'middle', 'rear'].indexOf(who.hold)]!);
  const dots = [1, 2, 3, 4, 5].map((n) => h('span', { class: 'hs-opt hs-dot' }, String(n)));
  const grip = row(
    t('q.grip'),
    dots,
    dots[who.gripFeel - 1]!,
    h('span', { class: 'hs-q-ends' }, h('span', null, t('q.grip.1')), h('span', null, t('q.grip.5'))),
  );
  return {
    box: h('div', { class: 'hs-askbox', 'aria-hidden': 'true' }, hold.row, grip.row),
    questions: [hold, grip],
  };
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
        ),
        h('b', null, dartName(o.v)),
        h('span', { class: 'hs-card-meta' }, `${num(o.v.weightG)} g${eur ? ` · €${eur}` : ''}`),
        splitRow(o.m),
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
  const step = h('span', { class: 'hs-step' });
  // The fit % sits right above the barrels, big enough to read while each one pauses.
  const chip = splitRow({ shape: 0, style: 0, total: 0 }, 'hs-chip');
  const modelBox = h('div', { class: 'hs-modelbox' }, chip, model.svg);
  const cards = shopCards(c);
  const ask = askPanel(c.who);
  root.replaceChildren(h('div', { class: 'hs-stage' }, hand, ask.box, modelBox, step, cards.box));

  const still = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const alive = () => root.isConnected || !root.dataset.started;
  const setStep = (text: string) => (step.textContent = text);
  const last = model.cands.length - 1;
  const cell = (key: keyof Split) => chip.querySelector<HTMLElement>(`[data-k="${key}"]`)!;
  const keys: Array<keyof Split> = ['shape', 'style', 'total'];
  const setSplit = (m: Split) => keys.forEach((key) => (cell(key).textContent = `${m[key]}%`));
  // All three numbers count up together.
  const count = async (to: Split, ms: number) => {
    const t0 = performance.now();
    for (;;) {
      const p = Math.min(1, (performance.now() - t0) / ms);
      const e = 1 - Math.pow(1 - p, 3);
      keys.forEach((key) => (cell(key).textContent = `${Math.round(to[key] * e)}%`));
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
    setSplit(c.barrels[last]!.m);
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
  await wait(400);
  // 3. Two questions get answered: where you hold it, and how much grip (knurling).
  setStep(t('hs.step.ask'));
  root.classList.add('hs-ask');
  for (const q of ask.questions) {
    q.row.classList.add('in');
    await wait(650);
    if (!alive()) return false;
    q.pick.classList.add('on');
    await wait(750);
    if (!alive()) return false;
  }
  await wait(300);
  root.classList.remove('hs-ask');
  // 4. The measurements and answers become the ideal barrel.
  setStep(t('hs.step.model'));
  root.classList.add('hs-build');
  await wait(1300);
  if (!alive()) return false;
  // 5. Three real barrels over the ideal, each pausing to show the fit.
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
    await count(c.barrels[i]!.m, 520);
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
