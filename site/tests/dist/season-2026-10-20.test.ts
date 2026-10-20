import { describe, it, expect } from 'vitest';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { page } from './helpers';

// User, 2026-10-20 (SEO plan docs/seo-audit-2026-10-18/): season levers with the owner's facts —
// company Christmas parties, Kita/school mornings in December, Mon–Thu kids birthdays, real
// Düsseldorf references. No discount, no invented facts.
const text = (path: string, sel = 'main') => page(path)(sel).text().replace(/\s+/g, ' ');
const faqNames = (path: string) =>
  page(path)('script[type="application/ld+json"]')
    .toArray()
    .map((s) => JSON.parse(page(path)(s).text()))
    .filter((d) => d['@type'] === 'FAQPage')
    .flatMap((d) => d.mainEntity.map((q: { name: string }) => q.name));

describe('Weihnachtsfeier (companies)', () => {
  it('has its own section with the evening flow and the owner facts', () => {
    const t = text('/zauberer/firmenfeier/', '#weihnachtsfeier');
    expect(t).toMatch(/Weihnachtsfeier/);
    expect(t).toMatch(/ca\. 30 Minuten/);
    expect(t).toMatch(/Englisch/);
  });
  it('never offers the adult stage show in Spanish (only the table magic)', () => {
    // languages listed right after the stage show must stop before Spanish
    expect(text('/zauberer/firmenfeier/')).not.toMatch(/Bühnenshow auf (?:Deutsch|Französisch|Englisch|, | oder | und )*Spanisch/);
    expect(text('/zauberer/firmenfeier/')).toMatch(/Tischzauberei zusätzlich auf Spanisch/);
  });
  it('answers duration and booking time in the FAQ schema', () => {
    const q = faqNames('/zauberer/firmenfeier/');
    expect(q).toContain('Wie lange dauert die Zaubershow auf der Weihnachtsfeier?');
    expect(q).toContain('Wann sollte man den Zauberer für die Weihnachtsfeier buchen?');
  });
});

describe('Kita and school mornings', () => {
  it('Kita: St. Martin, Nikolaus, Weihnachtsfeier, from 8 a.m.', () => {
    const t = text('/zauberer/zaubershow/kindergarten-kita/', '#termine');
    expect(t).toMatch(/Nikolaus/);
    expect(t).toMatch(/ab 8 Uhr/);
    expect(faqNames('/zauberer/zaubershow/kindergarten-kita/')).toContain('Kommen Sie auch vormittags in die Kita?');
  });
  it('school: mornings, higher classes and OGS, up to 200 children (80–100 ideal)', () => {
    const t = text('/zauberer/zaubershow/schule/', '#termine');
    expect(t).toMatch(/ab 8 Uhr/);
    expect(t).toMatch(/OGS/);
    expect(t).toMatch(/200 Kinder/);
    expect(t).toMatch(/80 bis 100/);
    expect(faqNames('/zauberer/zaubershow/schule/')).toContain('Für wie viele Schüler gleichzeitig ist die Zaubershow geeignet?');
  });
});

describe('kids birthdays Monday to Thursday', () => {
  it('the hub has a weekday section and FAQ — without any discount', () => {
    const t = text('/kindergeburtstag/', '#unter-der-woche');
    expect(t).toMatch(/Montag bis Donnerstag/);
    expect(t).toMatch(/ab 13 Uhr/);
    expect(t).toMatch(/Vortag/);
    expect(t).not.toMatch(/Rabatt|gratis|kostenlos/i);
    expect(faqNames('/kindergeburtstag/')).toContain('Kann ich den Zauberer auch unter der Woche buchen?');
  });
  it('every kids city page points to weekday birthdays', () => {
    const DIST = join(import.meta.dirname, '../../dist');
    const cityPaths = [
      ...readdirSync(join(DIST, 'kindergeburtstag')).filter((d) => d.startsWith('geburtstag-in-')).map((d) => `/kindergeburtstag/${d}/`),
      ...readdirSync(join(DIST, 'kinderzauberer')).filter((d) => d.startsWith('kinderzauberer-in-')).map((d) => `/kinderzauberer/${d}/`),
      ...readdirSync(join(DIST, 'clown/clownshow')).filter((d) => d.startsWith('clown-in-')).map((d) => `/clown/clownshow/${d}/`),
    ];
    expect(cityPaths.length).toBeGreaterThan(60);
    const missing = cityPaths.filter((p) => !/Montag bis Donnerstag ab 13 Uhr/.test(text(p, '[data-weekday]')));
    expect(missing).toEqual([]);
  });
});

describe('Düsseldorf', () => {
  it('the birthday page names the real places, the sister pages do not repeat them', () => {
    const t = text('/kindergeburtstag/geburtstag-in-duesseldorf/', '[data-city-local]');
    for (const place of ['Schloss Benrath', 'Brauerei Schumacher', 'Urdenbach', 'Oberkassel', 'Gerresheim', 'Garath']) expect(t).toContain(place);
    expect(page('/kinderzauberer/kinderzauberer-in-duesseldorf/')('[data-city-local]').length).toBe(0);
    expect(page('/clown/clownshow/clown-in-duesseldorf/')('[data-city-local]').length).toBe(0);
  });
});

describe('Düsseldorf: no two pages for the same search', () => {
  it('the Kinderzauberer page is about Kita, school and festivals and hands birthdays to the birthday page', () => {
    const $ = page('/kinderzauberer/kinderzauberer-in-duesseldorf/');
    expect($('title').text()).toBe('Kinderzauberer Düsseldorf | Kita, Schule & Feste | LIAR');
    expect($('h1').text()).toMatch(/Kita, Schule & Feste/);
    expect($('h1').text()).not.toMatch(/Kindergeburtstag/);
    const focus = $('[data-city-focus]');
    expect(focus.find('a[href="/kindergeburtstag/geburtstag-in-duesseldorf/"]').length).toBe(1);
    expect(focus.find('a[href="/zauberer/zaubershow/kindergarten-kita/"]').length).toBe(1);
    expect(focus.find('a[href="/zauberer/zaubershow/schule/"]').length).toBe(1);
  });
  it('the birthday page keeps the birthday title', () => {
    expect(page('/kindergeburtstag/geburtstag-in-duesseldorf/')('title').text()).toMatch(/Kindergeburtstag/);
  });
});
