/**
 * Site-wide fact corrections (user, 2026-10-09, GSC analysis docs/seo-audit-2026-10-09/):
 * professional since 2009 (no fixed "15 years" that ages), over 400 shows per year, 370+ Google
 * reviews. Applied once to the sources by scripts/apply-fact-rules.ts and to the legacy baseline
 * by the parity tests, so every corrected sentence is documented here instead of one entry each.
 *
 * Dated news posts (src/data/posts.json) keep their historical wording.
 */
export type Rule = [RegExp, string];

export const FACT_RULES_DE: Rule[] = [
  [/([Ss])eit\s+über\s+1[57]\s+Jahren/g, '$1eit 2009'],
  [/([Ss])eit\s+15\s+Jahren/g, '$1eit 2009'],
  [/in\s+den\s+letzten\s+15\s+Jahren/g, 'seit 2009'],
  [/15\+\s+Jahre(n?)/g, 'über 17 Jahre$1'],
  [/\b15\s+Jahre(n?)\b/g, '17 Jahre$1'],
  [/rund\s+400\s+Shows/g, 'über 400 Shows'],
  [/Über 400 zufriedene Kunden können nicht irren!/g, '370+ Google-Bewertungen können nicht irren!'],
];

export const FACT_RULES_FR: Rule[] = [
  [/depuis plus de 15 ans/g, 'depuis 2009'],
  [/[Dd]epuis 15 ans/g, 'depuis 2009'],
  [/au cours des 15 dernières années/g, 'depuis 2009'],
  [/15\s?\+ ans/g, 'plus de 17 ans'],
  [/\b15 ans\b/g, '17 ans'],
  [/environ 400 (spectacles|shows|représentations)/g, 'plus de 400 $1'],
  [/[Pp]rès de 400 (spectacles|shows|représentations)/g, 'plus de 400 $1'],
];

export const FACT_RULES_EN: Rule[] = [
  [/for over 15 years/g, 'since 2009'],
  [/for more than 15 years/g, 'since 2009'],
  [/for 15 years/g, 'since 2009'],
  [/[Oo]ver the last 15 years/g, 'since 2009'],
  [/in the past 15 years/g, 'since 2009'],
  [/15\+ years/g, 'over 17 years'],
  [/\b15 years\b/g, '17 years'],
  [/around 400 shows/g, 'over 400 shows'],
  [/some 400 shows/g, 'over 400 shows'],
];

// Prices only in the kids'-birthday context (user, 2026-10-09): the adult city pages taken over from
// zauberer-liar.de lose their "ab 150 €".
export const PRICE_RULES_ADULT: Rule[] = [[/zum Festpreis ab 150 €/g, 'zum Festpreis']];

export const applyRules = (s: string, rules: Rule[]): string => rules.reduce((t, [re, to]) => t.replace(re, to), s);
export const applyFacts = (s: string): string => applyRules(s, FACT_RULES_DE);
