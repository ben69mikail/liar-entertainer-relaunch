// Erzeugt die SDK-Quellen der SEO-Workflows aus seo-lib.cjs (Logik + Tests) und dem Klebe-Code hier.
//   node ops/n8n/gen-seo-workflows.mjs  →  ops/n8n/seo-woche.sdk.js, seo-entscheidung.sdk.js, seo-monat.sdk.js
// Danach per n8n-MCP validate_workflow + update_workflow hochladen. IDs: seo-workflow-ids.json.
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const DIR = dirname(fileURLToPath(import.meta.url));
const WF = { woche: 'NEU', entscheidung: 'NEU', monat: 'NEU', ...JSON.parse(readFileSync(join(DIR, 'seo-workflow-ids.json'), 'utf8')) };
// Lib je Code-Knoten: nur benötigte Funktionen, gebündelt + minifiziert (esbuild aus site/node_modules)
const esbuild = createRequire(join(DIR, '../../site/package.json'))('esbuild');
const LIB_SRC = readFileSync(join(DIR, 'seo-lib.cjs'), 'utf8');
const NAMES = Object.keys(createRequire(import.meta.url)('./seo-lib.cjs'));
const code = (glue) => {
  const used = NAMES.filter((n) => new RegExp('\\b' + n + '\\b').test(glue));
  // ESM ohne Hülle, Namen bleiben (n8n-Sandbox verträgt die esbuild-Getter-Hülle nicht), Export-Zeile entfernen
  let lib = esbuild.buildSync({
    stdin: { contents: LIB_SRC.split('if (typeof module')[0] + '\nexport { ' + used.join(', ') + ' };', resolveDir: DIR },
    bundle: true, treeShaking: true, write: false, format: 'esm', minifyWhitespace: true, minifySyntax: true, charset: 'utf8', platform: 'neutral',
  }).outputFiles[0].text;
  lib = lib.replace(/export\s*\{[^}]*\};?\s*$/, '');
  for (const n of used) if (!new RegExp('function ' + n + '\\(|(const|let|var) ' + n + '=').test(lib)) throw new Error('Lib-Funktion fehlt: ' + n);
  const js = '// seo-lib.cjs (Auszug, minifiziert; Quelle + Tests: ops/n8n/seo-lib.cjs, seo.test.mjs)\n' + lib + '\n' + (glue.includes('SITE') ? "const SITE = 'https://liar-entertainer.com';\n" : '') + '// --- Workflow ---\n' + glue.trim() + '\n';
  new Function('$', '$input', 'return (async () => {' + js + '})')(); // Syntax-/Namenskollisionen früh erkennen
  return JSON.stringify(js);
};
const plain = (glue) => JSON.stringify(glue.trim() + '\n');

const HEAD = `import { workflow, node, trigger, sticky, ifElse, switchCase, newCredential } from '@n8n/workflow-sdk';

const TG = { telegramApi: { id: 'NLiyAfhaGJ1NrflC', name: 'Telegram account' } };
const OR = { openRouterApi: { id: 'h1uhmQinQ2Z6yjPj', name: 'OpenRouter account' } };
const GM = { gmailOAuth2: { id: 'HZ5YPJTqnDsiHywa', name: 'Gmail account' } };
const GH = { githubApi: { id: 'UdnLtJujy5mHGq0R', name: 'GitHub LIAR (relaunch)' } };
const GOOGLE = { googleOAuth2Api: newCredential('Google SEO-Daten (GSC + GA4)') };
const CHAT = '2106974057';
const DT_SEO = { __rl: true, mode: 'id', value: '2K5V5CRomSaqf29u', cachedResultName: 'liar_seo_vorschlaege' };
const DT_THEMEN = { __rl: true, mode: 'id', value: 's1pqYJeqlI6NEJaR', cachedResultName: 'liar_themen' };
const REPO = 'https://api.github.com/repos/ben69mikail/liar-entertainer-relaunch';
const GSC = 'https://www.googleapis.com/webmasters/v3/sites/sc-domain%3Aliar-entertainer.com/searchAnalytics/query';
const AUTOMAP = { mappingMode: 'autoMapInputData', value: {}, matchingColumns: [], schema: [] };
const FULL = { timeout: 60000, response: { response: { fullResponse: true, neverError: true, responseFormat: 'json' } } };
`;

