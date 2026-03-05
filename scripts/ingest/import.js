'use strict';
// ═══════════════════════════════════════════════════════════════
//  DARTFIT — DART CATALOG IMPORTER
//
//  Reads a scraped/curated JSON file, validates each dart,
//  deduplicates against the live catalog, then imports new darts.
//
//  Usage:
//    # Preview what would be imported (no DB writes)
//    node scripts/ingest/import.js --file data/ingested/scraped-2025-01-01.json --dry-run
//
//    # Import only darts with _valid:true and confidence high|medium
//    node scripts/ingest/import.js --file data/ingested/scraped-2025-01-01.json
//
//    # Force import even low-confidence darts (careful!)
//    node scripts/ingest/import.js --file data/ingested/my-darts.json --force
//
//  The input JSON must be an array of dart objects matching schema.js.
//  You can also hand-craft the JSON — see data/ingested/template.json.
// ═══════════════════════════════════════════════════════════════

const fs   = require('fs');
const path = require('path');
const { validate, normalise } = require('./schema');

const DB_PATH = path.join(__dirname, '../../data/dartfit.db');

function getDb() {
  const Database = require('better-sqlite3');
  return new Database(DB_PATH);
}

// ── DEDUPLICATION ────────────────────────────────────────────────
// A dart is a duplicate if an existing entry matches on:
//   (brand LOWER + name LOWER) OR (brand + weight ± 0.5 + diameter ± 0.3 + grip_type)
function isDuplicate(dart, existing) {
  const normName = (s) => s.toLowerCase().replace(/[^a-z0-9]/g,'');
  const nameKey = normName(dart.brand) + normName(dart.name);

  for (const e of existing) {
    // Exact name match
    if (normName(e.brand) + normName(e.name) === nameKey) return { duplicate: true, match: e, reason: 'name' };
    // Spec-fingerprint match
    if (normName(e.brand) === normName(dart.brand)
      && Math.abs(e.weight - dart.weight) <= 0.5
      && Math.abs(e.diameter_mm - dart.diameter_mm) <= 0.3
      && e.grip_type === dart.grip_type
      && e.barrel_shape === dart.barrel_shape) {
      return { duplicate: true, match: e, reason: 'specs' };
    }
  }
  return { duplicate: false };
}

// ── IMPORT A SINGLE DART ─────────────────────────────────────────
function insertDart(db, dart) {
  const stmt = db.prepare(`
    INSERT INTO darts (
      brand, name, weight, length_mm, diameter_mm, grip_type, barrel_shape,
      balance_point, tungsten_pct, surface, price_gbp, buy_url,
      pro_player, tags, description, released, active
    ) VALUES (
      @brand, @name, @weight, @length_mm, @diameter_mm, @grip_type, @barrel_shape,
      @balance_point, @tungsten_pct, @surface, @price_gbp, @buy_url,
      @pro_player, @tags, @description, @released, 1
    )
  `);
  return stmt.run({
    brand:         dart.brand,
    name:          dart.name,
    weight:        dart.weight,
    length_mm:     dart.length_mm,
    diameter_mm:   dart.diameter_mm,
    grip_type:     dart.grip_type,
    barrel_shape:  dart.barrel_shape,
    balance_point: dart.balance_point,
    tungsten_pct:  dart.tungsten_pct,
    surface:       dart.surface || 'natural',
    price_gbp:     dart.price_gbp,
    buy_url:       dart.buy_url,
    pro_player:    dart.pro_player || null,
    tags:          dart.tags || '',
    description:   dart.description || '',
    released:      dart.released || new Date().toISOString().slice(0,10),
  });
}

