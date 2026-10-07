import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import pagesData from '../data/pages.json';
import postsData from '../data/posts.json';
import { getAllCategories } from '../utils/allPosts';
import { ZAUBERER_CITIES_LIVE } from '../data/zauberer-cities';
import { translatedSitemapPaths } from '../lib/site-map';

type WPItem = {
  link: string;
  date: string;
  type: string;
};

const allItems = [...(pagesData as WPItem[]), ...(postsData as WPItem[])];
const SITE = 'https://liar-entertainer.com';

// Pfade, die per 301 weiterleiten und NICHT in die Sitemap gehoeren.
// (GSC-Fehler "Seite mit Weiterleitung" – Ziel-URLs sind bereits gelistet.)
const REDIRECTING_PATHS = new Set<string>([
  '/clown/clown-zauberer/',            // -> /clown/clownshow/
  '/zauberer/zaubershow/karneval/',    // -> /clown/karneval/
]);

// Hero images for image sitemap.
// WICHTIG: Nur Bilder mit stabiler, oeffentlich erreichbarer URL eintragen.
// Die alten /wp-content/...-Pfade gaben HTTP 410 (Gone) zurueck und wurden entfernt.
const pageImages: Record<string, { loc: string; title: string }[]> = {
  '/': [
    { loc: 'https://liar-entertainer.com/images/og-startseite.jpg', title: 'Clown Zauberer LIAR bei einer Zaubershow in NRW' },
  ],
};

