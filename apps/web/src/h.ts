/** Tiny DOM builder. All text goes through textContent, so data can never become markup. */
type Child = Node | string | number | false | null | undefined | Child[];
type Attrs = Record<string, string | number | boolean | null | undefined | EventListener>;

const SVG_NS = 'http://www.w3.org/2000/svg';
const SVG_TAGS = new Set([
  'svg', 'g', 'path', 'line', 'rect', 'circle', 'ellipse', 'polygon', 'polyline', 'text', 'tspan', 'defs', 'marker', 'pattern', 'clipPath', 'title', 'use',
]);

function append(el: Element, c: Child) {
  if (c === null || c === undefined || c === false) return;
  if (Array.isArray(c)) return c.forEach((x) => append(el, x));
  el.append(c instanceof Node ? c : document.createTextNode(String(c)));
}

export function h(tag: string, attrs: Attrs | null = null, ...children: Child[]): HTMLElement {
  const svg = SVG_TAGS.has(tag);
  const el = svg ? document.createElementNS(SVG_NS, tag) : document.createElement(tag);
  for (const [k, v] of Object.entries(attrs ?? {})) {
    if (v === null || v === undefined || v === false) continue;
    if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
    else if (v === true) el.setAttribute(k, '');
    else el.setAttribute(k, String(v));
  }
  children.forEach((c) => append(el, c));
  return el as HTMLElement;
}

export const s = (tag: string, attrs: Attrs | null = null, ...children: Child[]) => h(tag, attrs, ...children) as unknown as SVGElement;

export function mount(root: Element, ...nodes: Child[]) {
  root.replaceChildren();
  nodes.forEach((n) => append(root, n));
}

export const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
