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
