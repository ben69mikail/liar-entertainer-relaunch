import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import * as cheerio from 'cheerio';
import { page } from './helpers';
import { ZAUBERER_CITIES_LIVE } from '../../src/data/zauberer-cities';

// zauberer-liar.de/close-up-zauberer.html moves to /zauberer/close-up/ (user, 2026-10-07): same text,
// photos and alt texts in the adult design. The source is frozen in
// tests/fixtures/zauberer-liar-pages/ (fetched 2026-10-07) and acts as the parity baseline.
// Only allowed text change: "über 400" → "370+" (L3, real Google count) — the source has none.
const SRC = join(import.meta.dirname, '../fixtures/zauberer-liar-pages/close-up-zauberer.html');
const DIST = join(import.meta.dirname, '../../dist');
const PATH = '/zauberer/close-up/';
const text = (s: string) => s.replace(/\s+/g, ' ').trim();
const fix = (s: string) => s.replace(/über 400/g, '370+');
const SLUG = 'close-up-zauberer';
// documented deviations (SEO length rules M6.1/M6.4), shared with the extractor
const CHANGES = JSON.parse(readFileSync(join(import.meta.dirname, '../fixtures/zauberer-liar-pages/changes.json'), 'utf8')) as Record<'title' | 'description' | 'h1', Record<string, { from?: string; to: string }>>;
const h1Fix = (s: string) => (CHANGES.h1?.[SLUG] && s === CHANGES.h1[SLUG].from ? CHANGES.h1[SLUG].to : s);
const stem = (p: string) => p.split('/').pop()!.replace(/\.[a-z]+$/, '');

const source = () => {
  const $ = cheerio.load(readFileSync(SRC, 'utf8'));
  $('br').replaceWith(' ');
  return $;
};

describe(`${PATH} (close-up page of zauberer-liar.de)`, () => {
  it('is built', () => expect(existsSync(join(DIST, PATH, 'index.html'))).toBe(true));

  it('keeps title and description; canonical points to itself; adult zone', () => {
    const $s = source();
    const $ = page(PATH);
    const title = $('title').text();
    const desc = $('meta[name="description"]').attr('content')!;
    expect(title).toBe(CHANGES.title[SLUG]?.to ?? $s('title').text());
    expect(desc).toBe(CHANGES.description[SLUG]?.to ?? fix($s('meta[name="description"]').attr('content')!));
    expect(title.length).toBeLessThanOrEqual(62); // SEO rule M6.1
    expect(desc.length).toBeLessThanOrEqual(165); // SEO rule M6.4
    expect(text($('h1').text())).toBe(h1Fix(text($s('h1').text())));
    expect($('link[rel="canonical"]').attr('href')).toBe(`https://liar-entertainer.com${PATH}`);
    expect($('html').attr('data-zone')).toBe('adult');
  });

  it('keeps every heading, paragraph, card and caption of the source', () => {
    const $s = source();
    const blocks = $s('header.page-hero h1, header.page-hero .wrap > p:not(.breadcrumb), section h2, section h3, section p, section li, .eyebrow, .cap')
      .map((_, el) => h1Fix(fix(text($s(el).text()))))
      .get()
      .filter((b) => b.length > 2);
    expect(blocks.length).toBeGreaterThan(15);
    const $ = page(PATH);
    $('br').replaceWith(' '); // a line break reads as a space, in the source and here
    const body = text($('main').text());
    expect(blocks.filter((b) => !body.includes(b))).toEqual([]);
  });

  it('shows every photo of the source (hero + all section photos) with the original alt texts', () => {
    const $s = source();
    const $ = page(PATH);
    const imgs = $('main img').map((_, i) => ({ src: $(i).attr('src') ?? '', alt: $(i).attr('alt') ?? '' })).get();
    const hero = stem((($s('.hero-photo').attr('style') ?? '').match(/url\(([^)]+)\)/) ?? [])[1] ?? '');
    expect(hero).not.toBe('');
    expect(imgs.some((i) => i.src.includes(hero)), `hero ${hero}`).toBe(true);
    const wanted = $s('section img').map((_, i) => ({ stem: stem($s(i).attr('src')!), alt: $s(i).attr('alt')! })).get();
    expect(wanted.length).toBeGreaterThanOrEqual(6);
    const missing = wanted.filter((w) => !imgs.some((i) => i.src.includes(w.stem) && i.alt === w.alt));
    expect(missing).toEqual([]);
  });

  it('rewrites the internal links of the source to the new site', () => {
    const $ = page(PATH);
    const hrefs = $('main a').map((_, a) => $(a).attr('href') ?? '').get();
    expect(hrefs.filter((h) => /\.html(#|$)/.test(h))).toEqual([]);
    for (const target of ['/zauberer/tisch-zauberer/', '/clown/walk-act/', '/galerie/', '/kontakt/']) {
      expect(hrefs, target).toContain(target);
    }
  });

  it('structured data: Service of the business; breadcrumbs Startseite › Zauberer › Close-up', () => {
    const $ = page(PATH);
    const ld = $('script[type="application/ld+json"]').map((_, s) => JSON.parse($(s).text())).get().flat();
    const nodes = ld.flatMap((n: any) => (n['@graph'] ? n['@graph'] : [n]));
    const service = nodes.find((n: any) => n['@type'] === 'Service');
    expect(service?.provider?.['@id']).toBe('https://liar-entertainer.com/#business');
    expect(service?.url).toBe(`https://liar-entertainer.com${PATH}`);
    const crumbs = nodes.find((n: any) => n['@type'] === 'BreadcrumbList');
    expect(crumbs.itemListElement.map((i: any) => i.name)).toEqual(['Startseite', 'Zauberer', 'Close-up']);
  });

  it('playing-card ranks are German (A, K, D, B — never Q or J)', () => {
    const $ = page(PATH);
    const ranks = $('.mf__idx, .ce-pcard__idx').map((_, e) => text($(e).text())).get();
    expect(ranks.filter((r) => /[QJ]/.test(r))).toEqual([]);
  });

  it('is linked from /zauberer/tisch-zauberer/ main content, not from the header menu', () => {
    const tz = page('/zauberer/tisch-zauberer/');
    expect(tz(`main a[href="${PATH}"]`).length).toBeGreaterThan(0);
    expect(tz(`header a[href="${PATH}"]`).length).toBe(0);
  });

  // Same rule as the city pages (ZAUBERER_CITIES_LIVE, src/data/zauberer-cities.ts): while the text is
  // still online on zauberer-liar.de the copy stays out of the index; it joins the sitemap with the 301s.
  it('indexing follows ZAUBERER_CITIES_LIVE (noindex + not in the sitemap until the 301s go live)', () => {
    const sitemap = readFileSync(join(DIST, 'sitemap.xml'), 'utf8');
    const robots = page(PATH)('meta[name="robots"]').attr('content') ?? '';
    if (ZAUBERER_CITIES_LIVE) {
      expect(robots).not.toContain('noindex');
      expect(sitemap).toContain(`https://liar-entertainer.com${PATH}`);
    } else {
      expect(robots).toContain('noindex');
      expect(sitemap).not.toContain(PATH);
    }
  });
});
