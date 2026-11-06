# Kickoff prompt

Copy this package into `brand/socioclimate-rebrand/` at the root of the socioclimate.io repo (the Astro site, likely `C:\Users\Matth\dev\socioclimate\products\socioclimate-web`), then paste everything below the line into Claude Code from the repo root.

---

Evolve the live SocioClimate site using the package in `brand/socioclimate-rebrand/`. Work autonomously under Nergi Code on a branch named `rebrand/deep-water`. Do not push to main and do not deploy.

Read `brand/socioclimate-rebrand/CLAUDE.md` first, then `docs/01-positioning.md` through `docs/09-art-direction.md`, and look through `moodboard/` (reference only, never shipped), then open `preview/brand-preview.html` as the visual target.

This builds on the current site, it does not replace it. Keep the existing tokens, fonts, logo, scene images, ridges and components. `tokens/tokens.css` Part A was copied from the live stylesheet; confirm it matches the repo and add Part B, the Deep Water layer, and Part C, motion. Keep the flame logo.

What changes: the company line becomes "the system of record for fragmented markets." The single page splits into Home, 01 Services (with the client work), 02 Databases (with a page per database), 03 Research, and 04 Contact (keeping the diagnostic). Old anchors must land on the new pages.

Motion is heavy across the entire site, like the current one and beyond it. Keep every existing animation (backdrop canvas, field canvases, drift, breathe, rule pulse, flame breathe, pinned process stage, argument rotator) and extend them to every new page. Add the Deep Water motion layer from `js/motion.js` and `docs/08-motion.md`: flame ignition, scroll reveals, count-ups, flowing contour currents, plankton particles, sonar sweeps, shimmer, caustic pointer light, ridge tide and parallax, depth gauge, page dive transitions. Keep it smooth (canvases pause off screen) and keep reduced motion plus a footer motion toggle working.

The look goes one step further, the Luminous Archive: light shaped into classical architecture standing on water. Use the motifs in `brand/` and `docs/09-art-direction.md`: the portal of light with the blue flame burning in it and the observer in the doorway as the Home hero, the observer lens with floating HUD panels on database and research pages, the register as glass archive tiles, light threads weaving into a record in the method, a crystal colonnade divider, liquid glass cards, and reflective water under every hero.

Before Phase 1, tell me in two or three lines how the repo is structured (layouts, components, where tokens live) and how you will map the package onto it. Then keep going without waiting, phase by phase per `docs/07-roadmap.md`.

Rules that matter most: copy verbatim from `docs/04-copy-deck.md` with dashes removed; every figure needs a label and source; the Deed-Restricted DB stays "Building"; private database shows no data; Alfred Basil stays at today's level of detail; no new colors.

Finish with one PR: screenshots of every page at desktop and phone next to the preview, a before and after of the home page, the anchor map, every `[VERIFY]` and `[MATTHEW]` item, and anything skipped with the reason. Put anything that needs my manual action on a backfill list in the PR instead of stopping.
