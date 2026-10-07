# SEO-Audit liar-entertainer.com — Aktionsplan (07.10.2026)

Einzelberichte: [technical.md](technical.md) · [content.md](content.md) · [schema-geo-local.md](schema-geo-local.md)

## SEO Health Score: 78 / 100

| Bereich | Gewicht | Score |
|---|---|---|
| Technik | 22 % | 84 |
| Inhalt | 23 % | 66 |
| On-Page | 20 % | 71 |
| Schema | 10 % | 80 |
| Performance (PSI mobil 96–100) | 10 % | 95 |
| KI-Suche | 10 % | 84 |
| Bilder | 5 % | 75 |

Geschäftstyp: Dienstleister mit Einsatzgebiet (NRW/Ruhrgebiet), Sitz Gladbeck.

## Erledigt am 07.10.2026

- Sitemap (158 URLs) in der GSC für liar-entertainer.com neu eingereicht.
- Indexierung beantragt für `/`, `/zauberer/`, `/zauberer/close-up/`. Für `/kindergeburtstag/` ist der Antrag unsicher; ab der nächsten URL brach die GSC mit einem Fehler ab (wahrscheinlich das Tageskontingent).
- In Netlify sind `zauberer-liar.de` und `www.zauberer-liar.de` als Domain-Alias eingetragen.
- Code-Fixes (Commit `21b9e6a`):
  - Datumsangaben der Alt-Blogposts als ISO-Datum
  - Person-Schema mit einheitlicher `@id`
  - doppelter Brotkrumen entfernt
  - Footer-Link führt direkt auf `/clown/clownshow/`
  - Speakable- und Logo-Angaben im Schema korrigiert
  - Gladbeck-Foto repariert
  - Prüfnotiz nicht mehr im HTML

## KRITISCH — sofort

1. **DNS von zauberer-liar.de auf Netlify umstellen** (IONOS: A @ und A www → 75.2.60.5, AAAA löschen; MX, SPF und google-site-verification bleiben). Solange das nicht passiert ist, stehen 15 Seiten doppelt im Netz. Rollback: `docs/dns-rollback-2026-10-07.md`.
2. Danach in der GSC für zauberer-liar.de einen **Adressänderung** (Change of Address) auf liar-entertainer.com stellen und mit `node ops/check-live.mjs` sowie `curl -I https://zauberer-liar.de/` prüfen.

## HOCH — diese Woche (Textänderung, Freigabe nötig)

- **Kannibalisierung Stadtseiten:** Pro Stadt gibt es bis zu 4 Seiten mit fast gleichem Title und H1. Vorschlag:
  - kinderzauberer-in- / geburtstag-in- = Kinder
  - zauberer-in- = Erwachsene (Hochzeit, Firma, Gala), dort „Kindergeburtstag“ aus Title und Meta nehmen
  - Querlinks zwischen den Familien setzen
- **Startseite, /kindergeburtstag/ und /kinderzauberer/** zielen auf dasselbe Suchziel → Metas klar trennen.
- **/zauberer/close-up/ und /zauberer/tisch-zauberer/** haben denselben Intent → zusammenlegen (301) nach Blick in die GSC-Leistung.
- **Öffnungszeiten** widersprechen sich: Schema „Mo–So 9–20“, /kontakt/ „Mo–Sa 8–20“ → mit dem Google-Unternehmensprofil abgleichen.
- **Zahlen vereinheitlichen:** 15 vs. 17 Jahre, „400 Shows“ vs. „über 400 Auftritte“, „Alter: 49“.

## MITTEL — diesen Monat

- Sammelregel `/:slug → /blog/` (301) erzeugt Soft-404 → besser 404/410, `/datenschutz/` gezielt umleiten.
- /blog/ lädt Original-JPGs (3,7 MB) → Vorschaubilder verwenden; Inhaltsbilder in Artikeln mit width/height.
- Inline-CSS 75–83 KB pro Seite → `inlineStylesheets: 'auto'` testen (Lighthouse-Gate beachten).
- Dünne Stadtseiten (Bottrop, Dinslaken, Datteln, Herne < 300 eigene Wörter) ausbauen (Text, Freigabe).
- Alt-Blog-Metas abgeschnitten oder fehlerhaft (~16) → überarbeiten (Text, Freigabe).
- 9 dünne, indexierbare Kategorie-Seiten → einheitlich noindex.
- Toter Link auf `www.pantomime.liar-entertainer.com` im Appeltatenfest-Post.

## NIEDRIG

- HSTS mit includeSubDomains, CSP, IndexNow-Key.
- Box „Passende Leistung“ unter Blogposts.
- Brotkrumen-Wurzel „Clown“ auf Erwachsenen-Seiten.

## Morgen (Kontingent)

Indexierung beantragen für `/kindergeburtstag/`, `/zauberer/zauberer-in-essen/`, `-gelsenkirchen/`, `-duisburg/`, `-oberhausen/`, `-bottrop/`, `-gladbeck/`, `-recklinghausen/`. Erst nach dem DNS-Umzug von zauberer-liar.de.
