/**
 * Eigene Story-Musik (16.11.2026): synthetisiert im Build-Skript, keine fremden Aufnahmen.
 * - winter: „Jingle Bells“ (J. Pierpont, 1857 – gemeinfrei), eigene Glockenspiel-Fassung
 * - zirkus: eigene Melodie (LIAR), fröhlicher Zirkus-Marsch mit Humpta-Bass
 * Erzeugt mit scripts/make-story-music.mjs → src/assets/story-music/<name>.m4a
 */

const NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
export const NOTE_HZ: Record<string, number> = {};
for (let oct = 2; oct <= 6; oct++) {
  NAMES.forEach((n, i) => {
    const midi = (oct + 1) * 12 + i;
    NOTE_HZ[n + oct] = 440 * Math.pow(2, (midi - 69) / 12);
  });
}

type Note = [string, number]; // [Note oder 'R' für Pause, Dauer in Schlägen]
interface Melody { bpm: number; notes: Note[]; bass: string[]; repeat: number; style: 'walzer' | 'humpta' }

const JB_A: Note[] = [
  ['E5', 1], ['E5', 1], ['E5', 2], ['E5', 1], ['E5', 1], ['E5', 2],
  ['E5', 1], ['G5', 1], ['C5', 1.5], ['D5', 0.5], ['E5', 4],
  ['F5', 1], ['F5', 1], ['F5', 1.5], ['F5', 0.5], ['F5', 1], ['E5', 1], ['E5', 1], ['E5', 0.5], ['E5', 0.5],
];

export const MELODIES: Record<'winter' | 'zirkus', Melody> = {
  winter: {
    bpm: 150,
    style: 'walzer',
    repeat: 1,
    notes: [
      ...JB_A, ['E5', 1], ['D5', 1], ['D5', 1], ['E5', 1], ['D5', 2], ['G5', 2],
      ...JB_A, ['G5', 1], ['G5', 1], ['F5', 1], ['D5', 1], ['C5', 4],
    ],
    // Grundton je Takt (4 Schläge)
    bass: ['C3', 'C3', 'C3', 'C3', 'F3', 'C3', 'D3', 'G3', 'C3', 'C3', 'C3', 'C3', 'F3', 'C3', 'G3', 'C3'],
  },
  zirkus: {
    bpm: 168,
    style: 'humpta',
    repeat: 2,
    notes: [
      ['G4', 0.5], ['C5', 0.5], ['E5', 0.5], ['G5', 0.5], ['E5', 1], ['C5', 1],
      ['D5', 0.5], ['F5', 0.5], ['A5', 0.5], ['F5', 0.5], ['D5', 1], ['B4', 1],
      ['C5', 0.5], ['E5', 0.5], ['G5', 0.5], ['C6', 0.5], ['B5', 0.5], ['A5', 0.5], ['G5', 1],
      ['F5', 0.5], ['E5', 0.5], ['D5', 0.5], ['E5', 0.5], ['C5', 2],
      ['E5', 0.5], ['E5', 0.5], ['F5', 0.5], ['G5', 0.5], ['A5', 1], ['G5', 1],
      ['F5', 0.5], ['F5', 0.5], ['E5', 0.5], ['D5', 0.5], ['G5', 2],
      ['E5', 0.5], ['G5', 0.5], ['C6', 1], ['A5', 0.5], ['F5', 0.5], ['D5', 1],
      ['G5', 1], ['B4', 1], ['C5', 2],
    ],
    bass: ['C3', 'G2', 'C3', 'G2', 'C3', 'G2', 'F2', 'C3'],
  },
};

const TWO_PI = Math.PI * 2;

// Deterministisches Rauschen für die leise Rhythmus-„Rassel“ (gleiches Ergebnis bei jedem Build).
function noiseGen(seed = 12345) {
  let x = seed;
  return () => { x = (x * 1103515245 + 12345) & 0x7fffffff; return x / 0x3fffffff - 1; };
}

