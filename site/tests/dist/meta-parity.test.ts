import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { metaOf, type PageMeta } from '../support/meta';

const DIST = join(import.meta.dirname, '../../dist');
const baseline: Record<string, PageMeta> = JSON.parse(
  readFileSync(join(import.meta.dirname, '../fixtures/meta-baseline.json'), 'utf8'),
);

// intended, documented changes (e.g. blog og:image) are applied on top of the baseline
const changes: Record<string, Partial<PageMeta>> = JSON.parse(
  readFileSync(join(import.meta.dirname, '../fixtures/meta-changes.json'), 'utf8'),
);

describe('meta + schema parity with the legacy site (brief L1, Phase 5)', () => {
  for (const [path, before] of Object.entries(baseline)) {
    it(`${path} keeps title, description, canonical, robots, og:image and schema types`, () => {
      expect(metaOf(readFileSync(join(DIST, path, 'index.html'), 'utf8'))).toEqual({ ...before, ...changes[path] });
    });
  }
});
