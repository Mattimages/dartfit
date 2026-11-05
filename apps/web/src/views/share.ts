/**
 * Sharing, so DartFit spreads by itself:
 *  - a result can be shared as a link (and, where the phone allows, a picture card): "I throw like
 *    Luke Littler, my dart fits 94%". The link carries only the dart, the % and the pro, never
 *    hand sizes or the fit id, and opens a read-only page with that dart and a "your turn" button.
 *  - a gift buyer can send the player a link to measure their own hand; the player's result page
 *    then offers to send the dart back to the buyer.
 */
import type { Variant } from '@dartfit/engine';
import { h } from '../h';
import { num, t } from '../i18n';
import { go } from '../router';
import { session, update } from '../store';
import { pros, shopFor, variants } from '../api';
import { dartMedia, photoUrl } from '../media';
import { dartName } from './words';
import { approxEur } from '../money';
import { idealDartPaths } from './hero-scan';
import { giftIcon } from '../draw/icons';
import { monogram, proArtUrl } from '../draw/pro-art';
import { creditText, proPhoto, proPortrait } from '../draw/pro-photo';

const base = () => `${location.origin}${location.pathname}`;

/** Link to a shared result: only the dart, the match % and the pro. */
export function sharedLink(o: { variantId: string; pct: number; proId?: string; gift?: boolean }): string {
  const q = new URLSearchParams({ d: o.variantId, m: String(Math.round(o.pct)) });
  if (o.proId) q.set('p', o.proId);
  if (o.gift) q.set('g', '1');
  return `${base()}#/s?${q}`;
}

/** Link a gift buyer sends to the player. */
export function giftRequestLink(from: string): string {
  const q = new URLSearchParams({ cadeau: '1' });
  if (from.trim()) q.set('van', from.trim().slice(0, 40));
  return `${base()}#/?${q}`;
}

/** Share with the phone's own share sheet when there is one; otherwise WhatsApp and copy. */
function shareButtons(text: string, url: string, card?: () => Promise<Blob | null>): HTMLElement {
  const msg = h('p', { class: 'share-msg', role: 'status' });
  const wa = h(
    'a',
    {
      class: 'btn ghost share-wa',
      href: `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`,
      target: '_blank',
      rel: 'noopener',
    },
    t('share.whatsapp'),
  );
  const copy = h('button', { class: 'btn ghost', type: 'button' }, t('share.copy'));
  copy.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(url);
      msg.textContent = t('share.copied');
    } catch {
      msg.textContent = url;
    }
  });
  const row = h('div', { class: 'share-row' }, wa, copy);
  const box = h('div', { class: 'share-actions' });
  if (typeof navigator.share === 'function') {
    const native = h('button', { class: 'btn block', type: 'button' }, t('share.button'));
    native.addEventListener('click', async () => {
      const data: ShareData = { title: 'DartFit', text, url };
      try {
        const blob = card ? await card() : null;
        const file = blob ? new File([blob], 'dartfit.png', { type: 'image/png' }) : null;
        if (file && navigator.canShare?.({ files: [file] })) data.files = [file];
        await navigator.share(data);
      } catch {
        /* cancelled, or the share sheet refused the picture: the other buttons still work */
      }
    });
    box.append(native);
  }
  box.append(row, msg);
  return box;
}

/** One price-class option on the share picture. */
export interface ShareOption {
  tier: 'budget' | 'standard' | 'premium';
  v: Variant;
  pct: number;
}

const TIER_BG = { budget: '#0f9d63', standard: '#1f5fd6', premium: '#e3122c' } as const;

/**
 * A 1080 × 1350 picture of the result, for Instagram and WhatsApp status, in the look of the film's
 * last frame: the pro's photo filling the top with "Ik gooi als …" on it, then the price-class cards
 * (best match first, outlined green) with their dart photo, weight, price and match %.
 */