function addBell(buf: Float32Array, sr: number, start: number, hz: number, dur: number, amp: number) {
  const n = Math.min(buf.length - start, Math.floor((dur + 0.8) * sr));
  for (let i = 0; i < n; i++) {
    const t = i / sr;
    const env = Math.min(1, t / 0.004) * Math.exp(-t * 3.2);
    buf[start + i] += amp * env * (Math.sin(TWO_PI * hz * t) + 0.32 * Math.sin(TWO_PI * hz * 2.76 * t) * Math.exp(-t * 6) + 0.12 * Math.sin(TWO_PI * hz * 5.4 * t) * Math.exp(-t * 10));
  }
}

function addBass(buf: Float32Array, sr: number, start: number, hz: number, amp: number) {
  const n = Math.min(buf.length - start, Math.floor(0.45 * sr));
  for (let i = 0; i < n; i++) {
    const t = i / sr;
    const env = Math.min(1, t / 0.008) * Math.exp(-t * 7);
    buf[start + i] += amp * env * (Math.sin(TWO_PI * hz * t) + 0.25 * Math.sin(TWO_PI * hz * 2 * t));
  }
}

function addTick(buf: Float32Array, sr: number, start: number, amp: number, rnd: () => number) {
  const n = Math.min(buf.length - start, Math.floor(0.05 * sr));
  for (let i = 0; i < n; i++) buf[start + i] += amp * rnd() * Math.exp(-(i / sr) * 90);
}

/** Rendert die Melodie als Mono-PCM (−1…1), mindestens 15 s lang. */
export function renderTrack(name: 'winter' | 'zirkus', sr = 44100): Float32Array {
  const m = MELODIES[name];
  const beat = 60 / m.bpm;
  const beatsOnce = m.notes.reduce((s, [, b]) => s + b, 0);
  const totalBeats = beatsOnce * m.repeat;
  const seconds = Math.max(15, totalBeats * beat) + 1;
  const buf = new Float32Array(Math.ceil(seconds * sr));
  const rnd = noiseGen();

  for (let r = 0; r < m.repeat; r++) {
    let pos = r * beatsOnce;
    for (const [note, beats] of m.notes) {
      if (note !== 'R') addBell(buf, sr, Math.floor(pos * beat * sr), NOTE_HZ[note], beats * beat, 0.5);
      pos += beats;
    }
  }
  for (let b = 0; b < totalBeats; b++) {
    const bar = Math.floor(b / 4) % m.bass.length;
    const root = NOTE_HZ[m.bass[bar]];
    const at = Math.floor(b * beat * sr);
    const inBar = b % 4;
    if (m.style === 'humpta') {
      if (inBar === 0 || inBar === 2) addBass(buf, sr, at, inBar === 0 ? root : root * 1.5, 0.45);
      else addBell(buf, sr, at, root * 4 * (inBar === 1 ? 1.25 : 1.5), 0.2, 0.08);
    } else if (inBar === 0 || inBar === 2) {
      addBass(buf, sr, at, root, 0.35);
    }
    addTick(buf, sr, at, inBar === 0 ? 0.06 : 0.035, rnd);
  }
  let peak = 0;
  for (const v of buf) peak = Math.max(peak, Math.abs(v));
  const g = peak > 0 ? 0.85 / peak : 1;
  for (let i = 0; i < buf.length; i++) buf[i] *= g;
  return buf;
}

/** 16-Bit-Mono-WAV für ffmpeg. */
export function toWav(pcm: Float32Array, sr: number): Buffer {
  const data = Buffer.alloc(pcm.length * 2);
  for (let i = 0; i < pcm.length; i++) data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, pcm[i])) * 32767), i * 2);
  const h = Buffer.alloc(44);
  h.write('RIFF', 0); h.writeUInt32LE(36 + data.length, 4); h.write('WAVE', 8); h.write('fmt ', 12);
  h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22); h.writeUInt32LE(sr, 24);
  h.writeUInt32LE(sr * 2, 28); h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34); h.write('data', 36); h.writeUInt32LE(data.length, 40);
  return Buffer.concat([h, data]);
}
