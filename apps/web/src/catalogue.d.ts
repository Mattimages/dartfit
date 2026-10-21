declare module 'virtual:dartfit-catalogue' {
  import type { Pro, Variant } from '@dartfit/engine';
  export interface Shop {
    id: string;
    name: string;
    countries: string[];
    searchTemplate: string;
    priority?: number;
  }
  export const catalogue: { variants: Variant[]; pros: Pro[]; shops: Shop[] };
}
