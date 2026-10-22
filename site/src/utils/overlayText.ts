/**
 * Text-zu-Pfad für die Bild-Overlays (Beitragsbild, Story).
 *
 * Der Build-Server (Netlify) hat keine schönen Schriften installiert – librsvg
 * würde auf Arial/DejaVu zurückfallen. Deshalb werden die Buchstaben hier mit
 * opentype.js direkt in SVG-Pfade umgewandelt (Fira Sans Extra Condensed,
 * OFL, aus @fontsource). Ergebnis sieht überall gleich aus.
 */
import { createRequire } from 'node:module';
import opentype from 'opentype.js';

const require = createRequire(import.meta.url);
const fontCache = new Map<number, opentype.Font>();

export function loadFont(weight: 700 | 800 | 900 = 800): opentype.Font {
  const hit = fontCache.get(weight);
  if (hit) return hit;
  const file = require.resolve(
    `@fontsource/fira-sans-extra-condensed/files/fira-sans-extra-condensed-latin-${weight}-normal.woff`,
  );
  const font = opentype.loadSync(file);
  fontCache.set(weight, font);
  return font;
}

/** Emojis und Zierzeichen entfernen (würden als Kästchen erscheinen). */
export function stripEmoji(s: string): string {
  return s
    .replace(/[\p{Extended_Pictographic}\u{1F1E6}-\u{1F1FF}\u{FE0F}\u{200D}\u{20E3}]/gu, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+([:!?.,])/g, '$1')
    .trim();
}

/** Titel an „:“ oder Gedankenstrich in zwei Teile (weiß + gelb) teilen. */
export function splitTitle(title: string): { line1: string; line2: string } {
  const m = title.match(/^(.+?)\s*(:|\s[—–-]\s)\s*(.+)$/);
  if (m) return { line1: (m[1] + (m[2] === ':' ? ':' : '')).trim(), line2: m[3].trim() };
  const q = title.match(/^(.+?[?!])\s+(.+)$/);
  if (q) return { line1: q[1].trim(), line2: q[2].trim() };
  return { line1: title, line2: '' };
}

export function measure(font: opentype.Font, text: string, size: number): number {
  return font.getAdvanceWidth(text, size, { kerning: true });
}

/** Wörter in Zeilen umbrechen, die maxWidth nicht überschreiten. */
export function wrap(font: opentype.Font, text: string, size: number, maxWidth: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    const next = cur ? cur + ' ' + w : w;
    if (cur && measure(font, next, size) > maxWidth) {
      lines.push(cur);
      cur = w;
    } else {
      cur = next;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

export type Line = { text: string; color: string };

/**
 * Sucht die größte Schriftgröße (maxSize → minSize), bei der beide Titelteile
 * in maxLines Zeilen und maxWidth passen.
 */
export function fitTitle(
  font: opentype.Font,
  title: string,
  opts: { maxWidth: number; maxLines: number; maxSize: number; minSize: number; colors: [string, string] },
): { size: number; lines: Line[] } {
  const clean = stripEmoji(title);
  const { line1, line2 } = splitTitle(clean);
  const build = (size: number) => [
    ...wrap(font, line1, size, opts.maxWidth).map((t) => ({ text: t, color: opts.colors[0] })),
    ...(line2 ? wrap(font, line2, size, opts.maxWidth) : []).map((t) => ({ text: t, color: opts.colors[1] })),
  ];
  for (let size = opts.maxSize; size >= opts.minSize; size -= 2) {
    const lines = build(size);
    if (lines.length <= opts.maxLines) return { size, lines };
  }
  return { size: opts.minSize, lines: build(opts.minSize).slice(0, opts.maxLines) };
}

/** SVG-Pfad-Daten für eine Textzeile (Grundlinie y). */
export function pathData(font: opentype.Font, text: string, x: number, y: number, size: number): string {
  return font.getPath(text, x, y, size, { kerning: true }).toPathData(1);
}
