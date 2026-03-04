'use strict';
const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'data', 'dartfit.db');

// ─────────────────────────────────────────────
// DART DATABASE  (real products, real specs)
// ─────────────────────────────────────────────
const DART_CATALOG = [
  // ── TARGET ────────────────────────────────
  {
    brand:'Target', name:'Carrera 05 Titanium',
    weight:21, length_mm:47, diameter_mm:6.4,
    grip_type:'medium_knurl', barrel_shape:'torpedo', balance_point:'middle',
    tungsten_pct:90, surface:'titanium_nitride',
    price_gbp:29.99, buy_url:'https://www.amazon.co.uk/s?k=Target+Carrera+05+darts&tag=dartfit-21',
    pro_player:'Dave Chisnall',
    tags:'versatile,beginner-friendly,touring',
    description:'Slim torpedo with titanium nitride coating. Excellent for medium-grip players seeking progressive weight distribution.',
    released:'2021-03-01',
  },
  {
    brand:'Target', name:'Phil Taylor Power 9Five G9',
    weight:24, length_mm:53, diameter_mm:7.2,
    grip_type:'aggressive_knurl', barrel_shape:'straight', balance_point:'middle',
    tungsten_pct:90, surface:'nitride_coated',
    price_gbp:39.99, buy_url:'https://www.amazon.co.uk/s?k=Target+Phil+Taylor+9Five+darts&tag=dartfit-21',
    pro_player:'Phil Taylor',
    tags:'heavy,aggressive-grip,pro-spec',
    description:'The dart that won 16 World Championships. Straight barrel, aggressive knurl for precision front-grip throwers.',
    released:'2023-06-01',
  },
  {
    brand:'Target', name:'Gerwyn Price Iceman Gen 4',
    weight:22, length_mm:50, diameter_mm:6.8,
    grip_type:'medium_knurl', barrel_shape:'straight', balance_point:'front',
    tungsten_pct:95, surface:'natural',
    price_gbp:59.99, buy_url:'https://www.amazon.co.uk/s?k=Target+Gerwyn+Price+Iceman+darts&tag=dartfit-21',
    pro_player:'Gerwyn Price',
    tags:'front-weighted,95-tungsten,precision',
    description:'Front-loaded 95% tungsten. Iceman signature barrel gives exceptional grouping for measured, deliberate throwers.',
    released:'2023-09-01',
  },
  {
    brand:'Target', name:'Agora A10',
    weight:16, length_mm:40, diameter_mm:5.8,
    grip_type:'micro_grip', barrel_shape:'teardrop', balance_point:'front',
    tungsten_pct:85, surface:'natural',
    price_gbp:24.99, buy_url:'https://www.amazon.co.uk/s?k=Target+Agora+darts&tag=dartfit-21',
    pro_player:null,
    tags:'lightweight,slim,micro-grip',
    description:'Ultra-slim 16g teardrop designed for small-handed players with a light touch. Front taper aids natural release.',
    released:'2022-01-01',
  },
  {
    brand:'Target', name:'Voltage',
    weight:22, length_mm:50, diameter_mm:7.0,
    grip_type:'ringed', barrel_shape:'bomb', balance_point:'middle',
    tungsten_pct:90, surface:'black_nitride',
    price_gbp:34.99, buy_url:'https://www.amazon.co.uk/s?k=Target+Voltage+darts&tag=dartfit-21',
    pro_player:null,
    tags:'ringed,bomb,mid-weight',
    description:'Bomb-shaped barrel with ringed grip zones. Excellent for players who rotate between front and mid-barrel grip.',
    released:'2022-05-01',
  },

  // ── WINMAU ────────────────────────────────
  {
    brand:'Winmau', name:'Blade 6 Dual Core',
    weight:22, length_mm:52, diameter_mm:6.8,
    grip_type:'fine_knurl', barrel_shape:'straight', balance_point:'middle',
    tungsten_pct:95, surface:'natural',
    price_gbp:44.99, buy_url:'https://www.amazon.co.uk/s?k=Winmau+Blade+6+darts&tag=dartfit-21',
    pro_player:'Michael Smith',
    tags:'95-tungsten,fine-grip,straight',
    description:'95% tungsten Blade 6 with dual-core slim profile. Fine knurl ideal for players with a precise, relaxed grip.',
    released:'2022-10-01',
  },
  {
    brand:'Winmau', name:'Michael van Gerwen Spycraft',
    weight:23, length_mm:48, diameter_mm:6.8,
    grip_type:'medium_knurl', barrel_shape:'torpedo', balance_point:'front',
    tungsten_pct:97, surface:'natural',
    price_gbp:89.99, buy_url:'https://www.amazon.co.uk/s?k=Winmau+MvG+Spycraft+darts&tag=dartfit-21',
    pro_player:'Michael van Gerwen',
    tags:'97-tungsten,premium,torpedo,front',
    description:'MvG personal spec — 97% tungsten torpedo with front-heavy balance for explosive wrist-snap release.',
    released:'2023-04-01',
  },
  {
    brand:'Winmau', name:'Prism Force',
    weight:20, length_mm:48, diameter_mm:6.6,
    grip_type:'medium_knurl', barrel_shape:'torpedo', balance_point:'middle',
    tungsten_pct:90, surface:'natural',
    price_gbp:27.99, buy_url:'https://www.amazon.co.uk/s?k=Winmau+Prism+Force+darts&tag=dartfit-21',
    pro_player:null,
    tags:'mid-weight,torpedo,value',
    description:'Excellent value 20g torpedo for medium-grip players. Prism series is renowned for consistent manufacturing tolerance.',
    released:'2021-11-01',
  },
  {
    brand:'Winmau', name:'Sniper Elite',
    weight:25, length_mm:55, diameter_mm:7.4,
    grip_type:'aggressive_knurl', barrel_shape:'straight', balance_point:'rear',
    tungsten_pct:90, surface:'pvd_coated',
    price_gbp:32.99, buy_url:'https://www.amazon.co.uk/s?k=Winmau+Sniper+Elite+darts&tag=dartfit-21',
    pro_player:null,
    tags:'heavy,rear-weighted,aggressive',
    description:'Long, heavy rear-weighted straight barrel for big hands and rear-grip players. PVD coated for grip retention.',
    released:'2022-08-01',
  },

  // ── HARROWS ────────────────────────────────
  {
    brand:'Harrows', name:'Quantum Pro',
    weight:18, length_mm:44, diameter_mm:5.8,
    grip_type:'micro_grip', barrel_shape:'teardrop', balance_point:'front',
    tungsten_pct:85, surface:'natural',
    price_gbp:22.99, buy_url:'https://www.amazon.co.uk/s?k=Harrows+Quantum+Pro+darts&tag=dartfit-21',
    pro_player:null,
    tags:'lightweight,micro-grip,teardrop,small-hands',
    description:'Lightweight teardrop with micro-grip texture. Ideal for players with smaller hands or a featherlight touch.',
    released:'2020-06-01',
  },
  {
    brand:'Harrows', name:'Dave Chisnall Chizzy',
    weight:21, length_mm:46, diameter_mm:6.5,
    grip_type:'medium_knurl', barrel_shape:'straight', balance_point:'middle',
    tungsten_pct:90, surface:'natural',
    price_gbp:29.99, buy_url:'https://www.amazon.co.uk/s?k=Harrows+Chisnall+darts&tag=dartfit-21',
    pro_player:'Dave Chisnall',
    tags:'versatile,straight,tour-dart',
    description:'Chizzy\'s personal spec: medium-length straight barrel with classic knurl pattern. A benchmark touring dart.',
    released:'2022-02-01',
  },
  {
    brand:'Harrows', name:'Atomic Force',
    weight:26, length_mm:56, diameter_mm:7.8,
    grip_type:'shark_cut', barrel_shape:'bomb', balance_point:'middle',
    tungsten_pct:95, surface:'natural',
    price_gbp:49.99, buy_url:'https://www.amazon.co.uk/s?k=Harrows+Atomic+Force+darts&tag=dartfit-21',
    pro_player:null,
    tags:'heavy,bomb,shark,large-hands',
    description:'Maximum mass bomb barrel for large-handed players. Shark-cut grip for secure hold even at maximum leverage.',
    released:'2021-09-01',
  },

  // ── RED DRAGON ────────────────────────────────
  {
    brand:'Red Dragon', name:'Freestyle 16',
    weight:24, length_mm:50, diameter_mm:7.0,
    grip_type:'ringed', barrel_shape:'bomb', balance_point:'middle',
    tungsten_pct:90, surface:'natural',
    price_gbp:35.99, buy_url:'https://www.amazon.co.uk/s?k=Red+Dragon+Freestyle+darts&tag=dartfit-21',
    pro_player:null,
    tags:'bomb,ringed,mid-heavy',
    description:'Bomb barrel with deep ringed grip zones. Excellent for mid-barrel grippers who like tactile positional feedback.',
    released:'2021-07-01',
  },
  {
    brand:'Red Dragon', name:'Peter Wright Snakebite Mamba',
    weight:22, length_mm:50, diameter_mm:6.8,
    grip_type:'micro_grip', barrel_shape:'torpedo', balance_point:'middle',
    tungsten_pct:90, surface:'coloured_pvd',
    price_gbp:44.99, buy_url:'https://www.amazon.co.uk/s?k=Red+Dragon+Peter+Wright+darts&tag=dartfit-21',
    pro_player:'Peter Wright',
    tags:'torpedo,snakebite,coloured',
    description:'Snakebite signature torpedo with micro-grip. Wright uses a relaxed three-finger grip — this barrel suits the same.',
    released:'2023-01-01',
  },
  {
    brand:'Red Dragon', name:'Jonny Clayton Ferret Ignite',
    weight:19, length_mm:45, diameter_mm:6.2,
    grip_type:'fine_knurl', barrel_shape:'straight', balance_point:'front',
    tungsten_pct:90, surface:'natural',
    price_gbp:31.99, buy_url:'https://www.amazon.co.uk/s?k=Red+Dragon+Jonny+Clayton+darts&tag=dartfit-21',
    pro_player:'Jonny Clayton',
    tags:'lightweight,front,slim',
    description:'Clayton\'s Ferret spec — lightweight and front-weighted for players with fast wrist action and shorter grip.',
    released:'2022-07-01',
  },

  // ── UNICORN ────────────────────────────────
  {
    brand:'Unicorn', name:'Gary Anderson Phase 4',
    weight:23, length_mm:52, diameter_mm:7.0,
    grip_type:'medium_knurl', barrel_shape:'straight', balance_point:'middle',
    tungsten_pct:90, surface:'natural',
    price_gbp:37.99, buy_url:'https://www.amazon.co.uk/s?k=Unicorn+Gary+Anderson+Phase+4+darts&tag=dartfit-21',
    pro_player:'Gary Anderson',
    tags:'straight,classic,23g',
    description:'Anderson\'s Phase 4 — a slightly heavier touring straight that rewards a calm, pendulum-style throw from height.',
    released:'2022-11-01',
  },
  {
    brand:'Unicorn', name:'Contender',
    weight:18, length_mm:42, diameter_mm:5.9,
    grip_type:'micro_grip', barrel_shape:'teardrop', balance_point:'front',
    tungsten_pct:80, surface:'natural',
    price_gbp:19.99, buy_url:'https://www.amazon.co.uk/s?k=Unicorn+Contender+darts&tag=dartfit-21',
    pro_player:null,
    tags:'budget,lightweight,starter',
    description:'Entry-level teardrop for new players or those with small hands. 80% tungsten keeps cost low without sacrificing playability.',
    released:'2020-01-01',
  },
  {
    brand:'Unicorn', name:'Phase 5 Striker',
    weight:21, length_mm:49, diameter_mm:6.6,
    grip_type:'fine_knurl', barrel_shape:'straight', balance_point:'middle',
    tungsten_pct:90, surface:'natural',
    price_gbp:32.99, buy_url:'https://www.amazon.co.uk/s?k=Unicorn+Phase+5+darts&tag=dartfit-21',
    pro_player:null,
    tags:'straight,fine,versatile',
    description:'Phase 5 Striker is a clean, versatile straight barrel popular on the BDO circuit. Suits a wide range of grip styles.',
    released:'2023-03-01',
  },

  // ── MISSION ────────────────────────────────
  {
    brand:'Mission', name:'Komodo R',
    weight:25, length_mm:54, diameter_mm:7.5,
    grip_type:'shark_cut', barrel_shape:'shark', balance_point:'rear',
    tungsten_pct:90, surface:'pvd_coated',
    price_gbp:38.99, buy_url:'https://www.amazon.co.uk/s?k=Mission+Komodo+darts&tag=dartfit-21',
    pro_player:null,
    tags:'heavy,shark,rear-weighted,large-hands',
    description:'Shark-cut barrel for maximum grip without knurling. Rear-weighted for rear-grip players with large, powerful hands.',
    released:'2022-04-01',
  },
  {
    brand:'Mission', name:'F300',
    weight:21, length_mm:46, diameter_mm:6.4,
    grip_type:'fine_knurl', barrel_shape:'teardrop', balance_point:'front',
    tungsten_pct:90, surface:'natural',
    price_gbp:26.99, buy_url:'https://www.amazon.co.uk/s?k=Mission+F300+darts&tag=dartfit-21',
    pro_player:null,
    tags:'front,teardrop,fine,versatile',
    description:'Fine-knurl teardrop with subtle front taper. Suits players who find the sweet spot naturally toward the dart tip.',
    released:'2021-05-01',
  },

  // ── LOXLEY ────────────────────────────────
  {
    brand:'Loxley', name:'Izzy Classic',
    weight:20, length_mm:44, diameter_mm:6.2,
    grip_type:'smooth', barrel_shape:'bullet', balance_point:'middle',
    tungsten_pct:90, surface:'natural',
    price_gbp:28.99, buy_url:'https://www.amazon.co.uk/s?k=Loxley+Izzy+darts&tag=dartfit-21',
    pro_player:'Fallon Sherrock',
    tags:'smooth,bullet,20g',
    description:'Fallon Sherrock-influenced smooth bullet barrel. For players who develop grip through finger contact alone — no knurl needed.',
    released:'2021-12-01',
  },
  {
    brand:'Loxley', name:'Carbon 6',
    weight:22, length_mm:50, diameter_mm:6.5,
    grip_type:'medium_knurl', barrel_shape:'straight', balance_point:'middle',
    tungsten_pct:92, surface:'carbon_fibre_wrapped',
    price_gbp:52.99, buy_url:'https://www.amazon.co.uk/s?k=Loxley+Carbon+6+darts&tag=dartfit-21',
    pro_player:null,
    tags:'carbon,premium,92-tungsten',
    description:'Carbon-fibre wrapped 92% tungsten. The texture is unique — woven fibre provides grip without traditional machining.',
    released:'2023-07-01',
  },
];

