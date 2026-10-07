import { describe, it, expect } from 'vitest';
import { page } from './helpers';
import { zoneFor } from '../../src/lib/site-map';
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import * as cheerio from 'cheerio';

// Final wave: EVERY built page must be on the relaunch design (CLAUDE.md "Rollout v2").
// Walk dist/ instead of keeping a list, so a page added later can never slip through.
const DIST = join(import.meta.dirname, '../../dist');
function builtPages(dir = DIST, base = '/'): string[] {
  const out: string[] = [];
  if (existsSync(join(dir, 'index.html'))) out.push(base);
  for (const name of readdirSync(dir)) {
    if (name.startsWith('_') || !statSync(join(dir, name)).isDirectory()) continue;
    out.push(...builtPages(join(dir, name), `${base}${name}/`));
  }
  return out;
}
const V2_PAGES = builtPages();

const LOGO_ALT = {
  adult: 'Zauberer LIAR – Zauberei & Comedy',
  kids: 'LOGO Clown Zauberer LIAR',
  neutral: 'LOGO Clown Zauberer LIAR',
} as const;

describe('v2 rollout', () => {
  it('covers the whole site', () => expect(V2_PAGES.length).toBeGreaterThan(160));

  for (const path of [...V2_PAGES, '/404.html']) {
    describe(path, () => {
      const $ = path.endsWith('.html') ? cheerio.load(readFileSync(join(DIST, path), 'utf8')) : page(path);

      it('uses the relaunch layout (header with quick contact, footer)', () => {
        expect($('body').hasClass('v2')).toBe(true);
        expect($('header.sh').length).toBe(1);
        expect($('footer.sf').length).toBe(1);
        expect($('header.sh [data-quick-contact]').length).toBe(1);
      });

      it('ships none of the legacy CSS (Tailwind + inline Poppins)', () => {
        const css = $('style').text();
        expect(css).not.toContain('Poppins');
        expect(css).not.toMatch(/--tw-/);
      });

      it('has no yellow underlines or highlighter marks (user ban, 2026-10-04)', () => {
        const css = $('style').text().replace(/\s+/g, '');
        expect(css).not.toMatch(/text-decoration-color:var\(--brand-yellow\)/);
        expect(css).not.toMatch(/linear-gradient\(transparent\d+%,[^)]*(brand-yellow|ffb546)/i);
      });

            it('carries its zone and the matching logo', () => {
        const zone = zoneFor(path === '/404.html' ? '/404/' : path);
        expect($('html').attr('data-zone')).toBe(zone);
        expect($(`header img[alt="${LOGO_ALT[zone]}"]`).length).toBe(1);
      });
    });
  }
});
