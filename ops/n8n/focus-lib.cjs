// Titelbild-Fokus: Bild-KI liefert Kopf + Oberkörper in % (x, top, bottom),
// die Pipeline schreibt ihn als `heroFocus` ins Frontmatter (Site: src/utils/focusCrop.ts).
// Wird von build.py in den n8n-Code-Knoten „Fokus eintragen“ eingefügt.

// Liest Zahlen/Flags auch aus abgeschnittenen Antworten (max_tokens erreicht).
function readField(raw, key) {
  const m = raw.match(new RegExp('"' + key + '"\\s*:\\s*(true|false|-?\\d+(?:\\.\\d+)?)'));
  if (!m) return undefined;
  if (m[1] === 'true') return true;
  if (m[1] === 'false') return false;
  return Number(m[1]);
}

function parseFocusReply(text) {
  const raw = String(text || '');
  const f = { x: Math.round(Number(readField(raw, 'x'))), top: Math.round(Number(readField(raw, 'top'))), bottom: Math.round(Number(readField(raw, 'bottom'))) };
  const ok = [f.x, f.top, f.bottom].every(n => Number.isFinite(n) && n >= 0 && n <= 100) && f.bottom > f.top;
  return ok ? f : null;
}

// Taugt das Foto als Titelbild? Kopf der Hauptperson ganz im Bild, kein nahes Kindergesicht.
function assessCover(text) {
  const raw = String(text || '');
  const focus = parseFocusReply(raw);
  if (!focus) return { ok: false, focus: null, grund: 'Bild-KI-Antwort unlesbar' };
  const kopf = readField(raw, 'kopf_ganz');
  const kopfGanz = typeof kopf === 'boolean' ? kopf : focus.top > 1;
  const kindNah = readField(raw, 'kind_gesicht_nah') === true;
  if (!kopfGanz) return { ok: false, focus, grund: 'Kopf der Hauptperson im Foto abgeschnitten' };
  if (kindNah) return { ok: false, focus, grund: 'Kindergesicht nah im Bild' };
  return { ok: true, focus, grund: '' };
}

// Index des ersten tauglichen Fotos (0 = bisheriges Titelbild), sonst -1.
function pickCover(replies) {
  for (let i = 0; i < replies.length; i++) if (assessCover(replies[i]).ok) return i;
  return -1;
}

// Titelbild mit einem Textbild tauschen: Dateien tauscht der Aufrufer, hier nur die Alt-Texte.
function swapCover(md, inlineName) {
  const text = String(md);
  const hero = text.match(/^heroImageAlt:\s*"(.*)"\s*$/m);
  const esc = inlineName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const inl = text.match(new RegExp('!\\[([^\\]]*)\\]\\(([^)]*\\/' + esc + ')\\)'));
  if (!hero || !inl) return text;
  return text
    .replace(/^heroImageAlt:\s*".*"\s*$/m, 'heroImageAlt: ' + JSON.stringify(inl[1]))
    .replace(inl[0], '![' + hero[1] + '](' + inl[2] + ')');
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
  module.exports = { parseFocusReply, injectFocus, assessCover, pickCover, swapCover };
}
