// Builds the Open Graph card and the touch icon. Run with `npm run og`. The
// output is committed under public/ so the build itself stays free of image
// processing.
//
// This used to crop two rectangles out of brand/logo-stacked.jpeg and paste
// them onto a field. That worked only while the field was pure black, because
// the crops carry the JPEG's own black background with them — on the current
// --void ground they showed as two black boxes, and they were still the old
// bright cyan besides.
//
// So the card is now rendered from the design system itself: the traced flame
// contour, the real wordmark in the real self-hosted face, on the real tokens.
// It cannot drift from the site's palette because it reads the same values.
import puppeteer from 'puppeteer-core';
import sharp from 'sharp';
import { mkdirSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
mkdirSync(resolve(root, 'public/og'), { recursive: true });

// Read the palette out of tokens.css rather than repeating it here.
const css = readFileSync(resolve(root, 'src/styles/tokens.css'), 'utf8');
const T = {};
for (const m of css.matchAll(/^\s*(--[a-z0-9-]+):\s*(#[0-9A-Fa-f]{6});/gm)) T[m[1]] = m[2];

// Straight out of the favicon, so the card and the tab icon are the same
// contour by construction rather than by somebody remembering to update both.
const FLAME_D = /\sd="([^"]+)"/.exec(readFileSync(resolve(root, 'public/favicon.svg'), 'utf8'))[1];
const INTER = readFileSync(resolve(root, 'public/fonts/inter-var-latin.woff2')).toString('base64');

const card = (w, h, body) => `<!doctype html><html><head><meta charset="utf-8"><style>
  @font-face {
    font-family: 'Inter Variable'; font-style: normal; font-weight: 100 900;
    src: url(data:font/woff2;base64,${INTER}) format('woff2');
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: ${w}px; height: ${h}px; }
  body {
    background: ${T['--void']};
    font-family: 'Inter Variable', sans-serif;
    display: flex; align-items: center; justify-content: center;
    overflow: hidden;
  }
  .flame { filter:
    drop-shadow(0 0 3px ${T['--cyan-glow']}aa)
    drop-shadow(0 0 18px ${T['--cyan']}88)
    drop-shadow(0 0 52px ${T['--cyan']}44); }
  .flame path { fill: ${T['--cyan']}38; stroke: ${T['--cyan']}; stroke-width: 7; stroke-linejoin: round; }
</style></head><body>${body}</body></html>`;

const flameSvg = (h) =>
  `<svg class="flame" viewBox="0 0 160 305" height="${h}" xmlns="http://www.w3.org/2000/svg"><path d="${FLAME_D}"/></svg>`;

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--hide-scrollbars', '--force-color-profile=srgb'],
});

// --- The card -------------------------------------------------------------
{
  const W = 1200, H = 630;
  const page = await browser.newPage();
  await page.setViewport({ width: W, height: H, deviceScaleFactor: 1 });
  await page.setContent(
    card(W, H, `
      <div style="display:flex;align-items:center;gap:76px">
        ${flameSvg(400)}
        <div>
          <div style="font-size:88px;font-weight:500;letter-spacing:-0.028em;line-height:1;white-space:nowrap">
            <span style="color:${T['--ink']}">Socio</span><span style="color:${T['--cyan']}">Climate</span>
          </div>
          <div style="height:2px;width:560px;margin-top:34px;background:${T['--cyan']}8c"></div>
          <div style="height:2px;width:112px;margin-top:-2px;background:${T['--gold']}"></div>
          <div style="margin-top:30px;font-size:27px;font-weight:300;color:${T['--ink-2']};letter-spacing:-0.01em">
            Dormant data in, decisions and revenue out.
          </div>
        </div>
      </div>`),
    { waitUntil: 'load' }
  );
  await page.evaluateHandle('document.fonts.ready');
  await new Promise((r) => setTimeout(r, 250));
  const buf = await page.screenshot({ type: 'png' });
  await sharp(buf).png({ compressionLevel: 9 }).toFile(resolve(root, 'public/og/socioclimate-og.png'));
  await page.close();
}

// --- The touch icon: the flame alone, square, on the same field -----------
{
  const page = await browser.newPage();
  await page.setViewport({ width: 180, height: 180, deviceScaleFactor: 1 });
  await page.setContent(card(180, 180, flameSvg(132)), { waitUntil: 'load' });
  await new Promise((r) => setTimeout(r, 200));
  const buf = await page.screenshot({ type: 'png' });
  await sharp(buf).png({ compressionLevel: 9 }).toFile(resolve(root, 'public/apple-touch-icon.png'));
  await page.close();
}

await browser.close();

for (const f of ['public/og/socioclimate-og.png', 'public/apple-touch-icon.png']) {
  const p = resolve(root, f);
  const m = await sharp(p).metadata();
  const kb = (readFileSync(p).length / 1024).toFixed(1);
  console.log(`${f.padEnd(34)} ${m.width}x${m.height}  ${kb} KB`);
}
