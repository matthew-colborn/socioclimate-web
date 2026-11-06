# 08 · Motion: heavy, everywhere, like water

The live site already moves a lot. The rebrand keeps every bit of it and goes further, so every page and every section is alive. Motion is a brand element here, not decoration: the water is always moving, the record is always being kept.

## Keep: what the live site runs today (audited 2026-11-05)

Leave these in place, with their current code and timings, and extend them to every new page.

| Live motion | What it is | Extend to |
|---|---|---|
| Backdrop canvas | Full-page animated canvas behind the body | Every page |
| Field canvases (`.field`, `field--hero`, `field--panel`) | Animated circuit scenes, one per section | Every section that has a scene: Home hero, each Services work block, each database page hero, Research hero, Contact |
| `field-drift` 33s to 44s | Slow transform drift of the field layers | All fields |
| `sc-breathe` 13s, `sc-breathe-faint` 17s to 23s | Opacity breathing on glows and labels | All pages |
| `sc-rule` 29s | Hairline rules slowly change color | All rules and dividers |
| `trace-breathe` 7s on `.mark__edge` | The flame's edge breathes | Unchanged, sitewide |
| Sticky `.process__stage` | Pinned stage while the four moves scroll past | Home "Method" and Services "How a build runs" |
| Argument rotator | Auto-advancing panels with a pause control | Home |

## Add: the Deep Water motion layer (`js/motion.js` + `css/socioclimate.css` motion section)

| Effect | Markup / class | Where |
|---|---|---|
| Flame ignition | automatic on `.mark` | First page load per session: the edge traces itself, the flame flares, then settles into the live breathe |
| Flame flare | automatic | Flame brightens while any nav link is hovered or focused |
| Scroll reveals | `data-reveal`, `data-reveal-stagger` | Every heading, lead, card, case column, figure row, register row and step on every page. Rise 28px, unblur, fade, 900ms, 70ms stagger |
| Count-up figures | `data-count` | Every figure (23,440, ~4,200, 317 days, future ones). The real value is in the markup |
| Currents | inline `bathymetry.svg` with class `sc-currents` | Contour lines flow at varied speeds and directions behind every `.sc-abyss` hero |
| Plankton | `<canvas data-plankton>` | Cyan particles rising slowly through the water. Home hero, Databases hero, database detail heroes, footer |
| Sonar sweep | `.sc-instrument--sweep` + `<span class="sweep">` | Inside every instrument ring around a scene |
| Instrument orbit | `.sc-instrument` | Dashed outer ring turns (120s) |
| Lit word shimmer | `.sc-h1 em`, `.sc-h2 em` | A band of light passes across the glowing headline word every 9s |
| Caustic pointer light | `data-caustic` | A soft pool of cyan light follows the pointer across heroes and card grids (desktop only) |
| Ridge tide + parallax | `.sc-ridge`, `data-parallax` | Ridges swell slowly and move at different speeds on scroll |
| Depth gauge | `.sc-depth` with `[data-depth]` | Fixed instrument at the right edge reading scroll as depth in meters (0000 to 4200) on desktop |
| Register light pulse | automatic on `.sc-register` rows | A band of light travels along a row on hover; ID turns cyan |
| Card float | automatic on `a.sc-card` | Lifts 4px; the caustic rim travels back and forth |
| Breathing pills | `.sc-status--building` | "Building" pills breathe like the live badges |
| Live ping | `.sc-status--live` | Sonar ping on live items |
| Page dive | View Transitions | Page leaves upward and blurs; the next rises in from below. Uses the view transitions the live Astro site already enables |
| Hero self-draw | `.sc-draw` | Hero linework draws itself on load |

## Feel

Slow, continuous, layered. Many things move at once at different speeds, the way water does. Nothing bounces, snaps, flashes or loops fast. The fastest ambient cycle is the 3.2s live ping; most are 7s to 60s. Interaction responses are 160 to 300ms.

## Performance budget (heavy motion has to stay smooth)

- 60fps on a mid-range laptop and a recent iPhone; no long tasks over 50ms from motion code.
- Canvases pause when off screen (IntersectionObserver) and when the tab is hidden. Device pixel ratio capped at 2. Particle count scales with viewport area, max 140 per canvas.
- Animate only `transform`, `opacity` and `filter` (plus stroke-dashoffset in SVG). No layout-triggering animation.
- Lighthouse performance 90+ on Home with all motion running (95+ elsewhere). LCP under 2.5s, CLS under 0.05, INP under 200ms.
- Motion JS lazy-initializes below-the-fold effects.

## Accessibility (non-negotiable, even with heavy motion)

- `prefers-reduced-motion: reduce` stops all ambient motion, shows reveal content immediately, renders canvases as one still frame, and replaces count-ups with the final value.
- A footer control `[data-motion-toggle]` ("Motion on" / "Motion off") lets any visitor stop motion; the choice is remembered.
- The argument rotator keeps its pause control and pauses on hover and focus.
- No flashing anywhere (nothing faster than 3 flashes per second, no high-contrast strobing).
- Content never depends on motion: the final state is in the markup.
