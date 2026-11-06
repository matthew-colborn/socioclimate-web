# 02 · Aesthetic: the live site, taken deeper

Start from what socioclimate.io already is (audited 2026-11-05). This rebrand **evolves** that look; it does not replace it. Colors, fonts, logo, radius and easing stay exactly as they are in the repo. Open `preview/brand-preview.html` for the target.

## What the live site already has (keep all of it)

| Element | Live value |
|---|---|
| Ground | Ink #020A21, ink-deep #000615 |
| Signal | Cyan #00D8E7, cyan-bright #2AE2EA, cyan-glow #99FFFF |
| Linework | Teal-deep #006184, teal-shadow #00506B, blue-lift #1E6FA8, blue-deep #062038 |
| Text | Paper #FFFFFF headings, paper-dim #A8B6C8 body |
| Display | Outfit Variable, weight 300, tracking -0.02em |
| Body | Inter Variable |
| Data and labels | IBM Plex Mono, uppercase, wide tracking |
| Shape | 2px radius on surfaces; pills (999px) on buttons and status badges |
| Signature imagery | Glowing cyan circuit-line scenes (flame, process, ridge, traces, converge, lattice, threshold) with `--glow-mark` |
| Ocean already present | Layered wave ridges between sections, overhead glow, 32px faint grid |
| Motion already present | Full-page canvas backdrop, animated canvas scenes per section, drifting fields, breathing glows, pulsing rules, breathing flame, pinned process stage, auto-rotating argument |
| Logo | The cyan flame mark + "SocioClimate" wordmark with "Climate" in cyan. Unchanged, and it keeps its breathing edge. Reference copy: `brand/socioclimate-flame.svg`. |
| Voice of the page | Honest stage labels, figures with labels, "left out rather than filled" |

All of these are in `tokens/tokens.css` Part A, copied verbatim with the same variable names.

## What the rebrand adds: Deep Water

The live site reads as *ocean surface*: ridges and glow. The rebrand takes it *down*, into chart-making. A fragmented market is open water with no chart; SocioClimate makes the chart. Neo renaissance futurism: the order and engraving of a Renaissance nautical chart and astrolabe, lit like a future instrument.

| Layer | Class / token | Use |
|---|---|---|
| Depth gradient | `--depth-gradient` on body | Lighter water (blue-deep) at the top, ink-deep at the bottom of every page |
| Bathymetry | `.sc-abyss`, `brand/bathymetry.svg` | Contour chart that drifts slowly. Home hero, Databases hero, each database page hero. Ridges stay as section dividers everywhere else |
| Graticule | inside `.sc-abyss`, `.sc-ticks` | Fine coordinate grid (4x the live grid step) and engraved coordinates along the hero edge |
| Glass | `.sc-card`, header | Frosted water panels, caustic 1px rim highlight on top, soft cyan glow on hover |
| Instrument | `.sc-instrument` | Astrolabe rings framing a live scene image. The outer dashed ring orbits slowly |
| Sonar | `.sc-status--live` | Live items ping |
| Construction geometry | `.sc-construction` | Golden-section hairlines and arcs behind hero compositions, very faint |
| Ornament rule | `.sc-ornament` | Hairline with a centered mono caption (`· SC-01 ·`) between major sections of long pages |
| Proportion | `--hero-split: 1.618fr 1fr` | Golden-ratio hero split |
| Lit word | `.sc-h1 em` | One word per headline glows cyan, like a lit glyph on a chart |

## Rules

- No new colors. Everything in Part B is mixed from Part A.
- Cyan is the only accent. It means "signal": the active thing, the live thing, the record in focus. One primary (cyan pill) button per view.
- Teal and blue-lift are linework only; they fail contrast as text.
- Bathymetry and instrument rings appear only where listed above. Heavy motion throughout, as on the live site and beyond it; the full spec is `08-motion.md`. Canvas is in (the live site uses it); WebGL, autoplay video and scroll-jacking are out.
- Motion feel: slow, continuous and layered, many things moving at different speeds like water. Never bouncy, snappy or flashing. All of it stops under reduced motion or the footer motion toggle.
- Reuse the live scene images (`flame`, `bars`, `lattice`, etc.) inside instrument rings. New scenes, if made, follow the same style: cyan circuit linework with glow on transparent ground.
- Keep the live honesty devices: stage labels in pills, figures with a label and a source line, gaps left empty rather than filled.

## Further: the Luminous Archive

The moodboard of 2026-11-05 takes Deep Water into architecture: a portal of light, crystal colonnades, a glass archive, threads woven into a record, liquid glass, reflective water. Full spec in `09-art-direction.md`.

## Do / don't

Do: let one claim carry each section; keep cyan rare enough to mean something; show real stage labels.
Don't: stock photos, people illustrations, gradients on text, gold or any new accent color, emojis, fake dashboards, invented figures.
