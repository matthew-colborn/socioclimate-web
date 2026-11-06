/**
 * The Deep Water motion layer, ported from brand/socioclimate-rebrand/js/motion.js.
 *
 * It ADDS to the live motion (backdrop canvas, field canvases, the breathe /
 * rule / trace keyframes, the pinned process stage, the argument rotator); it
 * replaces only src/lib/reveal.ts, whose job the first effect below now does.
 *
 * Every effect respects prefers-reduced-motion AND the footer toggle (both go
 * through prefersReducedMotion()), pauses off screen and in hidden tabs, and
 * caps devicePixelRatio at 2.
 *
 * Content never depends on any of this. Reveals are gated on .reveal-ready,
 * which is only added once this module has run, so a script failure leaves the
 * page fully visible rather than blank. Count-ups start from the real value in
 * the markup.
 */
import { prefersReducedMotion } from './field/engine';

const state = { reduced: false, hidden: false, cleanups: [] as Array<() => void> };

/* 1. Scroll reveals: rise, unblur, fade. data-reveal on an element;
   data-reveal-stagger on a parent staggers its children 70ms apart. */
function reveals(root: ParentNode): void {
  const els = Array.from(root.querySelectorAll<HTMLElement>('[data-reveal], [data-reveal-stagger] > *'));
  if (state.reduced || !('IntersectionObserver' in window)) {
    els.forEach((el) => el.classList.add('is-in'));
    return;
  }
  root.querySelectorAll<HTMLElement>('[data-reveal-stagger]').forEach((p) =>
    Array.from(p.children).forEach((c, i) => (c as HTMLElement).style.setProperty('--d', `${i * 70}ms`))
  );
  document.documentElement.classList.add('reveal-ready');
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        e.target.classList.add('is-in');
        io.unobserve(e.target);
      }
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.08 }
  );
  els.forEach((el) => io.observe(el));
  state.cleanups.push(() => io.disconnect());
}

/* 2. Count-up figures. <span data-count="23440" data-format="comma"
   data-prefix="~" data-suffix=" days">~23,440 days</span>. The real value is
   the markup, and the aria-label keeps it for screen readers mid-count. */
function countUps(root: ParentNode): void {
  if (state.reduced) return;
  const els = root.querySelectorAll<HTMLElement>('[data-count]');
  const fmt = (n: number, f?: string): string =>
    f === 'comma' ? Math.round(n).toLocaleString('en-US') : String(Math.round(n));
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        const el = e.target as HTMLElement;
        const to = parseFloat(el.dataset.count || '0');
        const pre = el.dataset.prefix || '';
        const suf = el.dataset.suffix || '';
        const t0 = performance.now();
        const dur = 1400;
        el.setAttribute('aria-label', el.textContent || '');
        const tick = (t: number): void => {
          const k = Math.min(1, (t - t0) / dur);
          const ease = 1 - Math.pow(1 - k, 4);
          el.textContent = pre + fmt(to * ease, el.dataset.format) + suf;
          if (k < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        io.unobserve(el);
      }
    },
    { threshold: 0.6 }
  );
  els.forEach((el) => io.observe(el));
  state.cleanups.push(() => io.disconnect());
}

/* 3. Depth gauge: scroll position read as depth in metres. */
function depthGauge(): void {
  const out = document.querySelector<HTMLElement>('[data-depth]');
  if (!out) return;
  const max = parseFloat(document.body.dataset.depthMax || '4200');
  let raf = 0;
  const update = (): void => {
    raf = 0;
    const h = document.documentElement.scrollHeight - innerHeight;
    const k = h > 0 ? Math.min(1, Math.max(0, scrollY / h)) : 0;
    out.textContent = String(Math.round(k * max)).padStart(4, '0');
    document.documentElement.style.setProperty('--scroll-k', k.toFixed(4));
  };
  const on = (): void => { if (!raf) raf = requestAnimationFrame(update); };
  addEventListener('scroll', on, { passive: true });
  update();
  state.cleanups.push(() => removeEventListener('scroll', on));
}

