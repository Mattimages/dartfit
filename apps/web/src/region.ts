/**
 * Where the player shops. The country decides which affiliate shops are linked; the language is
 * separate (a German speaker in Switzerland, a Dutch speaker in Belgium). Stored per browser.
 */
import { getLang } from './i18n';

/** EU member states plus the UK, Switzerland and Norway, with their names in their own language. */
export const COUNTRIES: Array<{ code: string; name: string }> = [
  { code: 'AT', name: 'Österreich' },
  { code: 'BE', name: 'België / Belgique' },
  { code: 'BG', name: 'България' },
  { code: 'HR', name: 'Hrvatska' },
  { code: 'CY', name: 'Κύπρος' },
  { code: 'CZ', name: 'Česko' },
  { code: 'DK', name: 'Danmark' },
  { code: 'EE', name: 'Eesti' },
  { code: 'FI', name: 'Suomi' },
  { code: 'FR', name: 'France' },
  { code: 'DE', name: 'Deutschland' },
  { code: 'GR', name: 'Ελλάδα' },
  { code: 'HU', name: 'Magyarország' },
  { code: 'IE', name: 'Ireland' },
  { code: 'IT', name: 'Italia' },
  { code: 'LV', name: 'Latvija' },
  { code: 'LT', name: 'Lietuva' },
  { code: 'LU', name: 'Luxembourg' },
  { code: 'MT', name: 'Malta' },
  { code: 'NL', name: 'Nederland' },
  { code: 'NO', name: 'Norge' },
  { code: 'PL', name: 'Polska' },
  { code: 'PT', name: 'Portugal' },
  { code: 'RO', name: 'România' },
  { code: 'SK', name: 'Slovensko' },
  { code: 'SI', name: 'Slovenija' },
  { code: 'ES', name: 'España' },
  { code: 'SE', name: 'Sverige' },
  { code: 'CH', name: 'Schweiz / Suisse' },
  { code: 'GB', name: 'United Kingdom' },
];
const known = new Set(COUNTRIES.map((c) => c.code));

let country: string = (() => {
  try {
    const saved = localStorage.getItem('df_country');
    if (saved && known.has(saved)) return saved;
  } catch {
    /* storage unavailable */
  }
  // Region part of the browser language (nl-BE → BE), else a sensible default per language.
  const region = navigator.language.split('-')[1]?.toUpperCase();
  if (region && known.has(region)) return region;
  return getLang() === 'de' ? 'DE' : getLang() === 'nl' ? 'NL' : 'IE';
})();

export const getCountry = () => country;
export function setCountry(c: string) {
  if (!known.has(c)) return;
  country = c;
  try {
    localStorage.setItem('df_country', c);
  } catch {
    /* ignore */
  }
}

/** The server explains in Dutch or English; German falls back to English there. */
export const apiLang = (): 'nl' | 'en' => (getLang() === 'nl' ? 'nl' : 'en');
