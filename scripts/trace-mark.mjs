// Traces the outer silhouette of the flame out of brand/logo-stacked.jpeg and
// emits an SVG path, so the vector mark is the real mark rather than a
// freehand approximation of it. Run once; the output is pasted into
// src/components/CircuitFlame.astro. Re-run only if the logo file changes.
import sharp from 'sharp';
import { writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = resolve(root, 'brand/logo-stacked.jpeg');

// The flame occupies the top of the stacked lockup; the wordmark below it is
// not part of the mark.
const REGION = { left: 150, top: 80, width: 490, height: 790 };
const WORK_W = 420; // trace at this width, then scale the result

const img = sharp(SRC).extract(REGION).resize({ width: WORK_W });
const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
const W = info.width, H = info.height, CH = info.channels;

// "Ink" = the bright cyan stroke, not its glow. The threshold is deliberately
// high so the traced edge sits on the drawn line rather than the bloom.
const ink = new Uint8Array(W * H);
for (let i = 0, p = 0; i < W * H; i++, p += CH) {
  const r = data[p], g = data[p + 1], b = data[p + 2];
  ink[i] = (g > 110 && b > 120 && (g + b) / 2 - r > 45) ? 1 : 0;
}

// Flood the background in from the border across non-ink pixels. Whatever the
// flood cannot reach is either the stroke or the area it encloses — the
// silhouette.
const seen = new Uint8Array(W * H);
const stack = [];
for (let x = 0; x < W; x++) { stack.push(x, x + (H - 1) * W); }
for (let y = 0; y < H; y++) { stack.push(y * W, W - 1 + y * W); }
while (stack.length) {
  const i = stack.pop();
  if (seen[i] || ink[i]) continue;
  seen[i] = 1;
  const x = i % W, y = (i - x) / W;
  if (x > 0) stack.push(i - 1);
  if (x < W - 1) stack.push(i + 1);
  if (y > 0) stack.push(i - W);
  if (y < H - 1) stack.push(i + W);
}
const solid = new Uint8Array(W * H);
for (let i = 0; i < W * H; i++) solid[i] = seen[i] ? 0 : 1;

// Close one-pixel gaps left by JPEG artefacts along the stroke.
const dilate = (src, r) => {
  const out = new Uint8Array(W * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    let on = 0;
    for (let dy = -r; dy <= r && !on; dy++) for (let dx = -r; dx <= r; dx++) {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
      if (src[nx + ny * W]) { on = 1; break; }
    }
    out[x + y * W] = on;
  }
  return out;
};
const erode = (src, r) => {
  const out = new Uint8Array(W * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    let all = 1;
    for (let dy = -r; dy <= r && all; dy++) for (let dx = -r; dx <= r; dx++) {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= W || ny >= H || !src[nx + ny * W]) { all = 0; break; }
    }
    out[x + y * W] = all;
  }
  return out;
};
const closed = erode(dilate(solid, 2), 2);

// Keep only the largest connected blob, so stray sparks do not become the mark.
const label = new Int32Array(W * H).fill(-1);
let best = -1, bestSize = 0;
for (let s = 0; s < W * H; s++) {
  if (!closed[s] || label[s] !== -1) continue;
  const id = s;
  let size = 0;
  const q = [s];
  label[s] = id;
  while (q.length) {
    const i = q.pop();
    size++;
    const x = i % W, y = (i - x) / W;
    const push = (j) => { if (j >= 0 && j < W * H && closed[j] && label[j] === -1) { label[j] = id; q.push(j); } };
    if (x > 0) push(i - 1);
    if (x < W - 1) push(i + 1);
    if (y > 0) push(i - W);
    if (y < H - 1) push(i + W);
  }
  if (size > bestSize) { bestSize = size; best = id; }
}
const blob = new Uint8Array(W * H);
for (let i = 0; i < W * H; i++) blob[i] = label[i] === best ? 1 : 0;

// Moore-neighbourhood boundary trace.
const at = (x, y) => (x < 0 || y < 0 || x >= W || y >= H) ? 0 : blob[x + y * W];
let sx = -1, sy = -1;
outer: for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (blob[x + y * W]) { sx = x; sy = y; break outer; }
if (sx < 0) throw new Error('nothing traced — check the ink threshold');

const N8 = [[1,0],[1,1],[0,1],[-1,1],[-1,0],[-1,-1],[0,-1],[1,-1]];
const idxOf = (dx, dy) => N8.findIndex((n) => n[0] === dx && n[1] === dy);

// Moore boundary tracing. The search restarts from the backtrack neighbour each
// step; starting from a fixed offset instead makes the walk oscillate between
// two pixels and return a three-point "contour".
const contour = [];
let cur = [sx, sy];
let prev = [sx - 1, sy];        // sx is leftmost on its row, so the left neighbour is background
const startPx = [sx, sy];
do {
  contour.push(cur);
  const bi = idxOf(prev[0] - cur[0], prev[1] - cur[1]);
  let next = null;
  for (let k = 1; k <= 8; k++) {
    const d = (bi + k) % 8;
    const nx = cur[0] + N8[d][0], ny = cur[1] + N8[d][1];
    if (at(nx, ny)) {
      const pd = (d + 7) % 8;
      prev = [cur[0] + N8[pd][0], cur[1] + N8[pd][1]];
      next = [nx, ny];
      break;
    }
  }
  if (!next) break;
  cur = next;
} while (!(cur[0] === startPx[0] && cur[1] === startPx[1]) && contour.length < 400000);

