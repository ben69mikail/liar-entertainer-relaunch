// Freeze the editorial content of every built page as the L1 parity baseline.
// Run once on the legacy port (before redesign): npm run build && npm run snapshot:content
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { contentOf } from '../tests/support/content';

const DIST = join(import.meta.dirname, '../dist');
const OUT = join(import.meta.dirname, '../tests/fixtures/content-baseline.json');

function* pages(dir: string): Generator<string> {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) yield* pages(full);
    else if (name === 'index.html') yield full;
  }
}

const baseline: Record<string, ReturnType<typeof contentOf>> = {};
for (const file of pages(DIST)) {
  const dir = relative(DIST, join(file, '..')).split(sep).join('/');
  baseline[dir ? `/${dir}/` : '/'] = contentOf(readFileSync(file, 'utf8'));
}
const sorted = Object.fromEntries(Object.entries(baseline).sort(([a], [b]) => a.localeCompare(b)));
writeFileSync(OUT, JSON.stringify(sorted, null, 1) + '\n');
console.log(`baseline: ${Object.keys(sorted).length} pages -> ${OUT}`);
