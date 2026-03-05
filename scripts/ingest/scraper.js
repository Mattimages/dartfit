'use strict';
// ═══════════════════════════════════════════════════════════════
//  DARTFIT — MULTI-SOURCE MANUFACTURER SCRAPER
//
//  Targets manufacturer sites directly (less bot-hostile than
//  aggregators). Fetches with browser-like headers, parses specs
//  from HTML/JSON-LD, outputs data/ingested/scraped-<date>.json
//  for human review before import.
//
//  Usage:
//    node scripts/ingest/scraper.js [--source target|winmau|reddragon|harrows|all]
//    node scripts/ingest/scraper.js --url https://... --brand "Target"
//
//  Output: data/ingested/scraped-YYYY-MM-DD.json
// ═══════════════════════════════════════════════════════════════

const fs   = require('fs');
const path = require('path');
const { normalise, validate } = require('./schema');

// ── CONFIG ───────────────────────────────────────────────────────
const DELAY_MS   = 1500;   // polite delay between requests
const TIMEOUT_MS = 12000;  // per-request timeout
const OUT_DIR    = path.join(__dirname, '../../data/ingested');

const BROWSER_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-GB,en;q=0.9',
  'Accept-Encoding': 'gzip, deflate, br',
  'Cache-Control': 'no-cache',
  'Pragma': 'no-cache',
};

// ── SOURCE DEFINITIONS ───────────────────────────────────────────
// Each source defines category URLs and a parse() function that
// takes an HTML string + product URL and returns a raw dart object.
const SOURCES = {

  target: {
    name: 'Target Darts',
    categoryUrls: [
      'https://www.target-darts.co.uk/steel-tip-darts',
      'https://www.target-darts.co.uk/steel-tip-darts?p=2',
    ],
    // Extract product links from a category page
    extractLinks(html, baseUrl) {
      const links = [];
      // Target uses /product-name pattern
      const re = /href="(https?:\/\/www\.target-darts\.co\.uk\/[\w-]+-steel-tip-darts[^"]*)"/gi;
      let m;
      while ((m = re.exec(html))) {
        if (!links.includes(m[1])) links.push(m[1]);
      }
      return links;
    },
    // Parse a product page → raw dart spec object
    parse(html, url) {
      // JSON-LD
      const ld = extractJsonLd(html);
      if (ld) {
        const offer = ld.offers || {};
        return {
          brand: 'Target',
          name:  cleanText(ld.name || ''),
          price_gbp: parseFloat(offer.price) || null,
          buy_url: url,
          description: cleanText(ld.description || ''),
          _source: 'target-darts.co.uk',
          _confidence: 'high',
          ...extractSpecTable(html),
        };
      }
      // Fallback: regex from page text
      return {
        brand: 'Target',
        name:  extractMeta(html, 'og:title') || extractH1(html),
        price_gbp: extractPrice(html),
        buy_url: url,
        description: extractMeta(html, 'og:description') || '',
        _source: 'target-darts.co.uk',
        _confidence: 'medium',
        ...extractSpecTable(html),
      };
    },
  },

  winmau: {
    name: 'Winmau',
    categoryUrls: [
      'https://www.winmau.com/darts/',
    ],
    extractLinks(html) {
      const links = [];
      const re = /href="(https?:\/\/www\.winmau\.com\/darts\/[\w-]+\/)"/gi;
      let m;
      while ((m = re.exec(html))) {
        if (!links.includes(m[1])) links.push(m[1]);
      }
      return links;
    },
    parse(html, url) {
      const ld = extractJsonLd(html);
      return {
        brand: 'Winmau',
        name:  ld?.name || extractMeta(html, 'og:title') || extractH1(html),
        price_gbp: ld?.offers?.price ? parseFloat(ld.offers.price) : extractPrice(html),
        buy_url: url,
        description: ld?.description || extractMeta(html, 'og:description') || '',
        _source: 'winmau.com',
        _confidence: 'high',
        ...extractSpecTable(html),
      };
    },
  },

  reddragon: {
    name: 'Red Dragon',
    categoryUrls: [
      'https://www.reddragondarts.com/collections/steel-tip-darts',
      'https://www.reddragondarts.com/collections/steel-tip-darts?page=2',
    ],
    extractLinks(html) {
      const links = [];
      const re = /href="(\/products\/[\w-]+-steel-tip-darts[^"]*)"/gi;
      let m;
      while ((m = re.exec(html))) {
        const full = 'https://www.reddragondarts.com' + m[1];
        if (!links.includes(full)) links.push(full);
      }
      return links;
    },
    parse(html, url) {
      // Shopify stores embed product JSON in a script tag
      const shopify = extractShopifyProduct(html);
      if (shopify) {
        const v = shopify.variants?.[0] || {};
        return {
          brand: 'Red Dragon',
          name:  shopify.title || '',
          price_gbp: v.price ? parseFloat(v.price) / 100 : null,
          buy_url: url,
          description: cleanText(shopify.description || ''),
          _source: 'reddragondarts.com',
          _confidence: 'high',
          ...extractSpecTable(html),
        };
      }
      return {
        brand: 'Red Dragon',
        name:  extractMeta(html, 'og:title') || extractH1(html),
        price_gbp: extractPrice(html),
        buy_url: url,
        description: extractMeta(html, 'og:description') || '',
        _source: 'reddragondarts.com',
        _confidence: 'medium',
        ...extractSpecTable(html),
      };
    },
  },

  harrows: {
    name: 'Harrows',
    categoryUrls: [
      'https://www.harrows-darts.com/darts/',
    ],
    extractLinks(html) {
      const links = [];
      const re = /href="(https?:\/\/www\.harrows-darts\.com\/darts\/[\w-]+\/)"/gi;
      let m;
      while ((m = re.exec(html))) {
        if (!links.includes(m[1])) links.push(m[1]);
      }
      return links;
    },
    parse(html, url) {
      const ld = extractJsonLd(html);
      return {
        brand: 'Harrows',
        name:  ld?.name || extractMeta(html, 'og:title') || extractH1(html),
        price_gbp: ld?.offers?.price ? parseFloat(ld.offers.price) : extractPrice(html),
        buy_url: url,
        description: ld?.description || extractMeta(html, 'og:description') || '',
        _source: 'harrows-darts.com',
        _confidence: 'high',
        ...extractSpecTable(html),
      };
    },
  },
};

