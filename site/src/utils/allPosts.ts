/**
 * Unified Blog-Post Helper.
 * Merget posts.json (30 Legacy WP-Scraped-Posts) + getCollection('blog') (neue n8n-Workflow Posts).
 * Liefert eine kanonische BlogPostSummary fuer Index/Footer/Related-Articles/Categories.
 */
import { getCollection } from 'astro:content';
import fs from 'node:fs';
import path from 'node:path';
import postsData from '../data/posts.json';
import { legacyCover } from './legacyImages';

export interface BlogPostSummary {
  slug: string;
  href: string;             // "/blog/<slug>/"
  title: string;
  date: Date;
  excerpt: string;
  image: string;
  categories: string[];
  source: 'legacy' | 'collection';
}

interface WPPost {
  title: string;
  slug: string;
  type: string;
  date: string;
  link: string;
  content: string;
  excerpt: string;
  meta: Record<string, string | undefined>;
  categories?: { slug: string; name: string }[];
}

// Lokales Fallback-Bild (public/images/fallback/ — wp-content liefert 410 Gone)
const FALLBACK_IMG = '/images/fallback/clown-zauberer.jpg';

// Kategorie → themenpassendes lokales Fallback-Bild (Reihenfolge = Priorität)
const CAT_IMG: Array<[RegExp, string]> = [
  [/geburtstag/i, '/images/fallback/kindergeburtstag.jpg'],
  [/karneval/i, '/images/fallback/karneval.jpg'],
  [/zauberei/i, '/images/fallback/zaubershow.jpg'],
  [/clown/i, '/images/fallback/clownshow.jpg'],
  [/pantomime/i, '/images/fallback/walk-act.jpg'],
  [/kultur|termine/i, '/images/fallback/fest.jpg'],
];

function categoryFallback(categories: string[]): string {
  const joined = categories.join(' ');
  for (const [re, img] of CAT_IMG) if (re.test(joined)) return img;
  return FALLBACK_IMG;
}

/** Prüft, ob ein lokales Cover-Bild unter public/blog-images/<slug>/cover.jpg existiert. */
function hasLocalCover(slug: string): boolean {
  try {
    return fs.existsSync(
      path.join(process.cwd(), 'public', 'blog-images', slug, 'cover.jpg'),
    );
  } catch {
    return false;
  }
}

function getFirstImage(content: string, categories: string[] = []): string {
  // wp-content-URLs ignorieren (410 Gone) — nur erreichbare Bild-URLs übernehmen
  const matches =
    content.match(/https?:\/\/[^\s"'<>)]+\.(?:jpg|jpeg|png|webp)/gi) || [];
  const reachable = matches.find((u) => !/wp-content/i.test(u));
  if (reachable) return reachable;
  return categoryFallback(categories);
}

function htmlExcerpt(text: string, max = 160): string {
  const clean = text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  return clean.length > max ? clean.slice(0, max).trim() + '…' : clean;
}

/**
 * Loads ALL blog posts (legacy + collection) and returns them sorted descending by date.
 * Same-slug duplicates: collection wins (n8n-generated overrides legacy).
 */
export async function getAllBlogPosts(): Promise<BlogPostSummary[]> {
  // 1) Legacy WP-Posts aus posts.json
  const legacy = (postsData as WPPost[]).map((p): BlogPostSummary => {
    const url = new URL(p.link);
    const href = url.pathname.endsWith('/') ? url.pathname : url.pathname + '/';
    const cats = (p.categories || []).map((c) => c.name).filter(Boolean);
    return {
      slug: p.slug,
      href,
      title: p.title,
      date: new Date(p.date),
      excerpt: htmlExcerpt(p.excerpt || p.content || ''),
      image: legacyCover(p.link)?.src ?? getFirstImage(p.content || '', cats),
      categories: cats.length ? cats : ['Allgemein'],
      source: 'legacy',
    };
  });

  // 2) Neue Posts aus Content-Collection
  const entries = await getCollection('blog');
  const collection = entries
    .filter((e) => !e.data.draft)
    .map((e): BlogPostSummary => {
      const slug = String(e.id);
      const cats = e.data.categories?.length ? e.data.categories : ['Allgemein'];
      return {
        slug,
        href: `/blog/${slug}/`,
        title: e.data.title,
        date: e.data.publishDate,
        excerpt: htmlExcerpt(e.data.description || e.body || ''),
        // Cover nur verlinken, wenn es lokal existiert — sonst Kategorie-Fallback
        // (verhindert 404-Thumbnails bei Posts ohne public/blog-images/<slug>/)
        image:
          e.data.heroImage ||
          (hasLocalCover(slug)
            ? `/blog-images/${slug}/cover.jpg`
            : categoryFallback(cats)),
        categories: cats,
        source: 'collection',
      };
    });

  // 3) Merge: collection schlaegt legacy bei Slug-Konflikt
  const collectionSlugs = new Set(collection.map((p) => p.slug));
  const merged: BlogPostSummary[] = [
    ...collection,
    ...legacy.filter((p) => !collectionSlugs.has(p.slug)),
  ];

  // 4) Sortiert: neueste zuerst
  merged.sort((a, b) => b.date.getTime() - a.date.getTime());

  return merged;
}

/**
 * Posts der gleichen Kategorie (verwandte Artikel), exkl. der aktuellen Slug.
 * Gibt bis zu N Artikel zurueck. Falls weniger als N gefunden, padded mit den
 * neuesten anderen Artikeln.
 */
export async function getRelatedPosts(
  currentSlug: string,
  categories: string[],
  n = 3,
): Promise<BlogPostSummary[]> {
  const all = await getAllBlogPosts();
  const others = all.filter((p) => p.slug !== currentSlug);

  const catSet = new Set((categories || []).map((c) => c.toLowerCase().trim()));

  const related = others.filter((p) =>
    p.categories.some((c) => catSet.has(c.toLowerCase().trim())),
  );

  const result = related.slice(0, n);
  if (result.length < n) {
    const fillers = others
      .filter((p) => !result.some((r) => r.slug === p.slug))
      .slice(0, n - result.length);
    result.push(...fillers);
  }

  return result;
}

/**
 * Aggregiert alle einmaligen Kategorien aus allen Posts mit Anzahl.
 */
export async function getAllCategories(): Promise<
  Array<{ slug: string; name: string; count: number }>
> {
  const all = await getAllBlogPosts();
  const counts = new Map<string, { name: string; count: number }>();
  for (const post of all) {
    for (const cat of post.categories) {
      const slug = catToSlug(cat);
      const existing = counts.get(slug);
      if (existing) {
        existing.count += 1;
      } else {
        counts.set(slug, { name: cat, count: 1 });
      }
    }
  }
  return Array.from(counts.entries())
    .map(([slug, v]) => ({ slug, name: v.name, count: v.count }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Konvertiert einen Kategorie-Namen in einen URL-Slug.
 */
export function catToSlug(name: string): string {
  return String(name)
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
