/**
 * FR/EN pages are the German pages, rendered on their translated URL and translated here
 * (src/middleware.ts). The German templates stay untouched (L1); every visible German string
 * must have an entry in src/i18n/strings/*.json, otherwise the build fails and names it.
 *
 * Units: an element with its own (non-blank) text is translated as a whole, inline markup
 * included (key = its normalised German innerHTML). Elements with only child elements are
 * walked further. Attributes (alt, aria-label, …) are translated separately, then every
 * internal link is pointed at its twin (localizePath).
 */
import * as cheerio from 'cheerio';
import type { AnyNode, Element } from 'domhandler';
import { localizePath, SITE, type Locale } from '../lib/site-map';

export type Entry = { de: string; fr: string; en: string; note?: string };
export type Missing = { kind: 'text' | 'attr' | 'meta' | 'json-ld'; de: string };
type Target = Exclude<Locale, 'de'>;

/**
 * Key of a German string: whitespace-insensitive, without Astro's scoped-style attributes
 * (translations need not repeat them, see restoreAttributes) and with the running copyright year
 * as {YEAR}.
 */
export const norm = (s: string) =>
  s
    .replace(/\s+data-astro-cid-[a-z0-9]+(="")?/g, '')
    .replace(/©\s*20\d\d/g, '© {YEAR}')
    .replace(/\s+/g, ' ')
    .trim();

/**
 * Translations name only the tags they need (`<strong>`, `<a href="…">`). Every attribute of the
 * n-th German tag of the same name that the translation leaves out (scoped-style ids, classes)
 * is copied onto the n-th translated one.
 */
function restoreAttributes(translated: string, german: string): string {
  const $d = cheerio.load(german, null, false);
  const source = new Map<string, Element[]>();
  $d('*').each((_, el) => {
    const list = source.get(el.tagName) ?? [];
    list.push(el);
    source.set(el.tagName, list);
  });
  const $t = cheerio.load(translated.replace(/\{YEAR\}/g, String(new Date().getFullYear())), null, false);
  const seen = new Map<string, number>();
  $t('*').each((_, el) => {
    const i = seen.get(el.tagName) ?? 0;
    seen.set(el.tagName, i + 1);
    const from = source.get(el.tagName)?.[i];
    if (from) for (const [k, v] of Object.entries(from.attribs)) if (!(k in el.attribs)) el.attribs[k] = v;
  });
  return $t.html();
}

const LETTER = /\p{L}/u;
/** quoted or proper-name content that stays German (reviews are real Google quotes) */
const KEEP =
  'script, style, svg, template, [data-i18n="keep"], [data-review-text], .rv__name, .rv__avatar, ' +
  // inline guest reviews on /zauberer/zaubershow/
  '.zs-guest__text, .zs-guest__name, .zs-guest__avatar';
const ATTRS = ['alt', 'aria-label', 'title', 'placeholder', 'data-name', 'data-title'];
const META = ['description', 'og:title', 'og:description', 'twitter:title', 'twitter:description'];
const OG_LOCALE: Record<Target, string> = { fr: 'fr_FR', en: 'en_GB' };
/** JSON-LD keys whose text must be translated; nodes of the business/website entity stay as they are */
const LD_TEXT = new Set(['name', 'description', 'text', 'serviceType', 'caption', 'headline', 'alternateName']);
const LD_KEEP_ID = /#(business|website|person)$/;
const LD_LANG_TYPES = new Set(['WebPage', 'FAQPage', 'AboutPage', 'ContactPage']);

export function buildDictionary(entries: Entry[]): Map<string, Entry> {
  const dict = new Map<string, Entry>();
  for (const e of entries) {
    const key = norm(e.de);
    const prev = dict.get(key);
    if (prev && (prev.fr !== e.fr || prev.en !== e.en))
      throw new Error(`i18n: "${key.slice(0, 80)}" has two different translations`);
    dict.set(key, e);
  }
  return dict;
}

