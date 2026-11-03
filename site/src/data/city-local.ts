// Real local references per city, supplied by the owner (L3: only places he has actually played).
// Rendered by components/v2/kids/CityPage.astro on that city's pages.
export interface CityLocal {
  venues: string[]; // with preposition, e.g. 'im Schloss Benrath'
  districts: string[];
}

export const CITY_LOCAL: Record<string, CityLocal> = {
  // real venues supplied by the owner 2026-11-04 (L3); districts added from public geography
  duesseldorf: {
    venues: ['im Schloss Benrath', 'in der Brauerei Schumacher', 'bei der Kirchengemeinde Urdenbach'],
    districts: ['Altstadt', 'Oberkassel', 'Gerresheim', 'Benrath', 'Urdenbach', 'Garath'],
  },
  gladbeck: {
    venues: ['beim Appeltatenfest', 'beim Feierabendmarkt', 'beim Festival Umsonst & Draußen'],
    districts: ['Mitte', 'Butendorf', 'Zweckel', 'Rentfort'],
  },
  gelsenkirchen: {
    venues: ['in der ZOOM Erlebniswelt', 'an der Löchterschule', 'bei den Gelsenkirchener Karnevalsvereinen'],
    districts: ['Buer', 'Horst', 'Erle', 'Ückendorf'],
  },
  bochum: {
    venues: ['im Tierpark Bochum', 'in den Stadtbüchereien', 'bei der Postbank'],
    districts: ['Wattenscheid', 'Langendreer', 'Weitmar', 'Querenburg'],
  },
  essen: {
    venues: ['im Grugapark', 'beim VKJ', 'in der Uniklinik Essen'],
    districts: ['Rüttenscheid', 'Werden', 'Borbeck', 'Steele'],
  },
  dortmund: {
    venues: ['in der Stadt- und Landesbibliothek', 'im Westfalenpark', 'im Big Tippi'],
    districts: ['Hörde', 'Aplerbeck', 'Hombruch', 'Brackel'],
  },
  muelheim: {
    venues: ['bei der AWO Mülheim'],
    districts: ['Broich', 'Saarn', 'Speldorf', 'Heißen'],
  },
  duisburg: {
    venues: ['im Jugendzentrum Tempel', 'bei Vonovia', 'auf Stadtteil-Sommerfesten'],
    districts: ['Hamborn', 'Rheinhausen', 'Homberg', 'Meiderich'],
  },
  oberhausen: {
    venues: ['im CentrO', 'auf dem Oberhausener Weihnachtsmarkt'],
    districts: ['Sterkrade', 'Osterfeld', 'Alt-Oberhausen'],
  },
  bottrop: {
    venues: ['im Alpincenter', 'auf dem Weihnachtsmarkt', 'beim Spendenlauf'],
    districts: ['Kirchhellen', 'Batenbrock', 'Eigen', 'Boy'],
  },
  recklinghausen: {
    venues: ['in der Kinderwelt', 'im Tierpark', 'auf dem Weihnachtsmarkt'],
    districts: ['Suderwich', 'Hochlarmark', 'Hillerheide', 'König Ludwig'],
  },
  herne: {
    venues: ['im Wasserschloss Strünkede', 'in der Kita Regenbogenland', 'auf der Cranger Kirmes'],
    districts: ['Wanne', 'Eickel', 'Baukau', 'Sodingen'],
  },
  marl: {
    venues: ['im Marler Stern', 'bei der Volksbank'],
    districts: ['Hüls', 'Drewer', 'Brassert', 'Sinsen'],
  },
  herten: {
    venues: ['auf Schloss Herten', 'auf Schloss Westerholt'],
    districts: ['Westerholt', 'Disteln', 'Scherlebeck', 'Langenbochum'],
  },
  dorsten: {
    venues: ['im LEO Dorsten', 'bei Mr. Trucker', 'auf Schloss Lembeck'],
    districts: ['Hervest', 'Holsterhausen', 'Wulfen', 'Lembeck'],
  },
  'castrop-rauxel': {
    venues: ['auf dem Marktplatz Alt-Castrop', 'im Castroper Weihnachtsdorf'],
    districts: ['Ickern', 'Habinghorst', 'Henrichenburg', 'Schwerin'],
  },
  datteln: {
    venues: ['im Seniorenwohnpark', 'in der Bücherei Datteln'],
    districts: ['Horneburg', 'Ahsen', 'Meckinghoven'],
  },
  waltrop: {
    venues: ['am Schiffshebewerk Henrichenburg (LWL-Museum)', 'auf der Zeche Waltrop', 'auf dem Hof Wulhorst'],
    districts: ['Oberwiese', 'Brockenscheidt', 'Leveringhausen'],
  },
  moers: {
    venues: ['im Jugendzentrum Nord', 'im Hotel van der Valk'],
    districts: ['Repelen', 'Kapellen', 'Rheinkamp', 'Scherpenberg'],
  },
  wesel: {
    venues: ['beim Weseler Stadt-Sommerfest', 'im Restaurant Gusto', 'in der kath. Kita St. Nikolaus in Flüren'],
    districts: ['Feldmark', 'Fusternberg', 'Lackhausen', 'Obrighoven'],
  },
  xanten: {
    venues: ['im Freizeitzentrum Xanten', 'beim Xantener Carnevals-Verein'],
    districts: ['Birten', 'Lüttingen', 'Marienbaum', 'Vynen'],
  },
  dinslaken: {
    venues: ['im Grindhouse', 'bei der Karnevalsgemeinschaft Rot-Gold'],
    districts: ['Hiesfeld', 'Lohberg', 'Averbruch', 'Eppinghoven'],
  },
  haltern: {
    venues: ['im Freizeitpark Ketteler Hof', 'in der AWO-Kita Lohausstraße'],
    districts: ['Sythen', 'Lavesum', 'Flaesheim', 'Lippramsdorf'],
  },
};

