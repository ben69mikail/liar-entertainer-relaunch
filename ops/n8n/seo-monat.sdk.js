// n8n-Workflow „LIAR-2026-13 Monatsbericht Blog“ (SjHdbHg5zQ1VwzGK) – GENERIERT von ops/n8n/gen-seo-workflows.mjs, nicht von Hand ändern.
import { workflow, node, trigger, sticky, newCredential } from '@n8n/workflow-sdk';

const TG = { telegramApi: { id: 'NLiyAfhaGJ1NrflC', name: 'Telegram account' } };
const GM = { gmailOAuth2: { id: 'HZ5YPJTqnDsiHywa', name: 'Gmail account' } };
const GH = { githubApi: { id: 'UdnLtJujy5mHGq0R', name: 'GitHub LIAR (relaunch)' } };
const GOOGLE = { googleOAuth2Api: newCredential('Google SEO-Daten (GSC + GA4)') };
const CHAT = '2106974057';
const DT_SEO = { __rl: true, mode: 'id', value: '2K5V5CRomSaqf29u', cachedResultName: 'liar_seo_vorschlaege' };
const REPO = 'https://api.github.com/repos/ben69mikail/liar-entertainer-relaunch';
const GSC = 'https://www.googleapis.com/webmasters/v3/sites/sc-domain%3Aliar-entertainer.com/searchAnalytics/query';
const AUTOMAP = { mappingMode: 'autoMapInputData', value: {}, matchingColumns: [], schema: [] };
const FULL = { timeout: 60000, response: { response: { fullResponse: true, neverError: true, responseFormat: 'json' } } };

