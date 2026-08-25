// Proves two things about the generative scenes rather than asserting them:
//
//   1. A scene is actually animating — captured as a frame sequence with a
//      per-frame difference score, so "it moves" is a number.
//   2. Under prefers-reduced-motion every scene freezes: successive frames a
//      long way apart are pixel-identical, through the same code path.
//
// The carousel this used to drive is gone. There is no transition to measure
// any more, because there is nothing to transition between — each scene now
// sits on the page it belongs to and simply runs. So test 1 measures motion
// within one scene instead of a switch between two.
//
//   node scripts/scene-check.mjs http://localhost:4332
import puppeteer from 'puppeteer-core';
import sharp from 'sharp';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const base = (process.argv[2] || 'http://localhost:4332').replace(/\/$/, '');
const out = resolve(root, 'screenshots/scene-check');
mkdirSync(out, { recursive: true });

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const W = 1200, H = 750;

/** Mean absolute difference per pixel, 0..255. */
async function diff(a, b) {
  const [x, y] = await Promise.all(
    [a, b].map((f) => sharp(f).resize(160, 100, { fit: 'fill' }).greyscale().raw().toBuffer())
  );
  let s = 0;
  for (let i = 0; i < x.length; i++) s += Math.abs(x[i] - y[i]);
  return s / x.length;
}

const clipTo = async (page, sel) => {
  const box = await page.$eval(sel, (el) => {
    const r = el.getBoundingClientRect();
    return { x: r.x, y: r.y, width: r.width, height: r.height };
  });
  return {
    x: Math.max(0, Math.round(box.x)),
    y: Math.max(0, Math.round(box.y)),
    width: Math.round(box.width),
    height: Math.round(box.height),
  };
};

const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new' });
let fail = 0;

// ---------- 1. the scene animates -------------------------------------------
{
  const page = await browser.newPage();
  await page.setViewport({ width: W, height: H, deviceScaleFactor: 1 });
  await page.goto(base + '/', { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 2200));  // past the draw-in ramp

  await page.evaluate(() => document.querySelector('.hero__field .field')?.scrollIntoView({ block: 'center' }));
  await new Promise((r) => setTimeout(r, 800));
  const clip = await clipTo(page, '.hero__field .field');
  const frames = [];
  for (let i = 0; i <= 6; i++) {
    const f = resolve(out, `motion-${String(i).padStart(2, '0')}.png`);
    await page.screenshot({ path: f, clip });
    frames.push(f);
    if (i < 6) await new Promise((r) => setTimeout(r, 220));
  }

  console.log('SCENE MOTION  (frame → difference from frame 0)');
  console.log('-'.repeat(58));
  let peak = 0;
  for (let i = 1; i < frames.length; i++) {
    const d = await diff(frames[0], frames[i]);
    peak = Math.max(peak, d);
    console.log(`  frame ${String(i).padStart(2, '0')}   ${d.toFixed(2)}`);
  }
  console.log(`  peak difference ${peak.toFixed(2)}`);
  if (peak < 1) { fail++; console.log('  FAIL — the scene is not moving'); }
  else console.log('  PASS — the scene is animating');
  await page.close();
}

// ---------- 2. reduced motion freezes every scene ----------------------------
// One page now, so both live on it. Fields are built lazily on approach, which
// is why each is scrolled to before being measured.
for (const [route, sel, name] of [
  ['/', '.hero__field .field', 'flame (hero)'],
  ['/', '.entry__figure .field', 'ridge (portfolio section)'],
]) {
  const page = await browser.newPage();
  await page.setViewport({ width: W, height: H, deviceScaleFactor: 1 });
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  await page.goto(base + route, { waitUntil: 'networkidle0' });
  await page.evaluate((s) => document.querySelector(s)?.scrollIntoView({ block: 'center' }), sel);
  await new Promise((r) => setTimeout(r, 1800));

  const clip = await clipTo(page, sel);
  const slug = name.split(' ')[0];
  const a = resolve(out, `frozen-${slug}-a.png`);
  const b = resolve(out, `frozen-${slug}-b.png`);
  await page.screenshot({ path: a, clip });
  await new Promise((r) => setTimeout(r, 6000));
  await page.screenshot({ path: b, clip });

  const d = await diff(a, b);
  console.log('');
  console.log(`REDUCED MOTION — ${name}  (6s apart)`);
  console.log('-'.repeat(58));
  console.log(`  frame difference   ${d.toFixed(4)}`);
  if (d > 0.01) { fail++; console.log('  FAIL — the scene did not freeze'); }
  else console.log('  PASS — pixel-identical, the scene is frozen');
  await page.close();
}

await browser.close();
console.log('');
console.log(fail === 0 ? 'SCENES PASS' : `${fail} scene check(s) failed.`);
process.exit(fail === 0 ? 0 : 1);
