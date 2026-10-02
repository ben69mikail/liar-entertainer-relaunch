export type Zone = 'kids' | 'adult' | 'neutral';

const LOCALE_PREFIX = /^\/(fr|en)(?=\/)/;

// Order matters: specific kids pages under /zauberer/ win over the adult section.
const ZONE_RULES: Array<[prefix: string, zone: Zone]> = [
  ['/zauberer/zaubershow/kindergarten-kita/', 'kids'],
  ['/zauberer/zaubershow/schule/', 'kids'],
  ['/zauberer/', 'adult'],
  ['/kindergeburtstag/', 'kids'],
  ['/kinderzauberer/', 'kids'],
  ['/clown/', 'kids'],
];

/** Strip the /fr or /en prefix so translated pages resolve like their DE original. */
export function basePath(path: string): string {
  return path.replace(LOCALE_PREFIX, '');
}

export function zoneFor(path: string): Zone {
  const base = basePath(path);
  return ZONE_RULES.find(([prefix]) => base.startsWith(prefix))?.[1] ?? 'neutral';
}

export const SITE = 'https://liar-entertainer.com';
export const LOCALES = ['de', 'fr', 'en'] as const;
export type Locale = (typeof LOCALES)[number];

/** Pages translated to fr/en (brief E2). Everything else is DE-only. */
export const CORE_PAGES = [
  '/',
  '/zauberer/',
  '/zauberer/close-up/',
  '/zauberer/tisch-zauberer/',
  '/zauberer/zaubershow/',
  '/kinderzauberer/',
  '/kindergeburtstag/',
  '/clown/clownshow/',
  '/ueber-mich/',
  '/kontakt/',
];

export function localizedPath(base: string, locale: Locale): string {
  return locale === 'de' ? base : `/${locale}${base}`;
}

export function alternatesFor(path: string): Array<{ hreflang: string; href: string }> {
  const base = basePath(path);
  if (!CORE_PAGES.includes(base)) return [];
  return [
    ...LOCALES.map((l) => ({ hreflang: l, href: SITE + localizedPath(base, l) })),
    { hreflang: 'x-default', href: SITE + base },
  ];
}
