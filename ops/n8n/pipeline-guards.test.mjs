// Regression 26.10.2026: freigegebener Montags-Artikel ging nicht online.
// 1) Preise (150/170/210 €) ohne Kindergeburtstag-Bezug → SEO-Gate PR.1 stoppte Auto-Publish still.
// 2) Live-Check wartete bis 12 Min in EINEM Code-Knoten → n8n bricht Code nach 300 s ab, kein Telegram.
// Aufruf: node --test ops/n8n/pipeline-guards.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { priceAllowed, stripPrices, liveStep, LIVE_MAX_TRIES } = require('./pipeline-guards-lib.cjs');

test('Preise erlaubt nur bei Geburtstag-Bezug in Titel oder Beschreibung (wie SEO-Gate PR.1)', () => {
  assert.equal(priceAllowed('Kinderzauberer NRW: Warum regionale Buchung Vorteile hat', 'Kinderzauberer in NRW regional buchen'), false);
  assert.equal(priceAllowed('Was kostet ein Zauberer?', 'Preise für den Kindergeburtstag'), true);
  assert.equal(priceAllowed('Geburtstag im Herbst', ''), true);
});

test('stripPrices entfernt Sätze mit 150/170/210 € und verweist auf /preise/', () => {
  const body = 'Intro.\n\nFür den Kindergeburtstag gibt es einen Festpreis. Die Show kostet 150 € für bis zu 12 Kinder. Dazu kommen Fahrtkosten von 0,40 € pro Kilometer.\n\n### Was kostet es?\n\nDie Zaubershow kostet 150 € Festpreis. Das Komplett-Paket 210 €.\n\n- 💶 Fahrtkosten 0,40 € pro Kilometer\n';
  const r = stripPrices(body);
  assert.equal(/\b(150|170|210)\s?(€|Euro|EUR)/.test(r.body), false);
  assert.ok(r.removed >= 2);
  assert.match(r.body, /Für den Kindergeburtstag gibt es einen Festpreis\./);
  assert.match(r.body, /0,40 € pro Kilometer/, 'Fahrtkosten bleiben');
  assert.match(r.body, /### Was kostet es\?\n\n.*\[Preisseite\]\(\/preise\/\)/, 'leere Antwort wird zum Verweis');
  assert.match(r.body, /Intro\./);
});

test('stripPrices trennt Sätze nicht bei Abkürzungen (ca., z. B., inkl.)', () => {
  const body = 'Die Zaubershow dauert ca. 40 Minuten, eignet sich ab 4 Jahren und kostet 150 € für bis zu ca. 12 Kinder. Dazu kommen z. B. Fahrtkosten inkl. Anfahrt.';
  const r = stripPrices(body);
  assert.equal(r.removed, 1);
  assert.equal(r.body, 'Dazu kommen z. B. Fahrtkosten inkl. Anfahrt. Die aktuellen Preise und Pakete stehen auf meiner [Preisseite](/preise/).');
});

test('stripPrices ändert nichts, wenn keine Preisbeträge vorkommen', () => {
  const body = 'Nur Text ohne Beträge. Fahrtkosten 0,40 € pro km.';
  assert.deepEqual(stripPrices(body), { body, removed: 0 });
});

test('Live-Check: kurze Einzelprüfungen statt einer langen Schleife', () => {
  assert.ok(LIVE_MAX_TRIES >= 10, 'mind. 10 Versuche à 1 Min');
  assert.equal(liveStep(true, 0), 'live');
  assert.equal(liveStep(false, 0), 'retry');
  assert.equal(liveStep(false, LIVE_MAX_TRIES - 2), 'retry');
  assert.equal(liveStep(false, LIVE_MAX_TRIES - 1), 'aufgeben');
  assert.equal(liveStep(true, LIVE_MAX_TRIES - 1), 'live');
});
