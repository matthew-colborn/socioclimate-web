/**
 * Alfred Basil — operating software for a residential brokerage.
 *
 * Routed circuit traces: a central trunk with branches leaving at staggered
 * heights, each running out, taking one 45-degree miter, and terminating at a
 * node. Pulses travel outward and the node lifts as one lands.
 *
 * Deliberately not radial. Spokes from a point read as a starburst; real
 * routing is orthogonal runs with staggered corners, which is also the
 * vocabulary of the channels inside the flame mark.
 */
import type { Scene, SceneCtx } from '../field/engine';
import { dab, halo, halftone, ease, flameShape, resample, CYAN, GLOW } from '../field/prims';

interface Seg { x1: number; y1: number; x2: number; y2: number; len: number }
interface Trace { segs: Seg[]; total: number; delay: number; period: number; end: [number, number] }

let traces: Trace[] = [];
let cx = 0, cy = 0, trunkTop = 0, trunkBot = 0;

function segs(pts: Array<[number, number]>): Seg[] {
  const out: Seg[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const [x1, y1] = pts[i], [x2, y2] = pts[i + 1];
    const len = Math.hypot(x2 - x1, y2 - y1);
    if (len > 0.5) out.push({ x1, y1, x2, y2, len });
  }
  return out;
}

export const traces_scene: Scene = {
  init(c: SceneCtx) {
    cx = c.w / 2;
    cy = c.h * 0.44;
    const H = Math.min(c.h * 0.50, 420);
    // Bounded so the routed object stays a compact focal mass between the
    // readouts rather than a band running off both edges.
    trunkTop = cy - H / 2;
    trunkBot = cy + H / 2;
    traces = [];

    // Terminals are points on the flame contour, so the routed object's
    // outline is the mark. The routing between trunk and terminal is
    // orthogonal, which is the vocabulary of the mark's own channels.
    const anchors = resample(flameShape(cx, cy, H * 1.15), 16);
    for (const [ax, ay] of anchors) {
      const side: -1 | 1 = ax < cx ? -1 : 1;
      const y0 = Math.min(trunkBot, Math.max(trunkTop, ay + (c.rng() - 0.5) * 40));
      const reach = Math.abs(ax - cx);
      const run1 = Math.max(12, reach * (0.3 + c.rng() * 0.2));
      const x1 = cx + side * run1;
      const x2 = ax;
      const pts: Array<[number, number]> = [[cx, y0], [x1, y0], [x2, ay], [ax, ay]];
      const sg = segs(pts);
      if (!sg.length) continue;
      const total = sg.reduce((a, g) => a + g.len, 0);
      traces.push({
        segs: sg,
        total,
        delay: c.rng() * 4,
        period: 3.4 + c.rng() * 2.2,
        end: [ax, ay],
      });
    }
  },

  frame(c: SceneCtx, t: number, intro: number) {
    const { ctx } = c;
    const e = ease(intro);
    halo(c, cx, cy, Math.min(c.w * 0.5, 520), e);
    halftone(c, cx, cy, Math.min(c.w * 0.5, 520), 23, 0.05 * e);

    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    // Trunk.
    ctx.strokeStyle = `rgba(${GLOW}, ${0.62 * e})`;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(cx, trunkTop);
    ctx.lineTo(cx, trunkBot);
    ctx.stroke();

    // Routed branches.
    ctx.strokeStyle = `rgba(${CYAN}, ${0.30 * e})`;
    ctx.lineWidth = 1.1;
    for (const tr of traces) {
      ctx.beginPath();
      ctx.moveTo(tr.segs[0].x1, tr.segs[0].y1);
      for (const s of tr.segs) ctx.lineTo(s.x2, s.y2);
      ctx.stroke();
    }

    ctx.globalCompositeOperation = 'lighter';

    for (const tr of traces) {
      const local = (t + tr.delay) % tr.period;
      const travel = Math.min(1, local / (tr.period * 0.62));
      let d = travel * tr.total;
      for (const s of tr.segs) {
        if (d <= s.len) {
          const u = s.len === 0 ? 0 : d / s.len;
          dab(c, s.x1 + (s.x2 - s.x1) * u, s.y1 + (s.y2 - s.y1) * u, 16, 0.55 * e);
          break;
        }
        d -= s.len;
      }
      const landed = travel >= 1 ? 1 : 0;
      const settle = landed ? Math.max(0, 1 - (local - tr.period * 0.62) / (tr.period * 0.38)) : 0;
      dab(c, tr.end[0], tr.end[1], 11 + settle * 9, (0.26 + settle * 0.42) * e);
    }

    // The trunk glows softly along its length rather than blowing out a point.
    for (let i = 0; i <= 16; i++) {
      dab(c, cx, trunkTop + ((trunkBot - trunkTop) * i) / 16, 40, 0.13 * e);
    }

    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    ctx.fillStyle = `rgba(${GLOW}, ${0.7 * e})`;
    for (const tr of traces) {
      ctx.beginPath();
      ctx.arc(tr.end[0], tr.end[1], 2, 0, Math.PI * 2);
      ctx.fill();
    }
  },
};
