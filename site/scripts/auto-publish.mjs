// Auto-Publisher — veröffentlicht freigegebene Blog-Entwürfe, ohne Sprachmodell.
// Regel: draft:true + freigabe:ja  ->  draft:false, freigabe entfernt, publishDate=heute (falls in der Zukunft: belassen).
// Schreibt nichts, wenn nichts freigegeben ist (Exit 0, "nothing to publish").
// Läuft in .github/workflows/auto-publish.yml; committet die Änderung, der Deploy-Workflow baut+testet+deployt.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';

const DIR = 'src/content/blog';
const today = new Date().toISOString().slice(0, 10);
const published = [];

for (const f of readdirSync(DIR).filter(f => f.endsWith('.md'))) {
  const path = `${DIR}/${f}`;
  const src = readFileSync(path, 'utf8');
  const m = src.match(/^---\n([\s\S]*?)\n---/);
  if (!m) continue;
  const fm = m[1];

  const isDraft = /^draft:\s*true\s*$/m.test(fm);
  const approved = /^freigabe:\s*["']?ja["']?\s*$/im.test(fm);
  if (!isDraft || !approved) continue;

  let newFm = fm
    .replace(/^draft:\s*true\s*$/m, 'draft: false')
    .replace(/^freigabe:\s*.*$/im, '')        // Freigabe-Marker entfernen
    .replace(/\n{2,}/g, '\n')                 // Leerzeilen aus der Entfernung glätten
    .trimEnd();

  // publishDate: wenn leer/fehlt -> heute; wenn in der Vergangenheit -> heute; Zukunftsdatum belassen
  const pd = (newFm.match(/^publishDate:\s*(\d{4}-\d{2}-\d{2})/m) || [])[1];
  if (!pd) {
    newFm += `\npublishDate: ${today}`;
  } else if (pd < today) {
    newFm = newFm.replace(/^publishDate:\s*\d{4}-\d{2}-\d{2}.*$/m, `publishDate: ${today}`);
  }

  const out = src.replace(m[0], `---\n${newFm}\n---`);
  writeFileSync(path, out);
  published.push(f.replace(/\.md$/, ''));
}

if (published.length === 0) {
  console.log('nothing to publish');
  process.exit(0);
}
console.log('PUBLISHED=' + published.join(','));
