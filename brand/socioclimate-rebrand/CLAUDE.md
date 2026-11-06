# CLAUDE.md · SocioClimate rebrand (Deep Water)

Binding rules for evolving socioclimate.io. Nergi Code governs engineering standards; this file governs brand, content and design. Nergi Code wins on security and code quality; this file wins on what the site looks like and says.

## Baseline

The live site (Astro, single page, audited 2026-11-05) is the starting point. Its tokens, fonts, logo, scene images and components stay. `tokens/tokens.css` Part A is a verbatim copy of the live variables; Part B is what this rebrand adds. This is an evolution, not a replacement.

## Source of truth, in order

1. `docs/04-copy-deck.md` and `content/*.json` for every word and number. Lines marked *(live)* already exist in the repo.
2. `preview/brand-preview.html` for how it looks.
3. `tokens/tokens.css` for values. Part A must match the repo; if it does not, the repo wins and you note the difference in the PR.
4. `css/socioclimate.css` for new component behavior. Restyle existing components rather than duplicating them.
5. `docs/01` to `09` for intent and rules (09 is the Luminous Archive art direction). `js/motion.js` is the motion engine; wire it into the base layout.

## Hard rules

1. No new colors. No hex values outside the tokens file. No gold or any second accent; cyan is the only accent.
2. Keep the live flame logo (with its breathing edge), Outfit / Inter / IBM Plex Mono, the 2px surface radius (liquid glass panels are the one exception at 22px), pill buttons and pill stage badges, ridges and scene images.
3. One primary (cyan pill) button per view.
4. Bathymetry (`.sc-abyss`) only on the Home hero, Databases hero and database detail heroes. Ridges stay as section dividers.
5. Every figure renders with a label and a source line. A figure with a `[VERIFY]` source renders a visible placeholder and is listed in the PR.
6. Copy comes from the copy deck. Do not write new marketing copy. Missing strings become `[MATTHEW]` placeholders listed in the PR.
7. Private instances (`visibility: "private"`) never render records, counts, addresses or owners.
8. Stages are honest. The Deed-Restricted DB stays "Building" until the data says otherwise. Never infer "Live".
9. Alfred Basil stays at the detail level the live site already shows.
10. No em or en dashes in rendered copy, including carried-over live copy. No bold inside sentences.
11. Securities, brokerage and fair housing language follows `docs/06-voice-and-compliance.md`; when unsure use the safe default and flag it.
12. Heavy motion everywhere, per `docs/08-motion.md`: keep every live animation (backdrop canvas, field canvases, drift, breathe, rule pulse, flame breathe, pinned process stage, rotator) and add the Deep Water layer through `js/motion.js`. Every page and section moves. All of it stops under `prefers-reduced-motion` and the footer motion toggle. No WebGL, autoplay video or scroll-jacking.
13. Phone first: no horizontal scroll at 390px, 44px tap targets.
14. The blue flame logo is the light source of the brand: header, inside the portal, at the center of the observer lens, large in the footer, favicon and OG images. Use the repo's own mark component, never a redraw.
15. Luminous Archive motifs per `docs/09-art-direction.md`: portal hero on Home, glass archive tiles for the register, observer lens with HUD panels on database and research heroes, weave in the method, crystal colonnade divider, liquid glass cards, reflective water under every hero. One architectural centerpiece per screen.
16. `moodboard/` is internal reference only. Never ship, copy, trace or recreate those images.

## Working style

- Keep Astro, the hosting and the deploy setup. Prefer targeted edits to rewrites.
- Remove styles and markup the split leaves unused.
- Branch only. No push to main, no production deploy.

## Review checklist

- [ ] Part A tokens unchanged in the repo; Part B added; no stray hex values.
- [ ] Old anchors (`#01-what-we-do`, `#02-portfolio`, `#deed-restricted-db`, `#alfred-basil`, `#porchlight-website`, `#branshe`, `#03-contact`) land on the right pages.
- [ ] One primary button per view.
- [ ] Every figure has label and source (or a flagged placeholder).
- [ ] Private instance shows no data.
- [ ] No dashes in rendered copy (grep built HTML for "—" and "–").
- [ ] Argument rotator pause control and diagnostic still work by keyboard.
- [ ] Phone menu: keyboard, Escape, focus trap.
- [ ] Every live animation still running; every item in `docs/08-motion.md` present on every page it lists.
- [ ] Canvases pause off screen and in hidden tabs; 60fps scrolling on Home (record a performance trace).
- [ ] Reduced motion and the motion toggle stop everything and show final states.
- [ ] Every motif in `docs/09-art-direction.md` placed where it lists; `moodboard/` excluded from the build.
- [ ] axe clean, AA contrast.
- [ ] Lighthouse 95+ on Databases, one detail page and Contact; 90+ performance on Home with motion running.
- [ ] Screenshots at 1440px and 390px of every page, next to the preview, and before/after of the current home page.
