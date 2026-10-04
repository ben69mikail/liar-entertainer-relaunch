import { describe, it, expect } from 'vitest';
import { page } from './helpers';

// Prototypes for Gate 3: one page per zone.
const KIDS = '/kindergeburtstag/';
const ADULT = '/zauberer/';

describe('zone branding (L6: logos unchanged, one per zone)', () => {
  it('shows the colourful clown logo in the kids zone', () => {
    expect(page(KIDS)('header img[alt="LOGO Clown Zauberer LIAR"]').length).toBe(1);
  });

  it('shows the gold zauberer-liar.de logo in the adult zone', () => {
    expect(page(ADULT)('header img[alt="Zauberer LIAR – Zauberei & Comedy"]').length).toBe(1);
  });
});

describe('parents reach key info fast (brief UX goals)', () => {
  for (const path of [KIDS, ADULT]) {
    const $ = page(path);

    it(`${path}: sticky contact offers call, WhatsApp and enquiry`, () => {
      const hrefs = $('[data-sticky-cta] a').map((_, a) => $(a).attr('href')).get();
      expect(hrefs).toContain('tel:+491721517578');
      expect(hrefs.some((h) => h.startsWith('https://wa.me/'))).toBe(true);
      expect(hrefs).toContain('/kontakt/');
    });

    it(`${path}: shows the real review count in the hero (above the fold)`, () => {
      expect($('main > section').first().text()).toContain('370+ Bewertungen');
    });
  }

  it('kids page links straight to prices, FAQ and reviews from the hero', () => {
    const $ = page(KIDS);
    const jumps = $('main > section').first().find('a[href^="#"]').map((_, a) => $(a).attr('href')).get();
    for (const id of ['#preise', '#faq', '#bewertungen']) {
      expect(jumps).toContain(id);
      expect($(id).length).toBe(1);
    }
  });

  it('kids FAQ answers are readable without JavaScript', () => {
    const $ = page(KIDS);
    expect($('#faq details summary').length).toBe(8);
    expect($('#faq details .kg-faq__answer').first().text()).toContain('pflegeleicht');
  });
});

describe('facts (L3: no unverified claims)', () => {
  it('/zauberer/ states the real Google review count, not "Über 400"', () => {
    const text = page(ADULT)('main').text();
    expect(text).not.toMatch(/Über 400/);
    expect(text).toContain('370+');
  });
});
