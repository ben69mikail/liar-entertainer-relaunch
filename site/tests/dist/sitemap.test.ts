import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

// Main URL stays https://liar-entertainer.com and the sitemap stays the one Google knows today
// (user, 2026-10-07 go-live). Baseline: the live sitemap fetched 2026-10-07 (143 URLs).
// Additions are only allowed deliberately (e.g. when ZAUBERER_CITIES_LIVE or a FR/EN locale is
// switched on) — then extend ALLOWED_ADDITIONS in the same commit.
const DIST = join(import.meta.dirname, '../../dist');
const FIX = join(import.meta.dirname, '../fixtures');
// 2026-10-07: pages taken over from zauberer-liar.de, released with its page-by-page 301s
const ALLOWED_ADDITIONS: string[] = [
  'https://liar-entertainer.com/zauberer/close-up/',
  'https://liar-entertainer.com/zauberer/zauberer-in-bottrop/',
  'https://liar-entertainer.com/zauberer/zauberer-in-dinslaken/',
  'https://liar-entertainer.com/zauberer/zauberer-in-dorsten/',
  'https://liar-entertainer.com/zauberer/zauberer-in-duisburg/',
  'https://liar-entertainer.com/zauberer/zauberer-in-essen/',
  'https://liar-entertainer.com/zauberer/zauberer-in-gelsenkirchen/',
  'https://liar-entertainer.com/zauberer/zauberer-in-gladbeck/',
  'https://liar-entertainer.com/zauberer/zauberer-in-haltern/',
  'https://liar-entertainer.com/zauberer/zauberer-in-herne/',
  'https://liar-entertainer.com/zauberer/zauberer-in-herten/',
  'https://liar-entertainer.com/zauberer/zauberer-in-marl/',
  'https://liar-entertainer.com/zauberer/zauberer-in-oberhausen/',
  'https://liar-entertainer.com/zauberer/zauberer-in-recklinghausen/',
  'https://liar-entertainer.com/zauberer/zauberer-in-wesel/',
];

const locs = (xml: string) => [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
const live = locs(readFileSync(join(FIX, 'sitemap-live-2026-10-07.xml'), 'utf8'));
const built = locs(readFileSync(join(DIST, 'sitemap.xml'), 'utf8'));

function files(dir: string, out: string[] = []): string[] {
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) files(p, out);
    else if (/\.(html|xml|txt|json|webmanifest)$/.test(n)) out.push(p);
  }
  return out;
}

describe('main URL liar-entertainer.com + unchanged sitemap', () => {
  it('every sitemap URL is on https://liar-entertainer.com (no www, no netlify.app)', () => {
    expect(built.filter((u) => !u.startsWith('https://liar-entertainer.com/'))).toEqual([]);
  });
  it('keeps every URL of the live sitemap', () => {
    const b = new Set(built);
    expect(live.filter((u) => !b.has(u))).toEqual([]);
  });
  it('adds no URL that is not deliberately allowed', () => {
    const l = new Set(live);
    expect(built.filter((u) => !l.has(u) && !ALLOWED_ADDITIONS.includes(u))).toEqual([]);
  });
  it('robots.txt points to the sitemap on the main URL', () => {
    expect(readFileSync(join(DIST, 'robots.txt'), 'utf8')).toMatch(/^Sitemap: https:\/\/liar-entertainer\.com\/sitemap\.xml$/m);
  });
  it('no built file mentions the netlify.app preview host', () => {
    const hits = files(DIST).filter((f) => readFileSync(f, 'utf8').includes('netlify.app'));
    expect(hits.map((f) => f.slice(DIST.length))).toEqual([]);
  });
});
