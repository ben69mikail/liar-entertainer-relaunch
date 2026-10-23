// Alle Dateien eines Artikels als EIN Commit über die GitHub Git Data API (blobs → tree → commit → ref).
// Wird von build.py in den n8n-Code-Knoten „Baum bauen“ / „Commit pruefen“ eingefügt.

function checkStep(name, resp) {
  const r = resp || {};
  const code = Number(r.statusCode) || 0;
  if (code >= 200 && code < 300) return r.body || {};
  const msg = (r.body && (r.body.message || JSON.stringify(r.body))) || r.error || 'keine Antwort';
  throw new Error('GitHub-Schritt „' + name + '“ fehlgeschlagen: ' + (code || '?') + ' ' + String(msg).slice(0, 200));
}

function buildTreeRequest(files, blobResponses, refBody, commitBody) {
  if (files.length !== blobResponses.length) {
    throw new Error('GitHub: ' + files.length + ' Dateien, ' + blobResponses.length + ' Blobs – Abbruch, nichts committet.');
  }
  const tree = files.map((f, i) => {
    const b = blobResponses[i] || {};
    const code = Number(b.statusCode) || 0;
    if (!(code >= 200 && code < 300) || !b.body || !b.body.sha) {
      const why = (b.body && b.body.message) || b.error || 'keine Antwort';
      throw new Error('GitHub-Upload ' + f.path.split('/').pop() + ' fehlgeschlagen: ' + (code || '?') + ' ' + String(why).slice(0, 160) + ' – nichts committet.');
    }
    return { path: f.path, mode: '100644', type: 'blob', sha: b.body.sha };
  });
  const md = files.find(f => /\.md$/.test(f.path));
  return {
    base_tree: commitBody.tree.sha,
    parent: refBody.object.sha,
    message: (md || files[files.length - 1]).message,
    tree
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { checkStep, buildTreeRequest };
}
