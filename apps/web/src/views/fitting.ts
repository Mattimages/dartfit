/**
 * The calculation, as a film: the same story as the landing page, told about you. Your hand (the
 * scanned landmarks or your size), your measurements, your hold and grip answers on the live dart,
 * your ideal dart from the engine, two near misses and then your real best match, a bullseye, and
 * your price options stacking up. Every number comes from your fit. Reduced motion skips straight
 * to the result.
 */
import { h, reducedMotion } from '../h';
import { t } from '../i18n';
import { go } from '../router';
import { session } from '../store';
import { createFit, variants } from '../api';
import { templateHand } from '../draw/art';
import { castFor, fitFilm } from './hero-scan';

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function fittingView(root: HTMLElement) {
  const s0 = session();
  if (!s0.answers) return go('/questions');
  const m = s0.measurements;
  const a = s0.answers;

  const title = h('h1', { class: 'visually-hidden' }, t('fit.title'));
  const status = h('p', { class: 'visually-hidden', 'aria-live': 'polite' }, t('fit.title'));
  const holder = h('div', { class: 'fit-film' }, h('div', { class: 'fit-wait', 'aria-hidden': 'true' }));
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
  const c = castFor(f, pool, hand, who, { best, tiers: result.tiers ?? {} });
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
