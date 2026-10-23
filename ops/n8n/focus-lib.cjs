// Titelbild-Fokus: Bild-KI liefert Kopf + Oberkörper in % (x, top, bottom),
// die Pipeline schreibt ihn als `heroFocus` ins Frontmatter (Site: src/utils/focusCrop.ts).
// Wird von build.py in den n8n-Code-Knoten „Fokus eintragen“ eingefügt.

function parseFocusReply(text) {
  const raw = String(text || '');
  const s = raw.indexOf('{');
  const e = raw.lastIndexOf('}');
  if (s < 0 || e <= s) return null;
  let j;
  try { j = JSON.parse(raw.slice(s, e + 1)); } catch (err) { return null; }
  const f = { x: Math.round(Number(j.x)), top: Math.round(Number(j.top)), bottom: Math.round(Number(j.bottom)) };
  const ok = [f.x, f.top, f.bottom].every(n => Number.isFinite(n) && n >= 0 && n <= 100) && f.bottom > f.top;
  return ok ? f : null;
}

function injectFocus(md, focus) {
  if (!focus) return md;
  const line = 'heroFocus: { x: ' + focus.x + ', top: ' + focus.top + ', bottom: ' + focus.bottom + ' }';
  const text = String(md);
  if (/^heroFocus:.*$/m.test(text)) return text.replace(/^heroFocus:.*$/m, line);
  if (/^heroImageAlt:.*$/m.test(text)) return text.replace(/^(heroImageAlt:.*)$/m, '$1\n' + line);
  return text.replace(/^(heroImage:.*)$/m, '$1\n' + line);
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { parseFocusReply, injectFocus };
}
