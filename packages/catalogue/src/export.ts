/** Prints the validated catalogue as JSON (used by the web build to bundle it). */
import { loadCatalogue } from './index.js';

const { variants, pros, retailers, photos, buyButtons } = loadCatalogue();
// Only what the browser needs to build shop links (no notes, no env names beyond what is public).
const shops = retailers
  .filter((r) => r.affiliateType && r.kind === 'search')
  .filter((r) => !buyButtons || buyButtons.includes(r.affiliateType ?? ''))
  .map(({ id, name, countries, searchTemplate, priority }) => ({
    id,
    name,
    countries,
    searchTemplate,
    priority,
  }));
// Photos by model. The site shows them through the API's /img proxy; the url is used directly only
// by the camera-free preview build.
const photoMap = Object.fromEntries(photos.map((p) => [p.modelId, { url: p.url, cleared: p.cleared }]));
process.stdout.write(JSON.stringify({ variants, pros, shops, photos: photoMap }));
