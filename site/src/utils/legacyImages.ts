/**
 * Pictures of the WordPress-era blog articles (2026-10-07).
 * The original uploads answer 410, so the scraped HTML used to lose every picture. The
 * mapping in data/legacy-blog-images.json (made by scripts/import-blog-images.mjs) puts the
 * original file or a fitting own photo back into the same place, with a describing alt text.
 */
import data from '../data/legacy-blog-images.json';

interface Pic { from: string; file: string; alt: string }
interface Slot extends Pic { orig: string }
interface Entry { cover: Pic; slots: Slot[] }

const MAP = data as unknown as Record<string, Entry>;

/** URL slug of a legacy item: last path segment of its WordPress link. */
export function legacyKey(link: string): string {
  return new URL(link).pathname.split('/').filter(Boolean).pop() ?? '';
}

const src = (key: string, file: string) => `/blog-images/${key}/${file}`;

/** Card / og:image picture of a legacy article, if it has one. */
export function legacyCover(link: string): { src: string; alt: string } | null {
  const key = legacyKey(link);
  const e = MAP[key];
  return e ? { src: src(key, e.cover.file), alt: e.cover.alt } : null;
}

// file name stem of an upload URL: drops the WordPress size suffix (-1024x262) and the extension
const stem = (url: string) =>
  decodeURIComponent(url.split('/').pop() ?? '').replace(/\.[a-z]+$/i, '').replace(/-\d+x\d+$/, '').toLowerCase();

// WordPress replaced emoji with twemoji PNGs (…/1f609.png): put the character back
const TWEMOJI = /<img[^>]*?src="[^"]*\/(1f[0-9a-f]{3}|2[0-9a-f]{3})\.png"[^>]*>/gi;

/**
 * Replaces the article's dead upload <img> tags by the mapped pictures, in place. Lightbox links
 * around them are dropped (they pointed at the dead file). Tags without a mapping stay as they
 * are and are removed by the existing stripWpImages step.
 */
export function restoreLegacyImages(html: string, link: string): string {
  const key = legacyKey(link);
  const e = MAP[key];
  let out = html.replace(TWEMOJI, (_, code: string) => String.fromCodePoint(parseInt(code, 16)));
  if (!e) return out;
  const bySlot = new Map(e.slots.map((s) => [s.orig.toLowerCase(), s]));
  const used = new Set<string>();
  const imgTag = (s: Slot) =>
    `<img src="${src(key, s.file)}" alt="${s.alt.replace(/"/g, '&quot;')}" loading="lazy" decoding="async" class="bp-legacy-img">`;
  // unwrap <a href="…wp-content…"><img …></a> first, so the link to the dead file goes too
  out = out.replace(/<a[^>]*href="[^"]*wp-content\/uploads[^"]*"[^>]*>\s*(<img[^>]*>)\s*<\/a>/gi, '$1');
  return out.replace(/<img[^>]*>/gi, (tag) => {
    const url = tag.match(/(?:data-src|data-lazy-src|src)="([^"]*wp-content\/uploads\/[^"]+)"/i)?.[1];
    if (!url) return tag;
    const slot = bySlot.get(stem(url));
    if (!slot || used.has(slot.orig)) return tag;
    used.add(slot.orig);
    return imgTag(slot);
  });
}
