// Downloads the MediaPipe Hand Landmarker model for self-hosting (run once before `npm run build`).
// Without it the site uses the bundled MediaPipe Hands runtime, which needs no download.
import { mkdir, writeFile } from 'node:fs/promises';
const url = 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';
const out = new URL('../apps/web/public/models/hand_landmarker.task', import.meta.url);
const r = await fetch(url);
if (!r.ok) throw new Error(`download failed: HTTP ${r.status}`);
await mkdir(new URL('.', out), { recursive: true });
await writeFile(out, Buffer.from(await r.arrayBuffer()));
console.log(`saved ${out.pathname}`);
