// WCAG contrast over every foreground/background pair the site actually uses,
// plus a guard against painting text with a token that cannot carry it.
// Token values are read from src/styles/tokens.css so this cannot drift from
// the design system by being hand-copied.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const css = readFileSync(resolve(root, 'src/styles/tokens.css'), 'utf8');

const T = {};
// [a-z0-9-] rather than [a-z-]: --ink-2 has a digit in its name, and without
// the digit class it silently never lands in T, which surfaces much later as
// an undefined hex inside the luminance maths.
for (const m of css.matchAll(/^\s*(--[a-z0-9-]+):\s*(#[0-9A-Fa-f]{6});/gm)) T[m[1]] = m[2];



const lin = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const lum = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => lin(v / 255));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};

// kind: 'body'  — normal text, AA needs 4.5:1
//       'large' — >=24px or >=18.66px bold, AA needs 3:1
//       'ui'    — non-text UI component or meaningful graphic, AA needs 3:1
//       'deco'  — purely decorative, no requirement (still reported)
const PAIRS = [
  ['--paper', '--ink', 'body', 'Body text on the page background'],
  ['--paper', '--ink-deep', 'body', 'Body text on the receded field'],
  ['--paper', '--ink-black', 'body', 'Body text on the black field'],
  ['--paper-dim', '--ink', 'body', 'Secondary text, hero supporting copy'],
  ['--paper-dim', '--ink-deep', 'body', 'Readout labels and notes'],
  ['--paper-dim', '--ink-black', 'body', 'Secondary text on the black field'],

  // Cyan is the only accent. Links, the mark, the current nav item, the call
  // to action and the single most important value on a screen — nothing else.
  ['--cyan', '--ink', 'body', 'Links, stage chips, section and beat numbers'],
  ['--cyan', '--ink-deep', 'body', 'Links on the receded field'],
  ['--cyan', '--ink-black', 'body', 'Links on the black field'],
  ['--ink', '--cyan', 'body', 'CTA label on a filled cyan pill (hover)'],
  ['--ink', '--cyan-bright', 'body', 'CTA label on the brightest fill'],
  ['--cyan-bright', '--ink', 'ui', 'Focus ring'],
  ['--cyan-bright', '--ink-black', 'ui', 'Focus ring on the black field'],
  ['--cyan-glow', '--ink-black', 'ui', 'Brightest points in the generative field'],
  ['--cyan-glow', '--ink', 'ui', 'The ridge administrative price line'],
  ['--cyan', '--ink-black', 'ui', 'Generative field marks on black'],

  // Deep Water rebrand: the de-emphasised mono tier (IDs, sources, coordinates).
  ['--paper-mute', '--ink', 'body', 'Mono IDs, figure sources, corner metadata'],
  ['--paper-mute', '--ink-deep', 'body', 'Muted mono on the receded field'],
  ['--paper-mute', '--blue-deep', 'body', 'Muted mono at the top of the depth gradient'],
  ['--paper-dim', '--blue-deep', 'body', 'Body text at the top of the depth gradient'],

  ['--teal-deep', '--ink', 'deco', 'Rules, borders, input outlines'],
  ['--teal-deep', '--ink-black', 'deco', 'Routed trace lines'],
  ['--teal-shadow', '--ink-black', 'deco', 'Section dividers'],
  ['--teal-shadow', '--ink', 'deco', 'Section dividers on the page ground'],
];

// Fail on the token name rather than on `undefined.slice(1)` twenty frames in.
const missing = [...new Set(PAIRS.flatMap(([fg, bg]) => [fg, bg]))].filter((t) => !T[t]);
if (missing.length) {
  console.error(`Not found in tokens.css: ${missing.join(', ')}`);
  process.exit(1);
}

const NEED = { body: 4.5, large: 3, ui: 3, deco: 0 };

let fails = 0;
const rows = PAIRS.map(([fg, bg, kind, use]) => {
  const r = ratio(T[fg], T[bg]);
  const need = NEED[kind];
  const pass = kind === 'deco' ? 'n/a' : r >= need ? 'PASS' : 'FAIL';
  if (pass === 'FAIL') fails++;
  return { fg, bg, kind, need: need || '—', ratio: r.toFixed(2) + ':1', pass, use };
});

const w = (s, n) => String(s).padEnd(n);
console.log(
  w('FOREGROUND', 14) + w('BACKGROUND', 12) + w('KIND', 7) + w('NEEDS', 7) +
  w('RATIO', 9) + w('AA', 6) + 'USED FOR'
);
console.log('-'.repeat(112));
for (const r of rows) {
  console.log(
    w(r.fg, 14) + w(r.bg, 12) + w(r.kind, 7) + w(r.need, 7) +
    w(r.ratio, 9) + w(r.pass, 6) + r.use
  );
}
console.log('-'.repeat(112));
console.log(
  fails === 0
    ? 'All text and UI pairs meet WCAG AA. Decorative pairs are reported, not gated.'
    : `${fails} pair(s) below WCAG AA.`
);

// --teal-deep and --teal-shadow sit below 3:1 on every background here. They are
// legitimate for rules, borders and gridlines and illegitimate for anything a
// reader has to read, so the rule is enforced rather than remembered.
const walk = (dir, out = []) => {
  for (const name of readdirSync(dir)) {
    const p = resolve(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(astro|css|ts)$/.test(name)) out.push(p);
  }
  return out;
};
const offenders = [];
for (const file of walk(resolve(root, 'src'))) {
  readFileSync(file, 'utf8').split(/\r?\n/).forEach((line, i) => {
    if (/\bcolor:\s*var\(--teal-(deep|shadow)\)/.test(line)) {
      offenders.push(`${file.slice(root.length + 1)}:${i + 1}  ${line.trim()}`);
    }
  });
}
console.log('');
if (offenders.length) {
  console.log('Text painted with a sub-3:1 token:');
  offenders.forEach((o) => console.log('  ' + o));
} else {
  console.log('No text is painted with --teal-deep or --teal-shadow.');
}

process.exit(fails === 0 && offenders.length === 0 ? 0 : 1);
