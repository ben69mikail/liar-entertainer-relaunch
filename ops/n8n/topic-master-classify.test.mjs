// Klassifizierung im Topic-Master: Buttons seo_*/mon_* gehen an LIAR-2026-12, Freigabe-Buttons bleiben unverändert.
// Aufruf: node --test ops/n8n/topic-master-classify.test.mjs (liest den Code-Knoten direkt aus topic-master.sdk.js)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const src = readFileSync(new URL('./topic-master.sdk.js', import.meta.url), 'utf8');
const i = src.indexOf("name: 'Klassifizieren'");
const start = src.indexOf('jsCode: "', i) + 8;
let k = start + 1;
while (src[k] !== '"') { if (src[k] === '\\') k++; k++; }
const code = JSON.parse(src.slice(start, k + 1));
const run = (update) => new Function('$input', code)({ first: () => ({ json: update }) })[0].json;
const cb = (data, text = 'x') => ({ callback_query: { id: 'q1', data, from: { id: 2106974057 }, message: { text, chat: { id: 5 }, message_id: 9 } } });

test('seo_ok mit Vorschlags-ID → action seo', () => {
  assert.deepEqual(run(cb('seo_ok:w202644-1abc')), { action: 'seo', cb_action: 'seo_ok', arg: 'w202644-1abc', callback_query_id: 'q1', chat_id: 5, message_id: 9 });
});
test('seo_all mit Woche und mon_merge → action seo', () => {
  assert.equal(run(cb('seo_all:2026-W44')).arg, '2026-W44');
  assert.equal(run(cb('mon_merge:m202609-1x')).cb_action, 'mon_merge');
});
test('Freigabe-Buttons der Artikel-Vorschau unverändert (Resume-URL)', () => {
  const r = run(cb('approve:123', 'Text\nRU:https://n8n.example/webhook-waiting/123'));
  assert.equal(r.action, 'callback');
  assert.equal(r.resume_url, 'https://n8n.example/webhook-waiting/123');
});
test('fremde Absender werden ignoriert', () => {
  const u = cb('seo_ok:x'); u.callback_query.from.id = 1;
  assert.equal(run(u).action, 'ignore_unauthorized');
});
