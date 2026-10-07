# Content- & On-Page-SEO-Audit – liar-entertainer.com (Live, 07.10.2026)

Basis: alle 158 URLs aus `https://liar-entertainer.com/sitemap.xml` live gecrawlt (Status, Title, Description, H1/H2, `<main>`-Text, interne Links, JSON-LD). Ähnlichkeit = Jaccard über 5-Wort-Shingles des `<main>`-Texts; „Unique-Wörter“ = Text ohne Sätze, die (Stadtname neutralisiert) auf ≥ 3 Seiten vorkommen. Lesbarkeit = Flesch-Amstad (deutsch, Silben geschätzt).

Rahmen: Der Relaunch hat Inhalte bewusst 1:1 übernommen (L1). Alles, was Text/Titles/Metas ändert, ist unten mit **„Textänderung – Freigabe nötig“** markiert.

## Scores

| Bereich | Score | Kurzbegründung |
|---|---|---|
| **Content** | **66 / 100** | Starke Erfahrungssignale (echte Auftritte, Bewertungen, Stadtteil-Details auf Zauberer-Stadtseiten), aber 4 Stadtseiten-Familien für dieselben Städte, dünne Altblog-Posts, widersprüchliche Zahlen |
| **On-Page** | **71 / 100** | Alle Seiten 200, je 1 H1, Canonicals self, Titles/Metas überall vorhanden, Schema reich. Abzüge: Kannibalisierung in Titles/H1, sitewide Link auf 301, Blog-Metas abgeschnitten/Tippfehler, schwache kontextuelle Verlinkung |

### E-E-A-T (Gesamt ~72/100)

| Faktor | Gewicht | Score | Befund |
|---|---|---|---|
| Experience | 20 % | 82 | Event-Berichte mit Ort/Datum (Kidzival, IKEA Duisburg, Resse-Markt …), Stadtteil-/Location-Wissen auf `/zauberer/zauberer-in-*`, echte Google-Rezensionen mit Namen/Monat |
| Expertise | 25 % | 70 | Über-mich: Ausbildung, Studium, seit 2009; Person-Schema mit Credential. Aber Ratgeber-Posts ohne sichtbare Autorbox; Zahlen widersprüchlich (s. M2) |
| Authoritativeness | 25 % | 62 | Galerie mit Presse-Referenzen; kaum externe Belege (Presse-Links, Veranstalter-Logos, Verbände) im Fließtext |
| Trustworthiness | 30 % | 74 | Telefon, Adresse Gladbeck, Impressum, AGB, Datenschutz, 370+ Bewertungen; Abzug: „über 400 Auftritte“ vs. „400 Shows im Jahr“, Freshness-Signal `dateModified` = Build-Datum |

**AI-Citation-Readiness: 64/100** – Gut: FAQPage-Schema auf Kernseiten, konkrete Fakten (150 €, +20 € Ballons, +40 € Tattoos, 40 Min., 2×2 m, 4–12 Jahre), Speakable. Schwach: Altblog-Posts ohne klare Hierarchie, Emoji-H1/H2, abgeschnittene Metas, keine kurzen Definitions-/Antwortabsätze unter Fragen-H2 auf Stadtseiten.

### Lesbarkeit (Flesch-Amstad, Ziel ≥ 50 für Eltern-Zielgruppe)
Kernseiten 46–51 (ok). Ausreißer: `/zauberer/` **37** (Ø 18,8 Wörter/Satz), `/ueber-mich/` 40, `/blog/haltern-clown-in-freiheit/` 35, `/clown/clownshow/clown-in-herne/` 48 bei Ø 18,6 Wörter/Satz. Keyword-Dichte unauffällig (zauber* 2–6 %, kein Stuffing).

---

## Critical

### C1 – Vier Stadtseiten-Familien kannibalisieren „Zauberer/Clown Kindergeburtstag <Stadt>“
Pro Stadt existieren bis zu 4 indexierte Seiten (14 Städte haben alle 4, 9 Städte 3):

