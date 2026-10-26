// n8n-Workflow „LIAR-2026-Topic-Master“ (VeMwaALrgLRQZG9m) als Workflow-SDK-Quelle.
// <TM_SECRET> (Test-Secret) wird beim Hochladen eingesetzt (nicht ins Repo).
import { workflow, node, trigger, sticky, ifElse, switchCase } from '@n8n/workflow-sdk';

const TG = { telegramApi: { id: 'NLiyAfhaGJ1NrflC', name: 'Telegram account' } };
const OR = { openRouterApi: { id: 'h1uhmQinQ2Z6yjPj', name: 'OpenRouter account' } };
const CHAT = '2106974057';
const INBOX = { __rl: true, mode: 'id', value: 'ON36Hcy0zyBi4C1J' };

const tgTrigger = trigger({
  type: 'n8n-nodes-base.telegramTrigger', version: 1.1,
  config: { name: 'Telegram: Update', position: [0, 400], credentials: TG, webhookId: '0bd34d8b-f289-4750-900e-c764e734a1f3',
    parameters: { updates: ['message', 'callback_query'], additionalFields: {} } },
  output: [{ message: { text: 'eigenes', chat: { id: 2106974057 }, from: { id: 2106974057 } } }]
});
const testHook = trigger({
  type: 'n8n-nodes-base.webhook', version: 2,
  config: { name: 'Test: Webhook', position: [0, 650],
    parameters: { httpMethod: 'POST', path: 'liar-topic-test', responseMode: 'lastNode', responseData: 'firstEntryJson', options: {} } },
  output: [{ body: { secret: 's', update: {} } }]
});
const testIn = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Test: Eingang pruefen', position: [110, 650], parameters: { jsCode: "const b = $input.first().json.body || {};\nif (b.secret !== '<TM_SECRET>') throw new Error('Test-Webhook: falsches Secret');\nreturn [{ json: { ...b.update, is_test: b.is_test === true } }];\n" } },
  output: [{ message: { text: 'x' } }]
});
const classify = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Klassifizieren', position: [220, 400], parameters: { jsCode: "const update = $input.first().json;\nconst isTest = update.is_test === true;\nconst isCallback = !!update.callback_query;\nconst cq = update.callback_query;\nconst msg = isCallback ? cq.message : (update.message || update);\nconst fromId = isCallback ? (cq.from && cq.from.id) : (msg.from && msg.from.id);\nif (String(fromId) !== '2106974057') return [{ json: { action: 'ignore_unauthorized' } }];\nif (isCallback) {\n  if (cq.data === 'start:eigenes') return [{ json: { action: 'eigenes', is_test: isTest, callback_query_id: cq.id } }];\n  const m = String(cq.data || '').match(/^([a-z_]+):(.+)$/);\n  // SEO-Entscheidungen (LIAR-2026-11 Woche / -13 Monat) → LIAR-2026-12, ohne Resume-URL\n  if (m && /^(seo|mon)_/.test(m[1])) return [{ json: { action: 'seo', cb_action: m[1], arg: m[2], callback_query_id: cq.id, chat_id: cq.message.chat.id, message_id: cq.message.message_id } }];\n  const ru = String((cq.message && cq.message.text) || '').match(/RU:(https?:\\/\\/\\S+)/);\n  if (!m || !ru) return [{ json: { action: 'ignore_callback' } }];\n  return [{ json: { action: 'callback', cb_action: m[1], resume_url: ru[1], callback_query_id: cq.id, chat_id: cq.message.chat.id, message_id: cq.message.message_id } }];\n}\nconst text = String(msg.text || msg.caption || '').trim();\nconst lower = text.toLowerCase();\nlet action;\nif (/^\\/?artikel\\b/.test(lower)) action = 'artikel';\nelse if (/^\\/?eigenes\\b/.test(lower)) action = 'eigenes';\nelse if (/^\\/?abbrechen\\b/.test(lower)) action = 'abbrechen';\nelse if (/^\\/?(start|hilfe|help)\\b/.test(lower)) action = 'artikel';\nelse if (msg.voice || msg.audio || (msg.photo && msg.photo.length) || msg.text) action = 'collect';\nelse action = 'ignore';\nlet entry = null;\nif (action === 'collect') {\n  entry = { ts: Date.now(), typ: 'text', file_id: '', caption: '', inhalt: '' };\n  if (msg.voice || msg.audio) { entry.typ = 'voice'; entry.file_id = (msg.voice || msg.audio).file_id; }\n  else if (msg.photo && msg.photo.length) { entry.typ = 'photo'; entry.file_id = msg.photo[msg.photo.length - 1].file_id; entry.caption = msg.caption || ''; }\n  else { entry.inhalt = msg.text; }\n}\nreturn [{ json: { action, is_test: isTest, entry, last_type: entry ? entry.typ : '' } }];\n" } },
  output: [{ action: 'collect', is_test: false, entry: { ts: 1, typ: 'text', file_id: '', caption: '', inhalt: 'x' }, last_type: 'text' }]
});
const route = switchCase({
  version: 3.2,
  config: { name: 'Aktion', position: [440, 400],
    parameters: { rules: { values: [{ conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'strict' }, conditions: [{ leftValue: '={{ $json.action }}', rightValue: 'artikel', operator: { type: 'string', operation: 'equals' } }], combinator: 'and' }, renameOutput: true, outputKey: 'hilfe' }, { conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'strict' }, conditions: [{ leftValue: '={{ $json.action }}', rightValue: 'eigenes', operator: { type: 'string', operation: 'equals' } }], combinator: 'and' }, renameOutput: true, outputKey: 'eigenes' }, { conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'strict' }, conditions: [{ leftValue: '={{ $json.action }}', rightValue: 'abbrechen', operator: { type: 'string', operation: 'equals' } }], combinator: 'and' }, renameOutput: true, outputKey: 'abbrechen' }, { conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'strict' }, conditions: [{ leftValue: '={{ $json.action }}', rightValue: 'callback', operator: { type: 'string', operation: 'equals' } }], combinator: 'and' }, renameOutput: true, outputKey: 'freigabe' }, { conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'strict' }, conditions: [{ leftValue: '={{ $json.action }}', rightValue: 'collect', operator: { type: 'string', operation: 'equals' } }], combinator: 'and' }, renameOutput: true, outputKey: 'gesammelt' }, { conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'strict' }, conditions: [{ leftValue: '={{ $json.action }}', rightValue: 'seo', operator: { type: 'string', operation: 'equals' } }], combinator: 'and' }, renameOutput: true, outputKey: 'seo' }] }, options: {} } }
});
const tgHelp = node({
  type: 'n8n-nodes-base.telegram', version: 1.2,
  config: { name: 'TG: Hilfe', position: [700, 100], credentials: TG,
    parameters: { resource: 'message', operation: 'sendMessage', chatId: CHAT, text: "📅 Montags-Artikel kommen automatisch (Mo 07:00): Vorschau hier, du gibst mit ✅ frei.\n\n⚡ Spontan-Artikel:\n1. Sprachnachricht oder Text schicken (was, wann, wo)\n2. optional 1–3 Fotos (auch als Album; nur mit Einwilligung, wenn Kinder erkennbar)\n3. Button „✍️ Artikel jetzt schreiben“ tippen oder „eigenes“ senden\n→ Vorschau kommt nach ca. 3 Min, dann ✅ Veröffentlichen oder ❌ Verwerfen.\n\nDie Sammlung bleibt 3 Stunden. „abbrechen“ leert sie.", additionalFields: { appendAttribution: false } } },
  output: [{ ok: true }]
});

