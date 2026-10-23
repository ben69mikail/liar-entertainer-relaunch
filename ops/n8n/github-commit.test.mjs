// Unit-Tests: alle Dateien eines Artikels als EIN Commit (Git Data API) statt einzelner PUTs.
// Hintergrund: Einzel-PUTs kurz nacheinander → GitHub 409 („is at … but expected …“), Artikel fehlte.
// Aufruf: node --test ops/n8n/github-commit.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { buildTreeRequest, checkStep } = require('./github-commit-lib.cjs');

const files = [
  { path: 'site/public/blog-images/x/cover.jpg', message: 'Bild' },
  { path: 'site/public/blog-images/x/inline-1.jpg', message: 'Bild' },
  { path: 'site/src/content/blog/x.md', message: 'blog(n8n): x – freigegeben (Telegram) [skip netlify]' }
];
const blobs = [
  { statusCode: 201, body: { sha: 'aaa' } },
  { statusCode: 201, body: { sha: 'bbb' } },
  { statusCode: 201, body: { sha: 'ccc' } }
];

test('baut einen Baum mit allen Dateien in einem Schritt', () => {
  const r = buildTreeRequest(files, blobs, { object: { sha: 'head1' } }, { tree: { sha: 'tree1' } });
  assert.equal(r.base_tree, 'tree1');
  assert.equal(r.parent, 'head1');
  assert.deepEqual(r.tree.map(t => [t.path, t.sha, t.mode, t.type]), [
    ['site/public/blog-images/x/cover.jpg', 'aaa', '100644', 'blob'],
    ['site/public/blog-images/x/inline-1.jpg', 'bbb', '100644', 'blob'],
    ['site/src/content/blog/x.md', 'ccc', '100644', 'blob']
  ]);
});

test('Commit-Nachricht kommt von der Artikel-Datei (.md)', () => {
  const r = buildTreeRequest(files, blobs, { object: { sha: 'h' } }, { tree: { sha: 't' } });
  assert.match(r.message, /^blog\(n8n\): x – freigegeben/);
  assert.match(r.message, /\[skip netlify\]/);
});

test('bricht mit klarer Meldung ab, wenn ein Blob fehlt (nichts wird halb committet)', () => {
  const bad = [blobs[0], { statusCode: 403, body: { message: 'Resource not accessible' } }, blobs[2]];
  assert.throws(() => buildTreeRequest(files, bad, { object: { sha: 'h' } }, { tree: { sha: 't' } }), /inline-1\.jpg.*403/);
});

test('bricht ab, wenn Anzahl Dateien und Blobs nicht passt', () => {
  assert.throws(() => buildTreeRequest(files, blobs.slice(0, 2), { object: { sha: 'h' } }, { tree: { sha: 't' } }), /3 Dateien, 2 Blobs/);
});

test('checkStep akzeptiert 2xx und meldet sonst Schritt + Status', () => {
  assert.deepEqual(checkStep('Commit', { statusCode: 201, body: { sha: 'c1' } }), { sha: 'c1' });
  assert.throws(() => checkStep('Branch setzen', { statusCode: 422, body: { message: 'Update is not a fast forward' } }), /Branch setzen.*422.*fast forward/);
});
