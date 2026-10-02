import * as cheerio from 'cheerio';

export interface PageContent {
  headings: string[]; // "h2 Text", in document order
  blocks: string[]; // every text block, deduplicated
}

const BLOCKS = 'p, li, td, th, dt, dd, blockquote, figcaption, summary, h1, h2, h3, h4, h5, h6';
const norm = (s: string) => s.normalize('NFC').replace(/\s+/g, ' ').trim();

/** Editorial content of a built page: what brief L1 says must survive the redesign 1:1. */
export function contentOf(html: string): PageContent {
  const $ = cheerio.load(html);
  const main = $('main');
  main.find('script, style, noscript, template').remove();
  const headings = main
    .find('h1, h2, h3, h4, h5, h6')
    .map((_, el) => `${el.tagName} ${norm($(el).text())}`)
    .get();
  const blocks = [
    ...new Set(
      main
        .find(BLOCKS)
        .map((_, el) => norm($(el).text()))
        .get()
        .filter(Boolean),
    ),
  ];
  return { headings, blocks };
}
