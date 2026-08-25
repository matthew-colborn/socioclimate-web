/**
 * Scene 00 — the home page. The mark, alive.
 *
 * Two things share the frame and only one of them changes shape. The flame is
 * the traced contour, drawn as itself and continuous: it breathes and carries a
 * travelling brightness, but it never morphs, because it is the identity.
 *
 * Beneath it is the data ridge from the horizontal lockup — the same contour
 * read as a histogram by flameProfile — and that is what moves. It dissolves
 * from vertical bars into a wave surface, flows, and reforms, continuously.
 * brand/video/source-b.mp4 is the reference for the behaviour; nothing from the
 * file is shipped, and reproducing it generatively is the point rather than a
 * saving: a video loop visibly restarts and a generative system does not.
 *
 * The trick is that the ridge and the wave are the same points. Each column
 * holds DEPTH points, and one number decides whether they stack vertically into
 * a bar or fan backward into a rippling surface. Nothing is created or
 * destroyed between the two states, which is why the change reads as one system
 * rearranging rather than as a crossfade between two pictures.
 */
import type { Scene, SceneCtx } from '../field/engine';
import {
  dab, halo, halftone, ease, flameShape, flameProfile, resample, pull, CYAN, GLOW, TEAL,
} from '../field/prims';
import { drift, breath } from '../field/life';

interface Spark { i: number; t0: number; sp: number; drift: number }

const COLS = 84;
const DEPTH = 6;

let pts: Array<[number, number]> = [];
let sparks: Spark[] = [];
let profile: number[] = [];
let colX: number[] = [];
let colJit: number[] = [];
let cx = 0, cy = 0, H = 0;
let span = 0, base = 0, ridgeH = 0;

/** Ease that dwells at both ends, so the field rests as a ridge and as a wave. */
const dwell = (v: number): number => {
  const a = v * v * (3 - 2 * v);
  return a * a * (3 - 2 * a);
};

