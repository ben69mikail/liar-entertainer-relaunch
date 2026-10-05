import * as cheerio from 'cheerio';

export interface PageMeta {
  title: string;
  description: string;
  canonical: string;
  robots: string;
  ogImage: string;
  schemaTypes: string[]; // every @type found in JSON-LD, sorted
}

/** SEO-relevant head data of a built page (brief L1 / Phase 5: must survive the relaunch unchanged). */
export function metaOf(html: string): PageMeta {
  const $ = cheerio.load(html);
  const types: string[] = [];
  const collect = (node: unknown): void => {
    if (Array.isArray(node)) return node.forEach(collect);
    if (node && typeof node === 'object') {
      for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
        if (k === '@type') types.push(...(Array.isArray(v) ? v.map(String) : [String(v)]));
        else collect(v);
      }
    }
  };
  $('script[type="application/ld+json"]').each((_, el) => collect(JSON.parse($(el).text())));
  return {
    title: $('title').text().trim(),
    description: $('meta[name="description"]').attr('content') ?? '',
    canonical: $('link[rel="canonical"]').attr('href') ?? '',
    robots: $('meta[name="robots"]').attr('content') ?? '',
    ogImage: $('meta[property="og:image"]').attr('content') ?? '',
    schemaTypes: types.sort(),
  };
}