// --- Sammeln ---
const entryOnly = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Eintrag', position: [700, 950], parameters: { jsCode: "return [{ json: $input.first().json.entry }];\n" } },
  output: [{ ts: 1, typ: 'text', file_id: '', caption: '', inhalt: 'x' }]
});
const dtInsert = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Inbox: speichern', position: [920, 950],
    parameters: { resource: 'row', operation: 'insert', dataTableId: INBOX,
      columns: { mappingMode: 'autoMapInputData', value: {}, matchingColumns: [], schema: [] }, options: {} } },
  output: [{ id: 1 }]
});
const dtReadCollect = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Inbox: lesen (Sammeln)', position: [1140, 950], alwaysOutputData: true, executeOnce: true,
    parameters: { resource: 'row', operation: 'get', dataTableId: INBOX, returnAll: true } },
  output: [{ id: 1, ts: 1, typ: 'text', file_id: '', caption: '', inhalt: 'x' }]
});
const countCollect = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Inbox zaehlen', position: [1360, 950], parameters: { jsCode: "// Sammlung aus der Datentabelle liar_inbox lesen (nur die letzten 3 Stunden)\nconst WINDOW = 3 * 60 * 60 * 1000;\nconst c = $('Klassifizieren').first().json;\nconst rows = $input.all().map(i => i.json)\n  .filter(r => r && r.typ && Number(r.ts) >= Date.now() - WINDOW)\n  .sort((a, b) => Number(a.ts) - Number(b.ts));\nconst voices = rows.filter(r => r.typ === 'voice').map(r => ({ file_id: r.file_id }));\nconst photos = rows.filter(r => r.typ === 'photo').map(r => ({ file_id: r.file_id }));\nconst texts = rows.filter(r => r.typ === 'text').map(r => r.inhalt).concat(rows.filter(r => r.typ === 'photo' && r.caption).map(r => r.caption));\nreturn [{ json: { action: c.action, is_test: c.is_test, last_type: c.last_type, callback_query_id: c.callback_query_id || '', voices, photos, texts, inbox_count: rows.length } }];\n" } },
  output: [{ action: 'collect', voices: [], photos: [], texts: [], inbox_count: 0, last_type: 'text' }]
});
const tgCollected = node({
  type: 'n8n-nodes-base.telegram', version: 1.2,
  config: { name: 'TG: Gesammelt', position: [1580, 950], credentials: TG, onError: 'continueRegularOutput',
    parameters: { resource: 'message', operation: 'sendMessage', chatId: CHAT,
      text: "={{ '📎 Gespeichert (' + ({ voice: 'Sprachnachricht', photo: 'Foto', text: 'Text' }[$json.last_type] || 'Eintrag') + '). Gesammelt: ' + $json.voices.length + ' Sprachn., ' + $json.texts.length + ' Text(e), ' + $json.photos.length + ' Foto(s).\\nFertig? Dann unten tippen oder „eigenes“ senden.' }}",
      replyMarkup: 'inlineKeyboard',
      inlineKeyboard: { rows: [{ row: { buttons: [{ text: '✍️ Artikel jetzt schreiben', additionalFields: { callback_data: 'start:eigenes' } }] } }] },
      additionalFields: { appendAttribution: false, disable_notification: true } } },
  output: [{ ok: true }]
});

