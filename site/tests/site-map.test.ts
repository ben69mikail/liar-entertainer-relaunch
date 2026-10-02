import { describe, it, expect } from 'vitest';
import { zoneFor, alternatesFor as alternatesForLocales, LOCALES } from '../src/lib/site-map';

// Table logic is tested with all locales; publishing is guarded by tests/dist/hreflang.test.ts.
const alternatesFor = (path: string) => alternatesForLocales(path, LOCALES);

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
    expect(zoneFor('/zauberer/zaubershow/strassen-sommer-fest/')).toBe('kids');
  });

  it('applies zones to translated paths', () => {
    expect(zoneFor('/fr/magicien/')).toBe('adult');
    expect(zoneFor('/en/magician/close-up/')).toBe('adult');
    expect(zoneFor('/fr/anniversaire-enfant/')).toBe('kids');
    expect(zoneFor('/en/childrens-magician/')).toBe('kids');
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
      { hreflang: 'fr', href: 'https://liar-entertainer.com/fr/magicien/' },
      { hreflang: 'en', href: 'https://liar-entertainer.com/en/magician/' },
      { hreflang: 'x-default', href: 'https://liar-entertainer.com/zauberer/' },
    ]);
  });

  it('returns the same set from every language version (bidirectional)', () => {
    expect(alternatesFor('/fr/contact/')).toEqual(alternatesFor('/kontakt/'));
    expect(alternatesFor('/en/kids-birthday-party/')).toEqual(alternatesFor('/kindergeburtstag/'));
    expect(alternatesFor('/en/')).toEqual(alternatesFor('/'));
  });

  it('gives DE-only pages no alternates', () => {
    expect(alternatesFor('/kinderzauberer/kinderzauberer-in-gladbeck/')).toEqual([]);
    expect(alternatesFor('/blog/some-post/')).toEqual([]);
    expect(alternatesFor('/preise/')).toEqual([]);
  });

  it('emits nothing while only German is published', () => {
    expect(alternatesForLocales('/zauberer/', ['de'])).toEqual([]);
  });

  it('does not invent translations by prefixing German slugs', () => {
    expect(alternatesFor('/fr/zauberer/')).toEqual([]);
  });
});
