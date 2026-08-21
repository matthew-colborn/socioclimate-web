// Screenshots at the two widths that matter, against a running server.
//   node scripts/shots.mjs http://localhost:4331
import puppeteer from 'puppeteer-core';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const base = (process.argv[2] || 'http://localhost:4331').replace(/\/$/, '');
const out = resolve(root, 'screenshots');
mkdirSync(out, { recursive: true });

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
// The brief asks for / and /thesis. Extra routes can be appended as arguments
// when reviewing the rest of the site.
const PAGES = process.argv.length > 3 ? process.argv.slice(3) : ['/', '/thesis'];
const WIDTHS = [390, 1440];

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--hide-scrollbars', '--force-color-profile=srgb'],
});

for (const path of PAGES) {
  for (const width of WIDTHS) {
    const page = await browser.newPage();
    await page.setViewport({ width, height: width === 390 ? 844 : 900, deviceScaleFactor: 2 });
    // The reveal animation only fires on intersection; disable it so a full-page
    // capture is not a column of invisible sections.
    await page.emulateMediaFeatures([
      { name: 'prefers-reduced-motion', value: 'reduce' },
    ]);
    await page.goto(base + path, { waitUntil: 'networkidle0' });
    await page.evaluate(() => {
      document.querySelectorAll('.reveal').forEach((el) => el.classList.add('is-in'));
      // A sticky, backdrop-filtered header repaints at every scroll offset during
      // a full-page capture and smears across the image.
      const head = document.querySelector('.site-head');
      if (head) {
        head.style.position = 'static';
        head.style.backdropFilter = 'none';
      }
      // Smooth scrolling makes a stitched full-page capture duplicate bands of
      // the page, because the scroll has not settled when the frame is taken.
      document.documentElement.style.scrollBehavior = 'auto';
    });
    const name = (path === '/' ? 'home' : path.slice(1).replace(/\//g, '-')) + `-${width}`;
    await page.screenshot({
      path: resolve(out, `${name}.png`),
      fullPage: true,
      captureBeyondViewport: true,
    });
    console.log(`${name}.png`);
    await page.close();
  }
}

await browser.close();
