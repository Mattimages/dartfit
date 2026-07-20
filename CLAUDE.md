# DartFit — Claude Code Project

## What This Is
A full-stack precision dart-fitting web application. Users scan their hand, answer a questionnaire, optionally measure their forearm (photo pose-analysis or tape measure), and receive a physics-calculated dart recommendation matched against a database of 176 real pro-grade darts and 25 pro player profiles.

**Live stack:** Node.js + Express + SQLite (better-sqlite3) + vanilla JS frontend (single HTML file).

---

## Project Structure

```
dartfit/
├── server.js              # Express API server — all routes
├── package.json           # Dependencies
├── .env.example           # Environment variable template
├── lib/
│   ├── algorithm.js       # Biomechanical fitting algorithm v2 (core logic)
│   ├── database.js        # SQLite schema + 176 dart catalog + 25 pro players
│   └── notifications.js   # Web Push (VAPID) + Nodemailer email alerts
├── test/
│   └── algorithm.test.js  # 25 unit tests (node --test) — run: npm test
├── public/
│   ├── index.html         # Full SPA frontend (single file, no build step)
│   ├── fonts/ + fonts.css # Self-hosted fonts (latin subsets, variable files)
│   ├── sw.js              # Service Worker: push + offline app shell (bump CACHE version on asset changes)
│   ├── manifest.json      # PWA manifest
│   └── icon-192/512.png   # PWA icons (generated with sharp)
└── docs/
    ├── dartfit_audit.docx # Internet-wide biomechanics research audit
    └── v2_*.png           # Current UI screenshots
```

---

## Quick Start

```bash
npm install
cp .env.example .env
# Edit .env — set JWT_SECRET at minimum
npm start
# → http://localhost:3000
```

---

## Architecture

### API Routes (server.js)
| Method | Path | Description |
|--------|------|-------------|
| POST | /api/auth/register | Create account |
| POST | /api/auth/login | Login → JWT |
| GET  | /api/auth/me | Current user + profile |
| GET  | /api/darts | Full dart catalog |
| GET  | /api/pros | Pro player profiles |
| GET  | /api/stats | Catalog stats (darts/pros/brands) for the hero |
| POST | /api/fit/arm-scan | Arm image (+ optional client poseRatio) → forearm estimate |
| POST | /api/fit/calculate | Run biomechanical fitting algorithm |
| POST | /api/fit/save | Save profile to DB (auth required) |
| GET  | /api/fit/history | User's profile history (auth required) |
| GET  | /api/push/vapid-key | Public VAPID key for push setup |
| POST | /api/push/subscribe | Register push subscription |
| POST | /api/push/toggle | Enable/disable notifications |
| POST | /api/admin/darts | Add new dart + auto-notify matching users |
| GET  | /api/admin/users | List all users (admin JWT required) |

### Core Algorithm (lib/algorithm.js)
The fitting engine takes these inputs and returns ideal dart specs:

**Inputs (all clamped to anatomical bounds — see INPUT_BOUNDS):**
- `fingerLength`, `palmWidth`, `gripDiameter`, `fingerSpan`, `fingerFlexIndex` — hand biometrics (mm)
- `heightCm`, `forearmLengthMm` (pose analysis / tape measure / height estimate)
- `gripPreference` (1–5), `weightPreference` (1–5)
- `throwSpeed` (1–5 → 5.0–6.4 m/s release speed), `wristAction` (1–5), `handMoisture` (dry/normal/moist)
- `throwingStyle` — front/middle/rear/varies · `playingLevel` — beginner…competitive
- `handMeasured` — whether biometrics came from a real scan (drives fitConfidence)

**Physics used (v2):**
- Release angle: projectile solve `tanθ = (v² − √(v⁴ − g(gd² + 2Δy·v²)))/(gd)` targeting the bull from release height ≈0.90·height at distance oche − 0.85·forearm — yields the researched 17–37° band
- Arrival pitch feeds the shaft/flight oscillation model (James & Potts 2018, λ≈2.16m)
- Tungsten minimum from barrel geometry: density(pct) ≈ 4.5 + 0.142·pct, fill factor 0.80, plus skill floor
- Leverage ratio = forearmLength / height (population mean 0.148)
- Weight: palm (±2.5g), fingers (∓0.8g), height (±1.2g), leverage (∓1.5g), preference (±4g), level, throw speed (±1.8g), wrist snap (±0.8g)

**Outputs:** `idealWeight/Length/Diameter/GripType/TungstenPct`, `balance`, `barrelShape`, `idealShaft`, `idealFlight`, `setupRationale`, `releaseAngleDeg`, `releaseSpeedMs`, `arrivalAngleDeg`, `leverageRatio`, `archetype` (6 named thrower identities), `fitConfidence` + `confidenceHints`

