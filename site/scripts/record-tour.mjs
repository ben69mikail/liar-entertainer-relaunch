// Records a slow scroll through a page as video (shows the animations for design review).
// Usage: node scripts/record-tour.mjs <path> <outDir> [width=1280] [height=800]
import { chromium } from 'playwright';
import { renameSync } from 'node:fs';
import { join } from 'node:path';

const [path, outDir, w = '1280', h = '800'] = process.argv.slice(2);
const size = { width: Number(w), height: Number(h) };
const browser = await chromium.launch({ channel: 'chrome' });
const ctx = await browser.newContext({ viewport: size, recordVideo: { dir: outDir, size } });
const page = await ctx.newPage();
await page.goto((process.env.TOUR_BASE ?? 'http://localhost:4322') + path, { waitUntil: 'load' });
await page.evaluate(() => document.getElementById('cookie-consent')?.setAttribute('hidden', ''));
await page.mouse.move(size.width * 0.5, size.height * 0.5); // first interaction starts the fluid background
await page.waitForTimeout(2600); // hero entrance
await page.mouse.move(size.width * 0.3, size.height * 0.4);
const total = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
for (let y = 0; y < total; y += 14) {
  await page.mouse.wheel(0, 14);
  if (y % 280 === 0) await page.mouse.move(size.width * (0.3 + Math.random() * 0.4), size.height * (0.3 + Math.random() * 0.4), { steps: 6 });
  await page.waitForTimeout(16);
}
await page.waitForTimeout(800);
const hat = page.locator('.ht__hat');
if (await hat.count()) {
  await hat.evaluate((e) => e.scrollIntoView({ block: 'center', behavior: 'smooth' }));
  await page.waitForTimeout(1400);
  for (let i = 0; i < 3; i++) { await hat.click(); await page.waitForTimeout(1300); }
}
const pac = page.locator('.pac__card').nth(2);
if (await pac.count()) { await pac.scrollIntoViewIfNeeded(); await page.waitForTimeout(400); await pac.click(); await page.waitForTimeout(1600); }
const video = page.video();
await ctx.close();
const name = path.replace(/\//g, '') || 'home';
renameSync(await video.path(), join(outDir, `tour-${name}-${w}.webm`));
await browser.close();
console.log('saved', join(outDir, `tour-${name}-${w}.webm`));
