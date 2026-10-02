#!/usr/bin/env node
/**
 * Einmalige Transformation: mechanische Anteile des ACTION-PLAN 06.08.2026.
 * Idempotent — mehrfaches Ausfuehren aendert nichts zusaetzlich.
 *
 * Aufruf: node scripts/apply-seo-actionplan.mjs
 *
 * Deckt ab: K2 (Bewertungszahl), K6 (Faktenkanon), H1.4 (TOP Bewertet),
 * H7 (Grammatik), M3 (H2 als Fragen), M6.3 (Emojis in Titles).
 * Strukturelle Aenderungen (Schema, Tabelle, FAQ, Verlinkung, Stadtseiten-Keyword)
 * erfolgen als separate, gezielte Edits.
 */
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const changed = new Map();
function edit(file, fn) {
  const before = readFileSync(file, 'utf8');
  const after = fn(before);
  if (after !== before) {
    writeFileSync(file, after, 'utf8');
    changed.set(file, (changed.get(file) || 0) + 1);
  }
}
function walk(dir, re) {
  if (!existsSync(dir)) return [];
  const out = [];
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) out.push(...walk(p, re));
    else if (re.test(n)) out.push(p);
  }
  return out;
}
const ASTRO = walk('src', /\.(astro|ts)$/);
const MD = walk('src/content', /\.(md|mdx)$/);

// ---------------------------------------------------------------- K2
// Verbindliche Bewertungszahl: 378 (Quelle: /api/reviews.php -> total_reviews)
const REVIEWS = '378';
for (const f of ASTRO) {
  edit(f, (s) => s
    .replace(/400\+\s*Top-Bewertungen/g, `${REVIEWS} Top-Bewertungen`)
    .replace(/400\+\s*Bewertungen/g, `${REVIEWS} Bewertungen`)
    .replace(/400\+\s*Google-Bewertungen/g, `${REVIEWS} Google-Bewertungen`)
    .replace(/400\+\s*begeisterte Kunden/g, `${REVIEWS} begeisterte Kunden`)
    .replace(/über 400<\/strong>\s*Bewertungen/g, `${REVIEWS}</strong> Bewertungen`)
    .replace(/googleReviewsCount:\s*'400\+'/g, `googleReviewsCount: '${REVIEWS}'`)
    .replace(/googleReviewsCount:\s*"400\+"/g, `googleReviewsCount: "${REVIEWS}"`));
}

// ---------------------------------------------------------------- K6 Faktenkanon
// Verbindlich: Show 40 Min (Kita-Kurzfassung 25-30 Min), Alter 4-12 (Kita ab 3),
// Buchungsvorlauf 4-8 Wochen.
for (const f of ASTRO) {
  edit(f, (s) => s
    .replace(/2-4\s*Wochen im Voraus/g, '4-8 Wochen im Voraus')
    .replace(/2\s*bis\s*4\s*Wochen im Voraus/g, '4 bis 8 Wochen im Voraus')
    .replace(/mindestens 2-4 Wochen/g, 'mindestens 4-8 Wochen')
    .replace(/Kinder von 3 bis 12 Jahren/g, 'Kinder von 4 bis 12 Jahren')
    .replace(/Kinder von 3-12 Jahren/g, 'Kinder von 4-12 Jahren')
    .replace(/für Kinder von 3-12 Jahren/g, 'für Kinder von 4-12 Jahren')
    .replace(/auf Kinder von 3-12 Jahren/g, 'auf Kinder von 4-12 Jahren'));
}

// ---------------------------------------------------------------- H1.4 "TOP Bewertet"
// Unbelegte Selbstauszeichnung raus - der Platz wird fuer das Keyword gebraucht.
for (const f of ASTRO) {
  edit(f, (s) => s
    .replace(/\s*\|\s*TOP[- ]?Bewertet\s*\|/gi, ' |')
    .replace(/\s*\|\s*TOP[- ]?Bewertet/gi, '')
    .replace(/TOP[- ]?Bewertet\s*\|\s*/gi, ''));
}

// ---------------------------------------------------------------- H7 Grammatik
for (const f of ASTRO) {
  edit(f, (s) => s.replace(/Was kostet einen Auftritt/g, 'Was kostet ein Auftritt'));
}

// ---------------------------------------------------------------- M3 Ueberschriften als Fragen
const H2_MAP = [
  [/>\s*SCHNELLE EINDRÜCKE\s*</g, '>Wie sieht eine Show von Clown Zauberer LIAR aus?<'],
  [/>\s*NOCH FRAGEN\?\s*</g, '>Häufige Fragen zum Kindergeburtstag mit Zauberer<'],
  [/>\s*Die Preise\s*</g, '>Was kostet ein Zauberer für den Kindergeburtstag?<'],
  [/>\s*REGIONAL UND DEUTSCHLANDWEIT\s*</g, '>In welchen Städten ist Clown Zauberer LIAR buchbar?<'],
  [/>\s*Regional und deutschlandweit\s*</g, '>In welchen Städten ist Clown Zauberer LIAR buchbar?<'],
  [/>\s*WISSENWERTES über den ZAuberer für KINDER\s*</g, '>Was sollten Eltern über den Kinderzauberer wissen?<'],
];
for (const f of ASTRO) {
  edit(f, (s) => H2_MAP.reduce((acc, [re, to]) => acc.replace(re, to), s));
}

// ---------------------------------------------------------------- M6.3 Emojis in Titles
// Google filtert Emojis zuverlaessig aus dem SERP - sie kosten nur Zeichen.
const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{2B00}-\u{2BFF}]/gu;
for (const f of MD) {
  edit(f, (s) => s.replace(/^title:\s*(.*)$/m, (m, t) => {
    const cleaned = t.replace(EMOJI, '').replace(/\s{2,}/g, ' ').replace(/\s+(["'])\s*$/, '$1').trim();
    return `title: ${cleaned}`;
  }));
}

// ---------------------------------------------------------------- Report
const files = [...changed.keys()].sort();
console.log(`\napply-seo-actionplan: ${files.length} Datei(en) geaendert\n` + '-'.repeat(60));
for (const f of files) console.log('  ' + f);
console.log('');
