// Usage: node scripts/shot-full.mjs <url> <outPrefix> [width=1280]
// Scrolls through the page (so reveals fire), then saves the full page in viewport-sized slices.
import { chromium } from 'playwright';

const [url, prefix, width = '1280'] = process.argv.slice(2);
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: Number(width), height: 900 } });
await page.goto(url, { waitUntil: 'networkidle' });
await page.evaluate(() => document.querySelector('#cookie-consent, [data-cookie-banner], .cookie-banner')?.remove());
const height = await page.evaluate(() => document.documentElement.scrollHeight);
for (let y = 0; y < height; y += 600) {
  await page.evaluate((top) => window.scrollTo(0, top), y);
  await page.waitForTimeout(120);
}
await page.waitForTimeout(900);
const slice = 1800;
for (let i = 0, y = 0; y < height; i++, y += slice) {
  await page.screenshot({ path: `${prefix}-${i}.png`, fullPage: true, clip: { x: 0, y, width: Number(width), height: Math.min(slice, height - y) } });
}
console.log('height', height, 'slices', Math.ceil(height / slice));
await browser.close();
