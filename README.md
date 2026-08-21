# socioclimate.io

The public website for SocioClimate. Astro, static output, no backend, no
database, no API routes, no forms. Contact is `mailto:`.

Six routes: `/`, `/thesis`, `/method`, `/portfolio`, `/partner`, `/writing`,
plus a `404`.

```bash
npm install
npm run dev        # http://localhost:4321
npm run build      # -> dist/
npm run preview    # serve dist/
npm run verify     # build + contrast + links + CSP hashes
```

---

## Editing content without touching components

Every word on the site lives in `src/content/` as MDX. Components read those
files; changing copy never means opening a `.astro` file.

| File | What it controls |
|---|---|
| `src/content/home.mdx` | Homepage. Frontmatter holds the tagline, the subline and the three data-moat cards. The body is the "The claim" section. |
| `src/content/pages/thesis.mdx` | `/thesis`, end to end, including where the charts sit. |
| `src/content/pages/method.mdx` | `/method`. |
| `src/content/pages/partner.mdx` | `/partner`, both columns. |
| `src/content/pages/portfolio.mdx` | The intro paragraph on `/portfolio`. The entries themselves are separate files. |
| `src/content/pages/writing.mdx` | The intro paragraph on `/writing`. |
| `src/content/portfolio/*.mdx` | One file per portfolio entry. Frontmatter carries the stage label; the body is the long description. Drives both the homepage cards and `/portfolio`. |
| `src/content/writing/*.mdx` | One file per paper: title, status, abstract, PDF link. |
| `src/content/doors/*.mdx` | The short "Partner with us" / "Sell us your company" copy in the closing panel on every page. |
| `src/config/site.ts` | Addresses and routes — the contact address, the two prefilled `mailto:` subjects, the nav. Not prose. |

Frontmatter is validated by `src/content.config.ts`, so a typo in a field name
fails the build rather than silently rendering nothing.

Two things to know when writing MDX here:

- **A line that starts with `<` becomes its own block.** Every `<Cite>` is
  deliberately placed on its own line at the end of a paragraph, so citations
  render as a source line under the claim they support. Putting one mid-sentence
  makes it inline instead — consistent placement is the reason they all look the
  same.
- **Do not add a `layout:` key to frontmatter.** Astro's MDX integration treats
  it as a component import and the build fails trying to resolve the value. The
  equivalent field here is called `width`.

### Adding a portfolio entry

Create `src/content/portfolio/<slug>.mdx` with `name`, `order`, `stage`,
`where`, `summary`, then the body. It appears on both `/` and `/portfolio`
automatically. `stage` is a free-text honest label — "Building", "In staging".

### Adding a paper

Create `src/content/writing/<slug>.mdx` with `title`, `order`, `status`,
`abstract`, `pdf`. Put the PDF in `public/papers/` and set `pdf` to
`/papers/<file>.pdf`. While the `pdf` value still begins with
`[MATTHEW TO FILL`, the page renders a "not posted yet" marker instead of a
broken download link.

---

## Design

Tokens are in `src/styles/tokens.css`, sampled from `brand/`. **Dark is the
default and only theme.** There is no light mode and one should not be added —
the brand does not exist on white.

Two motifs carry everything decorative: the circuit trace and the data ridge.
Nothing on this site is stock imagery, and there is no illustration that did not
come out of one of those two.

- **The mark** (`src/components/CircuitFlame.astro`) is traced from
  `brand/logo-stacked.jpeg` rather than drawn by hand. `npm run trace`
  regenerates `src/lib/flame.ts` and only needs re-running if the logo file
  changes. Two paths come out of it: the detailed contour, which follows the
  circuit channels, and a sealed silhouette used below 32px where the detail
  turns to noise.
- **Cyan is data, not decoration.** It marks the flame, links, and the single
  most important value in a chart. More than three cyan elements above the fold
  means cut one.
- **Glow is earned.** The mark glows. Nothing else does.
- **Charts are inline SVG components**, not images and not a library. They live
  in `src/components/charts/`, carry `role="img"` with an `aria-label` stating
  the actual values, and are legible at 360px.
- `--teal-deep` and `--teal-shadow` measure below 3:1 on every background here.
  They are for rules, borders and gridlines. `npm run contrast` fails the build
  if either is used as a text colour.

### The brand animations

Two source clips live in `brand/video/`, both 448x672 / 672x448, 6.04s, 24fps.
`npm run video` encodes them into `public/video/` and the output is committed,
so a normal build does no transcoding and `ffmpeg-static` stays a dev
dependency.

- **`mark`** — the flame, cropped out of the stacked lockup so it does not
  duplicate the wordmark the hero already renders as text. Used as the hero
  mark on `/`.
- **`lockup`** — the horizontal lockup with the data ridge coming alive. Used
  once, as a band between the portfolio and the two doors.

Three things were decided by measurement rather than habit:

- **Audio is stripped.** Both sources carried a stereo AAC track at ~127 kb/s —
  about 95 KB per file for a silent animation that autoplays muted.
