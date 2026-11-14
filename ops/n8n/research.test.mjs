// Unit-Tests für die Web-Recherche der Artikel-Pipeline (Spontan-Artikel).
// Aufruf: node --test ops/n8n/research.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { parseResearch, extractImages, researchBlock, researchSummary } = require('./research-lib.cjs');

const MODEL_TEXT = `Hier das Ergebnis:
\`\`\`json
{"orte":[{"name":"Mathias-Jakobs-Stadthalle","adresse":"Friedrichstraße 53, 45964 Gladbeck","parken":"Parkplätze am Gebäude","quelle":"https://www.gladbeck.de/stadthalle"}],
 "termin":{"datum":"","uhrzeit":"","quelle":""},
 "fakten":[{"text":"Die Stadthalle hat rund 900 Plätze.","quelle":"https://www.gladbeck.de/stadthalle"},
           {"text":"Erfundenes ohne Quelle","quelle":""}],
 "widersprueche":["Parken: Reservix sagt Parkplätze müssen in der Umgebung gesucht werden"],
 "quellen":[{"titel":"Stadt Gladbeck","url":"https://www.gladbeck.de/stadthalle"},{"titel":"kaputt","url":"javascript:alert(1)"}]}
\`\`\``;

test('parseResearch liest JSON auch aus Code-Block und Fließtext', () => {
  const r = parseResearch(MODEL_TEXT);
  assert.equal(r.ok, true);
  assert.equal(r.orte[0].adresse, 'Friedrichstraße 53, 45964 Gladbeck');
});

test('parseResearch verwirft Fakten ohne Quelle und unsichere URLs', () => {
  const r = parseResearch(MODEL_TEXT);
  assert.equal(r.fakten.length, 1);
  assert.deepEqual(r.quellen.map(q => q.url), ['https://www.gladbeck.de/stadthalle']);
});

test('parseResearch ohne lesbares JSON liefert leeres Ergebnis statt Fehler', () => {
  const r = parseResearch('Leider nichts gefunden.');
  assert.equal(r.ok, false);
  assert.deepEqual(r.fakten, []);
  assert.deepEqual(r.orte, []);
});

test('extractImages findet og:image und twitter:image, macht relative URLs absolut', () => {
  const html = `<head><meta property="og:image" content="/media/stadthalle.jpg">
    <meta name="twitter:image" content="https://cdn.example.de/plakat-herbstfest.png">
    <meta property="og:image" content="https://www.gladbeck.de/logo.svg"></head>`;
  const imgs = extractImages(html, 'https://www.gladbeck.de/kultur/stadthalle');
  assert.deepEqual(imgs.map(i => i.url), [
    'https://www.gladbeck.de/media/stadthalle.jpg',
    'https://cdn.example.de/plakat-herbstfest.png'
  ]);
  assert.equal(imgs[0].seite, 'https://www.gladbeck.de/kultur/stadthalle');
});

test('extractImages ignoriert Logos, Icons und Nicht-Bilder', () => {
  const html = `<meta property="og:image" content="https://x.de/favicon.ico"><meta property="og:image" content="https://x.de/img/logo-stadt.png"><meta property="og:image" content="https://x.de/foto.webp">`;
  assert.deepEqual(extractImages(html, 'https://x.de/').map(i => i.url), ['https://x.de/foto.webp']);
});

test('extractImages ignoriert Standard-/Platzhalter-Vorschaubilder von Portalen', () => {
  const html = `<meta property="og:image" content="https://p.de/uploads/fpe-vorschaubild-standard-1200x630-1.jpg"><meta property="og:image" content="https://p.de/uploads/default-share.jpg"><meta property="og:image" content="https://p.de/uploads/stadthalle-saal.jpg">`;
  assert.deepEqual(extractImages(html, 'https://p.de/').map(i => i.url), ['https://p.de/uploads/stadthalle-saal.jpg']);
});

test('researchBlock enthält Adresse, Quelle, Widersprüche und Stand-Datum', () => {
  const b = researchBlock(parseResearch(MODEL_TEXT), '2026-10-23');
  assert.match(b, /Friedrichstraße 53, 45964 Gladbeck/);
  assert.match(b, /https:\/\/www\.gladbeck\.de\/stadthalle/);
  assert.match(b, /Widersprüchlich/);
  assert.match(b, /2026-10-23/);
});

test('researchBlock ist leer, wenn nichts gefunden wurde', () => {
  assert.equal(researchBlock(parseResearch('nichts'), '2026-10-23'), '');
});

test('researchSummary zählt Orte, Quellen und Bildfunde für die Vorschau', () => {
  const r = parseResearch(MODEL_TEXT);
  r.bilder = [{ url: 'https://x.de/a.jpg', seite: 'https://x.de/' }];
  const s = researchSummary(r);
  assert.match(s, /1 Ort/);
  assert.match(s, /1 Quelle/);
  assert.match(s, /1 Bildfund/);
});

// --- Regression 14.11.2026: genannte Homepage (Castroper Weihnachtsdorf) wurde nie geöffnet ---
// Die Websuche (openrouter:web_search) liefert nur Suchtreffer (Portale), öffnet aber keine URL aus der Notiz.
// Deshalb lädt die Pipeline jede vom Inhaber genannte Seite selbst und gibt ihren Text als Hauptquelle weiter.
const lib = require('./research-lib.cjs');

