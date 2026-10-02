// Usage: npx tsx scripts/parity-diff.ts /kindergeburtstag/  — explains a content-parity failure.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { contentOf } from '../tests/support/content';

const path = process.argv[2] ?? '/';
const root = join(import.meta.dirname, '..');
const before = JSON.parse(readFileSync(join(root, 'tests/fixtures/content-baseline.json'), 'utf8'))[path];
const after = contentOf(readFileSync(join(root, 'dist', path, 'index.html'), 'utf8'));

const n = Math.max(before.headings.length, after.headings.length);
for (let i = 0; i < n; i++)
  if (before.headings[i] !== after.headings[i]) console.log(`heading #${i}: ${before.headings[i]}  =>  ${after.headings[i]}`);
const present = new Set(after.blocks);
for (const b of before.blocks) if (!present.has(b)) console.log(`missing: ${b.slice(0, 200)}`);
console.log('done');