/* 4. Ridge parallax. data-parallax="0.15" (0 fixed, 1 scrolls with the page). */
function parallax(root: ParentNode): void {
  if (state.reduced) return;
  const els = Array.from(root.querySelectorAll<HTMLElement>('[data-parallax]'));
  if (!els.length) return;
  let raf = 0;
  const update = (): void => {
    raf = 0;
    for (const el of els) {
      const r = el.getBoundingClientRect();
      if (r.bottom < -200 || r.top > innerHeight + 200) continue;
      const k = parseFloat(el.dataset.parallax || '0');
      // `translate`, not `transform`: the ridge tide animates transform on the
      // same elements, and an animation would override an inline transform.
      el.style.translate = `0 ${((r.top + r.height / 2 - innerHeight / 2) * -k).toFixed(1)}px`;
    }
  };
  const on = (): void => { if (!raf) raf = requestAnimationFrame(update); };
  addEventListener('scroll', on, { passive: true });
  update();
  state.cleanups.push(() => removeEventListener('scroll', on));
}

/* 5. Caustic light that follows the pointer (desktop only). */
function causticLight(root: ParentNode): void {
  if (state.reduced || matchMedia('(pointer: coarse)').matches) return;
  root.querySelectorAll<HTMLElement>('[data-caustic]').forEach((el) => {
    const move = (e: PointerEvent): void => {
      const r = el.getBoundingClientRect();
      el.style.setProperty('--mx', `${(((e.clientX - r.left) / r.width) * 100).toFixed(1)}%`);
      el.style.setProperty('--my', `${(((e.clientY - r.top) / r.height) * 100).toFixed(1)}%`);
    };
    el.addEventListener('pointermove', move, { passive: true });
    state.cleanups.push(() => el.removeEventListener('pointermove', move));
  });
}

/* 6. Plankton: particles rising through the water. data-plankton="sparkle" is
   the denser, brighter variant for the portal and water floors. */
function plankton(root: ParentNode): void {
  root.querySelectorAll<HTMLCanvasElement>('canvas[data-plankton]').forEach((cv) => {
    const ctx = cv.getContext('2d');
    if (!ctx) return;
    const css = getComputedStyle(document.documentElement);
    const cyan = css.getPropertyValue('--cyan').trim();
    const glow = css.getPropertyValue('--cyan-glow').trim();
    const paper = css.getPropertyValue('--paper').trim();
    const sparkle = cv.dataset.plankton === 'sparkle';
    type P = { x: number; y: number; r: number; v: number; a: number; p: number; s: boolean; c: number };
    let w = 0, h = 0, pts: P[] = [], visible = false, raf = 0;
    const size = (): void => {
      const dpr = Math.min(2, devicePixelRatio || 1);
      w = cv.clientWidth; h = cv.clientHeight;
      cv.width = w * dpr; cv.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.min(140, Math.round((w * h) / (sparkle ? 5000 : 9000)));
      pts = Array.from({ length: n }, () => ({
        x: Math.random() * w, y: Math.random() * h,
        r: Math.random() * 1.4 + 0.3, v: Math.random() * 0.25 + 0.06,
        a: Math.random() * 0.6 + 0.15, p: Math.random() * Math.PI * 2,
        s: Math.random() < (sparkle ? 0.22 : 0.08), c: Math.random(),
      }));
    };
    const paint = (t: number, move: boolean): void => {
      ctx.clearRect(0, 0, w, h);
      for (const q of pts) {
        if (move) {
          q.y -= q.v; q.x += Math.sin(t / 2400 + q.p) * 0.18;
          if (q.y < -4) { q.y = h + 4; q.x = Math.random() * w; }
        }
        ctx.globalAlpha = q.a * (0.55 + 0.45 * Math.sin(t / 900 + q.p));
        ctx.fillStyle = q.s ? (sparkle && q.c > 0.7 ? paper : glow) : cyan;
        ctx.shadowBlur = q.s ? 8 : 0;
        ctx.shadowColor = cyan;
        ctx.beginPath(); ctx.arc(q.x, q.y, q.s ? q.r + 0.8 : q.r, 0, Math.PI * 2); ctx.fill();
      }
    };
    const draw = (t: number): void => {
      raf = 0;
      if (!visible || state.hidden) return;
      paint(t, true);
      raf = requestAnimationFrame(draw);
    };
    size();
    if (state.reduced) { paint(0, false); return; } // one still frame
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible && !raf) raf = requestAnimationFrame(draw);
    });
    io.observe(cv);
    const ro = new ResizeObserver(size);
    ro.observe(cv);
    const vis = (): void => { if (!document.hidden && visible && !raf) raf = requestAnimationFrame(draw); };
    document.addEventListener('visibilitychange', vis);
    state.cleanups.push(() => {
      io.disconnect(); ro.disconnect(); cancelAnimationFrame(raf);
      document.removeEventListener('visibilitychange', vis);
    });
  });
}

