// Einmal-Check: sind die min-[900px]-Regeln im gebauten CSS?
import { readFileSync } from 'node:fs';
const html = readFileSync('dist/index.html', 'utf8');

// Markup-Klassen (unescaped)
console.log('markup min-[900px]:hidden:', html.includes('min-[900px]:hidden'));
console.log('markup min-[900px]:flex:', html.includes('min-[900px]:flex'));

// CSS-Regeln (Tailwind escaped: .min-\[900px\]\:hidden)
console.log('css rule :hidden:', html.includes('min-\\[900px\\]\\:hidden'));
console.log('css rule :flex:', html.includes('min-\\[900px\\]\\:flex'));

// alle @media mit 900
const medias = html.match(/@media[^{]{0,60}900px[^{]{0,20}\{/g);
console.log('media 900px blocks:', medias);

// .z-50 Regel exakt
console.log('css .z-50 rule:', /\.z-50\{z-index:\s*50\}/.test(html) || html.includes('.z-50{z-index:'));

// portrait-zoom / img-hover-zoom Definitionen
const pz = html.match(/\.portrait-zoom[^{]*\{[^}]*\}/g);
console.log('portrait-zoom rules:', pz);
const ihz = html.match(/\.img-hover-zoom[^{]*\{[^}]*\}/g);
console.log('img-hover-zoom rules:', ihz);
