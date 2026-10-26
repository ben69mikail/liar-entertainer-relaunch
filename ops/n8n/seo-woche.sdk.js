// n8n-Workflow „LIAR-2026-11 GSC-Wochenvorschläge“ (4YAuwNlXcDEnhjVs) – GENERIERT von ops/n8n/gen-seo-workflows.mjs, nicht von Hand ändern.
import { workflow, node, trigger, sticky, ifElse, newCredential } from '@n8n/workflow-sdk';

const TG = { telegramApi: { id: 'NLiyAfhaGJ1NrflC', name: 'Telegram account' } };
const OR = { openRouterApi: { id: 'h1uhmQinQ2Z6yjPj', name: 'OpenRouter account' } };
const GOOGLE = { googleOAuth2Api: newCredential('Google SEO-Daten (GSC + GA4)') };
const CHAT = '2106974057';
const DT_SEO = { __rl: true, mode: 'id', value: '2K5V5CRomSaqf29u', cachedResultName: 'liar_seo_vorschlaege' };
const GSC = 'https://www.googleapis.com/webmasters/v3/sites/sc-domain%3Aliar-entertainer.com/searchAnalytics/query';
const AUTOMAP = { mappingMode: 'autoMapInputData', value: {}, matchingColumns: [], schema: [] };
const FULL = { timeout: 60000, response: { response: { fullResponse: true, neverError: true, responseFormat: 'json' } } };

