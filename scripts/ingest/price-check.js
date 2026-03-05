'use strict';
// ═══════════════════════════════════════════════════════════════
//  DARTFIT — PRICE DRIFT CHECKER
//
//  Re-fetches buy_url for every dart in the catalog and compares
//  the scraped price to what's stored. Flags significant drift.
//
//  Usage:
//    node scripts/ingest/price-check.js              # check all
//    node scripts/ingest/price-check.js --brand Target
//    node scripts/ingest/price-check.js --apply      # update DB prices
//
//  Output: data/ingested/price-check-YYYY-MM-DD.json
// ═══════════════════════════════════════════════════════════════

const fs   = require('fs');
const path = require('path');

const OUT_DIR = path.join(__dirname, '../../data/ingested');
const DELAY_MS   = 1200;
const TIMEOUT_MS = 10000;
const DRIFT_THRESHOLD_PCT = 10; // flag if price changed by >10%

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  'Accept': 'text/html,application/xhtml+xml,*/*;q=0.8',
  'Accept-Language': 'en-GB,en;q=0.9',
};

function getDb() {
  const Database = require('better-sqlite3');
  const DB_PATH  = path.join(__dirname, '../../data/dartfit.db');
  return new Database(DB_PATH);
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function fetchPrice(url) {
  if (!url || !url.startsWith('http')) return null;
  const ctrl  = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res  = await fetch(url, { headers: HEADERS, signal: ctrl.signal, redirect:'follow' });
    clearTimeout(timer);
    if (!res.ok) return null;
    const html = await res.text();
    return extractPrice(html);
  } catch {
    clearTimeout(timer);
    return null;
  }
}

function extractPrice(html) {
  // JSON-LD offer price
  const ldRe = /<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = ldRe.exec(html))) {
    try {
      const obj = JSON.parse(m[1]);
      const arr = Array.isArray(obj) ? obj : [obj];
      const prod = arr.find(o => o['@type'] === 'Product');
      if (prod?.offers?.price) return parseFloat(prod.offers.price);
    } catch { /* skip */ }
  }
  // og:price
  const og = /<meta[^>]+(?:property="og:price:amount"|name="price")[^>]+content="([^"]+)"/i.exec(html);
  if (og) return parseFloat(og[1]);
  // Plain £ amount
  const text = html.replace(/<[^>]+>/g,' ');
  const pm = text.match(/£\s*(\d{1,3}(?:\.\d{2})?)/);
  if (pm) return parseFloat(pm[1]);
  return null;
}

async function main() {
  const args      = process.argv.slice(2);
  const brandFilter = args[args.indexOf('--brand') + 1];
  const apply     = args.includes('--apply');

  const db   = getDb();
  let darts  = db.prepare('SELECT * FROM darts WHERE active = 1').all();
  if (brandFilter) darts = darts.filter(d => d.brand.toLowerCase() === brandFilter.toLowerCase());

  console.log(`\n${'═'.repeat(62)}`);
  console.log('  DARTFIT PRICE DRIFT CHECKER');
  console.log(`  Checking ${darts.length} darts${brandFilter ? ` (brand: ${brandFilter})` : ''}...`);
  console.log(`  Mode: ${apply ? 'APPLY UPDATES TO DB' : 'REPORT ONLY'}`);
  console.log('═'.repeat(62) + '\n');

  const results = [];
  const updateStmt = apply
    ? db.prepare('UPDATE darts SET price_gbp = ? WHERE id = ?')
    : null;

  for (const dart of darts) {
    process.stdout.write(`  Checking ${dart.brand} · ${dart.name}... `);
    const scraped = await fetchPrice(dart.buy_url);

    if (scraped === null) {
      console.log('⚠  could not fetch');
      results.push({ id: dart.id, brand: dart.brand, name: dart.name,
        stored: dart.price_gbp, scraped: null, status: 'fetch_failed' });
    } else {
      const stored = parseFloat(dart.price_gbp);
      const drift  = stored ? Math.abs(scraped - stored) / stored * 100 : 100;
      const status = drift < 2 ? 'ok' : drift < DRIFT_THRESHOLD_PCT ? 'minor' : 'DRIFT';

      const flag = status === 'ok' ? '✓' : status === 'minor' ? '~' : '⚡';
      console.log(`${flag}  £${stored} → £${scraped}  (${drift.toFixed(1)}% drift)`);

      results.push({ id: dart.id, brand: dart.brand, name: dart.name,
        stored, scraped, drift: +drift.toFixed(1), status });

      if (apply && status !== 'ok') {
        updateStmt.run(scraped, dart.id);
      }
    }
    await sleep(DELAY_MS);
  }

  // Summary
  const ok      = results.filter(r => r.status === 'ok').length;
  const minor   = results.filter(r => r.status === 'minor').length;
  const drift   = results.filter(r => r.status === 'DRIFT').length;
  const failed  = results.filter(r => r.status === 'fetch_failed').length;

  console.log(`\n${'─'.repeat(62)}`);
  console.log(`  ✓ No change : ${ok}`);
  console.log(`  ~ Minor (<${DRIFT_THRESHOLD_PCT}%) : ${minor}`);
  console.log(`  ⚡ Significant drift : ${drift}`);
  console.log(`  ⚠  Fetch failed : ${failed}`);
  if (apply && (minor + drift) > 0)
    console.log(`  ✅ Updated ${minor + drift} prices in DB`);

  // Save report
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
  const date = new Date().toISOString().slice(0,10);
  const out  = path.join(OUT_DIR, `price-check-${date}.json`);
  fs.writeFileSync(out, JSON.stringify({ checked: results.length, ok, minor, drift, failed, results }, null, 2));
  console.log(`\n  Report: ${out}`);
  if (!apply && (minor + drift) > 0)
    console.log(`  Run with --apply to update ${minor + drift} prices in the DB.`);
  console.log('═'.repeat(62) + '\n');
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
