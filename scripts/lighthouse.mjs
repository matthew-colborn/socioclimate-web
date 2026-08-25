// Lighthouse, mobile profile, against the built output.
//   npm run build && node scripts/lighthouse.mjs http://localhost:4332
import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';

const base = (process.argv[2] || 'http://localhost:4332').replace(/\/$/, '');
const PATHS = ['/'];
const CATEGORIES = ['performance', 'accessibility', 'best-practices', 'seo'];

const chrome = await chromeLauncher.launch({
  chromePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  chromeFlags: ['--headless=new', '--no-sandbox'],
});

const pad = (s, n) => String(s).padEnd(n);
const rows = [];
let worst = 100;

for (const path of PATHS) {
  const { lhr } = await lighthouse(
    base + path,
    { port: chrome.port, output: 'json', logLevel: 'error' },
    // Lighthouse's default config is the mobile profile: Moto G Power emulation
    // plus simulated slow 4G.
    undefined
  );
  const scores = CATEGORIES.map((c) => Math.round(lhr.categories[c].score * 100));
  worst = Math.min(worst, ...scores);
  rows.push([
    path, ...scores,
    lhr.audits['largest-contentful-paint'].displayValue,
    lhr.audits['cumulative-layout-shift'].displayValue,
  ]);
}

// On Windows the temp profile is still locked when Chrome exits, and the
// cleanup throws EPERM after a run that otherwise succeeded.
try {
  chrome.kill();
} catch (e) {
  console.error(`(chrome cleanup: ${e.code || e.message})`);
}

console.log('LIGHTHOUSE — mobile profile, built output');
console.log('-'.repeat(84));
console.log(
  pad('PAGE', 14) + pad('PERF', 7) + pad('A11Y', 7) + pad('BEST PR', 10) +
  pad('SEO', 7) + pad('LCP', 10) + 'CLS'
);
console.log('-'.repeat(84));
for (const [p, perf, a11y, bp, seo, lcp, cls] of rows) {
  console.log(
    pad(p, 14) + pad(perf, 7) + pad(a11y, 7) + pad(bp, 10) + pad(seo, 7) + pad(lcp, 10) + cls
  );
}
console.log('-'.repeat(84));
// Different floors per category: a canvas hero cannot be held to the same
// performance number as a text page, but accessibility has no such excuse.
const perfMin = Math.min(...rows.map((r) => r[1]));
const a11yMin = Math.min(...rows.map((r) => r[2]));
const ok = perfMin >= 85 && a11yMin >= 95;
console.log(`performance floor ${perfMin} (target 85) · accessibility floor ${a11yMin} (target 95)`);
console.log(ok ? 'PASS' : 'BELOW TARGET');
process.exit(ok ? 0 : 1);
