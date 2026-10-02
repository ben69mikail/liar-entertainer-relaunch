// Redesign-Tests für die Startseite (claude-code-prompt-liar-redesign.md)
// Ausführen: node scripts/redesign-tests.mjs
// Prüft: WCAG-AA-Kontrast aller Text/Hintergrund-Kombinationen der Startseite.

import { contrastRatio } from './lib/contrast.mjs';

let failed = 0;
let passed = 0;

function check(name, condition, detail = '') {
  if (condition) {
    passed++;
    console.log(`  PASS  ${name}`);
  } else {
    failed++;
    console.log(`  FAIL  ${name}${detail ? ' — ' + detail : ''}`);
  }
}

// ──────────────────────────────────────────────
// 1. KONTRAST (WCAG AA: 4.5:1 normal, 3:1 groß/fett)
// ──────────────────────────────────────────────
console.log('\n[1] Kontrast-Prüfung LIAR-Palette');

// [Textfarbe, Hintergrund, Mindest-Ratio, Beschreibung]
const combos = [
  // Fließtext auf Weiß/Pastell
  ['#1f2025', '#ffffff', 4.5, 'Dunkler Text auf Weiß'],
  ['#374151', '#ffffff', 4.5, 'Body-Text auf Weiß'],
  ['#1f2025', '#fdf2f2', 4.5, 'Dunkler Text auf Soft-Rosa'],
  ['#374151', '#fdf2f2', 4.5, 'Body-Text auf Soft-Rosa'],
  ['#1f2025', '#eff4ff', 4.5, 'Dunkler Text auf Soft-Blau'],
  ['#374151', '#eff4ff', 4.5, 'Body-Text auf Soft-Blau'],
  // Akzente als Text
  ['#d7393e', '#ffffff', 4.5, 'Rot-Akzent (Links) auf Weiß'],
  ['#3b55d5', '#ffffff', 4.5, 'Blau-Akzent (Links) auf Weiß'],
  ['#3b55d5', '#eff4ff', 4.5, 'Blau-Link auf Soft-Blau'],
  // Große/fette Labels (3:1 reicht)
  ['#d7393e', '#fdf2f2', 3.0, 'Rotes Eyebrow-Label (fett) auf Soft-Rosa'],
  ['#d7393e', '#eff4ff', 3.0, 'Rotes Eyebrow-Label (fett) auf Soft-Blau'],
  // Buttons (Text groß/fett → 3:1; Ziel trotzdem hoch)
  ['#ffffff', '#d7393e', 3.0, 'Weißer Button-Text auf Rot'],
  ['#1f2025', '#f5a623', 4.5, 'Dunkler Button-Text auf Gold'],
  // FAQ-Karten auf Pastell
  ['#1f2025', '#f9fafb', 4.5, 'FAQ-Summary auf Grau-Hell'],
];

for (const [fg, bg, min, name] of combos) {
  const ratio = contrastRatio(fg, bg);
  check(`${name} (${fg} auf ${bg}) = ${ratio.toFixed(2)}:1 ≥ ${min}:1`, ratio >= min);
}

// ──────────────────────────────────────────────
// 2. HERO: gerundete Bild-Karte im Container + Pill-Badges
// ──────────────────────────────────────────────
import { readFileSync } from 'node:fs';
const indexSrc = readFileSync(new URL('../src/pages/index.astro', import.meta.url), 'utf8');

console.log('\n[2] Hero als gerundete Karte (kein Full-Bleed)');
const heroSection = indexSrc.match(/<!--[^>]*HERO[\s\S]*?<\/section>/i)?.[0] ?? '';
check('Hero-Sektion gefunden', heroSection.length > 0);
check('Hero-Bild nicht mehr 100vw (kein sizes="100vw")', !heroSection.includes('sizes="100vw"'));
check('Hero-Inhalt sitzt im zentrierten Container (max-w-* mx-auto)', /max-w-\w+ mx-auto/.test(heroSection));
check('Hero-Bild ist gerundete Karte (rounded-2xl/3xl)', /rounded-(2|3)xl/.test(heroSection));
check('Pill-Badge: Google-Rezensionen', heroSection.includes('Google-Rezensionen'));
check('Pill-Badge: Jahre Erfahrung', heroSection.includes('Jahre Erfahrung'));
check('Pill-Badge: Interaktive Zaubershow', heroSection.includes('Interaktive Zaubershow'));

