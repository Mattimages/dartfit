import { cardPicture, doors, giftPicture, noCardPicture } from '../draw/doors';
import { handArt } from '../draw/art';
import { checkHandFrame, type Landmark, type Pt } from '@dartfit/engine';
import { h, s } from '../h';
import { t, type Key } from '../i18n';
import { go } from '../router';
import { session, update } from '../store';
import { loadDetector } from '../scan/detector';
import { CARD_GUIDE, Scanner, measureStill, type Status } from '../scan/scanner';

const BONES: Array<[number, number]> = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4],
  [0, 5],
  [5, 6],
  [6, 7],
  [7, 8],
  [5, 9],
  [9, 10],
  [10, 11],
  [11, 12],
  [9, 13],
  [13, 14],
  [14, 15],
  [15, 16],
  [13, 17],
  [17, 18],
  [18, 19],
  [19, 20],
  [0, 17],
];

/** object-fit: cover mapping between source pixels (video or photo) and displayed CSS pixels. */
function cover(src: { w: number; h: number }, box: DOMRect) {
  const vw = src.w || 1;
  const vh = src.h || 1;
  const k = Math.max(box.width / vw, box.height / vh);
  const ox = (box.width - vw * k) / 2;
  const oy = (box.height - vh * k) / 2;
  return {
    toDisplay: (p: Pt) => ({ x: p.x * k + ox, y: p.y * k + oy }),
    toVideo: (p: Pt) => ({ x: (p.x - ox) / k, y: (p.y - oy) / k }),
    k,
  };
}

/** Top view of the set-up: the phone's frame, the card in its guide, a flat hand with spread fingers. */
/**
 * How to lay it out: the pasje at the top of the frame, the hand flat below it, both at their real
 * sizes relative to each other (a card is 85.6 mm wide, a hand about 185 mm long). The hand is the
 * same skin-toned drawing as the landing film.
 */
function setupDiagram(): SVGElement {
  // Side by side (owner, 18 Nov: shorter): the pasje on the left, the drawn hand on the right,
  // both at about real scale (a 185 mm hand is a little over twice the card's 85.6 mm).
  const cardW = 112;
  const cardH = cardW / (85.6 / 53.98);
  const cardX = 40;
  const cardY = 100 - cardH / 2;
  const hand = handArt({ lengthMm: 185 });
  hand.setAttribute('x', '160');
  hand.setAttribute('y', '16');
  hand.setAttribute('width', '150');
  hand.setAttribute('height', '176');
  hand.setAttribute('preserveAspectRatio', 'xMidYMax meet');
  // The label on two lines, split at the last space, so longer languages still fit the card.
  const label = t('scan.card_any');
  const cut = label.lastIndexOf(' ');
  const lines = cut > 0 ? [label.slice(0, cut), label.slice(cut + 1)] : [label];
  const cx = cardX + cardW / 2;
  const top = cardY + cardH / 2 - ((lines.length - 1) * 16) / 2 + 4.5;
  return s(
    'svg',
    { class: 'drawing', viewBox: '0 0 340 200', role: 'img', 'aria-label': t('scan.setup') },
    s('rect', {
      x: 20,
      y: 8,
      width: 300,
      height: 184,
      rx: 24,
      fill: 'none',
      stroke: 'var(--ink)',
      'stroke-width': 2,
    }),
    s('rect', {
      x: cardX,
      y: cardY,
      width: cardW,
      height: cardH,
      rx: 6,
      fill: 'var(--green-soft)',
      stroke: 'var(--green)',
      'stroke-width': 2,
      'stroke-dasharray': '6 4',
    }),
    s(
      'text',
      { x: cx, y: top, 'text-anchor': 'middle', class: 'dimtext cardtext' },
      ...lines.map((l, i) => s('tspan', { x: cx, dy: i ? 16 : 0 }, l)),
    ),
    hand,
  );
}

async function askOrientation() {
  const D = window.DeviceOrientationEvent as unknown as
    { requestPermission?: () => Promise<string> } | undefined;
  if (D?.requestPermission) await D.requestPermission().catch(() => 'denied');
}

const NO_CAMERA = import.meta.env.VITE_NO_CAMERA === '1';

