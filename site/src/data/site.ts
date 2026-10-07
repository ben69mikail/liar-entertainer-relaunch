// Single source for site-wide data shared by the legacy and v2 layouts.
// (Legacy Footer.astro still hard-codes its lists until every page runs on v2.)

export const CONTACT = {
  name: 'Clown Zauberer LIAR',
  person: 'Michaël Prescler',
  address: 'Beethovenstr. 15, 45966 Gladbeck',
  phoneDisplay: '0172-1517578',
  phoneHref: 'tel:+491721517578',
  email: 'info@liar-entertainer.com',
  whatsappHref: 'https://wa.me/491721517578',
  googleReviewHref:
    'https://www.google.com/maps/place/Clown+Zauberer+LIAR,+Beethovenstra%C3%9Fe+15,+45966+Gladbeck/data=!4m2!3m1!1s0x47b8eed84b67a41d:0x775f1c8f05280e76',
  instagram: { href: 'https://www.instagram.com/clown_zauberer_liar/', label: '@clown_zauberer_liar' },
  facebook: { href: 'https://www.facebook.com/clownzaubererliar/', label: 'Clown Zauberer LIAR' },
};

/** Real values only (brief L3). No AggregateRating schema (user decision 2026-10-02). */
export const REVIEWS = { count: '370+', label: 'AUSGEZEICHNET', source: 'Google' };

export interface NavItem {
  label: string;
  href: string;
  external?: boolean;
  children?: { label: string; href: string }[];
}

export const MENU: NavItem[] = [
  {
    label: 'Clown',
    href: '/clown/clownshow/',
    children: [
      { label: 'Clownshow', href: '/clown/clownshow/' },
      { label: 'Walk Act', href: '/clown/walk-act/' },
      { label: 'Ballonmodellage', href: '/clown/ballonmodellage/' },
      { label: 'Glitzer Tattoo', href: '/clown/glitzer-tattoo/' },
    ],
  },
  {
    label: 'Zauberer',
    href: '/zauberer/',
    children: [
      { label: 'Bühnen Zauberer', href: '/zauberer/buehnen-zauberer/' },
      { label: 'Tisch Zauberer', href: '/zauberer/tisch-zauberer/' },
      { label: 'Hochzeit', href: '/zauberer/hochzeit/' },
      { label: 'Firmenfeier', href: '/zauberer/firmenfeier/' },
    ],
  },
  {
    label: 'Kinderzauberer',
    href: '/kinderzauberer/',
  },
  {
    label: 'Kindergeburtstag',
    href: '/kindergeburtstag/',
  },
  {
    label: 'Preise',
    href: '/preise/',
  },
  {
    label: 'Zaubershow',
    href: '/zauberer/zaubershow/',
    children: [
      { label: 'Kindergarten – Kita', href: '/zauberer/zaubershow/kindergarten-kita/' },
      { label: 'Schule', href: '/zauberer/zaubershow/schule/' },
      { label: 'Straßen – Sommer -Fest', href: '/zauberer/zaubershow/strassen-sommer-fest/' },
      { label: 'Karneval', href: '/clown/karneval/' },
    ],
  },
  { label: 'Galerie', href: '/galerie/' },
  { label: 'Blog', href: '/blog/' },
  { label: 'Pantomime', href: 'https://www.pantomime-la-france.eu/', external: true },
  { label: 'Kontakt', href: '/kontakt/' },
];

export const FOOTER_MAIN = [
  { href: '/clown/clownshow/', label: 'Clownshow' },
  { href: '/clown/clownshow/', label: 'Clown & Zauberer NRW' },
  { href: '/zauberer/', label: 'Zauberer' },
  { href: '/kinderzauberer/', label: 'Kinderzauberer' },
  { href: '/kindergeburtstag/', label: 'Kindergeburtstag' },
  { href: '/zauberer/zaubershow/', label: 'Zaubershow' },
  { href: '/galerie/', label: 'Galerie' },
  { href: 'https://www.pantomime-la-france.eu/', label: 'Pantomime & Walk Act in NRW' },
];

export const LEGAL_NAV = [
  { href: '/kontakt/', label: 'Kontakt' },
  { href: '/galerie/', label: 'Galerie' },
  { href: '/ueber-mich/', label: 'Über mich' },
  { href: '/impressum/', label: 'Impressum' },
  { href: '/datenschutzerklaerung-2/', label: 'Datenschutz' },
  { href: '/agbs/', label: 'AGB' },
];
