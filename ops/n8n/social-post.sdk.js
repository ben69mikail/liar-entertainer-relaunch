// n8n-Workflow „LIAR-2026-07 Social-Post“ (ZLm26Qc0IosVPprm) als Workflow-SDK-Quelle.
// <SOCIAL_SECRET> vor dem Hochladen durch das Secret des Social-Post-Webhooks ersetzen (nicht ins Repo).
// LinkedIn-Code-Knoten aus ops/n8n/linkedin-lib.cjs (Tests: node --test ops/n8n/linkedin.test.mjs).
import { workflow, node, trigger, sticky, ifElse } from '@n8n/workflow-sdk';

const FB = { facebookGraphApi: { id: 'DOJkAwhPR5OOJxsV', name: 'Facebook Graph account' } };
const LI = { linkedInOAuth2Api: { id: 'R0nsb9Nqq9OY4yXl', name: 'LinkedIn account' } };
const GBP = { googleBusinessProfileOAuth2Api: { id: 'cxTKghXQayy7p1vH', name: 'Google Unternehmensprofil' } };
const TG = { telegramApi: { id: 'NLiyAfhaGJ1NrflC', name: 'Telegram account' } };
const LI_HEADERS = { parameters: [{ name: 'LinkedIn-Version', value: '202604' }, { name: 'X-Restli-Protocol-Version', value: '2.0.0' }] };

