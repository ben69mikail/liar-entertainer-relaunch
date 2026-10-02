import fs from 'fs';
import path from 'path';

const pagesDir = 'src/pages';

const VIDEO_SECTION = `
  <!-- Video Sektion -->
  <!-- Wave oben (weiß → blau) -->
  <div style="overflow:hidden;line-height:0;">
    <svg viewBox="0 0 1440 60" preserveAspectRatio="none" style="display:block;width:100%;height:60px;">
      <path d="M0,0 Q720,60 1440,0 L1440,60 L0,60 Z" fill="#3b55d5"/>
    </svg>
  </div>
  <section class="py-14 bg-[#3b55d5]">
    <div class="max-w-3xl mx-auto px-4 text-center">
      <h2 class="text-white font-extrabold text-xl uppercase tracking-widest mb-6">
        SCHNELLE EINDRÜCKE
      </h2>
      <div class="relative w-full max-w-2xl mx-auto mb-8" style="padding-bottom: 56.25%; position: relative;">
        <iframe
          src="https://www.youtube.com/embed/Cop0SqRIX4Y"
          title="Clown Zauberer für Geburtstag, Feier, Veranstaltung in NRW : die lustigste Zaubershow im Pott!"
          class="absolute inset-0 w-full h-full rounded-lg"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen
          loading="lazy"
        ></iframe>
      </div>
      <h3 class="text-white font-bold text-xl mb-6">
        Mehr Fotos und Videos in der Galerie
      </h3>
      <a
        href="/galerie/"
        class="inline-block bg-[#f5a623] hover:bg-[#e69420] text-white font-bold px-10 py-4 rounded-full text-base transition-colors"
      >
        Zur Foto- und Videogalerie
      </a>
    </div>
  </section>
  <!-- Wave unten (blau → weiß) -->
  <div style="overflow:hidden;line-height:0;background:#3b55d5;display:block;">
    <svg viewBox="0 0 1440 60" preserveAspectRatio="none" style="display:block;width:100%;height:60px;">
      <path d="M0,60 Q720,0 1440,60 L1440,60 L0,60 Z" fill="white"/>
    </svg>
  </div>
`;

// Files to skip (already have video, or utility pages)
const SKIP_FILES = [
  'index.astro',           // homepage - already has video
  '[...slug].astro',       // catch-all - already has video
  '404.astro',
];

const SKIP_DIRS = [
  'blog',                  // no blog pages
  'kontakt',               // utility pages
];

const SKIP_PATHS = [
  'galerie/index.astro',
  'kinderzauberer/index.astro',
  'zauberer/zaubershow/index.astro',
];

function getAllAstroFiles(dir) {
  const results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...getAllAstroFiles(fullPath));
    } else if (entry.name.endsWith('.astro')) {
      results.push(fullPath);
    }
  }
  return results;
}

function shouldProcess(filePath) {
  const rel = path.relative(pagesDir, filePath).replace(/\\/g, '/');

  // Skip specific files in pages root
  for (const skip of SKIP_FILES) {
    if (rel === skip) return false;
  }

  // Skip entire directories
  for (const skipDir of SKIP_DIRS) {
    if (rel.startsWith(skipDir + '/')) return false;
  }

  // Skip specific paths
  for (const skipPath of SKIP_PATHS) {
    if (rel === skipPath) return false;
  }

  return true;
}

function hasVideo(content) {
  return content.includes('youtube') || content.includes('iframe') || content.includes('SCHNELLE EINDRÜCKE');
}

function findInsertionPoint(content) {
  // Find all </section> positions
  const sectionEndRegex = /<\/section>/g;
  const positions = [];
  let match;
  while ((match = sectionEndRegex.exec(content)) !== null) {
    positions.push(match.index + match[0].length);
  }

  if (positions.length < 3) return -1;

  // Find the </BaseLayout> or end tag to know total content length
  const layoutEnd = content.lastIndexOf('</BaseLayout>') || content.length;

  // We want to insert in the last third - find section endings in last third
  const oneThirdFromEnd = layoutEnd - (layoutEnd * 0.33);

  // Find section endings in the last third
  const lastThirdPositions = positions.filter(p => p > oneThirdFromEnd && p < layoutEnd);

  if (lastThirdPositions.length === 0) {
    // Fallback: use the second-to-last section ending
    return positions[positions.length - 2];
  }

  // Check each position: we want one that's between two white sections
  // Look for a position where the NEXT section has bg-white or no colored bg
  for (const pos of lastThirdPositions) {
    const afterText = content.substring(pos, pos + 200);
    // Check if there's a wave/colored section right after - if so, skip
    if (afterText.includes('bg-[#d7393e]') || afterText.includes('bg-[#3b55d5]')) {
      continue;
    }
    // Good spot - between white sections
    return pos;
  }

  // Fallback: use first position in last third
  return lastThirdPositions[0] || positions[positions.length - 2];
}

// Main
const allFiles = getAllAstroFiles(pagesDir);
let processed = 0;
let skipped = 0;
let alreadyHasVideo = 0;

for (const filePath of allFiles) {
  if (!shouldProcess(filePath)) {
    skipped++;
    continue;
  }

  let content = fs.readFileSync(filePath, 'utf-8');

  if (hasVideo(content)) {
    alreadyHasVideo++;
    const rel = path.relative(pagesDir, filePath).replace(/\\/g, '/');
    console.log(`SKIP (has video): ${rel}`);
    continue;
  }

  const insertPos = findInsertionPoint(content);
  if (insertPos === -1) {
    const rel = path.relative(pagesDir, filePath).replace(/\\/g, '/');
    console.log(`SKIP (no good insertion point): ${rel}`);
    skipped++;
    continue;
  }

  // Insert the video section
  const newContent = content.slice(0, insertPos) + '\n' + VIDEO_SECTION + '\n' + content.slice(insertPos);
  fs.writeFileSync(filePath, newContent, 'utf-8');

  const rel = path.relative(pagesDir, filePath).replace(/\\/g, '/');
  console.log(`ADDED video: ${rel}`);
  processed++;
}

console.log(`\nDone! Processed: ${processed}, Skipped: ${skipped}, Already had video: ${alreadyHasVideo}`);
