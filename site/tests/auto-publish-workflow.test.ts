import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

// Regression 09.11.2026: Seit 03db5a7 (05.11.) schreibt der Build src/lib/blog-media-manifest.json neu.
// Der Commit-Schritt von auto-publish.yml nahm die Datei nicht mit → „cannot pull with rebase:
// You have unstaged changes“ → freigegebener Artikel ging nicht online.
const wf = readFileSync(new URL('../../.github/workflows/auto-publish.yml', import.meta.url), 'utf8');
const step = wf.slice(wf.indexOf('- name: Committen'));

describe('auto-publish.yml – Commit-Schritt', () => {
  it('nimmt das vom Build erzeugte Bild-Manifest mit', () => {
    expect(step).toMatch(/git add[^\n]*src\/lib\/blog-media-manifest\.json/);
  });

  it('hinterlässt vor dem Rebase keine ungesicherten Änderungen', () => {
    const add = step.indexOf('git commit');
    const pull = step.indexOf('git pull --rebase');
    expect(add).toBeGreaterThan(-1);
    expect(pull).toBeGreaterThan(add);
    expect(step).toMatch(/--autostash|git stash|git checkout -- \.|git reset --hard/);
  });
});
