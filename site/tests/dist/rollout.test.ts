import { describe, it, expect } from 'vitest';
import { page } from './helpers';
import { zoneFor } from '../../src/lib/site-map';

// Pages already on the relaunch design. Grows wave by wave (CLAUDE.md "Rollout v2");
// the final wave replaces this list with every built page.
const V2_PAGES = [
  '/',
  '/kindergeburtstag/',
  '/zauberer/',
];

const LOGO_ALT = {
  adult: 'Zauberer LIAR – Zauberei & Comedy',
  kids: 'LOGO Clown Zauberer LIAR',
  neutral: 'LOGO Clown Zauberer LIAR',
} as const;

describe('v2 rollout', () => {
  for (const path of V2_PAGES) {
    describe(path, () => {
      const $ = page(path);

      it('uses the relaunch layout (header, footer, sticky contact)', () => {
        expect($('body').hasClass('v2')).toBe(true);
        expect($('header.sh').length).toBe(1);
        expect($('footer.sf').length).toBe(1);
        expect($('[data-sticky-cta]').length).toBe(1);
      });

      it('ships none of the legacy CSS (Tailwind + inline Poppins)', () => {
        const css = $('style').text();
        expect(css).not.toContain('Poppins');
        expect(css).not.toMatch(/--tw-/);
      });

      it('carries its zone and the matching logo', () => {
        const zone = zoneFor(path);
        expect($('html').attr('data-zone')).toBe(zone);
        expect($(`header img[alt="${LOGO_ALT[zone]}"]`).length).toBe(1);
      });
    });
  }
});