// ── HTML EXTRACTION HELPERS ──────────────────────────────────────

function extractJsonLd(html) {
  const re = /<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(html))) {
    try {
      const obj = JSON.parse(m[1]);
      const arr = Array.isArray(obj) ? obj : [obj];
      const prod = arr.find(o => o['@type'] === 'Product');
      if (prod) return prod;
    } catch { /* skip malformed */ }
  }
  return null;
}

function extractShopifyProduct(html) {
  // Shopify embeds: var meta = { product: {...} } or window.ShopifyAnalytics
  const re = /var\s+meta\s*=\s*(\{[\s\S]*?"product"[\s\S]*?\});/;
  const m = re.exec(html);
  if (m) {
    try { return JSON.parse(m[1]).product; } catch { /* skip */ }
  }
  // Alternative: product JSON in data attribute
  const re2 = /data-product='([^']+)'/;
  const m2 = re2.exec(html);
  if (m2) {
    try { return JSON.parse(m2[1].replace(/&quot;/g, '"')); } catch { /* skip */ }
  }
  return null;
}

// Extract specs from HTML tables / definition lists / spec divs
// Returns partial dart object with whatever numeric specs we can find.
function extractSpecTable(html) {
  const result = {};
  const text = html.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g,' ').replace(/\s+/g,' ');

  // Weight — look for patterns like "20g", "Weight: 22g", "22 grams"
  const wt = text.match(/(?:weight|barrel)[:\s]+(\d{1,2}(?:\.\d)?)\s*g(?:rams?)?/i)
          || text.match(/(\d{1,2}(?:\.\d)?)\s*g(?:ram)?\s+(?:barrel|dart)/i)
          || text.match(/\b(\d{1,2}(?:\.\d)?)\s*g\b/);
  if (wt) result.weight = parseFloat(wt[1]);

  // Length — "50mm", "Length: 50mm"
  const ln = text.match(/(?:barrel\s*)?length[:\s]+(\d{2,3}(?:\.\d)?)\s*mm/i)
          || text.match(/(\d{2,3}(?:\.\d)?)\s*mm\s+(?:long|length|barrel)/i);
  if (ln) result.length_mm = parseFloat(ln[1]);

  // Diameter — "6.5mm", "diameter: 6.5mm"
  const dm = text.match(/(?:barrel\s*)?diameter[:\s]+(\d{1,2}(?:\.\d{1,2})?)\s*mm/i)
          || text.match(/(\d{1,2}\.\d{1,2})\s*mm\s+(?:diameter|wide)/i);
  if (dm) result.diameter_mm = parseFloat(dm[1]);

  // Tungsten %
  const tg = text.match(/(\d{2,3})\s*%\s*tungsten/i)
          || text.match(/tungsten[:\s]+(\d{2,3})\s*%/i);
  if (tg) result.tungsten_pct = parseFloat(tg[1]);

  // Grip type inference from text
  const lc = text.toLowerCase();
  if      (lc.includes('shark cut') || lc.includes('shark-cut')) result.grip_type = 'shark_cut';
  else if (lc.includes('ringed') || lc.includes('ring grip'))    result.grip_type = 'ringed';
  else if (lc.includes('micro grip') || lc.includes('micro-grip'))result.grip_type = 'micro_grip';
  else if (lc.includes('aggressive knurl'))                       result.grip_type = 'aggressive_knurl';
  else if (lc.includes('fine knurl') || lc.includes('smooth knurl')) result.grip_type = 'fine_knurl';
  else if (lc.includes('knurl') || lc.includes('grip'))          result.grip_type = 'medium_knurl';

  // Barrel shape inference
  if      (lc.includes('torpedo'))  result.barrel_shape = 'torpedo';
  else if (lc.includes('teardrop')) result.barrel_shape = 'teardrop';
  else if (lc.includes('bomb') || lc.includes('pear')) result.barrel_shape = 'bomb';
  else if (lc.includes('bullet'))   result.barrel_shape = 'bullet';
  else                              result.barrel_shape = 'straight';

  // Balance point inference
  if      (lc.match(/front[\s-]weighted|front[\s-]loaded|front[\s-]heavy/)) result.balance_point = 'front';
  else if (lc.match(/rear[\s-]weighted|rear[\s-]loaded|rear[\s-]heavy/))    result.balance_point = 'rear';
  else                                                                        result.balance_point = 'middle';

  // Surface
  if      (lc.includes('pvd')) result.surface = 'pvd_coated';
  else if (lc.includes('titanium')) result.surface = 'titanium_coated';
  else if (lc.includes('gold')) result.surface = 'gold_plated';
  else    result.surface = 'natural';

  return result;
}