const sched = trigger({
  type: 'n8n-nodes-base.scheduleTrigger', version: 1.3,
  config: { name: 'Monatserster 07:00 UTC', position: [0, 200], parameters: { rule: { interval: [{ field: 'months', monthsInterval: 1, triggerAtDayOfMonth: 1, triggerAtHour: 7, triggerAtMinute: 0 }] } } },
  output: [{}]
});
const hook = trigger({
  type: 'n8n-nodes-base.webhook', version: 2,
  config: { name: 'Jetzt starten (Webhook)', position: [0, 420], parameters: { httpMethod: 'POST', path: 'liar-seo-monat', responseMode: 'onReceived', options: {} } },
  output: [{ body: { start: 'liar' } }]
});
const range = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Zeitraum', position: [220, 300], parameters: { jsCode: "const src = $input.first().json;\nif (src && src.body && src.body.start !== 'liar') throw new Error('Webhook: Body {\"start\":\"liar\"} fehlt');\nconst iso = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Berlin' });\nconst day = (o) => new Date(Date.now() - o * 86400000).toISOString().slice(0, 10);\nconst d = new Date(iso + 'T12:00:00Z'); d.setUTCDate(0);\nreturn [{ json: { startDate: day(92), endDate: day(3), iso, monat: d.toISOString().slice(0, 7) } }];\n" } },
  output: [{}]
});
const ghList = node({
  type: 'n8n-nodes-base.httpRequest', version: 4.2,
  config: { name: 'GitHub: Artikel auflisten', position: [440, 300], credentials: GH, 
    parameters: { method: 'GET', url: REPO + '/contents/site/src/content/blog?ref=main',
      authentication: 'predefinedCredentialType', nodeCredentialType: 'githubApi',
      options: FULL } },
  output: [{ statusCode: 200, body: {} }]
});
const gscPage = node({
  type: 'n8n-nodes-base.httpRequest', version: 4.2,
  config: { name: 'GSC: Artikel', position: [660, 300], credentials: GOOGLE, 
    parameters: { method: 'POST', url: GSC,
      authentication: 'predefinedCredentialType', nodeCredentialType: 'googleOAuth2Api',
      sendBody: true, specifyBody: 'json', jsonBody: "={{ JSON.stringify({ startDate: $('Zeitraum').first().json.startDate, endDate: $('Zeitraum').first().json.endDate, dimensions: ['page'], rowLimit: 1000, dimensionFilterGroups: [{ filters: [{ dimension: 'page', operator: 'contains', expression: '/blog/' }] }] }) }}",
      options: FULL } },
  output: [{ statusCode: 200, body: {} }]
});
const gscPq = node({
  type: 'n8n-nodes-base.httpRequest', version: 4.2,
  config: { name: 'GSC: Seiten × Suchbegriffe', position: [880, 300], credentials: GOOGLE, 
    parameters: { method: 'POST', url: GSC,
      authentication: 'predefinedCredentialType', nodeCredentialType: 'googleOAuth2Api',
      sendBody: true, specifyBody: 'json', jsonBody: "={{ JSON.stringify({ startDate: $('Zeitraum').first().json.startDate, endDate: $('Zeitraum').first().json.endDate, dimensions: ['page', 'query'], rowLimit: 10000 }) }}",
      options: FULL } },
  output: [{ statusCode: 200, body: {} }]
});
const gaAcc = node({
  type: 'n8n-nodes-base.httpRequest', version: 4.2,
  config: { name: 'GA4: Properties', position: [1100, 300], credentials: GOOGLE, 
    parameters: { method: 'GET', url: 'https://analyticsadmin.googleapis.com/v1beta/accountSummaries',
      authentication: 'predefinedCredentialType', nodeCredentialType: 'googleOAuth2Api',
      options: FULL } },
  output: [{ statusCode: 200, body: {} }]
});
const gaPick = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'GA4-Property wählen', position: [1320, 300], parameters: { jsCode: "const b = $input.first().json.body || {};\nconst props = (b.accountSummaries || []).flatMap(a => (a.propertySummaries || []).map(p => ({ id: p.property, name: (a.displayName || '') + ' ' + (p.displayName || '') })));\nconst hit = props.find(p => /liar|entertainer|zauber|clown/i.test(p.name)) || props[0];\nreturn [{ json: { property: hit ? hit.id : '', name: hit ? hit.name : '', fehler: hit ? '' : 'Keine GA4-Property gefunden (HTTP ' + $input.first().json.statusCode + ')' } }];\n" } },
  output: [{}]
});
const gaRun = node({
  type: 'n8n-nodes-base.httpRequest', version: 4.2,
  config: { name: 'GA4: Einstiege Blog', position: [1540, 300], credentials: GOOGLE, 
    parameters: { method: 'POST', url: "={{ 'https://analyticsdata.googleapis.com/v1beta/' + ($json.property || 'properties/0') + ':runReport' }}",
      authentication: 'predefinedCredentialType', nodeCredentialType: 'googleOAuth2Api',
      sendBody: true, specifyBody: 'json', jsonBody: "={{ JSON.stringify({ dateRanges: [{ startDate: '90daysAgo', endDate: 'yesterday' }], dimensions: [{ name: 'landingPage' }], metrics: [{ name: 'sessions' }, { name: 'keyEvents' }], dimensionFilter: { filter: { fieldName: 'landingPage', stringFilter: { matchType: 'BEGINS_WITH', value: '/blog/' } } }, limit: 1000 }) }}",
      options: FULL } },
  output: [{ statusCode: 200, body: {} }]
});
const readSeo = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Vorschläge lesen', position: [1760, 300], alwaysOutputData: true, executeOnce: true,
    parameters: { resource: 'row', operation: 'get', dataTableId: DT_SEO, returnAll: true } },
  output: [{ id: 1 }]
});
const report = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Bericht', position: [1980, 300], parameters: { jsCode: "// seo-lib.cjs (Auszug, minifiziert; Quelle + Tests: ops/n8n/seo-lib.cjs, seo.test.mjs)\nvar FAKTEN=[\"FAKTENBLATT (einzige Quelle – nichts darüber hinaus behaupten):\",\"- Michaël Prescler, als „Clown Zauberer LIAR“, Gladbeck (NRW). Telefon +49 172 1517578, info@liar-entertainer.com\",\"- Hauptberuflich seit 2009 (17 Jahre Erfahrung), über 400 Auftritte pro Jahr, 5,0 Sterne bei 390+ Google-Bewertungen, pädagogische Ausbildung, erweitertes Führungszeugnis, Haftpflichtversicherung. Aus Frankreich.\",\"- Shows auf Deutsch; auf Wunsch Französisch, Englisch, Spanisch (Erwachsenen-Bühnenshow nicht Spanisch).\",\"- Kindershow ca. 40 Min., Erwachsenen-Bühnenshow ca. 30 Min. Kindergeburtstage Mo–Do ab 13 Uhr, Kitas/Schulen vormittags ab 8 Uhr.\",\"- PREISE NUR im Zusammenhang Kindergeburtstag: Zaubershow 150 € Festpreis (40 Min., bis ca. 12 Kinder, ab 4 J.), + Ballonmodellage 20 €, + Glitzer-Tattoos 40 €, Komplett-Paket 210 €, Fahrtkosten 0,40 €/km ab Gladbeck. Alles andere: „auf Anfrage“.\",\"- Glitzer-Tattoos nur als Zusatz zur Zaubershow (privat), nie einzeln. Ballonmodellage nur mit Zaubershow oder Walk-Act ab 3 Std.\",\"- Keine Mitgliedschaften, keine Auszeichnungen, keine Firmennamen als Referenz. Keine Rabatte, keine Gratis-Zugaben.\"].join(`\n`);function normPath(url){let p=String(url||\"\").replace(/^https?:\\/\\/(www\\.)?liar-entertainer\\.com/i,\"\").split(\"#\")[0].split(\"?\")[0];return p.startsWith(\"/\")||(p=\"/\"+p),!/\\.[a-z0-9]{2,5}$/i.test(p)&&!p.endsWith(\"/\")&&(p+=\"/\"),p}function esc(s){return String(s||\"\").replace(/&/g,\"&amp;\").replace(/</g,\"&lt;\").replace(/>/g,\"&gt;\")}var TARGET_PREFIXES=[\"/kindergeburtstag/\",\"/kinderzauberer/\",\"/preise/\",\"/clown/\",\"/zauberer/\"],isTarget=p=>p===\"/\"||TARGET_PREFIXES.some(x=>p.startsWith(x));function parsePost(slug,md){md=String(md||\"\").replace(/\\r\\n/g,`\n`);let m=String(md||\"\").match(/^---\\n([\\s\\S]*?)\\n---/);if(!m)return null;let fm=m[1];if(/^draft:\\s*true\\s*$/m.test(fm))return null;let get=k=>{let x=fm.match(new RegExp(\"^\"+k+\":\\\\s*(.*)$\",\"m\"));return x?x[1].trim().replace(/^[\"']|[\"']$/g,\"\"):\"\"},body=String(md).slice(m[0].length),links=[];for(let l of body.matchAll(/(!?)\\[[^\\]]*\\]\\(([^)\\s]+)\\)/g)){if(l[1]||!/^\\/|^https?:\\/\\/(www\\.)?liar-entertainer\\.com/i.test(l[2]))continue;let p=normPath(l[2]);isTarget(p)&&!links.includes(p)&&links.push(p)}return{slug,path:\"/blog/\"+slug+\"/\",title:get(\"title\"),publishDate:get(\"publishDate\").slice(0,10),links}}function daysBetween(a,b){return Math.round((new Date(b)-new Date(a))/864e5)}function monthlyReport(o){let gsc={};for(let r of o.gscPage||[])gsc[normPath(r.keys[0])]=r;let ga={};for(let r of o.ga4||[]){let p=normPath(r.path),g=ga[p]||(ga[p]={sessions:0,keyEvents:0});g.sessions+=Number(r.sessions)||0,g.keyEvents+=Number(r.keyEvents)||0}let behalten=new Set(o.behalten||[]),rows=(o.posts||[]).map(p=>{let g=gsc[p.path]||{},a=ga[p.path]||{sessions:0,keyEvents:0},alterTage=daysBetween(p.publishDate,o.today),klicks=g.clicks||0,urteil=\"wirkt\";return alterTage<60?urteil=\"zu neu\":alterTage>=90&&klicks<5&&a.sessions<20&&a.keyEvents===0&&(urteil=\"ohne Wirkung\"),{slug:p.slug,path:p.path,title:p.title,alterTage,klicks,impressionen:g.impressions||0,position:g.position?Math.round(g.position*10)/10:null,sitzungen:a.sessions,anfragen:a.keyEvents,urteil,ziel:(p.links||[])[0]||\"\"}}).sort((x,y)=>y.klicks-x.klicks||y.impressionen-x.impressionen),ohneWirkung=rows.filter(r=>r.urteil===\"ohne Wirkung\"&&!behalten.has(r.slug)),byQuery={};for(let r of o.gscPageQuery||[]){let p=normPath(r.keys[0]);(byQuery[r.keys[1]]||(byQuery[r.keys[1]]=[])).push({p,impressions:r.impressions,position:r.position})}let postPaths=new Set((o.posts||[]).map(p=>p.path)),kannibal=[];for(let[query,list]of Object.entries(byQuery)){let arts=list.filter(x=>postPaths.has(x.p)&&x.impressions>=10),pages=list.filter(x=>isTarget(x.p)&&x.impressions>=10);for(let a of arts)for(let s of pages)a.position<=s.position+3&&kannibal.push({query,artikel:a.p,artikelPos:Math.round(a.position*10)/10,seite:s.p,seitePos:Math.round(s.position*10)/10,impressionen:a.impressions+s.impressions})}return kannibal.sort((x,y)=>y.impressionen-x.impressionen),{rows,ohneWirkung,kannibal:kannibal.slice(0,10)}}function monthlyTelegram(r){let n=x=>Number(x||0).toLocaleString(\"de-DE\"),lines=[\"📊 <b>Monatsbericht Blog \"+esc(r.monat)+\"</b> (letzte 90 Tage, GSC + GA4; Anfragen = Schlüsselereignisse nach Einstieg über den Artikel)\",\"\"];for(let x of r.rows.slice(0,25)){let icon=x.urteil===\"wirkt\"?\"🟢\":x.urteil===\"zu neu\"?\"⚪\":\"🔴\";lines.push(icon+\" \"+esc(String(x.title).slice(0,60))+\" – \"+n(x.klicks)+\" Kl. · \"+n(x.impressionen)+\" Impr.\"+(x.position?\" · Pos. \"+x.position:\"\")+\" · \"+n(x.sitzungen)+\" Sitz. · \"+n(x.anfragen)+\" Anfr.\")}if(r.kannibal.length){lines.push(\"\",\"⚠\uFE0F <b>Kannibalisierung</b> (Artikel konkurriert mit Leistungsseite):\");for(let k of r.kannibal.slice(0,6))lines.push(\"• „\"+esc(k.query)+\"“: \"+esc(k.artikel)+\" (Pos. \"+k.artikelPos+\") vs. \"+esc(k.seite)+\" (Pos. \"+k.seitePos+\")\")}r.ohneWirkung.length?lines.push(\"\",\"🔴 \"+r.ohneWirkung.length+\" Artikel ohne Wirkung – Entscheidung je Artikel folgt.\"):lines.push(\"\",\"Keine Artikel ohne Wirkung. 👍\");let items=r.ohneWirkung.map(x=>({vid:x.vid,text:[\"🔴 <b>\"+esc(x.title)+\"</b> (ohne Wirkung)\",n(x.klicks)+\" Klicks · \"+n(x.sitzungen)+\" Sitzungen · \"+n(x.anfragen)+\" Anfragen in 90 Tagen\",\"Zielseite: \"+esc(x.ziel||\"–\"),\"\",\"🔀 Zusammenführen = 301 auf die Zielseite (Auftrag an Claude Code) · 📌 Behalten = 90 Tage Ruhe · 🗑 Themen = ähnliche offene Themen im Plan streichen\"].join(`\n`)}));return{text:lines.join(`\n`).slice(0,3900),items}}\n// --- Workflow ---\nconst z = $('Zeitraum').first().json;\nconst warn = [];\nconst list = $('GitHub: Artikel auflisten').first().json;\nconst files = (list.statusCode === 200 && Array.isArray(list.body)) ? list.body.filter(f => f.type === 'file' && /\\.md$/.test(f.name)) : [];\nif (!files.length) warn.push('Artikelliste von GitHub nicht lesbar (HTTP ' + list.statusCode + ')');\nconst posts = [];\nfor (const f of files) {\n  try { const p = parsePost(f.name.replace(/\\.md$/, ''), String(await this.helpers.httpRequest({ method: 'GET', url: f.download_url, json: false, timeout: 15000 }))); if (p) posts.push(p); } catch (e) {}\n}\nconst g1 = $('GSC: Artikel').first().json, g2 = $('GSC: Seiten × Suchbegriffe').first().json, ga = $('GA4: Einstiege Blog').first().json;\nif (g1.statusCode !== 200) warn.push('GSC nicht abrufbar (HTTP ' + g1.statusCode + ') – Credential „Google SEO-Daten (GSC + GA4)“ prüfen');\nconst gaPickJ = $('GA4-Property wählen').first().json;\nif (gaPickJ.fehler) warn.push(gaPickJ.fehler);\nelse if (ga.statusCode !== 200) warn.push('GA4 nicht abrufbar (HTTP ' + ga.statusCode + '): ' + JSON.stringify(ga.body || '').slice(0, 160));\nconst ga4 = ((ga.body && ga.body.rows) || []).map(r => ({ path: r.dimensionValues[0].value, sessions: Number(r.metricValues[0].value), keyEvents: Number(r.metricValues[1].value) }));\nconst seo = $('Vorschläge lesen').all().map(i => i.json).filter(r => r && r.typ === 'monat');\nconst ruhe = seo.filter(r => r.status === 'offen' || (r.status === 'behalten' && r.entschieden && (new Date(z.iso) - new Date(r.entschieden)) < 90 * 86400000)).map(r => String(r.pfad).split('/')[2]);\nconst r = monthlyReport({ posts, gscPage: (g1.body && g1.body.rows) || [], gscPageQuery: (g2.body && g2.body.rows) || [], ga4, today: z.iso, behalten: ruhe });\nconst tag = Date.now().toString(36).slice(-3);\nr.monat = z.monat;\nr.ohneWirkung = r.ohneWirkung.map((x, i) => ({ ...x, vid: 'm' + z.monat.replace('-', '') + '-' + (i + 1) + tag, monat: z.monat }));\nconst tg = monthlyTelegram(r);\nconst text = tg.text + (warn.length ? '\\n\\n⚠\uFE0F ' + warn.join('\\n⚠\uFE0F ') : '');\nconst e = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;');\nconst html = '<div style=\"font-family:Arial,sans-serif;max-width:900px\"><h2>Monatsbericht Blog ' + e(z.monat) + '</h2><p>Zeitraum ' + z.startDate + ' bis ' + z.endDate + ' (GSC) bzw. 90 Tage (GA4, Einstiegsseite). Anfragen = Schlüsselereignisse (kontakt_anfrage, whatsapp_click, phone_click, email_click) in Sitzungen, die auf dem Artikel begannen.</p>' +\n  '<table border=\"1\" cellpadding=\"6\" style=\"border-collapse:collapse;font-size:13px\"><tr><th>Artikel</th><th>Alter (Tage)</th><th>Klicks</th><th>Impr.</th><th>Pos.</th><th>Sitzungen</th><th>Anfragen</th><th>Urteil</th><th>Zielseite</th></tr>' +\n  r.rows.map(x => '<tr><td><a href=\"https://liar-entertainer.com' + x.path + '\">' + e(x.title) + '</a></td><td>' + x.alterTage + '</td><td>' + x.klicks + '</td><td>' + x.impressionen + '</td><td>' + (x.position || '–') + '</td><td>' + x.sitzungen + '</td><td>' + x.anfragen + '</td><td>' + x.urteil + '</td><td>' + e(x.ziel) + '</td></tr>').join('') + '</table>' +\n  (r.kannibal.length ? '<h3>Kannibalisierung</h3><ul>' + r.kannibal.map(k => '<li>„' + e(k.query) + '“: ' + k.artikel + ' (Pos. ' + k.artikelPos + ') vs. ' + k.seite + ' (Pos. ' + k.seitePos + '), ' + k.impressionen + ' Impr.</li>').join('') + '</ul>' : '') +\n  (warn.length ? '<p style=\"color:#b45309\">⚠\uFE0F ' + warn.map(e).join('<br>⚠\uFE0F ') + '</p>' : '') + '<p>Entscheidungen zu Artikeln ohne Wirkung: per Telegram.</p></div>';\nconst rows = r.ohneWirkung.map((x, i) => ({ vid: x.vid, text: tg.items[i].text,\n  row: { vid: x.vid, typ: 'monat', woche: z.monat, pfad: x.path, route: 'auftrag', status: 'offen', daten: JSON.stringify(x), erstellt: z.iso, entschieden: '' } }));\nreturn [{ json: { text, html, monat: z.monat, rows } }];\n" } },
  output: [{}]
});
const tgReport = node({
  type: 'n8n-nodes-base.telegram', version: 1.2,
  config: { name: 'Telegram: Bericht', position: [2200, 300], credentials: TG, onError: 'continueRegularOutput',
    parameters: { resource: 'message', operation: 'sendMessage', chatId: CHAT, text: "={{ $json.text }}",
      additionalFields: { appendAttribution: false, parse_mode: 'HTML', disable_web_page_preview: true } } },
  output: [{ ok: true }]
});
const mail = node({
  type: 'n8n-nodes-base.gmail', version: 2.1,
  config: { name: 'E-Mail: Bericht', position: [2420, 300], credentials: GM, onError: 'continueRegularOutput',
    parameters: { resource: 'message', operation: 'send', sendTo: 'info@liar-entertainer.com',
      subject: "={{ '[LIAR Blog] Monatsbericht ' + $('Bericht').first().json.monat }}", emailType: 'html',
      message: "={{ $('Bericht').first().json.html }}", options: { appendAttribution: false } } },
  output: [{ id: 'm1' }]
});
const split = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Entscheidungen', position: [2640, 300], parameters: { jsCode: "return ($('Bericht').first().json.rows || []).map(r => ({ json: r }));\n" } },
  output: [{}]
});
const rowsOnly = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Zeilen', position: [2860, 300], parameters: { jsCode: "return $input.all().map(i => ({ json: i.json.row }));\n" } },
  output: [{}]
});
const insert = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Entscheidungen speichern', position: [3080, 300],
    parameters: { resource: 'row', operation: 'insert', dataTableId: DT_SEO, columns: AUTOMAP, options: {} } },
  output: [{ id: 1 }]
});
const again = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Nachrichten', position: [3300, 300], parameters: { jsCode: "return $('Entscheidungen').all().map(i => ({ json: { vid: i.json.vid, text: i.json.text } }));\n" } },
  output: [{}]
});
const tgItem = node({
  type: 'n8n-nodes-base.telegram', version: 1.2,
  config: { name: 'Telegram: Artikel ohne Wirkung', position: [3520, 300], credentials: TG, 
    parameters: { resource: 'message', operation: 'sendMessage', chatId: CHAT, text: "={{ $json.text }}",
      replyMarkup: 'inlineKeyboard', inlineKeyboard: { rows: [{ row: { buttons: [{ text: '🔀 Zusammenführen', additionalFields: { callback_data: "=mon_merge:{{ $json.vid }}" } }, { text: '📌 Behalten', additionalFields: { callback_data: "=mon_keep:{{ $json.vid }}" } }, { text: '🗑 Themen', additionalFields: { callback_data: "=mon_drop:{{ $json.vid }}" } }] } }] },
      additionalFields: { appendAttribution: false, parse_mode: 'HTML', disable_web_page_preview: true } } },
  output: [{ ok: true }]
});

