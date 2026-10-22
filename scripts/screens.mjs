// Visual check: serves a built folder and screenshots each page at phone width (light + dark).
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join } from 'node:path';

const [dir, out] = process.argv.slice(2);
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2', '.wasm': 'application/wasm', '.json': 'application/json', '.webmanifest': 'application/manifest+json' };
const server = createServer(async (req, res) => {
  let p = join(dir, decodeURIComponent(req.url.split('?')[0]));
  try { if ((await stat(p)).isDirectory()) p = join(p, 'index.html'); res.writeHead(200, { 'content-type': types[extname(p)] ?? 'application/octet-stream' }); res.end(await readFile(p)); }
  catch { res.writeHead(404); res.end(); }
}).listen(4599);

const browser = await chromium.launch();
const errors = [];
for (const scheme of ['light', 'dark']) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, colorScheme: scheme, reducedMotion: 'reduce', locale: 'nl-NL' });
  const page = await ctx.newPage();
  page.on('console', (m) => m.type() === 'error' && errors.push(`${scheme} ${m.text()}`));
  page.on('pageerror', (e) => errors.push(`${scheme} pageerror ${e.message}`));
  const shot = async (name) => { await page.waitForTimeout(400); await page.screenshot({ path: `${out}/${scheme}-${name}.png`, fullPage: true }); };
  await page.goto('http://localhost:4599/#/'); await shot('home');
  if (scheme === 'light') {
    await page.goto('http://localhost:4599/#/scan'); await shot('scan');
    await page.goto('http://localhost:4599/#/manual'); await page.fill('#hl', '192'); await page.click('button[type=submit]');
    await page.waitForURL(/questions/); await shot('questions');
    // current dart from the catalogue
    await page.check('input[name=hasCurrent][value=yes]', { force: true });
    await page.fill('#dart-search', 'littler g1');
    await page.click('ul[role=listbox] button >> nth=0');
    await page.check('input[name=currentGrip][value=too_smooth]', { force: true });
    await page.check('input[name=hold][value=front]', { force: true });
    await shot('questions-current');
    await page.click('button[type=submit].block');
    await page.waitForURL(/fitting/); await page.waitForSelector('.btn:not([hidden])[href^="#/fit/"]'); await shot('fitting');
    await page.click('a[href^="#/fit/"]'); await page.waitForSelector('.pick'); await page.waitForTimeout(300); await shot('result'); await page.locator('figure.sheet').first().screenshot({ path: `${out}/${scheme}-drawing.png` });
    await page.goto('http://localhost:4599/#/darts'); await shot('darts');
    await page.goto('http://localhost:4599/#/method'); await shot('method');
    await page.goto('http://localhost:4599/#/privacy'); await shot('privacy');
  } else {
    await page.goto('http://localhost:4599/#/questions');
    await page.click('button[type=submit].block');
    await page.waitForSelector('.btn:not([hidden])[href^="#/fit/"]');
    await page.click('a[href^="#/fit/"]'); await page.waitForSelector('.pick'); await shot('result');
  }
  // Horizontal overflow check on every page we visited last
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  if (overflow > 1) errors.push(`${scheme} horizontal overflow ${overflow}px`);
  await ctx.close();
}
await browser.close();
server.close();
console.log(errors.length ? errors.join('\n') : 'no console errors');
