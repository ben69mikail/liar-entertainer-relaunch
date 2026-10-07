/**
 * FR/EN: the German page is rendered on the translated URL (src/pages/fr|en/…), then translated
 * here at build time. A missing translation fails the build, naming the string — unless
 * I18N_MISSING=<file> is set, which collects them instead (used to prepare new strings).
 */
import { defineMiddleware } from 'astro:middleware';
import { appendFileSync } from 'node:fs';
import { localeOf } from './lib/site-map';
import { buildDictionary, translateHtml, type Entry } from './i18n/translate-html';

const files = import.meta.glob<Entry[]>('./i18n/strings/*.json', { eager: true, import: 'default' });
const dict = buildDictionary(Object.values(files).flat());

export const onRequest = defineMiddleware(async (context, next) => {
  const response = await next();
  const locale = localeOf(context.url.pathname);
  if (locale === 'de' || !(response.headers.get('content-type') ?? 'text/html').includes('text/html')) return response;

  const { html, missing } = translateHtml(await response.text(), locale, dict);
  if (missing.length) {
    const collect = process.env.I18N_MISSING;
    if (!collect) {
      const list = [...new Set(missing.map((m) => `  [${m.kind}] ${m.de.slice(0, 140)}`))].join('\n');
      throw new Error(`i18n: ${missing.length} untranslated string(s) on ${context.url.pathname} (${locale}):\n${list}`);
    }
    appendFileSync(collect, missing.map((m) => JSON.stringify({ path: context.url.pathname, ...m })).join('\n') + '\n');
  }
  return new Response(html, { status: response.status, headers: response.headers });
});
