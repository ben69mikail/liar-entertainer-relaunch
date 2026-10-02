import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import * as cheerio from 'cheerio';
import { CORE_PAGES } from '../../src/lib/site-map';

const DIST = join(import.meta.dirname, '../../dist');
const built = (path: string) => existsSync(join(DIST, path, 'index.html'));

describe('hreflang (brief 5.3)', () => {
  it('only points to pages that exist in the build', () => {
    const broken = CORE_PAGES.flatMap((entry) => Object.values(entry))
      .filter(built)
      .flatMap((path) => {
        const $ = cheerio.load(readFileSync(join(DIST, path, 'index.html'), 'utf8'));
        return $('link[rel=alternate][hreflang]')
          .map((_, el) => new URL($(el).attr('href')!).pathname)
          .get()
          .filter((target) => !built(target))
          .map((target) => `${path} -> ${target}`);
      });
    expect(broken).toEqual([]);
  });
});
