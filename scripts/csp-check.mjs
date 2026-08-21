// The Content-Security-Policy in firebase.json allows exactly the inline
// script blocks this build produces, by hash. If a build changes one of those
// blocks the policy will silently start blocking it in production, so the
// hashes are checked here rather than trusted.
//   npm run build && node scripts/csp-check.mjs
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = resolve(root, 'dist');
if (!existsSync(dist)) {
  console.error('dist/ does not exist. Run `npm run build` first.');
  process.exit(1);
}

const walk = (dir, out = []) => {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (p.endsWith('.html')) out.push(p);
  }
  return out;
};

const found = new Map();
for (const file of walk(dist)) {
  const html = readFileSync(file, 'utf8');
  for (const m of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)) {
    const body = m[1];
    if (!body.trim()) continue;
    const h = 'sha256-' + createHash('sha256').update(body, 'utf8').digest('base64');
    const entry = found.get(h) || { count: 0, sample: body.trim().slice(0, 56) };
    entry.count++;
    found.set(h, entry);
  }
}

const cfg = JSON.parse(readFileSync(resolve(root, 'firebase.json'), 'utf8'));
const csp = cfg.hosting.headers
  .flatMap((h) => h.headers)
  .find((h) => h.key === 'Content-Security-Policy')?.value ?? '';
const allowed = new Set([...csp.matchAll(/'(sha256-[A-Za-z0-9+/=]+)'/g)].map((m) => m[1]));

const pad = (s, n) => String(s).padEnd(n);
console.log('CSP INLINE SCRIPT HASHES');
console.log('-'.repeat(94));
let bad = 0;
for (const [h, { count, sample }] of found) {
  const ok = allowed.has(h);
  if (!ok) bad++;
  console.log(pad(ok ? 'ALLOWED' : 'MISSING', 9) + pad(`${count} page(s)`, 12) + pad(h, 52) + sample);
}
for (const h of allowed) {
  if (!found.has(h)) {
    bad++;
    console.log(pad('STALE', 9) + pad('—', 12) + pad(h, 52) + 'in firebase.json, not in the build');
  }
}
console.log('-'.repeat(94));
console.log(bad === 0 ? 'PASS — the policy matches the build exactly.' : `${bad} hash mismatch(es).`);
process.exit(bad === 0 ? 0 : 1);
