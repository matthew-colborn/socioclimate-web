# 03 · Site architecture

## From the live site to the new one

The live site (audited 2026-11-05) is a single Astro page with anchors: `00 Home`, `01 What we do`, `02 Portfolio`, `03 Contact`. Its portfolio mixes our own database with client builds. The rebrand splits it into pages that follow the loop.

| Live section | Goes to |
|---|---|
| Hero + rotating "argument" panels | Home, kept as the second section (rewritten to the new line) |
| "What we are" / "Why it holds together" | Home "One loop" + Research intro |
| "What delivery includes" | Services |
| 01 What we do (four moves) | Home "Method" (rewritten as the record-building method) and Services "How a build runs" |
| Portfolio: Deed-Restricted DB | Databases → SC-01 detail page |
| Portfolio: PorchLight website, Alfred Basil, cleaning company | Services → Work |
| 03 Contact + five-question diagnostic | Contact page (diagnostic kept) |
| Footer "Building and compounding data moats." | Footer, kept |

## Sitemap

| Route | Page | Nav |
|---|---|---|
| `/` | Home | `00 Home` |
| `/services` | Services + client work | `01 Services` |
| `/databases` | The register | `02 Databases` |
| `/databases/deed-restricted` | SC-01 | |
| `/databases/building-power` | SC-02 | |
| `/research` | Research index | `03 Research` |
| `/research/[slug]` | Paper, note or log | |
| `/contact` | Contact + diagnostic | `04 Contact` |

Old anchors keep working: on `/`, a small script maps `#01-what-we-do` → `/services`, `#02-portfolio` → `/databases`, `#deed-restricted-db` → `/databases/deed-restricted`, `#alfred-basil`, `#porchlight-website`, `#branshe` → `/services#work`, `#03-contact` → `/contact`. Hash fragments never reach the server, so this must be client-side.

## Page specs (copy in 04-copy-deck.md)

### Home `/`
1. Hero, `.sc-abyss`, golden split. Eyebrow, H1 with one lit word, lead, primary pill "See the databases", secondary "Work with us". Right: the portal of light (`brand/portal.svg`) standing on water, sparkle canvas, corner metadata. `.sc-ticks` along the bottom.
2. The argument: the live rotating panels with pause control, three beats rewritten (keep the live component and its accessibility behavior).
3. Register preview: glass archive tiles from `content/instances.json` + the open SC-03 tile. "Open the register".
4. One loop: three liquid glass cards, Services → Databases → Research.
5. Method: the weave (sources flowing into one record) above `.sc-steps`, four steps.
6. Close: one line + "Start a conversation".

### Services `/services`
1. Hero (depth gradient and ridges, no bathymetry). H1, lead.
2. What a build includes (from the live "delivery" list, scoped to services).
3. How a build runs: the live four moves, applied to a client's own data.
4. Work: one block per case from `content/work.json`, each in the live three-column case format (The business / The leverage found / What it produced) with its stage pill and scene image.
5. Roster: small by design, waitlist when full.
6. CTA "Request a spot" → `/contact?topic=services`.

### Databases `/databases`
1. Hero `.sc-abyss`. H1, lead, honesty line.
2. Full register.
3. Method recap.
4. "Have a market with no record?" → Contact.

### Database detail `/databases/[slug]`
Rendered from one `instances.json` record: hero `.sc-abyss` with the instance's scene in `.sc-instrument`, ID, stage pill, tagline; the three-column case block; `.sc-figures` with sources; sources and coverage; use; as-of line. Private instances (SC-02) show gap, method and use only.

### Research `/research`
Register of papers and the log (ID, title, type, stage, date). Detail pages use `.sc-prose` on the same ink theme with the disclosure at top and bottom.

### Contact `/contact`
Keep the live five-question diagnostic (Yes / Partly / No) and the optional form (Name, Email, In your own words). Add a topic select (Services, Databases, Research, Other) prefilled from `?topic=`. Keep the direct email.

## Global
- Motion: every page follows `08-motion.md`. Each hero has a field canvas or scene in an instrument ring, plankton and currents; every section reveals on scroll; ridges tide and parallax; the depth gauge runs on desktop; pages dive between each other.
- Header: the live logo, numbered nav, glass background, phone menu button (44px) opening a glass sheet.
- Ridges stay as dividers between major sections on every page.
- Footer: live footer, links updated, mission line kept, research disclosure added.
- 404: "No record at this address." with a link to the register.
- Per page: title, description, canonical, OG image (reuse the live OG style), `Organization` schema on Home, `Dataset` on SC-01 once public, `Article` on research pages. Sitemap and robots.
