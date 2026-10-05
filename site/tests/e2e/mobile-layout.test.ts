import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { chromium, type Browser } from 'playwright';

// Runs against `astro preview` (default http://localhost:4322).
// Regression: a page-scoped hero grid once overrode the kit's one-column mobile rule and
// squeezed the /zauberer/zaubershow/ hero photo to 17 px.
const BASE = process.env.E2E_BASE ?? 'http://localhost:4322';
const PAGES = [
  '/', '/kindergeburtstag/', '/kinderzauberer/', '/zauberer/',
  '/clown/clownshow/', '/clown/karneval/', '/clown/ballonmodellage/', '/clown/glitzer-tattoo/', '/clown/walk-act/',
  '/zauberer/zaubershow/kindergarten-kita/', '/zauberer/zaubershow/schule/', '/zauberer/zaubershow/strassen-sommer-fest/',
  '/zauberer/zaubershow/', '/zauberer/buehnen-zauberer/', '/zauberer/tisch-zauberer/', '/zauberer/hochzeit/', '/zauberer/firmenfeier/',
  '/kontakt/', '/kontakt/danke/', '/preise/', '/ueber-mich/', '/galerie/', '/blog/', '/blog/kategorie/feste/',
  '/blog/clown-oder-zauberer-kindergeburtstag/', '/blog/kidzival-2024/', '/impressum/', '/datenschutzerklaerung-2/',
  '/clown/clown-zauberer/', '/zauberer/zaubershow/karneval/',
  '/kinderzauberer/kinderzauberer-in-bochum/', '/kindergeburtstag/geburtstag-in-dorsten/', '/clown/clownshow/clown-in-oberhausen/',
];
let browser: Browser;
beforeAll(async () => {
  browser = await chromium.launch({ channel: 'chrome' });
});
afterAll(() => browser?.close());

describe('mobile layout (390 px)', () => {
  for (const path of PAGES) {
    it(`${path}: hero photo keeps a real size and nothing scrolls sideways`, async () => {
      const page = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
      await page.goto(BASE + path);
      const m = await page.evaluate(() => {
        const hero = document.querySelector('main > section, main > div')!;
        const widths = [...hero.querySelectorAll('img')].map((i) => i.getBoundingClientRect().width);
        return {
          heroImg: widths.length ? Math.round(Math.max(...widths)) : null, // the main photo, not a decoration
          overflow: document.documentElement.scrollWidth - innerWidth,
        };
      });
      await page.close();
      // adult heroes show the photo on a card inside a fanned hand (≈120–160 px by design): catch collapse, not style
      if (m.heroImg !== null) expect(m.heroImg, 'largest hero photo (px)').toBeGreaterThan(390 * 0.25);
      expect(m.overflow, 'sideways overflow (px)').toBeLessThanOrEqual(0);
    }, 20_000);
  }
});
