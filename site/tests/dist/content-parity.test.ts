import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { contentOf, type PageContent } from '../support/content';
import { applyFacts } from '../../src/data/fact-rules';

const DIST = join(import.meta.dirname, '../../dist');
const fixture = (name: string) => JSON.parse(readFileSync(join(import.meta.dirname, '../fixtures', name), 'utf8'));
const baseline: Record<string, PageContent> = fixture('content-baseline.json');
// Deliberate, documented text corrections (docs/CHANGES-METAS.md). Everything else must match 1:1.
//   { from, to }  replaces a text block or a heading ("h1 Text")
//   { add }       a heading that is new on the page ("h2 Text"); new text blocks need no entry
// Site-wide fact corrections (since 2009, 400+ shows a year, 370+ reviews) live in
// src/data/fact-rules.ts and are applied to the baseline first (user, 2026-10-09).
type Change = { from?: string; to?: string; add?: string };
const changes: Record<string, Change[]> = fixture('content-changes.json');
const swap = (path: string, s: string) => changes[path]?.find((c) => c.from === s)?.to ?? s;

describe('content parity with the legacy site (brief L1)', () => {
  for (const [path, before] of Object.entries(baseline)) {
    it(`${path} keeps every heading and text block`, () => {
      const after = contentOf(readFileSync(join(DIST, path, 'index.html'), 'utf8'));
      const added = new Set((changes[path] ?? []).map((c) => c.add).filter(Boolean));
      expect(after.headings.filter((h) => !added.has(h))).toEqual(before.headings.map((h) => swap(path, applyFacts(h))));
      const present = new Set(after.blocks);
      const expected = before.blocks.map((b) => swap(path, applyFacts(b)));
      expect(expected.filter((b) => !present.has(b))).toEqual([]);
    });
  }
});

// user, 2026-10-09: no ageing "15 years", no "rund 400", no age on the pages (dated news posts keep
// their historical wording)
describe('facts are consistent (GSC analysis 2026-10-09)', () => {
  const STALE = /\b15\+? Jahre|rund 400 Shows|Alter:\s*(<[^>]+>\s*)*49\b|400 zufriedene Kunden/;
  const cities = readdirSync(join(DIST, 'zauberer')).filter((d) => d.startsWith('zauberer-in-')).map((d) => `/zauberer/${d}/`);
  const paths = [...Object.keys(baseline).filter((p) => !p.startsWith('/blog/')), ...cities, '/zauberer/close-up/'];
  it('no page states an outdated number', () => {
    const bad = paths.filter((p) => existsSync(join(DIST, p, 'index.html'))).filter((p) => STALE.test(readFileSync(join(DIST, p, 'index.html'), 'utf8')));
    expect(bad).toEqual([]);
  });
  it('llms.txt states the same facts', () => {
    const llms = readFileSync(join(DIST, 'llms.txt'), 'utf8');
    expect(llms).not.toMatch(STALE);
    expect(llms).toMatch(/seit 2009/);
    expect(llms).toMatch(/über 400 (Shows|Auftritte) pro Jahr/);
  });
});
