// Deploys dist/ to Firebase Hosting through the Hosting REST API, using the
// gcloud Application Default Credentials rather than a firebase-tools login.
//
// Why this exists: the firebase CLI's login falls back to a paste-a-code flow
// when it cannot detect a terminal, which does not work unattended. gcloud's
// browser flow does work, so the credential we already have is the one used
// here. `firebase deploy` remains the normal path for a human at a keyboard —
// see DEPLOY.md — and this produces an identical release.
//
//   node scripts/deploy.mjs --project socioclimate-web-staging [--site <site>] [--dry-run]
//
// The hosting config (headers, cleanUrls, trailingSlash) is translated out of
// firebase.json so there is exactly one source of truth for it.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { gzipSync } from 'node:zlib';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const args = process.argv.slice(2);
const arg = (n) => {
  const i = args.indexOf(`--${n}`);
  return i >= 0 ? args[i + 1] : undefined;
};
const project = arg('project');
if (!project) {
  console.error('usage: node scripts/deploy.mjs --project <projectId> [--site <site>]');
  process.exit(1);
}
const site = arg('site') || project;

const dist = resolve(root, 'dist');
if (!existsSync(dist)) {
  console.error('dist/ does not exist. Run `npm run build` first.');
  process.exit(1);
}

const token = execFileSync('gcloud', ['auth', 'application-default', 'print-access-token'], {
  encoding: 'utf8',
  shell: true,
}).trim();

const API = 'https://firebasehosting.googleapis.com/v1beta1';
const H = {
  Authorization: `Bearer ${token}`,
  'x-goog-user-project': project,
  'Content-Type': 'application/json',
};

const call = async (url, init = {}) => {
  const res = await fetch(url, { ...init, headers: { ...H, ...(init.headers || {}) } });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`${init.method || 'GET'} ${url}\n  ${res.status} ${text.slice(0, 900)}`);
  }
  return text ? JSON.parse(text) : {};
};

// --- hosting config, translated out of firebase.json ----------------------
// firebase.json uses {source, headers:[{key,value}]}; the API wants
// {glob, headers:{key:value}}. Everything else carries over unchanged.
const fb = JSON.parse(readFileSync(resolve(root, 'firebase.json'), 'utf8')).hosting;
const config = {};
if (fb.cleanUrls !== undefined) config.cleanUrls = fb.cleanUrls;
// firebase.json says trailingSlash: true|false; the API wants an enum.
if (fb.trailingSlash !== undefined) {
  config.trailingSlashBehavior = fb.trailingSlash ? 'ADD' : 'REMOVE';
}
if (fb.redirects) config.redirects = fb.redirects;
if (fb.rewrites) config.rewrites = fb.rewrites;
if (fb.headers) {
  config.headers = fb.headers.map((h) => ({
    glob: h.source,
    headers: Object.fromEntries(h.headers.map((kv) => [kv.key, kv.value])),
  }));
}

// --- collect dist/ ---------------------------------------------------------
const walk = (dir, out = []) => {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
};

// Hosting keys every file by the SHA-256 of its GZIPPED bytes.
const entries = walk(dist).map((abs) => {
  const gz = gzipSync(readFileSync(abs), { level: 9 });
  return {
    path: '/' + abs.slice(dist.length + 1).replace(/\\/g, '/'),
    gz,
    hash: createHash('sha256').update(gz).digest('hex'),
  };
});
const files = Object.fromEntries(entries.map((e) => [e.path, e.hash]));
const bytes = entries.reduce((n, e) => n + e.gz.length, 0);

console.log(`site      ${site}`);
console.log(`project   ${project}`);
console.log(`files     ${entries.length} (${(bytes / 1024).toFixed(1)} KB gzipped)`);
console.log(`config    cleanUrls=${config.cleanUrls} trailingSlash=${config.trailingSlashBehavior} ` +
            `headerRules=${config.headers?.length ?? 0} rewrites=${config.rewrites?.length ?? 0}`);
if (config.rewrites?.length) {
  console.error('\nrefusing to deploy: firebase.json has rewrites. This is a static ' +
                'multi-page site and a catch-all rewrite would turn every 404 into a 200.');
  process.exit(1);
}

if (args.includes('--dry-run')) {
  console.log('\n--dry-run: nothing sent. Config that would be posted:\n');
  console.log(JSON.stringify(config, null, 2));
  process.exit(0);
}

// --- version --------------------------------------------------------------
const version = await call(`${API}/sites/${site}/versions`, {
  method: 'POST',
  body: JSON.stringify({ config }),
});
console.log(`version   ${version.name}`);

const populate = await call(`${API}/${version.name}:populateFiles`, {
  method: 'POST',
  body: JSON.stringify({ files }),
});
const required = populate.uploadRequiredHashes || [];
console.log(`upload    ${required.length} of ${entries.length} file(s) not already stored`);

const byHash = new Map(entries.map((e) => [e.hash, e]));
let done = 0;
for (const hash of required) {
  const e = byHash.get(hash);
  const res = await fetch(`${populate.uploadUrl}/${hash}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'x-goog-user-project': project,
      'Content-Type': 'application/octet-stream',
    },
    body: e.gz,
  });
  if (!res.ok) throw new Error(`upload ${e.path}: ${res.status} ${(await res.text()).slice(0, 300)}`);
  done++;
  if (done % 10 === 0 || done === required.length) {
    console.log(`          ${done}/${required.length}`);
  }
}

await call(`${API}/${version.name}?updateMask=status`, {
  method: 'PATCH',
  body: JSON.stringify({ status: 'FINALIZED' }),
});
console.log('version   FINALIZED');

const release = await call(
  `${API}/sites/${site}/releases?versionName=${encodeURIComponent(version.name)}`,
  { method: 'POST' }
);
console.log(`release   ${release.name}`);
console.log(`\nlive at   https://${site}.web.app`);
console.log(`          https://${site}.firebaseapp.com`);
