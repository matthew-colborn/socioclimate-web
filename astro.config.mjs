import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

// Static only. There is no server behind this site and there is not going to be
// one — see README.md, "Two recorded deviations".
export default defineConfig({
  site: 'https://socioclimate.io',
  output: 'static',
  trailingSlash: 'never',
  integrations: [
    mdx(),
    sitemap({
      // Firebase Hosting is configured with trailingSlash:false, so the sitemap
      // must advertise the URL that actually answers 200 rather than the one
      // that answers 301.
      serialize: (item) => ({ ...item, url: item.url.replace(/(.)\/$/, '$1') }),
    }),
  ],
  build: { inlineStylesheets: 'never' },
  compressHTML: true,
});
