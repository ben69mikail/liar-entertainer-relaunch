import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { chromium, type Browser } from 'playwright';

// Runs against `astro preview` (default http://localhost:4322).
// Circus sign "Show auch auf Französisch · Englisch · Spanisch" (user, 2026-10-09, revised): small,
// no flags, six blinking arrows around it; on EVERY page between two sections, never in the hero.
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
      betweenSections: !!sign?.closest('main section') && !sign!.closest('main section')!.matches('.k3-hero, .ce-hero--stage') && sign!.closest('main section') !== document.querySelector('main section'),
      flags: sign?.querySelectorAll('.ls__flags, image, rect').length ?? 0,
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
  for (const path of ['/', '/kindergeburtstag/', '/clown/clownshow/', '/zauberer/', '/zauberer/hochzeit/', '/preise/', '/galerie/', '/zauberer/zaubershow/schule/', '/kindergeburtstag/geburtstag-in-essen/', '/zauberer/zauberer-in-essen/', '/blog/', '/kontakt/']) {
    it(`${path}: small sign with six blinking arrows between two sections`, async () => {
      const r = await probe(path);
      expect(r.present).toBe(true);
      expect(r.text).toContain('Französisch · Englisch · Spanisch');
      expect(r.inHero).toBe(false);
      expect(r.betweenSections).toBe(true);
      expect(r.arrows).toBe(6);
      expect(r.flags).toBe(0);
      expect(r.animated).toBe('ls-arrow');
    });
  }

  it('is translated on the FR twin', async () => {
    const r = await probe('/fr/tarifs/');
    expect(r.text).toContain('français · anglais · espagnol');
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
