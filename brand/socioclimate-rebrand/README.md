# SocioClimate rebrand package · Luminous Archive · v2.2 (2026-11-05)

Built on the live socioclimate.io (audited 2026-11-05). Same colors, fonts, logo and components, taken deeper: depth gradient, bathymetric chart, graticule, glass, astrolabe instrument rings, sonar, and heavy motion on every page. New structure: Home, 01 Services, 02 Databases, 03 Research, 04 Contact.

Drop this folder into the site repo at `brand/socioclimate-rebrand/`, then paste `KICKOFF_PROMPT.md` into Claude Code.

```
socioclimate-rebrand/
├── CLAUDE.md                 binding rules + review checklist
├── KICKOFF_PROMPT.md         paste into Claude Code
├── docs/
│   ├── 01-positioning.md     the line, the loop, the three arms
│   ├── 02-aesthetic.md       live baseline + the Deep Water layer
│   ├── 03-site-architecture.md   live-to-new map, sitemap, page specs
│   ├── 04-copy-deck.md       every word, live lines marked, [VERIFY]/[MATTHEW] flags
│   ├── 05-content-model.md   instances, work, research, log, config
│   ├── 06-voice-and-compliance.md
│   ├── 07-roadmap.md         what to do, in order, with definitions of done
│   ├── 08-motion.md          keep every live animation + the Deep Water motion layer
│   └── 09-art-direction.md   the Luminous Archive: portal, colonnade, weave, glass archive, liquid glass
├── tokens/   tokens.css (A live verbatim, B Deep Water, C motion, D Luminous Archive), tokens.json
├── css/      socioclimate.css (new and restyled components + motion layer)
├── js/       motion.js (reveals, count-ups, currents, plankton, flame ignition, depth gauge...)
├── brand/    portal (flame-lit), observer lens, colonnade, weave, bathymetry SVGs; socioclimate-flame.svg (reference copy)
├── moodboard/ Matthew's 8 references (internal only, never shipped)
├── fonts/    Outfit, Inter, IBM Plex Mono (only if the repo lacks them)
├── content/  instances.json, work.json, research.json, site.json, predictions.json
└── preview/  brand-preview.html
```