### Dart Scoring (v2 — server also returns per-component breakdown)
Each dart in the DB is scored against the ideal profile:
- Weight match: **30%**
- Length match: **18%**
- Diameter match: **14%**
- Grip type match: **14%**
- Balance point match: **10%**
- Tungsten density: **8%**
- Barrel shape match: **6%**

The pipeline attaches `breakdown` to every scored dart — the frontend renders these values directly and never recomputes scores.

### Database (lib/database.js)
SQLite auto-seeds on first run. Tables:
- `darts` — 176 real product entries across 17 brands (Target, Winmau, Harrows, Red Dragon, Unicorn, Mission, Shot, Designa, Bull's, One80, Datadart, Cuesoul, Legend, Loxley, …)
- `pro_players` — 25 pro profiles (Littler, Humphries, MvG, Taylor, Smith, van Barneveld, Sherrock, …)
- `users` — accounts with bcrypt passwords
- `profiles` — saved fitting results per user
- `push_subscriptions` — Web Push endpoint/key storage
- `dart_launches` — new dart notifications log

---

## Key Environment Variables (.env)

```bash
PORT=3000
JWT_SECRET=<random-64-char-string>       # Required
VAPID_PUBLIC_KEY=<from npm run generate-vapid>
VAPID_PRIVATE_KEY=<from npm run generate-vapid>
ADMIN_EMAIL=admin@yourdomain.com
APP_URL=https://yourdomain.com          # Used in notification emails
SMTP_HOST=smtp.gmail.com                 # Optional — for email alerts
SMTP_USER=your@gmail.com
SMTP_PASS=your-app-password
```

Generate VAPID keys:
```bash
node -e "const wp=require('web-push');const k=wp.generateVAPIDKeys();console.log('VAPID_PUBLIC_KEY='+k.publicKey+'\nVAPID_PRIVATE_KEY='+k.privateKey);"
```

---

## Notification System — Perfect-Match Alerts
Saving a fit persists the user's **theoretical perfect dart** (full ideal spec:
weight/length/diameter/grip/balance/shape/tungsten/shaft/flight + archetype +
fit confidence) in `profiles`. When an admin POSTs to `/api/admin/darts`:
1. The dart is inserted and the API responds immediately (`{dartId, notifying:true}`)
2. In the background it is scored against each user's **latest** saved perfect spec
3. Score ≥ 75 → standard alert. Score ≥ 90 **or better than the user's saved
   `top_dart_score`** → 🏆 PERFECT-MATCH alert ("your perfect dart just launched")
4. Delivery via Web Push AND email (SMTP hard-capped at 10s/send, never blocks)

Admin promotion: `UPDATE users SET is_admin = 1 WHERE email = '...'` (column
added by migration; login embeds it in the JWT).

## Real-Measurement Guarantees
- Hand capture is **impossible without live MediaPipe landmarks** — the shutter
  is disabled until a hand is locked; nothing is fabricated from empty frames
- Optional true-scale calibration: user-entered hand length (wrist→middle tip, cm)
  replaces the height regression for px→mm scale
- Forearm: tape-measure entry (best) or MediaPipe Pose limb-ratio from photo;
  the skip path uses population estimates and is always labelled ESTIMATED

---

## Biomechanics Research Basis
The algorithm is grounded in peer-reviewed science. Key references in `docs/dartfit_audit.docx`:
- **Throw angle model:** IFSSH 2007 Wrist Biomechanics Committee (DTM plane 30–45° oblique)
- **Joint kinematics:** Huang et al. 2024, Journal of Human Sport & Exercise
- **Aerodynamics:** Pawar et al. 2024, Experiments in Fluids (IIT Kharagpur wind tunnel)
- **Oscillation tuning:** James & Potts 2018, Sports Engineering (wavelength ~2.16m matches oche)
- **Grip force/wrist angle:** Journal of Neurophysiology 2020
- **Optimal release strategy:** PMC 2017 (optimal angle 17–37° pre-vertical, speed 5.1–5.5 m/s)

---

## Known Upgrade Opportunities
From the research audit, these variables are scientifically valid but not yet modelled:
1. **Wrist extension angle at release** → grip texture modifier
2. **Oscillation wavelength tuning** → shaft + flight length recommendation
3. **Throw speed self-assessment** → weight and CoG fine-tuning
4. **Hand moisture profile** → grip texture modifier
5. **Tungsten % by playing level** → minimum density recommendation
6. **Shaft/flight selection** → extend fitting beyond barrel only

---

## Monetisation
- All 22 dart `buy_url` fields use Amazon Associates format: `?tag=dartfit-21`
- Replace `dartfit-21` with your Associates tracking ID
- Target, Winmau, Harrows, Red Dragon all have direct affiliate programmes too

## Deployment
Standard Node.js app. Works on Railway, Render, Fly.io, or any VPS.
Database file auto-created at `./data/dartfit.db` on first run.
