// scripts/generate-overlays.mjs
//
// Build-time hook: erzeugt für jeden Post in src/content/blog/ ein
// Hero-Image (1200x630, OG-Image-Standard) und ein Story-Image (1080x1920, FB/IG-Stories).
// Wird via `npm run prebuild` automatisch vor `astro build` ausgeführt.
//
// Cache: heroOverlay/storyOverlay skippen selbst wenn Output existiert -- hier nur
// Statusausgabe für Logging.
//
// TS-Imports der Utilities funktionieren via `node --import tsx`.

import { readdir, readFile, access } from 'node:fs/promises';
import path from 'node:path';
import matter from 'gray-matter';
import { generateHeroWithOverlay } from '../src/utils/heroOverlay.ts';
import { generateStoryImage } from '../src/utils/storyOverlay.ts';

const BLOG_DIR = path.resolve('./src/content/blog');
const HERO_DIR = path.resolve('./public/hero-generated');
const STORY_DIR = path.resolve('./public/story-generated');

async function fileExists(p) {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const entries = await readdir(BLOG_DIR);
  const files = entries.filter((f) => f.endsWith('.md') || f.endsWith('.mdx'));
  console.log(`[overlays] ${files.length} blog posts found in ${BLOG_DIR}`);

  let heroGen = 0;
  let heroSkip = 0;
  let storyGen = 0;
  let storySkip = 0;

  for (const f of files) {
    const slug = f.replace(/\.(md|mdx)$/, '');
    const src = await readFile(path.join(BLOG_DIR, f), 'utf8');
    const { data } = matter(src);

    const cover = data.heroImage;
    const title = data.title;
    if (!cover || !title) {
      console.warn(`[overlays] skip ${slug}: missing heroImage or title in frontmatter`);
      continue;
    }

    const heroOut = path.join(HERO_DIR, `${slug}.jpg`);
    const storyOut = path.join(STORY_DIR, `${slug}.jpg`);

    if (await fileExists(heroOut)) {
      console.log(`[hero]  skip ${slug} (cached)`);
      heroSkip++;
    } else {
      console.log(`[hero]  generating ${slug}`);
      await generateHeroWithOverlay(cover, title, slug);
      heroGen++;
    }

    if (await fileExists(storyOut)) {
      console.log(`[story] skip ${slug} (cached)`);
      storySkip++;
    } else {
      console.log(`[story] generating ${slug}`);
      await generateStoryImage(cover, title, slug);
      storyGen++;
    }
  }

  console.log(`[overlays] done. hero: ${heroGen} generated, ${heroSkip} cached. story: ${storyGen} generated, ${storySkip} cached.`);
}

main().catch((e) => {
  console.error('[overlays] FAILED:', e);
  process.exit(1);
});
