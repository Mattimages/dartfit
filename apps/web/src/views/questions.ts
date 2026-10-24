import type { Answers } from '@dartfit/engine';
import { h } from '../h';
import { t, type Key } from '../i18n';
import { go } from '../router';
import { session, update } from '../store';
import { pictogram } from '../draw/art';
import { quizDart, type Focus } from './quiz-dart';

interface Opt {
  value: string;
  label: string;
  /** Large text instead of a pictogram, e.g. "3" or "€60". */
  big?: string;
}

/** One question: a fieldset of picture tiles backed by real radio inputs. */
function tiles(
  name: string,
  legend: string,
  opts: Opt[],
  value: string,
  cols = opts.length,
  pics = true,
): HTMLElement {
  return h(
    'fieldset',
    { class: 'field' },
    h('legend', null, legend),
    h(
      'div',
      { class: pics ? 'tiles' : 'tiles short', style: `--cols:${cols}` },
      ...opts.map((o) =>
        h(
          'label',
          { class: 'tile' },
          h('input', { type: 'radio', name, value: o.value, checked: o.value === value }),
          o.big
            ? h('span', { class: 'big', 'aria-hidden': 'true' }, o.big)
            : pics
              ? pictogram(name, o.value)
              : null,
          o.label ? h('span', null, o.label) : h('span', { class: 'visually-hidden' }, o.big ?? o.value),
        ),
      ),
    ),
  );
}

const opts = (prefix: string, values: string[]): Opt[] =>
  values.map((v) => ({ value: v, label: t(`${prefix}.${v}` as Key) }));

const DEFAULTS: Answers = {
  tip: 'steel',
  hold: 'middle',
  fingers: 3,
  throwStyle: 'unsure',
  moisture: 'normal',
  gripFeel: 3,
  thickness: 'auto',
};

