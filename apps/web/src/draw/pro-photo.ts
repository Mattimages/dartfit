/**
 * A pro's real photo (Wikimedia Commons, served from our own origin under /pros/, credited with
 * author and licence as CC BY / CC BY-SA require). Falls back to the player card (pro-art.ts) for
 * pros without a photo.
 */
import { proPhotos, type ProPhoto } from 'virtual:dartfit-catalogue';
import { h } from '../h';
import { t } from '../i18n';
import { proArt } from './pro-art';

type ProLike = { id?: string; name: string; country: string };

export function proPhoto(id: string | undefined): ProPhoto | undefined {
  return id ? proPhotos[id] : undefined;
}

/** "Foto: Sandro Halank, CC BY-SA 4.0 (bijgesneden)" with links to the file and the licence. */
export function photoCredit(p: ProPhoto, o: { links?: boolean } = {}): HTMLElement {
  const link = (href: string, text: string, rel: string) =>
    o.links === false ? text : h('a', { href, target: '_blank', rel }, text);
  return h(
    'span',
    { class: 'pp-credit' },
    `${t('pp.photo')} `,
    link(p.source, p.author, 'noopener'),
    ', ',
    link(p.licenseUrl, p.license, 'noopener license'),
    p.cropped ? ` ${t('pp.cropped')}` : '',
  );
}

/** The credit as plain text (a title on photos shown without a caption). */
export const creditText = (p: ProPhoto) =>
  `${t('pp.photo')} ${p.author}, ${p.license}${p.cropped ? ` ${t('pp.cropped')}` : ''}`;

/**
 * The pro's portrait: a figure with the photo (class `pro-art pro-photo`, so it sits wherever the
 * player card did) or the player card itself. `credit` puts the credit line on the photo; leave it
 * off only where the credit is shown next to it (or for the film's short-lived badge, which the
 * credits list on the method page covers).
 */
export function proPortrait(
  pro: ProLike,
  o: { credit?: boolean | 'text'; eager?: boolean } = {},
): Element {
  const p = proPhoto(pro.id);
  if (!p) return proArt(pro);
  return h(
    'figure',
    { class: 'pro-art pro-photo' },
    h('img', {
      src: p.file,
      alt: pro.name,
      loading: o.eager ? 'eager' : 'lazy',
      decoding: 'async',
      width: 480,
      height: 600,
      title: o.credit ? null : creditText(p),
    }),
    o.credit ? h('figcaption', null, photoCredit(p, { links: o.credit !== 'text' })) : null,
  );
}

/** A small round photo (lists); null when the pro has none. */
export function proAvatar(pro: ProLike): HTMLElement | null {
  const p = proPhoto(pro.id);
  if (!p) return null;
  return h('img', {
    class: 'pro-avatar',
    src: p.file,
    alt: '',
    loading: 'lazy',
    decoding: 'async',
    width: 96,
    height: 96,
    title: creditText(p),
  });
}

/** Every photo's credit, for the method page. */
export function photoCredits(pros: { id: string; name: string }[]): HTMLElement {
  return h(
    'ul',
    { class: 'pp-credits' },
    ...pros
      .filter((x) => proPhotos[x.id])
      .map((x) => h('li', null, h('strong', null, x.name), ' · ', photoCredit(proPhotos[x.id]!))),
  );
}
