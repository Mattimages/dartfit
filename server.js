'use strict';
require('dotenv').config();

const express     = require('express');
const helmet      = require('helmet');
const cors        = require('cors');
const compression = require('compression');
const rateLimit   = require('express-rate-limit');
const multer      = require('multer');
const path        = require('path');
const fs          = require('fs');
const bcrypt      = require('bcryptjs');
const jwt         = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const { getDb } = require('./lib/database');
const {
  calculateIdealProfile, runMatchPipeline, analyzeForearmImage, forearmFromPoseRatio,
} = require('./lib/algorithm');
const { initWebPush, savePushSubscription, broadcastDartLaunch } = require('./lib/notifications');

const app  = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'dartfit-dev-secret-CHANGE-IN-PROD';
if (!process.env.JWT_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    console.error('[SECURITY] JWT_SECRET must be set in production. Refusing to start.');
    process.exit(1);
  }
  console.warn('[SECURITY] JWT_SECRET not set — using insecure default. Set JWT_SECRET in .env before deploying.');
}

// ─── UPLOADS ────────────────────────────────────────────────────────
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase().slice(0, 8);
      cb(null, `arm_${uuidv4()}${/^\.[a-z0-9]+$/.test(ext) ? ext : '.jpg'}`);
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) => {
    const ok = ['image/jpeg','image/png','image/webp','image/heic'].includes(file.mimetype);
    cb(ok ? null : new Error('Only image files allowed'), ok);
  },
});

// ─── MIDDLEWARE ────────────────────────────────────────────────────
app.set('trust proxy', 1); // behind a reverse proxy (Codespaces, Railway, Render, …)
app.disable('x-powered-by');
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      // Inline handlers + the MediaPipe CDN are part of the app's design;
      // everything else stays locked to self.
      scriptSrc: ["'self'", "'unsafe-inline'", 'https://cdn.jsdelivr.net'],
      scriptSrcAttr: ["'unsafe-inline'"], // the SPA uses inline onclick handlers
      styleSrc: ["'self'", "'unsafe-inline'"],   // fonts are self-hosted now
      fontSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'blob:'],
      mediaSrc: ["'self'", 'blob:'],
      connectSrc: ["'self'", 'https://cdn.jsdelivr.net'],
      workerSrc: ["'self'", 'blob:'],
      objectSrc: ["'none'"],
      frameAncestors: ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: false, // MediaPipe WASM assets
}));
app.use(cors());
app.use(compression());
app.use(express.json({ limit: '2mb' }));
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: '7d',
  setHeaders: (res, filePath) => {
    // HTML + SW must revalidate so deploys land instantly
    if (filePath.endsWith('.html') || filePath.endsWith('sw.js')) {
      res.setHeader('Cache-Control', 'no-cache');
    }
  },
}));

app.use('/api/', rateLimit({ windowMs: 15 * 60 * 1000, max: 300, standardHeaders: true, legacyHeaders: false }));
// Credential endpoints get a much tighter budget — 20 attempts / 15 min / IP
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, standardHeaders: true, legacyHeaders: false,
  message: { error: 'Too many attempts — try again in 15 minutes' } });

function requireAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorised' });
  try { req.user = jwt.verify(auth.slice(7), JWT_SECRET); next(); }
  catch { res.status(401).json({ error: 'Invalid token' }); }
}

