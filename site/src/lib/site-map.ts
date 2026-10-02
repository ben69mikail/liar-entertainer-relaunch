export type Zone = 'kids' | 'adult' | 'neutral';

export const SITE = 'https://liar-entertainer.com';
export const LOCALES = ['de', 'fr', 'en'] as const;
export type Locale = (typeof LOCALES)[number];

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
  ['/zauberer/zaubershow/kindergarten-kita/', 'kids'],
  ['/zauberer/zaubershow/schule/', 'kids'],
  ['/zauberer/zaubershow/strassen-sommer-fest/', 'kids'],
  ['/zauberer/', 'adult'],
  ['/kindergeburtstag/', 'kids'],
  ['/kinderzauberer/', 'kids'],
  ['/clown/', 'kids'],
];

function coreEntry(path: string) {
  return CORE_PAGES.find((entry) => LOCALES.some((l) => entry[l] === path));
}

/** Resolve any page path (DE or translated core page) to its German original. */
export function basePath(path: string): string {
  return coreEntry(path)?.de ?? path;
}

export function zoneFor(path: string): Zone {
  const base = basePath(path);
  return ZONE_RULES.find(([prefix]) => base.startsWith(prefix))?.[1] ?? 'neutral';
}

export function alternatesFor(path: string): Array<{ hreflang: string; href: string }> {
  const entry = coreEntry(path);
  if (!entry) return [];
  return [
    ...LOCALES.map((l) => ({ hreflang: l, href: SITE + entry[l] })),
    { hreflang: 'x-default', href: SITE + entry.de },
  ];
}
