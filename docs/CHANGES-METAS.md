# Dokumentierte Inhalts-/Meta-Abweichungen vom Live-Stand (L1)

Jede bewusste Abweichung steht hier UND in `site/tests/fixtures/content-changes.json` (sonst schlägt der Paritätstest an).

| Datum | Seite | Vorher | Nachher | Grund |
|---|---|---|---|---|
| 2026-10-04 | `/zauberer/` | Über 400 begeisterte 5-Sterne-Bewertungen auf Google | 370+ begeisterte Bewertungen auf Google | L3: reale Google-Zahl 370+ (Nutzer bestätigt); „alle 5 Sterne“ nicht belegbar. |
| 2026-10-05 | `/ueber-mich/` | Über 400 Familien und Veranstalter haben mich mit der Bestnote bewertet. | 370+ Familien und Veranstalter haben mich mit der Bestnote bewertet. | L3: gleiche Korrektur wie /zauberer/ (370+ Google-Bewertungen). |
| 2026-10-06 | `/kindergeburtstag/` | (Glitzer-Tattoos ohne „Das Besondere“/„Perfekt als“) | + „Das Besondere: Jedes Kind darf sich sein Tattoo aussuchen – und seine Lieblingsfarben dazu …“ + „Perfekt als: – Ergänzung zu den Kindergeburtstags-Paketen – Feiern im kleinen Rahmen – Highlight für Groß und Klein“ | Ergänzung auf Wunsch und mit Text des Nutzers (gleiche Rubriken wie Ballonmodellage). |
| 2026-10-07 | `/zauberer/close-up/` (Title, übernommen von zauberer-liar.de) | Close-up Zauberer NRW – Französische Zauberkunst hautnah \| LIAR | Close-up Zauberer NRW: Französische Zauberkunst hautnah \| LIAR | SEO M6.1: Quelle 63 Zeichen, max. 62. Nur „ – “ → „: “ (`site/tests/fixtures/zauberer-liar-pages/changes.json`). |

## Blog-Bilder (Nutzer 07.10.2026)
- **Altartikel (WordPress, 30 Stück):** Die Original-Uploads (wp-content) liefern 410, das UpdraftPlus-Backup in Downloads gehört zu zauberer-zauberkünstler-nrw.de und enthält keine Medien ab 2023. Bilder deshalb wiederhergestellt aus den lokalen Fotoordnern: wo die Originaldatei gefunden wurde exakt diese (u. a. IKEA Midsommar, Haltern/Diakonie + Zeitungsartikel, Hagen, Duisburg, Prerow, alle 2026er Titelgrafiken aus „Verarbeitet mit Überschrift für Blog“, 2023er Uploads aus „Homepage 2023“), sonst ein passendes eigenes Foto. Zuordnung + Alt-Texte: `site/src/data/legacy-blog-images.json`; die Bilder stehen an der Stelle der Originalbilder im Text.
- **og:image** aller Blogartikel = eigenes Titelbild statt Kategorie-Fallback (`site/tests/fixtures/meta-changes.json`).
- **Kidzival 2024:** die WordPress-Emoji-Bilder (😉🥳) sind wieder als Zeichen im Text (`content-changes.json`).
- **4 neueste Artikel** (Herbstferien drinnen, Clown oder Zauberer, Luftballonmodellage, Was kostet ein Zauberer): Titelbild + 2 Fotos im Text aus „Neu Homepage/Clown Zauberer“, `heroImageAlt` + `updatedDate: 2026-10-07`.
- **Footer „News Clown Zauberer“:** automatisch die 7 neuesten Artikel (vorher feste Liste).

## Go-live (07.10.2026)
- `/zauberer/hochzeit/`, `/zauberer/firmenfeier/`, `/zauberer/buehnen-zauberer/`: „Über 400 … bewertet mit 5,0 von 5 Sternen“ → „370+ …“ (L3, gleiche Korrektur wie /zauberer/ und /ueber-mich/; Nutzerentscheidung). „Über 400 Shows im Jahr“ / „über 400 erfolgreiche Auftritte“ bleiben (Auftritte, keine Bewertungen).

## 2026-10-09 – GSC-Analyse umgesetzt (Nutzerfreigabe im Grill)

Quelle: `docs/seo-audit-2026-10-09/GSC-ANALYSE.md`. Tests: `site/tests/dist/content-parity.test.ts`, `meta-parity.test.ts`, Fixtures `content-changes.json` / `meta-changes.json`.

- **Fakten** (zentral `site/src/data/fact-rules.ts`, angewendet per `scripts/apply-fact-rules.ts`; Parität wendet dieselben Regeln auf die Baseline an): „seit über 15 Jahren“ → „seit 2009“, „15 Jahre“ → „17 Jahre“, „rund 400 Shows“ → „über 400 Shows“, „Über 400 zufriedene Kunden“ → „370+ Google-Bewertungen“, Alter (49) entfernt. Datierte News-Posts (`posts.json`) bleiben historisch.
- **Titles**: Startseite „Clown Zauberer für Kindergeburtstag & Zaubershow NRW | LIAR“ · /zauberer/ „Zauberer NRW buchen – Bühnen- & Tischzauberer | LIAR“ · /kinderzauberer/ „Kinderzauberer NRW buchen – 370+ Bewertungen | LIAR“ · /zauberer/zaubershow/ „Zaubershow NRW für Kinder & Familien | LIAR“ · Schule „Zauberer für Schule & Schulfest in NRW | LIAR“ · Tischzauberer „Tischzauberer NRW für Hochzeit, Dinner & Feier | LIAR“ · Close-up „Close-up Zauberer NRW für Firmenevent, Messe & Empfang | LIAR“.
- **H1**: Schule „Zaubershow für Schulen in NRW“ · Sommerfest „Zauberer für Sommerfest & Straßenfest in NRW“ · Tischzauberer „… Tischzauberei für Hochzeit, Dinner & Feier“ · Close-up „Close-up Zauberer für Firmenevent, Messe & Empfang“.
- **Descriptions**: /zauberer/, Firmenfeier (+ Betriebsfeier), Ballonmodellage (+ Kommunion), Tischzauberer, Close-up, Über mich („Profi seit 2009“).
- **Neue Inhalte**: Antwort-zuerst-Absätze (/zauberer/, /zauberer/zaubershow/, Kita) · Über mich: Ausbildung, Sprachen (DE; FR/EN/ES auf Wunsch), Technik (Tonanlage ab ca. 50 Kindern) · Preise: „Warum nur 150 €?“ + Leistung „Tonanlage auf Anfrage“ · FAQs Tonanlage/Sprache (Kindergeburtstag, Kita) · Ballon: Kommunion/Taufe · Startseite: Link-Leiste „Beliebte Leistungen“ · alle 69 Kinder-Stadtseiten: Abschnitt „Mehr Zauberei in <Stadt>“ (Schwesterseiten, Erwachsenen-Seite bzw. Hinweis für Bochum/Dortmund/Düsseldorf/Mülheim) · Blog: Kasten „Passende Leistung“.
- **Schema**: Person `knowsLanguage` de/fr/en/es, Beschreibung mit pädagogischer Ausbildung; FAQPage um 2 Fragen ergänzt.
- **Design**: Kinder-Hero einspaltig wie Erwachsene (Titel → Foto → Rest), nur Zone kids.