export function questionsView(root: HTMLElement) {
  const s = session();
  const a: Answers = { ...DEFAULTS, ...(s.answers ?? {}) };

  // Grip: a slider, so the knurling on the live dart follows your thumb.
  const gripVal = h('output', { class: 'grip-val', for: 'gripFeel' }, String(a.gripFeel));
  const gripRange = h('input', {
    type: 'range',
    id: 'gripFeel',
    name: 'gripFeel',
    min: 1,
    max: 5,
    step: 1,
    value: a.gripFeel,
    'aria-valuetext': String(a.gripFeel),
  }) as HTMLInputElement;
  gripRange.addEventListener('input', () => {
    gripVal.textContent = gripRange.value;
    gripRange.setAttribute('aria-valuetext', gripRange.value);
  });
  const grip = h(
    'fieldset',
    { class: 'field' },
    h('legend', null, t('q.grip')),
    h('p', { class: 'hint' }, t('q.grip.hint')),
    h(
      'div',
      { class: 'grip-row' },
      h('label', { class: 'visually-hidden', for: 'gripFeel' }, t('q.grip')),
      gripRange,
      gripVal,
    ),
    h(
      'div',
      { class: 'scale-ends', 'aria-hidden': 'true' },
      h('span', null, pictogram('gripFeel', '1'), t('q.grip.1')),
      h('span', null, pictogram('gripFeel', '5'), t('q.grip.5')),
    ),
  );

  // ── Body: height (and optionally forearm). Feeds hand size without a scan and the throw geometry.
  const heightIn = h('input', {
    type: 'number',
    id: 'height',
    inputmode: 'numeric',
    min: 130,
    max: 220,
    step: 1,
    placeholder: '178',
    value: a.heightCm ?? '',
  }) as HTMLInputElement;
  const forearmIn = h('input', {
    type: 'number',
    id: 'forearm',
    inputmode: 'decimal',
    min: 18,
    max: 36,
    step: 0.5,
    placeholder: '26',
    value: a.forearmCm ?? '',
  }) as HTMLInputElement;
  const body = h(
    'fieldset',
    { class: 'field' },
    h('legend', null, t('q.body')),
    h('p', { class: 'hint' }, t('q.body.why')),
    h('label', { class: 'visually-hidden', for: 'height' }, t('q.body.height')),
    h('div', { class: 'mm-input' }, heightIn, h('span', { 'aria-hidden': 'true' }, 'cm')),
    h('label', { class: 'label', for: 'forearm', style: 'margin-top:1.25rem' }, t('q.body.forearm')),
    h('p', { class: 'hint' }, t('q.body.forearm.hint')),
    h('div', { class: 'mm-input small-input' }, forearmIn, h('span', { 'aria-hidden': 'true' }, 'cm')),
  );

  /** One question per screen. `auto` steps move on by themselves when tapped. */
  const steps: Array<{ el: HTMLElement; auto: boolean; focus?: Focus }> = [
    { el: body, auto: false },
    {
      el: tiles('hold', t('q.hold'), opts('q.hold', ['front', 'middle', 'rear']), a.hold),
      auto: true,
      focus: 'hold',
    },
    {
      el: tiles(
        'fingers',
        t('q.fingers'),
        ['2', '3', '4'].map((v) => ({ value: v, label: t('q.fingers.unit', { n: v }) })),
        String(a.fingers),
      ),
      auto: true,
      focus: 'fingers',
    },
    {
      el: tiles('throwStyle', t('q.throw'), opts('q.throw', ['flat', 'arc', 'unsure']), a.throwStyle),
      auto: true,
      focus: 'throwStyle',
    },
    { el: grip, auto: false, focus: 'gripFeel' },
  ];

  const progress = h(
    'div',
    { class: 'progress', style: `--n:${steps.length}`, 'aria-hidden': 'true' },
    ...steps.map(() => h('i')),
  );
  const progressText = h('p', { class: 'visually-hidden', 'aria-live': 'polite' });
  const backBtn = h('button', { class: 'btn link', type: 'button' }, t('q.back'));
  const nextBtn = h('button', { class: 'btn', type: 'button' }, t('q.next'));
  const submitBtn = h('button', { class: 'btn', type: 'submit' }, t('q.submit'));
  const stage = h('div', { class: 'stage' }, ...steps.map((st) => h('div', { class: 'step' }, st.el)));
  const preview = quizDart();
  const stepEls = [...stage.children] as HTMLElement[];
  const err = h('p', { class: 'error', role: 'alert', hidden: true });
  let at = 0;
  let lastPointer = 0;

  // The live dart follows whatever is selected right now (or the defaults for questions not reached).
  const refresh = () => {
    const fd = new FormData(form as HTMLFormElement);
    const get = (k: string, d: string | number) => String(fd.get(k) ?? d);
    const now: Answers = {
      tip: 'steel',
      hold: get('hold', a.hold) as Answers['hold'],
      fingers: Number(get('fingers', a.fingers)) as Answers['fingers'],
      throwStyle: get('throwStyle', a.throwStyle) as Answers['throwStyle'],
      moisture: 'normal',
      gripFeel: Number(get('gripFeel', a.gripFeel)) as Answers['gripFeel'],
      thickness: 'auto',
    };
    const f = steps[at]?.focus ?? null;
    preview.el.hidden = !f;
    preview.update(now, f);
  };

  const show = (i: number, focus = true) => {
    at = Math.max(0, Math.min(steps.length - 1, i));
    stepEls.forEach((el, j) => {
      el.hidden = j !== at;
      el.classList.toggle('enter', j === at);
    });
    [...progress.children].forEach((x, j) => x.classList.toggle('on', j <= at));
    progressText.textContent = t('q.progress', { i: at + 1, n: steps.length });
    backBtn.hidden = at === 0;
    const last = at === steps.length - 1;
    nextBtn.hidden = last;
    submitBtn.hidden = !last;
    err.hidden = true;
    refresh();
    if (focus) {
      const target = stepEls[at]?.querySelector<HTMLElement>('legend');
      if (target) {
        target.tabIndex = -1;
        target.focus({ preventScroll: true });
      }
      window.scrollTo({ top: 0 });
    }
  };

  // Tapping an answer moves on; arrow keys inside a radio group do not (that would skip questions).
  stage.addEventListener('pointerup', () => (lastPointer = Date.now()));
  // A click also fires when the tapped answer was already selected (the default), so that moves on too.
  stage.addEventListener('click', (e) => {
    const input = e.target as HTMLInputElement;
    if (input.type !== 'radio' || !steps[at]?.auto || Date.now() - lastPointer > 800) return;
    setTimeout(() => show(at + 1), 240);
  });
  backBtn.addEventListener('click', () => show(at - 1));
  nextBtn.addEventListener('click', () => show(at + 1));

  const form = h(
    'form',
    { class: 'quiz', novalidate: true },
    progress,
    progressText,
    preview.el,
    stage,
    err,
    h('div', { class: 'quiz-nav' }, backBtn, nextBtn, submitBtn),
  );

  form.addEventListener('input', () => refresh());
  form.addEventListener('change', () => refresh());

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(form as HTMLFormElement);
    const val = (k: string) => String(fd.get(k) ?? '');
    const answers: Answers = {
      // Steel tip only: the site fits sisal-board darts.
      tip: 'steel',
      hold: val('hold') as Answers['hold'],
      fingers: Number(val('fingers')) as Answers['fingers'],
      throwStyle: val('throwStyle') as Answers['throwStyle'],
      moisture: 'normal',
      gripFeel: Number(val('gripFeel')) as Answers['gripFeel'],
      thickness: 'auto',
    };
    const hgt = heightIn.value ? Number(heightIn.value) : undefined;
    const fa = forearmIn.value ? Number(forearmIn.value.replace(',', '.')) : undefined;
    if ((hgt !== undefined && !(hgt >= 130 && hgt <= 220)) || (fa !== undefined && !(fa >= 18 && fa <= 36))) {
      show(0, false);
      err.textContent = t('q.body.range');
      err.hidden = false;
      heightIn.focus();
      return;
    }
    if (hgt) answers.heightCm = hgt;
    if (fa) answers.forearmCm = fa;
    // No current-dart or price-class questions: every price class is shown on the result.
    update({ answers, currentName: undefined, priceClass: 'any' });
    go('/fitting');
  });

  root.append(h('section', null, h('h1', { class: 'visually-hidden' }, t('q.title')), form));
  show(0, false);
}
