// Reine Hilfsfunktionen für das IndexNow-Build-Plugin (Tests: site/tests/indexnow.test.ts).
import { createHash } from 'node:crypto';

export const HOST = 'liar-entertainer.com';
export const KEY = '3da0cf6edca8f56ea0dc1dea223dcdbe';
export const MANIFEST = 'indexnow-manifest.json';

/** Seiten-URLs aus der Sitemap (ohne image:loc). */
export function extractLocs(xml) {
  return [...String(xml).matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
}

/**
 * Fingerabdruck des suchrelevanten Inhalts: Title, Description, Canonical, Robots und <main>.
 * Header/Footer (z. B. „neueste Artikel“), Skripte, Styles und gehashte Asset-Namen zählen nicht,
 * sonst wäre nach jedem Build jede Seite „geändert“.
 */
export function pageFingerprint(html) {
  const s = String(html);
  const pick = (re) => (s.match(re) || [, ''])[1];
  const title = pick(/<title>([\s\S]*?)<\/title>/i);
  const desc = pick(/<meta\s+name="description"\s+content="([^"]*)"/i);
  const canon = pick(/<link\s+rel="canonical"\s+href="([^"]*)"/i);
  const robots = pick(/<meta\s+name="robots"\s+content="([^"]*)"/i);
  const mainM = s.match(/<main\b[^>]*>([\s\S]*)<\/main>/i);
  const main = (mainM ? mainM[1] : s)
    .replace(/<script\b[\s\S]*?<\/script>/gi, '')
    .replace(/<style\b[\s\S]*?<\/style>/gi, '')
    .replace(/\/_astro\/[^"'\s)]+/g, '/_astro/*')
    .replace(/\s+/g, ' ')
    .trim();
  return createHash('sha256').update([title, desc, canon, robots, main].join('\u0000')).digest('hex').slice(0, 16);
}

/** Neue, geänderte und entfernte URLs (IndexNow nimmt auch gelöschte URLs an). */
export function diffManifests(prev, next) {
  if (!prev || typeof prev !== 'object') return Object.keys(next);
  const out = [];
  for (const [url, h] of Object.entries(next)) if (prev[url] !== h) out.push(url);
  for (const url of Object.keys(prev)) if (!(url in next)) out.push(url);
  return out;
}

export function buildPayload(urls) {
  return {
    host: HOST,
    key: KEY,
    keyLocation: `https://${HOST}/${KEY}.txt`,
    urlList: urls.filter((u) => u.startsWith(`https://${HOST}/`)),
  };
}
