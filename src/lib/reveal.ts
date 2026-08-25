/**
 * Section transitions.
 *
 * A one-shot rise-and-fade as a section first comes into view, and then it is
 * done — this is a transition, not an animation, which is why it does not count
 * against the one-moving-thing-per-viewport rule. Nothing here loops, and once
 * a section has arrived it is never touched again.
 *
 * Elements start visible in the markup and are only hidden once this module has
 * run. A reveal that depends on script to make content appear is a reveal that
 * hides the page from anyone whose script failed.
 */
const SELECTOR = '[data-reveal]';

export function initReveal(): void {
  const els = Array.from(document.querySelectorAll<HTMLElement>(SELECTOR));
  if (!els.length) return;

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced || !('IntersectionObserver' in window)) return;

  // Only now does anything become hidden, and only for sections that have not
  // already been scrolled past.
  document.documentElement.classList.add('reveal-ready');

  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      }
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.06 }
  );

  for (const el of els) io.observe(el);
}
