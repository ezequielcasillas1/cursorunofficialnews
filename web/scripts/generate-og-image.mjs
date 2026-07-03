/**
 * One-shot / prebuild: convert public/brand/og-image.svg → og-image.png (1200×630).
 * Run: node scripts/generate-og-image.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const brandDir = join(__dirname, '..', 'public', 'brand');
const svgPath = join(brandDir, 'og-image.svg');
const pngPath = join(brandDir, 'og-image.png');

const svg = readFileSync(svgPath, 'utf8');

let Resvg;
try {
  ({ Resvg } = await import('@resvg/resvg-js'));
} catch {
  console.error('Missing @resvg/resvg-js. Run: npm install --save-dev @resvg/resvg-js --prefix web');
  process.exit(1);
}

const resvg = new Resvg(svg, {
  fitTo: { mode: 'width', value: 1200 },
});
const pngData = resvg.render().asPng();
writeFileSync(pngPath, pngData);
console.log(`Wrote ${pngPath} (${pngData.length} bytes)`);
