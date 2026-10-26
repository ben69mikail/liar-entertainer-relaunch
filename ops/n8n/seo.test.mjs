// GSC-Wochenvorschläge + Monatsbericht je Artikel (Council 23.10.2026).
// Aufruf: node --test ops/n8n/seo.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const L = require('./seo-lib.cjs');

const row = (page, query, impressions, clicks, position) =>
  ({ keys: ['https://liar-entertainer.com' + page, query], impressions, clicks, ctr: clicks / impressions, position });

// ---------- Woche ----------
test('normPath: www, Anker, Query, fehlender Slash', () => {
  assert.equal(L.normPath('https://www.liar-entertainer.com/zauberer?x=1#a'), '/zauberer/');
  assert.equal(L.normPath('https://liar-entertainer.com/'), '/');
});

test('pickOpportunities: nur Platz 5–20, genug Impressionen, CTR unter Erwartung', () => {
  const rows = [
    row('/zauberer/', 'zauberer nrw', 400, 2, 8.2),        // Chance
    row('/zauberer/', 'zauberer buchen', 120, 1, 11),       // Chance, gleiche Seite
    row('/kindergeburtstag/', 'zauberer kindergeburtstag', 300, 40, 6), // CTR gut → nein
    row('/preise/', 'zauberer preise', 500, 0, 3),          // Platz < 5 → nein
    row('/clown/clownshow/', 'clown', 900, 0, 25),          // Platz > 20 → nein
    row('/galerie/', 'clown bilder', 10, 0, 9),             // zu wenig Impressionen → nein
    row('/kontakt/', 'zauberer kontakt', 200, 0, 9),        // Kontakt nie
  ];
  const o = L.pickOpportunities(rows, { minImpr: 30 });
  assert.deepEqual(o.map(x => x.path), ['/zauberer/']);
  assert.equal(o[0].queries.length, 2);
  assert.equal(o[0].queries[0].query, 'zauberer nrw');
  assert.equal(o[0].impressions, 520);
});

test('pickOpportunities: max. Seiten, sortiert nach verschenkten Klicks, Ausschlussliste', () => {
  const rows = [row('/a/', 'q1', 100, 0, 6), row('/b/', 'q2', 1000, 0, 6), row('/c/', 'q3', 500, 0, 6)];
  assert.deepEqual(L.pickOpportunities(rows, { minImpr: 30, maxPages: 2 }).map(x => x.path), ['/b/', '/c/']);
  assert.deepEqual(L.pickOpportunities(rows, { minImpr: 30, exclude: ['/b/'] }).map(x => x.path), ['/c/', '/a/']);
});

test('pageFacts: Title, Description, H1, FAQ aus JSON-LD', () => {
  const html = '<title>Zauberer NRW | LIAR</title><meta name="description" content="Profi seit 2009">' +
    '<script type="application/ld+json">{"@context":"https://schema.org","@graph":[{"@type":"FAQPage","mainEntity":[{"@type":"Question","name":"Was kostet?"}]}]}</script>' +
    '<h1 class="x">Zauberer <em>NRW</em></h1>';
  assert.deepEqual(L.pageFacts(html), { title: 'Zauberer NRW | LIAR', description: 'Profi seit 2009', h1: 'Zauberer NRW', faq: ['Was kostet?'] });
});

