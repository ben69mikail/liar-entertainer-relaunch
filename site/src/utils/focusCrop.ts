/**
 * Bildausschnitt nach Personen-Fokus (Kopf + Oberkörper müssen sichtbar sein).
 *
 * Fokus kommt aus dem Frontmatter `heroFocus` (von der n8n-Pipeline per Bild-KI
 * gesetzt): x = horizontale Mitte der Person(en), top = Kopf-Oberkante,
 * bottom = Hüfte/Ende Oberkörper – jeweils in % des Originalfotos.
 *
 * - planHero: Beitragsbild 1200×630 mit Titel oben links. Passt Kopf + Oberkörper
 *   komplett UNTER den Titel → Zuschnitt („cover“). Sonst (z. B. Hochkant-Foto)
 *   → „split“: Foto ungeschnitten rechts, Titel links daneben.
 * - planBox: Foto in festem Rahmen (Story) – Ausschnitt enthält Kopf + Oberkörper.
 */
import { loadFont, fitTitle } from './overlayText';

export type Focus = { x: number; top: number; bottom: number };
export type Region = { left: number; top: number; width: number; height: number };
export type HeroPlan =
  | { mode: 'attention' }
  | { mode: 'cover'; region: Region }
  | { mode: 'split'; region: Region; photo: Region; textWidth: number };

export const HERO_W = 1200;
export const HERO_H = 630;
export const HERO_PAD_X = 56;
const SPLIT_MAX_PHOTO = 0.6; // Foto höchstens 60 % der Breite, Titel braucht Platz

export function parseFocus(v: unknown): Focus | null {
  let x: number, top: number, bottom: number;
  if (typeof v === 'string') {
    const parts = v.trim().split(/[\s,;]+/).map(Number);
    if (parts.length !== 3) return null;
    [x, top, bottom] = parts;
  } else if (v && typeof v === 'object') {
    const o = v as Record<string, unknown>;
    x = Number(o.x); top = Number(o.top); bottom = Number(o.bottom);
  } else return null;
  const ok = [x, top, bottom].every((n) => Number.isFinite(n) && n >= 0 && n <= 100) && bottom > top;
  return ok ? { x, top, bottom } : null;
}

/** Titel-Layout des Beitragsbilds (gleiche Regeln wie heroOverlay.buildSvg). */
export function titleMetrics(title: string, maxWidth = HERO_W - 2 * HERO_PAD_X) {
  const font = loadFont(800);
  const { size, lines } = fitTitle(font, title, {
    maxWidth, maxLines: 4, maxSize: 92, minSize: 54, colors: ['#ffffff', '#ffc93c'],
  });
  const lh = Math.round(size * 1.06);
  const firstBaseline = 34 + Math.round(size * 0.86);
  const bottom = firstBaseline + (lines.length - 1) * lh + Math.round(size * 0.25);
  return { size, lines, lh, firstBaseline, bottom };
}

/** Höhe (px im 1200×630-Bild), die der Titel oben belegt, inkl. kleinem Abstand. */
export function titleBandHeight(title: string): number {
  return titleMetrics(title).bottom + 14;
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const round = (r: Region): Region => ({
  left: Math.round(r.left), top: Math.round(r.top), width: Math.round(r.width), height: Math.round(r.height),
});

export function planHero(srcW: number, srcH: number, focus: Focus | null, title: string): HeroPlan {
  if (!focus) return { mode: 'attention' };
  const cropW = Math.min(srcW, (srcH * HERO_W) / HERO_H);
  const cropH = (cropW * HERO_H) / HERO_W;
  const band = titleBandHeight(title) / HERO_H; // Anteil, den der Titel oben verdeckt
  const t = (focus.top / 100) * srcH;
  const b = (focus.bottom / 100) * srcH;
  const margin = 0.02 * cropH;
  const free = cropH * (1 - band) - 2 * margin;
  if (b - t <= free) {
    const top = clamp(t - band * cropH - margin, 0, srcH - cropH);
    const headOk = t >= top + band * cropH - 1;
    const waistOk = b <= top + cropH + 1;
    if (headOk && waistOk) {
      const left = clamp((focus.x / 100) * srcW - cropW / 2, 0, srcW - cropW);
      return { mode: 'cover', region: round({ left, top, width: cropW, height: cropH }) };
    }
  }
  // Split: Foto in voller Höhe rechts. Zu breite Fotos werden um die Person herum beschnitten.
  const fullW = (HERO_H * srcW) / srcH;
  const photoW = Math.min(fullW, HERO_W * SPLIT_MAX_PHOTO);
  const regionW = (photoW / HERO_H) * srcH;
  const left = clamp((focus.x / 100) * srcW - regionW / 2, 0, srcW - regionW);
  const pw = Math.round(photoW);
  const photo = { left: HERO_W - pw, top: 0, width: pw, height: HERO_H };
  return {
    mode: 'split',
    region: round({ left, top: 0, width: regionW, height: srcH }),
    photo,
    textWidth: HERO_W - photo.width,
  };
}

export function planBox(srcW: number, srcH: number, boxW: number, boxH: number, focus: Focus | null): Region | null {
  if (!focus) return null;
  const cropW = Math.min(srcW, (srcH * boxW) / boxH);
  const cropH = (cropW * boxH) / boxW;
  const t = (focus.top / 100) * srcH;
  const b = (focus.bottom / 100) * srcH;
  const head = (b - t) <= cropH * 0.92 ? 0.06 : 0.03; // passt alles: etwas Luft über dem Kopf
  const top = clamp(t - head * cropH, 0, srcH - cropH);
  const left = clamp((focus.x / 100) * srcW - cropW / 2, 0, srcW - cropW);
  return round({ left, top, width: cropW, height: cropH });
}
