import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/**
 * One collection carries both registers. Frontmatter is the cinematic hero
 * copy; the MDX body is the precise portfolio copy. Same file, so the two never
 * drift apart, and the difference in voice stays deliberate.
 */
const portfolio = defineCollection({
  loader: glob({ base: './src/content/portfolio', pattern: '**/*.mdx' }),
  schema: z.object({
    order: z.number(),
    /** Public name. For a client who has not agreed, the anonymised label. */
    name: z.string(),
    /** Resolves through src/config/site.ts CLIENTS when the real name is gated. */
    clientKey: z.enum(['none', 'branshe']).default('none'),
    scene: z.enum(['ridge', 'traces', 'converge', 'lattice']),
    stage: z.string(),
    /** Hero, bottom-left. Short, evocative, no citations. */
    headline: z.string(),
    /** Hero, bottom-right. Two lines at most. */
    line: z.string(),
    /** Portfolio page, precise register. */
    what: z.string(),
    who: z.string(),
    built: z.string(),
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

const pages = defineCollection({
  loader: glob({ base: './src/content/pages', pattern: '**/*.mdx' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    heading: z.string(),
    standfirst: z.string(),
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

export const collections = { portfolio, pages, diagnostic };
