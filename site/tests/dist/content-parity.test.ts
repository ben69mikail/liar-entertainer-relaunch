import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { contentOf, type PageContent } from '../support/content';

const DIST = join(import.meta.dirname, '../../dist');
const fixture = (name: string) => JSON.parse(readFileSync(join(import.meta.dirname, '../fixtures', name), 'utf8'));
const baseline: Record<string, PageContent> = fixture('content-baseline.json');
// Deliberate, documented text corrections (docs/CHANGES-METAS.md). Everything else must match 1:1.
const changes: Record<string, { from: string; to: string }[]> = fixture('content-changes.json');

describe('content parity with the legacy site (brief L1)', () => {
  for (const [path, before] of Object.entries(baseline)) {
    it(`${path} keeps every heading and text block`, () => {
      const after = contentOf(readFileSync(join(DIST, path, 'index.html'), 'utf8'));
      expect(after.headings).toEqual(before.headings);
      const present = new Set(after.blocks);
      const expected = before.blocks.map((b) => changes[path]?.find((c) => c.from === b)?.to ?? b);
      expect(expected.filter((b) => !present.has(b))).toEqual([]);
    });
  }
});
