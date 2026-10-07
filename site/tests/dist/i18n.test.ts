import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { page } from './helpers';
import { CORE_PAGES, TRANSLATED_PAGES, PUBLISHED_LOCALES, SITE, isPublishedPath } from '../../src/lib/site-map';

const DIST = join(import.meta.dirname, '../../dist');
const TARGETS = ['fr', 'en'] as const;
const twins = TRANSLATED_PAGES.flatMap((entry) => TARGETS.map((l) => ({ l, path: entry[l], de: entry.de })));

describe('FR/EN core pages (brief E2, 4.1/4.2)', () => {
  it('builds every translated page', () => {
    expect(twins.filter((t) => !existsSync(join(DIST, t.path, 'index.html'))).map((t) => t.path)).toEqual([]);
  });

  it('sets the language and keeps the zone of the German twin', () => {
    for (const t of twins) {
      const $ = page(t.path);
      expect([t.path, $('html').attr('lang')]).toEqual([t.path, t.l]);
      expect([t.path, $('html').attr('data-zone')]).toEqual([t.path, page(t.de)('html').attr('data-zone')]);
    }
  });

  it('has its own canonical URL', () => {
    for (const t of twins) expect(page(t.path)('link[rel=canonical]').attr('href')).toBe(SITE + t.path);
  });

  it('leaves no German UI chrome in header, footer and quick-contact bar', () => {
    const GERMAN = /\b(Anfragen|Startseite|Jetzt anfragen|Anrufen|Hauptseiten|Alle Rechte vorbehalten|Cookie-Einstellungen|Bewertungen)\b/;
    for (const t of twins) {
      const $ = page(t.path);
      const chrome = ['header.sh', 'footer.sf', '#cookie-consent'].map((s) => $(s).text()).join(' ');
      expect([t.path, chrome.match(GERMAN)?.[0]]).toEqual([t.path, undefined]);
    }
  });

  it('points menu links at the translated core pages', () => {
    for (const t of twins) {
      const $ = page(t.path);
      const hrefs = $('header.sh a').filter((_, a) => !$(a).closest('.sh__lang').length).map((_, a) => $(a).attr('href')).get();
      expect(hrefs).not.toContain('/kontakt/');
      expect(hrefs).toContain(t.l === 'fr' ? '/fr/contact/' : '/en/contact/');
    }
  });

  it('keeps the Netlify form and its honeypot on the translated contact pages', () => {
    for (const l of TARGETS) {
      const $ = page(l === 'fr' ? '/fr/contact/' : '/en/contact/');
      const form = $('form[name=kontakt]');
      expect(form.attr('data-netlify')).toBe('true');
      expect(form.attr('netlify-honeypot')).toBe('website');
      expect(form.attr('action')).toBe(l === 'fr' ? '/fr/contact/merci/' : '/en/contact/thank-you/');
      expect($('input[name=form-name]').attr('value')).toBe('kontakt');
    }
  });

  it('keeps the customer reviews as German quotes', () => {
    const de = page('/kindergeburtstag/')('[data-review-text]').first().text();
    expect(de).not.toBe('');
    expect(page('/fr/anniversaire-enfant/')('[data-review-text]').first().text()).toBe(de);
  });

  it('offers the language switcher on translated core pages', () => {
    for (const entry of CORE_PAGES)
      for (const l of TARGETS) {
        const links = page(entry[l])('.sh__lang a').map((_, a) => page(entry[l])(a).attr('href')).get();
        expect(links).toEqual(['de', 'fr', 'en'].filter((x) => x === 'de' || x === l || !isPublishedPath(entry[l]) || PUBLISHED_LOCALES.includes(x as never)).map((x) => entry[x as 'de']));
      }
  });
});

describe('unpublished locales (owner review before go-live)', () => {
  const unpublished = twins.filter((t) => !isPublishedPath(t.path));

  it('marks unpublished pages noindex', () => {
    for (const t of unpublished) expect([t.path, page(t.path)('meta[name=robots]').attr('content')]).toEqual([t.path, 'noindex,follow']);
  });

  it('keeps German core pages indexable', () => {
    for (const entry of CORE_PAGES.filter((e) => e.de !== '/zauberer/close-up/'))
      expect(page(entry.de)('meta[name=robots]').attr('content')).toMatch(/^index/);
  });

  it('emits no hreflang towards or on unpublished pages', () => {
    const all = TRANSLATED_PAGES.flatMap((e) => Object.values(e));
    for (const path of all) {
      const targets = page(path)('link[rel=alternate][hreflang]').map((_, el) => page(path)(el).attr('href')).get();
      for (const href of targets) expect(isPublishedPath(new URL(href).pathname)).toBe(true);
      if (!isPublishedPath(path)) expect(targets).toEqual([]);
    }
  });

  it('shows no language switcher on German pages while FR and EN are unpublished', () => {
    if (PUBLISHED_LOCALES.length > 1) return;
    for (const entry of CORE_PAGES) expect(page(entry.de)('.sh__lang').length).toBe(0);
  });

  it('leaves unpublished pages out of the sitemap', () => {
    const xml = readFileSync(join(DIST, 'sitemap.xml'), 'utf8');
    for (const t of unpublished) expect(xml).not.toContain(`<loc>${SITE}${t.path}</loc>`);
  });
});