export const GET: APIRoute = async () => {
  const now = new Date().toISOString().split('T')[0];

  const urls: { loc: string; lastmod: string; priority: string; changefreq: string; images?: { loc: string; title: string }[] }[] = [];

  // Homepage
  urls.push({ loc: `${SITE}/`, lastmod: '2026-07-17', priority: '1.0', changefreq: 'weekly', images: pageImages['/'] });

  // Handcrafted static pages (not in WP data)
  const staticPages = [
    { loc: `${SITE}/blog/`, priority: '0.9', changefreq: 'weekly', lastmod: '2026-07-17' },
    { loc: `${SITE}/kindergeburtstag/`, priority: '0.9', changefreq: 'weekly', lastmod: '2026-07-17' },
    { loc: `${SITE}/kinderzauberer/`, priority: '0.9', changefreq: 'weekly', lastmod: '2026-07-17' },
    { loc: `${SITE}/preise/`, priority: '0.9', changefreq: 'weekly', lastmod: '2026-07-17' },
    { loc: `${SITE}/galerie/`, priority: '0.7', changefreq: 'monthly', lastmod: '2026-07-17' },
    { loc: `${SITE}/kontakt/`, priority: '0.8', changefreq: 'monthly', lastmod: '2026-07-17' },
    { loc: `${SITE}/ueber-mich/`, priority: '0.7', changefreq: 'monthly', lastmod: '2026-07-17' },
    { loc: `${SITE}/clown/clownshow/`, priority: '0.9', changefreq: 'weekly', lastmod: '2026-07-17' },
    { loc: `${SITE}/clown/walk-act/`, priority: '0.8', changefreq: 'monthly', lastmod: '2026-07-17' },
    { loc: `${SITE}/clown/ballonmodellage/`, priority: '0.8', changefreq: 'monthly', lastmod: '2026-07-17' },
    { loc: `${SITE}/clown/glitzer-tattoo/`, priority: '0.8', changefreq: 'monthly', lastmod: '2026-07-17' },
    { loc: `${SITE}/clown/karneval/`, priority: '0.8', changefreq: 'monthly', lastmod: '2026-07-17' },
    { loc: `${SITE}/zauberer/`, priority: '0.9', changefreq: 'weekly', lastmod: '2026-07-17' },
    { loc: `${SITE}/zauberer/zaubershow/`, priority: '0.9', changefreq: 'weekly', lastmod: '2026-07-17' },
    { loc: `${SITE}/zauberer/buehnen-zauberer/`, priority: '0.8', changefreq: 'monthly', lastmod: '2026-07-17' },
    { loc: `${SITE}/zauberer/tisch-zauberer/`, priority: '0.8', changefreq: 'monthly', lastmod: '2026-07-17' },
    // taken over from zauberer-liar.de (2026-10-07); indexed together with the 301s (ZAUBERER_CITIES_LIVE)
    ...(ZAUBERER_CITIES_LIVE ? [{ loc: `${SITE}/zauberer/close-up/`, priority: '0.8', changefreq: 'monthly', lastmod: '2026-10-07' }] : []),
    { loc: `${SITE}/zauberer/hochzeit/`, priority: '0.8', changefreq: 'monthly', lastmod: '2026-07-17' },
    { loc: `${SITE}/zauberer/firmenfeier/`, priority: '0.8', changefreq: 'monthly', lastmod: '2026-07-17' },
    { loc: `${SITE}/zauberer/zaubershow/kindergarten-kita/`, priority: '0.8', changefreq: 'monthly', lastmod: '2026-07-17' },
    { loc: `${SITE}/zauberer/zaubershow/schule/`, priority: '0.8', changefreq: 'monthly', lastmod: '2026-07-17' },
    { loc: `${SITE}/zauberer/zaubershow/strassen-sommer-fest/`, priority: '0.8', changefreq: 'monthly', lastmod: '2026-07-17' },
    // Neue City-Pages 17.07.2026 (nicht in pages.json, daher hier)
    { loc: `${SITE}/kinderzauberer/kinderzauberer-in-gladbeck/`, priority: '0.7', changefreq: 'weekly', lastmod: '2026-07-17' },
    { loc: `${SITE}/kinderzauberer/kinderzauberer-in-castrop-rauxel/`, priority: '0.7', changefreq: 'weekly', lastmod: '2026-07-17' },
    { loc: `${SITE}/kinderzauberer/kinderzauberer-in-waltrop/`, priority: '0.7', changefreq: 'weekly', lastmod: '2026-07-17' },
    { loc: `${SITE}/kinderzauberer/kinderzauberer-in-wesel/`, priority: '0.7', changefreq: 'weekly', lastmod: '2026-07-17' },
    { loc: `${SITE}/kinderzauberer/kinderzauberer-in-xanten/`, priority: '0.7', changefreq: 'weekly', lastmod: '2026-07-17' },
    { loc: `${SITE}/clown/clownshow/clown-in-moers/`, priority: '0.7', changefreq: 'weekly', lastmod: '2026-07-17' },
    { loc: `${SITE}/clown/clownshow/clown-in-castrop-rauxel/`, priority: '0.7', changefreq: 'weekly', lastmod: '2026-07-17' },
    { loc: `${SITE}/clown/clownshow/clown-in-waltrop/`, priority: '0.7', changefreq: 'weekly', lastmod: '2026-07-17' },
    { loc: `${SITE}/clown/clownshow/clown-in-wesel/`, priority: '0.7', changefreq: 'weekly', lastmod: '2026-07-17' },
    { loc: `${SITE}/clown/clownshow/clown-in-xanten/`, priority: '0.7', changefreq: 'weekly', lastmod: '2026-07-17' },
  ];
  for (const p of staticPages) {
    const path = p.loc.replace(SITE, '');
    urls.push({ loc: p.loc, lastmod: p.lastmod, priority: p.priority, changefreq: p.changefreq, images: pageImages[path] });
  }

  // FR/EN core pages: only once their locale is published (PUBLISHED_LOCALES in site-map.ts)
  for (const path of translatedSitemapPaths()) {
    urls.push({ loc: `${SITE}${path}`, lastmod: now, priority: '0.7', changefreq: 'monthly' });
  }

  const seenLocs = new Set(urls.map(u => u.loc));

  for (const item of allItems) {
    try {
      const url = new URL(item.link);
      const path = url.pathname.endsWith('/') ? url.pathname : url.pathname + '/';
      if (path === '/') continue;
      if (REDIRECTING_PATHS.has(path)) continue; // 301-Weiterleitung: nicht in Sitemap
      const loc = `${SITE}${path}`;
      if (seenLocs.has(loc)) continue;
      seenLocs.add(loc);

      const lastmod = item.date ? item.date.split(/[T ]/)[0] : now;
      const isBlog = item.type === 'post';
      const isCity = path.includes('kinderzauberer-in-') || path.includes('geburtstag-in-') || path.includes('clown-in-');
      const priority = isBlog ? '0.6' : isCity ? '0.7' : '0.8';
      const changefreq = isBlog ? 'monthly' : 'weekly';

      urls.push({ loc, lastmod, priority, changefreq });
    } catch {
      // skip
    }
  }

  // Astro Content Collection "blog": jeder veroeffentlichte Artikel automatisch.
  // Dedup-Logik identisch zu src/pages/blog/[slug].astro getStaticPaths(),
  // damit Legacy-WP-Posts (in posts.json) nicht doppelt erscheinen.
  const wpSlugs = new Set((postsData as { slug?: string }[]).map((p) => p.slug).filter(Boolean));
  const blogEntries = await getCollection('blog');
  for (const entry of blogEntries) {
    if (entry.data.draft) continue;
    const slug = String(entry.id);
    if (wpSlugs.has(slug)) continue;
    const loc = `${SITE}/blog/${slug}/`;
    if (seenLocs.has(loc)) continue;
    seenLocs.add(loc);

    const lastmod = entry.data.publishDate
      ? new Date(entry.data.publishDate).toISOString().split('T')[0]
      : now;

    urls.push({ loc, lastmod, priority: '0.7', changefreq: 'monthly' });
  }

  // Blog-Kategorien mit >=5 Artikeln (dünnere stehen auf noindex, siehe
  // src/pages/blog/kategorie/[category].astro — Schwelle synchron halten).
  const allCategories = await getAllCategories();
  for (const cat of allCategories) {
    if (cat.count < 5) continue;
    const loc = `${SITE}/blog/kategorie/${cat.slug}/`;
    if (seenLocs.has(loc)) continue;
    seenLocs.add(loc);
    urls.push({ loc, lastmod: now, priority: '0.5', changefreq: 'weekly' });
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
${urls
  .map(
    (u) => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${u.lastmod}</lastmod>${
      u.images
        ? u.images.map((img) => `
    <image:image>
      <image:loc>${img.loc}</image:loc>
      <image:title>${img.title}</image:title>
    </image:image>`).join('')
        : ''
    }
  </url>`
  )
  .join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=86400',
    },
  });
};
