#!/usr/bin/env node
/**
 * SEO-Umsetzung 11.08.2026 — Bereich /kinderzauberer/ (23 Stadtseiten + Hub).
 * Idempotent: mehrfaches Ausfuehren aendert nichts zusaetzlich.
 *
 * Aufruf: node scripts/apply-2026-08-11-kz.mjs [--dry]
 *
 * Deckt ab:
 *   K4  doppelte H2 "Häufige Fragen zum Kindergeburtstag mit Zauberer" -> ortsbezogen
 *   K2  Gladbeck im Einsatzgebiet verlinken (variierender Ankertext)
 *   H1  Longtail "Zauberer für Kinder" im Intro-Absatz (>= 4 Formulierungen)
 *   M1  Fernstaedte (>20 km Luftlinie zu Gladbeck) im Einsatzgebiet entlinken
 *   H4  <img src={asset.src}> -> <Image src={asset} width height> (WebP/srcset)
 *   H6  Foto-Grid: <figure> + <figcaption> mit ortsbezogenen Bildunterschriften
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import sharp from 'sharp';

const DRY = process.argv.includes('--dry');
const ROOT = 'src/pages/kinderzauberer';
const LINKCLASS = 'text-[#3b55d5] hover:underline';
const href = (slug) => `/kinderzauberer/kinderzauberer-in-${slug}/`;
const a = (slug, text) => `<a href="${href(slug)}" class="${LINKCLASS}">${text}</a>`;

// ---------------------------------------------------------------- Stammdaten
const CITY = {
  bochum: 'Bochum', bottrop: 'Bottrop', 'castrop-rauxel': 'Castrop-Rauxel',
  datteln: 'Datteln', dinslaken: 'Dinslaken', dorsten: 'Dorsten',
  dortmund: 'Dortmund', duesseldorf: 'Düsseldorf', duisburg: 'Duisburg',
  essen: 'Essen', gelsenkirchen: 'Gelsenkirchen', gladbeck: 'Gladbeck',
  haltern: 'Haltern am See', herne: 'Herne', herten: 'Herten', marl: 'Marl',
  moers: 'Moers', muelheim: 'Mülheim', oberhausen: 'Oberhausen',
  recklinghausen: 'Recklinghausen', waltrop: 'Waltrop', wesel: 'Wesel',
  xanten: 'Xanten',
};
const SLUGS = Object.keys(CITY);

// Luftlinie zu Gladbeck > 20 km -> im Einsatzgebiet-Absatz nicht mehr verlinken.
const FAR = new Set(['dortmund', 'duisburg', 'duesseldorf', 'castrop-rauxel',
  'haltern', 'datteln', 'wesel', 'moers', 'waltrop', 'xanten']);

// 'move'    = Fernstaedte aus dem Aufzaehlungssatz nehmen, unverlinkt im
//             Zusatzsatz buendeln (fliessende Aufzaehlungsabsaetze).
// 'inplace' = Link zu reinem Text machen, Position beibehalten. Fuer die
//             Chip-/Spaltenlisten (Moers, Oberhausen, Recklinghausen) und fuer
//             Seiten, deren Absatz die Fernstaedte bereits in einem eigenen
//             zweiten Satz fuehrt (Gladbeck, Castrop-Rauxel, Waltrop, Wesel,
//             Xanten) — ein zusaetzlicher "weiter entfernt"-Satz waere dort
//             doppelt bzw. sachlich falsch.
const FAR_MODE = {
  bochum: 'move', bottrop: 'move', datteln: 'move', dinslaken: 'move',
  dorsten: 'move', dortmund: 'move', duesseldorf: 'move', duisburg: 'move',
  gelsenkirchen: 'move', haltern: 'move', herne: 'move', herten: 'move',
  marl: 'move',
  'castrop-rauxel': 'inplace', gladbeck: 'inplace', moers: 'inplace',
  oberhausen: 'inplace', recklinghausen: 'inplace', waltrop: 'inplace',
  wesel: 'inplace', xanten: 'inplace',
};

// K2 — Ankertext-Varianten fuer den Gladbeck-Link.
// 'pure' = reiner Ortsname in der Staedteliste (max. 5 Seiten inkl. Hub).
const GLADBECK = {
  haltern: 'pure', moers: 'pure', oberhausen: 'pure', recklinghausen: 'pure',
  bochum: 'in', dorsten: 'in', herten: 'in', marl: 'in',
  bottrop: 'fuer', dinslaken: 'fuer', gelsenkirchen: 'fuer',
};
// Satz, in den der beschreibende Ankertext eingebettet wird ({L} = Link).
const GLADBECK_SENTENCE = {
  bochum: 'Mein Standort ist Gladbeck: Als {L} bin ich von dort über die A42 schnell in Bochum.',
  dorsten: 'Zu Hause bin ich in der Nachbarstadt – als {L} bin ich dort genauso oft im Einsatz wie in Dorsten.',
  herten: 'Von meinem Wohnort aus bin ich als {L} ebenso unterwegs wie in Herten.',
  marl: 'Meine Heimatstadt ist Gladbeck: Als {L} zaubere ich dort so regelmäßig wie in Marl.',
  bottrop: 'Gebucht werde ich ebenso als {L} – meine Heimatstadt grenzt direkt an Bottrop.',
  dinslaken: 'Auch als {L} bin ich im Einsatz; von dort aus ist Dinslaken schnell erreicht.',
  gelsenkirchen: 'Ebenso bin ich als {L} unterwegs – meine Heimatstadt grenzt direkt an Gelsenkirchen-Buer.',
};

// M1 — Satzvarianten fuer die gebuendelten Fernstaedte (Perspektive: Anfahrt
// vom Standort Gladbeck aus, damit die Aussage auf jeder Seite stimmt).
const FAR_SENTENCE = [
  (n) => `Mit etwas längerer Anfahrt bin ich außerdem in ${listDe(n)} unterwegs.`,
  (n) => `Auf Anfrage fahre ich auch nach ${listDe(n)}.`,
  (n) => `Etwas weiter von meinem Standort Gladbeck entfernt ${n.length > 1 ? 'liegen' : 'liegt'} ${listDe(n)} – auch dorthin komme ich gerne.`,
  (n) => `Überregional bin ich zudem in ${listDe(n)} buchbar.`,
];

// H1 — Longtail "Zauberer für Kinder" im Intro-Absatz, sechs Formulierungen.
const INTRO = [
  (c) => `Sie suchen einen Zauberer für Kinder in ${c}?`,
  (c) => `Einen Zauberer für Kinder in ${c} zu finden, der die Kleinen wirklich erreicht, ist nicht selbstverständlich.`,
  (c) => `Als Zauberer für Kinder bin ich in ${c} regelmäßig unterwegs.`,
  (c) => `Ein Zauberer für Kinder muss in ${c} vor allem eines können: die Kleinen 40 Minuten lang fesseln.`,
  (c) => `Wer in ${c} einen Zauberer für Kinder sucht, wünscht sich vor allem strahlende Kinderaugen.`,
  (c) => `Ein guter Zauberer für Kinder macht aus einer Feier in ${c} ein Erlebnis, über das noch Wochen später gesprochen wird.`,
];

// H6 — Bildunterschriften im Foto-Grid (pro Seite unterschiedlich).
const CAPTIONS = {
  gelsenkirchen: [
    'Kinderzauberer LIAR beim Auftritt auf dem Weihnachtsmarkt in Gelsenkirchen',
    'Staunende Kinder bei der Mitmach-Zaubershow in Gelsenkirchen',
    'Zaubershow für Kinder auf einem Sommerfest in Gelsenkirchen',
  ],
};
const FIGCAPTION_CLASS = 'px-3 py-1.5 text-sm text-[#374151] bg-white border-t border-gray-100';

// ---------------------------------------------------------------- Helpers
const changed = new Map();
const notes = [];
function edit(file, fn) {
  const before = readFileSync(file, 'utf8');
  const after = fn(before);
  if (after !== before) {
    if (!DRY) writeFileSync(file, after, 'utf8');
    changed.set(file, (changed.get(file) || 0) + 1);
  }
}
const listDe = (arr) => arr.length <= 1 ? (arr[0] || '')
  : arr.slice(0, -1).join(', ') + ' und ' + arr[arr.length - 1];

const TOK = '\u0000';
/** Entfernt ein Platzhalter-Token samt genau einem angrenzenden Trennzeichen. */
function dropToken(s) {
  while (s.includes(TOK)) {
    const i = s.indexOf(TOK);
    const before = s.slice(0, i);
    const after = s.slice(i + 1);
    let m;
    if ((m = before.match(/,\s*$/))) { s = before.slice(0, -m[0].length) + after; continue; }
    if ((m = after.match(/^\s*,\s*/))) { s = before + after.slice(m[0].length); continue; }
    if ((m = before.match(/\s+(und|sowie|oder)\s+$/))) { s = before.slice(0, -m[0].length) + after; continue; }
    if ((m = after.match(/^\s+(und|sowie|oder)\s+/))) { s = before + ' ' + after.slice(m[0].length); continue; }
    if ((m = before.match(/\s*\|\s*$/))) { s = before.slice(0, -m[0].length) + after; continue; }
    if ((m = after.match(/^\s*\|\s*/))) { s = before + after.slice(m[0].length); continue; }
    s = before + after;
  }
  // Doppelte Leerzeichen bereinigen, Einrueckungen (direkt nach \n) erhalten.
  return s.replace(/([^\n \t])[ \t]{2,}/g, '$1 ').replace(/ +([,.!?])/g, '$1').replace(/:[ \t]*,/g, ':');
}