async function resultCard(o: {
  v: Variant;
  pct: number;
  pro?: string;
  proId?: string;
  proCountry?: string;
  options?: ShareOption[];
  ideal?: Parameters<typeof idealDartPaths>[0];
}): Promise<Blob | null> {
  const W = 1080;
  const H = 1350;
  const M = 48;
  const c = h('canvas') as HTMLCanvasElement;
  c.width = W;
  c.height = H;
  const g = c.getContext('2d');
  if (!g) return null;
  try {
    await document.fonts?.ready;
  } catch {
    /* fall back to the system font */
  }
  const font = (w: number, px: number) => `${w} ${px}px "Geist Variable", system-ui, sans-serif`;
  const load = async (src: string) => {
    const img = new Image();
    img.src = src;
    try {
      await img.decode();
      return img;
    } catch {
      return null;
    }
  };
  /** Text cut to fit, with an ellipsis. */
  const clip = (text: string, max: number) => {
    if (g.measureText(text).width <= max) return text;
    let s = text;
    while (s.length > 1 && g.measureText(`${s}…`).width > max) s = s.slice(0, -1);
    return `${s.trimEnd()}…`;
  };
  /** Draws `img` to cover the box, anchored `ay` (0 top … 1 bottom) vertically. */
  const cover = (img: HTMLImageElement, x: number, y: number, w: number, hh: number, ay = 0.5) => {
    const k = Math.max(w / img.width, hh / img.height);
    const dw = img.width * k;
    const dh = img.height * k;
    g.drawImage(img, x + (w - dw) / 2, y + (hh - dh) * ay, dw, dh);
  };
  const rr = (x: number, y: number, w: number, hh: number, r: number) => {
    g.beginPath();
    g.roundRect(x, y, w, hh, r);
  };

  // The stage: navy with a soft light at the top, like the film.
  const bg = g.createRadialGradient(W * 0.3, 0, 0, W * 0.3, 0, H);
  bg.addColorStop(0, '#24406b');
  bg.addColorStop(0.55, '#142238');
  bg.addColorStop(1, '#0f1b2d');
  g.fillStyle = bg;
  g.fillRect(0, 0, W, H);

  const options = o.options?.length
    ? o.options.slice(0, 3)
    : [{ tier: 'standard' as const, v: o.v, pct: o.pct }];
  const cardH = 190;
  const gap = 20;
  const cardsTop = H - 120 - options.length * cardH - (options.length - 1) * gap;
  // Your ideal dart sits just above the cards (its barrel band is y 34…70 of the film's 320-wide
  // model), the pro's photo fills the room above it.
  const dk = (W - 2 * M) / 320;
  const dartTop = o.ideal ? cardsTop - 28 - 36 * dk : cardsTop;
  const top = { x: M, y: M, w: W - 2 * M, h: dartTop - M - 28 };
  if (o.ideal) {
    const p = idealDartPaths(o.ideal);
    g.save();
    g.translate(M, dartTop - 34 * dk);
    g.scale(dk, dk);
    g.fillStyle = '#b8c0cc';
    g.fill(new Path2D(p.point));
    g.fillStyle = '#50627d';
    g.fill(new Path2D(p.shaft));
    g.fillStyle = 'rgb(46 229 157 / 0.3)';
    g.fill(new Path2D(p.barrel));
    g.strokeStyle = '#2ee59d';
    g.lineWidth = 1.6;
    g.stroke(new Path2D(p.barrel));
    g.restore();
  }

  // The pro's photo (same origin; credited at the bottom), else their player card, filling the top.
  const photo = proPhoto(o.proId);
  let credit = '';
  const art = o.pro
    ? photo
      ? await load(photo.file)
      : await load(proArtUrl({ name: o.pro, country: o.proCountry ?? '' }))
    : null;
  if (o.pro && art) {
    g.save();
    rr(top.x, top.y, top.w, top.h, 40);
    g.clip();
    g.fillStyle = '#1d3762';
    g.fillRect(top.x, top.y, top.w, top.h);
    cover(art, top.x, top.y, top.w, top.h, photo ? 0.2 : 0.5);
    // A dark fade at the bottom for the name.
    const fade = g.createLinearGradient(0, top.y + top.h * 0.55, 0, top.y + top.h);
    fade.addColorStop(0, 'rgb(10 18 31 / 0)');
    fade.addColorStop(1, 'rgb(10 18 31 / 0.85)');
    g.fillStyle = fade;
    g.fillRect(top.x, top.y, top.w, top.h);
    if (!photo) {
      g.fillStyle = '#ffffff';
      g.font = font(650, 120);
      g.fillText(monogram(o.pro), top.x + 44, top.y + 150);
    }
    g.restore();
    g.strokeStyle = 'rgb(255 255 255 / 0.9)';
    g.lineWidth = 5;
    rr(top.x, top.y, top.w, top.h, 40);
    g.stroke();
    if (photo) credit = creditText(photo);
    g.fillStyle = '#c5d1e2';
    g.font = font(550, 44);
    g.fillText(t('share.card.like'), top.x + 44, top.y + top.h - 118);
    g.fillStyle = '#ffffff';
    g.font = font(650, o.pro.length > 16 ? 84 : 100);
    g.fillText(clip(o.pro, top.w - 88), top.x + 44, top.y + top.h - 36);
  } else {
    g.fillStyle = '#c5d1e2';
    g.font = font(550, 52);
    g.fillText(t('share.card.mine'), M + 8, top.y + top.h - 150);
    g.fillStyle = '#ffffff';
    g.font = font(650, 96);
    g.fillText(clip(dartName(o.v), top.w - 16), M + 8, top.y + top.h - 40);
  }

  // The price-class cards.
  const darts = await Promise.all(
    options.map((x) => {
      const src = photoUrl(x.v.modelId, 400);
      return src ? load(src) : Promise.resolve(null);
    }),
  );
  options.forEach((x, i) => {
    const y = cardsTop + i * (cardH + gap);
    const best = i === 0;
    g.save();
    g.shadowColor = 'rgb(0 0 0 / 0.35)';
    g.shadowBlur = 30;
    g.shadowOffsetY = 12;
    g.fillStyle = '#ffffff';
    rr(M, y, W - 2 * M, cardH, 32);
    g.fill();
    g.restore();
    if (best) {
      g.strokeStyle = '#2ee59d';
      g.lineWidth = 7;
      rr(M, y, W - 2 * M, cardH, 32);
      g.stroke();
    }
    // Dart photo on a light tile.
    const tile = { x: M + 20, y: y + 20, w: cardH - 40, h: cardH - 40 };
    g.save();
    rr(tile.x, tile.y, tile.w, tile.h, 22);
    g.fillStyle = '#edf2f9';
    g.fill();
    g.clip();
    const img = darts[i];
    if (img) {
      const k = Math.min(tile.w / img.width, tile.h / img.height);
      g.drawImage(
        img,
        tile.x + (tile.w - img.width * k) / 2,
        tile.y + (tile.h - img.height * k) / 2,
        img.width * k,
        img.height * k,
      );
    }
    g.restore();
    const tx = tile.x + tile.w + 28;
    const pctX = W - M - 32;
    // Tier pill.
    g.font = font(600, 28);
    const label = t(`land.tier.${x.tier}`);
    const lw = g.measureText(label).width + 36;
    g.fillStyle = TIER_BG[x.tier];
    rr(tx, y + 26, lw, 44, 22);
    g.fill();
    g.fillStyle = '#ffffff';
    g.fillText(label, tx + 18, y + 58);
    // Match %.
    g.textAlign = 'right';
    g.fillStyle = '#0a8f5a';
    g.font = font(650, 76);
    g.fillText(`${Math.round(x.pct)}%`, pctX, y + cardH / 2 + 26);
    const pctW = g.measureText('100%').width;
    g.textAlign = 'left';
    // Name and weight · price.
    g.fillStyle = '#0f1b2d';
    g.font = font(650, 44);
    g.fillText(clip(dartName(x.v), pctX - pctW - 24 - tx), tx, y + 122);
    const eur = x.v.priceUsd ? approxEur(x.v.priceUsd) : null;
    g.fillStyle = '#5b6b82';
    g.font = font(500, 34);
    g.fillText(`${num(x.v.weightG)} g${eur ? ` · €${eur}` : ''}`, tx, y + 166);
  });

  g.fillStyle = '#ffffff';
  g.font = font(600, 40);
  g.fillText(t('share.card.cta'), M + 8, H - 62, W - 2 * M);
  if (credit) {
    g.fillStyle = '#8fa0b8';
    g.font = font(500, 22);
    g.textAlign = 'right';
    g.fillText(credit, W - 40, H - 20, W - 80);
    g.textAlign = 'left';
  }
  return new Promise((res) => c.toBlob((b) => res(b), 'image/png'));
}

