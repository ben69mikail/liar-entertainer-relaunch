/**
 * SEO-Inventar ueber alle gebauten Seiten.
 * Erzeugt die Datenbasis fuer das Audit vom 11.08.2026:
 * Titles, Headings, Wortzahlen, Bilder inkl. Dateigroesse, interner Linkgraph,
 * Keyword-Verteilung (Prioritaets- vs. Abwertungsbegriffe), Umkreis Gladbeck.
 *
 * Aufruf: node scripts/seo-inventory.mjs   (setzt `npm run build` voraus)
 */
import { readFileSync, writeFileSync, mkdirSync, statSync, readdirSync } from 'node:fs';
import { join, relative, extname } from 'node:path';

const DIST = new URL('../dist/', import.meta.url).pathname.replace(/\/$/, '');
const OUT = new URL('../seo-reports/2026-08-11/', import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });

// ---------- Keywords ----------
const PRIO = {
  kinderzauberer: /kinderzauberer/gi,
  clown: /\bclown\w*/gi,
  kindergeburtstag: /kindergeburtstag\w*/gi,
  'zauberer fuer kinder': /zauberer f(ü|ue)r kinder/gi,
  'geburtstag fuer kinder': /geburtstag f(ü|ue)r kinder/gi,
  zauberer: /\bzauberer\b/gi,
};
const DEPRIO = {
  ballonmodellage: /ballon(modellage|k(ü|ue)nstler)?/gi,
  'glitzer tattoo': /glitzer[- ]?tattoo\w*/gi,
};

// ---------- Umkreis Gladbeck ----------
const GLADBECK = [51.5658, 6.9857];
const CITY_COORDS = {
  gladbeck: [51.5708, 6.9857], bottrop: [51.5216, 6.9289], gelsenkirchen: [51.5177, 7.0857],
  essen: [51.4556, 7.0116], oberhausen: [51.4963, 6.8638], herten: [51.5936, 7.1372],
  marl: [51.6586, 7.0908], dorsten: [51.6603, 6.9644], recklinghausen: [51.6142, 7.1979],
  bochum: [51.4818, 7.2162], herne: [51.5386, 7.2257],
  'mülheim': [51.4275, 6.8825], muelheim: [51.4275, 6.8825],
  'mülheim-an-der-ruhr': [51.4275, 6.8825],
  duisburg: [51.4344, 6.7623], dortmund: [51.5136, 7.4653],
  'düsseldorf': [51.2277, 6.7735], duesseldorf: [51.2277, 6.7735],
  'köln': [50.9375, 6.9603], koeln: [50.9375, 6.9603],
  'münster': [51.9607, 7.6261], muenster: [51.9607, 7.6261],
  wesel: [51.6586, 6.6178], moers: [51.4508, 6.6303], krefeld: [51.3388, 6.5853],
  hagen: [51.3671, 7.4633], velbert: [51.3400, 7.0428], ratingen: [51.2966, 6.8492],
  neuss: [51.1982, 6.6879], hattingen: [51.3989, 7.1858], witten: [51.4344, 7.3353],
  gevelsberg: [51.3186, 7.3383], haltern: [51.7433, 7.1817],
  'castrop-rauxel': [51.5486, 7.3119], waltrop: [51.6222, 7.3958],
  datteln: [51.6553, 7.3419], 'oer-erkenschwick': [51.6392, 7.2606],
  gelsenkirchen_buer: [51.5772, 7.0561], hamm: [51.6739, 7.8150],
  luenen: [51.6161, 7.5286], 'lünen': [51.6161, 7.5286],
  unna: [51.5347, 7.6892], solingen: [51.1652, 7.0671], wuppertal: [51.2562, 7.1508],
  remscheid: [51.1787, 7.1897], leverkusen: [51.0459, 6.9852], bonn: [50.7374, 7.0982],
  aachen: [50.7753, 6.0839], bielefeld: [52.0302, 8.5325], paderborn: [51.7189, 8.7575],
  siegen: [50.8748, 8.0243], 'mönchengladbach': [51.1805, 6.4428],
  moenchengladbach: [51.1805, 6.4428], viersen: [51.2542, 6.3906],
  kamp_lintfort: [51.5039, 6.5453], dinslaken: [51.5644, 6.7431],
  voerde: [51.5972, 6.6867], hünxe: [51.6431, 6.7639], schermbeck: [51.6928, 6.8756],
  kirchhellen: [51.6083, 6.9250], 'gladbeck-zweckel': [51.5900, 6.9700],
};

