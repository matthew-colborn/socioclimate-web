/**
 * What separates alive from animated.
 *
 * Three things, and none of them is "more movement":
 *
 *   1. Irregularity. A single sine reads mechanical however slow it is,
 *      because a viewer finds the loop. `drift` sums three of them at
 *      irrational frequency ratios, so the sum has no period — there is no
 *      moment it starts over, so there is no moment to catch.
 *   2. Breath. A slow, asymmetric, eased amplitude cycle. Real respiration is
 *      a quick draw and a long release, not an oscillation, and the difference
 *      is most of why one reads as a body and the other as a metronome.
 *   3. Weight. Nothing moves at constant velocity or snaps to a stop.
 *
 * Every value here is deterministic in `t`. Nothing calls Math.random, because
 * the posters are rendered from these same functions at t = 0 and have to come
 * out identical every time.
 */

/** Golden ratio and e. Irrational, so the three layers never re-align. */
const R1 = 1.6180339887;
const R2 = 2.7182818285;

/**
 * Layered drift in roughly -1..1. `base` is the slowest frequency in rad/s.
 * Two faster layers ride on it at irrational multiples, so the sum never
 * repeats and there is no visible loop point.
 */
export function drift(t: number, base: number, phase = 0): number {
  return (
    Math.sin(t * base + phase) * 0.55 +
    Math.sin(t * base * R1 + phase * 1.7 + 2.1) * 0.3 +
    Math.sin(t * base * R2 + phase * 0.6 + 4.3) * 0.15
  );
}

export const easeOutCubic = (x: number): number => 1 - Math.pow(1 - x, 3);

export const easeInOutCubic = (x: number): number =>
  x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;

/** Overshoots slightly and settles back. This is what "weight" means here. */
export const easeOutBack = (x: number): number => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
};

/**
 * Respiration in 0..1. Asymmetric on purpose — about 40% of the cycle drawing
 * in, 60% letting go — and the period itself wanders a few percent, so no two
 * breaths are the same length and the cycle cannot be counted.
 */
export function breath(t: number, period: number, phase = 0): number {
  const wobble = 1 + drift(t, 0.037, phase) * 0.09;
  const p = period * wobble;
  let x = ((t + phase) / p) % 1;
  if (x < 0) x += 1;
  return x < 0.42
    ? easeOutCubic(x / 0.42)
    : 1 - easeInOutCubic((x - 0.42) / 0.58);
}

/* -------------------------------------------------------------------------- */
/* Viewer input                                                               */
/* -------------------------------------------------------------------------- */

/**
 * Where the viewer is, in client coordinates, and how much attention to pay.
 *
 * `strength` decays: a pointer that stopped moving stops mattering, so a
 * parked cursor does not hold the field permanently deformed.
 *
 * `idle` climbs from 0 to 1 once nobody has done anything for a while, and
 * scenes use it to wander further than they otherwise would — the field gets
 * restless when it is not being watched rather than settling into stillness.
 */
export const viewer = {
  x: -1,
  y: -1,
  strength: 0,
  idle: 0,
  /** Touch devices have no pointer, so scroll velocity stands in for it. */
  scroll: 0,
  reduced: false,
};

const IDLE_AFTER = 7000;
const IDLE_FULL = 16000;

let lastMove = 0;
let lastScrollY = 0;
let lastScrollT = 0;
let wired = false;

/** Called once per frame by the engine, so decay is frame-rate independent. */
export function decayViewer(now: number, dt: number): void {
  if (viewer.reduced) {
    viewer.strength = 0;
    viewer.idle = 0;
    viewer.scroll = 0;
    return;
  }
  viewer.strength = Math.max(0, viewer.strength - dt * 0.55);
  viewer.scroll *= Math.max(0, 1 - dt * 3);
  const since = now - lastMove;
  const k = (since - IDLE_AFTER) / (IDLE_FULL - IDLE_AFTER);
  viewer.idle = Math.max(0, Math.min(1, k));
}

export function wireViewer(reduced: boolean): void {
  viewer.reduced = reduced;
  if (reduced || wired) return;
  wired = true;
  lastMove = performance.now();

  window.addEventListener(
    'pointermove',
    (e) => {
      viewer.x = e.clientX;
      viewer.y = e.clientY;
      viewer.strength = 1;
      lastMove = performance.now();
    },
    { passive: true }
  );

  window.addEventListener(
    'pointerleave',
    () => {
      viewer.x = -1;
      viewer.y = -1;
    },
    { passive: true }
  );

  window.addEventListener(
    'scroll',
    () => {
      const now = performance.now();
      const dy = window.scrollY - lastScrollY;
      const dt = Math.max(16, now - lastScrollT);
      // Normalised so a brisk flick lands near 1 and a nudge stays small.
      viewer.scroll = Math.min(1, Math.abs(dy / dt) / 2.5);
      lastScrollY = window.scrollY;
      lastScrollT = now;
      lastMove = now;
    },
    { passive: true }
  );

  for (const ev of ['keydown', 'pointerdown', 'focusin'] as const) {
    window.addEventListener(ev, () => { lastMove = performance.now(); }, { passive: true });
  }
}
