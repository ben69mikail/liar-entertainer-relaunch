// Einmal-Check: wo steckt das Sticky-Nav-JS und enthält es z-50?
import { readFileSync, readdirSync } from 'node:fs';

const h = readFileSync('dist/index.html', 'utf8');
console.log("'z-50' quoted in html:", h.includes("'z-50'"));
console.log('checkSticky inline:', h.includes('checkSticky'));
const ext = h.match(/<script[^>]*src="([^"]*)"[^>]*>/g);
console.log('external scripts:', ext ?? 'none');

// Bundles durchsuchen
let found = [];
try {
  for (const f of readdirSync('dist/_astro')) {
    if (!f.endsWith('.js')) continue;
    const js = readFileSync('dist/_astro/' + f, 'utf8');
    if (js.includes('z-50') || js.includes('checkSticky') || js.includes('shadow-md')) {
      found.push(f + ' [z-50:' + js.includes('z-50') + ']');
    }
  }
} catch (e) { console.log('no dist/_astro js'); }
console.log('bundles with sticky code:', found);
