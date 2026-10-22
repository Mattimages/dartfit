import type { Reason, Shape, Variant } from '@dartfit/engine';
import { num, t, type Key } from '../i18n';

const lower = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);
const signed = (n: number, digits = 1) => `${n > 0 ? '+' : n < 0 ? '−' : '±'}${num(Math.abs(n), digits)}`;
const k = (key: string) => key as Key;

/** One readable sentence per engine reason, or null when it says nothing new. */
export function reasonText(r: Reason): string | null {
  if (r.code === 'confidence') return null;
  const p: Record<string, string> = {};
  for (const [name, v] of Object.entries(r.params)) {
    if (typeof v === 'number') p[name] = num(v);
    else p[name] = v;
  }
  if (r.effect !== undefined) p.effect = signed(r.effect, r.dim === 'diameter' ? 2 : 1);
  const feel = r.params.feel;
  if (typeof feel === 'string') {
    if (r.code === 'weight_current') p.feel = lower(t(k(`q.feel.${feel}`)));
    if (r.code === 'grip_current') p.feel = lower(t(k(`q.gripfeel.${feel}`)));
    if (r.code === 'length_current') p.feel = lower(t(k(`q.lenfeel.${feel}`)));
    if (r.code === 'diameter_current') p.feel = lower(t(k(`q.thickfeel.${feel}`)));
  }
  if (typeof r.params.hold === 'string') p.hold = lower(t(k(`q.hold.${r.params.hold}`)));
  if (typeof r.params.style === 'string') p.style = t(k(`word.${r.params.style}`));
  if (typeof r.params.moisture === 'string') p.moisture = t(k(`word.${r.params.moisture}`));
  if (typeof r.params.thickness === 'string') p.thickness = lower(t(k(`q.thickness.${r.params.thickness}`)));
  if (typeof r.params.balance === 'string') p.balance = t(k(`r.balance.${r.params.balance}`));
  const key = k(`why.${r.code}`);
  const out = t(key, p);
  return out === key ? null : out;
}

export const shapeName = (s: Shape | null) => (s ? t(k(`r.shape.${s}`)) : t('r.unknown'));
export const balanceName = (b: string | null) => (b ? t(k(`r.balance.${b}`)) : t('r.unknown'));
export const material = (v: Pick<Variant, 'tungstenPct'>) =>
  v.tungstenPct > 0 ? t('r.material.tungsten', { pct: v.tungstenPct }) : t('r.material.brass');
export const dartName = (v: Pick<Variant, 'brand' | 'model'>) => `${v.brand} ${v.model}`;
