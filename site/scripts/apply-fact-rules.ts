// One-off source pass for src/data/fact-rules.ts (user, 2026-10-09). Idempotent: run again after
// adding a rule.   npx tsx scripts/apply-fact-rules.ts
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { applyRules, FACT_RULES_DE, FACT_RULES_FR, FACT_RULES_EN } from '../src/data/fact-rules';

const SKIP = [/posts\.json$/, /node_modules/];
function walk(dir: string, out: string[] = []): string[] {
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    if (SKIP.some((r) => r.test(p))) continue;
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(astro|ts|json|md|txt)$/.test(n)) out.push(p);
  }
  return out;
}

let changed = 0;
for (const f of [...walk('src'), 'public/llms.txt', 'public/llms-full.txt']) {
  if (f.endsWith('fact-rules.ts')) continue;
  const raw = readFileSync(f, 'utf8');
  let out: string;
  if (/i18n[\\/]strings/.test(f)) {
    const list = JSON.parse(raw) as { de: string; fr: string; en: string }[];
    for (const e of list) {
      e.de = applyRules(e.de, FACT_RULES_DE);
      e.fr = applyRules(e.fr, FACT_RULES_FR);
      e.en = applyRules(e.en, FACT_RULES_EN);
    }
    out = JSON.stringify(list, null, 1) + '\n';
    if (JSON.stringify(JSON.parse(raw)) === JSON.stringify(list)) out = raw;
  } else {
    out = applyRules(raw, FACT_RULES_DE);
  }
  if (out !== raw) { writeFileSync(f, out); changed++; console.log('fixed', f); }
}
console.log(`${changed} files`);
