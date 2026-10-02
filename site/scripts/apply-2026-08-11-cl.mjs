#!/usr/bin/env node
/**
 * SEO-Umsetzung 11.08.2026 — Bereich: /src/pages/clown/clownshow/clown-in-* (23 Stadtseiten)
 *
 * Idempotent. Mehrfaches Ausfuehren aendert nach dem ersten Lauf nichts mehr.
 *
 * Massnahmen:
 *   K4  doppelte H2 "Haeufige Fragen zum Kindergeburtstag mit Zauberer" -> stadtspezifisch
 *   K2  fehlender Kinderzauberer-Chip auf der Gladbeck-Seite
 *   +   Gladbeck: "Kinderzauberer"-Erwaehnung im Fliesstext
 *   M1  Fernstaedte (>20 km Luftlinie zu Gladbeck) im Einsatzgebiet entlinken
 *       + zweiter, unverlinkter Satz
 *   H2  nackte Staedtenamen -> keywordtragende Ankertexte
 *   H4  <img src={asset.src}> -> <Image src={asset} width height loading="lazy" />
 *   H6  Bildunterschriften (figure/figcaption) auf Content-Bildern
 *   AB  Ballonmodellage/Glitzer-Tattoos sprachlich zur Zusatzleistung herabstufen
 *
 * Aufruf: node scripts/apply-2026-08-11-cl.mjs
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const BASE = join(ROOT, 'src/pages/clown/clownshow');

// ---------------------------------------------------------------- Stammdaten
/** slug -> Anzeigename */
const CITY = {
  bochum: 'Bochum',
  bottrop: 'Bottrop',
  'castrop-rauxel': 'Castrop-Rauxel',
  datteln: 'Datteln',
  dinslaken: 'Dinslaken',
  dorsten: 'Dorsten',
  dortmund: 'Dortmund',
  duesseldorf: 'Düsseldorf',
  duisburg: 'Duisburg',
  essen: 'Essen',
  gelsenkirchen: 'Gelsenkirchen',
  gladbeck: 'Gladbeck',
  haltern: 'Haltern am See',
  herne: 'Herne',
  herten: 'Herten',
  marl: 'Marl',
  moers: 'Moers',
  muelheim: 'Mülheim',
  oberhausen: 'Oberhausen',
  recklinghausen: 'Recklinghausen',
  waltrop: 'Waltrop',
  wesel: 'Wesel',
  xanten: 'Xanten',
};
const SLUGS = Object.keys(CITY);

// M1: >20 km Luftlinie zum Standort Gladbeck -> nicht mehr verlinken
const FAR_SLUGS = new Set([
  'dortmund', 'duisburg', 'duesseldorf', 'castrop-rauxel',
  'haltern', 'datteln', 'wesel', 'moers', 'waltrop',
]);
// Ankertexte, die eine Fernstadt bezeichnen (auch bei falsch gesetztem href)
const FAR_NAMES = new Set([
  'Dortmund', 'Duisburg', 'Düsseldorf', 'Castrop-Rauxel',
  'Haltern', 'Haltern am See', 'Datteln', 'Wesel', 'Moers', 'Waltrop',
]);
/** Anzeigename -> slug (fuer Ankertext-Erkennung) */
const NAME2SLUG = {};
for (const [s, n] of Object.entries(CITY)) NAME2SLUG[n] = s;
NAME2SLUG['Haltern'] = 'haltern';

// H2: keywordtragende Ankertexte, bewusst variiert
const ANCHOR_TEMPLATES = [
  (n) => `Clown in ${n} buchen`,
  (n) => `Clownshow für ${n}`,
  (n) => `Clown für Kindergeburtstag in ${n}`,
  (n) => `Clown ${n} buchen`,
  (n) => `Clownshow in ${n} erleben`,
  (n) => `Clown für Kinderfeste in ${n}`,
];

// H6: Bildunterschriften — pro Seite unterschiedlich
const CAPTION_TEMPLATES = [
  (n) => `Clown Zauberer LIAR beim Kindergeburtstag in ${n}`,
  (n) => `Clownshow für Kinder in ${n}`,
  (n) => `Clown Zauberer LIAR beim Straßenfest in ${n}`,
  (n) => `Interaktive Clownshow vor Kindern in ${n}`,
  (n) => `Clown Zauberer LIAR beim Sommerfest in ${n}`,
  (n) => `Clown Zauberer LIAR beim Kita-Fest in ${n}`,
  (n) => `Clownshow beim Familienfest in ${n}`,
];