| Familie | Title-Muster | H1-Muster |
|---|---|---|
| `/kinderzauberer/kinderzauberer-in-<stadt>/` (23) | **Zauberer Kindergeburtstag** Bochum \| Kinderzauberer LIAR | **Zauberer für den Kindergeburtstag in** Bochum |
| `/kindergeburtstag/geburtstag-in-<stadt>/` (23) | **Kindergeburtstag** Bochum \| Zaubershow ab 150€ | teils wörtlich **„Zauberer für den Kindergeburtstag in** Düsseldorf – ab 150 €“ (Düsseldorf, Xanten, Castrop-Rauxel, Mülheim, Haltern am See) |
| `/clown/clownshow/clown-in-<stadt>/` (24) | Clown Bochum \| TOP Bewertungen \| Jetzt buchen | Clown in Bochum |
| `/zauberer/zauberer-in-<stadt>/` (14, neu von zauberer-liar.de) | Zauberer Essen – Zaubershow & **Kinderzauberer** \| LIAR | Zauberer Essen – Magie für Ihr Event; Description: „… & **Kinderzauberer** LIAR … für Firmenfeier, Hochzeit & **Kindergeburtstag**“ |

Folge: Für „zauberer kindergeburtstag bochum“ konkurrieren `kinderzauberer-in-bochum` und `geburtstag-in-bochum` mit faktisch gleichem Title/H1-Intent; für „zauberer essen“ zusätzlich `zauberer-in-essen` (dessen Meta ausdrücklich Kinderzauberer/Kindergeburtstag bewirbt) und `kinderzauberer-in-essen`. Die Texte selbst sind verschieden (Jaccard zwischen Familien derselben Stadt nur 0,08–0,28, zwischen `zauberer-in-*` und Kinder-Familien 0,00) – das Problem ist **Intent-Überschneidung in Title/H1/Meta**, nicht Duplicate Content.

Fix (Reihenfolge nach Aufwand):
1. **Intent je Familie schärfen** (Textänderung – Freigabe nötig):
   - `kinderzauberer-in-*` → „Kinderzauberer <Stadt>“ (Kita, Schule, Feste, Kindergeburtstag) – Wort „Zauberer Kindergeburtstag“ aus dem Title-Anfang nehmen.
   - `geburtstag-in-*` → „Kindergeburtstag <Stadt> feiern – Clown & Zaubershow ab 150 €“ (Paket/Preis/Ablauf) – die 5 H1 „Zauberer für den Kindergeburtstag in …“ umformulieren.
   - `clown-in-*` → „Clown <Stadt> buchen“ (bleibt).
   - `zauberer-in-*` → Erwachsenen-Intent: „Zauberer <Stadt> – Firmenfeier, Hochzeit & Gala | LIAR“, „Kinderzauberer“/„Kindergeburtstag“ aus Title + Description entfernen; für Kinder auf die vorhandenen Querlinks (`->kinderzauberer-in-<stadt>`, existieren auf allen 14) verweisen.
2. **Gegenverlinkung ergänzen** (kein Text-Rewrite, nur Linkmodul): `kinderzauberer-in-<stadt>` verlinkt **nicht** zurück auf `/zauberer/zauberer-in-<stadt>/` (0 von 14), und `zauberer-in-*` verlinkt nicht auf `clown-in-*`/`geburtstag-in-*`. Ein einheitlicher Block „Weitere Angebote in <Stadt>“ (Kinderzauberer · Kindergeburtstag · Clown · Zauberer für Erwachsene) auf allen 4 Templates klärt die Rollen für Google.
3. **Mittelfristig** (Freigabe nötig, strategisch): `kinderzauberer-in-*` und `geburtstag-in-*` pro Stadt zusammenlegen (301 der schwächeren auf die stärkere, Entscheidung per GSC-Klicks je URL). Spart 23 Seiten mit überlappendem Intent.

### C2 – Kern-Hubs für „Zauberer Kindergeburtstag NRW“ dreifach besetzt
- `/` Title „**Zauberer für Kindergeburtstag** & Zaubershow NRW | Clown LIAR“, Meta beginnt „Zauberer für Kindergeburtstag in NRW“
- `/kindergeburtstag/` Title „**Zauberer Kindergeburtstag NRW** | Ab 150€ | Clown LIAR“, Meta beginnt identisch „Zauberer für Kindergeburtstag in NRW buchen“
- `/kinderzauberer/` Title „Kinderzauberer NRW | Kinderzaubershow buchen“, H2 „Zauberer für den Kindergeburtstag – Ablauf, Kosten & Planung“
- `/zauberer/zaubershow/` „Zaubershow für Kinder NRW“, Meta „für Kindergeburtstag, Kita & Schule“

