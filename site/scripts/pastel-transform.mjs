// Pastell-Transformation für alle Seiten (Redesign-Auftrag 2026-06-10)
// - Wave-/Curve-SVGs entfernen
// - Vollfarb-Sektionen (blau/rot) → Pastell (#eff4ff / #fdf2f2) mit Kontrast-sicheren Textfarben
// - Full-Bleed-Heroes → gerundete Bild-Karte im zentrierten Container
// - Gold-Buttons: weißer Text → dunkler Text (Kontrastfix)
// Ausführen: node scripts/pastel-transform.mjs [--dry]

import { readdirSync, statSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const DRY = process.argv.includes('--dry');
const pagesDir = fileURLToPath(new URL('../src/pages', import.meta.url));

function walkAstro(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walkAstro(p, out);
    else if (name.endsWith('.astro')) out.push(p);
  }
  return out;
}

// Textfarben innerhalb einer Pastell-Sektion umstellen — pro class-Attribut,
// damit Buttons mit dunklem Hintergrund ihren weißen Text behalten.
const DARK_BG = /bg-\[#(d7393e|b62e32|3b55d5|2a3fa8|1f2025)\]|bg-black/;
const GOLD_BG = /bg-\[#(ffb546|e69420|f5a623)\]/;

function recolorBody(body, bodyTextColor) {
  return body.replace(/class="([^"]*)"/g, (m, cls) => {
    let c = cls;
    if (GOLD_BG.test(c)) {
      c = c.replace(/\btext-white\b/g, 'text-[#1f2025]');
    } else if (!DARK_BG.test(c)) {
      c = c.replace(/\btext-white\b/g, 'text-[#1f2025]');
    }
    c = c.replace(/\btext-blue-100\b/g, bodyTextColor);
    c = c.replace(/\btext-red-100\b/g, bodyTextColor);
    return `class="${c}"`;
  });
}

