/**
 * Story-Image-Generator (build-time, sharp-basiert).
 *
 * Nimmt das Cover-Bild eines Blog-Artikels und baut ein 9:16 Story-Asset (1080x1920)
 * fuer FB/IG Photo Stories: geblurrter, abgedunkelter Hintergrund, LIAR-Schild, großer Titel
 * (weiß + gelb), darunter das Foto groß mit weißem Rahmen – alles innerhalb der Bereiche,
 * die Instagram/Facebook nicht mit ihrer Oberfläche verdecken.
 *
 * Output: public/story-generated/<slug>.jpg
 * Cache: skip wenn File bereits existiert (Astro-Build-Cache friendly).
 */
import sharp from 'sharp';
import { mkdir, writeFile, access, readFile } from 'node:fs/promises';
import path from 'node:path';
import { loadFont, fitTitle, pathData, measure } from './overlayText';

const OUT_DIR = path.resolve('./public/story-generated');
const LOCAL_DOMAIN_PREFIX = 'https://liar-entertainer.com/';
const W = 1080;
const H = 1920;
const PADDING_X = 60;

// Lädt das Cover lokal aus public/ wenn URL auf eigene Domain zeigt,
// sonst via HTTP. Beim First-Deploy ist das Cover noch nicht auf IONOS,
// daher würde ein reiner fetch() 404 zurückgeben.
async function loadCover(coverUrl: string): Promise<Buffer> {
  if (coverUrl.startsWith(LOCAL_DOMAIN_PREFIX)) {
    const rel = coverUrl.slice(LOCAL_DOMAIN_PREFIX.length);
    const localPath = path.resolve('./public', rel);
    try {
      return await readFile(localPath);
    } catch {
      // local miss → fall back to HTTP
    }
  }
  const res = await fetch(coverUrl);
  if (!res.ok) throw new Error(`fetch ${res.status} ${coverUrl}`);
  return Buffer.from(await res.arrayBuffer());
}

export const STORY = { W, H, SAFE_TOP: 250, SAFE_BOTTOM: H - 340 } as const;

export type StoryLayout = {
  svg: string;
  titleTop: number;
  titleBottom: number;
  titleSize: number;
  photo: { top: number; left: number; width: number; height: number };
};

/**
 * Story-Aufbau (1080×1920): oben bleibt Platz für die App-Kopfzeile, darunter
 * rotes LIAR-Schild, großer Titel (weiß + gelb), darunter das Foto fast in voller
 * Breite mit weißem Rahmen. Unter dem Foto (im Bereich des Antwortfelds) nur die
 * Domain. Alles Text als Pfade (Fira Sans Extra Condensed).
 */
