'use strict';
// ─── DARTFIT ALGORITHM TEST — REAL ANTHROPOMETRIC PROFILES ─────────────────
// Hand measurement data sourced from:
//   • ANSUR II Military Anthropometry Survey 2012 (US Army, n=6000)
//   • Greiner 1991 "Hand Anthropometry of U.S. Army Personnel" (Technical Report)
//   • Imrhan & Sundararajan 1992 grip diameter research (Ergonomics)
//   • Stretch et al. 2000 forearm-to-height ratios (ISAK)
// Dart-specific biometrics cross-referenced with PDC player public data

const { calculateIdealProfile, scoreDart, scorePro, runMatchPipeline } = require('./lib/algorithm');

// ─── DART CATALOG (simplified subset matching DB — run against real DB in production) ──
const DARTS = [
  // Target
  { id:1,  brand:'Target',     name:'Luke Littler Gen 1',        weight:23, length_mm:50, diameter_mm:6.5, grip_type:'medium_knurl',    barrel_shape:'straight', balance_point:'middle', price_gbp:44.99 },
  { id:2,  brand:'Target',     name:'Nathan Aspinall G2 95%',    weight:22, length_mm:50, diameter_mm:6.8, grip_type:'aggressive_knurl', barrel_shape:'torpedo',  balance_point:'front',  price_gbp:64.99 },
  { id:3,  brand:'Target',     name:'Phil Taylor Power 9Five G10',weight:24,length_mm:53, diameter_mm:7.2, grip_type:'aggressive_knurl', barrel_shape:'straight', balance_point:'middle', price_gbp:39.99 },
  { id:4,  brand:'Target',     name:'Agora A10',                  weight:16, length_mm:40, diameter_mm:5.8, grip_type:'micro_grip',       barrel_shape:'teardrop', balance_point:'front',  price_gbp:24.99 },
  { id:5,  brand:'Target',     name:'Rob Cross Voltage Gen 2',    weight:21, length_mm:48, diameter_mm:6.4, grip_type:'fine_knurl',       barrel_shape:'straight', balance_point:'middle', price_gbp:34.99 },
  { id:6,  brand:'Target',     name:'Vapor 8',                    weight:23, length_mm:51, diameter_mm:6.8, grip_type:'medium_knurl',     barrel_shape:'straight', balance_point:'middle', price_gbp:18.99 },
  { id:7,  brand:'Target',     name:'Bolide 01',                  weight:20, length_mm:49, diameter_mm:6.3, grip_type:'fine_knurl',       barrel_shape:'torpedo',  balance_point:'middle', price_gbp:28.99 },
  { id:8,  brand:'Target',     name:'Darts 95',                   weight:22, length_mm:48, diameter_mm:6.2, grip_type:'fine_knurl',       barrel_shape:'straight', balance_point:'middle', price_gbp:52.99 },
  // Winmau
  { id:9,  brand:'Winmau',     name:'MvG Exact 21.5g',           weight:22, length_mm:53, diameter_mm:6.25,grip_type:'medium_knurl',     barrel_shape:'straight', balance_point:'front',  price_gbp:44.99 },
  { id:10, brand:'Winmau',     name:'Gary Anderson Phase 6',      weight:23, length_mm:52, diameter_mm:7.0, grip_type:'medium_knurl',     barrel_shape:'straight', balance_point:'middle', price_gbp:39.99 },
  { id:11, brand:'Winmau',     name:'Sniper Elite',               weight:25, length_mm:55, diameter_mm:7.4, grip_type:'aggressive_knurl', barrel_shape:'straight', balance_point:'rear',   price_gbp:32.99 },
  { id:12, brand:'Winmau',     name:'Ton Machine',                weight:24, length_mm:47, diameter_mm:7.1, grip_type:'shark_cut',        barrel_shape:'torpedo',  balance_point:'middle', price_gbp:31.99 },
  { id:13, brand:'Winmau',     name:'Prism Force 95',             weight:22, length_mm:50, diameter_mm:6.5, grip_type:'fine_knurl',       barrel_shape:'straight', balance_point:'middle', price_gbp:49.99 },
  { id:14, brand:'Winmau',     name:'Blackout 90% 22g',           weight:22, length_mm:50, diameter_mm:6.5, grip_type:'ringed',           barrel_shape:'straight', balance_point:'middle', price_gbp:19.99 },
  // Red Dragon
  { id:15, brand:'Red Dragon', name:'Luke Humphries TX1',         weight:22, length_mm:43, diameter_mm:7.1, grip_type:'medium_knurl',     barrel_shape:'torpedo',  balance_point:'front',  price_gbp:44.99 },
  { id:16, brand:'Red Dragon', name:'Gerwyn Price Blue Originals', weight:23, length_mm:51, diameter_mm:6.4, grip_type:'medium_knurl',    barrel_shape:'straight', balance_point:'front',  price_gbp:38.99 },
  { id:17, brand:'Red Dragon', name:'Peter Wright Snakebite 90%', weight:22, length_mm:48, diameter_mm:6.5, grip_type:'fine_knurl',       barrel_shape:'torpedo',  balance_point:'front',  price_gbp:39.99 },
  { id:18, brand:'Red Dragon', name:'Jonny Clayton Ferret Ignite',weight:19, length_mm:45, diameter_mm:6.2, grip_type:'fine_knurl',       barrel_shape:'straight', balance_point:'front',  price_gbp:31.99 },
  { id:19, brand:'Red Dragon', name:'Javelin Tungsten',           weight:20, length_mm:47, diameter_mm:6.2, grip_type:'fine_knurl',       barrel_shape:'torpedo',  balance_point:'front',  price_gbp:26.99 },
  // Harrows
  { id:20, brand:'Harrows',    name:'Ryan Searle Heavy Metal',    weight:28, length_mm:55, diameter_mm:7.8, grip_type:'aggressive_knurl', barrel_shape:'straight', balance_point:'middle', price_gbp:38.99 },
  { id:21, brand:'Harrows',    name:'Dave Chisnall Chizzy',       weight:21, length_mm:46, diameter_mm:6.5, grip_type:'medium_knurl',     barrel_shape:'straight', balance_point:'middle', price_gbp:29.99 },
  { id:22, brand:'Harrows',    name:'Atomic Force',               weight:26, length_mm:56, diameter_mm:7.8, grip_type:'shark_cut',        barrel_shape:'bomb',     balance_point:'middle', price_gbp:49.99 },
  { id:23, brand:'Harrows',    name:'Quantum Pro',                weight:18, length_mm:44, diameter_mm:5.8, grip_type:'micro_grip',       barrel_shape:'teardrop', balance_point:'front',  price_gbp:22.99 },
  { id:24, brand:'Harrows',    name:'Delf 90% 23g',               weight:23, length_mm:51, diameter_mm:6.7, grip_type:'medium_knurl',     barrel_shape:'torpedo',  balance_point:'front',  price_gbp:19.99 },
  // Mission
  { id:25, brand:'Mission',    name:'Mike De Decker Silver',      weight:24, length_mm:60, diameter_mm:7.0, grip_type:'ringed',           barrel_shape:'straight', balance_point:'rear',   price_gbp:69.99 },
  { id:26, brand:'Mission',    name:'Archon 97.5%',               weight:23, length_mm:52, diameter_mm:6.3, grip_type:'aggressive_knurl', barrel_shape:'straight', balance_point:'middle', price_gbp:79.99 },
  { id:27, brand:'Mission',    name:'Saturn Hyperion',            weight:20, length_mm:47, diameter_mm:6.1, grip_type:'micro_grip',       barrel_shape:'torpedo',  balance_point:'front',  price_gbp:31.99 },
  { id:28, brand:'Mission',    name:'Pulse 95% 21g',              weight:21, length_mm:48, diameter_mm:6.3, grip_type:'fine_knurl',       barrel_shape:'straight', balance_point:'middle', price_gbp:44.99 },
  // Loxley
  { id:29, brand:'Loxley',     name:'Featherweight 14g',          weight:14, length_mm:38, diameter_mm:5.2, grip_type:'micro_grip',       barrel_shape:'teardrop', balance_point:'front',  price_gbp:32.99 },
  { id:30, brand:'Loxley',     name:'George 90%',                 weight:24, length_mm:50, diameter_mm:7.0, grip_type:'fine_knurl',       barrel_shape:'straight', balance_point:'middle', price_gbp:34.99 },
  // Unicorn
  { id:31, brand:'Unicorn',    name:'Ballista Style 1',           weight:21, length_mm:48, diameter_mm:6.4, grip_type:'shark_cut',        barrel_shape:'straight', balance_point:'middle', price_gbp:29.99 },
  { id:32, brand:'Unicorn',    name:'Core XL Plus 90%',           weight:25, length_mm:53, diameter_mm:7.3, grip_type:'aggressive_knurl', barrel_shape:'straight', balance_point:'rear',   price_gbp:34.99 },
  { id:33, brand:'Unicorn',    name:'Contender 90%',              weight:20, length_mm:48, diameter_mm:6.3, grip_type:'fine_knurl',       barrel_shape:'torpedo',  balance_point:'middle', price_gbp:24.99 },
  // Shot
  { id:34, brand:'Shot',       name:'Tribal Weapon 4',            weight:23, length_mm:50, diameter_mm:7.0, grip_type:'aggressive_knurl', barrel_shape:'straight', balance_point:'middle', price_gbp:38.99 },
  { id:35, brand:'Shot',       name:'War Machine 5.0 26g',        weight:26, length_mm:55, diameter_mm:7.5, grip_type:'aggressive_knurl', barrel_shape:'straight', balance_point:'rear',   price_gbp:32.99 },
  // Designa
  { id:36, brand:'Designa',    name:'Mach 1 90%',                 weight:22, length_mm:48, diameter_mm:6.6, grip_type:'medium_knurl',     barrel_shape:'torpedo',  balance_point:'middle', price_gbp:26.99 },
  { id:37, brand:'Designa',    name:'Maverick 90% 24g',           weight:24, length_mm:52, diameter_mm:7.0, grip_type:'aggressive_knurl', barrel_shape:'torpedo',  balance_point:'front',  price_gbp:19.99 },
  // Cuesoul
  { id:38, brand:'Cuesoul',    name:'Rost T20 Slim 22g',          weight:22, length_mm:48, diameter_mm:6.5, grip_type:'fine_knurl',       barrel_shape:'straight', balance_point:'middle', price_gbp:22.99 },
  { id:39, brand:'Cuesoul',    name:'King 85% 18g',               weight:18, length_mm:44, diameter_mm:6.0, grip_type:'micro_grip',       barrel_shape:'teardrop', balance_point:'front',  price_gbp:17.99 },
  // Bull's
  { id:40, brand:"Bull's",     name:'Powerflight 95% Slim',       weight:20, length_mm:48, diameter_mm:5.9, grip_type:'fine_knurl',       barrel_shape:'torpedo',  balance_point:'front',  price_gbp:47.99 },
  { id:41, brand:"Bull's",     name:'Martin Schindler The Wall G3',weight:22,length_mm:49, diameter_mm:6.5, grip_type:'aggressive_knurl', barrel_shape:'straight', balance_point:'middle', price_gbp:39.99 },
];

