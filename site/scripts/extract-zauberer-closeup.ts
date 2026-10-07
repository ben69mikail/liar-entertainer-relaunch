/**
 * zauberer-liar.de/close-up-zauberer.html → data for the new /zauberer/close-up/ page (2026-10-07).
 * Source: the frozen page in tests/fixtures/zauberer-liar-pages/ (fetched 2026-10-07).
 * Output: src/data/zauberer-closeup.json. Fix the extractor, never the JSON by hand.
 * Photos: src/assets/images/zauberer-closeup/ (original file names; `--photos` downloads missing ones).
 *
 *   npx tsx scripts/extract-zauberer-closeup.ts [--photos]
 *
 * Text stays 1:1, except the SEO-length fixes in tests/fixtures/zauberer-liar-pages/changes.json, the documented L3 fix "über 400" → "370+" (real Google count; the source
 * has none) and links, which point to the matching page on liar-entertainer.com.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import * as cheerio from 'cheerio';

const SRC = 'tests/fixtures/zauberer-liar-pages/close-up-zauberer.html';
const OUT = 'src/data/zauberer-closeup.json';
const IMG_DIR = 'src/assets/images/zauberer-closeup';
const ORIGIN = 'https://zauberer-liar.de/';
const SLUG = 'close-up-zauberer';
/** documented deviations (SEO length rules), shared with the test */
const CHANGES = JSON.parse(readFileSync('tests/fixtures/zauberer-liar-pages/changes.json', 'utf8')) as Record<'title' | 'description', Record<string, { to: string }>>;

/** old zauberer-liar.de link → new target (same as the 301 map, ops/redirects-zauberer-liar.csv) */
const LINKS: Record<string, string> = {
  'index.html': '/zauberer/',
  'kinderzauberer.html': '/kinderzauberer/',
  'close-up-zauberer.html': '/zauberer/close-up/',
  'tisch-zauberer.html': '/zauberer/tisch-zauberer/',
  'walk-act-zauberer.html': '/clown/walk-act/',
  'buehnenshow.html': '/zauberer/buehnen-zauberer/',
  'zaubershow-erwachsene.html': '/zauberer/',
  'fotogalerie.html': '/galerie/',
  'videogalerie.html': '/galerie/',
  'referenzen.html': '/ueber-mich/',
  'kontakt.html': '/kontakt/',
};
function target(href: string): string {
  const m = href.match(/^zauberer-([a-z-]+)\.html$/);
  if (m) return `/zauberer/zauberer-in-${m[1]}/`;
  return LINKS[href.replace(/#.*$/, '')] ?? href;
}

const fix = (s: string) => s.replace(/über 400/g, '370+');
const clean = (s: string) => fix(s.replace(/\s+/g, ' ').trim());
const file = (src: string) => src.replace(/^assets\/img\//, '');

const $ = cheerio.load(readFileSync(SRC, 'utf8'));
function html(el: cheerio.Cheerio<any>): string {
  const c = el.clone();
  c.find('a').each((_, a) => { $(a).attr('href', target($(a).attr('href') ?? '')); });
  c.find('[style]').removeAttr('style');
  c.find('[class]').removeAttr('class');
  return clean(c.html() ?? '').replace(/<i>/g, '<em>').replace(/<\/i>/g, '</em>');
}

const sections = $('header.page-hero ~ section').toArray().map((s) => $(s));
const head = (s: cheerio.Cheerio<any>) => ({ eyebrow: clean(s.find('.eyebrow').first().text()), h2: clean(s.find('h2').first().text()) });
const img = (i: cheerio.Cheerio<any>) => ({ file: file(i.attr('src') ?? ''), alt: i.attr('alt') ?? '' });

const introSec = sections.find((s) => s.find('.split').length)!;
const introProse = introSec.find('.prose').first().clone();
introProse.find('.eyebrow, h2').remove();
const propsSec = sections.find((s) => s.find('.occ').length)!;
const formatsSec = sections.find((s) => s.find('.offer').length)!;
const gallerySec = sections.find((s) => s.find('.masonry').length)!;
const ctaSec = sections.find((s) => s.hasClass('cta-final'))!;
const more = gallerySec.find('a.btn').first();

const data = {
  title: CHANGES.title[SLUG]?.to ?? $('title').text(),
  description: CHANGES.description[SLUG]?.to ?? fix($('meta[name="description"]').attr('content') ?? ''),
  h1Html: html($('h1').first()),
  lead: clean($('header.page-hero .wrap > p').not('.breadcrumb').first().text()),
  heroImg: (($('.hero-photo').attr('style') ?? '').match(/url\(([^)]+)\)/)?.[1] ?? '').replace(/^assets\/img\//, ''),
  intro: { ...head(introSec), html: html(introProse), img: img(introSec.find('img').first()) },
  props: {
    ...head(propsSec),
    items: propsSec.find('.occ-item').toArray().map((i) => ({ title: clean($(i).find('h3').text()), html: html($(i).find('p')) })),
  },
  formats: {
    ...head(formatsSec),
    items: formatsSec.find('.offer').toArray().map((o) => ({
      title: clean($(o).find('h3').text()),
      html: html($(o).find('.offer-body p')),
      href: target($(o).find('a.more').attr('href') ?? ''),
      more: clean($(o).find('a.more').text()),
      img: img($(o).find('img').first()),
    })),
  },
  gallery: {
    ...head(gallerySec),
    items: gallerySec.find('.tile').toArray().map((t) => ({ ...img($(t).find('img').first()), cap: clean($(t).find('.cap').text()) })),
    more: { label: clean(more.text()), href: target(more.attr('href') ?? '') },
  },
  cta: { eyebrow: clean(ctaSec.find('.eyebrow').text()), h2Html: html(ctaSec.find('h2')), text: clean(ctaSec.find('p').first().text()) },
};
writeFileSync(OUT, JSON.stringify(data, null, 2) + '\n');

const files = [...new Set([data.heroImg, data.intro.img.file, ...data.formats.items.map((f) => f.img.file), ...data.gallery.items.map((g) => g.file)])];
if (process.argv.includes('--photos')) {
  mkdirSync(IMG_DIR, { recursive: true });
  for (const f of files) {
    const dest = join(IMG_DIR, f);
    if (existsSync(dest)) continue;
    const res = await fetch(`${ORIGIN}assets/img/${f}`);
    if (!res.ok) throw new Error(`${f}: HTTP ${res.status}`);
    writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
    console.log(`[zauberer-closeup] photo ${f}`);
  }
}
const missing = files.filter((f) => !existsSync(join(IMG_DIR, f)));
if (missing.length) console.warn(`[zauberer-closeup] photos missing (run with --photos): ${missing.join(', ')}`);
console.log(`[zauberer-closeup] written ${OUT} (${files.length} photos)`);