function transformColoredSections(src, stats) {
  // Blau → Soft-Blau
  src = src.replace(
    /<section class="([^"]*bg-\[#3b55d5\][^"]*)"([^>]*)>([\s\S]*?)<\/section>/g,
    (m, cls, attrs, body) => {
      stats.blue++;
      let c = cls
        .replace(/bg-\[#3b55d5\]/, 'bg-[#eff4ff]')
        .replace(/\btext-white\b/g, '')
        .replace(/\s+/g, ' ')
        .trim();
      if (!c.includes('border-y border-[#c5d3f7]')) c += ' border-y border-[#c5d3f7]';
      let b = body
        // weiße Buttons auf Blau → blaue Buttons auf Pastell
        .replace(/\bbg-white text-\[#3b55d5\]/g, 'bg-[#3b55d5] text-white')
        .replace(/\bhover:bg-gray-100\b/g, 'hover:bg-[#2a3fa8]')
        // halbtransparente weiße Karten → weiße Karten mit Border
        .replace(/\bbg-white\/(10|15|20)\b/g, 'bg-white border border-[#c5d3f7]')
        .replace(/\bborder border-white\/30\b/g, 'border border-[#c5d3f7]')
        // Gold-Eyebrows auf Blau → Rot auf Pastell
        .replace(/\btext-\[#ffb546\]/g, 'text-[#d7393e]');
      b = recolorBody(b, 'text-[#374151]');
      return `<section class="${c}"${attrs}>${b}</section>`;
    }
  );

  // Rot → Soft-Rosa
  src = src.replace(
    /<section class="([^"]*bg-\[#d7393e\][^"]*)"([^>]*)>([\s\S]*?)<\/section>/g,
    (m, cls, attrs, body) => {
      stats.red++;
      let c = cls
        .replace(/bg-\[#d7393e\]/, 'bg-[#fdf2f2]')
        .replace(/\btext-white\b/g, '')
        .replace(/\s+/g, ' ')
        .trim();
      if (!c.includes('border-y border-[#f0c4c4]')) c += ' border-y border-[#f0c4c4]';
      let b = body
        .replace(/\bbg-transparent border border-white\/30\b/g, 'bg-white border border-[#f0c4c4] shadow-sm')
        .replace(/\bbg-white\/(10|15|20)\b/g, 'bg-white border border-[#f0c4c4]')
        .replace(/\bbg-white text-\[#d7393e\]/g, 'bg-[#d7393e] text-white')
        .replace(/\bhover:bg-gray-100\b/g, 'hover:bg-[#b62e32]')
        // Stats-Zahlen + Labels einfärben (erbten vorher Weiß von der Sektion)
        .replace(/class="text-4xl font-extrabold"/g, 'class="text-4xl font-extrabold text-[#d7393e]"')
        .replace(/class="text-sm mt-1"/g, 'class="text-sm mt-1 text-[#374151]"');
      b = recolorBody(b, 'text-[#374151]');
      return `<section class="${c}"${attrs}>${b}</section>`;
    }
  );
  return src;
}

let totals = { files: 0, waves: 0, blue: 0, red: 0, heroes: 0, gold: 0 };

for (const file of walkAstro(pagesDir)) {
  let src = readFileSync(file, 'utf8');
  const orig = src;
  const stats = { blue: 0, red: 0 };

  // 1. Wave-Kommentare + Wave-Divs entfernen
  const waveCount = (src.match(/Q720,60/g) ?? []).length;
  src = src.replace(/[ \t]*<!--[^\n]*[Ww]ave[^\n]*-->\r?\n/g, '');
  src = src.replace(
    /\r?\n?[ \t]*<div style="overflow:hidden;line-height:0;?[^"]*">\s*<svg viewBox="0 0 1440 60"[\s\S]*?<\/svg>\s*<\/div>/g,
    ''
  );

  // 2. Vollfarb-Sektionen → Pastell
  src = transformColoredSections(src, stats);

  // 3. Hero: Full-Bleed → gerundete Karte im Container
  let heroes = 0;
  src = src.replace(
    /<section class="relative overflow-hidden" style="min-height: (\d+)px;">([\s\S]*?)<\/section>/g,
    (m, h, body) => {
      heroes++;
      const inner = body
        .replace(/sizes="100vw"/g, 'sizes="(max-width: 1152px) 100vw, 1120px"')
        .replace(/style="min-height: (\d+)px;"/g, 'style="min-height: $1px;"');
      return (
        `<section class="bg-white pt-6 sm:pt-8">\n` +
        `    <div class="max-w-6xl mx-auto px-4">\n` +
        `      <div class="relative overflow-hidden rounded-3xl" style="min-height: ${h}px; box-shadow: 0 12px 32px rgba(0,0,0,0.14);">` +
        inner +
        `</div>\n    </div>\n  </section>`
      );
    }
  );
  // restliche sizes="100vw" (Heroes ohne Standard-Pattern)
  src = src.replace(/sizes="100vw"/g, 'sizes="(max-width: 1152px) 100vw, 1120px"');

  // 4. Gold-Buttons global: weißer Text → dunkel (Kontrast 1.7:1 → 8:1)
  let gold = 0;
  src = src.replace(/class="([^"]*)"/g, (m, cls) => {
    if (GOLD_BG.test(cls) && /\btext-white\b/.test(cls)) {
      gold++;
      return `class="${cls.replace(/\btext-white\b/g, 'text-[#1f2025]')}"`;
    }
    return m;
  });

  if (src !== orig) {
    totals.files++;
    totals.waves += waveCount;
    totals.blue += stats.blue;
    totals.red += stats.red;
    totals.heroes += heroes;
    totals.gold += gold;
    if (!DRY) writeFileSync(file, src);
    console.log(
      `${DRY ? '[dry] ' : ''}${file.replace(pagesDir, '')}: waves=${waveCount} blau=${stats.blue} rot=${stats.red} hero=${heroes} gold=${gold}`
    );
  }
}

console.log(
  `\nGesamt: ${totals.files} Dateien, ${totals.waves} Waves, ${totals.blue} blaue + ${totals.red} rote Sektionen, ${totals.heroes} Heroes, ${totals.gold} Gold-Buttons`
);