Fix (Textänderung – Freigabe nötig): Startseite als Marken-/Übersichtsseite („Clown & Zauberer LIAR in NRW – Kinder & Erwachsene“), `/kindergeburtstag/` als einzige Zielseite für „Zauberer/Clown Kindergeburtstag NRW“, `/kinderzauberer/` für „Kinderzauberer NRW“ (Kita/Schule/Feste), `/zauberer/zaubershow/` für „Zaubershow für Kinder“ (Showformat). Die Meta-Descriptions von `/` und `/kindergeburtstag/` dürfen nicht mit demselben Satz beginnen.

## High

### H1 – `/zauberer/close-up/` vs. `/zauberer/tisch-zauberer/` (gleicher Intent)
- Close-up: Title „Close-up Zauberer NRW: Französische Zauberkunst hautnah“, nur **342 Wörter** (dünnste Leistungsseite), beschreibt sich selbst als „Close-up Zauberer und Spezialist für **Tischzauberei**“.
- Tisch-Zauberer: Title „Tischzauberer NRW | **Close-up Magie** | LIAR“, H2 „Tischzauberer & **Close-up Zauberei** in NRW“, 1.069 Wörter.
- Close-up hat 0 Bewertungs-/FAQ-Blöcke (keine FAQPage), die Tisch-Seite schon.

Fix: Eine Seite als Ziel für „Close-up / Tischzauberer“ wählen. Empfehlung: `/zauberer/close-up/` per 301 auf `/zauberer/tisch-zauberer/` (stärker, länger, bisher im Menü) und den zauberer-liar.de-Redirect für Close-up direkt auf die Tisch-Seite zeigen lassen (ein Hop). Alternative ohne Zusammenlegung: Close-up auf „Walk-Act/Mingling“ umpositionieren, Tisch-Seite auf „Tischzauberei beim Dinner“ (Textänderung – Freigabe nötig). Hinweis: auch `/clown/walk-act/` bewirbt „Walk Act … Firmenfeiern“ – Abgrenzung mitdenken.

### H2 – `/zauberer/` vs. `/zauberer/buehnen-zauberer/` vs. `/zauberer/firmenfeier/`
- `/zauberer/` Title „Zauberer NRW buchen – Zaubershow für **Kinder & Erwachsene**“, Meta nennt **Kindergeburtstag**, Hochzeit, Firmenevent, Tisch- & Bühnenzauberei → Hub, der auch den Kinder-Intent zieht (Kollision mit C2).
- `/zauberer/buehnen-zauberer/` H1 „Bühnenzauberer NRW für **Firmenfeiern & Galas**“ vs. `/zauberer/firmenfeier/` H1 „Zauberer für **Firmenfeier** & Weihnachtsfeier in NRW“ – gleicher B2B-Intent.
- Textähnlichkeit gering (0,11–0,13), alle drei teilen aber denselben H2-Block „Für welche Anlässe kann man Zauberer LIAR sonst buchen?“ + „In welchen Städten …“.

Fix (Textänderung – Freigabe nötig): `/zauberer/` = Erwachsenen-Hub „Zauberer NRW für Events, Firmenfeier & Hochzeit“ (Kinder-Wörter raus aus Title/Meta, H1 ist bereits richtig). `buehnen-zauberer` auf Format „Bühnenshow / Gala-Act / Programmpunkt“ fokussieren (H1 ohne „Firmenfeiern“), `firmenfeier` bleibt Anlass-Seite.

