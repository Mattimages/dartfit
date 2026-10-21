/**
 * The calculation, shown live. Three panels light up in turn, each driven by real numbers:
 *  1. your hand: the measured landmarks and dimensions;
 *  2. your ideal dart: weight, length and thickness settling on the engine's ideal barrel;
 *  3. every dart in the catalogue scored against it, with a running top three.
 * Then the winner. Reduced motion: everything appears at once.
 */
import { scoreVariant } from '@dartfit/engine';
import { h, reducedMotion } from '../h';
import { num, t } from '../i18n';
import { go } from '../router';
import { session } from '../store';
import { createFit, variants } from '../api';
import { dartArt, handArt, templateHand } from '../draw/art';
import { matchPct, variantArt } from '../score';
import { dartName } from './words';

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

function reading(label: string, unit: string) {
  const value = h('span', null, '–');
  const el = h(
    'div',
    { class: 'reading' },
    h('b', null, value, h('small', null, unit)),
    h('span', null, label),
  );
  return { el, value };
}

/** Count a number up (or roll it around a band) and settle on the final value. */
async function roll(el: HTMLElement, to: number, digits: number, ms: number, from = 0, jitter = 0) {
  const t0 = performance.now();
  for (;;) {
    const p = Math.min(1, (performance.now() - t0) / ms);
    const e = 1 - (1 - p) ** 3;
    const noise = jitter * (1 - p) * (Math.random() * 2 - 1);
    el.textContent = num(from + (to - from) * e + noise, digits);
    if (p >= 1) break;
    await new Promise((r) => requestAnimationFrame(r));
  }
  el.textContent = num(to, digits);
}

