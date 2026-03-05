'use strict';
// ═══════════════════════════════════════════════════════════════════
//  DARTFIT COVERAGE ANALYSIS
//  Sweeps synthetic body-type profiles across the full human range
//  and reports: ideal specs produced, budget/value/premium coverage,
//  and any gaps where the catalog is thin.
// ═══════════════════════════════════════════════════════════════════

const { calculateIdealProfile, runMatchPipeline } = require('../lib/algorithm');
const db = require('../lib/database').getDb();

const darts = db.prepare('SELECT * FROM darts WHERE active = 1').all();
const pros  = db.prepare('SELECT * FROM pro_players').all();

// ─── ANTHROPOMETRIC RANGES ──────────────────────────────────────
// Each axis covers the realistic population spread with a label
const HEIGHTS = [
  { label:'Very Short',  cm:155 },
  { label:'Short',       cm:163 },
  { label:'Average',     cm:175 },
  { label:'Tall',        cm:185 },
  { label:'Very Tall',   cm:196 },
];

const HAND_TYPES = [
  // [fingerLength_mm, palmWidth_mm, gripDiameter_mm, label]
  [65,  70, 12, 'XS hand (child/petite)'],
  [73,  78, 14, 'Small hand'],
  [80,  85, 16, 'Average hand'],
  [88,  93, 18, 'Large hand'],
  [96, 102, 20, 'XL hand'],
];

const FOREARM_RATIOS = [
  { label:'Short forearm',   ratio:0.135 },
  { label:'Average forearm', ratio:0.148 },
  { label:'Long forearm',    ratio:0.160 },
];

const STYLES = [
  { throwingStyle:'front',  gripPreference:2, weightPreference:2, playingLevel:'beginner',      label:'Light front-grip beginner' },
  { throwingStyle:'front',  gripPreference:3, weightPreference:3, playingLevel:'intermediate',  label:'Front-grip intermediate' },
  { throwingStyle:'middle', gripPreference:3, weightPreference:3, playingLevel:'intermediate',  label:'Middle-grip intermediate' },
  { throwingStyle:'middle', gripPreference:4, weightPreference:3, playingLevel:'advanced',      label:'Middle-grip advanced' },
  { throwingStyle:'rear',   gripPreference:4, weightPreference:4, playingLevel:'advanced',      label:'Rear-grip power player' },
  { throwingStyle:'rear',   gripPreference:5, weightPreference:5, playingLevel:'competitive',   label:'Heavy rear-grip competitive' },
];

// ─── SWEEP ───────────────────────────────────────────────────────
const results = [];

for (const h of HEIGHTS) {
  for (const [fl, pw, gd, handLabel] of HAND_TYPES) {
    for (const fa of FOREARM_RATIOS) {
      for (const style of STYLES) {
        const forearmLengthMm = h.cm * 10 * fa.ratio;
        const profile = calculateIdealProfile({
          fingerLength:    fl,
          palmWidth:       pw,
          gripDiameter:    gd,
          fingerSpan:      fl * 2.4,
          fingerFlexIndex: 0.75,
          throwAngleDeg:   null,
          heightCm:        h.cm,
          forearmLengthMm,
          gripPreference:  style.gripPreference,
          weightPreference:style.weightPreference,
          throwingStyle:   style.throwingStyle,
          playingLevel:    style.playingLevel,
        });

        const fit = runMatchPipeline(profile, darts, pros);

        results.push({
          heightLabel: h.label,
          heightCm:    h.cm,
          handLabel,
          forearmLabel:fa.label,
          styleLabel:  style.label,
          // Ideal specs
          idealWeight:    profile.idealWeight,
          idealLength:    profile.idealLength,
          idealDiameter:  profile.idealDiameter,
          idealGripType:  profile.idealGripType,
          balance:        profile.balance,
          barrelShape:    profile.barrelShape,
          // Tier results
          topScore:     fit.topDart?.matchScore ?? null,
          topName:      fit.topDart?.name ?? '—',
          topPrice:     fit.topDart?.price_gbp ?? null,
          budgetScore:  fit.budgetDart?.matchScore ?? null,
          budgetName:   fit.budgetDart?.name ?? '—',
          budgetPrice:  fit.budgetDart?.price_gbp ?? null,
          valueScore:   fit.valueDart?.matchScore ?? null,
          valueName:    fit.valueDart?.name ?? '—',
          premiumScore: fit.premiumDart?.matchScore ?? null,
          premiumName:  fit.premiumDart?.name ?? '—',
        });
      }
    }
  }
}

