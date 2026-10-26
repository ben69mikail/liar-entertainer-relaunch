// Unit-Tests: Bild-KI bestimmt Kopf + Oberkörper im Titelbild, Pipeline schreibt heroFocus ins Frontmatter.
// Aufruf: node --test ops/n8n/focus.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { parseFocusReply, injectFocus, assessCover, pickCover, swapCover } = require('./focus-lib.cjs');

const MD = '---\ntitle: "X"\nheroImage: "https://liar-entertainer.com/blog-images/x/cover.jpg"\nheroImageAlt: "Pantomime"\ncategories: ["Termine"]\ndraft: true\n---\n\nText\n';

test('liest Fokus aus der KI-Antwort (auch mit Text drumherum)', () => {
  assert.deepEqual(parseFocusReply('Hier: {"x": 49, "top": 23, "bottom": 59, "personen": 1}'), { x: 49, top: 23, bottom: 59 });
});

test('verwirft unplausible Antworten', () => {
  assert.equal(parseFocusReply('{"x": 49, "top": 70, "bottom": 20}'), null);
  assert.equal(parseFocusReply('{"x": 140, "top": 10, "bottom": 50}'), null);
  assert.equal(parseFocusReply('kein JSON'), null);
  assert.equal(parseFocusReply(''), null);
});

test('rundet auf ganze Prozent', () => {
  assert.deepEqual(parseFocusReply('{"x": 48.6, "top": 22.4, "bottom": 59.5}'), { x: 49, top: 22, bottom: 60 });
});

test('schreibt heroFocus direkt unter heroImageAlt ins Frontmatter', () => {
  const out = injectFocus(MD, { x: 49, top: 23, bottom: 59 });
  assert.match(out, /heroImageAlt: "Pantomime"\nheroFocus: \{ x: 49, top: 23, bottom: 59 \}\ncategories/);
  assert.match(out, /\n---\n\nText\n$/);
});

test('ersetzt einen vorhandenen heroFocus statt ihn zu verdoppeln', () => {
  const once = injectFocus(MD, { x: 10, top: 10, bottom: 50 });
  const twice = injectFocus(once, { x: 49, top: 23, bottom: 59 });
  assert.equal((twice.match(/heroFocus:/g) || []).length, 1);
  assert.match(twice, /heroFocus: \{ x: 49, top: 23, bottom: 59 \}/);
});

test('ohne Fokus bleibt der Text unverändert', () => {
  assert.equal(injectFocus(MD, null), MD);
});

// Regression 26.10.2026: Antwort wegen max_tokens abgeschnitten → kein heroFocus; Kopf war im Foto abgeschnitten.
const ABGESCHNITTEN = '{"x": 62, "top": 0, "bottom": 80, "personen": 2, "beschreibung": "Ein Mann in blau-karierter Kleidung (Clown oder Zauberer) hält ein rotes Tuch und streckt die Hand aus. Ein';

test('liest Fokus auch aus abgeschnittener KI-Antwort', () => {
  assert.deepEqual(parseFocusReply(ABGESCHNITTEN), { x: 62, top: 0, bottom: 80 });
});

test('Titelbild-Prüfung: Kopf abgeschnitten oder Kindergesicht nah → nicht als Titelbild', () => {
  assert.equal(assessCover('{"x":50,"top":12,"bottom":70,"kopf_ganz":true,"kind_gesicht_nah":false}').ok, true);
  const a = assessCover('{"x":50,"top":2,"bottom":70,"kopf_ganz":false,"kind_gesicht_nah":false}');
  assert.equal(a.ok, false);
  assert.match(a.grund, /Kopf/);
  assert.match(assessCover('{"x":50,"top":12,"bottom":70,"kopf_ganz":true,"kind_gesicht_nah":true}').grund, /Kind/);
  assert.equal(assessCover(ABGESCHNITTEN).ok, false, 'top 0 ohne Angabe = Kopf am Bildrand');
  assert.equal(assessCover('kaputt').ok, false);
});

test('pickCover: erstes Foto mit ganzem Kopf, Titelbild bevorzugt', () => {
  const ok = '{"x":50,"top":12,"bottom":70,"kopf_ganz":true,"kind_gesicht_nah":false}';
  const bad = '{"x":50,"top":0,"bottom":70,"kopf_ganz":false,"kind_gesicht_nah":false}';
  assert.equal(pickCover([ok, bad]), 0);
  assert.equal(pickCover([bad, bad, ok]), 2);
  assert.equal(pickCover([bad, bad]), -1);
});

test('swapCover tauscht Titelbild-Alt und Bild-Alt im Text', () => {
  const md = '---\nheroImage: "https://x/blog-images/s/cover.jpg"\nheroImageAlt: "Alt Cover"\n---\n\n![Alt Eins](https://x/blog-images/s/inline-1.jpg)\n';
  const out = swapCover(md, 'inline-1.jpg');
  assert.match(out, /heroImageAlt: "Alt Eins"/);
  assert.match(out, /!\[Alt Cover\]\(https:\/\/x\/blog-images\/s\/inline-1\.jpg\)/);
});
