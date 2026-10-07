/**
 * City pages taken over from zauberer-liar.de (2026-10-07): /zauberer/zauberer-in-<stadt>/.
 * Data per city is extracted from the frozen source pages (scripts/extract-zauberer-cities.ts).
 *
 * ZAUBERER_CITIES_LIVE: the same texts are still online on zauberer-liar.de. Until that domain
 * redirects page by page (ops/redirects-zauberer-liar.csv, brief phase 6), the copies stay out of
 * the index (noindex, not in the sitemap) so Google never sees duplicate content. Flip to true in
 * the same release that switches the 301s on.
 */
export const ZAUBERER_CITIES_LIVE = false;

export interface ZaubererCity {
  slug: string;
  name: string;
  title: string;
  description: string;
  h1Html: string;
  lead: string;
  heroImg: string;
  intro: { eyebrow: string; h2: string; html: string; img: { file: string; alt: string } };
  local: { eyebrow: string; h2: string; intro: string; html: string } | null;
  formats: { eyebrow: string; h2: string; items: { title: string; html: string }[] };
  reviews: { eyebrow: string; h2: string; intro: string; items: { text: string; who: string }[] };
  region: { eyebrow: string; h2: string; intro: string; links: { name: string; href: string | null }[] };
  faq: { eyebrow: string; h2: string; items: { q: string; a: string }[] };
  cta: { eyebrow: string; h2Html: string; text: string };
}

const files = import.meta.glob<ZaubererCity>('./zauberer-cities/*.json', { eager: true, import: 'default' });
export const ZAUBERER_CITIES: ZaubererCity[] = Object.values(files).sort((a, b) => a.name.localeCompare(b.name, 'de'));

export const zaubererCityPath = (slug: string) => `/zauberer/zauberer-in-${slug}/`;
/** the children's magician page of the same city (exists for every city taken over) */
export const kidsCityPath = (slug: string) => `/kinderzauberer/kinderzauberer-in-${slug}/`;