function requireAdmin(req, res, next) {
  requireAuth(req, res, () => {
    if (!req.user.admin) return res.status(403).json({ error: 'Admin only' });
    next();
  });
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// ─── IN-MEMORY CATALOG CACHE ───────────────────────────────────────
// The catalog only changes via /api/admin/darts, so cache reads and
// bust on write. Keeps /api/darts and every fit calculation off disk.
let _dartCache = null, _proCache = null;
function getDarts() {
  if (!_dartCache) _dartCache = getDb().prepare('SELECT * FROM darts WHERE active = 1 ORDER BY brand,name').all();
  return _dartCache;
}
function getPros() {
  if (!_proCache) _proCache = getDb().prepare('SELECT * FROM pro_players').all();
  return _proCache;
}
function bustCatalogCache() { _dartCache = null; _proCache = null; }

// ════════════════════════════════════════════════════════════════
// AUTH
// ════════════════════════════════════════════════════════════════
app.post('/api/auth/register', authLimiter, async (req, res) => {
  const { email, password, name } = req.body || {};
  if (typeof email !== 'string' || typeof password !== 'string')
    return res.status(400).json({ error: 'Email and password required' });
  const cleanEmail = email.trim().toLowerCase();
  if (!EMAIL_RE.test(cleanEmail) || cleanEmail.length > 254)
    return res.status(400).json({ error: 'Enter a valid email address' });
  if (password.length < 8 || password.length > 128)
    return res.status(400).json({ error: 'Password must be 8–128 characters' });
  const cleanName = typeof name === 'string' ? name.trim().slice(0, 80) : '';

  const db = getDb();
  if (db.prepare('SELECT id FROM users WHERE email = ?').get(cleanEmail)) {
    return res.status(409).json({ error: 'Email already registered' });
  }
  const hash = await bcrypt.hash(password, 12);
  const id = uuidv4();
  db.prepare('INSERT INTO users (id,email,password_hash,name) VALUES (?,?,?,?)').run(id, cleanEmail, hash, cleanName);
  const token = jwt.sign({ id, email: cleanEmail, admin: false }, JWT_SECRET, { expiresIn: '30d' });
  res.json({ token, user: { id, email: cleanEmail, name: cleanName } });
});

app.post('/api/auth/login', authLimiter, async (req, res) => {
  const { email, password } = req.body || {};
  if (typeof email !== 'string' || typeof password !== 'string')
    return res.status(400).json({ error: 'Email and password required' });
  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.trim().toLowerCase());
  if (!user || !(await bcrypt.compare(password, user.password_hash)))
    return res.status(401).json({ error: 'Invalid credentials' });
  db.prepare("UPDATE users SET last_login = datetime('now') WHERE id = ?").run(user.id);
  const token = jwt.sign({ id: user.id, email: user.email, admin: !!user.is_admin }, JWT_SECRET, { expiresIn: '30d' });
  res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
});

app.get('/api/auth/me', requireAuth, (req, res) => {
  const db = getDb();
  const user = db.prepare('SELECT id,email,name,notifications_enabled,created_at FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: 'Account no longer exists' });
  const profile = db.prepare('SELECT * FROM profiles WHERE user_id = ? ORDER BY created_at DESC LIMIT 1').get(req.user.id);
  res.json({ user, profile });
});

// ════════════════════════════════════════════════════════════════
// DARTS & PROS
// ════════════════════════════════════════════════════════════════
// Catalog reads change only on admin inserts — let clients/CDNs hold
// them briefly instead of re-fetching on every visit.
const catalogCacheHeader = (res) => res.set('Cache-Control', 'public, max-age=300');
app.get('/api/darts', (req, res) => { catalogCacheHeader(res); res.json(getDarts()); });
app.get('/api/pros',  (req, res) => { catalogCacheHeader(res); res.json(getPros()); });
app.get('/api/stats', (req, res) => {
  catalogCacheHeader(res);
  const darts = getDarts();
  res.json({ darts: darts.length, pros: getPros().length, brands: new Set(darts.map(d => d.brand)).size });
});

// ════════════════════════════════════════════════════════════════
// FITTING
// ════════════════════════════════════════════════════════════════
app.post('/api/fit/arm-scan', upload.single('armImage'), async (req, res) => {
  const heightCm = parseInt(req.body.height, 10) || 175;
  if (!req.file) return res.status(400).json({ error: 'No image provided' });
  // If the client ran pose detection, its scale-free limb ratio beats
  // anything the server can extract from an unreferenced photo.
  const poseRatio = parseFloat(req.body.poseRatio);
  let result;
  if (Number.isFinite(poseRatio) && poseRatio > 0) {
    result = {
      success: true,
      forearmLengthMm: forearmFromPoseRatio(poseRatio, heightCm),
      method: 'pose_landmarks',
    };
  } else {
    result = await analyzeForearmImage(req.file.path, heightCm);
  }
  // The image is never kept — analysis only.
  fs.unlink(req.file.path, () => {});
  res.json(result);
});

app.post('/api/fit/calculate', (req, res) => {
  try {
    const p = req.body || {};
    const profile = calculateIdealProfile({
      fingerLength:     p.fingerLength,
      palmWidth:        p.palmWidth,
      gripDiameter:     p.gripDiameter,
      fingerSpan:       p.fingerSpan,
      fingerFlexIndex:  p.fingerFlexIndex,
      heightCm:         p.heightCm,
      forearmLengthMm:  p.forearmLengthMm,
      gripPreference:   p.gripPreference,
      weightPreference: p.weightPreference,
      throwingStyle:    p.throwingStyle,
      playingLevel:     p.playingLevel,
      throwSpeed:       p.throwSpeed,
      wristAction:      p.wristAction,
      handMoisture:     p.handMoisture,
      handMeasured:     p.handMeasured === true,
    });
    res.json(runMatchPipeline(profile, getDarts(), getPros()));
  } catch (err) {
    console.error('[/api/fit/calculate]', err);
    res.status(500).json({ error: 'Calculation failed' });
  }
});

app.post('/api/fit/save', requireAuth, (req, res) => {
  const { profile, topDart, topPro, heightCm, forearmLengthMm,
    gripPreference, weightPreference, throwingStyle, playingLevel, playFrequency } = req.body || {};
  if (!profile || typeof profile !== 'object')
    return res.status(400).json({ error: 'Missing fit profile' });
  const db = getDb();
  const id = uuidv4();
  const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : null);
  db.prepare(`
    INSERT INTO profiles (
      id,user_id,finger_length_mm,palm_width_mm,grip_diameter_mm,finger_span_mm,
      finger_flex_index,throw_angle_deg,height_cm,forearm_length_mm,forearm_ratio,
      arm_image_path,grip_preference,weight_preference,throwing_style,playing_level,play_frequency,
      ideal_weight,ideal_length_mm,ideal_diameter_mm,ideal_grip_type,ideal_balance,ideal_barrel_shape,
      ideal_tungsten_pct,ideal_shaft_mm,ideal_flight,archetype_id,fit_confidence,
      natural_throw_angle,leverage_ratio,top_dart_id,top_dart_score,top_pro_id,top_pro_similarity
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `).run(
    id, req.user.id,
    num(profile.fingerLength), num(profile.palmWidth), num(profile.gripDiameter), num(profile.fingerSpan),
    num(profile.fingerFlexIndex), num(profile.releaseAngleDeg), num(heightCm), num(forearmLengthMm), num(profile.leverageRatio),
    null, num(gripPreference), num(weightPreference),
    typeof throwingStyle === 'string' ? throwingStyle.slice(0, 16) : null,
    typeof playingLevel === 'string' ? playingLevel.slice(0, 16) : null,
    typeof playFrequency === 'string' ? playFrequency.slice(0, 16) : null,
    num(profile.idealWeight), num(profile.idealLength), num(profile.idealDiameter),
    typeof profile.idealGripType === 'string' ? profile.idealGripType.slice(0, 24) : null,
    typeof profile.balance === 'string' ? profile.balance.slice(0, 8) : null,
    typeof profile.barrelShape === 'string' ? profile.barrelShape.slice(0, 16) : null,
    num(profile.idealTungstenPct), num(profile.idealShaft?.lengthMm),
    typeof profile.idealFlight?.label === 'string' ? profile.idealFlight.label.slice(0, 24) : null,
    typeof profile.archetype?.id === 'string' ? profile.archetype.id.slice(0, 24) : null,
    num(profile.fitConfidence),
    num(profile.releaseAngleDeg), num(profile.leverageRatio),
    num(topDart?.id), num(topDart?.matchScore), topPro?.id ? String(topPro.id).slice(0, 32) : null, num(topPro?.similarity)
  );
  res.json({ success: true, profileId: id });
});

