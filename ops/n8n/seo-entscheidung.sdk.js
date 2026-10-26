// n8n-Workflow „LIAR-2026-12 SEO-Entscheidung“ (bduk9s2mEdjkLvRr) – GENERIERT von ops/n8n/gen-seo-workflows.mjs, nicht von Hand ändern.
// Aufruf durch LIAR-2026-Topic-Master bei Telegram-Buttons seo_ok/seo_no/seo_all/seo_none/mon_merge/mon_keep/mon_drop.
import { workflow, node, trigger, sticky, switchCase, newCredential } from '@n8n/workflow-sdk';

const TG = { telegramApi: { id: 'NLiyAfhaGJ1NrflC', name: 'Telegram account' } };
const GH = { githubApi: { id: 'UdnLtJujy5mHGq0R', name: 'GitHub LIAR (relaunch)' } };
const CHAT = '2106974057';
const DT_SEO = { __rl: true, mode: 'id', value: '2K5V5CRomSaqf29u', cachedResultName: 'liar_seo_vorschlaege' };
const DT_THEMEN = { __rl: true, mode: 'id', value: 's1pqYJeqlI6NEJaR', cachedResultName: 'liar_themen' };
const GSC = 'https://www.googleapis.com/webmasters/v3/sites/sc-domain%3Aliar-entertainer.com/searchAnalytics/query';
const AUTOMAP = { mappingMode: 'autoMapInputData', value: {}, matchingColumns: [], schema: [] };
const FULL = { timeout: 60000, response: { response: { fullResponse: true, neverError: true, responseFormat: 'json' } } };

