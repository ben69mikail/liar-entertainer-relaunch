// Unit-Tests: Bild-KI bestimmt Kopf + Oberkörper im Titelbild, Pipeline schreibt heroFocus ins Frontmatter.
// Aufruf: node --test ops/n8n/focus.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { parseFocusReply, injectFocus } = require('./focus-lib.cjs');

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
