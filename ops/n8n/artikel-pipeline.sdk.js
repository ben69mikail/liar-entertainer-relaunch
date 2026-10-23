// n8n-Workflow „LIAR-2026-08 Artikel-Pipeline“ (Jic8HX0mrK14T6Zv) als Workflow-SDK-Quelle.
// <SOCIAL_SECRET> vor dem Hochladen durch das Secret des Social-Post-Webhooks ersetzen (nicht ins Repo).
// Code-Knoten aus ops/n8n/*-lib.cjs (Recherche, GitHub-Commit, Titelbild-Fokus). Tests: node --test ops/n8n/research.test.mjs ops/n8n/github-commit.test.mjs ops/n8n/focus.test.mjs
import { workflow, node, trigger, sticky, ifElse } from '@n8n/workflow-sdk';

const TG = { telegramApi: { id: 'NLiyAfhaGJ1NrflC', name: 'Telegram account' } };
const OR = { openRouterApi: { id: 'h1uhmQinQ2Z6yjPj', name: 'OpenRouter account' } };
const GM = { gmailOAuth2: { id: 'HZ5YPJTqnDsiHywa', name: 'Gmail account' } };
const GH = { githubApi: { id: 'UdnLtJujy5mHGq0R', name: 'GitHub LIAR (relaunch)' } };
const CHAT = '2106974057';
const DT_BILDER = { __rl: true, mode: 'id', value: '4hRJM2NtafmpsFxz', cachedResultName: 'liar_bilder' };
const DT_THEMEN = { __rl: true, mode: 'id', value: 's1pqYJeqlI6NEJaR', cachedResultName: 'liar_themen' };
const GD = { googleDriveOAuth2Api: { id: 'IRu8IiZVMpTzIce2', name: 'Google Drive account' } };
const REPO = 'https://api.github.com/repos/ben69mikail/liar-entertainer-relaunch';

