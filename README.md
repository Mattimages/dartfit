# 🎯 DartFit

**Precision biomechanical dart matching — the only algorithm-driven dart fitting tool.**

---

## Setup in 60 seconds

```bash
npm install
cp .env.example .env         # fill in JWT_SECRET (required)
npm start                    # → http://localhost:3000
```

## Features
- Hand scan via mobile camera
- Arm photo analysis for leverage vector calculation
- 5-question questionnaire (height, grip, weight, throw position, level)
- Biomechanical algorithm using height, palm width, forearm ratio
- 22 real darts in SQLite database
- 8 pro player profiles for comparison
- AI explanation via Anthropic API
- User accounts + profile saving
- Push notifications when a new matching dart launches
- Affiliate links built in

## File Map
| File | Role |
|------|------|
| `server.js` | Express API — all routes |
| `lib/algorithm.js` | Core biomechanical fitting engine |
| `lib/database.js` | SQLite schema + full dart/pro catalog |
| `lib/notifications.js` | Push + email notification system |
| `public/index.html` | Full SPA frontend |
| `docs/dartfit_audit.docx` | Research audit (22 sources) |
| `CLAUDE.md` | Full Claude Code context |

## Environment
See `.env.example` for all variables. Only `JWT_SECRET` is required to run locally.

## Research Basis
See `docs/dartfit_audit.docx` for the full internet-wide audit covering:
- Wrist biomechanics (IFSSH)
- Dart aerodynamics (IIT Kharagpur wind tunnel, 2024)
- Grip force research (Journal of Neurophysiology)
- Joint kinematics (Journal of Human Sport & Exercise, 2024)
- Professional fitting service methodologies (Dartworks, Red Dragon, Mission)
