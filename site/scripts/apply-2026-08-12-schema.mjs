/**
 * Schema-Konsolidierung, Audit Runde 2 vom 12.08.2026, Massnahme A2.
 *
 * Problem: Jede Service-Schema-Definition erzeugt ueber `provider` einen NEUEN
 * anonymen LocalBusiness-Knoten, statt auf den globalen Knoten aus BaseLayout zu
 * verweisen. Gezaehlt im gebauten HTML: 253 LocalBusiness-Knoten statt 168.
 * Rund 85 lose Fragmente, die den Entity-Graph zerfasern - genau das, worauf
 * KI-Systeme angewiesen sind, um "LIAR = Gladbeck" eindeutig aufzuloesen.
 *
 * Loesung: provider zeigt per @id auf den einen kanonischen Knoten
 * https://liar-entertainer.com/#business, den BaseLayout auf jeder Seite ausgibt.
 *
 * Idempotent: mehrfaches Ausfuehren aendert nach dem ersten Lauf nichts mehr.
 *
 * Aufruf: node scripts/apply-2026-08-12-schema.mjs
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

// fileURLToPath statt .pathname - siehe hero-invarianten.mjs: unter Windows
// entstuende sonst "C:\C:\Users\...".
const ROOT = fileURLToPath(new URL('../', import.meta.url)).replace(/[\\/]+$/, '');
const PAGES = join(ROOT, 'src', 'pages');
const BUSINESS_ID = 'https://liar-entertainer.com/#business';

const walk = (dir, out = []) => {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (p.endsWith('.astro')) out.push(p);
  }
  return out;
};

// Ein provider- oder worksFor-Block, der einen eigenen LocalBusiness aufmacht.
// Deckt beide im Projekt vorkommenden Schreibweisen ab (einfache und doppelte
// Anfuehrungszeichen) und beliebige Reihenfolge/Anzahl der Felder.
//
// Wichtig: Einige Bloecke enthalten ein verschachteltes address-Objekt
// (z.B. /zauberer/hochzeit/). Deshalb erlaubt der Rumpf EINE Ebene
// Verschachtelung - `[^{}]*` allein greift dort nicht.
const providerRegex = () =>
  /(['"]?(?:provider|worksFor)['"]?\s*:\s*)\{\s*['"]@type['"]\s*:\s*['"]LocalBusiness['"](?:[^{}]|\{[^{}]*\})*\}/g;

let geaendert = 0;
let ersetzungen = 0;
const dateien = [];

for (const file of walk(PAGES)) {
  const vorher = readFileSync(file, 'utf8');
  if (!providerRegex().test(vorher)) continue;

  let anzahl = 0;
  const nachher = vorher.replace(providerRegex(), (_treffer, praefix) => {
    anzahl++;
    // Anfuehrungszeichen-Stil des Praefix uebernehmen, damit der Code einheitlich bleibt.
    const q = /'(?:provider|worksFor)'/.test(praefix) ? "'" : '"';
    return `${praefix}{ ${q}@id${q}: ${q}${BUSINESS_ID}${q} }`;
  });

  if (nachher !== vorher) {
    writeFileSync(file, nachher, 'utf8');
    geaendert++;
    ersetzungen += anzahl;
    dateien.push(`${relative(ROOT, file)} (${anzahl})`);
  }
}

console.log('A2 - provider-Knoten konsolidiert');
console.log(`  Dateien geaendert: ${geaendert}`);
console.log(`  Ersetzungen:       ${ersetzungen}`);
if (geaendert === 0) {
  console.log('  Nichts zu tun - bereits konsolidiert.');
} else {
  console.log('');
  for (const d of dateien.slice(0, 10)) console.log(`    ${d}`);
  if (dateien.length > 10) console.log(`    ... und ${dateien.length - 10} weitere`);
}
