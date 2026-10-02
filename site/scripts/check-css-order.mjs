// Einmal-Check: Reihenfolge der CSS-Regeln im Live-HTML (Hamburger-Bug)
import { readFileSync, existsSync } from 'node:fs';

let p = '/tmp/live.html';
if (!existsSync(p)) p = (process.env.TEMP || '') + '\\live.html';
const html = readFileSync(p, 'utf8');

const iFlex = html.indexOf('.flex{display:flex}');
const iMedia = html.indexOf('@media(min-width:64rem)');
const mLg = html.match(/\.lg\\:hidden\{display:none\}/);
console.log('flex at:', iFlex);
console.log('media64 at:', iMedia);
console.log('lg:hidden at:', mLg ? mLg.index : 'NOT FOUND');
if (mLg) {
  console.log('lg:hidden after flex:', mLg.index > iFlex);
  console.log('lg:hidden inside media64:', mLg.index > iMedia);
}
