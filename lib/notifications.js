'use strict';
const webpush = require('web-push');
const nodemailer = require('nodemailer');
const { getDb } = require('./database');

// ─── VAPID INIT ────────────────────────────────────────────────
function initWebPush() {
  if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
    console.warn('[Push] VAPID keys not set — push notifications disabled');
    return false;
  }
  webpush.setVapidDetails(
    `mailto:${process.env.ADMIN_EMAIL || 'admin@dartfit.app'}`,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
  return true;
}

// ─── EMAIL TRANSPORT ───────────────────────────────────────────
function getMailTransport() {
  if (!process.env.SMTP_HOST) return null;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

// ─── SAVE PUSH SUBSCRIPTION ───────────────────────────────────
function savePushSubscription(userId, subscription) {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO push_subscriptions (user_id, endpoint, p256dh, auth)
    VALUES (?, ?, ?, ?)
  `);
  stmt.run(userId, subscription.endpoint, subscription.keys.p256dh, subscription.keys.auth);
}

// ─── NOTIFY USER (push + email) ───────────────────────────────
async function notifyUser(userId, payload) {
  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  if (!user || !user.notifications_enabled) return;

  const subs = db.prepare('SELECT * FROM push_subscriptions WHERE user_id = ?').all(userId);
  const results = { push: [], email: null };

  // Push notifications
  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify(payload)
      );
      results.push.push({ endpoint: sub.endpoint, status: 'sent' });
    } catch (err) {
      if (err.statusCode === 410 || err.statusCode === 404) {
        db.prepare('DELETE FROM push_subscriptions WHERE endpoint = ?').run(sub.endpoint);
      }
      results.push.push({ endpoint: sub.endpoint, status: 'failed', error: err.message });
    }
  }

  // Email
  const transport = getMailTransport();
  if (transport && user.email) {
    try {
      await transport.sendMail({
        from: `"DartFit" <${process.env.SMTP_FROM || 'noreply@dartfit.app'}>`,
        to: user.email,
        subject: payload.title,
        html: buildEmailHtml(payload),
      });
      results.email = 'sent';
    } catch (err) {
      results.email = `failed: ${err.message}`;
    }
  }

  return results;
}

// ─── BROADCAST NEW DART LAUNCH ─────────────────────────────────
async function broadcastDartLaunch(dartId) {
  const db = getDb();
  const dart = db.prepare('SELECT * FROM darts WHERE id = ?').get(dartId);
  if (!dart) throw new Error('Dart not found');

  // Find users whose profile ideally matches this dart
  const profiles = db.prepare(`
    SELECT p.*, u.id as uid, u.email, u.name
    FROM profiles p
    JOIN users u ON u.id = p.user_id
    WHERE u.notifications_enabled = 1
  `).all();

  const { scoreDart } = require('./algorithm');
  const results = [];

  for (const profile of profiles) {
    const score = scoreDart(dart, {
      idealWeight:    profile.ideal_weight,
      idealLength:    profile.ideal_length_mm,
      idealDiameter:  profile.ideal_diameter_mm,
      idealGripType:  profile.ideal_grip_type,
      balance:        profile.ideal_balance,
      barrelShape:    profile.ideal_barrel_shape,
    });

    // Only notify if this dart is a strong match (score ≥ 75)
    if (score >= 75) {
      const payload = {
        title: `🎯 New Dart Alert — ${dart.brand} ${dart.name}`,
        body: `This new release is a ${score}% match for your DartFit profile! ${dart.weight}g ${dart.barrel_shape} barrel.`,
        dartId: dart.id,
        score,
        url: dart.buy_url,
        icon: '/icon-192.png',
      };
      const r = await notifyUser(profile.uid, payload);
      results.push({ userId: profile.uid, email: profile.email, score, result: r });
    }
  }

  // Mark launch as notified
  db.prepare('UPDATE dart_launches SET notified = 1 WHERE dart_id = ?').run(dartId);
  return results;
}

// ─── EMAIL HTML ────────────────────────────────────────────────
function buildEmailHtml({ title, body, dartId, score, url }) {
  return `
  <!DOCTYPE html>
  <html>
  <head><meta charset="UTF-8"></head>
  <body style="background:#0a0a0a;color:#e8e8e8;font-family:sans-serif;padding:24px;max-width:480px;margin:auto">
    <div style="border-bottom:2px solid #ff5500;padding-bottom:12px;margin-bottom:20px">
      <span style="font-size:28px;font-weight:900;letter-spacing:4px">DART<span style="color:#ff5500">FIT</span></span>
    </div>
    <h2 style="color:#ff5500;font-size:18px;margin-bottom:8px">${title}</h2>
    <p style="color:#aaa;font-size:14px;line-height:1.6;margin-bottom:20px">${body}</p>
    ${url ? `<a href="${url}" style="display:inline-block;background:#ff5500;color:#fff;padding:12px 28px;text-decoration:none;font-weight:700;letter-spacing:2px;font-size:14px">VIEW DART →</a>` : ''}
    <p style="color:#444;font-size:11px;margin-top:28px">You're receiving this because you have a DartFit profile. 
    <a href="/unsubscribe" style="color:#666">Unsubscribe</a></p>
  </body>
  </html>`;
}

module.exports = { initWebPush, savePushSubscription, notifyUser, broadcastDartLaunch };