// ─────────────────────────────────────────────
// PRO PLAYER DATABASE
// ─────────────────────────────────────────────
const PRO_PLAYERS = [
  {
    id:'mvg', name:'Michael van Gerwen', nickname:'The Green Machine',
    country:'Netherlands', emoji:'🟢',
    height_cm:180, grip_style:'front_pinch', grip_fingers:3,
    preferred_weight:23, preferred_length:48, preferred_grip:'medium_knurl',
    throw_style:'explosive_snap', release_angle:'high',
    description:'MvG grips at the very front, three fingers forward, with an explosive wrist snap. Suits front-heavy, short-barrel darts.',
    achievements:'3x World Champion, 64 PDC major titles',
    dart_name:'Winmau MvG Spycraft',
  },
  {
    id:'taylor', name:'Phil Taylor', nickname:'The Power',
    country:'England', emoji:'⚡',
    height_cm:182, grip_style:'three_finger_balanced', grip_fingers:3,
    preferred_weight:26, preferred_length:53, preferred_grip:'aggressive_knurl',
    throw_style:'pendulum', release_angle:'medium',
    description:'Taylor uses an upright pendulum style with a firm three-finger grip. Prefers heavier darts for raw trajectory power.',
    achievements:'16x World Champion, all-time great',
    dart_name:'Target Phil Taylor 9Five',
  },
  {
    id:'wright', name:'Peter Wright', nickname:'Snakebite',
    country:'Scotland', emoji:'🐍',
    height_cm:183, grip_style:'relaxed_three_finger', grip_fingers:3,
    preferred_weight:22, preferred_length:50, preferred_grip:'micro_grip',
    throw_style:'smooth_arc', release_angle:'medium',
    description:'Wright uses a relaxed three-finger torpedo grip with smooth micro texture. His arc is consistent and unhurried.',
    achievements:'2x World Champion',
    dart_name:'Red Dragon Snakebite Mamba',
  },
  {
    id:'price', name:'Gerwyn Price', nickname:'The Iceman',
    country:'Wales', emoji:'🧊',
    height_cm:185, grip_style:'deliberate_three_finger', grip_fingers:3,
    preferred_weight:22, preferred_length:50, preferred_grip:'medium_knurl',
    throw_style:'controlled_power', release_angle:'medium_high',
    description:'Price delivers controlled power with a deliberate setup. Taller players with similar height often find affinity with his specs.',
    achievements:'1x World Champion, 2021',
    dart_name:'Target Gerwyn Price Iceman',
  },
  {
    id:'anderson', name:'Gary Anderson', nickname:'The Flying Scotsman',
    country:'Scotland', emoji:'✈️',
    height_cm:185, grip_style:'pendulum_relaxed', grip_fingers:3,
    preferred_weight:23, preferred_length:52, preferred_grip:'medium_knurl',
    throw_style:'pendulum', release_angle:'low',
    description:'Anderson throws with a wide relaxed pendulum. At 6\'1" he throws down-angle — taller players relate strongly to his biomechanics.',
    achievements:'2x World Champion',
    dart_name:'Unicorn Gary Anderson Phase 4',
  },
  {
    id:'sherrock', name:'Fallon Sherrock', nickname:'Queen of the Palace',
    country:'England', emoji:'👑',
    height_cm:168, grip_style:'light_front_pinch', grip_fingers:2,
    preferred_weight:18, preferred_length:44, preferred_grip:'smooth',
    throw_style:'fluid_arc', release_angle:'medium',
    description:'Sherrock uses a light two-finger front touch with smooth barrels. Her fluid arc suits lightweight, compact darts.',
    achievements:'First woman to beat a man at WC, 2019',
    dart_name:'Loxley Izzy Classic',
  },
  {
    id:'clayton', name:'Jonny Clayton', nickname:'The Ferret',
    country:'Wales', emoji:'🦡',
    height_cm:170, grip_style:'front_three_finger', grip_fingers:3,
    preferred_weight:19, preferred_length:45, preferred_grip:'fine_knurl',
    throw_style:'quick_release', release_angle:'medium_high',
    description:'Clayton uses a quick front-pinch release with lightweight darts. His throw is fast-paced, suited to slim, front-loaded barrels.',
    achievements:'Premier League Champion 2021',
    dart_name:'Red Dragon Jonny Clayton Ferret',
  },
  {
    id:'chisnall', name:'Dave Chisnall', nickname:'Chizzy',
    country:'England', emoji:'🎯',
    height_cm:178, grip_style:'mid_three_finger', grip_fingers:3,
    preferred_weight:21, preferred_length:47, preferred_grip:'medium_knurl',
    throw_style:'medium_arc', release_angle:'medium',
    description:'Chisnall is the archetypal "all-round" grip — mid-barrel, three fingers, consistent arc. His spec suits the widest range of players.',
    achievements:'Multiple Players Championship titles',
    dart_name:'Harrows Dave Chisnall Chizzy',
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
      created_at TEXT DEFAULT (datetime('now'))
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

  // Seed darts if empty
  const dartCount = db.prepare('SELECT COUNT(*) as n FROM darts').get().n;
  if (dartCount === 0) {
    const insertDart = db.prepare(`
      INSERT INTO darts (brand,name,weight,length_mm,diameter_mm,grip_type,barrel_shape,balance_point,
        tungsten_pct,surface,price_gbp,buy_url,pro_player,tags,description,released)
      VALUES (@brand,@name,@weight,@length_mm,@diameter_mm,@grip_type,@barrel_shape,@balance_point,
        @tungsten_pct,@surface,@price_gbp,@buy_url,@pro_player,@tags,@description,@released)
    `);
    const seedDarts = db.transaction(() => {
      for (const d of DART_CATALOG) insertDart.run(d);
    });
    seedDarts();
    console.log(`[DB] Seeded ${DART_CATALOG.length} darts`);
  }

  // Seed pros if empty
  const proCount = db.prepare('SELECT COUNT(*) as n FROM pro_players').get().n;
  if (proCount === 0) {
    const insertPro = db.prepare(`
      INSERT INTO pro_players VALUES
        (@id,@name,@nickname,@country,@emoji,@height_cm,@grip_style,@grip_fingers,
         @preferred_weight,@preferred_length,@preferred_grip,@throw_style,@release_angle,
         @description,@achievements,@dart_name)
    `);
    const seedPros = db.transaction(() => {
      for (const p of PRO_PLAYERS) insertPro.run(p);
    });
    seedPros();
    console.log(`[DB] Seeded ${PRO_PLAYERS.length} pro players`);
  }
}

module.exports = { getDb };
