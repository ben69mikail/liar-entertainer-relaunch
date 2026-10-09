import { describe, it, expect } from 'vitest';
import { applyFacts, applyRules, PRICE_RULES_ADULT } from '../../src/data/fact-rules';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import * as cheerio from 'cheerio';
import { page } from './helpers';

// City pages of zauberer-liar.de move to /zauberer/zauberer-in-<stadt>/ (user, 2026-10-07):
// same content and photos in the adult design, not in the menu. The source pages are frozen in
// tests/fixtures/zauberer-liar/ (fetched 2026-10-07) and act as the parity baseline.
const SRC = join(import.meta.dirname, '../fixtures/zauberer-liar');
const DIST = join(import.meta.dirname, '../../dist');
const CITIES = readdirSync(SRC).filter((f) => f.endsWith('.html')).map((f) => f.replace('.html', ''));
const pathOf = (city: string) => `/zauberer/zauberer-in-${city}/`;
const source = (city: string) => cheerio.load(readFileSync(join(SRC, `${city}.html`), 'utf8'));
const text = (s: string) => s.replace(/\s+/g, ' ').trim();
// documented deviations from the source (shared with the extractor)
const CHANGES = JSON.parse(readFileSync(join(SRC, 'changes.json'), 'utf8')) as { description: Record<string, { to: string }> };

describe('zauberer-liar.de city pages on the new site', () => {
  it('all 14 source pages are frozen', () => expect(CITIES.length).toBe(14));

  for (const city of CITIES) {
    describe(pathOf(city), () => {
      it('is built', () => expect(existsSync(join(DIST, pathOf(city), 'index.html'))).toBe(true));
      it('keeps title, description and H1; canonical points to itself', () => {
        const $s = source(city);
        const $ = page(pathOf(city));
        expect($('title').text()).toBe($s('title').text());
        expect($('meta[name="description"]').attr('content')).toBe(CHANGES.description[city]?.to ?? $s('meta[name="description"]').attr('content'));
        expect(text($('h1').text())).toBe(text($s('h1').text()));
        expect($('link[rel="canonical"]').attr('href')).toBe(`https://liar-entertainer.com${pathOf(city)}`);
      });
      it('keeps every heading, paragraph, review and FAQ of the source (L3 fix: 370+ instead of "über 400")', () => {
        const $s = source(city);
        const blocks = $s('header.page-hero h1, header.page-hero .wrap > p:not(.breadcrumb), section h2, section h3, section p, .eyebrow, .faq-q, .faq-a, .who')
          .map((_, el) => { const c = $s(el).clone(); c.find('.pl').remove(); return applyRules(applyFacts(text(c.text()).replace(/über 400/g, '370+')), PRICE_RULES_ADULT); })
          .get().filter((b) => b.length > 2);
        const body = text(page(pathOf(city))('main').text());
        expect(blocks.filter((b) => !body.includes(b))).toEqual([]);
      });
      it('shows the photos of the source page (hero + intro, original alt text)', () => {
        const $s = source(city);
        const $ = page(pathOf(city));
        const stem = (p: string) => p.split('/').pop()!.replace(/.[a-z]+$/, '');
        const hero = stem(($s('.hero-photo').attr('style') ?? '').match(/url(([^)]+))/)![1]);
        const introImg = $s('.split img').first();
        const srcs = $('main img').map((_, i) => $(i).attr('src') ?? '').get();
        expect(srcs.some((s) => s.includes(hero)), `hero ${hero}`).toBe(true);
        expect(srcs.some((s) => s.includes(stem(introImg.attr('src')!))), 'intro photo').toBe(true);
        expect($('main img').map((_, i) => $(i).attr('alt')).get()).toContain(introImg.attr('alt'));
      });
    });
  }
});

describe('zauberer city pages: findable, indexed, not in the menu', () => {
  const sitemap = readFileSync(join(DIST, 'sitemap.xml'), 'utf8');
  const zauberer = page('/zauberer/');
  for (const city of CITIES) {
    it(`${pathOf(city)}: linked from /zauberer/, not in the header menu`, () => {
      expect(zauberer(`main a[href="${pathOf(city)}"]`).length).toBeGreaterThan(0);
      expect(zauberer(`header a[href="${pathOf(city)}"]`).length).toBe(0);
    });
    // live since 2026-10-07: zauberer-liar.de redirects page by page (public/_redirects), so the
    // taken-over pages are indexable and listed (ZAUBERER_CITIES_LIVE = true)
    it(`${pathOf(city)}: indexable and in the sitemap`, () => {
      expect(page(pathOf(city))('meta[name="robots"]').attr('content')).not.toContain('noindex');
      expect(sitemap).toContain(`https://liar-entertainer.com${pathOf(city)}`);
    });
  }
});