// H6: Sonderfaelle (Bilder ausserhalb des Intro-Portraits), key = slug|altText
const SPECIAL_CAPTIONS = {
  'dinslaken|Glitzer Tattoos begeistern Kinder auf dem Geburtstag in Dinslaken':
    'Glitzer-Tattoo als Zusatzleistung beim Kindergeburtstag in Dinslaken',
  'dinslaken|Zaubershow auf einer der Bühne in Dinslaken':
    'Zaubershow von Clown Zauberer LIAR auf einer Bühne in Dinslaken',
  'dinslaken|Clown in Dinslaken verschenkt Luftballon bei Walk Act':
    'Ballonfigur als Zusatzleistung beim Walk Act in Dinslaken',
  'oberhausen|Interaktive Clownshow in Oberhausen':
    'Clown Zauberer LIAR mit Kindern beim Familienfest in Oberhausen',
};

const FIGCAPTION_CLASS =
  'px-3 py-1.5 text-sm text-[#374151] bg-white border-t border-gray-100';

// Abwertung Zusatzleistungen: exakte Ueberschriftentexte -> neue Formulierung
const DOWNGRADE = {
  'BALLONMODELLAGE': 'Zusatzleistung: Ballonmodellage',
  'GLITZER TATTOOS': 'Zusatzleistung: Glitzer-Tattoos',
  '✨ Glitzer-Tattoos': '✨ Zusatzleistung: Glitzer-Tattoos',
  '🎈 Ballonmodellage': '🎈 Zusatzleistung: Ballonmodellage',
  'GLITZER TATTOOS ✨💫': 'Zusatzleistung: Glitzer-Tattoos ✨💫',
  'BALLONMODELLAGE 🎈🎨': 'Zusatzleistung: Ballonmodellage 🎈🎨',
  'BALLONMODELLAGE 🎈': 'Zusatzleistung zur Clownshow: Ballonmodellage 🎈',
  'GLITZER TATTOOS ✨': 'Zusatzleistung zur Clownshow: Glitzer-Tattoos ✨',
  '🎈 BALLONMODELLAGE – Kunstwerke zum Mitnehmen':
    '🎈 Zusatzleistung zur Clownshow: Ballonmodellage',
  '🎈 Ballonmodellage – Kreative Kunstwerke': '🎈 Zusatzleistung: Ballonmodellage',
  '✨ Glitzer-Tattoos – Temporäre Körperkunst': '✨ Zusatzleistung: Glitzer-Tattoos',
};

const MAX_IMG_WIDTH = 800;
const dimCache = new Map();
async function dimsOf(absPath) {
  if (dimCache.has(absPath)) return dimCache.get(absPath);
  const m = await sharp(absPath).metadata();
  let w = m.width;
  let h = m.height;
  if (w > MAX_IMG_WIDTH) {
    h = Math.round((h * MAX_IMG_WIDTH) / w);
    w = MAX_IMG_WIDTH;
  }
  const d = { w, h };
  dimCache.set(absPath, d);
  return d;
}

const stats = {
  k4: 0, chip: 0, kzText: 0, unlinked: 0, farSentences: 0,
  anchors: 0, images: 0, captions: 0, downgrades: 0, files: 0,
};

// ------------------------------------------------------------------ Helpers
const attr = (tag, name) => {
  const m = tag.match(new RegExp(`\\s${name}="([^"]*)"`));
  return m ? m[1] : null;
};

/** Ersetzt die Stadt-Links in einem Absatz. */
function processCityParagraph(p, pageSlug, anchorCounter) {
  const removedFar = [];
  const out = p.replace(
    /<a\s+href="\/clown\/clownshow\/clown-in-([a-z-]+)\/"([^>]*)>([\s\S]*?)<\/a>/g,
    (full, slug, rest, text) => {
      const label = text.trim();
      const isFar = FAR_SLUGS.has(slug) || FAR_NAMES.has(label);
      const isSelf = slug === pageSlug;

      // M1 — Fernstaedte entlinken (auf der eigenen Seite bleibt der Selbstbezug)
      if (isFar && !isSelf) {
        const name = FAR_NAMES.has(label) ? label : CITY[slug];
        if (name && !removedFar.includes(name)) removedFar.push(name);
        stats.unlinked++;
        return label;
      }
      if (isSelf) return full;

      // H2 — nackte Staedtenamen aufwerten
      const targetSlug = NAME2SLUG[label];
      if (targetSlug && targetSlug === slug) {
        const tpl = ANCHOR_TEMPLATES[anchorCounter.n++ % ANCHOR_TEMPLATES.length];
        stats.anchors++;
        return `<a href="/clown/clownshow/clown-in-${slug}/"${rest}>${tpl(CITY[slug])}</a>`;
      }
      return full;
    },
  );
  return { out, removedFar };
}

