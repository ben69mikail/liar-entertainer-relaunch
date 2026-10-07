/**
 * zauberer-liar.de city pages → data for the new /zauberer/zauberer-in-<stadt>/ pages (2026-10-07).
 * Source: the frozen pages in tests/fixtures/zauberer-liar/ (fetched 2026-10-07).
 * Output: src/data/zauberer-cities/<stadt>.json. Fix the extractor, never the JSON by hand.
 *
 *   npx tsx scripts/extract-zauberer-cities.ts
 *
 * Text stays 1:1, except the documented L3 fix "über 400" → "370+" (real Google count) and links,
 * which point to the matching page on liar-entertainer.com.
 */
import { readFileSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import * as cheerio from 'cheerio';

const SRC = 'tests/fixtures/zauberer-liar';
const CHANGES = JSON.parse(readFileSync(join(SRC, 'changes.json'), 'utf8')) as { description: Record<string, { to: string }> };
const OUT = 'src/data/zauberer-cities';

/** old zauberer-liar.de link → new target (same as the planned 301 map, ops/redirects-zauberer-liar.csv) */
const LINKS: Record<string, string> = {
  'index.html': '/zauberer/',
  'kinderzauberer.html': '/kinderzauberer/',
  'close-up-zauberer.html': '/zauberer/tisch-zauberer/',
  'tisch-zauberer.html': '/zauberer/tisch-zauberer/',
  'walk-act-zauberer.html': '/clown/walk-act/',
  'buehnenshow.html': '/zauberer/buehnen-zauberer/',
  'zaubershow-erwachsene.html': '/zauberer/',
  'referenzen.html': '/ueber-mich/',
  'kontakt.html': '/kontakt/',
};
export const CITY_SLUGS = readdirSync(SRC).filter((f) => f.endsWith('.html')).map((f) => f.replace('.html', ''));

function target(href: string): string {
  const m = href.match(/^zauberer-([a-z-]+)\.html$/);
  if (m) return `/zauberer/zauberer-in-${m[1]}/`;
  return LINKS[href] ?? href;
}

const fix = (s: string) => s.replace(/über 400/g, '370+');
const clean = (s: string) => fix(s.replace(/\s+/g, ' ').trim());

function html($: cheerio.CheerioAPI, el: cheerio.Cheerio<any>): string {
  const c = el.clone();
  c.find('a').each((_, a) => { $(a).attr('href', target($(a).attr('href') ?? '')); });
  c.find('[style]').removeAttr('style');
  c.find('[class]').removeAttr('class');
  return clean(c.html() ?? '').replace(/<i>/g, '<em>').replace(/<\/i>/g, '</em>');
}

mkdirSync(OUT, { recursive: true });
for (const slug of CITY_SLUGS) {
  const $ = cheerio.load(readFileSync(join(SRC, `${slug}.html`), 'utf8'));
  const name = clean($('h1 i').first().text()) || slug;
  const heroImg = ($('.hero-photo').attr('style') ?? '').match(/url\((?:assets\/img\/)?([^)]+)\)/)?.[1] ?? null;
  const sections = $('header.page-hero ~ section').toArray().map((s) => $(s));
  const head = (s: cheerio.Cheerio<any>) => ({
    eyebrow: clean(s.find('.eyebrow').first().text()),
    h2: clean(s.find('h2').first().text()),
  });

  const introSec = sections.find((s) => s.find('.split').length)!;
  // body text of a section without its own eyebrow / heading (Gladbeck puts them inside the prose)
  const prose = (sec: cheerio.Cheerio<any>) => { const p = sec.find('.prose').first().clone(); p.find('.eyebrow, h2').remove(); return p; };
  const introProse = prose(introSec);
  const img = introSec.find('img').first();

  // the local section is whatever section is left (plain or "band", with or without .prose)
  const known = (s: cheerio.Cheerio<any>) => s === introSec || s.find('.occ, .region-links, .rev-grid, .faq-item').length > 0 || s.hasClass('cta-final');
  const localSec = sections.find((s) => !known(s));
  // its body: everything in the section except the centred head (Gladbeck keeps eyebrow + h2 in the prose)
  const localBody = (sec: cheerio.Cheerio<any>) => { const w = sec.find('.wrap').first().clone(); w.find('.sec-head, .eyebrow, h2').remove(); return w; };
  const formatsSec = sections.find((s) => s.find('.occ').length)!;
  const reviewsSec = sections.find((s) => s.find('.rev-grid').length)!;
  const regionSec = sections.find((s) => s.find('.region-links').length)!;
  const faqSec = sections.find((s) => s.find('.faq-item').length)!;
  const ctaSec = sections.find((s) => s.hasClass('cta-final'))!;

  const data = {
    slug,
    name,
    title: $('title').text(),
    description: CHANGES.description[slug]?.to ?? $('meta[name="description"]').attr('content') ?? '',
    h1Html: html($, $('h1').first()),
    lead: clean($('header.page-hero .wrap > p').not('.breadcrumb').first().text()),
    heroImg,
    intro: { ...head(introSec), html: html($, introProse), img: { file: (img.attr('src') ?? '').replace('assets/img/', ''), alt: img.attr('alt') ?? '' } },
    local: localSec ? { ...head(localSec), intro: clean(localSec.find('.sec-head p').first().text()), html: html($, localBody(localSec)) } : null,
    formats: {
      ...head(formatsSec),
      items: formatsSec.find('.occ-item').toArray().map((i) => ({ title: clean($(i).find('h3').text()), html: html($, $(i).find('p')) })),
    },
    reviews: {
      ...head(reviewsSec),
      intro: clean(reviewsSec.find('.sec-head p').first().text()),
      items: reviewsSec.find('.rev').toArray().map((r) => ({ text: clean($(r).find('p').text()), who: clean($(r).find('.who').text()) })),
    },
    region: {
      ...head(regionSec),
      intro: clean(regionSec.find('.sec-head p').first().text()),
      links: regionSec.find('.region-links li').toArray().map((li) => {
        const a = $(li).find('a');
        return { name: clean($(li).text()), href: a.length ? target(a.attr('href') ?? '') : null };
      }),
    },
    faq: {
      ...head(faqSec),
      items: faqSec.find('.faq-item').toArray().map((f) => ({ q: clean($(f).find('.faq-q').clone().children('.pl').remove().end().text()), a: clean($(f).find('.faq-a').text()) })),
    },
    cta: { eyebrow: clean(ctaSec.find('.eyebrow').text()), h2Html: html($, ctaSec.find('h2')), text: clean(ctaSec.find('p').first().text()) },
  };
  writeFileSync(join(OUT, `${slug}.json`), JSON.stringify(data, null, 2) + '\n');
}
console.log(`[zauberer-cities] ${CITY_SLUGS.length} written`);
