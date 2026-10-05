// Freeze head/SEO data of every built page (run on a build whose pages still carry legacy meta).
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { metaOf } from '../tests/support/meta';

const DIST = process.env.SNAPSHOT_DIST ?? join(import.meta.dirname, '../dist');
const OUT = join(import.meta.dirname, '../tests/fixtures/meta-baseline.json');
function* pages(dir: string): Generator<string> {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) yield* pages(full);
    else if (name === 'index.html') yield full;
  }
}
const out: Record<string, ReturnType<typeof metaOf>> = {};
for (const file of pages(DIST)) {
  const dir = relative(DIST, join(file, '..')).split(sep).join('/');
  out[dir ? `/${dir}/` : '/'] = metaOf(readFileSync(file, 'utf8'));
}
const sorted = Object.fromEntries(Object.entries(out).sort(([a], [b]) => a.localeCompare(b)));
writeFileSync(OUT, JSON.stringify(sorted, null, 1) + '\n');
console.log(`meta baseline: ${Object.keys(sorted).length} pages`);
