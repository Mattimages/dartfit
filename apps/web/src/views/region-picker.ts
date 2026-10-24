/**
 * Country and language picker, as a modal. Opens by itself on the first visit (no country chosen
 * yet) and from the globe in the header. The country decides which shops are linked; the language
 * is separate.
 */
import { h } from '../h';
import { getLang, LANGS, setLang, t, type Lang } from '../i18n';
import { COUNTRIES, getCountry, setCountry } from '../region';

const POPULAR = ['NL', 'BE', 'DE', 'GB', 'US', 'IE', 'FR'];
/** English and Dutch names too, so "Germany" or "Duitsland" finds Deutschland. */
const ALIASES: Record<string, string> = {
  AT: 'austria oostenrijk',
  BE: 'belgium belgie belgië',
  BG: 'bulgaria bulgarije',
  HR: 'croatia kroatie kroatië',
  CY: 'cyprus',
  CZ: 'czech republic czechia tsjechie tsjechië',
  DK: 'denmark denemarken',
  EE: 'estonia estland',
  FI: 'finland',
  FR: 'france frankrijk',
  DE: 'germany duitsland',
  GR: 'greece griekenland',
  HU: 'hungary hongarije',
  IE: 'ireland ierland',
  IT: 'italy italie italië',
  LV: 'latvia letland',
  LT: 'lithuania litouwen',
  LU: 'luxembourg luxemburg',
  MT: 'malta',
  NL: 'netherlands holland nederland the netherlands',
  NO: 'norway noorwegen',
  PL: 'poland polen',
  PT: 'portugal',
  RO: 'romania roemenie roemenië',
  SK: 'slovakia slowakije',
  SI: 'slovenia slovenie slovenië',
  ES: 'spain spanje',
  SE: 'sweden zweden',
  CH: 'switzerland zwitserland',
  GB: 'united kingdom uk great britain england verenigd koninkrijk engeland',
  US: 'united states usa america verenigde staten amerika',
};

export function openRegionPicker(onDone: () => void, first = false) {
  document.querySelector('dialog.region-dialog')?.remove();
  let lang: Lang = getLang();
  const current = getCountry();

  const dialog = h('dialog', {
    class: 'region-dialog',
    'aria-labelledby': 'region-title',
  }) as HTMLDialogElement;
  const close = () => {
    dialog.close();
    dialog.remove();
  };

  const langRow = h(
    'div',
    { class: 'rp-langs', role: 'radiogroup', 'aria-label': t('region.lang') },
    ...LANGS.map((l) => {
      const b = h(
        'button',
        { type: 'button', role: 'radio', 'aria-checked': String(l.id === lang), 'data-lang': l.id },
        l.name,
      );
      b.addEventListener('click', () => {
        lang = l.id;
        langRow
          .querySelectorAll('button')
          .forEach((x) => x.setAttribute('aria-checked', String(x.dataset.lang === lang)));
      });
      return b;
    }),
  );

  const choose = (code: string) => {
    setCountry(code);
    setLang(lang);
    close();
    onDone();
  };
  const countryBtn = (c: (typeof COUNTRIES)[number]) => {
    const b = h(
      'button',
      {
        type: 'button',
        class: `rp-country${c.code === current ? ' on' : ''}`,
        'data-name': `${c.name} ${ALIASES[c.code] ?? ''}`.toLowerCase(),
      },
      h('span', { class: 'rp-code' }, c.code),
      h('span', { class: 'rp-name' }, c.name),
    );
    b.addEventListener('click', () => choose(c.code));
    return b;
  };
  const popular = POPULAR.map((code) => COUNTRIES.find((c) => c.code === code)).filter(
    (c): c is (typeof COUNTRIES)[number] => !!c,
  );
  const rest = COUNTRIES.filter((c) => !POPULAR.includes(c.code)).sort((a, b) =>
    a.name.localeCompare(b.name),
  );
  const lists = h(
    'div',
    { class: 'rp-lists' },
    h('p', { class: 'rp-group' }, t('region.popular')),
    h('div', { class: 'rp-grid' }, ...popular.map(countryBtn)),
    h('p', { class: 'rp-group' }, t('region.all')),
    h('div', { class: 'rp-grid' }, ...rest.map(countryBtn)),
  );

  const search = h('input', {
    type: 'search',
    class: 'rp-search',
    placeholder: t('region.search'),
    'aria-label': t('region.search'),
    autocomplete: 'off',
  }) as HTMLInputElement;
  search.addEventListener('input', () => {
    const q = search.value.trim().toLowerCase();
    lists.querySelectorAll<HTMLElement>('.rp-country').forEach((b) => {
      const code = b.querySelector('.rp-code')?.textContent?.toLowerCase() ?? '';
      b.hidden = !!q && !(b.dataset.name ?? '').includes(q) && code !== q;
    });
    lists.querySelectorAll<HTMLElement>('.rp-group').forEach((g) => (g.hidden = !!q));
  });

  const x = h('button', { type: 'button', class: 'rp-close', 'aria-label': t('region.close') }, '×');
  x.addEventListener('click', () => {
    // Closing on the first visit keeps the guessed country, so the question is not asked again.
    if (first) setCountry(current);
    close();
    if (first) onDone();
  });
  dialog.addEventListener('cancel', (e) => {
    e.preventDefault();
    x.click();
  });

  dialog.append(
    h(
      'div',
      { class: 'rp' },
      x,
      h('h2', { id: 'region-title' }, t(first ? 'region.welcome' : 'region.label')),
      h('p', { class: 'rp-note' }, t('region.note')),
      langRow,
      search,
      lists,
    ),
  );
  document.body.append(dialog);
  dialog.showModal();
  // Start on the list, not in the search box: on phones that would pop up the keyboard.
  (lists.querySelector<HTMLElement>('.rp-country.on') ?? x).focus();
}
