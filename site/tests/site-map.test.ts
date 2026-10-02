import { describe, it, expect } from 'vitest';
import { zoneFor, alternatesFor } from '../src/lib/site-map';

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
  });

  it('applies zones to translated paths', () => {
    expect(zoneFor('/fr/zauberer/')).toBe('adult');
    expect(zoneFor('/en/kindergeburtstag/')).toBe('kids');
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
      { hreflang: 'fr', href: 'https://liar-entertainer.com/fr/zauberer/' },
      { hreflang: 'en', href: 'https://liar-entertainer.com/en/zauberer/' },
      { hreflang: 'x-default', href: 'https://liar-entertainer.com/zauberer/' },
    ]);
  });

  it('returns the same set from every language version (bidirectional)', () => {
    expect(alternatesFor('/fr/kontakt/')).toEqual(alternatesFor('/kontakt/'));
    expect(alternatesFor('/en/')).toEqual(alternatesFor('/'));
  });

  it('gives DE-only pages no alternates', () => {
    expect(alternatesFor('/kinderzauberer/kinderzauberer-in-gladbeck/')).toEqual([]);
    expect(alternatesFor('/blog/some-post/')).toEqual([]);
    expect(alternatesFor('/preise/')).toEqual([]);
  });
});