const sched = trigger({
  type: 'n8n-nodes-base.scheduleTrigger', version: 1.3,
  config: { name: 'Montag 07:00 UTC', position: [0, 200], parameters: { rule: { interval: [{ field: 'weeks', weeksInterval: 1, triggerAtDay: [1], triggerAtHour: 7, triggerAtMinute: 0 }] } } },
  output: [{}]
});
const hook = trigger({
  type: 'n8n-nodes-base.webhook', version: 2,
  config: { name: 'Jetzt starten (Webhook)', position: [0, 420], parameters: { httpMethod: 'POST', path: 'liar-seo-woche', responseMode: 'onReceived', options: {} } },
  output: [{ body: { start: 'liar' } }]
});
const range = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Zeitraum', position: [220, 300], parameters: { jsCode: "const src = $input.first().json;\nif (src && src.body && src.body.start !== 'liar') throw new Error('Webhook: Body {\"start\":\"liar\"} fehlt');\nconst iso = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Berlin' });\nconst day = (o) => new Date(Date.now() - o * 86400000).toISOString().slice(0, 10);\n// letzte 28 Tage mit fertigen GSC-Daten (≈ 3 Tage Verzug)\nreturn [{ json: { startDate: day(30), endDate: day(3), iso } }];\n" } },
  output: [{}]
});
const gsc = node({
  type: 'n8n-nodes-base.httpRequest', version: 4.2,
  config: { name: 'GSC: Seiten × Suchbegriffe', position: [440, 300], credentials: GOOGLE, 
    parameters: { method: 'POST', url: GSC,
      authentication: 'predefinedCredentialType', nodeCredentialType: 'googleOAuth2Api',
      sendBody: true, specifyBody: 'json', jsonBody: "={{ JSON.stringify({ startDate: $json.startDate, endDate: $json.endDate, dimensions: ['page', 'query'], rowLimit: 5000 }) }}",
      options: FULL } },
  output: [{ statusCode: 200, body: {} }]
});
const readSeo = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Vorschläge lesen', position: [660, 300], alwaysOutputData: true, executeOnce: true,
    parameters: { resource: 'row', operation: 'get', dataTableId: DT_SEO, returnAll: true } },
  output: [{ id: 1 }]
});
const find = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Chancen finden', position: [880, 300], parameters: { jsCode: "// seo-lib.cjs (Auszug, minifiziert; Quelle + Tests: ops/n8n/seo-lib.cjs, seo.test.mjs)\nvar FAKTEN=[\"FAKTENBLATT (einzige Quelle – nichts darüber hinaus behaupten):\",\"- Michaël Prescler, als „Clown Zauberer LIAR“, Gladbeck (NRW). Telefon +49 172 1517578, info@liar-entertainer.com\",\"- Hauptberuflich seit 2009 (17 Jahre Erfahrung), über 400 Auftritte pro Jahr, 5,0 Sterne bei 390+ Google-Bewertungen, pädagogische Ausbildung, erweitertes Führungszeugnis, Haftpflichtversicherung. Aus Frankreich.\",\"- Shows auf Deutsch; auf Wunsch Französisch, Englisch, Spanisch (Erwachsenen-Bühnenshow nicht Spanisch).\",\"- Kindershow ca. 40 Min., Erwachsenen-Bühnenshow ca. 30 Min. Kindergeburtstage Mo–Do ab 13 Uhr, Kitas/Schulen vormittags ab 8 Uhr.\",\"- PREISE NUR im Zusammenhang Kindergeburtstag: Zaubershow 150 € Festpreis (40 Min., bis ca. 12 Kinder, ab 4 J.), + Ballonmodellage 20 €, + Glitzer-Tattoos 40 €, Komplett-Paket 210 €, Fahrtkosten 0,40 €/km ab Gladbeck. Alles andere: „auf Anfrage“.\",\"- Glitzer-Tattoos nur als Zusatz zur Zaubershow (privat), nie einzeln. Ballonmodellage nur mit Zaubershow oder Walk-Act ab 3 Std.\",\"- Keine Mitgliedschaften, keine Auszeichnungen, keine Firmennamen als Referenz. Keine Rabatte, keine Gratis-Zugaben.\"].join(`\n`),NEVER=[\"/kontakt/\",\"/impressum/\",\"/datenschutzerklaerung-2/\",\"/agbs/\",\"/kontakt/danke/\"];function normPath(url){let p=String(url||\"\").replace(/^https?:\\/\\/(www\\.)?liar-entertainer\\.com/i,\"\").split(\"#\")[0].split(\"?\")[0];return p.startsWith(\"/\")||(p=\"/\"+p),!/\\.[a-z0-9]{2,5}$/i.test(p)&&!p.endsWith(\"/\")&&(p+=\"/\"),p}function expectedCtr(pos){let t={5:.06,6:.05,7:.04,8:.033,9:.027,10:.022},r=Math.round(pos);return t[r]||(r<5?.08:.012)}function pickOpportunities(rows,opts){let o=Object.assign({minImpr:30,maxPages:5,maxQueries:5,exclude:[]},opts||{}),pages={};for(let r of rows||[]){let path=normPath(r.keys[0]),query=r.keys[1];if(NEVER.includes(path)||o.exclude.includes(path)||r.position<5||r.position>20||r.impressions<o.minImpr)continue;let exp=expectedCtr(r.position);if(r.ctr>=exp*.7)continue;let lost=r.impressions*(exp-r.ctr),pg=pages[path]||(pages[path]={path,impressions:0,clicks:0,lost:0,queries:[]});pg.impressions+=r.impressions,pg.clicks+=r.clicks,pg.lost+=lost,pg.queries.push({query,impressions:r.impressions,clicks:r.clicks,position:Math.round(r.position*10)/10})}return Object.values(pages).sort((a,b)=>b.lost-a.lost).slice(0,o.maxPages).map(p=>({...p,lost:Math.round(p.lost*10)/10,queries:p.queries.sort((a,b)=>b.impressions-a.impressions).slice(0,o.maxQueries)}))}function decode(s){return String(s||\"\").replace(/&amp;/g,\"&\").replace(/&quot;/g,'\"').replace(/&#39;/g,\"'\").replace(/&lt;/g,\"<\").replace(/&gt;/g,\">\").replace(/&nbsp;/g,\" \")}function pageFacts(html){let s=String(html||\"\"),pick=re=>decode(((s.match(re)||[])[1]||\"\").replace(/<[^>]+>/g,\"\").replace(/\\s+/g,\" \").trim()),faq=[];for(let m of s.matchAll(/<script type=\"application\\/ld\\+json\">([\\s\\S]*?)<\\/script>/g))try{let j=JSON.parse(m[1]),nodes=[].concat(j[\"@graph\"]||j);for(let n of nodes)if(n&&n[\"@type\"]===\"FAQPage\")for(let q of n.mainEntity||[])q.name&&faq.push(q.name)}catch{}return{title:pick(/<title>([\\s\\S]*?)<\\/title>/i),description:pick(/<meta\\s+name=\"description\"\\s+content=\"([^\"]*)\"/i),h1:pick(/<h1\\b[^>]*>([\\s\\S]*?)<\\/h1>/i),faq}}function buildProposalPrompt(items){let blocks=items.map((it,i)=>[i+1+\". SEITE \"+it.path,\"   Title jetzt: \"+(it.current&&it.current.title||\"–\"),\"   Description jetzt: \"+(it.current&&it.current.description||\"–\"),\"   H1: \"+(it.current&&it.current.h1||\"–\"),\"   FAQ vorhanden: \"+((it.current&&it.current.faq||[]).join(\" | \")||\"keine\"),\"   Suchbegriffe (Impr./Klicks/Pos.): \"+it.queries.map(q=>q.query+\" (\"+q.impressions+\"/\"+q.clicks+\"/\"+q.position+\")\").join(\"; \")].join(`\n`)).join(`\n\n`);return[\"Du bist SEO-Redakteur für liar-entertainer.com (Clown Zauberer LIAR, NRW). Die folgenden Seiten stehen bei Google auf Platz 5–20 mit vielen Impressionen, aber wenig Klicks.\",\"Schlage je Seite einen besseren Title, eine bessere Meta-Description und höchstens 2 neue FAQ-Fragen vor, die die Suchabsicht der Begriffe direkt beantworten.\",\"\",FAKTEN,\"\",\"REGELN:\",\"- seoTitle: max. 60 Zeichen, endet mit „| LIAR“, wichtigster Suchbegriff vorn, konkreter Nutzen. Keine Emojis.\",\"- description: 120–160 Zeichen, Nutzen + Aufforderung, keine doppelten Anführungszeichen, keine Emojis.\",\"- Preise NUR auf Seiten zum Kindergeburtstag oder /preise/. Sonst kein Preis, keine Zahl mit €.\",\"- FAQ nur, wenn eine Frage zur Suchabsicht noch fehlt; Antwort 1–3 Sätze, nur Fakten aus dem Faktenblatt. Keine Doppelung vorhandener FAQ.\",\"- Nichts erfinden. Wenn eine Seite schon gut ist, lass sie weg.\",\"- grund: ein kurzer Satz, welcher Suchbegriff damit besser bedient wird.\",\"\",'Antworte NUR als JSON: {\"proposals\":[{\"path\":\"/…/\",\"seoTitle\":\"…\",\"description\":\"…\",\"faq\":[{\"frage\":\"…\",\"antwort\":\"…\"}],\"grund\":\"…\"}]}',\"\",blocks].join(`\n`)}function routeFor(path,baselinePaths){return/^\\/blog\\/[^/]+\\/$/.test(path)&&!path.startsWith(\"/blog/kategorie/\")&&!(baselinePaths||[]).includes(path)?\"blog\":\"auftrag\"}function isoWeek(d){let t=new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate())),day=t.getUTCDay()||7;t.setUTCDate(t.getUTCDate()+4-day);let y0=new Date(Date.UTC(t.getUTCFullYear(),0,1)),w=Math.ceil(((t-y0)/864e5+1)/7);return t.getUTCFullYear()+\"-W\"+String(w).padStart(2,\"0\")}\nconst SITE = 'https://liar-entertainer.com';\n// --- Workflow ---\nconst resp = $('GSC: Seiten × Suchbegriffe').first().json;\nif (resp.statusCode !== 200) throw new Error('GSC-Abfrage fehlgeschlagen (HTTP ' + resp.statusCode + '): ' + JSON.stringify(resp.body || resp).slice(0, 300) + ' – Credential „Google SEO-Daten (GSC + GA4)“ prüfen (Scopes webmasters.readonly + analytics.readonly).');\nconst rows = (resp.body && resp.body.rows) || [];\nconst z = $('Zeitraum').first().json;\n// Seiten, die in den letzten 6 Wochen schon vorgeschlagen wurden, ruhen lassen\nconst recent = $('Vorschläge lesen').all().map(i => i.json)\n  .filter(r => r && r.typ === 'woche' && r.erstellt && (new Date(z.iso) - new Date(r.erstellt)) < 42 * 86400000).map(r => r.pfad);\nconst opps = pickOpportunities(rows, { minImpr: 30, maxPages: 5, exclude: recent });\nconst woche = isoWeek(new Date());\nif (!opps.length) return [{ json: { none: true, rows: rows.length, woche, iso: z.iso } }];\nconst h = this.helpers;\nlet baseline = null;\ntry {\n  const b = await h.httpRequest({ method: 'GET', url: 'https://raw.githubusercontent.com/ben69mikail/liar-entertainer-relaunch/main/site/tests/fixtures/meta-baseline.json', json: true });\n  baseline = Object.keys(typeof b === 'string' ? JSON.parse(b) : b).map(normPath);\n} catch (e) { baseline = null; }\nfor (const o of opps) {\n  try { o.current = pageFacts(String(await h.httpRequest({ method: 'GET', url: SITE + o.path, json: false, timeout: 15000 }))); }\n  catch (e) { o.current = { title: '', description: '', h1: '', faq: [] }; }\n  // ohne Baseline lieber alles als Auftrag (sicher)\n  o.route = baseline ? routeFor(o.path, baseline) : 'auftrag';\n}\nreturn [{ json: { none: false, opps, prompt: buildProposalPrompt(opps), woche, iso: z.iso } }];\n" } },
  output: [{}]
});
const ifAny = ifElse({
  version: 2.2,
  config: { name: 'Chancen gefunden?', position: [1100, 300],
    parameters: { conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'loose' },
      conditions: [{ id: 'c1', leftValue: "={{ $json.none === false }}", rightValue: true, operator: { type: 'boolean', operation: 'true', singleValue: true } }],
      combinator: 'and' }, options: {} } }
});
const tgNone = node({
  type: 'n8n-nodes-base.telegram', version: 1.2,
  config: { name: 'Telegram: keine Chancen', position: [1320, 520], credentials: TG, executeOnce: true, onError: 'continueRegularOutput',
    parameters: { resource: 'message', operation: 'sendMessage', chatId: CHAT, text: "={{ '🔎 GSC-Woche ' + $json.woche + ': keine Seite auf Platz 5–20 mit auffällig wenig Klicks (' + $json.rows + ' Zeilen geprüft). Nichts zu tun.' }}",
      additionalFields: { appendAttribution: false, parse_mode: 'HTML', disable_web_page_preview: true } } },
  output: [{ ok: true }]
});
const llm = node({
  type: 'n8n-nodes-base.httpRequest', version: 4.2,
  config: { name: 'Claude: Vorschläge', position: [1320, 300], credentials: OR, 
    parameters: { method: 'POST', url: 'https://openrouter.ai/api/v1/chat/completions',
      authentication: 'predefinedCredentialType', nodeCredentialType: 'openRouterApi',
      sendBody: true, specifyBody: 'json', jsonBody: "={{ JSON.stringify({ model: 'anthropic/claude-opus-5.5', max_tokens: 6000, messages: [{ role: 'user', content: $json.prompt }] }) }}",
      options: FULL } },
  output: [{ statusCode: 200, body: {} }]
});
const check = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Vorschläge prüfen', position: [1540, 300], parameters: { jsCode: "// seo-lib.cjs (Auszug, minifiziert; Quelle + Tests: ops/n8n/seo-lib.cjs, seo.test.mjs)\nvar FAKTEN=[\"FAKTENBLATT (einzige Quelle – nichts darüber hinaus behaupten):\",\"- Michaël Prescler, als „Clown Zauberer LIAR“, Gladbeck (NRW). Telefon +49 172 1517578, info@liar-entertainer.com\",\"- Hauptberuflich seit 2009 (17 Jahre Erfahrung), über 400 Auftritte pro Jahr, 5,0 Sterne bei 390+ Google-Bewertungen, pädagogische Ausbildung, erweitertes Führungszeugnis, Haftpflichtversicherung. Aus Frankreich.\",\"- Shows auf Deutsch; auf Wunsch Französisch, Englisch, Spanisch (Erwachsenen-Bühnenshow nicht Spanisch).\",\"- Kindershow ca. 40 Min., Erwachsenen-Bühnenshow ca. 30 Min. Kindergeburtstage Mo–Do ab 13 Uhr, Kitas/Schulen vormittags ab 8 Uhr.\",\"- PREISE NUR im Zusammenhang Kindergeburtstag: Zaubershow 150 € Festpreis (40 Min., bis ca. 12 Kinder, ab 4 J.), + Ballonmodellage 20 €, + Glitzer-Tattoos 40 €, Komplett-Paket 210 €, Fahrtkosten 0,40 €/km ab Gladbeck. Alles andere: „auf Anfrage“.\",\"- Glitzer-Tattoos nur als Zusatz zur Zaubershow (privat), nie einzeln. Ballonmodellage nur mit Zaubershow oder Walk-Act ab 3 Std.\",\"- Keine Mitgliedschaften, keine Auszeichnungen, keine Firmennamen als Referenz. Keine Rabatte, keine Gratis-Zugaben.\"].join(`\n`);function normPath(url){let p=String(url||\"\").replace(/^https?:\\/\\/(www\\.)?liar-entertainer\\.com/i,\"\").split(\"#\")[0].split(\"?\")[0];return p.startsWith(\"/\")||(p=\"/\"+p),!/\\.[a-z0-9]{2,5}$/i.test(p)&&!p.endsWith(\"/\")&&(p+=\"/\"),p}function priceOk(path){return/geburtstag/.test(path)||path.startsWith(\"/preise/\")}var hasPrice=s=>/\\d+(?:,\\d+)?\\s?(?:€|Euro)/.test(String(s||\"\")),clean=s=>String(s||\"\").replace(/\\s+/g,\" \").replace(/\"/g,\"'\").replace(/[\\p{Extended_Pictographic}\uFE0F\u200D]/gu,\"\").trim();function parseProposals(text,items){let raw=String(text||\"\"),a=raw.indexOf(\"{\"),b=raw.lastIndexOf(\"}\");if(a<0||b<=a)return[];let j;try{j=JSON.parse(raw.slice(a,b+1))}catch{return[]}let allowed=new Set((items||[]).map(i=>i.path)),seen=new Set,out=[];for(let p of j.proposals||[]){let path=normPath(p.path);if(!allowed.has(path)||seen.has(path))continue;let seoTitle=clean(p.seoTitle),description=clean(p.description);if(!seoTitle||seoTitle.length>62||!/\\| LIAR$/.test(seoTitle)||description.length<100||description.length>165)continue;let faq=(Array.isArray(p.faq)?p.faq:[]).map(f=>({frage:clean(f.frage),antwort:clean(f.antwort)})).filter(f=>f.frage&&f.antwort).slice(0,2),all=[seoTitle,description].concat(faq.map(f=>f.frage+\" \"+f.antwort)).join(\" \");!priceOk(path)&&hasPrice(all)||(seen.add(path),out.push({path,seoTitle,description,faq,grund:clean(p.grund)}))}return out}function esc(s){return String(s||\"\").replace(/&/g,\"&amp;\").replace(/</g,\"&lt;\").replace(/>/g,\"&gt;\")}function weeklyTelegram(props,week){let head=[\"🔎 <b>GSC-Vorschläge \"+esc(week)+\"</b>\",\"Seiten auf Platz 5–20 mit vielen Impressionen, aber wenig Klicks. Details folgen je Vorschlag.\",\"\"];props.forEach((p,i)=>head.push(i+1+\". \"+esc(p.path)+\" → \"+esc(p.seoTitle)+(p.route===\"blog\"?\" <i>(direkt)</i>\":\" <i>(Auftrag)</i>\"))),head.push(\"\",\"Je Vorschlag ✅/❌ tippen – oder hier alle auf einmal. Offene Vorschläge verfallen nicht.\");let items=props.map((p,i)=>{let l=[i+1+\". <b>\"+esc(p.path)+\"</b>\"+(p.route===\"blog\"?\" · wird nach ✅ direkt geändert\":\" · nach ✅ Auftrag an Claude Code (mit Tests)\")];l.push(\"🔍 \"+(p.queries||[]).slice(0,4).map(x=>esc(x.query)+\" (\"+x.impressions+\" Impr., \"+x.clicks+\" Kl., Pos. \"+x.position+\")\").join(\", \")),l.push(\"Title: <s>\"+esc(p.current&&p.current.title||\"–\")+\"</s>\"),l.push(\"→ <b>\"+esc(p.seoTitle)+\"</b>\"),l.push(\"Desc: \"+esc(p.description));for(let f of p.faq||[])l.push(\"❓ \"+esc(f.frage)+\" – \"+esc(f.antwort));return p.grund&&l.push(\"💡 \"+esc(p.grund)),{vid:p.vid,text:l.join(`\n`).slice(0,3900)}});return{header:head.join(`\n`).slice(0,3900),items}}\n// --- Workflow ---\nconst c = $('Chancen finden').first().json;\nconst resp = $input.first().json;\nconst api = resp.body || resp;\nconst txt = (api && api.choices && api.choices[0] && api.choices[0].message && api.choices[0].message.content) || '';\nconst props = parseProposals(txt, c.opps);\nif (!props.length) return [{ json: { leer: true, woche: c.woche, status: resp.statusCode, roh: String(txt).slice(0, 300) } }];\nconst tag = Date.now().toString(36).slice(-3);\nconst full = props.map((p, i) => {\n  const o = c.opps.find(x => x.path === p.path);\n  return { ...p, vid: 'w' + c.woche.replace(/\\D/g, '') + '-' + (i + 1) + tag, woche: c.woche, route: o.route, current: o.current, queries: o.queries };\n});\nconst tg = weeklyTelegram(full, c.woche);\nreturn full.map((p, i) => ({ json: { leer: false, header: tg.header, tg_text: tg.items[i].text, woche: c.woche, iso: c.iso,\n  row: { vid: p.vid, typ: 'woche', woche: c.woche, pfad: p.path, route: p.route, status: 'offen', daten: JSON.stringify(p), erstellt: c.iso, entschieden: '' } } }));\n" } },
  output: [{}]
});
const ifProps = ifElse({
  version: 2.2,
  config: { name: 'Gültige Vorschläge?', position: [1760, 300],
    parameters: { conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'loose' },
      conditions: [{ id: 'c1', leftValue: "={{ $json.leer === false }}", rightValue: true, operator: { type: 'boolean', operation: 'true', singleValue: true } }],
      combinator: 'and' }, options: {} } }
});
const tgEmpty = node({
  type: 'n8n-nodes-base.telegram', version: 1.2,
  config: { name: 'Telegram: Modell ohne Ergebnis', position: [1980, 520], credentials: TG, executeOnce: true, onError: 'continueRegularOutput',
    parameters: { resource: 'message', operation: 'sendMessage', chatId: CHAT, text: "={{ '⚠\uFE0F GSC-Woche ' + $json.woche + ': Chancen gefunden, aber keine gültigen Vorschläge vom Modell (HTTP ' + $json.status + '). Nächste Woche neuer Versuch.' }}",
      additionalFields: { appendAttribution: false, parse_mode: 'HTML', disable_web_page_preview: true } } },
  output: [{ ok: true }]
});
const rowsOnly = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Zeilen', position: [1980, 300], parameters: { jsCode: "return $input.all().map(i => ({ json: i.json.row }));\n" } },
  output: [{}]
});
const insert = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Vorschläge speichern', position: [2200, 300],
    parameters: { resource: 'row', operation: 'insert', dataTableId: DT_SEO, columns: AUTOMAP, options: {} } },
  output: [{ id: 1 }]
});
const tgHead = node({
  type: 'n8n-nodes-base.telegram', version: 1.2,
  config: { name: 'Telegram: Übersicht', position: [2420, 300], credentials: TG, executeOnce: true,
    parameters: { resource: 'message', operation: 'sendMessage', chatId: CHAT, text: "={{ $('Vorschläge prüfen').first().json.header }}",
      replyMarkup: 'inlineKeyboard', inlineKeyboard: { rows: [{ row: { buttons: [{ text: '✅ Alle umsetzen', additionalFields: { callback_data: "=seo_all:{{ $('Vorschläge prüfen').first().json.woche }}" } }, { text: '❌ Keine', additionalFields: { callback_data: "=seo_none:{{ $('Vorschläge prüfen').first().json.woche }}" } }] } }] },
      additionalFields: { appendAttribution: false, parse_mode: 'HTML', disable_web_page_preview: true } } },
  output: [{ ok: true }]
});
const single = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Einzelnachrichten', position: [2640, 300], parameters: { jsCode: "return $('Vorschläge prüfen').all().map(i => ({ json: { vid: i.json.row.vid, text: i.json.tg_text } }));\n" } },
  output: [{}]
});
const tgItem = node({
  type: 'n8n-nodes-base.telegram', version: 1.2,
  config: { name: 'Telegram: Vorschlag', position: [2860, 300], credentials: TG, 
    parameters: { resource: 'message', operation: 'sendMessage', chatId: CHAT, text: "={{ $json.text }}",
      replyMarkup: 'inlineKeyboard', inlineKeyboard: { rows: [{ row: { buttons: [{ text: '✅ Umsetzen', additionalFields: { callback_data: "=seo_ok:{{ $json.vid }}" } }, { text: '❌ Nein', additionalFields: { callback_data: "=seo_no:{{ $json.vid }}" } }] } }] },
      additionalFields: { appendAttribution: false, parse_mode: 'HTML', disable_web_page_preview: true } } },
  output: [{ ok: true }]
});