const note = sticky('## LIAR-2026-13 Monatsbericht Blog\nMonatserster 07:00 UTC: je Blogartikel (site/src/content/blog) Klicks/Impressionen/Position (GSC, 90 Tage) und Sitzungen/Anfragen als Einstiegsseite (GA4, Schlüsselereignisse). Urteil: zu neu (< 60 T.) · ohne Wirkung (≥ 90 T., < 5 Klicks, < 20 Sitzungen, 0 Anfragen) · wirkt. Warnung bei Kannibalisierung (Artikel und Leistungsseite ranken für dieselbe Suche, Artikel höchstens 3 Plätze dahinter).\nTelegram + Mail; je Artikel ohne Wirkung 🔀/📌/🗑 → LIAR-2026-12.\nTest: POST /webhook/liar-seo-monat {\"start\":\"liar\"}. Quelle: ops/n8n/gen-seo-workflows.mjs', [], { position: [0, -160], width: 760, height: 220 });

export default workflow('SjHdbHg5zQ1VwzGK', 'LIAR-2026-13 Monatsbericht Blog')
  .add(sched).to(range)
  .add(hook).to(range)
  .add(range).to(ghList).to(gscPage).to(gscPq).to(gaAcc).to(gaPick).to(gaRun).to(readSeo).to(report).to(tgReport).to(mail).to(split).to(rowsOnly).to(insert).to(again).to(tgItem)
  .add(note);
