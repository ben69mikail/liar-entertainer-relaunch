import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { chromium, type Browser } from 'playwright';
import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// Runs against `astro preview` (default http://localhost:4322).
// Section seams on kids / neutral pages (user, 2026-10-07): no hard edges anywhere.
//  · dark stage | light: the stage fades into the page (seam-fade.css), so <main> carries .seam-fade
//  · light | light: no flat colour block and no border line meet; the next section opens with the
//    gold line with the star (GoldDivider .gd, star >= 22 px) near its top
//  · same background on both sides (user, 2026-10-07): no fade at that edge, the colour runs through
const BASE = process.env.E2E_BASE ?? 'http://localhost:4322';
// every built page (blog posts, city pages, legacy posts …); adult pages are skipped at runtime
const DIST = fileURLToPath(new URL('../../dist/', import.meta.url));
const PAGES = readdirSync(DIST, { recursive: true, encoding: 'utf8' })
  .filter((p) => p.endsWith('index.html'))
  .map((p) => '/' + p.replaceAll('\\', '/').replace(/index\.html$/, ''))
  .sort();
const DARK = ['k3-hero', 'k3-band', 'bp-head', 'k3-stagehead'];

let browser: Browser;
beforeAll(async () => {
  browser = await chromium.launch({ channel: 'chrome' });
});
afterAll(() => browser?.close());

describe('soft seams between sections (kids / neutral)', () => {
  for (const path of PAGES) {
    it(`${path}: stages fade, light sections flow, a gold star line between light sections`, async () => {
      const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
      await page.goto(BASE + path);
      const r = await page.evaluate((DARK) => {
        const main = document.querySelector('main')!;
        const kids = [...main.children] as HTMLElement[];
        const dark = (el: Element) => DARK.some((c) => el.classList.contains(c));
        const name = (el: Element) => `${el.tagName.toLowerCase()}.${[...el.classList].join('.')}`;
        const lines: string[] = [];
        const blocks: string[] = [];
        const noStar: string[] = [];
        const split: string[] = [];
        const small: string[] = [];
        const tint = (el: Element) => getComputedStyle(el).getPropertyValue('--tint').trim();
        kids.forEach((el, i) => {
          const cs = getComputedStyle(el);
          if (cs.display === 'none') return;
          if (parseFloat(cs.borderTopWidth) > 0 || parseFloat(cs.borderBottomWidth) > 0) lines.push(name(el));
          if (!dark(el)) {
            const m = cs.backgroundColor.match(/[\d.]+/g);
            if (m && (m[3] === undefined || +m[3] > 0)) blocks.push(name(el));
          }
          const prev = kids[i - 1];
          if (prev && !dark(prev) && !dark(el)) {
            const top = el.getBoundingClientRect().top;
            const gd = [...el.querySelectorAll('.gd')].find((g) => g.getBoundingClientRect().top - top < 200);
            if (!gd) noStar.push(`${name(prev)} | ${name(el)}`);
            else if (gd.querySelector('svg')!.getBoundingClientRect().width < 22) small.push(name(el));
            // same background on both sides: the colour runs straight through, no fade at the edge
            if (tint(prev) && tint(prev) === tint(el)) {
              const tb = getComputedStyle(prev).getPropertyValue('--tb').trim();
              const tt = getComputedStyle(el).getPropertyValue('--tt').trim();
              if (tb !== '0px' || tt !== '0px') split.push(`${name(prev)} | ${name(el)}`);
            }
          }
        });
        const adult = document.documentElement.dataset.zone === 'adult';
        return { adult, fade: main.classList.contains('seam-fade'), lines, blocks, noStar, split, small };
      }, DARK);
      await page.close();
      if (r.adult) return;
      expect(r.fade, 'main.seam-fade').toBe(true);
      expect(r.lines, 'sections with a border line').toEqual([]);
      expect(r.blocks, 'light sections with a flat colour block').toEqual([]);
      expect(r.noStar, 'light | light seams without the gold star line').toEqual([]);
      expect(r.split, 'same-colour seams that still fade apart').toEqual([]);
      expect(r.small, 'gold star line too small to read as a divider').toEqual([]);
    });
  }
});
