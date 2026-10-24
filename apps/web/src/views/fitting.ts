/**
 * The calculation, as a film in the landing page's style: your ideal dart from the engine, a
 * carousel of real darts scored against it (shape, style, total) rising to your best match, a
 * bullseye, and your price options stacking up. Every number comes from your fit. Reduced motion
 * skips straight to the result.
 */
import { h, reducedMotion, s } from '../h';
import { t } from '../i18n';
import { go } from '../router';
import { session } from '../store';
import { createFit, variants } from '../api';
import { templateHand } from '../draw/art';
import { castFor, fitFilm } from './hero-scan';

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** While the fit is calculated: three darts land on a board, one after another, on a loop. */
function waiting(): HTMLElement {
  const board = s('svg', { viewBox: '-60 -60 120 120', class: 'fw-board', 'aria-hidden': 'true' });
  [
    [48, 'bw-black'],
    [46, 'bw-red'],
    [43, 'bw-cream'],
    [30, 'bw-green'],
    [27.5, 'bw-cream'],
    [8, 'bw-green'],
    [3.6, 'bw-red'],
  ].forEach(([r, cls]) => board.append(s('circle', { r: r!, class: String(cls) })));
  for (let i = 0; i < 20; i++) {
    const a = (i * Math.PI) / 10;
    board.append(
      s('line', {
        x1: 8 * Math.cos(a),
        y1: 8 * Math.sin(a),
        x2: 46 * Math.cos(a),
        y2: 46 * Math.sin(a),
        class: 'bw-wire',
      }),
    );
  }
  // Where the three darts land: treble 20, then a bit off, then the bull.
  [
    [-4, -36],
    [9, -12],
    [0, 0],
  ].forEach(([x, y], i) => {
    const g = s('g', { class: `fw-dart fw-dart-${i}`, transform: `translate(${x} ${y})` });
    const inner = s('g', { class: 'fw-fly' });
    inner.append(
      s('path', { d: 'M0,0L8,-2.4L8,2.4Z', class: 'bw-tip' }),
      s('rect', { x: 8, y: -3.2, width: 17, height: 6.4, rx: 2.4, class: 'bw-barrel' }),
      s('rect', { x: 25, y: -1.3, width: 11, height: 2.6, class: 'bw-shaft' }),
      s('path', { d: 'M31,0L44,-10L49,-10L44,0L49,10L44,10Z', class: 'bw-flight' }),
    );
    g.append(inner);
    board.append(g);
  });
  return h('div', { class: 'fit-wait' }, board, h('p', { class: 'fw-text' }, t('fit.working')));
}

export async function fittingView(root: HTMLElement) {
  const s0 = session();
  if (!s0.answers) return go('/questions');
  const m = s0.measurements;
  const a = s0.answers;

  const title = h('h1', { class: 'visually-hidden' }, t('fit.title'));
  const status = h('p', { class: 'visually-hidden', 'aria-live': 'polite' }, t('fit.title'));
  const holder = h('div', { class: 'fit-film' }, waiting());
  const cta = h('a', { class: 'btn block fit-cta', hidden: true }, t('fit.see'));
  const skip = h('a', { class: 'btn link fit-skip', hidden: true }, t('fit.skip'));
  const err = h('p', { class: 'error', role: 'alert', hidden: true }, t('q.error'));
  root.append(h('section', { class: 'fit-screen' }, title, status, holder, cta, skip, err));

  let result;
  try {
    result = await createFit(m, a);
  } catch {
    holder.replaceChildren();
    err.hidden = false;
    return;
  }
  const f = result.fit;
  const target = `#/fit/${result.id ?? 'local'}`;
  cta.setAttribute('href', target);
  skip.setAttribute('href', target);
  const best = result.recommendation.picks[0];
  status.textContent = best ? t('fit.found') : t('fit.none');
  if (reducedMotion() || !best) return go(target.slice(1));

  // Your hand: the scanned landmarks when there are any, otherwise a hand of your size.
  const est = f.reasons.find((x) => x.code === 'hand_from_height')?.params.handLengthMm;
  const len = m?.handLengthMm ?? (typeof est === 'number' ? est : 185);
  const k = len / 185;
  const hand = {
    lengthMm: len,
    length: len,
    knuckles: m?.palmWidthMm ?? 78 * k,
    index: m?.indexLengthMm ?? 78 * k,
    points: s0.landmarksMm ?? templateHand(len),
    tone: 1,
  };
  const who = { hold: a.hold, fingers: a.fingers, throwStyle: a.throwStyle, gripFeel: a.gripFeel };
  const pool = variants().filter((v) => v.tip === f.tip && !v.specCheck);
  // Three darts in the carousel: two near misses rising to your best match.
  const c = castFor(f, pool, hand, who, { best, tiers: result.tiers ?? {} }, 2);
  if (!c) return go(target.slice(1));

  const film = fitFilm(c);
  holder.replaceChildren(film.el);
  skip.hidden = false;
  await film.done;
  skip.hidden = true;
  cta.hidden = false;
  cta.focus({ preventScroll: true });
  // Give the stacked options a moment, then open the result unless the player already moved on.
  await wait(5000);
  if (location.hash === '#/fitting') go(target.slice(1));
}
