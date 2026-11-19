/**
 * "Why this barrel suits your hand": three plain sentences built from the real numbers (length,
 * weight and shape of this dart against the player's ideal barrel), with the match % beside the
 * heading. Replaces the shape/style/total columns on the result (owner's "human" brief, 18 Nov).
 */
import type { IdealBarrel, ScoredVariant } from '@dartfit/engine';
import { h } from '../h';
import { num, t as tr, type Key } from '../i18n';
import { matchPct } from '../score';

export function fitNotes(sv: ScoredVariant, ideal: IdealBarrel, gift = false): HTMLElement {
  // Buying for someone else: the notes talk about "the player", like the questions did.
  const t = (key: Key, vars?: Record<string, string | number>) => {
    if (!gift) return tr(key, vars);
    const g = `${key}.gift` as Key;
    const out = tr(g, vars);
    return out === g ? tr(key, vars) : out;
  };
  const v = sv.variant;
  const dL = v.lengthMm - ideal.lengthMm;
  const dW = v.weightG - ideal.massG;
  const len =
    Math.abs(dL) <= 2
      ? t('r.note.len.same', { L: num(v.lengthMm, 1) })
      : t(dL > 0 ? 'r.note.len.longer' : 'r.note.len.shorter', {
          L: num(v.lengthMm, 1),
          d: num(Math.abs(dL), 1),
        });
  const weight =
    Math.abs(dW) <= 0.6
      ? t('r.note.w.same', { w: num(v.weightG) })
      : t(dW > 0 ? 'r.note.w.heavier' : 'r.note.w.lighter', {
          w: num(v.weightG),
          d: num(Math.abs(dW), 1),
        });
  const shapeWord = (s: string) => t(`r.shape.${s}` as Key);
  const shape = v.shape
    ? v.shape === ideal.shape
      ? t('r.note.shape.same', { shape: shapeWord(v.shape) })
      : t('r.note.shape.diff', { shape: shapeWord(v.shape), ideal: shapeWord(ideal.shape) })
    : null;
  return h(
    'div',
    { class: 'fit-notes' },
    h(
      'p',
      { class: 'fit-notes-head' },
      h('b', null, t('r.notes.title')),
      h('span', { class: `fit-notes-pct q-${sv.quality}` }, t('r.note.match', { n: Math.round(matchPct(sv.cost)) })),
    ),
    h('ul', null, h('li', null, len), h('li', null, weight), shape ? h('li', null, shape) : null),
  );
}
