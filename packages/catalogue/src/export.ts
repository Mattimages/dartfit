/** Prints the validated catalogue as JSON (used by the web build to bundle it). */
import { loadCatalogue } from './index.js';

const { variants, pros } = loadCatalogue();
process.stdout.write(JSON.stringify({ variants, pros }));
