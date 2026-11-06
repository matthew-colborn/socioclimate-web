/* ==========================================================================
   SocioClimate motion engine v1 (Deep Water)
   Framework agnostic ES module. In Astro: import once in the base layout,
   call initMotion() on load and again on "astro:page-load" (view transitions).

   ADDS to the live site's motion; it does not replace the existing backdrop
   canvas, field canvases, breathe / rule / trace keyframes, the sticky process
   stage or the argument rotator. Keep those running as they are.

   Every effect:
   - respects prefers-reduced-motion and the site's own motion toggle
   - pauses when off screen (IntersectionObserver) and when the tab is hidden
   - caps devicePixelRatio at 2 and particle counts by viewport area
   ========================================================================== */

const state = { reduced: false, hidden: false, cleanups: [] };

function prefersReduced() {
  const stored = (() => { try { return localStorage.getItem("sc-motion"); } catch { return null; } })();
  if (stored === "off") return true;
  if (stored === "on") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/* ---------- 1. Scroll reveals: staggered rise + fade ----------
   Markup: data-reveal on any element; data-reveal-stagger on a parent
   staggers its children 70ms apart. */
function reveals(root) {
  const els = root.querySelectorAll("[data-reveal], [data-reveal-stagger] > *");
  if (state.reduced) { els.forEach(el => el.classList.add("is-in")); return; }
  root.querySelectorAll("[data-reveal-stagger]").forEach(p =>
    [...p.children].forEach((c, i) => c.style.setProperty("--d", `${i * 70}ms`)));
  const io = new IntersectionObserver(entries => {
    for (const e of entries) if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); }
  }, { rootMargin: "0px 0px -10% 0px", threshold: 0.12 });
  els.forEach(el => io.observe(el));
  state.cleanups.push(() => io.disconnect());
}

/* ---------- 2. Count-up figures ----------
   Markup: <span data-count="23440" data-format="comma" data-prefix="~" data-suffix=" days">23,440</span>
   The real number is in the markup (no-JS and screen readers get it). */
function countUps(root) {
  const els = root.querySelectorAll("[data-count]");
  if (state.reduced) return;
  const fmt = (n, f) => f === "comma" ? Math.round(n).toLocaleString("en-US") : String(Math.round(n));
  const io = new IntersectionObserver(entries => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      const el = e.target, to = parseFloat(el.dataset.count), pre = el.dataset.prefix || "", suf = el.dataset.suffix || "";
      const t0 = performance.now(), dur = 1400;
      el.setAttribute("aria-label", el.textContent);
      const tick = t => {
        const k = Math.min(1, (t - t0) / dur), ease = 1 - Math.pow(1 - k, 4);
        el.textContent = pre + fmt(to * ease, el.dataset.format) + suf;
        if (k < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      io.unobserve(el);
    }
  }, { threshold: 0.6 });
  els.forEach(el => io.observe(el));
  state.cleanups.push(() => io.disconnect());
}

/* ---------- 3. Depth gauge: scroll position read as ocean depth ----------
   Markup: <div class="sc-depth" aria-hidden="true"><span data-depth>0000</span> M</div>
   Max depth per page via data-depth-max on <body> (default 4200). */
function depthGauge() {
  const out = document.querySelector("[data-depth]");
  if (!out) return;
  const max = parseFloat(document.body.dataset.depthMax || "4200");
  let raf = 0;
  const update = () => {
    raf = 0;
    const h = document.documentElement.scrollHeight - innerHeight;
    const k = h > 0 ? scrollY / h : 0;
    out.textContent = String(Math.round(k * max)).padStart(4, "0");
    document.documentElement.style.setProperty("--scroll-k", k.toFixed(4));
  };
  const on = () => { if (!raf) raf = requestAnimationFrame(update); };
  addEventListener("scroll", on, { passive: true }); update();
  state.cleanups.push(() => removeEventListener("scroll", on));
}

/* ---------- 4. Ridge parallax ----------
   Markup: data-parallax="0.15" on ridge layers (0 = fixed, 1 = scrolls with page). */
function parallax(root) {
  if (state.reduced) return;
  const els = [...root.querySelectorAll("[data-parallax]")];
  if (!els.length) return;
  let raf = 0;
  const update = () => {
    raf = 0;
    for (const el of els) {
      const r = el.getBoundingClientRect();
      if (r.bottom < -200 || r.top > innerHeight + 200) continue;
      const k = parseFloat(el.dataset.parallax);
      el.style.transform = `translate3d(0, ${((r.top + r.height / 2 - innerHeight / 2) * -k).toFixed(1)}px, 0)`;
    }
  };
  const on = () => { if (!raf) raf = requestAnimationFrame(update); };
  addEventListener("scroll", on, { passive: true }); update();
  state.cleanups.push(() => removeEventListener("scroll", on));
}

/* ---------- 5. Caustic light that follows the pointer ----------
   Sets --mx / --my on [data-caustic] sections; CSS draws a soft cyan pool. */
function causticLight(root) {
  if (state.reduced || matchMedia("(pointer: coarse)").matches) return;
  root.querySelectorAll("[data-caustic]").forEach(el => {
    const move = e => {
      const r = el.getBoundingClientRect();
      el.style.setProperty("--mx", `${((e.clientX - r.left) / r.width * 100).toFixed(1)}%`);
      el.style.setProperty("--my", `${((e.clientY - r.top) / r.height * 100).toFixed(1)}%`);
    };
    el.addEventListener("pointermove", move, { passive: true });
    state.cleanups.push(() => el.removeEventListener("pointermove", move));
  });
}