const http = (name, pos, cred, credType, method, url, body, extra = '') => `node({
  type: 'n8n-nodes-base.httpRequest', version: 4.2,
  config: { name: '${name}', position: [${pos}], credentials: ${cred}, ${extra}
    parameters: { method: '${method}', url: ${url},
      authentication: 'predefinedCredentialType', nodeCredentialType: '${credType}',${body ? `
      sendBody: true, specifyBody: 'json', jsonBody: ${body},` : ''}
      options: FULL } },
  output: [{ statusCode: 200, body: {} }]
})`;
const codeNode = (name, pos, js, extra = '') => `node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: '${name}', position: [${pos}], ${extra}parameters: { jsCode: ${js} } },
  output: [{}]
})`;
const tgSend = (name, pos, text, extra = '', keyboard = '') => `node({
  type: 'n8n-nodes-base.telegram', version: 1.2,
  config: { name: '${name}', position: [${pos}], credentials: TG, ${extra}
    parameters: { resource: 'message', operation: 'sendMessage', chatId: CHAT, text: ${text},${keyboard ? `
      replyMarkup: 'inlineKeyboard', inlineKeyboard: { rows: [{ row: { buttons: [${keyboard}] } }] },` : ''}
      additionalFields: { appendAttribution: false, parse_mode: 'HTML', disable_web_page_preview: true } } },
  output: [{ ok: true }]
})`;
const btn = (text, data) => `{ text: '${text}', additionalFields: { callback_data: "=${data}" } }`;
const dtGet = (name, pos, table) => `node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: '${name}', position: [${pos}], alwaysOutputData: true, executeOnce: true,
    parameters: { resource: 'row', operation: 'get', dataTableId: ${table}, returnAll: true } },
  output: [{ id: 1 }]
})`;
const dtInsert = (name, pos) => `node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: '${name}', position: [${pos}],
    parameters: { resource: 'row', operation: 'insert', dataTableId: DT_SEO, columns: AUTOMAP, options: {} } },
  output: [{ id: 1 }]
})`;
const dtUpdate = (name, pos, table, key) => `node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: '${name}', position: [${pos}], onError: 'continueRegularOutput',
    parameters: { resource: 'row', operation: 'update', dataTableId: ${table}, matchType: 'allConditions',
      filters: { conditions: [{ keyName: '${key}', condition: 'eq', keyValue: '={{ $json.${key} }}' }] },
      columns: AUTOMAP, options: {} } },
  output: [{ id: 1 }]
})`;
const ifNode = (name, pos, left) => `ifElse({
  version: 2.2,
  config: { name: '${name}', position: [${pos}],
    parameters: { conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'loose' },
      conditions: [{ id: 'c1', leftValue: ${left}, rightValue: true, operator: { type: 'boolean', operation: 'true', singleValue: true } }],
      combinator: 'and' }, options: {} } }
})`;
const startHook = (name, path) => `trigger({
  type: 'n8n-nodes-base.webhook', version: 2,
  config: { name: '${name}', position: [0, 420], parameters: { httpMethod: 'POST', path: '${path}', responseMode: 'onReceived', options: {} } },
  output: [{ body: { start: 'liar' } }]
})`;
const START_CHECK = `const src = $input.first().json;
if (src && src.body && src.body.start !== 'liar') throw new Error('Webhook: Body {"start":"liar"} fehlt');
const iso = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Berlin' });
const day = (o) => new Date(Date.now() - o * 86400000).toISOString().slice(0, 10);`;
const GH_URL = "'https://api.github.com/repos/ben69mikail/liar-entertainer-relaunch/contents/'";

// ================= LIAR-2026-11 GSC-Wochenvorschläge =================
const woche = `// n8n-Workflow „LIAR-2026-11 GSC-Wochenvorschläge“ (${WF.woche}) – GENERIERT von ops/n8n/gen-seo-workflows.mjs, nicht von Hand ändern.
${HEAD}
const sched = trigger({
  type: 'n8n-nodes-base.scheduleTrigger', version: 1.3,
  config: { name: 'Montag 07:00 UTC', position: [0, 200], parameters: { rule: { interval: [{ field: 'weeks', weeksInterval: 1, triggerAtDay: [1], triggerAtHour: 7, triggerAtMinute: 0 }] } } },
  output: [{}]
});
const hook = ${startHook('Jetzt starten (Webhook)', 'liar-seo-woche')};
const range = ${codeNode('Zeitraum', '220, 300', plain(`${START_CHECK}
// letzte 28 Tage mit fertigen GSC-Daten (≈ 3 Tage Verzug)
return [{ json: { startDate: day(30), endDate: day(3), iso } }];`))};
const gsc = ${http('GSC: Seiten × Suchbegriffe', '440, 300', 'GOOGLE', 'googleOAuth2Api', 'POST', 'GSC',
  `"={{ JSON.stringify({ startDate: $json.startDate, endDate: $json.endDate, dimensions: ['page', 'query'], rowLimit: 5000 }) }}"`)};
const readSeo = ${dtGet('Vorschläge lesen', '660, 300', 'DT_SEO')};
const find = ${codeNode('Chancen finden', '880, 300', code(`
const resp = $('GSC: Seiten × Suchbegriffe').first().json;
if (resp.statusCode !== 200) throw new Error('GSC-Abfrage fehlgeschlagen (HTTP ' + resp.statusCode + '): ' + JSON.stringify(resp.body || resp).slice(0, 300) + ' – Credential „Google SEO-Daten (GSC + GA4)“ prüfen (Scopes webmasters.readonly + analytics.readonly).');
const rows = (resp.body && resp.body.rows) || [];
const z = $('Zeitraum').first().json;
// Seiten, die in den letzten 6 Wochen schon vorgeschlagen wurden, ruhen lassen
const recent = $('Vorschläge lesen').all().map(i => i.json)
  .filter(r => r && r.typ === 'woche' && r.erstellt && (new Date(z.iso) - new Date(r.erstellt)) < 42 * 86400000).map(r => r.pfad);