app.get('/api/fit/history', requireAuth, (req, res) => {
  const db = getDb();
  res.json(db.prepare(`
    SELECT p.*,d.brand as dart_brand,d.name as dart_name,d.weight as dart_weight,
           pp.name as pro_name,pp.nickname as pro_nickname
    FROM profiles p
    LEFT JOIN darts d ON d.id = p.top_dart_id
    LEFT JOIN pro_players pp ON pp.id = p.top_pro_id
    WHERE p.user_id = ? ORDER BY p.created_at DESC
  `).all(req.user.id));
});

// ════════════════════════════════════════════════════════════════
// PUSH NOTIFICATIONS
// ════════════════════════════════════════════════════════════════
app.get('/api/push/vapid-key', (req, res) => res.json({ publicKey: process.env.VAPID_PUBLIC_KEY || '' }));

app.post('/api/push/subscribe', requireAuth, (req, res) => {
  const { subscription } = req.body || {};
  if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth)
    return res.status(400).json({ error: 'Invalid subscription' });
  savePushSubscription(req.user.id, subscription);
  res.json({ success: true });
});

app.post('/api/push/toggle', requireAuth, (req, res) => {
  getDb().prepare('UPDATE users SET notifications_enabled = ? WHERE id = ?')
    .run(req.body?.enabled ? 1 : 0, req.user.id);
  res.json({ success: true });
});

