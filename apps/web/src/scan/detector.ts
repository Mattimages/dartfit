/**
 * Hand landmark detection, entirely on the device. Two backends, same output (21 landmarks):
 *  - MediaPipe Tasks Hand Landmarker, when its model file is deployed at /models/hand_landmarker.task
 *    (run `npm run fetch-model` before deploying);
 *  - the MediaPipe Hands solution bundled from npm, self-hosted, as the always-available fallback.
 * No image ever leaves the browser.
 */
import type { Landmark } from '@dartfit/engine';

export interface HandDetector {
  kind: 'tasks' | 'legacy';
  detect(source: HTMLVideoElement | HTMLCanvasElement, timestampMs: number): Promise<Landmark[] | null>;
  close(): void;
}

const base = import.meta.env.BASE_URL;

async function exists(url: string): Promise<boolean> {
  try {
    const r = await fetch(url, { method: 'HEAD' });
    return r.ok && !(r.headers.get('content-type') ?? '').includes('text/html');
  } catch {
    return false;
  }
}

declare const __HAS_TASKS_MODEL__: boolean;

async function tasksBackend(): Promise<HandDetector | null> {
  // Only probe when the build found the model file (npm run fetch-model); avoids a 404 otherwise.
  if (!__HAS_TASKS_MODEL__) return null;
  const model = `${base}models/hand_landmarker.task`;
  if (!(await exists(model))) return null;
  const { FilesetResolver, HandLandmarker } = await import('@mediapipe/tasks-vision');
  const fileset = await FilesetResolver.forVisionTasks(`${base}mediapipe/wasm`);
  const make = (delegate: 'GPU' | 'CPU') =>
    HandLandmarker.createFromOptions(fileset, {
      baseOptions: { modelAssetPath: model, delegate },
      runningMode: 'VIDEO',
      numHands: 1,
      minHandDetectionConfidence: 0.6,
      minTrackingConfidence: 0.5,
    });
  const lm = await make('GPU').catch(() => make('CPU'));
  let last = 0;
  return {
    kind: 'tasks',
    async detect(source, ts) {
      last = Math.max(ts, last + 1); // timestamps must increase
      const r = lm.detectForVideo(source, last);
      return (r.landmarks[0] as Landmark[] | undefined) ?? null;
    },
    close: () => lm.close(),
  };
}

interface LegacyResults {
  multiHandLandmarks?: Landmark[][];
}
interface LegacyHands {
  setOptions(o: Record<string, unknown>): void;
  onResults(cb: (r: LegacyResults) => void): void;
  initialize(): Promise<void>;
  send(i: { image: HTMLVideoElement | HTMLCanvasElement }): Promise<void>;
  close(): Promise<void>;
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[data-src="${src}"]`)) return resolve();
    const el = document.createElement('script');
    el.src = src;
    el.dataset.src = src;
    el.crossOrigin = 'anonymous';
    el.onload = () => resolve();
    el.onerror = () => reject(new Error(`could not load ${src}`));
    document.head.append(el);
  });
}

async function legacyBackend(): Promise<HandDetector> {
  const dir = `${base}mediapipe/hands/`;
  await loadScript(`${dir}hands.js`);
  const Ctor = (globalThis as unknown as { Hands: new (o: { locateFile: (f: string) => string }) => LegacyHands }).Hands;
  const hands = new Ctor({ locateFile: (f) => `${dir}${f}` });
  hands.setOptions({ maxNumHands: 1, modelComplexity: 1, minDetectionConfidence: 0.6, minTrackingConfidence: 0.5 });
  let latest: Landmark[] | null = null;
  hands.onResults((r) => {
    latest = r.multiHandLandmarks?.[0] ?? null;
  });
  await hands.initialize();
  return {
    kind: 'legacy',
    async detect(source) {
      latest = null;
      await hands.send({ image: source });
      return latest;
    },
    close: () => void hands.close(),
  };
}

let cached: Promise<HandDetector> | null = null;

/** Load once per page; the second call returns the same detector. */
export function loadDetector(): Promise<HandDetector> {
  cached ??= (async () => (await tasksBackend().catch(() => null)) ?? legacyBackend())();
  cached.catch(() => (cached = null));
  return cached;
}
