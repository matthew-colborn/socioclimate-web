// Renders the still frame for each hero scene into public/scenes/<id>.webp.
//
// It drives the real page with prefers-reduced-motion emulated, which is
// exactly the state the engine renders a single deterministic frame in. So the
// poster is not an approximation of the scene — it is the scene at t=0, from
// the same code, with the same seed. If they ever diverge, the bug is in the
// engine, not here.
//
//   npm run build && npm run posters      (then rebuild so the files are copied)
import puppeteer from 'puppeteer-core';
import sharp from 'sharp';
import { mkdirSync, statSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const base = (process.argv[2] || 'http://localhost:4332').replace(/\/$/, '');
const out = resolve(root, 'public/scenes');
mkdirSync(out, { recursive: true });

const W = 1440;
const H = 900;
// The poster is a soft glow field with no hard edges, so it survives being
// stored at well under display size and upscaled by object-fit: cover. It is
// also the LCP element on first paint, which is why this is not 1440 wide.
// The poster is transient in every path — including reduced motion, where the
// canvas immediately renders the same frame deterministically. It only has to
// hold first paint. So it is stored small and slightly softened: a glow field
// survives that invisibly, and the particle noise that WebP cannot compress
// goes away with it.
const OUT_W = 560;
const OUT_H = 350;
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new' });
const page = await browser.newPage();
await page.setViewport({ width: W, height: H, deviceScaleFactor: 1 });
await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
await page.goto(base + '/', { waitUntil: 'networkidle0' });
await new Promise((r) => setTimeout(r, 600));

const slides = await page.evaluate(() =>
  [...document.querySelectorAll('[data-slide]')].map((el) => el.dataset.scene)
);

for (let i = 0; i < slides.length; i++) {
  const id = slides[i];
  // Show the slide so its canvas is laid out and painted.
  await page.evaluate((n) => {
    const els = [...document.querySelectorAll('[data-slide]')];
    els.forEach((el, k) => {
      el.classList.toggle('is-on', k === n);
      el.setAttribute('aria-hidden', k === n ? 'false' : 'true');
      el.style.opacity = k === n ? '1' : '0';
      el.style.visibility = k === n ? 'visible' : 'hidden';
    });
    // Hide the poster img so an older poster cannot be captured into the new one.
    els[n].querySelectorAll('[data-poster]').forEach((p) => (p.style.display = 'none'));
  }, i);
  await new Promise((r) => setTimeout(r, 350));

  const png = await page.evaluate((n) => {
    const c = document.querySelectorAll('[data-slide]')[n].querySelector('canvas');
    return c.toDataURL('image/png');
  }, i);

  const buf = Buffer.from(png.split(',')[1], 'base64');
  const file = resolve(out, `${id}.webp`);
  await sharp(buf)
    .resize(OUT_W, OUT_H, { fit: 'cover' })
    .blur(1.1)
    .webp({ quality: 52, effort: 6, smartSubsample: true })
    .toFile(file);
  const meta = await sharp(file).metadata();
  console.log(
    `${id.padEnd(10)} ${meta.width}x${meta.height}  ${(statSync(file).size / 1024).toFixed(1)} KB`
  );
}

await browser.close();
console.log('\nRebuild so public/scenes/ is copied into dist/.');
