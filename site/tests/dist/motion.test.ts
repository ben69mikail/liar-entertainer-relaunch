import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { page } from './helpers';

const ASSETS = join(import.meta.dirname, '../../dist/_astro');
// Kindergeburtstag uses legacy .reveal cards, so it exercises the real contract.
const $ = page('/kindergeburtstag/');
// Legacy markup uses class="reveal"; new markup uses data-reveal. Both share one contract.
const REVEAL = '[data-reveal], .reveal';
// Astro inlines small stylesheets, so check both inline <style> and emitted files.
const builtCss = [
  ...$('style').map((_, el) => $(el).text()).get(),
  ...readdirSync(ASSETS)
    .filter((f) => f.endsWith('.css'))
    .map((f) => readFileSync(join(ASSETS, f), 'utf8')),
].join('\n');

describe('reveal animations stay progressive', () => {
  it('ships revealable content on the page', () => {
    expect($(REVEAL).length).toBeGreaterThan(0);
  });

  it('never hides content without the JS-set motion-ok class', () => {
    const hidingRules = builtCss
      .split('}')
      .filter((rule) => /\[data-reveal\]|\.reveal\b/.test(rule) && /opacity:\s*0(?![.\d])/.test(rule));
    expect(hidingRules.length).toBeGreaterThan(0);
    expect(hidingRules.filter((rule) => !rule.includes('.motion-ok'))).toEqual([]);
    $(REVEAL).each((_, el) => expect($(el).attr('style') ?? '').not.toMatch(/opacity/));
  });

  it('loads the motion script as a module', () => {
    expect($('script[type=module]').length).toBeGreaterThan(0);
  });
});