const hav = ([a1, o1], [a2, o2]) => {
  const R = 6371, r = Math.PI / 180;
  const dLat = (a2 - a1) * r, dLon = (o2 - o1) * r;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(a1 * r) * Math.cos(a2 * r) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
};

// ---------- Helpers ----------
const walk = (dir, out = []) => {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
};

const strip = (html) =>
  html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const attr = (tag, name) => {
  const m = tag.match(new RegExp(`${name}\\s*=\\s*"([^"]*)"`, 'i'));
  return m ? m[1] : null;
};

const count = (text, re) => (text.match(re) || []).length;

// ---------- Sammeln ----------
const allFiles = walk(DIST);
const files = allFiles.filter((f) => f.endsWith('.html'));
const assetBytes = new Map();
for (const f of allFiles) {
  if (/\.(webp|jpg|jpeg|png|avif|svg|gif)$/i.test(f)) {
    assetBytes.set('/' + relative(DIST, f).split('\\').join('/'), statSync(f).size);
  }
}

const pages = [];
for (const file of files) {
  const html = readFileSync(file, 'utf8');
  let url = '/' + relative(DIST, file).split('\\').join('/');
  url = url.replace(/index\.html$/, '').replace(/\.html$/, '/');
  if (!url.endsWith('/')) url += '/';

  const bodyMatch = html.match(/<main[\s\S]*?<\/main>/i);
  const bodyHtml = bodyMatch ? bodyMatch[0] : html;
  const text = strip(bodyHtml);

  const title = (html.match(/<title>([\s\S]*?)<\/title>/i) || [, ''])[1].trim();
  const descTag = html.match(/<meta\s+name="description"[^>]*>/i);
  const desc = descTag ? attr(descTag[0], 'content') || '' : '';
  const canonicalTag = html.match(/<link\s+rel="canonical"[^>]*>/i);
  const canonical = canonicalTag ? attr(canonicalTag[0], 'href') : null;
  const robotsTag = html.match(/<meta\s+name="robots"[^>]*>/i);
  const noindex = robotsTag ? /noindex/i.test(robotsTag[0]) : false;

  const h1 = [...bodyHtml.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)].map((m) => strip(m[1]));
  const h2 = [...bodyHtml.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/gi)].map((m) => strip(m[1]));
  const h3 = [...bodyHtml.matchAll(/<h3[^>]*>([\s\S]*?)<\/h3>/gi)].map((m) => strip(m[1]));

  const images = [...bodyHtml.matchAll(/<img[^>]*>/gi)].map((m) => {
    const t = m[0];
    const src = attr(t, 'src') || '';
    const a = attr(t, 'alt');
    return {
      src, alt: a, altLen: (a || '').length,
      w: attr(t, 'width'), h: attr(t, 'height'), loading: attr(t, 'loading'),
      bytes: assetBytes.get(src.split('?')[0]) || null,
      format: extname(src.split('?')[0]).replace('.', '') || null,
    };
  });

  const links = [...bodyHtml.matchAll(/<a\s[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi)]
    .map((m) => ({ href: m[1], anchor: strip(m[2]).slice(0, 120) }))
    .filter((l) => l.href.startsWith('/') || l.href.includes('liar-entertainer.com'))
    .map((l) => ({ ...l, href: l.href.replace(/^https?:\/\/(www\.)?liar-entertainer\.com/, '') || '/' }));

  const kw = {};
  for (const [k, re] of Object.entries(PRIO)) kw[k] = count(text, re);
  const kwDown = {};
  for (const [k, re] of Object.entries(DEPRIO)) kwDown[k] = count(text, re);

  const citySlug = (url.match(/-in-([a-z\u00e4\u00f6\u00fc\u00df-]+)\/$/) || [])[1];
  let km = null;
  if (citySlug && CITY_COORDS[citySlug]) km = +hav(GLADBECK, CITY_COORDS[citySlug]).toFixed(1);

  pages.push({
    url, title, titleLen: title.length, desc, descLen: desc.length, canonical, noindex,
    h1, h2, h3, words: text.split(' ').filter(Boolean).length,
    images, links, kw, kwDown, citySlug: citySlug || null, km,
  });
}