### H3 – Blog-Posts konkurrieren mit Service-Seiten / untereinander
| Thema | Konkurrierende URLs | Empfehlung |
|---|---|---|
| Preise | `/preise/`, `/blog/was-kostet-zauberer-kindergeburtstag/` (2.347 W.), `/blog/was-kostet-ein-clown-fuer-ein-kindergeburtstag/` | Blogposts als Ratgeber behalten, aber prominent auf `/preise/` verlinken (der Clown-Kosten-Post verlinkt kontextuell nur auf `clown-in-gladbeck`, nicht auf `/preise/`); `/preise/` verlinkt zurück. Clown-Kosten-Post ist laut Meta „Preisübersicht 2025“ → veraltet (Textänderung – Freigabe nötig) |
| IKEA Duisburg Midsommar | `/blog/ikea-duisburg-midsommar-mit-clown-zauberer/` (621 W., H1-Tippfehler „**Dusiburg**“) und `/blog/zaubershow-in-duisburg-midsommarfest/` (Title „Zaubershow Duisburg: IKEA Midsommar …“), Ähnlichkeit 0,23 | Zusammenführen: kürzeren Post per 301 auf den längeren (Freigabe nötig) |
| Kita-Sommerfest | `/blog/sommerfest-kita-programm-clown-zauberer/`, `/blog/fruehlings-und-sommerfeste-im-kindergarten-…/` (Title „Sommerfest im Kindergarten: Ideen …“), `/blog/zaubershow-im-kindergarten-…/` + Service `/zauberer/zaubershow/kindergarten-kita/` | Titles der beiden Sommerfest-Posts differenzieren (Frühling vs. Sommer) oder zusammenlegen; alle drei kontextuell auf die Kita-Leistungsseite verlinken |
| Karneval | `/clown/karneval/` + `/blog/warum-ein-clown-zauberer-…-karnevalfeier-ist/` + `/blog/5-gruende-warum-zauberei-zum-karneval-gehoert/` + `/blog/kinderkarneval-mit-clown-zauberer/` | Beide Ratgeber-Posts haben **0** kontextuelle Links zur Leistungsseite → Link auf `/clown/karneval/` ergänzen |
| Clown vs. Zauberer | `/blog/clown-oder-zauberer-kindergeburtstag/` | ok (Vergleichs-Intent), Links auf `/clown/clownshow/` + `/kinderzauberer/` sicherstellen |

### H4 – Sitewide interner Link auf Redirect
`/clown/clown-zauberer/` wird von **allen 158 Seiten** verlinkt (Navigation/Footer) und antwortet mit **301 → `/clown/clownshow/`**. Fix: Link im Layout direkt auf `/clown/clownshow/` setzen (kein Text betroffen). Prüfen, ob weitere Alt-Pfade im Menü stecken.

### H5 – Blog-Posts ohne kontextuelle Links zu Leistungsseiten
13 von 40 Posts verlinken im Fließtext auf **keine** Leistungsseite (nur Menü/Footer), u. a. `/blog/10-tipps-fuer-den-perfekten-kindergeburtstag/`, `/blog/was-ist-ein-clown/`, `/blog/5-gruende-warum-zauberei-zum-karneval-gehoert/`, `/blog/warum-ein-clown-zauberer-…-karnevalfeier-ist/`, `/blog/fruehlings-und-sommerfeste-im-kindergarten-…/`, `/blog/zaubershow-in-duisburg-midsommarfest/`, `/blog/magische-weihnachtsfreude-…-hagener-weihnachtsmarkt/`. Weitere 12 Event-Posts verlinken ausschließlich auf eine `clown-in-<stadt>`-Seite.
Fix ohne Text-Rewrite: template-seitiger „Passende Leistung“-Kasten am Artikelende, gesteuert über Kategorie/Frontmatter (Kindergeburtstag → `/kindergeburtstag/`, Kita → `/zauberer/zaubershow/kindergarten-kita/`, Karneval → `/clown/karneval/`, Event-Bericht → Stadtseite + `/zauberer/zaubershow/strassen-sommer-fest/`).

## Medium

### M1 – Stadtseiten: Unique-Anteil teils knapp (Thin-Risiko)
Ø Unique-Anteil je Familie nur 53–55 % (großer gemeinsamer Bewertungs-/FAQ-/Städte-Block). Unter ~300 Unique-Wörtern (Ziel Location-Page 500–600 Wörter **eigener** Text):
- `/kinderzauberer/kinderzauberer-in-bottrop/` 246 · `…-dinslaken/` 266 · `…-datteln/` 297 · `…-bochum/` 351
- `/kindergeburtstag/geburtstag-in-herne/` 300
- `/clown/clownshow/clown-in-wesel/` 317 · `…-xanten/` 341 · `…-castrop-rauxel/` 343
- `/kinderzauberer/kinderzauberer-in-datteln/` ↔ `…-bochum/` Ähnlichkeit **0,58**, `clown-in-wesel` ↔ `clown-in-moers` **0,55** (Template-nah)
Positiv: `/zauberer/zauberer-in-*` (14) haben echte Lokalinhalte (Stadtteile, Locations wie Zeche Zollverein/Messe Essen, Fahrzeit) – Ø Ähnlichkeit untereinander nur 0,22, max. 0,28.
Fix (Textänderung – Freigabe nötig): je dünner Seite 150–250 Wörter echte Lokalerfahrung ergänzen (konkrete Auftritte/Locations/Kitas in der Stadt, Fahrzeit ab Gladbeck, Foto eines Auftritts vor Ort) – das Muster der `zauberer-in-*`-Seiten als Vorlage.

