/**
 * Card thumbnails for the blog teaser lists: WebP versions of the blog covers (written by the
 * n8n automation into public/blog-images/) and of the fallback photos, scaled to fit 720×432 and
 * never cropped (kids v3, 2026-10-06). Runs in `prebuild`, so new
 * automated posts get thumbnails on the next Netlify build without touching the automation.
 * Output: public/card-thumbs/<path with "/" → "__">.webp  (see src/utils/cardThumb.ts)
 */
import sharp from 'sharp';
import { readdirSync, statSync, existsSync, mkdirSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const PUBLIC = 'public';
const OUT = join(PUBLIC, 'card-thumbs');
const SOURCES = ['blog-images', 'images/fallback'];
mkdirSync(OUT, { recursive: true });

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) yield* walk(p);
    // cards only show the cover of an automated post, not its inline images
    else if (/\.(jpe?g|png|webp)$/i.test(name) && (!p.includes('blog-images') || /^cover\./i.test(name))) yield p;
  }
}

let made = 0;
for (const src of SOURCES) {
  const dir = join(PUBLIC, src);
  if (!existsSync(dir)) continue;
  for (const file of walk(dir)) {
    const rel = relative(PUBLIC, file).split(sep).join('/');
    const out = join(OUT, rel.replace(/\.[^.]+$/, '').replaceAll('/', '__') + '.webp');
    if (existsSync(out) && statSync(out).mtimeMs >= statSync(file).mtimeMs) continue;
    // whole cover, scaled to fit the card's 5:3 stage window (never cropped; user 2026-10-06)
    await sharp(file).resize(720, 432, { fit: 'inside', withoutEnlargement: true }).webp({ quality: 72 }).toFile(out);
    made++;
  }
}
console.log(`[card-thumbs] ${made} generated`);
