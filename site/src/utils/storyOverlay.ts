/**
 * Story-Image-Generator (build-time, sharp-basiert).
 *
 * Nimmt das Cover-Bild eines Blog-Artikels und baut ein 9:16 Story-Asset (1080x1920)
 * fuer FB/IG Photo Stories. Das Cover wird zentriert in 1.91:1-Aspect ratio platziert,
 * Hintergrund ist eine geblurrte+abgedunkelte Vollflaechenkopie. Title oben, CTA unten.
 *
 * Output: public/story-generated/<slug>.jpg
 * Cache: skip wenn File bereits existiert (Astro-Build-Cache friendly).
 */
import sharp from 'sharp';
import { mkdir, writeFile, access, readFile } from 'node:fs/promises';
import path from 'node:path';

const OUT_DIR = path.resolve('./public/story-generated');
const LOCAL_DOMAIN_PREFIX = 'https://liar-entertainer.com/';
const W = 1080;
const H = 1920;
const COVER_W = 1080;
const COVER_H = 565; // 1080 / 1.91 ≈ 565 — matches OG-Image aspect 1.91:1
const COVER_TOP = 720; // sits below title band
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

function svgEscape(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Wraps text into ≤maxCharsPerLine lines.
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

/**
 * Builds the top title band + bottom CTA band as one SVG overlay
 * covering 1080x1920.
 */
function buildSvg(title: string, slug: string): string {
  const FONT_TITLE = 64;
  const LINE_GAP_TITLE = 76;
  const titleLines = wrapText(title, 20).slice(0, 4); // max 4 lines

  // Title band: top 0..640 (covers ~33%)
  const titleStartY = 160;
  const titleTSpans = titleLines
    .map((line, i) => {
      const yi = titleStartY + i * LINE_GAP_TITLE;
      return `<text x="${PADDING_X}" y="${yi}" fill="#ffffff" filter="url(#shadow)">${svgEscape(line)}</text>`;
    })
    .join('\n');

  // Brand row above title
  const brandY = 90;

  // CTA band: bottom 1450..1850
  const ctaY = 1620;
  const ctaTopY = 1480;
  const urlLabel = `liar-entertainer.com/blog/${slug}/`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="3" stdDeviation="10" flood-color="#000" flood-opacity="0.9"/>
    </filter>
    <linearGradient id="topDarken" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#000" stop-opacity="0.72"/>
      <stop offset="100%" stop-color="#000" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="bottomDarken" x1="0" y1="1" x2="0" y2="0">
      <stop offset="0%" stop-color="#000" stop-opacity="0.78"/>
      <stop offset="100%" stop-color="#000" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <!-- Top darken for title legibility -->
  <rect x="0" y="0" width="${W}" height="660" fill="url(#topDarken)"/>
  <!-- Bottom darken for CTA legibility -->
  <rect x="0" y="${H - 460}" width="${W}" height="460" fill="url(#bottomDarken)"/>

  <!-- Brand pill -->
  <g>
    <rect x="${PADDING_X}" y="${brandY - 38}" width="280" height="52" rx="26" ry="26" fill="#d7393e"/>
    <text x="${PADDING_X + 24}" y="${brandY}" font-family="Poppins, 'Helvetica Neue', Arial, sans-serif" font-weight="700" font-size="26" fill="#ffffff">CLOWN ZAUBERER LIAR</text>
  </g>

  <!-- Title block -->
  <g font-family="Poppins, 'Helvetica Neue', Arial, sans-serif" font-weight="800" font-size="${FONT_TITLE}" text-anchor="start">
    ${titleTSpans}
  </g>

  <!-- CTA bar -->
  <g>
    <rect x="${PADDING_X}" y="${ctaTopY}" width="${W - 2 * PADDING_X}" height="100" rx="50" ry="50" fill="#ffb546"/>
    <text x="${W / 2}" y="${ctaTopY + 64}" text-anchor="middle" font-family="Poppins, 'Helvetica Neue', Arial, sans-serif" font-weight="800" font-size="42" fill="#1f2025">👉 Jetzt Artikel lesen</text>
  </g>
  <text x="${W / 2}" y="${ctaY + 80}" text-anchor="middle" font-family="Poppins, 'Helvetica Neue', Arial, sans-serif" font-weight="600" font-size="32" fill="#ffffff" filter="url(#shadow)">${svgEscape(urlLabel)}</text>
</svg>`;
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

    // Foreground: cover-image at original 1.91:1 aspect, centered, rounded corners via mask
    const foreground = await sharp(coverBuf)
      .resize(COVER_W, COVER_H, { fit: 'cover', position: 'center' })
      .toBuffer();

    // Compose: bg + fg + svg-overlay
    const svg = buildSvg(title, slug);
    const composed = await sharp(background)
      .composite([
        { input: foreground, top: COVER_TOP, left: 0 },
        { input: Buffer.from(svg), top: 0, left: 0 },
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
