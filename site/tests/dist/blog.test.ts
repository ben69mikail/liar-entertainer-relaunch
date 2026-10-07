import { describe, it, expect } from 'vitest';
import { page } from './helpers';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import posts from '../../src/data/posts.json';

// Blog (user, 2026-10-07): the footer always lists the latest articles, and every article
// shows its own fitting pictures (no shared fallback photo, no stripped images).

/** Article links on /blog/ in display order (newest first), one per card. */
function blogIndex(): string[] {
  const $ = page('/blog/');
  const hrefs = $('.bc-more').map((_, a) => $(a).attr('href')).get();
  return [...new Set(hrefs)];
}

function footerNews(path: string): string[] {
  const $ = page(path);
  const col = $('footer.sf h2').filter((_, h) => $(h).text().trim() === 'News Clown Zauberer').parent();
  return col.find('ul a').map((_, a) => $(a).attr('href')).get();
}

describe('footer news', () => {
  for (const path of ['/', '/kindergeburtstag/', '/zauberer/', '/blog/']) {
    it(`${path}: lists the 7 latest articles, newest first`, () => {
      expect(footerNews(path)).toEqual(blogIndex().slice(0, 7));
    });
  }
});

describe('blog cards', () => {
  const $ = page('/blog/');
  const imgs = $('.bc-card .bc-media img').map((_, i) => $(i).attr('src')!).get();

  it('no card falls back to a shared category photo', () => {
    expect(imgs.filter((s) => s.includes('fallback'))).toEqual([]);
  });
  it('every article has its own cover', () => {
    const seen = new Map<string, number>();
    for (const s of imgs) seen.set(s, (seen.get(s) ?? 0) + 1);
    expect([...seen].filter(([, n]) => n > 1).map(([s]) => s)).toEqual([]);
  });
});

describe('legacy articles (WordPress era) show their pictures again', () => {
  const DIST = join(import.meta.dirname, '../../dist');
  const legacy = (posts as { type: string; link: string; content: string }[])
    .filter((p) => p.type === 'post' && /wp-content\/uploads/.test(p.content))
    .map((p) => new URL(p.link).pathname);

  it('there are legacy articles to check', () => expect(legacy.length).toBeGreaterThan(25));
  for (const path of legacy) {
    it(`${decodeURI(path)}: pictures in the text, described, served from the site, own og:image`, () => {
      const $ = page(decodeURI(path));
      const imgs = $('.bp-body img').map((_, i) => ({ src: $(i).attr('src') ?? '', alt: $(i).attr('alt') ?? '' })).get();
      expect(imgs.length, 'pictures in the article').toBeGreaterThan(0);
      for (const { src, alt } of imgs) {
        expect(alt.trim().length, `alt of ${src}`).toBeGreaterThan(10);
        if (src.startsWith('/blog-images/')) expect(existsSync(join(DIST, decodeURI(src))), src).toBe(true);
      }
      const og = $('meta[property="og:image"]').attr('content') ?? '';
      expect(og).toContain('/blog-images/');
    });
  }
});

describe('new articles (n8n / Markdown) are illustrated', () => {
  const DIST = join(import.meta.dirname, '../../dist');
  const fresh = blogIndex().filter((h) => !(posts as { link: string }[]).some((p) => new URL(p.link).pathname === h));

  it('there are new articles to check', () => expect(fresh.length).toBeGreaterThan(8));
  for (const path of fresh) {
    it(`${path}: cover photo and at least 2 described photos in the text`, () => {
      const $ = page(path);
      expect($('.bp-hero img').length, 'cover photo').toBe(1);
      const inText = $('.bp-prose img').map((_, i) => ({ src: $(i).attr('src') ?? '', alt: $(i).attr('alt') ?? '' })).get();
      expect(inText.length, 'photos in the text').toBeGreaterThanOrEqual(2);
      for (const { src, alt } of inText) {
        expect(alt.trim().length, `alt of ${src}`).toBeGreaterThan(10);
        const local = src.replace('https://liar-entertainer.com', '');
        if (local.startsWith('/blog-images/')) expect(existsSync(join(DIST, local)), local).toBe(true);
      }
    });
  }
});
