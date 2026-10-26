// Zielseiten-Pflicht (Council 23.10.2026): jeder Blogartikel muss auf eine Leistungsseite verlinken.
// Genutzt von: n8n-Knoten „Artikel aufbereiten“ (eingefügt ohne require), site/scripts/auto-publish.mjs (require).
// Tests: node --test ops/n8n/target.test.mjs

// Leistungsseite = jede Seite unter diesen Bereichen + Startseite. Nicht: Blog, Kontakt, Galerie, Über mich, Rechtliches, FR/EN.
const TARGET_PREFIXES = ['/kindergeburtstag/', '/kinderzauberer/', '/preise/', '/clown/', '/zauberer/'];
const EXTERNAL_TARGETS = ['https://www.pantomime-la-france.eu/'];

function isTargetPath(path) {
  const p = String(path || '');
  if (p === '/') return true;
  if (/\.[a-z0-9]{2,5}$/i.test(p)) return false;
  return TARGET_PREFIXES.some((x) => p.startsWith(x));
}

function normalizeLink(href) {
  let h = String(href || '').trim().split('#')[0].split('?')[0];
  const ext = EXTERNAL_TARGETS.find((e) => h.replace(/\/?$/, '/').replace(/^http:/, 'https:').replace('://pantomime', '://www.pantomime') === e);
  if (ext) return { ext };
  const m = h.match(/^https?:\/\/(?:www\.)?liar-entertainer\.com(\/.*)?$/i);
  if (m) h = m[1] || '/';
  else if (/^https?:\/\//i.test(h) || !h.startsWith('/')) return null;
  if (!/\.[a-z0-9]{2,5}$/i.test(h) && !h.endsWith('/')) h += '/';
  return { path: h };
}

/** Alle verlinkten Leistungsseiten (Pfade bzw. externe Zielseite), ohne Bilder, in Reihenfolge, ohne Doppelte. */
function findTargetLinks(body) {
  const out = [];
  for (const m of String(body || '').matchAll(/(!?)\[[^\]]*\]\(([^)\s]+)[^)]*\)/g)) {
    if (m[1]) continue;
    const n = normalizeLink(m[2]);
    if (!n) continue;
    const v = n.ext || (isTargetPath(n.path) ? n.path : null);
    if (v && !out.includes(v)) out.push(v);
  }
  return out;
}

/** { ok, links, reason } – zielUrl (Plan-Artikel) muss dann genau verlinkt sein. */
function targetCheck(body, zielUrl) {
  const links = findTargetLinks(body);
  if (zielUrl) {
    const z = (normalizeLink(zielUrl) || {}).path || zielUrl;
    if (!links.includes(z)) return { ok: false, links, reason: 'Link zur geplanten Ziel-Seite ' + z + ' fehlt' };
  }
  if (!links.length) return { ok: false, links, reason: 'Kein Link auf eine Leistungsseite (z. B. /kindergeburtstag/, /zauberer/zaubershow/, /clown/clownshow/) – Kontakt/Blog zählen nicht' };
  return { ok: true, links, reason: '' };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { isTargetPath, normalizeLink, findTargetLinks, targetCheck, TARGET_PREFIXES };
}