### M2 – Widersprüchliche Zahlen (Trust)
- „🪄 **400 Shows im Jahr** 😊 110.000 …“ (≈ 35 Seiten) und „Mit rund 400 Shows pro Jahr“ vs. „✓ über **400 erfolgreiche Auftritte**“ (1 Seite) und Meta `/ueber-mich/` „400+ Shows/Jahr“ – „400 Auftritte insgesamt“ widerspricht „400 pro Jahr seit 15 Jahren“.
- „15 Jahre Erfahrung“ / „15+ Jahre“ / „seit 2009“ (= 17 Jahre) / Über-mich „Alter: 49“ (veraltet, sobald das Jahr wechselt).
Fix (Textänderung – Freigabe nötig): Zahlen zentral in `site/src/data/site.ts` pflegen und überall daraus rendern; „über 400 erfolgreiche Auftritte“ → „rund 400 Auftritte pro Jahr“; „seit 2009“ statt fixer Jahreszahl; Alter weglassen oder aus Geburtsjahr berechnen.

### M3 – Meta-Descriptions der Alt-Blogposts: abgeschnitten, Tippfehler, Kodierung
- Mitten im Wort abgeschnitten (automatisch aus Fließtext): `/blog/zaubershow-sommer-2025/` („…sonder“), `/blog/zaubershow-in-dortmund/` („…aufzu“), `/blog/kultur-und-kinderfest-auf-dem-resse-markt-…/` („…auf dem Re“), `/blog/magische-unterhaltung-und-zaubershow-in-prerow-…/`, `/blog/magische-weihnachtsfreude-…/`, `/blog/was-kostet-ein-clown-…/`, `/blog/zaubershow-auf-dem-castroper-weihnachtsdorf/`, `/blog/was-ist-ein-clown/`, `/blog/100-jahre-…/`, `/blog/5-gruende-…/`, `/blog/10-tipps-…/` (beginnt mit „🎈 Einleitung:“), `/blog/zaubershow-im-kindergarten-…/` („Einleitung: …“), `/blog/fruehlings-und-sommerfeste-…/`, `/blog/warum-ein-clown-zauberer-…/`, `/blog/ein-zauberhafter-kinderkarneval-…/`, `/blog/tierparkfest-recklinghausen/`.
- Doppelt kodiert: `/blog/tierparkfest-recklinghausen/` „Tieren **&amp;amp;** Mitmachaktionen“ im Quelltext.
- Tippfehler: „vergesen“ (`/agbs/`), „LIAr“, „ZAuberer“ (`/blog/lollipop-…/`, `/blog/gescher-…/`), „CLown“ (`/blog/pantomime-auf-dem-appeltatenfest/`), „WEihnachtsshow“ (`/blog/adventsmarkt-…/`), „castroper“ klein (Title+H1), „fuer“ statt „für“ (`/blog/muttertag-…/`, `/blog/sommerfest-kita-…/`), H1 „IKEA **Dusiburg**“, Slug „kc-**asoria**“ vs. Titel „Astoria“.
- `/agbs/` Meta „Ohne AGBs geht gar nichts! … also nicht vergesen!“, `/impressum/` Meta „Das Impressum ist unvermeidlich.“ – unprofessionell (Trust).
Fix: Tippfehler/Kodierung sind Korrekturen, aber an der L1-Baseline → als dokumentierte Abweichung in `content-changes.json`/`meta-changes.json` (Textänderung – Freigabe nötig). Descriptions für die ~16 Altposts von Hand auf 120–155 Zeichen schreiben.

