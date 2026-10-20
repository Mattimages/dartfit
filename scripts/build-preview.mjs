// Builds the single-file preview (no camera, catalogue bundled, fonts inlined) used for the
// shareable claude.ai artifact. Usage: node scripts/build-preview.mjs <out-dir>
// The page has no <html>/<head>/<body>: the host wraps it in its own skeleton.
import { execSync } from 'node:child_process';
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const out = process.argv[2] ?? 'preview';
execSync('npx vite build --mode demo', {
  cwd: 'apps/web',
  stdio: 'inherit',
  env: { ...process.env, VITE_NO_CAMERA: '1' },
});

const dir = 'apps/web/dist-demo/assets';
const files = readdirSync(dir);
const pick = (ext) =>
  readFileSync(
    join(
      dir,
      files.find((f) => f.endsWith(ext)),
    ),
    'utf8',
  );
const css = pick('.css').replace(
  /url\(\.\/([^)]+\.woff2)\)/g,
  (_, f) => `url(data:font/woff2;base64,${readFileSync(join(dir, f)).toString('base64')})`,
);
const js = pick('.js');
if (js.includes('</script')) throw new Error('bundle contains </script');

mkdirSync(out, { recursive: true });
writeFileSync(
  join(out, 'index.html'),
  `<title>DartFit</title>
<meta name="claude:viewport-fit-sides" content="cover">
<style>${css}</style>
<a class="skip" href="#main">Naar de inhoud</a>
<div id="app"></div>
<noscript>DartFit heeft JavaScript nodig.</noscript>
<script type="module">${js}</script>
`,
);
console.log(`wrote ${join(out, 'index.html')}`);
