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

// ---------- 3. text stays legible over whatever is behind it ----------------
// The graphics lost their dark panels, so nothing guarantees a background
// behind a label any more: it sits on a moving wave field with additive glow
// over it. scripts/contrast.mjs compares token pairs and cannot see a canvas at
// all, and sampling an average would pass a background that fails at its peaks.
//
// So this hides the text, screenshots what is actually behind it at several
// scroll positions, and takes the BRIGHTEST pixel inside each text element's
// own box — the worst case that text ever has to sit on.
{
  const page = await browser.newPage();
  await page.setViewport({ width: W, height: H, deviceScaleFactor: 1 });
  await page.goto(base + '/', { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 2500));

  const lin = (v) => (v / 255 <= 0.04045 ? v / 255 / 12.92 : ((v / 255 + 0.055) / 1.055) ** 2.4);
  const lum = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  const ratio = (a, b) => {
    const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
    return (x + 0.05) / (y + 0.05);
  };

  const SELECTORS = [
    '.hero__h', '.hero__line', '.readout__label', '.readout__value',
    '.entry__facts dd', '.prose p', '.what__p', '.q__text', '.section-h',
  ];

  const worst = new Map();

  for (const y of [0, 1400, 3000, 5200, 7600]) {
    await page.evaluate((sy) => window.scrollTo(0, sy), y);
    await new Promise((r) => setTimeout(r, 900));

    // Where the text is, and what colour it is — measured before hiding it.
    const boxes = await page.evaluate((sels) => {
      const out = [];
      for (const sel of sels) {
        for (const el of document.querySelectorAll(sel)) {
          const r = el.getBoundingClientRect();
          if (r.bottom < 0 || r.top > innerHeight || r.width < 8 || r.height < 6) continue;
          const col = getComputedStyle(el).color.match(/\d+/g).slice(0, 3).map(Number);
          out.push({ sel, x: Math.max(0, r.x | 0), y: Math.max(0, r.y | 0),
                     w: Math.min(innerWidth - (r.x | 0), r.width | 0),
                     h: Math.min(innerHeight - (r.y | 0), r.height | 0), col });
          break; // one instance per selector per position is enough
        }
      }
      return out;
    }, SELECTORS);
    if (!boxes.length) continue;

    // Hide only the text, keep every canvas painting.
    await page.evaluate(() => {
      document.querySelectorAll('main, header.site-head, footer').forEach((e) => {
        e.querySelectorAll('*').forEach((n) => {
          if (!n.querySelector('canvas') && n.tagName !== 'CANVAS') n.style.color = 'transparent';
        });
      });
    });
    await new Promise((r) => setTimeout(r, 400));
    const shot = await page.screenshot({ type: 'png' });
    await page.evaluate(() => {
      document.querySelectorAll('main, header.site-head, footer').forEach((e) => {
        e.querySelectorAll('*').forEach((n) => (n.style.color = ''));
      });
    });

    const img = sharp(shot);
    for (const b of boxes) {
      if (b.w < 4 || b.h < 4) continue;
      const { data, info } = await img
        .clone()
        .extract({ left: b.x, top: b.y, width: b.w, height: b.h })
        .raw()
        .toBuffer({ resolveWithObject: true });
      let best = [0, 0, 0];
      let bl = -1;
      for (let i = 0; i < data.length; i += info.channels * 7) {
        const px = [data[i], data[i + 1], data[i + 2]];
        const l = lum(px);
        if (l > bl) { bl = l; best = px; }
      }
      const r = ratio(b.col, best);
      const prev = worst.get(b.sel);
      if (!prev || r < prev.r) worst.set(b.sel, { r, bg: best });
    }
  }
  await page.close();

  console.log('');
  console.log('TEXT OVER THE FIELD  (brightest pixel inside each text box, 5 scroll positions)');
  console.log('-'.repeat(72));
  for (const [sel, { r, bg }] of worst) {
    const ok = r >= 4.5;
    if (!ok) fail++;
    console.log(`  ${sel.padEnd(20)} ${r.toFixed(2)}:1  over rgb(${bg.join(',')})  ${ok ? 'PASS' : 'FAIL (needs 4.5)'}`);
  }
}

await browser.close();
console.log('');
console.log(fail === 0 ? 'SCENES PASS' : `${fail} scene check(s) failed.`);
process.exit(fail === 0 ? 0 : 1);
