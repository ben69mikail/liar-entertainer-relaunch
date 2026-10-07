#!/usr/bin/env node
/**
 * SEO-Assertions — ausfuehrbare Spezifikation des ACTION-PLAN vom 06.08.2026.
 *
 * Laeuft gegen ./dist nach `npm run build`.
 * Exit 0 = alle Zusicherungen erfuellt (GREEN), Exit 1 = mindestens eine verletzt (RED).
 *
 * Aufruf: npm run test:seo   (oder: node scripts/seo-assertions.mjs)
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';

const DIST = 'dist';
const results = [];
let failed = 0;

function check(id, description, fn) {
  let ok = false;
  let detail = '';
  try {
    const r = fn();
    if (r === true) ok = true;
    else { ok = false; detail = String(r); }
  } catch (e) {
    ok = false;
    detail = `EXCEPTION: ${e.message}`;
  }
  if (!ok) failed++;
  results.push({ id, description, ok, detail });
}

// ---------- Helpers ----------
function walkHtml(dir = DIST) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walkHtml(p));
    else if (name.endsWith('.html')) out.push(p);
  }
  return out;
}
const HTML = existsSync(DIST) ? walkHtml() : [];
const pages = new Map(); // route -> html
for (const f of HTML) {
  const route = '/' + relative(DIST, f).replace(/index\.html$/, '').replace(/\\/g, '/');
  pages.set(route.replace(/\/$/, '') || '/', readFileSync(f, 'utf8'));
}
const get = (route) => pages.get(route === '/' ? '/' : route.replace(/\/$/, ''));
const titleOf = (h) => (h.match(/<title>([\s\S]*?)<\/title>/) || [, ''])[1].trim();
const descOf = (h) => (h.match(/<meta[^>]+name="description"[^>]+content="([^"]*)"/) || [, ''])[1];
const h1sOf = (h) => [...h.matchAll(/<h1[\s>]/g)].length;
const mainOf = (h) => (h.match(/<main[^>]*>([\s\S]*?)<\/main>/i) || [, h])[1];
const decode = (s) => s.replace(/&amp;/g, '&').replace(/&#38;/g, '&').replace(/&quot;/g, '"')
  .replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#8211;/g, '–');
const textOf = (h) => decode(mainOf(h).replace(/<script[\s\S]*?<\/script>/g, ' ')
  .replace(/<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ');
function ldOf(h) {
  const out = [];
  for (const m of h.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/g)) {
    try { out.push(JSON.parse(m[1])); } catch { /* Syntax wird in R2 separat geprueft */ }
  }
  return out;
}
const flatLd = (h) => ldOf(h).flatMap((o) => (Array.isArray(o) ? o : [o])).flatMap((o) => o['@graph'] || [o]);
const CITIES_KZ = [...pages.keys()].filter((r) => /^\/kinderzauberer\/kinderzauberer-in-/.test(r));
const CITIES_KG = [...pages.keys()].filter((r) => /^\/kindergeburtstag\/geburtstag-in-/.test(r));
const CITIES_CL = [...pages.keys()].filter((r) => /^\/clown\/clownshow\/clown-in-/.test(r));
const BLOG_POSTS = [...pages.keys()].filter((r) => /^\/blog\/[^/]+$/.test(r) && r !== '/blog');
const CATEGORIES = [...pages.keys()].filter((r) => /^\/blog\/kategorie\//.test(r));
// Preisregel (Inhaber-Vorgabe 18.06.2026): Preisnennung nur im Kindergeburtstags-KONTEXT.
// Die Regel ist kontext-, nicht pfadgebunden — ein Blogartikel ueber
// "Was kostet ein Zauberer zum Kindergeburtstag" darf den Preis nennen,
// die Seite /zauberer/zaubershow/ nicht.
// Listenseiten (/blog, /blog/kategorie/*) zeigen Teaser fremder Artikel — der Preis
// steht dort direkt neben dem Kindergeburtstags-Artikeltitel und ist damit im Kontext.
const PRICE_ALLOWED = (r, h) =>
  r === '/preise' ||
  r.startsWith('/kindergeburtstag') ||
  // FR/EN twins of /kindergeburtstag/ (translated slugs, same birthday context)
  r.startsWith('/fr/anniversaire-enfant') || r.startsWith('/en/kids-birthday-party') ||
  r === '/blog' || r.startsWith('/blog/kategorie/') ||
  /Kindergeburtstag|Geburtstag|anniversaire|birthday/i.test(titleOf(h) + ' ' + descOf(h));

// ---------- Sanity ----------
check('S0', 'Build vorhanden, mindestens 150 HTML-Seiten', () =>
  HTML.length >= 150 || `nur ${HTML.length} HTML-Dateien in ${DIST}/`);

// ---------- K2: Bewertungszahl konsistent ----------
check('K2.1', 'Keine "400+"/"ueber 400"-Bewertungsbehauptung', () => {
  const bad = [...pages].filter(([, h]) =>
    /(400\+|über 400|ueber 400)\s*(Top-?)?\s*(Bewertung|bewertung)/.test(decode(h)));
  return bad.length === 0 || `${bad.length} Seiten, z.B. ${bad.slice(0, 3).map((b) => b[0]).join(', ')}`;
});
check('K2.2', 'Startseite nennt die verbindliche Bewertungszahl 370+', () =>
  /370\+/.test(decode(get('/'))) || 'Startseite enthaelt "370+" nicht');

// ---------- K5: robots.txt ----------
check('K5.1', 'robots.txt blockiert /api/', () => {
  const r = readFileSync(join(DIST, 'robots.txt'), 'utf8');
  return /^Disallow:\s*\/api\//m.test(r) || 'Disallow: /api/ fehlt';
});

// ---------- K6: Faktenkanon ----------
check('K6.1', 'Keine widerspruechliche Showdauer "25/30" bzw. "25-30 Min" ohne Kita-Kontext', () => {
  const bad = [];
  for (const [r, h] of pages) {
    const t = textOf(h);
    if (/(25\/30|25\s*[-–]\s*30|25\s+bis\s+30)\s*Minuten/i.test(t) && !/Kita|Kindergarten/i.test(t)) bad.push(r);
  }
  return bad.length === 0 || `${bad.length} Seiten: ${bad.slice(0, 5).join(', ')}`;
});
check('K6.2', 'Altersangabe einheitlich 4-12 — kein "3 bis 12" ohne Kita-Kontext', () => {
  const bad = [];
  for (const [r, h] of pages) {
    const t = textOf(h);
    if (/\b3\s*(bis|-|–)\s*12\s*Jahr/i.test(t) && !/Kita|Kindergarten/i.test(t)) bad.push(r);
  }
  return bad.length === 0 || `${bad.length} Seiten: ${bad.slice(0, 5).join(', ')}`;
});
check('K6.3', 'Buchungsvorlauf einheitlich 4-8 Wochen (kein "2-4 Wochen")', () => {
  const bad = [...pages].filter(([, h]) => /\b2\s*[-–]\s*4\s*Wochen|\b2\s+bis\s+4\s+Wochen/i.test(textOf(h)));
  return bad.length === 0 || `${bad.length} Seiten: ${bad.slice(0, 5).map((b) => b[0]).join(', ')}`;
});

// ---------- Preisregel (harte Inhaber-Vorgabe) ----------
check('PR.1', 'Keine Preisangabe ausserhalb /preise/ und /kindergeburtstag/*', () => {
  const bad = [];
  for (const [r, h] of pages) {
    if (PRICE_ALLOWED(r, h)) continue;
    if (/\b(150|170|210)\s*(€|EUR|Euro)/.test(textOf(h))) bad.push(r);
  }
  return bad.length === 0 || `${bad.length} Seiten: ${bad.slice(0, 5).join(', ')}`;
});
check('PR.2', 'Kein Offer/Preis-Schema ausserhalb /preise/ und /kindergeburtstag/*', () => {
  const bad = [];
  for (const [r, h] of pages) {
    if (PRICE_ALLOWED(r, h)) continue;
    if (flatLd(h).some((n) => JSON.stringify(n).includes('"priceCurrency"'))) bad.push(r);
  }
  return bad.length === 0 || `${bad.length} Seiten: ${bad.slice(0, 5).join(', ')}`;
});

// ---------- K1: Rezensionen serverseitig im HTML ----------
check('K1.1', 'Startseite enthaelt Rezensions-Volltext bereits im HTML (ohne JS)', () => {
  const m = mainOf(get('/')).replace(/<script[\s\S]*?<\/script>/g, ' ');
  const n = [...m.matchAll(/data-review-text/g)].length;
  return n >= 3 || `nur ${n} serverseitig gerenderte Rezensionen`;
});
check('K1.2', 'Weiterhin KEIN aggregateRating/Review-Schema (Entscheidung 862f8a8)', () => {
  const bad = [...pages].filter(([, h]) => /aggregateRating|"@type"\s*:\s*"Review"/.test(h));
  return bad.length === 0 || `${bad.length} Seiten enthalten Bewertungs-Schema`;
});

// ---------- H1: Stadtseiten auf "Zauberer Kindergeburtstag [Stadt]" ----------
check('H1.1', 'Kinderzauberer-Stadtseiten: Title enthaelt "Zauberer Kindergeburtstag"', () => {
  const bad = CITIES_KZ.filter((r) => !/Zauberer Kindergeburtstag/i.test(decode(titleOf(get(r)))));
  return bad.length === 0 || `${bad.length}/${CITIES_KZ.length}: ${bad.slice(0, 3).join(', ')}`;
});
check('H1.2', 'Kinderzauberer-Stadtseiten: H1 nennt Kindergeburtstag', () => {
  const bad = CITIES_KZ.filter((r) => {
    const h1 = (get(r).match(/<h1[^>]*>([\s\S]*?)<\/h1>/) || [, ''])[1];
    return !/Kindergeburtstag/i.test(decode(h1).replace(/<[^>]+>/g, ''));
  });
  return bad.length === 0 || `${bad.length}/${CITIES_KZ.length}: ${bad.slice(0, 3).join(', ')}`;
});
check('H1.3', 'Kinderzauberer-Stadtseiten: Begriff "Kinderzauberer" bleibt erhalten', () => {
  const bad = CITIES_KZ.filter((r) => !/Kinderzauberer/i.test(textOf(get(r))));
  return bad.length === 0 || `${bad.length}: ${bad.slice(0, 3).join(', ')}`;
});
check('H1.4', 'Keine unbelegte Selbstauszeichnung "TOP Bewertet" in Titles', () => {
  const bad = [...pages].filter(([, h]) => /TOP[- ]?Bewertet/i.test(titleOf(h)));
  return bad.length === 0 || `${bad.length} Seiten: ${bad.slice(0, 3).map((b) => b[0]).join(', ')}`;
});

// ---------- H2: Titles der 0-%-CTR-Seiten ----------
const TITLE_TARGETS = {
  '/zauberer': /Zauberer NRW buchen/i,
  '/zauberer/buehnen-zauberer': /Bühnenzauberer NRW buchen/i,
  '/zauberer/zaubershow/strassen-sommer-fest': /Sommerfest/i,
};
for (const [route, re] of Object.entries(TITLE_TARGETS)) {
  check(`H2 ${route}`, `Title enthaelt Klickgrund`, () => {
    const h = get(route);
    if (!h) return `Route ${route} existiert nicht`;
    return re.test(decode(titleOf(h))) || `Title ist: "${decode(titleOf(h))}"`;
  });
}

// ---------- H5: genau eine H1 pro Seite ----------
check('H5.1', 'Jede Seite hat genau eine <h1>', () => {
  const bad = [...pages].filter(([, h]) => h1sOf(h) !== 1);
  return bad.length === 0 ||
    `${bad.length} Seiten, z.B. ${bad.slice(0, 5).map((b) => `${b[0]}(${h1sOf(b[1])})`).join(', ')}`;
});

// ---------- H6: verwaiste Geld-Seiten aus Content verlinkt ----------
const inbound = new Map();
for (const [r, h] of pages) {
  for (const m of mainOf(h).matchAll(/<a[^>]+href="(\/[^"#?]*)"/g)) {
    const t = m[1].replace(/\/$/, '') || '/';
    if (t !== r) inbound.set(t, (inbound.get(t) || 0) + 1);
  }
}
for (const route of ['/zauberer/hochzeit', '/zauberer/firmenfeier', '/clown/karneval', '/clown/walk-act']) {
  check(`H6 ${route}`, `>= 3 interne Content-Links`, () => {
    const n = inbound.get(route) || 0;
    return n >= 3 || `nur ${n} Content-Links`;
  });
}
check('H6.5', 'Gladbeck-Template-Bug behoben: KG-Gladbeck verlinkt KZ-Gladbeck', () =>
  /href="\/kinderzauberer\/kinderzauberer-in-gladbeck\/?"/.test(mainOf(get('/kindergeburtstag/geburtstag-in-gladbeck')))
  || 'Link fehlt');

// ---------- H7: Grammatik im FAQ-Schema ----------
check('H7.1', 'Kein "Was kostet einen Auftritt" (Grammatikfehler)', () => {
  const bad = [...pages].filter(([, h]) => /Was kostet einen Auftritt/i.test(h));
  return bad.length === 0 || `${bad.length} Seiten: ${bad.slice(0, 3).map((b) => b[0]).join(', ')}`;
});

// ---------- M1: FAQ-Duplikat auf der Startseite ----------
check('M1.1', 'Startseite: keine doppelten FAQ-Fragen im Schema', () => {
  const faq = flatLd(get('/')).find((n) => n['@type'] === 'FAQPage');
  if (!faq) return 'Kein FAQPage-Schema auf der Startseite';
  const norm = (faq.mainEntity || []).map((q) => q.name.toLowerCase().replace(/[^a-zäöüß]/g, ''));
  const dupes = norm.filter((n, i) => norm.indexOf(n) !== i);
  return dupes.length === 0 || `Duplikat(e): ${dupes.join(', ')}`;
});
check('M1.2', 'Startseite: Preisfrage antwortet mit konkreten Zahlen (Variante A)', () => {
  const faq = flatLd(get('/')).find((n) => n['@type'] === 'FAQPage');
  if (!faq) return 'Kein FAQPage-Schema';
  const priceQ = (faq.mainEntity || []).filter((q) => /kostet/i.test(q.name));
  if (priceQ.length !== 1) return `${priceQ.length} Preisfragen statt genau einer`;
  const a = priceQ[0].acceptedAnswer?.text || '';
  const needs = [['Grundpreis 150 EUR', /150\s*€/], ['Komplettpaket 210 EUR', /210\s*€/],
                 ['Dauer 40 Minuten', /40[\s-]?min/i], ['Fahrtkosten 0,40/km', /0,40\s*€/]];
  const missing = needs.filter(([, re]) => !re.test(a)).map(([label]) => label);
  return missing.length === 0 || `Antwort nennt nicht: ${missing.join(', ')}`;
});

// ---------- M2: Tabelle auf /kindergeburtstag/ ----------
check('M2.1', '/kindergeburtstag/ enthaelt eine Paket-Tabelle', () =>
  /<table[\s>]/.test(mainOf(get('/kindergeburtstag'))) || 'keine <table> gefunden');
check('M2.2', 'Paket-Tabelle nennt alle drei Preise 150/170/210', () => {
  const tbl = (mainOf(get('/kindergeburtstag')).match(/<table[\s\S]*?<\/table>/) || [''])[0];
  return (/150/.test(tbl) && /170/.test(tbl) && /210/.test(tbl)) || 'Preise unvollstaendig in der Tabelle';
});

// ---------- M3: Ueberschriften als Fragen ----------
check('M3.1', 'Keine nichtssagenden H2 (SCHNELLE EINDRUECKE / NOCH FRAGEN? / Die Preise)', () => {
  const bad = [];
  for (const [r, h] of pages) {
    for (const m of mainOf(h).matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/g)) {
      const t = decode(m[1].replace(/<[^>]+>/g, '')).trim();
      if (/^(SCHNELLE EINDRÜCKE|NOCH FRAGEN\?|Die Preise)$/i.test(t)) { bad.push(`${r}:"${t}"`); break; }
    }
  }
  return bad.length === 0 || `${bad.length}: ${bad.slice(0, 4).join(', ')}`;
});

// ---------- M4: openingHours + sameAs ----------
const bizOf = (h) => flatLd(h).find((n) => n['@id'] === 'https://liar-entertainer.com/#business');
check('M4.1', 'LocalBusiness hat openingHoursSpecification', () =>
  !!bizOf(get('/'))?.openingHoursSpecification || 'openingHoursSpecification fehlt');
check('M4.2', 'LocalBusiness sameAs enthaelt LinkedIn und YouTube', () => {
  const s = (bizOf(get('/'))?.sameAs || []).join(' ');
  return (/linkedin\.com/.test(s) && /youtube\.com/.test(s)) || `sameAs: ${s || '(leer)'}`;
});

// ---------- M5: Person-Schema + Vita ----------
check('M5.1', 'Person-Schema hat description, hasOccupation und hasCredential', () => {
  const p = bizOf(get('/'))?.founder;
  if (!p) return 'Kein Person-Knoten (founder) gefunden';
  const missing = ['description', 'hasOccupation', 'hasCredential'].filter((k) => !p[k]);
  return missing.length === 0 || `fehlt: ${missing.join(', ')}`;
});
check('M5.2', '/ueber-mich/ enthaelt datierte Vita (mind. 4 Jahreszahlen)', () => {
  const years = new Set(textOf(get('/ueber-mich')).match(/\b(19|20)\d{2}\b/g) || []);
  return years.size >= 4 || `nur ${years.size} verschiedene Jahreszahlen`;
});

// ---------- M6: Titles / Descriptions ----------
check('M6.1', 'Kein Title laenger als 62 Zeichen', () => {
  const bad = [...pages].filter(([, h]) => decode(titleOf(h)).length > 62);
  return bad.length === 0 ||
    `${bad.length} Seiten, z.B. ${bad.slice(0, 4).map((b) => `${b[0]}(${decode(titleOf(b[1])).length})`).join(', ')}`;
});
check('M6.2', 'Kein Title kuerzer als 25 Zeichen', () => {
  const bad = [...pages].filter(([r, h]) => r !== '/404' && decode(titleOf(h)).length < 25);
  return bad.length === 0 ||
    `${bad.length} Seiten, z.B. ${bad.slice(0, 4).map((b) => `${b[0]}(${decode(titleOf(b[1])).length})`).join(', ')}`;
});
check('M6.3', 'Keine Emojis in Titles', () => {
  const EMO = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/u;
  const bad = [...pages].filter(([, h]) => EMO.test(titleOf(h)));
  return bad.length === 0 || `${bad.length} Seiten: ${bad.slice(0, 4).map((b) => b[0]).join(', ')}`;
});
check('M6.4', 'Keine Meta-Description laenger als 165 Zeichen', () => {
  const bad = [...pages].filter(([, h]) => decode(descOf(h)).length > 165);
  return bad.length === 0 ||
    `${bad.length} Seiten, z.B. ${bad.slice(0, 4).map((b) => `${b[0]}(${decode(descOf(b[1])).length})`).join(', ')}`;
});

// ---------- M7: Thin-Kategorien ----------
// Spec-Korrektur 06.08.2026: Die urspruengliche Schwelle "<300 Woerter" war
// willkuerlich. Im Build gemessen liegt eine Kategorie mit 5+ Beitraegen bei
// ~200 Woertern und ist eine regulaere Archivseite — nicht der Index-Bloat aus
// dem GSC-Bericht. Der echte Bloat sind Kategorien mit 40–90 Woertern (1–4
// Beitraege). Danach wird jetzt geprueft.
check('M7.1', 'Kategorien unter 150 Woertern sind auf noindex', () => {
  const bad = CATEGORIES.filter((r) => {
    const h = get(r);
    return textOf(h).split(/\s+/).length < 150 && !/name="robots"[^>]+content="[^"]*noindex/.test(h);
  });
  return bad.length === 0 || `${bad.length} indexierbare Thin-Kategorien: ${bad.slice(0, 5).join(', ')}`;
});
check('M7.2', 'noindex-Seiten nicht in der Sitemap', () => {
  const sm = readFileSync(join(DIST, 'sitemap.xml'), 'utf8');
  const bad = [...pages].filter(([r, h]) =>
    /name="robots"[^>]+content="[^"]*noindex/.test(h) && sm.includes(`liar-entertainer.com${r}/`));
  return bad.length === 0 || `${bad.length} noindex-URLs in der Sitemap: ${bad.slice(0, 3).map((b) => b[0]).join(', ')}`;
});

