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

describe('kids v3 hero curtain (user 2026-10-06: opens fully, like a real curtain)', () => {
  const covered = () => {
    const panels = [...document.querySelectorAll('.k3-hero .cu__panel')].map((p) => p.getBoundingClientRect());
    const targets = [document.querySelector('.k3-hero h1')!, document.querySelector('.k3-hero .cf img')!];
    return targets.flatMap((t) => {
      const r = t.getBoundingClientRect();
      return panels.some((c) => c.left < r.right - 1 && c.right > r.left + 1 && c.top < r.bottom && c.bottom > r.top) ? [t.tagName] : [];
    });
  };
  for (const width of [390, 1280]) {
    it(`@${width}px: starts closed, then opens all the way to the sides`, async () => {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      await page.goto(BASE + '/kindergeburtstag/');
      const closed = await page.evaluate(covered);
      await page.waitForTimeout(3200);
      const open = await page.evaluate(covered);
      await page.close();
      expect(closed.length).toBeGreaterThan(0);
      expect(open).toEqual([]);
    }, 15_000);
  }
  it('is open from the first frame under reduced motion', async () => {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
    await page.goto(BASE + '/kindergeburtstag/');
    expect(await page.evaluate(covered)).toEqual([]);
    await page.close();
  });
});

describe('kids v3 curtain frames never hide part of a photo (no cut-off people)', () => {
  it('curtains, cords and valance stay in the frame around the photo', async () => {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    await page.goto(BASE + '/kindergeburtstag/');
    const frames = page.locator('.cf');
    for (let i = 0; i < (await frames.count()); i++) {
      await frames.nth(i).scrollIntoViewIfNeeded();
      await page.waitForTimeout(1600);
      const hits = await frames.nth(i).evaluate((f) => {
        (f as HTMLElement).style.rotate = '0deg'; // measure the frame upright: rotation inflates boxes
        const r = f.querySelector('img')!.getBoundingClientRect();
        return [...f.querySelectorAll('.cf__side, .cf__cord, .cf__valance')].filter((d) => {
          const c = d.getBoundingClientRect();
          return c.left < r.right - 3 && c.right > r.left + 3 && c.top < r.bottom - 3 && c.bottom > r.top + 3; // 3px: rotated frames inflate their boxes
        }).length;
      });
      expect(hits).toBe(0);
    }
    await page.close();
  }, 30_000);
});

describe('kids prices count up', () => {
  it('end on the real server price', async () => {
    const page = await open('/kindergeburtstag/');
    const price = page.locator('.k3-card__price').first();
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
    const cta = page.locator('.k3-hero [data-confetti]');
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
      price: document.querySelector('.k3-card__price')?.textContent,
    }));
    expect(s).toEqual({ motionOk: false, letters: 0, price: '150 €' });
    await page.close();
  });
});

describe('kids hat trick', () => {
  it('brings something new out of the hat on every tap and announces it', async () => {
    const page = await open('/kindergeburtstag/');
    const hat = page.locator('.ht__hat');
    await hat.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1500);
    const said: string[] = [];
    for (let i = 0; i < 2; i++) {
      await hat.click();
      await page.waitForTimeout(1000);
      said.push((await page.locator('[data-hat-live]').textContent()) ?? '');
    }
    expect(new Set(said).size).toBe(2);
    expect(said.every((s) => s.endsWith('!'))).toBe(true);
    await page.close();
  });

  it('still works with reduced motion', async () => {
    const page = await open('/kindergeburtstag/', 'reduce');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    await page.locator('.ht__hat').click();
    await expect.poll(() => page.locator('[data-hat-live]').textContent()).toMatch(/!$/);
    await page.close();
  });
});

describe('side rays hero spotlights', () => {
  it('runs on a real GPU, stays off on software rendering and under reduced motion', async () => {
    const state = async (rm: 'reduce' | 'no-preference') => {
      const page = await open('/kindergeburtstag/', rm);
      await page.mouse.move(400, 300); // starts on first interaction
      await page.waitForTimeout(3000);
      const v = await page.evaluate(() => {
        const gl = document.createElement('canvas').getContext('webgl')!;
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const renderer = String(ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : '');
        return { live: document.querySelector('.kg-rays')!.classList.contains('is-live'), software: /swiftshader|llvmpipe|software/i.test(renderer) };
      });
      await page.close();
      return v;
    };
    const normal = await state('no-preference');
    expect(normal.live).toBe(!normal.software);
    expect((await state('reduce')).live).toBe(false);
  }, 20_000);
});

describe('adult photos sit in magic frames, cards are only accents (user feedback 2026-10-06)', () => {
  const ADULT = ['/', '/zauberer/', '/zauberer/zaubershow/', '/zauberer/buehnen-zauberer/', '/zauberer/tisch-zauberer/', '/zauberer/hochzeit/', '/zauberer/firmenfeier/'];
  for (const path of ADULT) {
    it(`${path}: no photo inside a playing card, every adult photo in a frame`, async () => {
      const page = await open(path);
      const n = await page.evaluate(() => ({
        inCards: document.querySelectorAll('.pc img').length,
        framed: document.querySelectorAll('.mf img').length,
      }));
      await page.close();
      expect(n.inCards).toBe(0);
      expect(n.framed).toBeGreaterThan(0);
    });
  }

  it('frame decorations play when the frame comes into view, the photo is never hidden', async () => {
    const page = await open('/zauberer/');
    const frame = page.locator('.mf').last();
    expect(await frame.evaluate((f) => getComputedStyle(f.querySelector('img')!).opacity)).toBe('1');
    await frame.scrollIntoViewIfNeeded();
    await expect.poll(() => frame.evaluate((f) => f.classList.contains('is-staged'))).toBe(true);
    await page.close();
  });
});

describe('framed photos are never cropped (user feedback 2026-10-05: no cut-off people)', () => {
  const ADULT = ['/', '/zauberer/', '/zauberer/zaubershow/', '/zauberer/buehnen-zauberer/', '/zauberer/tisch-zauberer/', '/zauberer/hochzeit/', '/zauberer/firmenfeier/'];
  for (const path of ADULT) {
    for (const width of [390, 1280]) {
      it(`${path} @${width}px: every card photo shows its whole picture`, async () => {
        const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
        await page.goto(BASE + path);
        // load lazy images so their natural size is known
        await page.evaluate(async () => {
          const imgs = [...document.querySelectorAll<HTMLImageElement>('.mf img, .pc--photo img')];
          imgs.forEach((i) => (i.loading = 'eager'));
          await Promise.all(imgs.map((i) => (i.complete ? null : new Promise((r) => { i.onload = i.onerror = r; }))));
        });
        const cropped = await page.$$eval('.mf img, .pc--photo img', (imgs) =>
          (imgs as HTMLImageElement[]).flatMap((img) => {
            const r = img.getBoundingClientRect();
            if (!r.width || !img.naturalWidth) return [];
            const shown = r.width / r.height;
            const natural = img.naturalWidth / img.naturalHeight;
            const fit = getComputedStyle(img).objectFit;
            const crops = fit === 'cover' && Math.abs(shown / natural - 1) > 0.02;
            return crops ? [`${img.alt} (shown ${shown.toFixed(2)} vs photo ${natural.toFixed(2)})`] : [];
          }),
        );
        await page.close();
        expect(cropped).toEqual([]);
      }, 30_000);
    }
  }
});
