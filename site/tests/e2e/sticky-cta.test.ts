import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { chromium, type Browser } from 'playwright';

// Runs against `astro preview` (default http://localhost:4322).
// The quick-contact bar (Anrufen · WhatsApp · Anfragen) is for mobile devices only (user, 2026-10-07):
// phones and touch tablets, never on a desktop with mouse.
const BASE = process.env.E2E_BASE ?? 'http://localhost:4322';
let browser: Browser;
beforeAll(async () => {
  browser = await chromium.launch({ channel: 'chrome' });
});
afterAll(() => browser?.close());

async function barVisible(opts: { width: number; height: number; isMobile?: boolean; hasTouch?: boolean }, path = '/') {
  const ctx = await browser.newContext({ viewport: { width: opts.width, height: opts.height }, isMobile: opts.isMobile, hasTouch: opts.hasTouch });
  const page = await ctx.newPage();
  await page.goto(BASE + path);
  const v = await page.locator('[data-sticky-cta]').isVisible();
  await ctx.close();
  return v;
}

describe('quick-contact bar', () => {
  for (const path of ['/', '/zauberer/', '/kindergeburtstag/']) {
    it(`${path}: hidden on desktop`, async () => {
      expect(await barVisible({ width: 1280, height: 900 }, path)).toBe(false);
      expect(await barVisible({ width: 1920, height: 1080 }, path)).toBe(false);
    }, 20_000);
    it(`${path}: shown on a phone`, async () => {
      expect(await barVisible({ width: 390, height: 844, isMobile: true, hasTouch: true }, path)).toBe(true);
    });
  }
  it('shown on a touch tablet', async () => {
    expect(await barVisible({ width: 820, height: 1180, isMobile: true, hasTouch: true })).toBe(true);
  });
});
