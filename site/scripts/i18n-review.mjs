#!/usr/bin/env node
/**
 * Review aid for the owner: DE | FR | EN side by side for every translated page, read from the
 * built dist/ (so it shows exactly what will go live). Output: ../docs/i18n-review.html
 *
 *   npm run build && npm run i18n:review
 *
 * Blocks are paired by order (headings, paragraphs, list items, buttons, labels, alt texts …).
 * Mismatched block counts are flagged; rows where FR/EN equal the German text are tinted
 * (expected for names and the German customer reviews, suspicious anywhere else).
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import * as cheerio from 'cheerio';
import { TRANSLATED_PAGES } from '../src/lib/site-map.ts';

const ROOT = join(import.meta.dirname, '..');
const DIST = join(ROOT, 'dist');
const OUT = join(ROOT, '..', 'docs', 'i18n-review.html');
const SKIP = 'script, style, svg, template, noscript';
const LD_TEXT = new Set(['name', 'description', 'text', 'serviceType', 'caption', 'headline', 'alternateName']);
const clean = (s) => s.replace(/\s+/g, ' ').trim();
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Visible text blocks of a page region in document order: [{ kind, text }] */
function blocks($, root) {
  const out = [];
  const visit = (el) => {
    if ($(el).is(SKIP)) return;
    for (const a of ['alt', 'aria-label', 'placeholder', 'title']) {
      const v = clean($(el).attr(a) ?? '');
      if (v && /\p{L}/u.test(v)) out.push({ kind: a === 'alt' ? 'Bild-Alt' : a, text: v });
    }
    const own = el.children.some((c) => c.type === 'text' && /\S/.test(c.data));
    if (own) {
      const text = clean($(el).text());
      if (/\p{L}/u.test(text)) out.push({ kind: el.tagName, text });
      $(el).find('[alt], [aria-label], [placeholder]').each((_, x) => {
        for (const a of ['alt', 'aria-label', 'placeholder']) {
          const v = clean($(x).attr(a) ?? '');
          if (v && /\p{L}/u.test(v)) out.push({ kind: a === 'alt' ? 'Bild-Alt' : a, text: v });
        }
      });
      return;
    }
    for (const c of el.children) if (c.type === 'tag') visit(c);
  };
  if (root) visit(root);
  return out;
}

function head($) {
  return [
    { kind: 'Title', text: clean($('title').text()) },
    { kind: 'Meta-Description', text: clean($('meta[name=description]').attr('content') ?? '') },
  ];
}

