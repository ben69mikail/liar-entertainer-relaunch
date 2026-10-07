import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { chromium, type Browser } from 'playwright';

// Runs against `astro preview` (default http://localhost:4322).
// Quick contact on mobile devices (user, 2026-10-07): no bar at the bottom any more; three icon
// buttons (phone, WhatsApp, e-mail) in the header between the logo and the menu button. Phones and
// touch tablets only, never on a desktop with a mouse.
const BASE = process.env.E2E_BASE ?? 'http://localhost:4322';
let browser: Browser;
beforeAll(async () => {
  browser = await chromium.launch({ channel: 'chrome' });
});
afterAll(() => browser?.close());

type Dev = { width: number; height: number; isMobile?: boolean; hasTouch?: boolean };
const PHONE: Dev = { width: 390, height: 844, isMobile: true, hasTouch: true };
const TABLET: Dev = { width: 820, height: 1180, isMobile: true, hasTouch: true };

async function inspect(dev: Dev, path: string) {
  const ctx = await browser.newContext({ viewport: { width: dev.width, height: dev.height }, isMobile: dev.isMobile, hasTouch: dev.hasTouch });
  const page = await ctx.newPage();
  await page.goto(BASE + path);
  const r = await page.evaluate(() => {
    const q = document.querySelector<HTMLElement>('header [data-quick-contact]');
    const box = (e: Element | null) => (e ? e.getBoundingClientRect() : null);
    const visible = !!q && getComputedStyle(q).display !== 'none' && q.getBoundingClientRect().width > 0;
    const links = q ? [...q.querySelectorAll('a')].map((a) => ({ href: a.getAttribute('href') ?? '', label: a.getAttribute('aria-label') ?? '', text: a.textContent!.trim() })) : [];
    return {
      visible, links,
      logo: box(document.querySelector('header .sh__logo')), quick: box(q), menu: box(document.querySelector('header .sh__mobile summary')),
      bottomBar: document.querySelectorAll('[data-sticky-cta]').length,
      docWidth: document.documentElement.scrollWidth,
    };
  });
  await ctx.close();
  return r;
}

describe('quick contact in the header (mobile devices)', () => {
  for (const path of ['/', '/zauberer/', '/kindergeburtstag/']) {
    it(`${path}: phone — phone, WhatsApp, e-mail icons between logo and menu; no bottom bar`, async () => {
      const r = await inspect(PHONE, path);
      expect(r.bottomBar, 'bottom bar').toBe(0);
      expect(r.visible, 'icons visible').toBe(true);
      expect(r.links.map((l) => l.href.split(':')[0])).toEqual(['tel', 'https', 'mailto']);
      expect(r.links[1].href).toContain('wa.me');
      expect(r.links.every((l) => l.text === '' && l.label.length > 3), 'icon only, with an accessible name').toBe(true);
      expect(r.logo!.right).toBeLessThanOrEqual(r.quick!.left);
      expect(r.quick!.right).toBeLessThanOrEqual(r.menu!.left);
    }, 20_000);
    it(`${path}: hidden on desktop`, async () => {
      expect((await inspect({ width: 1280, height: 900 }, path)).visible).toBe(false);
    }, 20_000);
  }
  for (const path of ['/fr/', '/en/', '/kontakt/']) {
    it(`${path}: narrow phone (360 px) — logo, icons and menu button all fit`, async () => {
      const r = await inspect({ ...PHONE, width: 360 }, path);
      expect(r.visible).toBe(true);
      expect(r.logo!.right).toBeLessThanOrEqual(r.quick!.left);
      expect(r.quick!.right).toBeLessThanOrEqual(r.menu!.left);
      expect(r.menu!.right, 'menu button inside the screen').toBeLessThanOrEqual(360);
      expect(r.docWidth, 'no sideways scrolling').toBeLessThanOrEqual(360);
    }, 20_000);
  }
  it('touch tablet: shown', async () => {
    expect((await inspect(TABLET, '/')).visible).toBe(true);
  }, 20_000);
});
