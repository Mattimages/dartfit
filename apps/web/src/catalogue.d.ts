declare module 'virtual:dartfit-catalogue' {
  import type { Pro, Variant } from '@dartfit/engine';
  export const catalogue: { variants: Variant[]; pros: Pro[] };
}