// ──────────────────────────────────────────────
// 3. INTRO: H1 mit Akzent-Wort + CTA-Button
// ──────────────────────────────────────────────
console.log('\n[3] Intro: H1-Akzent + CTA');
const introSection = indexSrc.match(/<!--[^>]*INTRO[\s\S]*?<\/section>/i)?.[0] ?? '';
check('Intro-Sektion gefunden', introSection.length > 0);
check('H1 enthält Akzent-Wort in Rot', /<h1[\s\S]*?<span class="text-\[#d7393e\]">[\s\S]*?<\/h1>/.test(introSection));
check('CTA-Button vorhanden (Link zu /kontakt/)', /href="\/kontakt\/"/.test(introSection));
check('CTA-Button rot mit Hover (bg-[#d7393e] + hover:bg-[#b62e32])', /bg-\[#d7393e\] hover:bg-\[#b62e32\]/.test(introSection));
check('H1-Text unverändert (Clown Zauberer in NRW)', /Clown Zauberer[\s\S]*in NRW/.test(introSection) && introSection.includes('Kindergeburtstag'));

// ──────────────────────────────────────────────
// 4. LEISTUNGEN: gleich hohe weiße Karten im Grid
// ──────────────────────────────────────────────
console.log('\n[4] Leistungen als Card-Grid');
const angebotSection = indexSrc.match(/<!--[^>]*DAS BIETET[\s\S]*?<\/section>/i)?.[0] ?? '';
check('Angebot-Sektion gefunden', angebotSection.length > 0);
const cardCount = (angebotSection.match(/bg-white rounded-2xl/g) ?? []).length;
check(`3 weiße Karten (gefunden: ${cardCount})`, cardCount === 3);
check('Karten gleich hoch (flex flex-col + h-full)', /flex flex-col h-full/.test(angebotSection));
const mehrCount = (angebotSection.match(/Mehr erfahren/g) ?? []).length;
check(`3× "Mehr erfahren →" (gefunden: ${mehrCount})`, mehrCount === 3);
check('Meta-Zeile Dauer vorhanden', angebotSection.includes('Dauer:'));

// ──────────────────────────────────────────────
// 5. EYEBROW-LABELS über Sektionsüberschriften
// ──────────────────────────────────────────────
console.log('\n[5] Eyebrow-Labels');
const eyebrowRe = (label) =>
  new RegExp(`class="[^"]*text-\\[#d7393e\\][^"]*uppercase[^"]*tracking-widest[^"]*"[^>]*>\\s*${label}`, 'i');
check('Eyebrow PROGRAMME (Das bietet…)', eyebrowRe('Programme').test(indexSrc));
check('Eyebrow ÜBER MICH (Lernen Sie kennen)', eyebrowRe('Über mich').test(indexSrc));
check('Eyebrow GALERIE (Schnelle Eindrücke)', eyebrowRe('Galerie').test(indexSrc));
check('Eyebrow FAQ', eyebrowRe('FAQ').test(indexSrc));
check('Eyebrow EINSATZGEBIET (bestehend)', eyebrowRe('Einsatzgebiet').test(indexSrc));

const reviewsSrc = readFileSync(new URL('../src/components/GoogleReviews.astro', import.meta.url), 'utf8');
check('Eyebrow BEWERTUNGEN in GoogleReviews', eyebrowRe('Bewertungen').test(reviewsSrc));

// ──────────────────────────────────────────────
// 6. RHYTHMUS + CONTAINER
// ──────────────────────────────────────────────
console.log('\n[6] Sektions-Rhythmus + Container');
const sections = indexSrc.match(/<section class="[^"]*"/g) ?? [];
const tooTight = sections.filter((s) => /\bp[yb]-(4|6|8|10|12)\b/.test(s));
check(`Keine Sektion mit py/pb < 14 (gefunden: ${tooTight.length})`, tooTight.length === 0, tooTight.join(' | '));
const generous = (indexSrc.match(/md:py-20/g) ?? []).length;
check(`Mind. 3 Sektionen mit großzügigem Rhythmus md:py-20 (gefunden: ${generous})`, generous >= 3);
check('Kein sizes="100vw" mehr auf der Startseite', !indexSrc.includes('sizes="100vw"'));
const sectionBlocks = indexSrc.split('<section ').slice(1);
const noContainer = sectionBlocks.filter((b) => !/max-w-\w+ mx-auto/.test(b.split('</section>')[0]));
check(`Jede Sektion hat zentrierten Container (ohne: ${noContainer.length})`, noContainer.length === 0);
check('Galerie-Teaser hat Pastell-Hintergrund', /SCHNELLE EINDRÜCKE[\s\S]{0,400}/.test(indexSrc) && /bg-\[#eff4ff\][^"]*"[^]*?SCHNELLE EINDRÜCKE/.test(indexSrc));

// ──────────────────────────────────────────────
// 7. SITEWIDE: keine Waves, keine Vollfarb-Sektionen, Hero-Karten, Header
// ──────────────────────────────────────────────
console.log('\n[7] Sitewide Pastell + Header');
import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

function walkAstro(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walkAstro(p, out);
    else if (name.endsWith('.astro')) out.push(p);
  }
  return out;
}
const pagesDir = new URL('../src/pages', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const pageFiles = walkAstro(pagesDir);
check(`Seiten gefunden (${pageFiles.length})`, pageFiles.length > 80);

let withWaves = [], withFullColor = [], with100vw = [];
for (const f of pageFiles) {
  const src = readFileSync(f, 'utf8');
  if (src.includes('Q720,60')) withWaves.push(f);
  if (/<section class="[^"]*bg-\[#(3b55d5|d7393e)\]/.test(src)) withFullColor.push(f);
  if (src.includes('sizes="100vw"')) with100vw.push(f);
}
check(`Keine Wave-SVGs mehr in Seiten (noch: ${withWaves.length})`, withWaves.length === 0);
check(`Keine Vollfarb-Sektionen mehr (noch: ${withFullColor.length})`, withFullColor.length === 0);
check(`Kein sizes="100vw" mehr (noch: ${with100vw.length})`, with100vw.length === 0);

const headerSrc = readFileSync(new URL('../src/components/Header.astro', import.meta.url), 'utf8');
check('Sticky-Nav bekommt z-50 (Inhalte nicht mehr über Menü)', /classList\.add\('fixed'[^)]*'z-50'/.test(headerSrc));
check('Desktop-Nav ab 900px sichtbar', headerSrc.includes('min-[900px]:flex'));
check('Hamburger ab 900px versteckt', headerSrc.includes('min-[900px]:hidden'));

// ──────────────────────────────────────────────
// 8. HEADER-HARDENING: CSS-Regeln unabhängig von JS/Tailwind
// ──────────────────────────────────────────────
console.log('\n[8] Header-Hardening (global.css)');
const globalCss = readFileSync(new URL('../src/styles/global.css', import.meta.url), 'utf8');
check('#site-header hat position:relative + z-index', /#site-header\s*\{\s*position:\s*relative;\s*z-index:\s*\d+/.test(globalCss));
check('#nav-burger-row ab 900px hart versteckt (!important)', /#nav-burger-row\s*\{\s*display:\s*none\s*!important/.test(globalCss));
check('#nav-desktop-row ab 900px hart sichtbar', /#nav-desktop-row\s*\{\s*display:\s*flex\s*!important/.test(globalCss));
check('Header.astro: nav-burger-row ID gesetzt', headerSrc.includes('id="nav-burger-row"') || readFileSync(new URL('../src/components/Header.astro', import.meta.url), 'utf8').includes('id="nav-burger-row"'));

// ──────────────────────────────────────────────
console.log(`\nErgebnis: ${passed} bestanden, ${failed} fehlgeschlagen`);
process.exit(failed > 0 ? 1 : 0);