const opps = pickOpportunities(rows, { minImpr: 30, maxPages: 5, exclude: recent });
const woche = isoWeek(new Date());
if (!opps.length) return [{ json: { none: true, rows: rows.length, woche, iso: z.iso } }];
const h = this.helpers;
let baseline = null;
try {
  const b = await h.httpRequest({ method: 'GET', url: 'https://raw.githubusercontent.com/ben69mikail/liar-entertainer-relaunch/main/site/tests/fixtures/meta-baseline.json', json: true });
  baseline = Object.keys(typeof b === 'string' ? JSON.parse(b) : b).map(normPath);
} catch (e) { baseline = null; }
for (const o of opps) {
  try { o.current = pageFacts(String(await h.httpRequest({ method: 'GET', url: SITE + o.path, json: false, timeout: 15000 }))); }
  catch (e) { o.current = { title: '', description: '', h1: '', faq: [] }; }
  // ohne Baseline lieber alles als Auftrag (sicher)
  o.route = baseline ? routeFor(o.path, baseline) : 'auftrag';
}
return [{ json: { none: false, opps, prompt: buildProposalPrompt(opps), woche, iso: z.iso } }];`))};
const ifAny = ${ifNode('Chancen gefunden?', '1100, 300', `"={{ $json.none === false }}"`)};
const tgNone = ${tgSend('Telegram: keine Chancen', '1320, 520', `"={{ '🔎 GSC-Woche ' + $json.woche + ': keine Seite auf Platz 5–20 mit auffällig wenig Klicks (' + $json.rows + ' Zeilen geprüft). Nichts zu tun.' }}"`, "executeOnce: true, onError: 'continueRegularOutput',")};
const llm = ${http('Claude: Vorschläge', '1320, 300', 'OR', 'openRouterApi', 'POST', "'https://openrouter.ai/api/v1/chat/completions'",
  `"={{ JSON.stringify({ model: 'anthropic/claude-opus-5.5', max_tokens: 6000, messages: [{ role: 'user', content: $json.prompt }] }) }}"`)};
const check = ${codeNode('Vorschläge prüfen', '1540, 300', code(`
const c = $('Chancen finden').first().json;
const resp = $input.first().json;
const api = resp.body || resp;
const txt = (api && api.choices && api.choices[0] && api.choices[0].message && api.choices[0].message.content) || '';
const props = parseProposals(txt, c.opps);
if (!props.length) return [{ json: { leer: true, woche: c.woche, status: resp.statusCode, roh: String(txt).slice(0, 300) } }];
const tag = Date.now().toString(36).slice(-3);
const full = props.map((p, i) => {
  const o = c.opps.find(x => x.path === p.path);
  return { ...p, vid: 'w' + c.woche.replace(/\\D/g, '') + '-' + (i + 1) + tag, woche: c.woche, route: o.route, current: o.current, queries: o.queries };
});
const tg = weeklyTelegram(full, c.woche);
return full.map((p, i) => ({ json: { leer: false, header: tg.header, tg_text: tg.items[i].text, woche: c.woche, iso: c.iso,
  row: { vid: p.vid, typ: 'woche', woche: c.woche, pfad: p.path, route: p.route, status: 'offen', daten: JSON.stringify(p), erstellt: c.iso, entschieden: '' } } }));`))};
const ifProps = ${ifNode('Gültige Vorschläge?', '1760, 300', `"={{ $json.leer === false }}"`)};
const tgEmpty = ${tgSend('Telegram: Modell ohne Ergebnis', '1980, 520', `"={{ '⚠️ GSC-Woche ' + $json.woche + ': Chancen gefunden, aber keine gültigen Vorschläge vom Modell (HTTP ' + $json.status + '). Nächste Woche neuer Versuch.' }}"`, "executeOnce: true, onError: 'continueRegularOutput',")};
const rowsOnly = ${codeNode('Zeilen', '1980, 300', plain(`return $input.all().map(i => ({ json: i.json.row }));`))};
const insert = ${dtInsert('Vorschläge speichern', '2200, 300')};
const tgHead = ${tgSend('Telegram: Übersicht', '2420, 300', `"={{ $('Vorschläge prüfen').first().json.header }}"`, 'executeOnce: true,',
  [btn('✅ Alle umsetzen', "seo_all:{{ $('Vorschläge prüfen').first().json.woche }}"), btn('❌ Keine', "seo_none:{{ $('Vorschläge prüfen').first().json.woche }}")].join(', '))};
const single = ${codeNode('Einzelnachrichten', '2640, 300', plain(`return $('Vorschläge prüfen').all().map(i => ({ json: { vid: i.json.row.vid, text: i.json.tg_text } }));`))};
const tgItem = ${tgSend('Telegram: Vorschlag', '2860, 300', `"={{ $json.text }}"`, '',
  [btn('✅ Umsetzen', 'seo_ok:{{ $json.vid }}'), btn('❌ Nein', 'seo_no:{{ $json.vid }}')].join(', '))};

const note = sticky('## LIAR-2026-11 GSC-Wochenvorschläge\\nMontag 07:00 UTC: GSC (28 Tage) → Seiten auf Platz 5–20 mit vielen Impressionen und CTR unter Erwartung (max. 5, je Seite 6 Wochen Ruhe) → Claude Opus schlägt Title/Description/FAQ vor (Faktenblatt, Preise nur Kindergeburtstag) → eine Übersicht + je Vorschlag ✅/❌ in Telegram.\\nEntscheidung: LIAR-2026-12 (über Topic-Master). Neue Blogartikel werden direkt geändert, Hauptseiten/Alt-Artikel als Auftrag in docs/seo-auftraege/offen/.\\nCredential „Google SEO-Daten (GSC + GA4)“ = Google OAuth2 API mit Scopes https://www.googleapis.com/auth/webmasters.readonly https://www.googleapis.com/auth/analytics.readonly\\nTest: POST /webhook/liar-seo-woche {\\"start\\":\\"liar\\"}. Quelle: ops/n8n/gen-seo-workflows.mjs', [], { position: [0, -160], width: 760, height: 240 });

export default workflow('${WF.woche}', 'LIAR-2026-11 GSC-Wochenvorschläge')
  .add(sched).to(range)
  .add(hook).to(range)
  .add(range).to(gsc).to(readSeo).to(find).to(ifAny.onTrue(llm).onFalse(tgNone))
  .add(llm).to(check).to(ifProps.onTrue(rowsOnly).onFalse(tgEmpty))
  .add(rowsOnly).to(insert).to(tgHead).to(single).to(tgItem)
  .add(note);
`;