### M4 – Freshness-Signale
- 4 Markdown-Posts (`clown-oder-zauberer-…`, `kindergeburtstag-herbstferien-drinnen`, `luftballonmodellage-…`, `was-kostet-zauberer-…`) melden `dateModified` = **2026-10-07** (Build-/Deploy-Datum), ohne inhaltliche Änderung; 24 Sitemap-`lastmod` ebenfalls 2026-10-07. Google wertet künstliche Aktualität als unzuverlässig. Fix: `dateModified`/`lastmod` aus Frontmatter bzw. Git-Commit des Inhalts, nicht aus Build-Zeit.
- Alt-Posts haben `datePublished` im Format „2024-03-22 14:34:27“ (kein ISO-8601 mit `T` + Zeitzone). Fix: im Template zu `2024-03-22T14:34:27+01:00` normalisieren (kein Text betroffen).
- Termin-Posts mit vergangenen Daten („Zaubershow heute in Dortmund“, „Sommertermine für 2025“, „Morgen, am 19. Juni 2025“) wirken veraltet → kleiner Hinweis „Bericht vom …“ per Template (Textänderung – Freigabe nötig, falls im Fließtext).

### M5 – Kategorie-Seiten: Sitemap und Robots uneinheitlich
- 9 Kategorie-Seiten stehen **indexierbar** in der Sitemap (`/blog/kategorie/termine/`, `…/kultur-nrw/`, `…/clown-unterhaltung/`, `…/saisonal/`, `…/geburtstag/`, `…/pantomime-nrw/`, `…/allgemein/`, `…/feste/`, `…/zauberei/`) mit identischer Meta-Schablone und teils 266–306 Wörtern; 5 davon haben nur **1** eingehenden Link.
- 11 weitere Kategorien (`ratgeber`, `probleme`, `kindergeburtstag`, `ideen`, `kita`, `preise`, `leistung`, `zaubershow`, `location`, `staedte`, `gladbeck`, `gelsenkirchen`) sind verlinkt, liefern 200, sind aber `noindex,follow` und nicht in der Sitemap.
Fix: Einheitliche Regel – entweder alle Kategorien `noindex,follow` und raus aus der Sitemap (empfohlen, thin) oder nur 3–4 starke Kategorien mit eigenem Intro-Text indexieren.

### M6 – Generische/schwache H1 auf Leistungsseiten
`/clown/walk-act/` H1 „Walk Act“, `/clown/glitzer-tattoo/` „Glitzer Tattoo“, `/clown/karneval/` „Karneval“, `/zauberer/zaubershow/schule/` „Schule“, `/zauberer/zaubershow/strassen-sommer-fest/` „Straßen- & Sommerfest“, `/ueber-mich/` „Über mich“, `/agbs/` „AGB´s“, `/blog/` „Blog“. Title und H1 sollten dasselbe Thema mit Ort tragen (z. B. „Zaubershow für die Schule in NRW“). (Textänderung – Freigabe nötig)
Umgekehrt keyword-überladene Clown-H1: „Clown in Essen ⭐ | Shows & Events | Magie pur“, „Clown Recklinghausen – Ruhrfestspiele & Kultur | TOP“, „TOP Clown in Gelsenkirchen – LIAR | Shows & Zauberkunst“ – Pipes/Emoji in H1 vermeiden.

### M7 – Title-Längen / -Muster
- Zu kurz bzw. dünn: `/clown/clownshow/clown-in-castrop-rauxel/` „Clown Castrop-Rauxel | Buchen“ (29 Z.), `/blog/haltern-clown-in-freiheit/` (26), `/blog/pantomime-bei-extraschicht/` (26), `/blog/zaubershow-in-dortmund/` (28), `/zauberer/zaubershow/schule/` (32).
- Grenzwertig lang (> 60 Z., Abschneiden möglich): `/clown/glitzer-tattoo/` (62), `/zauberer/close-up/` (62), `/kinderzauberer/kinderzauberer-in-castrop-rauxel/` (62), `…-recklinghausen/` (62), `/blog/sommerfest-kc-asoria-…/` (62).
- 24 Clown-Stadtseiten nutzen „Clown <Stadt> | TOP Bewertungen | Jetzt buchen“ ohne Marke und ohne Leistung (Kindergeburtstag) – schwächere CTR als die anderen Familien.
- Descriptions > 158 Z. (Abschneide-Risiko): `/`, `/zauberer/`, `/kindergeburtstag/`, `/blog/kategorie/clown-unterhaltung/`, `/zauberer/zaubershow/strassen-sommer-fest/`, `/zauberer/zauberer-in-gladbeck/` (160).
(alles Textänderung – Freigabe nötig)

