# DartFit

Measure your throwing hand next to a bank card and get darts fitted to your grip and build. EU-wide: 30 countries (EU, UK, CH, NO), Dutch, English and German. Steel tip.

The phone measures the hand on the device (MediaPipe landmarks plus a card homography). Only the measurements go to the server. The engine combines them with a few questions about how you throw, works out the ideal barrel (weight, length, diameter, profile, grip zone, balance), checks that the barrel can be built from real tungsten, and ranks real darts from the catalogue against it. Each pick links to a shop.

## Layout

| Path                 | What it is                                                                                                                                                                                                       |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/engine`    | Pure TypeScript fitting engine: measurement, evidence fusion, barrel physics, ideal-barrel solver, matching, template explanation. Every number in `config.ts` has a provenance entry.                           |
| `packages/catalogue` | `data/variants.csv` (132 darts across 98 models and 7 brands, source URL and verification date per row), loader, schema, link and spec checks.                                                                   |
| `apps/api`           | Express 5 API: fits, `/go` affiliate redirect with click log, magic-link accounts, price alerts, AI explanation with a number-grounding check, background jobs. Postgres in production, PGlite in dev and tests. |
| `apps/web`           | Vite + vanilla TS mobile site (PWA): scan, ruler fallback, questions, fitting animation, result with technical drawing, catalogue, method and privacy pages.                                                     |
| `scripts`            | Calibration report (gate G1), persona report, model download, screenshots, preview build.                                                                                                                        |

## Run it

```sh
npm install
npm run dev:api      # API on :3000 with an embedded database
npm run dev          # site on :5173, proxies /api and /go to the API
npm test             # 168 tests
npm run lint && npm run typecheck
```

`npm run build:demo` builds a static version that runs the engine in the browser with the catalogue bundled and stores nothing. `npm run build:preview -- <dir>` builds the single-file, camera-free variant used for the shareable preview.

## Deploy

1. Copy `.env.example` to `.env` (or set the variables on the host). Production refuses to start without `DATABASE_URL`, an https `PUBLIC_URL`, and a real `SESSION_SECRET`.
2. `docker build -t dartfit .` then run it with the env. The image runs migrations on start, serves the site and the API on port 3000, and runs the job worker in-process (`RUN_WORKER=false` plus `npm run worker` to split it out).
3. The build tries `npm run fetch-model` for the better MediaPipe Tasks hand model; if that download fails, the bundled MediaPipe Hands detector is used.

The camera needs https. The site sets a strict CSP (no inline styles or scripts, self-hosted fonts and models).

## Before launch

- **Calibration (gate G1).** Tape-measure at least 10 hands, scan each, put the pairs in a CSV and run `npm run calibrate -- file.csv`. It reports the error per dimension and, with `--write`, updates `packages/engine/src/calibration.ts`. Until then the site says measurements are uncalibrated.
- **Expert review (gate G2).** Have a fitter or shop owner go through `npm run personas` and the method page.
- **Affiliate programmes.** Shops per country live in `packages/catalogue/data/retailers.json`: darts specialists first (Darts Corner via Adtraction, Dartsturm via Shopper.com), then bol.com, Amazon (9 EU marketplaces) and eBay Partner Network. Sign up and fill the IDs in `.env` (see `.env.example`). Only shops with an affiliate programme are ever linked; in production a shop only appears once its ID is set. Check every search template and eBay rotation ID in the network dashboard before launch.
- **Photos.** `packages/catalogue/data/photos.csv` holds one photo per model, proxied through `/img/<model>` so visitors never load from a third party. The current photos come from the spec source and are marked `cleared=no` (shown only with `PREVIEW_PHOTOS=true`). Before launch, take photos from the affiliate feeds, whose terms allow showing them, and mark those `cleared=yes`.
- **Catalogue.** `npm run catalogue:check` validates the CSV and lists darts whose stated weight does not fit their size and alloy (these are excluded from recommendations until re-checked). The API's link-check job flags dead shop links.
- **Legal.** Have the privacy text and the affiliate disclosure reviewed; set `COMPANY_LINE` with the KvK number.
