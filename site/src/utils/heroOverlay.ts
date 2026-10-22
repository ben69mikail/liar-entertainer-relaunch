/**
 * Hero-Image-Overlay-Generator (build-time, sharp-basiert).
 *
 * Nimmt das Cover-Bild eines Blog-Artikels, croppt auf 1200x630 (OG-Image-Standard),
 * und legt einen Titel-Overlay drauf (Fira Sans Extra Condensed als Pfade, weiß + gelb).
 *
 * Output: public/hero-generated/<slug>.jpg
 * Cache: skip wenn File bereits existiert (Astro-Build-Cache friendly).
 */
import sharp from 'sharp';
import { mkdir, writeFile, access, readFile } from 'node:fs/promises';
import path from 'node:path';
import { loadFont, fitTitle, pathData, measure } from './overlayText';

const OUT_DIR = path.resolve('./public/hero-generated');
const LOCAL_DOMAIN_PREFIX = 'https://liar-entertainer.com/';
const W = 1200;
const H = 630;
const PADDING_X = 56;

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

const FONT = () => loadFont(800);
const BRAND = () => loadFont(700);

/**
 * Overlay im Stil der Vorlage „Zaubershow im Kindergarten“: große, schmale
 * fette Schrift, erster Titelteil weiß, zweiter gelb, weicher Schatten,
 * dunkler Verlauf oben, kleines rotes LIAR-Schild unten links.
 */
export function buildSvg(title: string): string {
  const font = FONT();
  const { size, lines } = fitTitle(font, title, {
    maxWidth: W - 2 * PADDING_X,
    maxLines: 4,
    maxSize: 92,
    minSize: 54,
    colors: ['#ffffff', '#ffc93c'],
  });
  const lh = Math.round(size * 1.06);
  let y = 34 + Math.round(size * 0.86);
  const paths: string[] = [];
  for (const l of lines) {
    paths.push(`<path d="${pathData(font, l.text, PADDING_X, y, size)}" fill="${l.color}"/>`);
    y += lh;
  }
  const textBottom = y - lh + Math.round(size * 0.25);
  const shadeH = Math.min(H, textBottom + 150);
  const glyphs = paths.join('');
  const shadow = glyphs.replace(/fill="#[0-9a-f]+"/gi, 'fill="#000"');

  const brandText = 'CLOWN ZAUBERER LIAR';
  const brandSize = 24;
  const brand = BRAND();
  const brandW = Math.round(measure(brand, brandText, brandSize)) + 36;
  const brandY = H - 34 - 40;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <filter id="soft" x="-10%" y="-30%" width="120%" height="160%"><feGaussianBlur stdDeviation="7"/></filter>
    <linearGradient id="darken" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#000" stop-opacity="0.72"/>
      <stop offset="60%" stop-color="#000" stop-opacity="0.38"/>
      <stop offset="100%" stop-color="#000" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="foot" x1="0" y1="1" x2="0" y2="0">
      <stop offset="0%" stop-color="#000" stop-opacity="0.45"/>
      <stop offset="100%" stop-color="#000" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <rect x="0" y="0" width="${W}" height="${shadeH}" fill="url(#darken)"/>
  <rect x="0" y="${H - 140}" width="${W}" height="140" fill="url(#foot)"/>
  <g filter="url(#soft)" opacity="0.9" transform="translate(0 4)">${shadow}</g>
  <g opacity="0.55" transform="translate(2 3)">${shadow}</g>
  ${glyphs}
  <rect x="${PADDING_X}" y="${brandY}" width="${brandW}" height="40" rx="20" fill="#d7393e"/>
  <path d="${pathData(brand, brandText, PADDING_X + 18, brandY + 29, brandSize)}" fill="#ffffff"/>
</svg>`;
}

/**
 * Build-Time-Hero-Generator.
 * @param coverUrl Public-erreichbare URL zum Original-Cover (HTTPS)
 * @param title Artikel-Titel
 * @param slug Slug fuer Output-Filename
 * @returns Astro-relative URL (`/hero-generated/<slug>.jpg`) oder Original-coverUrl als Fallback
 */
export async function generateHeroWithOverlay(
  coverUrl: string,
  title: string,
  slug: string,
): Promise<string> {
  if (!coverUrl) return coverUrl;

  const outPath = path.join(OUT_DIR, `${slug}.jpg`);
  const publicUrl = `/hero-generated/${slug}.jpg`;

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

    const resized = await sharp(coverBuf)
      .resize(W, H, { fit: 'cover', position: sharp.strategy.attention })
      .toBuffer();

    const svg = buildSvg(title);
    const composed = await sharp(resized)
      .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
      .jpeg({ quality: 88, progressive: true, mozjpeg: true })
      .toBuffer();

    await writeFile(outPath, composed);
    return publicUrl;
  } catch (e) {
    console.warn(`[heroOverlay] generation failed for ${slug}:`, e);
    return coverUrl;
  }
}
