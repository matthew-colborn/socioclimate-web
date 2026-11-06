# 07 · Roadmap: what to do, in order

Each phase has a definition of done. Claude Code works phases 1 to 6 autonomously on a branch under Nergi Code. Phase 0 and the launch step are Matthew's.

## Phase 0 · Matthew's backfill list (does not block the build)

- [ ] Resolve every `[VERIFY]` and `[MATTHEW]` item in the PR description.
- [ ] Send the Research pages, disclosure and any brokerage mention to Latoya.
- [ ] Decide whether Services pricing is public.
- [ ] Get Mark's okay before Alfred Basil is shown in more detail than the live site already shows.
- [ ] Supply a source line for each live Deed-Restricted DB figure.

## Phase 1 · Foundation

Confirm the repo's existing tokens match Part A of `tokens/tokens.css` (they were copied from the live stylesheet). Add Part B (Deep Water) next to them. Add `bathymetry.svg`. Keep the existing logo, fonts and scene images.
Done when: Part A is unchanged in the repo, Part B is added, and no new hex values exist outside the tokens file.

## Phase 2 · Structure

Split the single page into the routes in `03-site-architecture.md`, numbered nav 00 to 04, phone menu, client-side mapping of old anchors, 404 page.
Done when: every old anchor lands on the right new page; nav works by keyboard; phone menu traps focus and closes on Escape.

## Phase 3 · Data layer

`content/instances.json`, `work.json`, `research.json`, `site.json`, with the live portfolio text copied in, the TypeScript types, the CI schema check (figures need source and asOf), and the stale rule.
Done when: adding a fourth instance to the JSON creates a register row and a detail page with no code change.

## Phase 4 · Pages

Build every page from the copy deck, reusing the live components (argument rotator, case blocks, figures, diagnostic) and adding the Register and Deep Water layer, matching `preview/brand-preview.html`.
Done when: side by side with the preview at 1440px and 390px, color, type, spacing and hero treatment match; no horizontal scroll at 390px.

## Phase 4b · Motion

Wire `js/motion.js` into the base layout (init on load and on `astro:page-load`). Extend the live canvases and keyframes to every new page. Add every effect in `docs/08-motion.md` where it lists. Add the footer motion toggle.
Done when: every page has continuous ambient motion, reveals and transitions; a performance trace of Home shows smooth 60fps scrolling; reduced motion and the toggle stop everything.

## Phase 5 · Quality

Accessibility (axe clean, AA contrast, focus visible, reduced motion respected), performance (LCP under 2.5s on mid-tier mobile, CLS under 0.05, INP under 200ms, motion code lazy below the fold), SEO (titles, descriptions, canonical, OG images, sitemap.xml, robots.txt, structured data), security headers.
Done when: Lighthouse 95+ on all four categories for Databases, one detail page and Contact, and 90+ performance (95+ elsewhere) on Home with motion running.

## Phase 6 · PR

One PR with screenshots (desktop and phone, every page), the redirect map, the full `[VERIFY]` / `[MATTHEW]` list, and anything skipped with the reason.
Done when: CI is green and the PR is ready for Matthew's review. Production deploy waits for Matthew.

## Parallel track (the one that makes the positioning true)

Get deedrestricted.org from localhost to a public URL with someone other than Matthew querying it. When that happens, change SC-01 `status` from `building` to `live`, add `url`, update `asOf`. That one data edit flips the site from a plan to a proof. It belongs in the deedrestricted repo, not this one.

## Later (not in this package)

Email signature, LinkedIn and X banners, a Slides template and a research paper template in this system. Each one reuses `tokens.json` and the live logo.
