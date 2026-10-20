import { defineConfig, type Plugin } from 'vite';
import { cpSync, existsSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';

/**
 * Self-host the MediaPipe WebAssembly files (no third-party CDN on a page that looks at hands).
 * Copied from node_modules into public/mediapipe on dev start and build.
 */
function mediapipeAssets(): Plugin {
  const copy = () => {
    const require = createRequire(import.meta.url);
    const pkg = dirname(require.resolve('@mediapipe/tasks-vision/package.json'));
    const dest = join(__dirname, 'public', 'mediapipe');
    if (!existsSync(join(dest, 'vision_wasm_internal.wasm'))) {
      mkdirSync(dest, { recursive: true });
      cpSync(join(pkg, 'wasm'), dest, { recursive: true });
    }
  };
  return { name: 'mediapipe-assets', buildStart: copy, configureServer: copy };
}

export default defineConfig({
  plugins: [mediapipeAssets()],
  server: {
    port: 5173,
    proxy: { '/api': 'http://localhost:3000', '/go': 'http://localhost:3000' },
  },
  build: { target: 'es2022', sourcemap: true },
});
