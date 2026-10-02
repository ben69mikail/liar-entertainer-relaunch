#!/usr/bin/env node
/**
 * Umsetzung SEO-Massnahmen 11.08.2026 fuer die 23 Kindergeburtstag-Stadtseiten
 * (src/pages/kindergeburtstag/geburtstag-in-*).
 *
 * Idempotent — mehrfaches Ausfuehren aendert nichts zusaetzlich.
 * Aufruf: node scripts/apply-2026-08-11-kg.mjs
 *
 * Deckt ab:
 *   K4  doppelte H2 "Haeufige Fragen zum Kindergeburtstag mit Zauberer" -> stadtspezifisch
 *   M2  H1 transaktional schaerfen (Keyword "Kindergeburtstag"), individuelle H1 bleiben individuell
 *   M1  Fernstaedte (>20 km Luftlinie ab Gladbeck) entlinken + unverlinkter Sammelsatz
 *   H2  nackte Stadt-Ankertexte -> keywordtragende Anker (variierend, nur in Link-Listen)
 *   H4  <img src={asset.src}> -> <Image src={asset} width/height> (WebP statt Original-JPG)
 *   H6  Inhaltsbilder in <figure> + ortsbezogene <figcaption> (nicht Hero/Logo/Slider)
 */
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import sharp from 'sharp';

const ROOT = resolve(new URL('..', import.meta.url).pathname);
const BASE = join(ROOT, 'src/pages/kindergeburtstag');

// ---------------------------------------------------------------- Stammdaten
const CITY = {
  'bochum': 'Bochum',
  'bottrop': 'Bottrop',
  'castrop-rauxel': 'Castrop-Rauxel',
  'datteln': 'Datteln',
  'dinslaken': 'Dinslaken',
  'dorsten': 'Dorsten',
  'dortmund': 'Dortmund',
  'duesseldorf': 'Düsseldorf',
  'duisburg': 'Duisburg',
  'essen': 'Essen',
  'gelsenkirchen': 'Gelsenkirchen',
  'gladbeck': 'Gladbeck',
  'haltern-am-see': 'Haltern am See',
  'herne': 'Herne',
  'herten': 'Herten',
  'marl': 'Marl',
  'moers': 'Moers',
  'muelheim': 'Mülheim',
  'oberhausen': 'Oberhausen',
  'recklinghausen': 'Recklinghausen',
  'waltrop': 'Waltrop',
  'wesel': 'Wesel',
  'xanten': 'Xanten',
};

// Luftlinie ab Gladbeck > 20 km -> kein lokaler Relevanz-Anspruch, also kein Link.
const FAR = new Set([
  'dortmund', 'duisburg', 'duesseldorf', 'castrop-rauxel', 'haltern-am-see',
  'datteln', 'wesel', 'moers', 'waltrop', 'xanten',
]);

// M2 — H1. Seiten mit bereits individueller H1 behalten ihren Charakter,
// dort wird lediglich "Geburtstag" -> "Kindergeburtstag" geschaerft.
const H1_INDIVIDUAL = new Set(['dortmund', 'essen', 'oberhausen']);
const H1_PATTERNS = [
  (s) => `Kindergeburtstag in ${s} feiern – Zaubershow ab 150 €`,
  (s) => `Kindergeburtstag in ${s}: Mitmach-Zaubershow ab 150 €`,
  (s) => `Zauberer für den Kindergeburtstag in ${s} – ab 150 €`,
  (s) => `Kindergeburtstag in ${s} feiern – Clown & Zauberer ab 150 €`,
  (s) => `Kindergeburtstag in ${s}: Clown-Zaubershow ab 150 €`,
];

// H2 — keywordtragende Ankertexte, bewusst variierend.
const ANCHOR_PATTERNS = [
  (s) => `Kindergeburtstag in ${s}`,
  (s) => `Kindergeburtstag ${s} feiern`,
  (s) => `Zauberer für den Kindergeburtstag in ${s}`,
  (s) => `Kindergeburtstag ${s} buchen`,
  (s) => `Zaubershow zum Kindergeburtstag in ${s}`,
];
const MAX_ANCHOR_UPGRADES = 3;