// --- Eigenes (Artikel starten) ---
const dtReadStart = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Inbox: lesen (Start)', position: [700, 300], alwaysOutputData: true, executeOnce: true,
    parameters: { resource: 'row', operation: 'get', dataTableId: INBOX, returnAll: true } },
  output: [{ id: 1, ts: 1, typ: 'voice', file_id: 'v', caption: '', inhalt: '' }]
});
const readStart = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Inbox auswerten', position: [810, 300], parameters: { jsCode: "// Sammlung aus der Datentabelle liar_inbox lesen (nur die letzten 3 Stunden)\nconst WINDOW = 3 * 60 * 60 * 1000;\nconst c = $('Klassifizieren').first().json;\nconst rows = $input.all().map(i => i.json)\n  .filter(r => r && r.typ && Number(r.ts) >= Date.now() - WINDOW)\n  .sort((a, b) => Number(a.ts) - Number(b.ts));\nconst voices = rows.filter(r => r.typ === 'voice').map(r => ({ file_id: r.file_id }));\nconst photos = rows.filter(r => r.typ === 'photo').map(r => ({ file_id: r.file_id }));\nconst texts = rows.filter(r => r.typ === 'text').map(r => r.inhalt).concat(rows.filter(r => r.typ === 'photo' && r.caption).map(r => r.caption));\nreturn [{ json: { action: c.action, is_test: c.is_test, last_type: c.last_type, callback_query_id: c.callback_query_id || '', voices, photos, texts, inbox_count: rows.length } }];\n" } },
  output: [{ action: 'eigenes', voices: [], photos: [], texts: ['x'], inbox_count: 1, callback_query_id: '' }]
});
const cbStartAnswer = node({
  type: 'n8n-nodes-base.telegram', version: 1.2,
  config: { name: 'TG: Button bestaetigen', position: [810, 180], credentials: TG, onError: 'continueRegularOutput',
    parameters: { resource: 'callback', operation: 'answerQuery', queryId: "={{ $json.callback_query_id || 'none' }}",
      additionalFields: { text: '✍️ Artikel wird geschrieben', show_alert: false } } },
  output: [{ ok: true }]
});
const validate = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Eigenes: Inhalte pruefen', position: [920, 300], parameters: { jsCode: "const d = $('Inbox auswerten').first().json;\nif (!d.voices.length && !d.texts.length) {\n  const fotos = d.photos.length ? ' Ich habe ' + d.photos.length + ' Foto(s), aber noch keinen Text.' : '';\n  return [{ json: { ok: false, ...d, msg: '⚠️ Ich habe noch kein Thema.' + fotos + ' Schick mir eine Sprachnachricht oder einen Text (was, wann, wo), dann „eigenes“.' } }];\n}\nreturn [{ json: { ok: true, ...d, msg: (d.is_test ? '🧪 TESTLAUF – ' : '') + '📥 Los geht’s: ' + d.voices.length + ' Sprachnachricht(en), ' + d.texts.length + ' Text(e), ' + Math.min(d.photos.length, 3) + ' Foto(s).' + (d.photos.length > 3 ? ' (Nur die ersten 3 Fotos werden genutzt.)' : '') } }];\n" } },
  output: [{ ok: true, voices: [], photos: [], texts: ['x'], msg: 'm' }]
});
const tgAck = node({
  type: 'n8n-nodes-base.telegram', version: 1.2,
  config: { name: 'TG: Status', position: [1030, 300], credentials: TG,
    parameters: { resource: 'message', operation: 'sendMessage', chatId: CHAT, text: '={{ $json.msg }}', additionalFields: { appendAttribution: false } } },
  output: [{ ok: true }]
});
const ifOk = ifElse({
  version: 2.2,
  config: { name: 'Thema vorhanden?', position: [1140, 300],
    parameters: { conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'loose' },
      conditions: [{ id: 'ok1', leftValue: "={{ $('Eigenes: Inhalte pruefen').first().json.ok }}", rightValue: true, operator: { type: 'boolean', operation: 'true', singleValue: true } }],
      combinator: 'and' }, options: {} } }
});
const ifVoice = ifElse({
  version: 2.2,
  config: { name: 'Sprachnachrichten?', position: [1360, 300],
    parameters: { conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'loose' },
      conditions: [{ id: 'vo1', leftValue: "={{ $('Eigenes: Inhalte pruefen').first().json.voices.length }}", rightValue: 0, operator: { type: 'number', operation: 'gt' } }],
      combinator: 'and' }, options: {} } }
});
const voiceItems = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Sprachnachrichten-Liste', position: [1580, 200], parameters: { jsCode: "return $('Eigenes: Inhalte pruefen').first().json.voices.map(v => ({ json: { file_id: v.file_id } }));\n" } },
  output: [{ file_id: 'v1' }]
});
const voiceDl = node({
  type: 'n8n-nodes-base.telegram', version: 1.2,
  config: { name: 'TG: Sprachnachricht laden', position: [1800, 200], credentials: TG,
    parameters: { resource: 'file', operation: 'get', fileId: '={{ $json.file_id }}', download: true } },
  output: [{ result: { file_id: 'v1' } }]
});
const audioPrep = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Audio vorbereiten', position: [1910, 200], parameters: { jsCode: "// Sprachnachricht (OGG) als Base64 für die Transkription vorbereiten\nconst out = [];\nconst items = $input.all();\nfor (let i = 0; i < items.length; i++) {\n  const buf = await this.helpers.getBinaryDataBuffer(i, 'data');\n  out.push({ json: { audio_b64: buf.toString('base64') } });\n}\nreturn out;\n" } },
  output: [{ audio_b64: 'AAAA' }]
});
const transcribe = node({
  type: 'n8n-nodes-base.httpRequest', version: 4.2,
  config: { name: 'Transkription (OpenRouter)', position: [2020, 200], credentials: OR,
    parameters: { method: 'POST', url: 'https://openrouter.ai/api/v1/audio/transcriptions',
      authentication: 'predefinedCredentialType', nodeCredentialType: 'openRouterApi',
      sendHeaders: true, headerParameters: { parameters: [{ name: 'HTTP-Referer', value: 'https://liar-entertainer.com' }, { name: 'X-Title', value: 'LIAR Telegram-Bot' }] },
      sendBody: true, specifyBody: 'json',
      jsonBody: "={{ JSON.stringify({ model: 'openai/whisper-1', input_audio: { data: $json.audio_b64, format: 'ogg' }, language: 'de', response_format: 'json' }) }}",
      options: { timeout: 120000, response: { response: { fullResponse: true, neverError: true, responseFormat: 'json' } } } } },
  output: [{ statusCode: 200, body: { text: 'Transkript' } }]
});
const payload = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Payload bauen', position: [2240, 300], executeOnce: true, parameters: { jsCode: "const d = $('Eigenes: Inhalte pruefen').first().json;\nlet transcripts = [];\nconst errors = [];\ntry {\n  for (const i of $('Transkription (OpenRouter)').all()) {\n    const b = i.json.body || i.json;\n    if (b && b.text) transcripts.push(b.text);\n    else errors.push('HTTP ' + (i.json.statusCode || '?') + ': ' + JSON.stringify(b && b.error ? b.error : b).slice(0, 200));\n  }\n} catch (e) {}\nconst combined = [...transcripts, ...d.texts].filter(Boolean).join('\\n\\n');\nconst photos = d.photos.slice(0, 3).map(p => ({ tg_file_id: p.file_id }));\nreturn [{ json: { ok: !!combined.trim(), error: errors.join(' | '), mode: 'eigenes', user_topic_text: combined, user_photos: JSON.stringify(photos), preview: combined.slice(0, 400), n_photos: photos.length, is_test: d.is_test === true } }];\n" } },
  output: [{ mode: 'eigenes', user_topic_text: 't', user_photos: '[]', preview: 't', n_photos: 0, is_test: false }]
});
const ifText = ifElse({
  version: 2.2,
  config: { name: 'Text vorhanden?', position: [2350, 300],
    parameters: { conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'loose' },
      conditions: [{ id: 'tx1', leftValue: '={{ $json.ok }}', rightValue: true, operator: { type: 'boolean', operation: 'true', singleValue: true } }],
      combinator: 'and' }, options: {} } }
});
const tgVoiceErr = node({
  type: 'n8n-nodes-base.telegram', version: 1.2,
  config: { name: 'TG: Sprachnachricht-Fehler', position: [2460, 480], credentials: TG,
    parameters: { resource: 'message', operation: 'sendMessage', chatId: CHAT,
      text: "={{ '❌ Ich konnte die Sprachnachricht nicht in Text umwandeln, deshalb wurde kein Artikel gestartet.\\nFehler: ' + ($json.error || 'unbekannt').slice(0, 300) + '\\n\\nDeine Sammlung bleibt 3 Std. gespeichert. Schick den Inhalt kurz als Text und tippe dann erneut auf „Artikel jetzt schreiben“.' }}",
      additionalFields: { appendAttribution: false } } },
  output: [{ ok: true }]
});
const startPipeline = node({
  type: 'n8n-nodes-base.executeWorkflow', version: 1.2,
  config: { name: 'Spontan-Artikel starten', position: [2460, 300],
    parameters: { source: 'database', workflowId: { __rl: true, mode: 'id', value: 'Jic8HX0mrK14T6Zv' },
      mode: 'once', options: { waitForSubWorkflow: false } } },
  output: [{}]
});
const dtClearStart = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Inbox leeren', position: [2680, 300], executeOnce: true, alwaysOutputData: true,
    parameters: { resource: 'row', operation: 'deleteRows', dataTableId: INBOX, matchType: 'allConditions',
      filters: { conditions: [{ keyName: 'id', condition: 'gte', keyValue: '0' }] }, options: {} } },
  output: [{ id: 1 }]
});
const startDone = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Gestartet', position: [2900, 300], executeOnce: true, parameters: { jsCode: "const p = $('Payload bauen').first().json;\nreturn [{ json: { started: true, is_test: p.is_test, n_photos: p.n_photos, text_chars: p.user_topic_text.length, preview: p.preview } }];\n" } },
  output: [{ started: true }]
});

