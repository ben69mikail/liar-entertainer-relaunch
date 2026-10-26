// Schutzregeln der Artikel-Pipeline (n8n „LIAR-2026-08“), seit 26.10.2026.
// - Preise: wie SEO-Gate PR.1 (site/scripts/seo-assertions.mjs) – Beträge 150/170/210 € nur, wenn
//   Titel oder Beschreibung einen Geburtstag nennen. Sonst würde GitHub die Veröffentlichung stoppen.
// - Live-Check: n8n bricht Code-Knoten nach 300 s ab → je Lauf nur EINE Prüfung, Warten per Wait-Knoten.
// Wird von build.py in die Code-Knoten „Artikel aufbereiten“ und „Live-Check“ eingefügt.

const PRICE_RE = /\b(150|170|210)\s?(€|Euro|EUR)/;
const PRICE_LINK = 'Die aktuellen Preise und Pakete stehen auf meiner [Preisseite](/preise/).';
const LIVE_MAX_TRIES = 12;

function priceAllowed(title, description) {
  return /Kindergeburtstag|Geburtstag|anniversaire|birthday/i.test(String(title || '') + ' ' + String(description || ''));
}

const ABBR = /^(ca|bzw|inkl|zzgl|ggf|evtl|usw|etc|vgl|Nr|Min|Std|Tel|Str|max|min|ab|u|z|d|o|s)$/i;

// Satzgrenze: . ! ? + Leerzeichen + Großbuchstabe/Anführung – nicht nach Abkürzungen (ca., z. B., inkl.).
function splitSentences(s) {
  const out = [];
  let start = 0;
  const re = /[.!?]\s+(?=[A-ZÄÖÜ„"(\[*])/g;
  let m;
  while ((m = re.exec(s))) {
    const word = (s.slice(start, m.index).match(/([\p{L}]+)$/u) || [])[1] || '';
    if (s[m.index] === '.' && (ABBR.test(word) || word.length === 1)) continue;
    out.push(s.slice(start, m.index + 1));
    start = m.index + m[0].length;
  }
  out.push(s.slice(start));
  return out.filter(x => x.trim());
}

function stripPrices(body) {
  const text = String(body || '');
  if (!PRICE_RE.test(text)) return { body: text, removed: 0 };
  let removed = 0;
  const blocks = text.split(/\n{2,}/).map((block) => {
    if (!PRICE_RE.test(block)) return block;
    const lines = [];
    for (const line of block.split('\n')) {
      if (!PRICE_RE.test(line)) { lines.push(line); continue; }
      const m = line.match(/^(\s*(?:[-*]|\d+\.)\s+)?([\s\S]*)$/);
      const prefix = m[1] || '';
      const keep = splitSentences(m[2]).filter((s) => {
        if (PRICE_RE.test(s)) { removed++; return false; }
        return true;
      });
      if (keep.length) lines.push(prefix + keep.join(' '));
    }
    let out = lines.join('\n');
    if (!out.trim()) return PRICE_LINK;
    if (!/\]\(\/preise\/\)/.test(out) && !/^\s*(?:[-*]|\d+\.)\s/.test(out)) out = out + ' ' + PRICE_LINK;
    return out;
  });
  return { body: blocks.join('\n\n'), removed };
}

function liveStep(isLive, runIndex) {
  if (isLive) return 'live';
  return Number(runIndex) >= LIVE_MAX_TRIES - 1 ? 'aufgeben' : 'retry';
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { PRICE_RE, PRICE_LINK, LIVE_MAX_TRIES, priceAllowed, splitSentences, stripPrices, liveStep };
}
