// Prebuild step: optimise the raw JPEG/PNG images that blog Markdown references from /public.
// For each source it writes .webp + .avif siblings (skipped when already fresh) and records the
// intrinsic dimensions, then emits src/lib/blog-media-manifest.json keyed by root-relative URL.
// rehypeBlogMedia (wired in astro.config) reads that manifest to add width/height + lazy loading
// and to wrap each <img> in a <picture> with the modern sources. Idempotent; safe to re-run.
import { readdir, stat, writeFile, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const PUBLIC = path.resolve('public');
// Public directories that blog Markdown links to with <img>/![]() (inline body images).
const DIRS = ['blog-images', 'content-fotos', 'story-generated'];
const SRC_RE = /\.(jpe?g|png)$/i;

async function* walkFiles(dir) {
  let entries = [];
  try { entries = await readdir(dir, { withFileTypes: true }); } catch { return; }
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) yield* walkFiles(full);
    else yield full;
  }
}

/** Write `out` from `src` via `encode` unless `out` already exists and is newer than `src`. */
async function ensureSibling(src, out, encode) {
  if (existsSync(out)) {
    const [a, b] = await Promise.all([stat(src), stat(out)]);
    if (b.mtimeMs >= a.mtimeMs) return; // fresh
  }
  await encode(sharp(src)).toFile(out);
}

const manifest = {};
let built = 0;

for (const dir of DIRS) {
  for await (const file of walkFiles(path.join(PUBLIC, dir))) {
    if (!SRC_RE.test(file)) continue;
    const rel = '/' + path.relative(PUBLIC, file).split(path.sep).join('/');
    const webpAbs = file.replace(SRC_RE, '.webp');
    const avifAbs = file.replace(SRC_RE, '.avif');
    try {
      const meta = await sharp(file).metadata();
      await ensureSibling(file, webpAbs, (s) => s.webp({ quality: 80 }));
      await ensureSibling(file, avifAbs, (s) => s.avif({ quality: 50 }));
      manifest[rel] = {
        width: meta.width,
        height: meta.height,
        webp: rel.replace(SRC_RE, '.webp'),
        avif: rel.replace(SRC_RE, '.avif'),
      };
      built++;
    } catch (err) {
      console.warn(`[blog-media] skip ${rel}: ${err.message}`);
    }
  }
}

const outPath = path.resolve('src/lib/blog-media-manifest.json');
const sorted = Object.fromEntries(Object.keys(manifest).sort().map((k) => [k, manifest[k]]));
const next = JSON.stringify(sorted, null, 2) + '\n';
const prev = await readFile(outPath, 'utf8').catch(() => '');
if (next !== prev) await writeFile(outPath, next);
console.log(`[blog-media] ${built} source images → webp/avif siblings, manifest with ${Object.keys(manifest).length} entries`);
