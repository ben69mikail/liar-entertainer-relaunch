import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { contentOf, type PageContent } from '../support/content';

const DIST = join(import.meta.dirname, '../../dist');
const baseline: Record<string, PageContent> = JSON.parse(
  readFileSync(join(import.meta.dirname, '../fixtures/content-baseline.json'), 'utf8'),
);

describe('content parity with the legacy site (brief L1)', () => {
  for (const [path, before] of Object.entries(baseline)) {
    it(`${path} keeps every heading and text block`, () => {
      const after = contentOf(readFileSync(join(DIST, path, 'index.html'), 'utf8'));
      expect(after.headings).toEqual(before.headings);
      const present = new Set(after.blocks);
      expect(before.blocks.filter((b) => !present.has(b))).toEqual([]);
    });
  }
});