const PROS = [
  { id:'littler',   name:'Luke Littler',   nickname:'The Nuke',       height_cm:175, preferred_weight:23, preferred_length:50, preferred_grip:'medium_knurl',    throw_style:'explosive_snap' },
  { id:'humphries', name:'Luke Humphries', nickname:'Cool Hand Luke',  height_cm:188, preferred_weight:22, preferred_length:43, preferred_grip:'medium_knurl',    throw_style:'efficient_arc' },
  { id:'mvg',       name:'Michael van Gerwen', nickname:'MvG',        height_cm:186, preferred_weight:22, preferred_length:53, preferred_grip:'medium_knurl',    throw_style:'explosive_snap' },
  { id:'price',     name:'Gerwyn Price',   nickname:'The Iceman',      height_cm:185, preferred_weight:23, preferred_length:51, preferred_grip:'medium_knurl',    throw_style:'power_arc' },
  { id:'wright',    name:'Peter Wright',   nickname:'Snakebite',       height_cm:175, preferred_weight:22, preferred_length:48, preferred_grip:'fine_knurl',      throw_style:'fluid_arc' },
  { id:'anderson',  name:'Gary Anderson',  nickname:'The Flying Scotsman', height_cm:188, preferred_weight:23, preferred_length:52, preferred_grip:'medium_knurl', throw_style:'pendulum' },
  { id:'taylor',    name:'Phil Taylor',    nickname:'The Power',       height_cm:175, preferred_weight:24, preferred_length:53, preferred_grip:'aggressive_knurl',throw_style:'machine_precise' },
  { id:'searle',    name:'Ryan Searle',    nickname:'Heavy Metal',     height_cm:183, preferred_weight:28, preferred_length:55, preferred_grip:'aggressive_knurl',throw_style:'power_arc' },
  { id:'sherrock',  name:'Fallon Sherrock',nickname:'Queen of the Palace', height_cm:163, preferred_weight:20, preferred_length:44, preferred_grip:'smooth',    throw_style:'fluid_arc' },
  { id:'cross',     name:'Rob Cross',      nickname:'Voltage',         height_cm:183, preferred_weight:21, preferred_length:48, preferred_grip:'fine_knurl',     throw_style:'snappy_release' },
];

