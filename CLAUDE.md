# DartFit — notes for working in this repo

Mobile site: measure the throwing hand next to a bank card, fit darts to it, link to affiliate shops. EU-wide (30 countries), NL/EN/DE, steel tip.

## Rules

- No image leaves the device. Only measurements (mm) are sent to the API. Keep it that way.
- No secrets in the browser. The Anthropic key, SMTP and affiliate IDs live on the server.
- Every numeric constant in `packages/engine/src/config.ts` needs a provenance entry; a test enforces it. Bump `ENGINE_VERSION` when fitting output changes.
- The AI explanation may only state numbers present in its input; `apps/api/src/explain.ts` checks this and falls back to the template.
- Strict CSP: no inline style attributes (set `el.style.cssText` via the `h()` helper), no inline scripts, fonts and models self-hosted.
- Only affiliate shops are linked (retailers with `affiliateEnv`; in production the ID must be set). No affiliate link → the dart is not shown. A-Z Darts is a spec source only.
- Results show the best fit per price class (budget ≤ €50, standard ≤ €100, premium), see `priceTiers` and `packages/engine/src/money.ts`.
- Height and forearm (optional) enter via `packages/engine/src/body.ts`: hand estimate without a scan, scan cross-check, and launch-angle physics that sets throw style when the player says "not sure".
- Product photos live in `packages/catalogue/data/photos.csv` and are served from our own origin through the API's `/img/<model>` proxy (CSP keeps `img-src 'self'`; visitors never contact an image CDN). Only `cleared=yes` photos (affiliate-feed images) are shown unless `PREVIEW_PHOTOS=true`. The A-Z Darts photos are `cleared=no`: preview only.
- The result's product box has two views: **Foto** and **Model match** (the dart drawn over the player's ideal barrel, with `silhouetteOverlap` as a %). The choice is site-wide (`apps/web/src/media.ts`).
- Design system: Geist, hairlines (1px `--line`), radii `--r-ctl` 12 / `--r-tile` 16 / `--r-card` 20 / `--r-stage` 24, weights 500–650, tight negative tracking on headings and numbers.
- Country (shops) and language are separate; see `apps/web/src/region.ts`. German lives in `i18n.de.ts` and falls back to English.
- Copy lives in `apps/web/src/i18n.ts`, NL and EN side by side. Write plain Dutch; no "je/u" mixing (use je).

## Engine v3 in one paragraph

Hand dimensions and answers become Gaussian evidence for weight, length and diameter (`fit.ts`). `enforcePhysics` projects the target onto what a real barrel can be: mass from `barrel.ts` (alloy density, bore, piecewise-linear profile, machining factor 0.876 calibrated on 34 straight catalogue barrels, about ±7% IQR). If 90% tungsten can't make it, 95% is tried. `solveIdeal` then picks taper lengths for the wanted mass and balance. `recommend()` ranks catalogue darts by band fit and excludes listings whose stated weight fails the physics check (`specCheck`).

## Commands

`npm test` · `npm run lint` · `npm run typecheck` · `npm run catalogue:check` · `npm run personas` · `npm run calibrate -- file.csv [--write]` · `npm run build:demo` · `npm run build:preview -- <dir>`

## Open items

Gate G1 (10-hand calibration), gate G2 (expert review), affiliate sign-ups, re-check `rd-furnace-24` (listed 24 g, model says 32 g), replace preview photos with affiliate-feed photos (Adtraction feed, bol Partner API, Amazon PA-API) and mark them `cleared=yes`, legal review of privacy text, NL vs UK launch market.
