import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { chromium, type Browser } from 'playwright';

// Runs against `astro preview` (default http://localhost:4322). User, 2026-10-09:
// hero buttons centred everywhere · DE·FR·EN centred above "Anfragen" (desktop) and blinking now
// and then · logo melts into the header · home doors: both photos equally big (adult 4:3 crop).
const BASE = process.env.E2E_BASE ?? 'http://localhost:4322';
let browser: Browser;
beforeAll(async () => {
  browser = await chromium.launch({ channel: 'chrome' });
});
afterAll(() => browser?.close());

async function on<T>(path: string, width: number, fn: () => T): Promise<T> {
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  await page.goto(BASE + path);
  const r = await page.evaluate(fn);
  await page.close();
  return r;
}

describe('polish 2026-10-09', () => {
  it('DE · FR · EN sits centred right above the enquiry button and blinks now and then', async () => {
    for (const path of ['/kindergeburtstag/', '/zauberer/']) {
      const r = await on(path, 1280, () => {
        const l = document.querySelector('header .sh__lang')!.getBoundingClientRect();
        const c = document.querySelector('header .sh__cta')!.getBoundingClientRect();
        return { dx: Math.abs(l.left + l.width / 2 - (c.left + c.width / 2)), above: l.bottom <= c.top + 2, anim: getComputedStyle(document.querySelector('header .sh__lang')!).animationName };
      });
      expect([path, r.dx < 3, r.above, r.anim]).toEqual([path, true, true, 'sh-lang-blink']);
    }
  });

  it('hero button rows are centred in their column', async () => {
    for (const path of ['/', '/preise/', '/kontakt/', '/ueber-mich/', '/kindergeburtstag/', '/zauberer/']) {
      const off = await on(path, 1280, () => {
        const row = document.querySelector('main section :is(.k3-hero__actions, .ce-hero__actions)') as HTMLElement;
        const kids = [...row.children].filter((c) => (c as HTMLElement).offsetWidth);
        const l = Math.min(...kids.map((c) => c.getBoundingClientRect().left));
        const r = Math.max(...kids.map((c) => c.getBoundingClientRect().right));
        const box = row.getBoundingClientRect();
        return Math.abs((l + r) / 2 - (box.left + box.width / 2));
      });
      expect([path, off < 3]).toEqual([path, true]);
    }
  });

  it('the colourful logo melts into the header (multiply), the adult card logo does not', async () => {
    expect(await on('/kindergeburtstag/', 1280, () => getComputedStyle(document.querySelector('.sh__logo img')!).mixBlendMode)).toBe('multiply');
    expect(await on('/zauberer/', 1280, () => getComputedStyle(document.querySelector('.sh__logo img')!).mixBlendMode)).toBe('normal');
  });

  it('home: both door photos are equally big', async () => {
    for (const w of [1440, 1280, 390]) {
      const [k, a] = await on('/', w, () => [...document.querySelectorAll('.hm-world img')].map((i) => [(i as HTMLElement).offsetWidth, (i as HTMLElement).offsetHeight]));
      expect([w, Math.abs(k[0] - a[0]) <= 3, Math.abs(k[1] - a[1]) <= 3]).toEqual([w, true, true]);
    }
  });
});