/* ---------- 6. Plankton: data particles rising through the water ----------
   Markup: <canvas class="sc-plankton" data-plankton></canvas> inside a
   position:relative container. Light, one per page section that wants it. */
function plankton(root) {
  const canvases = root.querySelectorAll("canvas[data-plankton]");
  canvases.forEach(cv => {
    const ctx = cv.getContext("2d");
    const css = getComputedStyle(document.documentElement);
    const cyan = css.getPropertyValue("--cyan").trim() || "#00D8E7";
    const glow = css.getPropertyValue("--cyan-glow").trim() || "#99FFFF";
    const paper = css.getPropertyValue("--paper").trim() || "#FFFFFF";
    const sparkle = cv.dataset.plankton === "sparkle"; // brighter, denser, glittering (portal and water floors)
    let w = 0, h = 0, dpr = 1, pts = [], visible = false, raf = 0;
    const size = () => {
      dpr = Math.min(2, devicePixelRatio || 1);
      w = cv.clientWidth; h = cv.clientHeight;
      cv.width = w * dpr; cv.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.min(sparkle ? 220 : 140, Math.round((w * h) / (sparkle ? 5000 : 9000)));
      pts = Array.from({ length: n }, () => ({
        x: Math.random() * w, y: Math.random() * h,
        r: Math.random() * 1.4 + 0.3, v: Math.random() * 0.25 + 0.06,
        a: Math.random() * 0.6 + 0.15, p: Math.random() * Math.PI * 2, s: Math.random() < (sparkle ? 0.22 : 0.08), c: Math.random()
      }));
    };
    const draw = t => {
      raf = 0;
      if (!visible || state.hidden) return;
      ctx.clearRect(0, 0, w, h);
      for (const q of pts) {
        q.y -= q.v; q.x += Math.sin(t / 2400 + q.p) * 0.18;
        if (q.y < -4) { q.y = h + 4; q.x = Math.random() * w; }
        const tw = 0.55 + 0.45 * Math.sin(t / 900 + q.p);
        ctx.globalAlpha = q.a * tw;
        ctx.fillStyle = q.s ? (sparkle && q.c > 0.7 ? paper : glow) : cyan;
        if (q.s) { ctx.shadowBlur = 8; ctx.shadowColor = cyan; } else ctx.shadowBlur = 0;
        ctx.beginPath(); ctx.arc(q.x, q.y, q.s ? q.r + 0.8 : q.r, 0, Math.PI * 2); ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    };
    size();
    if (state.reduced) { visible = true; draw(0); visible = false; return; } // one static frame
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible && !raf) raf = requestAnimationFrame(draw); });
    io.observe(cv);
    const ro = new ResizeObserver(size); ro.observe(cv);
    state.cleanups.push(() => { io.disconnect(); ro.disconnect(); cancelAnimationFrame(raf); });
  });
}

/* ---------- 7. Currents: contour lines flow ----------
   Markup: inline the bathymetry SVG with class "sc-currents"; this assigns
   each path a random flow speed and direction (CSS animates the dash). */
function currents(root) {
  root.querySelectorAll("svg.sc-currents path").forEach((p, i) => {
    const len = Math.round(p.getTotalLength ? p.getTotalLength() : 1200);
    p.style.setProperty("--len", len);
    p.style.setProperty("--flow", `${(40 + (i * 37) % 50)}s`);
    p.style.setProperty("--dir", i % 2 ? "reverse" : "normal");
  });
}

/* ---------- 8. Flame ignition ----------
   The live mark breathes (trace-breathe 7s). This adds a one-time ignite on
   first load and a flare when any nav link is hovered. */
function flame() {
  const mark = document.querySelector(".mark");
  if (!mark || state.reduced) return;
  let seen = false; try { seen = !!sessionStorage.getItem("sc-ignited"); } catch {}
  if (!seen) {
    mark.classList.add("is-igniting");
    mark.addEventListener("animationend", () => mark.classList.remove("is-igniting"), { once: true });
    try { sessionStorage.setItem("sc-ignited", "1"); } catch {}
  }
  document.querySelectorAll("header nav a").forEach(a => {
    const on = () => mark.classList.add("is-flaring"), off = () => mark.classList.remove("is-flaring");
    a.addEventListener("pointerenter", on); a.addEventListener("pointerleave", off);
    a.addEventListener("focus", on); a.addEventListener("blur", off);
  });
}

/* ---------- 9. Motion toggle (footer control, remembered per visitor) ----------
   Markup: <button data-motion-toggle aria-pressed="true">Motion on</button> */
function toggle() {
  const btn = document.querySelector("[data-motion-toggle]");
  if (!btn) return;
  const sync = () => { btn.setAttribute("aria-pressed", String(!state.reduced)); btn.textContent = state.reduced ? "Motion off" : "Motion on"; };
  sync();
  btn.onclick = () => {
    try { localStorage.setItem("sc-motion", state.reduced ? "on" : "off"); } catch {}
    location.reload();
  };
}

export function initMotion(root = document) {
  state.cleanups.forEach(fn => fn()); state.cleanups = [];
  state.reduced = prefersReduced();
  document.documentElement.classList.toggle("sc-motion-off", state.reduced);
  reveals(root); countUps(root); depthGauge(); parallax(root);
  causticLight(root); plankton(root); currents(root); flame(); toggle();
}

document.addEventListener("visibilitychange", () => { state.hidden = document.hidden; });