/* 7. Currents: each contour line gets its own flow speed and direction. */
function currents(root: ParentNode): void {
  root.querySelectorAll<SVGPathElement>('svg.sc-currents path').forEach((p, i) => {
    const len = Math.round(p.getTotalLength ? p.getTotalLength() : 1200);
    p.style.setProperty('--len', String(len));
    p.style.setProperty('--flow', `${40 + ((i * 37) % 50)}s`);
    p.style.setProperty('--dir', i % 2 ? 'reverse' : 'normal');
  });
}

/* 8. The flame: ignites once per session, flares while a nav link is hovered
   or focused. The live trace-breathe keeps running underneath. */
function flame(): void {
  const mark = document.querySelector<SVGElement>('.site-head .mark');
  if (!mark || state.reduced) return;
  let seen = false;
  try { seen = !!sessionStorage.getItem('sc-ignited'); } catch { /* blocked */ }
  if (!seen) {
    mark.classList.add('is-igniting');
    mark.addEventListener('animationend', () => mark.classList.remove('is-igniting'), { once: true });
    try { sessionStorage.setItem('sc-ignited', '1'); } catch { /* blocked */ }
  }
  document.querySelectorAll<HTMLAnchorElement>('.site-head nav a').forEach((a) => {
    const on = (): void => mark.classList.add('is-flaring');
    const off = (): void => mark.classList.remove('is-flaring');
    a.addEventListener('pointerenter', on); a.addEventListener('pointerleave', off);
    a.addEventListener('focus', on); a.addEventListener('blur', off);
    state.cleanups.push(() => {
      a.removeEventListener('pointerenter', on); a.removeEventListener('pointerleave', off);
      a.removeEventListener('focus', on); a.removeEventListener('blur', off);
    });
  });
}

/* 9. Footer motion toggle, remembered per visitor. A reload is the honest way
   to apply it: every canvas reads the setting once, at mount. */
function toggle(): void {
  const btn = document.querySelector<HTMLButtonElement>('[data-motion-toggle]');
  if (!btn) return;
  btn.setAttribute('aria-pressed', String(!state.reduced));
  const label = btn.querySelector('[data-motion-label]');
  if (label) label.textContent = state.reduced ? 'Motion off' : 'Motion on';
  btn.onclick = () => {
    try { localStorage.setItem('sc-motion', state.reduced ? 'on' : 'off'); } catch { /* blocked */ }
    location.reload();
  };
}

export function initMotion(root: ParentNode = document): void {
  state.cleanups.forEach((fn) => fn());
  state.cleanups = [];
  state.reduced = prefersReducedMotion();
  document.documentElement.classList.toggle('sc-motion-off', state.reduced);
  reveals(root); countUps(root); depthGauge(); parallax(root);
  causticLight(root); plankton(root); currents(root); flame(); toggle();
}

document.addEventListener('visibilitychange', () => { state.hidden = document.hidden; });
