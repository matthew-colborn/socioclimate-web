// Encodes the two brand animations in brand/video/ down to web deliverables.
// Run with `npm run video`. Output is committed to public/video/, so a normal
// build does no transcoding and ffmpeg is only a dev dependency.
//
// Two decisions worth not re-deriving:
//
//   Audio is stripped. Both sources carry a stereo AAC track at ~127 kb/s —
//   roughly 95 KB per file of payload for a silent logo animation that
//   autoplays muted.
//
//   h264/mp4 only, no WebM. VP9 was measured against h264 across the whole
//   quality range on this exact content and came out larger at every matched
//   size: dark frames, hard cyan edges, very little motion. Shipping one
//   format that every browser plays beats shipping two.
import ffmpeg from 'ffmpeg-static';
import sharp from 'sharp';
import { execFileSync } from 'node:child_process';
import { mkdirSync, statSync, rmSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const out = resolve(root, 'public/video');
mkdirSync(out, { recursive: true });

const run = (args) =>
  execFileSync(ffmpeg, ['-y', '-hide_banner', '-loglevel', 'error', ...args], {
    stdio: ['ignore', 'pipe', 'pipe'],
  });

const JOBS = [
  {
    name: 'mark',
    src: 'brand/video/source-a.mp4',
    // Source is 448x672: the flame sits above a wordmark. The hero already
    // renders the wordmark as real text, so only the flame is kept.
    filter: 'crop=448:480:0:0',
    crf: 36,
  },
  {
    name: 'lockup',
    src: 'brand/video/source-b.mp4',
    // 672x448, used at 560 CSS px or less. No crop.
    filter: null,
    crf: 36,
  },
];

const kb = (p) => (statSync(p).size / 1024).toFixed(1) + ' KB';
const vf = (j) => (j.filter ? ['-vf', j.filter] : []);

for (const j of JOBS) {
  const src = resolve(root, j.src);

  const mp4 = resolve(out, `${j.name}.mp4`);
  run([
    '-i', src, '-an', ...vf(j),
    '-c:v', 'libx264', '-crf', String(j.crf), '-preset', 'slow',
    '-profile:v', 'main', '-pix_fmt', 'yuv420p', '-g', '48',
    '-movflags', '+faststart',
    mp4,
  ]);

  // Poster: the first frame, so the box is never empty before the video paints.
  const tmp = resolve(out, `${j.name}-poster-tmp.png`);
  run(['-ss', '0.1', '-i', src, ...vf(j), '-frames:v', '1', tmp]);
  const poster = resolve(out, `${j.name}-poster.webp`);
  await sharp(tmp).webp({ quality: 78 }).toFile(poster);
  rmSync(tmp);

  console.log(`${j.name.padEnd(8)} mp4 ${kb(mp4).padStart(9)}   poster ${kb(poster).padStart(9)}`);
}
