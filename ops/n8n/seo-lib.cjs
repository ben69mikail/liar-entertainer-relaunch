// GSC-Wochenvorschläge (Title/Description/FAQ) + Monatsbericht je Artikel – reine Funktionen.
// Wird in die n8n-Code-Knoten von LIAR-2026-11/12/13 eingefügt (ohne require). Tests: node --test ops/n8n/seo.test.mjs

const SITE = 'https://liar-entertainer.com';

const FAKTEN = [
  'FAKTENBLATT (einzige Quelle – nichts darüber hinaus behaupten):',
  '- Michaël Prescler, als „Clown Zauberer LIAR“, Gladbeck (NRW). Telefon +49 172 1517578, info@liar-entertainer.com',
  '- Hauptberuflich seit 2009 (17 Jahre Erfahrung), über 400 Auftritte pro Jahr, 5,0 Sterne bei 390+ Google-Bewertungen, pädagogische Ausbildung, erweitertes Führungszeugnis, Haftpflichtversicherung. Aus Frankreich.',
  '- Shows auf Deutsch; auf Wunsch Französisch, Englisch, Spanisch (Erwachsenen-Bühnenshow nicht Spanisch).',
  '- Kindershow ca. 40 Min., Erwachsenen-Bühnenshow ca. 30 Min. Kindergeburtstage Mo–Do ab 13 Uhr, Kitas/Schulen vormittags ab 8 Uhr.',
  '- PREISE NUR im Zusammenhang Kindergeburtstag: Zaubershow 150 € Festpreis (40 Min., bis ca. 12 Kinder, ab 4 J.), + Ballonmodellage 20 €, + Glitzer-Tattoos 40 €, Komplett-Paket 210 €, Fahrtkosten 0,40 €/km ab Gladbeck. Alles andere: „auf Anfrage“.',
  '- Glitzer-Tattoos nur als Zusatz zur Zaubershow (privat), nie einzeln. Ballonmodellage nur mit Zaubershow oder Walk-Act ab 3 Std.',
  '- Keine Mitgliedschaften, keine Auszeichnungen, keine Firmennamen als Referenz. Keine Rabatte, keine Gratis-Zugaben.',
].join('\n');

const NEVER = ['/kontakt/', '/impressum/', '/datenschutzerklaerung-2/', '/agbs/', '/kontakt/danke/'];

function normPath(url) {
  let p = String(url || '').replace(/^https?:\/\/(www\.)?liar-entertainer\.com/i, '').split('#')[0].split('?')[0];
  if (!p.startsWith('/')) p = '/' + p;
  if (!/\.[a-z0-9]{2,5}$/i.test(p) && !p.endsWith('/')) p += '/';
  return p;
}

// grobe CTR-Erwartung je Position (organisch, mobil+desktop gemischt)
function expectedCtr(pos) {
  const t = { 5: 0.06, 6: 0.05, 7: 0.04, 8: 0.033, 9: 0.027, 10: 0.022 };
  const r = Math.round(pos);
  return t[r] || (r < 5 ? 0.08 : 0.012);
}

/** Seiten mit Platz 5–20, vielen Impressionen und CTR deutlich unter Erwartung. rows: GSC dims [page, query]. */
function pickOpportunities(rows, opts) {
  const o = Object.assign({ minImpr: 30, maxPages: 5, maxQueries: 5, exclude: [] }, opts || {});
  const pages = {};
  for (const r of rows || []) {
    const path = normPath(r.keys[0]);
    const query = r.keys[1];
    if (NEVER.includes(path) || o.exclude.includes(path)) continue;
    if (r.position < 5 || r.position > 20 || r.impressions < o.minImpr) continue;
    const exp = expectedCtr(r.position);
    if (r.ctr >= exp * 0.7) continue;
    const lost = r.impressions * (exp - r.ctr);
    const pg = pages[path] || (pages[path] = { path, impressions: 0, clicks: 0, lost: 0, queries: [] });
    pg.impressions += r.impressions; pg.clicks += r.clicks; pg.lost += lost;
    pg.queries.push({ query, impressions: r.impressions, clicks: r.clicks, position: Math.round(r.position * 10) / 10 });
  }
  return Object.values(pages)
    .sort((a, b) => b.lost - a.lost)
    .slice(0, o.maxPages)
    .map((p) => ({ ...p, lost: Math.round(p.lost * 10) / 10, queries: p.queries.sort((a, b) => b.impressions - a.impressions).slice(0, o.maxQueries) }));
}