function extractMeta(html, prop) {
  const re = new RegExp(`<meta[^>]+(?:property|name)="${prop}"[^>]+content="([^"]+)"`, 'i');
  const m = re.exec(html);
  return m ? cleanText(m[1]) : null;
}

function extractH1(html) {
  const m = /<h1[^>]*>([\s\S]*?)<\/h1>/i.exec(html);
  return m ? cleanText(m[1]) : '';
}

function extractPrice(html) {
  const text = html.replace(/<[^>]+>/g, ' ');
  const m = text.match(/£\s*(\d{1,3}(?:\.\d{2})?)/);
  return m ? parseFloat(m[1]) : null;
}

function cleanText(str) {
  return str.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}

// ── HTTP ─────────────────────────────────────────────────────────

async function fetchPage(url) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { headers: BROWSER_HEADERS, signal: ctrl.signal, redirect: 'follow' });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } catch (e) {
    clearTimeout(timer);
    throw e;
  }
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ── MAIN SCRAPE LOOP ─────────────────────────────────────────────

async function scrapeSource(sourceKey) {
  const src = SOURCES[sourceKey];
  if (!src) throw new Error(`Unknown source: ${sourceKey}. Options: ${Object.keys(SOURCES).join(', ')}`);

  console.log(`\n▶  Scraping ${src.name}...`);
  const results = [];

  // 1. Collect product URLs from category pages
  const productUrls = [];
  for (const catUrl of src.categoryUrls) {
    console.log(`   Fetching category: ${catUrl}`);
    try {
      const html = await fetchPage(catUrl);
      const links = src.extractLinks(html, catUrl);
      console.log(`   Found ${links.length} product links`);
      productUrls.push(...links);
    } catch (e) {
      console.warn(`   ⚠  Category fetch failed: ${e.message}`);
    }
    await sleep(DELAY_MS);
  }

  const unique = [...new Set(productUrls)];
  console.log(`   Total unique product pages: ${unique.length}`);

  // 2. Fetch + parse each product page
  for (const url of unique) {
    try {
      const html = await fetchPage(url);
      const raw = src.parse(html, url);
      const norm = normalise(raw);
      const { ok, errors, warnings } = validate(norm);

      results.push({
        ...norm,
        _valid: ok,
        _errors: errors,
        _warnings: warnings,
      });

      const status = ok ? '✓' : `✗ (${errors[0]})`;
      console.log(`   ${status}  ${norm.brand} · ${norm.name} · ${norm.weight}g · £${norm.price_gbp}`);
    } catch (e) {
      console.warn(`   ⚠  Product fetch failed: ${url} — ${e.message}`);
    }
    await sleep(DELAY_MS);
  }

  return results;
}