// H6 — Bildunterschriften, pro Seite unterschiedlich.
const CAPTIONS_PRIMARY = [
  (s) => `Kindergeburtstag mit Zaubershow in ${s}`,
  (s) => `Mitmach-Zauberei beim Kindergeburtstag in ${s}`,
  (s) => `Das Geburtstagskind im Mittelpunkt der Show in ${s}`,
  (s) => `Staunende Kindergesichter bei einer Zaubershow in ${s}`,
  (s) => `Clown Zauberer LIAR beim Kindergeburtstag in ${s}`,
  (s) => `Lachende Gäste auf einem Kindergeburtstag in ${s}`,
  (s) => `Zauberkunst zum Anfassen – Kindergeburtstag in ${s}`,
];
const CAPTIONS_SECONDARY = [
  (s) => `Zaubershow im Wohnzimmer – Kindergeburtstag in ${s}`,
  (s) => `40 Minuten Clownerie und Zauberei in ${s}`,
  (s) => `Ballonfiguren und Glitzer-Tattoos beim Geburtstag in ${s}`,
  (s) => `Die Kinder werden Teil der Show – ${s}`,
];
// Motivgenaue Unterschriften fuer Galerie-/Show-Bilder (schlagen den Pool).
const CAPTIONS_BY_ASSET = {
  _gal9Asset: (s) => `Zaubershow im Garten – Kindergeburtstag in ${s}`,
  _clownerieAsset: (s) => `Clownerie und Zauberei bei einer Feier in ${s}`,
  _gal8Asset: (s) => `Staunende Kinder bei der Zaubervorführung in ${s}`,
  _showImgAsset: (s) => `Die 40-minütige Zaubershow beim Kindergeburtstag in ${s}`,
};
const FIGCAPTION_CLASS = 'px-3 py-1.5 text-sm text-[#374151] bg-white border-t border-gray-100';

// ---------------------------------------------------------------- Helpers
const dimsCache = new Map();
async function dimsOf(absPath) {
  if (!dimsCache.has(absPath)) {
    const m = await sharp(absPath).metadata();
    dimsCache.set(absPath, { w: m.width, h: m.height });
  }
  return dimsCache.get(absPath);
}

/** Zielbreite (CSS-Pixel) aus Klassen/Style des <img> ableiten. */
function displayWidthOf(attrs) {
  if (/absolute\s+inset-0/.test(attrs)) return 1152;      // Hero, volle Containerbreite
  const styleW = attrs.match(/width:\s*(\d+)px/);
  if (styleW) return Number(styleW[1]);
  if (/\bw-40\b/.test(attrs)) return 160;
  if (/\bmax-w-md\b/.test(attrs)) return 448;
  return 600;
}

/** Zusammenfassender Satz fuer die entlinkten Fernstaedte. */
function fernSatz(names) {
  const list = names.length > 1
    ? `${names.slice(0, -1).join(', ')} und ${names[names.length - 1]}`
    : names[0];
  return `Überregional – mit etwas längerer Anfahrt – bin ich außerdem in ${list} buchbar.`;
}

const changed = [];

// ---------------------------------------------------------------- Hauptlauf
const dirs = readdirSync(BASE).filter((d) => d.startsWith('geburtstag-in-')).sort();
if (dirs.length !== 23) throw new Error(`Erwartet 23 Stadtseiten, gefunden ${dirs.length}`);