// ================= LIAR-2026-12 SEO-Entscheidung =================
const entscheidung = `// n8n-Workflow „LIAR-2026-12 SEO-Entscheidung“ (${WF.entscheidung}) – GENERIERT von ops/n8n/gen-seo-workflows.mjs, nicht von Hand ändern.
// Aufruf durch LIAR-2026-Topic-Master bei Telegram-Buttons seo_ok/seo_no/seo_all/seo_none/mon_merge/mon_keep/mon_drop.
${HEAD}
const fromTm = trigger({
  type: 'n8n-nodes-base.executeWorkflowTrigger', version: 1.1,
  config: { name: 'Von Topic-Master', position: [0, 300], parameters: { inputSource: 'passthrough' } },
  output: [{ cb_action: 'seo_ok', arg: 'w202644-1abc', callback_query_id: '1' }]
});
const readSeo = ${dtGet('Vorschläge lesen', '220, 300', 'DT_SEO')};
const readThemen = ${dtGet('Themen lesen', '440, 300', 'DT_THEMEN')};
const plan = ${codeNode('Entscheidung planen', '660, 300', code(`
const inp = $('Von Topic-Master').first().json;
const act = String(inp.cb_action || ''), arg = String(inp.arg || '');
const iso = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Berlin' });
const rows = $('Vorschläge lesen').all().map(i => i.json).filter(r => r && r.vid);
const sel = (act === 'seo_all' || act === 'seo_none') ? rows.filter(r => r.typ === 'woche' && r.woche === arg && r.status === 'offen') : rows.filter(r => r.vid === arg);
const out = [], msgs = [];
if (!sel.length) msgs.push('Nichts zu tun – schon entschieden oder unbekannt.');
for (const r of sel) {
  if (r.status !== 'offen') { msgs.push(r.pfad + ': schon entschieden (' + r.status + ')'); continue; }
  let d = {};
  try { d = JSON.parse(r.daten || '{}'); } catch (e) {}
  d.vid = r.vid; d.woche = r.woche;
  if (act === 'seo_ok' || act === 'seo_all') {
    if (r.route === 'blog') {
      out.push({ op: 'gh', vid: r.vid, kind: 'blog', path: 'site/src/content/blog/' + r.pfad.split('/')[2] + '.md', proposal: d, message: 'seo: Title/Description/FAQ ' + r.pfad + ' (GSC-Vorschlag ' + r.vid + ')', ok_status: 'umgesetzt' });
      msgs.push('✅ ' + r.pfad + ': wird direkt geändert (Deploy + IndexNow laufen automatisch)');
    } else {
      out.push({ op: 'gh', vid: r.vid, kind: 'file', path: 'docs/seo-auftraege/offen/' + r.vid + '.md', content: auftragMarkdown(d, iso), message: 'seo-auftrag: ' + r.pfad + ' (' + r.vid + ') [skip netlify]', ok_status: 'auftrag' });
      msgs.push('📝 ' + r.pfad + ': Auftrag an Claude Code angelegt (Umsetzung mit Tests)');
    }
  } else if (act === 'seo_no' || act === 'seo_none') {
    out.push({ op: 'status', vid: r.vid, status: 'verworfen' }); msgs.push('❌ ' + r.pfad + ': verworfen');
  } else if (act === 'mon_merge') {
    out.push({ op: 'gh', vid: r.vid, kind: 'file', path: 'docs/seo-auftraege/offen/' + r.vid + '.md', content: mergeAuftragMarkdown(d, iso), message: 'seo-auftrag: zusammenführen ' + r.pfad + ' (' + r.vid + ') [skip netlify]', ok_status: 'zusammenfuehren' });
    msgs.push('🔀 ' + r.pfad + ': Auftrag zum Zusammenführen angelegt');
  } else if (act === 'mon_keep') {
    out.push({ op: 'status', vid: r.vid, status: 'behalten' }); msgs.push('📌 ' + r.pfad + ': bleibt (90 Tage Ruhe)');
  } else if (act === 'mon_drop') {
    const themes = $('Themen lesen').all().map(i => i.json).filter(t => t && t.key).map(t => ({ id: t.key, titel: (t.titel || '') + ' ' + (t.keywords || ''), status: t.status }));
    const ids = similarThemes(d.title || '', themes);
    for (const k of ids) out.push({ op: 'thema', key: k, status: 'verworfen' });
    out.push({ op: 'status', vid: r.vid, status: 'themen_gestrichen' });
    msgs.push('🗑 ' + r.pfad + ': ' + ids.length + ' ähnliche offene Themen gestrichen' + (ids.length ? ' (' + ids.join(', ') + ')' : ''));
  }
}
out.push({ op: 'summary', text: msgs.join('\\n') });
return out.map(j => ({ json: { ...j, iso, callback_query_id: inp.callback_query_id || '' } }));`))};
const route = switchCase({
  version: 3.2,
  config: { name: 'Art', position: [880, 300],
    parameters: { rules: { values: [${['gh', 'status', 'thema', 'summary'].map((k) => `
      { conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'strict' }, conditions: [{ leftValue: '={{ $json.op }}', rightValue: '${k}', operator: { type: 'string', operation: 'equals' } }], combinator: 'and' }, renameOutput: true, outputKey: '${k}' }`).join(',')}] }, options: {} } }
});
const ghGet = ${http('GitHub: Datei lesen', '1100, 100', 'GH', 'githubApi', 'GET', `"={{ ${GH_URL} + $json.path + '?ref=main' }}"`)};
const build = ${codeNode('Inhalt bauen', '1320, 100', code(`
const planned = $('Entscheidung planen').all().map(i => i.json).filter(j => j.op === 'gh');
return $input.all().map((it, i) => {
  const p = planned[i];
  const r = it.json;
  const sha = r.statusCode === 200 && r.body ? r.body.sha : undefined;
  try {
    let content;
    if (p.kind === 'blog') {
      if (r.statusCode !== 200) throw new Error('Artikel nicht gefunden (HTTP ' + r.statusCode + ')');
      content = applyBlogProposal(Buffer.from(r.body.content, 'base64').toString('utf8'), p.proposal, p.iso);
    } else content = p.content;
    const put = { message: p.message, content: Buffer.from(content, 'utf8').toString('base64'), branch: 'main' };
    if (sha) put.sha = sha;
    return { json: { ...p, ok: true, put } };
  } catch (e) { return { json: { ...p, ok: false, error: e.message, put: {} } }; }
});`))};
const ghPut = ${http('GitHub: Datei schreiben', '1540, 100', 'GH', 'githubApi', 'PUT', `"={{ ${GH_URL} + $json.path }}"`,
  `"={{ JSON.stringify($json.put) }}"`)};
const result = ${codeNode('Ergebnis', '1760, 100', plain(`
const built = $('Inhalt bauen').all().map(i => i.json);
return $input.all().map((it, i) => {
  const b = built[i];
  const ok = b.ok && [200, 201].includes(it.json.statusCode);
  const fehler = ok ? '' : (b.error || ('GitHub HTTP ' + it.json.statusCode + ': ' + JSON.stringify(it.json.body || '').slice(0, 160)));
  return { json: { vid: b.vid, status: ok ? b.ok_status : 'fehler', entschieden: b.iso, fehler, pfad: b.path } };
});`))};
const statusFromGh = ${codeNode('Status (GitHub)', '1980, 100', plain(`return $input.all().map(i => ({ json: { vid: i.json.vid, status: i.json.status, entschieden: i.json.entschieden } }));`))};
const updGh = ${dtUpdate('Status speichern (GitHub)', '2200, 100', 'DT_SEO', 'vid')};
const errs = ${codeNode('Fehler sammeln', '1980, -100', plain(`const f = $('Ergebnis').all().map(i => i.json).filter(j => j.fehler);
return f.length ? [{ json: { text: '⚠️ SEO-Umsetzung teilweise fehlgeschlagen:\\n' + f.map(j => '• ' + j.pfad + ': ' + j.fehler).join('\\n') } }] : [];`))};
const tgErr = ${tgSend('Telegram: Fehler', '2200, -100', `"={{ $json.text }}"`, "onError: 'continueRegularOutput',")};
const statusOnly = ${codeNode('Status', '1100, 300', plain(`return $input.all().map(i => ({ json: { vid: i.json.vid, status: i.json.status, entschieden: i.json.iso } }));`))};
const upd = ${dtUpdate('Status speichern', '1320, 300', 'DT_SEO', 'vid')};
const themaOnly = ${codeNode('Thema', '1100, 500', plain(`return $input.all().map(i => ({ json: { key: i.json.key, status: 'verworfen' } }));`))};
const updThema = ${dtUpdate('Thema streichen', '1320, 500', 'DT_THEMEN', 'key')};
const answer = node({
  type: 'n8n-nodes-base.telegram', version: 1.2,
  config: { name: 'TG: Klick bestätigen', position: [1100, 700], credentials: TG, onError: 'continueRegularOutput',
    parameters: { resource: 'callback', operation: 'answerQuery', queryId: "={{ $json.callback_query_id || 'none' }}",
      additionalFields: { text: '✔️ Entscheidung gespeichert', show_alert: false } } },
  output: [{ ok: true }]
});
const tgSum = ${tgSend('Telegram: Ergebnis', '1320, 700', `"={{ $('Entscheidung planen').all().map(i => i.json).find(j => j.op === 'summary').text }}"`, "onError: 'continueRegularOutput',")};

const note = sticky('## LIAR-2026-12 SEO-Entscheidung\\nWird vom Topic-Master bei Telegram-Buttons seo_*/mon_* aufgerufen.\\n✅ Blog (neue Artikel) → Markdown per GitHub-API ändern (löst Deploy + IndexNow aus). ✅ Hauptseite/Alt-Artikel und 🔀 → Auftrag docs/seo-auftraege/offen/<vid>.md [skip netlify]. 📌/❌ → nur Status. 🗑 → ähnliche offene Themen in liar_themen auf verworfen.\\nStatus in liar_seo_vorschlaege: offen → umgesetzt/auftrag/zusammenfuehren/verworfen/behalten/themen_gestrichen/fehler.', [], { position: [0, -160], width: 760, height: 200 });

export default workflow('${WF.entscheidung}', 'LIAR-2026-12 SEO-Entscheidung')
  .add(fromTm).to(readSeo).to(readThemen).to(plan).to(route
    .onCase(0, ghGet.to(build.to(ghPut.to(result))))
    .onCase(1, statusOnly.to(upd))
    .onCase(2, themaOnly.to(updThema))
    .onCase(3, answer.to(tgSum)))
  .add(result).to(statusFromGh).to(updGh).to(errs).to(tgErr)
  .add(note);
`;

