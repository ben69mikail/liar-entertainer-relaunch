// Unit-Tests für den Story-Workflow (LIAR-2026-06 Story-Repost): Video-Story mit Musik, Fallback Bild.
// Aufruf: node --test ops/n8n/story.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const s = require('./story-lib.cjs');

const IMG = 'https://liar-entertainer.com/story-generated/adventskalender-kinder-24-ideen-selbermachen.jpg';

test('videoUrlFor leitet die MP4 aus dem Story-Bild ab', () => {
  assert.equal(s.videoUrlFor(IMG), 'https://liar-entertainer.com/story-generated/adventskalender-kinder-24-ideen-selbermachen.mp4');
  assert.equal(s.videoUrlFor('https://x.de/bild.jpg'), '');
  assert.equal(s.videoUrlFor(''), '');
});

test('Instagram-Video-Story: Container mit video_url und media_type STORIES', () => {
  assert.deepEqual(s.igContainerBody({ videoUrl: 'v.mp4', imageUrl: IMG, token: 't' }), { video_url: 'v.mp4', media_type: 'STORIES', access_token: 't' });
  assert.deepEqual(s.igContainerBody({ videoUrl: '', imageUrl: IMG, token: 't' }), { image_url: IMG, media_type: 'STORIES', access_token: 't' });
});

test('Instagram: auf fertige Video-Verarbeitung warten, dann veröffentlichen', () => {
  assert.equal(s.igStatusStep({ status_code: 'FINISHED' }, 0), 'publish');
  assert.equal(s.igStatusStep({ status_code: 'IN_PROGRESS' }, 0), 'wait');
  assert.equal(s.igStatusStep({ status_code: 'IN_PROGRESS' }, s.IG_MAX_CHECKS - 1), 'fehler');
  assert.equal(s.igStatusStep({ status_code: 'ERROR', status: 'Error: bad codec' }, 1), 'fehler');
  assert.equal(s.igStatusStep({ error: { message: 'x' } }, 0), 'fehler');
});

test('Facebook-Video-Story: Start, Upload per file_url, Abschluss', () => {
  assert.deepEqual(s.fbVideoStart('t'), { upload_phase: 'start', access_token: 't' });
  assert.deepEqual(s.fbUploadHeaders('v.mp4', 't'), { Authorization: 'OAuth t', file_url: 'v.mp4' });
  assert.deepEqual(s.fbVideoFinish('123', 't'), { upload_phase: 'finish', video_id: '123', access_token: 't' });
});

test('Bericht nennt Video mit Musik oder Bild-Fallback', () => {
  const ok = s.storyReport({ kind: 'video', fbOk: true, igOk: true, title: 'T', url: 'u', hours: '9.5' });
  assert.match(ok, /📸 Stories gepostet/);
  assert.match(ok, /Video mit Musik/);
  const fb = s.storyReport({ kind: 'bild', fbOk: true, igOk: false, igErr: 'Zeitüberschreitung', title: 'T', url: 'u', hours: '9' });
  assert.match(fb, /teilweise/);
  assert.match(fb, /Bild \(kein Video gefunden\)/);
  assert.match(fb, /Zeitüberschreitung/);
});
