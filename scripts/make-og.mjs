// Builds the Open Graph card and the touch icon from the stacked lockup, on
// --ink-black. Run with `npm run og`. The output is committed under public/ so
// the build itself stays free of image processing.
import sharp from 'sharp';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const STACKED = resolve(root, 'brand/logo-stacked.jpeg');

const INK_BLACK = { r: 0, g: 0, b: 0, alpha: 1 };
const W = 1200;
const H = 630;

// Regions measured off brand/logo-stacked.jpeg (784 x 1168).
const FLAME = { left: 196, top: 96, width: 392, height: 760 };
const WORD = { left: 100, top: 892, width: 584, height: 96 };

mkdirSync(resolve(root, 'public/og'), { recursive: true });

const flame = await sharp(STACKED)
  .extract(FLAME)
  .resize({ height: 430 })
  .toBuffer();
const flameMeta = await sharp(flame).metadata();

const word = await sharp(STACKED)
  .extract(WORD)
  .resize({ width: 560 })
  .toBuffer();
const wordMeta = await sharp(word).metadata();

const FLAME_X = 150;
const FLAME_Y = Math.round((H - flameMeta.height) / 2) - 18;
const WORD_X = FLAME_X + flameMeta.width + 92;
const WORD_Y = Math.round((H - wordMeta.height) / 2) - 34;

// A single cyan hairline under the wordmark. No text is drawn: librsvg's font
// resolution is not dependable across machines, and a card that renders
// differently on the build box than it does here is worse than a plain one.
const rule = Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
     <rect x="${WORD_X}" y="${WORD_Y + wordMeta.height + 34}" width="560" height="2" fill="#00D8E7" opacity="0.55"/>
     <rect x="${WORD_X}" y="${WORD_Y + wordMeta.height + 34}" width="112" height="2" fill="#99FFFF"/>
   </svg>`
);

await sharp({
  create: { width: W, height: H, channels: 4, background: INK_BLACK },
})
  .composite([
    { input: flame, left: FLAME_X, top: FLAME_Y },
    { input: word, left: WORD_X, top: WORD_Y },
    { input: rule, left: 0, top: 0 },
  ])
  .png({ compressionLevel: 9, palette: true })
  .toFile(resolve(root, 'public/og/socioclimate-og.png'));

// Touch icon: the flame alone, square, on the same field.
const icon = await sharp(STACKED).extract(FLAME).resize({ height: 150 }).toBuffer();
const iconMeta = await sharp(icon).metadata();
await sharp({
  create: { width: 180, height: 180, channels: 4, background: INK_BLACK },
})
  .composite([
    {
      input: icon,
      left: Math.round((180 - iconMeta.width) / 2),
      top: Math.round((180 - iconMeta.height) / 2),
    },
  ])
  .png({ compressionLevel: 9 })
  .toFile(resolve(root, 'public/apple-touch-icon.png'));

for (const f of ['public/og/socioclimate-og.png', 'public/apple-touch-icon.png']) {
  const m = await sharp(resolve(root, f)).metadata();
  console.log(`${f.padEnd(34)} ${m.width}x${m.height}  ${(m.size / 1024).toFixed(1)} KB`);
}