// ── MAIN ─────────────────────────────────────────────────────────
function main() {
  const args = process.argv.slice(2);
  const fileArg   = args[args.indexOf('--file')  + 1];
  const dryRun    = args.includes('--dry-run');
  const forceAll  = args.includes('--force');
  const skipInvalid = !args.includes('--include-invalid');

  if (!fileArg) {
    console.error('Usage: node scripts/ingest/import.js --file <path.json> [--dry-run] [--force] [--include-invalid]');
    process.exit(1);
  }

  const filePath = path.resolve(fileArg);
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    process.exit(1);
  }

  const raw = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  if (!Array.isArray(raw)) {
    console.error('Input must be a JSON array of dart objects');
    process.exit(1);
  }

  console.log(`\n${'═'.repeat(60)}`);
  console.log('  DARTFIT CATALOG IMPORTER');
  console.log(`  Source file : ${path.basename(filePath)}`);
  console.log(`  Input darts : ${raw.length}`);
  console.log(`  Mode        : ${dryRun ? 'DRY RUN (no DB writes)' : 'LIVE IMPORT'}`);
  console.log('═'.repeat(60));

  // Load existing catalog for dedup
  const db = getDb();
  const existing = db.prepare('SELECT * FROM darts').all();
  console.log(`\n  Existing catalog: ${existing.length} darts\n`);

  const stats = { imported: 0, skipped_dup: 0, skipped_invalid: 0, warnings: 0 };
  const importLog = [];

  for (const rawDart of raw) {
    // Already-validated scraped files have _valid; re-validate raw hand-crafted ones
    const norm = normalise(rawDart);
    const { ok, errors, warnings } = validate(norm);

    // Confidence filter
    const conf = norm._confidence || 'medium';
    if (!forceAll && conf === 'low') {
      console.log(`  ⏭  SKIP (low confidence) ${norm.brand} · ${norm.name}`);
      stats.skipped_invalid++;
      importLog.push({ action: 'skipped_low_confidence', dart: norm.name });
      continue;
    }

    // Validation filter
    if (!ok && skipInvalid) {
      console.log(`  ✗  INVALID ${norm.brand} · ${norm.name}`);
      errors.forEach(e => console.log(`       → ${e}`));
      stats.skipped_invalid++;
      importLog.push({ action: 'skipped_invalid', dart: norm.name, errors });
      continue;
    }

    // Deduplication
    const { duplicate, match, reason } = isDuplicate(norm, existing);
    if (duplicate) {
      const priceDrift = match.price_gbp && norm.price_gbp
        ? `£${match.price_gbp} → £${norm.price_gbp}`
        : '';
      console.log(`  ⟳  DUPLICATE (${reason}) ${norm.brand} · ${norm.name} ${priceDrift ? '— ' + priceDrift : ''}`);
      stats.skipped_dup++;
      importLog.push({ action: 'duplicate', dart: norm.name, reason, matched: match.name });
      continue;
    }

    // Warnings (don't block import)
    if (warnings.length) {
      stats.warnings += warnings.length;
      warnings.forEach(w => console.log(`  ⚠  ${norm.brand} · ${norm.name}: ${w}`));
    }

    // Import
    console.log(`  ${dryRun ? '[DRY]' : '✓'} IMPORT ${norm.brand} · ${norm.name} · ${norm.weight}g · £${norm.price_gbp} (${conf})`);
    if (!dryRun) {
      try {
        insertDart(db, norm);
        existing.push(norm); // prevent re-importing same dart twice in one run
        stats.imported++;
        importLog.push({ action: 'imported', dart: norm.name, brand: norm.brand });
      } catch (e) {
        console.error(`  ✗  DB insert failed: ${e.message}`);
        importLog.push({ action: 'error', dart: norm.name, error: e.message });
      }
    } else {
      stats.imported++; // count as "would import" in dry-run
    }
  }

  // Summary
  console.log(`\n${'─'.repeat(60)}`);
  if (dryRun) {
    console.log(`  DRY RUN SUMMARY`);
    console.log(`  Would import  : ${stats.imported}`);
  } else {
    console.log(`  IMPORT SUMMARY`);
    console.log(`  Imported      : ${stats.imported}`);
  }
  console.log(`  Duplicates    : ${stats.skipped_dup}`);
  console.log(`  Invalid/skip  : ${stats.skipped_invalid}`);
  console.log(`  Warnings      : ${stats.warnings}`);
  console.log(`  New total     : ${existing.length} darts`);

  // Save log
  const logPath = filePath.replace('.json', `-import-log-${Date.now()}.json`);
  fs.writeFileSync(logPath, JSON.stringify({ dryRun, stats, log: importLog }, null, 2));
  console.log(`\n  Log saved: ${path.basename(logPath)}`);

  if (dryRun && stats.imported > 0) {
    console.log(`\n  Run without --dry-run to apply changes.`);
  }
  console.log('═'.repeat(60) + '\n');
}

main();
