// Usage: node scripts/shot.mjs <url> <out.png> [width=1280] [fullPage=0]
import { chromium } from 'playwright';

const [url, out, width = '1280', full = '0'] = process.argv.slice(2);
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: Number(width), height: 900 } });
await page.goto(url, { waitUntil: 'networkidle' });
await page.waitForTimeout(800);
await page.screenshot({ path: out, fullPage: full === '1' });
await browser.close();
console.log('saved', out);
