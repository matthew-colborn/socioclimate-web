import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/**
 * One collection carries both registers. Frontmatter is the cinematic hero
 * copy; the MDX body is the precise portfolio copy. Same file, so the two never
 * drift apart, and the difference in voice stays deliberate.
 */
/**
 * The proof. Four entries, each answering the same three questions: what the
 * business was, what data leverage was found in it, and what that produced.
 *
 * The entries carry one register, not two: the precise one. The scene stays
 * per-entry, because each is a transformation of the same traced flame contour
 * and belongs to the entry it introduces.
 */
const portfolio = defineCollection({
  loader: glob({ base: './src/content/portfolio', pattern: '**/*.mdx' }),
  schema: z.object({
    order: z.number(),
    /** Public name. For a client who has not agreed, the anonymised label. */
    name: z.string(),
    /** Resolves through src/config/site.ts CLIENTS when the real name is gated. */
    clientKey: z.enum(['none', 'branshe']).default('none'),
    scene: z.enum(['flame', 'ridge', 'traces', 'converge', 'lattice', 'opening']),
    /** Honest rather than flattering: Building, In staging, Live, Operating. */
    stage: z.string(),
    /** One line under the name. What the entry is about. */
    headline: z.string(),
    /** What business it was. */
    business: z.string(),
    /** What data leverage was found in it. */
    leverage: z.string(),
    /** What it produced. */
    produced: z.string(),
    readouts: z
      .array(
        z.object({
          label: z.string(),
          value: z.string(),
          note: z.string().optional(),
          /** True until a real figure replaces it. Renders unmistakably unfilled. */
          pending: z.boolean().default(false),
        })
      )
      .max(4),
    href: z.string().optional(),
  }),
});

/**
 * The four moves: find, capture, understand, point at revenue. One file each
 * rather than an array in frontmatter, because each carries a body of prose and
 * the ordering has to be as explicit as the portfolio's.
 */
const process = defineCollection({
  loader: glob({ base: './src/content/process', pattern: '**/*.mdx' }),
  schema: z.object({
    order: z.number(),
    /** Rendered in mono beside the name. Zero-padded to match the nav. */
    step: z.string(),
    name: z.string(),
    /** One sentence. The move itself, stated plainly. */
    line: z.string(),
    /** What the business has at the end of this move that it did not before. */
    result: z.string(),
  }),
});

const pages = defineCollection({
  loader: glob({ base: './src/content/pages', pattern: '**/*.mdx' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    heading: z.string(),
    standfirst: z.string(),
    /** The section number, e.g. '01'. Rendered in mono above the heading. */
    section: z.string().optional(),
    /** What delivery actually includes. Home page only. */
    lines: z
      .array(z.object({ label: z.string(), note: z.string() }))
      .optional(),
    /**
     * The home hero rotation: the argument in four beats.
     *
     * Deliberately not the portfolio and not the four moves — those have their
     * own pages now, and a hero that re-tells them is just a slower way to read
     * the nav. These are the claim, the observation, the problem and the
     * consequence.
     */
    beats: z
      .array(
        z.object({
          n: z.string(),
          headline: z.string(),
          line: z.string(),
          readouts: z
            .array(z.object({ label: z.string(), value: z.string() }))
            .max(3)
            .default([]),
        })
      )
      .optional(),
  }),
});

const diagnostic = defineCollection({
  loader: glob({ base: './src/content', pattern: 'diagnostic.mdx' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    heading: z.string(),
    standfirst: z.string(),
    questions: z.array(
      z.object({
        key: z.string(),
        text: z.string(),
        help: z.string(),
      })
    ),
  }),
});

export const collections = { portfolio, process, pages, diagnostic };