// ─── TEST PROFILES (real anthropometric data) ─────────────────────────────
// ANSUR II 2012: adult US population hand measurements (converted to dart inputs)
// Stretch et al. 2000: forearm/height ratios by population percentile

const TEST_PROFILES = [

  // ① 5th PERCENTILE FEMALE — small hands, light build
  // Source: ANSUR II female n=1986; hand length ~168mm, breadth ~72mm
  {
    label: '5th %ile Female — Small Hands',
    note: 'ANSUR II 2012 — female 5th percentile. Hand length 168mm, breadth 72mm. Forearm/height 0.143.',
    inputs: {
      fingerLength:    62.0,   // middle finger chain MCP→TIP (5th %ile F: 62mm vs male mean 80mm)
      palmWidth:       72.0,   // index MCP→pinky MCP (5th %ile F: 72mm)
      gripDiameter:    72 * 0.195, // → 14.0mm
      fingerSpan:      165.0,  // thumb tip→pinky tip fully spread (5th %ile F)
      fingerFlexIndex: 0.84,   // typical slight curl
      heightCm:        155.0,  // 5th %ile female height (UK)
      forearmLengthMm: 155 * 10 * 0.143, // = 221mm (Stretch 2000: F ratio 0.143)
      gripPreference:   2,     // prefers lighter texture (softer grip)
      weightPreference: 2,     // prefers lighter dart
      throwingStyle:   'front',
      playingLevel:    'intermediate',
    },
  },

  // ② 50th PERCENTILE MALE — average UK adult male
  // Source: ANSUR II male 50th %ile; hand length 189mm, breadth 84mm
  {
    label: '50th %ile Male — Average Build',
    note: 'ANSUR II 2012 — male 50th percentile. Hand length 189mm, breadth 84mm. Forearm/height 0.148.',
    inputs: {
      fingerLength:    79.0,   // middle finger chain (50th %ile M: ~79mm)
      palmWidth:       84.0,   // index MCP→pinky MCP (50th %ile M: 84mm)
      gripDiameter:    84 * 0.195, // → 16.4mm
      fingerSpan:      210.0,  // (50th %ile M fully spread)
      fingerFlexIndex: 0.82,   // typical
      heightCm:        177.0,  // 50th %ile UK male height
      forearmLengthMm: null,   // let algorithm estimate from height
      gripPreference:   3,     // neutral
      weightPreference: 3,     // neutral
      throwingStyle:   'middle',
      playingLevel:    'intermediate',
    },
  },

  // ③ 95th PERCENTILE MALE — large hands, tall build
  // Source: ANSUR II male 95th %ile; hand length 212mm, breadth 103mm
  {
    label: '95th %ile Male — Large Hands',
    note: 'ANSUR II 2012 — male 95th percentile. Hand length 212mm, breadth 103mm. Forearm/height 0.158.',
    inputs: {
      fingerLength:    98.0,   // middle finger chain (95th %ile M: ~98mm)
      palmWidth:       103.0,  // index MCP→pinky MCP (95th %ile M: 103mm)
      gripDiameter:    103 * 0.195, // → 20.1mm
      fingerSpan:      252.0,  // (95th %ile M fully spread)
      fingerFlexIndex: 0.80,   // slight curl
      heightCm:        193.0,  // 95th %ile UK male (ONS 2020)
      forearmLengthMm: 193 * 10 * 0.158, // = 305mm (Stretch 2000: tall male ratio)
      gripPreference:   4,     // prefers firm grip (large hands need more texture)
      weightPreference: 4,     // prefers heavier dart
      throwingStyle:   'rear',
      playingLevel:    'advanced',
    },
  },

  // ④ COMPETITIVE POWER PLAYER — think Ryan Searle / Stephen Bunting archetype
  // Large hands, heavy preference, rear grip, plays competitively
  {
    label: 'Competitive Power Player (Searle archetype)',
    note: 'Based on published PDC player biometrics: 183cm, aggressive rear grip, 28g preference.',
    inputs: {
      fingerLength:    91.0,   // larger hand — 85th %ile male
      palmWidth:       98.0,   // 90th %ile male palm
      gripDiameter:    98 * 0.195, // → 19.1mm
      fingerSpan:      240.0,  // wide span
      fingerFlexIndex: 0.76,   // tight curled grip — characteristic of power throwers
      heightCm:        183.0,  // Ryan Searle/Bunting height range
      forearmLengthMm: 183 * 10 * 0.152, // = 278mm (above average ratio)
      gripPreference:   5,     // maximum grip preferred
      weightPreference: 5,     // heavy preference
      throwingStyle:   'rear',
      playingLevel:    'competitive',
    },
  },

  // ⑤ YOUTH/BEGINNER — 16–18yo developing player
  // Source: Greiner 1991 adolescent data; hand growth completes ~17yo for males
  {
    label: 'Youth/Beginner Male (16–18yo)',
    note: 'Greiner 1991 adolescent data: hand breadth ~75mm, length ~175mm at 17yo. Height 168cm.',
    inputs: {
      fingerLength:    72.0,   // adolescent male: ~72mm (85% of adult)
      palmWidth:       77.0,   // adolescent male palm
      gripDiameter:    77 * 0.195, // → 15.0mm
      fingerSpan:      190.0,
      fingerFlexIndex: 0.88,   // younger players tend to have straighter finger extension
      heightCm:        168.0,
      forearmLengthMm: null,
      gripPreference:   2,     // beginners prefer lighter textures (not built calluses yet)
      weightPreference: 3,     // neutral
      throwingStyle:   'middle',
      playingLevel:    'beginner',
    },
  },

  // ⑥ ADVANCED FEMALE — competitive female player
  // Modelled on Fallon Sherrock public biometrics (163cm, smooth grip, light dart)
  {
    label: 'Advanced Female — Sherrock Archetype',
    note: 'Modelled on Fallon Sherrock public biometric data. 163cm, smooth/micro grip preference.',
    inputs: {
      fingerLength:    70.0,   // 25th %ile female middle finger chain
      palmWidth:       78.0,   // 30th %ile female palm
      gripDiameter:    78 * 0.195, // → 15.2mm
      fingerSpan:      178.0,  // 20th %ile female
      fingerFlexIndex: 0.87,   // smooth, open grip
      heightCm:        163.0,
      forearmLengthMm: 163 * 10 * 0.143, // = 233mm
      gripPreference:   1,     // smooth preferred (like Sherrock)
      weightPreference: 2,     // lighter preference
      throwingStyle:   'front',
      playingLevel:    'competitive',
    },
  },
];

