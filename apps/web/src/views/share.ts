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
import { giftIcon } from '../draw/icons';

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

/** A 1080 × 1350 picture of the result, for Instagram and WhatsApp status. */
async function resultCard(o: { v: Variant; pct: number; pro?: string }): Promise<Blob | null> {
  const W = 1080;
  const H = 1350;
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
  const bg = g.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#1d3762');
  bg.addColorStop(0.6, '#0f1b2d');
  bg.addColorStop(1, '#0a121f');
  g.fillStyle = bg;
  g.fillRect(0, 0, W, H);
  // The board ring in the corner, as on the site.
  g.save();
  g.translate(W + 40, H + 40);
  for (let i = 0; i < 40; i++) {
    g.beginPath();
    g.strokeStyle = i % 2 ? '#0fa76a' : '#e3122c';
    g.lineWidth = 30;
    g.arc(0, 0, 250, (i * Math.PI) / 20, ((i + 1) * Math.PI) / 20);
    g.stroke();
  }
  g.restore();
  g.fillStyle = '#ffffff';
  g.font = font(650, 54);
  g.fillText('DartFit', 80, 130);
  g.fillStyle = '#c5d1e2';
  g.font = font(550, 46);
  g.fillText(o.pro ? t('share.card.like') : t('share.card.mine'), 80, 300);
  g.fillStyle = '#ffffff';
  g.font = font(650, o.pro && o.pro.length > 16 ? 96 : 120);
  g.fillText(o.pro ?? dartName(o.v), 80, 430, W - 160);
  // The dart photo, when there is one (same-origin, so the canvas stays exportable).
  const src = photoUrl(o.v.modelId, 800);
  if (src) {
    const img = new Image();
    img.src = src;
    try {
      await img.decode();
      // On a light rounded tile, like the photos on the site.
      const box = { x: 80, y: 480, w: W - 160, h: 520 };
      g.save();
      g.beginPath();
      g.roundRect(box.x, box.y, box.w, box.h, 36);
      g.fillStyle = '#edf2f9';
      g.fill();
      g.clip();
      const scale = Math.min(box.w / img.width, box.h / img.height);
      const w = img.width * scale;
      const hgt = img.height * scale;
      g.drawImage(img, box.x + (box.w - w) / 2, box.y + (box.h - hgt) / 2, w, hgt);
      g.restore();
    } catch {
      /* no photo */
    }
  }
  g.fillStyle = '#c5d1e2';
  g.font = font(550, 44);
  g.fillText(`${dartName(o.v)} · ${num(o.v.weightG)} g`, 80, 1080, 760);
  g.fillStyle = '#2ee59d';
  g.font = font(650, 110);
  g.fillText(t('fit.win.total', { n: Math.round(o.pct) }), 80, 1210);
  g.fillStyle = '#ffffff';
  g.font = font(550, 38);
  g.fillText(t('share.card.cta'), 80, 1290, 700);
  return new Promise((res) => c.toBlob((b) => res(b), 'image/png'));
}

/** The share box on a result. In a gift request it leads, addressed to the buyer. */
export function shareBox(o: { v: Variant; pct: number; proId?: string; proName?: string }): HTMLElement {
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
    shareButtons(text, url, () => resultCard({ v: o.v, pct: o.pct, pro: o.proName })),
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