function decode(s) {
  return String(s || '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ');
}

/** Aktueller Stand einer Seite (für den Prompt). */
function pageFacts(html) {
  const s = String(html || '');
  const pick = (re) => decode(((s.match(re) || [])[1] || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim());
  const faq = [];
  for (const m of s.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try {
      const j = JSON.parse(m[1]);
      const nodes = [].concat(j['@graph'] || j);
      for (const n of nodes) if (n && n['@type'] === 'FAQPage') for (const q of n.mainEntity || []) if (q.name) faq.push(q.name);
    } catch (e) {}
  }
  return {
    title: pick(/<title>([\s\S]*?)<\/title>/i),
    description: pick(/<meta\s+name="description"\s+content="([^"]*)"/i),
    h1: pick(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i),
    faq,
  };
}

function buildProposalPrompt(items) {
  const blocks = items.map((it, i) => [
    (i + 1) + '. SEITE ' + it.path,
    '   Title jetzt: ' + (it.current && it.current.title || '–'),
    '   Description jetzt: ' + (it.current && it.current.description || '–'),
    '   H1: ' + (it.current && it.current.h1 || '–'),
    '   FAQ vorhanden: ' + ((it.current && it.current.faq || []).join(' | ') || 'keine'),
    '   Suchbegriffe (Impr./Klicks/Pos.): ' + it.queries.map((q) => q.query + ' (' + q.impressions + '/' + q.clicks + '/' + q.position + ')').join('; '),
  ].join('\n')).join('\n\n');
  return [
    'Du bist SEO-Redakteur für liar-entertainer.com (Clown Zauberer LIAR, NRW). Die folgenden Seiten stehen bei Google auf Platz 5–20 mit vielen Impressionen, aber wenig Klicks.',
    'Schlage je Seite einen besseren Title, eine bessere Meta-Description und höchstens 2 neue FAQ-Fragen vor, die die Suchabsicht der Begriffe direkt beantworten.',
    '',
    FAKTEN,
    '',
    'REGELN:',
    '- seoTitle: max. 60 Zeichen, endet mit „| LIAR“, wichtigster Suchbegriff vorn, konkreter Nutzen. Keine Emojis.',
    '- description: 120–160 Zeichen, Nutzen + Aufforderung, keine doppelten Anführungszeichen, keine Emojis.',
    '- Preise NUR auf Seiten zum Kindergeburtstag oder /preise/. Sonst kein Preis, keine Zahl mit €.',
    '- FAQ nur, wenn eine Frage zur Suchabsicht noch fehlt; Antwort 1–3 Sätze, nur Fakten aus dem Faktenblatt. Keine Doppelung vorhandener FAQ.',
    '- Nichts erfinden. Wenn eine Seite schon gut ist, lass sie weg.',
    '- grund: ein kurzer Satz, welcher Suchbegriff damit besser bedient wird.',
    '',
    'Antworte NUR als JSON: {"proposals":[{"path":"/…/","seoTitle":"…","description":"…","faq":[{"frage":"…","antwort":"…"}],"grund":"…"}]}',
    '',
    blocks,
  ].join('\n');
}

