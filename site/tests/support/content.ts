import * as cheerio from 'cheerio';
import type { AnyNode } from 'domhandler';

export interface PageContent {
  headings: string[]; // "h2 Text", in document order
  blocks: string[]; // text of every element that carries its own text, deduplicated
}

const norm = (s: string) => s.normalize('NFC').replace(/\s+/g, ' ').trim();
const ownsText = (el: AnyNode) =>
  'children' in el && el.children.some((c) => c.type === 'text' && norm((c as { data: string }).data) !== '');

/**
 * Editorial content of a built page: what brief L1 says must survive the redesign 1:1.
 * Tag-agnostic on purpose: a <div> may become a <p>, but no text may disappear.
 */
export function contentOf(html: string): PageContent {
  const $ = cheerio.load(html);
  const main = $('main');
  // Decoration hidden from assistive tech (sparkles, blobs, icons) is not editorial content.
  main.find('script, style, noscript, template, svg, [aria-hidden="true"]').remove();
  const headings = main
    .find('h1, h2, h3, h4, h5, h6')
    .map((_, el) => `${el.tagName} ${norm($(el).text())}`)
    .get();
  const blocks = [
    ...new Set(
      main
        .find('*')
        .filter((_, el) => ownsText(el))
        .map((_, el) => norm($(el).text()))
        .get()
        .filter(Boolean),
    ),
  ];
  return { headings, blocks };
}
