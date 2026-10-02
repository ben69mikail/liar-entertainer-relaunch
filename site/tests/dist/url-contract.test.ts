import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(import.meta.dirname, '../..');
const contract = readFileSync(join(ROOT, '../docs/url-contract-de.txt'), 'utf8')
  .split(/\r?\n/)
  .filter(Boolean);

describe('DE URL contract (brief L2)', () => {
  it('builds a page for every indexed German URL', () => {
    const missing = contract.filter((path) => !existsSync(join(ROOT, 'dist', path, 'index.html')));
    expect(missing).toEqual([]);
  });
});