function priceOk(path) {
  return /geburtstag/.test(path) || path.startsWith('/preise/');
}
const hasPrice = (s) => /\d+(?:,\d+)?\s?(?:€|Euro)/.test(String(s || ''));
const clean = (s) => String(s || '').replace(/\s+/g, ' ').replace(/"/g, "'").replace(/[\p{Extended_Pictographic}️‍]/gu, '').trim();

function parseProposals(text, items) {
  const raw = String(text || '');
  const a = raw.indexOf('{'), b = raw.lastIndexOf('}');
  if (a < 0 || b <= a) return [];
  let j;
  try { j = JSON.parse(raw.slice(a, b + 1)); } catch (e) { return []; }
  const allowed = new Set((items || []).map((i) => i.path));
  const seen = new Set();
  const out = [];
  for (const p of j.proposals || []) {
    const path = normPath(p.path);
    if (!allowed.has(path) || seen.has(path)) continue;
    const seoTitle = clean(p.seoTitle);
    const description = clean(p.description);
    if (!seoTitle || seoTitle.length > 62 || !/\| LIAR$/.test(seoTitle)) continue;
    if (description.length < 100 || description.length > 165) continue;
    const faq = (Array.isArray(p.faq) ? p.faq : []).map((f) => ({ frage: clean(f.frage), antwort: clean(f.antwort) })).filter((f) => f.frage && f.antwort).slice(0, 2);
    const all = [seoTitle, description].concat(faq.map((f) => f.frage + ' ' + f.antwort)).join(' ');
    if (!priceOk(path) && hasPrice(all)) continue;
    seen.add(path);
    out.push({ path, seoTitle, description, faq, grund: clean(p.grund) });
  }
  return out;
}

/** blog = n8n committet direkt (neue Artikel, nicht in der L1-Meta-Baseline); auftrag = Claude Code setzt mit Tests um. */
function routeFor(path, baselinePaths) {
  const isPost = /^\/blog\/[^/]+\/$/.test(path) && !path.startsWith('/blog/kategorie/');
  return isPost && !(baselinePaths || []).includes(path) ? 'blog' : 'auftrag';
}

function setFm(fm, key, line, after) {
  const re = new RegExp('^' + key + ':.*$', 'm');
  if (re.test(fm)) return fm.replace(re, line);
  const reA = new RegExp('^' + after + ':.*$', 'm');
  if (reA.test(fm)) return fm.replace(reA, (m) => m + '\n' + line);
  return fm + '\n' + line;
}

/** Blog-Markdown: seoTitle/description ersetzen, updatedDate setzen, FAQ ergänzen. */
function applyBlogProposal(md, p, isoDate) {
  md = String(md).replace(/\r\n/g, '\n'); // Alt-Artikel im Repo haben CRLF
  const m = String(md).match(/^---\n([\s\S]*?)\n---\n?/);
  if (!m) throw new Error('Frontmatter fehlt');
  let fm = m[1];
  fm = setFm(fm, 'seoTitle', 'seoTitle: ' + JSON.stringify(clean(p.seoTitle)), 'title');
  fm = setFm(fm, 'description', 'description: ' + JSON.stringify(clean(p.description)), 'seoTitle');
  fm = setFm(fm, 'updatedDate', 'updatedDate: ' + isoDate, 'publishDate');
  let body = String(md).slice(m[0].length);
  const faq = (p.faq || []).filter((f) => f.frage && f.antwort);
  if (faq.length) {
    const block = faq.map((f) => '### ' + f.frage + '\n\n' + f.antwort).join('\n\n');
    const h = body.match(/^##\s[^\n]*Häufige Fragen[^\n]*$/m);
    if (h) {
      const start = h.index + h[0].length;
      const nextH2 = body.slice(start).search(/^## /m);
      const end = nextH2 < 0 ? body.length : start + nextH2;
      const sec = body.slice(start, end);
      const lastQ = sec.lastIndexOf('\n### ');
      let ins;
      if (lastQ < 0) ins = start;
      else {
        const headEnd = sec.indexOf('\n', lastQ + 1);
        let k = headEnd;
        while (sec[k] === '\n') k++;
        const parEnd = sec.indexOf('\n\n', k);
        ins = start + (parEnd < 0 ? sec.replace(/\s+$/, '').length : parEnd);
      }
      body = body.slice(0, ins) + '\n\n' + block + body.slice(ins);
    } else {
      body = body.replace(/\s*$/, '') + '\n\n## ❓ Häufige Fragen\n\n' + block + '\n';
    }
  }
  return '---\n' + fm + '\n---\n' + body;
}

/** Auftrag für Claude Code (Hauptseiten / Alt-Artikel unter L1-Paritätstests). */
function auftragMarkdown(p, isoDate) {
  return [
    '# SEO-Auftrag ' + p.vid + ' – ' + p.path,
    '',
    'Freigegeben vom Inhaber am ' + isoDate + ' (Telegram, GSC-Wochenvorschlag ' + (p.woche || '') + ').',
    '',
    '## Umsetzen',
    '- Title → `' + p.seoTitle + '` (jetzt: ' + ((p.current && p.current.title) || '–') + ')',
    '- Description → `' + p.description + '`',
    ...(p.faq || []).map((f) => '- FAQ ergänzen (sichtbar + FAQPage-Schema): **' + f.frage + '** – ' + f.antwort),
    '',
    '## Warum',
    (p.grund || '') + ' Suchbegriffe: ' + (p.queries || []).map((q) => q.query + ' (' + q.impressions + ' Impr., ' + q.clicks + ' Klicks, Pos. ' + q.position + ')').join('; '),
    '',
    '## Pflicht',
    '- Abweichung in `site/tests/fixtures/meta-changes.json` bzw. `content-changes.json` und `docs/CHANGES-METAS.md` eintragen.',
    '- `npm test`, `npm run test:dist`, `npm run test:seo` grün; danach diese Datei nach `docs/seo-auftraege/erledigt/` verschieben.',
    '',
  ].join('\n');
}

function esc(s) { return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

function weeklyTelegram(props, week) {
  const head = ['🔎 <b>GSC-Vorschläge ' + esc(week) + '</b>', 'Seiten auf Platz 5–20 mit vielen Impressionen, aber wenig Klicks. Details folgen je Vorschlag.', ''];
  props.forEach((p, i) => head.push((i + 1) + '. ' + esc(p.path) + ' → ' + esc(p.seoTitle) + (p.route === 'blog' ? ' <i>(direkt)</i>' : ' <i>(Auftrag)</i>')));
  head.push('', 'Je Vorschlag ✅/❌ tippen – oder hier alle auf einmal. Offene Vorschläge verfallen nicht.');
  const items = props.map((p, i) => {
    const l = [(i + 1) + '. <b>' + esc(p.path) + '</b>' + (p.route === 'blog' ? ' · wird nach ✅ direkt geändert' : ' · nach ✅ Auftrag an Claude Code (mit Tests)')];
    l.push('🔍 ' + (p.queries || []).slice(0, 4).map((x) => esc(x.query) + ' (' + x.impressions + ' Impr., ' + x.clicks + ' Kl., Pos. ' + x.position + ')').join(', '));
    l.push('Title: <s>' + esc((p.current && p.current.title) || '–') + '</s>');
    l.push('→ <b>' + esc(p.seoTitle) + '</b>');
    l.push('Desc: ' + esc(p.description));
    for (const f of p.faq || []) l.push('❓ ' + esc(f.frage) + ' – ' + esc(f.antwort));
    if (p.grund) l.push('💡 ' + esc(p.grund));
    return { vid: p.vid, text: l.join('\n').slice(0, 3900) };
  });
  return { header: head.join('\n').slice(0, 3900), items };
}

function isoWeek(d) {
  const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const y0 = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  const w = Math.ceil(((t - y0) / 86400000 + 1) / 7);
  return t.getUTCFullYear() + '-W' + String(w).padStart(2, '0');
}

// ---------- Monatsbericht ----------
const TARGET_PREFIXES = ['/kindergeburtstag/', '/kinderzauberer/', '/preise/', '/clown/', '/zauberer/'];
const isTarget = (p) => p === '/' || TARGET_PREFIXES.some((x) => p.startsWith(x));

function parsePost(slug, md) {
  md = String(md || '').replace(/\r\n/g, '\n'); // Alt-Artikel im Repo haben CRLF
  const m = String(md || '').match(/^---\n([\s\S]*?)\n---/);
  if (!m) return null;
  const fm = m[1];
  if (/^draft:\s*true\s*$/m.test(fm)) return null;
  const get = (k) => { const x = fm.match(new RegExp('^' + k + ':\\s*(.*)$', 'm')); return x ? x[1].trim().replace(/^["']|["']$/g, '') : ''; };
  const body = String(md).slice(m[0].length);
  const links = [];
  for (const l of body.matchAll(/(!?)\[[^\]]*\]\(([^)\s]+)\)/g)) {
    if (l[1]) continue;
    if (!/^\/|^https?:\/\/(www\.)?liar-entertainer\.com/i.test(l[2])) continue;
    const p = normPath(l[2]);
    if (isTarget(p) && !links.includes(p)) links.push(p);
  }
  return { slug, path: '/blog/' + slug + '/', title: get('title'), publishDate: get('publishDate').slice(0, 10), links };
}

function daysBetween(a, b) { return Math.round((new Date(b) - new Date(a)) / 86400000); }

/**
 * gscPage: GSC dims [page] (90 Tage), gscPageQuery: dims [page, query] (90 Tage), ga4: [{path, sessions, keyEvents}] (90 Tage, Einstiegsseite).
 * Urteil: zu neu (< 60 Tage) · ohne Wirkung (≥ 90 Tage, < 5 Klicks, < 20 Sitzungen, 0 Anfragen) · wirkt.
 */
function monthlyReport(o) {
  const gsc = {};
  for (const r of o.gscPage || []) gsc[normPath(r.keys[0])] = r;
  const ga = {};
  for (const r of o.ga4 || []) { const p = normPath(r.path); const g = ga[p] || (ga[p] = { sessions: 0, keyEvents: 0 }); g.sessions += Number(r.sessions) || 0; g.keyEvents += Number(r.keyEvents) || 0; }
  const behalten = new Set(o.behalten || []);
  const rows = (o.posts || []).map((p) => {
    const g = gsc[p.path] || {};
    const a = ga[p.path] || { sessions: 0, keyEvents: 0 };
    const alterTage = daysBetween(p.publishDate, o.today);
    const klicks = g.clicks || 0;
    let urteil = 'wirkt';
    if (alterTage < 60) urteil = 'zu neu';
    else if (alterTage >= 90 && klicks < 5 && a.sessions < 20 && a.keyEvents === 0) urteil = 'ohne Wirkung';
    return { slug: p.slug, path: p.path, title: p.title, alterTage, klicks, impressionen: g.impressions || 0,
      position: g.position ? Math.round(g.position * 10) / 10 : null, sitzungen: a.sessions, anfragen: a.keyEvents, urteil, ziel: (p.links || [])[0] || '' };
  }).sort((x, y) => y.klicks - x.klicks || y.impressionen - x.impressionen);
  const ohneWirkung = rows.filter((r) => r.urteil === 'ohne Wirkung' && !behalten.has(r.slug));
  // Kannibalisierung: gleiche Suche, Artikel und Leistungsseite je ≥ 10 Impressionen, Artikel nicht klar hinter der Seite (≤ 3 Plätze)
  const byQuery = {};
  for (const r of o.gscPageQuery || []) {
    const p = normPath(r.keys[0]);
    (byQuery[r.keys[1]] || (byQuery[r.keys[1]] = [])).push({ p, impressions: r.impressions, position: r.position });
  }
  const postPaths = new Set((o.posts || []).map((p) => p.path));
  const kannibal = [];
  for (const [query, list] of Object.entries(byQuery)) {
    const arts = list.filter((x) => postPaths.has(x.p) && x.impressions >= 10);
    const pages = list.filter((x) => isTarget(x.p) && x.impressions >= 10);
    for (const a of arts) for (const s of pages) {
      if (a.position <= s.position + 3) kannibal.push({ query, artikel: a.p, artikelPos: Math.round(a.position * 10) / 10, seite: s.p, seitePos: Math.round(s.position * 10) / 10, impressionen: a.impressions + s.impressions });
    }
  }
  kannibal.sort((x, y) => y.impressionen - x.impressionen);
  return { rows, ohneWirkung, kannibal: kannibal.slice(0, 10) };
}

const STOP = new Set(['einen', 'einer', 'eines', 'für', 'fuer', 'beim', 'oder', 'und', 'mit', 'dem', 'den', 'der', 'die', 'das', 'zum', 'zur', 'ein', 'eine', 'was', 'wie', 'auf', 'von', 'tipps', 'ideen']);
const words = (s) => new Set(String(s || '').toLowerCase().replace(/[^a-zäöüß0-9 ]/g, ' ').split(/\s+/).filter((w) => w.length >= 4 && !STOP.has(w)));

/** Offene Themen aus liar_themen, die dem Artikel inhaltlich gleichen (≥ 2 gemeinsame Wörter). */
function similarThemes(title, themes) {
  const t = words(title);
  return (themes || []).filter((x) => String(x.status || '') === 'offen')
    .filter((x) => [...words(x.titel || x.thema || '')].filter((w) => t.has(w)).length >= 2)
    .map((x) => x.id);
}

function monthlyTelegram(r) {
  const n = (x) => Number(x || 0).toLocaleString('de-DE');
  const lines = ['📊 <b>Monatsbericht Blog ' + esc(r.monat) + '</b> (letzte 90 Tage, GSC + GA4; Anfragen = Schlüsselereignisse nach Einstieg über den Artikel)', ''];
  for (const x of r.rows.slice(0, 25)) {
    const icon = x.urteil === 'wirkt' ? '🟢' : x.urteil === 'zu neu' ? '⚪' : '🔴';
    lines.push(icon + ' ' + esc(String(x.title).slice(0, 60)) + ' – ' + n(x.klicks) + ' Kl. · ' + n(x.impressionen) + ' Impr.' + (x.position ? ' · Pos. ' + x.position : '') + ' · ' + n(x.sitzungen) + ' Sitz. · ' + n(x.anfragen) + ' Anfr.');
  }
  if (r.kannibal.length) {
    lines.push('', '⚠️ <b>Kannibalisierung</b> (Artikel konkurriert mit Leistungsseite):');
    for (const k of r.kannibal.slice(0, 6)) lines.push('• „' + esc(k.query) + '“: ' + esc(k.artikel) + ' (Pos. ' + k.artikelPos + ') vs. ' + esc(k.seite) + ' (Pos. ' + k.seitePos + ')');
  }
  if (r.ohneWirkung.length) lines.push('', '🔴 ' + r.ohneWirkung.length + ' Artikel ohne Wirkung – Entscheidung je Artikel folgt.');
  else lines.push('', 'Keine Artikel ohne Wirkung. 👍');
  const items = r.ohneWirkung.map((x) => ({ vid: x.vid, text: [
    '🔴 <b>' + esc(x.title) + '</b> (ohne Wirkung)',
    n(x.klicks) + ' Klicks · ' + n(x.sitzungen) + ' Sitzungen · ' + n(x.anfragen) + ' Anfragen in 90 Tagen',
    'Zielseite: ' + esc(x.ziel || '–'),
    '',
    '🔀 Zusammenführen = 301 auf die Zielseite (Auftrag an Claude Code) · 📌 Behalten = 90 Tage Ruhe · 🗑 Themen = ähnliche offene Themen im Plan streichen',
  ].join('\n') }));
  return { text: lines.join('\n').slice(0, 3900), items };
}

function mergeAuftragMarkdown(x, isoDate) {
  return [
    '# Zusammenführen ' + x.vid + ' – ' + x.path,
    '',
    'Freigegeben vom Inhaber am ' + isoDate + ' (Telegram, Monatsbericht ' + (x.monat || '') + '): Artikel ohne Wirkung (' + x.klicks + ' Klicks, ' + x.sitzungen + ' Sitzungen, ' + x.anfragen + ' Anfragen in 90 Tagen).',
    '',
    '## Umsetzen',
    '- Brauchbare Inhalte (Fakten, FAQ) in ' + (x.ziel || 'die passende Leistungsseite') + ' übernehmen – nur, wenn dort noch nicht vorhanden; sonst nichts übernehmen.',
    '- 301 `' + x.path + '` → `' + (x.ziel || '/') + '` in `site/public/_redirects`, Artikel löschen (Sitemap, Footer-News und Blog-Liste aktualisieren sich selbst).',
    '- Tests anpassen, falls der Artikel dort fest erwartet wird (`tests/dist/blog.test.ts`, URL-Vertrag nur bei Alt-Artikeln: dann 301 dokumentieren).',
    '- `npm test`, `npm run test:dist`, `npm run test:seo` grün; Datei danach nach `docs/seo-auftraege/erledigt/`.',
    '',
  ].join('\n');
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { FAKTEN, normPath, expectedCtr, pickOpportunities, pageFacts, buildProposalPrompt, parseProposals, routeFor,
    applyBlogProposal, auftragMarkdown, weeklyTelegram, isoWeek, parsePost, monthlyReport, similarThemes, monthlyTelegram, mergeAuftragMarkdown };
}
