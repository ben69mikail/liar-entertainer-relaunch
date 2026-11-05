import { describe, it, expect } from 'vitest';
import {
  zoneFor,
  alternatesFor as alternatesForLocales,
  LOCALES,
  CORE_PAGES,
  TRANSLATED_PAGES,
  localeOf,
  isPublishedPath,
  localizePath,
  languageLinks,
  translatedSitemapPaths,
} from '../src/lib/site-map';

// Table logic is tested with all locales; publishing is guarded by tests/dist/hreflang.test.ts.
const alternatesFor = (path: string) => alternatesForLocales(path, LOCALES);

describe('zoneFor', () => {
  it('puts children pages in the kids zone', () => {
    expect(zoneFor('/kindergeburtstag/')).toBe('kids');
    expect(zoneFor('/kinderzauberer/kinderzauberer-in-gladbeck/')).toBe('kids');
    expect(zoneFor('/clown/clownshow/clown-in-moers/')).toBe('kids');
  });
});

describe('zoneFor (adult)', () => {
  it('puts magician pages in the adult zone', () => {
    expect(zoneFor('/zauberer/')).toBe('adult');
    expect(zoneFor('/zauberer/close-up/')).toBe('adult');
    expect(zoneFor('/zauberer/hochzeit/')).toBe('adult');
  });

  it('keeps children shows under /zauberer/ in the kids zone', () => {
    expect(zoneFor('/zauberer/zaubershow/kindergarten-kita/')).toBe('kids');
    expect(zoneFor('/zauberer/zaubershow/schule/')).toBe('kids');
    expect(zoneFor('/zauberer/zaubershow/strassen-sommer-fest/')).toBe('kids');
  });

  it('puts the Zaubershow and every page below it in the kids zone (user, 2026-10-06)', () => {
    expect(zoneFor('/zauberer/zaubershow/')).toBe('kids');
    expect(zoneFor('/zauberer/zaubershow/karneval/')).toBe('kids');
    for (const p of ['/zauberer/', '/zauberer/buehnen-zauberer/', '/zauberer/tisch-zauberer/', '/zauberer/hochzeit/', '/zauberer/firmenfeier/'])
      expect(zoneFor(p)).toBe('adult');
  });

  it('applies zones to translated paths', () => {
    expect(zoneFor('/fr/magicien/')).toBe('adult');
    expect(zoneFor('/en/magician/close-up/')).toBe('adult');
    expect(zoneFor('/fr/anniversaire-enfant/')).toBe('kids');
    expect(zoneFor('/en/childrens-magician/')).toBe('kids');
  });

  it('leaves umbrella pages neutral', () => {
    expect(zoneFor('/')).toBe('neutral');
    expect(zoneFor('/kontakt/')).toBe('neutral');
    expect(zoneFor('/blog/some-post/')).toBe('neutral');
  });
});

describe('alternatesFor (hreflang)', () => {
  it('links a core page to de, fr, en and x-default', () => {
    expect(alternatesFor('/zauberer/')).toEqual([
      { hreflang: 'de', href: 'https://liar-entertainer.com/zauberer/' },
      { hreflang: 'fr', href: 'https://liar-entertainer.com/fr/magicien/' },
      { hreflang: 'en', href: 'https://liar-entertainer.com/en/magician/' },
      { hreflang: 'x-default', href: 'https://liar-entertainer.com/zauberer/' },
    ]);
  });

  it('returns the same set from every language version (bidirectional)', () => {
    expect(alternatesFor('/fr/contact/')).toEqual(alternatesFor('/kontakt/'));
    expect(alternatesFor('/en/kids-birthday-party/')).toEqual(alternatesFor('/kindergeburtstag/'));
    expect(alternatesFor('/en/')).toEqual(alternatesFor('/'));
  });

  it('gives DE-only pages no alternates', () => {
    expect(alternatesFor('/kinderzauberer/kinderzauberer-in-gladbeck/')).toEqual([]);
    expect(alternatesFor('/blog/some-post/')).toEqual([]);
    expect(alternatesFor('/blog/')).toEqual([]);
  });

  it('emits the full mesh even when only German is in PUBLISHED_LOCALES (FR/EN core are force-published)', () => {
    expect(alternatesForLocales('/zauberer/', ['de'])).toEqual([
      { hreflang: 'de', href: 'https://liar-entertainer.com/zauberer/' },
      { hreflang: 'fr', href: 'https://liar-entertainer.com/fr/magicien/' },
      { hreflang: 'en', href: 'https://liar-entertainer.com/en/magician/' },
      { hreflang: 'x-default', href: 'https://liar-entertainer.com/zauberer/' },
    ]);
  });

  it('does not invent translations by prefixing German slugs', () => {
    expect(alternatesFor('/fr/zauberer/')).toEqual([]);
  });
});

describe('localeOf', () => {
  it('reads the locale from the path prefix, German by default', () => {
    expect(localeOf('/')).toBe('de');
    expect(localeOf('/zauberer/')).toBe('de');
    expect(localeOf('/fr/')).toBe('fr');
    expect(localeOf('/fr/magicien/')).toBe('fr');
    expect(localeOf('/en/about/')).toBe('en');
    expect(localeOf('/french-fries/')).toBe('de');
  });
});

describe('zoneFor (translated twins)', () => {
  it('gives every FR/EN page the zone of its German twin', () => {
    for (const entry of TRANSLATED_PAGES)
      for (const l of LOCALES) expect([entry[l], zoneFor(entry[l])]).toEqual([entry[l], zoneFor(entry.de)]);
  });

  it('keeps the Zaubershow twins in the kids zone', () => {
    expect(zoneFor('/fr/magicien/spectacle-de-magie/')).toBe('kids');
    expect(zoneFor('/en/magician/magic-show/')).toBe('kids');
    expect(zoneFor('/fr/magicien/magicien-de-table/')).toBe('adult');
  });
});