const fromTopicMaster = trigger({
  type: 'n8n-nodes-base.executeWorkflowTrigger', version: 1.1,
  config: { name: 'Topic-Master ruft auf', position: [0, 200], parameters: { inputSource: 'passthrough' } },
  output: [{ mode: 'eigenes', user_topic_text: 'Notiz', user_photos: '[]' }]
});
const manualTest = trigger({
  type: 'n8n-nodes-base.manualTrigger', version: 1,
  config: { name: 'Manuell testen', position: [0, 420] }, output: [{}]
});
const testData = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Testdaten', position: [200, 420], parameters: { jsCode: "return [{ json: {\n  mode: 'eigenes',\n  is_test: true,\n  user_topic_text: 'TESTLAUF – bitte am Ende auf Abbrechen klicken. Am Samstag, 15. November 2026, zaubere ich um 15 Uhr beim Herbstfest im Stadtteilzentrum Gladbeck-Brauck. Eintritt frei, Zaubershow für Kinder ab 4 Jahren, ca. 40 Minuten.',\n  user_photos: '[]'\n} }];\n" } },
  output: [{ mode: 'eigenes', is_test: true, user_topic_text: 'Test', user_photos: '[]' }]
});
const input = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Eingang pruefen', position: [420, 300], parameters: { jsCode: "const d = $input.first().json;\nconst mode = d.mode === 'plan' ? 'plan' : 'eigenes';\nlet thema = d.thema;\nif (typeof thema === 'string') { try { thema = JSON.parse(thema); } catch (e) { thema = null; } }\nlet text = String(d.user_topic_text || '').trim();\nif (mode === 'plan') {\n  if (!thema || !thema.titel) throw new Error('Plan-Modus ohne Thema (thema.titel fehlt).');\n  text = 'Arbeitstitel: ' + thema.titel + '\\nKeywords: ' + (thema.keywords || '') + '\\nZiel-Seite (muss verlinkt werden): ' + (thema.ziel_url || '') + '\\nKategorie: ' + (thema.kategorie || '') + (thema.notiz ? '\\nHinweis: ' + thema.notiz : '') + (thema.fakten ? '\\nFakten vom Inhaber: ' + thema.fakten : '');\n}\nif (!text) throw new Error('Kein Thema: user_topic_text ist leer.');\nlet photos = d.user_photos;\nif (typeof photos === 'string') { try { photos = JSON.parse(photos); } catch (e) { photos = []; } }\nif (!Array.isArray(photos)) photos = [];\nphotos = photos.filter(p => p && (p.tg_file_id || p.drive_id)).slice(0, 3)\n  .map(p => p.drive_id ? { src: 'drive', drive_id: p.drive_id, beschreibung: p.beschreibung || '', benutzt_anzahl: Number(p.benutzt_anzahl) || 0 } : { src: 'tg', tg_file_id: p.tg_file_id });\nconst iso = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Berlin' });\nconst todayDe = new Date().toLocaleDateString('de-DE', { timeZone: 'Europe/Berlin', weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });\nreturn [{ json: { mode, thema: thema || null, topic_text: text, photos, iso, today_de: todayDe, is_test: d.is_test === true } }];\n" } },
  output: [{ mode: 'eigenes', topic_text: 'Notiz', photos: [], iso: '2026-10-21', today_de: 'Mittwoch', is_test: false }]
});
const poolRead = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Bildpool lesen', position: [530, 480], alwaysOutputData: true, executeOnce: true,
    parameters: { resource: 'row', operation: 'get', dataTableId: DT_BILDER, returnAll: true } },
  output: [{ id: 1, drive_id: 'x', tags: 'kita' }]
});
const pickImages = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Bilder auswählen', position: [640, 300], parameters: { jsCode: "// Bilder aus dem Pool waehlen, wenn keine Fotos mitgeschickt wurden (REGELN §3)\nconst p = $('Eingang pruefen').first().json;\nif (p.photos.length) return [{ json: { ...p, pool_note: '' } }];\nconst seen = new Set();\nconst rows = $input.all().map(i => i.json).filter(r => r && r.drive_id && r.aktiv !== false && !seen.has(r.drive_id) && seen.add(r.drive_id));\nif (!rows.length) return [{ json: { ...p, pool_note: 'Bildpool leer – Fallback-Bild wird genutzt.' } }];\nconst d = new Date(p.iso + 'T12:00:00');\nconst qStart = new Date(d.getFullYear(), Math.floor(d.getMonth() / 3) * 3, 1).toLocaleDateString('sv-SE');\nconst text = (p.topic_text + ' ' + (p.thema ? (p.thema.ziel_url || '') : '')).toLowerCase();\nconst SYN = {\n  kindergeburtstag: ['geburtstag', 'party'], zaubershow: ['zauber', 'show', 'magie', 'trick'], clown: ['clown'],\n  zauberer: ['zauber', 'magier'], ballon: ['ballon'], 'glitzer-tattoo': ['glitzer', 'tattoo'], kita: ['kita', 'kindergarten', 'martin', 'laterne'],\n  schule: ['schule', 'ogs', 'klasse', 'einschulung'], sommerfest: ['sommer', 'gemeindefest', 'stadtfest', 'fest'], strassenfest: ['straße', 'strassen', 'markt'],\n  hochzeit: ['hochzeit', 'braut'], firmenfeier: ['firma', 'firmen', 'betrieb', 'mitarbeiter', 'messe'], weihnachtsfeier: ['weihnacht', 'advent', 'nikolaus', 'silvester'],\n  'close-up': ['close-up', 'close up', 'karten'], tischzauberei: ['tisch', 'dinner', 'empfang'], buehne: ['bühne', 'buehne', 'gala'],\n  pantomime: ['pantomime', 'mime'], karneval: ['karneval', 'fasching', 'kostüm', 'halloween'], 'walk-act': ['walk', 'walking'],\n  kinder: ['kinder', 'kind', 'familie', 'eltern'], erwachsene: ['erwachsene', 'firma', 'hochzeit', 'gala', 'dinner'], publikum: ['publikum', 'gäste', 'zuschauer']\n};\nconst want = new Set(Object.entries(SYN).filter(([, ws]) => ws.some(w => text.includes(w))).map(([t]) => t));\nconst wantNews = /zeitung|presse/.test(text);\nconst scored = rows\n  .filter(r => !(r.zuletzt_benutzt && String(r.zuletzt_benutzt) >= qStart))\n  .filter(r => wantNews || !r.zeitung)\n  .map(r => {\n    const tags = String(r.tags || '').split(',').map(t => t.trim()).filter(Boolean);\n    const hit = tags.filter(t => want.has(t)).length;\n    return { r, hit, s: hit * 10 - (Number(r.benutzt_anzahl) || 0) * 2 + Math.random() * 3 };\n  })\n  .sort((a, b) => b.s - a.s);\nif (!scored.length) return [{ json: { ...p, pool_note: 'Alle Pool-Fotos wurden dieses Quartal schon genutzt – Fallback-Bild. Bitte neue Fotos in den Drive-Ordner legen.' } }];\nconst ratio = r => (r.breite && r.hoehe) ? r.breite / r.hoehe : 1.33;\nconst coverOk = x => !x.r.nur_blog && !x.r.zeitung && x.r.kinder !== 'nah' && ratio(x.r) >= 0.8 && ratio(x.r) <= 1.91;\nconst cover = scored.find(x => coverOk(x) && x.hit > 0) || scored.find(coverOk) || scored[0];\nconst rest = scored.filter(x => x !== cover && x.hit > 0).slice(0, 2);\nconst pick = [cover, ...rest];\nconst photos = pick.map(x => ({ src: 'drive', drive_id: x.r.drive_id, beschreibung: x.r.beschreibung || '', alt: x.r.alt || '', benutzt_anzahl: Number(x.r.benutzt_anzahl) || 0, kinder: x.r.kinder || '' }));\nconst note = cover.hit === 0 ? 'Kein Pool-Foto passt genau zum Thema – bitte Fotos prüfen (Tipp: passende Fotos in den Drive-Ordner legen).' : '';\nreturn [{ json: { ...p, photos, pool_note: note } }];\n" } },
  output: [{ mode: 'eigenes', topic_text: 'Notiz', photos: [], pool_note: '' }]
});
const tgStart = node({
  type: 'n8n-nodes-base.telegram', version: 1.2,
  config: { name: 'Telegram: Start', position: [640, 300], credentials: TG, onError: 'continueRegularOutput',
    parameters: { resource: 'message', operation: 'sendMessage', chatId: CHAT,
      text: "={{ ($json.is_test ? '🧪 TESTLAUF – ' : '') + '✍️ Ich schreibe den ' + ($json.mode === 'plan' ? 'Montags-Artikel „' + $json.thema.titel + '“' : 'Artikel') + ' (' + $json.photos.length + ' Foto(s)' + ($json.photos.length && $json.photos[0].src === 'drive' ? ' aus dem Bildpool' : '') + '). Vorschau kommt in ca. 3 Minuten.' }}",
      additionalFields: { appendAttribution: false } } },
  output: [{ ok: true }]
});
const pages = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Leistungsseiten holen', position: [860, 300], parameters: { jsCode: "const p = $('Bilder auswählen').first().json;\nconst URLS = [\n  'https://liar-entertainer.com/kindergeburtstag/',\n  'https://liar-entertainer.com/zauberer/zaubershow/',\n  'https://liar-entertainer.com/clown/clownshow/',\n  'https://liar-entertainer.com/preise/',\n  'https://liar-entertainer.com/ueber-mich/'\n];\nconst h = this.helpers;\nconst parts = await Promise.all(URLS.map(async (u) => {\n  try {\n    const html = String(await h.httpRequest({ method: 'GET', url: u, json: false, headers: { 'User-Agent': 'Mozilla/5.0 (n8n-liar)' } }));\n    const m = html.match(/<main[\\s\\S]*?<\\/main>/i);\n    const txt = (m ? m[0] : html)\n      .replace(/<script[\\s\\S]*?<\\/script>/gi, ' ')\n      .replace(/<style[\\s\\S]*?<\\/style>/gi, ' ')\n      .replace(/<[^>]+>/g, ' ')\n      .replace(/&nbsp;/g, ' ')\n      .replace(/\\s+/g, ' ')\n      .trim()\n      .slice(0, 2500);\n    return '### ' + u + '\\n' + txt;\n  } catch (e) {\n    return '### ' + u + '\\n(nicht geladen)';\n  }\n}));\nreturn [{ json: { ...p, leistungs_corpus: parts.join('\\n\\n') } }];\n" } },
  output: [{ leistungs_corpus: '...' }]
});
const ifSpontan = ifElse({
  version: 2.2,
  config: { name: 'Spontan-Artikel?', position: [970, 300],
    parameters: { conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'strict' },
      conditions: [{ id: 'sp1', leftValue: '={{ $json.mode }}', rightValue: 'eigenes', operator: { type: 'string', operation: 'equals' } }],
      combinator: 'and' }, options: {} } }
});
const researchPrep = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Recherche vorbereiten', position: [970, 120], parameters: { jsCode: "// Recherche-Auftrag für Spontan-Artikel (Websuche über OpenRouter)\nconst p = $input.first().json;\nconst schema = '{\"orte\":[{\"name\":\"\",\"adresse\":\"Straße Nr, PLZ Ort\",\"parken\":\"kurz: Parkplätze/Parkhaus/ÖPNV\",\"quelle\":\"https://…\"}],\"termin\":{\"datum\":\"TT.MM.JJJJ\",\"uhrzeit\":\"\",\"quelle\":\"https://…\"},\"fakten\":[{\"text\":\"kurzer Fakt\",\"quelle\":\"https://…\"}],\"widersprueche\":[\"…\"],\"quellen\":[{\"titel\":\"\",\"url\":\"https://…\"}]}';\nconst prompt = [\n  'Du recherchierst im Internet für einen Blogartikel von Clown Zauberer LIAR (Michaël Prescler, Gladbeck, NRW). Heute ist ' + p.today_de + ' (' + p.iso + ').',\n  '',\n  'NOTIZ DES INHABERS:',\n  '\"\"\"', p.topic_text, '\"\"\"',\n  '',\n  'AUFGABE:',\n  '1. Finde die in der Notiz genannten Orte (Location, Halle, Kita, Schule, Fest, Stadt) und Veranstaltungen. Recherchiere nichts über LIAR selbst.',\n  '2. Für jeden Ort: offizieller Name, genaue Anschrift, Parkmöglichkeiten bzw. ÖPNV.',\n  '3. Für die Veranstaltung: öffentlich angekündigtes Datum und Uhrzeit, Veranstalter, Eintritt – nur wenn eine Seite es nennt.',\n  '4. Höchstens 5 kurze Fakten, die Eltern/Besucher wirklich helfen (z. B. Barrierefreiheit, Einlass, Programm).',\n  '5. Nimm in \"quellen\" auch Seiten auf, die ein Plakat/Flyer der Veranstaltung oder Fotos der Location zeigen (offizielle Seite, Veranstalter, Stadt, Presse).',\n  '6. Nur Angaben, die eine geöffnete Seite belegt; \"quelle\" ist immer die exakte URL. Bevorzuge offizielle Seiten (Stadt, Location, Veranstalter) vor Ticket- und Freizeitportalen.',\n  '7. Die Angaben des Inhabers in der Notiz (Uhrzeit, Eintritt, Programm) sind gesetzt und brauchen keine Bestätigung – nicht anzweifeln, nicht kommentieren.',\n  '8. \"widersprueche\" nur, wenn sich zwei Quellen in einer Angabe zu Ort/Anreise widersprechen (kurz: was sagt welche Quelle). Keine Hinweise, Anmerkungen oder Fehlanzeigen dort. Nennt die Notiz keinen Ort und keine Veranstaltung, gib leere Listen zurück.',\n  '',\n  'Antworte NUR mit diesem JSON (kein Text davor oder danach): ' + schema\n].join('\\n');\nreturn [{ json: { ...p, research_prompt: prompt } }];\n" } },
  output: [{ research_prompt: 'p' }]
});
const researchCall = node({
  type: 'n8n-nodes-base.httpRequest', version: 4.2,
  config: { name: 'Web-Recherche (Internet)', position: [1080, 120], credentials: OR, onError: 'continueRegularOutput',
    parameters: { method: 'POST', url: 'https://openrouter.ai/api/v1/chat/completions',
      authentication: 'predefinedCredentialType', nodeCredentialType: 'openRouterApi',
      sendHeaders: true, headerParameters: { parameters: [{ name: 'HTTP-Referer', value: 'https://liar-entertainer.com' }, { name: 'X-Title', value: 'LIAR Recherche' }] },
      sendBody: true, specifyBody: 'json',
      jsonBody: "={{ JSON.stringify({ model: 'anthropic/claude-haiku-5.5', max_tokens: 4000, tools: [{ type: 'openrouter:web_search' }], messages: [ { role: 'user', content: $json.research_prompt } ] }) }}",
      options: { timeout: 180000, response: { response: { fullResponse: true, neverError: true, responseFormat: 'json' } } } } },
  output: [{ statusCode: 200, body: { choices: [{ message: { content: '{}' } }] } }]
});
const researchEval = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Recherche auswerten', position: [1190, 120], parameters: { jsCode: "// Web-Recherche für Spontan-Artikel: Auswertung der Modell-Antwort, Bildfunde, Prompt-Block.\n// Wird von build.py in die n8n-Code-Knoten „Recherche auswerten“ eingefügt (ohne require/import).\n\nfunction safeUrl(u) {\n  const s = String(u || '').trim();\n  return /^https?:\\/\\/[^\\s\"'<>]+$/i.test(s) ? s : '';\n}\n\nfunction parseResearch(text) {\n  const empty = { ok: false, orte: [], termin: { datum: '', uhrzeit: '', quelle: '' }, fakten: [], widersprueche: [], quellen: [], bilder: [] };\n  const raw = String(text || '');\n  const start = raw.indexOf('{');\n  const end = raw.lastIndexOf('}');\n  if (start < 0 || end <= start) return empty;\n  let j;\n  try { j = JSON.parse(raw.slice(start, end + 1)); } catch (e) { return empty; }\n  const str = (v) => String(v || '').replace(/\\s+/g, ' ').trim();\n  const orte = (Array.isArray(j.orte) ? j.orte : [])\n    .map(o => ({ name: str(o.name), adresse: str(o.adresse), parken: str(o.parken), quelle: safeUrl(o.quelle) }))\n    .filter(o => o.name && o.quelle);\n  const t = j.termin || {};\n  const termin = { datum: str(t.datum), uhrzeit: str(t.uhrzeit), quelle: safeUrl(t.quelle) };\n  if (!termin.quelle) { termin.datum = ''; termin.uhrzeit = ''; }\n  const fakten = (Array.isArray(j.fakten) ? j.fakten : [])\n    .map(f => ({ text: str(f.text), quelle: safeUrl(f.quelle) }))\n    .filter(f => f.text && f.quelle);\n  const widersprueche = (Array.isArray(j.widersprueche) ? j.widersprueche : []).map(str).filter(Boolean);\n  const seen = new Set();\n  const quellen = (Array.isArray(j.quellen) ? j.quellen : [])\n    .map(q => ({ titel: str(q.titel) || 'Quelle', url: safeUrl(q.url) }))\n    .filter(q => q.url && !seen.has(q.url) && seen.add(q.url));\n  for (const u of [...orte.map(o => o.quelle), ...fakten.map(f => f.quelle), termin.quelle]) {\n    if (u && !seen.has(u)) { seen.add(u); quellen.push({ titel: 'Quelle', url: u }); }\n  }\n  const ok = orte.length + fakten.length + (termin.datum ? 1 : 0) > 0;\n  return { ok, orte, termin, fakten, widersprueche, quellen, bilder: [] };\n}\n\nfunction extractImages(html, pageUrl) {\n  const out = [];\n  const seen = new Set();\n  const re = /<meta[^>]+(?:property|name)=[\"'](?:og:image(?::url)?|twitter:image(?::src)?)[\"'][^>]*>/gi;\n  const tags = String(html || '').match(re) || [];\n  for (const tag of tags) {\n    const m = tag.match(/content=[\"']([^\"']+)[\"']/i);\n    if (!m) continue;\n    let url;\n    try { url = new URL(m[1].replace(/&amp;/g, '&'), pageUrl).href; } catch (e) { continue; }\n    if (!/^https?:/i.test(url)) continue;\n    const path = url.split('?')[0].toLowerCase();\n    if (!/\\.(jpe?g|png|webp)$/.test(path)) continue;\n    if (/(logo|icon|favicon|sprite|placeholder|avatar|default|standard|fallback|vorschaubild|share-image|og-default)/.test(path)) continue;\n    if (seen.has(url)) continue;\n    seen.add(url);\n    out.push({ url, seite: pageUrl });\n  }\n  return out;\n}\n\nfunction researchBlock(r, isoDate) {\n  if (!r || !r.ok) return '';\n  const lines = ['RECHERCHE IM INTERNET (Stand ' + isoDate + ') – nur diese Angaben zusätzlich zur Notiz verwenden, Notiz des Inhabers hat Vorrang:'];\n  for (const o of r.orte) {\n    lines.push('- Ort: ' + o.name + (o.adresse ? ', Adresse: ' + o.adresse : '') + (o.parken ? ', Parken: ' + o.parken : '') + ' (Quelle: ' + o.quelle + ')');\n  }\n  if (r.termin && r.termin.datum) lines.push('- Termin: ' + r.termin.datum + (r.termin.uhrzeit ? ', ' + r.termin.uhrzeit : '') + ' (Quelle: ' + r.termin.quelle + ')');\n  for (const f of r.fakten) lines.push('- ' + f.text + ' (Quelle: ' + f.quelle + ')');\n  for (const w of r.widersprueche) lines.push('- Widersprüchlich, nicht als sicher darstellen: ' + w);\n  return lines.join('\\n');\n}\n\nfunction researchSummary(r) {\n  if (!r) return '';\n  const n = (k, one, many) => k + ' ' + (k === 1 ? one : many);\n  return n(r.orte.length, 'Ort', 'Orte') + ', ' + n(r.fakten.length, 'Fakt', 'Fakten') + ', ' +\n    n(r.quellen.length, 'Quelle', 'Quellen') + ', ' + n((r.bilder || []).length, 'Bildfund', 'Bildfunde');\n}\n\nif (typeof module !== 'undefined' && module.exports) {\n  module.exports = { safeUrl, parseResearch, extractImages, researchBlock, researchSummary };\n}\n\n// --- Auswertung (n8n) ---\nconst p = $('Recherche vorbereiten').first().json;\nconst resp = $input.first().json;\nconst api = resp.body || resp;\nconst txt = (api && api.choices && api.choices[0] && api.choices[0].message && api.choices[0].message.content) || '';\nconst r = parseResearch(txt);\nif (!txt) r.fehler = 'Recherche nicht erreichbar (HTTP ' + (resp.statusCode || '?') + ')';\nconst bilder = [];\nfor (const q of r.quellen.slice(0, 6)) {\n  try {\n    const html = await this.helpers.httpRequest({ method: 'GET', url: q.url, timeout: 8000, json: false, headers: { 'User-Agent': 'Mozilla/5.0 (compatible; LIAR-Blog-Recherche)' } });\n    for (const b of extractImages(String(html).slice(0, 400000), q.url)) if (!bilder.some(x => x.url === b.url)) bilder.push(b);\n  } catch (e) {}\n}\nr.bilder = bilder.slice(0, 4);\nconst out = { ...p, research: r, research_block: researchBlock(r, p.iso) };\ndelete out.research_prompt;\nreturn [{ json: out }];\n" } },
  output: [{ research: { ok: false }, research_block: '' }]
});
const prompt = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Prompt bauen', position: [1080, 300], parameters: { jsCode: "const p = $input.first().json;\nconst plan = p.mode === 'plan';\nconst nInline = Math.min(p.photos.length, 2);\nconst FAKTEN = [\n  'FAKTENBLATT (einzige Quelle – nichts darüber hinaus behaupten):',\n  '- Michaël Prescler, als „Clown Zauberer LIAR“, Beethovenstr. 15, 45966 Gladbeck (NRW). Telefon +49 172 1517578, info@liar-entertainer.com, https://liar-entertainer.com',\n  '- Hauptberuflich seit 2009, über 400 Auftritte pro Jahr, 5,0 Sterne bei 390+ Google-Bewertungen, pädagogische Ausbildung, erweitertes polizeiliches Führungszeugnis und Haftpflichtversicherung. Aus Frankreich, seit 2004 in Gladbeck.',\n  '- Shows auf Deutsch; auf Wunsch Französisch, Englisch, Spanisch (Erwachsenen-Bühnenshow nicht Spanisch).',\n  '- Kindershow ca. 40 Min., Erwachsenen-Bühnenshow ca. 30 Min. Kindergeburtstage Mo–Do ab 13 Uhr, Kitas/Schulen vormittags ab 8 Uhr.',\n  '- PREISE NUR im Zusammenhang Kindergeburtstag: Zaubershow 150 € Festpreis (40 Min., bis ca. 12 Kinder, ab 4 J.), + Ballonmodellage 20 €, + Glitzer-Tattoos 40 €, Komplett-Paket 210 €, Fahrtkosten 0,40 €/km ab Gladbeck. Alles andere (Kita, Schule, Feste, Firmen, Hochzeit, Walk-Act): „auf Anfrage“.',\n  '- Glitzer-Tattoos nur als Zusatz zur Zaubershow (privat), nie einzeln. Ballonmodellage nur mit Zaubershow oder Walk-Act ab 3 Std.',\n  '- Keine Mitgliedschaften, keine Auszeichnungen, keine Firmennamen als Referenz nennen. Keine Rabatte, keine Gratis-Zugaben.',\n  '- Wichtige URLs: /kindergeburtstag/, /kinderzauberer/, /zauberer/zaubershow/, /zauberer/zaubershow/kindergarten-kita/, /zauberer/zaubershow/schule/, /zauberer/zaubershow/strassen-sommer-fest/, /clown/clownshow/, /clown/ballonmodellage/, /zauberer/, /zauberer/firmenfeier/, /zauberer/hochzeit/, /preise/, /kontakt/'\n].join('\\n');\nconst system = [\n  plan ? 'Du schreibst für den Blog von Clown Zauberer LIAR (liar-entertainer.com) einen SEO-Ratgeberartikel zu einem Thema aus dem Redaktionsplan. Zielgruppe: Eltern, Kitas/Schulen, Veranstalter und Firmen in NRW (Umkreis Gladbeck/Ruhrgebiet).' : 'Du schreibst für den Blog von Clown Zauberer LIAR (liar-entertainer.com) einen Artikel aus einer spontanen Notiz des Inhabers (Sprachnachricht/Text) – meist ein Auftritt, eine Veranstaltung oder ein Erlebnis.',\n  '',\n  FAKTEN,\n  '',\n  'REGELN:',\n  '1. Ich-Form (Michaël), warm, konkret, ehrlich, aus der Praxis. Keine Werbefloskeln, keine Superlative ohne Beleg.',\n  plan ? '2. Nur Fakten aus dem Faktenblatt und allgemein gültiges Wissen. Erfinde keine konkreten Auftritte, Termine, Orte, Kundenstimmen, Zitate oder Zahlen. Praxis-Tipps aus Sicht des Künstlers sind erwünscht, aber ohne erfundene Einzelfälle.' : '2. Nur Fakten aus der Notiz, dem Faktenblatt und dem Abschnitt RECHERCHE IM INTERNET (falls vorhanden). Die Notiz des Inhabers hat immer Vorrang. Erfinde keine Orte, Uhrzeiten, Veranstalter, Zitate, Zahlen oder Details. Fehlt etwas (z. B. Uhrzeit), lass es weg. Recherche-Angaben wie Anschrift, Parken oder ÖPNV übernimmst du in einen kurzen Abschnitt zur Anreise, mit dem Hinweis „(Stand: ' + p.iso.slice(0, 7).split('-').reverse().join('/') + ', ohne Gewähr)“ und einem externen Link auf die Quelle mit beschreibendem Ankertext, z. B. [Infos der Stadt Gladbeck](https://…). Höchstens 2 externe Links. Als widersprüchlich markierte Angaben formulierst du vorsichtig („bitte vorab prüfen“) oder lässt sie weg.',\n  '3. Antwort zuerst: Der erste Absatz sagt sofort was, wann, wo (bei Ankündigungen) bzw. worum es geht.',\n  (plan ? '4. Länge 800–1200 Wörter. Haupt-Keyword im Titel, im ersten Absatz und in einer Überschrift. 3–5 Abschnitte' : '4. Länge 500–900 Wörter. 2–4 Abschnitte') + ' mit „## “-Überschriften, am Ende „## Häufige Fragen“ mit genau 3 Fragen als „### “ und kurzen Antworten, danach ein kurzer Kontakt-Absatz mit Telefon +49 172 1517578 und Link [Kontakt](/kontakt/).',\n  plan ? '5. 2–3 interne Links aus den URLs im Faktenblatt, davon MUSS einer auf die Ziel-Seite ' + ((p.thema && p.thema.ziel_url) || '/kindergeburtstag/') + ' zeigen. Beschreibender Ankertext (nie „hier“). Relative Links.' : '5. Genau 2 interne Links aus den URLs im Faktenblatt, beschreibender Ankertext (nie „hier“). Relative Links wie /kindergeburtstag/.',\n  '6. Stil wie im LIAR-Blog (lebendig, mit Emojis): Der Titel endet mit 1–2 passenden Emojis (z. B. ✨🎩). Jede „## “-Überschrift beginnt mit genau einem passenden Emoji (z. B. 🎪 🎈 ☀️ 🤹 👏 🎉; für die Fragen „## ❓ Häufige Fragen“). Aufzählungen als Markdown-Liste, gern mit einem passenden Emoji am Zeilenanfang (🌼 🤝 🎨 ✅). Im Fließtext höchstens ein Emoji pro Absatz und nicht in jedem Absatz. „### “-Fragen ohne Emoji. Vor den Fragen ein kurzer Abschnitt „## 🎉 Fazit: …“. seoTitle, description und slug ohne Emojis. Keine H1 im Text (der Titel ist die H1).',\n  '7. Bilder: Setze genau ' + nInline + ' Bild-Platzhalter im Text, jeweils als eigene Zeile: ' + (nInline >= 1 ? '![Alt-Text]([[BILD_1]])' : '') + (nInline >= 2 ? ' und ![Alt-Text]([[BILD_2]])' : '') + (nInline === 0 ? '(keine – es gibt keine Fotos)' : '') + '. Alt-Text beschreibt nur, was laut Fotobeschreibung zu sehen ist; Platzhalter dort setzen, wo das Foto inhaltlich passt.',\n  '8. Social-Texte: facebook 60–120 Wörter mit 1 Frage an die Leser, Link-Platzhalter [[LINK_FB]] und 3–5 Hashtags; instagram = Facebook-Text ohne Link, endet mit „Link in der Bio“ und 8–12 Hashtags; linkedin 60–120 Wörter, sachlich für Veranstalter/Kitas/Firmen, Link-Platzhalter [[LINK_LI]], max. 3 Hashtags; gbp (Google-Unternehmensprofil) 60–120 Wörter, freundlich-sachlich, ohne Links, ohne Telefonnummern, ohne Hashtags, max. 2 Emojis. Max. 4 Emojis pro Text.',\n  '',\n  'AUSGABE: Nur ein JSON-Objekt, kein Text davor oder danach, kein Code-Block. Felder:',\n  '{\"title\": \"max. 70 Zeichen inkl. Emojis am Ende, Keyword vorn\", \"seoTitle\": \"max. 60 Zeichen, endet mit | LIAR\", \"description\": \"120–160 Zeichen, Nutzen + Aufforderung, keine doppelten Anführungszeichen\", \"slug\": \"kebab-case, 3–7 Wörter, a-z 0-9 -, max. 60 Zeichen\", \"heroImageAlt\": \"...\", \"categories\": [\"1–2 aus: Termine, Lokales, Behind the Scenes, Ratgeber, Saisonal, Kindergeburtstag, Kita & Schule, Firmen\"], \"tags\": [\"3–5, klein, mit-bindestrich\"], \"body_markdown\": \"der Artikeltext in Markdown\", \"social\": {\"facebook\": \"...\", \"instagram\": \"...\", \"linkedin\": \"...\", \"gbp\": \"...\"}}'\n].join('\\n');\nconst fotoInfo = p.photos.map((f, i) => (i === 0 ? 'Titelbild' : 'BILD_' + i) + ': ' + (f.beschreibung || (f.src === 'tg' ? 'Foto vom Inhaber (Inhalt laut Notiz)' : 'ohne Beschreibung'))).join('\\n');\nconst user = 'Heute ist ' + p.today_de + ' (' + p.iso + ').\\n\\n' + (plan ? 'THEMA AUS DEM REDAKTIONSPLAN' : 'NOTIZ DES INHABERS') + ':\\n\"\"\"\\n' + p.topic_text + '\\n\"\"\"\\n\\nFOTOS (' + p.photos.length + '):\\n' + (fotoInfo || 'keine') + '\\n\\nKONTEXT LEISTUNGSSEITEN (nicht widersprechen):\\n' + p.leistungs_corpus;\nconst recherche = (!plan && p.research_block) ? '\\n\\n' + p.research_block : '';\nreturn [{ json: { ...p, n_inline: nInline, system_prompt: system, user_prompt: user + recherche, fakten: FAKTEN + recherche } }];\n" } },
  output: [{ system_prompt: 's', user_prompt: 'u', n_inline: 0 }]
});
const llmArticle = node({
  type: 'n8n-nodes-base.httpRequest', version: 4.2,
  config: { name: 'Claude: Artikel schreiben', position: [1300, 300], credentials: OR,
    parameters: { method: 'POST', url: 'https://openrouter.ai/api/v1/chat/completions',
      authentication: 'predefinedCredentialType', nodeCredentialType: 'openRouterApi',
      sendHeaders: true, headerParameters: { parameters: [{ name: 'HTTP-Referer', value: 'https://liar-entertainer.com' }, { name: 'X-Title', value: 'LIAR Spontan-Artikel' }] },
      sendBody: true, specifyBody: 'json',
      jsonBody: "={{ JSON.stringify({ model: 'anthropic/claude-opus-5.5', max_tokens: 16000, temperature: 0.6, messages: [ { role: 'system', content: $json.system_prompt }, { role: 'user', content: $json.user_prompt } ] }) }}",
      options: { timeout: 240000, response: { response: { fullResponse: true, neverError: true, responseFormat: 'json' } } } } },
  output: [{ statusCode: 200, body: { choices: [{ message: { content: '{}' } }] } }]
});
const parse = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Artikel aufbereiten', position: [1520, 300], parameters: { jsCode: "const resp = $input.first().json;\nconst api = resp.body || resp;\nlet raw = api && api.choices && api.choices[0] && api.choices[0].message && api.choices[0].message.content;\nif (!raw) throw new Error('Keine Antwort vom Sprachmodell. Status ' + (resp.statusCode || '?') + ': ' + JSON.stringify(api).slice(0, 300));\nconst p = $('Prompt bauen').first().json;\nraw = String(raw).trim().replace(/^```[a-z]*\\s*/i, '').replace(/```\\s*$/, '').trim();\nconst s = raw.indexOf('{'), e = raw.lastIndexOf('}');\nlet a;\ntry { a = JSON.parse(raw.slice(s, e + 1)); } catch (err) { throw new Error('Artikel-JSON nicht lesbar: ' + raw.slice(0, 200)); }\nconst clean = (x) => String(x || '').replace(/\\s+/g, ' ').replace(/\"/g, \"'\").trim();\nconst slugify = (x) => String(x || '').toLowerCase()\n  .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')\n  .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60).replace(/-+$/, '');\nconst noEmoji = (x) => String(x || '').replace(/[\\p{Extended_Pictographic}\\uFE0F\\u200D]/gu, '').replace(/\\s{2,}/g, ' ').trim();\nconst title = clean(a.title);\nif (!title || !a.body_markdown) throw new Error('Artikel unvollständig (title/body fehlt).');\nlet slug = slugify(a.slug || title) || ('artikel-' + p.iso);\nconst h = this.helpers;\nconst exists = async (url) => {\n  try { await h.httpRequest({ method: 'GET', url, json: false }); return true; } catch (err) { return false; }\n};\nconst RAW = 'https://raw.githubusercontent.com/ben69mikail/liar-entertainer-relaunch/main/site/src/content/blog/';\nif (await exists(RAW + slug + '.md') || await exists('https://liar-entertainer.com/blog/' + slug + '/')) {\n  slug = (slug.slice(0, 50) + '-' + p.iso.slice(0, 7)).replace(/-+/g, '-');\n  if (await exists(RAW + slug + '.md')) slug = slug + '-' + Date.now().toString().slice(-4);\n}\nconst base = 'https://liar-entertainer.com/blog-images/' + slug + '/';\nconst repoImg = 'site/public/blog-images/' + slug + '/';\nconst files = [];\nlet heroImage;\nif (p.photos.length) {\n  heroImage = base + 'cover.jpg';\n  files.push({ ...p.photos[0], path: repoImg + 'cover.jpg' });\n  const inl = [p.photos[1] || p.photos[0], p.photos[2]].filter(Boolean).slice(0, p.n_inline);\n  inl.forEach((ph, i) => files.push({ ...ph, path: repoImg + 'inline-' + (i + 1) + '.jpg' }));\n} else {\n  const t = (title + ' ' + p.topic_text).toLowerCase();\n  const map = [['karneval', 'karneval'], ['kita', 'kindergarten'], ['kindergarten', 'kindergarten'], ['schule', 'schule'], ['ballon', 'ballonmodellage'], ['glitzer', 'glitzer-tattoo'], ['geburtstag', 'kindergeburtstag'], ['walk', 'walk-act'], ['tisch', 'tisch-zauberer'], ['fest', 'fest'], ['markt', 'fest'], ['bühne', 'buehnen-zauberer'], ['clown', 'clownshow']];\n  const hit = map.find(m => t.includes(m[0]));\n  heroImage = 'https://liar-entertainer.com/images/fallback/' + (hit ? hit[1] : 'zaubershow') + '.jpg';\n}\nlet body = String(a.body_markdown).trim().replace(/^#\\s+.*\\n+/, '');\nbody = body.replace(/\\(\\(\\[\\[BILD_(\\d)\\]\\]\\)\\)/g, '([[BILD_$1]])');\nbody = body.replace(/\\[\\[BILD_1\\]\\]/g, base + 'inline-1.jpg').replace(/\\[\\[BILD_2\\]\\]/g, base + 'inline-2.jpg');\nconst haveInline = files.filter(f => f.path.includes('inline-')).length;\nif (haveInline < 2) body = body.split('\\n').filter(l => !l.includes(base + 'inline-2.jpg')).join('\\n');\nif (haveInline < 1) body = body.split('\\n').filter(l => !l.includes(base + 'inline-1.jpg')).join('\\n');\nbody = body.replace(/\\n{3,}/g, '\\n\\n');\nconst arr = (x, n) => (Array.isArray(x) ? x : []).map(v => clean(v)).filter(Boolean).slice(0, n);\nconst categories = arr(a.categories, 2);\nconst tags = arr(a.tags, 5).map(slugify).filter(Boolean);\nconst live_url = 'https://liar-entertainer.com/blog/' + slug + '/';\nconst fm = [\n  '---',\n  'title: ' + JSON.stringify(title),\n  'seoTitle: ' + JSON.stringify(noEmoji(clean(a.seoTitle || title)).slice(0, 70)),\n  'description: ' + JSON.stringify(noEmoji(clean(a.description)).slice(0, 170)),\n  'publishDate: ' + p.iso,\n  'heroImage: ' + JSON.stringify(heroImage),\n  'heroImageAlt: ' + JSON.stringify(clean(a.heroImageAlt || title)),\n  'categories: ' + JSON.stringify(categories.length ? categories : ['Termine']),\n  'tags: ' + JSON.stringify(tags),\n  'author: \"Michaël Prescler\"',\n  'draft: true',\n  'freigabe: ja',\n  '---',\n  '',\n  body,\n  ''\n].join('\\n');\nconst soc = a.social || {};\nconst utm = (src, med) => live_url + '?utm_source=' + src + '&utm_medium=' + med;\nconst social = {\n  facebook: String(soc.facebook || '').replace(/\\[\\[LINK_FB\\]\\]/g, utm('facebook', 'social')),\n  instagram: String(soc.instagram || '').replace(/\\[\\[LINK_[A-Z]+\\]\\]/g, ''),\n  linkedin: String(soc.linkedin || '').replace(/\\[\\[LINK_LI\\]\\]/g, utm('linkedin', 'social')),\n  gbp: String(soc.gbp || '').replace(/\\[\\[LINK_[A-Z]+\\]\\]/g, '')\n};\nconst warnings = [];\nconst allowed = new Set(['150', '20', '40', '210', '0,40']);\nfor (const m of body.matchAll(/(\\d+(?:,\\d+)?)\\s?(?:€|Euro)/g)) { if (!allowed.has(m[1])) warnings.push('Preis „' + m[0] + '“ steht nicht im Faktenblatt'); }\nif (/\\b(15|16|18|20)\\s+Jahre/.test(body)) warnings.push('Jahresangabe prüfen (richtig: seit 2009 / 17 Jahre)');\nif (/354|370\\+/.test(body)) warnings.push('Veraltete Bewertungszahl (richtig: 390+)');\nif (p.pool_note) warnings.push(p.pool_note);\nif (p.mode === 'plan' && p.thema && p.thema.ziel_url && !body.includes('](' + p.thema.ziel_url)) warnings.push('Link zur Ziel-Seite ' + p.thema.ziel_url + ' fehlt');\nconst rs = p.research || null;\nif (rs && rs.fehler) warnings.push(rs.fehler + ' – Adresse/Parken bitte selbst prüfen');\nif (rs) for (const w of rs.widersprueche) warnings.push('Recherche widersprüchlich: ' + w);\nif (p.mode !== 'plan' && rs && !rs.ok && !rs.fehler) warnings.push('Recherche: keine belastbaren Infos zu Ort/Veranstaltung gefunden');\nconst words = body.split(/\\s+/).filter(Boolean).length;\nreturn [{ json: {\n  slug, title, description: clean(a.description), live_url, hero_image: heroImage,\n  hero_overlay_url: 'https://liar-entertainer.com/hero-generated/' + slug + '.jpg',\n  story_url: 'https://liar-entertainer.com/story-generated/' + slug + '.jpg',\n  md_path: 'site/src/content/blog/' + slug + '.md', md_full: fm, body, words,\n  image_files: files, social, warnings, is_test: p.is_test, fakten: p.fakten, mode: p.mode, thema: p.thema, iso: p.iso, research: rs\n} }];\n" } },
  output: [{ slug: 's', title: 't', body: 'b', warnings: [], image_files: [], social: {} }]
});
const llmCheck = node({
  type: 'n8n-nodes-base.httpRequest', version: 4.2,
  config: { name: 'Claude: Faktencheck', position: [1740, 300], credentials: OR, onError: 'continueRegularOutput',
    parameters: { method: 'POST', url: 'https://openrouter.ai/api/v1/chat/completions',
      authentication: 'predefinedCredentialType', nodeCredentialType: 'openRouterApi',
      sendBody: true, specifyBody: 'json',
      jsonBody: "={{ JSON.stringify({ model: 'anthropic/claude-haiku-5.5', max_tokens: 4000, reasoning: { effort: 'low' }, messages: [ { role: 'user', content: 'Prüfe den Blogartikel gegen das Faktenblatt. Melde NUR harte Widersprüche: falsche oder nicht erlaubte Preise (Preise sind nur bei Kindergeburtstag erlaubt), falsche Kontaktdaten, falsche Zahlen (Jahre, Bewertungen, Auftritte), behauptete Auszeichnungen/Mitgliedschaften, genannte Firmenkunden. Stil, Orte und Storytelling sind KEIN Konflikt. Antworte nur als JSON: {\"conflicts\":[{\"line\":\"Zitat\",\"reason\":\"Grund\"}]} oder {\"conflicts\":[]}.\\n\\n' + $json.fakten + '\\n\\nARTIKEL:\\n' + $json.body } ] }) }}",
      options: { timeout: 90000, response: { response: { fullResponse: true, neverError: true, responseFormat: 'json' } } } } },
  output: [{ statusCode: 200, body: { choices: [{ message: { content: '{"conflicts":[]}' } }] } }]
});
const checkEval = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Faktencheck auswerten', position: [1960, 300], parameters: { jsCode: "const resp = $input.first().json;\nconst api = resp.body || resp;\nconst txt = (api && api.choices && api.choices[0] && api.choices[0].message && api.choices[0].message.content) || '';\nconst a = $('Artikel aufbereiten').first().json;\nlet found = [];\ntry { const m = String(txt).match(/\\{[\\s\\S]*\\}/); if (m) found = (JSON.parse(m[0]).conflicts || []); } catch (e) { found = [{ reason: 'Faktencheck-Antwort nicht lesbar' }]; }\nif (!txt) found = [{ reason: 'Faktencheck nicht erreichbar – bitte selbst gegenlesen' }];\nconst warnings = [...a.warnings, ...found.map(c => (c.reason || '') + (c.line ? ' – „' + String(c.line).slice(0, 120) + '“' : ''))].filter(Boolean);\nreturn [{ json: { ...a, warnings } }];\n" } },
  output: [{ slug: 's', warnings: [] }]
});
const preview = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Vorschau bauen', position: [2180, 300], parameters: { jsCode: "const a = $input.first().json;\nconst plan = a.mode === 'plan';\nconst label = plan ? 'Montags-Artikel' : 'Spontan-Artikel';\nconst thumb = (f) => (f && f.src === 'drive') ? 'https://drive.google.com/thumbnail?id=' + f.drive_id + '&sz=w1000' : '';\nconst inl = a.image_files.filter(f => f.path.includes('inline-'));\nconst esc = (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');\nlet body = a.body;\ninl.forEach((f, i) => { const t = thumb(f); if (t) body = body.split('https://liar-entertainer.com/blog-images/' + a.slug + '/inline-' + (i + 1) + '.jpg').join(t); });\nlet h = esc(body);\nh = h.replace(/!\\[([^\\]]*)\\]\\(([^)]+)\\)/g, '<figure style=\"margin:20px 0\"><img src=\"$2\" alt=\"$1\" style=\"width:100%;border-radius:8px\"><figcaption style=\"font-size:12px;color:#888\">Bild wird erst nach Freigabe hochgeladen</figcaption></figure>');\nh = h.replace(/\\[([^\\]]+)\\]\\(([^)]+)\\)/g, '<a href=\"$2\" style=\"color:#d7393e\">$1</a>');\nh = h.replace(/^### (.+)$/gm, '<h3>$1</h3>').replace(/^## (.+)$/gm, '<h2 style=\"margin-top:28px\">$1</h2>');\nh = h.replace(/\\*\\*([^*]+)\\*\\*/g, '<strong>$1</strong>');\nh = h.replace(/^[-*] (.+)$/gm, '<li>$1</li>');\nh = h.split(/\\n{2,}/).map(b => /^<(h\\d|li|figure)/.test(b.trim()) ? (b.trim().startsWith('<li') ? '<ul>' + b + '</ul>' : b) : '<p style=\"line-height:1.7\">' + b.replace(/\\n/g, '<br>') + '</p>').join('\\n');\nconst warn = a.warnings.length ? '<div style=\"background:#fff4e5;border:1px solid #f0b86e;padding:12px;border-radius:8px;margin:0 0 20px\"><b>⚠️ Bitte prüfen:</b><ul>' + a.warnings.map(w => '<li>' + esc(w) + '</li>').join('') + '</ul></div>' : '';\nconst tgWarn = a.warnings.length ? '\\n\\n⚠️ <b>Bitte prüfen:</b>\\n' + a.warnings.slice(0, 6).map(w => '• ' + esc(w.slice(0, 220))).join('\\n') + (a.warnings.length > 6 ? '\\n• … weitere ' + (a.warnings.length - 6) + ' in der E-Mail' : '') : '';\nconst fotos = a.image_files.length ? '\\n\\n🖼 <b>Fotos</b>\\n' + a.image_files.map(f => '• ' + (f.path.includes('cover') ? 'Titelbild' : 'Bild') + ': ' + (f.src === 'drive' ? '<a href=\"https://drive.google.com/file/d/' + f.drive_id + '/view\">' + esc((f.beschreibung || 'ansehen').slice(0, 90)) + '</a>' : 'aus Telegram')).join('\\n') : '';\nconst rs = a.research;\nconst rsText = rs ? '\\n\\n🔎 <b>Recherche</b>: ' + rs.orte.length + ' Ort(e), ' + rs.fakten.length + ' Fakt(en), ' + rs.quellen.length + ' Quelle(n)' + (rs.quellen.length ? '\\n' + rs.quellen.slice(0, 3).map(q => '• <a href=\"' + esc(q.url) + '\">' + esc(q.titel.slice(0, 60)) + '</a>').join('\\n') : '') + (rs.bilder && rs.bilder.length ? '\\n\\n📸 <b>Bildfunde</b> (Plakat/Location – nicht im Artikel, nur mit Erlaubnis nutzbar):\\n' + rs.bilder.map((b, i) => '• <a href=\"' + esc(b.url) + '\">Bild ' + (i + 1) + '</a> von <a href=\"' + esc(b.seite) + '\">' + esc(b.seite.replace(/^https?:\\/\\/(www\\.)?/, '').split('/')[0]) + '</a>').join('\\n') : '') : '';\nconst tgText = (a.is_test ? '🧪 TESTLAUF\\n' : '') + '✨ <b>' + label + ' fertig</b>\\n\\n📝 ' + esc(a.title) + '\\n📊 ' + a.words + ' Wörter · ' + a.image_files.length + ' Foto(s)\\n🔗 ' + a.live_url + fotos + rsText + '\\n\\n📧 Komplette Vorschau inkl. Social-Texte ist an info@liar-entertainer.com gegangen.' + tgWarn + '\\n\\n✅ Veröffentlichen = Artikel + Bilder ins Repo, GitHub prüft Build/SEO, Netlify stellt online, danach Facebook/Instagram/LinkedIn/Google-Profil.';\nconst social = '<h3>Social-Texte (gehen nach Veröffentlichung raus)</h3><p><b>Facebook:</b><br>' + esc(a.social.facebook).replace(/\\n/g, '<br>') + '</p><p><b>Instagram:</b><br>' + esc(a.social.instagram).replace(/\\n/g, '<br>') + '</p><p><b>LinkedIn:</b><br>' + esc(a.social.linkedin).replace(/\\n/g, '<br>') + '</p><p><b>Google-Unternehmensprofil:</b><br>' + esc(a.social.gbp || '').replace(/\\n/g, '<br>') + '</p>';\nconst rsHtml = rs ? '<div style=\"background:#eef6ff;border:1px solid #9cc3ef;padding:12px;border-radius:8px;margin:0 0 20px\"><b>🔎 Recherche im Internet</b>' + (rs.quellen.length ? '<ul>' + rs.quellen.map(q => '<li><a href=\"' + esc(q.url) + '\">' + esc(q.titel) + '</a></li>').join('') + '</ul>' : '<p>Keine belastbaren Quellen gefunden.</p>') + (rs.bilder && rs.bilder.length ? '<p><b>📸 Bildfunde</b> (Plakat/Location – werden nicht automatisch verwendet; nur mit Erlaubnis des Rechteinhabers nutzen):</p><div>' + rs.bilder.map(b => '<a href=\"' + esc(b.seite) + '\"><img src=\"' + esc(b.url) + '\" style=\"height:140px;margin:4px;border-radius:6px\" alt=\"\"></a>').join('') + '</div>' : '') + '</div>' : '';\nreturn [{ json: { ...a, preview_html: warn + rsHtml + '<h1 style=\"font-size:28px\">' + esc(a.title) + '</h1><p style=\"color:#666\">' + esc(a.description) + '</p><img src=\"' + (thumb(a.image_files[0]) || a.hero_image) + '\" style=\"width:100%;border-radius:8px\" alt=\"\">' + h + '<hr>' + social, tg_text: tgText, label } }];\n" } },
  output: [{ slug: 's', title: 't', preview_html: '<p>x</p>', tg_text: 't', image_files: [] }]
});
const mailPreview = node({
  type: 'n8n-nodes-base.gmail', version: 2.1,
  config: { name: 'E-Mail: Vorschau', position: [2400, 300], credentials: GM, onError: 'continueRegularOutput',
    parameters: { resource: 'message', operation: 'send', sendTo: 'info@liar-entertainer.com',
      subject: "={{ '[LIAR Blog] ' + $('Vorschau bauen').first().json.label + ' zur Freigabe: ' + $('Vorschau bauen').first().json.title }}",
      emailType: 'html',
      message: "={{ '<div style=\"font-family:Arial,sans-serif;max-width:760px;margin:auto\">' + $('Vorschau bauen').first().json.preview_html + '<hr><p style=\"text-align:center\"><a href=\"' + $execution.resumeUrl + ($execution.resumeUrl.includes('?') ? '&' : '?') + 'action=approve\" style=\"background:#22c55e;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none\">✅ Veröffentlichen</a> &nbsp; <a href=\"' + $execution.resumeUrl + ($execution.resumeUrl.includes('?') ? '&' : '?') + 'action=reject\" style=\"background:#ef4444;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none\">❌ Verwerfen</a></p></div>' }}",
      options: { appendAttribution: false } } },
  output: [{ id: 'm1' }]
});
const tgPreview = node({
  type: 'n8n-nodes-base.telegram', version: 1.2,
  config: { name: 'Telegram: Vorschau + Freigabe', position: [2620, 300], credentials: TG,
    parameters: { resource: 'message', operation: 'sendMessage', chatId: CHAT,
      text: "={{ $('Vorschau bauen').first().json.tg_text }}\n\n<tg-spoiler>RU:{{ $execution.resumeUrl }}</tg-spoiler>",
      replyMarkup: 'inlineKeyboard',
      inlineKeyboard: { rows: [{ row: { buttons: [
        { text: '✅ Veröffentlichen', additionalFields: { callback_data: '=approve:{{ $execution.id }}' } },
        { text: '❌ Verwerfen', additionalFields: { callback_data: '=reject:{{ $execution.id }}' } }
      ] } }] },
      additionalFields: { appendAttribution: false, parse_mode: 'HTML', disable_web_page_preview: true } } },
  output: [{ ok: true }]
});
const waitApproval = node({
  type: 'n8n-nodes-base.wait', version: 1.1,
  config: { name: 'Warten auf Freigabe', position: [2840, 300],
    parameters: { resume: 'webhook', httpMethod: 'GET', limitWaitTime: true, limitType: 'afterTimeInterval', resumeAmount: 3, resumeUnit: 'days', options: {} } },
  output: [{ query: { action: 'approve' } }]
});
const ifApproved = ifElse({
  version: 2.2,
  config: { name: 'Freigegeben?', position: [3060, 300],
    parameters: { conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'loose' },
      conditions: [{ id: 'ap1', leftValue: "={{ ($json.query && $json.query.action) || '' }}", rightValue: 'approve', operator: { type: 'string', operation: 'equals' } }],
      combinator: 'and' }, options: {} } }
});
const tgRejected = node({
  type: 'n8n-nodes-base.telegram', version: 1.2,
  config: { name: 'Telegram: Verworfen', position: [3280, 500], credentials: TG,
    parameters: { resource: 'message', operation: 'sendMessage', chatId: CHAT,
      text: "={{ '❌ Nicht veröffentlicht (verworfen oder 3 Tage ohne Antwort): ' + $('Vorschau bauen').first().json.title }}",
      additionalFields: { appendAttribution: false } } },
  output: [{ ok: true }]
});
const imgList = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Bilder-Liste', position: [3280, 200], parameters: { jsCode: "const a = $('Vorschau bauen').first().json;\nif (!a.image_files.length) return [{ json: { has_photos: false, src: 'none' } }];\nreturn a.image_files.map(f => ({ json: { has_photos: true, src: f.src || 'tg', tg_file_id: f.tg_file_id || '', drive_id: f.drive_id || '', path: f.path } }));\n" } },
  output: [{ has_photos: true, tg_file_id: 'f', path: 'site/public/blog-images/s/cover.jpg' }]
});
const ifPhotos = ifElse({
  version: 2.2,
  config: { name: 'Fotos vorhanden?', position: [3500, 200],
    parameters: { conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'loose' },
      conditions: [{ id: 'ph1', leftValue: '={{ $json.has_photos }}', rightValue: true, operator: { type: 'boolean', operation: 'true', singleValue: true } }],
      combinator: 'and' }, options: {} } }
});
const tgDownload = node({
  type: 'n8n-nodes-base.telegram', version: 1.2,
  config: { name: 'Telegram: Foto laden', position: [3720, 100], credentials: TG,
    parameters: { resource: 'file', operation: 'get', fileId: '={{ $json.tg_file_id }}', download: true } },
  output: [{ result: { file_id: 'f' } }]
});
const ifTg = ifElse({
  version: 2.2,
  config: { name: 'Telegram-Fotos?', position: [3610, 200],
    parameters: { conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'loose' },
      conditions: [{ id: 'tg1', leftValue: '={{ $json.src }}', rightValue: 'tg', operator: { type: 'string', operation: 'equals' } }],
      combinator: 'and' }, options: {} } }
});
const driveDl = node({
  type: 'n8n-nodes-base.httpRequest', version: 4.2,
  config: { name: 'Drive: Foto laden', position: [3720, 320], credentials: GD,
    parameters: { method: 'GET', url: '={{ "https://www.googleapis.com/drive/v3/files/" + $json.drive_id + "?alt=media&supportsAllDrives=true" }}',
      authentication: 'predefinedCredentialType', nodeCredentialType: 'googleDriveOAuth2Api',
      options: { response: { response: { responseFormat: 'file' } }, timeout: 120000 } } },
  output: [{}]
});
const driveShrink = node({
  type: 'n8n-nodes-base.editImage', version: 1,
  config: { name: 'Foto verkleinern', position: [3830, 320], onError: 'continueRegularOutput',
    parameters: { operation: 'resize', dataPropertyName: 'data', width: 1600, height: 1600, resizeOption: 'onlyIfLarger',
      options: { format: 'jpeg', quality: 85 } } },
  output: [{}]
});
const buildFiles = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Commit-Dateien bauen', position: [3940, 200], parameters: { jsCode: "const a = $('Vorschau bauen').first().json;\nconst list = (() => { try { return $('Bilder-Liste').all().map(i => i.json); } catch (e) { return []; } })();\nconst items = $input.all();\nconst out = [];\nfor (let i = 0; i < items.length; i++) {\n  const it = items[i];\n  if (!it.binary || !list[i] || !list[i].path) continue;\n  const key = Object.keys(it.binary)[0];\n  const buf = await this.helpers.getBinaryDataBuffer(i, key);\n  out.push({ json: { path: list[i].path, content: buf.toString('base64'), message: 'blog(n8n): Bild ' + list[i].path.split('/').pop() + ' für ' + a.slug + ' [skip netlify]' } });\n}\nout.push({ json: { path: a.md_path, content: Buffer.from(a.md_full, 'utf8').toString('base64'), message: 'blog(n8n): ' + a.slug + ' – freigegeben (' + (a.mode === 'plan' ? 'Montags-Plan' : 'Telegram') + ') [skip netlify]' } });\nreturn out;\n" } },
  output: [{ path: 'site/src/content/blog/s.md', content: 'YmFzZTY0', message: 'm' }]
});
const focusPrep = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Fokus vorbereiten', position: [3990, 380], parameters: { jsCode: "// Titelbild an die Bild-KI: wo sind Kopf + Oberkörper? (Ergebnis → heroFocus im Frontmatter)\nconst items = $input.all();\nconst cover = items.find(i => /\\/cover\\.jpg$/.test(i.json.path || ''));\nconst PROMPT = \"Du bekommst das Titelbild eines Blogartikels (Clown/Zauberer/Pantomime bei Auftritten). Bestimme den Bereich, der beim Zuschneiden IMMER sichtbar bleiben muss: Kopf und Oberkörper der Hauptperson(en) – bzw. ohne Personen das zentrale Geschehen.\\nGib Prozentwerte relativ zum ganzen Bild zurück (0 = links/oben, 100 = rechts/unten):\\n- x: horizontale Mitte dieses Bereichs\\n- top: oberster Punkt des Kopfes (inkl. Hut/Mütze) der obersten Hauptperson\\n- bottom: Unterkante des Oberkörpers (Hüfte/Gürtel) der untersten Hauptperson\\nBei mehreren Hauptpersonen den gemeinsamen Bereich. Zuschauer am Rand ignorieren.\\nAntworte NUR mit JSON: {\\\"x\\\": 0-100, \\\"top\\\": 0-100, \\\"bottom\\\": 0-100, \\\"personen\\\": Anzahl, \\\"beschreibung\\\": \\\"kurz, was zu sehen ist\\\"}\";\nif (!cover) return [{ json: { has_cover: false, request: { model: 'anthropic/claude-haiku-5.5', max_tokens: 5, messages: [{ role: 'user', content: 'ok' }] } } }];\nreturn [{ json: { has_cover: true, request: { model: 'anthropic/claude-haiku-5.5', max_tokens: 600, messages: [{ role: 'user', content: [\n  { type: 'image_url', image_url: { url: 'data:image/jpeg;base64,' + cover.json.content } },\n  { type: 'text', text: PROMPT }\n] }] } } }];\n" } },
  output: [{ has_cover: true, request: {} }]
});
const focusCall = node({
  type: 'n8n-nodes-base.httpRequest', version: 4.2,
  config: { name: 'Bild-KI: Kopf + Oberkörper', position: [4060, 380], credentials: OR, onError: 'continueRegularOutput',
    parameters: { method: 'POST', url: 'https://openrouter.ai/api/v1/chat/completions',
      authentication: 'predefinedCredentialType', nodeCredentialType: 'openRouterApi',
      sendHeaders: true, headerParameters: { parameters: [{ name: 'HTTP-Referer', value: 'https://liar-entertainer.com' }, { name: 'X-Title', value: 'LIAR Bildfokus' }] },
      sendBody: true, specifyBody: 'json', jsonBody: '={{ JSON.stringify($json.request) }}',
      options: { timeout: 90000, response: { response: { fullResponse: true, neverError: true, responseFormat: 'json' } } } } },
  output: [{ statusCode: 200, body: { choices: [{ message: { content: '{"x":50,"top":20,"bottom":60}' } }] } }]
});
const focusApply = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Fokus eintragen', position: [4110, 200], parameters: { jsCode: "// Titelbild-Fokus: Bild-KI liefert Kopf + Oberkörper in % (x, top, bottom),\n// die Pipeline schreibt ihn als `heroFocus` ins Frontmatter (Site: src/utils/focusCrop.ts).\n// Wird von build.py in den n8n-Code-Knoten „Fokus eintragen“ eingefügt.\n\nfunction parseFocusReply(text) {\n  const raw = String(text || '');\n  const s = raw.indexOf('{');\n  const e = raw.lastIndexOf('}');\n  if (s < 0 || e <= s) return null;\n  let j;\n  try { j = JSON.parse(raw.slice(s, e + 1)); } catch (err) { return null; }\n  const f = { x: Math.round(Number(j.x)), top: Math.round(Number(j.top)), bottom: Math.round(Number(j.bottom)) };\n  const ok = [f.x, f.top, f.bottom].every(n => Number.isFinite(n) && n >= 0 && n <= 100) && f.bottom > f.top;\n  return ok ? f : null;\n}\n\nfunction injectFocus(md, focus) {\n  if (!focus) return md;\n  const line = 'heroFocus: { x: ' + focus.x + ', top: ' + focus.top + ', bottom: ' + focus.bottom + ' }';\n  const text = String(md);\n  if (/^heroFocus:.*$/m.test(text)) return text.replace(/^heroFocus:.*$/m, line);\n  if (/^heroImageAlt:.*$/m.test(text)) return text.replace(/^(heroImageAlt:.*)$/m, '$1\\n' + line);\n  return text.replace(/^(heroImage:.*)$/m, '$1\\n' + line);\n}\n\nif (typeof module !== 'undefined' && module.exports) {\n  module.exports = { parseFocusReply, injectFocus };\n}\n\n// --- n8n: Fokus ins Frontmatter schreiben (ohne Fokus: Site zeigt Hochkant-Fotos ganz) ---\nconst prep = $('Fokus vorbereiten').first().json;\nconst resp = $input.first().json;\nconst api = resp.body || resp;\nconst txt = (api && api.choices && api.choices[0] && api.choices[0].message && api.choices[0].message.content) || '';\nconst focus = prep.has_cover ? parseFocusReply(txt) : null;\nreturn $('Commit-Dateien bauen').all().map(i => {\n  const j = { ...i.json };\n  if (focus && /\\.md$/.test(j.path)) {\n    j.content = Buffer.from(injectFocus(Buffer.from(j.content, 'base64').toString('utf8'), focus), 'utf8').toString('base64');\n  }\n  return { json: j };\n});\n" } },
  output: [{ path: 'p', content: 'c', message: 'm' }]
});
const ghBlobs = node({
  type: 'n8n-nodes-base.httpRequest', version: 4.2,
  config: { name: 'GitHub: Blobs anlegen', position: [4160, 200], credentials: GH,
    parameters: { method: 'POST', url: REPO + '/git/blobs',
      authentication: 'predefinedCredentialType', nodeCredentialType: 'githubApi',
      sendHeaders: true, headerParameters: { parameters: [{ name: 'Accept', value: 'application/vnd.github+json' }, { name: 'X-GitHub-Api-Version', value: '2022-11-28' }] },
      sendBody: true, specifyBody: 'json',
      jsonBody: "={{ JSON.stringify({ content: $json.content, encoding: 'base64' }) }}",
      options: { timeout: 60000, batching: { batch: { batchSize: 1, batchInterval: 300 } }, response: { response: { fullResponse: true, neverError: true, responseFormat: 'json' } } } } },
  output: [{ statusCode: 201, body: { sha: 'b1' } }]
});
const ghRef = node({
  type: 'n8n-nodes-base.httpRequest', version: 4.2,
  config: { name: 'GitHub: Stand holen', position: [4270, 200], credentials: GH, executeOnce: true,
    parameters: { method: 'GET', url: REPO + '/git/ref/heads/main',
      authentication: 'predefinedCredentialType', nodeCredentialType: 'githubApi',
      sendHeaders: true, headerParameters: { parameters: [{ name: 'Accept', value: 'application/vnd.github+json' }] },
      options: { timeout: 30000, response: { response: { fullResponse: true, neverError: true, responseFormat: 'json' } } } } },
  output: [{ statusCode: 200, body: { object: { sha: 'h1' } } }]
});
const ghHeadCommit = node({
  type: 'n8n-nodes-base.httpRequest', version: 4.2,
  config: { name: 'GitHub: Basis-Commit holen', position: [4380, 200], credentials: GH,
    parameters: { method: 'GET', url: "={{ '" + REPO + "/git/commits/' + (($json.body && $json.body.object && $json.body.object.sha) || 'fehlt') }}",
      authentication: 'predefinedCredentialType', nodeCredentialType: 'githubApi',
      sendHeaders: true, headerParameters: { parameters: [{ name: 'Accept', value: 'application/vnd.github+json' }] },
      options: { timeout: 30000, response: { response: { fullResponse: true, neverError: true, responseFormat: 'json' } } } } },
  output: [{ statusCode: 200, body: { tree: { sha: 't1' } } }]
});
const ghTreeCode = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Baum bauen', position: [4490, 200], parameters: { jsCode: "// Alle Dateien eines Artikels als EIN Commit über die GitHub Git Data API (blobs → tree → commit → ref).\n// Wird von build.py in den n8n-Code-Knoten „Baum bauen“ / „Commit pruefen“ eingefügt.\n\nfunction checkStep(name, resp) {\n  const r = resp || {};\n  const code = Number(r.statusCode) || 0;\n  if (code >= 200 && code < 300) return r.body || {};\n  const msg = (r.body && (r.body.message || JSON.stringify(r.body))) || r.error || 'keine Antwort';\n  throw new Error('GitHub-Schritt „' + name + '“ fehlgeschlagen: ' + (code || '?') + ' ' + String(msg).slice(0, 200));\n}\n\nfunction buildTreeRequest(files, blobResponses, refBody, commitBody) {\n  if (files.length !== blobResponses.length) {\n    throw new Error('GitHub: ' + files.length + ' Dateien, ' + blobResponses.length + ' Blobs – Abbruch, nichts committet.');\n  }\n  const tree = files.map((f, i) => {\n    const b = blobResponses[i] || {};\n    const code = Number(b.statusCode) || 0;\n    if (!(code >= 200 && code < 300) || !b.body || !b.body.sha) {\n      const why = (b.body && b.body.message) || b.error || 'keine Antwort';\n      throw new Error('GitHub-Upload ' + f.path.split('/').pop() + ' fehlgeschlagen: ' + (code || '?') + ' ' + String(why).slice(0, 160) + ' – nichts committet.');\n    }\n    return { path: f.path, mode: '100644', type: 'blob', sha: b.body.sha };\n  });\n  const md = files.find(f => /\\.md$/.test(f.path));\n  return {\n    base_tree: commitBody.tree.sha,\n    parent: refBody.object.sha,\n    message: (md || files[files.length - 1]).message,\n    tree\n  };\n}\n\nif (typeof module !== 'undefined' && module.exports) {\n  module.exports = { checkStep, buildTreeRequest };\n}\n\n// --- n8n: Baum für EINEN Commit bauen ---\nconst files = $('Commit-Dateien bauen').all().map(i => i.json);\nconst blobs = $('GitHub: Blobs anlegen').all().map(i => i.json);\nconst ref = checkStep('Stand holen', $('GitHub: Stand holen').first().json);\nconst base = checkStep('Basis-Commit holen', $input.first().json);\nreturn [{ json: buildTreeRequest(files, blobs, ref, base) }];\n" } },
  output: [{ base_tree: 't1', parent: 'h1', message: 'm', tree: [] }]
});
const ghTree = node({
  type: 'n8n-nodes-base.httpRequest', version: 4.2,
  config: { name: 'GitHub: Baum anlegen', position: [4600, 200], credentials: GH,
    parameters: { method: 'POST', url: REPO + '/git/trees',
      authentication: 'predefinedCredentialType', nodeCredentialType: 'githubApi',
      sendHeaders: true, headerParameters: { parameters: [{ name: 'Accept', value: 'application/vnd.github+json' }] },
      sendBody: true, specifyBody: 'json', jsonBody: "={{ JSON.stringify({ base_tree: $json.base_tree, tree: $json.tree }) }}",
      options: { timeout: 60000, response: { response: { fullResponse: true, neverError: true, responseFormat: 'json' } } } } },
  output: [{ statusCode: 201, body: { sha: 't2' } }]
});
const ghCommit = node({
  type: 'n8n-nodes-base.httpRequest', version: 4.2,
  config: { name: 'GitHub: Commit anlegen', position: [4710, 200], credentials: GH,
    parameters: { method: 'POST', url: REPO + '/git/commits',
      authentication: 'predefinedCredentialType', nodeCredentialType: 'githubApi',
      sendHeaders: true, headerParameters: { parameters: [{ name: 'Accept', value: 'application/vnd.github+json' }] },
      sendBody: true, specifyBody: 'json', jsonBody: "={{ JSON.stringify({ message: $('Baum bauen').first().json.message, tree: ($json.body && $json.body.sha) || 'fehlt', parents: [$('Baum bauen').first().json.parent] }) }}",
      options: { timeout: 60000, response: { response: { fullResponse: true, neverError: true, responseFormat: 'json' } } } } },
  output: [{ statusCode: 201, body: { sha: 'c2' } }]
});
const ghRefUpdate = node({
  type: 'n8n-nodes-base.httpRequest', version: 4.2,
  config: { name: 'GitHub: Branch setzen', position: [4820, 200], credentials: GH,
    parameters: { method: 'PATCH', url: REPO + '/git/refs/heads/main',
      authentication: 'predefinedCredentialType', nodeCredentialType: 'githubApi',
      sendHeaders: true, headerParameters: { parameters: [{ name: 'Accept', value: 'application/vnd.github+json' }] },
      sendBody: true, specifyBody: 'json', jsonBody: "={{ JSON.stringify({ sha: ($json.body && $json.body.sha) || 'fehlt', force: false }) }}",
      options: { timeout: 60000, response: { response: { fullResponse: true, neverError: true, responseFormat: 'json' } } } } },
  output: [{ statusCode: 200, body: { object: { sha: 'c2' } } }]
});
const commitCheck = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Commits pruefen', position: [4930, 200], parameters: { jsCode: "// Alle Dateien eines Artikels als EIN Commit über die GitHub Git Data API (blobs → tree → commit → ref).\n// Wird von build.py in den n8n-Code-Knoten „Baum bauen“ / „Commit pruefen“ eingefügt.\n\nfunction checkStep(name, resp) {\n  const r = resp || {};\n  const code = Number(r.statusCode) || 0;\n  if (code >= 200 && code < 300) return r.body || {};\n  const msg = (r.body && (r.body.message || JSON.stringify(r.body))) || r.error || 'keine Antwort';\n  throw new Error('GitHub-Schritt „' + name + '“ fehlgeschlagen: ' + (code || '?') + ' ' + String(msg).slice(0, 200));\n}\n\nfunction buildTreeRequest(files, blobResponses, refBody, commitBody) {\n  if (files.length !== blobResponses.length) {\n    throw new Error('GitHub: ' + files.length + ' Dateien, ' + blobResponses.length + ' Blobs – Abbruch, nichts committet.');\n  }\n  const tree = files.map((f, i) => {\n    const b = blobResponses[i] || {};\n    const code = Number(b.statusCode) || 0;\n    if (!(code >= 200 && code < 300) || !b.body || !b.body.sha) {\n      const why = (b.body && b.body.message) || b.error || 'keine Antwort';\n      throw new Error('GitHub-Upload ' + f.path.split('/').pop() + ' fehlgeschlagen: ' + (code || '?') + ' ' + String(why).slice(0, 160) + ' – nichts committet.');\n    }\n    return { path: f.path, mode: '100644', type: 'blob', sha: b.body.sha };\n  });\n  const md = files.find(f => /\\.md$/.test(f.path));\n  return {\n    base_tree: commitBody.tree.sha,\n    parent: refBody.object.sha,\n    message: (md || files[files.length - 1]).message,\n    tree\n  };\n}\n\nif (typeof module !== 'undefined' && module.exports) {\n  module.exports = { checkStep, buildTreeRequest };\n}\n\n// --- n8n: Ergebnis prüfen ---\ncheckStep('Baum anlegen', $('GitHub: Baum anlegen').first().json);\nconst commit = checkStep('Commit anlegen', $('GitHub: Commit anlegen').first().json);\ncheckStep('Branch setzen', $input.first().json);\nconst a = $('Vorschau bauen').first().json;\nreturn [{ json: { committed: $('Commit-Dateien bauen').all().length, commit: commit.sha, slug: a.slug, live_url: a.live_url } }];\n" } },
  output: [{ committed: 2, slug: 's', live_url: 'u' }]
});
const usage = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Nutzung buchen', position: [4600, 420], parameters: { jsCode: "const a = $('Vorschau bauen').first().json;\nif (a.is_test) return [];\nconst seen = new Set();\nreturn a.image_files.filter(f => f.src === 'drive' && f.drive_id && !seen.has(f.drive_id) && seen.add(f.drive_id))\n  .map(f => ({ json: { drive_id: f.drive_id, zuletzt_benutzt: a.iso, zuletzt_slug: a.slug, benutzt_anzahl: (Number(f.benutzt_anzahl) || 0) + 1 } }));\n" } },
  output: [{ drive_id: 'x', zuletzt_benutzt: '2026-10-26', zuletzt_slug: 's', benutzt_anzahl: 1 }]
});
const updImg = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Bildpool: Nutzung speichern', position: [4820, 420], onError: 'continueRegularOutput',
    parameters: { resource: 'row', operation: 'update', dataTableId: DT_BILDER, matchType: 'allConditions',
      filters: { conditions: [{ keyName: 'drive_id', condition: 'eq', keyValue: '={{ $json.drive_id }}' }] },
      columns: { mappingMode: 'autoMapInputData', value: {}, matchingColumns: [], schema: [] }, options: {} } },
  output: [{ id: 1 }]
});
const themeBook = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Thema buchen', position: [4600, 600], parameters: { jsCode: "const a = $('Vorschau bauen').first().json;\nif (a.mode !== 'plan' || !a.thema || !a.thema.key || a.is_test) return [];\nreturn [{ json: { key: a.thema.key, status: 'veröffentlicht', slug: a.slug, datum: a.iso } }];\n" } },
  output: [{ key: 'k', status: 'veröffentlicht', slug: 's', datum: '2026-10-26' }]
});
const updTheme = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Plan: Thema erledigt', position: [4820, 600], onError: 'continueRegularOutput',
    parameters: { resource: 'row', operation: 'update', dataTableId: DT_THEMEN, matchType: 'allConditions',
      filters: { conditions: [{ keyName: 'key', condition: 'eq', keyValue: '={{ $json.key }}' }] },
      columns: { mappingMode: 'autoMapInputData', value: {}, matchingColumns: [], schema: [] }, options: {} } },
  output: [{ id: 1 }]
});
const ghDispatch = node({
  type: 'n8n-nodes-base.httpRequest', version: 4.2,
  config: { name: 'GitHub: Auto-Publish starten', position: [4600, 200], credentials: GH,
    parameters: { method: 'POST', url: REPO + '/actions/workflows/auto-publish.yml/dispatches',
      authentication: 'predefinedCredentialType', nodeCredentialType: 'githubApi',
      sendHeaders: true, headerParameters: { parameters: [{ name: 'Accept', value: 'application/vnd.github+json' }] },
      sendBody: true, specifyBody: 'json', jsonBody: '{"ref":"main"}',
      options: { timeout: 30000 } } },
  output: [{}]
});
const tgPublishing = node({
  type: 'n8n-nodes-base.telegram', version: 1.2,
  config: { name: 'Telegram: Wird veroeffentlicht', position: [4820, 200], credentials: TG, onError: 'continueRegularOutput',
    parameters: { resource: 'message', operation: 'sendMessage', chatId: CHAT,
      text: "={{ '🚀 Im Repo. GitHub prüft Build + SEO-Tests, dann stellt Netlify online (ca. 5–10 Min). Ich melde mich, sobald der Artikel live ist.' }}",
      additionalFields: { appendAttribution: false } } },
  output: [{ ok: true }]
});
const waitDeploy = node({
  type: 'n8n-nodes-base.wait', version: 1.1,
  config: { name: '4 Min warten', position: [5040, 200], parameters: { resume: 'timeInterval', amount: 4, unit: 'minutes' } },
  output: [{}]
});
const liveCheck = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Live-Check', position: [5260, 200], parameters: { jsCode: "const a = $('Vorschau bauen').first().json;\nconst h = this.helpers;\nconst sleep = (ms) => new Promise(r => setTimeout(r, ms));\nconst ok = async (url) => { try { await h.httpRequest({ method: 'HEAD', url, json: false }); return true; } catch (e) { return false; } };\nlet live = false;\nfor (let i = 0; i < 24 && !live; i++) {\n  live = await ok(a.live_url + '?nc=' + Date.now());\n  if (!live) await sleep(30000);\n}\nconst overlay = live && await ok(a.hero_overlay_url);\nconst story = live && await ok(a.story_url);\nconst img = overlay ? a.hero_overlay_url : a.hero_image;\nreturn [{ json: {\n  live, slug: a.slug, title: a.title, live_url: a.live_url,\n  social_body: {\n    secret: '<SOCIAL_SECRET>', source: a.mode === 'plan' ? 'Montags-Artikel (Plan)' : 'Spontan-Artikel (Telegram)',\n    title: a.title, description: a.description, live_url: a.live_url,\n    image_url: img, image_url_ig: img, story: story, story_image_url: story ? a.story_url : '',\n    channels: ['facebook', 'instagram', 'linkedin', 'gbp'], texts: a.social\n  }\n} }];\n" } },
  output: [{ live: true, live_url: 'u', title: 't', social_body: {} }]
});
const ifLive = ifElse({
  version: 2.2,
  config: { name: 'Live?', position: [5480, 200],
    parameters: { conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'loose' },
      conditions: [{ id: 'lv1', leftValue: '={{ $json.live }}', rightValue: true, operator: { type: 'boolean', operation: 'true', singleValue: true } }],
      combinator: 'and' }, options: {} } }
});
const tgLive = node({
  type: 'n8n-nodes-base.telegram', version: 1.2,
  config: { name: 'Telegram: Live', position: [5700, 100], credentials: TG, onError: 'continueRegularOutput',
    parameters: { resource: 'message', operation: 'sendMessage', chatId: CHAT,
      text: "={{ '✅ Live: ' + $json.live_url + '\\nSocial-Posts werden jetzt verschickt – Bericht folgt.' }}",
      additionalFields: { appendAttribution: false } } },
  output: [{ ok: true }]
});
const social = node({
  type: 'n8n-nodes-base.httpRequest', version: 4.2,
  config: { name: 'Social-Post ausloesen', position: [5920, 100], onError: 'continueRegularOutput',
    parameters: { method: 'POST', url: 'https://n8n.srv860817.hstgr.cloud/webhook/liar-social-post',
      sendBody: true, specifyBody: 'json', jsonBody: "={{ JSON.stringify($('Live-Check').first().json.social_body) }}",
      options: { timeout: 30000 } } },
  output: [{ message: 'Workflow was started' }]
});
const tgNotLive = node({
  type: 'n8n-nodes-base.telegram', version: 1.2,
  config: { name: 'Telegram: Nicht live', position: [5700, 300], credentials: TG,
    parameters: { resource: 'message', operation: 'sendMessage', chatId: CHAT,
      text: "={{ '⚠️ Artikel nach 16 Min noch nicht live: ' + $json.live_url + '\\nBitte GitHub → Actions → Auto-Publish Blog prüfen (Build/SEO-Test?). Social-Posts wurden NICHT verschickt.' }}",
      additionalFields: { appendAttribution: false } } },
  output: [{ ok: true }]
});

