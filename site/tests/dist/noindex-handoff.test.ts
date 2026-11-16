import { describe, it, expect } from 'vitest';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { page } from './helpers';

// Owner 2026-11-16 (docs/seo-reports/2026-11-16-einschaetzung-3-monate.md, §4.4): the 46 de-indexed
// kids city pages (geburtstag-in-*, clown-in-*) still bring ~10 % of the clicks until Google drops
// them. They carry noindex,follow, so a prominent hand-off block passes users and link signals to
// the keepers: the homepage (birthday intent) and the indexed kinderzauberer-in-* sister page.
// Links only — no URL, title or index change.
const DIST = join(import.meta.dirname, '../../dist');
const slugOf = (dir: string) => dir.replace(/^.*?-in-/, '').replace(/-am-see$/, '');
const deindexed = [
  ...readdirSync(join(DIST, 'kindergeburtstag')).filter((d) => d.startsWith('geburtstag-in-')).map((d) => `/kindergeburtstag/${d}/`),
  ...readdirSync(join(DIST, 'clown/clownshow')).filter((d) => d.startsWith('clown-in-')).map((d) => `/clown/clownshow/${d}/`),
];
const keepers = readdirSync(join(DIST, 'kinderzauberer')).filter((d) => d.startsWith('kinderzauberer-in-')).map((d) => `/kinderzauberer/${d}/`);

describe('de-indexed kids city pages hand off to the keepers', () => {
  it('covers both noindex families', () => {
    expect(deindexed.length).toBe(46);
  });

  it('every de-indexed page has a visible hand-off block above the city sections', () => {
    const missing = deindexed.filter((p) => page(p)('[data-city-handoff]').length !== 1);
    expect(missing).toEqual([]);
    const late = deindexed.filter((p) => {
      const main = page(p)('main').html() ?? '';
      return main.indexOf('data-city-handoff') > main.indexOf('data-city-links');
    });
    expect(late).toEqual([]);
  });

  it('links the birthday intent to the homepage with a city anchor', () => {
    const bad = deindexed.filter((p) => {
      const a = page(p)('[data-city-handoff] a[href="/"]');
      return a.length !== 1 || !/Kindergeburtstag in .+ buchen/.test(a.text().replace(/\s+/g, ' '));
    });
    expect(bad).toEqual([]);
  });

  it('links the city intent to the indexed kinderzauberer-in-* sister page', () => {
    const bad = deindexed.filter((p) => {
      const slug = slugOf(p.split('/').filter(Boolean).pop()!);
      return page(p)(`[data-city-handoff] a[href="/kinderzauberer/kinderzauberer-in-${slug}/"]`).length !== 1;
    });
    expect(bad).toEqual([]);
  });

  it('never states a discount or a free extra', () => {
    const bad = deindexed.filter((p) => /Rabatt|gratis|kostenlos/i.test(page(p)('[data-city-handoff]').text()));
    expect(bad).toEqual([]);
  });

  it('the indexed kinderzauberer-in-* pages carry no hand-off block', () => {
    expect(keepers.length).toBe(23);
    const wrong = keepers.filter((p) => page(p)('[data-city-handoff]').length !== 0);
    expect(wrong).toEqual([]);
  });
});
