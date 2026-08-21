# Deploying socioclimate.io

Firebase Hosting, two projects, one folder, inside the domain-backed
organisation `916826271555`. The reasoning for using Hosting rather than a load
balancer is in `README.md`.

Org facts come from `../../infra/env.sh` and are never hardcoded in a script
here.

| | Project | Serves |
|---|---|---|
| Staging | `socioclimate-web-staging` | `staging.socioclimate.io` |
| Production | `socioclimate-web-prod` | `socioclimate.io` and `www.socioclimate.io` |

`.firebaserc` already carries the aliases `staging` and `prod`.

---

## 0. Authentication — do this first

Both CLIs are currently signed in as the wrong identity, and the
`matthew@socioclimate.io` gcloud credentials have expired. Nothing in Phase D
works until these two run. Both are interactive and open a browser.

```bash
gcloud auth login matthew@socioclimate.io
```

```bash
firebase login --reauth
```

Sign in as `matthew@socioclimate.io` in both. Then confirm:

```bash
gcloud organizations list --account=matthew@socioclimate.io
```

That must list `socioclimate.io  916826271555`. If it only lists
`matthewcolborn5-org`, the wrong identity is active — see the note at the top of
`../../infra/env.sh` about how the domain-backed org gets provisioned.

**Do not create a service account key.** The organisation enforces
`constraints/iam.disableServiceAccountKeyCreation`, and the ban is in
`CONVENTIONS.md` for reasons that have not changed.

---

## D1 — Read-only verification, before anything is created

```bash
gcloud auth list
gcloud organizations list
gcloud resource-manager folders list --organization=916826271555
gcloud projects list --filter='parent.id=916826271555'
gcloud billing accounts list
gcloud resource-manager org-policies describe constraints/gcp.resourceLocations --organization=916826271555
```

The location policy currently allows `in:us-west1-locations` and
`in:us-locations`. Firebase Hosting is a global CDN service. If project creation
or Hosting enablement fails on `gcp.resourceLocations`, **stop** — do not widen
an org policy to get past it.

---

## D2 — Folder and projects

The folder whose ID is `1087655986495` already has the display name
"SocioClimate" and holds the OS projects. **This product does not go there.**

```bash
gcloud resource-manager folders create \
  --display-name="SocioClimate Web" \
  --organization=916826271555
```

Note the folder ID it returns, then:

```bash
gcloud projects create socioclimate-web-staging --folder=<FOLDER_ID>
gcloud projects create socioclimate-web-prod    --folder=<FOLDER_ID>
```

Project IDs are globally unique and permanent. **If either name is taken, stop
and ask** — do not append a suffix to get past it.

```bash
gcloud billing projects link socioclimate-web-staging --billing-account=010BD1-82FA8F-840D7C
gcloud billing projects link socioclimate-web-prod    --billing-account=010BD1-82FA8F-840D7C
```

Then add the IDs to `../../infra/env.sh`, matching the comment style already in
that file:

```bash
export FOLDER_WEB="<FOLDER_ID>"              # SocioClimate Web
export PROJ_WEB_PROD="socioclimate-web-prod"
export PROJ_WEB_STAGING="socioclimate-web-staging"
```

### Budget alert on the folder

This should cost nothing, so the alert threshold is set low enough that any
spend at all is audible.

```bash
gcloud billing budgets create \
  --billing-account=010BD1-82FA8F-840D7C \
  --display-name="SocioClimate Web" \
  --filter-projects="projects/socioclimate-web-prod,projects/socioclimate-web-staging" \
  --budget-amount=5USD \
  --threshold-rule=percent=0.2 \
  --threshold-rule=percent=0.5 \
  --threshold-rule=percent=1.0
```

Budget notifications go to the billing account's Essential Contacts. The
identity domain has no mailbox — confirm contacts point at the Microsoft 365
address before relying on this.

---

## D3 — Firebase Hosting

```bash
firebase projects:addfirebase socioclimate-web-staging
firebase projects:addfirebase socioclimate-web-prod
```

`firebase.json` and `.firebaserc` are already written. **Do not run
`firebase init hosting`** — it will offer to overwrite both, and it will offer to
add the `/** → /index.html` rewrite. This is a static multi-page site. That
rewrite would turn every 404 into a soft 200 serving the homepage.

The config sets `public: dist`, `cleanUrls: true`, `trailingSlash: false`, no
rewrites, long immutable caching on `/_astro/**` and `/fonts/**`, a short
revalidating cache on HTML, and a Content-Security-Policy that allows exactly
two inline script blocks by hash and nothing third-party at all.

### Staging first, always

```bash
npm run deploy:staging
```

Look at the result before going anywhere near production.

```bash
npm run deploy:prod
```

### After the first staging deploy — verify the headers actually landed

The Firebase Hosting **emulator does not apply the `headers` block**, so this
cannot be checked locally. It has to be checked against the deployed URL.

