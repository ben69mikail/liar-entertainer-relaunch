import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { chromium, type Browser } from 'playwright';

// Runs against `astro preview` (default http://localhost:4322).
// Cookie banner (user, 2026-10-07): it must disappear on accept AND on decline, and stay away
// on the next page view (choice remembered).
const BASE = process.env.E2E_BASE ?? 'http://localhost:4322';
let browser: Browser;
beforeAll(async () => {
  browser = await chromium.launch({ channel: 'chrome' });
});
afterAll(() => browser?.close());

describe('cookie banner', () => {
  for (const [button, label] of [['#cc-accept', 'accept'], ['#cc-decline', 'decline']] as const) {
    for (const width of [390, 1280]) {
      it(`${label} hides it and it stays hidden after reload (${width} px)`, async () => {
        const ctx = await browser.newContext({ viewport: { width, height: 844 } });
        const page = await ctx.newPage();
        await page.goto(BASE + '/');
        const banner = page.locator('#cookie-consent');
        await expect.poll(() => banner.isVisible()).toBe(true);
        await page.click(button);
        await expect.poll(() => banner.isVisible()).toBe(false);
        await page.goto(BASE + '/kindergeburtstag/');
        await page.waitForTimeout(500);
        expect(await page.locator('#cookie-consent').isVisible()).toBe(false);
        await ctx.close();
      });
    }
  }
});
