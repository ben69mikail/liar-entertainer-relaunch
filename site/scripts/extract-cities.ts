/**
 * Wave 3: turn the 69 legacy city pages into data for one v2 template per family.
 *
 * Source = the BUILT legacy HTML (images resolved, FAQ loops expanded) — the same source the
 * content-parity baseline was taken from, so text survives 1:1 by construction.
 * Each page becomes { seo, hero, blocks[] }. Blocks keep the city's own section order (the SEO
 * autopilot gave many cities extra sections); Tailwind intent is translated into kit classes.
 *
 * Usage: LEGACY_DIST=<legacy build dir> npx tsx scripts/extract-cities.ts
 */
import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, basename } from 'node:path';
import * as cheerio from 'cheerio';
import type { Cheerio, CheerioAPI } from 'cheerio';
import type { AnyNode, Element } from 'domhandler';

const ROOT = join(import.meta.dirname, '..');
const LEGACY = process.env.LEGACY_DIST;
if (!LEGACY) throw new Error('LEGACY_DIST missing');

const FAMILIES = {
  kinderzauberer: { dir: 'kinderzauberer', prefix: 'kinderzauberer-in-' },
  kindergeburtstag: { dir: 'kindergeburtstag', prefix: 'geburtstag-in-' },
  clownshow: { dir: 'clown/clownshow', prefix: 'clown-in-' },
} as const;

// ── assets: built "/_astro/<name>.<hash>_<x>.webp" → src/assets/images/**/<name>.<ext>
const ASSET_DIR = join(ROOT, 'src/assets/images');
const assetIndex = new Map<string, string>();
(function index(dir: string) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, e.name);
    if (e.isDirectory()) index(full);
    else if (/\.(jpe?g|png|webp)$/i.test(e.name)) {
      const key = e.name.replace(/\.[^.]+$/, '');
      const rel = '/src/assets/images/' + full.slice(ASSET_DIR.length + 1).split('\\').join('/');
      if (!assetIndex.has(key)) assetIndex.set(key, rel);
    }
  }
})(ASSET_DIR);
function assetFor(url: string): string {
  const file = basename(url.split('?')[0]);
  const name = file.replace(/\.[A-Za-z0-9_-]{8}(_[A-Za-z0-9]+)?\.(webp|jpe?g|png|avif)$/i, '').replace(/\.(webp|jpe?g|png)$/i, '');
  const hit = assetIndex.get(name);
  if (!hit) throw new Error(`no source asset for ${url} (${name})`);
  return hit;
}

