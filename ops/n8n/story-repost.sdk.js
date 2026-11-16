// n8n-Workflow „LIAR-2026-06 Story-Repost (+8h)“ (P8Q0PSsRxT5lJw4x) als Workflow-SDK-Quelle.
// Seit 16.11.2026: Video-Story mit Musik (public/story-generated/<slug>.mp4), Bild als Rückfall.
// Code-Knoten enthalten ops/n8n/story-lib.cjs (Tests: node --test ops/n8n/story.test.mjs).
import { workflow, node, trigger, ifElse, sticky } from '@n8n/workflow-sdk';

const TG = { telegramApi: { id: 'NLiyAfhaGJ1NrflC', name: 'Telegram account' } };
const CHAT = '2106974057';
const LIB = "const IG_MAX_CHECKS = 10;\nfunction videoUrlFor(imageUrl) {\n  const s = String(imageUrl || '');\n  return /\\/story-generated\\/[^/]+\\.jpg$/i.test(s) ? s.replace(/\\.jpg$/i, '.mp4') : '';\n}\nfunction igContainerBody({ videoUrl, imageUrl, token }) {\n  return videoUrl\n    ? { video_url: videoUrl, media_type: 'STORIES', access_token: token }\n    : { image_url: imageUrl, media_type: 'STORIES', access_token: token };\n}\nfunction igStatusStep(statusResp, runIndex) {\n  const r = statusResp || {};\n  if (r.error) return 'fehler';\n  if (r.status_code === 'FINISHED') return 'publish';\n  if (r.status_code === 'ERROR' || r.status_code === 'EXPIRED') return 'fehler';\n  return Number(runIndex) >= IG_MAX_CHECKS - 1 ? 'fehler' : 'wait';\n}\nfunction fbVideoStart(token) { return { upload_phase: 'start', access_token: token }; }\nfunction fbUploadHeaders(videoUrl, token) { return { Authorization: 'OAuth ' + token, file_url: videoUrl }; }\nfunction fbVideoFinish(videoId, token) { return { upload_phase: 'finish', video_id: String(videoId), access_token: token }; }\nfunction storyReport({ kind, fbOk, igOk, fbErr, igErr, title, url, hours }) {\n  const head = (fbOk && igOk) ? '📸 Stories gepostet' : (fbOk || igOk) ? '⚠️ Stories teilweise gepostet' : '❌ Stories nicht gepostet';\n  const art = kind === 'video' ? '🎵 Video mit Musik' : '🖼 Bild (kein Video gefunden)';\n  return head + ' (' + hours + ' h nach dem Beitrag)\\n\\n📝 ' + title + '\\n🔗 ' + url + '\\n' + art + '\\n\\n' +\n    (fbOk ? '✅ Facebook-Story gepostet' : '❌ Facebook-Story fehlgeschlagen: ' + (fbErr || 'keine Antwort')) + '\\n' +\n    (igOk ? '✅ Instagram-Story gepostet' : '❌ Instagram-Story fehlgeschlagen: ' + (igErr || 'keine Antwort')) +\n    '\\nℹ️ LinkedIn hat keine Stories.';\n}\nconst G = 'https://graph.facebook.com/v23.0/';\nconst errText = (e) => { const b = e && (e.response && e.response.body || e.cause && e.cause.response && e.cause.response.body || e.description); return String(b ? (typeof b === 'string' ? b : JSON.stringify(b)) : (e && e.message || e)).slice(0, 220); };\n";

