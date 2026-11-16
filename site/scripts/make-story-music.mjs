// Einmalig/bei Melodie-Änderung: erzeugt die eigene Story-Musik als AAC.
// Aufruf: node --import tsx scripts/make-story-music.mjs   (braucht ffmpeg)
// Ergebnis wird committet: src/assets/story-music/{winter,zirkus}.m4a
import { mkdir, writeFile, rm } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import os from 'node:os';
import { renderTrack, toWav } from '../src/utils/storyMusic.ts';

const OUT = path.resolve('./src/assets/story-music');
const SR = 44100;
await mkdir(OUT, { recursive: true });
for (const name of ['winter', 'zirkus']) {
  const wav = path.join(os.tmpdir(), `liar-story-${name}.wav`);
  await writeFile(wav, toWav(renderTrack(name, SR), SR));
  const out = path.join(OUT, `${name}.m4a`);
  execFileSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-i', wav,
    '-af', 'aecho=0.8:0.6:60:0.18,loudnorm=I=-16:TP=-1.5:LRA=11', '-c:a', 'aac', '-b:a', '128k', '-ar', '44100', '-ac', '2', out]);
  await rm(wav);
  console.log('[music]', out);
}