export async function fittingView(root: HTMLElement) {
  const s0 = session();
  if (!s0.answers) return go('/questions');
  const fast = reducedMotion();
  const m = s0.measurements;

  // ── Panel 1: the hand ─────────────────────────────────────────────
  const hl = reading(`${t('fit.r.length')} mm`, '');
  const pw = reading(`${t('fit.r.width')} mm`, '');
  const il = reading(`${t('fit.r.index')} mm`, '');
  const handPts = s0.landmarksMm ?? templateHand(m?.handLengthMm ?? 185);
  const p1 = h(
    'div',
    { class: 'panel' },
    h('div', { class: 'panel-head' }, h('span', null, t('fit.p1')), h('span', { class: 'state' }, '')),
    h(
      'div',
      { class: 'row' },
      handArt({ points: handPts, lengthMm: m?.handLengthMm, dots: true, className: 'scan' }),
      h('div', { class: 'readings' }, hl.el, pw.el, il.el),
    ),
  );

  // ── Panel 2: the ideal dart ───────────────────────────────────────
  const wg = reading(t('fit.r.weight'), 'g');
  const ln = reading(t('fit.r.barrel'), 'mm');
  const dm = reading(t('fit.r.diameter'), 'mm');
  const artBox = h('div');
  const p2 = h(
    'div',
    { class: 'panel wait', 'aria-hidden': 'true' },
    h('div', { class: 'panel-head' }, h('span', null, t('fit.p2')), h('span', { class: 'state' }, '')),
    artBox,
    h('div', { class: 'readings' }, wg.el, ln.el, dm.el),
  );

  // ── Panel 3: every dart, scored ───────────────────────────────────
  const count = h('span', { class: 'count' }, '0');
  const nowName = h('span');
  const nowPct = h('span');
  const barFill = h('span');
  const leaders = h('ol', { class: 'leaders', 'aria-label': t('fit.top') });
  const p3 = h(
    'div',
    { class: 'panel wait', 'aria-hidden': 'true' },
    h('div', { class: 'panel-head' }, h('span', null, t('fit.p3')), h('span', { class: 'state' }, '')),
    h(
      'div',
      { class: 'ticker' },
      count,
      h('div', { class: 'bar' }, barFill),
      h('div', { class: 'now' }, nowName, nowPct),
    ),
    leaders,
  );

  const pct = h('span', { class: 'pct' });
  const bestName = h('h2');
  const bestArt = h('div');
  const go1 = h('a', { class: 'btn block' }, t('fit.show'));
  const found = h(
    'div',
    { class: 'found', hidden: true, 'aria-live': 'polite' },
    pct,
    bestName,
    bestArt,
    go1,
  );
  const err = h('p', { class: 'error', role: 'alert', hidden: true }, t('q.error'));
  const title = h('h1', { class: 'visually-hidden' }, t('fit.title'));
  root.append(h('section', { class: 'console' }, title, p1, p2, p3, found, err));

  let result;
  try {
    result = await createFit(m, s0.answers);
  } catch {
    err.hidden = false;
    return;
  }
  const f = result.fit;
  const state = (p: HTMLElement, text: string) => {
    p.classList.remove('wait');
    p.removeAttribute('aria-hidden');
    const st = p.querySelector('.state');
    if (st) st.textContent = text;
  };

  // 1 ── hand
  const handMs = fast ? 0 : 700;
  await Promise.all([
    roll(hl.value, m?.handLengthMm ?? 185, 0, handMs),
    roll(pw.value, m?.palmWidthMm ?? 78, 0, handMs),
    roll(il.value, m?.indexLengthMm ?? 78, 0, handMs),
  ]);
  state(p1, m ? '✓' : t('fit.avg'));
  if (!fast) await wait(250);

  // 2 ── ideal dart
  state(p2, '');
  artBox.append(dartArt({ ...f.barrel, grip: Math.round(f.grip.mu), soft: f.tip === 'soft', tone: 0 }));
  const idealMs = fast ? 0 : 1000;
  await Promise.all([
    roll(wg.value, f.barrel.massG, 1, idealMs, 16, 3),
    roll(ln.value, f.barrel.lengthMm, 1, idealMs, 36, 6),
    roll(dm.value, f.barrel.diameterMm, 2, idealMs, 5.6, 0.6),
  ]);
  state(p2, '✓');
  if (!fast) await wait(250);

  // 3 ── every dart in the catalogue, against the ideal
  state(p3, '');
  const budget = s0.answers.budgetUsd;
  const pool = variants().filter(
    (v) => v.tip === f.tip && !v.specCheck && (!budget || (v.priceUsd !== null && v.priceUsd <= budget)),
  );
  const scored: Array<{ name: string; pct: number }> = [];
  const perDart = fast ? 0 : Math.max(18, Math.min(40, 1800 / Math.max(1, pool.length)));
  for (let i = 0; i < pool.length; i++) {
    const v = pool[i]!;
    const p = matchPct(scoreVariant(f, v).cost);
    scored.push({ name: `${dartName(v)} ${num(v.weightG)} g`, pct: p });
    if (!fast || i === pool.length - 1) {
      count.textContent = `${i + 1}/${pool.length}`;
      barFill.style.cssText = `width:${((i + 1) / pool.length) * 100}%`;
      nowName.textContent = `${dartName(v)} ${num(v.weightG)} g`;
      nowPct.textContent = `${p}%`;
      const top = [...scored].sort((a, b) => b.pct - a.pct).slice(0, 3);
      leaders.replaceChildren(
        ...top.map((x) => h('li', null, h('span', null, x.name), h('b', null, `${x.pct}%`))),
      );
    }
    if (perDart) await wait(perDart);
  }
  state(p3, '✓');

  // ── The winner ────────────────────────────────────────────────────
  const best = result.recommendation.picks[0];
  const target = `#/fit/${result.id ?? 'local'}`;
  go1.setAttribute('href', target);
  if (best) {
    pct.textContent = `${matchPct(best.cost)}%`;
    pct.classList.add(`q-${best.quality}`);
    bestName.textContent = dartName(best.variant);
    bestArt.replaceChildren(h('div', { class: 'stage-box' }, variantArt(best.variant)));
  } else {
    bestName.textContent = t('fit.none');
  }
  title.textContent = t('fit.found');
  found.hidden = false;
  if (fast) {
    go1.focus();
    return;
  }
  found.scrollIntoView({ behavior: 'smooth', block: 'center' });
  await wait(1600);
  if (location.hash === '#/fitting') go(target.slice(1));
}