console.log(`blob ${bestSize} px, contour ${contour.length} pts`);
if (contour.length < 200) throw new Error('contour too short — the trace did not walk the outline');

// Ramer–Douglas–Peucker.
const rdp = (pts, eps) => {
  if (pts.length < 3) return pts;
  const [ax, ay] = pts[0], [bx, by] = pts[pts.length - 1];
  let idx = 0, max = -1;
  const dx = bx - ax, dy = by - ay, len = Math.hypot(dx, dy) || 1;
  for (let i = 1; i < pts.length - 1; i++) {
    const d = Math.abs(dy * pts[i][0] - dx * pts[i][1] + bx * ay - by * ax) / len;
    if (d > max) { max = d; idx = i; }
  }
  if (max <= eps) return [pts[0], pts[pts.length - 1]];
  return [...rdp(pts.slice(0, idx + 1), eps).slice(0, -1), ...rdp(pts.slice(idx), eps)];
};
// A closed ring has to be split before RDP: with the first and last point
// coincident every perpendicular distance is zero and the whole ring collapses.
let far = 0, farD = -1;
for (let i = 1; i < contour.length; i++) {
  const d = Math.hypot(contour[i][0] - contour[0][0], contour[i][1] - contour[0][1]);
  if (d > farD) { farD = d; far = i; }
}
const simple = [
  ...rdp(contour.slice(0, far + 1), 1.9).slice(0, -1),
  ...rdp(contour.slice(far), 1.9),
];
console.log(`raw contour ${contour.length} pts, split at ${far}, simplified to ${simple.length}`);

// Normalise to a 160-wide viewBox, height derived from the traced bounding box.
let minX = 1e9, minY = 1e9, maxX = -1e9, maxY = -1e9;
for (const [x, y] of simple) {
  if (x < minX) minX = x; if (x > maxX) maxX = x;
  if (y < minY) minY = y; if (y > maxY) maxY = y;
}
const bw = maxX - minX, bh = maxY - minY;
const VB_W = 160;
const k = VB_W / bw;
const VB_H = Math.round(bh * k);
const f = (n) => +n.toFixed(1);
const d =
  'M' +
  simple.map(([x, y]) => `${f((x - minX) * k)} ${f((y - minY) * k)}`).join('L') +
  'Z';

// A second, solid outline for small sizes. Sealing the circuit channels with a
// heavy close leaves just the flame silhouette, which is what survives at 16px
// and 22px where the detailed contour turns to mush.
const sealed = erode(dilate(closed, 7), 7);
const at2 = (x, y) => (x < 0 || y < 0 || x >= W || y >= H) ? 0 : sealed[x + y * W];
let s2x = -1, s2y = -1;
outer2: for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (sealed[x + y * W]) { s2x = x; s2y = y; break outer2; }
const contour2 = [];
{
  let cur = [s2x, s2y];
  let prev = [s2x - 1, s2y];
  const st = [s2x, s2y];
  do {
    contour2.push(cur);
    const bi = idxOf(prev[0] - cur[0], prev[1] - cur[1]);
    let next = null;
    for (let k = 1; k <= 8; k++) {
      const dd = (bi + k) % 8;
      const nx = cur[0] + N8[dd][0], ny = cur[1] + N8[dd][1];
      if (at2(nx, ny)) {
        const pd = (dd + 7) % 8;
        prev = [cur[0] + N8[pd][0], cur[1] + N8[pd][1]];
        next = [nx, ny];
        break;
      }
    }
    if (!next) break;
    cur = next;
  } while (!(cur[0] === st[0] && cur[1] === st[1]) && contour2.length < 400000);
}
let far2 = 0, far2D = -1;
for (let i = 1; i < contour2.length; i++) {
  const dd = Math.hypot(contour2[i][0] - contour2[0][0], contour2[i][1] - contour2[0][1]);
  if (dd > far2D) { far2D = dd; far2 = i; }
}
const simple2 = [
  ...rdp(contour2.slice(0, far2 + 1), 2.6).slice(0, -1),
  ...rdp(contour2.slice(far2), 2.6),
];
// Normalised against the DETAILED bounding box so the two paths overlay exactly.
const dSolid =
  'M' + simple2.map(([x, y]) => `${f((x - minX) * k)} ${f((y - minY) * k)}`).join('L') + 'Z';
console.log(`solid outline ${contour2.length} -> ${simple2.length} pts, ${dSolid.length} chars`);

writeFileSync(resolve(root, 'brand/flame-solid-path.txt'), `viewBox="0 0 ${VB_W} ${VB_H}"

${dSolid}
`);

writeFileSync(resolve(root, 'brand/flame-path.txt'), `viewBox="0 0 ${VB_W} ${VB_H}"\n\n${d}\n`);

// A preview so the trace can be eyeballed before it is pasted anywhere.
const preview = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="${VB_H * 2}" viewBox="0 0 ${VB_W} ${VB_H}">
<rect width="${VB_W}" height="${VB_H}" fill="#020A21"/>
<path d="${dSolid}" fill="#00D8E7" fill-opacity="0.10"/>
<path d="${d}" fill="#00D8E7" fill-opacity="0.16" stroke="#00D8E7" stroke-width="1.4"/></svg>`;
writeFileSync(resolve(root, 'brand/flame-preview.svg'), preview);
await sharp(Buffer.from(preview)).png().toFile(resolve(root, 'brand/flame-preview.png'));

console.log(`viewBox 0 0 ${VB_W} ${VB_H}`);
console.log(`path length: ${d.length} chars`);
console.log('wrote brand/flame-path.txt, brand/flame-preview.svg, brand/flame-preview.png');
