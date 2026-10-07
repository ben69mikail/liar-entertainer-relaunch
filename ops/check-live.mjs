// Go-live acceptance (brief Gate 7 / 8.5): run after the DNS switch.
//   node ops/check-live.mjs
// Checks against the REAL domain: served by Netlify, HTTPS valid, main URL liar-entertainer.com,
// www / http / netlify.app redirect to it, every URL of the DE contract answers 200, sitemap +
// robots unchanged. Exit code 1 on any failure.
import { readFileSync } from 'node:fs';

const MAIN = 'https://liar-entertainer.com';
const CONTRACT = readFileSync(new URL('../docs/url-contract-de.txt', import.meta.url), 'utf8')
  .split(/\r?\n/).map((l) => l.trim()).filter(Boolean).map((u) => u.replace(/^https?:\/\/[^/]+/, ''));
const fails = [];
const ok = (cond, msg) => { if (!cond) fails.push(msg); };

async function head(url) {
  const r = await fetch(url, { method: 'GET', redirect: 'manual' });
  return { status: r.status, location: r.headers.get('location'), server: r.headers.get('server'), body: r.status === 200 ? await r.text() : '' };
}

// 1) served by Netlify over valid HTTPS (fetch throws on an invalid certificate)
try {
  const r = await head(`${MAIN}/`);
  ok(r.status === 200, `/ status ${r.status}`);
  ok(/netlify/i.test(r.server ?? ''), `/ server is "${r.server}" (expected Netlify)`);
  ok(r.body.includes('<link rel="canonical" href="https://liar-entertainer.com/"'), '/ canonical');
} catch (e) { fails.push(`HTTPS on ${MAIN}: ${e.cause?.code ?? e.message}`); }

// 2) the other hosts send visitors to the main URL (301/308, path kept)
for (const [from, to] of [
  ['https://www.liar-entertainer.com/zauberer/', `${MAIN}/zauberer/`],
  ['http://liar-entertainer.com/zauberer/', `${MAIN}/zauberer/`],
  ['http://www.liar-entertainer.com/zauberer/', null],
  ['https://liar-entertainer-relaunch.netlify.app/zauberer/', `${MAIN}/zauberer/`],
]) {
  try {
    const r = await head(from);
    ok([301, 308].includes(r.status), `${from} -> status ${r.status}`);
    if (to) ok(r.location === to, `${from} -> ${r.location} (expected ${to})`);
    else ok((r.location ?? '').includes('liar-entertainer.com/zauberer/'), `${from} -> ${r.location}`);
  } catch (e) { fails.push(`${from}: ${e.cause?.code ?? e.message}`); }
}

// 3) every DE contract URL is 200 on the main URL
let n = 0;
for (const path of CONTRACT) {
  try { const r = await head(MAIN + path); n++; ok(r.status === 200, `${path} -> ${r.status} ${r.location ?? ''}`); }
  catch (e) { fails.push(`${path}: ${e.cause?.code ?? e.message}`); }
}

// 4) sitemap + robots on the main URL
try {
  const sm = await (await fetch(`${MAIN}/sitemap.xml`)).text();
  const locs = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  // the DE contract + the 15 pages taken over from zauberer-liar.de (2026-10-07)
  const missing = CONTRACT.filter((p) => !locs.includes(MAIN + p));
  ok(missing.length === 0, `sitemap misses ${missing.length} contract URLs`);
  ok(locs.length === CONTRACT.length + 15, `sitemap has ${locs.length} URLs (expected ${CONTRACT.length + 15})`);
  ok(locs.every((u) => u.startsWith(`${MAIN}/`)), 'sitemap host');
  const robots = await (await fetch(`${MAIN}/robots.txt`)).text();
  ok(/^Sitemap: https:\/\/liar-entertainer\.com\/sitemap\.xml$/m.test(robots), 'robots.txt Sitemap line');
} catch (e) { fails.push(`sitemap/robots: ${e.message}`); }

console.log(`checked ${n}/${CONTRACT.length} contract URLs`);
if (fails.length) { console.log(`FAIL (${fails.length})\n- ` + fails.slice(0, 40).join('\n- ')); process.exit(1); }
console.log('PASS: liar-entertainer.com is live on Netlify');