function structured($) {
  const out = [];
  $('script[type="application/ld+json"]').each((_, s) => {
    const walk = (v, key) => {
      if (typeof v === 'string') {
        if (key && LD_TEXT.has(key) && /\p{L}/u.test(v) && !/^https?:/.test(v)) out.push({ kind: `JSON-LD ${key}`, text: clean(v) });
      } else if (Array.isArray(v)) v.forEach((x) => walk(x, key));
      else if (v && typeof v === 'object') {
        if (typeof v['@id'] === 'string' && /#(business|website|person)$/.test(v['@id'])) return;
        for (const [k, x] of Object.entries(v)) walk(x, k);
      }
    };
    walk(JSON.parse($(s).html()));
  });
  return out;
}

function load(path) {
  const file = join(DIST, path, 'index.html');
  if (!existsSync(file)) return null;
  const $ = cheerio.load(readFileSync(file, 'utf8'));
  // German-only blocks (blog news) and the language switcher (only on FR/EN while unpublished) do not pair up
  $('[data-i18n="drop"], .sh__lang').remove();
  return $;
}

function table(title, cols) {
  const n = Math.max(...cols.map((c) => c.length));
  const counts = cols.map((c) => c.length);
  const mismatch = new Set(counts).size > 1;
  let rows = '';
  for (let i = 0; i < n; i++) {
    const [d, f, e] = cols.map((c) => c[i]);
    const same = (x) => x && d && x.text === d.text;
    const kindMismatch = [f, e].some((x) => x && d && x.kind !== d.kind);
    rows += `<tr${kindMismatch || !d || !f || !e ? ' class="bad"' : ''}><td class="k">${esc(d?.kind ?? f?.kind ?? e?.kind ?? '')}</td>`;
    rows += [d, f, e].map((x, j) => `<td${j && same(x) ? ' class="same"' : ''}>${x ? esc(x.text) : '<em>— fehlt —</em>'}</td>`).join('') + '</tr>';
  }
  return `<h3>${esc(title)}${mismatch ? ` <span class="warn">Anzahl Blöcke ungleich: DE ${counts[0]} · FR ${counts[1]} · EN ${counts[2]}</span>` : ''}</h3>
<table><thead><tr><th></th><th>DE</th><th>FR</th><th>EN</th></tr></thead><tbody>${rows}</tbody></table>`;
}

let body = '';
let toc = '';
const missing = [];
for (const entry of TRANSLATED_PAGES) {
  const pages = ['de', 'fr', 'en'].map((l) => load(entry[l]));
  if (pages.some((p) => !p)) {
    missing.push(entry.de);
    continue;
  }
  const id = entry.de.replace(/\W+/g, '-').replace(/^-|-$/g, '') || 'start';
  toc += `<li><a href="#${id}">${esc(entry.de)}</a> · ${esc(entry.fr)} · ${esc(entry.en)}</li>`;
  body += `<section id="${id}"><h2>${esc(entry.de)} <small>${esc(entry.fr)} · ${esc(entry.en)}</small></h2>`;
  body += table('Kopf (Suchergebnis)', pages.map(head));
  body += table('Seiteninhalt', pages.map(($) => blocks($, $('main').get(0))));
  body += table('Strukturierte Daten (für Google, unsichtbar)', pages.map(structured));
  body += '</section>';
}

// shared chrome once (from the home page): header, footer, quick-contact bar, cookie banner
{
  const pages = ['de', 'fr', 'en'].map((l) => load(TRANSLATED_PAGES[0][l]));
  if (pages.every(Boolean)) {
    const chrome = ($) => ['header', '#cookie-consent', 'footer', '[data-sticky-cta]'].flatMap((sel) => blocks($, $(sel).get(0)));
    toc += '<li><a href="#chrome">Kopfzeile, Fußzeile, Cookie-Hinweis (alle Seiten)</a></li>';
    body += `<section id="chrome"><h2>Kopfzeile, Fußzeile, Cookie-Hinweis <small>auf allen Seiten gleich</small></h2>${table('Rahmen', pages.map(chrome))}</section>`;
  }
}

const html = `<!doctype html>
<html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Übersetzungen prüfen – FR/EN</title>
<style>
  :root { color-scheme: light; font-family: system-ui, sans-serif; line-height: 1.45; }
  body { margin: 0 auto; padding: 1.5rem; max-width: 110rem; background: #faf8f4; color: #1d1b18; }
  h1 { margin-top: 0; } h2 { margin-top: 3rem; border-bottom: 2px solid #c9a24a; padding-bottom: .3rem; }
  h2 small { font-weight: 400; color: #6b645a; font-size: .8em; }
  h3 { margin: 1.6rem 0 .5rem; font-size: 1rem; text-transform: uppercase; letter-spacing: .05em; color: #6b645a; }
  table { width: 100%; border-collapse: collapse; table-layout: fixed; background: #fff; font-size: .92rem; }
  th, td { border: 1px solid #e3ddd2; padding: .45rem .6rem; vertical-align: top; text-align: left; overflow-wrap: anywhere; }
  th { background: #f0ebe1; } th:first-child, td.k { width: 7.5rem; color: #8a8276; font-size: .78rem; }
  td.same { background: #fff6d6; } tr.bad td { background: #ffe1df; }
  .warn { background: #c62828; color: #fff; padding: .1rem .5rem; border-radius: .3rem; font-size: .8rem; text-transform: none; letter-spacing: 0; }
  .note { background: #fff; border-left: 4px solid #c9a24a; padding: .8rem 1rem; }
  @media (max-width: 800px) { body { padding: .75rem; } table { font-size: .8rem; } }
</style></head><body>
<h1>Übersetzungen prüfen – Französisch &amp; Englisch</h1>
<div class="note">
  <p>Erzeugt aus dem fertigen Build (<code>npm run build &amp;&amp; npm run i18n:review</code>), Stand ${new Date().toISOString().slice(0, 10)}. Jede Zeile ist ein Textblock der Seite in derselben Reihenfolge wie auf der Seite.</p>
  <p><span style="background:#fff6d6">Gelb</span> = FR/EN gleich wie Deutsch (richtig bei Namen und bei den deutschen Google-Bewertungen, die als Zitat stehen bleiben). <span style="background:#ffe1df">Rot</span> = Blöcke passen nicht zueinander.</p>
  <p>Korrekturen: Datei <code>site/src/i18n/strings/&lt;seite&gt;.json</code>, Feld <code>fr</code> bzw. <code>en</code>. Freigabe: <code>PUBLISHED_LOCALES</code> in <code>site/src/lib/site-map.ts</code> um <code>'fr'</code>/<code>'en'</code> ergänzen.</p>
  ${missing.length ? `<p class="warn">Nicht gebaut: ${esc(missing.join(', '))}</p>` : ''}
</div>
<ul>${toc}</ul>
${body}
</body></html>
`;
writeFileSync(OUT, html);
console.log(`i18n review: ${OUT} (${TRANSLATED_PAGES.length - missing.length} pages${missing.length ? `, missing: ${missing.join(', ')}` : ''})`);
if (missing.length) process.exitCode = 1;
