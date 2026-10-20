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
