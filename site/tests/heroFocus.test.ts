import { describe, it, expect } from 'vitest';
import { planHero, planBox, parseFocus, titleBandHeight } from '../src/utils/focusCrop';

// Kopf + Oberkörper der Person(en) müssen im Beitragsbild (1200×630) und im
// Story-Foto sichtbar sein – nicht vom Titel verdeckt, nicht abgeschnitten.
// Fokus aus dem Frontmatter: x = Mitte der Person (%), top = Kopf-Oberkante (%),
// bottom = Hüfte/Ende Oberkörper (%), jeweils relativ zum Originalfoto.

const MARL = { x: 48, top: 22, bottom: 60 }; // Hochkant-Foto 960×1280 (Pantomime Marler Stern)
const TITLE = 'Pantomime im Marler Stern: Antikmarkt am 8. November 🎭✨';

function bandInCrop(src: { w: number; h: number }, f: { top: number; bottom: number }, r: { top: number; height: number }) {
  const top = (f.top / 100) * src.h;
  const bottom = (f.bottom / 100) * src.h;
  return { headRel: (top - r.top) / r.height, waistRel: (bottom - r.top) / r.height };
}

describe('parseFocus', () => {
  it('liest Objekt und Kurzform „x top bottom“', () => {
    expect(parseFocus({ x: 48, top: 22, bottom: 60 })).toEqual(MARL);
    expect(parseFocus('48 22 60')).toEqual(MARL);
  });
  it('verwirft ungültige Werte', () => {
    expect(parseFocus(undefined)).toBeNull();
    expect(parseFocus({ x: 50, top: 70, bottom: 20 })).toBeNull();
    expect(parseFocus('a b c')).toBeNull();
  });
});

describe('planHero (Beitragsbild 1200×630)', () => {
  it('ohne Fokus: bisheriger Zuschnitt nach Bildinhalt', () => {
    expect(planHero(1600, 1200, null, TITLE).mode).toBe('attention');
  });

  it('Hochkant-Foto mit Person: Foto komplett rechts, Titel links (nichts abgeschnitten)', () => {
    const p = planHero(960, 1280, MARL, TITLE);
    expect(p.mode).toBe('split');
    if (p.mode !== 'split') return;
    expect(p.photo.height).toBe(630);
    expect(p.photo.left + p.photo.width).toBeLessThanOrEqual(1200);
    expect(p.textWidth).toBeGreaterThanOrEqual(480);
    expect(p.textWidth + p.photo.width).toBeLessThanOrEqual(1200);
  });

  it('Querformat: Zuschnitt enthält Kopf + Oberkörper komplett unterhalb des Titels', () => {
    const f = { x: 50, top: 40, bottom: 72 };
    const p = planHero(1600, 1200, f, 'Kurz: Titel');
    expect(p.mode).toBe('cover');
    if (p.mode !== 'cover') return;
    const { headRel, waistRel } = bandInCrop({ w: 1600, h: 1200 }, f, p.region);
    expect(headRel).toBeGreaterThanOrEqual(titleBandHeight('Kurz: Titel') / 630);
    expect(waistRel).toBeLessThanOrEqual(1);
    expect(p.region.top).toBeGreaterThanOrEqual(0);
    expect(p.region.top + p.region.height).toBeLessThanOrEqual(1200);
  });

  it('Querformat, Kopf ganz oben (würde unter dem Titel liegen) → split statt Gesicht verdecken', () => {
    expect(planHero(1600, 1200, { x: 50, top: 8, bottom: 42 }, 'Kurz: Titel').mode).toBe('split');
  });

  it('Querformat, Person zu groß für den Bereich unter dem Titel → split statt Kopf abschneiden', () => {
    expect(planHero(1600, 1200, { x: 50, top: 3, bottom: 90 }, TITLE).mode).toBe('split');
  });

  it('Person am Bildrand: Ausschnitt bleibt im Bild und enthält die Person', () => {
    const p = planHero(2000, 1000, { x: 95, top: 30, bottom: 55 }, 'Kurz');
    expect(p.mode).toBe('cover');
    if (p.mode !== 'cover') return;
    expect(p.region.left + p.region.width).toBeLessThanOrEqual(2000);
    expect(p.region.left).toBeLessThanOrEqual(0.95 * 2000);
    expect(p.region.left + p.region.width).toBeGreaterThanOrEqual(0.95 * 2000);
  });
});

describe('planBox (Story-Foto im festen Rahmen)', () => {
  it('Hochkant-Foto in querem Rahmen: Kopf + Oberkörper komplett im Ausschnitt', () => {
    const r = planBox(960, 1280, 960, 700, MARL);
    expect(r).not.toBeNull();
    if (!r) return;
    const { headRel, waistRel } = bandInCrop({ w: 960, h: 1280 }, MARL, r);
    expect(headRel).toBeGreaterThan(0.02);
    expect(waistRel).toBeLessThan(1);
    expect(r.width / r.height).toBeCloseTo(960 / 700, 2);
  });
  it('ohne Fokus: null (Aufrufer nutzt Zuschnitt nach Bildinhalt)', () => {
    expect(planBox(960, 1280, 960, 700, null)).toBeNull();
  });
});