/** Fuegt Saetze am Ende des Absatzes ein, aber vor einem abschliessenden
 *  "Auch überregionale ..."-Satz, damit der Text rund bleibt. */
function appendSentences(inner, sentences) {
  if (!sentences.length) return inner;
  const add = ' ' + sentences.join(' ');
  const tail = inner.match(/\s(Auch überregionale|Internationale Buchungen|Jedoch kann man mich auch überregional)/);
  if (tail) {
    const i = tail.index;
    return inner.slice(0, i) + add + inner.slice(i);
  }
  return inner.replace(/(\s*)<\/p>$/, (m, ws) => add + ws + '</p>');
}

const anchorRe = (slug) =>
  new RegExp(`<a href="${href(slug).replace(/\//g, '\\/')}"[^>]*>([\\s\\S]*?)<\\/a>( am See| an der Ruhr)?`, 'g');

// ---------------------------------------------------------------- Bildmasse
const dimCache = new Map();
async function assetSize(file, ident) {
  const src = readFileSync(file, 'utf8');
  const m = src.match(new RegExp(`import\\s+${ident}\\s+from\\s+'([^']+)'`));
  if (!m) return null;
  const p = resolve(dirname(file), m[1]);
  if (!dimCache.has(p)) {
    const meta = await sharp(p).metadata();
    dimCache.set(p, { w: meta.width, h: meta.height });
  }
  return dimCache.get(p);
}
function targetWidth(tag) {
  if (/rounded-full/.test(tag)) return 640;          // 320px Anzeige, 2x
  if (/height:\s*280px/.test(tag)) return 600;       // Foto-Grid, Drittelspalte
  return 800;                                        // halbe Spalte / max-w-md
}

