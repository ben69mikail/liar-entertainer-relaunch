import { describe, it, expect } from 'vitest';
import * as cheerio from 'cheerio';
import { buildDictionary, norm, translateHtml } from '../src/i18n/translate-html';

const dict = buildDictionary([
  { de: 'Hallo <strong>Welt</strong>', fr: 'Bonjour <strong>le monde</strong>', en: 'Hello <strong>world</strong>' },
  { de: 'Kontakt', fr: 'Contact', en: 'Contact' },
  { de: 'Ein Foto', fr: 'Une photo', en: 'A photo' },
  { de: 'Seite | LIAR', fr: 'Page | LIAR', en: 'Page | LIAR' },
  { de: 'Beschreibung', fr: 'Description FR', en: 'Description EN' },
  { de: 'Dienst', fr: 'Service FR', en: 'Service EN' },
  { de: '© {YEAR} LIAR – Alle Rechte vorbehalten', fr: '© {YEAR} LIAR – Tous droits réservés', en: '© {YEAR} LIAR – All rights reserved' },
]);

const html = `<!doctype html><html lang="de"><head><title>Seite | LIAR</title>
<meta name="description" content="Beschreibung"><meta name="keywords" content="a, b">
<meta property="og:locale" content="de_DE"><link rel="canonical" href="https://liar-entertainer.com/kontakt/">
<script type="application/ld+json">{"@type":"Service","name":"Dienst","url":"https://liar-entertainer.com/kontakt/","provider":{"@id":"https://liar-entertainer.com/#business"}}</script>
</head><body><p class="x"> Hallo <strong data-astro-cid-abc123="">Welt</strong> </p>
<a href="/kontakt/#anfrage">Kontakt</a><a href="/preise/">Kontakt</a>
<img src="a.jpg" alt="Ein Foto"><p data-review-text>Super Show!</p>
<div data-i18n="drop"><p>Blogartikel</p></div>
<nav data-i18n="keep"><a href="/kontakt/">DE</a></nav>
<p>© 2031 LIAR – Alle Rechte vorbehalten</p></body></html>`;

describe('translateHtml', () => {
  const { html: out, missing } = translateHtml(html, 'fr', dict);
  const $ = cheerio.load(out);

  it('translates text units with their inline markup and keeps scoped-style attributes', () => {
    expect($('p.x').text().trim()).toBe('Bonjour le monde');
    expect($('p.x strong').attr('data-astro-cid-abc123')).toBe('');
  });

  it('sets the language and translates head and structured data', () => {
    expect($('html').attr('lang')).toBe('fr');
    expect($('title').text()).toBe('Page | LIAR');
    expect($('meta[name=description]').attr('content')).toBe('Description FR');
    expect($('meta[name=keywords]').length).toBe(0);
    expect($('meta[property="og:locale"]').attr('content')).toBe('fr_FR');
    expect($('link[rel=canonical]').attr('href')).toBe('https://liar-entertainer.com/fr/contact/');
    const ld = JSON.parse($('script[type="application/ld+json"]').text());
    expect(ld.name).toBe('Service FR');
    expect(ld.url).toBe('https://liar-entertainer.com/fr/contact/');
    expect(ld.provider['@id']).toBe('https://liar-entertainer.com/#business');
  });

  it('points links at the twin page, or keeps the German page when there is none', () => {
    expect($('body > a').eq(0).attr('href')).toBe('/fr/contact/#anfrage');
    expect($('body > a').eq(1).attr('href')).toBe('/preise/');
    expect($('nav a').attr('href')).toBe('/kontakt/');
  });

  it('translates attributes, keeps review quotes, drops German-only blocks', () => {
    expect($('img').attr('alt')).toBe('Une photo');
    expect($('[data-review-text]').text()).toBe('Super Show!');
    expect(out).not.toContain('Blogartikel');
  });

  it('fills in the running year', () => {
    expect(out).toContain(`© ${new Date().getFullYear()} LIAR – Tous droits réservés`);
  });

  it('reports nothing missing when every string is known', () => {
    expect(missing).toEqual([]);
  });

  it('reports untranslated German', () => {
    const r = translateHtml('<html><body><p>Unbekannt</p></body></html>', 'en', dict);
    expect(r.missing).toEqual([{ kind: 'text', de: 'Unbekannt' }]);
  });
});

describe('norm', () => {
  it('ignores whitespace, scoped-style ids and the copyright year', () => {
    expect(norm(' a  <b data-astro-cid-x1y2="">c</b>\n')).toBe('a <b>c</b>');
    expect(norm('© 2026 X')).toBe('© {YEAR} X');
  });
});

describe('buildDictionary', () => {
  it('rejects one German string with two different translations', () => {
    expect(() =>
      buildDictionary([
        { de: 'A', fr: 'x', en: 'y' },
        { de: 'A', fr: 'z', en: 'y' },
      ]),
    ).toThrow(/two different translations/);
  });
});