for (const [idx, dir] of dirs.entries()) {
  const slug = dir.replace('geburtstag-in-', '');
  const stadt = CITY[slug];
  if (!stadt) throw new Error(`Unbekannter Slug: ${slug}`);
  const file = join(BASE, dir, 'index.astro');
  const before = readFileSync(file, 'utf8');
  let s = before;
  const notes = [];

  // ------------------------------------------------------------ K4: doppelte H2
  const dupH2 = 'Häufige Fragen zum Kindergeburtstag mit Zauberer';
  if (s.includes(dupH2)) {
    s = s.split(dupH2).join(`Häufige Fragen zur Kindergeburtstagsfeier in ${stadt}`);
    notes.push('K4');
  }

  // ------------------------------------------------------------ M2: H1
  s = s.replace(/(<h1\b[^>]*>)([\s\S]*?)(<\/h1>)/, (m, open, inner, close) => {
    const text = inner.trim();
    if (/Kindergeburtstag/i.test(text)) return m;           // schon geschaerft
    const next = H1_INDIVIDUAL.has(slug)
      ? text.replace(/^Geburtstag\b/, 'Kindergeburtstag')
      : H1_PATTERNS[idx % H1_PATTERNS.length](stadt);
    if (next === text) return m;
    notes.push('M2');
    const indent = (inner.match(/^\n([ \t]*)/) || [, '        '])[1];
    return `${open}\n${indent}${next}\n${indent.slice(0, -2)}${close}`;
  });

  // ------------------------------------------------------------ M1: Fernstaedte entlinken
  if (!s.includes('data-fernstaedte')) {
    const TOK = '\u0001';
    const removed = [];
    let lastParaEnd = -1;
    let lastIndent = '          ';
    let delta = 0;                                // Laengendrift durch fruehere Ersetzungen

    s = s.replace(/([ \t]*)<p\b[^>]*>[\s\S]*?<\/p>/g, (para, indent, offset) => {
      let hit = false;
      let inner = para.replace(
        /<a\s+href="\/kindergeburtstag\/geburtstag-in-([a-z-]+)\/"[^>]*>([^<]*)<\/a>/g,
        (a, target, label) => {
          if (!FAR.has(target) || target === slug) return a;
          hit = true;
          const name = label.trim();
          if (!removed.includes(name)) removed.push(name);
          return TOK;
        },
      );
      if (!hit) { delta += 0; return para; }
      // Token samt genau einem Trennzeichen entfernen (erst davor, dann dahinter).
      inner = inner.replace(/\s*\|\s*\u0001/g, '');
      inner = inner.replace(/\s*,\s*\u0001/g, '');
      inner = inner.replace(/\u0001\s*\|\s*/g, '');
      inner = inner.replace(/\u0001\s*,\s*/g, '');
      inner = inner.split(TOK).join('');
      // Aufraeumen: doppelte/haengende Trennzeichen.
      inner = inner
        .replace(/\|\s*\|/g, '|')
        .replace(/,\s*,/g, ',')
        .replace(/,\s*\|/g, ' |')
        .replace(/(<p\b[^>]*>)(\s*)[|,]\s+/, '$1$2')
        .replace(/\s*[|,]\s*(<\/p>)/, '\n' + indent + '$1');
      lastParaEnd = offset + delta + inner.length;
      lastIndent = indent;
      delta += inner.length - para.length;
      return inner;
    });

    // Folgt auf den geaenderten Absatz eine Fortsetzung ("und weitere ..."),
    // wird der Sammelsatz erst dahinter eingefuegt — sonst reisst der Satzfluss.
    while (lastParaEnd > 0) {
      const m = s.slice(lastParaEnd).match(/^\s*<p\b[^>]*>([\s\S]*?)<\/p>/);
      if (!m) break;
      const t = m[1].replace(/<[^>]+>/g, '').trim();
      if (!/^(und|sowie|oder|u\.\s?v\.\s?m|[a-zäöüß])/.test(t)) break;
      lastParaEnd += m[0].length;
    }

    if (removed.length && lastParaEnd > 0) {
      const satz = `\n${lastIndent}<p class="text-[#374151] mb-4 leading-relaxed" data-fernstaedte>\n`
        + `${lastIndent}  ${fernSatz(removed)}\n${lastIndent}</p>`;
      s = s.slice(0, lastParaEnd) + satz + s.slice(lastParaEnd);
      notes.push(`M1(${removed.length})`);
    }
  }

  // ------------------------------------------------------------ H2: Ankertexte
  {
    // Idempotenz: bereits keywordtragende Stadt-Anker zaehlen mit.
    let upgrades = (s.match(
      /<a\s+href="\/kindergeburtstag\/geburtstag-in-[a-z-]+\/"[^>]*>[^<]*Kindergeburtstag[^<]*<\/a>/g,
    ) || []).length;
    const upgradesBefore = upgrades;
    s = s.replace(/([ \t]*)<p\b[^>]*>[\s\S]*?<\/p>/g, (para) => {
      if (upgrades >= MAX_ANCHOR_UPGRADES) return para;
      if (!para.includes('|')) return para;                 // nur reine Link-Listen
      return para.replace(
        /(<a\s+href="\/kindergeburtstag\/geburtstag-in-([a-z-]+)\/"[^>]*>)([^<]*)(<\/a>)/g,
        (a, open, target, label, close) => {
          if (upgrades >= MAX_ANCHOR_UPGRADES) return a;
          if (FAR.has(target) || target === slug) return a;
          const name = CITY[target];
          if (!name) return a;
          const bare = label.trim();
          // nur nackte Stadtnamen aufwerten (auch Kurzform, z.B. "Haltern")
          if (bare !== name && !name.startsWith(bare)) return a;
          const pat = ANCHOR_PATTERNS[(idx + upgrades * 2) % ANCHOR_PATTERNS.length];
          upgrades++;
          return `${open}${pat(name)}${close}`;
        },
      );
    });
    if (upgrades > upgradesBefore) notes.push(`H2(${upgrades - upgradesBefore})`);
  }

  // ------------------------------------------------------------ H4/H6: Bilder
  const imgTags = [...s.matchAll(/([ \t]*)<img\b[\s\S]*?\/>/g)];
  if (imgTags.length) {
    let capIndex = 0;
    for (const m of imgTags) {
      const tag = m[0].replace(/^[ \t]*/, '');
      const indent = m[1];
      const srcM = tag.match(/src=\{([^}]+)\}/);
      if (!srcM) continue;
      const expr = srcM[1].trim();
      let varName = null;
      if (/^_[\w$]+\.src$/.test(expr)) varName = expr.replace(/\.src$/, '');
      else {
        // z.B. src={heroImg} -> const heroImg = _heroImgAsset.src;
        const alias = s.match(new RegExp(`const\\s+${expr}\\s*=\\s*([\\w$]+)\\.src`));
        if (alias) varName = alias[1];
      }
      if (!varName) continue;

      const impM = s.match(new RegExp(`import\\s+${varName}\\s+from\\s+'([^']+)'`));
      if (!impM) continue;
      const assetPath = resolve(dirname(file), impM[1]);
      if (!existsSync(assetPath)) continue;
      const { w: sw, h: sh } = await dimsOf(assetPath);

      const dispW = displayWidthOf(tag);
      const outW = Math.min(sw, dispW * 2);
      const outH = Math.round((outW * sh) / sw);

      const isHero = /absolute\s+inset-0/.test(tag);
      const multiline = tag.includes('\n');

      let out = tag
        .replace(/^<img\b/, '<Image')
        .replace(/src=\{[^}]+\}/, `src={${varName}}`);
      out = multiline
        ? out.replace(/\s*\/>$/, `\n${indent}  width={${outW}}\n${indent}  height={${outH}}\n${indent}/>`)
        : out.replace(/\s*\/>$/, ` width={${outW}} height={${outH}} />`);

      if (!isHero) {
        const pool = capIndex === 0 ? CAPTIONS_PRIMARY : CAPTIONS_SECONDARY;
        const cap = (CAPTIONS_BY_ASSET[varName] || pool[(idx + capIndex * 3) % pool.length])(stadt);
        capIndex++;
        out = [
          '<figure class="m-0">',
          `${indent}  ${out.split('\n').join('\n  ')}`,
          `${indent}  <figcaption class="${FIGCAPTION_CLASS}">${cap}</figcaption>`,
          `${indent}</figure>`,
        ].join('\n');
      }
      s = s.replace(m[0], indent + out);
      notes.push(isHero ? 'H4hero' : 'H4+H6');
    }
    // astro:assets-Import sicherstellen
    if (/<Image\b/.test(s) && !/import\s*\{\s*Image\s*\}\s*from\s*'astro:assets'/.test(s)) {
      s = s.replace(/^---\n/, "---\nimport { Image } from 'astro:assets';\n");
      notes.push('import');
    }
  }

  if (s !== before) {
    writeFileSync(file, s, 'utf8');
    changed.push(`${slug}: ${notes.join(', ')}`);
  }
}

console.log(`\napply-2026-08-11-kg — ${changed.length}/${dirs.length} Dateien geaendert`);
for (const c of changed) console.log('  ' + c);
console.log('');