test('extractUrls findet URLs und nackte Domains in der Notiz, ohne eigene Seiten und E-Mails', () => {
  const note = 'Artikel übers Castroper Weihnachtsdorf, Infos auf www.weihnachtsdorf-castrop.de/programm. ' +
    'Siehe auch https://www.castrop-rauxel.de/veranstaltungen/weihnachtsdorf). Kontakt info@weihnachtsdorf-castrop.de, ' +
    'mehr bei https://liar-entertainer.com/kindergeburtstag/ und zauberer-liar.de';
  assert.deepEqual(lib.extractUrls(note), [
    'https://www.weihnachtsdorf-castrop.de/programm',
    'https://www.castrop-rauxel.de/veranstaltungen/weihnachtsdorf'
  ]);
});

test('extractUrls versteht diktierte Adressen („punkt de“) und begrenzt auf 3', () => {
  assert.deepEqual(lib.extractUrls('schau auf weihnachtsdorf-castrop punkt de'), ['https://weihnachtsdorf-castrop.de/']);
  assert.equal(lib.extractUrls('a.de b.de c.de d.de').length, 3);
  assert.deepEqual(lib.extractUrls('z. B. um 15 Uhr, ca. 40 Min.'), []);
});

test('htmlToText liefert lesbaren Seitentext ohne Skripte, mit Titel und Entities', () => {
  const html = '<html><head><title>Castroper Weihnachtsdorf</title><meta name="description" content="Am Reiterbrunnen &amp; Marktplatz"><style>.x{}</style>' +
    '<script>var geheim=1</script></head><body><nav>Menü</nav><h1>Öffnungszeiten</h1><p>27.11.&nbsp;bis 23.12.2026<br>täglich 12&#8211;21 Uhr</p></body></html>';
  const t = lib.htmlToText(html);
  assert.match(t, /Castroper Weihnachtsdorf/);
  assert.match(t, /Am Reiterbrunnen & Marktplatz/);
  assert.match(t, /27\.11\. bis 23\.12\.2026/);
  assert.match(t, /täglich 12–21 Uhr/);
  assert.doesNotMatch(t, /geheim|\.x\{\}|</);
  assert.ok(lib.htmlToText('<p>' + 'Wort '.repeat(5000) + '</p>', 500).length <= 501);
});

test('sourcePagesBlock nennt Seite als Hauptquelle mit URL und meldet nicht ladbare Seiten', () => {
  const b = lib.sourcePagesBlock([
    { url: 'https://www.weihnachtsdorf-castrop.de/', ok: true, text: 'täglich 12–21 Uhr' },
    { url: 'https://kaputt.de/', ok: false, fehler: 'HTTP 404', text: '' }
  ], '2026-11-14');
  assert.match(b, /VOM INHABER GENANNTE SEITE/);
  assert.match(b, /https:\/\/www\.weihnachtsdorf-castrop\.de\//);
  assert.match(b, /täglich 12–21 Uhr/);
  assert.match(b, /kaputt\.de.*nicht geladen/);
  assert.equal(lib.sourcePagesBlock([], '2026-11-14'), '');
});

test('buildResearchPrompt stellt die geladene Seite als Hauptquelle vor die Websuche', () => {
  const p = { today_de: 'Samstag', iso: '2026-11-14', topic_text: 'Weihnachtsdorf www.weihnachtsdorf-castrop.de' };
  const pages = [{ url: 'https://www.weihnachtsdorf-castrop.de/', ok: true, text: 'täglich 12–21 Uhr' }];
  const pr = lib.buildResearchPrompt(p, pages);
  assert.match(pr, /täglich 12–21 Uhr/);
  assert.match(pr, /Hauptquelle/);
  assert.ok(pr.indexOf('täglich 12–21 Uhr') < pr.indexOf('Antworte NUR'));
  assert.doesNotMatch(lib.buildResearchPrompt(p, []), /VOM INHABER GENANNTE SEITE/);
});

test('fullResearchBlock gibt den Seitentext auch dann an den Artikel, wenn die Websuche nichts fand', () => {
  const pages = [{ url: 'https://www.weihnachtsdorf-castrop.de/', ok: true, text: 'täglich 12–21 Uhr' }];
  const b = lib.fullResearchBlock(parseResearch('nichts'), pages, '2026-11-14');
  assert.match(b, /RECHERCHE IM INTERNET/);
  assert.match(b, /täglich 12–21 Uhr/);
  const r = lib.withOwnerSources(parseResearch(MODEL_TEXT), pages);
  assert.equal(r.quellen[0].url, 'https://www.weihnachtsdorf-castrop.de/');
});

test('Pipeline lädt genannte Seiten selbst und gibt sie an Recherche und Artikel', async () => {
  const { readFileSync } = await import('node:fs');
  const sdk = readFileSync(new URL('./artikel-pipeline.sdk.js', import.meta.url), 'utf8');
  const node = (name) => { const i = sdk.indexOf("name: '" + name + "'"); return sdk.slice(i, sdk.indexOf('output:', i)); };
  const prep = node('Recherche vorbereiten');
  assert.match(prep, /extractUrls\(/);
  assert.match(prep, /httpRequest/);
  assert.match(prep, /buildResearchPrompt\(/);
  assert.match(node('Recherche auswerten'), /fullResearchBlock\(/);
});

test('Artikel-Prompt lässt Inhalte der genannten Seite in den Artikeltext einfließen (nicht nur Anreise)', async () => {
  const { readFileSync } = await import('node:fs');
  const sdk = readFileSync(new URL('./artikel-pipeline.sdk.js', import.meta.url), 'utf8');
  const i = sdk.indexOf("name: 'Prompt bauen'");
  const prompt = sdk.slice(i, sdk.indexOf('output:', i));
  assert.match(prompt, /VOM INHABER GENANNTE SEITE[^']*(Termine|Öffnungszeiten)[^']*im Artikel/);
});
