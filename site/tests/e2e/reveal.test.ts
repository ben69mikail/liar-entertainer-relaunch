import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { chromium, type Browser } from 'playwright';

// Runs against `astro preview` (default http://localhost:4322).
const BASE = process.env.E2E_BASE ?? 'http://localhost:4322';
let browser: Browser;

beforeAll(async () => {
  browser = await chromium.launch({ channel: 'chrome' });
});
afterAll(() => browser?.close());

async function revealState(reducedMotion: 'reduce' | 'no-preference') {
  const page = await browser.newPage({ reducedMotion });
  await page.goto(BASE + '/kindergeburtstag/');
  const card = page.locator('[data-reveal], .reveal').last();
  await card.scrollIntoViewIfNeeded();
  await page.waitForTimeout(1200);
  return card.evaluate((el) => ({
    motionOk: document.documentElement.classList.contains('motion-ok'),
    opacity: getComputedStyle(el).opacity,
    transform: getComputedStyle(el).transform,
  }));
}

describe('scroll reveal in a real browser', () => {
  it('animates content in to full visibility', async () => {
    expect(await revealState('no-preference')).toEqual({
      motionOk: true,
      opacity: '1',
      transform: 'matrix(1, 0, 0, 1, 0, 0)',
    });
  });

  it('skips animation entirely for reduced motion', async () => {
    expect(await revealState('reduce')).toEqual({ motionOk: false, opacity: '1', transform: 'none' });
  });
});
