import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// Every word of prose on this site lives in src/content/ as MDX. Components
// read these collections; editing copy never means opening a .astro file.

const pages = defineCollection({
  loader: glob({ base: './src/content/pages', pattern: '**/*.mdx' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    heading: z.string(),
    standfirst: z.string(),
    /** Rendered as the closing door panel. Which of the two doors this page ends
     *  on. 'none' is for /partner, whose body already is both doors. */
    door: z.enum(['partner', 'acquire', 'both', 'none']).default('both'),
    /** 'wide' drops the 68ch cap on the page body and applies it per block
     *  instead, for pages that lay content out in columns. Not called `layout`:
     *  Astro's MDX integration treats that frontmatter key as a component
     *  import and the build fails trying to resolve it. */
    width: z.enum(['measure', 'wide']).default('measure'),
  }),
});

const home = defineCollection({
  loader: glob({ base: './src/content', pattern: 'home.mdx' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    tagline: z.string(),
    subline: z.string(),
    moat: z.array(
      z.object({
        n: z.string(),
        name: z.string(),
        body: z.string(),
        icon: z.enum(['normalize', 'series', 'tedious']),
      })
    ),
  }),
});

const portfolio = defineCollection({
  loader: glob({ base: './src/content/portfolio', pattern: '**/*.mdx' }),
  schema: z.object({
    name: z.string(),
    order: z.number(),
    /** Honest stage label. Nothing here is shipped to a customer. */
    stage: z.string(),
    where: z.string(),
    summary: z.string(),
  }),
});



const doors = defineCollection({
  loader: glob({ base: './src/content/doors', pattern: '**/*.mdx' }),
  schema: z.object({
    key: z.enum(['partner', 'acquire']),
    order: z.number(),
    kicker: z.string(),
    title: z.string(),
    cta: z.string(),
  }),
});

export const collections = { pages, home, portfolio, doors };
