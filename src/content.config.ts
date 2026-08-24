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
    /**
     * 'statement' opens the rotation and 'invitation' closes it; only 'work'
     * entries appear on /portfolio. One collection so the hero order and the
     * portfolio order cannot drift apart.
     */
    kind: z.enum(['statement', 'work', 'invitation']).default('work'),
    /** Public name. For a client who has not agreed, the anonymised label. */
    name: z.string(),
    /** Resolves through src/config/site.ts CLIENTS when the real name is gated. */
    clientKey: z.enum(['none', 'branshe']).default('none'),
    scene: z.enum(['flame', 'ridge', 'traces', 'converge', 'lattice', 'opening']),
    stage: z.string(),
    /** Hero, bottom-left. Short, evocative, no citations. */
    headline: z.string(),
    /** Hero, bottom-right. Two lines at most. */
    line: z.string(),
    /** Portfolio page, precise register. Work entries only. */
    what: z.string().optional(),
    who: z.string().optional(),
    built: z.string().optional(),
    /**
     * The single call to action. An href of '#scene-N' is intercepted by the
     * carousel and advances the rotation instead of navigating.
     */
    ctaLabel: z.string().default('See the work'),
    ctaHref: z.string().default('/portfolio'),
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
