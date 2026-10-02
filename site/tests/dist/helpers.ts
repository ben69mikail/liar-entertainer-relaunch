import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import * as cheerio from 'cheerio';

const DIST = join(import.meta.dirname, '../../dist');

/** Load the built HTML for a URL path, e.g. '/zauberer/' -> dist/zauberer/index.html */
export function page(path: string) {
  return cheerio.load(readFileSync(join(DIST, path, 'index.html'), 'utf8'));
}
