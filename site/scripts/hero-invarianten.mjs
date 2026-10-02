/**
 * Struktur-Invarianten der Startseite: was erhalten bleiben MUSS.
 *
 * Hintergrund: seo-assertions.mjs deckt SEO-Inhalte ab, aber nicht die
 * Struktur der Startseite. Beim Zusammenfuehren des Startseiten-Redesigns
 * (Branch startseite-conferism-lokal, abgezweigt am 19.07.2026) waeren acht
 * von zehn dieser Zusicherungen stillschweigend gebrochen worden, ohne dass
 * eine bestehende Regel angeschlagen haette.
 *
 * Abgesichert werden die strukturellen Entscheidungen dieser Commits:
 *   2e4d677 (23.07.) Mobile Hero: H1 ueber der Galerie statt im Bild,
 *                    CTA-Buttons mobil entfernt
 *   b619991 (06.08.) SEO-Audit, u.a. Header-Tagline ohne "Top-bewertet"
 *   4ae152b (11.08.) WhatsApp-Button global aus BaseLayout
 *   840546d (11.08.) areaServed als GeoCircle 20 km
 *
 * Aufruf: npm run test:struktur   (setzt `npm run build` voraus)
 * Exit 0 = alle Invarianten erfuellt. Exit 1 = mindestens eine verletzt.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

// fileURLToPath statt .pathname: Unter Windows liefert .pathname "/C:/Users/..."
// mit fuehrendem Slash. Beim Zusammenbauen wird daraus "C:\C:\Users\..." und
// readdirSync bricht mit ENOENT ab. Unter Linux faellt das nicht auf.
const DIST = fileURLToPath(new URL('../dist/', import.meta.url)).replace(/[\\/]+$/, '');

const walk = (dir, out = []) => {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (p.endsWith('.html')) out.push(p);
  }
  return out;
};

const pages = walk(DIST);
const home = readFileSync(join(DIST, 'index.html'), 'utf8');

const results = [];
const check = (id, beschreibung, bedingung, detail = '') => {
  results.push({ id, beschreibung, ok: Boolean(bedingung), detail });
};

// ---------------------------------------------------------------------------
// Mobile Hero (Commit 2e4d677 vom 23.07.2026)
// ---------------------------------------------------------------------------

// Eigene, mobil sichtbare H1 ausserhalb des Hero-Bildes.
const mobileH1 = /<h1[^>]*class="[^"]*\bsm:hidden\b[^"]*"/i.test(home);
check(
  'HERO.1',
  'Startseite: eigene mobile H1 ausserhalb des Hero-Bildes (sm:hidden)',
  mobileH1,
  mobileH1 ? '' : 'Kein <h1 class="... sm:hidden ..."> gefunden - die mobile Ueberschrift vom 23.07. fehlt.'
);

// Im Hero-Overlay darf KEINE h1 stehen, sonst hat die Seite zwei.
const overlayBlock = (home.match(/class="[^"]*hero-overlay[^"]*"[\s\S]{0,3000}/i) || [''])[0];
const overlayHasH1 = /<h1[\s>]/i.test(overlayBlock.slice(0, 1500));
check(
  'HERO.2',
  'Hero-Overlay enthaelt keine h1 (verhindert doppelte H1)',
  overlayBlock !== '' && !overlayHasH1,
  overlayBlock === ''
    ? 'Kein .hero-overlay gefunden - die Struktur wurde ersetzt.'
    : overlayHasH1
      ? 'Im .hero-overlay steht eine <h1>. Zusammen mit der mobilen H1 sind das zwei.'
      : ''
);

// Die Headline im Bild ist als hero-headline ausgezeichnet (semantisch p, nicht h1).
check(
  'HERO.3',
  'Headline im Hero-Bild traegt die Klasse hero-headline',
  /class="[^"]*\bhero-headline\b/i.test(home),
  ''
);

// Hero-Overlay auf schmalen Viewports ausgeblendet.
// Astro haengt beim Bauen ein Scoping-Attribut an jeden Selektor:
//   @media(max-width:639.98px){.hero-overlay[data-astro-cid-xxxxxx]{display:none}}
// Der optionale Attribut-Teil muss im Muster also erlaubt sein.
const overlayHiddenMobile =
  /@media\s*\(max-width:\s*639\.98px\)[\s\S]{0,600}?\.hero-overlay(\[[^\]]*\])?\s*\{[^}]*display\s*:\s*none/i.test(home);
check(
  'HERO.4',
  'Hero-Overlay ist unter 640px ausgeblendet',
  overlayHiddenMobile,
  overlayHiddenMobile ? '' : 'Die Media-Query, die das Overlay mobil abschaltet, fehlt.'
);

// CTA-Buttons im Hero erst ab sm.
check(
  'HERO.5',
  'CTA-Buttons im Hero erst ab 640px sichtbar (hidden sm:flex)',
  /class="[^"]*\bhidden\s+sm:flex\b/i.test(home),
  ''
);

// Genau eine h1 - der eigentliche Zweck der Trennung.
const h1Count = (home.match(/<h1[\s>]/gi) || []).length;
check(
  'HERO.6',
  'Startseite hat genau eine h1',
  h1Count === 1,
  h1Count === 1 ? '' : `Gefunden: ${h1Count}`
);

// ---------------------------------------------------------------------------
// WhatsApp-Button (Commit 4ae152b vom 11.08.2026)
// ---------------------------------------------------------------------------

const ohneWhatsApp = pages.filter((f) => !/wa\.me\//.test(readFileSync(f, 'utf8')));
check(
  'WA.1',
  'WhatsApp-Link auf allen Seiten vorhanden',
  ohneWhatsApp.length === 0,
  ohneWhatsApp.length
    ? `Fehlt auf ${ohneWhatsApp.length} Seiten: ${ohneWhatsApp.slice(0, 5).map((f) => relative(DIST, f)).join(', ')}`
    : ''
);

check(
  'WA.2',
  'WhatsApp-Button ist als eigenes Element vorhanden',
  /wa-fab|whatsapp/i.test(home),
  ''
);

// ---------------------------------------------------------------------------
// Schema und Header (Commits 840546d und b619991)
// ---------------------------------------------------------------------------

check(
  'GEO.1',
  'LocalBusiness-Schema enthaelt GeoCircle mit 20 km Radius',
  /"@type"\s*:\s*"GeoCircle"/.test(home) && /"geoRadius"\s*:\s*"20000"/.test(home),
  ''
);

const mitTopBewertet = pages.filter((f) => /Top-bewertet/i.test(readFileSync(f, 'utf8')));
check(
  'HDR.1',
  'Header-Tagline ohne unbelegte Selbstauszeichnung "Top-bewertet"',
  mitTopBewertet.length === 0,
  mitTopBewertet.length ? `Auf ${mitTopBewertet.length} Seiten gefunden` : ''
);

// ---------------------------------------------------------------------------
// Ausgabe
// ---------------------------------------------------------------------------

let verletzt = 0;
for (const r of results) {
  if (!r.ok) verletzt++;
  console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.id.padEnd(8)} ${r.beschreibung}`);
  if (!r.ok && r.detail) console.log(`         -> ${r.detail}`);
}
console.log('='.repeat(80));
console.log(`${results.length - verletzt}/${results.length} Invarianten erfuellt, ${verletzt} verletzt.`);
process.exit(verletzt === 0 ? 0 : 1);
