/** Prints the validated catalogue as JSON (used by the web build to bundle it). */
import { loadCatalogue } from './index.js';

const { variants, pros, retailers } = loadCatalogue();
// Only what the browser needs to build shop links (no notes, no env names beyond what is public).
const shops = retailers
  .filter((r) => r.affiliateType && r.kind === 'search')
  .map(({ id, name, countries, searchTemplate, priority }) => ({ id, name, countries, searchTemplate, priority }));
process.stdout.write(JSON.stringify({ variants, pros, shops }));