describe('published FR/EN core pages (indexed regardless of PUBLISHED_LOCALES)', () => {
  it('treats German and FR/EN core pages as published by default, non-core twins as unpublished', () => {
    expect(isPublishedPath('/zauberer/')).toBe(true);
    expect(isPublishedPath('/fr/magicien/')).toBe(true);
    expect(isPublishedPath('/en/')).toBe(true);
    // non-core translated pages (EXTRA_PAGES, e.g. the thank-you page) stay unpublished
    expect(isPublishedPath('/fr/contact/merci/')).toBe(false);
    expect(isPublishedPath('/en/contact/thank-you/')).toBe(false);
  });

  it('publishes a non-core translated page only once its locale is listed', () => {
    expect(isPublishedPath('/fr/contact/merci/', ['de', 'fr'])).toBe(true);
    expect(isPublishedPath('/en/contact/thank-you/', ['de', 'fr'])).toBe(false);
  });

  it('emits no hreflang on a non-core translated page, even when its locale is live', () => {
    expect(alternatesForLocales('/fr/contact/merci/', ['de', 'fr', 'en'])).toEqual([]);
    expect(alternatesForLocales('/en/contact/thank-you/', ['de', 'fr', 'en'])).toEqual([]);
  });

  it('links the full de/fr/en mesh from any core page, regardless of PUBLISHED_LOCALES', () => {
    expect(alternatesForLocales('/fr/magicien/', ['de'])).toEqual([
      { hreflang: 'de', href: 'https://liar-entertainer.com/zauberer/' },
      { hreflang: 'fr', href: 'https://liar-entertainer.com/fr/magicien/' },
      { hreflang: 'en', href: 'https://liar-entertainer.com/en/magician/' },
      { hreflang: 'x-default', href: 'https://liar-entertainer.com/zauberer/' },
    ]);
    expect(alternatesForLocales('/en/magician/', ['de', 'fr'])).toEqual([
      { hreflang: 'de', href: 'https://liar-entertainer.com/zauberer/' },
      { hreflang: 'fr', href: 'https://liar-entertainer.com/fr/magicien/' },
      { hreflang: 'en', href: 'https://liar-entertainer.com/en/magician/' },
      { hreflang: 'x-default', href: 'https://liar-entertainer.com/zauberer/' },
    ]);
  });

  it('adds every FR/EN core page to the sitemap but no non-core twins, regardless of PUBLISHED_LOCALES', () => {
    const all = translatedSitemapPaths(['de']);
    expect(all).toHaveLength(CORE_PAGES.length * 2);
    expect(all).toContain('/fr/contact/');
    expect(all).toContain('/en/kids-birthday-party/');
    expect(all).not.toContain('/fr/contact/merci/');
    // the locale list does not gate core FR/EN pages — same result for every locale set
    expect(translatedSitemapPaths(['de', 'fr', 'en'])).toEqual(all);
    expect(translatedSitemapPaths(['de', 'en'])).toEqual(all);
  });
});

describe('localizePath', () => {
  it('maps German links to the twin in the target locale', () => {
    expect(localizePath('/kontakt/', 'fr')).toBe('/fr/contact/');
    expect(localizePath('/', 'en')).toBe('/en/');
    expect(localizePath('/kontakt/danke/', 'en')).toBe('/en/contact/thank-you/');
    expect(localizePath('/zauberer/', 'de')).toBe('/zauberer/');
  });

  it('keeps hash and query', () => {
    expect(localizePath('/kontakt/#anfrage', 'fr')).toBe('/fr/contact/#anfrage');
    expect(localizePath('/kontakt/?fehler=1', 'en')).toBe('/en/contact/?fehler=1');
  });

  it('falls back to the German page when there is no translation', () => {
    expect(localizePath('/blog/', 'fr')).toBe('/blog/');
    expect(localizePath('/kinderzauberer/kinderzauberer-in-essen/', 'en')).toBe('/kinderzauberer/kinderzauberer-in-essen/');
    expect(localizePath('#bewertungen', 'fr')).toBe('#bewertungen');
    expect(localizePath('https://wa.me/491721517578', 'fr')).toBe('https://wa.me/491721517578');
  });
});

describe('languageLinks (header switcher)', () => {
  // user 2026-10-07: German pages offer DE · FR · EN too (FR/EN stay noindex until published)
  it('shows every language on a German core page, published or not', () => {
    expect(languageLinks('/zauberer/')).toEqual([
      { locale: 'de', href: '/zauberer/', current: true },
      { locale: 'fr', href: '/fr/magicien/', current: false },
      { locale: 'en', href: '/en/magician/', current: false },
    ]);
  });

  it('lists every language on an unpublished review page', () => {
    expect(languageLinks('/fr/magicien/')).toEqual([
      { locale: 'de', href: '/zauberer/', current: false },
      { locale: 'fr', href: '/fr/magicien/', current: true },
      { locale: 'en', href: '/en/magician/', current: false },
    ]);
  });


  it('shows nothing on pages without translations', () => {
    expect(languageLinks('/blog/')).toEqual([]);
  });

  it('covers every translated page, not only the core pages (thank-you page)', () => {
    expect(languageLinks('/fr/contact/merci/')).toEqual([
      { locale: 'de', href: '/kontakt/danke/', current: false },
      { locale: 'fr', href: '/fr/contact/merci/', current: true },
      { locale: 'en', href: '/en/contact/thank-you/', current: false },
    ]);
  });
});