// ════════════════════════════════════════════════════════════════
// ADMIN
// ════════════════════════════════════════════════════════════════
const DART_FIELDS = ['brand','name','weight','length_mm','diameter_mm','grip_type','barrel_shape','balance_point','tungsten_pct'];
app.post('/api/admin/darts', requireAdmin, async (req, res) => {
  const b = req.body || {};
  for (const f of DART_FIELDS) {
    if (b[f] === undefined || b[f] === null || b[f] === '')
      return res.status(400).json({ error: `Missing required field: ${f}` });
  }
  const db = getDb();
  const r = db.prepare(`
    INSERT INTO darts (brand,name,weight,length_mm,diameter_mm,grip_type,barrel_shape,balance_point,
      tungsten_pct,surface,price_gbp,buy_url,pro_player,tags,description,released)
    VALUES (@brand,@name,@weight,@length_mm,@diameter_mm,@grip_type,@barrel_shape,@balance_point,
      @tungsten_pct,@surface,@price_gbp,@buy_url,@pro_player,@tags,@description,@released)
  `).run({
    surface: null, price_gbp: null, buy_url: null, pro_player: null, tags: null, description: null, released: null,
    ...b,
  });
  bustCatalogCache();
  const dartId = r.lastInsertRowid;
  db.prepare('INSERT INTO dart_launches (dart_id) VALUES (?)').run(dartId);
  // Notify in the background — a slow push/SMTP endpoint must never
  // stall the admin request. Results land in the server log.
  broadcastDartLaunch(dartId)
    .then(results => {
      const perfect = results.filter(x => x.perfect).length;
      console.log(`[Launch] dart ${dartId}: notified ${results.length} user(s), ${perfect} perfect-match alert(s)`);
    })
    .catch(err => console.error('[Launch] broadcast failed:', err));
  res.json({ dartId, notifying: true });
});

app.get('/api/admin/users', requireAdmin, (req, res) => {
  res.json(getDb().prepare('SELECT id,email,name,created_at,last_login,notifications_enabled FROM users').all());
});

// ════════════════════════════════════════════════════════════════
// FIT EXPLANATION (generated locally — no external API)
// ════════════════════════════════════════════════════════════════
app.post('/api/fit/explain', (req, res) => {
  const { profile, topDart, topPro } = req.body || {};
  if (!profile || !topDart || !topPro) return res.status(400).json({ error: 'Missing data' });

  const arch = profile.archetype;
  const leverageDesc = profile.leverageRatio > 0.15 ? 'long-forearm' : 'compact';
  const leverageTip = profile.leverageRatio > 0.15
    ? 'your longer lever arm favours slightly lighter darts for control'
    : 'your shorter lever benefits from front-weighted balance';
  const gripStyle = String(topPro.grip_style || '').replace(/_/g, ' ');
  const angle = Number(profile.releaseAngleDeg) || null;

  const text =
    (arch?.name ? `You throw like ${arch.name} — ${String(arch.tagline || '').toLowerCase()}. ` : '') +
    `Your ${profile.palmWidth}mm palm and ${profile.fingerLength}mm fingers define a ${profile.idealWeight}g ${profile.barrelShape} as your optimum, ` +
    (angle ? `released at ≈${angle.toFixed(0)}° on a ${profile.releaseSpeedMs || 5.5} m/s trajectory. ` : '. ') +
    `The ${topDart.name} matches at ${topDart.matchScore}% — its ${topDart.weight}g barrel and ${String(topDart.grip_type || '').replace(/_/g, ' ')} sit directly on your biometric profile. ` +
    `Your ${(profile.leverageRatio * 100).toFixed(1)}% leverage ratio marks a ${leverageDesc} throwing arc — ${leverageTip}. ` +
    `Like ${topPro.name}, your measurements point to a ${gripStyle} release — the same biomechanical archetype that defines their game. ` +
    (profile.idealShaft?.label ? `Finish the setup with a ${profile.idealShaft.label.toLowerCase()} shaft and ${profile.idealFlight?.label || 'standard'} flights to keep the dart's pitch oscillation in phase with the oche.` : '');

  res.json({ text });
});

// ════════════════════════════════════════════════════════════════
// AFFILIATE CLICK TRACKING
// ════════════════════════════════════════════════════════════════
app.post('/api/track/click', (req, res) => {
  const dartId = Number(req.body?.dartId);
  if (Number.isFinite(dartId)) console.log(`[Track] Affiliate click: dart_id=${dartId}`);
  res.json({ success: true });
});

// ─── ERRORS & FALLBACKS ────────────────────────────────────────
// Unknown API routes answer JSON, never the SPA shell.
app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }));

// Multer / JSON-parse / anything uncaught → clean JSON error.
app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  const status = err.type === 'entity.too.large' ? 413
    : err instanceof multer.MulterError || /image files/i.test(err.message || '') ? 400
    : 500;
  if (status === 500) console.error('[Unhandled]', err);
  res.status(status).json({ error: status === 500 ? 'Internal server error' : err.message });
});

// ─── BOOT ──────────────────────────────────────────────────────
initWebPush();
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
if (require.main === module) {
  app.listen(PORT, () => console.log(`\n🎯 DARTFIT on http://localhost:${PORT}\n`));
}
module.exports = app;
