import { giftIcon, noCardIcon } from '../draw/icons';
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
function setupDiagram(): SVGElement {
  // Approximate landmark positions (mm) of a flat right hand, palm down, fingers spread.
  const P = [
    [0, 0],
    [-22, -18],
    [-40, -38],
    [-54, -58],
    [-66, -76],
    [-22, -88],
    [-31, -121],
    [-36, -144],
    [-40, -164],
    [-2, -92],
    [-3, -130],
    [-4, -155],
    [-5, -180],
    [17, -88],
    [24, -121],
    [29, -144],
    [33, -162],
    [33, -78],
    [45, -101],
    [52, -117],
    [58, -132],
  ];
  const k = 1.15;
  const X = (i: number) => 170 + P[i]![0]! * k;
  const Y = (i: number) => 470 + P[i]![1]! * k;
  const bones = BONES.map(([a, b]) =>
    s('line', {
      x1: X(a),
      y1: Y(a),
      x2: X(b),
      y2: Y(b),
      stroke: 'var(--steel)',
      'stroke-width': 7,
      'stroke-linecap': 'round',
    }),
  );
  const cardW = 150;
  const cardH = cardW / (85.6 / 53.98);
  return s(
    'svg',
    { class: 'drawing', viewBox: '0 0 340 520', role: 'img', 'aria-label': t('scan.setup') },
    s('rect', {
      x: 20,
      y: 10,
      width: 300,
      height: 500,
      rx: 26,
      fill: 'none',
      stroke: 'var(--ink)',
      'stroke-width': 2,
    }),
    s('rect', {
      x: 95,
      y: 40,
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
      { x: 170, y: 40 + cardH / 2 + 5, 'text-anchor': 'middle', class: 'dimtext' },
      t('scan.card_here'),
    ),
    ...bones,
    ...P.map((_, i) => s('circle', { cx: X(i), cy: Y(i), r: 4.5, fill: 'var(--red)' })),
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
  const camera = h('div', { class: 'camera', hidden: true }, video, freeze, overlay, guide, tapLayer);
  const tapBtn = h('button', { class: 'btn ghost', type: 'button', hidden: true }, t('scan.tap_fallback'));

  const startBtn = h('button', { class: 'btn', type: 'button' }, t('scan.camera'));
  // No card at hand: proportions only, with a clear warning first.
  const noCardBtn = h(
    'button',
    { class: 'btn ghost ico-btn', type: 'button' },
    noCardIcon(),
    h('span', null, t('start.nocard')),
  );
  const giftBtn = h(
    'a',
    { class: 'btn ghost ico-btn', href: '#/gift' },
    giftIcon(),
    h('span', null, t('start.gift')),
  );
  const noCardGo = h('button', { class: 'btn', type: 'button' }, t('scan.nocard.go'));
  const noCardBack = h('button', { class: 'btn ghost', type: 'button' }, t('scan.nocard.back'));
  const noCardBox = h(
    'div',
    { class: 'nocard', hidden: true, role: 'region', 'aria-labelledby': 'nocard-title' },
    h('h2', { id: 'nocard-title' }, t('scan.nocard.title')),
    h('p', null, t('scan.nocard.warn')),
    h('div', { class: 'actions' }, noCardGo, noCardBack),
  );
  const photoInput = h('input', {
    type: 'file',
    accept: 'image/*',
    id: 'photo',
    class: 'visually-hidden',
  }) as HTMLInputElement;
  const photoBtn = h('label', { class: 'btn ghost', for: 'photo' }, t('scan.photo'));
  // Builds without the hand model (only the embedded preview) measure with a ruler instead; the
  // real site has no ruler option.
  const intro = NO_CAMERA
    ? h(
        'div',
        { class: 'stack scan-intro' },
        h('p', { class: 'lead' }, t('scan.unavailable')),
        h('div', { class: 'actions' }, h('a', { class: 'btn', href: '#/manual' }, t('scan.manual'))),
        h('div', { class: 'alt-starts' }, giftBtn),
      )
    : h(
        'div',
        { class: 'stack scan-intro' },
        h('figure', { class: 'sheet narrow' }, setupDiagram()),
        h('div', { class: 'actions' }, startBtn, photoBtn, photoInput),
        h('p', { class: 'small' }, t('scan.photo.hint')),
        h('div', { class: 'alt-starts' }, noCardBtn, giftBtn),
        h('p', { class: 'small' }, t('scan.privacy')),
      );

  root.append(
    h(
      'section',
      { class: 'stack scan-page' },
      h('h1', null, t('scan.title')),
      intro,
      noCardBox,
      camera,
      meter,
      status,
      h('div', { class: 'actions' }, tapBtn),
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
  noCardBtn.addEventListener('click', () => {
    intro.hidden = true;
    noCardBox.hidden = false;
    noCardGo.focus();
  });
  noCardBack.addEventListener('click', () => {
    noCardBox.hidden = true;
    intro.hidden = false;
    noCardBtn.focus();
  });
  // From "No bank card?" on the home page: straight to the warning.
  if (query?.get('nocard') === '1' && !NO_CAMERA) {
    intro.hidden = true;
    noCardBox.hidden = false;
  }
  noCardGo.addEventListener('click', () => {
    noCard = true;
    noCardBox.hidden = true;
    startBtn.click();
  });
  startBtn.addEventListener('click', async () => {
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
      noCardBox.hidden = true;
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