test('parseProposals: validiert Länge, Pfad, Preise außerhalb Kindergeburtstag', () => {
  const items = [{ path: '/zauberer/' }, { path: '/kindergeburtstag/' }];
  const txt = 'Ergebnis: ' + JSON.stringify({ proposals: [
    { path: '/zauberer/', seoTitle: 'Zauberer NRW buchen: Bühne, Tisch & Firmenfeier | LIAR', description: 'Zauberer für Hochzeit, Firmenfeier und Gala in NRW – französischer Charme, seit 2009 Profi. Jetzt unverbindlich anfragen!', faq: [{ frage: 'Wie lange dauert eine Show?', antwort: 'Meist 30 bis 60 Minuten.' }], grund: 'Query zauberer buchen' },
    { path: '/zauberer/', seoTitle: 'Doppelt | LIAR', description: 'x'.repeat(130), faq: [], grund: '' },
    { path: '/zauberer/hochzeit/', seoTitle: 'Nicht angefragt | LIAR', description: 'y'.repeat(130), faq: [], grund: '' },
    { path: '/kindergeburtstag/', seoTitle: 'Kindergeburtstag Zauberer ab 150 € | LIAR', description: 'Zaubershow zum Kindergeburtstag in NRW ab 150 Euro – 60 Minuten Mitmach-Zauberei mit Clown Zauberer LIAR. Jetzt Termin sichern!', faq: [], grund: 'Preis' },
  ] });
  const p = L.parseProposals(txt, items);
  assert.deepEqual(p.map(x => x.path), ['/zauberer/', '/kindergeburtstag/']);
  assert.equal(p[0].faq.length, 1);
});

test('parseProposals: verwirft zu lange Titles und Preise auf Erwachsenen-Seiten', () => {
  const items = [{ path: '/zauberer/firmenfeier/' }];
  const long = { path: '/zauberer/firmenfeier/', seoTitle: 'x'.repeat(70) + ' | LIAR', description: 'd'.repeat(130), faq: [] };
  const price = { path: '/zauberer/firmenfeier/', seoTitle: 'Firmenfeier Zauberer | LIAR', description: 'Zauberer ab 500 € für Ihre Firmenfeier in NRW – Close-up und Bühnenshow, seit 2009 Profi. Jetzt anfragen und Termin sichern!', faq: [] };
  assert.equal(L.parseProposals(JSON.stringify({ proposals: [long] }), items).length, 0);
  assert.equal(L.parseProposals(JSON.stringify({ proposals: [price] }), items).length, 0);
  assert.deepEqual(L.parseProposals('kaputt', items), []);
});

test('routeFor: neue Blogartikel direkt, Hauptseiten und Alt-Artikel als Auftrag', () => {
  const baseline = ['/blog/alter-artikel/', '/zauberer/'];
  assert.equal(L.routeFor('/blog/neuer-artikel/', baseline), 'blog');
  assert.equal(L.routeFor('/blog/alter-artikel/', baseline), 'auftrag');
  assert.equal(L.routeFor('/zauberer/', baseline), 'auftrag');
  assert.equal(L.routeFor('/blog/kategorie/x/', baseline), 'auftrag');
});

const MD = '---\ntitle: "Clown oder Zauberer?"\nseoTitle: "Alt | LIAR"\ndescription: "Alte Beschreibung"\npublishDate: 2026-10-01\ndraft: false\n---\n\nText [KG](/kindergeburtstag/).\n\n## ❓ Häufige Fragen\n\n### Frage 1?\n\nAntwort 1.\n\n### Frage 2?\n\nAntwort 2.\n\nRuf an: +49 172 1517578 oder [Kontakt](/kontakt/).\n';

