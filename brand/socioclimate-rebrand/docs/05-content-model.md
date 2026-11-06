# 05 · Content model

All register content is data, not markup. Pages render from these files so adding an instance or a paper is a data edit, not a code change. Starter files are in `content/`.

## `content/instances.json`

```ts
type Instance = {
  id: string;            // "SC-01". Stable forever, never reused.
  slug: string;          // URL segment under /databases
  name: string;
  sector: string;
  geography: string;
  coordinates?: string;  // graticule label for the hero, e.g. "32°43′N 117°09′W"
  status: "live" | "building" | "staging" | "private" | "stale" | "open";
  visibility: "public" | "private"; // private: never render records or counts
  asOf: string;          // ISO date the facts on the page were last checked
  tagline?: string;     // "The price nobody publishes."
  scene?: string;       // live scene image name (flame, bars, lattice...)
  business?: string; leverage?: string; produced?: string; // three-column case block
  gap: string; record: string; sources: string; use: string;
  url?: string;          // render only when status === "live"
  figures?: { value: string; label: string; source: string; asOf: string }[];
  coverage?: { name: string; status: string; source?: string }[]; // per jurisdiction etc.
  notes?: string[];      // [VERIFY]/[MATTHEW] flags, never rendered
};
```

Rules:
- A figure without `source` and `asOf` fails the build (add a schema check in CI).
- Stage labels match the live site's pills: live → "Live", building → "Building", staging → "In staging", private → "Private", stale → "Stale", open → "Selecting". Classes `.sc-status--*`.
- `stale` is set automatically when `asOf` is older than 120 days. The page still renders; the pill turns dashed and muted.
- `visibility: "private"` hides `coverage`, `figures` and `url` even if present.

## `content/work.json` (client work, rendered on Services)

```ts
type Work = {
  slug: string;           // keeps the live anchor ids: porchlight-website, alfred-basil, branshe
  name: string;           // "PorchLight website"
  stage: "live" | "staging" | "operating" | "building";
  tagline?: string;
  business: string; leverage: string; produced: string;  // live three-column text
  figures?: { value: string; label: string; source: string; asOf: string }[];
  scene?: string;
  public: boolean;        // false hides the entry without deleting it
};
```
Starter file is seeded with names and stages only. Claude Code copies each entry's three paragraphs from the live portfolio markup in the repo (dashes removed).

## `content/research.json`

```ts
type ResearchEntry = {
  id: string;            // "RS-01"
  slug: string;
  title: string;
  kind: "working-paper" | "operating-paper" | "note" | "log";
  status: "draft" | "working" | "published" | "opening";
  date?: string;         // ISO, first public version
  version?: string;      // "v0.3"
  abstract?: string;
  body?: string;         // path to MDX/Markdown source
  publish: boolean;      // false: row shows in the register as "Draft", page does not exist
};
```

## Prediction log (when it opens)

`content/predictions.json`, append only. Each entry: `id`, `madeOn`, `subject` (public ticker or index), `claim` (plain sentence), `resolveBy`, `resolution` (`null` until scored), `scoredOn`, `outcome` ("correct" | "incorrect" | "void"), `note`. Never edit a past `claim` or `madeOn`; corrections are new entries that reference the old id. Git history is the audit trail. Show the full record including misses.

## Config

`content/site.json`: `contactEmail`, `services.showPricing` (default false), `services.buildFrom`, `services.monthlyFrom`, `services.rosterOpen` (bool, toggles "Request a spot" vs "Join the waitlist"), `staleAfterDays` (120).
