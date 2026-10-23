/**
 * The live dart above the questionnaire. Every answer changes it the way the engine reads it:
 * where you hold it (red zone from gripZone, finger pads for the finger count), the barrel shape that
 * hold leans to, shaft and flight from the throw (setupFor), knurling from the grip slider plus the
 * moisture step, the diameter from the thickness answer, and a steel or soft point.
 */
import {
  config,
  gripZone,
  radiusAt,
  setupFor,
  shapeProfile,
  type Answers,
  type Balance,
  type Shape,
} from '@dartfit/engine';
import { h } from '../h';

const SVG = 'http://www.w3.org/2000/svg';
const s = (tag: string, attrs: Record<string, string | number> = {}) => {
  const el = document.createElementNS(SVG, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
  return el;
};
const f1 = (n: number) => n.toFixed(2);
const argmax = <K extends string>(o: Record<K, number>) =>
  (Object.keys(o) as K[]).reduce((a, b) => (o[b] > o[a] ? b : a));

export type Focus = 'tip' | 'hold' | 'fingers' | 'throwStyle' | 'moisture' | 'gripFeel' | 'thickness' | null;

const LENGTH = 48;
const CY = 30;
/** Drawn thicker than true scale so knurling and the hold zone read on a phone. */
const THICK = 1.7;

export function quizDart() {
  const svg = s('svg', { viewBox: '6 6 138 48', class: 'qd-svg', 'aria-hidden': 'true' });
  const el = h('div', { class: 'qd' });
  el.append(svg);
  let last = '';

  function update(a: Answers, focus: Focus) {
    const key = JSON.stringify([a, focus]);
    if (key === last) return;
    const changed = last !== '';
    last = key;
    svg.replaceChildren();
    el.dataset.focus = focus ?? '';

    // Barrel: the shape this hold leans to, at the chosen thickness.
    const balance = argmax(config.balance[a.hold] as unknown as Record<Balance, number>);
    const shape = argmax(config.shape[balance] as Record<Shape, number>);
    const profile = shapeProfile(shape, balance);
    const D = (a.thickness === 'auto' ? config.diameter.autoMu : config.diameter.chosen[a.thickness]) * THICK;
    const R = D / 2;
    const soft = a.tip === 'soft';
    const pointLen = soft ? 26 : a.hold === 'front' ? 36 : 31;
    const x0 = pointLen;
    const xb = x0 + LENGTH;
    const setup = setupFor(a, 22);
    const shaftLen = (setup.shaftMm[0] + setup.shaftMm[1]) / 2;
    const xs = xb + shaftLen;
    const slim = setup.flight === 'slim';

    // Throw path behind the dart: flat or lofted.
    const path =
      a.throwStyle === 'flat'
        ? `M-2,${CY + 18}L198,${CY + 12}`
        : a.throwStyle === 'arc'
          ? `M-2,${CY + 22}Q100,${CY - 34} 198,${CY + 10}`
          : `M-2,${CY + 18}L198,${CY + 12}M-2,${CY + 22}Q100,${CY - 34} 198,${CY + 10}`;
    svg.append(s('path', { class: `qd-path${a.throwStyle === 'unsure' ? ' unsure' : ''}`, d: path }));

    // Point.
    svg.append(
      s('path', {
        class: soft ? 'qd-soft' : 'qd-point',
        d: soft
          ? `M${x0},${CY - 1.7}L4,${CY - 1.2}Q0,${CY} 4,${CY + 1.2}L${x0},${CY + 1.7}Z`
          : `M${x0},${CY - 1.1}L2,${CY - 0.3}L0,${CY}L2,${CY + 0.3}L${x0},${CY + 1.1}Z`,
      }),
    );
    // Shaft and flight.
    svg.append(
      s('path', {
        class: 'qd-shaft',
        d: `M${xb},${CY - 2.6}L${xs},${CY - 2.1}L${xs},${CY + 2.1}L${xb},${CY + 2.6}Z`,
      }),
    );
    const fw = slim ? 11 : 17;
    svg.append(
      s('path', {
        class: 'qd-flight',
        d: `M${xs - 26},${CY - 1.4}L${xs - 11},${CY - fw + 1.5}L${xs + 7},${CY - fw}L${xs + 7},${CY + fw}L${xs - 11},${CY + fw - 1.5}L${xs - 26},${CY + 1.4}Z`,
      }),
    );

    // Barrel outline from the real profile.
    const top: string[] = [];
    const bot: string[] = [];
    for (let i = 0; i <= 60; i++) {
      const u = i / 60;
      const r = R * radiusAt(profile, u);
      top.push(`${f1(x0 + u * LENGTH)},${f1(CY - r)}`);
      bot.push(`${f1(x0 + u * LENGTH)},${f1(CY + r)}`);
    }
    const barrel = `M${top.join('L')}L${bot.reverse().join('L')}Z`;
    const clip = `qdc${Math.random().toString(36).slice(2, 8)}`;
    const defs = s('defs');
    const cp = s('clipPath', { id: clip });
    cp.append(s('path', { d: barrel }));
    defs.append(cp);
    const grad = s('linearGradient', { id: `${clip}g`, x1: 0, y1: 0, x2: 0, y2: 1 });
    [
      [0, 'qd-steel-0'],
      [0.42, 'qd-steel-1'],
      [1, 'qd-steel-2'],
    ].forEach(([o, c]) => grad.append(s('stop', { offset: o!, class: String(c) })));
    defs.append(grad);
    svg.append(defs);
    svg.append(s('path', { class: 'qd-barrel', d: barrel, fill: `url(#${clip}g)` }));

    // Knurling: grip answer plus the moisture step (sweaty hands want more), 1–5.
    const g = Math.max(1, Math.min(5, a.gripFeel + (config.grip.moisture[a.moisture] ?? 0)));
    const knurl = s('g', { class: 'qd-knurl', 'clip-path': `url(#${clip})` });
    const n = Math.round(3 + g * 3.2);
    const from = x0 + LENGTH * 0.16;
    const to = x0 + LENGTH * 0.84;
    for (let i = 0; i < n; i++) {
      const x = from + ((to - from) * i) / Math.max(1, n - 1);
      knurl.append(s('line', { x1: x, x2: x, y1: CY - R, y2: CY + R, 'stroke-width': f1(0.25 + g * 0.17) }));
    }
    // Deep grip adds a cross-cut ring pattern.
    if (g >= 4)
      for (let i = 0; i < n - 1; i += 2) {
        const x = from + ((to - from) * (i + 0.5)) / Math.max(1, n - 1);
        knurl.append(s('line', { class: 'cut', x1: x - 1.2, x2: x + 1.2, y1: CY - R, y2: CY + R }));
      }
    svg.append(knurl);

    // Where you hold it: the engine's grip zone, with a pad per finger on top and the thumb below.
    const zone = gripZone(undefined, a, LENGTH);
    const za = x0 + zone[0];
    const zb = x0 + zone[1];
    const hold = s('g', {
      class: `qd-hold${changed && (focus === 'hold' || focus === 'fingers') ? ' pulse' : ''}`,
    });
    // The finger zone, faint; the hold point (where the thumb sits) in strong red.
    hold.append(
      s('rect', {
        class: 'qd-zone',
        x: f1(za),
        y: f1(CY - R - 1.4),
        width: f1(zb - za),
        height: f1(D + 2.8),
        rx: 2.4,
      }),
    );
    const anchor = x0 + config.gripZone.start[a.hold] * LENGTH;
    const spot = Math.min(Math.max(anchor, za + 6), zb - 6);
    hold.append(
      s('rect', {
        class: 'qd-spot',
        x: f1(spot - 6),
        y: f1(CY - R - 1.8),
        width: 12,
        height: f1(D + 3.6),
        rx: 3,
      }),
    );
    const pads = Math.max(1, a.fingers - 1);
    const padSpan = Math.min(zb - za - 4, pads * 7.5);
    const padFrom = Math.min(Math.max(spot - padSpan / 2, za + 2), zb - 2 - padSpan);
    for (let i = 0; i < pads; i++) {
      const x = padFrom + (padSpan * (i + 0.5)) / pads;
      hold.append(s('ellipse', { class: 'qd-pad', cx: f1(x), cy: f1(CY - R - 3.2), rx: 3.3, ry: 2.1 }));
    }
    hold.append(
      s('ellipse', { class: 'qd-pad thumb', cx: f1(spot), cy: f1(CY + R + 3.4), rx: 4.4, ry: 2.4 }),
    );
    svg.append(hold);

    // Moisture: drops on sweaty hands.
    if (a.moisture === 'sweaty')
      [0.3, 0.55, 0.8].forEach((u, i) => {
        const x = x0 + LENGTH * u;
        const y = CY + R + 9 + (i % 2) * 2;
        svg.append(
          s('path', {
            class: 'qd-drop',
            d: `M${x},${y - 4}Q${x + 2.6},${y} ${x + 2.6},${y + 1}A2.6,2.6 0 0 1 ${x - 2.6},${y + 1}Q${x - 2.6},${y} ${x},${y - 4}Z`,
          }),
        );
      });

    if (changed) {
      el.classList.remove('bump');
      void el.offsetWidth;
      el.classList.add('bump');
    }
  }

  return { el, update };
}
