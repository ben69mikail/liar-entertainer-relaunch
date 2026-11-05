// Maps a Markdown <img> src to its build-time media manifest entry (dimensions + modern-format
// siblings). Pure and synchronous: the manifest is produced once by scripts/generate-blog-media.mjs
// so nothing reads the disk or runs sharp during Markdown rendering.

const SITE = 'https://liar-entertainer.com';

/** Site-local src → root-relative path; foreign hosts and non-strings → null. */
export function normalizeSrc(src) {
  if (typeof src !== 'string' || src.length === 0) return null;
  if (src.startsWith('/') && !src.startsWith('//')) return src;
  if (src.startsWith(SITE + '/')) return src.slice(SITE.length);
  return null; // remote or unrecognised: never rewritten
}

/** Build a `resolve(src)` for rehypeBlogMedia from a path→info manifest. */
export function makeResolver(manifest) {
  return (src) => {
    const path = normalizeSrc(src);
    if (!path) return null;
    return manifest[path] ?? null;
  };
}
