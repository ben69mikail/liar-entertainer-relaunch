import { existsSync } from 'node:fs';
import path from 'node:path';

const OWN = 'https://liar-entertainer.com/';

/**
 * Teaser image for a blog card: the 640 px WebP made by scripts/generate-card-thumbs.mjs when it
 * exists, else the original. Own absolute URLs become root-relative (no extra connection; the n8n
 * automation writes absolute https://liar-entertainer.com/blog-images/… URLs).
 */
export function cardThumb(src: string | undefined): string | undefined {
  if (!src) return src;
  const local = src.startsWith(OWN) ? '/' + src.slice(OWN.length) : src;
  if (!local.startsWith('/')) return local;
  const thumb = '/card-thumbs/' + local.slice(1).replace(/\.[^.]+$/, '').replaceAll('/', '__') + '.webp';
  return existsSync(path.resolve('./public' + thumb)) ? thumb : local;
}