function farSentence(names) {
  const shown = names.slice(0, 3);
  const list =
    shown.length > 1
      ? `${shown.slice(0, -1).join(', ')} und ${shown[shown.length - 1]}`
      : shown[0];
  return (
    `Auch außerhalb dieses Umkreises bin ich unterwegs: Termine in weiter ` +
    `entfernten Städten wie ${list} lassen sich einrichten – die Anfahrt ` +
    `plane ich dabei einfach mit ein.`
  );
}

// ------------------------------------------------------------------- Runner
async function processFile(slug) {
  const file = join(BASE, `clown-in-${slug}`, 'index.astro');
  if (!existsSync(file)) throw new Error(`fehlt: ${file}`);
  const orig = readFileSync(file, 'utf8');
  let src = orig;
  const name = CITY[slug];

  // ---- K4: doppelte H2 aufloesen ---------------------------------------
  const oldH2 = 'Häufige Fragen zum Kindergeburtstag mit Zauberer';
  const newH2 = `Häufige Fragen zum Clown-Auftritt in ${name}`;
  if (src.includes(`>${oldH2}</h2>`)) {
    src = src.split(`>${oldH2}</h2>`).join(`>${newH2}</h2>`);
    stats.k4++;
  }

  // ---- Abwertung Ballonmodellage / Glitzer-Tattoos ----------------------
  src = src.replace(/(<h([2-4])\b[^>]*>)([^<]*)(<\/h\2>)/g, (full, open, lvl, text, close) => {
    const t = text.trim();
    if (Object.prototype.hasOwnProperty.call(DOWNGRADE, t)) {
      stats.downgrades++;
      return `${open}${DOWNGRADE[t]}${close}`;
    }
    return full;
  });

  // ---- M1 + H2: Einsatzgebiet-Absaetze ----------------------------------
  const anchorCounter = { n: SLUGS.indexOf(slug) };
  // Ein "Staedte-Absatz" ist eine Pipe-getrennte Aufzaehlung mit mindestens
  // einem Stadtlink. Fliesstext-Absaetze (ohne "|") bleiben unangetastet,
  // damit dort keine Satzbau-Bruecke zerstoert wird.
  const isCityPara = (p) =>
    /\/clown\/clownshow\/clown-in-/.test(p) && /\|/.test(p);
  const paragraphs = [...src.matchAll(/<p\b[^>]*>[\s\S]*?<\/p>/g)];
  const cityParas = paragraphs.filter((m) => isCityPara(m[0]));
  if (cityParas.length) {
    const allRemoved = [];
    // von hinten nach vorn ersetzen, damit die Indizes gueltig bleiben
    for (let i = cityParas.length - 1; i >= 0; i--) {
      const m = cityParas[i];
      const { out, removedFar } = processCityParagraph(m[0], slug, anchorCounter);
      allRemoved.unshift(...removedFar);
      src = src.slice(0, m.index) + out + src.slice(m.index + m[0].length);
    }
    const uniqueFar = [...new Set(allRemoved)];
    if (uniqueFar.length && !src.includes('data-far-cities')) {
      // zweiter, unverlinkter Satz direkt nach dem letzten Staedte-Absatz
      const last = [...src.matchAll(/<p\b[^>]*>[\s\S]*?<\/p>/g)]
        .filter((m) => isCityPara(m[0]))
        .pop();
      if (last) {
        const insertAt = last.index + last[0].length;
        const para =
          `\n          <p class="text-[#374151] mb-4 leading-relaxed" data-far-cities>` +
          `${farSentence(uniqueFar)}</p>`;
        src = src.slice(0, insertAt) + para + src.slice(insertAt);
        stats.farSentences++;
      }
    }
  }

  // ---- H4 + H6: <img> -> <Image> in <figure> mit <figcaption> -----------
  const imgTags = [...src.matchAll(/<img\b[\s\S]*?\/>/g)];
  let capIdx = 0;
  for (let i = imgTags.length - 1; i >= 0; i--) {
    const tag = imgTags[i][0];
    const srcExpr = tag.match(/\ssrc=\{\s*([A-Za-z_$][\w$]*)\.src\s*\}/);
    if (!srcExpr) continue; // kein lokales Asset -> unangetastet
    const varName = srcExpr[1];
    const alt = attr(tag, 'alt');
    const cls = attr(tag, 'class');
    const style = attr(tag, 'style');
    if (!alt) continue; // R3: nie ein Bild ohne alt erzeugen

    const imp = src.match(
      new RegExp(`import\\s+${varName}\\s+from\\s+'([^']+)'`),
    );
    if (!imp) continue;
    const assetPath = resolve(dirname(file), imp[1]);
    if (!existsSync(assetPath)) continue;
    const { w, h } = await dimsOf(assetPath);

    // Bildunterschrift bestimmen
    const specialKey = `${slug}|${alt}`;
    const caption =
      SPECIAL_CAPTIONS[specialKey] ||
      CAPTION_TEMPLATES[(SLUGS.indexOf(slug) + capIdx) % CAPTION_TEMPLATES.length](name);
    capIdx++;

    // mb-4 vom Bild auf die figure verschieben, damit die Caption anliegt
    let imgClass = cls || '';
    let figClass = 'text-center';
    if (/\bmb-4\b/.test(imgClass)) {
      imgClass = imgClass.replace(/\s*\bmb-4\b\s*/, ' ').trim();
      figClass += ' mb-4';
    }

    const parts = [
      `src={${varName}}`,
      `alt="${alt}"`,
      imgClass ? `class="${imgClass}"` : null,
      style ? `style="${style}"` : null,
      `width={${w}}`,
      `height={${h}}`,
      `loading="lazy"`,
    ].filter(Boolean);

    const replacement =
      `<figure class="${figClass}">\n` +
      `            <Image ${parts.join(' ')} />\n` +
      `            <figcaption class="${FIGCAPTION_CLASS}">${caption}</figcaption>\n` +
      `          </figure>`;

    src = src.slice(0, imgTags[i].index) + replacement +
      src.slice(imgTags[i].index + tag.length);
    stats.images++;
    stats.captions++;
  }

  // Image-Import sicherstellen
  if (/<Image\b/.test(src) && !/from ['"]astro:assets['"]/.test(src)) {
    src = src.replace(
      /^---\n/,
      `---\nimport { Image } from 'astro:assets';\n`,
    );
  }

  // ---- K2 + Kinderzauberer-Erwaehnung: nur Gladbeck ---------------------
  if (slug === 'gladbeck') {
    const chip =
      `\n      <a href="/kinderzauberer/kinderzauberer-in-gladbeck/" ` +
      `class="bg-white rounded-lg px-5 py-3 shadow-sm text-[#3b55d5] hover:underline font-medium text-sm">` +
      `🎩 Kinderzauberer in Gladbeck</a>`;
    if (!src.includes('/kinderzauberer/kinderzauberer-in-gladbeck/')) {
      const anchorLine =
        '<a href="/kindergeburtstag/geburtstag-in-gladbeck/" class="bg-white rounded-lg px-5 py-3 shadow-sm text-[#d7393e] hover:underline font-medium text-sm">🎂 Kindergeburtstag in Gladbeck</a>';
      if (src.includes(anchorLine)) {
        src = src.replace(anchorLine, anchorLine + chip);
        stats.chip++;
      }
    }
    const marker = 'Als Kinderzauberer aus Gladbeck bin ich ohne Anfahrtskosten direkt vor Ort.';
    if (!src.includes(marker)) {
      const tail = 'Meine interaktive Clownshow kommt zu Ihnen nach Hause oder zu Ihrer Veranstaltung.';
      if (src.includes(tail)) {
        src = src.replace(tail, `${tail} ${marker}`);
        stats.kzText++;
      }
    }
  }

  if (src !== orig) {
    writeFileSync(file, src, 'utf8');
    stats.files++;
    return true;
  }
  return false;
}

const changed = [];
for (const slug of SLUGS) {
  if (await processFile(slug)) changed.push(slug);
}

console.log('apply-2026-08-11-cl — Clownshow-Stadtseiten');
console.log('='.repeat(60));
console.log(`geaenderte Dateien : ${stats.files}/${SLUGS.length}`);
console.log(`K4 FAQ-H2          : ${stats.k4}`);
console.log(`K2 Gladbeck-Chip   : ${stats.chip}`);
console.log(`Gladbeck KZ-Satz   : ${stats.kzText}`);
console.log(`M1 entlinkt        : ${stats.unlinked} Fernstadt-Links`);
console.log(`M1 Zusatzsaetze    : ${stats.farSentences}`);
console.log(`H2 Ankertexte      : ${stats.anchors}`);
console.log(`H4 <img> -> <Image>: ${stats.images}`);
console.log(`H6 figcaptions     : ${stats.captions}`);
console.log(`Abwertung Headings : ${stats.downgrades}`);
if (changed.length) console.log(`\n${changed.join(', ')}`);
