/**
 * Story-Video (16.11.2026): 15 s, 1080×1920, Story-Bild mit leichtem Zoom + eigene Musik.
 * Meta lässt Musik aus der App-Bibliothek nicht per Schnittstelle zu – deshalb Video mit Ton.
 * Output: public/story-generated/<slug>.mp4 (scripts/generate-story-videos.mjs, nur neue Artikel).
 */

export const STORY_SECONDS = 15;
const VIDEO_DAYS = 14;

const WINTER = /weihnacht|advent|nikolaus|silvester|winter|christkind|lebkuchen|schnee|xmas|christmas|no[eë]l/i;

export function pickTrack(post: { title?: string; tags?: string[]; categories?: string[]; description?: string }): 'winter' | 'zirkus' {
  const text = [post.title, post.description, ...(post.tags || []), ...(post.categories || [])].filter(Boolean).join(' ');
  return WINTER.test(text) ? 'winter' : 'zirkus';
}

function iso(d: unknown): string {
  if (d instanceof Date && !Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  const s = String(d || '');
  return /^\d{4}-\d{2}-\d{2}/.test(s) ? s.slice(0, 10) : '';
}

/** Nur Artikel der letzten 14 Tage bekommen ein Video (hält den Build schnell). */
export function needsVideo(publishDate: unknown, today: string, days = VIDEO_DAYS): boolean {
  const p = iso(publishDate);
  if (!p) return false;
  const diff = (Date.parse(today + 'T12:00:00Z') - Date.parse(p + 'T12:00:00Z')) / 86400000;
  return diff >= -1 && diff <= days;
}

export function ffmpegArgs({ image, audio, out, seconds = STORY_SECONDS }: { image: string; audio: string; out: string; seconds?: number }): string[] {
  const frames = seconds * 30;
  const vf = [
    'scale=1080:1920',
    `zoompan=z='1+0.06*on/${frames}':d=1:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1080x1920:fps=30`,
    'fade=t=in:st=0:d=0.4',
    `fade=t=out:st=${seconds - 0.6}:d=0.6`,
  ].join(',');
  return [
    '-y', '-hide_banner', '-loglevel', 'error',
    '-loop', '1', '-i', image,
    '-stream_loop', '-1', '-i', audio,
    '-t', String(seconds),
    '-vf', vf,
    '-af', `afade=t=in:st=0:d=0.3,afade=t=out:st=${seconds - 1.5}:d=1.5`,
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '26', '-pix_fmt', 'yuv420p', '-r', '30',
    '-c:a', 'aac', '-b:a', '128k', '-ar', '44100',
    '-movflags', '+faststart',
    out,
  ];
}