- **h264/mp4 only, no WebM.** VP9 was encoded across the whole quality range and
  came out larger than h264 at every matched size on this content: dark frames,
  hard cyan edges, very little motion. One format that every browser plays beats
  two.
- **CRF 36.** Indistinguishable from CRF 30 at the sizes these are displayed,
  and roughly half the bytes. Together the two clips and their posters are
  ~138 KB, which is what takes the homepage from 130 KB to 261 KB.

`BrandVideo.astro` takes a `blend` prop because the two sources sit on different
fields. `mark` is on pure black, so `mix-blend-mode: screen` drops the field to
nothing over the navy and the flame floats; without it the clip reads as a
pasted black rectangle. `lockup` is already on a navy within a shade of `--ink`,
so screen blending would *brighten* it into a visible lighter rectangle instead
— it gets `blend="none"` and a `fade` mask on the edges.

Under `prefers-reduced-motion: reduce` the `<video>` is hidden and the poster
frame is shown as an `<img>`. It is the same file the video already uses as its
poster, so honouring the preference costs no extra request. `npm run video:check`
asserts both modes.

Video files are not content-hashed but are served `immutable` for a year. **If a
clip is ever re-encoded, rename it** — same rule as the fonts.

### The OG card

`npm run og` composites `public/og/socioclimate-og.png` (1200×630) and
`public/apple-touch-icon.png` from the stacked lockup on `--ink-black`. The
output is committed, so a normal build does no image processing.

---

## Verification

| Command | Checks |
|---|---|
| `npm run contrast` | WCAG AA over every token pair in use, printed as a table, plus the sub-3:1-token lint |
| `npm run links` | every internal link resolves against `dist/`, every external link is a real absolute https URL, every citation has a source and a date, no placeholder ever became a link target |
| `npm run csp` | the inline-script hashes in `firebase.json` match the build exactly |
| `npm run lighthouse` | all four categories, mobile profile, against a running preview |
| `npm run budget` | page weight and JavaScript against the 400 KB / 20 KB budgets |
| `npm run shots` | screenshots of `/` and `/thesis` at 390px and 1440px into `screenshots/` |
| `npm run video:check` | the brand clips autoplay when motion is allowed, and fall back to their poster stills under `prefers-reduced-motion` |

The last three need a server: `npm run preview -- --port 4332` in another
terminal, then pass `http://localhost:4332`.

---

## Citations

Every statistic carries a source and an as-of date through the `<Cite>`
component. **No citation currently links out.** The component takes an optional
`href` and will render a link when one is supplied; none were invented here, so
the site has no external links at all beyond its own canonical tags. Adding real
source URLs is a content edit, not a code change.

---

## Two recorded deviations

Both depart from `../../CONVENTIONS.md` on purpose. They are decisions, not
drift.

### 1. Firebase Hosting instead of a load balancer

`CONVENTIONS.md` specifies apex-via-global-external-Application-Load-Balancer
for production. That rule was written for Cloud Run services. This product has
no server, so there is nothing for a load balancer to front.

A global external ALB bills a fixed **$18.25/month at zero traffic** — the first
five forwarding rules at $0.025/hour — which is $219/year to put a forwarding
rule in front of static files. Firebase Hosting is **$0** for this site's
traffic: 10 GB storage and 360 MB/day transfer free, custom domain and managed
SSL included, global CDN, same organisation, same billing account, same IAM.
Beyond the free tier it is $0.026/GB stored and $0.15/GB transferred.

This is the same reasoning the conventions already apply when they decline to
run a second load balancer for staging.

### 2. The identity domain is used for this site

`CONVENTIONS.md` reserves the identity domain — the one enrolled in Cloud
Identity, which permanently names the GCP organisation — and says it is never
given to a product. `socioclimate.io` is that domain.

This is the exception the rule anticipates. The rule exists so a *product's*
disposable name never gets welded to the organisation's permanent one. This site
is not a product. It is the company itself, and the company's address and the
organisation's identity are supposed to be the same string.

Product sites still get their own domains.

---

## Structure

```
brand/            the two source lockups, the two source clips, the traced path
public/           fonts, favicon, OG card, encoded video, robots.txt
scripts/          build helpers and the verification suite
src/
  components/     Cite, Figure, Counterweight, the mark, the wordmark, charts, icons
  config/site.ts  addresses and nav
  content/        every word on the site
  layouts/        BaseLayout (head, header, footer) and ProseLayout
  lib/flame.ts    generated — do not hand-edit
  pages/          one file per route, thin: load content, render a layout
  styles/         tokens.css and base.css
```

Fonts are self-hosted in `public/fonts` and copied out of `node_modules` by
`npm run fonts`. The site makes no network request to Google Fonts or anywhere
else, which is also what makes the Content-Security-Policy as tight as it is.

`astro.config.mjs` sets `inlineStylesheets: 'never'` on purpose. Letting Astro
inline small stylesheets would force `style-src 'unsafe-inline'` into the
policy; serving them as files costs a handful of extra requests, all of them
tiny and cached for a year, and Lighthouse still returns 100.

`screenshots/` is gitignored — it is regenerable with `npm run shots`.
