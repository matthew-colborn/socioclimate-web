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

/**
 * The four process steps used to be their own anchors and were shared as deep
 * links. The section is one paragraph now, so those ids no longer exist —
 * rather than let a shared link land nowhere, they resolve to the section that
 * replaced them.
 */
const RETIRED: Record<string, string> = {
  '01-find': '01-what-we-do',
  '02-capture': '01-what-we-do',
  '03-understand': '01-what-we-do',
  '04-revenue': '01-what-we-do',
};

const resolve = (id: string): string => RETIRED[id] ?? id;

let wired = false;

export function initNav(): void {
  const links = Array.from(
    document.querySelectorAll<HTMLAnchorElement>('.site-head__nav a[href^="#"]')
  );
  if (!links.length) return;

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /**
   * Scroll to a section and move focus into it.
   *
   * Not scrollIntoView({behavior:'smooth'}): the browser's own smooth scroll
   * scales its duration with distance, and on a page this long a jump from the
   * hero to contact crawls. This runs a fixed budget instead — the same
   * half-second whether the section is one screen away or six — so the nav
   * feels equally quick everywhere.
   */
  const DURATION = 520;

  const go = (rawId: string): void => {
    const id = resolve(rawId);
    const el = document.getElementById(id);
    if (!el) return;

    const focusIt = (): void => el.focus({ preventScroll: true });

    // scroll-margin-top only applies to scrollIntoView and fragment navigation,
    // and this scrolls by hand — so without reading it the section lands under
    // the fixed header.
    const margin = parseFloat(getComputedStyle(el).scrollMarginTop) || 0;

    if (reduced) {
      // Instant, because a long eased scroll is exactly the vestibular motion
      // the setting exists to stop.
      window.scrollTo({
        top: el.getBoundingClientRect().top + window.scrollY - margin,
        behavior: 'instant',
      });
      focusIt();
      return;
    }

    const from = window.scrollY;
    const to = Math.max(
      0,
      Math.min(
        document.documentElement.scrollHeight - window.innerHeight,
        el.getBoundingClientRect().top + from - margin
      )
    );
    if (Math.abs(to - from) < 2) { focusIt(); return; }

    const t0 = performance.now();
    // Eased both ends: leaves without a jerk, arrives without a stop.
    const easeInOut = (x: number): number =>
      x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;

    const step = (now: number): void => {
      const k = Math.min(1, (now - t0) / DURATION);
      // 'instant' is load-bearing. base.css sets scroll-behavior: smooth for
      // plain fragment links, and without this override the browser applies its
      // own smooth scroll to EVERY frame of this one — each call restarting a
      // fresh animation toward a moving target. The result was a 1.3-1.6s
      // distance-scaled crawl that never reached where it was going, which is
      // what made the section jumps feel slow.
      window.scrollTo({ top: from + (to - from) * easeInOut(k), behavior: 'instant' });
      if (k < 1) requestAnimationFrame(step);
      else focusIt();
    };
    requestAnimationFrame(step);
  };

  if (!wired) {
    wired = true;

    document.addEventListener('click', (e) => {
      const a = (e.target as HTMLElement)?.closest?.('a[href^="#"]') as HTMLAnchorElement | null;
      if (!a) return;
      const id = resolve(a.getAttribute('href')!.slice(1));
      if (!document.getElementById(id)) return;
      e.preventDefault();
      // Keep the URL honest so the link is copyable and Back works.
      history.pushState(null, '', id === 'top' ? location.pathname : `#${id}`);
      go(id);
    });

    window.addEventListener('popstate', () => {
      const id = resolve(location.hash.slice(1));
      if (id && document.getElementById(id)) go(id);
    });

    // A cold load onto a retired anchor: the browser cannot scroll to an id
    // that is gone, so it is corrected here on arrival.
    const landed = location.hash.slice(1);
    if (landed && RETIRED[landed]) {
      history.replaceState(null, '', `#${RETIRED[landed]}`);
      go(landed);
    }
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

  // Document-space tops, measured once and on resize. Reading a bounding rect
  // per section per frame while the page is scrolling forces layout during the
  // exact frames that need to be cheapest.
  let tops: number[] = [];
  const measure = (): void => {
    tops = targets.map((el) => el.getBoundingClientRect().top + window.scrollY);
  };
  measure();
  let mt = 0;
  window.addEventListener('resize', () => {
    clearTimeout(mt);
    mt = window.setTimeout(measure, 150);
  });

  let ticking = false;
  const pick = (): void => {
    ticking = false;
    // The section whose top is nearest to just under the header wins, which
    // matches what a reader would say they are "in".
    const line = window.innerHeight * 0.32;
    const y = window.scrollY;
    let best = targets[0];
    let bestD = Infinity;
    for (let i = 0; i < targets.length; i++) {
      const top = tops[i] - y;
      const d = top <= line ? line - top : (top - line) * 3;
      if (d < bestD) { bestD = d; best = targets[i]; }
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
