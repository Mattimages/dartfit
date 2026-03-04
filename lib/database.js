'use strict';
const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'data', 'dartfit.db');

// ─────────────────────────────────────────────────────────────────
// AFFILIATE PROGRAM GUIDE
// ─────────────────────────────────────────────────────────────────
// Replace the placeholder affiliate IDs below with your own:
//
//  AMAZON ASSOCIATES (covers all brands — easiest to set up)
//    Sign up: https://affiliate-program.amazon.co.uk/
//    Replace:  tag=dartfit-21  →  tag=YOUR-AMAZON-ID
//
//  TARGET DARTS (Awin Network — ID 7873)
//    Sign up: https://ui.awin.com/merchant-profile/7873
//    Apply affiliate param to target-darts.co.uk URLs
//
//  RED DRAGON DARTS (Awin Network)
//    Sign up: https://ui.awin.com → search "Red Dragon Darts"
//    Apply affiliate param to reddragondarts.com URLs
//
//  WINMAU (Awin Network)
//    Sign up: https://ui.awin.com → search "Winmau"
//    Apply affiliate param to winmau.com URLs
//
//  DARTSHOPPER (affiliate program — covers all brands)
//    Sign up: https://www.dartshopper.com/partner/
//    URL format: https://www.dartshopper.com/product.html?ref=YOUR-ID
//
//  DARTS CORNER (Awin Network)
//    Sign up: https://ui.awin.com → search "Darts Corner"
//    URL format: https://www.dartscorner.co.uk/...?awinaffid=YOUR-ID
// ─────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────
// DART DATABASE  (real products, real specs)
// ─────────────────────────────────────────────
const DART_CATALOG = [

  // ══════════════════════════════════════════
  // TARGET DARTS
  // ══════════════════════════════════════════
  {
    brand:'Target', name:'Luke Littler Gen 1',
    weight:23, length_mm:50, diameter_mm:6.5,
    grip_type:'medium_knurl', barrel_shape:'straight', balance_point:'middle',
    tungsten_pct:90, surface:'black_pvd',
    price_gbp:44.99, buy_url:'https://www.target-darts.co.uk/luke-littler-g1-steel-tip-darts',
    pro_player:'Luke Littler',
    tags:'90-tungsten,dual-pixel-grip,23g,current-world-champ',
    description:"Luke 'The Nuke' Littler's signature 23g. Dual Pixel Tip grip technology in black PVD — straight barrel with radial rear grooves. 2025 World Championship winning dart.",
    released:'2024-04-01',
  },
  {
    brand:'Target', name:'Luke Littler Loadout SP',
    weight:23, length_mm:52, diameter_mm:6.5,
    grip_type:'fine_knurl', barrel_shape:'straight', balance_point:'middle',
    tungsten_pct:90, surface:'black_pvd',
    price_gbp:34.99, buy_url:'https://www.target-darts.co.uk/luke-littler-loadout-sp-steel-tip-darts',
    pro_player:'Luke Littler',
    tags:'90-tungsten,swiss-point,radial-groove',
    description:"Littler's Loadout practice dart — longer 52mm straight barrel with radial grooves. Used at the 2024 PDC UK Open.",
    released:'2024-06-01',
  },
  {
    brand:'Target', name:'Nathan Aspinall G1 SP',
    weight:24, length_mm:50, diameter_mm:6.95,
    grip_type:'medium_knurl', barrel_shape:'torpedo', balance_point:'front',
    tungsten_pct:90, surface:'titanium_nitride',
    price_gbp:44.99, buy_url:'https://www.target-darts.co.uk/nathan-aspinall-g1-sp-steel-tip-darts',
    pro_player:'Nathan Aspinall',
    tags:'torpedo,front-weighted,titanium',
    description:"Aspinall's G1 — titanium nitride coated torpedo with cross-section milling. Front-weighted for 'The Asp' tunnel-vision front grip.",
    released:'2023-09-01',
  },
  {
    brand:'Target', name:'Nathan Aspinall G2 95%',
    weight:22, length_mm:50, diameter_mm:6.8,
    grip_type:'aggressive_knurl', barrel_shape:'torpedo', balance_point:'front',
    tungsten_pct:95, surface:'red_pvd',
    price_gbp:64.99, buy_url:'https://www.target-darts.co.uk/nathan-aspinall-g2-95-sp-steel-tip-darts',
    pro_player:'Nathan Aspinall',
    tags:'95-tungsten,red-pvd,precision',
    description:"95% tungsten G2 with red PVD in grip zones. CNC cross-section milling with radial rear groove. Aspinall's preferred competition spec.",
    released:'2024-02-01',
  },
  {
    brand:'Target', name:'Rob Cross Voltage Gen 2 SP',
    weight:21, length_mm:48, diameter_mm:6.4,
    grip_type:'fine_knurl', barrel_shape:'straight', balance_point:'middle',
    tungsten_pct:90, surface:'natural',
    price_gbp:34.99, buy_url:'https://www.target-darts.co.uk/rob-cross-voltage-gen-2-sp-steel-tip-darts',
    pro_player:'Rob Cross',
    tags:'21g,slim,straight,swiss-point',
    description:"Rob 'Voltage' Cross Gen 2 — slim 21g straight barrel at 48mm. Radial groove grip. Cross's preferred 21g competition spec.",
    released:'2021-06-01',
  },
  {
    brand:'Target', name:'Rob Cross 95K SP',
    weight:21, length_mm:48, diameter_mm:6.4,
    grip_type:'medium_knurl', barrel_shape:'straight', balance_point:'middle',
    tungsten_pct:95, surface:'natural',
    price_gbp:59.99, buy_url:'https://www.target-darts.co.uk/rob-cross-95k-sp-steel-tip-darts',
    pro_player:'Rob Cross',
    tags:'95-tungsten,21g,precision-slim',
    description:"Cross's premium 95K — 95% tungsten straight 48mm barrel, 6.4mm diameter. Ultra-slim for tight groupings.",
    released:'2024-03-01',
  },
  {
    brand:'Target', name:'Phil Taylor Power 9Five G10',
    weight:24, length_mm:53, diameter_mm:7.2,
    grip_type:'aggressive_knurl', barrel_shape:'straight', balance_point:'middle',
    tungsten_pct:90, surface:'nitride_coated',
    price_gbp:39.99, buy_url:'https://www.target-darts.co.uk/phil-taylor-power-9five-g10-steel-tip-darts',
    pro_player:'Phil Taylor',
    tags:'heavy,aggressive-grip,pro-spec,legacy',
    description:"The dart behind 16 World Championships. Straight barrel, aggressive knurl for precision front-grip throwers. Generation 10 edition.",
    released:'2024-01-01',
  },
  {
    brand:'Target', name:'Carrera 05 Titanium',
    weight:21, length_mm:47, diameter_mm:6.4,
    grip_type:'medium_knurl', barrel_shape:'torpedo', balance_point:'middle',
    tungsten_pct:90, surface:'titanium_nitride',
    price_gbp:29.99, buy_url:'https://www.target-darts.co.uk/carrera-05-titanium-steel-tip-darts',
    pro_player:null,
    tags:'versatile,beginner-friendly,touring,titanium',
    description:'Slim 47mm torpedo with titanium nitride coating. Excellent for medium-grip players seeking progressive weight distribution.',
    released:'2021-03-01',
  },
  {
    brand:'Target', name:'Agora A10',
    weight:16, length_mm:40, diameter_mm:5.8,
    grip_type:'micro_grip', barrel_shape:'teardrop', balance_point:'front',
    tungsten_pct:85, surface:'natural',
    price_gbp:24.99, buy_url:'https://www.target-darts.co.uk/agora-a10-steel-tip-darts',
    pro_player:null,
    tags:'lightweight,slim,micro-grip,small-hands',
    description:'Ultra-slim 16g teardrop for small-handed players with a light touch. Front taper aids natural release.',
    released:'2022-01-01',
  },
  {
    brand:'Target', name:'Darts 95',
    weight:22, length_mm:48, diameter_mm:6.2,
    grip_type:'fine_knurl', barrel_shape:'straight', balance_point:'middle',
    tungsten_pct:95, surface:'natural',
    price_gbp:52.99, buy_url:'https://www.target-darts.co.uk/darts-95-steel-tip-darts',
    pro_player:null,
    tags:'95-tungsten,slim,precision,advanced',
    description:'Target\'s 95% tungsten house barrel — slim 6.2mm straight profile, fine knurl, for advanced players requiring tight groupings.',
    released:'2023-01-01',
  },
  {
    brand:'Target', name:'Bolide 01',
    weight:20, length_mm:49, diameter_mm:6.3,
    grip_type:'fine_knurl', barrel_shape:'torpedo', balance_point:'middle',
    tungsten_pct:90, surface:'natural',
    price_gbp:28.99, buy_url:'https://www.target-darts.co.uk/bolide-01-steel-tip-darts',
    pro_player:null,
    tags:'torpedo,20g,fine,versatile',
    description:'Bolide torpedo with refined fine knurl. A great all-round 20g choice with a natural trajectory taper.',
    released:'2023-06-01',
  },
  {
    brand:'Target', name:'Vapor 8',
    weight:23, length_mm:51, diameter_mm:6.8,
    grip_type:'medium_knurl', barrel_shape:'straight', balance_point:'middle',
    tungsten_pct:80, surface:'natural',
    price_gbp:18.99, buy_url:'https://www.target-darts.co.uk/vapor-8-steel-tip-darts',
    pro_player:null,
    tags:'budget,80-tungsten,beginner,straight',
    description:'Entry-level straight barrel. 80% tungsten is wider for the same weight but great for beginners building their game.',
    released:'2022-03-01',
  },

  // ══════════════════════════════════════════
  // WINMAU
  // ══════════════════════════════════════════
  {
    brand:'Winmau', name:'MvG Exact 21.5g',
    weight:22, length_mm:53, diameter_mm:6.25,
    grip_type:'medium_knurl', barrel_shape:'straight', balance_point:'front',
    tungsten_pct:90, surface:'natural',
    price_gbp:44.99, buy_url:'https://winmau.com/products/mvg-exact-21-5g-steel-tip-darts',
    pro_player:'Michael van Gerwen',
    tags:'mvg,exact,slim,front,explosive',
    description:"MvG's personal spec — 53mm x 6.25mm straight barrel. Front-heavy for his explosive snap. Developed over 12 months to MvG's exact requirements.",
    released:'2023-09-01',
  },
  {
    brand:'Winmau', name:'Michael van Gerwen Spycraft',
    weight:23, length_mm:48, diameter_mm:6.8,
    grip_type:'medium_knurl', barrel_shape:'torpedo', balance_point:'front',
    tungsten_pct:97, surface:'natural',
    price_gbp:89.99, buy_url:'https://winmau.com/products/mvg-spycraft-steel-tip-darts',
    pro_player:'Michael van Gerwen',
    tags:'97-tungsten,premium,torpedo,front,ultra-slim',
    description:'97% tungsten torpedo — MvG premium tier. Front-heavy short barrel for explosive wrist-snap players.',
    released:'2022-04-01',
  },
  {
    brand:'Winmau', name:'Gary Anderson Phase 6',
    weight:23, length_mm:52, diameter_mm:7.0,
    grip_type:'medium_knurl', barrel_shape:'straight', balance_point:'middle',
    tungsten_pct:90, surface:'natural',
    price_gbp:39.99, buy_url:'https://winmau.com/products/gary-anderson-phase-6-steel-tip-darts',
    pro_player:'Gary Anderson',
    tags:'anderson,phase6,straight,23g,pendulum',
    description:'Anderson Phase 6 signature — two blue rings at front for his two World Championship wins. 52mm straight barrel for pendulum throwers.',
    released:'2023-05-01',
  },
  {
    brand:'Winmau', name:'Advance 500 Series',
    weight:24, length_mm:50, diameter_mm:6.8,
    grip_type:'medium_knurl', barrel_shape:'straight', balance_point:'middle',
    tungsten_pct:90, surface:'natural',
    price_gbp:27.99, buy_url:'https://winmau.com/products/advance-500-series-steel-tip-darts',
    pro_player:null,
    tags:'straight,touring,24g,value',
    description:'Winmau\'s touring standard — 50mm straight barrel with reliable medium knurl. Consistent performance at accessible price.',
    released:'2024-01-01',
  },
  {
    brand:'Winmau', name:'Prism Force 95',
    weight:22, length_mm:50, diameter_mm:6.5,
    grip_type:'fine_knurl', barrel_shape:'straight', balance_point:'middle',
    tungsten_pct:95, surface:'natural',
    price_gbp:49.99, buy_url:'https://winmau.com/products/prism-force-95-steel-tip-darts',
    pro_player:null,
    tags:'95-tungsten,fine,straight,slim',
    description:'95% tungsten Prism Force — slim straight barrel in fine knurl. Elite performance at 22g for pinpoint accuracy.',
    released:'2022-10-01',
  },
  {
    brand:'Winmau', name:'Sicario',
    weight:22, length_mm:49, diameter_mm:6.3,
    grip_type:'aggressive_knurl', barrel_shape:'straight', balance_point:'middle',
    tungsten_pct:90, surface:'pvd_coated',
    price_gbp:34.99, buy_url:'https://winmau.com/products/sicario-steel-tip-darts',
    pro_player:null,
    tags:'aggressive-grip,pvd,straight,powerful-grip',
    description:'Sicario — aggressive knurl in black PVD. Slim 6.3mm profile with deep bite for players who need maximum grip control.',
    released:'2022-07-01',
  },
  {
    brand:'Winmau', name:'Ton Machine',
    weight:24, length_mm:47, diameter_mm:7.1,
    grip_type:'shark_cut', barrel_shape:'torpedo', balance_point:'middle',
    tungsten_pct:90, surface:'natural',
    price_gbp:31.99, buy_url:'https://winmau.com/products/ton-machine-steel-tip-darts',
    pro_player:null,
    tags:'torpedo,shark,24g,solid',
    description:'Short torpedo with shark-cut rings for a secure lock. A reliable mid-weight for players who prefer a compact barrel.',
    released:'2021-06-01',
  },
  {
    brand:'Winmau', name:'Sniper Elite',
    weight:25, length_mm:55, diameter_mm:7.4,
    grip_type:'aggressive_knurl', barrel_shape:'straight', balance_point:'rear',
    tungsten_pct:90, surface:'pvd_coated',
    price_gbp:32.99, buy_url:'https://winmau.com/products/sniper-elite-steel-tip-darts',
    pro_player:null,
    tags:'heavy,rear-weighted,aggressive,large-hands',
    description:'Long 55mm heavy rear-weighted straight barrel for big hands. PVD coated for grip retention in extended sessions.',
    released:'2022-08-01',
  },
  {
    brand:'Winmau', name:'Steve Beaton Legacy',
    weight:22, length_mm:48, diameter_mm:6.5,
    grip_type:'medium_knurl', barrel_shape:'torpedo', balance_point:'middle',
    tungsten_pct:90, surface:'titanium_nitride',
    price_gbp:34.99, buy_url:'https://winmau.com/products/steve-beaton-legacy-steel-tip-darts',
    pro_player:'Steve Beaton',
    tags:'torpedo,titanium,mid-weight,classic',
    description:'Steve Beaton Legacy Edition — classic torpedo profile in gold/blue titanium nitride. Homage to the 1996 BDO World Champion.',
    released:'2025-01-01',
  },
  {
    brand:'Winmau', name:'Daryl Gurney SC 1.0',
    weight:23, length_mm:57, diameter_mm:6.6,
    grip_type:'fine_knurl', barrel_shape:'straight', balance_point:'rear',
    tungsten_pct:90, surface:'natural',
    price_gbp:36.99, buy_url:'https://winmau.com/products/daryl-gurney-sc-1-steel-tip-darts',
    pro_player:'Daryl Gurney',
    tags:'long-barrel,rear-weighted,large-hands,straight',
    description:"Gurney SC 1.0 — 2025's longest Winmau launch barrel at 57mm. Designed for large-handed players who need room to grip.",
    released:'2025-02-01',
  },

  // ══════════════════════════════════════════
  // HARROWS
  // ══════════════════════════════════════════
  {
    brand:'Harrows', name:'Ryan Searle Heavy Metal',
    weight:28, length_mm:55, diameter_mm:7.8,
    grip_type:'aggressive_knurl', barrel_shape:'straight', balance_point:'middle',
    tungsten_pct:90, surface:'natural',
    price_gbp:38.99, buy_url:'https://www.dartshopper.com/ryan-searle-heavy-metal-90-steel-tip-darts/',
    pro_player:'Ryan Searle',
    tags:'heavy,28g,big-hands,power',
    description:"Ryan 'Heavy Metal' Searle's signature — 28g straight barrel. For players who prefer a heavier dart for consistent trajectory.",
    released:'2023-08-01',
  },
  {
    brand:'Harrows', name:'Dave Chisnall Chizzy',
    weight:21, length_mm:46, diameter_mm:6.5,
    grip_type:'medium_knurl', barrel_shape:'straight', balance_point:'middle',
    tungsten_pct:90, surface:'natural',
    price_gbp:29.99, buy_url:'https://www.dartshopper.com/harrows-dave-chisnall-chizzy-90-steel-tip-darts/',
    pro_player:'Dave Chisnall',
    tags:'versatile,straight,tour-dart,21g',
    description:"Chizzy's personal spec: 46mm straight barrel with classic knurl pattern. A benchmark touring dart for mid-weight players.",
    released:'2022-02-01',
  },
  {
    brand:'Harrows', name:'Quantum Pro',
    weight:18, length_mm:44, diameter_mm:5.8,
    grip_type:'micro_grip', barrel_shape:'teardrop', balance_point:'front',
    tungsten_pct:85, surface:'natural',
    price_gbp:22.99, buy_url:'https://www.dartshopper.com/search/?q=harrows+quantum+pro',
    pro_player:null,
    tags:'lightweight,micro-grip,teardrop,small-hands',
    description:'Lightweight teardrop with micro-grip texture. Ideal for players with smaller hands or a featherlight touch.',
    released:'2020-06-01',
  },
  {
    brand:'Harrows', name:'Atomic Force',
    weight:26, length_mm:56, diameter_mm:7.8,
    grip_type:'shark_cut', barrel_shape:'bomb', balance_point:'middle',
    tungsten_pct:95, surface:'natural',
    price_gbp:49.99, buy_url:'https://www.dartshopper.com/search/?q=harrows+atomic+force',
    pro_player:null,
    tags:'heavy,bomb,shark,large-hands,95-tungsten',
    description:'Maximum mass bomb barrel for large-handed players. Shark-cut grip for secure hold even at maximum leverage.',
    released:'2021-09-01',
  },
  {
    brand:'Harrows', name:'Spina Nero 90%',
    weight:22, length_mm:50, diameter_mm:6.6,
    grip_type:'ringed', barrel_shape:'straight', balance_point:'middle',
    tungsten_pct:90, surface:'black_pvd',
    price_gbp:32.99, buy_url:'https://www.dartshopper.com/search/?q=harrows+spina+nero',
    pro_player:null,
    tags:'ringed,black,straight,mid-weight',
    description:'Spina Nero — black PVD straight barrel with alternating ringed grip zones. For players who use tactile rings as finger guides.',
    released:'2023-02-01',
  },
  {
    brand:'Harrows', name:'Dimension Zero 95%',
    weight:20, length_mm:47, diameter_mm:5.9,
    grip_type:'fine_knurl', barrel_shape:'torpedo', balance_point:'front',
    tungsten_pct:95, surface:'natural',
    price_gbp:54.99, buy_url:'https://www.dartshopper.com/search/?q=harrows+dimension+zero+95',
    pro_player:null,
    tags:'95-tungsten,slim,20g,precision,torpedo',
    description:'Ultra-slim 95% tungsten torpedo. At 5.9mm diameter it achieves extreme grouping for advanced precise players.',
    released:'2024-03-01',
  },

  // ══════════════════════════════════════════
  // RED DRAGON
  // ══════════════════════════════════════════
  {
    brand:'Red Dragon', name:'Luke Humphries TX1',
    weight:22, length_mm:43, diameter_mm:7.1,
    grip_type:'medium_knurl', barrel_shape:'torpedo', balance_point:'front',
    tungsten_pct:90, surface:'natural',
    price_gbp:44.99, buy_url:'https://www.reddragondarts.com/products/luke-humphries-tx1-darts',
    pro_player:'Luke Humphries',
    tags:'torpedo,front-weighted,short,22g,world-champ-2024',
    description:"Cool Hand Luke's TX1 — short 43mm torpedo at 7.1mm. Front-loaded for his clean efficient release. 2024 World Champion spec.",
    released:'2023-11-01',
  },
  {
    brand:'Red Dragon', name:'Luke Humphries TX3',
    weight:22, length_mm:50, diameter_mm:6.3,
    grip_type:'fine_knurl', barrel_shape:'straight', balance_point:'middle',
    tungsten_pct:90, surface:'natural',
    price_gbp:39.99, buy_url:'https://www.reddragondarts.com/products/luke-humphries-tx3-darts',
    pro_player:'Luke Humphries',
    tags:'straight,22g,slim,atomised',
    description:"Humphries TX3 — slim 50mm straight barrel variant. Atomised grip zones for fast, smooth release.",
    released:'2024-08-01',
  },
  {
    brand:'Red Dragon', name:'Gerwyn Price Blue Originals',
    weight:23, length_mm:51, diameter_mm:6.4,
    grip_type:'medium_knurl', barrel_shape:'straight', balance_point:'front',
    tungsten_pct:90, surface:'natural',
    price_gbp:38.99, buy_url:'https://www.reddragondarts.com/products/gerwyn-price-blue-originals-darts',
    pro_player:'Gerwyn Price',
    tags:'front,23g,razor-edge-groove,iceman',
    description:"The Iceman's stalwart — modified Razor Edge groove pattern. 23g straight 51mm x 6.4mm. Precision engineered to Price's exact spec.",
    released:'2023-03-01',
  },
  {
    brand:'Red Dragon', name:'Gerwyn Price Midnight Edition',
    weight:23, length_mm:51, diameter_mm:6.4,
    grip_type:'aggressive_knurl', barrel_shape:'straight', balance_point:'front',
    tungsten_pct:90, surface:'black_pvd',
    price_gbp:42.99, buy_url:'https://www.reddragondarts.com/products/gerwyn-price-midnight-edition-darts',
    pro_player:'Gerwyn Price',
    tags:'black,front,23g,aggressive',
    description:'Midnight Edition Iceman — same 51mm x 6.4mm spec in stealth black PVD with enhanced knurling.',
    released:'2023-11-01',
  },
  {
    brand:'Red Dragon', name:'Peter Wright Snakebite Mamba',
    weight:22, length_mm:50, diameter_mm:6.8,
    grip_type:'micro_grip', barrel_shape:'torpedo', balance_point:'middle',
    tungsten_pct:90, surface:'coloured_pvd',
    price_gbp:44.99, buy_url:'https://www.reddragondarts.com/products/peter-wright-snakebite-mamba-darts',
    pro_player:'Peter Wright',
    tags:'torpedo,snakebite,coloured,micro-grip',
    description:'Snakebite signature torpedo with micro-grip. Wright uses a relaxed three-finger grip — this barrel suits the same.',
    released:'2023-01-01',
  },
  {
    brand:'Red Dragon', name:'Peter Wright Snakebite 90%',
    weight:22, length_mm:48, diameter_mm:6.5,
    grip_type:'fine_knurl', barrel_shape:'torpedo', balance_point:'front',
    tungsten_pct:90, surface:'pvd_coated',
    price_gbp:39.99, buy_url:'https://www.reddragondarts.com/products/peter-wright-snakebite-darts',
    pro_player:'Peter Wright',
    tags:'torpedo,snakebite,fine,front',
    description:"Wright's 2023 comp dart — short 48mm torpedo in fine knurl. Front-balanced for his fluid arc from above.",
    released:'2023-09-01',
  },
  {
    brand:'Red Dragon', name:'Jonny Clayton Ferret Ignite',
    weight:19, length_mm:45, diameter_mm:6.2,
    grip_type:'fine_knurl', barrel_shape:'straight', balance_point:'front',
    tungsten_pct:90, surface:'natural',
    price_gbp:31.99, buy_url:'https://www.reddragondarts.com/products/jonny-clayton-ferret-ignite-darts',
    pro_player:'Jonny Clayton',
    tags:'lightweight,front,slim,quick-release',
    description:"Clayton's Ferret spec — 19g front-weighted 45mm barrel. For fast wrist action and shorter grip players.",
    released:'2022-07-01',
  },
  {
    brand:'Red Dragon', name:'Jonny Clayton Original 2.0',
    weight:22, length_mm:46, diameter_mm:6.5,
    grip_type:'medium_knurl', barrel_shape:'torpedo', balance_point:'front',
    tungsten_pct:90, surface:'natural',
    price_gbp:36.99, buy_url:'https://www.reddragondarts.com/products/jonny-clayton-original-2-darts',
    pro_player:'Jonny Clayton',
    tags:'torpedo,front,re-shaped-nose,anti-bounce',
    description:"Clayton's 2024 update — reshaped nose profile for fewer bounce-outs. Front-weighted torpedo with updated knurl.",
    released:'2024-01-01',
  },
  {
    brand:'Red Dragon', name:'Freestyle 16',
    weight:24, length_mm:50, diameter_mm:7.0,
    grip_type:'ringed', barrel_shape:'bomb', balance_point:'middle',
    tungsten_pct:90, surface:'natural',
    price_gbp:35.99, buy_url:'https://www.reddragondarts.com/products/freestyle-16-darts',
    pro_player:null,
    tags:'bomb,ringed,mid-heavy,positional',
    description:'Bomb barrel with deep ringed grip zones. Excellent for mid-barrel grippers who like tactile positional feedback.',
    released:'2021-07-01',
  },
  {
    brand:'Red Dragon', name:'Javelin Tungsten',
    weight:20, length_mm:47, diameter_mm:6.2,
    grip_type:'fine_knurl', barrel_shape:'torpedo', balance_point:'front',
    tungsten_pct:90, surface:'natural',
    price_gbp:26.99, buy_url:'https://www.reddragondarts.com/products/javelin-tungsten-darts',
    pro_player:null,
    tags:'torpedo,20g,slim,front,value',
    description:'Javelin Tungsten — entry into the Red Dragon performance range. Clean fine-knurl torpedo at 20g for developing players.',
    released:'2022-09-01',
  },

  // ══════════════════════════════════════════
  // UNICORN
  // ══════════════════════════════════════════
  {
    brand:'Unicorn', name:'Gary Anderson Phase 6',
    weight:23, length_mm:52, diameter_mm:7.0,
    grip_type:'medium_knurl', barrel_shape:'straight', balance_point:'middle',
    tungsten_pct:90, surface:'natural',
    price_gbp:39.99, buy_url:'https://www.dartshopper.com/unicorn-gary-anderson-phase-6-90-steel-tip-darts/',
    pro_player:'Gary Anderson',
    tags:'straight,23g,pendulum,two-time-world-champ',
    description:"Anderson Phase 6 — two blue rings representing his two World titles. 52mm straight for calm pendulum throwers.",
    released:'2023-05-01',
  },
  {
    brand:'Unicorn', name:'Phase 5 Striker 90%',
    weight:21, length_mm:49, diameter_mm:6.6,
    grip_type:'fine_knurl', barrel_shape:'straight', balance_point:'middle',
    tungsten_pct:90, surface:'natural',
    price_gbp:32.99, buy_url:'https://www.dartshopper.com/search/?q=unicorn+phase+5+striker',
    pro_player:null,
    tags:'straight,fine,versatile,21g',
    description:'Phase 5 Striker — clean versatile straight barrel popular on the circuit. Suits a wide range of grip styles.',
    released:'2022-03-01',
  },
  {
    brand:'Unicorn', name:'Ballista Style 1',
    weight:21, length_mm:48, diameter_mm:6.4,
    grip_type:'shark_cut', barrel_shape:'straight', balance_point:'middle',
    tungsten_pct:90, surface:'natural',
    price_gbp:29.99, buy_url:'https://www.dartshopper.com/search/?q=unicorn+ballista+style+1',
    pro_player:null,
    tags:'shark-cut,symmetric,21g,hex-grip',
    description:'Ballista Style 1 — hex-cross section barrels with shark-cut grip. Named after the ancient siege weapon for its precision.',
    released:'2023-07-01',
  },
  {
    brand:'Unicorn', name:'Ballista Style 3 70%',
    weight:20, length_mm:49, diameter_mm:6.8,
    grip_type:'ringed', barrel_shape:'straight', balance_point:'middle',
    tungsten_pct:70, surface:'natural',
    price_gbp:16.99, buy_url:'https://www.dartshopper.com/search/?q=unicorn+ballista+style+3',
    pro_player:null,
    tags:'budget,70-tungsten,beginner,ringed',
    description:'Ballista Style 3 70% — great budget option for beginners. Wider at 70% tungsten, ringed grip, comfortable to learn with.',
    released:'2022-01-01',
  },
  {
    brand:'Unicorn', name:'Contender 90%',
    weight:20, length_mm:48, diameter_mm:6.3,
    grip_type:'fine_knurl', barrel_shape:'torpedo', balance_point:'middle',
    tungsten_pct:90, surface:'natural',
    price_gbp:24.99, buy_url:'https://www.dartshopper.com/search/?q=unicorn+contender+90',
    pro_player:null,
    tags:'torpedo,fine,20g,touring,value',
    description:'Unicorn Contender 90% — compact torpedo in fine knurl. A touring standard for club-level intermediate players.',
    released:'2021-08-01',
  },
  {
    brand:'Unicorn', name:'Sigma Pro 95%',
    weight:22, length_mm:50, diameter_mm:6.2,
    grip_type:'fine_knurl', barrel_shape:'straight', balance_point:'middle',
    tungsten_pct:95, surface:'natural',
    price_gbp:59.99, buy_url:'https://www.dartshopper.com/search/?q=unicorn+sigma+pro+95',
    pro_player:null,
    tags:'95-tungsten,slim,precision,advanced',
    description:'Sigma Pro 95% — ultra-slim 6.2mm straight barrel for advanced players demanding maximum grouping.',
    released:'2023-10-01',
  },
  {
    brand:'Unicorn', name:'Core XL Plus 90%',
    weight:25, length_mm:53, diameter_mm:7.3,
    grip_type:'aggressive_knurl', barrel_shape:'straight', balance_point:'rear',
    tungsten_pct:90, surface:'natural',
    price_gbp:34.99, buy_url:'https://www.dartshopper.com/search/?q=unicorn+core+xl+plus',
    pro_player:null,
    tags:'heavy,25g,rear-weighted,aggressive,large-hands',
    description:'Core XL Plus — 53mm heavy straight barrel with aggressive knurl. Rear-balanced for rear-grip big-handed players.',
    released:'2022-05-01',
  },

  // ══════════════════════════════════════════
  // MISSION DARTS
  // ══════════════════════════════════════════
  {
    brand:'Mission', name:'Mike De Decker Silver',
    weight:24, length_mm:60, diameter_mm:7.0,
    grip_type:'ringed', barrel_shape:'straight', balance_point:'rear',
    tungsten_pct:95, surface:'natural',
    price_gbp:69.99, buy_url:'https://www.dartshopper.com/search/?q=mission+mike+de+decker',
    pro_player:'Mike De Decker',
    tags:'longest-barrel,60mm,rear,rings,95-tungsten',
    description:"Mike De Decker's signature — the longest barrel on the PDC circuit at 60mm. Constant ring grip, rear-balanced for his unique grip.",
    released:'2024-06-01',
  },
  {
    brand:'Mission', name:'Archon 97.5%',
    weight:23, length_mm:52, diameter_mm:6.3,
    grip_type:'aggressive_knurl', barrel_shape:'straight', balance_point:'middle',
    tungsten_pct:98, surface:'black_pvd',
    price_gbp:79.99, buy_url:'https://www.dartshopper.com/search/?q=mission+archon',
    pro_player:null,
    tags:'97-tungsten,premium,slim,aggressive',
    description:'Archon 97.5% — Mission\'s elite tier. Ultra-slim 6.3mm black barrel for professionals demanding the tightest possible groupings.',
    released:'2024-01-01',
  },
  {
    brand:'Mission', name:'Horus 97.5%',
    weight:22, length_mm:51, diameter_mm:6.1,
    grip_type:'fine_knurl', barrel_shape:'torpedo', balance_point:'front',
    tungsten_pct:98, surface:'bronze_electro',
    price_gbp:74.99, buy_url:'https://www.dartshopper.com/search/?q=mission+horus',
    pro_player:null,
    tags:'97-tungsten,slim,torpedo,front,premium',
    description:'Horus 97.5% — ultra-high density torpedo in bronze electro finish. Front-weighted at 6.1mm for advanced precise front-grip players.',
    released:'2023-10-01',
  },
  {
    brand:'Mission', name:'Komodo R',
    weight:25, length_mm:54, diameter_mm:7.5,
    grip_type:'shark_cut', barrel_shape:'shark', balance_point:'rear',
    tungsten_pct:90, surface:'pvd_coated',
    price_gbp:38.99, buy_url:'https://www.dartshopper.com/search/?q=mission+komodo+r',
    pro_player:null,
    tags:'heavy,shark,rear-weighted,large-hands',
    description:'Shark-cut barrel for maximum grip. Rear-weighted for rear-grip players with large hands and powerful throws.',
    released:'2022-04-01',
  },
  {
    brand:'Mission', name:'Nightfall 90%',
    weight:25, length_mm:53, diameter_mm:7.4,
    grip_type:'medium_knurl', barrel_shape:'straight', balance_point:'rear',
    tungsten_pct:90, surface:'black_pvd',
    price_gbp:29.99, buy_url:'https://www.dartshopper.com/search/?q=mission+nightfall',
    pro_player:null,
    tags:'heavy,black,rear,straight,25g',
    description:'Nightfall — 25g rear-weighted straight in black/blue PVD. For players who throw heavy with a rear preference.',
    released:'2021-05-01',
  },
  {
    brand:'Mission', name:'Crypt M1',
    weight:23, length_mm:49, diameter_mm:6.8,
    grip_type:'aggressive_knurl', barrel_shape:'bomb', balance_point:'middle',
    tungsten_pct:90, surface:'black_gold',
    price_gbp:33.99, buy_url:'https://www.dartshopper.com/search/?q=mission+crypt',
    pro_player:null,
    tags:'bomb,aggressive,black-gold,23g',
    description:'Crypt M1 — barrel with deep aggressive knurl in black & gold. Bomb shape gives a tactile wider mid-section for grip.',
    released:'2023-06-01',
  },
  {
    brand:'Mission', name:'F300',
    weight:21, length_mm:46, diameter_mm:6.4,
    grip_type:'fine_knurl', barrel_shape:'teardrop', balance_point:'front',
    tungsten_pct:90, surface:'natural',
    price_gbp:26.99, buy_url:'https://www.dartshopper.com/search/?q=mission+f300',
    pro_player:null,
    tags:'front,teardrop,fine,versatile,21g',
    description:'Fine-knurl teardrop with subtle front taper. Suits players who find the sweet spot naturally toward the dart tip.',
    released:'2021-05-01',
  },
  {
    brand:'Mission', name:'Saturn Hyperion',
    weight:20, length_mm:47, diameter_mm:6.1,
    grip_type:'micro_grip', barrel_shape:'torpedo', balance_point:'front',
    tungsten_pct:90, surface:'natural',
    price_gbp:31.99, buy_url:'https://www.dartshopper.com/search/?q=mission+saturn+hyperion',
    pro_player:null,
    tags:'slim,micro-grip,torpedo,20g,compact',
    description:'Saturn Hyperion — ultra-slim 6.1mm micro-grip torpedo. For players with smaller hands or a delicate front-touch grip.',
    released:'2023-08-01',
  },

  // ══════════════════════════════════════════
  // LOXLEY
  // ══════════════════════════════════════════
  {
    brand:'Loxley', name:'Izzy Classic',
    weight:20, length_mm:44, diameter_mm:6.2,
    grip_type:'smooth', barrel_shape:'bullet', balance_point:'middle',
    tungsten_pct:90, surface:'natural',
    price_gbp:28.99, buy_url:'https://www.dartshopper.com/search/?q=loxley+izzy+classic',
    pro_player:'Fallon Sherrock',
    tags:'smooth,bullet,20g,fallon-inspired',
    description:'Sherrock-influenced smooth bullet barrel. For players who develop grip through finger contact alone — no knurl needed.',
    released:'2021-12-01',
  },
  {
    brand:'Loxley', name:'Carbon 6',
    weight:22, length_mm:50, diameter_mm:6.5,
    grip_type:'medium_knurl', barrel_shape:'straight', balance_point:'middle',
    tungsten_pct:92, surface:'carbon_fibre_wrapped',
    price_gbp:52.99, buy_url:'https://www.dartshopper.com/search/?q=loxley+carbon+6',
    pro_player:null,
    tags:'carbon,premium,92-tungsten,unique-texture',
    description:'Carbon-fibre wrapped 92% tungsten. Woven fibre provides grip without traditional machining — unique texture and feel.',
    released:'2023-07-01',
  },
  {
    brand:'Loxley', name:'Featherweight 14g',
    weight:14, length_mm:38, diameter_mm:5.2,
    grip_type:'micro_grip', barrel_shape:'teardrop', balance_point:'front',
    tungsten_pct:90, surface:'natural',
    price_gbp:32.99, buy_url:'https://www.dartshopper.com/search/?q=loxley+featherweight',
    pro_player:null,
    tags:'ultra-lightweight,14g,small-hands,teardrop',
    description:'Featherweight 14g — Loxley\'s lightest barrel. Tiny 5.2mm teardrop for players with very small hands or who need minimal weight.',
    released:'2022-08-01',
  },
  {
    brand:'Loxley', name:'George 90%',
    weight:24, length_mm:50, diameter_mm:7.0,
    grip_type:'fine_knurl', barrel_shape:'straight', balance_point:'middle',
    tungsten_pct:90, surface:'natural',
    price_gbp:34.99, buy_url:'https://www.dartshopper.com/search/?q=loxley+george',
    pro_player:null,
    tags:'straight,24g,fine,touring',
    description:'George 90% — Loxley\'s touring standard. Reliable 50mm straight with fine knurl for a consistent all-round dart.',
    released:'2023-04-01',
  },

  // ══════════════════════════════════════════
  // SHOT DARTS (NZ)
  // ══════════════════════════════════════════
  {
    brand:'Shot', name:'Tribal Weapon 4',
    weight:23, length_mm:50, diameter_mm:7.0,
    grip_type:'aggressive_knurl', barrel_shape:'straight', balance_point:'middle',
    tungsten_pct:90, surface:'natural',
    price_gbp:38.99, buy_url:'https://www.dartshopper.com/search/?q=shot+tribal+weapon+4',
    pro_player:null,
    tags:'new-zealand,handcrafted,aggressive,tribal',
    description:'Tribal Weapon 4 — handcrafted in NZ. 90% tungsten straight barrel with precision aggressive grip. Centre-balanced.',
    released:'2022-09-01',
  },
  {
    brand:'Shot', name:'Warrior Rutene',
    weight:24, length_mm:50, diameter_mm:7.2,
    grip_type:'shark_cut', barrel_shape:'torpedo', balance_point:'front',
    tungsten_pct:90, surface:'natural',
    price_gbp:44.99, buy_url:'https://www.dartshopper.com/search/?q=shot+warrior+rutene',
    pro_player:null,
    tags:'new-zealand,shark,front,torpedo,handcrafted',
    description:'Warrior Rutene — NZ handcrafted torpedo with wide shark grip. Front-balanced for front-grip power players.',
    released:'2021-06-01',
  },
  {
    brand:'Shot', name:'Tribal Weapon 1',
    weight:22, length_mm:48, diameter_mm:6.8,
    grip_type:'ringed', barrel_shape:'bomb', balance_point:'middle',
    tungsten_pct:90, surface:'natural',
    price_gbp:36.99, buy_url:'https://www.dartshopper.com/search/?q=shot+tribal+weapon+1',
    pro_player:null,
    tags:'new-zealand,ringed,bomb,22g',
    description:'Tribal Weapon 1 — ringed bomb barrel, handcrafted in NZ. Deep ring grip at the finger contact zone.',
    released:'2022-03-01',
  },
  {
    brand:'Shot', name:'Zen Series Liang Qing',
    weight:20, length_mm:46, diameter_mm:6.2,
    grip_type:'fine_knurl', barrel_shape:'torpedo', balance_point:'front',
    tungsten_pct:90, surface:'natural',
    price_gbp:42.99, buy_url:'https://www.dartshopper.com/search/?q=shot+zen+liang+qing',
    pro_player:null,
    tags:'zen,new-zealand,20g,torpedo,slim',
    description:'Zen Liang Qing — Shot\'s meditation-series torpedo. Slim 6.2mm, front-weighted, for players with a calm deliberate throw.',
    released:'2023-05-01',
  },

  // ══════════════════════════════════════════
  // DESIGNA
  // ══════════════════════════════════════════
  {
    brand:'Designa', name:'Mach 1 90%',
    weight:22, length_mm:48, diameter_mm:6.6,
    grip_type:'medium_knurl', barrel_shape:'torpedo', balance_point:'middle',
    tungsten_pct:90, surface:'natural',
    price_gbp:26.99, buy_url:'https://www.dartshopper.com/search/?q=designa+mach+1',
    pro_player:null,
    tags:'torpedo,value,90-tungsten,versatile',
    description:'Mach 1 90% — Designa\'s popular all-round torpedo. Excellent value for intermediate players upgrading from brass.',
    released:'2022-01-01',
  },
  {
    brand:'Designa', name:'Specialist 95%',
    weight:21, length_mm:49, diameter_mm:6.2,
    grip_type:'fine_knurl', barrel_shape:'straight', balance_point:'middle',
    tungsten_pct:95, surface:'natural',
    price_gbp:42.99, buy_url:'https://www.dartshopper.com/search/?q=designa+specialist+95',
    pro_player:null,
    tags:'95-tungsten,slim,fine,precision',
    description:'Specialist 95% — Designa\'s precision tier. Ultra-slim 6.2mm straight barrel for advanced players who demand tight groupings.',
    released:'2023-06-01',
  },
  {
    brand:'Designa', name:'Assassin 90%',
    weight:24, length_mm:51, diameter_mm:7.0,
    grip_type:'aggressive_knurl', barrel_shape:'straight', balance_point:'middle',
    tungsten_pct:90, surface:'black_pvd',
    price_gbp:29.99, buy_url:'https://www.dartshopper.com/search/?q=designa+assassin',
    pro_player:null,
    tags:'aggressive,black,straight,24g',
    description:'Assassin 90% — aggressive knurl straight barrel in black PVD. For grip-focused players who need maximum hold at 24g.',
    released:'2022-10-01',
  },

  // ══════════════════════════════════════════
  // BULLS DARTS
  // ══════════════════════════════════════════
  {
    brand:"Bull's", name:'Martin Schindler The Wall G3',
    weight:22, length_mm:49, diameter_mm:6.5,
    grip_type:'aggressive_knurl', barrel_shape:'straight', balance_point:'middle',
    tungsten_pct:90, surface:'black_pvd',
    price_gbp:39.99, buy_url:'https://www.dartshopper.com/search/?q=bulls+martin+schindler+g3',
    pro_player:'Martin Schindler',
    tags:'the-wall,signature,aggressive,black',
    description:"Schindler's G3 — 90% tungsten with black PVD front/centre. 'The Wall Grip' shark-cut rear section for optimal control.",
    released:'2024-04-01',
  },
  {
    brand:"Bull's", name:'Powerflight 95% Slim',
    weight:20, length_mm:48, diameter_mm:5.9,
    grip_type:'fine_knurl', barrel_shape:'torpedo', balance_point:'front',
    tungsten_pct:95, surface:'natural',
    price_gbp:47.99, buy_url:'https://www.dartshopper.com/search/?q=bulls+powerflight+95',
    pro_player:null,
    tags:'95-tungsten,slim,torpedo,20g,precision',
    description:"Bull's Powerflight 95% — ultra-slim 5.9mm torpedo at 20g. For players with small-to-medium hands who want maximum precision.",
    released:'2023-08-01',
  },
  {
    brand:"Bull's", name:'Fortuna 90%',
    weight:23, length_mm:51, diameter_mm:7.0,
    grip_type:'medium_knurl', barrel_shape:'torpedo', balance_point:'middle',
    tungsten_pct:90, surface:'natural',
    price_gbp:28.99, buy_url:'https://www.dartshopper.com/search/?q=bulls+fortuna+90',
    pro_player:null,
    tags:'torpedo,23g,medium-knurl,value',
    description:"Bull's Fortuna 90% — reliable 23g torpedo with classic medium knurl. A solid choice for intermediate players.",
    released:'2022-06-01',
  },

  // ══════════════════════════════════════════
  // ONE80 DARTS
  // ══════════════════════════════════════════
  {
    brand:'One80', name:'Luxor Gamma 23g',
    weight:23, length_mm:51, diameter_mm:7.0,
    grip_type:'medium_knurl', barrel_shape:'torpedo', balance_point:'middle',
    tungsten_pct:90, surface:'natural',
    price_gbp:34.99, buy_url:'https://www.dartshopper.com/search/?q=one80+luxor+gamma',
    pro_player:null,
    tags:'torpedo,23g,versatile',
    description:'One80 Luxor Gamma — 51mm torpedo with medium knurl. Versatile mid-weight dart for a wide range of players.',
    released:'2023-01-01',
  },
  {
    brand:'One80', name:'Beau Greaves HD',
    weight:21, length_mm:44, diameter_mm:7.8,
    grip_type:'medium_knurl', barrel_shape:'bomb', balance_point:'middle',
    tungsten_pct:90, surface:'natural',
    price_gbp:42.99, buy_url:'https://www.dartshopper.com/search/?q=one80+beau+greaves',
    pro_player:'Beau Greaves',
    tags:'bomb,female-champion,21g,compact',
    description:"Beau Greaves HD — 44mm bomb barrel for the multiple BDO Women's World Champion. Compact and powerful.",
    released:'2023-09-01',
  },
  {
    brand:'One80', name:'Vaelkris V01 90%',
    weight:22, length_mm:50, diameter_mm:6.5,
    grip_type:'fine_knurl', barrel_shape:'straight', balance_point:'middle',
    tungsten_pct:90, surface:'natural',
    price_gbp:32.99, buy_url:'https://www.dartshopper.com/search/?q=one80+vaelkris',
    pro_player:null,
    tags:'straight,fine,22g,value',
    description:'One80 Vaelkris V01 — clean fine-knurl straight at 22g. Value performance for intermediate players.',
    released:'2023-04-01',
  },
  {
    brand:'One80', name:'Signature FB III',
    weight:23, length_mm:52, diameter_mm:6.8,
    grip_type:'aggressive_knurl', barrel_shape:'straight', balance_point:'rear',
    tungsten_pct:90, surface:'pvd_coated',
    price_gbp:44.99, buy_url:'https://www.dartshopper.com/search/?q=one80+signature+fb',
    pro_player:null,
    tags:'aggressive,rear,straight,23g',
    description:'Signature FB III — aggressive rear-biased straight barrel in PVD. For grip-heavy rear players.',
    released:'2022-11-01',
  },

  // ══════════════════════════════════════════
  // COSMO DARTS (Japanese)
  // ══════════════════════════════════════════
  {
    brand:'Cosmo', name:'Fit Point Advance',
    weight:21, length_mm:47, diameter_mm:6.2,
    grip_type:'shark_cut', barrel_shape:'torpedo', balance_point:'front',
    tungsten_pct:90, surface:'natural',
    price_gbp:39.99, buy_url:'https://www.dartshopper.com/search/?q=cosmo+fit+point',
    pro_player:null,
    tags:'japanese,fit-point,shark,torpedo',
    description:"Cosmo's Fit Point system torpedo — Japanese precision engineering with shark-cut grip. Compatible with their proprietary flight system.",
    released:'2023-02-01',
  },
  {
    brand:'Cosmo', name:'Discovery 25g',
    weight:25, length_mm:53, diameter_mm:7.5,
    grip_type:'aggressive_knurl', barrel_shape:'straight', balance_point:'rear',
    tungsten_pct:90, surface:'natural',
    price_gbp:34.99, buy_url:'https://www.dartshopper.com/search/?q=cosmo+discovery',
    pro_player:null,
    tags:'heavy,rear,straight,japanese,25g',
    description:'Cosmo Discovery 25g — heavy rear-weighted straight barrel. Japanese precision manufacturing for consistent weighted throws.',
    released:'2022-07-01',
  },

  // ══════════════════════════════════════════
  // DATADART
  // ══════════════════════════════════════════
  {
    brand:'Datadart', name:'Barracuda 90%',
    weight:22, length_mm:50, diameter_mm:6.5,
    grip_type:'shark_cut', barrel_shape:'torpedo', balance_point:'middle',
    tungsten_pct:90, surface:'natural',
    price_gbp:27.99, buy_url:'https://www.dartshopper.com/search/?q=datadart+barracuda',
    pro_player:null,
    tags:'shark,torpedo,value,22g',
    description:'Datadart Barracuda 90% — shark-cut torpedo barrel at good value. Reliable grip performance for mid-weight players.',
    released:'2022-04-01',
  },
  {
    brand:'Datadart', name:'Dart Devil 25g',
    weight:25, length_mm:53, diameter_mm:7.4,
    grip_type:'aggressive_knurl', barrel_shape:'straight', balance_point:'rear',
    tungsten_pct:90, surface:'pvd_coated',
    price_gbp:29.99, buy_url:'https://www.dartshopper.com/search/?q=datadart+dart+devil',
    pro_player:null,
    tags:'heavy,rear,25g,aggressive,pvd',
    description:'Dart Devil 25g — heavy straight barrel with PVD coating. Rear-loaded for players who prefer a heavier rear-grip dart.',
    released:'2021-10-01',
  },
];

