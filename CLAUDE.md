# DartFit — notes for working in this repo

Mobile site: measure the throwing hand next to a bank card, fit darts to it, link to affiliate shops. EU-wide (30 countries), NL/EN/DE, steel tip.

## Rules

- No image leaves the device. Only measurements (mm) are sent to the API. Keep it that way.
- No secrets in the browser. The Anthropic key, SMTP and affiliate IDs live on the server.
- Every numeric constant in `packages/engine/src/config.ts` needs a provenance entry; a test enforces it. Bump `ENGINE_VERSION` when fitting output changes.
- The AI explanation may only state numbers present in its input; `apps/api/src/explain.ts` checks this and falls back to the template.
- Strict CSP: no inline style attributes (set `el.style.cssText` via the `h()` helper), no inline scripts, fonts and models self-hosted.
- Only affiliate shops are linked (retailers with `affiliateEnv`; in production the ID must be set). No affiliate link → the dart is not shown. A-Z Darts is a spec source only.
- Results show the best fit per price class (budget ≤ €50, standard ≤ €80, premium), see `priceTiers` and `packages/engine/src/money.ts`.
- Height and forearm (optional) enter via `packages/engine/src/body.ts`: hand estimate without a scan, scan cross-check, and launch-angle physics that sets throw style when the player says "not sure".
- Product photos live in `packages/catalogue/data/photos.csv` and are served from our own origin through the API's `/img/<model>` proxy (CSP keeps `img-src 'self'`; visitors never contact an image CDN). All photos are shown (`PREVIEW_PHOTOS` defaults to true, owner's decision 22 Oct); `cleared` marks which come from an affiliate feed, and `PREVIEW_PHOTOS=false` limits the site to those.
- The result's product box has two views: **Foto** and **Model match** (the dart drawn over the player's ideal barrel, with `silhouetteOverlap` as a %). The choice is site-wide (`apps/web/src/media.ts`).
- Design system: Geist, hairlines (1px `--line`), radii `--r-ctl` 12 / `--r-tile` 16 / `--r-card` 20 / `--r-stage` 24, weights 500–650, tight negative tracking on headings and numbers.
- Each result dart shows three columns (`views/match-split.ts`, engine `matchBreakdown`): shape match (weight, length, thickness), style match (type, knurling, balance) and the total, which is the usual match score; the parts use the same curve with their share of `match.weights`. The landing film shows the same three numbers (and ranks by the total) after it fills in the hold and grip questions.
- The questionnaire asks height, hold, fingers, throw and grip (steel tip only; no thickness, hand-moisture, current-dart or price-class questions: the engine uses `thickness: 'auto'` and `moisture: 'normal'`, and the result always shows all three price classes). Its live dart (`views/quiz-dart.ts`) follows every answer the way the engine reads it: hold spot and finger zone (`gripZone`), barrel shape for that hold, shaft and flight (`setupFor`), knurling from the grip slider. The landing film's question step uses the same dart.
- After the questionnaire, `views/fitting.ts` plays the landing film's ending with the player's own result (`castFor` with the real result pinned and 2 near misses, `fitFilm`; while the fit loads, three darts land on a board): their ideal dart, a score carousel of three real darts rising to their best match, a bullseye moment, then their price options; it ends on "See my darts". No hand or answer replay there.
- No card at hand: the scan page offers a no-card scan behind a clear warning (`scanner.ts` `noCard`, `unscaledResult`). It measures in pixels and keeps only the proportions (`Measurements.unscaled`); the engine sizes the hand from height (else the reference hand) with that height spread, so bands widen and confidence drops (engine 3.3). The measurement screen shows only the finger/palm proportion, the height question and the result page say it is less precise.
- The hand detector heals itself (`scan/detector.ts`): after repeated errors, or 10 s without a hand while frames come in, it is rebuilt (a stuck first load used to need a page reload).
- A result ends with "keep me posted" (`apps/web/src/views/alert-signup.ts`): double opt-in through `/api/auth/request` with `purpose: 'alerts'`, and an alert goes out only when a new dart becomes that person's best match (`jobs.ts`). Mail needs `SMTP_URL`; without it messages only land in the `outbox` table.
- The hand drawing (`draw/art.ts`) is traced from the 21 landmarks; skin tone comes from CSS custom properties (`SKIN_TONES`), and the landing film picks a new one each loop.
- US visitors (country `US`) get Darting.com as their shop (`darting_us`, affiliate ID in `DARTING_AFF_ID`, added as `AffId`) and a Darting.com partner card on the home and result pages (`views/partner.ts`, link `/go/partner:darting` with `AFFBanId=10025`). Built in our own markup: never paste partner banner scripts (CSP, privacy). Darting links go to the homepage until its search URL is confirmed.
- Amazon: only stores with a tag are linked. amazon.nl (NL, BE), amazon.co.uk (GB, IE), amazon.de (DE and the rest of the EU, as it ships EU-wide), amazon.com (US); tags in `AMAZON_TAG_NL/UK/DE/US` on Vercel. amazon.fr/it/es/se/pl/com.be have no tag and no countries; add both together.
- Buy buttons show Amazon only: `buyButtons: ["amazon"]` in `retailers.json` filters both the API offers and the browser bundle; the other affiliate shops stay configured (drop or extend the list to bring them back). The first tap on a buy button opens an email sign-in (`views/buy-gate.ts`, double opt-in via `purpose: 'alerts'`); both of its buttons are real links to the shop, so buying is never blocked. It shows once per visit and never again after signing up or for a saved fit.
- Country (shops) and language are separate; see `apps/web/src/region.ts`. The picker (`views/region-picker.ts`, a modal) opens on the first visit with the browser's guess pre-selected and from the globe in the header; search knows English and Dutch names too. German lives in `i18n.de.ts` and falls back to English.
- Copy lives in `apps/web/src/i18n.ts`, NL and EN side by side. Write plain Dutch; no "je/u" mixing (use je).

## Engine v3 in one paragraph

Hand dimensions and answers become Gaussian evidence for weight, length and diameter (`fit.ts`). `enforcePhysics` projects the target onto what a real barrel can be: mass from `barrel.ts` (alloy density, bore, piecewise-linear profile, machining factor 0.876 calibrated on 34 straight catalogue barrels, about ±7% IQR). If 90% tungsten can't make it, 95% is tried. Shape starts from hold and throw, then the measured hand nudges it (`handShapeNudge`, config `handShape`): short fingers for the palm and a compact grip lean towards bomb/torpedo, long fingers spread along the barrel towards straight; estimated hands (height) don't nudge. `solveIdeal` then picks taper lengths for the wanted mass and balance, leaning towards the preferred shape's reference profile and moving the diameter within `handShape.diameterFlex` to keep the weight; the ideal is labelled by its nearest reference shape. `recommend()` ranks catalogue darts by band fit and excludes listings whose stated weight fails the physics check (`specCheck`).

## Commands

`npm test` · `npm run lint` · `npm run typecheck` · `npm run catalogue:check` · `npm run personas` · `npm run calibrate -- file.csv [--write]` · `npm run build:demo` · `npm run build:preview -- <dir>`

## Open items

Gate G1 (10-hand calibration), gate G2 (expert review), affiliate sign-ups, re-check `rd-furnace-24` (listed 24 g, model says 32 g), legal review of privacy text, NL vs UK launch market.
