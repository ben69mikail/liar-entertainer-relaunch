// Real local references per city, supplied by the owner (L3: only places he has actually played).
// Rendered by components/v2/kids/CityPage.astro on that city's pages.
export interface CityLocal {
  venues: string[]; // with preposition, e.g. 'im Schloss Benrath'
  districts: string[];
}

export const CITY_LOCAL: Record<string, CityLocal> = {
  // owner, 2026-10-20
  duesseldorf: {
    venues: ['im Schloss Benrath', 'in der Brauerei Schumacher', 'bei der Kirchengemeinde Urdenbach'],
    districts: ['Altstadt', 'Oberkassel', 'Gerresheim', 'Benrath', 'Urdenbach', 'Garath'],
  },
};

// Page focus where two city pages competed for the same search (user, 2026-10-20): the birthday page
// owns "Zauberer Kindergeburtstag <Stadt>", the Kinderzauberer page takes Kita, school and festivals.
export interface CityFocus {
  title: string;
  description: string;
  h1: string;
  birthdayPath: string;
}

export const CITY_FOCUS: Record<string, CityFocus> = {
  '/kinderzauberer/kinderzauberer-in-duesseldorf/': {
    title: 'Kinderzauberer Düsseldorf | Kita, Schule & Feste | LIAR',
    description: 'Kinderzauberer LIAR in Düsseldorf ✓ Zaubershow für Kita, Schule, Sommerfest & Kommunion ✓ Vormittags ab 8 Uhr ✓ Bis 200 Kinder ✓ 390+ Bewertungen ✓ Anfragen!',
    h1: 'Kinderzauberer in Düsseldorf für Kita, Schule &amp; Feste',
    birthdayPath: '/kindergeburtstag/geburtstag-in-duesseldorf/',
  },
};