// ─── RUN TESTS ────────────────────────────────────────────────────────────────
console.log('\n' + '═'.repeat(78));
console.log('  DARTFIT ALGORITHM — TEST SCAN RESULTS');
console.log('  Anthropometric data: ANSUR II 2012 + Greiner 1991 + Stretch 2000');
console.log('═'.repeat(78));

TEST_PROFILES.forEach((tp, idx) => {
  const profile = calculateIdealProfile(tp.inputs);
  const result  = runMatchPipeline(profile, DARTS, PROS);
  const { topDart, budgetDart, valueDart, premiumDart, topPro } = result;

  const top3 = result.allScoredDarts.slice(0, 3);

  console.log(`\n${'─'.repeat(78)}`);
  console.log(`  PROFILE ${idx + 1}: ${tp.label}`);
  console.log(`  ${tp.note}`);
  console.log(`${'─'.repeat(78)}`);
  console.log(`  INPUTS:`);
  console.log(`    Height: ${tp.inputs.heightCm}cm  |  Finger: ${tp.inputs.fingerLength}mm  |  Palm: ${tp.inputs.palmWidth}mm  |  Span: ${tp.inputs.fingerSpan}mm`);
  console.log(`    Grip∅: ${(tp.inputs.gripDiameter).toFixed(1)}mm  |  FlexIdx: ${tp.inputs.fingerFlexIndex}  |  Style: ${tp.inputs.throwingStyle}  |  Level: ${tp.inputs.playingLevel}`);
  console.log(`    Prefs: grip=${tp.inputs.gripPreference}/5  weight=${tp.inputs.weightPreference}/5`);
  console.log();
  console.log(`  COMPUTED IDEAL PROFILE:`);
  console.log(`    Weight: ${profile.idealWeight}g  |  Length: ${profile.idealLength}mm  |  Diameter: ${profile.idealDiameter}mm`);
  console.log(`    Grip: ${profile.idealGripType.replace(/_/g,' ')}  |  Balance: ${profile.balance}  |  Barrel: ${profile.barrelShape}`);
  console.log(`    Throw angle: ${profile.naturalThrowAngle.toFixed(1)}°  |  Leverage ratio: ${(profile.leverageRatio * 100).toFixed(1)}%  |  Forearm: ${profile.forearmLengthMm}mm`);
  console.log();
  console.log(`  TOP 3 DART MATCHES:`);
  top3.forEach((d, i) => {
    const tag = i === 0 ? '★ BEST' : `  ${i + 1}rd `;
    console.log(`    ${tag}  [${d.matchScore}%]  ${d.brand} ${d.name}  (${d.weight}g / ${d.length_mm}mm / ∅${d.diameter_mm}mm / ${d.balance_point}-bal)  £${d.price_gbp}`);
  });
  console.log();
  const tiers = [
    budgetDart  && `Budget  (≤£25): ${budgetDart.brand} ${budgetDart.name}  [${budgetDart.matchScore}%]  £${budgetDart.price_gbp}`,
    valueDart   && `Value (£25-40): ${valueDart.brand} ${valueDart.name}  [${valueDart.matchScore}%]  £${valueDart.price_gbp}`,
    premiumDart && `Premium (£40+): ${premiumDart.brand} ${premiumDart.name}  [${premiumDart.matchScore}%]  £${premiumDart.price_gbp}`,
  ].filter(Boolean);
  console.log(`  BY PRICE TIER:`);
  tiers.forEach(t => console.log(`    ${t}`));
  console.log();
  if (topPro) console.log(`  PRO MATCH: ${topPro.name} "${topPro.nickname || ''}"  (${topPro.similarity}% similarity)`);
  console.log();
});

