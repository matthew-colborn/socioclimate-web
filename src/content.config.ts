import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/**
 * Every word on the site lives in src/content/. Components read these files,
 * so changing copy never means opening a .astro file.
 *
 * Headings may carry one *lit* word, written in Markdown emphasis. It renders as
 * the glowing cyan glyph (brand/socioclimate-rebrand/docs/02-aesthetic.md). One
 * per heading.
 *
 * [VERIFY] and [MATTHEW] are allowed anywhere a string is. They render as
 * visible placeholders and are listed in the rebrand PR, never hidden.
 */

const item = z.object({
  n: z.string().optional(),
  /** Short label, e.g. a chip on a liquid glass card. */
  chip: z.string().optional(),
  title: z.string(),
  body: z.string().optional(),
  href: z.string().optional(),
});

const section = z.object({
  /** Stable key the page component looks the section up by. */
  key: z.string(),
  label: z.string().optional(),
  title: z.string().optional(),
  lead: z.string().optional(),
  items: z.array(item).default([]),
  /** A closing line, link text, or disclosure for the section. */
  note: z.string().optional(),
  link: z.string().optional(),
});

const pages = defineCollection({
  loader: glob({ base: './src/content/pages', pattern: '**/*.mdx' }),
  schema: z.object({
    /** The <title> and og:title, exactly as it should read. */
    title: z.string(),
    description: z.string(),
    /** "00 · SocioClimate". The number is rendered in cyan. */
    eyebrow: z.string(),
    heading: z.string(),
    lead: z.string(),
    /** Small print under the lead (the research disclosure, the honesty line). */
    aside: z.string().optional(),
    primary: z.object({ label: z.string(), href: z.string() }).optional(),
    secondary: z.object({ label: z.string(), href: z.string() }).optional(),
    sections: z.array(section).default([]),
    /** Home only: the argument rotator, kept from the live site. */
    beats: z
      .array(
        z.object({
          n: z.string(),
          headline: z.string(),
          line: z.string(),
          readouts: z.array(z.object({ label: z.string(), value: z.string() })).max(3).default([]),
        })
      )
      .optional(),
  }),
});

/** A figure is a claim, so it cannot exist without a source and a date. */
const figure = z.object({
  key: z.string(),
  value: z.string(),
  label: z.string(),
  source: z.string().min(1, 'Every figure needs a source line'),
  asOf: z.string().min(1, 'Every figure needs an as-of date'),
});

/**
 * Client work, rendered on /services. The ids are the live anchors
 * (porchlight-website, alfred-basil, branshe), so old shared links still land.
 */
const work = defineCollection({
  loader: glob({ base: './src/content/work', pattern: '**/*.mdx' }),
  schema: z.object({
    order: z.number(),
    /** Public name. For a client who has not agreed, the anonymised label. */
    name: z.string(),
    clientKey: z.enum(['none', 'branshe']).default('none'),
    scene: z.enum(['flame', 'ridge', 'traces', 'converge', 'lattice', 'threshold']),
    stage: z.enum(['live', 'staging', 'operating', 'building']),
    headline: z.string(),
    business: z.string(),
    leverage: z.string(),
    produced: z.string(),
    figures: z.array(figure).max(4).default([]),
    /** false hides the entry without deleting it. */
    public: z.boolean().default(true),
  }),
});

/**
 * The register. One file is one database: a row on /databases and, unless it is
 * still `open`, a page at /databases/<id>. Adding a file is the whole change.
 */
const instances = defineCollection({
  loader: glob({ base: './src/content/instances', pattern: '**/*.mdx' }),
  schema: z.object({
    /** "SC-01". Stable forever, never reused. */
    code: z.string().regex(/^SC-\d{2}$/),
    name: z.string(),
    sector: z.string(),
    geography: z.string(),
    coordinates: z.string().optional(),
    status: z.enum(['live', 'building', 'staging', 'private', 'open']),
    visibility: z.enum(['public', 'private']),
    /** ISO date the facts on the page were last checked. Drives the stale rule. */
    asOf: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    tagline: z.string().optional(),
    scene: z.enum(['flame', 'ridge', 'traces', 'converge', 'lattice', 'threshold']).optional(),
    business: z.string().optional(),
    leverage: z.string().optional(),
    produced: z.string().optional(),
    gap: z.string(),
    record: z.string(),
    sources: z.string(),
    use: z.string(),
    credential: z.string().optional(),
    /** Rendered only while status is live. */
    url: z.string().url().optional(),
    figures: z.array(figure).default([]),
    coverage: z.array(z.object({ name: z.string(), status: z.string(), source: z.string().optional() })).default([]),
    /** Flags for Matthew. Never rendered. */
    notes: z.array(z.string()).default([]),
  }),
});

const research = defineCollection({
  loader: glob({ base: './src/content/research', pattern: '**/*.mdx' }),
  schema: z.object({
    code: z.string().regex(/^RS-\d{2}$/),
    title: z.string(),
    kind: z.enum(['working-paper', 'operating-paper', 'note', 'log']),
    status: z.enum(['draft', 'working', 'published', 'opening']),
    date: z.string().optional(),
    version: z.string().optional(),
    abstract: z.string().optional(),
    /** false: the row shows in the register as a draft and no page exists. */
    publish: z.boolean().default(false),
    notes: z.array(z.string()).default([]),
  }),
});

const diagnostic = defineCollection({
  loader: glob({ base: './src/content', pattern: 'diagnostic.mdx' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    heading: z.string(),
    standfirst: z.string(),
    questions: z.array(z.object({ key: z.string(), text: z.string(), help: z.string() })),
  }),
});

export const collections = { pages, work, instances, research, diagnostic };
