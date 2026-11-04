declare module 'virtual:dartfit-catalogue' {
  import type { Pro, Variant } from '@dartfit/engine';
  export interface Shop {
    id: string;
    name: string;
    countries: string[];
    searchTemplate: string;
    priority?: number;
  }
  export interface PhotoRef {
    url: string;
    cleared: boolean;
  }
  /** A pro's photo (Wikimedia Commons, credited). `file` is a same-origin path or, in the
   *  single-file preview, a data URL. */
  export interface ProPhoto {
    file: string;
    author: string;
    license: string;
    licenseUrl: string;
    source: string;
    cropped: boolean;
  }
  export const proPhotos: Record<string, ProPhoto>;
  export const catalogue: {
    variants: Variant[];
    pros: Pro[];
    shops: Shop[];
    photos: Record<string, PhotoRef>;
  };
}