async function scrapeUrl(url, brand) {
  console.log(`\n▶  Fetching single URL: ${url}`);
  // Find matching source or use generic parse
  const src = Object.values(SOURCES).find(s => s.name === brand) || SOURCES.target;
  const html = await fetchPage(url);
  const raw  = { ...src.parse(html, url), brand };
  const norm = normalise(raw);
  const { ok, errors, warnings } = validate(norm);
  console.log(ok ? `✓  ${norm.name}` : `✗  Validation failed: ${errors.join('; ')}`);
  return [{ ...norm, _valid: ok, _errors: errors, _warnings: warnings }];
}

async function main() {
  const args = process.argv.slice(2);
  const sourceArg = args[args.indexOf('--source') + 1] || 'all';
  const urlArg    = args[args.indexOf('--url')    + 1];
  const brandArg  = args[args.indexOf('--brand')  + 1] || 'Unknown';

  let allResults = [];

  if (urlArg) {
    allResults = await scrapeUrl(urlArg, brandArg);
  } else if (sourceArg === 'all') {
    for (const key of Object.keys(SOURCES)) {
      const r = await scrapeSource(key);
      allResults.push(...r);
    }
  } else {
    allResults = await scrapeSource(sourceArg);
  }

  // Save output
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
  const date    = new Date().toISOString().slice(0,10);
  const outFile = path.join(OUT_DIR, `scraped-${date}.json`);
  fs.writeFileSync(outFile, JSON.stringify(allResults, null, 2));

  const valid   = allResults.filter(d => d._valid).length;
  const invalid = allResults.length - valid;
  console.log(`\n✅  Done. ${allResults.length} darts scraped — ${valid} valid, ${invalid} need review`);
  console.log(`📄  Output: ${outFile}`);
  console.log(`\nNext step: node scripts/ingest/import.js --file ${outFile} --dry-run`);
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