// ── Tailwind intent → kit classes
function translateClasses(cls: string): string {
  const c = ` ${cls} `;
  const out: string[] = [];
  if (/ grid /.test(c) && /grid-cols-|cols-/.test(c)) out.push('c-grid');
  if (/ flex /.test(c) && /flex-wrap/.test(c)) out.push('c-row');
  if (/rounded-(xl|2xl|lg)/.test(c) && /(shadow|border)/.test(c) && /\bp-\d/.test(c)) out.push('c-card');
  if (/border-t-4/.test(c)) out.push('c-card', c.includes('#3b55d5') ? 'c-card--blue' : c.includes('#ffb546') || c.includes('#f5a623') ? 'c-card--yellow' : 'c-card--red');
  if (/ c-strip /.test(c)) return 'c-strip';
  if (/rounded-full/.test(c) && /(^| )w-(8|9|10|12) /.test(c) && /bg-/.test(c)) return 'c-num';
  if (/text-center/.test(c)) out.push('c-center');
  if (/rounded-full/.test(c) && /object-cover/.test(c)) out.push('c-round');
  if (/uppercase/.test(c) && /tracking-/.test(c)) out.push('c-kicker');
  if (/text-sm/.test(c) && !out.length) out.push('c-small');
  return [...new Set(out)].join(' ');
}
const isButton = (cls: string) => /(bg-\[#(d7393e|3b55d5|f5a623|ffb546)\]|bg-white)/.test(cls) && /\b(px-\d|py-\d)/.test(cls) && /inline-block|inline-flex|rounded/.test(cls);

/** Clean a legacy subtree: strip Tailwind/style, keep structure + inline markup, translate intent. */
function clean($: CheerioAPI, root: Cheerio<AnyNode>): string {
  root.find('script, style, noscript, svg, .hero-dots').remove();
  // the legacy JS carousel becomes a static strip of photos (no hidden slides, no JS)
  root.find('.hero-slider').attr('class', 'c-strip');
  root.find('*').each((_, node) => {
    const el = node as Element;
    const $el = $(el);
    const cls = $el.attr('class') ?? '';
    if (el.tagName === 'img') {
      const src = $el.attr('src') ?? '';
      $el.replaceWith(`<img data-asset="${assetFor(src)}" alt="${($el.attr('alt') ?? '').replace(/"/g, '&quot;')}">`);
      return;
    }
    if (el.tagName === 'a' && isButton(cls)) {
      $el.attr('class', /bg-white|#f5a623|#ffb546/.test(cls) ? 'btn btn--ghost' : 'btn btn--primary');
      $el.attr('data-confetti', /kontakt|anfrag/i.test(($el.attr('href') ?? '') + $el.text()) ? '' : null);
    } else {
      const t = translateClasses(cls);
      if (t) $el.attr('class', t);
      else $el.removeAttr('class');
    }
    for (const a of Object.keys(el.attribs)) {
      if (!['class', 'href', 'id', 'target', 'rel', 'alt', 'data-asset', 'data-confetti', 'open', 'aria-label', 'title'].includes(a)) $el.removeAttr(a);
    }
  });
  return (root.html() ?? '').replace(/\n\s*\n/g, '\n').trim();
}

type Block =
  | { kind: 'reviews' }
  | { kind: 'stats'; items: { icon: string; num: string; label: string }[] }
  | { kind: 'faq'; head: string; items: { q: string; a: string }[] }
  | { kind: 'video'; head: string; tail: string }
  | { kind: 'gallery'; head: string; images: { asset: string; alt: string }[] }
  | { kind: 'prose'; html: string; tone: 'plain' | 'tint' | 'band' };

function blockFor($: CheerioAPI, sec: Cheerio<Element>): Block {
  if (sec.find('#gr-reviews-grid').length) return { kind: 'reviews' };
  if (sec.find('iframe, .yt-facade').length) {
    const parts = sec.clone();
    const head = parts.find('h2').first();
    const h3 = parts.find('h3').first();
    const tail = (h3.length ? h3.parent() : head.parent()).clone();
    tail.find('h2').first().remove(); // rendered once, as the block head
    tail.find('iframe, .yt-facade').closest('div').remove(); // the template renders the video itself
    return { kind: 'video', head: head.text().trim(), tail: clean($, tail) };
  }
  const faqBtns = sec.find('.faq-btn');
  if (faqBtns.length || sec.find('details').length) {
    const items = faqBtns.length
      ? faqBtns.map((_, b) => ({ q: $(b).find('span').first().text().trim(), a: clean($, $(b).next().clone()) })).get()
      : sec.find('details').map((_, d) => ({ q: $(d).find('summary').text().trim(), a: clean($, $(d).clone().find('summary').remove().end()) })).get();
    const head = sec.clone();
    head.find('.faq-item, details, #faq-list').remove();
    return { kind: 'faq', head: clean($, head), items };
  }
  const stats = sec.find('.stat-card-pulse, [class*="stat-card"]');
  if (stats.length) {
    return {
      kind: 'stats',
      items: stats.map((_, s) => {
        const divs = $(s).clone().find('script').remove().end().children('div');
        return { icon: divs.eq(0).text().trim(), num: divs.eq(1).text().trim(), label: divs.eq(2).text().trim() };
      }).get(),
    };
  }
  const imgs = sec.find('img');
  if (imgs.length >= 4 && sec.find('p').length <= 2) {
    const head = sec.clone();
    head.find('img').closest('div').remove();
    return { kind: 'gallery', head: clean($, head), images: imgs.map((_, i) => ({ asset: assetFor($(i).attr('src') ?? ''), alt: $(i).attr('alt') ?? '' })).get() };
  }
  const cls = sec.attr('class') ?? '';
  const tone = /bg-\[#(eff4ff|fdf2f2)\]/.test(cls) ? 'band' : /bg-gray-50|bg-\[#f9fafb\]/.test(cls) ? 'tint' : 'plain';
  return { kind: 'prose', html: clean($, sec.clone()), tone };
}

function extract(html: string) {
  const $ = cheerio.load(html);
  // SEO head (kept 1:1; layout-generated schema is re-created by the layout)
  const ld = $('script[type="application/ld+json"]').map((_, s) => JSON.parse($(s).text())).get();
  const layoutTypes = new Set(['LocalBusiness', 'WebSite', 'WebPage', 'BreadcrumbList']);
  const own = ld.filter((o) => !layoutTypes.has(String(o['@type'])));
  const crumbs = ld.find((o) => o['@type'] === 'BreadcrumbList');
  const seo = {
    title: $('title').text().trim(),
    description: $('meta[name="description"]').attr('content') ?? '',
    keywords: $('meta[name="keywords"]').attr('content') ?? undefined,
    canonical: $('link[rel="canonical"]').attr('href') ?? '',
    structuredData: own,
    breadcrumbs: crumbs?.itemListElement?.map((i: { name: string; item: string }) => ({ name: i.name, url: new URL(i.item).pathname })),
  };
  // hero stage: [hero, breadcrumb, intro]
  const stage = $('main > div').first();
  const [heroSec, crumbSec, introSec, ...moreIntro] = stage.children('section').toArray().map((s) => $(s));
  const bg = (heroSec.find('[style*="background-image"]').attr('style') ?? '').match(/url\('?([^')]+)'?\)/)?.[1] ?? '';
  const heroImg = heroSec.find('img').first();
  const hero = {
    image: assetFor(bg || heroImg.attr('src') || ''),
    imageAlt: heroImg.attr('alt') ?? '',
    // html, not text: the legacy badge keeps its emoji in an own element (content parity)
    badge: clean($, heroSec.find('h1').prevAll('div').first().clone()),
    h1: heroSec.find('h1').html()?.trim() ?? '',
    lead: heroSec.find('h1').nextAll('p').map((_, p) => $(p).html()?.trim()).get(),
    crumbs: crumbSec ? clean($, crumbSec.find('nav').clone()) : '',
    intro: introSec ? clean($, introSec.clone()) : '',
  };
  // some cities got extra intro sections inside the hero stage; they lead the block list
  const blocks = [...moreIntro, ...$('main').children('section').toArray().map((s) => $(s as Element))].map((s) =>
    blockFor($, s as Cheerio<Element>),
  );
  return { seo, hero, blocks };
}

mkdirSync(join(ROOT, 'src/data/cities'), { recursive: true });
for (const [family, { dir, prefix }] of Object.entries(FAMILIES)) {
  const cities: Record<string, unknown> = {};
  for (const slug of readdirSync(join(LEGACY, dir)).filter((d) => d.startsWith(prefix)).sort()) {
    const file = join(LEGACY, dir, slug, 'index.html');
    if (!existsSync(file)) continue;
    cities[slug] = extract(readFileSync(file, 'utf8'));
  }
  writeFileSync(join(ROOT, 'src/data/cities', `${family}.json`), JSON.stringify(cities, null, 1) + '\n');
  console.log(family, Object.keys(cities).length, 'cities');
}
