import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  resolve: {
    alias: {
      '@dartfit/engine': fileURLToPath(new URL('./packages/engine/src/index.ts', import.meta.url)),
      '@dartfit/catalogue': fileURLToPath(new URL('./packages/catalogue/src/index.ts', import.meta.url)),
    },
  },
  test: {
    include: ['packages/*/test/**/*.test.ts', 'apps/api/test/**/*.test.ts', 'apps/web/test/**/*.test.ts'],
    testTimeout: 30_000,
    hookTimeout: 60_000,
  },
});
