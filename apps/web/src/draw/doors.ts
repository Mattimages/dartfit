/**
 * Picture buttons for the side doors into the fit ("Geen pasje?", "Koop je voor iemand anders?"):
 * a drawing on top, the label under it. The hand is the same skin-toned drawing as the landing
 * film; the gift box matches the gift ads. Drawn locally, nothing is fetched.
 */
import { h, s } from '../h';
import { handArt } from './art';

function handBeside(): SVGElement {
  const hand = handArt({ lengthMm: 185 });
  hand.setAttribute('x', '6');
  hand.setAttribute('y', '4');
  hand.setAttribute('width', '70');
  hand.setAttribute('height', '92');
  hand.setAttribute('preserveAspectRatio', 'xMidYMax meet');
  return hand;
}

const card = () =>
  s('rect', {
    x: 82,
    y: 34,
    width: 50,
    height: 31.5,
    rx: 4,
    fill: 'var(--green-soft)',
    stroke: 'var(--green)',
    'stroke-width': 1.6,
    'stroke-dasharray': '4 3',
  });

/** The hand with a pasje beside it. */
export function cardPicture(): SVGElement {
  return s('svg', { class: 'door-art', viewBox: '0 0 140 100', 'aria-hidden': 'true' }, handBeside(), card());
}

/** The hand alone, with a crossed-out pasje beside it. */
export function noCardPicture(): SVGElement {
  return s(
    'svg',
    { class: 'door-art', viewBox: '0 0 140 100', 'aria-hidden': 'true' },
    handBeside(),
    card(),
    s('line', {
      x1: 80,
      y1: 70,
      x2: 134,
      y2: 29,
      stroke: 'var(--red)',
      'stroke-width': 3.4,
      'stroke-linecap': 'round',
    }),
  );
}

/** A wrapped present: red box, gold ribbon, a bow on the lid. */
export function giftPicture(): SVGElement {
  return s(
    'svg',
    { class: 'door-art', viewBox: '0 0 140 100', 'aria-hidden': 'true' },
    s('rect', { x: 36, y: 46, width: 68, height: 48, rx: 4, fill: '#e3122c' }),
    s('rect', { x: 84, y: 46, width: 20, height: 48, rx: 4, fill: '#b70d22' }),
    s('rect', { x: 63, y: 46, width: 14, height: 48, fill: '#ffd166' }),
    s('rect', { x: 31, y: 34, width: 78, height: 15, rx: 4, fill: '#ff2e45' }),
    s('rect', { x: 88, y: 34, width: 21, height: 15, rx: 4, fill: '#d0142b' }),
    s('rect', { x: 63, y: 34, width: 14, height: 15, fill: '#ffd166' }),
    s('path', { d: 'M70,34C58,14 42,16 44,26C46,35 62,36 70,34Z', fill: '#ffd166' }),
    s('path', { d: 'M70,34C82,14 98,16 96,26C94,35 78,36 70,34Z', fill: '#ffd166' }),
    s('path', { d: 'M70,34C63,22 54,23 55,28C56,33 64,35 70,34Z', fill: '#e8b23f' }),
    s('path', { d: 'M70,34C77,22 86,23 85,28C84,33 76,35 70,34Z', fill: '#e8b23f' }),
    s('circle', { cx: 70, cy: 34.5, r: 5, fill: '#f5c04f' }),
  );
}

type Door = { label: string; picture: SVGElement; href?: string; onclick?: () => void };

/** One or two picture buttons; one goes full width with the picture on the left. */
export function doors(list: Door[]): HTMLElement {
  return h(
    'div',
    { class: `doors${list.length === 1 ? ' single' : ''}` },
    ...list.map((d) =>
      d.href
        ? h(
            'a',
            { class: 'door', href: d.href },
            h('span', { class: 'door-pic' }, d.picture),
            h('span', null, d.label),
          )
        : h(
            'button',
            { class: 'door', type: 'button', onclick: d.onclick },
            h('span', { class: 'door-pic' }, d.picture),
            h('span', null, d.label),
          ),
    ),
  );
}