// ================= LIAR-2026-13 Monatsbericht =================
const monat = `// n8n-Workflow „LIAR-2026-13 Monatsbericht Blog“ (${WF.monat}) – GENERIERT von ops/n8n/gen-seo-workflows.mjs, nicht von Hand ändern.
${HEAD}
const sched = trigger({
  type: 'n8n-nodes-base.scheduleTrigger', version: 1.3,
  config: { name: 'Monatserster 07:00 UTC', position: [0, 200], parameters: { rule: { interval: [{ field: 'months', monthsInterval: 1, triggerAtDayOfMonth: 1, triggerAtHour: 7, triggerAtMinute: 0 }] } } },
  output: [{}]
});
const hook = ${startHook('Jetzt starten (Webhook)', 'liar-seo-monat')};
const range = ${codeNode('Zeitraum', '220, 300', plain(`${START_CHECK}
const d = new Date(iso + 'T12:00:00Z'); d.setUTCDate(0);
return [{ json: { startDate: day(92), endDate: day(3), iso, monat: d.toISOString().slice(0, 7) } }];`))};
const ghList = ${http('GitHub: Artikel auflisten', '440, 300', 'GH', 'githubApi', 'GET', "REPO + '/contents/site/src/content/blog?ref=main'", '')};
const gscPage = ${http('GSC: Artikel', '660, 300', 'GOOGLE', 'googleOAuth2Api', 'POST', 'GSC',
  `"={{ JSON.stringify({ startDate: $('Zeitraum').first().json.startDate, endDate: $('Zeitraum').first().json.endDate, dimensions: ['page'], rowLimit: 1000, dimensionFilterGroups: [{ filters: [{ dimension: 'page', operator: 'contains', expression: '/blog/' }] }] }) }}"`)};
const gscPq = ${http('GSC: Seiten × Suchbegriffe', '880, 300', 'GOOGLE', 'googleOAuth2Api', 'POST', 'GSC',
  `"={{ JSON.stringify({ startDate: $('Zeitraum').first().json.startDate, endDate: $('Zeitraum').first().json.endDate, dimensions: ['page', 'query'], rowLimit: 10000 }) }}"`)};
const gaAcc = ${http('GA4: Properties', '1100, 300', 'GOOGLE', 'googleOAuth2Api', 'GET', "'https://analyticsadmin.googleapis.com/v1beta/accountSummaries'", '')};
const gaPick = ${codeNode('GA4-Property wählen', '1320, 300', plain(`
const b = $input.first().json.body || {};
const props = (b.accountSummaries || []).flatMap(a => (a.propertySummaries || []).map(p => ({ id: p.property, name: (a.displayName || '') + ' ' + (p.displayName || '') })));
const hit = props.find(p => /liar|entertainer|zauber|clown/i.test(p.name)) || props[0];
return [{ json: { property: hit ? hit.id : '', name: hit ? hit.name : '', fehler: hit ? '' : 'Keine GA4-Property gefunden (HTTP ' + $input.first().json.statusCode + ')' } }];`))};
const gaRun = ${http('GA4: Einstiege Blog', '1540, 300', 'GOOGLE', 'googleOAuth2Api', 'POST', `"={{ 'https://analyticsdata.googleapis.com/v1beta/' + ($json.property || 'properties/0') + ':runReport' }}"`,
  `"={{ JSON.stringify({ dateRanges: [{ startDate: '90daysAgo', endDate: 'yesterday' }], dimensions: [{ name: 'landingPage' }], metrics: [{ name: 'sessions' }, { name: 'keyEvents' }], dimensionFilter: { filter: { fieldName: 'landingPage', stringFilter: { matchType: 'BEGINS_WITH', value: '/blog/' } } }, limit: 1000 }) }}"`)};
const readSeo = ${dtGet('Vorschläge lesen', '1760, 300', 'DT_SEO')};
const report = ${codeNode('Bericht', '1980, 300', code(`
const z = $('Zeitraum').first().json;
const warn = [];
const list = $('GitHub: Artikel auflisten').first().json;
const files = (list.statusCode === 200 && Array.isArray(list.body)) ? list.body.filter(f => f.type === 'file' && /\\.md$/.test(f.name)) : [];
if (!files.length) warn.push('Artikelliste von GitHub nicht lesbar (HTTP ' + list.statusCode + ')');
const posts = [];
for (const f of files) {
  try { const p = parsePost(f.name.replace(/\\.md$/, ''), String(await this.helpers.httpRequest({ method: 'GET', url: f.download_url, json: false, timeout: 15000 }))); if (p) posts.push(p); } catch (e) {}
}
const g1 = $('GSC: Artikel').first().json, g2 = $('GSC: Seiten × Suchbegriffe').first().json, ga = $('GA4: Einstiege Blog').first().json;
if (g1.statusCode !== 200) warn.push('GSC nicht abrufbar (HTTP ' + g1.statusCode + ') – Credential „Google SEO-Daten (GSC + GA4)“ prüfen');
const gaPickJ = $('GA4-Property wählen').first().json;
if (gaPickJ.fehler) warn.push(gaPickJ.fehler);
else if (ga.statusCode !== 200) warn.push('GA4 nicht abrufbar (HTTP ' + ga.statusCode + '): ' + JSON.stringify(ga.body || '').slice(0, 160));
const ga4 = ((ga.body && ga.body.rows) || []).map(r => ({ path: r.dimensionValues[0].value, sessions: Number(r.metricValues[0].value), keyEvents: Number(r.metricValues[1].value) }));
const seo = $('Vorschläge lesen').all().map(i => i.json).filter(r => r && r.typ === 'monat');
const ruhe = seo.filter(r => r.status === 'offen' || (r.status === 'behalten' && r.entschieden && (new Date(z.iso) - new Date(r.entschieden)) < 90 * 86400000)).map(r => String(r.pfad).split('/')[2]);
const r = monthlyReport({ posts, gscPage: (g1.body && g1.body.rows) || [], gscPageQuery: (g2.body && g2.body.rows) || [], ga4, today: z.iso, behalten: ruhe });
const tag = Date.now().toString(36).slice(-3);
r.monat = z.monat;
r.ohneWirkung = r.ohneWirkung.map((x, i) => ({ ...x, vid: 'm' + z.monat.replace('-', '') + '-' + (i + 1) + tag, monat: z.monat }));
const tg = monthlyTelegram(r);
const text = tg.text + (warn.length ? '\\n\\n⚠️ ' + warn.join('\\n⚠️ ') : '');
const e = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const html = '<div style="font-family:Arial,sans-serif;max-width:900px"><h2>Monatsbericht Blog ' + e(z.monat) + '</h2><p>Zeitraum ' + z.startDate + ' bis ' + z.endDate + ' (GSC) bzw. 90 Tage (GA4, Einstiegsseite). Anfragen = Schlüsselereignisse (kontakt_anfrage, whatsapp_click, phone_click, email_click) in Sitzungen, die auf dem Artikel begannen.</p>' +
  '<table border="1" cellpadding="6" style="border-collapse:collapse;font-size:13px"><tr><th>Artikel</th><th>Alter (Tage)</th><th>Klicks</th><th>Impr.</th><th>Pos.</th><th>Sitzungen</th><th>Anfragen</th><th>Urteil</th><th>Zielseite</th></tr>' +
  r.rows.map(x => '<tr><td><a href="https://liar-entertainer.com' + x.path + '">' + e(x.title) + '</a></td><td>' + x.alterTage + '</td><td>' + x.klicks + '</td><td>' + x.impressionen + '</td><td>' + (x.position || '–') + '</td><td>' + x.sitzungen + '</td><td>' + x.anfragen + '</td><td>' + x.urteil + '</td><td>' + e(x.ziel) + '</td></tr>').join('') + '</table>' +
  (r.kannibal.length ? '<h3>Kannibalisierung</h3><ul>' + r.kannibal.map(k => '<li>„' + e(k.query) + '“: ' + k.artikel + ' (Pos. ' + k.artikelPos + ') vs. ' + k.seite + ' (Pos. ' + k.seitePos + '), ' + k.impressionen + ' Impr.</li>').join('') + '</ul>' : '') +
  (warn.length ? '<p style="color:#b45309">⚠️ ' + warn.map(e).join('<br>⚠️ ') + '</p>' : '') + '<p>Entscheidungen zu Artikeln ohne Wirkung: per Telegram.</p></div>';