```bash
curl -sI https://socioclimate-web-staging.web.app/ | tr -d '\r'
```

Expect on an HTML response:

- `content-security-policy: default-src 'none'; …` with both `sha256-` hashes
- `x-content-type-options: nosniff`
- `referrer-policy: strict-origin-when-cross-origin`
- `strict-transport-security: max-age=31536000`
- `cache-control: public, max-age=0, must-revalidate`

And on a hashed asset:

```bash
curl -sI https://socioclimate-web-staging.web.app/fonts/inter-var-latin.woff2 | tr -d '\r'
```

Expect `cache-control: public, max-age=31536000, immutable`.

If a page renders unstyled or the scroll reveal never fires, read the browser
console: that is the CSP rejecting something, and `npm run csp` will say which
hash drifted.

### A note on cache headers and the `**` rule

`firebase.json` puts the security headers and the default HTML cache policy on
`source: "**"`, then overrides `Cache-Control` for `/_astro/**`, `/fonts/**`,
`/og/**` and the three root files. This relies on later matching entries winning
on a conflicting header key. The `curl` checks above are what confirms it, which
is why they are not optional.

`/fonts/**` and `/video/**` are marked `immutable` even though the filenames
are not content-hashed. **If a font or a video file is ever replaced, rename
it** — otherwise returning visitors keep the old one for a year.

The policy includes `media-src 'self'` for the two brand clips on the homepage.
If a video ever fails to play in production and the console shows a CSP
violation, that directive is the first thing to check.

---

## D4 — Domains

`socioclimate.io` is owned, DNS is at Squarespace, and the domain is enrolled in
Cloud Identity for the organisation.

Add each domain in the Firebase console under Hosting → Add custom domain, for
the project shown below. Firebase issues the exact record values in that flow —
they are per-project and are not guessable, which is why the value column below
is a placeholder rather than an invented address.

```
socioclimate-web-prod      socioclimate.io
socioclimate-web-prod      www.socioclimate.io
socioclimate-web-staging   staging.socioclimate.io
```

### Records to add at Squarespace

**These are the only records to touch.** A, AAAA, CNAME and the TXT record
Firebase issues for domain verification — nothing else.

| Host | Type | Value | TTL | Purpose |
|---|---|---|---|---|
| `@` | TXT | `[MATTHEW TO FILL: verification string issued by the Firebase console]` | 3600 | Proves ownership of the apex. Delete once verification completes. |
| `@` | A | `[MATTHEW TO FILL: apex IP(s) issued by Firebase — usually two]` | 3600 | Apex → Firebase Hosting, `socioclimate-web-prod` |
| `www` | A | `[MATTHEW TO FILL: IP(s) issued by Firebase for www]` | 3600 | `www.socioclimate.io` → `socioclimate-web-prod` |
| `staging` | A | `[MATTHEW TO FILL: IP(s) issued by Firebase for staging]` | 3600 | `staging.socioclimate.io` → `socioclimate-web-staging` |

If the Firebase flow offers a CNAME instead of A records for `www` or
`staging`, take the CNAME — a subdomain CNAME is the better record and both work.
An apex cannot be a CNAME, so the apex is always A records.

### Do not touch

**MX, SPF, DKIM, DMARC.** Mail on this domain is live on Microsoft 365 and
breaking it is not recoverable in an afternoon. No record in this deployment
needs to modify, reorder, or "tidy up" any of them. If a tool offers to replace
the existing records wholesale, decline and add records individually.

The identity domain being used for this site is a deliberate exception to
`CONVENTIONS.md`; the reasoning is recorded in `README.md`.

### After DNS propagates

```bash
curl -sI https://socioclimate.io/          | tr -d '\r' | head -1
curl -sI https://www.socioclimate.io/      | tr -d '\r' | head -1
curl -sI https://staging.socioclimate.io/  | tr -d '\r' | head -1
curl -sI https://socioclimate.io/thesis    | tr -d '\r' | head -1   # 200, not 301
curl -sI https://socioclimate.io/thesis/   | tr -d '\r' | head -2   # 301 -> /thesis
curl -sI https://socioclimate.io/nope      | tr -d '\r' | head -1   # 404, not 200
```

That last one is the check that no SPA rewrite crept into `firebase.json`.

---

## Rollback

```bash
firebase hosting:rollback -P prod
```

Same for `-P staging`. It restores the previous release immediately; there is
nothing to rebuild and no cache to purge, because HTML is served with
`max-age=0, must-revalidate`.

To see what is deployed:

```bash
firebase hosting:versions:list -P prod
```

---

## Everyday deploys

```bash
npm run verify           # build, contrast, links, CSP hashes
npm run deploy:staging
# look at it
npm run deploy:prod
```

`npm run verify` runs the build, so `deploy:*` rebuilding is redundant but
harmless — it guarantees `dist/` matches the working tree at the moment of
deploy.
