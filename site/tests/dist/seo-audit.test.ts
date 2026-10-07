import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import * as cheerio from 'cheerio';

// Findings of the SEO audit 2026-10-07 (docs/seo-audit-2026-10-07/) that are pure code fixes
// (no text change, L1 stays intact).
const DIST = join(import.meta.dirname, '../../dist');

function pages(dir = DIST, out: string[] = []): string[] {
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) pages(p, out);
    else if (n === 'index.html') out.push(p);
  }
  return out;
}
const ALL = pages().filter((p) => !/[\\/](fr|en)[\\/]/.test(p.slice(DIST.length)));
const load = (p: string) => cheerio.load(readFileSync(p, 'utf8'));
const rel = (p: string) => p.slice(DIST.length).replace(/\\/g, '/').replace(/index\.html$/, '');
const jsonLd = ($: cheerio.CheerioAPI) =>
  $('script[type="application/ld+json"]').toArray().flatMap((s) => {
    const d = JSON.parse($(s).text());
    return Array.isArray(d) ? d : d['@graph'] ?? [d];
  });

describe('SEO audit 2026-10-07: code fixes', { timeout: 30_000 }, () => {
  it('footer links never point to a redirecting URL (/clown/clown-zauberer/ is a 301)', () => {
    const $ = load(join(DIST, 'index.html'));
    expect($('footer.sf a[href="/clown/clown-zauberer/"]').length).toBe(0);
  });

  it('BlogPosting dates are valid ISO 8601', () => {
    const bad: string[] = [];
    for (const p of ALL) {
      for (const n of jsonLd(load(p))) {
        if (n['@type'] !== 'BlogPosting') continue;
        for (const k of ['datePublished', 'dateModified']) {
          if (n[k] && !/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})?)?$/.test(n[k])) bad.push(`${rel(p)} ${k}=${n[k]}`);
        }
      }
    }
    expect(bad).toEqual([]);
  });

  it('every speakable selector finds an element on its page', () => {
    const bad: string[] = [];
    for (const p of ALL) {
      const $ = load(p);
      for (const n of jsonLd($)) {
        for (const sel of n.speakable?.cssSelector ?? []) if ($(sel).length === 0) bad.push(`${rel(p)} ${sel}`);
      }
    }
    expect(bad.slice(0, 5)).toEqual([]);
  });

  it('no internal review notes leak into the HTML', () => {
    expect(ALL.filter((p) => readFileSync(p, 'utf8').includes('GEGENPRUEFEN')).map(rel)).toEqual([]);
  });

  it('the Person on /ueber-mich/ is the same node as the global #person', () => {
    const persons = jsonLd(load(join(DIST, 'ueber-mich/index.html'))).filter((n) => n['@type'] === 'Person');
    expect(persons.length).toBeGreaterThan(0);
    for (const n of persons) expect(n['@id']).toBe('https://liar-entertainer.com/#person');
  });

  it('breadcrumbs never list the same URL twice', () => {
    const bad: string[] = [];
    for (const p of ALL) {
      for (const n of jsonLd(load(p))) {
        if (n['@type'] !== 'BreadcrumbList') continue;
        const items = n.itemListElement.map((i: { item?: string }) => i.item).filter(Boolean);
        if (new Set(items).size !== items.length) bad.push(rel(p));
      }
    }
    expect(bad).toEqual([]);
  });

  it('no image points to a relative legacy path (assets/img/…)', () => {
    const bad: string[] = [];
    for (const p of ALL) {
      const $ = load(p);
      $('img').each((_, i) => { const s = $(i).attr('src') ?? ''; if (!/^(\/|https?:|data:)/.test(s)) bad.push(`${rel(p)} ${s}`); });
    }
    expect(bad).toEqual([]);
  });
});