// --- Abbrechen ---
const dtClearCancel = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Inbox leeren (Abbrechen)', position: [700, 500], executeOnce: true, alwaysOutputData: true,
    parameters: { resource: 'row', operation: 'deleteRows', dataTableId: INBOX, matchType: 'allConditions',
      filters: { conditions: [{ keyName: 'id', condition: 'gte', keyValue: '0' }] }, options: {} } },
  output: [{ id: 1 }]
});
const tgCancel = node({
  type: 'n8n-nodes-base.telegram', version: 1.2,
  config: { name: 'TG: Abgebrochen', position: [920, 500], credentials: TG, executeOnce: true,
    parameters: { resource: 'message', operation: 'sendMessage', chatId: CHAT, text: '🗑️ Sammlung geleert. Neues Thema: Sprachnachricht/Text + Fotos, dann „eigenes“.', additionalFields: { appendAttribution: false, disable_notification: true } } },
  output: [{ ok: true }]
});

// --- Freigabe-Buttons der Vorschau ---
const cbResume = node({
  type: 'n8n-nodes-base.httpRequest', version: 4.2,
  config: { name: 'Freigabe weitergeben', position: [700, 700], onError: 'continueRegularOutput',
    parameters: { method: 'GET', url: "={{ $json.resume_url + ($json.resume_url.includes('?') ? '&' : '?') + 'action=' + $json.cb_action }}",
      options: { timeout: 15000, response: { response: { neverError: true, fullResponse: true } } } } },
  output: [{ statusCode: 200 }]
});
const cbAnswer = node({
  type: 'n8n-nodes-base.telegram', version: 1.2,
  config: { name: 'TG: Klick bestaetigen', position: [920, 650], credentials: TG, onError: 'continueRegularOutput',
    parameters: { resource: 'callback', operation: 'answerQuery', queryId: "={{ $('Klassifizieren').first().json.callback_query_id }}",
      additionalFields: { text: "={{ $('Klassifizieren').first().json.cb_action === 'approve' ? '✅ Veröffentlichung gestartet' : '❌ Verworfen' }}", show_alert: false } } },
  output: [{ ok: true }]
});
const cbEdit = node({
  type: 'n8n-nodes-base.telegram', version: 1.2,
  config: { name: 'TG: Nachricht aktualisieren', position: [1140, 650], credentials: TG, onError: 'continueRegularOutput',
    parameters: { resource: 'message', operation: 'editMessageText', chatId: "={{ $('Klassifizieren').first().json.chat_id }}", messageType: 'message',
      messageId: "={{ $('Klassifizieren').first().json.message_id }}",
      text: "={{ $('Klassifizieren').first().json.cb_action === 'approve' ? '✅ Freigegeben – Upload, GitHub-Prüfung und Netlify laufen (ca. 5–15 Min). Live-Meldung folgt.' : '❌ Verworfen – nichts wurde veröffentlicht.' }}",
      additionalFields: { appendAttribution: false } } },
  output: [{ ok: true }]
});

