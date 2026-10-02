// GSC-Tagesreport per Search Console API (Service-Account, keine npm-Abhängigkeiten).
// Env: GSC_SA_KEY = Inhalt der Service-Account-JSON (GitHub-Secret).
// Ohne Secret: schreibt nur einen Hinweis und beendet mit 0.
import { createSign } from 'node:crypto';

const SITE = 'sc-domain:liar-entertainer.com';
const KEY = process.env.GSC_SA_KEY;
const FOCUS = ['zauberer kindergeburtstag', 'zauberer für kindergeburtstag', 'kinderzauberer', 'zauberer', 'clown', 'zaubershow', 'clown für kindergeburtstag', 'zauberer bottrop', 'zauberer gladbeck', 'zauberer nrw', 'zauberer buchen', 'zauberer mieten', 'bühnenzauberer', 'zauberer weihnachtsfeier'];
const HUBS = ['/', '/kindergeburtstag/', '/kinderzauberer/', '/zauberer/', '/zauberer/zaubershow/', '/clown/clownshow/', '/preise/'];

if (!KEY) {
  console.log('## GSC\n\nKein `GSC_SA_KEY`-Secret gesetzt — GSC-Daten nicht abgerufen. Einrichtung siehe docs/seo-automation.md.');
  process.exit(0);
}
const sa = JSON.parse(KEY);

async function token() {
  const now = Math.floor(Date.now() / 1000);
  const b64 = o => Buffer.from(JSON.stringify(o)).toString('base64url');
  const unsigned = b64({ alg: 'RS256', typ: 'JWT' }) + '.' + b64({ iss: sa.client_email, scope: 'https://www.googleapis.com/auth/webmasters.readonly', aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 });
  const sig = createSign('RSA-SHA256').update(unsigned).sign(sa.private_key, 'base64url');
  const r = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${unsigned}.${sig}` });
  const j = await r.json();
  if (!j.access_token) throw new Error('Token-Fehler: ' + JSON.stringify(j));
  return j.access_token;
}
const TOK = await token();
const api = async (path, body) => {
  const r = await fetch(`https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(SITE)}/${path}`, { method: body ? 'POST' : 'GET', headers: { authorization: `Bearer ${TOK}`, 'content-type': 'application/json' }, body: body && JSON.stringify(body) });
  const j = await r.json();
  if (j.error) throw new Error(path + ': ' + j.error.message);
  return j;
};
const day = (offset) => new Date(Date.now() - offset * 86400000).toISOString().slice(0, 10);
// GSC-Daten sind ~3 Tage verzögert
const cur = { startDate: day(9), endDate: day(3) };
const prev = { startDate: day(16), endDate: day(10) };
const q = (range, dims, extra = {}) => api('searchAnalytics/query', { ...range, dimensions: dims, rowLimit: 500, ...extra });

const [tc, tp] = await Promise.all([q(cur, []), q(prev, [])]);
const T = r => (r.rows || [{}])[0] || {};
const pct = (a, b) => b ? ((a - b) / b * 100).toFixed(0) + ' %' : '–';
const n = x => (x || 0).toLocaleString('de-DE');
const c = T(tc), p = T(tp);

const [qc, qp, pc] = await Promise.all([q(cur, ['query']), q(prev, ['query']), q(cur, ['page'])]);
const map = r => Object.fromEntries((r.rows || []).map(x => [x.keys[0], x]));
const QC = map(qc), QP = map(qp);

const out = [];
out.push(`## GSC — ${cur.startDate} bis ${cur.endDate} vs. Vorwoche`);
out.push(`| | aktuell | vorher | Δ |\n|---|---|---|---|\n| Klicks | ${n(c.clicks)} | ${n(p.clicks)} | ${pct(c.clicks, p.clicks)} |\n| Impressionen | ${n(c.impressions)} | ${n(p.impressions)} | ${pct(c.impressions, p.impressions)} |\n| CTR | ${((c.ctr || 0) * 100).toFixed(1)} % | ${((p.ctr || 0) * 100).toFixed(1)} % | |\n| Position | ${(c.position || 0).toFixed(1)} | ${(p.position || 0).toFixed(1)} | |`);