const note = sticky('## LIAR Artikel-Pipeline\nStart A: Topic-Master (Telegram, „eigenes“) mit Notiz + Fotos. Start B: LIAR-2026-10 Plan-Artikel (Montag 07:00) mit Thema aus liar_themen.\nOhne Fotos wählt „Bilder auswählen“ 1–3 passende Fotos aus dem Drive-Bildpool (liar_bilder; nicht 2× pro Quartal, Zeitung nie, Kindergesichter nie als Titelbild).\nAblauf: Artikel (Opus) → Faktencheck (Haiku) → Vorschau Mail + Telegram → Freigabe → Repo (draft:true, freigabe:ja) → Auto-Publish → Netlify → Live-Check → Social. Nach Commit: Bild-Nutzung + Thema-Status in den Datentabellen.\nEinmalig: Credential „GitHub LIAR (relaunch)“ in den beiden GitHub-Knoten.', [], { position: [0, -160], width: 760, height: 260 });

export default workflow('liar-spontan-artikel', 'LIAR-2026-08 Artikel-Pipeline (Spontan + Montag)')
  .add(fromTopicMaster).to(input)
  .add(manualTest).to(testData).to(input)
  .add(input).to(poolRead).to(pickImages).to(tgStart).to(pages).to(ifSpontan.onTrue(researchPrep.to(researchCall.to(researchEval.to(prompt)))).onFalse(prompt))
  .add(prompt).to(llmArticle).to(parse).to(llmCheck).to(checkEval).to(preview).to(mailPreview).to(tgPreview).to(waitApproval)
  .to(ifApproved
    .onTrue(imgList.to(ifPhotos.onTrue(ifTg.onTrue(tgDownload.to(buildFiles)).onFalse(driveDl.to(driveShrink).to(buildFiles))).onFalse(buildFiles)))
    .onFalse(tgRejected))
  .add(commitCheck).to(usage).to(updImg)
  .add(commitCheck).to(themeBook).to(updTheme)
  .add(buildFiles).to(focusPrep).to(focusCall).to(focusApply).to(ghBlobs).to(ghRef).to(ghHeadCommit).to(ghTreeCode).to(ghTree).to(ghCommit).to(ghRefUpdate).to(commitCheck).to(ghDispatch).to(tgPublishing).to(waitDeploy).to(liveCheck)
  .to(ifLive.onTrue(tgLive.to(social)).onFalse(tgNotLive))
  .add(note);
