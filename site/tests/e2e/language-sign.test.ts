import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { chromium, type Browser } from 'playwright';

// Runs against `astro preview` (default http://localhost:4322).
// Circus sign "Show auch auf Französisch · Englisch · Spanisch" with blinking arrows (user,
// 2026-10-09): home + every main-menu page, in the hero; not on city pages or blog posts.
const BASE = process.env.E2E_BASE ?? 'http://localhost:4322';
let browser: Browser;
beforeAll(async () => {
  browser = await chromium.launch({ channel: 'chrome' });
});
afterAll(() => browser?.close());

async function probe(path: string, width = 1280, reducedMotion: 'reduce' | 'no-preference' = 'no-preference') {
  const ctx = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion });
  const page = await ctx.newPage();
  await page.goto(BASE + path);
  const r = await page.evaluate(() => {
    const sign = document.querySelector<HTMLElement>('[data-language-sign]');
    const hero = document.querySelector('.k3-hero, .ce-hero--stage');
    const arrow = sign?.querySelector('.ls__arrow');
    return {
      present: !!sign,
      text: sign?.textContent?.replace(/\s+/g, ' ').trim() ?? '',
      inHero: !!(sign && hero?.contains(sign)),
      arrows: sign?.querySelectorAll('.ls__arrow').length ?? 0,
      animated: arrow ? getComputedStyle(arrow).animationName : '',
      fits: document.documentElement.scrollWidth <= innerWidth,
      right: sign ? sign.getBoundingClientRect().right : 0,
      vw: innerWidth,
    };
  });
  await ctx.close();
  return r;
}

describe('language sign', () => {
  for (const path of ['/', '/kindergeburtstag/', '/clown/clownshow/', '/zauberer/', '/zauberer/hochzeit/', '/preise/', '/galerie/', '/zauberer/zaubershow/schule/']) {
    it(`${path}: sign with two blinking arrows in the hero`, async () => {
      const r = await probe(path);
      expect(r.present).toBe(true);
      expect(r.text).toContain('Französisch · Englisch · Spanisch');
      expect(r.inHero).toBe(true);
      expect(r.arrows).toBe(2);
      expect(r.animated).toBe('ls-arrow');
    });
  }

  it('is translated on the FR twin', async () => {
    const r = await probe('/fr/tarifs/');
    expect(r.text).toContain('français · anglais · espagnol');
  });

  it('is not on city pages', async () => {
    expect((await probe('/kindergeburtstag/geburtstag-in-essen/')).present).toBe(false);
    expect((await probe('/zauberer/zauberer-in-essen/')).present).toBe(false);
  });

  it('fits a 360 px phone', async () => {
    for (const path of ['/', '/zauberer/', '/kindergeburtstag/']) {
      const r = await probe(path, 360);
      expect([path, r.fits, r.right <= r.vw]).toEqual([path, true, true]);
    }
  });

  it('arrows stay still with reduced motion', async () => {
    const r = await probe('/', 1280, 'reduce');
    expect(r.present).toBe(true);
    expect(r.animated).toBe('none');
  });
});