const fromTm = trigger({
  type: 'n8n-nodes-base.executeWorkflowTrigger', version: 1.1,
  config: { name: 'Von Topic-Master', position: [0, 300], parameters: { inputSource: 'passthrough' } },
  output: [{ cb_action: 'seo_ok', arg: 'w202644-1abc', callback_query_id: '1' }]
});
const readSeo = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Vorschläge lesen', position: [220, 300], alwaysOutputData: true, executeOnce: true,
    parameters: { resource: 'row', operation: 'get', dataTableId: DT_SEO, returnAll: true } },
  output: [{ id: 1 }]
});
const readThemen = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Themen lesen', position: [440, 300], alwaysOutputData: true, executeOnce: true,
    parameters: { resource: 'row', operation: 'get', dataTableId: DT_THEMEN, returnAll: true } },
  output: [{ id: 1 }]
});
const plan = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Entscheidung planen', position: [660, 300], parameters: { jsCode: "// seo-lib.cjs (Auszug, minifiziert; Quelle + Tests: ops/n8n/seo-lib.cjs, seo.test.mjs)\nvar FAKTEN=[\"FAKTENBLATT (einzige Quelle – nichts darüber hinaus behaupten):\",\"- Michaël Prescler, als „Clown Zauberer LIAR“, Gladbeck (NRW). Telefon +49 172 1517578, info@liar-entertainer.com\",\"- Hauptberuflich seit 2009 (17 Jahre Erfahrung), über 400 Auftritte pro Jahr, 5,0 Sterne bei 390+ Google-Bewertungen, pädagogische Ausbildung, erweitertes Führungszeugnis, Haftpflichtversicherung. Aus Frankreich.\",\"- Shows auf Deutsch; auf Wunsch Französisch, Englisch, Spanisch (Erwachsenen-Bühnenshow nicht Spanisch).\",\"- Kindershow ca. 40 Min., Erwachsenen-Bühnenshow ca. 30 Min. Kindergeburtstage Mo–Do ab 13 Uhr, Kitas/Schulen vormittags ab 8 Uhr.\",\"- PREISE NUR im Zusammenhang Kindergeburtstag: Zaubershow 150 € Festpreis (40 Min., bis ca. 12 Kinder, ab 4 J.), + Ballonmodellage 20 €, + Glitzer-Tattoos 40 €, Komplett-Paket 210 €, Fahrtkosten 0,40 €/km ab Gladbeck. Alles andere: „auf Anfrage“.\",\"- Glitzer-Tattoos nur als Zusatz zur Zaubershow (privat), nie einzeln. Ballonmodellage nur mit Zaubershow oder Walk-Act ab 3 Std.\",\"- Keine Mitgliedschaften, keine Auszeichnungen, keine Firmennamen als Referenz. Keine Rabatte, keine Gratis-Zugaben.\"].join(`\n`);function auftragMarkdown(p,isoDate){return[\"# SEO-Auftrag \"+p.vid+\" – \"+p.path,\"\",\"Freigegeben vom Inhaber am \"+isoDate+\" (Telegram, GSC-Wochenvorschlag \"+(p.woche||\"\")+\").\",\"\",\"## Umsetzen\",\"- Title → `\"+p.seoTitle+\"` (jetzt: \"+(p.current&&p.current.title||\"–\")+\")\",\"- Description → `\"+p.description+\"`\",...(p.faq||[]).map(f=>\"- FAQ ergänzen (sichtbar + FAQPage-Schema): **\"+f.frage+\"** – \"+f.antwort),\"\",\"## Warum\",(p.grund||\"\")+\" Suchbegriffe: \"+(p.queries||[]).map(q=>q.query+\" (\"+q.impressions+\" Impr., \"+q.clicks+\" Klicks, Pos. \"+q.position+\")\").join(\"; \"),\"\",\"## Pflicht\",\"- Abweichung in `site/tests/fixtures/meta-changes.json` bzw. `content-changes.json` und `docs/CHANGES-METAS.md` eintragen.\",\"- `npm test`, `npm run test:dist`, `npm run test:seo` grün; danach diese Datei nach `docs/seo-auftraege/erledigt/` verschieben.\",\"\"].join(`\n`)}var STOP=new Set([\"einen\",\"einer\",\"eines\",\"für\",\"fuer\",\"beim\",\"oder\",\"und\",\"mit\",\"dem\",\"den\",\"der\",\"die\",\"das\",\"zum\",\"zur\",\"ein\",\"eine\",\"was\",\"wie\",\"auf\",\"von\",\"tipps\",\"ideen\"]),words=s=>new Set(String(s||\"\").toLowerCase().replace(/[^a-zäöüß0-9 ]/g,\" \").split(/\\s+/).filter(w=>w.length>=4&&!STOP.has(w)));function similarThemes(title,themes){let t=words(title);return(themes||[]).filter(x=>String(x.status||\"\")===\"offen\").filter(x=>[...words(x.titel||x.thema||\"\")].filter(w=>t.has(w)).length>=2).map(x=>x.id)}function mergeAuftragMarkdown(x,isoDate){return[\"# Zusammenführen \"+x.vid+\" – \"+x.path,\"\",\"Freigegeben vom Inhaber am \"+isoDate+\" (Telegram, Monatsbericht \"+(x.monat||\"\")+\"): Artikel ohne Wirkung (\"+x.klicks+\" Klicks, \"+x.sitzungen+\" Sitzungen, \"+x.anfragen+\" Anfragen in 90 Tagen).\",\"\",\"## Umsetzen\",\"- Brauchbare Inhalte (Fakten, FAQ) in \"+(x.ziel||\"die passende Leistungsseite\")+\" übernehmen – nur, wenn dort noch nicht vorhanden; sonst nichts übernehmen.\",\"- 301 `\"+x.path+\"` → `\"+(x.ziel||\"/\")+\"` in `site/public/_redirects`, Artikel löschen (Sitemap, Footer-News und Blog-Liste aktualisieren sich selbst).\",\"- Tests anpassen, falls der Artikel dort fest erwartet wird (`tests/dist/blog.test.ts`, URL-Vertrag nur bei Alt-Artikeln: dann 301 dokumentieren).\",\"- `npm test`, `npm run test:dist`, `npm run test:seo` grün; Datei danach nach `docs/seo-auftraege/erledigt/`.\",\"\"].join(`\n`)}\n// --- Workflow ---\nconst inp = $('Von Topic-Master').first().json;\nconst act = String(inp.cb_action || ''), arg = String(inp.arg || '');\nconst iso = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Berlin' });\nconst rows = $('Vorschläge lesen').all().map(i => i.json).filter(r => r && r.vid);\nconst sel = (act === 'seo_all' || act === 'seo_none') ? rows.filter(r => r.typ === 'woche' && r.woche === arg && r.status === 'offen') : rows.filter(r => r.vid === arg);\nconst out = [], msgs = [];\nif (!sel.length) msgs.push('Nichts zu tun – schon entschieden oder unbekannt.');\nfor (const r of sel) {\n  if (r.status !== 'offen') { msgs.push(r.pfad + ': schon entschieden (' + r.status + ')'); continue; }\n  let d = {};\n  try { d = JSON.parse(r.daten || '{}'); } catch (e) {}\n  d.vid = r.vid; d.woche = r.woche;\n  if (act === 'seo_ok' || act === 'seo_all') {\n    if (r.route === 'blog') {\n      out.push({ op: 'gh', vid: r.vid, kind: 'blog', path: 'site/src/content/blog/' + r.pfad.split('/')[2] + '.md', proposal: d, message: 'seo: Title/Description/FAQ ' + r.pfad + ' (GSC-Vorschlag ' + r.vid + ')', ok_status: 'umgesetzt' });\n      msgs.push('✅ ' + r.pfad + ': wird direkt geändert (Deploy + IndexNow laufen automatisch)');\n    } else {\n      out.push({ op: 'gh', vid: r.vid, kind: 'file', path: 'docs/seo-auftraege/offen/' + r.vid + '.md', content: auftragMarkdown(d, iso), message: 'seo-auftrag: ' + r.pfad + ' (' + r.vid + ') [skip netlify]', ok_status: 'auftrag' });\n      msgs.push('📝 ' + r.pfad + ': Auftrag an Claude Code angelegt (Umsetzung mit Tests)');\n    }\n  } else if (act === 'seo_no' || act === 'seo_none') {\n    out.push({ op: 'status', vid: r.vid, status: 'verworfen' }); msgs.push('❌ ' + r.pfad + ': verworfen');\n  } else if (act === 'mon_merge') {\n    out.push({ op: 'gh', vid: r.vid, kind: 'file', path: 'docs/seo-auftraege/offen/' + r.vid + '.md', content: mergeAuftragMarkdown(d, iso), message: 'seo-auftrag: zusammenführen ' + r.pfad + ' (' + r.vid + ') [skip netlify]', ok_status: 'zusammenfuehren' });\n    msgs.push('🔀 ' + r.pfad + ': Auftrag zum Zusammenführen angelegt');\n  } else if (act === 'mon_keep') {\n    out.push({ op: 'status', vid: r.vid, status: 'behalten' }); msgs.push('📌 ' + r.pfad + ': bleibt (90 Tage Ruhe)');\n  } else if (act === 'mon_drop') {\n    const themes = $('Themen lesen').all().map(i => i.json).filter(t => t && t.key).map(t => ({ id: t.key, titel: (t.titel || '') + ' ' + (t.keywords || ''), status: t.status }));\n    const ids = similarThemes(d.title || '', themes);\n    for (const k of ids) out.push({ op: 'thema', key: k, status: 'verworfen' });\n    out.push({ op: 'status', vid: r.vid, status: 'themen_gestrichen' });\n    msgs.push('🗑 ' + r.pfad + ': ' + ids.length + ' ähnliche offene Themen gestrichen' + (ids.length ? ' (' + ids.join(', ') + ')' : ''));\n  }\n}\nout.push({ op: 'summary', text: msgs.join('\\n') });\nreturn out.map(j => ({ json: { ...j, iso, callback_query_id: inp.callback_query_id || '' } }));\n" } },
  output: [{}]
});
const route = switchCase({
  version: 3.2,
  config: { name: 'Art', position: [880, 300],
    parameters: { rules: { values: [
      { conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'strict' }, conditions: [{ leftValue: '={{ $json.op }}', rightValue: 'gh', operator: { type: 'string', operation: 'equals' } }], combinator: 'and' }, renameOutput: true, outputKey: 'gh' },
      { conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'strict' }, conditions: [{ leftValue: '={{ $json.op }}', rightValue: 'status', operator: { type: 'string', operation: 'equals' } }], combinator: 'and' }, renameOutput: true, outputKey: 'status' },
      { conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'strict' }, conditions: [{ leftValue: '={{ $json.op }}', rightValue: 'thema', operator: { type: 'string', operation: 'equals' } }], combinator: 'and' }, renameOutput: true, outputKey: 'thema' },
      { conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'strict' }, conditions: [{ leftValue: '={{ $json.op }}', rightValue: 'summary', operator: { type: 'string', operation: 'equals' } }], combinator: 'and' }, renameOutput: true, outputKey: 'summary' }] }, options: {} } }
});
const ghGet = node({
  type: 'n8n-nodes-base.httpRequest', version: 4.2,
  config: { name: 'GitHub: Datei lesen', position: [1100, 100], credentials: GH, 
    parameters: { method: 'GET', url: "={{ 'https://api.github.com/repos/ben69mikail/liar-entertainer-relaunch/contents/' + $json.path + '?ref=main' }}",
      authentication: 'predefinedCredentialType', nodeCredentialType: 'githubApi',
      options: FULL } },
  output: [{ statusCode: 200, body: {} }]
});
const build = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Inhalt bauen', position: [1320, 100], parameters: { jsCode: "// seo-lib.cjs (Auszug, minifiziert; Quelle + Tests: ops/n8n/seo-lib.cjs, seo.test.mjs)\nvar FAKTEN=[\"FAKTENBLATT (einzige Quelle – nichts darüber hinaus behaupten):\",\"- Michaël Prescler, als „Clown Zauberer LIAR“, Gladbeck (NRW). Telefon +49 172 1517578, info@liar-entertainer.com\",\"- Hauptberuflich seit 2009 (17 Jahre Erfahrung), über 400 Auftritte pro Jahr, 5,0 Sterne bei 390+ Google-Bewertungen, pädagogische Ausbildung, erweitertes Führungszeugnis, Haftpflichtversicherung. Aus Frankreich.\",\"- Shows auf Deutsch; auf Wunsch Französisch, Englisch, Spanisch (Erwachsenen-Bühnenshow nicht Spanisch).\",\"- Kindershow ca. 40 Min., Erwachsenen-Bühnenshow ca. 30 Min. Kindergeburtstage Mo–Do ab 13 Uhr, Kitas/Schulen vormittags ab 8 Uhr.\",\"- PREISE NUR im Zusammenhang Kindergeburtstag: Zaubershow 150 € Festpreis (40 Min., bis ca. 12 Kinder, ab 4 J.), + Ballonmodellage 20 €, + Glitzer-Tattoos 40 €, Komplett-Paket 210 €, Fahrtkosten 0,40 €/km ab Gladbeck. Alles andere: „auf Anfrage“.\",\"- Glitzer-Tattoos nur als Zusatz zur Zaubershow (privat), nie einzeln. Ballonmodellage nur mit Zaubershow oder Walk-Act ab 3 Std.\",\"- Keine Mitgliedschaften, keine Auszeichnungen, keine Firmennamen als Referenz. Keine Rabatte, keine Gratis-Zugaben.\"].join(`\n`);var clean=s=>String(s||\"\").replace(/\\s+/g,\" \").replace(/\"/g,\"'\").replace(/[\\p{Extended_Pictographic}\uFE0F\u200D]/gu,\"\").trim();function setFm(fm,key,line,after){let re=new RegExp(\"^\"+key+\":.*$\",\"m\");if(re.test(fm))return fm.replace(re,line);let reA=new RegExp(\"^\"+after+\":.*$\",\"m\");return reA.test(fm)?fm.replace(reA,m=>m+`\n`+line):fm+`\n`+line}function applyBlogProposal(md,p,isoDate){md=String(md).replace(/\\r\\n/g,`\n`);let m=String(md).match(/^---\\n([\\s\\S]*?)\\n---\\n?/);if(!m)throw new Error(\"Frontmatter fehlt\");let fm=m[1];fm=setFm(fm,\"seoTitle\",\"seoTitle: \"+JSON.stringify(clean(p.seoTitle)),\"title\"),fm=setFm(fm,\"description\",\"description: \"+JSON.stringify(clean(p.description)),\"seoTitle\"),fm=setFm(fm,\"updatedDate\",\"updatedDate: \"+isoDate,\"publishDate\");let body=String(md).slice(m[0].length),faq=(p.faq||[]).filter(f=>f.frage&&f.antwort);if(faq.length){let block=faq.map(f=>\"### \"+f.frage+`\n\n`+f.antwort).join(`\n\n`),h=body.match(/^##\\s[^\\n]*Häufige Fragen[^\\n]*$/m);if(h){let start=h.index+h[0].length,nextH2=body.slice(start).search(/^## /m),end=nextH2<0?body.length:start+nextH2,sec=body.slice(start,end),lastQ=sec.lastIndexOf(`\n### `),ins;if(lastQ<0)ins=start;else{let k=sec.indexOf(`\n`,lastQ+1);for(;sec[k]===`\n`;)k++;let parEnd=sec.indexOf(`\n\n`,k);ins=start+(parEnd<0?sec.replace(/\\s+$/,\"\").length:parEnd)}body=body.slice(0,ins)+`\n\n`+block+body.slice(ins)}else body=body.replace(/\\s*$/,\"\")+`\n\n## ❓ Häufige Fragen\n\n`+block+`\n`}return`---\n`+fm+`\n---\n`+body}\n// --- Workflow ---\nconst planned = $('Entscheidung planen').all().map(i => i.json).filter(j => j.op === 'gh');\nreturn $input.all().map((it, i) => {\n  const p = planned[i];\n  const r = it.json;\n  const sha = r.statusCode === 200 && r.body ? r.body.sha : undefined;\n  try {\n    let content;\n    if (p.kind === 'blog') {\n      if (r.statusCode !== 200) throw new Error('Artikel nicht gefunden (HTTP ' + r.statusCode + ')');\n      content = applyBlogProposal(Buffer.from(r.body.content, 'base64').toString('utf8'), p.proposal, p.iso);\n    } else content = p.content;\n    const put = { message: p.message, content: Buffer.from(content, 'utf8').toString('base64'), branch: 'main' };\n    if (sha) put.sha = sha;\n    return { json: { ...p, ok: true, put } };\n  } catch (e) { return { json: { ...p, ok: false, error: e.message, put: {} } }; }\n});\n" } },
  output: [{}]
});
const ghPut = node({
  type: 'n8n-nodes-base.httpRequest', version: 4.2,
  config: { name: 'GitHub: Datei schreiben', position: [1540, 100], credentials: GH, 
    parameters: { method: 'PUT', url: "={{ 'https://api.github.com/repos/ben69mikail/liar-entertainer-relaunch/contents/' + $json.path }}",
      authentication: 'predefinedCredentialType', nodeCredentialType: 'githubApi',
      sendBody: true, specifyBody: 'json', jsonBody: "={{ JSON.stringify($json.put) }}",
      options: FULL } },
  output: [{ statusCode: 200, body: {} }]
});
const result = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Ergebnis', position: [1760, 100], parameters: { jsCode: "const built = $('Inhalt bauen').all().map(i => i.json);\nreturn $input.all().map((it, i) => {\n  const b = built[i];\n  const ok = b.ok && [200, 201].includes(it.json.statusCode);\n  const fehler = ok ? '' : (b.error || ('GitHub HTTP ' + it.json.statusCode + ': ' + JSON.stringify(it.json.body || '').slice(0, 160)));\n  return { json: { vid: b.vid, status: ok ? b.ok_status : 'fehler', entschieden: b.iso, fehler, pfad: b.path } };\n});\n" } },
  output: [{}]
});
const statusFromGh = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Status (GitHub)', position: [1980, 100], parameters: { jsCode: "return $input.all().map(i => ({ json: { vid: i.json.vid, status: i.json.status, entschieden: i.json.entschieden } }));\n" } },
  output: [{}]
});
const updGh = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Status speichern (GitHub)', position: [2200, 100], onError: 'continueRegularOutput',
    parameters: { resource: 'row', operation: 'update', dataTableId: DT_SEO, matchType: 'allConditions',
      filters: { conditions: [{ keyName: 'vid', condition: 'eq', keyValue: '={{ $json.vid }}' }] },
      columns: AUTOMAP, options: {} } },
  output: [{ id: 1 }]
});
const errs = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Fehler sammeln', position: [1980, -100], parameters: { jsCode: "const f = $('Ergebnis').all().map(i => i.json).filter(j => j.fehler);\nreturn f.length ? [{ json: { text: '⚠\uFE0F SEO-Umsetzung teilweise fehlgeschlagen:\\n' + f.map(j => '• ' + j.pfad + ': ' + j.fehler).join('\\n') } }] : [];\n" } },
  output: [{}]
});
const tgErr = node({
  type: 'n8n-nodes-base.telegram', version: 1.2,
  config: { name: 'Telegram: Fehler', position: [2200, -100], credentials: TG, onError: 'continueRegularOutput',
    parameters: { resource: 'message', operation: 'sendMessage', chatId: CHAT, text: "={{ $json.text }}",
      additionalFields: { appendAttribution: false, parse_mode: 'HTML', disable_web_page_preview: true } } },
  output: [{ ok: true }]
});
const statusOnly = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Status', position: [1100, 300], parameters: { jsCode: "return $input.all().map(i => ({ json: { vid: i.json.vid, status: i.json.status, entschieden: i.json.iso } }));\n" } },
  output: [{}]
});
const upd = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Status speichern', position: [1320, 300], onError: 'continueRegularOutput',
    parameters: { resource: 'row', operation: 'update', dataTableId: DT_SEO, matchType: 'allConditions',
      filters: { conditions: [{ keyName: 'vid', condition: 'eq', keyValue: '={{ $json.vid }}' }] },
      columns: AUTOMAP, options: {} } },
  output: [{ id: 1 }]
});
const themaOnly = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Thema', position: [1100, 500], parameters: { jsCode: "return $input.all().map(i => ({ json: { key: i.json.key, status: 'verworfen' } }));\n" } },
  output: [{}]
});
const updThema = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Thema streichen', position: [1320, 500], onError: 'continueRegularOutput',
    parameters: { resource: 'row', operation: 'update', dataTableId: DT_THEMEN, matchType: 'allConditions',
      filters: { conditions: [{ keyName: 'key', condition: 'eq', keyValue: '={{ $json.key }}' }] },
      columns: AUTOMAP, options: {} } },
  output: [{ id: 1 }]
});
const answer = node({
  type: 'n8n-nodes-base.telegram', version: 1.2,
  config: { name: 'TG: Klick bestätigen', position: [1100, 700], credentials: TG, onError: 'continueRegularOutput',
    parameters: { resource: 'callback', operation: 'answerQuery', queryId: "={{ $json.callback_query_id || 'none' }}",
      additionalFields: { text: '✔\uFE0F Entscheidung gespeichert', show_alert: false } } },
  output: [{ ok: true }]
});
const tgSum = node({
  type: 'n8n-nodes-base.telegram', version: 1.2,
  config: { name: 'Telegram: Ergebnis', position: [1320, 700], credentials: TG, onError: 'continueRegularOutput',
    parameters: { resource: 'message', operation: 'sendMessage', chatId: CHAT, text: "={{ $('Entscheidung planen').all().map(i => i.json).find(j => j.op === 'summary').text }}",
      additionalFields: { appendAttribution: false, parse_mode: 'HTML', disable_web_page_preview: true } } },
  output: [{ ok: true }]
});

