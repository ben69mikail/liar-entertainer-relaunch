// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// URL contract (brief L2): apex host, trailing slash, one directory per page.
// Build options mirror the legacy site so output stays comparable for parity checks.
export default defineConfig({
  site: 'https://liar-entertainer.com',
  trailingSlash: 'always',
  output: 'static',
  build: { format: 'directory', inlineStylesheets: 'always' },
  compressHTML: true,
  i18n: {
    locales: ['de', 'fr', 'en'],
    defaultLocale: 'de',
    routing: { prefixDefaultLocale: false },
  },
  vite: {
    plugins: [tailwindcss()],
    build: { cssMinify: true, minify: true, assetsInlineLimit: 20000 },
  },
});
