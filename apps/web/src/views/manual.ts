import { h } from '../h';
import { t } from '../i18n';
import { go } from '../router';
import { update } from '../store';

/**
 * Ruler fallback. One tape measurement (wrist crease to middle fingertip). The other dimensions are
 * scaled from typical hand proportions, so the spread is set wide and confidence stays modest.
 */
export function manualView(root: HTMLElement) {
  const input = h('input', { id: 'hl', type: 'number', inputmode: 'numeric', min: 130, max: 240, step: 1, required: true }) as HTMLInputElement;
  const err = h('p', { class: 'error', role: 'alert', hidden: true }, t('manual.range'));
  const form = h(
    'form',
    { class: 'stack', novalidate: true },
    h('label', { class: 'label', for: 'hl' }, t('manual.length')),
    input,
    err,
    h('button', { class: 'btn', type: 'submit' }, t('manual.go')),
  );
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const v = Number(input.value);
    if (!Number.isFinite(v) || v < 130 || v > 240) {
      err.hidden = false;
      input.focus();
      return;
    }
    const s = v / 185;
    update({
      measurements: {
        handLengthMm: v,
        palmWidthMm: Number((78 * s).toFixed(1)),
        indexLengthMm: Number((78 * s).toFixed(1)),
        middleLengthMm: Number((85 * s).toFixed(1)),
        thumbIndexSpanMm: Number((120 * s).toFixed(1)),
        spreadMm: 4,
        samples: 3,
        calibrated: false,
      },
      landmarksMm: undefined,
    });
    go('/questions');
  });
  root.append(h('section', { class: 'stack' }, h('h1', null, t('manual.title')), h('p', { class: 'lead' }, t('manual.lead')), form));
}
