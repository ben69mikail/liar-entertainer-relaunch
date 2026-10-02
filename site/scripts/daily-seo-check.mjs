// Täglicher Live-Regressionscheck für liar-entertainer.com
// Läuft in .github/workflows/seo-daily.yml. Schreibt Markdown nach stdout,
// Exit-Code 1 bei mindestens einem Befund (Actions-Run wird rot).
import { readFileSync, readdirSync } from 'node:fs';

const BASE = 'https://liar-entertainer.com';
const UA = 'Mozilla/5.0 (compatible; LIAR-daily-seo-check)';
const findings = [];
const ok = [];

async function head(url) {
  const r = await fetch(url, { redirect: 'manual', headers: { 'user-agent': UA } });
  return { status: r.status, location: r.headers.get('location') || '' };
}
async function getText(url) {
  const r = await fetch(url, { headers: { 'user-agent': UA } });
  return { status: r.status, text: await r.text() };
}
function expect(cond, good, bad) { (cond ? ok : findings).push(cond ? good : bad); }

// 1. Erreichbarkeit + Host-Kanonisierung
{
  const home = await head(BASE + '/');
  expect(home.status === 200, 'Startseite 200', `Startseite liefert ${home.status}`);
  for (const [u, target] of [[`https://www.liar-entertainer.com/`, `${BASE}/`], [`http://liar-entertainer.com/`, `${BASE}/`]]) {
    const r = await head(u);
    expect(r.status === 301 && r.location === target, `${u} → 301 ${target}`, `${u} liefert ${r.status} → ${r.location || '-'} (erwartet 301 ${target})`);
  }
  for (const p of ['/robots.txt', '/sitemap.xml', '/llms.txt']) {
    const r = await head(BASE + p);
    expect(r.status === 200, `${p} 200`, `${p} liefert ${r.status}`);
  }
}

// 2. Legacy-Weiterleitungen
{
  const cases = [
    ['/category/kindergeburtstag/', 301], ['/tag/zauberer/', 301], ['/feed/', 301], ['/index.php', 301],
    ['/attachment/x/', 410], ['/wp-content/uploads/2020/x.jpg', 410],
    ['/zauberer-nrw/', 301], ['/zauberer/zauberer-nrw/', 301], ['/blog/was-kostet-ein-/', 301],
    ['/5-gruende-warum-zauberei-zum-karneval-gehoert-%f0%9f%8e%ad%e2%9c%a8/', 301],
    ['/tierparkfest-recklinghausen/', 301], ['/clown/coesfeld-empfaengt-clown-zauberer-liar/', 301],
  ];
  // Alte Root-Slugs muessen auf den Artikel zeigen, nicht auf /blog/
  for (const p of ['/tierparkfest-recklinghausen/', '/kinderkarneval-mit-clown-zauberer/']) {
    const r = await head(BASE + p);
    expect(r.location === BASE + '/blog' + p, `${p} → Artikel`, `${p} leitet nach ${r.location || r.status} statt auf /blog${p}`);
  }
  for (const [p, want] of cases) {
    const r = await head(BASE + p);
    expect(r.status === want, `${p} → ${want}`, `${p} liefert ${r.status}, erwartet ${want}`);
  }
}

// 3. Sitemap: alle URLs 200, Canonical = URL, genau 1 H1, JSON-LD parsebar, kein noindex
{
  const sm = await getText(BASE + '/sitemap.xml');
  const urls = [...sm.text.matchAll(/<loc>(https:\/\/liar-entertainer\.com\/[^<]*)<\/loc>/g)].map(m => m[1]).filter(u => !/\.(jpe?g|png|webp)$/.test(u));
  expect(urls.length >= 135, `Sitemap: ${urls.length} URLs`, `Sitemap nur ${urls.length} URLs (Soll ≥ 135)`);
  let bad = [];
  const pool = urls.slice();
  const worker = async () => {
    while (pool.length) {
      const u = pool.shift();
      try {
        const r = await getText(u);
        if (r.status !== 200) { bad.push(`${u} → ${r.status}`); continue; }
        const h = r.text;
        const canon = (h.match(/<link rel="canonical" href="([^"]+)"/) || [])[1];
        if (canon !== u) bad.push(`${u}: canonical=${canon}`);
        const h1 = (h.match(/<h1[\s>]/g) || []).length;
        if (h1 !== 1) bad.push(`${u}: ${h1} H1`);
        if (/<meta name="robots" content="[^"]*noindex/.test(h)) bad.push(`${u}: noindex in Sitemap`);
        for (const m of h.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)) {
          try { JSON.parse(m[1]); } catch { bad.push(`${u}: JSON-LD ungültig`); }
        }
      } catch (e) { bad.push(`${u}: ${e.message}`); }
    }
  };
  await Promise.all(Array.from({ length: 8 }, worker));
  expect(bad.length === 0, `Alle ${urls.length} Sitemap-URLs: 200, Canonical, 1×H1, JSON-LD ok`, `Sitemap-URLs mit Befund (${bad.length}):\n  - ` + bad.slice(0, 30).join('\n  - '));
}

// 4. Blog-Fälligkeit
{
  let latest = '', slug = '';
  for (const f of readdirSync('src/content/blog').filter(f => f.endsWith('.md'))) {
    const fm = readFileSync('src/content/blog/' + f, 'utf8');
    const d = (fm.match(/publishDate:\s*(\d{4}-\d{2}-\d{2})/) || [])[1];
    const draft = /draft:\s*true/.test(fm);
    if (d && !draft && d > latest) { latest = d; slug = f; }
  }
  const age = Math.floor((Date.now() - new Date(latest)) / 86400000);
  ok.push(`Letzter Blogartikel: ${latest} (${slug}), ${age} Tage alt`);
  if (age > 7) findings.push(`Blog überfällig: letzter Artikel vor ${age} Tagen (${latest}). Nächstes Thema laut BLOG-REDAKTIONSPLAN-Q4-2026.md freigeben.`);
}

const out = [];
out.push(`## Live-Regressionscheck`);
out.push(findings.length ? `**${findings.length} Befund(e):**\n` + findings.map(f => `- ❌ ${f}`).join('\n') : `Keine Befunde.`);
out.push(`<details><summary>${ok.length} Prüfungen grün</summary>\n\n` + ok.map(o => `- ✅ ${o}`).join('\n') + `\n</details>`);
console.log(out.join('\n\n'));
process.exit(findings.length ? 1 : 0);
