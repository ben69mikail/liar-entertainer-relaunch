import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { chromium, type Browser } from 'playwright';

// Runs against `astro preview` (default http://localhost:4322).
// Home hero, the two doors "Für Kinder" / "Für Erwachsene" (user, 2026-10-07): both frames the same
// size on desktop, the adult photo at least as wide as the kids photo (photo never cropped).
const BASE = process.env.E2E_BASE ?? 'http://localhost:4322';
let browser: Browser;
beforeAll(async () => {
  browser = await chromium.launch({ channel: 'chrome' });
});
afterAll(() => browser?.close());

describe('home: the two doors', () => {
  for (const width of [1280, 1440]) {
    it(`same frame size, adult photo not narrower (${width} px)`, async () => {
      const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
      await page.goto(BASE + '/');
      await page.evaluate(() => document.querySelector('.hm-world--adult img')!.scrollIntoView());
      await page.waitForFunction(() => document.querySelector<HTMLImageElement>('.hm-world--adult img')!.complete);
      const m = await page.evaluate(() => {
        const box = (s: string) => document.querySelector(s)!.getBoundingClientRect();
        const img = (s: string) => document.querySelector<HTMLImageElement>(s)!;
        const a = img('.hm-world--adult img');
        return {
          kids: box('.hm-world--kids'), adult: box('.hm-world--adult'),
          kidsImg: box('.hm-world--kids img').width, adultImg: box('.hm-world--adult img').width,
          // layout box (offset*), not the bounding box: the doors are rotated by 1deg
        adultRatio: a.offsetWidth / a.offsetHeight, natural: a.naturalWidth / a.naturalHeight,
        };
      });
      await page.close();
      expect(Math.abs(m.kids.height - m.adult.height), 'door heights').toBeLessThanOrEqual(4);
      expect(Math.abs(m.kids.width - m.adult.width), 'door widths').toBeLessThanOrEqual(4);
      expect(m.adultImg, 'adult photo width').toBeGreaterThanOrEqual(m.kidsImg);
      expect(Math.abs(m.adultRatio - m.natural), 'adult photo not cropped').toBeLessThan(0.05);
    });
  }
});
