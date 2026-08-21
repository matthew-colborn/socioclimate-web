# Build and deploy socioclimate.io

Run this from `C:\Users\Matth\dev\socioclimate\products\socioclimate-web\`.

This prompt is self-contained. Do not go looking for a design doc, a content
doc, or a brief — everything you need is below. The only external files you
read are the two logo images named in §3.

---

## 0. Rules for this session

- **Do not run any git command.** Git against this filesystem leaves lock files
  that break the repo. Tell me what to commit; I run it.
- **Do not create or download a service account key.** The org enforces
  `constraints/iam.disableServiceAccountKeyCreation`. Authenticate with
  `gcloud auth login` / `firebase login` as `matthew@socioclimate.io`.
- **Run the read-only form first.** Before any command that changes cloud state,
  run the `list`/`describe` equivalent and show me the output.
- **Stop and confirm before:** creating a GCP project, enabling billing on one,
  the first `firebase deploy`, and any DNS record you want me to add.
- **Invent nothing.** If the copy needs a number, a name, a price, or a term
  that is not in this prompt, write `[MATTHEW TO FILL: what's needed]` in the
  content file and list every instance at the end of your run.
- Work in phases. At the end of each phase, stop and show me the result.

---

## 1. What you are building

The public website for **SocioClimate** — a holding company that creates and
monetizes data moats. It is a marketing site: static, no backend, no database,
no API routes, no forms. Contact is `mailto:`.

**Positioning line: "The data moat company."**

SocioClimate finds markets where the facts that determine value are not
published anywhere, assembles the record, and owns it. It does this three ways:
it **builds** the data asset itself, it **partners** with an operator who
already generates the raw material, or it **acquires** the company that does.

A stranger should understand that sentence in thirty seconds and know which of
two doors is theirs: **partner with us**, or **sell us your company**.

### The thesis the company is built on

Automation diffuses in proportion to the **observability** of an asset — the
frequency, publicity, and standardization of its price record — and is largely
indifferent to available computing power. Where a dense public price record
exists, decisions get ceded to models. Where it does not, valuation stays with a
human whose incentives are set by whoever pays for the number.

The consequence, and the company's whole reason for existing: **the returns
accrue at the observation layer, not the computation layer.** Compute is a
commodity with no defensible position in it. Observation is a network good with
increasing returns. The competitive fight in these markets is over who is
permitted to see, not who is permitted to compute.

### What a data moat is — the three properties (use as a named framework)

1. **Accumulated normalization.** Thirty jurisdictions, thirty schemas, one
   output. The thirty-first is nearly free; a new entrant has to redo all
   thirty. Cost is linear for them and asymptotically zero for us.
2. **A time series that cannot be back-bought.** History is the only component
   unreconstructable at any price once the window has passed. Start the clock
   early. Never sell the history.
3. **Work that is tedious rather than hard.** No single scraping target, no one
   large engineering problem — thirty small interpretation problems. That is the
   shape large vendors are structurally worst at and a small operator is best at.

### The disclosure posture (a differentiator — put it on the site)

- **Publish the rulebook in full**, with quotes and sources. It derives from
  public documents, so withholding it captures almost no value and publishing it
  makes SocioClimate the reference point. It opens a correction loop: thirty
  published jurisdictions is thirty free proofreaders.
- **Publish existence, sell depth.** Whether a parcel carries a restriction is
  the public good. The terms, the expiration date, the portfolio view are the
  product.
- **Never publish the time series.** Publish *findings* derived from it. Nobody
  becomes a reference by holding a file.

### The portfolio (only these two — no others exist)

**Deed-Restricted DB — San Diego. Stage: building.**
Deed-restricted affordable for-sale housing is an unobserved asset class inside
the most instrumented housing market in the world. Price is set administratively
by a housing agency and the pricing rule is unpublished. Across the first six
San Diego listings observed, list price equals original price on every one —
including units that sat 317 and 298 days. Zero price reductions, because price
is a formula output rather than an offer. The City of San Diego held 23,440
deed-restricted units as of May 2020, roughly 14% of its multifamily rental
stock, with roughly 4,200 covenants expiring between 2020 and 2040 — figures
that exist only because the City commissioned a consultant study. The agency
administering the stock could not answer the question from standing systems.
That is the market, stated precisely.

Three layers, built in reverse order of glamour: **the rulebook** (program
guidelines normalized to machine-readable form), **the covenant index**
(recorded documents, APN-keyed, durable 45–55 years), **the events** (listings,
sales, days on market — worthless without the first two).

**PorchLight OS — operating software for a residential brokerage. Stage: in
staging.** One short paragraph. Do not oversell it.

**No customers, logos, testimonials, team bios, funding, revenue, or case
studies exist. Do not create any.**

---

## 2. Pages

Six routes. Every page except `/thesis` stays under ~900 words. Every page ends
pointing at one of the two doors — there is no generic "Contact us."

### `/` — homepage, in this order

1. **Hero.** Wordmark. One line: *The data moat company.* One subline: *We find
   markets whose prices nobody publishes, assemble the record, and own it.* Two
   buttons of equal weight: **Partner with us** · **Sell us your company**.
2. **The claim.** Three or four short paragraphs: compute is a commodity,
   observation is a network good, the rent has moved to the observation layer.
3. **The proof.** The chart below, full-bleed, citation underneath. This is the
   single most important object on the site — build it to be screenshotted.
4. **What a data moat is.** The three properties as three cards, with icons
   derived from the circuit motif in the logo. Not stock iconography.
5. **Where we're doing it.** Two portfolio cards with honest stage labels.
6. **Two doors.** Full-width split panel. Left: partner. Right: acquire.

**The proof chart.** A two-bar comparison:

> Zillow's Zestimate had a median error of **1.8%** on homes listed for sale and
> **7.2%** on off-market homes in 2025 — the same model, the same housing stock,
> the same day. The only difference is whether a price was published.
> *Source: Zillow Group FY2025 Form 10-K, filed 2026-02-11.*

Optionally add Redfin's independently built model at 1.85% and 7.27% on the same
two populations — two competing firms converging on the same error floor, which
suggests the floor is a property of the available observations rather than of
either model.

### `/thesis` — 1,500–2,500 words

Open with this, close to verbatim:

> Fannie Mae's Desktop Underwriter reached production in June 1995 and rendered
> a credit decision in under fifteen seconds. In the same country, in 2026, an
> institutional office building is valued by a human appraiser, on an annual
> external rotation, engaged and paid by the party whose fee is a function of
> the resulting number. The technology was ready for the harder problem long
> before it was applied to the easier one.

Must include, each with an inline source and as-of date:

- **Residential is automated because it is observed.** 62% of conventional
  closed loans market-wide reviewed by Desktop Underwriter, 2018–2024 (Fannie
  Mae, on HMDA data). 28% of GSE acquisitions carried an appraisal waiver in
  March 2026, split 25% Fannie / 32% Freddie (AEI Housing Center); the waiver
  share peaked near 49% in March 2021. Six federal agencies finalized AVM
  quality-control standards effective October 1, 2025 — regulators do not write
  model-governance rules for tools that are not making decisions. Appraiser
  credentials fell from 120,551 in 2008 to 95,731 in 2017 (Appraisal
  Subcommittee registry, via CSBS).
- **Institutional is not, because its price record is produced by interested
  parties on an annual rotation.** Common practice is a third-party appraisal of
  ~25% of a fund's investments each quarter. Surveying ten non-traded NAV REITs,
  DLA Piper (2023) found the adviser performs the NAV calculation for three of
  them, with the independent valuation advisor performing a reasonableness
  review rather than a determination. FINRA Rule 2310 requires an annual
  valuation with third-party "material assistance or confirmation" and expressly
  declines to prescribe a methodology.
- **The lag, and its asymmetry.** Green Street's CPPI peaked March 2022; the
  NCREIF NPI market value index peaked Q2 2022, one quarter later. At the bottom
  the gap was three quarters: Green Street was down 22% from peak by November
  2023 and calling a bottom; NCREIF did not stop falling until Q3 2024, after
  nine consecutive declining quarters. Appraisers were a quarter behind the top
  and three quarters behind the bottom.
- **Still open, four years on.** In Q1 2026 the NPI reported a 4.57% appraisal
  cap rate against 5.27% on properties actually sold out of the index — seventy
  basis points of residual appraisal optimism, measured by the index
  administrator itself.
- **Practitioners say it is data, not compute.** Deloitte's 2026 Commercial Real
  Estate Outlook: of more than 850 senior executives, **1%** reported
  transformative impact from AI. Mercer, fielding 131 asset managers in February
  2026: 55% have integrated AI into at least one investment process, only 5–6%
  have granted it autonomous or semi-autonomous decision authority, and 69% name
  data quality or access as the binding barrier — ahead of regulation, cost, and
  talent. Nobody is citing compute.

**End with a section titled "What would make this wrong."** Give it the same
visual weight as the argument it qualifies — it is the credibility of the entire
site, not a hedge. Include:

- **Observability without standardization fails.** For July 2026, Trepp reported
  an overall CMBS delinquency rate of 7.86% with office around 11%, while Fitch
  reported 3.49% overall and 8.89% for office — a more than twofold gap in the
  headline number for the same month, from different rated universes and
  different delinquency definitions.
- **Mandated transparency can reduce activity.** Asquith, Covert and Pathak
  (2019) find that after TRACE, costs fell across all bond types but trading
  activity did not rise — trades fell 11.7% overall and 71.1% in the
  last-disseminated, least-liquid tranche, as dealers withdrew from
  intermediating the least observable paper.
- **Automation may consume information rather than produce it.** Weller (2018)
  finds the information content of prices decreases 9–13% per standard deviation
  of algorithmic trading activity.
- **The alternative explanation most likely to be right if we are wrong.**
  Transaction size. A $200 million building can support human underwriting in a
  way a $400,000 house cannot, so automation may simply arrive wherever
  per-transaction human cost exceeds the cost of building a model. The evidence
  against it is the Zestimate split, which holds transaction size fixed entirely
  and varies only observation.

State the claim in its defensible form: **observability is necessary, not
sufficient.**

Build a small `<Cite>` component for inline sources and use it for every
statistic on the site.

### `/method`

How a moat gets built. The three layers, the three properties, the disclosure
posture, and what makes a market a candidate: a recurring stream of records
nobody else sees; governing rules that are public but scattered across
jurisdictions; a segment too small for a national vendor to bother with; an
administrative rather than market-set price.

### `/portfolio`

The two entries from §1, with honest stage labels.

### `/partner`

Two columns.

**Partner with us** — for operators who already generate the raw material.
What we bring: schema design, normalization, productization, the buyers.
What we look for: the four candidate criteria from `/method`.

**Sell us your company** — for owners of data or services businesses. Say
plainly what SocioClimate is: a small operator, not a fund. No blind pool, no
auction process, no 48-hour-LOI theatre. Leave size range and deal structure as
`[MATTHEW TO FILL]` — do not invent terms.

Contact: `mailto:` only.

### `/writing`

Index of the papers, with a short abstract each and a PDF download slot. Mark
the PDF hrefs `[MATTHEW TO FILL: PDF]` — the files are not in this repo yet.

---

## 3. Design

**Read both logo files before styling anything:**

- `C:\Users\Matth\OneDrive\Pictures\SocioClimate\IMG_5040.jpeg` — horizontal
  lockup on deep navy. Cyan flame rising out of a data histogram shaped like a
  mountain range. "Socio" in white, "Climate" in cyan.
- `C:\Users\Matth\OneDrive\Pictures\SocioClimate\IMG_5041.jpeg` — stacked lockup
  on black. The flame is drawn from circuit traces with node dots at the
  junctions.

Copy both into `brand/` in this repo.

Those two motifs — **circuit trace** and **data ridge** — are the entire visual
vocabulary. Everything decorative on the site derives from one of them.

### Tokens — sampled from the logo files. Use these exact values.

```css
--ink          #020A21;  /* page background; the horizontal lockup's navy */
--ink-deep     #000615;  /* sections that need to recede */
--ink-black    #000000;  /* the stacked lockup's field; full-bleed moments only */
--cyan         #00D8E7;  /* primary: links, the mark, key data marks */
--cyan-bright  #2AE2EA;  /* hover, active, focus ring */
--cyan-glow    #99FFFF;  /* glow layers and the brightest stop of a gradient only */
--teal-deep    #006184;  /* secondary data series, borders, muted rules */
--teal-shadow  #00506B;  /* chart gridlines, dividers */
--paper        #FFFFFF;  /* primary text on ink */
--paper-dim    #A8B6C8;  /* secondary text */
```

**Dark is the default and only theme.** The brand does not exist on white. Do
not build a light mode.

**Type.** The wordmark is a geometric sans with a single-storey `a` and a wide
circular `C`. Use **Poppins** or **Outfit** for display and **Inter** for body.
Self-host both as woff2 in `public/fonts` — no Google Fonts network request. The
white/cyan split on "Socio·Climate" may carry into headlines at most once per
page.

### Rules

- **Cyan is data, not decoration.** It marks the flame, links, and the single
  most important value in any chart. More than three cyan elements above the
  fold means cut one.
- **Glow is earned.** The mark glows. One hero element may glow. Nothing else.
  No neon card borders, no glowing buttons.
- **No stock photography. No gradient mesh backgrounds. No 3D renders. No AI
  illustration.** Visual interest comes from data marks and the circuit motif.
- **Charts are first-class.** Inline SVG components — not images, not a charting
  library. Legible at 360px wide. `role="img"` with an `aria-label` stating the
  actual values.
- Body text capped at 68ch. Generous whitespace.
- Motion: at most one scroll reveal per section, 200–300ms, and it must respect
  `prefers-reduced-motion`. Circuit traces may pulse slowly in the hero and
  nowhere else.
- Visible focus ring in `--cyan-bright` on every interactive element.
- Verify every text/background pair against WCAG AA **programmatically** and
  print the table. `--paper-dim` on `--ink` is the pair most likely to fail — fix
  the token, not the usage.

### Voice

Declarative, specific, sourced, unembarrassed about stating what is uncertain.
Claims carry evidence and an as-of date; if you cannot source it, cut it. Prefer
the concrete number to the adjective — "23,440 units" beats "significant
inventory." Short sentences carry the load-bearing claims; long sentences are
for qualification. The company says what would make it wrong. No emoji.

**Banned words:** revolutionary, cutting-edge, seamless, leverage, unlock,
empower, AI-powered, transform, solutions, ecosystem, journey.

---

## 4. Stack

- **Astro**, TypeScript, `output: 'static'`.
- No React and no client framework unless a specific interaction genuinely
  requires one — if you think one does, ask before adding it.
- Plain CSS with custom properties in a single `src/styles/tokens.css`. No
  Tailwind, no CSS-in-JS.
- Content in `src/content/` as MDX so it can be edited without touching
  components.
- Budget: Lighthouse ≥ 95 on all four categories, mobile profile. Total JS under
  20KB gzipped. Total page weight under 400KB including fonts. No layout shift.
- Semantic HTML, one `<h1>` per page, real landmarks. Per-page title, meta
  description, canonical, Open Graph image. `sitemap.xml`, `robots.txt`, and a
  JSON-LD `Organization` block on `/`. Generate the OG image as a static asset
  from the stacked lockup on `--ink-black`.

---

## 5. Deploy — Firebase Hosting on the SocioClimate org

### Why Firebase Hosting and not a load balancer

A global external Application Load Balancer bills a **fixed $18.25/month at zero
traffic** (first five forwarding rules at $0.025/hour). Firebase Hosting is
**$0** for this site's traffic — 10 GB storage and 360 MB/day transfer free,
custom domain and managed SSL included, global CDN, and it is part of GCP under
the same org, billing account, and IAM. Beyond the free tier it is $0.026/GB
stored and $0.15/GB transferred.

This deviates from `CONVENTIONS.md`, which specifies apex-via-load-balancer for
production. That rule was written for **Cloud Run services**. This product has
no server, so there is nothing for a load balancer to front, and paying $219/year
for a fixed forwarding rule in front of static files is money lit on fire — the
same reasoning the conventions already apply to not running a second LB for
staging. Note the deviation in the repo README so it is a recorded decision
rather than a drift.

### Org facts — read these from `..\..\infra\env.sh`, do not hardcode

The real umbrella is the **domain-backed** org, not the legacy standalone one:

```
ORG_ID          916826271555        socioclimate.io — THE umbrella
BILLING_ACCOUNT 010BD1-82FA8F-840D7C
REGION          us-west1
ADMIN_USER      matthew@socioclimate.io
```

`445756509297` (`matthewcolborn5-org`) is **legacy scratch space**. Nothing new
goes there. If any doc you find says the standalone org is the umbrella, it is
out of date — `env.sh` as of 2026-08-18 is authoritative.

### Phase D1 — verify before creating anything

```bash
gcloud auth list
gcloud organizations list
gcloud resource-manager folders list --organization=916826271555
gcloud projects list --filter='parent.id=916826271555'
gcloud billing accounts list
gcloud resource-manager org-policies describe \
  constraints/gcp.resourceLocations --organization=916826271555
```

Show me all of it. The location policy currently allows `in:us-west1-locations`
and `in:us-locations`. Firebase Hosting is a global CDN service — **if project
creation or Hosting enablement fails on `gcp.resourceLocations`, stop and show
me the exact error.** Do not widen an org policy on your own.

### Phase D2 — folder and projects

Per `CONVENTIONS.md`: one folder per product, two projects, `-prod` and
`-staging` suffixes, separate projects for separate environments.

Create a folder named **`SocioClimate Web`** directly under org `916826271555`.
Note that the folder whose ID is `FOLDER_PORCHLIGHT` already has the display
name "SocioClimate" — do not put this product there.

Then create both projects inside it:

```
socioclimate-web-prod
socioclimate-web-staging
```

Project IDs are globally unique and permanent. If either is taken, **stop and
ask me** — do not silently append a suffix. Link both to billing account
`010BD1-82FA8F-840D7C` and add the new IDs to `..\..\infra\env.sh` as
`FOLDER_WEB`, `PROJ_WEB_PROD`, `PROJ_WEB_STAGING`, matching the file's existing
comment style.

Set a budget alert on the new folder at a low threshold — this should cost
nothing and I want to hear about it immediately if it doesn't.

### Phase D3 — Firebase Hosting

Add Firebase to both projects and initialize Hosting with `public: dist` and no
rewrites (this is a static multi-page site, not an SPA — do **not** add the
`/** → /index.html` rewrite, it will break 404s). Write a `firebase.json` with
long cache headers on hashed assets and a short one on HTML, plus
`X-Content-Type-Options`, `Referrer-Policy`, and a Content-Security-Policy tight
enough to reflect that there is no third-party script on this site.

Use `.firebaserc` aliases: `staging` → `socioclimate-web-staging`, `prod` →
`socioclimate-web-prod`.

**Staging first, always.** Build, deploy to staging, give me the URL, and wait
for me to look at it before you touch prod.

### Phase D4 — domains

`socioclimate.io` is owned, DNS is at **Squarespace**, and the domain is
enrolled in Cloud Identity for the org.

- Production: `socioclimate.io` and `www.socioclimate.io` on
  `socioclimate-web-prod`.
- Staging: `staging.socioclimate.io` on `socioclimate-web-staging`.

**Do not attempt to change DNS yourself.** Produce a table of the exact records
to add — host, type, value, TTL — and I will add them at Squarespace.

**Do not touch, propose changing, or "clean up" the MX, SPF, DKIM, or DMARC
records on this domain.** Mail is live and breaking it is not recoverable in an
afternoon. Your records are A/AAAA/CNAME/TXT-for-verification only, and say so
explicitly in the table.

Note that `socioclimate.io` is the **identity domain** — normally reserved, per
`CONVENTIONS.md`, and never given to a product. This is the exception the rule
anticipates: this site is the company itself, not a product. Say so in the
README.

---

## 6. Verify — print results, do not assert them

1. `npm run build` clean, zero warnings.
2. Lighthouse against the built output; print all four scores for mobile.
3. Contrast check over every token pair used, as a printed table.
4. Link check: every internal link resolves, every external link is a real URL,
   every citation has a source and a date.
5. Screenshots of `/` and `/thesis` at 390px and 1440px.
6. `curl -I` against the staging URL showing the security and cache headers
   actually landed.

Then write:

- `README.md` — how to edit content without touching components, plus the two
  recorded deviations (Firebase Hosting instead of a load balancer; identity
  domain used for the company site).
- `DEPLOY.md` — the Squarespace DNS table, the deploy commands, and the rollback
  command (`firebase hosting:rollback`).

Finish by listing every `[MATTHEW TO FILL]` you left, and every command you want
me to run that you did not.