const socialWebhook = trigger({
  type: 'n8n-nodes-base.webhook', version: 2.1,
  config: { name: 'Social-Webhook', position: [0, 300], parameters: { httpMethod: 'POST', path: 'liar-social-post', responseMode: 'onReceived', options: {} } },
  output: [{ body: { secret: 'x', title: 'Titel', live_url: 'https://liar-entertainer.com/blog/x/', image_url: 'https://liar-entertainer.com/hero-generated/x.jpg', channels: ['facebook', 'instagram', 'linkedin'], story: true, texts: { facebook: 'fb', instagram: 'ig', linkedin: 'li' } } }]
});
const checkPayload = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Payload pruefen', position: [220, 300], parameters: { jsCode: "const raw = $input.first().json;\nconst d = raw.body || raw;\nif (d.secret !== '<SOCIAL_SECRET>') throw new Error('Social-Post: falsches oder fehlendes secret');\nfor (const k of ['title', 'live_url', 'image_url']) { if (!d[k]) throw new Error('Social-Post: Pflichtfeld fehlt: ' + k); }\nconst t = d.texts || {};\nconst desc = String(d.description || '');\nconst fallback = d.title + (desc ? '\\n\\n' + desc : '');\nconst utm = (src, med) => d.live_url + (d.live_url.includes('?') ? '&' : '?') + 'utm_source=' + src + '&utm_medium=' + med;\nlet channels = d.channels;\nif (typeof channels === 'string') channels = channels.split(',').map(s => s.trim());\nif (!Array.isArray(channels) || !channels.length) channels = ['facebook', 'instagram', 'linkedin'];\nreturn [{ json: {\n  title: d.title,\n  live_url: d.live_url,\n  image_url: d.image_url,\n  image_url_ig: d.image_url_ig || d.image_url,\n  story_image_url: d.story_image_url || '',\n  story: d.story === true || d.story === 'true',\n  story_delay_minutes: Number(d.story_delay_minutes) || 0,\n  channels,\n  source: d.source || 'unbekannt',\n  text_facebook: t.facebook || (fallback + '\\n\\n👉 ' + utm('facebook', 'social') + '\\n\\n#clownzauberer #kinderzauberer #nrw'),\n  text_instagram: t.instagram || (fallback + '\\n\\nLink in der Bio\\n\\n#clownzauberer #kinderzauberer #kindergeburtstag #nrw #ruhrgebiet #gladbeck'),\n  text_linkedin: t.linkedin || (fallback + '\\n\\n' + utm('linkedin', 'social')),\n  text_gbp: String(t.gbp || fallback).replace(/https?:\\/\\/\\S+/g, '').replace(/\\+?\\d[\\d\\s\\/-]{7,}\\d/g, '').slice(0, 1450),\n  gbp_url: utm('gbp', 'post'),\n  description: desc,\n} }];" } },
  output: [{ title: 'Titel', live_url: 'https://liar-entertainer.com/blog/x/', image_url: 'https://x/y.jpg', channels: ['facebook'], story: false }]
});
const fbToken = node({
  type: 'n8n-nodes-base.httpRequest', version: 4.2,
  config: { name: 'FB: Page-Token holen', position: [440, 300], credentials: FB,
    parameters: { method: 'GET', url: 'https://graph.facebook.com/v23.0/166269440061757', authentication: 'predefinedCredentialType', nodeCredentialType: 'facebookGraphApi',
      sendQuery: true, queryParameters: { parameters: [{ name: 'fields', value: 'id,name,access_token,instagram_business_account{id,username}' }] }, options: { timeout: 30000 } } },
  output: [{ id: '166269440061757', name: 'Clown Zauberer LIAR', access_token: 'tok', instagram_business_account: { id: '1784' } }]
});
const fbIgPost = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'FB + IG posten', position: [660, 300], parameters: { jsCode: "const p = $('Payload pruefen').first().json;\nconst page = $input.first().json;\nconst token = page.access_token;\nconst igId = page.instagram_business_account && page.instagram_business_account.id;\nconst G = 'https://graph.facebook.com/v23.0';\nconst h = this.helpers;\nconst sleep = (ms) => new Promise(r => setTimeout(r, ms));\nconst errText = (e) => { const b = e && (e.response && e.response.body || e.cause && e.cause.response && e.cause.response.body); return (b ? JSON.stringify(b) : String(e && e.message || e)).slice(0, 300); };\nconst res = { facebook: 'übersprungen', instagram: 'übersprungen', story: 'übersprungen' };\nif (!token) throw new Error('Kein Facebook-Page-Token – Facebook-Credential in n8n neu verbinden.');\nif (p.channels.includes('facebook')) {\n  try {\n    const r = await h.httpRequest({ method: 'POST', url: G + '/' + page.id + '/photos', json: true, body: { url: p.image_url, caption: p.text_facebook, access_token: token } });\n    res.facebook = 'ok ' + (r.post_id || r.id);\n  } catch (e) { res.facebook = 'FEHLER ' + errText(e); }\n}\nif (p.channels.includes('instagram')) {\n  if (!igId) { res.instagram = 'FEHLER kein Instagram-Business-Konto an der Seite'; }\n  else {\n    try {\n      const c = await h.httpRequest({ method: 'POST', url: G + '/' + igId + '/media', json: true, body: { image_url: p.image_url_ig, caption: p.text_instagram, access_token: token } });\n      let ready = false;\n      for (let i = 0; i < 12 && !ready; i++) {\n        await sleep(5000);\n        const s = await h.httpRequest({ method: 'GET', url: G + '/' + c.id, qs: { fields: 'status_code', access_token: token }, json: true });\n        ready = s.status_code === 'FINISHED';\n        if (s.status_code === 'ERROR') throw new Error('IG-Container ERROR (Bildformat? 4:5 bis 1.91:1, JPEG)');\n      }\n      const pub = await h.httpRequest({ method: 'POST', url: G + '/' + igId + '/media_publish', json: true, body: { creation_id: c.id, access_token: token } });\n      res.instagram = 'ok ' + pub.id;\n    } catch (e) { res.instagram = 'FEHLER ' + errText(e); }\n  }\n}\nif (p.story && p.story_image_url) {\n  try {\n    await h.httpRequest({ method: 'POST', url: 'https://n8n.srv860817.hstgr.cloud/webhook/liar-story-repost', json: true, body: { article_title: p.title, article_description: p.description, live_url: p.live_url, cover_url: p.image_url, story_image_url: p.story_image_url, fb_page_id: page.id, fb_page_token: token, ig_id: igId, wait_minutes: p.story_delay_minutes || 0 } });\n    res.story = p.story_delay_minutes >= 60 ? 'geplant (+' + Math.round(p.story_delay_minutes / 6) / 10 + ' h)' : 'geplant (+8–12 h)';\n  } catch (e) { res.story = 'FEHLER ' + errText(e); }\n}\nreturn [{ json: { ...res, want_linkedin: p.channels.includes('linkedin') } }];" } },
  output: [{ facebook: 'ok 1', instagram: 'ok 2', story: 'geplant', want_linkedin: true }]
});
const ifLinkedin = ifElse({
  version: 2.2,
  config: { name: 'LinkedIn gewuenscht?', position: [880, 300],
    parameters: { conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'loose' },
      conditions: [{ id: 'li1', leftValue: '={{ $json.want_linkedin }}', rightValue: true, operator: { type: 'boolean', operation: 'true', singleValue: true } }], combinator: 'and' }, options: {} } }
});
const liMe = node({
  type: 'n8n-nodes-base.httpRequest', version: 4.2,
  config: { name: 'LinkedIn: Profil', position: [1100, 140], credentials: LI, onError: 'continueRegularOutput',
    parameters: { method: 'GET', url: 'https://api.linkedin.com/v2/userinfo', authentication: 'predefinedCredentialType', nodeCredentialType: 'linkedInOAuth2Api', options: { timeout: 30000 } } },
  output: [{ sub: 'abc', name: 'Michaël Prescler' }]
});
const liInit = node({
  type: 'n8n-nodes-base.httpRequest', version: 4.2,
  config: { name: 'LinkedIn: Bild anmelden', position: [1300, 140], credentials: LI, onError: 'continueRegularOutput',
    parameters: { method: 'POST', url: 'https://api.linkedin.com/rest/images?action=initializeUpload', authentication: 'predefinedCredentialType', nodeCredentialType: 'linkedInOAuth2Api',
      sendHeaders: true, headerParameters: LI_HEADERS, sendBody: true, specifyBody: 'json',
      jsonBody: "={{ JSON.stringify({ initializeUploadRequest: { owner: 'urn:li:person:' + $json.sub } }) }}",
      options: { timeout: 30000, response: { response: { fullResponse: true, neverError: true } } } } },
  output: [{ statusCode: 200, body: { value: { uploadUrl: 'https://www.linkedin.com/dms-uploads/x', image: 'urn:li:image:1' } } }]
});
const liImg = node({
  type: 'n8n-nodes-base.httpRequest', version: 4.2,
  config: { name: 'LinkedIn: Artikelbild laden', position: [1500, 140], onError: 'continueRegularOutput',
    parameters: { method: 'GET', url: "={{ $('Payload pruefen').first().json.image_url }}",
      options: { timeout: 60000, response: { response: { responseFormat: 'file' } } } } },
  output: [{}]
});
const liUpload = node({
  type: 'n8n-nodes-base.httpRequest', version: 4.2,
  config: { name: 'LinkedIn: Bild hochladen', position: [1700, 140], credentials: LI, onError: 'continueRegularOutput',
    parameters: { method: 'PUT', url: "={{ (($('LinkedIn: Bild anmelden').first().json.body || {}).value || {}).uploadUrl || 'https://api.linkedin.com/fehlt' }}",
      authentication: 'predefinedCredentialType', nodeCredentialType: 'linkedInOAuth2Api',
      sendBody: true, contentType: 'binaryData', inputDataFieldName: 'data',
      options: { timeout: 60000, response: { response: { fullResponse: true, neverError: true } } } } },
  output: [{ statusCode: 201 }]
});
const liBuild = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'LinkedIn: Beitrag bauen', position: [1900, 140], parameters: { jsCode: "// LinkedIn-Beitrag mit Artikelbild als Vorschau.\n// LinkedIn liest bei der Posts-API KEIN og:image der verlinkten Seite – das Vorschaubild muss\n// vorher über die Images-API hochgeladen werden (initializeUpload → PUT uploadUrl) und als\n// content.article.thumbnail (urn:li:image:…) mitgeschickt werden.\n// Wird in die Social-Post-Code-Knoten „LinkedIn: Beitrag bauen“ / „Bericht bauen“ eingefügt.\n\nfunction ok2xx(r) {\n  const c = Number(r && r.statusCode) || 0;\n  return c >= 200 && c < 300;\n}\n\nfunction buildInitUpload(sub) {\n  return { initializeUploadRequest: { owner: 'urn:li:person:' + sub } };\n}\n\nfunction imageUrnFrom(initResp, uploadResp) {\n  if (!ok2xx(initResp) || !ok2xx(uploadResp)) return '';\n  const v = initResp.body && initResp.body.value;\n  return (v && typeof v.image === 'string' && v.image.indexOf('urn:li:image:') === 0) ? v.image : '';\n}\n\nfunction buildLinkedInPost(a) {\n  const article = {\n    source: a.url,\n    title: String(a.title || '').slice(0, 200),\n    description: String(a.description || '').slice(0, 256)\n  };\n  if (a.imageUrn) article.thumbnail = a.imageUrn;\n  return {\n    author: 'urn:li:person:' + a.sub,\n    commentary: a.text,\n    visibility: 'PUBLIC',\n    distribution: { feedDistribution: 'MAIN_FEED', targetEntities: [], thirdPartyDistributionChannels: [] },\n    content: { article },\n    lifecycleState: 'PUBLISHED',\n    isReshareDisabledByAuthor: false\n  };\n}\n\nfunction linkedinReport(me, post, imageUrn) {\n  if (!me || !me.sub) return 'FEHLER LinkedIn-Zugang abgelaufen – Credential in n8n neu verbinden';\n  if (ok2xx(post)) return imageUrn ? 'ok (mit Vorschaubild)' : 'ok, aber OHNE Vorschaubild (Bild-Upload fehlgeschlagen)';\n  return 'FEHLER ' + JSON.stringify(post && (post.body || post.error) || post).slice(0, 200);\n}\n\nif (typeof module !== 'undefined' && module.exports) {\n  module.exports = { buildInitUpload, imageUrnFrom, buildLinkedInPost, linkedinReport };\n}\n\n// --- n8n: Beitrag mit Vorschaubild bauen ---\nconst p = $('Payload pruefen').first().json;\nlet me = {}, init = null;\ntry { me = $('LinkedIn: Profil').first().json || {}; } catch (e) {}\ntry { init = $('LinkedIn: Bild anmelden').first().json; } catch (e) {}\nconst upload = $input.first().json;\nconst imageUrn = imageUrnFrom(init, upload);\nreturn [{ json: {\n  image_urn: imageUrn,\n  body: buildLinkedInPost({ sub: me.sub, text: p.text_linkedin, url: p.live_url, title: p.title, description: p.description, imageUrn })\n} }];\n" } },
  output: [{ image_urn: 'urn:li:image:1', body: {} }]
});
const liPost = node({
  type: 'n8n-nodes-base.httpRequest', version: 4.2,
  config: { name: 'LinkedIn: Beitrag', position: [2100, 140], credentials: LI, onError: 'continueRegularOutput',
    parameters: { method: 'POST', url: 'https://api.linkedin.com/rest/posts', authentication: 'predefinedCredentialType', nodeCredentialType: 'linkedInOAuth2Api',
      sendHeaders: true, headerParameters: LI_HEADERS, sendBody: true, specifyBody: 'json',
      jsonBody: '={{ JSON.stringify($json.body) }}',
      options: { timeout: 30000, response: { response: { fullResponse: true, neverError: true } } } } },
  output: [{ statusCode: 201, headers: { 'x-restli-id': 'urn:li:share:1' } }]
});
const gbpPrep = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'GBP vorbereiten', position: [2300, 300], executeOnce: true, parameters: { jsCode: "// Google-Unternehmensprofil: Standort wird nach der API-Freigabe durch Google einmalig eingetragen.\nconst GBP_LOCATION = 'accounts/103330969593697494513/locations/9739402903237302654'; // Clown Zauberer LIAR, Gladbeck\nconst p = $('Payload pruefen').first().json;\nlet note = '';\nif (!p.channels.includes('gbp')) note = 'übersprungen';\nelse if (!GBP_LOCATION) note = 'wartet auf Google-API-Freigabe';\nreturn [{ json: { go: !note, note, gbp_location: GBP_LOCATION } }];\n" } },
  output: [{ go: false, note: 'übersprungen', gbp_location: '' }]
});
const ifGbp = ifElse({
  version: 2.2,
  config: { name: 'GBP posten?', position: [2500, 300],
    parameters: { conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'loose' },
      conditions: [{ id: 'g1', leftValue: '={{ $json.go }}', rightValue: true, operator: { type: 'boolean', operation: 'true', singleValue: true } }], combinator: 'and' }, options: {} } }
});
const gbpPost = node({
  type: 'n8n-nodes-base.httpRequest', version: 4.2,
  config: { name: 'GBP: Beitrag', position: [2700, 200], credentials: GBP, onError: 'continueRegularOutput',
    parameters: { method: 'POST', url: "={{ 'https://mybusiness.googleapis.com/v4/' + $json.gbp_location + '/localPosts' }}",
      authentication: 'predefinedCredentialType', nodeCredentialType: 'googleBusinessProfileOAuth2Api', sendBody: true, specifyBody: 'json',
      jsonBody: "={{ JSON.stringify({ languageCode: 'de', topicType: 'STANDARD', summary: $('Payload pruefen').first().json.text_gbp, callToAction: { actionType: 'LEARN_MORE', url: $('Payload pruefen').first().json.gbp_url }, media: [{ mediaFormat: 'PHOTO', sourceUrl: $('Payload pruefen').first().json.image_url }] }) }}",
      options: { timeout: 30000, response: { response: { fullResponse: true, neverError: true } } } } },
  output: [{ statusCode: 200, body: { name: 'accounts/1/locations/2/localPosts/3' } }]
});
const report = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Bericht bauen', position: [2900, 300], parameters: { jsCode: "// LinkedIn-Beitrag mit Artikelbild als Vorschau.\n// LinkedIn liest bei der Posts-API KEIN og:image der verlinkten Seite – das Vorschaubild muss\n// vorher über die Images-API hochgeladen werden (initializeUpload → PUT uploadUrl) und als\n// content.article.thumbnail (urn:li:image:…) mitgeschickt werden.\n// Wird in die Social-Post-Code-Knoten „LinkedIn: Beitrag bauen“ / „Bericht bauen“ eingefügt.\n\nfunction ok2xx(r) {\n  const c = Number(r && r.statusCode) || 0;\n  return c >= 200 && c < 300;\n}\n\nfunction buildInitUpload(sub) {\n  return { initializeUploadRequest: { owner: 'urn:li:person:' + sub } };\n}\n\nfunction imageUrnFrom(initResp, uploadResp) {\n  if (!ok2xx(initResp) || !ok2xx(uploadResp)) return '';\n  const v = initResp.body && initResp.body.value;\n  return (v && typeof v.image === 'string' && v.image.indexOf('urn:li:image:') === 0) ? v.image : '';\n}\n\nfunction buildLinkedInPost(a) {\n  const article = {\n    source: a.url,\n    title: String(a.title || '').slice(0, 200),\n    description: String(a.description || '').slice(0, 256)\n  };\n  if (a.imageUrn) article.thumbnail = a.imageUrn;\n  return {\n    author: 'urn:li:person:' + a.sub,\n    commentary: a.text,\n    visibility: 'PUBLIC',\n    distribution: { feedDistribution: 'MAIN_FEED', targetEntities: [], thirdPartyDistributionChannels: [] },\n    content: { article },\n    lifecycleState: 'PUBLISHED',\n    isReshareDisabledByAuthor: false\n  };\n}\n\nfunction linkedinReport(me, post, imageUrn) {\n  if (!me || !me.sub) return 'FEHLER LinkedIn-Zugang abgelaufen – Credential in n8n neu verbinden';\n  if (ok2xx(post)) return imageUrn ? 'ok (mit Vorschaubild)' : 'ok, aber OHNE Vorschaubild (Bild-Upload fehlgeschlagen)';\n  return 'FEHLER ' + JSON.stringify(post && (post.body || post.error) || post).slice(0, 200);\n}\n\nif (typeof module !== 'undefined' && module.exports) {\n  module.exports = { buildInitUpload, imageUrnFrom, buildLinkedInPost, linkedinReport };\n}\n\n// --- n8n: Bericht ---\nconst p = $('Payload pruefen').first().json;\nconst r = $('FB + IG posten').first().json;\nlet li = 'übersprungen';\nif (r.want_linkedin) {\n  let me = null, post = null, urn = '';\n  try { me = $('LinkedIn: Profil').first().json; } catch (e) {}\n  try { post = $('LinkedIn: Beitrag').first().json; } catch (e) {}\n  try { urn = $('LinkedIn: Beitrag bauen').first().json.image_urn || ''; } catch (e) {}\n  li = linkedinReport(me, post, urn);\n}\nconst g = $('GBP vorbereiten').first().json;\nlet gbp = g.note || 'übersprungen';\nif (g.go) { let gp = null; try { gp = $('GBP: Beitrag').first().json; } catch (e) {} gbp = (gp && gp.statusCode >= 200 && gp.statusCode < 300) ? 'ok' : 'FEHLER ' + JSON.stringify(gp && (gp.body || gp.error) || gp).slice(0, 200); }\nconst esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');\nconst text = esc('📣 Social-Post (' + p.source + ')\\n' + p.title + '\\n' + p.live_url + '\\n\\nFacebook: ' + r.facebook + '\\nInstagram: ' + r.instagram + '\\nLinkedIn: ' + li + '\\nGoogle-Profil: ' + gbp + '\\nStory: ' + r.story);\nreturn [{ json: { facebook: r.facebook, instagram: r.instagram, linkedin: li, gbp, story: r.story, text } }];" } },
  output: [{ facebook: 'ok', instagram: 'ok', linkedin: 'ok', story: 'ok', text: 'Bericht' }]
});
const tgReport = node({
  type: 'n8n-nodes-base.telegram', version: 1.2,
  config: { name: 'Telegram: Bericht', position: [3100, 300], credentials: TG,
    parameters: { resource: 'message', operation: 'sendMessage', chatId: '2106974057', text: '={{ $json.text }}',
      additionalFields: { appendAttribution: false, disable_web_page_preview: true, parse_mode: 'HTML' } } },
  output: [{ ok: true }]
});
const note = sticky('## LIAR Social-Post\nEin Ort für alle Social-Posts (FB, IG, LinkedIn, Google-Profil, Story +8–12 h oder story_delay_minutes).\nAufrufer: Artikel-Pipeline (Live-Check) und manuell per Webhook-Body.\nBody: secret, title, description, live_url, image_url, image_url_ig?, story_image_url?, story, story_delay_minutes?, channels[] (facebook, instagram, linkedin, gbp), texts{facebook,instagram,linkedin,gbp}, source.\nLinkedIn: Artikelbild wird über die Images-API hochgeladen und als Vorschaubild (article.thumbnail) gesetzt – LinkedIn liest og:image bei API-Posts nicht. Klappt der Bild-Upload nicht, wird ohne Bild gepostet und der Bericht sagt es. Code: ops/n8n/linkedin-lib.cjs.', [], { position: [0, 0], width: 560, height: 240 });

export default workflow('ZLm26Qc0IosVPprm', 'LIAR-2026-07 Social-Post')
  .add(socialWebhook)
  .to(checkPayload)
  .to(fbToken)
  .to(fbIgPost)
  .to(ifLinkedin
    .onTrue(liMe.to(liInit).to(liImg).to(liUpload).to(liBuild).to(liPost).to(gbpPrep))
    .onFalse(gbpPrep))
  .add(gbpPrep)
  .to(ifGbp.onTrue(gbpPost.to(report)).onFalse(report))
  .add(report)
  .to(tgReport)
  .add(note);
