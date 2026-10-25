/**
 * Player-card art for a pro: their country's colours, their initials the way darts fans write them
 * (MvG, RvB, DvD) and a stylised thrower in the stance. Deliberately not a likeness: no faces or
 * photos of real players (portrait rights), so the card stays the same for every pro.
 */
import { s } from '../h';

/** "Michael van Gerwen" → "MvG", "Luke Littler" → "LL". */
export function monogram(name: string): string {
  const words = name.split(/\s+/).filter(Boolean);
  if (words.length <= 1) return (words[0] ?? '?').slice(0, 2).toUpperCase();
  return words
    .map((w, i) => (i > 0 && i < words.length - 1 && /^[a-z]/.test(w) ? w[0] : w[0]!.toUpperCase()))
    .join('');
}

const W = 240;
const H = 200;
const NAVY = '#0f1b2d';

/** Simplified flags, filling the whole art area. Unknown countries get the board colours. */
function flag(country: string): SVGElement[] {
  const r = (x: number, y: number, w: number, hh: number, fill: string) =>
    s('rect', { x, y, width: w, height: hh, fill });
  const saltire = (bg: string, fg: string, wd: number) => [
    r(0, 0, W, H, bg),
    s('path', { d: `M0 0L${W} ${H}M${W} 0L0 ${H}`, stroke: fg, 'stroke-width': wd, fill: 'none' }),
  ];
  switch (country) {
    case 'ENG':
      return [
        r(0, 0, W, H, '#ffffff'),
        r(W / 2 - 18, 0, 36, H, '#ce1124'),
        r(0, H / 2 - 18, W, 36, '#ce1124'),
      ];
    case 'SCO':
      return saltire('#005eb8', '#ffffff', 34);
    case 'NIR':
      return saltire('#ffffff', '#c8102e', 26);
    case 'WAL':
      return [r(0, 0, W, H / 2, '#ffffff'), r(0, H / 2, W, H / 2, '#00b140')];
    case 'NED':
      return [
        r(0, 0, W, H / 3, '#ae1c28'),
        r(0, H / 3, W, H / 3, '#ffffff'),
        r(0, (2 * H) / 3, W, H / 3, '#21468b'),
      ];
    case 'BEL':
      return [
        r(0, 0, W / 3, H, '#000000'),
        r(W / 3, 0, W / 3, H, '#fdda24'),
        r((2 * W) / 3, 0, W / 3, H, '#ef3340'),
      ];
    case 'GER':
    case 'DEU':
      return [
        r(0, 0, W, H / 3, '#000000'),
        r(0, H / 3, W, H / 3, '#dd0000'),
        r(0, (2 * H) / 3, W, H / 3, '#ffce00'),
      ];
    case 'ESP':
      return [r(0, 0, W, H, '#aa151b'), r(0, H / 4, W, H / 2, '#f1bf00')];
    case 'AUS':
    case 'NZL':
      return [r(0, 0, W, H, '#012169')];
    case 'IRL':
      return [
        r(0, 0, W / 3, H, '#169b62'),
        r(W / 3, 0, W / 3, H, '#ffffff'),
        r((2 * W) / 3, 0, W / 3, H, '#ff883e'),
      ];
    default: {
      // The board: alternating segments fanning out from the corner.
      const out: SVGElement[] = [r(0, 0, W, H, '#1d3762')];
      for (let i = 0; i < 10; i++) {
        const a0 = (i * Math.PI) / 20 + Math.PI;
        const a1 = ((i + 1) * Math.PI) / 20 + Math.PI;
        const R = 420;
        const cx = W + 40;
        const cy = H + 40;
        out.push(
          s('path', {
            d: `M${cx} ${cy}L${cx + R * Math.cos(a0)} ${cy + R * Math.sin(a0)}L${cx + R * Math.cos(a1)} ${cy + R * Math.sin(a1)}Z`,
            fill: i % 2 ? '#e3122c' : '#0fa76a',
          }),
        );
      }
      return out;
    }
  }
}

/** A thrower side-on at the oche, arm up, dart at eye height. Same figure for every pro. */
function thrower(): SVGElement {
  const limb = (d: string, w: number) => [
    s('path', { d, class: 'pa-edge', 'stroke-width': w + 6 }),
    s('path', { d, class: 'pa-limb', 'stroke-width': w }),
  ];
  return s(
    'g',
    { class: 'pa-fig', transform: 'translate(36 -6)' },
    // back arm, legs, torso, head, throwing arm, dart (back to front)
    ...limb('M108 92L100 128L106 150', 14),
    ...limb('M110 146L94 204', 17),
    ...limb('M110 146L130 204', 17),
    ...limb('M116 86L110 146', 32),
    s('circle', { cx: 120, cy: 56, r: 19, class: 'pa-head-edge' }),
    s('circle', { cx: 120, cy: 56, r: 16, class: 'pa-head' }),
    ...limb('M122 88L154 94L150 58', 13),
    s('path', { d: 'M136 56L184 51', class: 'pa-dart', 'stroke-width': 2.5 }),
    s('path', { d: 'M148 55L163 53.5', class: 'pa-dart', 'stroke-width': 6 }),
    s('path', { d: 'M136 56L128 50L131 56L128 62Z', class: 'pa-flight' }),
  );
}

/**
 * The art block. `withMonogram: false` leaves the initials out (the share card draws them itself,
 * because an SVG drawn as an image cannot load our font).
 */
export function proArt(
  pro: { name: string; country: string },
  o: { withMonogram?: boolean } = {},
): SVGSVGElement {
  const id = `pa-${Math.random().toString(36).slice(2, 8)}`;
  return s(
    'svg',
    {
      class: 'pro-art',
      viewBox: `0 0 ${W} ${H}`,
      role: 'img',
      'aria-label': pro.name,
      preserveAspectRatio: 'xMidYMid slice',
    },
    s(
      'defs',
      null,
      s(
        'linearGradient',
        { id, x1: 0, y1: 0, x2: 0, y2: 1 },
        s('stop', { offset: 0, 'stop-color': NAVY, 'stop-opacity': 0.25 }),
        s('stop', { offset: 0.7, 'stop-color': NAVY, 'stop-opacity': 0.55 }),
        s('stop', { offset: 1, 'stop-color': NAVY, 'stop-opacity': 0.95 }),
      ),
    ),
    ...flag(pro.country),
    s('rect', { x: 0, y: 0, width: W, height: H, fill: `url(#${id})` }),
    o.withMonogram === false ? null : s('text', { x: 16, y: 74, class: 'pa-mono' }, monogram(pro.name)),
    thrower(),
  ) as SVGSVGElement;
}

/** The same art as a data: URL, for drawing on the share card's canvas. */
export function proArtUrl(pro: { name: string; country: string }): string {
  const svg = proArt(pro, { withMonogram: false });
  // Classes don't survive as an image: inline the figure's colours as attributes.
  const paint: Record<string, Record<string, string>> = {
    'pa-edge': { stroke: '#ffffff', fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' },
    'pa-limb': { stroke: '#0d1626', fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' },
    'pa-head-edge': { fill: '#ffffff' },
    'pa-head': { fill: '#0d1626' },
    'pa-dart': { stroke: '#e8edf5', fill: 'none', 'stroke-linecap': 'round' },
    'pa-flight': { fill: '#cfd8e6' },
  };
  svg.querySelectorAll('[class]').forEach((el) => {
    for (const [k, v] of Object.entries(paint[el.getAttribute('class') ?? ''] ?? {})) el.setAttribute(k, v);
  });
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(new XMLSerializer().serializeToString(svg))}`;
}
