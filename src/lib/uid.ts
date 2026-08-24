/**
 * Deterministic ids for SVG defs.
 *
 * Astro renders components in a stable order during a build, so a counter
 * yields the same ids every time. Math.random() does not, and a build that
 * emits different bytes from identical sources cannot be checked against what
 * is deployed — which is the only reason this file exists.
 */
let n = 0;
export const nextId = (): number => ++n;
