import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { chromium, type Browser } from 'playwright';

// Runs against `astro preview` (default http://localhost:4322).
// Kids hero like the adult one (user, 2026-10-09): title, then the photo, then subline, claims and
// buttons below it, everything centred in one column. Kids zone only; neutral pages keep text|photo.
const BASE = process.env.E2E_BASE ?? 'http://localhost:4322';
let browser: Browser;
beforeAll(async () => {
  browser = await chromium.launch({ channel: 'chrome' });
});
afterAll(() => browser?.close());

async function hero(path: string, width: number) {
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  await page.goto(BASE + path);
  const r = await page.evaluate(() => {
    const box = (s: string) => { const e = document.querySelector(s); if (!e) return null; const b = e.getBoundingClientRect(); return { top: b.top + scrollY, bottom: b.bottom + scrollY, cx: b.left + b.width / 2, w: b.width }; };
    return { h1: box('.k3-hero h1'), photo: box('.k3-hero__photo'), actions: box('.k3-hero .k3-hero__actions'), vw: innerWidth };
  });
  await page.close();
  return r;
}

describe('kids hero: title, photo, then the rest (centred)', () => {
  for (const path of ['/kindergeburtstag/', '/kinderzauberer/', '/clown/clownshow/', '/zauberer/zaubershow/schule/', '/kindergeburtstag/geburtstag-in-essen/']) {
    for (const width of [1280, 390]) {
      it(`${path} at ${width}px`, async () => {
        const r = await hero(path, width);
        expect(r.h1 && r.photo && r.actions).toBeTruthy();
        expect(r.photo!.top).toBeGreaterThan(r.h1!.bottom - 1);
        expect(r.actions!.top).toBeGreaterThan(r.photo!.bottom - 1);
        for (const b of [r.h1!, r.photo!]) expect(Math.abs(b.cx - r.vw / 2)).toBeLessThan(24);
        expect(r.photo!.w).toBeGreaterThan(Math.min(260, r.vw * 0.6));
      });
    }
  }

  it('neutral pages keep text and photo side by side (/preise/, 1280px)', async () => {
    const r = await hero('/preise/', 1280);
    if (!r.photo) return; // page without a hero photo
    expect(r.photo.top).toBeLessThan(r.h1!.bottom);
  });
});
