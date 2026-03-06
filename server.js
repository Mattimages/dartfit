'use strict';
require('dotenv').config();

const express    = require('express');
const helmet     = require('helmet');
const cors       = require('cors');
const rateLimit  = require('express-rate-limit');
const multer     = require('multer');
const path       = require('path');
const fs         = require('fs');
const bcrypt     = require('bcryptjs');
const jwt        = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const { getDb }            = require('./lib/database');
const { calculateIdealProfile, runMatchPipeline, analyzeForearmImage } = require('./lib/algorithm');
const { initWebPush, savePushSubscription, broadcastDartLaunch } = require('./lib/notifications');

const app  = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'dartfit-dev-secret-CHANGE-IN-PROD';

// ─── UPLOADS ────────────────────────────────────────────────────────
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `arm_${uuidv4()}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok = ['image/jpeg','image/png','image/webp','image/heic'].includes(file.mimetype);
    cb(ok ? null : new Error('Only image files allowed'), ok);
  },
});

// ─── MIDDLEWARE ────────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/api/', rateLimit({ windowMs: 15 * 60 * 1000, max: 300 }));

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

// ════════════════════════════════════════════════════════════════
// AUTH
// ════════════════════════════════════════════════════════════════
app.post('/api/auth/register', async (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  const db = getDb();
  if (db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase())) {
    return res.status(409).json({ error: 'Email already registered' });
  }
  const hash = await bcrypt.hash(password, 12);
  const id = uuidv4();
  db.prepare('INSERT INTO users (id,email,password_hash,name) VALUES (?,?,?,?)').run(id, email.toLowerCase(), hash, name || '');
  const token = jwt.sign({ id, email: email.toLowerCase(), admin: false }, JWT_SECRET, { expiresIn: '30d' });
  res.json({ token, user: { id, email: email.toLowerCase(), name } });
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email?.toLowerCase());
  if (!user || !(await bcrypt.compare(password, user.password_hash)))
    return res.status(401).json({ error: 'Invalid credentials' });
  db.prepare("UPDATE users SET last_login = datetime('now') WHERE id = ?").run(user.id);
  const token = jwt.sign({ id: user.id, email: user.email, admin: !!user.is_admin }, JWT_SECRET, { expiresIn: '30d' });
  res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
});

app.get('/api/auth/me', requireAuth, (req, res) => {
  const db = getDb();
  const user = db.prepare('SELECT id,email,name,notifications_enabled,created_at FROM users WHERE id = ?').get(req.user.id);
  const profile = db.prepare('SELECT * FROM profiles WHERE user_id = ? ORDER BY created_at DESC LIMIT 1').get(req.user.id);
  res.json({ user, profile });
});

// ════════════════════════════════════════════════════════════════
// DARTS & PROS
// ════════════════════════════════════════════════════════════════
app.get('/api/darts', (req, res) => {
  const db = getDb();
  res.json(db.prepare('SELECT * FROM darts WHERE active = 1 ORDER BY brand,name').all());
});

app.get('/api/pros', (req, res) => {
  const db = getDb();
  res.json(db.prepare('SELECT * FROM pro_players').all());
});

// ════════════════════════════════════════════════════════════════
// FITTING
// ════════════════════════════════════════════════════════════════
app.post('/api/fit/arm-scan', upload.single('armImage'), async (req, res) => {
  const heightCm = parseInt(req.body.height) || 175;
  if (!req.file) return res.status(400).json({ error: 'No image provided' });
  const result = await analyzeForearmImage(req.file.path, heightCm);
  res.json({ ...result, imagePath: req.file.filename });
});

app.post('/api/fit/calculate', async (req, res) => {
  try {
    const db = getDb();
    const p = req.body;
    const profile = calculateIdealProfile({
      fingerLength:     parseFloat(p.fingerLength) || 80,
      palmWidth:        parseFloat(p.palmWidth) || 85,
      gripDiameter:     parseFloat(p.gripDiameter) || 16,
      fingerSpan:       parseFloat(p.fingerSpan) || 200,
      fingerFlexIndex:  parseFloat(p.fingerFlexIndex) || 0.75,
      throwAngleDeg:    p.throwAngleDeg ? parseFloat(p.throwAngleDeg) : null,
      heightCm:         parseFloat(p.heightCm) || 175,
      forearmLengthMm:  p.forearmLengthMm ? parseFloat(p.forearmLengthMm) : null,
      gripPreference:   parseInt(p.gripPreference) || 3,
      weightPreference: parseInt(p.weightPreference) || 3,
      throwingStyle:    p.throwingStyle || 'middle',
      playingLevel:     p.playingLevel || 'intermediate',
    });
    const darts = db.prepare('SELECT * FROM darts WHERE active = 1').all();
    const pros  = db.prepare('SELECT * FROM pro_players').all();
    res.json(runMatchPipeline(profile, darts, pros));
  } catch (err) {
    console.error('[/api/fit/calculate]', err);
    res.status(500).json({ error: err.message || 'Calculation failed' });
  }
});

app.post('/api/fit/save', requireAuth, (req, res) => {
  const { profile, topDart, topPro, heightCm, forearmLengthMm, armImagePath,
    gripPreference, weightPreference, throwingStyle, playingLevel, playFrequency } = req.body;
  const db = getDb();
  const id = uuidv4();
  db.prepare(`
    INSERT INTO profiles (
      id,user_id,finger_length_mm,palm_width_mm,grip_diameter_mm,finger_span_mm,
      finger_flex_index,throw_angle_deg,height_cm,forearm_length_mm,forearm_ratio,
      arm_image_path,grip_preference,weight_preference,throwing_style,playing_level,play_frequency,
      ideal_weight,ideal_length_mm,ideal_diameter_mm,ideal_grip_type,ideal_balance,ideal_barrel_shape,
      natural_throw_angle,leverage_ratio,top_dart_id,top_dart_score,top_pro_id,top_pro_similarity
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `).run(
    id, req.user.id,
    profile.fingerLength, profile.palmWidth, profile.gripDiameter, profile.fingerSpan,
    profile.fingerFlexIndex, profile.throwAngleDeg, heightCm, forearmLengthMm, profile.leverageRatio,
    armImagePath, gripPreference, weightPreference, throwingStyle, playingLevel, playFrequency,
    profile.idealWeight, profile.idealLength, profile.idealDiameter, profile.idealGripType,
    profile.balance, profile.barrelShape, profile.naturalThrowAngle, profile.leverageRatio,
    topDart?.id, topDart?.matchScore, topPro?.id, topPro?.similarity
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
  const { subscription } = req.body;
  if (!subscription?.endpoint) return res.status(400).json({ error: 'Invalid subscription' });
  savePushSubscription(req.user.id, subscription);
  res.json({ success: true });
});

app.post('/api/push/toggle', requireAuth, (req, res) => {
  const db = getDb();
  db.prepare('UPDATE users SET notifications_enabled = ? WHERE id = ?').run(req.body.enabled ? 1 : 0, req.user.id);
  res.json({ success: true });
});

// ════════════════════════════════════════════════════════════════
// ADMIN
// ════════════════════════════════════════════════════════════════
app.post('/api/admin/darts', requireAdmin, async (req, res) => {
  const db = getDb();
  const r = db.prepare(`
    INSERT INTO darts (brand,name,weight,length_mm,diameter_mm,grip_type,barrel_shape,balance_point,
      tungsten_pct,surface,price_gbp,buy_url,pro_player,tags,description,released)
    VALUES (@brand,@name,@weight,@length_mm,@diameter_mm,@grip_type,@barrel_shape,@balance_point,
      @tungsten_pct,@surface,@price_gbp,@buy_url,@pro_player,@tags,@description,@released)
  `).run(req.body);
  const dartId = r.lastInsertRowid;
  db.prepare('INSERT INTO dart_launches (dart_id) VALUES (?)').run(dartId);
  const notifResults = await broadcastDartLaunch(dartId);
  res.json({ dartId, notified: notifResults.length });
});

app.get('/api/admin/users', requireAdmin, (req, res) => {
  const db = getDb();
  res.json(db.prepare('SELECT id,email,name,created_at,last_login,notifications_enabled FROM users').all());
});

// ════════════════════════════════════════════════════════════════
// AI EXPLANATION (server-side — generates locally, no external API needed)
// ════════════════════════════════════════════════════════════════
app.post('/api/fit/explain', (req, res) => {
  const { profile, topDart, topPro, questionnaire } = req.body;
  if (!profile || !topDart || !topPro) return res.status(400).json({ error: 'Missing data' });

  const leverageDesc = profile.leverageRatio > 0.15 ? 'long-forearm' : 'compact';
  const leverageTip = profile.leverageRatio > 0.15
    ? 'slightly lighter darts will give better control'
    : 'your shorter lever benefits from front-weighted balance';
  const gripStyle = (topPro.grip_style || '').replace(/_/g, ' ');

  const text = `Your ${profile.palmWidth}mm palm width and ${profile.fingerLength}mm finger length define a ${profile.idealWeight}g ${profile.barrelShape} as the optimal balance point. The ${topDart.name} matches with ${topDart.matchScore}% precision — its ${topDart.weight}g barrel and ${(topDart.grip_type || '').replace(/_/g, ' ')} align directly with your biometric profile. Your leverage ratio of ${(profile.leverageRatio * 100).toFixed(1)}% indicates a ${leverageDesc} throwing arc — ${leverageTip}. Like ${topPro.name}, your measurements point to a ${gripStyle} release — the same biomechanical archetype that defines their style.`;

  res.json({ text });
});

// ════════════════════════════════════════════════════════════════
// AFFILIATE CLICK TRACKING
// ════════════════════════════════════════════════════════════════
app.post('/api/track/click', (req, res) => {
  // Fire-and-forget click tracking — log to console for now
  const { dartId } = req.body;
  if (dartId) console.log(`[Track] Affiliate click: dart_id=${dartId}`);
  res.json({ success: true });
});

// ─── BOOT ──────────────────────────────────────────────────────
initWebPush();
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.listen(PORT, () => console.log(`\n🎯 DARTFIT on http://localhost:${PORT}\n`));
module.exports = app;
