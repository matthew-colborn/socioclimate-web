// Renders the still frame for each scene into public/scenes/<id>.webp.
//
// It drives the real pages with prefers-reduced-motion emulated, which is
// exactly the state the engine renders a single deterministic frame in. So the
// poster is not an approximation of the scene — it is the scene at t=0, from
// the same code, with the same seed. If they ever diverge, the bug is in the
// engine, not here.
//
//   npm run build && npm run preview & && npm run posters   (then rebuild)
//
// The carousel is gone, so scenes are no longer all on one route. Each one is
// captured from the page it actually appears on, which also means a scene that
// stops being used anywhere stops getting a poster — and the check below turns
// that into a failure rather than a stale file nobody notices.
import puppeteer from 'puppeteer-core';
import sharp from 'sharp';
import { mkdirSync, statSync, writeFileSync, readdirSync, unlinkSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const base = (process.argv[2] || 'http://localhost:4332').replace(/\/$/, '');
const out = resolve(root, 'public/scenes');
mkdirSync(out, { recursive: true });

const ROUTES = ['/', '/portfolio', '/contact'];
// Every scene in the registry must be reachable from one of those routes.
const EXPECTED = ['flame', 'ridge', 'traces', 'converge', 'lattice', 'opening'];

const W = 1440;
const H = 900;
// The poster is a soft glow field with no hard edges, so it survives being
// stored at well under display size and upscaled by object-fit: cover. It is
// also the LCP element on first paint, which is why this is not 1440 wide.
// Square, because the containers are now 4:5 (hero) and 1:1 (panel) rather
// than a landscape band. A square poster covers both with a crop small enough
// to be invisible on a blurred glow field.
const OUT_W = 448;
const OUT_H = 448;
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new' });
const page = await browser.newPage();
await page.setViewport({ width: W, height: H, deviceScaleFactor: 1 });
await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);

const seen = [];
const manifest = {};

for (const route of ROUTES) {
  await page.goto(base + route, { waitUntil: 'networkidle0' });
  // Under reduced motion the Engine draws its single frame in the constructor,
  // so nothing has to be scrolled into view — but the module still has to have
  // run and laid the canvases out.
  await new Promise((r) => setTimeout(r, 700));

  const ids = await page.evaluate(() =>
    [...document.querySelectorAll('canvas[data-field]')].map((c) => c.dataset.field)
  );

  for (const id of ids) {
    // Anything not in the registry is somebody else's canvas, not a scene.
    // Without this an empty or unknown id writes a file named ".webp".
    if (!EXPECTED.includes(id) || seen.includes(id)) continue;

    // Hide the poster img so an older poster cannot be captured into the new one.
    await page.evaluate((sceneId) => {
      const c = document.querySelector(`canvas[data-field="${sceneId}"]`);
      c.closest('.field')?.querySelectorAll('img').forEach((img) => (img.style.display = 'none'));
    }, id);
    await new Promise((r) => setTimeout(r, 250));

    const png = await page.evaluate(
      (sceneId) => document.querySelector(`canvas[data-field="${sceneId}"]`).toDataURL('image/png'),
      id
    );

    const buf = Buffer.from(png.split(',')[1], 'base64');
    const webp = await sharp(buf)
      .resize(OUT_W, OUT_H, { fit: 'cover' })
      .blur(1.1)
      .webp({ quality: 52, effort: 6, smartSubsample: true })
      .toBuffer();

    // A real poster is a blurred glow field and lands between 20 and 60 KB. A
    // fraction of that is a uniform image, which means the canvas was blank —
    // it has happened once already, when a CSS class name was mangled and the
    // panels collapsed to zero height. Blank posters must fail the run rather
    // than be published looking like files.
    if (webp.length < 5000) {
      console.error(`
FAIL  ${id} rendered blank (${webp.length} bytes).`);
      console.error('The canvas painted nothing — check its size and that the scene mounted.');
      process.exit(1);
    }

    const hash = createHash('sha256').update(webp).digest('hex').slice(0, 8);
    const name = `${id}.${hash}.webp`;

    // Drop any earlier hash for this scene so public/ does not accumulate.
    for (const f of readdirSync(out)) {
      if (f.startsWith(`${id}.`) && f.endsWith('.webp') && f !== name) unlinkSync(resolve(out, f));
    }

    const file = resolve(out, name);
    writeFileSync(file, webp);
    manifest[id] = `/scenes/${name}`;
    const meta = await sharp(file).metadata();
    console.log(
      `${id.padEnd(10)} ${route.padEnd(11)} ${meta.width}x${meta.height}  ` +
        `${(statSync(file).size / 1024).toFixed(1)} KB  ${name}`
    );
    seen.push(id);
  }
}

await browser.close();

const missing = EXPECTED.filter((id) => !seen.includes(id));
if (missing.length) {
  console.error(`\nFAIL  no route renders: ${missing.join(', ')}`);
  console.error('Either mount the scene somewhere or remove it from the registry.');
  process.exit(1);
}

// Sorted so the manifest is stable across runs and the build stays reproducible.
const sorted = Object.fromEntries(Object.keys(manifest).sort().map((k) => [k, manifest[k]]));
writeFileSync(resolve(root, 'src/data/posters.json'), JSON.stringify(sorted, null, 2) + String.fromCharCode(10));

console.log(`\n${seen.length}/${EXPECTED.length} scenes captured.`);
console.log('src/data/posters.json written. Rebuild so public/scenes/ is copied into dist/.');
