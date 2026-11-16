// Build-Hook (prebuild, nach generate-overlays): 15-s-Story-Video mit eigener Musik
// für Artikel der letzten 14 Tage → public/story-generated/<slug>.mp4 (wird von Auto-Publish committet).
// Ohne ffmpeg (z. B. auf Netlify) wird übersprungen – das Video kommt dann aus dem Repo.
import { readdir, readFile, access } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import matter from 'gray-matter';
import { pickTrack, needsVideo, ffmpegArgs } from '../src/utils/storyVideo.ts';

const BLOG_DIR = path.resolve('./src/content/blog');
const STORY_DIR = path.resolve('./public/story-generated');
const MUSIC_DIR = path.resolve('./src/assets/story-music');
const exists = async (p) => { try { await access(p); return true; } catch { return false; } };

function hasFfmpeg() {
  try { execFileSync('ffmpeg', ['-version'], { stdio: 'ignore' }); return true; } catch { return false; }
}

const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Berlin' });
const files = (await readdir(BLOG_DIR)).filter((f) => /\.mdx?$/.test(f));
const todo = [];
for (const f of files) {
  const slug = f.replace(/\.mdx?$/, '');
  const { data } = matter(await readFile(path.join(BLOG_DIR, f), 'utf8'));
  if (!needsVideo(data.publishDate, today)) continue;
  const image = path.join(STORY_DIR, `${slug}.jpg`);
  const out = path.join(STORY_DIR, `${slug}.mp4`);
  if (!(await exists(image)) || (await exists(out))) continue;
  todo.push({ slug, image, out, track: pickTrack(data) });
}

if (!todo.length) {
  console.log('[story-video] nichts zu tun');
} else if (!hasFfmpeg()) {
  console.warn(`[story-video] ffmpeg fehlt – ${todo.length} Video(s) übersprungen`);
} else {
  for (const t of todo) {
    const audio = path.join(MUSIC_DIR, `${t.track}.m4a`);
    console.log(`[story-video] ${t.slug} (${t.track})`);
    try {
      execFileSync('ffmpeg', ffmpegArgs({ image: t.image, audio, out: t.out }), { stdio: 'inherit' });
    } catch (e) {
      console.warn(`[story-video] FEHLER ${t.slug}: ${e.message} – Story fällt auf das Bild zurück`);
    }
  }
}
