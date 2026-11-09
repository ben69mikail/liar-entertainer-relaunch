import { describe, it, expect } from 'vitest';
import { CITY_FOCUS } from '../src/data/city-local';

// Regression 09.11.2026: Montags-Artikel blieb liegen, weil das SEO-Gate (seo-assertions.mjs)
// Auto-Publish stoppte – drei Fokus-Beschreibungen waren länger als 165 Zeichen (M6.4) und
// H1.1/H1.2 verlangten noch „Kindergeburtstag“, obwohl seit 03.11. alle 23 Stadtseiten
// den Kita/Schule/Feste-Fokus tragen.
const entries = Object.entries(CITY_FOCUS);

describe('CITY_FOCUS (kinderzauberer-in-* Stadtseiten)', () => {
  it('umfasst alle 23 Städte', () => {
    expect(entries.length).toBe(23);
  });

  it.each(entries)('%s: Meta-Description höchstens 165 Zeichen (SEO-Gate M6.4)', (_path, f) => {
    expect(f.description.length).toBeLessThanOrEqual(165);
  });

  it.each(entries)('%s: Title höchstens 62 Zeichen, nennt Kita oder Schule', (_path, f) => {
    expect(f.title.length).toBeLessThanOrEqual(62);
    expect(f.title).toMatch(/Kita|Schule/);
  });

  it.each(entries)('%s: H1 nennt Kita oder Schule', (_path, f) => {
    expect(f.h1).toMatch(/Kita|Schule/);
  });
});