export const flame: Scene = {
  init(c: SceneCtx) {
    cx = c.w / 2;
    cy = c.h * 0.40;
    H = Math.min(c.h * 0.62, c.w * 0.70, 420);
    pts = flameShape(cx, cy, H);

    // The ridge sits under the flame and runs wider than it, as in the lockup —
    // about 1.7x the flame's width, not the full frame. Spanning everything
    // made it read as noise along the bottom edge rather than as a mountain.
    span = Math.min(c.w * 0.74, H * 1.2);
    ridgeH = span * 0.42;
    base = cy + H * 0.42;

    // The raw silhouette only spans 0.55..1.00, which draws as a flat-topped
    // plateau. Normalising to the full range and steepening it recovers the
    // peaks — the same data, read with the contrast the lockup actually has.
    const raw = flameProfile(COLS);
    let lo = Infinity, hi = -Infinity;
    for (const v of raw) { if (v < lo) lo = v; if (v > hi) hi = v; }
    const range = hi - lo || 1;
    profile = raw.map((v) => Math.pow((v - lo) / range, 1.35));

    colX = [];
    colJit = [];
    for (let i = 0; i < COLS; i++) {
      colX.push(cx - span / 2 + (i / (COLS - 1)) * span);
      colJit.push(c.rng() * Math.PI * 2);
    }

    sparks = [];
    const anchors = resample(pts, 34);
    for (let i = 0; i < anchors.length; i++) {
      sparks.push({
        i: Math.floor((i * pts.length) / anchors.length),
        t0: c.rng() * 6,
        sp: 0.25 + c.rng() * 0.35,
        drift: (c.rng() - 0.5) * 22,
      });
    }
  },

  frame(c: SceneCtx, t: number, intro: number) {
    const { ctx } = c;
    const e = ease(intro);

    // A real breath: quick draw, long release, and a period that wanders, so
    // successive breaths are not the same length. 5.2s here; the other scenes
    // use different periods so the page is not one machine ticking.
    const br = breath(t, 5.2, c.phase);

    halo(c, cx, cy, H * (0.80 + br * 0.10), e);
    halftone(c, cx, cy, H * 0.95, 23, 0.045 * e);

    // ---- the morph parameter --------------------------------------------
    // Layered drift rather than a sine. Three incommensurate frequencies means
    // the morph has no period at all, so there is no moment a visitor can catch
    // it starting over. Idle widens the excursion: the field gets restless when
    // nobody is watching rather than settling.
    const wander = 1 + c.idle * 0.35;
    const m = dwell(0.5 + 0.5 * drift(t, 0.42, c.phase) * wander);

    ctx.globalCompositeOperation = 'lighter';

    // Horizontal ribbons: only meaningful once the columns have fanned into a
    // surface, so they arrive with the morph and are absent from the ridge.
    if (m > 0.04) {
      ctx.globalAlpha = 1;
      ctx.lineWidth = 1;
      for (let k = 1; k < DEPTH; k++) {
        const d = k / (DEPTH - 1);
        ctx.strokeStyle = `rgba(${CYAN}, ${0.16 * m * e * (1 - d * 0.45)})`;
        ctx.beginPath();
        for (let i = 0; i < COLS; i++) {
          const u = i / (COLS - 1);
          const h = profile[i] * ridgeH;
          const yR = base - d * h;
          const persp = 1 - d * 0.42;
          const yW =
            base - d * ridgeH * 0.62 +
            Math.sin(u * 10.2 - t * 1.15 + d * 2.1) * ridgeH * 0.2 * (0.35 + 0.65 * d);
          const x = colX[i] + (cx + (colX[i] - cx) * persp - colX[i]) * m;
          const y = yR + (yW - yR) * m;
          if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y);
        }
        ctx.stroke();
      }
    }

    // Vertical bars: the ridge reading. They fade as the surface takes over.
    if (m < 0.96) {
      ctx.globalAlpha = 1;
      ctx.lineWidth = 1;
      for (let i = 0; i < COLS; i++) {
        const h = profile[i] * ridgeH;
        if (h < 1) continue;
        const top = base - h;
        const g = ctx.createLinearGradient(0, base, 0, top);
        g.addColorStop(0, `rgba(${TEAL}, 0)`);
        g.addColorStop(1, `rgba(${CYAN}, ${0.42 * (1 - m) * e})`);
        ctx.strokeStyle = g;
        ctx.beginPath();
        ctx.moveTo(colX[i], base);
        ctx.lineTo(colX[i], top);
        ctx.stroke();
      }
    }

    // The points themselves — the same set in both readings.
    for (let i = 0; i < COLS; i++) {
      const u = i / (COLS - 1);
      const h = profile[i] * ridgeH;
      for (let k = 0; k < DEPTH; k++) {
        const d = k / (DEPTH - 1);
        const yR = base - d * h;
        const persp = 1 - d * 0.42;
        const wave = Math.sin(u * 10.2 - t * 1.15 + d * 2.1);
        const yW = base - d * ridgeH * 0.62 + wave * ridgeH * 0.2 * (0.35 + 0.65 * d);
        let x = colX[i] + (cx + (colX[i] - cx) * persp - colX[i]) * m;
        let y = yR + (yW - yR) * m;

        // The field notices the pointer. Points lift toward it and brighten,
        // enough to register as atmosphere and not enough to look like a toy.
        const p = pull(c, x, y, ridgeH * 1.7, 15);
        x += p.dx;
        y += p.dy - p.lift * 5;

        // A bar is brightest at its tip; a wave is brightest at its crests.
        // The bar term is squared in d so the base row fades out entirely —
        // otherwise every column contributes a point at y = base and the ridge
        // grows a hard dotted rule along its foot.
        const aR = 0.62 * d * d;
        const aW = 0.1 + 0.34 * (wave * 0.5 + 0.5);
        const alpha = (aR + (aW - aR) * m) * e * (1 - d * 0.3);
        // Per-column shimmer on its own layered drift, so no two columns pulse
        // together and the ridge is never completely inert.
        const sh = 0.86 + 0.14 * drift(t, 1.6, colJit[i]);
        dab(c, x, y, 2.6 + d * 1.4 + p.lift * 3.4, alpha * sh * (1 + p.lift * 1.9));
      }
    }

    // Ground glow where the field meets the base.
    dab(c, cx, base + ridgeH * 0.06, span * 0.62, 0.05 * e);

    // ---- the flame, above. Continuous, never morphing. -------------------
    const breathe = 1 + (br - 0.5) * 0.042;

    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    ctx.strokeStyle = `rgba(${CYAN}, ${0.34 * e})`;
    ctx.lineWidth = 1;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    for (let i = 0; i < pts.length; i++) {
      const x = cx + (pts[i][0] - cx) * breathe;
      const y = cy + (pts[i][1] - cy) * breathe;
      if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();

    ctx.globalCompositeOperation = 'lighter';

    // Not a constant sweep: the head speeds up and eases off, so the light
    // travelling the contour has weight instead of running at a fixed rate.
    const head = ((t * 0.11) + drift(t, 0.19, c.phase) * 0.06) % 1;
    for (let i = 0; i < pts.length; i += 2) {
      const u = i / pts.length;
      let dd = Math.abs(u - head);
      if (dd > 0.5) dd = 1 - dd;
      const k = Math.max(0, 1 - dd / 0.16);
      const x = cx + (pts[i][0] - cx) * breathe;
      const y = cy + (pts[i][1] - cy) * breathe;
      dab(c, x, y, 5 + k * 12, (0.14 + k * 0.5) * e);
    }

    for (const s of sparks) {
      const life = ((t + s.t0) * s.sp) % 1;
      const p = pts[s.i];
      const y = p[1] - life * H * 0.34;
      const x = p[0] + s.drift * life;
      dab(c, x, y, 4 + (1 - life) * 3, (1 - life) * (1 - life) * 0.5 * e);
    }

    dab(c, cx, cy + H * 0.18, H * 0.42, 0.12 * e);

    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    ctx.fillStyle = `rgba(${GLOW}, ${0.55 * e})`;
    for (let i = 0; i < pts.length; i += 9) {
      const x = cx + (pts[i][0] - cx) * breathe;
      const y = cy + (pts[i][1] - cy) * breathe;
      ctx.beginPath();
      ctx.arc(x, y, 1.1, 0, Math.PI * 2);
      ctx.fill();
    }
  },
};
