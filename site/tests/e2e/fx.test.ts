import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { chromium, type Browser, type Page } from 'playwright';

// Runs against `astro preview` (default http://localhost:4322).
const BASE = process.env.E2E_BASE ?? 'http://localhost:4322';
let browser: Browser;

beforeAll(async () => {
  browser = await chromium.launch({ channel: 'chrome' });
});
afterAll(() => browser?.close());

async function open(path: string, reducedMotion: 'reduce' | 'no-preference' = 'no-preference'): Promise<Page> {
  const page = await browser.newPage({ reducedMotion, viewport: { width: 1280, height: 900 } });
  await page.goto(BASE + path);
  return page;
}

describe('kids hero letters', () => {
  it('hop without ever hiding the headline (LCP safe) and keep its accessible name', async () => {
    const page = await open('/kindergeburtstag/');
    await page.waitForSelector('.fx-letter');
    const state = await page.$eval('h1', (h) => ({
      name: h.getAttribute('aria-label'),
      hidden: [...h.querySelectorAll<HTMLElement>('.fx-letter')].filter((l) => getComputedStyle(l).opacity !== '1').length,
    }));
    expect(state.name).toBe('Zauberer für Kindergeburtstag in NRW mit Clown & Lachgarantie');
    expect(state.hidden).toBe(0);
    await page.close();
  });
});

describe('kids prices count up', () => {
  it('end on the real server price', async () => {
    const page = await open('/kindergeburtstag/');
    const price = page.locator('.kg-card__price').first();
    await price.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1800);
    expect(await price.textContent()).toBe('150 €');
    await page.close();
  });
});

describe('confetti', () => {
  it('bursts when an enquiry button is pressed', async () => {
    const page = await open('/kindergeburtstag/');
    await page.waitForLoadState('networkidle');
    const cta = page.locator('.kg-hero [data-confetti]');
    const box = (await cta.boundingBox())!;
    await page.mouse.move(box.x + 10, box.y + 10);
    await page.mouse.down();
    expect(await page.locator('.fx-confetti').count()).toBeGreaterThan(10);
    await page.close();
  });
});

describe('adult booking steps', () => {
  it('are turned face up after scrolling to them', async () => {
    const page = await open('/zauberer/');
    const step = page.locator('.ce-step').last();
    await step.scrollIntoViewIfNeeded();
    await page.waitForTimeout(2200);
    const t = await step.evaluate((el) => ({
      opacity: getComputedStyle(el).opacity,
      faceUp: el.classList.contains('is-in'),
      backShown: getComputedStyle(el.querySelector('.card-back')!).display !== 'none',
    }));
    expect(t).toEqual({ opacity: '1', faceUp: true, backShown: false });
    await page.close();
  });
});

describe('pick-a-card trick', () => {
  it('turns the chosen card into the enquiry link', async () => {
    const page = await open('/zauberer/');
    const deck = page.locator('.pac__deck');
    await deck.scrollIntoViewIfNeeded();
    await expect.poll(() => deck.isVisible()).toBe(true);
    await page.locator('.pac__card').nth(2).click();
    const link = page.locator('.pac__result a[href="/kontakt/"]');
    await link.waitFor({ state: 'visible', timeout: 4000 });
    expect(await link.evaluate((a) => a === document.activeElement)).toBe(true);
    await page.close();
  });

  it('still works with reduced motion', async () => {
    const page = await open('/zauberer/', 'reduce');
    await page.locator('.pac__card').first().click();
    await page.locator('.pac__result a').waitFor({ state: 'visible', timeout: 2000 });
    await page.close();
  });
});

describe('reduced motion', () => {
  it('skips decorative motion and leaves server text untouched', async () => {
    const page = await open('/kindergeburtstag/', 'reduce');
    await page.waitForLoadState('networkidle');
    const s = await page.evaluate(() => ({
      motionOk: document.documentElement.classList.contains('motion-ok'),
      letters: document.querySelectorAll('.fx-letter').length,
      price: document.querySelector('.kg-card__price')?.textContent,
    }));
    expect(s).toEqual({ motionOk: false, letters: 0, price: '150 €' });
    await page.close();
  });
});
