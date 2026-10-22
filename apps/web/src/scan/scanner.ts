/**
 * The live scan: camera frames → landmarks → quality gates → card scale → measurements.
 *
 * Auto mode: the card lies in an on-screen guide; vision.detectCard finds its edges, giving a
 * millimetre scale. Tap mode (when the card is not found): the frame freezes, the player taps the
 * four corners, and a full perspective correction (homography) maps landmarks to the table.
 * Either way, 18 good frames are aggregated (median, outliers dropped) into one measurement.
 */
import {
  aggregate,
  calibrate,
  calibration,
  cardHomography,
  checkHandFrame,
  detectCard,
  handDimensionsFromMm,
  handOnCard,
  landmarksToMm,
  medianLandmarks,
  scaleProblem,
  toGray,
  type CardDetection,
  type Dims,
  type Gate,
  type Landmark,
  type Measurements,
  type Pt,
} from '@dartfit/engine';
import type { HandDetector } from './detector';

export type Status =
  | Gate
  | 'no_card'
  | 'card_aspect'
  | 'card_skew'
  | 'overlap'
  | 'phone_tilt'
  | 'measuring'
  | 'done'
  | 'tap_needed';

export interface ScanResult {
  measurements: Measurements;
  /** Median landmarks on the table plane, in millimetres (for drawing; never uploaded). */
  landmarksMm: Pt[];
}

export interface ScanView {
  status(s: Status, progress: number): void;
  landmarks(lm: Landmark[] | null): void;
  card(quad: [Pt, Pt, Pt, Pt] | null): void;
  done(r: ScanResult): void;
}

/** Guide rectangle for the card, as fractions of the video frame. */
export const CARD_GUIDE = { x: 0.2, y: 0.05, w: 0.6 } as const;

const NEEDED = 18;
const TAP_AFTER_MS = 8000;
const MAX_TILT_DEG = 14;

export class Scanner {
  private running = false;
  private frames: Dims[] = [];
  private framesMm: Pt[][] = [];
  /** Recent landmark frames that passed the hand gates, for tap mode. */
  private recent: Landmark[][] = [];
  private card: CardDetection | null = null;
  private frameNo = 0;
  private handOkSince = 0;
  private tilt: { beta: number; gamma: number } | null = null;
  private gray: HTMLCanvasElement = document.createElement('canvas');
  private onOrientation = (e: DeviceOrientationEvent) => {
    if (e.beta !== null && e.gamma !== null) this.tilt = { beta: e.beta, gamma: e.gamma };
  };

  constructor(
    private video: HTMLVideoElement,
    private detector: HandDetector,
    private view: ScanView,
  ) {}

  start() {
    this.running = true;
    window.addEventListener('deviceorientation', this.onOrientation);
    void this.loop();
  }

  stop() {
    this.running = false;
    window.removeEventListener('deviceorientation', this.onOrientation);
  }

  /** The guide in video pixels; the card is searched slightly beyond it. */
  guideRect() {
    const w = this.video.videoWidth;
    const h = this.video.videoHeight;
    const gw = CARD_GUIDE.w * w;
    const gh = gw / (85.6 / 53.98);
    return { x: CARD_GUIDE.x * w, y: CARD_GUIDE.y * h, w: gw, h: gh };
  }

  private findCard(): CardDetection | null {
    const w = this.video.videoWidth;
    const h = this.video.videoHeight;
    const g = this.guideRect();
    const pad = 0.15;
    const roi = {
      x: Math.max(0, Math.round(g.x - g.w * pad)),
      y: Math.max(0, Math.round(g.y - g.h * pad)),
      w: Math.round(Math.min(w, g.w * (1 + 2 * pad))),
      h: Math.round(Math.min(h, g.h * (1 + 2 * pad))),
    };
    roi.w = Math.min(roi.w, w - roi.x);
    roi.h = Math.min(roi.h, h - roi.y);
    this.gray.width = roi.w;
    this.gray.height = roi.h;
    const ctx = this.gray.getContext('2d', { willReadFrequently: true });
    if (!ctx) return null;
    ctx.drawImage(this.video, roi.x, roi.y, roi.w, roi.h, 0, 0, roi.w, roi.h);
    const img = ctx.getImageData(0, 0, roi.w, roi.h);
    const det = detectCard(toGray(img.data, roi.w, roi.h), roi.w, { x: 0, y: 0, w: roi.w, h: roi.h });
    if (!det) return null;
    return { ...det, box: { ...det.box, x: det.box.x + roi.x, y: det.box.y + roi.y } };
  }