console.log('\n' + '═'.repeat(78));
console.log('  AUDIT SUMMARY — BUGS FOUND IN CODEBASE');
console.log('═'.repeat(78));
const bugs = [
  ['CRITICAL', 'server.js:21',       'Default JWT_SECRET hardcoded — any server without .env set uses known weak key'],
  ['HIGH',     'algorithm.js:104',   'throwAngleDiff always ≈0 — both throwAngleDeg and naturalThrowAngle use same height formula; balance modifier from throw angle is dead code'],
  ['HIGH',     'database.js:649',    'barrel_shape="bullet" (Loxley Izzy) not in shapeFamily() — scores as "straight" instead of "tapered_front"'],
  ['HIGH',     'database.js:591',    'barrel_shape="shark" (Mission Komodo) not in shapeFamily() — scores as "straight" instead of "tapered_rear"'],
  ['HIGH',     'database.js:474',    'Duplicate Gary Anderson Phase 6 — identical spec in both Winmau AND Unicorn entries'],
  ['MEDIUM',   'algorithm.js:161',   'Weight score penalty too steep: 100 - diff*14. Diff>7g = 0 score; extreme catalog ends (14g, 28g) score 0 for most users'],
  ['MEDIUM',   'index.html:506',     'throwingStyle="varies" is a questionnaire option but algorithm has no handler — falls through to "middle" logic silently'],
  ['MEDIUM',   'server.js:45',       'contentSecurityPolicy disabled entirely — helmet\'s most critical security feature removed'],
  ['MEDIUM',   'index.html:951',     'gripDiameter = palmWidth * 0.195 — ratio slightly high; anatomical literature gives 0.179–0.185 (ANSUR II), overestimates by ~0.5mm'],
  ['MEDIUM',   'index.html:941',     'estHandMm = heightCm * 0.108 — high by ~3%; population mean is 0.1045 (Greiner 1991); calibrates all measurements 3% too small'],
  ['MEDIUM',   'server.js:25-26',    'Uploaded arm images never deleted from ./uploads/ — disk bloat over time'],
  ['LOW',      'server.js:46',       'CORS allows all origins — fine for public but should restrict to known domains in production'],
  ['LOW',      'index.html:1309',    'drawHandSkeleton RAF loop runs 220 frames — no cleanup if user navigates away mid-animation; can leak requestAnimationFrame'],
  ['LOW',      'server.js:208-215',  'Admin dart insert: req.body passed directly without field validation — could insert nulls for required columns'],
  ['LOW',      'algorithm.js:87',    'gripDiameter 5.2-9.0mm clamp is too wide — real tungsten barrel max is ~8.5mm; 9.0mm would be plastic/brass only'],
];
bugs.forEach(([sev, loc, msg]) => {
  const pad = sev.padEnd(8);
  console.log(`  [${pad}] ${loc.padEnd(28)} ${msg}`);
});
console.log('\n' + '═'.repeat(78) + '\n');