const rows = r.ohneWirkung.map((x, i) => ({ vid: x.vid, text: tg.items[i].text,
  row: { vid: x.vid, typ: 'monat', woche: z.monat, pfad: x.path, route: 'auftrag', status: 'offen', daten: JSON.stringify(x), erstellt: z.iso, entschieden: '' } }));
return [{ json: { text, html, monat: z.monat, rows } }];`))};
const tgReport = ${tgSend('Telegram: Bericht', '2200, 300', `"={{ $json.text }}"`, "onError: 'continueRegularOutput',")};
const mail = node({
  type: 'n8n-nodes-base.gmail', version: 2.1,
  config: { name: 'E-Mail: Bericht', position: [2420, 300], credentials: GM, onError: 'continueRegularOutput',
    parameters: { resource: 'message', operation: 'send', sendTo: 'info@liar-entertainer.com',
      subject: "={{ '[LIAR Blog] Monatsbericht ' + $('Bericht').first().json.monat }}", emailType: 'html',
      message: "={{ $('Bericht').first().json.html }}", options: { appendAttribution: false } } },
  output: [{ id: 'm1' }]
});
const split = ${codeNode('Entscheidungen', '2640, 300', plain(`return ($('Bericht').first().json.rows || []).map(r => ({ json: r }));`))};
const rowsOnly = ${codeNode('Zeilen', '2860, 300', plain(`return $input.all().map(i => ({ json: i.json.row }));`))};
const insert = ${dtInsert('Entscheidungen speichern', '3080, 300')};
const again = ${codeNode('Nachrichten', '3300, 300', plain(`return $('Entscheidungen').all().map(i => ({ json: { vid: i.json.vid, text: i.json.text } }));`))};
const tgItem = ${tgSend('Telegram: Artikel ohne Wirkung', '3520, 300', `"={{ $json.text }}"`, '',
  [btn('🔀 Zusammenführen', 'mon_merge:{{ $json.vid }}'), btn('📌 Behalten', 'mon_keep:{{ $json.vid }}'), btn('🗑 Themen', 'mon_drop:{{ $json.vid }}')].join(', '))};

const note = sticky('## LIAR-2026-13 Monatsbericht Blog\\nMonatserster 07:00 UTC: je Blogartikel (site/src/content/blog) Klicks/Impressionen/Position (GSC, 90 Tage) und Sitzungen/Anfragen als Einstiegsseite (GA4, Schlüsselereignisse). Urteil: zu neu (< 60 T.) · ohne Wirkung (≥ 90 T., < 5 Klicks, < 20 Sitzungen, 0 Anfragen) · wirkt. Warnung bei Kannibalisierung (Artikel und Leistungsseite ranken für dieselbe Suche, Artikel höchstens 3 Plätze dahinter).\\nTelegram + Mail; je Artikel ohne Wirkung 🔀/📌/🗑 → LIAR-2026-12.\\nTest: POST /webhook/liar-seo-monat {\\"start\\":\\"liar\\"}. Quelle: ops/n8n/gen-seo-workflows.mjs', [], { position: [0, -160], width: 760, height: 220 });

export default workflow('${WF.monat}', 'LIAR-2026-13 Monatsbericht Blog')
  .add(sched).to(range)
  .add(hook).to(range)
  .add(range).to(ghList).to(gscPage).to(gscPq).to(gaAcc).to(gaPick).to(gaRun).to(readSeo).to(report).to(tgReport).to(mail).to(split).to(rowsOnly).to(insert).to(again).to(tgItem)
  .add(note);
`;

// unsichtbare Zeichen als \\uXXXX (sonst beim Kopieren/Hochladen nicht erkennbar)
const vis = (t) => t.replace(/[\u00AD\u200B-\u200F\u2028\u2029\uFE0E\uFE0F\uFEFF]/g, (c) => '\\u' + c.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0'));
// nur genutzte Konstanten im Kopf behalten
const prune = (t) => {
  const lines = t.split('\n');
  return lines.filter((l) => { const m = l.match(/^const ([A-Z_]+) = /); return !m || new RegExp('\\b' + m[1] + '\\b').test(lines.filter((x) => x !== l).join('\n')); }).join('\n')
    .replace(/import \{ ([^}]+) \} from/, (all, names) => 'import { ' + names.split(', ').filter((n) => new RegExp('\\b' + n + '\\(').test(t.split('\n').slice(3).join('\n'))).join(', ') + ' } from');
};
writeFileSync(join(DIR, 'seo-woche.sdk.js'), vis(prune(woche)));
writeFileSync(join(DIR, 'seo-entscheidung.sdk.js'), vis(prune(entscheidung)));
writeFileSync(join(DIR, 'seo-monat.sdk.js'), vis(prune(monat)));
console.log('ok', WF);
