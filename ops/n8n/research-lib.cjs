// Web-Recherche für Spontan-Artikel: Auswertung der Modell-Antwort, Bildfunde, Prompt-Block.
// Wird von build.py in die n8n-Code-Knoten „Recherche auswerten“ eingefügt (ohne require/import).

function safeUrl(u) {
  const s = String(u || '').trim();
  return /^https?:\/\/[^\s"'<>]+$/i.test(s) ? s : '';
}

function parseResearch(text) {
  const empty = { ok: false, orte: [], termin: { datum: '', uhrzeit: '', quelle: '' }, fakten: [], widersprueche: [], quellen: [], bilder: [] };
  const raw = String(text || '');
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start < 0 || end <= start) return empty;
  let j;
  try { j = JSON.parse(raw.slice(start, end + 1)); } catch (e) { return empty; }
  const str = (v) => String(v || '').replace(/\s+/g, ' ').trim();
  const orte = (Array.isArray(j.orte) ? j.orte : [])
    .map(o => ({ name: str(o.name), adresse: str(o.adresse), parken: str(o.parken), quelle: safeUrl(o.quelle) }))
    .filter(o => o.name && o.quelle);
  const t = j.termin || {};
  const termin = { datum: str(t.datum), uhrzeit: str(t.uhrzeit), quelle: safeUrl(t.quelle) };
  if (!termin.quelle) { termin.datum = ''; termin.uhrzeit = ''; }
  const fakten = (Array.isArray(j.fakten) ? j.fakten : [])
    .map(f => ({ text: str(f.text), quelle: safeUrl(f.quelle) }))
    .filter(f => f.text && f.quelle);
  const widersprueche = (Array.isArray(j.widersprueche) ? j.widersprueche : []).map(str).filter(Boolean);
  const seen = new Set();
  const quellen = (Array.isArray(j.quellen) ? j.quellen : [])
    .map(q => ({ titel: str(q.titel) || 'Quelle', url: safeUrl(q.url) }))
    .filter(q => q.url && !seen.has(q.url) && seen.add(q.url));
  for (const u of [...orte.map(o => o.quelle), ...fakten.map(f => f.quelle), termin.quelle]) {
    if (u && !seen.has(u)) { seen.add(u); quellen.push({ titel: 'Quelle', url: u }); }
  }
  const ok = orte.length + fakten.length + (termin.datum ? 1 : 0) > 0;
  return { ok, orte, termin, fakten, widersprueche, quellen, bilder: [] };
}

function extractImages(html, pageUrl) {
  const out = [];
  const seen = new Set();
  const re = /<meta[^>]+(?:property|name)=["'](?:og:image(?::url)?|twitter:image(?::src)?)["'][^>]*>/gi;
  const tags = String(html || '').match(re) || [];
  for (const tag of tags) {
    const m = tag.match(/content=["']([^"']+)["']/i);
    if (!m) continue;
    let url;
    try { url = new URL(m[1].replace(/&amp;/g, '&'), pageUrl).href; } catch (e) { continue; }
    if (!/^https?:/i.test(url)) continue;
    const path = url.split('?')[0].toLowerCase();
    if (!/\.(jpe?g|png|webp)$/.test(path)) continue;
    if (/(logo|icon|favicon|sprite|placeholder|avatar)/.test(path)) continue;
    if (seen.has(url)) continue;
    seen.add(url);
    out.push({ url, seite: pageUrl });
  }
  return out;
}

function researchBlock(r, isoDate) {
  if (!r || !r.ok) return '';
  const lines = ['RECHERCHE IM INTERNET (Stand ' + isoDate + ') – nur diese Angaben zusätzlich zur Notiz verwenden, Notiz des Inhabers hat Vorrang:'];
  for (const o of r.orte) {
    lines.push('- Ort: ' + o.name + (o.adresse ? ', Adresse: ' + o.adresse : '') + (o.parken ? ', Parken: ' + o.parken : '') + ' (Quelle: ' + o.quelle + ')');
  }
  if (r.termin && r.termin.datum) lines.push('- Termin: ' + r.termin.datum + (r.termin.uhrzeit ? ', ' + r.termin.uhrzeit : '') + ' (Quelle: ' + r.termin.quelle + ')');
  for (const f of r.fakten) lines.push('- ' + f.text + ' (Quelle: ' + f.quelle + ')');
  for (const w of r.widersprueche) lines.push('- Widersprüchlich, nicht als sicher darstellen: ' + w);
  return lines.join('\n');
}

function researchSummary(r) {
  if (!r) return '';
  const n = (k, one, many) => k + ' ' + (k === 1 ? one : many);
  return n(r.orte.length, 'Ort', 'Orte') + ', ' + n(r.fakten.length, 'Fakt', 'Fakten') + ', ' +
    n(r.quellen.length, 'Quelle', 'Quellen') + ', ' + n((r.bilder || []).length, 'Bildfund', 'Bildfunde');
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { safeUrl, parseResearch, extractImages, researchBlock, researchSummary };
}
