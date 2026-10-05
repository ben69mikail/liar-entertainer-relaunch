/**
 * Card thumbnails for the blog teaser lists: 720×432 WebP crops of the blog covers (written by the
 * n8n automation into public/blog-images/) and of the fallback photos. Runs in `prebuild`, so new
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
    // cropped like the card (5:3, top), so a portrait cover does not ship 4x the pixels the card shows
    await sharp(file).resize(720, 432, { fit: 'cover', position: 'top', withoutEnlargement: true }).webp({ quality: 72 }).toFile(out);
    made++;
  }
}
console.log(`[card-thumbs] ${made} generated`);
