export type FormatLang = 'nl' | 'en' | 'de';

/**
 * Locale number: 6,5 in Dutch and German, 6.5 in English. Trailing decimal zeros are dropped
 * (6.50 → 6.5, 22.0 → 22), but never the zeros of a whole number (20 stays 20).
 */
export function formatNum(n: number, digits: number, lang: FormatLang): string {
  let v = n.toFixed(digits);
  if (v.includes('.')) v = v.replace(/0+$/, '').replace(/\.$/, '');
  if (v === '-0') v = '0';
  return lang === 'en' ? v : v.replace('.', ',');
}

const LOCALE: Record<FormatLang, string> = { nl: 'nl-NL', en: 'en-GB', de: 'de-DE' };

/** "20 okt 2026" / "20 Oct 2026" / "20. Okt. 2026" from an ISO date; the input is returned when it is not a date. */
export function formatDate(iso: string, lang: FormatLang): string {
  const d = new Date(`${iso}T12:00:00Z`);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat(LOCALE[lang], {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(d);
}
