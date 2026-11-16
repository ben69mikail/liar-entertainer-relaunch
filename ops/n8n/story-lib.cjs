// Story-Workflow „LIAR-2026-06 Story-Repost“ (P8Q0PSsRxT5lJw4x), seit 16.11.2026 als Video-Story mit Musik.
// Meta lässt Musik aus der App-Bibliothek nicht per Schnittstelle zu → der Build erzeugt
// public/story-generated/<slug>.mp4 (Story-Bild + eigene Musik). Fehlt das Video, wird das Bild gepostet.
// Eingefügt (ohne require) in die Code-Knoten von ops/n8n/story-repost.sdk.js. Tests: story.test.mjs

const IG_MAX_CHECKS = 10; // × 30 s Wartezeit = 5 Min für die Instagram-Videoverarbeitung

function videoUrlFor(imageUrl) {
  const s = String(imageUrl || '');
  return /\/story-generated\/[^/]+\.jpg$/i.test(s) ? s.replace(/\.jpg$/i, '.mp4') : '';
}

function igContainerBody({ videoUrl, imageUrl, token }) {
  return videoUrl
    ? { video_url: videoUrl, media_type: 'STORIES', access_token: token }
    : { image_url: imageUrl, media_type: 'STORIES', access_token: token };
}

function igStatusStep(statusResp, runIndex) {
  const r = statusResp || {};
  if (r.error) return 'fehler';
  if (r.status_code === 'FINISHED') return 'publish';
  if (r.status_code === 'ERROR' || r.status_code === 'EXPIRED') return 'fehler';
  return Number(runIndex) >= IG_MAX_CHECKS - 1 ? 'fehler' : 'wait';
}

function fbVideoStart(token) {
  return { upload_phase: 'start', access_token: token };
}

function fbUploadHeaders(videoUrl, token) {
  return { Authorization: 'OAuth ' + token, file_url: videoUrl };
}

function fbVideoFinish(videoId, token) {
  return { upload_phase: 'finish', video_id: String(videoId), access_token: token };
}

function storyReport({ kind, fbOk, igOk, fbErr, igErr, title, url, hours }) {
  const head = (fbOk && igOk) ? '📸 Stories gepostet' : (fbOk || igOk) ? '⚠️ Stories teilweise gepostet' : '❌ Stories nicht gepostet';
  const art = kind === 'video' ? '🎵 Video mit Musik' : '🖼 Bild (kein Video gefunden)';
  return head + ' (' + hours + ' h nach dem Beitrag)\n\n📝 ' + title + '\n🔗 ' + url + '\n' + art + '\n\n' +
    (fbOk ? '✅ Facebook-Story gepostet' : '❌ Facebook-Story fehlgeschlagen: ' + (fbErr || 'keine Antwort')) + '\n' +
    (igOk ? '✅ Instagram-Story gepostet' : '❌ Instagram-Story fehlgeschlagen: ' + (igErr || 'keine Antwort')) +
    '\nℹ️ LinkedIn hat keine Stories.';
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { IG_MAX_CHECKS, videoUrlFor, igContainerBody, igStatusStep, fbVideoStart, fbUploadHeaders, fbVideoFinish, storyReport };
}
