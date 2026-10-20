import type { Answers, CurrentDart, Variant } from '@dartfit/engine';
import { h } from '../h';
import { num, t, type Key } from '../i18n';
import { go } from '../router';
import { session, update } from '../store';
import { variants } from '../api';
import { dartName } from './words';

type Opt = { value: string; label: string };

/** A segmented single-choice control backed by real radio inputs. */
function seg(name: string, legend: string, opts: Opt[], value: string, hint?: string): HTMLElement {
  return h(
    'fieldset',
    { class: 'field' },
    h('legend', null, legend),
    hint ? h('p', { class: 'hint' }, hint) : null,
    h(
      'div',
      { class: 'seg', style: `--n:${opts.length}` },
      ...opts.map((o) =>
        h(
          'label',
          null,
          h('input', { type: 'radio', name, value: o.value, checked: o.value === value }),
          o.label,
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
  let picked: Variant | null = a.current?.variantId
    ? (variants().find((v) => v.id === a.current?.variantId) ?? null)
    : null;

  // ── Current dart: pick from the catalogue, or type the weight ───────
  const search = h('input', {
    type: 'search',
    id: 'dart-search',
    autocomplete: 'off',
    placeholder: t('darts.search'),
  }) as HTMLInputElement;
  const results = h('ul', { class: 'whatif', role: 'listbox', 'aria-label': t('q.current.pick') });
  const pickedLine = h('p', { class: 'small' });
  const clearPick = h('button', { class: 'btn link', type: 'button' }, t('q.current.clear'));
  const weight = h('input', {
    type: 'number',
    id: 'cw',
    inputmode: 'decimal',
    min: 12,
    max: 40,
    step: 0.5,
    value: a.current?.weightG ?? '',
  }) as HTMLInputElement;
  const length = h('input', {
    type: 'number',
    id: 'cl',
    inputmode: 'decimal',
    min: 30,
    max: 70,
    step: 0.5,
    value: a.current?.lengthMm ?? '',
  }) as HTMLInputElement;

  const feelBox = h('div', { class: 'stack' });
  const renderFeels = () => {
    const c = a.current;
    feelBox.replaceChildren(
      ...[
        seg(
          'feel',
          t('q.current.feel'),
          opts('q.feel', ['too_light', 'right', 'too_heavy']),
          c?.feel ?? 'right',
        ),
        picked
          ? seg(
              'currentGrip',
              t('q.current.grip'),
              opts('q.gripfeel', ['too_smooth', 'right', 'too_sharp']),
              c?.gripFeel ?? 'right',
            )
          : null,
        picked
          ? seg(
              'thicknessFeel',
              t('q.current.thickness'),
              opts('q.thickfeel', ['too_thin', 'right', 'too_thick']),
              c?.thicknessFeel ?? 'right',
            )
          : null,
        picked || length.value
          ? seg(
              'lengthFeel',
              t('q.current.lengthfeel'),
              opts('q.lenfeel', ['too_short', 'right', 'too_long']),
              c?.lengthFeel ?? 'right',
            )
          : null,
      ].filter((x): x is HTMLElement => x !== null),
    );
  };

  const manualBox = h(
    'div',
    { class: 'stack' },
    h('p', { class: 'hint' }, t('q.current.pick.none')),
    h('label', { class: 'label', for: 'cw' }, t('q.current.weight')),
    weight,
    h('label', { class: 'label', for: 'cl' }, t('q.current.length')),
    length,
  );
  const pickBox = h(
    'div',
    { class: 'stack' },
    h('label', { class: 'label', for: 'dart-search' }, t('q.current.pick')),
    h('p', { class: 'hint' }, t('q.current.pick.hint')),
    search,
    results,
  );
  const pickedBox = h('div', { class: 'actions' }, pickedLine, clearPick);

  const showPicked = () => {
    pickedBox.hidden = !picked;
    pickBox.hidden = !!picked;
    manualBox.hidden = !!picked;
    if (picked)
      pickedLine.textContent = t('q.current.picked', {
        name: `${dartName(picked)} ${num(picked.weightG)} g`,
      });
    renderFeels();
  };

  const renderResults = () => {
    const q = search.value.trim().toLowerCase();
    results.replaceChildren();
    if (q.length < 2) return;
    const hits = variants()
      .filter((v) => `${v.brand} ${v.model} ${v.weightG}g`.toLowerCase().includes(q))
      .slice(0, 8);
    for (const v of hits) {
      const b = h(
        'button',
        { class: 'btn ghost block', type: 'button', role: 'option' },
        `${dartName(v)} · ${num(v.weightG)} g`,
      );
      b.addEventListener('click', () => {
        picked = v;
        a.current = {
          ...(a.current ?? { feel: 'right' }),
          variantId: v.id,
          weightG: v.weightG,
        } as CurrentDart;
        search.value = '';
        results.replaceChildren();
        showPicked();
      });
      results.append(h('li', null, b));
    }
  };
  search.addEventListener('input', renderResults);
  clearPick.addEventListener('click', () => {
    picked = null;
    if (a.current) delete a.current.variantId;
    showPicked();
    search.focus();
  });
  length.addEventListener('change', renderFeels);

  const hasCurrent = !!a.current;
  const currentBox = h(
    'div',
    { class: 'stack', hidden: !hasCurrent },
    pickedBox,
    pickBox,
    manualBox,
    feelBox,
  );
  const currentToggle = seg(
    'hasCurrent',
    t('q.current'),
    [
      { value: 'no', label: t('q.current.none') },
      { value: 'yes', label: t('q.current.yes') },
    ],
    hasCurrent ? 'yes' : 'no',
    t('q.current.lead'),
  );
  currentToggle.addEventListener('change', (e) => {
    currentBox.hidden = (e.target as HTMLInputElement).value !== 'yes';
  });

  const budget = h('input', {
    type: 'number',
    id: 'budget',
    inputmode: 'numeric',
    min: 10,
    max: 1000,
    step: 5,
    value: a.budgetUsd ?? '',
  }) as HTMLInputElement;
  const err = h('p', { class: 'error', role: 'alert', hidden: true });

  const m = s.measurements;
  const form = h(
    'form',
    { class: 'stack', novalidate: true },
    h(
      'p',
      { class: 'small' },
      m ? t('q.measured', { L: num(m.handLengthMm, 0), W: num(m.palmWidthMm, 0) }) : t('q.notmeasured'),
    ),
    seg('tip', t('q.tip'), opts('q.tip', ['steel', 'soft']), a.tip),
    seg('hold', t('q.hold'), opts('q.hold', ['front', 'middle', 'rear']), a.hold),
    seg(
      'fingers',
      t('q.fingers'),
      ['2', '3', '4'].map((v) => ({ value: v, label: v })),
      String(a.fingers),
      t('q.fingers.hint'),
    ),
    seg('throwStyle', t('q.throw'), opts('q.throw', ['flat', 'arc', 'unsure']), a.throwStyle),
    seg('moisture', t('q.moisture'), opts('q.moisture', ['dry', 'normal', 'sweaty']), a.moisture),
    h(
      'div',
      null,
      seg(
        'gripFeel',
        t('q.grip'),
        ['1', '2', '3', '4', '5'].map((v) => ({ value: v, label: v })),
        String(a.gripFeel),
      ),
      h(
        'div',
        { class: 'scale-ends', 'aria-hidden': 'true' },
        h('span', null, t('q.grip.1')),
        h('span', null, t('q.grip.5')),
      ),
    ),
    seg(
      'thickness',
      t('q.thickness'),
      opts('q.thickness', ['slim', 'standard', 'chunky', 'auto']),
      a.thickness,
    ),
    currentToggle,
    currentBox,
    h(
      'div',
      { class: 'field' },
      h('label', { class: 'label', for: 'budget' }, t('q.budget')),
      h('p', { class: 'hint' }, t('q.budget.note')),
      budget,
    ),
    err,
    h('button', { class: 'btn block', type: 'submit' }, t('q.submit')),
  );

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(form as HTMLFormElement);
    const val = (k: string) => String(fd.get(k) ?? '');
    const answers: Answers = {
      tip: val('tip') as Answers['tip'],
      hold: val('hold') as Answers['hold'],
      fingers: Number(val('fingers')) as Answers['fingers'],
      throwStyle: val('throwStyle') as Answers['throwStyle'],
      moisture: val('moisture') as Answers['moisture'],
      gripFeel: Number(val('gripFeel')) as Answers['gripFeel'],
      thickness: val('thickness') as Answers['thickness'],
    };
    if (val('hasCurrent') === 'yes') {
      const feel = (val('feel') || 'right') as CurrentDart['feel'];
      if (picked) {
        answers.current = { variantId: picked.id, weightG: picked.weightG, feel };
      } else {
        const w = Number(weight.value);
        if (!Number.isFinite(w) || w < 12 || w > 40) {
          err.textContent = t('q.current.weight.range');
          err.hidden = false;
          weight.focus();
          return;
        }
        answers.current = { weightG: w, feel };
        const l = Number(length.value);
        if (length.value && Number.isFinite(l) && l >= 30 && l <= 70) answers.current.lengthMm = l;
      }
      const lf = fd.get('lengthFeel');
      if (lf && answers.current) answers.current.lengthFeel = lf as CurrentDart['lengthFeel'];
      const tf = fd.get('thicknessFeel');
      if (tf && answers.current) answers.current.thicknessFeel = tf as CurrentDart['thicknessFeel'];
      const cg = fd.get('currentGrip');
      if (cg && answers.current) answers.current.gripFeel = cg as CurrentDart['gripFeel'];
    }
    const b = Number(budget.value);
    if (budget.value && Number.isFinite(b) && b >= 10) answers.budgetUsd = b;
    update({ answers, currentName: picked ? dartName(picked) : undefined });
    go('/fitting');
  });

  root.append(
    h(
      'section',
      { class: 'stack' },
      h('h1', null, t('q.title')),
      h('p', { class: 'lead' }, t('q.lead')),
      form,
    ),
  );
  showPicked();
}
