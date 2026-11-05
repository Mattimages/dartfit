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
    const uid = Math.random().toString(36).slice(2, 8);
    const defs = s('defs');
    svg.append(defs);
    const gradient = (id: string, stops: Array<[number, string]>, vertical = true) => {
      const g = s('linearGradient', { id, x1: 0, y1: 0, x2: vertical ? 0 : 1, y2: vertical ? 1 : 0 });
      stops.forEach(([o, c]) => g.append(s('stop', { offset: o, class: c })));
      defs.append(g);
      return `url(#${id})`;
    };

    // Shaft: a lit aluminium tube with a collar at the barrel and the ring that holds the flight.
    const shaftFill = gradient(`qs${uid}`, [
      [0, 'qd-alu-0'],
      [0.45, 'qd-alu-1'],
      [1, 'qd-alu-2'],
    ]);
    svg.append(
      s('path', {
        class: 'qd-shaft',
        fill: shaftFill,
        d: `M${xb},${CY - 2.6}L${xs},${CY - 2.1}L${xs},${CY + 2.1}L${xb},${CY + 2.6}Z`,
      }),
      s('rect', { class: 'qd-collar', fill: shaftFill, x: xb, y: CY - 3, width: 2.4, height: 6, rx: 0.8 }),
      s('rect', { class: 'qd-ring', x: xs - 6.5, y: CY - 2.7, width: 2.2, height: 5.4, rx: 0.7 }),
    );

    // Flight: a curved leading edge, a sheen from front to back, the other wing seen edge-on along
    // the shaft, and a printed trim near the trailing edge.
    const fw = slim ? 11 : 17;
    const side = (k: 1 | -1) => {
      const y = (d: number) => f1(CY + k * d);
      return [
        `${xs - 26},${y(1.6)}`,
        `C${xs - 19},${y(4)} ${xs - 14},${y(fw - 4)} ${xs - 10.5},${y(fw - 1.4)}`,
        `Q${xs - 9.5},${y(fw - 0.4)} ${xs - 8},${y(fw - 0.3)}`,
        `L${xs + 5.5},${y(fw)}`,
        `Q${xs + 7},${y(fw)} ${xs + 7},${y(fw - 1.5)}`,
      ];
    };
    const [a0, ...aRest] = side(-1);
    const flightD =
      `M${a0}${aRest.join('')}L${xs + 7},${f1(CY + fw - 1.5)}` +
      `Q${xs + 7},${f1(CY + fw)} ${xs + 5.5},${f1(CY + fw)}L${xs - 8},${f1(CY + fw - 0.3)}` +
      `Q${xs - 9.5},${f1(CY + fw - 0.4)} ${xs - 10.5},${f1(CY + fw - 1.4)}` +
      `C${xs - 14},${f1(CY + fw - 4)} ${xs - 19},${f1(CY + 4)} ${xs - 26},${f1(CY + 1.6)}Z`;
    const flightClip = `qf${uid}`;
    const fcp = s('clipPath', { id: flightClip });
    fcp.append(s('path', { d: flightD }));
    defs.append(fcp);
    const flightFill = gradient(
      `qfg${uid}`,
      [
        [0, 'qd-fl-0'],
        [0.55, 'qd-fl-1'],
        [1, 'qd-fl-2'],
      ],
      false,
    );
    const flight = s('g', { class: 'qd-flightg' });
    flight.append(s('path', { class: 'qd-flight', d: flightD, fill: flightFill }));
    const print = s('g', { 'clip-path': `url(#${flightClip})` });
    // Trim lines that follow the leading edge, a band near the back, the panel's top sheen.
    for (const k of [-1, 1] as const) {
      const y = (d: number) => f1(CY + k * d);
      print.append(
        s('path', {
          class: 'qd-fl-trim',
          d: `M${xs - 21},${y(2.4)}C${xs - 15},${y(5)} ${xs - 10},${y(fw - 5)} ${xs - 6.5},${y(fw - 2.6)}`,
        }),
      );
    }
    print.append(
      s('rect', { class: 'qd-fl-band', x: xs + 1.2, y: CY - fw, width: 2.4, height: fw * 2 }),
      s('rect', { class: 'qd-fl-line', x: xs - 0.8, y: CY - fw, width: 0.7, height: fw * 2 }),
      s('rect', { class: 'qd-fl-sheen', x: xs - 26, y: CY - fw, width: 34, height: fw * 0.55 }),
    );
    flight.append(print);
    // The other wing, edge-on: a thin darker strip along the axis with a lit edge.
    flight.append(
      s('rect', { class: 'qd-fl-edge', x: xs - 24, y: CY - 1.3, width: 31, height: 2.6, rx: 1.2 }),
      s('line', { class: 'qd-fl-edge-hi', x1: xs - 23, x2: xs + 6.5, y1: CY - 1.05, y2: CY - 1.05 }),
    );
    svg.append(flight);

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
    const clip = `qdc${uid}`;
    const cp = s('clipPath', { id: clip });
    cp.append(s('path', { d: barrel }));
    defs.append(cp);
    const steel = gradient(`${clip}g`, [
      [0, 'qd-steel-0'],
      [0.3, 'qd-steel-hi'],
      [0.48, 'qd-steel-1'],
      [1, 'qd-steel-2'],
    ]);
    svg.append(s('path', { class: 'qd-barrel', d: barrel, fill: steel }));

    // Knurling, cut the way real barrels are: grip answer plus the moisture step, 1–5.
    //   1 smooth (two marker rings), 2 fine rings, 3 ring grooves in groups,
    //   4 a diamond micro-grip band edged by rings, 5 shark-fin cuts.
    // Each groove is engraved: a dark cut with a lit edge behind it, bowed a touch like a ring
    // seen on a cylinder.
    const g = Math.max(1, Math.min(5, a.gripFeel + (config.grip.moisture[a.moisture] ?? 0)));
    const knurl = s('g', { class: 'qd-knurl', 'clip-path': `url(#${clip})` });
    const rAt = (x: number) => R * radiusAt(profile, Math.min(1, Math.max(0, (x - x0) / LENGTH)));
    const from = x0 + LENGTH * 0.16;
    const to = x0 + LENGTH * 0.84;
    const groove = (x: number, w = 0.45) => {
      const r = rAt(x) + 0.5;
      knurl.append(
        s('path', {
          class: 'gv',
          'stroke-width': f1(w),
          d: `M${f1(x)},${f1(CY - r)}Q${f1(x + 0.8)},${CY} ${f1(x)},${f1(CY + r)}`,
        }),
        s('path', {
          class: 'hi',
          d: `M${f1(x + w * 0.9)},${f1(CY - r)}Q${f1(x + w * 0.9 + 0.8)},${CY} ${f1(x + w * 0.9)},${f1(CY + r)}`,
        }),
      );
    };
    const spread = (n: number, a0: number, a1: number) =>
      Array.from({ length: n }, (_, i) => a0 + ((a1 - a0) * i) / Math.max(1, n - 1));
    if (g === 1) {
      [from, from + 1.4, to - 1.4, to].forEach((x) => groove(x, 0.3));
    } else if (g === 2) {
      spread(9, from, to).forEach((x) => groove(x, 0.35));
    } else if (g === 3) {
      const span = to - from;
      for (const c of [from + span * 0.12, from + span * 0.5, to - span * 0.12])
        [-1.6, 0, 1.6].forEach((d) => groove(c + d, 0.5));
    } else if (g === 4) {
      const a1 = from + 3;
      const b1 = to - 3;
      // The micro-grip: two sets of fine diagonal cuts crossing, clipped to the band.
      const band = `qk${uid}`;
      const bcp = s('clipPath', { id: band });
      bcp.append(s('rect', { x: a1, y: CY - R - 1, width: b1 - a1, height: D + 2 }));
      defs.append(bcp);
      const mesh = s('g', { 'clip-path': `url(#${band})` });
      mesh.append(s('rect', { class: 'mesh-tint', x: a1, y: CY - R - 1, width: b1 - a1, height: D + 2 }));
      for (let x = a1 - D; x < b1 + D; x += 1.25) {
        mesh.append(
          s('line', { class: 'mesh', x1: f1(x), y1: CY - R, x2: f1(x + D * 0.7), y2: CY + R }),
          s('line', { class: 'mesh', x1: f1(x), y1: CY + R, x2: f1(x + D * 0.7), y2: CY - R }),
        );
      }
      knurl.append(mesh);
      [from, from + 1.5, to - 1.5, to].forEach((x) => groove(x, 0.5));
    } else {
      // Shark fins: each cut steep at the front and sloping back, so it reads as a sawtooth.
      const fin = gradient(
        `qsf${uid}`,
        [
          [0, 'qd-fin-0'],
          [1, 'qd-fin-1'],
        ],
        false,
      );
      for (const x of spread(11, from, to - 2.4)) {
        const r = rAt(x) + 0.5;
        knurl.append(
          s('rect', { class: 'fin', x: f1(x), y: f1(CY - r), width: 2.6, height: f1(2 * r), fill: fin }),
        );
        groove(x, 0.6);
      }
    }
    // A long specular line along the top of the barrel.
    knurl.append(
      s('rect', {
        class: 'qd-spec',
        x: x0 + 1.5,
        y: f1(CY - R * 0.62),
        width: LENGTH - 3,
        height: 0.7,
        rx: 0.35,
      }),
    );
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