// ─── REPORTING ───────────────────────────────────────────────────
const total = results.length;

function pct(n) { return ((n / total) * 100).toFixed(1) + '%'; }
function avg(arr) { return arr.length ? (arr.reduce((a,b)=>a+b,0)/arr.length).toFixed(1) : 'n/a'; }
function buckets(arr, key) {
  const map = {};
  arr.forEach(r => { map[r[key]] = (map[r[key]]||0) + 1; });
  return Object.entries(map).sort((a,b)=>b[1]-a[1]);
}

console.log('\n' + '═'.repeat(70));
console.log('  DARTFIT CATALOG COVERAGE ANALYSIS');
console.log('  ' + total + ' synthetic profiles across heights × hands × forearms × styles');
console.log('═'.repeat(70));

// ── TIER COVERAGE ────────────────────────────────────────────────
const hasBudget  = results.filter(r => r.budgetScore !== null);
const hasValue   = results.filter(r => r.valueScore !== null);
const hasPremium = results.filter(r => r.premiumScore !== null);

const budgetGap  = results.filter(r => r.budgetScore === null);
const valueGap   = results.filter(r => r.valueScore === null);
const premiumGap = results.filter(r => r.premiumScore === null);

console.log('\n📦  TIER COVERAGE  (profiles that get a match at each price tier)');
console.log(`  Budget  ≤£25 : ${hasBudget.length}/${total}  (${pct(hasBudget.length)}) — avg score ${avg(hasBudget.map(r=>r.budgetScore))}`);
console.log(`  Value   £25-40: ${hasValue.length}/${total}  (${pct(hasValue.length)}) — avg score ${avg(hasValue.map(r=>r.valueScore))}`);
console.log(`  Premium £40+ : ${hasPremium.length}/${total}  (${pct(hasPremium.length)}) — avg score ${avg(hasPremium.map(r=>r.premiumScore))}`);

// ── SCORE QUALITY THRESHOLDS ─────────────────────────────────────
const THRESHOLDS = [50, 60, 70, 80];
console.log('\n🎯  TOP MATCH SCORE DISTRIBUTION');
for (const t of THRESHOLDS) {
  const n = results.filter(r => r.topScore >= t).length;
  console.log(`  ≥${t}: ${n}/${total} (${pct(n)})`);
}

console.log('\n🏷️  BUDGET PICK SCORE DISTRIBUTION');
for (const t of THRESHOLDS) {
  const n = hasBudget.filter(r => r.budgetScore >= t).length;
  console.log(`  ≥${t}: ${n}/${hasBudget.length} (${((n/hasBudget.length)*100).toFixed(1)}% of profiles that have a budget pick)`);
}

// ── IDEAL WEIGHT DISTRIBUTION ────────────────────────────────────
console.log('\n⚖️  IDEAL WEIGHT SPREAD (# profiles per weight)');
const weightBuckets = buckets(results, 'idealWeight');
const maxBar = 40;
const maxCount = Math.max(...weightBuckets.map(([,n])=>n));
weightBuckets.sort((a,b)=>parseInt(a[0])-parseInt(b[0])).forEach(([w,n]) => {
  const bar = '█'.repeat(Math.round((n/maxCount)*maxBar));
  console.log(`  ${String(w).padStart(2)}g : ${bar} ${n}`);
});

// ── IDEAL GRIP DISTRIBUTION ──────────────────────────────────────
console.log('\n✋  IDEAL GRIP TYPE DISTRIBUTION');
buckets(results, 'idealGripType').forEach(([g,n]) => {
  const bar = '█'.repeat(Math.round((n/total)*maxBar));
  console.log(`  ${g.padEnd(20)}: ${bar} ${n} (${pct(n)})`);
});

// ── BARREL SHAPE ─────────────────────────────────────────────────
console.log('\n🎯  BARREL SHAPE DISTRIBUTION');
buckets(results, 'barrelShape').forEach(([s,n]) => {
  console.log(`  ${s.padEnd(12)}: ${n} (${pct(n)})`);
});

