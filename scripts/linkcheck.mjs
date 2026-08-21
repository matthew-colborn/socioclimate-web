// Walks dist/ and checks three things:
//   1. every internal link resolves to a file that was actually built
//   2. every external link is a syntactically real, absolute https URL
//   3. every <cite> carries a source and an as-of date
// Run after `npm run build`.
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
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
    else out.push(p);
  }
  return out;
};
const files = walk(dist);
const pages = files.filter((f) => f.endsWith('.html'));

const rel = (p) => p.slice(dist.length + 1).replace(/\\/g, '/');
const built = new Set(files.map(rel));

/** Resolve an internal href the way Firebase Hosting with cleanUrls will. */
const resolves = (href) => {
  const path = href.split('#')[0].split('?')[0];
  if (path === '' || path === '/') return built.has('index.html');
  const p = path.replace(/^\//, '').replace(/\/$/, '');
  return built.has(p) || built.has(`${p}.html`) || built.has(`${p}/index.html`);
};

let problems = 0;
const note = (kind, page, detail) => {
  problems++;
  console.log(`  ${kind.padEnd(9)} ${rel(page).padEnd(24)} ${detail}`);
};

let internal = 0, external = 0, mail = 0, cites = 0;

console.log('LINKS AND CITATIONS');
console.log('-'.repeat(90));

for (const page of pages) {
  const html = readFileSync(page, 'utf8');

  for (const m of html.matchAll(/href="([^"]+)"/g)) {
    const href = m[1];
    if (href.startsWith('mailto:')) {
      mail++;
      if (!/^mailto:[^@\s]+@[^@\s.]+\.[a-z]{2,}/i.test(href)) note('BAD MAIL', page, href);
      continue;
    }
    if (/^https?:/i.test(href)) {
      external++;
      try {
        const u = new URL(href);
        if (u.protocol !== 'https:') note('NOT HTTPS', page, href);
        if (!u.hostname.includes('.')) note('BAD HOST', page, href);
      } catch {
        note('BAD URL', page, href);
      }
      continue;
    }
    if (href.startsWith('#') || href.startsWith('data:')) continue;
    internal++;
    if (!resolves(href)) note('404', page, href);
  }

  for (const m of html.matchAll(/<cite[^>]*>([\s\S]*?)<\/cite>/g)) {
    cites++;
    const text = m[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
    const hasDate = /\b(19|20)\d{2}\b/.test(text);
    const hasSource = text.replace(/[^A-Za-z]/g, '').length > 3;
    if (!hasDate) note('NO DATE', page, text.slice(0, 60));
    if (!hasSource) note('NO SOURCE', page, text.slice(0, 60));
  }

  // A placeholder must never have been rendered as a link target.
  for (const m of html.matchAll(/(?:href|src)="([^"]*MATTHEW TO FILL[^"]*)"/g)) {
    note('TO FILL', page, m[1]);
  }
}

if (!problems) console.log('  no problems found');
console.log('-'.repeat(90));
console.log(
  `${pages.length} pages · ${internal} internal links · ${external} external links · ` +
  `${mail} mailto links · ${cites} citations`
);
console.log(problems === 0 ? 'PASS' : `${problems} problem(s)`);
process.exit(problems === 0 ? 0 : 1);
