import pagesData from '../data/pages.json';
import postsData from '../data/posts.json';
import scrapedPagesData from '../data/scraped-pages.json';

export interface WPPage {
  title: string;
  slug: string;
  type: string;
  status: string;
  content: string;
  excerpt: string;
  date: string;
  link: string;
  meta: Record<string, string | undefined>;
  categories: { slug: string; name: string }[];
}

interface ScrapedPage {
  scrapedHtml: string;
  type: string;
  url: string;
  htmlLength: number;
}

const scrapedPages = scrapedPagesData as Record<string, ScrapedPage>;
const pages = pagesData as WPPage[];
const posts = postsData as WPPage[];

export function getAllPages(): WPPage[] {
  return pages;
}

export function getAllPosts(): WPPage[] {
  return posts;
}

export function getPage(slug: string): WPPage | undefined {
  return pages.find((p) => p.slug === slug) || posts.find((p) => p.slug === slug);
}

export function getScrapedContent(slug: string): string | null {
  return scrapedPages[slug]?.scrapedHtml || null;
}

export function resolveTitle(template: string, title: string, siteName = 'Clown Zauberer LIAR'): string {
  if (!template) return title;
  return template
    .replace(/%title%/g, title)
    .replace(/%sitename%/g, siteName)
    .replace(/%sep%/g, '|')
    .replace(/%page%/g, '')
    .trim();
}

export function getPostThumbnail(content: string): string | null {
  const match = content.match(
    /https?:\/\/liar-entertainer\.com\/wp-content\/uploads\/[^\s"'<>)]+\.(jpg|jpeg|png|webp)/i
  );
  return match ? match[0] : null;
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' });
}

export const siteConfig = {
  name: 'Clown Zauberer LIAR',
  tagline: 'Professioneller Clown Zauberer in NRW',
  phone: '+49 172 1517578',
  phoneDisplay: '+49 172 1517578',
  email: 'info@liar-entertainer.com',
  address: 'Beethovenstr. 15',
  city: 'Gladbeck',
  zip: '45966',
  state: 'NRW',
  country: 'Deutschland',
  url: 'https://liar-entertainer.com',
  facebook: 'https://www.facebook.com/clownzaubererliar',
  instagram: 'https://www.instagram.com/clown_zauberer_liar',
  googleReviewsCount: '370+',
  googleRating: '5.0',
  priceFrom: '150',
};

export interface RouteEntry {
  slug: string;
  path: string;
  segments: string[];
}

// Build URL route map from pages.json link fields
function buildRouteMap(): Map<string, RouteEntry> {
  const map = new Map<string, RouteEntry>();
  for (const page of pages) {
    const url = new URL(page.link);
    let path = url.pathname;
    if (path.length > 1 && path.endsWith('/')) path = path.slice(0, -1);
    if (path === '/' || path === '') continue;
    const segments = path.split('/').filter(Boolean);
    map.set(page.slug, { slug: page.slug, path, segments });
  }
  // Also add blog posts
  for (const post of posts) {
    const url = new URL(post.link);
    let path = url.pathname;
    if (path.length > 1 && path.endsWith('/')) path = path.slice(0, -1);
    if (path === '/' || path === '') continue;
    const segments = path.split('/').filter(Boolean);
    if (!map.has(post.slug)) {
      map.set(post.slug, { slug: post.slug, path, segments });
    }
  }
  return map;
}

export const routeMap = buildRouteMap();

export function getSlugFromPath(pathSegments: string[]): string | undefined {
  for (const [slug, entry] of routeMap) {
    if (
      entry.segments.length === pathSegments.length &&
      entry.segments.every((s, i) => s === pathSegments[i])
    ) {
      return slug;
    }
  }
  return undefined;
}

export function getAllRouteEntries(): RouteEntry[] {
  return Array.from(routeMap.values());
}
