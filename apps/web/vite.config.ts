import { defineConfig, type Plugin } from 'vite';
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildGuides, GUIDES_CSS, statsFromCsv } from './seo/render';

const here = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

/** Package folder in node_modules (some packages hide package.json behind "exports"). */
function pkgDir(name: string): string {
  for (const p of require.resolve.paths(name) ?? []) {
    const dir = join(p, name);
    if (existsSync(join(dir, 'package.json'))) return dir;
  }
  throw new Error(`cannot find ${name}`);
}

/**
 * Self-host the hand-tracking runtime (no third-party CDN on a page that looks at hands):
 *  - MediaPipe Tasks WebAssembly → public/mediapipe/wasm (model file: npm run fetch-model)
 *  - MediaPipe Hands solution (wasm + models, all in npm) → public/mediapipe/hands
 */
function mediapipeAssets(): Plugin {
  const copy = () => {
    const tasks = pkgDir('@mediapipe/tasks-vision');
    const hands = pkgDir('@mediapipe/hands');
    const out = join(here, 'public', 'mediapipe');
    if (!existsSync(join(out, 'wasm', 'vision_wasm_internal.wasm'))) {
      mkdirSync(join(out, 'wasm'), { recursive: true });
      // SIMD and no-SIMD builds; the FilesetResolver picks one. The "module" variant is unused.
      cpSync(join(tasks, 'wasm'), join(out, 'wasm'), {
        recursive: true,
        filter: (src) => !src.includes('module_internal'),
      });
    }
    if (!existsSync(join(out, 'hands', 'hands.js'))) {
      mkdirSync(join(out, 'hands'), { recursive: true });
      cpSync(hands, join(out, 'hands'), {
        recursive: true,
        filter: (src) => !/(README|package\.json|index\.d\.ts|hand_landmark_lite)/.test(src),
      });
    }
  };
  return { name: 'mediapipe-assets', buildStart: copy, configureServer: copy };
}

/** The demo has no Tasks model, so it ships only the self-contained Hands runtime. */
function demoTrim(outDir: string): Plugin {
  return {
    name: 'demo-trim',
    apply: 'build',
    closeBundle() {
      rmSync(join(here, outDir, 'mediapipe', 'wasm'), { recursive: true, force: true });
    },
  };
}

/** The verified catalogue, bundled at build time (validated by @dartfit/catalogue). */
function catalogueModule(): Plugin {
  const id = 'virtual:dartfit-catalogue';
  return {
    name: 'dartfit-catalogue',
    resolveId: (s) => (s === id ? '\0' + id : null),
    load(s) {
      if (s !== '\0' + id) return null;
      const root = join(here, '..', '..');
      const json = execFileSync(
        process.execPath,
        [
          join(pkgDir('tsx'), 'dist', 'cli.mjs'),
          '--tsconfig',
          join(root, 'tsconfig.json'),
          join(root, 'packages', 'catalogue', 'src', 'export.ts'),
        ],
        {
          cwd: root,
          encoding: 'utf8',
          maxBuffer: 16 * 1024 * 1024,
        },
      );
      // PHOTOS_DIR (preview builds only): build the product photos into the page as data URLs, for
      // hosts that block images from other sites. Files are named <model_id>.jpg.
      const dir = process.env.PHOTOS_DIR;
      if (dir) {
        const cat = JSON.parse(json) as { photos: Record<string, { url: string; cleared: boolean }> };
        for (const [m, p] of Object.entries(cat.photos)) {
          const f = join(dir, `${m}.jpg`);
          if (existsSync(f)) p.url = `data:image/jpeg;base64,${readFileSync(f).toString('base64')}`;
        }
        return `export const catalogue = ${JSON.stringify(cat)};`;
      }
      return `export const catalogue = ${json};`;
    },
  };
}

/**
 * Guide pages for search engines and AI assistants: real HTML at /nl/…, /en/…, /de/…, plus
 * sitemap.xml, robots.txt and llms.txt. Catalogue facts in the text come from the live catalogue.
 */
function guides(): Plugin {
  return {
    name: 'dartfit-guides',
    apply: 'build',
    generateBundle() {
      const data = join(here, '..', '..', 'packages', 'catalogue', 'data');
      const pros = (JSON.parse(readFileSync(join(data, 'pros.json'), 'utf8')) as unknown[]).length;
      const stats = statsFromCsv(readFileSync(join(data, 'variants.csv'), 'utf8'), pros);
      const base = (process.env.SITE_URL ?? 'https://dartfit.vercel.app').replace(/\/$/, '');
      for (const [fileName, source] of Object.entries(buildGuides(stats, base)))
        this.emitFile({ type: 'asset', fileName, source });
      this.emitFile({ type: 'asset', fileName: 'guides/guides.css', source: GUIDES_CSS });
      const font = join(pkgDir('@fontsource-variable/geist'), 'files', 'geist-latin-wght-normal.woff2');
      this.emitFile({ type: 'asset', fileName: 'guides/geist.woff2', source: readFileSync(font) });
    },
  };
}

export default defineConfig(({ mode }) => ({
  // The demo build runs from any folder (e.g. a static host or a hosted page): relative paths.
  base: mode === 'demo' ? './' : '/',
  define: {
    __HAS_TASKS_MODEL__: JSON.stringify(
      mode !== 'demo' && existsSync(join(here, 'public', 'models', 'hand_landmarker.task')),
    ),
  },
  plugins: [
    mediapipeAssets(),
    catalogueModule(),
    ...(mode === 'demo' ? [demoTrim('dist-demo')] : [guides()]),
  ],
  resolve: {
    alias: {
      '@dartfit/engine': join(here, '..', '..', 'packages', 'engine', 'src', 'index.ts'),
      '@dartfit/catalogue': join(here, '..', '..', 'packages', 'catalogue', 'src', 'index.ts'),
    },
  },
  server: {
    port: 5173,
    proxy: { '/api': 'http://localhost:3000', '/go': 'http://localhost:3000' },
  },
  build: {
    target: 'es2022',
    sourcemap: mode !== 'demo',
    outDir: mode === 'demo' ? 'dist-demo' : 'dist',
  },
}));
