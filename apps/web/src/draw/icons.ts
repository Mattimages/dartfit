/** Small line icons (24 × 24, currentColor) for buttons. */
import { s } from '../h';

const icon = (...c: SVGElement[]) =>
  s('svg', { class: 'btn-ico', viewBox: '0 0 24 24', 'aria-hidden': 'true', focusable: 'false' }, ...c);

/** A bank card with a slash through it. */
export const noCardIcon = () =>
  icon(
    s('rect', { x: 2.5, y: 5.5, width: 19, height: 13, rx: 2.5 }),
    s('path', { d: 'M2.5 9.5h19M6 15h4' }),
    s('path', { class: 'btn-ico-slash', d: 'M3.5 3.5l17 17' }),
  );

/** A wrapped present with a bow. */
export const giftIcon = () =>
  icon(
    s('rect', { x: 3.5, y: 9, width: 17, height: 11.5, rx: 1.5 }),
    s('path', { d: 'M2.5 9h19M12 9v11.5' }),
    s('path', { d: 'M12 9C10.5 5 6.5 4.5 6.5 7S10 9 12 9ZM12 9c1.5-4 5.5-4.5 5.5-2S14 9 12 9Z' }),
  );
