import { describe, it, expect } from 'vitest';
import { pickTrack, needsVideo, ffmpegArgs, STORY_SECONDS } from '../src/utils/storyVideo';
import { MELODIES, renderTrack, NOTE_HZ } from '../src/utils/storyMusic';

// Wunsch 16.11.2026: Stories mit Musik. Meta lässt die App-Musik nicht per Schnittstelle zu,
// deshalb wird die Story als 15-s-Video (Story-Bild + eigene, lizenzfreie Musik) gepostet.

describe('Musik-Auswahl je Artikel', () => {
  it('Weihnachts-/Winterthemen bekommen die Wintermelodie', () => {
    expect(pickTrack({ title: 'Adventskalender für Kinder: 24 Ideen' })).toBe('winter');
    expect(pickTrack({ title: 'Zaubershow', tags: ['nikolaus'] })).toBe('winter');
    expect(pickTrack({ title: 'Silvester mit Kindern' })).toBe('winter');
  });
  it('alles andere bekommt die Zirkusmelodie', () => {
    expect(pickTrack({ title: 'Kindergeburtstag im Sommer', tags: ['clown'] })).toBe('zirkus');
  });
});

describe('Nur neue Artikel bekommen ein Video (Build-Zeit)', () => {
  it('Artikel der letzten 14 Tage', () => {
    expect(needsVideo('2026-11-16', '2026-11-16')).toBe(true);
    expect(needsVideo('2026-11-03', '2026-11-16')).toBe(true);
    expect(needsVideo('2026-10-01', '2026-11-16')).toBe(false);
    expect(needsVideo(undefined, '2026-11-16')).toBe(false);
  });
});

describe('ffmpeg-Aufruf für Meta-taugliches Story-Video', () => {
  const args = ffmpegArgs({ image: 'a.jpg', audio: 'm.m4a', out: 'o.mp4' });
  const s = args.join(' ');
  it('9:16, H.264, yuv420p, AAC, 15 s, Faststart', () => {
    expect(STORY_SECONDS).toBe(15);
    expect(s).toMatch(/-t 15\b/);
    expect(s).toMatch(/1080x1920|1080:1920/);
    expect(s).toMatch(/-c:v libx264/);
    expect(s).toMatch(/-pix_fmt yuv420p/);
    expect(s).toMatch(/-c:a aac/);
    expect(s).toMatch(/-movflags \+faststart/);
  });
  it('Bild als Schleife, Musik wird bei Bedarf wiederholt, Ton blendet aus', () => {
    expect(s).toMatch(/-loop 1 -i a\.jpg/);
    expect(s).toMatch(/-stream_loop -1 -i m\.m4a/);
    expect(s).toMatch(/afade=t=out/);
    expect(args[args.length - 1]).toBe('o.mp4');
  });
});

describe('Eigene Musik (synthetisiert, keine fremden Aufnahmen)', () => {
  it('es gibt eine Winter- und eine Zirkusmelodie aus gültigen Noten', () => {
    for (const name of ['winter', 'zirkus'] as const) {
      const m = MELODIES[name];
      expect(m.notes.length).toBeGreaterThan(16);
      for (const [note, beats] of m.notes) {
        expect(note === 'R' || note in NOTE_HZ).toBe(true);
        expect(beats).toBeGreaterThan(0);
      }
    }
  });
  it('rendert mindestens 15 s, ohne Übersteuerung, hörbar laut', () => {
    const sr = 8000; // klein halten, nur Test
    for (const name of ['winter', 'zirkus'] as const) {
      const pcm = renderTrack(name, sr);
      expect(pcm.length).toBeGreaterThanOrEqual(STORY_SECONDS * sr);
      let peak = 0;
      for (const v of pcm) peak = Math.max(peak, Math.abs(v));
      expect(peak).toBeLessThanOrEqual(1);
      expect(peak).toBeGreaterThan(0.3);
    }
  });
});
