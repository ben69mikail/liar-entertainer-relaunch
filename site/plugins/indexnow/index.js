// Netlify-Build-Plugin: meldet nach jedem Produktions-Deploy nur die geänderten URLs an IndexNow
// (Bing, Yandex, Seznam, Naver – Bing speist ChatGPT-Suche und Copilot).
// Ablauf: onPostBuild = alte Seite ist noch live → altes Manifest laden, neues aus dist/ bauen, Differenz merken.
//         onSuccess   = Deploy ist veröffentlicht → warten, bis das neue Manifest live ist, dann IndexNow.
// Fehler brechen den Build nie ab (nur Hinweis im Deploy-Log). Manuell: node ops/indexnow.mjs
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { extractLocs, pageFingerprint, diffManifests, buildPayload, HOST, MANIFEST } from './lib.mjs';

let changed = null;
let manifest = null;

const live = (process.env.CONTEXT || '') === 'production' && process.env.INDEXNOW_OFF !== '1';

function fileFor(dist, url) {
  const path = new URL(url).pathname;
  const f = join(dist, path, path.endsWith('/') ? 'index.html' : '');
  return existsSync(f) ? f : null;
}

export const onPostBuild = async ({ constants, utils }) => {
  try {
    const dist = constants.PUBLISH_DIR;
    const xmlFile = join(dist, 'sitemap.xml');
    if (!existsSync(xmlFile)) return console.log('IndexNow: keine sitemap.xml in dist – übersprungen');
    manifest = {};
    for (const url of extractLocs(readFileSync(xmlFile, 'utf8'))) {
      const f = fileFor(dist, url);
      if (f) manifest[url] = pageFingerprint(readFileSync(f, 'utf8'));
    }
    writeFileSync(join(dist, MANIFEST), JSON.stringify(manifest));
    if (!live) return console.log(`IndexNow: Kontext ${process.env.CONTEXT || '?'} – nur Manifest geschrieben (${Object.keys(manifest).length} URLs)`);
    let prev = null;
    try {
      const r = await fetch(`https://${HOST}/${MANIFEST}`, { headers: { 'cache-control': 'no-cache' } });
      if (r.ok) prev = await r.json();
    } catch {}
    changed = diffManifests(prev, manifest);
    console.log(`IndexNow: ${changed.length} geänderte URL(s)${prev ? '' : ' (erster Lauf, kein altes Manifest)'}`);
  } catch (e) {
    changed = null;
    utils.status.show({ title: 'IndexNow', summary: 'Manifest fehlgeschlagen: ' + e.message });
  }
};

export const onSuccess = async ({ utils }) => {
  if (!live || !changed) return;
  if (!changed.length) return utils.status.show({ title: 'IndexNow', summary: 'Keine Inhaltsänderung – nichts gemeldet' });
  try {
    // bis zu 2 Min. warten, bis das neue Manifest ausgeliefert wird (Deploy-Umschaltung)
    const want = JSON.stringify(manifest);
    for (let i = 0; i < 12; i++) {
      try {
        const r = await fetch(`https://${HOST}/${MANIFEST}?t=${Date.now()}`);
        if (r.ok && JSON.stringify(await r.json()) === want) break;
      } catch {}
      await new Promise((ok) => setTimeout(ok, 10000));
    }
    const body = buildPayload(changed);
    const res = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify(body),
    });
    const summary = `${body.urlList.length} URL(s) → HTTP ${res.status}`;
    console.log('IndexNow: ' + summary + '\n' + body.urlList.slice(0, 30).join('\n'));
    utils.status.show({ title: 'IndexNow', summary });
  } catch (e) {
    utils.status.show({ title: 'IndexNow', summary: 'Fehler: ' + e.message });
  }
};