const note = sticky('## LIAR-2026-11 GSC-Wochenvorschläge\nMontag 07:00 UTC: GSC (28 Tage) → Seiten auf Platz 5–20 mit vielen Impressionen und CTR unter Erwartung (max. 5, je Seite 6 Wochen Ruhe) → Claude Opus schlägt Title/Description/FAQ vor (Faktenblatt, Preise nur Kindergeburtstag) → eine Übersicht + je Vorschlag ✅/❌ in Telegram.\nEntscheidung: LIAR-2026-12 (über Topic-Master). Neue Blogartikel werden direkt geändert, Hauptseiten/Alt-Artikel als Auftrag in docs/seo-auftraege/offen/.\nCredential „Google SEO-Daten (GSC + GA4)“ = Google OAuth2 API mit Scopes https://www.googleapis.com/auth/webmasters.readonly https://www.googleapis.com/auth/analytics.readonly\nTest: POST /webhook/liar-seo-woche {\"start\":\"liar\"}. Quelle: ops/n8n/gen-seo-workflows.mjs', [], { position: [0, -160], width: 760, height: 240 });

export default workflow('4YAuwNlXcDEnhjVs', 'LIAR-2026-11 GSC-Wochenvorschläge')
  .add(sched).to(range)
  .add(hook).to(range)
  .add(range).to(gsc).to(readSeo).to(find).to(ifAny.onTrue(llm).onFalse(tgNone))
  .add(llm).to(check).to(ifProps.onTrue(rowsOnly).onFalse(tgEmpty))
  .add(rowsOnly).to(insert).to(tgHead).to(single).to(tgItem)
  .add(note);
