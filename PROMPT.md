# Claude Code build prompt — socioclimate.io

Paste everything below the line into Claude Code from an empty directory
(`C:\Users\Matth\dev\socioclimate\products\socioclimate-web\`).

Before you start, copy the two brand files into `brand/` in that directory:

- `C:\Users\Matth\OneDrive\Pictures\SocioClimate\IMG_5040.jpeg` → `brand/logo-horizontal.jpeg`
- `C:\Users\Matth\OneDrive\Pictures\SocioClimate\IMG_5041.jpeg` → `brand/logo-stacked.jpeg`

---

# Build socioclimate.io

You are building the public website for **SocioClimate** — a holding company
that creates and monetizes data moats. This is a marketing site, not an
application. It has no backend, no database, and no cloud project behind it.

Read this entire brief before writing any code. Then propose a file plan,
get it approved, and build.

---

## 1. What the company is

SocioClimate finds markets where the facts that determine value are not
published anywhere, assembles the record, and owns it. It does this three ways:
it **builds** the data asset itself, it **partners** with an operator who
already sits on the raw material, or it **acquires** the company that does.

The one-line positioning is **"The data moat company."** The site's job is to
make a stranger — an operator, a founder, a seller, a partner — understand that
sentence in under thirty seconds and know which of the two doors is theirs.

### The thesis the company is built on

Automation diffuses in proportion to the **observability** of an asset — the
frequency, publicity, and standardization of its price record — and is largely
indifferent to available computing power. Where a dense public price record
exists, decisions get ceded to models. Where it does not, valuation stays with
a human whose incentives are set by whoever pays for the number.

The consequence, and the company's whole reason for existing: **the returns
accrue at the observation layer, not the computation layer.** Compute is a
commodity. Observation is a network good with increasing returns. The
competitive fight in every one of these markets is over who is permitted to
see, not who is permitted to compute.

Three sentences that should appear somewhere on the site, close to verbatim:

> Fannie Mae's Desktop Underwriter reached production in June 1995 and rendered
> a credit decision in under fifteen seconds. In the same country, in 2026, an
> institutional office building is valued by a human on an annual rotation,
> engaged and paid by the party whose fee is a function of the resulting number.
> The technology was ready for the harder problem long before it was applied to
> the easier one.

And the cleanest single proof point, which is a chart, not a paragraph:

> Zillow's Zestimate had a median error of **1.8%** on listed homes and **7.2%**
> on off-market homes in 2025 — the same model, the same housing stock, the same
> day. The only difference is whether a price was published.
> *(Zillow Group FY2025 Form 10-K, filed 2026-02-11.)*

### What a data moat is, as SocioClimate defines it

A defensible data asset has three properties. Use these as a named framework on
the site — they are the company's method, stated compactly:

1. **Accumulated normalization.** Thirty jurisdictions, thirty schemas, one
   output. The thirty-first is nearly free; a new entrant has to redo all
   thirty. Cost is linear for them, asymptotically zero for us.
2. **A time series that cannot be back-bought.** History is the only component
   that is unreconstructable at any price once the window has passed. Start the
   clock early; never sell the history.
3. **Work that is tedious rather than hard.** No single scraping target, no one
   large engineering problem — thirty small interpretation problems. That is the
   shape large vendors are structurally worst at and a small operator is best at.

### The disclosure posture (this is a differentiator, put it on the site)

- **Publish the rulebook in full**, with quotes and sources. It derives from
  public documents, so withholding it captures almost no value and publishing it
  makes SocioClimate the reference point. It also opens a correction loop:
  thirty published jurisdictions is thirty free proofreaders.
- **Publish existence, sell depth.** Whether a parcel carries a restriction is
  the public good. The terms, the expiration date, the portfolio view are the
  product.
- **Never publish the time series.** Publish *findings* derived from it. Nobody
  becomes a reference by holding a file.

### The proof — the current portfolio

**Deed-Restricted DB (San Diego, building now).** Deed-restricted affordable
for-sale housing is an unobserved asset class inside the most instrumented
housing market in the world. Prices are set administratively by a housing
agency and the pricing rule is unpublished. Across the first six San Diego
listings observed, list price equals original price on every one — including
units that sat 317 and 298 days. Zero price reductions, because price is a
formula output rather than an offer. The City of San Diego held 23,440
deed-restricted units as of May 2020, with roughly 4,200 covenants expiring
between 2020 and 2040 — figures that exist only because the City commissioned a
consultant study. The agency administering the stock could not answer the
question from standing systems. That is the market, stated precisely.

Three layers, built in reverse order of glamour: **the rulebook** (program
guidelines normalized to machine-readable form), **the covenant index**
(recorded documents, APN-keyed, durable 45–55 years), **the events** (listings,
sales, DOM — worthless without the first two).

**PorchLight OS.** Operating software for a residential brokerage. Currently in
staging. Describe it in one short paragraph as an operating product; do not
oversell it.

Do not invent metrics, customers, logos, testimonials, team members, funding, or
case studies. If a number is not in this brief, it does not go on the site.

---

## 2. Audience and the two doors

Three readers, in priority order:

1. **The operator or founder sitting on unobserved data** who does not know that
   is what they have. They should leave understanding the framework and wanting
   a conversation. → **Partner**
2. **The owner of a small data or services business** who wants an exit to
   someone who will actually run it. → **Acquire** (i.e. sell to us)
3. **The serious skeptic** — an allocator, an agency, a journalist — who wants to
   know whether this is real. They should be able to read the papers.

Every page ends by pointing at one of the two doors. There is no generic
"Contact us" — there is *"We should talk about your data"* and *"We buy
companies like yours."*

---

## 3. Information architecture

Six routes. No more. Every page under ~900 words except Thesis.

| Route | Job |
|---|---|
| `/` | The claim, the proof chart, the three-property framework, the two doors |
| `/thesis` | The observability argument in full, with charts and citations |
| `/method` | How a moat gets built: the three layers, the disclosure posture, what we look for in a market |
| `/portfolio` | Deed-Restricted DB and PorchLight OS. Honest stage labels. |
| `/partner` | Both doors on one page, split: partner with us / sell to us. Criteria + what to send. |
| `/writing` | The papers, as readable HTML with a PDF download |

### `/` — section order

1. **Hero.** Wordmark, one line: *The data moat company.* One subline: *We find
   markets whose prices nobody publishes, assemble the record, and own it.* Two
   buttons, side by side, equal weight: **Partner with us** · **Sell us your
   company**.
2. **The claim.** Three or four short paragraphs. Compute is a commodity;
   observation is a network good; the rent has moved to the observation layer.
3. **The proof.** The 1.8% / 7.2% chart, full-bleed, with the citation under it.
   This is the single most important object on the site. It should be the thing
   a visitor screenshots.
4. **What a data moat is.** The three properties, as three cards with icons
   derived from the circuit motif — not stock iconography.
5. **Where we're doing it.** Two portfolio cards with real stage labels.
6. **Two doors.** Full-width split panel. Left: partner. Right: acquire.

### `/thesis`

The full argument, structured with headings, running roughly 1,500–2,500 words,
adapted from the paper *Automation Follows Observability*. It must include:

- The 1995 vs. 2026 opening.
- The residential evidence: 62% of conventional closed loans market-wide
  reviewed by Desktop Underwriter over 2018–2024; 28% of GSE acquisitions
  carrying an appraisal waiver in March 2026; appraiser credentials down from
  120,551 (2008) to 95,731 (2017).
- The institutional evidence: Green Street's index peaked March 2022, NCREIF's
  market value index one quarter later; at the bottom the gap was three
  quarters. Q1 2026 NPI appraisal cap rate of 4.57% against 5.27% on properties
  actually sold out of the index — seventy basis points of residual appraisal
  optimism four years after the peak.
- Deloitte's 2026 CRE outlook: of 850+ senior executives, **1%** reported
  transformative impact from AI. Mercer, February 2026: 69% name data quality or
  access as the binding barrier. Nobody is citing compute.
- **A section titled "What would make this wrong."** Include the honest
  counter-evidence: the CMBS vendor divergence (Trepp 7.86% vs. Fitch 3.49%
  overall delinquency for July 2026, same month); Asquith, Covert and Pathak
  finding mandated transparency *reduced* trading activity; Weller finding
  algorithmic trading reduces the information content of prices. State the claim
  in its defensible form: observability is necessary, not sufficient.

That last section is not a hedge. It is the credibility of the entire site.
Design it to be read, not buried — give it the same visual weight as the
argument it qualifies.

Every statistic on this page carries an inline source with an as-of date.
Build a small `<Cite>` component for this and use it everywhere.

### `/partner`

Two columns, honest about criteria.

**Partner with us** — for operators who already generate the raw material.
What we bring: schema design, normalization, the productization, the buyers.
What we look for: a recurring stream of records nobody else sees; a market where
the governing rules are public but scattered; a segment too small for a national
vendor to bother with.

**Sell us your company** — for owners of data or services businesses.
Say plainly what SocioClimate is: a small operator, not a fund. No blind pool,
no auction process, no LOI within 48 hours theatre. Size range and structure are
left blank in the copy — mark them `[MATTHEW TO FILL]` in a comment rather than
inventing terms.

Contact is a `mailto:` link. No form, no backend.

---

## 4. Design

**Follow the two brand files in `brand/`.** Read both before styling anything.

The mark is a cyan flame. In the stacked version it is drawn from circuit
traces with node dots at the junctions; in the horizontal version it rises out
of a data histogram shaped like a mountain range. Those two motifs — **circuit
trace** and **data ridge** — are the entire visual vocabulary. Everything
decorative on the site derives from one of them.

### Tokens (sampled from the brand files — use these exact values)

```
--ink            #020A21   page background, horizontal-lockup navy
--ink-deep       #000615   sections that need to recede
--ink-black      #000000   the stacked lockup's field; use sparingly, for full-bleed moments
--cyan           #00D8E7   primary. links, the mark, key data marks
--cyan-bright    #2AE2EA   hover, active
--cyan-glow      #99FFFF   glow layers and the brightest point of a gradient only
--teal-deep      #006184   secondary data series, borders, muted rules
--teal-shadow    #00506B   chart gridlines, dividers
--paper          #FFFFFF   primary text on ink
--paper-dim      #A8B6C8   secondary text
```

**Dark is the default and only theme.** The brand does not exist on white — do
not build a light mode.

The wordmark is set in a geometric sans with a single-storey `a` and a wide
circular `C`. Match it with **Poppins** or **Outfit** for display, and pair with
a quiet neutral (**Inter**) for body copy. Self-host both as woff2 in
`/public/fonts` — no Google Fonts network request. In the horizontal lockup
"Socio" is white and "Climate" is cyan; carry that split into headlines
sparingly, at most once per page.

### Rules

- **Cyan is data, not decoration.** It marks the flame, links, and the single
  most important value in any chart. If a page has more than three cyan
  elements above the fold, cut one.
- **Glow is earned.** The mark glows. One hero element may glow. Nothing else.
  No neon borders on cards, no glowing buttons.
- **No stock photography. No gradient mesh backgrounds. No 3D renders. No AI
  illustration.** The visual interest comes from data marks and the circuit
  motif.
- **Charts are first-class.** Build them as inline SVG components, not images
  and not a charting library. They must be legible at 360px wide and readable
  by a screen reader (`role="img"` with a full `aria-label` stating the values).
- Generous whitespace. Long measure is the enemy — cap body text at 68ch.
- Motion: one scroll-triggered reveal per section at most, 200–300ms, and it
  must respect `prefers-reduced-motion`. The circuit traces may animate a slow
  pulse in the hero and nowhere else.
- Every interactive element has a visible focus ring in `--cyan-bright`.
- Contrast: verify every text/background pair against WCAG AA programmatically
  and print the results. `--paper-dim` on `--ink` is the pair most likely to
  fail; fix the token rather than the usage if it does.

---

## 5. Voice

Match the writing in the source papers, which is: declarative, specific,
sourced, and unembarrassed about stating what is uncertain.

- Claims carry evidence and an as-of date. If you cannot source it, cut it.
- No "revolutionary," "cutting-edge," "seamless," "leverage," "unlock,"
  "empower," "AI-powered," or "transform."
- Prefer the concrete number to the adjective. "23,440 units" beats "significant
  inventory."
- Short sentences carry the load-bearing claims. Long sentences are for
  qualification.
- The company says what would make it wrong. That is the tone.
- No emoji anywhere.

---

## 6. Stack and constraints

- **Astro**, TypeScript, `output: 'static'`. No React, no client framework
  unless a specific interaction genuinely requires it — and if one does, ask
  first.
- Plain CSS with custom properties in a single `tokens.css`. No Tailwind, no
  CSS-in-JS.
- **No backend, no database, no cloud project, no API routes, no serverless
  functions.** Contact is `mailto:`. This is deliberate and matches the
  SocioClimate operating model: a product with no server gets no cloud project.
- Content lives in `src/content/` as MDX so it can be edited without touching
  components.
- Deploy target: static host with a CDN — **Cloudflare Pages** preferred.
  Domain `socioclimate.io` is owned and on **Squarespace DNS**; produce a
  `DEPLOY.md` listing the exact DNS records to add. Do not attempt to change DNS.
- Repo conventions: kebab-case folders, matching the existing
  `C:\Users\Matth\dev\socioclimate\products\` layout. This folder is
  self-sufficient and reaches sideways into no other product.
- **Do not run git commands.** Git against this mounted filesystem leaves lock
  files. Stage nothing, commit nothing — tell me what to commit and I will run it.

### Performance and quality budget

- Lighthouse ≥ 95 on all four categories, mobile profile.
- No layout shift. Total JS under 20KB gzipped. Total page weight under 400KB
  including fonts.
- Semantic HTML, one `<h1>` per page, real landmarks.
- Per-page `<title>`, meta description, canonical, Open Graph image. Generate
  the OG image as a static asset from the stacked lockup on `--ink-black`.
- `sitemap.xml`, `robots.txt`, and a `<script type="application/ld+json">`
  Organization block on `/`.

---

## 7. How to work

1. Read `brand/logo-horizontal.jpeg` and `brand/logo-stacked.jpeg`.
2. Propose the file tree and the six routes with a one-line description each.
   **Stop and wait for approval.**
3. Build `tokens.css`, the layout shell, the `<Cite>` component, and the two
   chart components first. Show me `/` before building the other five routes.
4. Build the remaining routes.
5. Verify, and print the results — do not just assert them:
   - `npm run build` clean, zero warnings.
   - Lighthouse run against the built output, scores printed.
   - A contrast check over every token pair used, printed as a table.
   - A link check: every internal link resolves, every external link is a real
     URL, every citation has a source and a date.
   - Screenshots of `/` and `/thesis` at 390px and 1440px.
6. Write `DEPLOY.md` (Cloudflare Pages steps + Squarespace DNS records) and a
   `README.md` describing how to edit content without touching components.

### Two things to flag rather than guess

- Anywhere the copy needs a number, a name, or a term I have not given you,
  write `[MATTHEW TO FILL: what's needed]` in the content file and list every
  instance at the end of your run. Do not invent.
- The stacked logo is a JPEG on black. Ask before you trace it to SVG — the
  clean vector may already exist.