export function storyLayout(title: string): StoryLayout {
  const font = loadFont(800);
  const brand = loadFont(700);
  // Größte Schrift, bei der der Titelblock höchstens 420 px hoch ist (Foto bleibt groß)
  const MAX_TITLE_H = 420;
  let fit = fitTitle(font, title, { maxWidth: W - 2 * PADDING_X, maxLines: 4, maxSize: 112, minSize: 72, colors: ['#ffffff', '#ffc93c'] });
  for (let max = fit.size; fit.lines.length * Math.round(fit.size * 1.04) > MAX_TITLE_H && max > 72; max -= 4) {
    fit = fitTitle(font, title, { maxWidth: W - 2 * PADDING_X, maxLines: 4, maxSize: max - 4, minSize: 72, colors: ['#ffffff', '#ffc93c'] });
  }
  const { size, lines } = fit;
  const lh = Math.round(size * 1.04);

  const pillY = STORY.SAFE_TOP + 12;
  const pillH = 52;
  const titleTop = pillY + pillH + 28;
  let y = titleTop + Math.round(size * 0.86);
  const glyphs: string[] = [];
  for (const l of lines) {
    glyphs.push(`<path d="${pathData(font, l.text, PADDING_X, y, size)}" fill="${l.color}"/>`);
    y += lh;
  }
  const titleBottom = titleTop + lines.length * lh;

  const left = PADDING_X;
  const width = W - 2 * PADDING_X;
  const top = titleBottom + 36;
  const height = Math.min(STORY.SAFE_BOTTOM - 20 - top, 1200);

  const brandText = 'CLOWN ZAUBERER LIAR';
  const brandSize = 30;
  const brandW = Math.round(measure(brand, brandText, brandSize)) + 44;
  const domain = 'liar-entertainer.com';
  const domainSize = 34;
  const domainW = measure(brand, domain, domainSize);
  const shadow = glyphs.join('').replace(/fill="#[0-9a-f]+"/gi, 'fill="#000"');

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <filter id="soft" x="-10%" y="-30%" width="120%" height="160%"><feGaussianBlur stdDeviation="8"/></filter>
    <filter id="drop" x="-10%" y="-10%" width="120%" height="120%"><feDropShadow dx="0" dy="10" stdDeviation="18" flood-color="#000" flood-opacity="0.55"/></filter>
  </defs>
  <rect x="${left}" y="${top}" width="${width}" height="${height}" rx="18" fill="none" stroke="#ffffff" stroke-width="10" filter="url(#drop)"/>
  <rect x="${PADDING_X}" y="${pillY}" width="${brandW}" height="${pillH}" rx="26" fill="#d7393e"/>
  <path d="${pathData(brand, brandText, PADDING_X + 22, pillY + 37, brandSize)}" fill="#ffffff"/>
  <g filter="url(#soft)" opacity="0.9" transform="translate(0 5)">${shadow}</g>
  ${glyphs.join('')}
  <path d="${pathData(brand, domain, (W - domainW) / 2, top + height + 64, domainSize)}" fill="#ffffff" opacity="0.92"/>
</svg>`;

  return { svg, titleTop, titleBottom, titleSize: size, photo: { top, left, width, height } };
}

/**
 * Build-Time-Story-Generator.
 * @param coverUrl Public-erreichbare URL zum Original-Cover (HTTPS)
 * @param title Artikel-Titel
 * @param slug Slug fuer Output-Filename + URL-Anzeige
 * @returns Astro-relative URL (`/story-generated/<slug>.jpg`) oder Original-coverUrl als Fallback
 */
export async function generateStoryImage(
  coverUrl: string,
  title: string,
  slug: string,
): Promise<string> {
  if (!coverUrl) return coverUrl;

  const outPath = path.join(OUT_DIR, `${slug}.jpg`);
  const publicUrl = `/story-generated/${slug}.jpg`;

  // Cache: re-use existing build artifact if present
  try {
    await access(outPath);
    return publicUrl;
  } catch {
    /* not cached, generate */
  }

  try {
    await mkdir(OUT_DIR, { recursive: true });
    const coverBuf = await loadCover(coverUrl);

    // Blurred + darkened background: cover-fit to full 1080x1920, then blur
    const background = await sharp(coverBuf)
      .resize(W, H, { fit: 'cover', position: 'center' })
      .blur(40)
      .modulate({ brightness: 0.45, saturation: 0.7 })
      .toBuffer();

    // Foto in der Größe aus dem Layout, Zuschnitt nach Bildinhalt, runde Ecken
    const layout = storyLayout(title);
    const { top, left, width, height } = layout.photo;
    const mask = Buffer.from(`<svg width="${width}" height="${height}"><rect width="${width}" height="${height}" rx="18" fill="#fff"/></svg>`);
    const foreground = await sharp(coverBuf)
      .resize(width, height, { fit: 'cover', position: sharp.strategy.attention })
      .composite([{ input: mask, blend: 'dest-in' }])
      .png()
      .toBuffer();

    const composed = await sharp(background)
      .composite([
        { input: foreground, top, left },
        { input: Buffer.from(layout.svg), top: 0, left: 0 },
      ])
      .jpeg({ quality: 88, progressive: true, mozjpeg: true })
      .toBuffer();

    await writeFile(outPath, composed);
    return publicUrl;
  } catch (e) {
    console.warn(`[storyOverlay] generation failed for ${slug}:`, e);
    return coverUrl;
  }
}
