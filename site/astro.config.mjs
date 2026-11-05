// @ts-check
import { readFileSync } from 'node:fs';
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import { rehypeBlogMedia } from './src/lib/rehype-blog-media.mjs';
import { makeResolver } from './src/lib/blog-media-resolver.mjs';

// Blog Markdown images point at raw /public JPEGs that Astro does not optimise. The prebuild step
// (scripts/generate-blog-media.mjs) writes webp/avif siblings + this manifest; the rehype plugin
// uses it to add dimensions, lazy loading and a <picture> with modern sources. Missing manifest
// (e.g. `astro dev` without prebuild) → empty → the plugin safely no-ops.
let blogMediaManifest = {};
try {
  blogMediaManifest = JSON.parse(readFileSync('./src/lib/blog-media-manifest.json', 'utf8'));
} catch {}

// URL contract (brief L2): apex host, trailing slash, one directory per page.
// Build options mirror the legacy site so output stays comparable for parity checks.
export default defineConfig({
  site: 'https://liar-entertainer.com',
  trailingSlash: 'always',
  output: 'static',
  build: { format: 'directory', inlineStylesheets: 'always' },
  compressHTML: true,
  markdown: {
    rehypePlugins: [[rehypeBlogMedia, { resolve: makeResolver(blogMediaManifest) }]],
  },
  i18n: {
    locales: ['de', 'fr', 'en'],
    defaultLocale: 'de',
    routing: { prefixDefaultLocale: false },
  },
  vite: {
    plugins: [tailwindcss()],
    build: {
      cssMinify: true,
      minify: true,
      // Never inline fonts: as base64 they bloat every page; as files they are cached and only the
      // unicode-range subsets actually needed get downloaded. Other small assets may still inline.
      assetsInlineLimit: (file) => (/\.(woff2?|ttf|otf)$/.test(file) ? false : undefined),
    },
  },
});