// ---------------------------------------------------------------- Hauptlauf
const pages = SLUGS.map((slug) => ({ slug, file: join(ROOT, `kinderzauberer-in-${slug}`, 'index.astro') }))
  .filter((p) => existsSync(p.file));
if (pages.length !== 23) throw new Error(`Erwartet 23 Stadtseiten, gefunden ${pages.length}`);

for (const [idx, { slug, file }] of pages.entries()) {
  const city = CITY[slug];

  // ---------------- Alt-Text-Tippfehler
  edit(file, (s) => s.replace(/alt="CLown /g, 'alt="Clown '));

  // ---------------- K4: doppelte H2 ortsbezogen machen
  edit(file, (s) => s
    .replace(/>Häufige Fragen zum Kindergeburtstag mit Zauberer</g, `>Häufige Fragen zum Kinderzauberer in ${city}<`)
    .replace(/>Häufig gestellte Fragen</g, `>Häufige Fragen zum Kinderzauberer in ${city}<`));

  // ---------------- H1: Longtail "Zauberer für Kinder" im Intro
  edit(file, (s) => s.replace(/(<p class="hero-subtitle[^"]*">)([\s\S]*?)(<\/p>)/, (m, open, body, close) => {
    if (/Zauberer für Kinder/i.test(body)) return m;
    const sentence = INTRO[idx % INTRO.length](city);
    return open + sentence + ' ' + body.replace(/^\s+/, '') + close;
  }));

  // ---------------- M1 + K2: Einsatzgebiet-Absatz
  edit(file, (s) => {
    const start = s.indexOf('<!-- Einsatzgebiet');
    if (start < 0) { notes.push(`${slug}: kein Einsatzgebiet-Block gefunden`); return s; }
    const end = s.indexOf('</section>', start);
    let sec = s.slice(start, end);
    const mode = FAR_MODE[slug];
    const glad = GLADBECK[slug];

    const paras = [...sec.matchAll(/<p[^>]*>[\s\S]*?<\/p>/g)].map((m) => m[0]);
    const removedFar = [];
    let farParaIdx = -1;
    const newParas = paras.map((p, pi) => {
      let inner = p;
      for (const fslug of FAR) {
        if (fslug === slug) continue;
        inner = inner.replace(anchorRe(fslug), (mm, text, suffix) => {
          const name = (text + (suffix || '')).trim();
          if (mode === 'move') {
            if (!removedFar.includes(name)) removedFar.push(name);
            if (farParaIdx < 0) farParaIdx = pi;
            return TOK;
          }
          return name;
        });
      }
      if (inner.includes(TOK)) inner = dropToken(inner);
      return inner;
    });

    // K2 — Gladbeck verlinken (nie auf der Gladbeck-Seite selbst)
    const gladSentences = [];
    if (glad && !sec.includes(href('gladbeck'))) {
      for (let pi = 0; pi < newParas.length; pi++) {
        if (!/(^|[^-\w>])Gladbeck\b/.test(newParas[pi])) continue;
        if (glad === 'pure') {
          newParas[pi] = newParas[pi].replace(/Gladbeck/, a('gladbeck', 'Gladbeck'));
        } else {
          const anchorText = glad === 'in' ? 'Kinderzauberer in Gladbeck' : 'Kinderzauberer für Gladbeck';
          newParas[pi] = dropToken(newParas[pi].replace(/Gladbeck/, TOK));
          gladSentences.push(GLADBECK_SENTENCE[slug].replace('{L}', a('gladbeck', anchorText)));
          if (farParaIdx < 0) farParaIdx = pi;
        }
        break;
      }
    }

    // M1 — gebuendelter, unverlinkter Zusatzsatz
    const extra = [];
    if (removedFar.length) extra.push(FAR_SENTENCE[idx % FAR_SENTENCE.length](removedFar));
    extra.push(...gladSentences);
    if (extra.length) {
      const target = farParaIdx >= 0 ? farParaIdx : 0;
      newParas[target] = appendSentences(newParas[target], extra);
    }

    paras.forEach((p, i) => { if (p !== newParas[i]) sec = sec.replace(p, () => newParas[i]); });
    return s.slice(0, start) + sec + s.slice(end);
  });
}

// K2 — Ankertext-Entzerrung: Vier Seiten verlinkten Gladbeck schon vorher mit
// dem reinen Ortsnamen. Damit die reine Variante insgesamt auf hoechstens fuenf
// Seiten steht, bekommen sie einen beschreibenden Ankertext; die Saetze werden
// dafuer minimal umgestellt.
const REWRITES = {
  'castrop-rauxel': [
    [`Auch das restliche Ruhrgebiet – etwa ${a('gelsenkirchen', 'Gelsenkirchen')}, ${a('essen', 'Essen')} oder ${a('gladbeck', 'Gladbeck')} – gehört zu meinem Kerngebiet.`,
     `Auch das restliche Ruhrgebiet – etwa ${a('gelsenkirchen', 'Gelsenkirchen')} und ${a('essen', 'Essen')} – gehört zu meinem Kerngebiet; zu Hause bin ich als ${a('gladbeck', 'Kinderzauberer in Gladbeck')}.`],
  ],
  waltrop: [
    [`Auch Dortmund, Lünen und das gesamte Ruhrgebiet bis ${a('gladbeck', 'Gladbeck')} gehören zu meinem Kerngebiet.`,
     `Auch Dortmund, Lünen und das gesamte Ruhrgebiet gehören zu meinem Kerngebiet; zu Hause bin ich als ${a('gladbeck', 'Kinderzauberer für Gladbeck')}.`],
  ],
  wesel: [
    [`Auch das Ruhrgebiet – etwa Duisburg, ${a('dorsten', 'Dorsten')} und ${a('gladbeck', 'Gladbeck')} – gehört zu meinem Kerngebiet.`,
     `Auch das Ruhrgebiet – etwa Duisburg und ${a('dorsten', 'Dorsten')} – gehört zu meinem Kerngebiet; ansässig bin ich als ${a('gladbeck', 'Kinderzauberer für Gladbeck')}.`],
  ],
  xanten: [
    [`Auch das Ruhrgebiet – etwa Duisburg und ${a('gladbeck', 'Gladbeck')} – gehört zu meinem Kerngebiet.`,
     `Auch das Ruhrgebiet – etwa Duisburg – gehört zu meinem Kerngebiet; zu Hause bin ich als ${a('gladbeck', 'Kinderzauberer in Gladbeck')}.`],
  ],
};
for (const [slug, pairs] of Object.entries(REWRITES)) {
  const file = join(ROOT, `kinderzauberer-in-${slug}`, 'index.astro');
  edit(file, (s) => pairs.reduce((acc, [from, to]) => acc.split(from).join(to), s));
}

// K2 — Hub: Gladbeck verlinken; ausserdem die vier Stadtseiten ergaenzen, die
// im Hub bisher fehlten (sonst verlieren sie durch M1 jede interne Verlinkung
// innerhalb der Kinderzauberer-Rubrik).
edit(join(ROOT, 'index.astro'), (s) => {
  if (s.includes(href('gladbeck'))) return s;
  return s.replace(
    /, Gladbeck,/,
    `, ${a('gladbeck', 'Gladbeck')}, ${a('castrop-rauxel', 'Castrop-Rauxel')}, ${a('waltrop', 'Waltrop')}, ${a('wesel', 'Wesel')}, ${a('xanten', 'Xanten')},`);
});

// ---------------------------------------------------------------- H4 + H6
for (const { slug, file } of pages) {
  const city = CITY[slug];

  // H6 — Foto-Grid in <figure> mit <figcaption> (nur echte Foto-Grids)
  if (CAPTIONS[slug] && !readFileSync(file, 'utf8').includes('<figcaption')) {
    let n = 0;
    edit(file, (s) => s.replace(/( *)<img([^>]*?height:\s*280px[^>]*?)\/>/g, (m, indent, attrs) => {
      const caption = CAPTIONS[slug][n++] || `Kinderzauberer LIAR bei einem Kindergeburtstag in ${city}`;
      const cleaned = attrs.replace(/\bclass="([^"]*)"/, (mm, cls) =>
        `class="${cls.replace(/\brounded-xl\b/, '').replace(/\bshadow-sm\b/, '').replace(/\s{2,}/g, ' ').trim()}"`);
      return `${indent}<figure class="rounded-xl overflow-hidden shadow-sm bg-white">\n`
        + `${indent}  <img${cleaned}/>\n`
        + `${indent}  <figcaption class="${FIGCAPTION_CLASS}">${caption}</figcaption>\n`
        + `${indent}</figure>`;
    }));
  }

  // H4 — <img src={asset.src}> -> <Image src={asset} width height>
  const s0 = readFileSync(file, 'utf8');
  const tags = [...s0.matchAll(/<img[\s\S]*?\/>/g)].map((m) => m[0])
    .filter((t) => /src=\{\s*([A-Za-z_$][\w$]*)\.src\s*\}/.test(t));
  if (!tags.length) continue;
  const rewritten = [];
  for (const tag of tags) {
    const ident = tag.match(/src=\{\s*([A-Za-z_$][\w$]*)\.src\s*\}/)[1];
    const dim = await assetSize(file, ident);
    if (!dim) { notes.push(`${slug}: Import fuer ${ident} nicht gefunden`); continue; }
    const w = Math.min(targetWidth(tag), dim.w);
    const h = Math.round(w * dim.h / dim.w);
    let out = tag
      .replace(/<img/, '<Image')
      .replace(/src=\{\s*[A-Za-z_$][\w$]*\.src\s*\}/, `src={${ident}}`);
    if (!/\swidth=/.test(out)) out = out.replace(/\s*\/>$/, ` width={${w}} height={${h}} />`);
    if (!/\sloading=/.test(out)) out = out.replace(/\s*\/>$/, ' loading="lazy" />');
    if (out.includes('\n')) out = out.replace(/\n\s*loading="lazy"/, '\n          loading="lazy"');
    rewritten.push([tag, out]);
  }
  edit(file, (s) => {
    let out = s;
    for (const [from, to] of rewritten) out = out.replace(from, () => to);
    if (!/import\s*\{\s*Image\s*\}\s*from\s*'astro:assets'/.test(out)) {
      out = out.replace(/^(---\n)/, `$1import { Image } from 'astro:assets';\n`);
    }
    return out;
  });
}

// ---------------------------------------------------------------- Report
const files = [...changed.keys()].sort();
console.log(`\napply-2026-08-11-kz${DRY ? ' (DRY RUN)' : ''}: ${files.length} Datei(en) geaendert\n` + '-'.repeat(64));
for (const f of files) console.log(`  ${f}  (${changed.get(f)} Schritte)`);
for (const n of notes) console.log(`  ! ${n}`);
console.log('');