/** The share box on a result. In a gift request it leads, addressed to the buyer. */
export function shareBox(o: {
  v: Variant;
  pct: number;
  proId?: string;
  proName?: string;
  /** The price classes, best match first, for the share picture. */
  options?: ShareOption[];
  /** Your ideal dart, drawn between the pro and the darts on the share picture. */
  ideal?: Parameters<typeof idealDartPaths>[0];
}): HTMLElement {
  const req = session().giftRequest;
  const url = sharedLink({ variantId: o.v.id, pct: o.pct, proId: o.proId, gift: !!req });
  const text = req
    ? t('share.text.gift', { dart: dartName(o.v) })
    : o.proName
      ? t('share.text.like', { pro: o.proName, pct: Math.round(o.pct) })
      : t('share.text.mine', { dart: dartName(o.v), pct: Math.round(o.pct) });
  return h(
    'section',
    { class: `share-box${req ? ' gift' : ''}`, 'aria-labelledby': 'share-title' },
    h(
      'h2',
      { id: 'share-title' },
      req
        ? req.from
          ? t('share.gift.title.named', { name: req.from })
          : t('share.gift.title')
        : t('share.title'),
    ),
    h('p', null, req ? t('share.gift.sub') : t('share.sub')),
    shareButtons(text, url, () =>
      resultCard({
        v: o.v,
        pct: o.pct,
        pro: o.proName,
        proId: o.proId,
        options: o.options,
        ideal: o.ideal,
        proCountry: pros().find((p) => p.id === o.proId)?.country,
      }),
    ),
  );
}