const note = sticky('## LIAR-2026-12 SEO-Entscheidung\nWird vom Topic-Master bei Telegram-Buttons seo_*/mon_* aufgerufen.\n✅ Blog (neue Artikel) → Markdown per GitHub-API ändern (löst Deploy + IndexNow aus). ✅ Hauptseite/Alt-Artikel und 🔀 → Auftrag docs/seo-auftraege/offen/<vid>.md [skip netlify]. 📌/❌ → nur Status. 🗑 → ähnliche offene Themen in liar_themen auf verworfen.\nStatus in liar_seo_vorschlaege: offen → umgesetzt/auftrag/zusammenfuehren/verworfen/behalten/themen_gestrichen/fehler.', [], { position: [0, -160], width: 760, height: 200 });

export default workflow('bduk9s2mEdjkLvRr', 'LIAR-2026-12 SEO-Entscheidung')
  .add(fromTm).to(readSeo).to(readThemen).to(plan).to(route
    .onCase(0, ghGet.to(build.to(ghPut.to(result))))
    .onCase(1, statusOnly.to(upd))
    .onCase(2, themaOnly.to(updThema))
    .onCase(3, answer.to(tgSum)))
  .add(result).to(statusFromGh).to(updGh).to(errs).to(tgErr)
  .add(note);
