import { variantBarrel, type Variant } from '@dartfit/engine';
import { dartArt, toneFor } from './draw/art';
import { num } from './i18n';

/**
 * A 0–100 match score for display, from the engine's cost (0 = perfect). exp(-cost/12) keeps the
 * engine's quality bands readable: excellent (cost ≤ 2) ≈ 85–100, good (≤ 5) ≈ 66–85, fair (≤ 10) ≈ 43–66.
 */
export const matchPct = (cost: number) => Math.max(1, Math.min(99, Math.round(100 * Math.exp(-cost / 12))));

/** The dart illustration for a catalogue variant, from its real profile. */
/** `dim` adds the red measuring line under the barrel with its length. */
export function variantArt(v: Variant, className = '', dim = false) {
  const g = variantBarrel(v);
  return dartArt(
    {
      lengthMm: v.lengthMm,
      diameterMm: v.diameterMm,
      profile: g.profile,
      grip: v.gripIntensity,
      soft: v.tip === 'soft',
      tone: toneFor(v.modelId),
      dim: dim ? `${num(v.lengthMm)} mm` : undefined,
    },
    className,
  );
}
