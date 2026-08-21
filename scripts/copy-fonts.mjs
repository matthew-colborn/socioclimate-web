// Copies the two variable woff2 faces out of node_modules into public/fonts.
// The site must not make a network request for a font at runtime, so the files
// are committed under public/ rather than imported from the package at build time.
import { copyFileSync, mkdirSync, statSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const out = resolve(root, 'public/fonts');
mkdirSync(out, { recursive: true });

const faces = [
  ['@fontsource-variable/inter/files/inter-latin-wght-normal.woff2', 'inter-var-latin.woff2'],
  ['@fontsource-variable/outfit/files/outfit-latin-wght-normal.woff2', 'outfit-var-latin.woff2'],
];

for (const [from, to] of faces) {
  const src = resolve(root, 'node_modules', from);
  const dst = resolve(out, to);
  copyFileSync(src, dst);
  console.log(`${to.padEnd(24)} ${(statSync(dst).size / 1024).toFixed(1)} KB`);
}
