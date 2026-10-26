// Zielseiten-Pflicht: Artikel ohne Link auf eine Leistungsseite wird nicht veröffentlicht.
// Aufruf: node --test ops/n8n/target.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { isTargetPath, findTargetLinks, targetCheck } = require('./target-lib.cjs');

test('Leistungsseiten zählen, Blog/Kontakt/Rechtliches nicht', () => {
  for (const p of ['/', '/kindergeburtstag/', '/kinderzauberer/kinderzauberer-in-dortmund/', '/preise/', '/clown/clownshow/',
    '/zauberer/', '/zauberer/zaubershow/schule/', '/zauberer/zauberer-in-bottrop/', '/zauberer/close-up/']) assert.equal(isTargetPath(p), true, p);
  for (const p of ['/kontakt/', '/blog/', '/blog/kategorie/pantomime-nrw/', '/impressum/', '/datenschutzerklaerung-2/', '/agbs/',
    '/galerie/', '/ueber-mich/', '/blog-images/x/cover.jpg', '/kontakt/danke/', '/fr/', '/en/magicien/']) assert.equal(isTargetPath(p), false, p);
});

test('findet relative und absolute interne Links, ignoriert Bilder und Anker', () => {
  const body = 'Text [Zaubershow](/zauberer/zaubershow/) und [Preise](https://liar-entertainer.com/preise/#pakete).\n' +
    '![Foto](https://liar-entertainer.com/blog-images/x/inline-1.jpg) [Kontakt](/kontakt/) [Kat](/blog/kategorie/x/)';
  assert.deepEqual(findTargetLinks(body), ['/zauberer/zaubershow/', '/preise/']);
});

test('www-Variante und fehlender Schrägstrich werden normalisiert', () => {
  assert.deepEqual(findTargetLinks('[a](https://www.liar-entertainer.com/zauberer)'), ['/zauberer/']);
});

test('Pantomime-Seite zählt als Zielseite', () => {
  assert.deepEqual(findTargetLinks('[Pantomime](https://www.pantomime-la-france.eu/)'), ['https://www.pantomime-la-france.eu/']);
});

test('fremde Domains zählen nicht', () => {
  assert.deepEqual(findTargetLinks('[Stadt](https://www.gladbeck.de/zauberer/)'), []);
});

test('targetCheck: blockiert ohne Leistungslink, mit Begründung', () => {
  const r = targetCheck('Nur [Kontakt](/kontakt/).');
  assert.equal(r.ok, false);
  assert.match(r.reason, /Leistungsseite/);
  assert.equal(targetCheck('Siehe [Kindergeburtstag](/kindergeburtstag/).').ok, true);
});

test('targetCheck: Plan-Artikel braucht genau die geplante Ziel-Seite', () => {
  const r = targetCheck('Siehe [Kindergeburtstag](/kindergeburtstag/).', '/zauberer/zaubershow/schule/');
  assert.equal(r.ok, false);
  assert.match(r.reason, /schule/);
  assert.equal(targetCheck('[Schule](/zauberer/zaubershow/schule/)', '/zauberer/zaubershow/schule/').ok, true);
});
