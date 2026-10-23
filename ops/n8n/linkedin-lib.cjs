// LinkedIn-Beitrag mit Artikelbild als Vorschau.
// LinkedIn liest bei der Posts-API KEIN og:image der verlinkten Seite – das Vorschaubild muss
// vorher über die Images-API hochgeladen werden (initializeUpload → PUT uploadUrl) und als
// content.article.thumbnail (urn:li:image:…) mitgeschickt werden.
// Wird in die Social-Post-Code-Knoten „LinkedIn: Beitrag bauen“ / „Bericht bauen“ eingefügt.

function ok2xx(r) {
  const c = Number(r && r.statusCode) || 0;
  return c >= 200 && c < 300;
}

function buildInitUpload(sub) {
  return { initializeUploadRequest: { owner: 'urn:li:person:' + sub } };
}

function imageUrnFrom(initResp, uploadResp) {
  if (!ok2xx(initResp) || !ok2xx(uploadResp)) return '';
  const v = initResp.body && initResp.body.value;
  return (v && typeof v.image === 'string' && v.image.indexOf('urn:li:image:') === 0) ? v.image : '';
}

function buildLinkedInPost(a) {
  const article = {
    source: a.url,
    title: String(a.title || '').slice(0, 200),
    description: String(a.description || '').slice(0, 256)
  };
  if (a.imageUrn) article.thumbnail = a.imageUrn;
  return {
    author: 'urn:li:person:' + a.sub,
    commentary: a.text,
    visibility: 'PUBLIC',
    distribution: { feedDistribution: 'MAIN_FEED', targetEntities: [], thirdPartyDistributionChannels: [] },
    content: { article },
    lifecycleState: 'PUBLISHED',
    isReshareDisabledByAuthor: false
  };
}

function linkedinReport(me, post, imageUrn) {
  if (!me || !me.sub) return 'FEHLER LinkedIn-Zugang abgelaufen – Credential in n8n neu verbinden';
  if (ok2xx(post)) return imageUrn ? 'ok (mit Vorschaubild)' : 'ok, aber OHNE Vorschaubild (Bild-Upload fehlgeschlagen)';
  return 'FEHLER ' + JSON.stringify(post && (post.body || post.error) || post).slice(0, 200);
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { buildInitUpload, imageUrnFrom, buildLinkedInPost, linkedinReport };
}
