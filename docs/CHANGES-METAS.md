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
