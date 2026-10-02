/**
 * Hero-Image-Overlay-Generator (build-time, sharp-basiert).
 *
 * Nimmt das Cover-Bild eines Blog-Artikels, croppt auf 1200x630 (OG-Image-Standard),
 * und legt einen SVG-Title-Overlay drauf (weiß + gelber Akzent fuer 2. Teil).
 *
 * Output: public/hero-generated/<slug>.jpg
 * Cache: skip wenn File bereits existiert (Astro-Build-Cache friendly).
 */
import sharp from 'sharp';
import { mkdir, writeFile, access, readFile } from 'node:fs/promises';
import path from 'node:path';

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

function svgEscape(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Splittet Title an : oder — fuer 2-farbiges Overlay (weiß + gelb).
 */
function splitTitle(title: string): { line1: string; line2: string } {
  const m = title.match(/^(.+?)\s*([:—–\-])\s*(.+)$/);
  if (m) {
    const sep = m[2];
    const left = m[1] + (sep === ':' ? ':' : '');
    return { line1: left.trim(), line2: m[3].trim() };
  }
  return { line1: title, line2: '' };
}

/**
 * Wrapped einen Text in 2-3 Zeilen für SVG-Rendering (max ~22 Zeichen/Zeile bei font-size 60).
 */
function wrapText(text: string, maxCharsPerLine = 22): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = '';
  for (const w of words) {
    if ((current + ' ' + w).trim().length > maxCharsPerLine && current) {
      lines.push(current.trim());
      current = w;
    } else {
      current = (current + ' ' + w).trim();
    }
  }
  if (current) lines.push(current);
  return lines;
}

function buildSvg(title: string): string {
  const { line1, line2 } = splitTitle(title);

  const FONT_TOP = 56;
  const FONT_BOTTOM = 56;
  const LINE_GAP_TOP = 64;
  const LINE_GAP_BOTTOM = 64;
  const COLOR_TOP = '#ffffff';
  const COLOR_BOTTOM = '#ffb546';

  const topLines = wrapText(line1, 26);
  const bottomLines = line2 ? wrapText(line2, 26) : [];

  let y = 80;
  const topTSpans = topLines
    .map((line, i) => {
      const yi = y + i * LINE_GAP_TOP;
      return `<text x="${PADDING_X}" y="${yi}" fill="${COLOR_TOP}" filter="url(#shadow)">${svgEscape(line)}</text>`;
    })
    .join('\n');
  y += topLines.length * LINE_GAP_TOP + 8;
  const bottomTSpans = bottomLines
    .map((line, i) => {
      const yi = y + i * LINE_GAP_BOTTOM;
      return `<text x="${PADDING_X}" y="${yi}" fill="${COLOR_BOTTOM}" filter="url(#shadow)">${svgEscape(line)}</text>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="3" stdDeviation="8" flood-color="#000" flood-opacity="0.85"/>
    </filter>
    <linearGradient id="darken" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#000" stop-opacity="0.65"/>
      <stop offset="55%" stop-color="#000" stop-opacity="0.18"/>
      <stop offset="100%" stop-color="#000" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <rect x="0" y="0" width="${W}" height="${Math.round(H * 0.55)}" fill="url(#darken)"/>
  <g font-family="Poppins, 'Helvetica Neue', Arial, sans-serif" font-weight="800" font-size="${FONT_TOP}" text-anchor="start">
    ${topTSpans}
  </g>
  <g font-family="Poppins, 'Helvetica Neue', Arial, sans-serif" font-weight="800" font-size="${FONT_BOTTOM}" text-anchor="start">
    ${bottomTSpans}
  </g>
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
      .resize(W, H, { fit: 'cover', position: 'center' })
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