/** #/s?d=…&m=…&p=…&g=1 : someone's shared result. Read-only, with their dart and "your turn". */
export function sharedView(root: HTMLElement, _p: Record<string, string>, q: URLSearchParams) {
  const v = variants().find((x) => x.id === q.get('d'));
  const pct = Math.max(0, Math.min(100, Number(q.get('m') ?? '')));
  if (!v || !Number.isFinite(pct)) return go('/');
  const pro = pros().find((p) => p.id === q.get('p'));
  const gift = q.get('g') === '1';
  const shop = shopFor(v);
  root.append(
    h(
      'section',
      { class: 'stack shared' },
      pro && !gift && proPhoto(pro.id)
        ? h('div', { class: 'shared-pro' }, proPortrait(pro, { credit: true, eager: true }))
        : null,
      h('p', { class: 'kicker' }, gift ? t('shared.gift.kicker') : t('shared.kicker')),
      h(
        'h1',
        null,
        gift ? t('shared.gift.title') : pro ? t('shared.like', { pro: pro.name }) : t('shared.title'),
      ),
      h('p', { class: 'lead' }, gift ? t('shared.gift.lead') : t('shared.lead')),
      h(
        'article',
        { class: 'card shared-dart' },
        dartMedia(v),
        h('h2', null, dartName(v)),
        h(
          'p',
          { class: 'specline' },
          h('span', null, `${num(v.weightG)} g`),
          h('span', null, `${num(v.lengthMm)} mm`),
          h('span', null, `Ø ${num(v.diameterMm, 1)}`),
        ),
        h('p', { class: 'shared-pct' }, t('fit.win.total', { n: Math.round(pct) })),
        shop
          ? h(
              'a',
              { class: 'btn block', href: shop.url, target: '_blank', rel: 'noopener sponsored' },
              t('r.search', { shop: shop.name }),
            )
          : null,
      ),
      h(
        'div',
        { class: 'shared-cta' },
        h('h2', null, t('shared.you')),
        h('a', { class: 'btn block', href: '#/scan' }, t('land.cta')),
        h(
          'a',
          { class: 'btn ghost block ico-btn', href: '#/gift' },
          giftIcon(),
          h('span', null, t('start.gift')),
        ),
      ),
    ),
  );
}

/** #/gift : estimate it yourself, or send the player a link to measure their own hand. */
export function giftChoiceView(root: HTMLElement) {
  const name = h('input', {
    type: 'text',
    id: 'gift-from',
    autocomplete: 'given-name',
    maxlength: 40,
    placeholder: t('gift.from.placeholder'),
  }) as HTMLInputElement;
  const linkBox = h('div', { class: 'gift-link', hidden: true });
  const make = h('button', { class: 'btn block', type: 'button' }, t('gift.send.make'));
  make.addEventListener('click', () => {
    const from = name.value.trim();
    const url = giftRequestLink(from);
    linkBox.replaceChildren(
      shareButtons(from ? t('gift.send.text.named', { name: from }) : t('gift.send.text'), url),
    );
    linkBox.hidden = false;
    make.hidden = true;
  });
  const self = h('button', { class: 'btn ghost block', type: 'button' }, t('gift.self.go'));
  self.addEventListener('click', () => {
    update({
      gift: true,
      giftRequest: undefined,
      measurements: undefined,
      landmarksMm: undefined,
      answers: undefined,
    });
    go('/questions');
  });
  root.append(
    h(
      'section',
      { class: 'stack gift-choice' },
      h('h1', null, t('gift.title')),
      h('p', { class: 'lead' }, t('gift.lead')),
      h(
        'div',
        { class: 'gift-opt' },
        h('h2', null, t('gift.send.title')),
        h('p', null, t('gift.send.sub')),
        h('label', { class: 'label', for: 'gift-from' }, t('gift.from')),
        name,
        make,
        linkBox,
      ),
      h(
        'div',
        { class: 'gift-opt' },
        h('h2', null, t('gift.self.title')),
        h('p', null, t('gift.self.sub')),
        self,
      ),
    ),
  );
}

/** Opened from a gift link (#/?cadeau=1&van=Anna): remember it for the result's send-back box. */
export function giftRequestBanner(q: URLSearchParams | undefined): HTMLElement | null {
  if (q?.get('cadeau') === '1') {
    update({ giftRequest: { from: (q.get('van') ?? '').slice(0, 40) }, gift: false });
  }
  const req = session().giftRequest;
  if (!req) return null;
  return h(
    'p',
    { class: 'gift-banner', role: 'note' },
    req.from ? t('gift.banner.named', { name: req.from }) : t('gift.banner'),
  );
}