// ─────────────────────────────────────────────
// PRO PLAYER DATABASE
// ─────────────────────────────────────────────
const PRO_PLAYERS = [
  {
    id:'littler', name:'Luke Littler', nickname:'The Nuke',
    country:'England', emoji:'💥',
    height_cm:175, grip_style:'front_three_finger', grip_fingers:3,
    preferred_weight:23, preferred_length:50, preferred_grip:'medium_knurl',
    throw_style:'explosive_snap', release_angle:'high',
    description:"'The Nuke' grips at the barrel front with three fingers, unleashing an explosive wrist snap at just 17. His black PVD 23g straight suits fast, front-grip players.",
    achievements:'2025 PDC World Champion (youngest-ever at 17), 2024 Masters',
    dart_name:'Target Luke Littler Gen 1',
  },
  {
    id:'humphries', name:'Luke Humphries', nickname:'Cool Hand Luke',
    country:'England', emoji:'❄️',
    height_cm:182, grip_style:'front_pinch', grip_fingers:3,
    preferred_weight:22, preferred_length:43, preferred_grip:'medium_knurl',
    throw_style:'smooth_arc', release_angle:'medium',
    description:"Humphries uses a short compact front-pinch with a smooth, efficient arc. His short TX1 torpedo at 22g rewards calm, deliberate players.",
    achievements:'2024 PDC World Champion, 2024 Premier League Champion',
    dart_name:'Red Dragon Luke Humphries TX1',
  },
  {
    id:'mvg', name:'Michael van Gerwen', nickname:'The Green Machine',
    country:'Netherlands', emoji:'🟢',
    height_cm:180, grip_style:'front_pinch', grip_fingers:3,
    preferred_weight:21, preferred_length:53, preferred_grip:'medium_knurl',
    throw_style:'explosive_snap', release_angle:'high',
    description:"MvG grips at the very front with explosive wrist snap. His 21.5g Exact dart — 53mm x 6.25mm — rewards front-pinch players with fast arm speed.",
    achievements:'3x World Champion, 230+ PDC event wins, all-time greatest',
    dart_name:'Winmau MvG Exact 21.5g',
  },
  {
    id:'taylor', name:'Phil Taylor', nickname:'The Power',
    country:'England', emoji:'⚡',
    height_cm:182, grip_style:'three_finger_balanced', grip_fingers:3,
    preferred_weight:26, preferred_length:53, preferred_grip:'aggressive_knurl',
    throw_style:'pendulum', release_angle:'medium',
    description:'Taylor uses an upright pendulum style with firm three-finger grip and aggressive knurl. Heavier darts reward his raw trajectory power.',
    achievements:'16x World Champion, all-time record holder',
    dart_name:'Target Phil Taylor Power 9Five G10',
  },
  {
    id:'cross', name:'Rob Cross', nickname:'Voltage',
    country:'England', emoji:'⚡',
    height_cm:183, grip_style:'front_pinch', grip_fingers:3,
    preferred_weight:21, preferred_length:48, preferred_grip:'fine_knurl',
    throw_style:'smooth_arc', release_angle:'medium',
    description:"'Voltage' Cross uses a front-pinch with a smooth, calculated arc. Slim 21g straight barrel at 48mm — fine knurl for his relaxed contact.",
    achievements:'2018 PDC World Champion, 2022 World Grand Prix',
    dart_name:'Target Rob Cross Voltage Gen 2 SP',
  },
  {
    id:'wright', name:'Peter Wright', nickname:'Snakebite',
    country:'Scotland', emoji:'🐍',
    height_cm:183, grip_style:'relaxed_three_finger', grip_fingers:3,
    preferred_weight:22, preferred_length:50, preferred_grip:'micro_grip',
    throw_style:'smooth_arc', release_angle:'medium',
    description:"Wright uses a relaxed three-finger torpedo grip with micro texture. His fluid arc is consistent and unhurried — suits similar compact grippers.",
    achievements:'2x PDC World Champion (2020, 2022)',
    dart_name:'Red Dragon Peter Wright Snakebite Mamba',
  },
  {
    id:'price', name:'Gerwyn Price', nickname:'The Iceman',
    country:'Wales', emoji:'🧊',
    height_cm:185, grip_style:'deliberate_three_finger', grip_fingers:3,
    preferred_weight:23, preferred_length:51, preferred_grip:'medium_knurl',
    throw_style:'controlled_power', release_angle:'medium_high',
    description:"'Iceman' Price delivers controlled power with a deliberate front-biased grip. His 23g x 51mm x 6.4mm barrel rewards measured powerful players.",
    achievements:'2021 PDC World Champion, European Champion',
    dart_name:'Red Dragon Gerwyn Price Blue Originals',
  },
  {
    id:'anderson', name:'Gary Anderson', nickname:'The Flying Scotsman',
    country:'Scotland', emoji:'✈️',
    height_cm:185, grip_style:'pendulum_relaxed', grip_fingers:3,
    preferred_weight:23, preferred_length:52, preferred_grip:'medium_knurl',
    throw_style:'pendulum', release_angle:'low',
    description:"Anderson throws with a wide relaxed pendulum from height. At 6'1\" his angle is low — taller pendulum players relate strongly to his biomechanics.",
    achievements:'2x PDC World Champion (2015, 2016)',
    dart_name:'Unicorn Gary Anderson Phase 6',
  },
  {
    id:'sherrock', name:'Fallon Sherrock', nickname:'Queen of the Palace',
    country:'England', emoji:'👑',
    height_cm:168, grip_style:'light_front_pinch', grip_fingers:2,
    preferred_weight:18, preferred_length:44, preferred_grip:'smooth',
    throw_style:'fluid_arc', release_angle:'medium',
    description:"Sherrock uses a light two-finger front touch with smooth barrels. Her fluid compact arc suits lightweight players with small-to-medium hands.",
    achievements:'First woman to beat men at PDC World Championship (2019, 2020)',
    dart_name:'Loxley Izzy Classic',
  },
  {
    id:'clayton', name:'Jonny Clayton', nickname:'The Ferret',
    country:'Wales', emoji:'🦊',
    height_cm:170, grip_style:'front_three_finger', grip_fingers:3,
    preferred_weight:22, preferred_length:46, preferred_grip:'medium_knurl',
    throw_style:'quick_release', release_angle:'medium_high',
    description:"Clayton uses a quick front-release with compact torpedos. His fast-paced dart suits front-grip players with a wrist-flick style.",
    achievements:'2021 Premier League Darts Champion, Grand Slam of Darts finalist',
    dart_name:'Red Dragon Jonny Clayton Original 2.0',
  },
  {
    id:'aspinall', name:'Nathan Aspinall', nickname:'The Asp',
    country:'England', emoji:'🐍',
    height_cm:180, grip_style:'front_three_finger', grip_fingers:3,
    preferred_weight:24, preferred_length:50, preferred_grip:'medium_knurl',
    throw_style:'deliberate_controlled', release_angle:'medium',
    description:"'The Asp' uses a front-biased deliberate grip with titanium-coated torpedos at 24g. Suits players who like to feel the front of the barrel.",
    achievements:'2019 UK Open & US Open Champion, 2023 World Matchplay Champion',
    dart_name:'Target Nathan Aspinall G1 SP',
  },
  {
    id:'dedecker', name:'Mike De Decker', nickname:'The Highlander',
    country:'Belgium', emoji:'⚔️',
    height_cm:183, grip_style:'rear_grip', grip_fingers:3,
    preferred_weight:24, preferred_length:60, preferred_grip:'ringed',
    throw_style:'rear_balanced', release_angle:'medium',
    description:"De Decker uses the longest barrel on the PDC circuit — 60mm — with a unique rear grip position and constant ring feel.",
    achievements:'2024 World Grand Prix Champion',
    dart_name:'Mission Mike De Decker Silver',
  },
  {
    id:'searle', name:'Ryan Searle', nickname:'Heavy Metal',
    country:'England', emoji:'🏋️',
    height_cm:183, grip_style:'three_finger_rear', grip_fingers:3,
    preferred_weight:28, preferred_length:55, preferred_grip:'aggressive_knurl',
    throw_style:'power_throw', release_angle:'medium',
    description:"'Heavy Metal' Searle throws the heaviest darts on tour at 28g+. His powerful arm requires maximum weight for trajectory control.",
    achievements:'Multiple PDC tour titles, former major finalist',
    dart_name:'Harrows Ryan Searle Heavy Metal',
  },
  {
    id:'schindler', name:'Martin Schindler', nickname:'The Wall',
    country:'Germany', emoji:'🧱',
    height_cm:178, grip_style:'mid_three_finger', grip_fingers:3,
    preferred_weight:22, preferred_length:49, preferred_grip:'aggressive_knurl',
    throw_style:'controlled_power', release_angle:'medium',
    description:"'The Wall' uses an aggressive knurl straight barrel with his signature rear Wall Grip section. For players who need tactile grip differentiation.",
    achievements:'Multiple European Tour titles, German number 1',
    dart_name:"Bull's Martin Schindler The Wall G3",
  },
];