test('applyBlogProposal: ersetzt seoTitle/Description, setzt updatedDate, hängt FAQ in den FAQ-Block', () => {
  const out = L.applyBlogProposal(MD, { seoTitle: 'Neu "Titel" | LIAR', description: 'Neue Beschreibung', faq: [{ frage: 'Frage 3?', antwort: 'Antwort 3.' }] }, '2026-10-26');
  assert.match(out, /\nseoTitle: "Neu 'Titel' \| LIAR"\n/);
  assert.match(out, /\ndescription: "Neue Beschreibung"\n/);
  assert.match(out, /\nupdatedDate: 2026-10-26\n/);
  assert.match(out, /Antwort 2\.\n\n### Frage 3\?\n\nAntwort 3\.\n\nRuf an:/);
  assert.equal((out.match(/^---$/gm) || []).length, 2);
});

test('applyBlogProposal: ohne FAQ-Block neuer Abschnitt am Ende; updatedDate wird ersetzt', () => {
  const md = '---\ntitle: "X"\npublishDate: 2026-01-01\nupdatedDate: 2026-02-01\n---\n\nText.\n';
  const out = L.applyBlogProposal(md, { seoTitle: 'S | LIAR', description: 'D', faq: [{ frage: 'F?', antwort: 'A.' }] }, '2026-10-26');
  assert.match(out, /title: "X"\nseoTitle: "S \| LIAR"\ndescription: "D"\n/);
  assert.equal((out.match(/updatedDate/g) || []).length, 1);
  assert.match(out, /Text\.\n\n## ❓ Häufige Fragen\n\n### F\?\n\nA\.\n$/);
});

test('weeklyTelegram: Kopfnachricht (Alle/Keine) + je Vorschlag eine Nachricht', () => {
  const props = [{ vid: 'w1', path: '/zauberer/', route: 'auftrag', seoTitle: 'T | LIAR', description: 'D', faq: [{ frage: 'F?', antwort: 'A.' }], queries: [{ query: 'zauberer nrw', impressions: 400, clicks: 2, position: 8.2 }], current: { title: 'Alt' } }];
  const m = L.weeklyTelegram(props, '2026-W44');
  assert.match(m.header, /GSC-Vorschläge 2026-W44/);
  assert.match(m.header, /1\. \/zauberer\//);
  assert.equal(m.items.length, 1);
  assert.equal(m.items[0].vid, 'w1');
  assert.match(m.items[0].text, /zauberer nrw/);
  assert.match(m.items[0].text, /<s>Alt<\/s>/);
  assert.match(m.items[0].text, /❓ F\?/);
  assert.ok(m.items[0].text.length < 4000);
});

test('isoWeek', () => {
  assert.equal(L.isoWeek(new Date('2026-10-26T06:00:00Z')), '2026-W44');
  assert.equal(L.isoWeek(new Date('2027-01-01T06:00:00Z')), '2026-W53');
});

// ---------- Monat ----------
const post = (slug, publishDate, title, links = ['/kindergeburtstag/']) => ({ slug, path: '/blog/' + slug + '/', title, publishDate, links });

test('parsePost: Frontmatter + Zielseiten-Links', () => {
  const p = L.parsePost('clown-oder-zauberer', MD);
  assert.equal(p.title, 'Clown oder Zauberer?');
  assert.equal(p.publishDate, '2026-10-01');
  assert.deepEqual(p.links, ['/kindergeburtstag/']);
  assert.equal(L.parsePost('x', '---\ntitle: "X"\ndraft: true\n---\n'), null);
});

test('monthlyReport: Wirkung, zu neu, ohne Wirkung', () => {
  const today = '2026-11-01';
  const posts = [post('alt-gut', '2026-05-01', 'Gut'), post('alt-schwach', '2026-05-01', 'Schwach'), post('neu', '2026-10-20', 'Neu')];
  const gscPage = [{ keys: ['https://liar-entertainer.com/blog/alt-gut/'], clicks: 30, impressions: 900, position: 7 },
    { keys: ['https://liar-entertainer.com/blog/alt-schwach/'], clicks: 1, impressions: 40, position: 30 }];
  const ga4 = [{ path: '/blog/alt-gut/', sessions: 50, keyEvents: 2 }, { path: '/blog/alt-schwach/', sessions: 3, keyEvents: 0 }];
  const r = L.monthlyReport({ posts, gscPage, gscPageQuery: [], ga4, today });
  const by = Object.fromEntries(r.rows.map(x => [x.slug, x]));
  assert.equal(by['alt-gut'].urteil, 'wirkt');
  assert.equal(by['alt-gut'].anfragen, 2);
  assert.equal(by['alt-schwach'].urteil, 'ohne Wirkung');
  assert.equal(by['neu'].urteil, 'zu neu');
  assert.deepEqual(r.ohneWirkung.map(x => x.slug), ['alt-schwach']);
});

test('monthlyReport: ohne Wirkung wird nicht erneut vorgeschlagen, wenn kürzlich „behalten“', () => {
  const posts = [post('alt-schwach', '2026-05-01', 'Schwach')];
  const r = L.monthlyReport({ posts, gscPage: [], gscPageQuery: [], ga4: [], today: '2026-11-01', behalten: ['alt-schwach'] });
  assert.equal(r.rows[0].urteil, 'ohne Wirkung');
  assert.deepEqual(r.ohneWirkung, []);
});

test('monthlyReport: Kannibalisierung, wenn Artikel und Leistungsseite um dieselbe Suche konkurrieren', () => {
  const posts = [post('was-kostet-zauberer', '2026-05-01', 'Was kostet ein Zauberer')];
  const pq = [
    row('/blog/was-kostet-zauberer/', 'zauberer kindergeburtstag kosten', 120, 3, 7),
    row('/kindergeburtstag/', 'zauberer kindergeburtstag kosten', 200, 5, 9),
    row('/blog/was-kostet-zauberer/', 'zauberer preise', 50, 1, 15),
    row('/preise/', 'zauberer preise', 300, 30, 4),     // Hauptseite klar vorn → kein Problem
  ];
  const r = L.monthlyReport({ posts, gscPage: [], gscPageQuery: pq, ga4: [], today: '2026-11-01' });
  assert.equal(r.kannibal.length, 1);
  assert.deepEqual(r.kannibal[0], { query: 'zauberer kindergeburtstag kosten', artikel: '/blog/was-kostet-zauberer/', artikelPos: 7, seite: '/kindergeburtstag/', seitePos: 9, impressionen: 320 });
});

test('similarThemes: offene Themen mit Wortüberschneidung', () => {
  const themes = [
    { id: 1, titel: 'Was kostet ein Zauberer für den Kindergeburtstag?', status: 'offen' },
    { id: 2, titel: 'Zauberer Kindergeburtstag Kosten 2027', status: 'offen' },
    { id: 3, titel: 'Zauberer Kindergeburtstag Kosten', status: 'veröffentlicht' },
    { id: 4, titel: 'Clown auf dem Sommerfest', status: 'offen' },
  ];
  assert.deepEqual(L.similarThemes('Was kostet ein Zauberer zum Kindergeburtstag', themes), [1, 2]);
});

test('monthlyTelegram: Bericht + je Artikel ohne Wirkung eine Entscheidungs-Nachricht', () => {
  const report = { monat: '2026-10', rows: [{ slug: 'a', title: 'A', urteil: 'ohne Wirkung', klicks: 0, impressionen: 5, position: 40, sitzungen: 1, anfragen: 0, alterTage: 120 }],
    ohneWirkung: [{ slug: 'a', vid: 'm1', title: 'A', ziel: '/kindergeburtstag/', klicks: 0, sitzungen: 1, anfragen: 0 }], kannibal: [] };
  const m = L.monthlyTelegram(report);
  assert.match(m.text, /ohne Wirkung/);
  assert.equal(m.items.length, 1);
  assert.equal(m.items[0].vid, 'm1');
  assert.match(m.items[0].text, /\/kindergeburtstag\//);
});

test('CRLF-Dateien (Alt-Artikel im Repo) werden gelesen und als LF geschrieben', () => {
  const crlf = MD.replace(/\n/g, '\r\n');
  const p = L.parsePost('clown-oder-zauberer', crlf);
  assert.equal(p.title, 'Clown oder Zauberer?');
  assert.equal(p.publishDate, '2026-10-01');
  const out = L.applyBlogProposal(crlf, { seoTitle: 'S | LIAR', description: 'D', faq: [{ frage: 'F?', antwort: 'A.' }] }, '2026-10-26');
  assert.ok(!out.includes('\r'));
  assert.match(out, /\nseoTitle: "S \| LIAR"\n/);
  assert.match(out, /Antwort 2\.\n\n### F\?\n\nA\.\n\nRuf an:/);
});