// Page focus for the kinderzauberer-in-* city family (owner 2026-10-20 for Düsseldorf, rolled out to
// all 23 cities 2026-11-03 to end cannibalization). The homepage + /kindergeburtstag/ own the birthday
// intent; these city pages take the city-level Kita / Schule / Sommerfest / Kommunion intent instead,
// so title/H1/description target that and birthdayPath hands birthday searches to the indexed hub.
// (The geburtstag-in-* and clown-in-* city families are noindex now — see NOINDEX_CITY_PREFIXES.)
export interface CityFocus {
  title: string;
  description: string;
  h1: string;
  birthdayPath: string;
}

export const CITY_FOCUS: Record<string, CityFocus> = {
  '/kinderzauberer/kinderzauberer-in-bochum/': {
    title: 'Kinderzauberer Bochum | Kita, Schule & Feste | LIAR',
    description: 'Kinderzauberer LIAR in Bochum ✓ Zaubershow für Kita, Schule, Sommerfest & Kommunion ✓ Vormittags ab 8 Uhr ✓ Bis 200 Kinder ✓ 390+ Bewertungen ✓ Jetzt anfragen!',
    h1: 'Kinderzauberer in Bochum für Kita, Schule &amp; Feste',
    birthdayPath: '/kindergeburtstag/',
  },
  '/kinderzauberer/kinderzauberer-in-bottrop/': {
    title: 'Kinderzauberer Bottrop | Kita, Schule & Feste | LIAR',
    description: 'Kinderzauberer LIAR in Bottrop ✓ Zaubershow für Kita, Schule, Sommerfest & Kommunion ✓ Vormittags ab 8 Uhr ✓ Bis 200 Kinder ✓ 390+ Bewertungen ✓ Jetzt anfragen!',
    h1: 'Kinderzauberer in Bottrop für Kita, Schule &amp; Feste',
    birthdayPath: '/kindergeburtstag/',
  },
  '/kinderzauberer/kinderzauberer-in-castrop-rauxel/': {
    title: 'Kinderzauberer Castrop-Rauxel | Kita, Schule & Feste | LIAR',
    description: 'Kinderzauberer LIAR in Castrop-Rauxel ✓ Zaubershow für Kita, Schule, Sommerfest & Kommunion ✓ Vormittags ab 8 Uhr ✓ Bis 200 Kinder ✓ 390+ Bewertungen ✓ Jetzt anfragen!',
    h1: 'Kinderzauberer in Castrop-Rauxel für Kita, Schule &amp; Feste',
    birthdayPath: '/kindergeburtstag/',
  },
  '/kinderzauberer/kinderzauberer-in-datteln/': {
    title: 'Kinderzauberer Datteln | Kita, Schule & Feste | LIAR',
    description: 'Kinderzauberer LIAR in Datteln ✓ Zaubershow für Kita, Schule, Sommerfest & Kommunion ✓ Vormittags ab 8 Uhr ✓ Bis 200 Kinder ✓ 390+ Bewertungen ✓ Jetzt anfragen!',
    h1: 'Kinderzauberer in Datteln für Kita, Schule &amp; Feste',
    birthdayPath: '/kindergeburtstag/',
  },
  '/kinderzauberer/kinderzauberer-in-dinslaken/': {
    title: 'Kinderzauberer Dinslaken | Kita, Schule & Feste | LIAR',
    description: 'Kinderzauberer LIAR in Dinslaken ✓ Zaubershow für Kita, Schule, Sommerfest & Kommunion ✓ Vormittags ab 8 Uhr ✓ Bis 200 Kinder ✓ 390+ Bewertungen ✓ Jetzt anfragen!',
    h1: 'Kinderzauberer in Dinslaken für Kita, Schule &amp; Feste',
    birthdayPath: '/kindergeburtstag/',
  },
  '/kinderzauberer/kinderzauberer-in-dorsten/': {
    title: 'Kinderzauberer Dorsten | Kita, Schule & Feste | LIAR',
    description: 'Kinderzauberer LIAR in Dorsten ✓ Zaubershow für Kita, Schule, Sommerfest & Kommunion ✓ Vormittags ab 8 Uhr ✓ Bis 200 Kinder ✓ 390+ Bewertungen ✓ Jetzt anfragen!',
    h1: 'Kinderzauberer in Dorsten für Kita, Schule &amp; Feste',
    birthdayPath: '/kindergeburtstag/',
  },
  '/kinderzauberer/kinderzauberer-in-dortmund/': {
    title: 'Kinderzauberer Dortmund | Kita, Schule & Feste | LIAR',
    description: 'Kinderzauberer LIAR in Dortmund ✓ Zaubershow für Kita, Schule, Sommerfest & Kommunion ✓ Vormittags ab 8 Uhr ✓ Bis 200 Kinder ✓ 390+ Bewertungen ✓ Jetzt anfragen!',
    h1: 'Kinderzauberer in Dortmund für Kita, Schule &amp; Feste',
    birthdayPath: '/kindergeburtstag/',
  },
  '/kinderzauberer/kinderzauberer-in-duesseldorf/': {
    title: 'Kinderzauberer Düsseldorf | Kita, Schule & Feste | LIAR',
    description: 'Kinderzauberer LIAR in Düsseldorf ✓ Zaubershow für Kita, Schule, Sommerfest & Kommunion ✓ Vormittags ab 8 Uhr ✓ Bis 200 Kinder ✓ 390+ Bewertungen ✓ Jetzt anfragen!',
    h1: 'Kinderzauberer in Düsseldorf für Kita, Schule &amp; Feste',
    birthdayPath: '/kindergeburtstag/',
  },
  '/kinderzauberer/kinderzauberer-in-duisburg/': {
    title: 'Kinderzauberer Duisburg | Kita, Schule & Feste | LIAR',
    description: 'Kinderzauberer LIAR in Duisburg ✓ Zaubershow für Kita, Schule, Sommerfest & Kommunion ✓ Vormittags ab 8 Uhr ✓ Bis 200 Kinder ✓ 390+ Bewertungen ✓ Jetzt anfragen!',
    h1: 'Kinderzauberer in Duisburg für Kita, Schule &amp; Feste',
    birthdayPath: '/kindergeburtstag/',
  },
  '/kinderzauberer/kinderzauberer-in-essen/': {
    title: 'Kinderzauberer Essen | Kita, Schule & Feste | LIAR',
    description: 'Kinderzauberer LIAR in Essen ✓ Zaubershow für Kita, Schule, Sommerfest & Kommunion ✓ Vormittags ab 8 Uhr ✓ Bis 200 Kinder ✓ 390+ Bewertungen ✓ Jetzt anfragen!',
    h1: 'Kinderzauberer in Essen für Kita, Schule &amp; Feste',
    birthdayPath: '/kindergeburtstag/',
  },
  '/kinderzauberer/kinderzauberer-in-gelsenkirchen/': {
    title: 'Kinderzauberer Gelsenkirchen | Kita, Schule & Feste | LIAR',
    description: 'Kinderzauberer LIAR in Gelsenkirchen ✓ Zaubershow für Kita, Schule, Sommerfest & Kommunion ✓ Vormittags ab 8 Uhr ✓ Bis 200 Kinder ✓ 390+ Bewertungen ✓ Jetzt anfragen!',
    h1: 'Kinderzauberer in Gelsenkirchen für Kita, Schule &amp; Feste',
    birthdayPath: '/kindergeburtstag/',
  },
  '/kinderzauberer/kinderzauberer-in-gladbeck/': {
    title: 'Kinderzauberer Gladbeck | Kita, Schule & Feste | LIAR',
    description: 'Kinderzauberer LIAR in Gladbeck ✓ Zaubershow für Kita, Schule, Sommerfest & Kommunion ✓ Vormittags ab 8 Uhr ✓ Bis 200 Kinder ✓ 390+ Bewertungen ✓ Jetzt anfragen!',
    h1: 'Kinderzauberer in Gladbeck für Kita, Schule &amp; Feste',
    birthdayPath: '/kindergeburtstag/',
  },
  '/kinderzauberer/kinderzauberer-in-haltern/': {
    title: 'Kinderzauberer Haltern | Kita, Schule & Feste | LIAR',
    description: 'Kinderzauberer LIAR in Haltern ✓ Zaubershow für Kita, Schule, Sommerfest & Kommunion ✓ Vormittags ab 8 Uhr ✓ Bis 200 Kinder ✓ 390+ Bewertungen ✓ Jetzt anfragen!',
    h1: 'Kinderzauberer in Haltern für Kita, Schule &amp; Feste',
    birthdayPath: '/kindergeburtstag/',
  },
  '/kinderzauberer/kinderzauberer-in-herne/': {
    title: 'Kinderzauberer Herne | Kita, Schule & Feste | LIAR',
    description: 'Kinderzauberer LIAR in Herne ✓ Zaubershow für Kita, Schule, Sommerfest & Kommunion ✓ Vormittags ab 8 Uhr ✓ Bis 200 Kinder ✓ 390+ Bewertungen ✓ Jetzt anfragen!',
    h1: 'Kinderzauberer in Herne für Kita, Schule &amp; Feste',
    birthdayPath: '/kindergeburtstag/',
  },
  '/kinderzauberer/kinderzauberer-in-herten/': {
    title: 'Kinderzauberer Herten | Kita, Schule & Feste | LIAR',
    description: 'Kinderzauberer LIAR in Herten ✓ Zaubershow für Kita, Schule, Sommerfest & Kommunion ✓ Vormittags ab 8 Uhr ✓ Bis 200 Kinder ✓ 390+ Bewertungen ✓ Jetzt anfragen!',
    h1: 'Kinderzauberer in Herten für Kita, Schule &amp; Feste',
    birthdayPath: '/kindergeburtstag/',
  },
  '/kinderzauberer/kinderzauberer-in-marl/': {
    title: 'Kinderzauberer Marl | Kita, Schule & Feste | LIAR',
    description: 'Kinderzauberer LIAR in Marl ✓ Zaubershow für Kita, Schule, Sommerfest & Kommunion ✓ Vormittags ab 8 Uhr ✓ Bis 200 Kinder ✓ 390+ Bewertungen ✓ Jetzt anfragen!',
    h1: 'Kinderzauberer in Marl für Kita, Schule &amp; Feste',
    birthdayPath: '/kindergeburtstag/',
  },
  '/kinderzauberer/kinderzauberer-in-moers/': {
    title: 'Kinderzauberer Moers | Kita, Schule & Feste | LIAR',
    description: 'Kinderzauberer LIAR in Moers ✓ Zaubershow für Kita, Schule, Sommerfest & Kommunion ✓ Vormittags ab 8 Uhr ✓ Bis 200 Kinder ✓ 390+ Bewertungen ✓ Jetzt anfragen!',
    h1: 'Kinderzauberer in Moers für Kita, Schule &amp; Feste',
    birthdayPath: '/kindergeburtstag/',
  },
  '/kinderzauberer/kinderzauberer-in-muelheim/': {
    title: 'Kinderzauberer Mülheim | Kita, Schule & Feste | LIAR',
    description: 'Kinderzauberer LIAR in Mülheim ✓ Zaubershow für Kita, Schule, Sommerfest & Kommunion ✓ Vormittags ab 8 Uhr ✓ Bis 200 Kinder ✓ 390+ Bewertungen ✓ Jetzt anfragen!',
    h1: 'Kinderzauberer in Mülheim für Kita, Schule &amp; Feste',
    birthdayPath: '/kindergeburtstag/',
  },
  '/kinderzauberer/kinderzauberer-in-oberhausen/': {
    title: 'Kinderzauberer Oberhausen | Kita, Schule & Feste | LIAR',
    description: 'Kinderzauberer LIAR in Oberhausen ✓ Zaubershow für Kita, Schule, Sommerfest & Kommunion ✓ Vormittags ab 8 Uhr ✓ Bis 200 Kinder ✓ 390+ Bewertungen ✓ Jetzt anfragen!',
    h1: 'Kinderzauberer in Oberhausen für Kita, Schule &amp; Feste',
    birthdayPath: '/kindergeburtstag/',
  },
  '/kinderzauberer/kinderzauberer-in-recklinghausen/': {
    title: 'Kinderzauberer Recklinghausen | Kita, Schule & Feste | LIAR',
    description: 'Kinderzauberer LIAR in Recklinghausen ✓ Zaubershow für Kita, Schule, Sommerfest & Kommunion ✓ Vormittags ab 8 Uhr ✓ Bis 200 Kinder ✓ 390+ Bewertungen ✓ Jetzt anfragen!',
    h1: 'Kinderzauberer in Recklinghausen für Kita, Schule &amp; Feste',
    birthdayPath: '/kindergeburtstag/',
  },
  '/kinderzauberer/kinderzauberer-in-waltrop/': {
    title: 'Kinderzauberer Waltrop | Kita, Schule & Feste | LIAR',
    description: 'Kinderzauberer LIAR in Waltrop ✓ Zaubershow für Kita, Schule, Sommerfest & Kommunion ✓ Vormittags ab 8 Uhr ✓ Bis 200 Kinder ✓ 390+ Bewertungen ✓ Jetzt anfragen!',
    h1: 'Kinderzauberer in Waltrop für Kita, Schule &amp; Feste',
    birthdayPath: '/kindergeburtstag/',
  },
  '/kinderzauberer/kinderzauberer-in-wesel/': {
    title: 'Kinderzauberer Wesel | Kita, Schule & Feste | LIAR',
    description: 'Kinderzauberer LIAR in Wesel ✓ Zaubershow für Kita, Schule, Sommerfest & Kommunion ✓ Vormittags ab 8 Uhr ✓ Bis 200 Kinder ✓ 390+ Bewertungen ✓ Jetzt anfragen!',
    h1: 'Kinderzauberer in Wesel für Kita, Schule &amp; Feste',
    birthdayPath: '/kindergeburtstag/',
  },
  '/kinderzauberer/kinderzauberer-in-xanten/': {
    title: 'Kinderzauberer Xanten | Kita, Schule & Feste | LIAR',
    description: 'Kinderzauberer LIAR in Xanten ✓ Zaubershow für Kita, Schule, Sommerfest & Kommunion ✓ Vormittags ab 8 Uhr ✓ Bis 200 Kinder ✓ 390+ Bewertungen ✓ Jetzt anfragen!',
    h1: 'Kinderzauberer in Xanten für Kita, Schule &amp; Feste',
    birthdayPath: '/kindergeburtstag/',
  },
};
