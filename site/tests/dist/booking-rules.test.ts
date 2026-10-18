import { describe, it, expect } from 'vitest';
import { page } from './helpers';

// User 2026-10-09: glitter tattoos only as an add-on to the magic show for kids' birthdays /
// private parties (not for bigger events); balloon modelling only together with the magic show
// or a walk-act of at least 3 hours — never on its own (no "one hour of balloons").
const text = (path: string) => page(path)('main').text().replace(/\s+/g, ' ');

describe('booking conditions', () => {
  it('glitter tattoos: add-on to the magic show, kids birthday / private party only', () => {
    const $ = page('/clown/glitzer-tattoo/');
    const rules = $('[data-booking-rules]').text().replace(/\s+/g, ' ');
    expect(rules).toMatch(/Zusatz zur Zaubershow/);
    expect(rules).toMatch(/Kindergeburtstag/);
    expect(rules).toMatch(/private Feier/);
    expect(rules).toMatch(/nicht einzeln/i);
    expect(rules).toMatch(/Großveranstaltung|größere Veranstaltung/);
  });

  it('glitter tattoos: the page no longer promises street festivals, events, nursery or school parties', () => {
    const t = text('/clown/glitzer-tattoo/').replace(/Walk-Act für Straßen- und Stadtfest[^.]*\./, ''); // related-service card links elsewhere
    expect(t).not.toMatch(/Straßenfest(e)? (oder|und) Event/);
    expect(t).not.toMatch(/Kita- und Schulfeste, Straßenfeste und Events/);
    expect(page('/clown/glitzer-tattoo/')('meta[name="description"]').attr('content')).not.toMatch(/Events/);
  });

  it('balloon modelling: only with the magic show or a walk-act of at least 3 hours', () => {
    const $ = page('/clown/ballonmodellage/');
    const rules = $('[data-booking-rules]').text().replace(/\s+/g, ' ');
    expect(rules).toMatch(/Zaubershow/);
    expect(rules).toMatch(/Walk-Act/);
    expect(rules).toMatch(/3 Stunden/);
    expect(rules).toMatch(/nicht einzeln/i);
    expect(text('/clown/ballonmodellage/')).toMatch(/Walk-Act[^.]{0,40}(ab|mindestens) 3 Stunden/);
  });

  it('both rules sit high on the page (right after the intro)', () => {
    for (const path of ['/clown/glitzer-tattoo/', '/clown/ballonmodellage/']) {
      const $ = page(path);
      const order = $('main > section').toArray().map((s) => ($(s).is('[data-booking-rules]') ? 'R' : 's'));
      expect([path, order.indexOf('R')]).toEqual([path, 2]);
    }
  });
});
