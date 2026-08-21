// Measures what a browser actually downloads for each page, against the two
// budgets in the brief: under 20 KB of JavaScript gzipped, and under 400 KB
// total page weight including fonts.
//   node scripts/budget.mjs http://localhost:4332
import puppeteer from 'puppeteer-core';
import { gzipSync } from 'node:zlib';

const base = (process.argv[2] || 'http://localhost:4332').replace(/\/$/, '');
const PATHS = ['/', '/thesis', '/method', '/portfolio', '/partner', '/writing'];
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new' });
const pad = (s, n) => String(s).padEnd(n);
const kb = (n) => (n / 1024).toFixed(1);

const rows = [];
for (const path of PATHS) {
  const page = await browser.newPage();
  const seen = new Map();
  page.on('response', async (res) => {
    try {
      const buf = await res.buffer();
      seen.set(res.url(), { type: res.request().resourceType(), raw: buf.length, gz: gzipSync(buf).length });
    } catch { /* redirects and aborted requests have no body */ }
  });
  await page.goto(base + path, { waitUntil: 'networkidle0' });
  // Inline scripts and styles are already inside the document body.
  const inlineSrc = await page.evaluate(() =>
    [...document.querySelectorAll('script:not([src])')].map((s) => s.textContent).join('\n')
  );
  const inlineJs = Buffer.byteLength(inlineSrc);
  const inlineJsGz = inlineJs ? gzipSync(Buffer.from(inlineSrc)).length : 0;
  await page.close();

  let raw = 0, gz = 0, js = 0, jsGz = 0, font = 0;
  for (const [, r] of seen) {
    raw += r.raw; gz += r.gz;
    if (r.type === 'script') { js += r.raw; jsGz += r.gz; }
    if (r.type === 'font') font += r.raw;
  }
  js += inlineJs;
  jsGz += inlineJsGz;
  rows.push({ path, requests: seen.size, raw, gz, js, jsGz, font });
}
await browser.close();

console.log('PAGE WEIGHT — built output, cold cache');
console.log('-'.repeat(92));
console.log(pad('PAGE', 14) + pad('REQ', 6) + pad('TOTAL', 11) + pad('GZIPPED', 11) +
            pad('FONTS', 10) + pad('JS', 9) + 'JS GZIP');
console.log('-'.repeat(92));
for (const r of rows) {
  console.log(
    pad(r.path, 14) + pad(r.requests, 6) + pad(kb(r.raw) + ' KB', 11) +
    pad(kb(r.gz) + ' KB', 11) + pad(kb(r.font) + ' KB', 10) +
    pad(kb(r.js) + ' KB', 9) + kb(r.jsGz) + ' KB'
  );
}
console.log('-'.repeat(92));

const worstTotal = Math.max(...rows.map((r) => r.raw));
const worstJs = Math.max(...rows.map((r) => r.jsGz));
const okTotal = worstTotal < 400 * 1024;
const okJs = worstJs < 20 * 1024;
console.log(`Heaviest page ${kb(worstTotal)} KB (budget 400 KB) — ${okTotal ? 'PASS' : 'FAIL'}`);
console.log(`Most JS ${kb(worstJs)} KB gzipped (budget 20 KB) — ${okJs ? 'PASS' : 'FAIL'}`);
process.exit(okTotal && okJs ? 0 : 1);