## Low

- **L1 – Schwach verlinkte Seiten** (keine echten Orphans: jede Sitemap-URL hat ≥ 1 eingehenden Link). Nur 1–2 Inlinks: `/clown/clownshow/clown-in-moers/` (nur von `/clown/clownshow/`), `…/clown-in-castrop-rauxel/`, `…/clown-in-waltrop/`, `…/clown-in-wesel/`, `/kinderzauberer/kinderzauberer-in-castrop-rauxel/`, `…-waltrop/`, `…-xanten/`, `/blog/10-tipps-fuer-den-perfekten-kindergeburtstag/`. Fix: Nachbarstädte-Modul auch für Moers/Wesel/Xanten/Waltrop/Castrop-Rauxel befüllen; 10 von 134 möglichen Querverweisen zwischen Kinder-Familien derselben Stadt fehlen.
- **L2 – Breadcrumb-Wurzel heißt „Clown“** (z. B. „Clown » Zauberer » Close-up“) auch auf Erwachsenen-Seiten. „Start“ oder „LIAR“ wäre neutraler (Template, kein Seitentext).
- **L3 – Emojis in H1/H2/Meta** (`/blog/10-tipps-…/` „🎉 … 🎂“, `/blog/5-gruende-…/` „🎭✨“, H2 auf `/zauberer/zaubershow/`, `/ueber-mich/`): für AI-Zitierfähigkeit und Snippets neutral bis negativ.
- **L4 – Rechtstexte indexierbar** (`/datenschutzerklaerung-2/`, `/agbs/`, `/impressum/`): unkritisch; `/datenschutzerklaerung-2/` mit WordPress-Altslug „-2“ – kosmetisch, URL-Vertrag beibehalten.
- **L5 – Bewertungsblock auf 132 Seiten identisch** (gleiche Rezensionen in gleicher Reihenfolge): für Nutzer gut, für Unique-Anteil schlecht. Rotation je Seite/Thema (Kita-Rezension auf Kita-Seite, Hochzeits-Rezension auf Hochzeitsseite) würde Relevanz und Unique-Anteil erhöhen – ohne neuen Text.
- **L6 – Autor sichtbar machen**: BlogPosting-Schema hat `author` = Michaël Prescler (gut). Sichtbare Autorbox mit Foto + 2 Sätzen + Link auf `/ueber-mich/` unter jedem Ratgeber-Post stärkt Expertise (neuer Text – Freigabe nötig).

---

## Priorisierte Umsetzungsliste

| # | Maßnahme | Textänderung? | Aufwand |
|---|---|---|---|
| 1 | Sitewide-Link `/clown/clown-zauberer/` → `/clown/clownshow/` (H4) | nein | 5 Min |
| 2 | Querverlinkungs-Block „Weitere Angebote in <Stadt>“ in allen 4 Stadt-Templates (C1.2, L1) | nein | 1–2 h |
| 3 | „Passende Leistung“-Kasten unter Blogposts (H5) | nein | 1 h |
| 4 | `dateModified`/`lastmod` nicht aus Build-Zeit, `datePublished` ISO (M4) | nein | 30 Min |
| 5 | Kategorie-Seiten einheitlich noindex + raus aus Sitemap (M5) | nein | 15 Min |
| 6 | Titles/H1/Metas der 4 Stadtfamilien + Kern-Hubs nach Intent trennen (C1.1, C2, H2) | **ja** | 2–3 h (Template-Muster) |
| 7 | Close-up ↔ Tischzauberer zusammenlegen (H1), IKEA-Posts zusammenlegen (H3) | **ja** (301) | 1 h |
| 8 | Zahlen zentralisieren + Widersprüche beheben (M2) | **ja** | 1 h |
| 9 | Alt-Blog-Metas + Tippfehler (M3) | **ja** | 2 h |
| 10 | Dünne Stadtseiten mit echter Lokalerfahrung anreichern (M1) | **ja** | laufend |

Hinweis: Für die Entscheidung „welche Stadtseite bleibt“ (C1.3, H1) vor dem 301 die GSC-Leistung je URL (Klicks/Impressionen der letzten 3 Monate, Abfragen mit Stadtnamen) prüfen – diese Daten lagen dem Audit nicht vor.
