export type Zone = 'kids' | 'adult' | 'neutral';

export const SITE = 'https://liar-entertainer.com';
export const LOCALES = ['de', 'fr', 'en'] as const;
export type Locale = (typeof LOCALES)[number];

/**
 * Locales whose pages are actually built. hreflang is only emitted between
 * published locales, so we never point Google at pages that do not exist yet.
 * Add 'fr' / 'en' here once their core pages ship.
 */
export const PUBLISHED_LOCALES: readonly Locale[] = ['de'];

/**
 * Pages translated to fr/en (brief E2), with their translated paths.
 * Everything else is DE-only. Single source of truth for routing + hreflang.
 */
export const CORE_PAGES: Array<Record<Locale, string>> = [
  { de: '/', fr: '/fr/', en: '/en/' },
  { de: '/zauberer/', fr: '/fr/magicien/', en: '/en/magician/' },
  { de: '/zauberer/close-up/', fr: '/fr/magicien/close-up/', en: '/en/magician/close-up/' },
  { de: '/zauberer/tisch-zauberer/', fr: '/fr/magicien/magicien-de-table/', en: '/en/magician/table-magician/' },
  { de: '/zauberer/zaubershow/', fr: '/fr/magicien/spectacle-de-magie/', en: '/en/magician/magic-show/' },
  { de: '/kinderzauberer/', fr: '/fr/magicien-pour-enfants/', en: '/en/childrens-magician/' },
  { de: '/kindergeburtstag/', fr: '/fr/anniversaire-enfant/', en: '/en/kids-birthday-party/' },
  { de: '/clown/clownshow/', fr: '/fr/clown/spectacle-de-clown/', en: '/en/clown/clown-show/' },
  { de: '/ueber-mich/', fr: '/fr/a-propos/', en: '/en/about/' },
  { de: '/kontakt/', fr: '/fr/contact/', en: '/en/contact/' },
];

// Order matters: specific kids pages under /zauberer/ win over the adult section.
const ZONE_RULES: Array<[prefix: string, zone: Zone]> = [
  // the Zaubershow and everything below it is a children's show (user, 2026-10-06)
  ['/zauberer/zaubershow/', 'kids'],
  ['/zauberer/', 'adult'],
  ['/kindergeburtstag/', 'kids'],
  ['/kinderzauberer/', 'kids'],
  ['/clown/', 'kids'],
];

/**
 * Translated pages that are NOT core pages: built per locale (they are form targets), but never
 * get hreflang or a sitemap entry (they are noindex anyway).
 */
export const EXTRA_PAGES: Array<Record<Locale, string>> = [
  { de: '/kontakt/danke/', fr: '/fr/contact/merci/', en: '/en/contact/thank-you/' },
];

/** Every page that exists in all locales: routing, link localisation, zones. */
export const TRANSLATED_PAGES = [...CORE_PAGES, ...EXTRA_PAGES];

function coreEntry(path: string) {
  return CORE_PAGES.find((entry) => LOCALES.some((l) => entry[l] === path));
}

function translatedEntry(path: string) {
  return TRANSLATED_PAGES.find((entry) => LOCALES.some((l) => entry[l] === path));
}

/** Locale of a page path: '/fr/…' and '/en/…' are translations, everything else is German. */
export function localeOf(path: string): Locale {
  const m = /^\/(fr|en)(\/|$)/.exec(path);
  return (m?.[1] as Locale | undefined) ?? 'de';
}

/**
 * A page is published when its locale is. Unpublished pages are built (owner review) but carry
 * noindex, get no hreflang and stay out of the sitemap.
 */
export function isPublishedPath(path: string, locales: readonly Locale[] = PUBLISHED_LOCALES): boolean {
  return locales.includes(localeOf(path));
}

/** FR/EN core pages that belong in sitemap.xml (published locales only). */
export function translatedSitemapPaths(locales: readonly Locale[] = PUBLISHED_LOCALES): string[] {
  return locales.filter((l) => l !== 'de').flatMap((l) => CORE_PAGES.map((entry) => entry[l]));
}

/**
 * Point an internal link at its twin in `locale`; pages without a translation keep their German
 * URL. Hash and query survive; external and in-page links are returned unchanged.
 */
export function localizePath(href: string, locale: Locale): string {
  if (locale === 'de' || !href.startsWith('/') || href.startsWith('//')) return href;
  const cut = href.search(/[?#]/);
  const path = cut === -1 ? href : href.slice(0, cut);
  const rest = cut === -1 ? '' : href.slice(cut);
  const entry = TRANSLATED_PAGES.find((e) => e.de === path);
  return entry ? entry[locale] + rest : href;
}

/**
 * Header language switcher. Core pages only. A published page offers the published languages;
 * an unpublished (review) page offers all, so the owner can compare. Fewer than two → none.
 */
// Header switcher: every core page offers DE · FR · EN (user, 2026-10-07) — unpublished
// FR/EN pages stay noindex and out of the sitemap, so linking them is safe.
export function languageLinks(path: string): Array<{ locale: Locale; href: string; current: boolean }> {
  const entry = coreEntry(path);
  if (!entry) return [];
  const own = localeOf(path);
  return LOCALES.map((l) => ({ locale: l, href: entry[l], current: l === own }));
}

/** Resolve any page path (DE or translated page) to its German original. */
export function basePath(path: string): string {
  return translatedEntry(path)?.de ?? path;
}

export function zoneFor(path: string): Zone {
  const base = basePath(path);
  return ZONE_RULES.find(([prefix]) => base.startsWith(prefix))?.[1] ?? 'neutral';
}

export function alternatesFor(
  path: string,
  locales: readonly Locale[] = PUBLISHED_LOCALES,
): Array<{ hreflang: string; href: string }> {
  const entry = coreEntry(path);
  if (!entry || locales.length < 2 || !isPublishedPath(path, locales)) return [];
  return [
    ...locales.map((l) => ({ hreflang: l, href: SITE + entry[l] })),
    { hreflang: 'x-default', href: SITE + entry.de },
  ];
}