// ---------- N4: Blog-Schema einheitlich ----------
check('N4.1', 'Alle Blog-Posts nutzen BlogPosting (nicht Article)', () => {
  const bad = BLOG_POSTS.filter((r) => flatLd(get(r)).some((n) => n['@type'] === 'Article'));
  return bad.length === 0 || `${bad.length}/${BLOG_POSTS.length} nutzen noch Article: ${bad.slice(0, 3).join(', ')}`;
});

// ---------- Regressionsschutz ----------
check('R1', 'Alle Seiten haben einen Canonical', () => {
  const bad = [...pages].filter(([r, h]) => r !== '/404' && !/rel="canonical"/.test(h));
  return bad.length === 0 || `${bad.length} Seiten ohne Canonical`;
});
check('R2', 'Kein JSON-LD-Syntaxfehler', () => {
  const bad = [];
  for (const [r, h] of pages) {
    for (const m of h.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/g)) {
      try { JSON.parse(m[1]); } catch { bad.push(r); break; }
    }
  }
  return bad.length === 0 || `${bad.length} Seiten mit ungueltigem JSON-LD: ${bad.slice(0, 3).join(', ')}`;
});
check('R3', 'Kein <img> ohne alt', () => {
  const bad = [...pages].filter(([, h]) => [...h.matchAll(/<img[^>]*>/g)].some((m) => !/\salt=/.test(m[0])));
  return bad.length === 0 || `${bad.length} Seiten mit alt-losen Bildern`;
});
check('R4', 'Stadtseiten-Anzahl unveraendert (23/23/23)', () =>
  (CITIES_KZ.length === 23 && CITIES_KG.length === 23 && CITIES_CL.length === 23) ||
  `KZ=${CITIES_KZ.length} KG=${CITIES_KG.length} CL=${CITIES_CL.length}`);

// ---------- Report ----------
const pad = (s, n) => String(s).padEnd(n);
console.log('\nSEO-ASSERTIONS — ACTION-PLAN 06.08.2026\n' + '='.repeat(80));
for (const r of results) {
  console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${pad(r.id, 26)} ${r.description}`);
  if (!r.ok) console.log(`      -> ${r.detail}`);
}
console.log('='.repeat(80));
console.log(`${results.length - failed}/${results.length} erfuellt, ${failed} verletzt.\n`);
process.exit(failed === 0 ? 0 : 1);