const hook = trigger({
  type: 'n8n-nodes-base.webhook', version: 2,
  config: { name: 'Story-Webhook', position: [100, 300], parameters: { httpMethod: 'POST', path: 'liar-story-repost', responseMode: 'onReceived', options: {} } },
  output: [{ body: { article_title: 'T', live_url: 'u', story_image_url: 'https://liar-entertainer.com/story-generated/x.jpg', fb_page_id: '1', fb_page_token: 't', ig_id: '2' } }]
});
const payload = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Payload extrahieren', position: [300, 300], parameters: { jsCode: "const wh = $input.first().json;\nconst data = wh.body || wh;\nconst required = ['article_title','live_url','story_image_url','fb_page_id','fb_page_token','ig_id'];\nfor (const k of required) {\n  if (!data[k]) throw new Error('Story-Repost: Pflichtfeld fehlt im Payload: ' + k);\n}\nreturn [{json: {\n  article_title: data.article_title,\n  article_description: data.article_description || '',\n  live_url: data.live_url,\n  cover_url: data.cover_url || data.story_image_url,\n  story_image_url: data.story_image_url,\n  category: data.category || '',\n  fb_page_id: data.fb_page_id,\n  fb_page_token: data.fb_page_token,\n  ig_id: data.ig_id,\n  wait_minutes: Number(data.wait_minutes) || 0,\n}}];" } },
  output: [{ article_title: 'T' }]
});
const waitCalc = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Wait-Zeit berechnen', position: [500, 300], parameters: { jsCode: "const a = $input.first().json;\nconst minMinutes = 8 * 60, maxMinutes = 12 * 60;\nconst fixed = Number(a.wait_minutes) || 0;\nconst waitMinutes = fixed >= 60 ? fixed : Math.floor(Math.random() * (maxMinutes - minMinutes + 1)) + minMinutes;\nreturn [{json: {...a, wait_minutes: waitMinutes, wait_hours_label: (Math.round(waitMinutes / 6) / 10).toFixed(1)}}];" } },
  output: [{ wait_minutes: 480 }]
});
const waitStory = node({
  type: 'n8n-nodes-base.wait', version: 1.1,
  config: { name: 'Wait randomisiert (8-12h)', position: [700, 300], parameters: { amount: '={{ $json.wait_minutes }}', unit: 'minutes' } },
  output: [{}]
});
const media = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Medien wählen', position: [900, 300], parameters: { jsCode: LIB + "\n// --- Video vorhanden? Sonst Bild ---\nconst p = $('Payload extrahieren').first().json;\nconst videoUrl = videoUrlFor(p.story_image_url);\nlet ok = false;\nif (videoUrl) { try { await this.helpers.httpRequest({ method: 'HEAD', url: videoUrl, timeout: 20000 }); ok = true; } catch (e) {} }\nreturn [{ json: { ...p, kind: ok ? 'video' : 'bild', video_url: ok ? videoUrl : '' } }];\n" } },
  output: [{ kind: 'video', video_url: 'v.mp4' }]
});
const fbPost = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'FB: Story posten', position: [1100, 300], parameters: { jsCode: LIB + "\n// --- Facebook: Video-Story (start → upload per file_url → finish), sonst/notfalls Foto-Story ---\nconst p = $input.first().json;\nconst h = this.helpers;\nconst tok = p.fb_page_token;\nlet fbOk = false, fbErr = '', fbKind = p.kind;\nif (p.kind === 'video') {\n  try {\n    const st = await h.httpRequest({ method: 'POST', url: G + p.fb_page_id + '/video_stories', json: true, body: fbVideoStart(tok) });\n    await h.httpRequest({ method: 'POST', url: st.upload_url, headers: fbUploadHeaders(p.video_url, tok), json: true });\n    const fin = await h.httpRequest({ method: 'POST', url: G + p.fb_page_id + '/video_stories', json: true, body: fbVideoFinish(st.video_id, tok) });\n    fbOk = !!(fin && (fin.success || fin.post_id));\n    if (!fbOk) fbErr = 'Video: ' + JSON.stringify(fin).slice(0, 160);\n  } catch (e) { fbErr = 'Video: ' + errText(e); }\n}\nif (!fbOk) {\n  try {\n    const up = await h.httpRequest({ method: 'POST', url: G + p.fb_page_id + '/photos', json: true, body: { url: p.story_image_url, published: false, access_token: tok } });\n    const r = await h.httpRequest({ method: 'POST', url: G + p.fb_page_id + '/photo_stories', json: true, body: { photo_id: up.id, access_token: tok } });\n    fbOk = !!(r && (r.success || r.post_id || r.id));\n    if (fbOk) { fbKind = 'bild'; if (p.kind === 'video') fbErr = ''; }\n    else fbErr = (fbErr ? fbErr + ' | ' : '') + 'Bild: ' + JSON.stringify(r).slice(0, 160);\n  } catch (e) { fbErr = (fbErr ? fbErr + ' | ' : '') + 'Bild: ' + errText(e); }\n}\nreturn [{ json: { ...p, fbOk, fbErr, fbKind } }];\n" } },
  output: [{ fbOk: true }]
});
const igCreate = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'IG: Story-Container', position: [1300, 300], parameters: { jsCode: LIB + "\n// --- Instagram: Container anlegen (Video, sonst Bild) ---\nconst p = $input.first().json;\nlet creationId = '', igErr = '', igKind = p.kind;\ntry {\n  const c = await this.helpers.httpRequest({ method: 'POST', url: G + p.ig_id + '/media', json: true, body: igContainerBody({ videoUrl: p.video_url, imageUrl: p.story_image_url, token: p.fb_page_token }) });\n  creationId = c.id || '';\n} catch (e) { igErr = errText(e); }\nif (!creationId && p.kind === 'video') {\n  try {\n    const c = await this.helpers.httpRequest({ method: 'POST', url: G + p.ig_id + '/media', json: true, body: igContainerBody({ videoUrl: '', imageUrl: p.story_image_url, token: p.fb_page_token }) });\n    creationId = c.id || ''; igKind = 'bild';\n  } catch (e) { igErr += ' | Bild: ' + errText(e); }\n}\nreturn [{ json: { ...p, creation_id: creationId, igErr, igKind } }];\n" } },
  output: [{ creation_id: 'c1' }]
});
const igWait = node({
  type: 'n8n-nodes-base.wait', version: 1.1,
  config: { name: 'IG: 30s warten', position: [1500, 300], parameters: { amount: 30, unit: 'seconds' } },
  output: [{}]
});
const igStatus = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'IG: Status prüfen', position: [1700, 300], parameters: { jsCode: LIB + "\n// --- Instagram verarbeitet Videos asynchron: erst bei FINISHED veröffentlichen ---\nconst p = $('IG: Story-Container').first().json;\nif (!p.creation_id) return [{ json: { ...p, step: 'fehler' } }];\nlet st = {};\ntry { st = await this.helpers.httpRequest({ method: 'GET', url: G + p.creation_id + '?fields=status_code,status&access_token=' + encodeURIComponent(p.fb_page_token), json: true }); }\ncatch (e) { st = { error: { message: errText(e) } }; }\nconst step = igStatusStep(st, $runIndex);\nreturn [{ json: { ...p, step, ig_status: st.status_code || '', igErr: step === 'fehler' ? (p.igErr || (st.error && st.error.message) || st.status || 'Verarbeitung nicht fertig') : p.igErr } }];\n" } },
  output: [{ step: 'publish' }]
});
const ifIgWait = ifElse({
  version: 2.2,
  config: { name: 'IG: noch in Arbeit?', position: [1900, 300],
    parameters: { conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'strict' },
      conditions: [{ id: 'igw', leftValue: '={{ $json.step }}', rightValue: 'wait', operator: { type: 'string', operation: 'equals' } }],
      combinator: 'and' }, options: {} } }
});
const igPublish = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'IG: Story veröffentlichen', position: [2100, 400], parameters: { jsCode: LIB + "\n// --- Instagram veröffentlichen ---\nconst p = $input.first().json;\nlet igOk = false, igErr = p.igErr || '';\nif (p.step === 'publish') {\n  try {\n    const r = await this.helpers.httpRequest({ method: 'POST', url: G + p.ig_id + '/media_publish', json: true, body: { creation_id: p.creation_id, access_token: p.fb_page_token } });\n    igOk = !!r.id; if (!igOk) igErr = JSON.stringify(r).slice(0, 160);\n  } catch (e) { igErr = errText(e); }\n}\nreturn [{ json: { ...p, igOk, igErr: igOk ? '' : igErr } }];\n" } },
  output: [{ igOk: true }]
});
const report = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Ergebnis pruefen', position: [2300, 400], parameters: { jsCode: LIB + "\n// --- Telegram-Bericht ---\nconst p = $input.first().json;\nconst fb = $('FB: Story posten').first().json;\nconst h = $('Wait-Zeit berechnen').first().json.wait_hours_label;\nconst kind = (fb.fbKind === 'video' || p.igKind === 'video') ? 'video' : 'bild';\nreturn [{ json: { fbOk: fb.fbOk, igOk: p.igOk, kind, text: storyReport({ kind, fbOk: fb.fbOk, igOk: p.igOk, fbErr: fb.fbErr, igErr: p.igErr, title: p.article_title, url: p.live_url, hours: h }) } }];\n" } },
  output: [{ text: 't' }]
});
const tg = node({
  type: 'n8n-nodes-base.telegram', version: 1.2,
  config: { name: 'Telegram: Story-Bestaetigung', position: [2500, 400], credentials: TG,
    parameters: { resource: 'message', operation: 'sendMessage', chatId: CHAT, text: '={{ $json.text }}', additionalFields: { appendAttribution: false } } },
  output: [{ ok: true }]
});

const note = sticky('## LIAR Story-Repost\nAufruf: Social-Post (Webhook liar-story-repost) mit Story-Bild-URL. Wartet 8–12 h (oder wait_minutes).\nSeit 16.11.2026: postet das 15-s-Video public/story-generated/<slug>.mp4 (Bild + eigene Musik) als Story; fehlt es oder scheitert es, das Bild.\nInstagram verarbeitet Videos asynchron → Status alle 30 s, max. 5 Min. Facebook: video_stories (start → file_url → finish).', [], { position: [100, 40], width: 760, height: 200 });

export default workflow('liar-story-repost', 'LIAR-2026-06 Story-Repost (+8h)')
  .add(hook).to(payload).to(waitCalc).to(waitStory).to(media).to(fbPost).to(igCreate).to(igWait).to(igStatus)
  .to(ifIgWait.onTrue(igWait).onFalse(igPublish.to(report).to(tg)))
  .add(note);
