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
    if (/(logo|icon|favicon|sprite|placeholder|avatar|default|standard|fallback|vorschaubild|share-image|og-default)/.test(path)) continue;
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

// --- Vom Inhaber genannte Seiten (seit 14.11.2026) ---
// Die Websuche öffnet keine URL aus der Notiz, sie liefert nur Suchtreffer (meist Portale).
// Deshalb lädt der Knoten „Recherche vorbereiten“ jede genannte Seite selbst; ihr Text ist die Hauptquelle.

const OWN_HOSTS = /(^|\.)(liar-entertainer\.com|zauberer-liar\.de|pantomime-la-france\.eu)$/i;
const URL_RE = /(^|[^@\w.-])((?:https?:\/\/|www\.)[^\s<>"'„“”)\]]+|[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9-]+)*\.(?:de|com|net|org|eu|info|nrw|ruhr|be|fr|lu|ch|at)(?:\/[^\s<>"'„“”)\]]*)?)(?=$|[\s<>"'„“”)\],;:!?]|\.(?:\s|$))/gi;

function extractUrls(text, max = 3) {
  const s = String(text || '').replace(/\s+punkt\s+(de|com|net|org|eu|info|nrw|ruhr|be|fr|lu|ch|at)\b/gi, '.$1');
  const out = [];
  for (const m of s.matchAll(URL_RE)) {
    let raw = m[2].replace(/[.,;:!?]+$/, '');
    if (!/^https?:\/\//i.test(raw)) raw = 'https://' + raw;
    let u;
    try { u = new URL(raw); } catch (e) { continue; }
    if (OWN_HOSTS.test(u.hostname)) continue;
    const href = u.href;
    if (!out.includes(href)) out.push(href);
    if (out.length >= max) break;
  }
  return out;
}

const ENTITIES = { amp: '&', nbsp: ' ', quot: '"', apos: "'", lt: '<', gt: '>', auml: 'ä', ouml: 'ö', uuml: 'ü', Auml: 'Ä', Ouml: 'Ö', Uuml: 'Ü', szlig: 'ß', euro: '€', ndash: '–', mdash: '—', hellip: '…', bdquo: '„', ldquo: '“', rdquo: '”' };
function decodeEntities(s) {
  return String(s).replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (all, e) => {
    if (e[0] === '#') { const n = e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10); return n === 160 ? ' ' : (Number.isFinite(n) ? String.fromCodePoint(n) : all); }
    return Object.prototype.hasOwnProperty.call(ENTITIES, e) ? ENTITIES[e] : all;
  });
}

