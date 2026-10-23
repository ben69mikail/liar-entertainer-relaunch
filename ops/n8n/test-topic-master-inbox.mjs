// Integrationstest für den Telegram-Bot (n8n „LIAR-2026-Topic-Master“).
// Spielt Telegram-Updates über den Test-Webhook ein und prüft die Sammlung.
// Aufruf: TM_SECRET=… node ops/n8n/test-topic-master-inbox.mjs
// Hinweis: Der Bot schickt dabei „Gespeichert“-Nachrichten (stumm) an den Inhaber-Chat.

const URL = process.env.TM_URL || 'https://n8n.srv860817.hstgr.cloud/webhook/liar-topic-test';
const SECRET = process.env.TM_SECRET;
if (!SECRET) { console.error('TM_SECRET fehlt'); process.exit(2); }

const OWNER = { id: 2106974057, first_name: 'Test', is_bot: false };
const CHAT = { id: 2106974057, type: 'private' };
let mid = 900000;
const msg = (extra) => ({ update_id: Date.now(), message: { message_id: ++mid, from: OWNER, chat: CHAT, date: Math.floor(Date.now() / 1000), ...extra } });
const photo = (id, group) => msg({ media_group_id: group, photo: [{ file_id: id + '-small', width: 90, height: 68 }, { file_id: id, width: 1280, height: 963 }] });

async function send(update) {
  const r = await fetch(URL, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ secret: SECRET, update }) });
  const t = await r.text();
  if (!r.ok) throw new Error('HTTP ' + r.status + ': ' + t.slice(0, 300));
  try { return JSON.parse(t); } catch { return { raw: t }; }
}
const textOf = (res) => String((res.result && res.result.text) || res.text || res.raw || JSON.stringify(res));
const count = (res, word) => { const m = textOf(res).match(new RegExp('(\\d+) ' + word)); return m ? Number(m[1]) : NaN; };

const results = [];
function check(name, ok, detail) { results.push({ name, ok }); console.log((ok ? 'PASS ' : 'FAIL ') + name + (ok ? '' : ' → ' + detail)); }

await send(msg({ text: 'abbrechen' }));
await send(msg({ voice: { file_id: 'test-voice', duration: 3, mime_type: 'audio/ogg' } }));
// Album: Telegram schickt jedes Foto als eigenes Update, praktisch gleichzeitig
const group = 'test-album-' + Date.now();
await Promise.all([send(photo('test-photo-a', group)), send(photo('test-photo-b', group)), send(photo('test-photo-c', group))]);
const after = await send(msg({ text: 'Testnotiz: Herbstfest Gladbeck' }));

check('Sprachnachricht bleibt gespeichert', count(after, 'Sprachn') === 1, textOf(after));
check('alle 3 Album-Fotos werden gesammelt', count(after, 'Foto') === 3, textOf(after));
check('Text wird gesammelt', count(after, 'Text') === 1, textOf(after));

await send(msg({ text: 'abbrechen' }));
const failed = results.filter(r => !r.ok).length;
console.log(failed ? `\n${failed} FAILED` : '\nALL GREEN');
process.exit(failed ? 1 : 0);
