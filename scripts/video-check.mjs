// Checks that the brand animations behave in both motion modes:
//   motion allowed  — the <video> is displayed and actually playing
//   reduced motion  — the <video> is gone and the poster still is displayed
// Also captures the two clips in place for review.
//   node scripts/video-check.mjs http://localhost:4332
import puppeteer from 'puppeteer-core';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const base = (process.argv[2] || 'http://localhost:4332').replace(/\/$/, '');
const shots = resolve(root, 'screenshots');
mkdirSync(shots, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: 'new',
  args: ['--autoplay-policy=no-user-gesture-required'],
});

const read = (page) =>
  page.evaluate(() =>
    [...document.querySelectorAll('.bv')].map((bv) => {
      const v = bv.querySelector('video');
      const i = bv.querySelector('img');
      return {
        clip: (v.currentSrc || v.querySelector('source').src).split('/').pop(),
        video: getComputedStyle(v).display,
        playing: !v.paused && v.currentTime > 0,
        still: getComputedStyle(i).display,
      };
    })
  );

const pad = (s, n) => String(s).padEnd(n);
let bad = 0;

console.log('BRAND VIDEO BEHAVIOUR');
console.log('-'.repeat(78));

// --- motion allowed -------------------------------------------------------
{
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
  await page.goto(base + '/', { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 2500));
  for (const r of await read(page)) {
    const ok = r.video === 'block' && r.playing && r.still === 'none';
    if (!ok) bad++;
    console.log(pad('motion', 10) + pad(r.clip, 14) + pad(`video:${r.video}`, 16) +
                pad(`playing:${r.playing}`, 16) + pad(`still:${r.still}`, 14) + (ok ? 'OK' : 'WRONG'));
  }

  await page.screenshot({
    path: resolve(shots, 'hero-video-1440.png'),
    clip: { x: 0, y: 0, width: 1440, height: 620 },
  });
  const band = await page.evaluate(() => {
    const r = document.querySelector('.band').getBoundingClientRect();
    return { top: r.top + window.scrollY, h: r.height };
  });
  await page.screenshot({
    path: resolve(shots, 'band-video-1440.png'),
    clip: { x: 0, y: band.top, width: 1440, height: band.h },
  });
  await page.close();
}

// --- reduced motion -------------------------------------------------------
{
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  await page.goto(base + '/', { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 800));
  for (const r of await read(page)) {
    const ok = r.video === 'none' && r.still === 'block';
    if (!ok) bad++;
    console.log(pad('reduced', 10) + pad(r.clip, 14) + pad(`video:${r.video}`, 16) +
                pad(`playing:${r.playing}`, 16) + pad(`still:${r.still}`, 14) + (ok ? 'OK' : 'WRONG'));
  }
  await page.close();
}

await browser.close();
console.log('-'.repeat(78));
console.log(bad === 0 ? 'PASS' : `${bad} clip(s) behaving wrongly`);
process.exit(bad === 0 ? 0 : 1);