  private async loop() {
    let lastRun = 0;
    const started = performance.now();
    while (this.running) {
      await new Promise((r) => requestAnimationFrame(r));
      const now = performance.now();
      if (now - lastRun < 66 || this.video.readyState < 2) continue;
      lastRun = now;
      this.frameNo++;
      const lm = await this.detector.detect(this.video, now).catch(() => null);
      if (!this.running) break;
      this.view.landmarks(lm);
      const gate = checkHandFrame(lm ?? undefined);
      if (gate) {
        this.handOkSince = 0;
        this.view.status(gate, this.frames.length / NEEDED);
        continue;
      }
      const hand = lm as Landmark[];
      this.handOkSince ||= now;
      this.recent.push(hand);
      if (this.recent.length > 30) this.recent.shift();

      if (this.frameNo % 3 === 0 || !this.card) this.card = this.findCard();
      const w = this.video.videoWidth;
      const h = this.video.videoHeight;
      if (!this.card) {
        this.view.card(null);
        const tap = now - started > TAP_AFTER_MS && now - this.handOkSince > 2000;
        this.view.status(tap ? 'tap_needed' : 'no_card', this.frames.length / NEEDED);
        continue;
      }
      const b = this.card.box;
      const quad: [Pt, Pt, Pt, Pt] = [
        { x: b.x, y: b.y },
        { x: b.x + b.w, y: b.y },
        { x: b.x + b.w, y: b.y + b.h },
        { x: b.x, y: b.y + b.h },
      ];
      this.view.card(quad);
      const problem = scaleProblem(this.card.scale);
      if (problem) {
        this.view.status(problem, this.frames.length / NEEDED);
        continue;
      }
      if (handOnCard(hand, w, h, quad)) {
        this.view.status('overlap', this.frames.length / NEEDED);
        continue;
      }
      if (
        this.tilt &&
        (Math.abs(this.tilt.beta) > MAX_TILT_DEG || Math.abs(this.tilt.gamma) > MAX_TILT_DEG)
      ) {
        this.view.status('phone_tilt', this.frames.length / NEEDED);
        continue;
      }
      // Auto mode: the detected box is axis-aligned, so the homography reduces to a scale.
      const H = cardHomography(quad);
      const mm = landmarksToMm(hand, w, h, H);
      this.frames.push(calibrate(handDimensionsFromMm(mm), calibration));
      this.framesMm.push(mm);
      this.view.status('measuring', this.frames.length / NEEDED);
      if (this.frames.length >= NEEDED) {
        const m = aggregate(this.frames, calibration.calibrated);
        if (m) {
          this.finish({ measurements: m, landmarksMm: medianLandmarks(this.framesMm) });
          return;
        }
        // Too inconsistent: keep the newest half and carry on.
        this.frames = this.frames.slice(-NEEDED / 2);
        this.framesMm = this.framesMm.slice(-NEEDED / 2);
      }
    }
  }

  /**
   * Tap mode: corners (TL, TR, BR, BL) in video pixels of the frozen frame. Uses the recent good
   * landmark frames (the phone was held still while the card search ran) with a full homography.
   * Returns false when there are not enough recent frames.
   */
  measureWithCorners(corners: [Pt, Pt, Pt, Pt]): boolean {
    const frames = this.recent.slice(-NEEDED);
    if (frames.length < 3) return false;
    const w = this.video.videoWidth;
    const h = this.video.videoHeight;
    const H = cardHomography(corners);
    const mm = frames.map((f) => landmarksToMm(f, w, h, H));
    const dims = mm.map((x) => calibrate(handDimensionsFromMm(x), calibration));
    const m = aggregate(dims, calibration.calibrated);
    if (!m) return false;
    this.finish({ measurements: m, landmarksMm: medianLandmarks(mm) });
    return true;
  }

  private finish(r: ScanResult) {
    this.stop();
    this.view.status('done', 1);
    this.view.done(r);
  }
}

/**
 * One still photo: landmarks from the detector plus the four card corners tapped by the player
 * (pixels of that photo). A single frame has no spread to measure, so a conservative 2 mm is used.
 */
export function measureStill(
  lm: Landmark[],
  w: number,
  h: number,
  corners: [Pt, Pt, Pt, Pt],
): ScanResult | null {
  const mm = landmarksToMm(lm, w, h, cardHomography(corners));
  const d = calibrate(handDimensionsFromMm(mm), calibration);
  if (d.handLength < 120 || d.handLength > 260 || d.palmWidth < 40 || d.palmWidth > 140) return null;
  const r1 = (x: number) => Number(x.toFixed(1));
  return {
    measurements: {
      handLengthMm: r1(d.handLength),
      palmWidthMm: r1(d.palmWidth),
      indexLengthMm: r1(d.indexLength),
      middleLengthMm: r1(d.middleLength),
      thumbIndexSpanMm: r1(d.thumbIndexSpan),
      spreadMm: 2,
      samples: 3,
      calibrated: calibration.calibrated,
    },
    landmarksMm: mm,
  };
}