export function scanView(root: HTMLElement, _params?: Record<string, string>, query?: URLSearchParams) {
  let stream: MediaStream | null = null;
  let scanner: Scanner | null = null;
  let disposed = false;
  // Scanning your own hand: not a gift any more.
  if (session().gift) update({ gift: false });

  const status = h('p', { class: 'status', role: 'status', 'aria-live': 'polite' });
  const bar = h('span');
  const meter = h('div', { class: 'meter', 'aria-hidden': 'true' }, bar);
  const video = h('video', { playsinline: true, muted: true, autoplay: true }) as HTMLVideoElement;
  const overlay = h('canvas', { 'aria-hidden': 'true' }) as HTMLCanvasElement;
  const freeze = h('canvas', { hidden: true, 'aria-hidden': 'true' }) as HTMLCanvasElement;
  const guide = h('div', { class: 'guide', 'aria-hidden': 'true' }, t('scan.card_here'));
  const tapLayer = h('div', {
    class: 'tap-layer',
    hidden: true,
    role: 'application',
    'aria-label': t('scan.tap_hint'),
  });
  // A standing hint in the viewfinder: how to hold the hand (on the table with a card; any flat
  // way without one).
  const vfHint = h('p', { class: 'vf-hint', 'aria-hidden': 'true' });
  const camera = h(
    'div',
    { class: 'camera', hidden: true },
    video,
    freeze,
    overlay,
    guide,
    vfHint,
    tapLayer,
  );
  const tapBtn = h('button', { class: 'btn ghost', type: 'button', hidden: true }, t('scan.tap_fallback'));

  // The flow (owner, 18 Nov): "Start scan" → with or without a pasje → a pop-up for each (keep
  // your details out of view / the pasje is our ruler) → the camera.
  const startScan = h('button', { class: 'btn', type: 'button' }, t('scan.start'));
  const startRow = h('div', { class: 'actions' }, startScan);
  const giftOnly = doors([{ label: t('start.gift'), picture: giftPicture(), href: '#/gift' }]);
  const photoInput = h('input', {
    type: 'file',
    accept: 'image/*',
    id: 'photo',
    class: 'visually-hidden',
  }) as HTMLInputElement;
  const photoBtn = h('label', { class: 'btn ghost', for: 'photo' }, t('scan.photo'));

  const popup = (id: string, title: string, body: string, ...actions: HTMLElement[]) => {
    const d = h(
      'dialog',
      { class: 'pop-dialog', 'aria-labelledby': id },
      h(
        'div',
        { class: 'pop' },
        h('h2', { id }, title),
        h('p', null, body),
        h('div', { class: 'pop-actions' }, ...actions),
      ),
    ) as HTMLDialogElement;
    // A tap on the dimmed backdrop closes it, like Esc.
    d.addEventListener('click', (e) => e.target === d && d.close());
    return d;
  };
  const startBtn = h('button', { class: 'btn', type: 'button' }, t('scan.camera'));
  const photoPick = h('button', { class: 'btn ghost', type: 'button' }, t('scan.photo'));
  const withBack = h('button', { class: 'btn link', type: 'button' }, t('scan.back'));
  const withDlg = popup('card-title', t('scan.card.title'), t('scan.card.body'), startBtn, photoPick, withBack);
  const getCard = h('button', { class: 'btn', type: 'button' }, t('scan.nocard.back'));
  const noCardGo = h('button', { class: 'btn ghost', type: 'button' }, t('scan.nocard.go'));
  const withoutDlg = popup('nocard-title', t('scan.nocard.title'), t('scan.nocard.warn'), getCard, noCardGo);
  const choice = doors([
    { label: t('scan.with'), picture: cardPicture(), onclick: () => withDlg.showModal() },
    { label: t('scan.without'), picture: noCardPicture(), onclick: () => withoutDlg.showModal() },
  ]);
  const choiceBox = h(
    'div',
    { class: 'scan-choice', hidden: true },
    h('h2', null, t('scan.choose')),
    choice,
  );
  // Builds without the hand model (only the embedded preview) measure with a ruler instead; the
  // real site has no ruler option.
  const intro = NO_CAMERA
    ? h(
        'div',
        { class: 'stack scan-intro' },
        h('p', { class: 'lead' }, t('scan.unavailable')),
        h('div', { class: 'actions' }, h('a', { class: 'btn', href: '#/manual' }, t('scan.manual'))),
        giftOnly,
      )
    : h(
        'div',
        { class: 'stack scan-intro' },
        h('figure', { class: 'sheet narrow' }, setupDiagram()),
        startRow,
        choiceBox,
        giftOnly,
        h('p', { class: 'small' }, t('scan.privacy')),
        photoInput,
      );

  root.append(
    h(
      'section',
      { class: 'stack scan-page' },
      h('h1', null, t('scan.title')),
      intro,
      camera,
      meter,
      status,
      h('div', { class: 'actions' }, tapBtn),
      withDlg,
      withoutDlg,
    ),
  );
  meter.hidden = true;

  const say = (key: Key, vars: Record<string, string | number> = {}, ok = false) => {
    status.textContent = t(key, vars);
    status.dataset.ok = String(ok);
  };

  let lastLm: Landmark[] | null = null;
  /** Set when the player uses a photo instead of the live camera. */
  let still: { lm: Landmark[]; w: number; h: number } | null = null;
  const srcDims = () => (still ? { w: still.w, h: still.h } : { w: video.videoWidth, h: video.videoHeight });
  const drawOverlay = () => {
    const box = camera.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    overlay.width = Math.round(box.width * dpr);
    overlay.height = Math.round(box.height * dpr);
    const ctx = overlay.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, box.width, box.height);
    if (!lastLm) return;
    const map = cover(srcDims(), box);
    const dims = srcDims();
    const P = (i: number) => {
      const p = lastLm![i]!;
      return map.toDisplay({ x: p.x * dims.w, y: p.y * dims.h });
    };
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    for (const [a, b] of BONES) {
      const p = P(a);
      const q = P(b);
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(q.x, q.y);
      ctx.stroke();
    }
    ctx.fillStyle = '#e5484d';
    for (let i = 0; i < 21; i++) {
      const p = P(i);
      ctx.beginPath();
      ctx.arc(p.x, p.y, i % 4 === 0 ? 5 : 4, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  const placeGuide = () => {
    const box = camera.getBoundingClientRect();
    const map = cover(srcDims(), box);
    const vw = video.videoWidth;
    const vh = video.videoHeight;
    const gw = CARD_GUIDE.w * vw;
    const a = map.toDisplay({ x: CARD_GUIDE.x * vw, y: CARD_GUIDE.y * vh });
    const b = map.toDisplay({ x: CARD_GUIDE.x * vw + gw, y: CARD_GUIDE.y * vh + gw / (85.6 / 53.98) });
    Object.assign(guide.style, {
      left: `${a.x}px`,
      top: `${a.y}px`,
      width: `${b.x - a.x}px`,
      height: `${b.y - a.y}px`,
    });
  };

  // ── Tap mode ────────────────────────────────────────────────────────
  let taps: Pt[] = [];
  const enterTapMode = () => {
    scanner?.stop();
    if (!still) {
      freeze.width = video.videoWidth;
      freeze.height = video.videoHeight;
      freeze.getContext('2d')?.drawImage(video, 0, 0);
      lastLm = null;
    }
    freeze.hidden = false;
    video.hidden = true;
    guide.hidden = true;
    tapLayer.hidden = false;
    tapBtn.hidden = true;
    taps = [];
    drawOverlay();
    say('scan.tap_hint');
  };
  const drawTaps = () => {
    const ctx = overlay.getContext('2d');
    if (!ctx) return;
    drawOverlay();
    ctx.fillStyle = '#3db37a';
    ctx.strokeStyle = '#3db37a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    taps.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
    if (taps.length === 4) ctx.closePath();
    ctx.stroke();
    for (const p of taps) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 7, 0, Math.PI * 2);
      ctx.fill();
    }
  };
  tapLayer.addEventListener('pointerdown', (e) => {
    const box = camera.getBoundingClientRect();
    taps.push({ x: e.clientX - box.left, y: e.clientY - box.top });
    drawTaps();
    if (taps.length < 4) {
      say('scan.tap_count', { n: taps.length });
      return;
    }
    const map = cover(srcDims(), box);
    const corners = taps.map(map.toVideo) as [Pt, Pt, Pt, Pt];
    if (still) {
      const r = measureStill(still.lm, still.w, still.h, corners);
      if (r) {
        update({ measurements: r.measurements, landmarksMm: r.landmarksMm });
        go('/hand');
        return;
      }
      say('scan.photo.badcorners');
      taps = [];
      setTimeout(drawTaps, 600);
      return;
    }
    if (!scanner?.measureWithCorners(corners)) {
      say('scan.tap_failed');
      taps = [];
      setTimeout(drawTaps, 600);
    }
  });
  tapBtn.addEventListener('click', enterTapMode);

  // ── Start ───────────────────────────────────────────────────────────
  let noCard = false;
  const showChoice = () => {
    startRow.hidden = true;
    choiceBox.hidden = false;
  };
  startScan.addEventListener('click', () => {
    showChoice();
    choice.querySelector('button')?.focus();
  });
  withBack.addEventListener('click', () => withDlg.close());
  photoPick.addEventListener('click', () => {
    withDlg.close();
    photoInput.click();
  });
  getCard.addEventListener('click', () => {
    withoutDlg.close();
    withDlg.showModal();
  });
  // From an old "No bank card?" link: straight to that pop-up.
  if (query?.get('nocard') === '1' && !NO_CAMERA) {
    showChoice();
    withoutDlg.showModal();
  }
  noCardGo.addEventListener('click', () => {
    noCard = true;
    withoutDlg.close();
    startBtn.click();
  });
  startBtn.addEventListener('click', async () => {
    withDlg.close();
    startBtn.setAttribute('disabled', '');
    await askOrientation();
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });
    } catch {
      say('scan.no_camera');
      startBtn.removeAttribute('disabled');
      noCard = false;
      intro.hidden = false;
      return;
    }
    if (disposed) return stream.getTracks().forEach((tr) => tr.stop());
    video.srcObject = stream;
    await video.play().catch(() => {});
    intro.hidden = true;
    camera.hidden = false;
    meter.hidden = false;
    say('scan.loading');
    await new Promise((r) =>
      video.readyState >= 1
        ? r(null)
        : video.addEventListener('loadedmetadata', () => r(null), { once: true }),
    );
    vfHint.textContent = t(noCard ? 'scan.vf.free' : 'scan.vf.table');
    if (noCard) {
      guide.hidden = true;
      camera.classList.add('nocard-live');
    } else placeGuide();
    let detector;
    try {
      detector = await loadDetector();
    } catch {
      say('scan.no_model');
      return;
    }
    if (disposed) return;
    // Which backend runs is for debugging only, so it lives on the element, not on screen.
    camera.dataset.detector = detector.kind;
    scanner = new Scanner(
      video,
      detector,
      {
        status: (s: Status, progress: number) => {
          bar.style.width = `${Math.round(progress * 100)}%`;
          guide.classList.toggle(
            'ok',
            s === 'measuring' || s === 'done' || s === 'overlap' || s === 'phone_tilt',
          );
          if (s === 'measuring')
            say('scan.status.measuring', { n: Math.round(progress * 18), total: 18 }, true);
          else if (s === 'done') say('scan.status.done', {}, true);
          // Without a card the hand needn't lie on a table, so those hints don't say "lay".
          else if (noCard && (s === 'no_hand' || s === 'fingers_bent' || s === 'hand_tilted'))
            say(`scan.status.${s}.free` as Key);
          else say(`scan.status.${s}` as Key);
          tapBtn.hidden = s !== 'tap_needed';
        },
        landmarks: (lm) => {
          lastLm = lm;
          drawOverlay();
        },
        card: () => {},
        done: (r) => {
          update({ measurements: r.measurements, landmarksMm: r.landmarksMm });
          go('/hand');
        },
      },
      noCard,
    );
    scanner.start();
  });

  // ── Photo instead of the live camera ───────────────────────────────
  photoInput.addEventListener('change', async () => {
    const file = photoInput.files?.[0];
    if (!file) return;
    const img = new Image();
    const url = URL.createObjectURL(file);
    try {
      img.src = url;
      await img.decode();
    } catch {
      say('scan.photo.unreadable');
      return;
    } finally {
      URL.revokeObjectURL(url);
    }
    const scale = Math.min(1, 1600 / Math.max(img.naturalWidth, img.naturalHeight));
    freeze.width = Math.round(img.naturalWidth * scale);
    freeze.height = Math.round(img.naturalHeight * scale);
    freeze.getContext('2d')?.drawImage(img, 0, 0, freeze.width, freeze.height);
    intro.hidden = true;
    camera.hidden = false;
    camera.style.aspectRatio = `${freeze.width} / ${freeze.height}`;
    freeze.hidden = false;
    video.hidden = true;
    guide.hidden = true;
    say('scan.loading');
    let detector;
    try {
      detector = await loadDetector();
    } catch {
      say('scan.no_model');
      return;
    }
    // The detector tracks across calls; run it twice so the second pass refines the first.
    let lm = await detector.detect(freeze, performance.now()).catch(() => null);
    lm = (await detector.detect(freeze, performance.now() + 33).catch(() => null)) ?? lm;
    const gate = checkHandFrame(lm ?? undefined);
    still = lm ? { lm, w: freeze.width, h: freeze.height } : null;
    lastLm = lm;
    drawOverlay();
    if (gate || !still) {
      say(`scan.status.${gate ?? 'no_hand'}` as Key);
      camera.after(photoBtn);
      return;
    }
    enterTapMode();
  });

  const onResize = () => {
    if (!camera.hidden) {
      placeGuide();
      drawOverlay();
    }
  };
  window.addEventListener('resize', onResize);

  return () => {
    disposed = true;
    scanner?.stop();
    stream?.getTracks().forEach((tr) => tr.stop());
    window.removeEventListener('resize', onResize);
  };
}