function htmlToText(html, max = 6000) {
  let h = String(html || '');
  const title = (h.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || '';
  const descTag = (h.match(/<meta[^>]+name=["']description["'][^>]*>/i) || [])[0] || '';
  const desc = (descTag.match(/content=["']([^"']*)["']/i) || [])[1] || '';
  h = h.replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<(script|style|noscript|svg|template|head|nav|iframe)\b[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<(br|\/p|\/h[1-6]|\/li|\/div|\/tr|\/section|\/article)\b[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, ' ');
  const lines = [title, desc, h].join('\n').split('\n')
    .map(l => decodeEntities(l).replace(/[ \t ]+/g, ' ').trim()).filter(Boolean);
  const seen = new Set();
  let t = lines.filter(l => !seen.has(l) && seen.add(l)).join('\n');
  if (t.length > max) t = t.slice(0, max).replace(/\s+\S*$/, '') + '…';
  return t;
}

function sourcePagesBlock(pages, isoDate) {
  const list = Array.isArray(pages) ? pages : [];
  if (!list.length) return '';
  const lines = ['RECHERCHE IM INTERNET – VOM INHABER GENANNTE SEITE (direkt geladen am ' + isoDate + '). Hauptquelle für Termine, Öffnungszeiten, Ort und Programm; Angaben der Notiz haben Vorrang. Verlinke die Seite einmal als externe Quelle mit beschreibendem Ankertext:'];
  for (const pg of list) {
    if (pg.ok && pg.text) lines.push('--- ' + pg.url + '\n' + pg.text);
    else lines.push('- ' + pg.url + ' konnte nicht geladen werden (' + (pg.fehler || 'leer') + ') – keine Angaben daraus übernehmen, die nicht anderweitig belegt sind.');
  }
  return lines.join('\n');
}

function buildResearchPrompt(p, pages) {
  const schema = '{"orte":[{"name":"","adresse":"Straße Nr, PLZ Ort","parken":"kurz: Parkplätze/Parkhaus/ÖPNV","quelle":"https://…"}],"termin":{"datum":"TT.MM.JJJJ","uhrzeit":"","quelle":"https://…"},"fakten":[{"text":"kurzer Fakt","quelle":"https://…"}],"widersprueche":["…"],"quellen":[{"titel":"","url":"https://…"}]}';
  const loaded = (pages || []).filter(pg => pg.ok && pg.text);
  const failed = (pages || []).filter(pg => !(pg.ok && pg.text));
  const out = [
    'Du recherchierst im Internet für einen Blogartikel von Clown Zauberer LIAR (Michaël Prescler, Gladbeck, NRW). Heute ist ' + p.today_de + ' (' + p.iso + ').',
    '',
    'NOTIZ DES INHABERS:',
    '"""', p.topic_text, '"""'
  ];
  if (loaded.length) {
    out.push('', 'VOM INHABER GENANNTE SEITE (bereits für dich geladen – das ist die Hauptquelle):');
    for (const pg of loaded) out.push('--- ' + pg.url, '"""', pg.text, '"""');
  }
  out.push('', 'AUFGABE:');
  if (loaded.length) out.push('0. Werte ZUERST die genannte Seite aus: Termin(e), Öffnungszeiten, Ort mit Anschrift, Veranstalter, Programm, Eintritt. Als "quelle" steht dann genau diese URL. Ergänze danach per Websuche nur, was dort fehlt (z. B. Parken/ÖPNV).');
  if (failed.length) out.push('0b. Diese genannte Seite konnte nicht geladen werden, öffne sie wenn möglich über die Websuche: ' + failed.map(pg => pg.url).join(', '));
  out.push(
    '1. Finde die in der Notiz genannten Orte (Location, Halle, Kita, Schule, Fest, Stadt) und Veranstaltungen. Recherchiere nichts über LIAR selbst.',
    '2. Für jeden Ort: offizieller Name, genaue Anschrift, Parkmöglichkeiten bzw. ÖPNV.',
    '3. Für die Veranstaltung: öffentlich angekündigtes Datum und Uhrzeit, Veranstalter, Eintritt – nur wenn eine Seite es nennt.',
    '4. Höchstens 5 kurze Fakten, die Eltern/Besucher wirklich helfen (z. B. Barrierefreiheit, Einlass, Programm).',
    '5. Nimm in "quellen" auch Seiten auf, die ein Plakat/Flyer der Veranstaltung oder Fotos der Location zeigen (offizielle Seite, Veranstalter, Stadt, Presse).',
    '6. Nur Angaben, die eine geöffnete Seite belegt; "quelle" ist immer die exakte URL. Bevorzuge offizielle Seiten (Stadt, Location, Veranstalter) vor Ticket- und Freizeitportalen.',
    '7. Die Angaben des Inhabers in der Notiz (Uhrzeit, Eintritt, Programm) sind gesetzt und brauchen keine Bestätigung – nicht anzweifeln, nicht kommentieren.',
    '8. "widersprueche" nur, wenn sich zwei Quellen in einer Angabe zu Ort/Anreise widersprechen (kurz: was sagt welche Quelle). Keine Hinweise, Anmerkungen oder Fehlanzeigen dort. Nennt die Notiz keinen Ort und keine Veranstaltung, gib leere Listen zurück.',
    '',
    'Antworte NUR mit diesem JSON (kein Text davor oder danach): ' + schema
  );
  return out.join('\n');
}

function withOwnerSources(r, pages) {
  const own = (pages || []).filter(pg => pg.ok && pg.text).map(pg => ({ titel: 'Vom Inhaber genannte Seite', url: pg.url }));
  const rest = (r.quellen || []).filter(q => !own.some(o => o.url === q.url));
  return { ...r, quellen: own.concat(rest) };
}

function fullResearchBlock(r, pages, isoDate) {
  return [sourcePagesBlock(pages, isoDate), researchBlock(r, isoDate)].filter(Boolean).join('\n\n');
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { safeUrl, parseResearch, extractImages, researchBlock, researchSummary,
    extractUrls, htmlToText, sourcePagesBlock, buildResearchPrompt, withOwnerSources, fullResearchBlock };
}
