// Unit-Tests: LinkedIn-Beitrag mit Artikelbild als Vorschau (Images-API → article.thumbnail).
// Aufruf: node --test ops/n8n/linkedin.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { buildInitUpload, imageUrnFrom, buildLinkedInPost, linkedinReport } = require('./linkedin-lib.cjs');

const ARTIKEL = {
  sub: 'abc123',
  text: 'Am Sonntag bin ich als Pantomime im Marler Stern.',
  url: 'https://liar-entertainer.com/blog/pantomime-antikmarkt-marler-stern-november/',
  title: 'Pantomime im Marler Stern: Antikmarkt am 8. November 🎭✨',
  description: 'Am Sonntag, 8. November 2026, bin ich von 14 bis 18 Uhr als Pantomime beim Antikmarkt im Marler Stern.'
};
const INIT_OK = { statusCode: 200, body: { value: { uploadUrl: 'https://www.linkedin.com/dms-uploads/x', image: 'urn:li:image:C4E10AQ' } } };
const UPLOAD_OK = { statusCode: 201, body: '' };

test('Bild-Anmeldung gehört dem eigenen Profil', () => {
  assert.deepEqual(buildInitUpload('abc123'), { initializeUploadRequest: { owner: 'urn:li:person:abc123' } });
});

test('Bild-URN nur, wenn Anmeldung UND Upload geklappt haben', () => {
  assert.equal(imageUrnFrom(INIT_OK, UPLOAD_OK), 'urn:li:image:C4E10AQ');
  assert.equal(imageUrnFrom(INIT_OK, { statusCode: 400, body: { message: 'bad' } }), '');
  assert.equal(imageUrnFrom({ statusCode: 401, body: {} }, UPLOAD_OK), '');
  assert.equal(imageUrnFrom(null, null), '');
  assert.equal(imageUrnFrom({ statusCode: 200, body: { value: {} } }, UPLOAD_OK), '');
});

test('Beitrag zeigt das Artikelbild als Vorschau (article.thumbnail)', () => {
  const b = buildLinkedInPost({ ...ARTIKEL, imageUrn: 'urn:li:image:C4E10AQ' });
  assert.equal(b.author, 'urn:li:person:abc123');
  assert.equal(b.commentary, ARTIKEL.text);
  assert.equal(b.content.article.source, ARTIKEL.url);
  assert.equal(b.content.article.title, ARTIKEL.title);
  assert.equal(b.content.article.thumbnail, 'urn:li:image:C4E10AQ');
  assert.equal(b.visibility, 'PUBLIC');
  assert.equal(b.lifecycleState, 'PUBLISHED');
  assert.equal(b.distribution.feedDistribution, 'MAIN_FEED');
});

test('ohne Bild-URN trotzdem gültiger Beitrag (nur ohne Vorschaubild)', () => {
  const b = buildLinkedInPost({ ...ARTIKEL, imageUrn: '' });
  assert.equal('thumbnail' in b.content.article, false);
  assert.equal(b.content.article.source, ARTIKEL.url);
});

test('Titel und Beschreibung werden auf LinkedIn-Grenzen gekürzt', () => {
  const b = buildLinkedInPost({ ...ARTIKEL, title: 'T'.repeat(500), description: 'D'.repeat(500), imageUrn: '' });
  assert.ok(b.content.article.title.length <= 200);
  assert.ok(b.content.article.description.length <= 256);
});

test('Bericht: ok mit Vorschaubild / ok ohne Bild / Zugang abgelaufen / Fehler', () => {
  const me = { sub: 'abc123' };
  assert.equal(linkedinReport(me, { statusCode: 201 }, 'urn:li:image:1'), 'ok (mit Vorschaubild)');
  assert.equal(linkedinReport(me, { statusCode: 201 }, ''), 'ok, aber OHNE Vorschaubild (Bild-Upload fehlgeschlagen)');
  assert.equal(linkedinReport(null, null, ''), 'FEHLER LinkedIn-Zugang abgelaufen – Credential in n8n neu verbinden');
  assert.match(linkedinReport(me, { statusCode: 422, body: { message: 'kaputt' } }, ''), /^FEHLER .*kaputt/);
});
