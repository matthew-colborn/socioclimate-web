// Proves two things about the hero rather than asserting them:
//
//   1. A scene transition actually happens — captured as a frame sequence
//      across a switch, with a per-frame difference score so the change is a
//      number and not an impression.
//   2. Under prefers-reduced-motion the hero freezes: no auto-advance, the
//      pause control is hidden, and successive frames are pixel-identical.
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

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--autoplay-policy=no-user-gesture-required'],
});

let fail = 0;

// ---------- 1. transition ----------------------------------------------------
{
  const page = await browser.newPage();
  await page.setViewport({ width: W, height: H, deviceScaleFactor: 1 });
  await page.goto(base + '/', { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 2000));

  const frames = [];
  const shot = async (n) => {
    const f = resolve(out, `transition-${String(n).padStart(2, '0')}.png`);
    await page.screenshot({ path: f, clip: { x: 0, y: 0, width: W, height: H } });
    frames.push(f);
  };

  await shot(0);
  // Drive the switch through the real control, not an internal call.
  await page.evaluate(() => document.querySelectorAll('[data-goto]')[1].click());
  for (let i = 1; i <= 6; i++) {
    await new Promise((r) => setTimeout(r, 180));
    await shot(i);
  }

  console.log('SCENE TRANSITION  (frame → difference from frame 0)');
  console.log('-'.repeat(58));
  let peak = 0;
  for (let i = 1; i < frames.length; i++) {
    const d = await diff(frames[0], frames[i]);
    peak = Math.max(peak, d);
    console.log(`  frame ${String(i).padStart(2, '0')}   ${d.toFixed(2)}`);
  }
  const label = await page.evaluate(
    () => document.querySelector('[data-goto][aria-current="true"]')?.getAttribute('aria-label')
  );
  console.log(`  peak difference ${peak.toFixed(2)}  ·  now: ${label}`);
  if (peak < 3) { fail++; console.log('  FAIL — frames barely changed; the transition did not run'); }
  else console.log('  PASS — the scene visibly changed');
  await page.close();
}

// ---------- 2. reduced motion ------------------------------------------------
{
  const page = await browser.newPage();
  await page.setViewport({ width: W, height: H, deviceScaleFactor: 1 });
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  await page.goto(base + '/', { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 1200));

  const a = resolve(out, 'reduced-a.png');
  const b = resolve(out, 'reduced-b.png');
  await page.screenshot({ path: a, clip: { x: 0, y: 0, width: W, height: H } });
  // Longer than the 7.2s auto-advance interval: if rotation were running, the
  // scene would have changed by now.
  await new Promise((r) => setTimeout(r, 8500));
  await page.screenshot({ path: b, clip: { x: 0, y: 0, width: W, height: H } });

  const d = await diff(a, b);
  const state = await page.evaluate(() => ({
    current: document.querySelector('[data-goto][aria-current="true"]')?.textContent?.trim(),
    pauseHidden: document.querySelector('[data-pause]')?.hasAttribute('hidden') ?? null,
    live: document.querySelector('[data-live]')?.getAttribute('aria-live'),
  }));

  console.log('');
  console.log('REDUCED MOTION  (8.5s apart, auto-advance interval is 7.2s)');
  console.log('-'.repeat(58));
  console.log(`  frame difference   ${d.toFixed(3)}`);
  console.log(`  active scene       ${state.current}`);
  console.log(`  pause control      ${state.pauseHidden ? 'hidden' : 'VISIBLE'}`);
  console.log(`  aria-live          ${state.live}`);
  const ok = d < 0.5 && state.current === '01' && state.pauseHidden === true;
  if (!ok) { fail++; console.log('  FAIL — the hero did not freeze'); }
  else console.log('  PASS — frozen, no advance, pause control withdrawn');
  await page.close();
}

await browser.close();
console.log('');
console.log(fail === 0 ? 'PASS' : `${fail} check(s) failed`);
process.exit(fail === 0 ? 0 : 1);
