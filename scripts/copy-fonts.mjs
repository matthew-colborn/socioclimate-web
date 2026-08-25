// Copies the woff2 faces out of node_modules into public/fonts. The site must
// not make a network request for a font at runtime, so the files are committed
// under public/ rather than imported from the package at build time.
//
// Three families: Outfit for display, Inter for body, IBM Plex Mono for data,
// numerals and any measured value. Outfit is what keeps a headline editorial
// rather than interface — setting headlines in Inter was tried and flattened
// the page. Plex Mono has no variable build, so it ships as two static weights.
import { copyFileSync, mkdirSync, statSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const out = resolve(root, 'public/fonts');
mkdirSync(out, { recursive: true });

const faces = [
  ['@fontsource-variable/inter/files/inter-latin-wght-normal.woff2', 'inter-var-latin.woff2'],
  ['@fontsource-variable/outfit/files/outfit-latin-wght-normal.woff2', 'outfit-var-latin.woff2'],
  ['@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-400-normal.woff2', 'plex-mono-400-latin.woff2'],
  ['@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-500-normal.woff2', 'plex-mono-500-latin.woff2'],
];

let total = 0;
for (const [from, to] of faces) {
  const src = resolve(root, 'node_modules', from);
  const dst = resolve(out, to);
  copyFileSync(src, dst);
  const kb = statSync(dst).size / 1024;
  total += kb;
  console.log(`${to.padEnd(28)} ${kb.toFixed(1)} KB`);
}
console.log(`${'total'.padEnd(28)} ${total.toFixed(1)} KB`);
