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

    it(`${path}: quick contact in the header offers call, WhatsApp and e-mail`, () => {
      const hrefs = $('header.sh [data-quick-contact] a').map((_, a) => $(a).attr('href')).get();
      expect(hrefs).toContain('tel:+491721517578');
      expect(hrefs.some((h) => h.startsWith('https://wa.me/'))).toBe(true);
      expect(hrefs.some((h) => h.startsWith('mailto:'))).toBe(true);
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
    expect($('#faq details summary').length).toBe(10); // +2 FAQs (sound system, language), GSC analysis 2026-10-09
    expect($('#faq details .k3-faq__answer').first().text()).toContain('pflegeleicht');
  });
});

describe('facts (L3: no unverified claims)', () => {
  it('/zauberer/ states the real Google review count, not "Über 400"', () => {
    const text = page(ADULT)('main').text();
    expect(text).not.toMatch(/Über 400/);
    expect(text).toContain('370+');
  });
});

describe('adult zone is its own design, not a zauberer-liar.de copy', () => {
  const css = page(ADULT)('style').text();

  it('uses the playing-card editorial typefaces', () => {
    expect(css).toContain('Bodoni Moda Variable');
    expect(css).toContain('Instrument Sans Variable');
  });

  it('drops the zauberer-liar.de typeface and night palette', () => {
    expect(css).not.toContain('Playfair');
    expect(css).not.toMatch(/#0a0c14/i);
  });

  it('presents the gold logo on a black card back (logo itself unchanged)', () => {
    const $ = page(ADULT);
    expect($('header .sh__logo--card img[alt="Zauberer LIAR – Zauberei & Comedy"]').length).toBe(1);
  });
});

describe('kids decoration quality (user feedback 2026-10-04)', () => {
  const css = page(KIDS)('style').text();

  it('has no scallop (half-circle) section borders anymore', () => {
    expect(css).not.toMatch(/radial-gradient\(circle at \.9rem 0/);
  });
});

describe('kids v3 „Manege im Zelt“ (user, 2026-10-06): more circus, nothing coarse', () => {
  const $ = page(KIDS);
  const css = $('style').text();

  it('opens on a red velvet curtain stage, photos sit in programme-card photo frames', () => {
    expect($('.k3-hero .cu .cu__half').length).toBe(2);
    // user 2026-10-06: photos in the same circus-programme card as the reviews
    expect($('.k3-hero .pf img[fetchpriority="high"]').length).toBe(1);
    expect($('main .pf').length).toBeGreaterThanOrEqual(3);
    expect($('.k3-area__map .pf').length).toBe(0); // the map: no frame at all
  });

  it('separates sections with gold star lines instead of waves, bunting or squiggles', () => {
    expect($('main .gd').length).toBeGreaterThanOrEqual(5);
    expect($('main .edge, main .bunting, main .sq').length).toBe(0);
  });

  it('uses Fraunces headings and drops the coarse poster kit', () => {
    expect(css).toContain('Fraunces Variable');
    expect(css).not.toContain('.kg-card'); // kids-kit.css (thick borders, offset shadows) is not loaded
  });

  it('has no yellow marker underlines behind words', () => {
    expect(css).not.toMatch(/linear-gradient\(transparent (62|70)%/);
  });
});
