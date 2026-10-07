/**
 * Imports blog pictures from the owner's photo folders into public/blog-images/<slug>/ (2026-10-07).
 * Run locally once per change (the sources live outside the repo); the output is committed.
 *
 *   node scripts/import-blog-images.mjs src/data/legacy-blog-images.json [more.json …]
 *
 * Each JSON maps slug → { cover?, slots?, images? } whose entries carry { from, file }.
 * `from` starts with a root alias (see ROOTS). Pictures are scaled to fit 1200 px, never cropped,
 * EXIF-rotated, saved as progressive JPEG (q 78).
 */
import sharp from 'sharp';
import { readFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';

const HOME = homedir();
const NEU = join(HOME, 'OneDrive/Desktop/Neu Homepage');
const TR = join(HOME, 'Travail Stand März 2023/Marketing/Fotos');
const ROOTS = {
  CZ: join(NEU, 'Clown Zauberer'),
  CZN: join(NEU, 'Clown Zauberer/Zeitungsartikel'),
  VB: join(NEU, 'Clown Zauberer/Verarbeitet mit Übershcrift für Blog'),
  PA: join(NEU, 'Pantomime'),
  HP: join(TR, 'Homepage 2023'),
  TR,
  DL: join(HOME, 'Downloads'),
};

function resolve(from) {
  const [root, ...rest] = from.split('/');
  if (!ROOTS[root]) throw new Error(`unknown root in "${from}"`);
  return join(ROOTS[root], ...rest);
}

let made = 0;
for (const json of process.argv.slice(2)) {
  const data = JSON.parse(readFileSync(json, 'utf8'));
  for (const [slug, entry] of Object.entries(data)) {
    if (slug.startsWith('_')) continue;
    const dir = join('public/blog-images', slug);
    mkdirSync(dir, { recursive: true });
    const pics = [entry.cover, ...(entry.slots ?? []), ...(entry.images ?? [])].filter(Boolean);
    for (const { from, file } of pics) {
      const out = join(dir, file);
      if (existsSync(out)) continue;
      const src = resolve(from);
      if (!existsSync(src)) throw new Error(`missing source ${src}`);
      await sharp(src).rotate().flatten({ background: '#ffffff' })
        .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 78, progressive: true, mozjpeg: true }).toFile(out);
      made++;
    }
  }
}
console.log(`[blog-images] ${made} written`);