// ─────────────────────────────────────────────
// SCHEMA + SEED
// ─────────────────────────────────────────────
let _db;
function getDb() {
  if (_db) return _db;
  const fs = require('fs');
  const dataDir = path.join(__dirname, '..', 'data');
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  _db = new Database(DB_PATH);
  _db.pragma('journal_mode = WAL');
  _db.pragma('foreign_keys = ON');
  initSchema(_db);
  return _db;
}

function initSchema(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS darts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      brand TEXT NOT NULL,
      name TEXT NOT NULL,
      weight INTEGER NOT NULL,
      length_mm INTEGER NOT NULL,
      diameter_mm REAL NOT NULL,
      grip_type TEXT NOT NULL,
      barrel_shape TEXT NOT NULL,
      balance_point TEXT NOT NULL,
      tungsten_pct INTEGER NOT NULL,
      surface TEXT,
      price_gbp REAL,
      buy_url TEXT,
      pro_player TEXT,
      tags TEXT,
      description TEXT,
      released TEXT,
      active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE(brand, name)
    );

    CREATE TABLE IF NOT EXISTS pro_players (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      nickname TEXT,
      country TEXT,
      emoji TEXT,
      height_cm INTEGER,
      grip_style TEXT,
      grip_fingers INTEGER,
      preferred_weight INTEGER,
      preferred_length INTEGER,
      preferred_grip TEXT,
      throw_style TEXT,
      release_angle TEXT,
      description TEXT,
      achievements TEXT,
      dart_name TEXT
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT,
      notifications_enabled INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      last_login TEXT
    );

    CREATE TABLE IF NOT EXISTS profiles (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      -- Hand measurements
      finger_length_mm REAL,
      palm_width_mm REAL,
      grip_diameter_mm REAL,
      finger_span_mm REAL,
      finger_flex_index REAL,
      throw_angle_deg REAL,
      -- Physical
      height_cm INTEGER,
      forearm_length_mm REAL,
      forearm_ratio REAL,
      arm_image_path TEXT,
      -- Questionnaire
      grip_preference INTEGER,
      weight_preference INTEGER,
      throwing_style TEXT,
      playing_level TEXT,
      play_frequency TEXT,
      -- Computed ideal
      ideal_weight INTEGER,
      ideal_length_mm INTEGER,
      ideal_diameter_mm REAL,
      ideal_grip_type TEXT,
      ideal_balance TEXT,
      ideal_barrel_shape TEXT,
      natural_throw_angle REAL,
      leverage_ratio REAL,
      -- Matched
      top_dart_id INTEGER REFERENCES darts(id),
      top_dart_score INTEGER,
      top_pro_id TEXT REFERENCES pro_players(id),
      top_pro_similarity INTEGER,
      -- Meta
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS push_subscriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
      endpoint TEXT UNIQUE NOT NULL,
      p256dh TEXT NOT NULL,
      auth TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS dart_launches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      dart_id INTEGER NOT NULL REFERENCES darts(id),
      launched_at TEXT DEFAULT (datetime('now')),
      notified INTEGER DEFAULT 0
    );
  `);

  // Migrate: add UNIQUE(brand,name) index if not present (safe no-op on new DBs)
  db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS idx_darts_brand_name ON darts(brand, name)`);

  // Upsert darts — INSERT OR REPLACE ensures catalog stays current with code changes
  const upsertDart = db.prepare(`
    INSERT INTO darts (brand,name,weight,length_mm,diameter_mm,grip_type,barrel_shape,balance_point,
      tungsten_pct,surface,price_gbp,buy_url,pro_player,tags,description,released)
    VALUES (@brand,@name,@weight,@length_mm,@diameter_mm,@grip_type,@barrel_shape,@balance_point,
      @tungsten_pct,@surface,@price_gbp,@buy_url,@pro_player,@tags,@description,@released)
    ON CONFLICT(brand,name) DO UPDATE SET
      weight=excluded.weight, length_mm=excluded.length_mm, diameter_mm=excluded.diameter_mm,
      grip_type=excluded.grip_type, barrel_shape=excluded.barrel_shape, balance_point=excluded.balance_point,
      tungsten_pct=excluded.tungsten_pct, surface=excluded.surface, price_gbp=excluded.price_gbp,
      buy_url=excluded.buy_url, pro_player=excluded.pro_player, tags=excluded.tags,
      description=excluded.description, released=excluded.released
  `);
  const seedDarts = db.transaction(() => {
    for (const d of DART_CATALOG) upsertDart.run(d);
  });
  seedDarts();

  // Upsert pros
  const upsertPro = db.prepare(`
    INSERT INTO pro_players VALUES
      (@id,@name,@nickname,@country,@emoji,@height_cm,@grip_style,@grip_fingers,
       @preferred_weight,@preferred_length,@preferred_grip,@throw_style,@release_angle,
       @description,@achievements,@dart_name)
    ON CONFLICT(id) DO UPDATE SET
      name=excluded.name, nickname=excluded.nickname, country=excluded.country, emoji=excluded.emoji,
      height_cm=excluded.height_cm, grip_style=excluded.grip_style, grip_fingers=excluded.grip_fingers,
      preferred_weight=excluded.preferred_weight, preferred_length=excluded.preferred_length,
      preferred_grip=excluded.preferred_grip, throw_style=excluded.throw_style, release_angle=excluded.release_angle,
      description=excluded.description, achievements=excluded.achievements, dart_name=excluded.dart_name
  `);
  const seedPros = db.transaction(() => {
    for (const p of PRO_PLAYERS) upsertPro.run(p);
  });
  seedPros();

  console.log(`[DB] Catalog synced: ${DART_CATALOG.length} darts, ${PRO_PLAYERS.length} pros`);
}

module.exports = { getDb };