// ---------- Linkgraph ----------
const inbound = new Map();
const anchors = new Map();
for (const p of pages) {
  for (const l of p.links) {
    let target = l.href.split('#')[0].split('?')[0];
    if (!target) target = '/';
    if (!target.endsWith('/')) target += '/';
    inbound.set(target, (inbound.get(target) || 0) + 1);
    if (!anchors.has(target)) anchors.set(target, []);
    anchors.get(target).push(l.anchor);
  }
}
for (const p of pages) {
  p.inboundLinks = inbound.get(p.url) || 0;
  p.inboundAnchors = [...new Set(anchors.get(p.url) || [])].slice(0, 12);
}

writeFileSync(join(OUT, 'pages.json'), JSON.stringify(pages, null, 1));

// ---------- Aggregate ----------
const indexable = pages.filter((p) => !p.noindex);
const sum = (arr, f) => arr.reduce((a, b) => a + f(b), 0);
const allImages = pages.flatMap((p) => p.images.map((i) => ({ ...i, page: p.url })));

const R = [];
R.push(`Seiten gesamt: ${pages.length} (indexierbar ${indexable.length}, noindex ${pages.length - indexable.length})`);
R.push(`Bild-Einbindungen: ${allImages.length} | ohne alt: ${allImages.filter((i) => !i.alt).length} | alt < 15 Zeichen: ${allImages.filter((i) => i.alt && i.altLen < 15).length}`);
R.push(`Bilder > 200 KB: ${allImages.filter((i) => i.bytes && i.bytes > 204800).length} | > 500 KB: ${allImages.filter((i) => i.bytes && i.bytes > 512000).length}`);
R.push(`jpg/png statt WebP eingebunden: ${allImages.filter((i) => /^(jpg|jpeg|png)$/i.test(i.format || '')).length}`);
R.push(`ohne loading-Attribut: ${allImages.filter((i) => !i.loading).length}`);
R.push('');
R.push('--- Schwach verlinkt (indexierbar, < 3 interne Eingangslinks) ---');
for (const p of indexable.filter((x) => x.inboundLinks < 3).sort((a, b) => a.inboundLinks - b.inboundLinks).slice(0, 45)) {
  R.push(`  ${String(p.inboundLinks).padStart(2)}  ${p.url}`);
}
R.push('');
R.push('--- Duenn (indexierbar, < 350 Woerter) ---');
for (const p of indexable.filter((x) => x.words < 350).sort((a, b) => a.words - b.words)) {
  R.push(`  ${String(p.words).padStart(4)} W  ${p.url}`);
}
R.push('');
R.push('--- Keyword-Summen (indexierbare Seiten) ---');
for (const k of Object.keys(PRIO)) R.push(`  PRIO   ${k.padEnd(24)} ${String(sum(indexable, (p) => p.kw[k])).padStart(5)}  auf ${indexable.filter((p) => p.kw[k] > 0).length} Seiten`);
for (const k of Object.keys(DEPRIO)) R.push(`  ABWERT ${k.padEnd(24)} ${String(sum(indexable, (p) => p.kwDown[k])).padStart(5)}  auf ${indexable.filter((p) => p.kwDown[k] > 0).length} Seiten`);
R.push('');
R.push('--- Abwertungs-Begriff in Title oder H1 ---');
for (const p of indexable) {
  if (/ballon|glitzer/i.test(`${p.title} ${p.h1.join(' ')}`)) R.push(`  ${p.url}  ::  ${p.title}`);
}
R.push('');
R.push('--- Stadtseiten nach Luftlinie zu Gladbeck ---');
const cityPages = indexable.filter((p) => p.citySlug);
for (const p of cityPages.filter((p) => p.km !== null).sort((a, b) => a.km - b.km)) {
  R.push(`  ${String(p.km).padStart(5)} km | ${String(p.inboundLinks).padStart(2)} Links | ${String(p.words).padStart(4)} W | ${p.url}`);
}
const unknown = [...new Set(cityPages.filter((p) => p.km === null).map((p) => p.citySlug))];
R.push(`  Ohne Koordinaten: ${unknown.join(', ') || 'keine'}`);
R.push('');
R.push('--- Title-Laenge ausserhalb 30-60 ---');
for (const p of indexable) {
  if (p.titleLen > 60 || p.titleLen < 30) R.push(`  ${String(p.titleLen).padStart(3)}  ${p.url}  ::  ${p.title}`);
}

const report = R.join('\n');
writeFileSync(join(OUT, 'inventar.txt'), report);
console.log(report);