export function translateHtml(html: string, locale: Target, dict: Map<string, Entry>) {
  const $ = cheerio.load(html);
  const missing: Missing[] = [];
  const lookup = (de: string, kind: Missing['kind']): string | undefined => {
    const key = norm(de);
    if (!LETTER.test(key)) return undefined;
    const hit = dict.get(key)?.[locale];
    if (hit) return hit;
    missing.push({ kind, de: key });
    return undefined;
  };
  const localUrl = (url: string) =>
    url.startsWith(SITE + '/') ? SITE + localizePath(url.slice(SITE.length), locale) : url;

  $('html').attr('lang', locale);
  $('[data-i18n="drop"]').remove();
  $('meta[name="keywords"]').remove();

  // head
  const title = $('title').first();
  if (title.length) {
    const t = lookup(title.text(), 'meta');
    if (t) title.text(t);
  }
  for (const name of META) {
    const el = $(`meta[name="${name}"], meta[property="${name}"]`);
    el.each((_, m) => {
      const t = lookup($(m).attr('content') ?? '', 'meta');
      if (t) $(m).attr('content', t);
    });
  }
  $('meta[property="og:locale"]').attr('content', OG_LOCALE[locale]);
  $('meta[property="og:url"]').each((_, m) => { $(m).attr('content', localUrl($(m).attr('content') ?? '')); });
  $('link[rel="canonical"]').each((_, l) => { $(l).attr('href', localUrl($(l).attr('href') ?? '')); });

  // structured data
  $('script[type="application/ld+json"]').each((_, s) => {
    const data = JSON.parse($(s).html() ?? 'null');
    const walk = (v: unknown, key?: string): unknown => {
      if (typeof v === 'string') {
        if (LD_KEEP_ID.test(v)) return v;
        if (/^https?:\/\//.test(v)) return localUrl(v);
        if (key && LD_TEXT.has(key)) return lookup(v, 'json-ld') ?? v;
        return v;
      }
      if (Array.isArray(v)) return v.map((x) => walk(x, key));
      if (v && typeof v === 'object') {
        const o = v as Record<string, unknown>;
        if (typeof o['@id'] === 'string' && LD_KEEP_ID.test(o['@id']) && Object.keys(o).length > 1) return o;
        const out: Record<string, unknown> = {};
        for (const [k, x] of Object.entries(o)) out[k] = k === 'inLanguage' ? locale : walk(x, k);
        if (typeof o['@type'] === 'string' && LD_LANG_TYPES.has(o['@type'])) out.inLanguage = locale;
        return out;
      }
      return v;
    };
    $(s).text(JSON.stringify(walk(data)));
  });

  // body text, unit by unit
  const visit = (el: Element) => {
    if ($(el).is(KEEP)) return;
    const own = el.children.some((c: AnyNode) => c.type === 'text' && /\S/.test((c as unknown as { data: string }).data));
    if (own) {
      const de = $(el).html() ?? '';
      const t = lookup(de, 'text');
      if (t) {
        const lead = /^\s/.test(de) ? ' ' : '';
        const tail = /\s$/.test(de) ? ' ' : '';
        $(el).html(lead + restoreAttributes(t, de) + tail);
      }
      return;
    }
    for (const c of el.children) if (c.type === 'tag') visit(c as Element);
  };
  const body = $('body').get(0);
  if (body) visit(body as Element);

  // attributes (also inside translated units, which keep their German attributes)
  $('body *').each((_, el) => {
    if ($(el).closest('[data-i18n="keep"]').length) return;
    for (const [name, value] of Object.entries((el as Element).attribs)) {
      if (!(ATTRS.includes(name) || name.startsWith('data-msg-'))) continue;
      const t = lookup(value, 'attr');
      if (t) $(el).attr(name, t);
    }
  });

  // links and form targets
  $('a[href], form[action]').each((_, el) => {
    if ($(el).closest('[data-i18n="keep"]').length) return;
    const attr = el.tagName === 'form' ? 'action' : 'href';
    const v = $(el).attr(attr) ?? '';
    $(el).attr(attr, localUrl(localizePath(v, locale)));
  });

  return { html: $.html(), missing };
}