// ── BALANCE ──────────────────────────────────────────────────────
console.log('\n⚖️  BALANCE POINT DISTRIBUTION');
buckets(results, 'balance').forEach(([b,n]) => {
  console.log(`  ${b.padEnd(10)}: ${n} (${pct(n)})`);
});

// ── GAPS — PROFILES WITH WEAK BUDGET SCORES ──────────────────────
const weakBudget = results.filter(r => r.budgetScore !== null && r.budgetScore < 60);
const noBudget   = results.filter(r => r.budgetScore === null);

if (noBudget.length > 0) {
  console.log('\n❌  PROFILES WITH NO BUDGET PICK (≤£25):');
  const groups = {};
  noBudget.forEach(r => {
    const k = `${r.idealWeight}g ${r.idealGripType} ${r.barrelShape}`;
    groups[k] = (groups[k]||0) + 1;
  });
  Object.entries(groups).sort((a,b)=>b[1]-a[1]).slice(0,10).forEach(([k,n]) => {
    console.log(`  ${k}: ${n} profiles`);
  });
}

if (weakBudget.length > 0) {
  console.log(`\n⚠️  PROFILES WITH WEAK BUDGET SCORE (<60): ${weakBudget.length} (${pct(weakBudget.length)})`);
  const groups = {};
  weakBudget.forEach(r => {
    const k = `${r.idealWeight}g, ${r.idealGripType}, ${r.barrelShape}, ${r.balance}-weighted`;
    groups[k] = (groups[k]||0) + 1;
  });
  console.log('  Top gap clusters (ideal spec → count):');
  Object.entries(groups).sort((a,b)=>b[1]-a[1]).slice(0,12).forEach(([k,n]) => {
    console.log(`    ${k}: ${n} profiles`);
  });
}

// ── SAMPLE PROFILES TABLE ─────────────────────────────────────────
console.log('\n📋  SAMPLE PROFILES (one per height × hand-size combo)');
console.log('  ' + ['Height','Hand','Wt','Len','Dia','Grip','Top%','Budget pick (£)','Score'].map(s=>s.padEnd(20)).join(''));
const sample = HEIGHTS.flatMap(h =>
  HAND_TYPES.map(([fl,pw,gd,handLabel]) => {
    const fa = FOREARM_RATIOS[1]; // average forearm
    const style = STYLES[2]; // middle-grip intermediate
    return results.find(r =>
      r.heightLabel === h.label &&
      r.handLabel === handLabel &&
      r.forearmLabel === fa.label &&
      r.styleLabel === style.label
    );
  })
).filter(Boolean);

sample.forEach(r => {
  const budgetStr = r.budgetName !== '—'
    ? `${r.budgetName.substring(0,18)} £${r.budgetPrice?.toFixed(0)}`
    : 'NONE';
  console.log('  ' + [
    r.heightCm+'cm',
    r.handLabel.substring(0,18),
    r.idealWeight+'g',
    r.idealLength+'mm',
    r.idealDiameter+'mm',
    r.idealGripType,
    r.topScore+'%',
    budgetStr,
    r.budgetScore ?? '—',
  ].map(s=>String(s).padEnd(20)).join(''));
});

// ── CATALOG RECOMMENDATIONS ───────────────────────────────────────
console.log('\n💡  GAP RECOMMENDATIONS');

const weightNeeds = {};
weakBudget.concat(noBudget).forEach(r => {
  const k = r.idealWeight + 'g';
  weightNeeds[k] = (weightNeeds[k]||0) + 1;
});

if (Object.keys(weightNeeds).length) {
  const sorted = Object.entries(weightNeeds).sort((a,b)=>b[1]-a[1]);
  console.log('  Underserved weights in budget tier (≤£25):');
  sorted.slice(0,8).forEach(([w,n]) => console.log(`    ${w}: ${n} profiles affected`));
}

const gripNeeds = {};
weakBudget.concat(noBudget).forEach(r => {
  gripNeeds[r.idealGripType] = (gripNeeds[r.idealGripType]||0) + 1;
});
if (Object.keys(gripNeeds).length) {
  console.log('  Underserved grip types in budget tier:');
  Object.entries(gripNeeds).sort((a,b)=>b[1]-a[1]).slice(0,6).forEach(([g,n]) => {
    console.log(`    ${g}: ${n} profiles`);
  });
}

console.log('\n' + '═'.repeat(70) + '\n');
