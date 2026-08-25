/**
 * The nav on a single-page site: it scrolls instead of navigating.
 *
 * Three things it has to get right, none of which comes free with an href:
 *
 *   1. Focus, not just scroll position. Moving the viewport past a heading
 *      leaves a keyboard user's focus wherever it was, so the next Tab jumps
 *      somewhere unrelated. Each section is focusable and receives focus.
 *   2. Reduced motion means an instant jump, not a slow one. Smooth scrolling
 *      is exactly the kind of vestibular motion the setting exists to stop.
 *   3. Where you are. The nav marks the current section as you scroll.
 *
 * Everything here degrades to plain anchors. With this module absent the links
 * still work — they simply jump rather than glide.
 */
const SECTIONS = ['top', '01-what-we-do', '02-portfolio', '03-contact'];

let wired = false;

export function initNav(): void {
  const links = Array.from(
    document.querySelectorAll<HTMLAnchorElement>('.site-head__nav a[href^="#"]')
  );
  if (!links.length) return;

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /** Scroll to a section and move focus into it. */
  const go = (id: string): void => {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
    // preventScroll, because scrollIntoView is already doing that part and
    // letting focus scroll too fights the smooth animation.
    el.focus({ preventScroll: true });
  };

  if (!wired) {
    wired = true;

    document.addEventListener('click', (e) => {
      const a = (e.target as HTMLElement)?.closest?.('a[href^="#"]') as HTMLAnchorElement | null;
      if (!a) return;
      const id = a.getAttribute('href')!.slice(1);
      if (!document.getElementById(id)) return;
      e.preventDefault();
      // Keep the URL honest so the link is copyable and Back works.
      history.pushState(null, '', id === 'top' ? location.pathname : `#${id}`);
      go(id);
    });

    window.addEventListener('popstate', () => {
      const id = location.hash.slice(1);
      if (id && document.getElementById(id)) go(id);
    });
  }

  // ---- which section am I in ------------------------------------------
  const targets = SECTIONS.map((id) => document.getElementById(id)).filter(Boolean) as HTMLElement[];
  if (!targets.length) return;

  const mark = (id: string): void => {
    for (const a of links) {
      const on = a.getAttribute('href') === `#${id}`;
      if (on) a.setAttribute('aria-current', 'true');
      else a.removeAttribute('aria-current');
    }
  };

  let ticking = false;
  const pick = (): void => {
    ticking = false;
    // The section whose top is nearest to just under the header wins, which
    // matches what a reader would say they are "in".
    const line = window.innerHeight * 0.32;
    let best = targets[0];
    let bestD = Infinity;
    for (const el of targets) {
      const top = el.getBoundingClientRect().top;
      const d = top <= line ? line - top : (top - line) * 3;
      if (d < bestD) { bestD = d; best = el; }
    }
    mark(best.id);
  };

  window.addEventListener(
    'scroll',
    () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(pick);
    },
    { passive: true }
  );
  pick();
}
