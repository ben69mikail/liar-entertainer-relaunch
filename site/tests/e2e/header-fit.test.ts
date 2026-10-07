import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { chromium, type Browser } from 'playwright';

// Runs against `astro preview` (default http://localhost:4322).
// Since German pages show DE · FR · EN too (user, 2026-10-07), the desktop header must still fit:
// logo, menu, language switcher and the enquiry button inside the viewport, no sideways scroll.
const BASE = process.env.E2E_BASE ?? 'http://localhost:4322';
let browser: Browser;
beforeAll(async () => {
  browser = await chromium.launch({ channel: 'chrome' });
});
afterAll(() => browser?.close());

const WIDTHS = [1024, 1181, 1280, 1366, 1440, 1920];
const PATHS = ['/kindergeburtstag/', '/zauberer/', '/fr/anniversaire-enfant/', '/en/magician/'];

describe('desktop header fits', () => {
  for (const path of PATHS) {
    it(`${path}: logo, menu, languages and button stay inside the viewport`, async () => {
      const bad: string[] = [];
      for (const width of WIDTHS) {
        const page = await browser.newPage({ viewport: { width, height: 700 } });
        await page.goto(BASE + path);
        const r = await page.evaluate(() => {
          const right = (s: string) => { const e = document.querySelector(s); return e && getComputedStyle(e).display !== 'none' ? e.getBoundingClientRect().right : 0; };
          return {
            doc: document.documentElement.scrollWidth,
            cta: right('header .sh__cta'),
            lang: right('header .sh__lang'),
            langShown: !!document.querySelector('header .sh__lang a'),
          };
        });
        if (r.doc > width) bad.push(`${width}: page ${r.doc} wide`);
        if (r.cta > width) bad.push(`${width}: button ends at ${Math.round(r.cta)}`);
        if (!r.langShown || r.lang === 0) bad.push(`${width}: no language switcher`);
        await page.close();
      }
      expect(bad).toEqual([]);
    }, 60_000);
  }
});
