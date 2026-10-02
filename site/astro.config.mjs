// @ts-check
import { defineConfig } from 'astro/config';

// URL contract (brief L2): apex host, trailing slash, one directory per page.
export default defineConfig({
  site: 'https://liar-entertainer.com',
  trailingSlash: 'always',
  build: { format: 'directory' },
  i18n: {
    locales: ['de', 'fr', 'en'],
    defaultLocale: 'de',
    routing: { prefixDefaultLocale: false },
  },
});