// --- SEO-Entscheidungen (Buttons seo_*/mon_*) ---
const seoDecide = node({
  type: 'n8n-nodes-base.executeWorkflow', version: 1.2,
  config: { name: 'SEO-Entscheidung starten', position: [700, 1150],
    parameters: { source: 'database', workflowId: { __rl: true, mode: 'id', value: 'bduk9s2mEdjkLvRr' },
      mode: 'once', options: { waitForSubWorkflow: false } } },
  output: [{}]
});

const note = sticky('## LIAR Topic-Master (Telegram-Bot)\nSammelt Sprachnachrichten, Texte und Fotos in der Datentabelle liar_inbox (3 Std., Alben sicher). Button „Artikel jetzt schreiben“ oder „eigenes“ startet LIAR-2026-08.\nSprache → Text über OpenRouter (openai/whisper-1).\nButtons ✅/❌ der Vorschau laufen hier durch (Callback → Resume-URL). Buttons seo_*/mon_* (GSC-Woche, Monatsbericht) → LIAR-2026-12 SEO-Entscheidung.\nTest-Webhook /webhook/liar-topic-test (Secret) für ops/n8n/test-topic-master-inbox.mjs.', [], { position: [0, 100], width: 600, height: 220 });

export default workflow('VeMwaALrgLRQZG9m', 'LIAR-2026-Topic-Master')
  .add(tgTrigger).to(classify).to(route
    .onCase(0, tgHelp)
    .onCase(1, dtReadStart.to(readStart.to(cbStartAnswer.to(validate.to(tgAck.to(ifOk.onTrue(ifVoice.onTrue(voiceItems.to(voiceDl.to(audioPrep.to(transcribe.to(payload))))).onFalse(payload))))))))
    .onCase(2, dtClearCancel.to(tgCancel))
    .onCase(3, cbResume.to(cbAnswer.to(cbEdit)))
    .onCase(4, entryOnly.to(dtInsert.to(dtReadCollect.to(countCollect.to(tgCollected)))))
    .onCase(5, seoDecide))
  .add(payload).to(ifText.onTrue(startPipeline.to(dtClearStart.to(startDone))).onFalse(tgVoiceErr))
  .add(testHook).to(testIn.to(classify))
  .add(note);
