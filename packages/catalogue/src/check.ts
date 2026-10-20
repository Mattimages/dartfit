import { loadCatalogue } from './index.js';

try {
  const { variants, pros, retailers } = loadCatalogue();
  const models = new Set(variants.map((v) => v.modelId)).size;
  const byWeight = new Map<number, number>();
  variants.forEach((v) => byWeight.set(v.weightG, (byWeight.get(v.weightG) ?? 0) + 1));
  const missing = {
    grip: variants.filter((v) => v.gripIntensity === null).length,
    balance: variants.filter((v) => v.balance === null).length,
    shape: variants.filter((v) => v.shape === null).length,
    price: variants.filter((v) => v.priceUsd === null).length,
  };
  console.log(`catalogue ok: ${variants.length} variants, ${models} models, ${pros.length} pros, ${retailers.length} retailers`);
  console.log(
    `weights: ${[...byWeight.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([w, n]) => `${w}g×${n}`)
      .join(' ')}`,
  );
  console.log(`unknown fields: ${JSON.stringify(missing)}`);
  const flagged = variants.filter((v) => v.specCheck);
  console.log(
    flagged.length
      ? `listings to re-check (weight does not fit size and alloy):\n${flagged.map((v) => `  ${v.id}: listed ${v.specCheck!.listedG} g, model ${v.specCheck!.modelG} g`).join('\n')}`
      : 'physics check: every listing fits its size and alloy',
  );
} catch (e) {
  console.error((e as Error).message);
  process.exit(1);
}
