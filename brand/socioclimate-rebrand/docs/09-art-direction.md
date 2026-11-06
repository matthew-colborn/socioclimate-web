# 09 · Art direction: the Luminous Archive

Matthew's moodboard (2026-11-05, `moodboard/`, internal only) pushes Deep Water further: light shaped into classical architecture, standing on water. The working name for the look is **the Luminous Archive**. The record is a building made of light; the market is the water it stands in.

It sits on top of everything before it: the live palette, the flame, Outfit / Inter / Plex Mono, the Deep Water layer and heavy motion. No new hues.

## What each reference gives us

| Ref | What we take | What we don't |
|---|---|---|
| 01 Liquid glass over a wave | Rounded frosted glass panels with a specular highlight and wave lines etched into the base; chip labels | The photographic wave as a background |
| 02 Marble statue with hologram | Classical figure meets live data: marble white against cyan code light | Photos of statues; any real artwork |
| 03 Luminous cathedral | Pointed gothic arches made of cyan light; nested arches giving depth; glittering reflective floor | Crowds, starfield |
| 04 Light portal on water | A single doorway of light standing on water, a lone figure at the threshold, mono labels in the corners | Rainbow prism colors (we keep it cyan and white) |
| 05 The weaver | Many threads of light woven into one fabric that becomes a map | Gold city lights, the figure |
| 06 Glass archive | An archive of glowing glass blocks, each stamped with a date; a spiral of records; "the observer is the key" | The quotes on the walls, the lantern figure |
| 07 Crystal colonnade | Turquoise crystal columns over a channel of water, white stone | Mountains |
| 08 Observer lens | A glass lens over an eye with a bright glint at the pupil, and floating glass HUD panels joined by hairlines: observing the record | The face, the person, the text in the panels |

Reference 06 is the thesis in a picture: observability. Reference 04's lone figure at the threshold is the observer. Both are why the portal on the home page has one small figure standing in the doorway.

## The blue flame is the light source

The flame mark is not just the logo in the corner. It is where the light in every composition comes from.

| Place | How |
|---|---|
| Header | The live mark with its breathing edge; ignites on first visit, flares on nav hover |
| Portal (Home hero) | Burns inside the doorway, high in the arch, floating gently above the observer; the doorway's light comes from it |
| Observer lens | Burns at the pupil as the glint at the center of the lens |
| Footer | Large mark (72px) with full glow above the mission line |
| Favicon, OG images, loader | The mark alone on ink, glowing |

Always the live mark's own geometry (`brand/socioclimate-flame.svg` is a reference copy; the repo component is canonical). Never recolored outside the cyan family, never outlined, never placed on a light surface without its glow.

## Motifs and where they live

| Motif | Asset / class | Where |
|---|---|---|
| Portal of light | `brand/portal.svg` in `.sc-portal` | Home hero (right of the headline). Gothic arch of light, five nested arches of linework, light streaks, the observer at the threshold, mirrored in the water |
| Reflective water floor | built into portal and colonnade; `.sc-waterline` | Under every hero composition |
| Liquid glass | `.sc-liquid` + `.sc-chip` | The loop cards, Services offering cards, Contact diagnostic panel, research abstracts |
| Glass archive | `.sc-archive` + `.sc-tile` | The register on Home and Databases (tiles above the table on Databases; tiles alone on Home). Each tile: ID, date stamp, name, stage |
| Weave | `brand/weave.svg` (`.sc-weave`) | Method section ("Wire the sources") and the top of each database page: scattered sources flowing into one glowing record bar |
| Crystal colonnade | `brand/colonnade.svg` (`.sc-colonnade`) | Section divider before the footer on every page, and as the Research page hero |
| Observer lens + HUD | `brand/lens.svg` in `.sc-observe` with `.sc-hud` / `.sc-hud-panel` | Database detail heroes (replaces the instrument ring there) and the Research hero. Panels float beside the lens showing the record's stage and key figures, each joined to the lens by a hairline |
| Prismatic sparkle | `<canvas data-plankton="sparkle">` | Home hero and database heroes (denser, white highlights, like the glittering floors) |
| Corner metadata | `.sc-corners` | Hero corners: year top left, place and coordinates top right |
| Bathymetry currents | from Deep Water | Behind every hero, under the architecture |

## Composition rules

- One architectural centerpiece per screen (portal, colonnade, or archive), never two at once.
- Architecture always stands on water: a horizon line with a soft cyan pool and a faded mirror image.
- Light comes from inside the architecture (the portal, the columns), not from the page. Text stays on the dark water side.
- Liquid glass panels are the only rounded surfaces (22px). Tables, rules and inputs keep the live 2px.
- Headlines stay Outfit Light, left aligned, with one lit cyan word.

## Original imagery brief (if photographic or rendered art is wanted later)

The moodboard images belong to other artists and are never used, traced or recreated. If Matthew wants rendered hero art beyond the SVG motifs, it is commissioned or generated as original work to this brief:

- Subject per page: Home, a doorway of cyan light standing on still dark water at night, one small figure at the threshold. Databases, an archive of glowing glass tablets stamped with dates, seen from below in a spiral. Research, a colonnade of translucent turquoise columns over a channel of water. Services, liquid glass panel over a deep blue wave.
- Palette locked to the tokens: ink #020A21, cyan #00D8E7, cyan glow #99FFFF, white. No gold, no rainbow, no purple.
- No text in the image, no recognizable people or statues of real people, no logos.
- Delivered at 2x, WebP and AVIF, under 250KB each, with the SVG motif as the fallback and the reduced-motion still.

## Motion for the motifs (adds to 08-motion.md)

| Motif | Motion |
|---|---|
| Portal | Light breathes (8s); nested arches pulse in sequence, outer to inner; sparkle rises off the water |
| Weave | Points of light travel along each thread into the record bar; threads at three speeds |
| Colonnade | Columns glow in a slow staggered wave (9s) |
| Archive tiles | Rise into place in sequence on scroll; tilt back 4 degrees and glow on hover |
| Liquid glass | Lifts and tilts slightly on hover; the specular highlight follows the pointer (use the caustic `--mx/--my`) |
| Flame | Floats and breathes inside the portal (6s); the halo behind it pulses (4s) |
| Lens | Tick ring turns (90s), inner iris counter-rotates (40s), glint breathes (5s); HUD panels hover out of phase (7s) |
