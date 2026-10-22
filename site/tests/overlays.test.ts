import { describe, it, expect } from 'vitest';
import { buildSvg as buildHeroSvg } from '../src/utils/heroOverlay';
import { storyLayout, STORY } from '../src/utils/storyOverlay';

// Instagram/Facebook legen oben (~250 px) Profilzeile und unten (~340 px)
// Antwortfeld über eine 1080×1920-Story. Titel und Foto müssen dazwischen liegen.
const SAFE_TOP = 250;
const SAFE_BOTTOM = 1920 - 340;
const EMOJI = /\p{Extended_Pictographic}/u;

const LONG = 'Sommerfest in der Kita planen: Programm-Ideen mit Clown und Zauberer für unvergessliche Stunden 🎪✨';
const SHORT = 'Zaubershow im Kindergarten ✨';

describe('Beitragsbild (1200×630)', () => {
  it('rendert Schrift als Pfade, nicht als <text> (keine Systemschrift nötig)', () => {
    expect(buildHeroSvg(LONG)).not.toMatch(/<text\b/);
  });
  it('lässt Emojis weg', () => {
    expect(buildHeroSvg(LONG)).not.toMatch(EMOJI);
  });
});

describe('Story-Bild (1080×1920)', () => {
  it('rendert Schrift als Pfade, nicht als <text>', () => {
    expect(storyLayout(LONG).svg).not.toMatch(/<text\b/);
  });

  it('lässt Emojis weg (auch im Hinweis unten)', () => {
    expect(storyLayout(LONG).svg).not.toMatch(EMOJI);
  });

  it.each([['lang', LONG], ['kurz', SHORT]])('hält Titel und Foto im sichtbaren Bereich (%s)', (_n, title) => {
    const l = storyLayout(title);
    expect(l.titleTop).toBeGreaterThanOrEqual(SAFE_TOP);
    expect(l.photo.top).toBeGreaterThan(l.titleBottom);
    expect(l.photo.top + l.photo.height).toBeLessThanOrEqual(SAFE_BOTTOM);
    expect(l.photo.left).toBeGreaterThanOrEqual(40);
    expect(l.photo.left + l.photo.width).toBeLessThanOrEqual(STORY.W - 40);
  });

  it('zeigt das Foto groß (mindestens 700 px hoch, fast volle Breite)', () => {
    const l = storyLayout(LONG);
    expect(l.photo.height).toBeGreaterThanOrEqual(700);
    expect(l.photo.width).toBeGreaterThanOrEqual(940);
  });

  it('schreibt den Titel groß genug für Handys (≥ 72 px)', () => {
    expect(storyLayout(LONG).titleSize).toBeGreaterThanOrEqual(72);
  });
});