const alerts = [];
if (p.clicks && c.clicks < p.clicks * 0.7) alerts.push(`Klicks −${(100 - c.clicks / p.clicks * 100).toFixed(0)} % gegenüber Vorwoche → READ-ONLY-Regel greift.`);
if (p.impressions && c.impressions < p.impressions * 0.8) alerts.push(`Impressionen −${(100 - c.impressions / p.impressions * 100).toFixed(0)} % gegenüber Vorwoche.`);

out.push(`### Fokus-Queries\n| Query | Klicks | Impr. | CTR | Pos | Pos vorher |\n|---|---|---|---|---|---|`);
for (const k of FOCUS) { const a = QC[k], b = QP[k]; if (!a && !b) continue; out.push(`| ${k} | ${a?.clicks ?? 0} | ${n(a?.impressions)} | ${a ? (a.ctr * 100).toFixed(1) : '0'} % | ${a ? a.position.toFixed(1) : '–'} | ${b ? b.position.toFixed(1) : '–'} |`); }

const topI = (qc.rows || []).sort((a, b) => b.impressions - a.impressions).slice(0, 15);
out.push(`### Top-15 Queries nach Impressionen\n| Query | Klicks | Impr. | CTR | Pos |\n|---|---|---|---|---|\n` + topI.map(r => `| ${r.keys[0]} | ${r.clicks} | ${n(r.impressions)} | ${(r.ctr * 100).toFixed(1)} % | ${r.position.toFixed(1)} |`).join('\n'));

const www = (pc.rows || []).filter(r => r.keys[0].startsWith('https://www.')).reduce((s, r) => s + r.impressions, 0);
out.push(`### Seiten\nwww-Variante: ${n(www)} Impressionen (Ziel 0 nach GBP-Umstellung).\n\n| Seite | Klicks | Impr. | Pos |\n|---|---|---|---|\n` + (pc.rows || []).sort((a, b) => b.clicks - a.clicks).slice(0, 10).map(r => `| ${r.keys[0].replace('https://liar-entertainer.com', '')} | ${r.clicks} | ${n(r.impressions)} | ${r.position.toFixed(1)} |`).join('\n'));

// Index-Status der Hub-Seiten (URL Inspection API)
const insp = [];
for (const h of HUBS) {
  try {
    const r = await fetch('https://searchconsole.googleapis.com/v1/urlInspection/index:inspect', { method: 'POST', headers: { authorization: `Bearer ${TOK}`, 'content-type': 'application/json' }, body: JSON.stringify({ inspectionUrl: 'https://liar-entertainer.com' + h, siteUrl: SITE }) });
    const j = await r.json(); const s = j.inspectionResult?.indexStatusResult || {};
    const bad = s.verdict !== 'PASS';
    insp.push(`| ${h} | ${bad ? '❌' : '✅'} ${s.coverageState || j.error?.message || '?'} | ${s.lastCrawlTime?.slice(0, 10) || '–'} |`);
    if (bad) alerts.push(`Hub ${h} nicht indexiert: ${s.coverageState}`);
  } catch (e) { insp.push(`| ${h} | Fehler ${e.message} | |`); }
}
out.push(`### Index-Status Hub-Seiten\n| Seite | Status | Letztes Crawl |\n|---|---|---|\n` + insp.join('\n'));

// Weitere Properties (nur Summen), sofern das Dienstkonto dort Nutzer ist
const OTHER = ['sc-domain:zauberer-liar.de', 'sc-domain:pantomime-la-france.eu'];
const other = [];
for (const site of OTHER) {
  try {
    const r = await fetch(`https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(site)}/searchAnalytics/query`, { method: 'POST', headers: { authorization: `Bearer ${TOK}`, 'content-type': 'application/json' }, body: JSON.stringify({ ...cur, dimensions: [] }) });
    const j = await r.json(); const t = (j.rows || [{}])[0] || {};
    other.push(`| ${site.replace('sc-domain:', '')} | ${j.error ? 'kein Zugriff (Dienstkonto als Nutzer eintragen)' : `${t.clicks ?? 0} Klicks / ${n(t.impressions)} Impr. / Pos ${(t.position || 0).toFixed(1)}`} |`);
  } catch (e) { other.push(`| ${site} | Fehler ${e.message} |`); }
}
out.push(`### Andere Properties (7 T)\n| Property | Werte |\n|---|---|\n` + other.join('\n'));

if (alerts.length) out.unshift(`**GSC-Alarm:**\n` + alerts.map(a => `- ❌ ${a}`).join('\n'));
console.log(out.join('\n\n'));
process.exit(alerts.length ? 1 : 0);
