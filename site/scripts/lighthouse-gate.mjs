// Gate 8.3: Lighthouse mobile >= 90, LCP < 2.5 s, CLS < 0.1 per page.
// Usage: node scripts/lighthouse-gate.mjs /kindergeburtstag/ /zauberer/   (needs `astro preview` on :4322)
import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';

const BASE = process.env.LH_BASE ?? 'http://localhost:4322';
const paths = process.argv.slice(2).length ? process.argv.slice(2) : ['/'];
const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless=new'] });
let failed = false;
for (const path of paths) {
  const { lhr } = await lighthouse(BASE + path, { port: chrome.port, onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'], formFactor: 'mobile', screenEmulation: { mobile: true, width: 412, height: 823, deviceScaleFactor: 1.75, disabled: false } });
  const perf = Math.round(lhr.categories.performance.score * 100);
  const lcp = lhr.audits['largest-contentful-paint'].numericValue / 1000;
  const cls = lhr.audits['cumulative-layout-shift'].numericValue;
  const tbt = lhr.audits['total-blocking-time'].numericValue;
  const a11y = Math.round(lhr.categories.accessibility.score * 100);
  const ok = perf >= 90 && lcp < 2.5 && cls < 0.1;
  if (!ok) failed = true;
  console.log(`${ok ? 'PASS' : 'FAIL'} ${path}  perf ${perf}  LCP ${lcp.toFixed(2)}s  CLS ${cls.toFixed(3)}  TBT ${Math.round(tbt)}ms  a11y ${a11y}`);
  if (!ok) for (const id of ['largest-contentful-paint-element', 'layout-shifts', 'render-blocking-resources', 'unused-javascript'])
    if (lhr.audits[id]?.details) console.log(`   ${id}: ${JSON.stringify(lhr.audits[id].details.items?.slice(0, 3)).slice(0, 400)}`);
}
await chrome.kill();
process.exit(failed ? 1 : 0);
