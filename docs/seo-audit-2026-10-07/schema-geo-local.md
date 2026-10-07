# SEO-Audit: Schema, GEO/KI-Suche, Local SEO — liar-entertainer.com (LIVE)

Stand: 07.10.2026 (Tag des Relaunchs auf Netlify) · nur gelesen, nichts geändert.
Basis: Live-Abruf per `fetch`/`curl` von 15 Seiten, 83 Stadtseiten (Ähnlichkeitsanalyse), robots.txt, llms.txt, llms-full.txt, sitemap.xml (158 URLs), zauberer-liar.de.

Geprüfte Seiten (JSON-LD extrahiert): `/`, `/kindergeburtstag/`, `/clown/` (→ 301 `/clown/clownshow/`), `/clown/clownshow/`, `/zauberer/`, `/zauberer/hochzeit/`, `/preise/`, `/kontakt/`, `/ueber-mich/`, Stadtseiten `/kinderzauberer/kinderzauberer-in-gladbeck/`, `/clown/clownshow/clown-in-moers/`, `/kindergeburtstag/geburtstag-in-essen/`, `/zauberer/zauberer-in-essen/`, Blog `/blog/was-kostet-ein-clown-fuer-ein-kindergeburtstag/`, `/blog/kidzival-2024/` (+ Gegenprobe `/blog/clown-oder-zauberer-kindergeburtstag/`).

Hinweis: AggregateRating/Review-Schema ist bewusst ausgeschlossen (Nutzerentscheidung) und wird hier nicht empfohlen.

## Scores

| Bereich | Score | Kurzbegründung |
|---|---|---|
| **Schema** | **80 / 100** | Sauberes, seitenweit identisches LocalBusiness mit stabiler `@id`, WebSite/WebPage-Graph, Breadcrumbs, Service + Offers, FAQ, Person. Abzüge: ungültige Datumsformate in Alt-Blogposts, Person doppelt ohne `@id`, toter Speakable-Selektor, Logo = OG-Foto, Öffnungszeiten widersprechen der Seite. |
| **KI-Readiness (GEO)** | **84 / 100** | Alle KI-Crawler erlaubt, llms.txt + llms-full.txt vorhanden und faktenreich (Preise, Gebiet, NAP). Kernseiten haben zitierfähige Antwort-Absätze. Abzüge: veraltete/widersprüchliche Erfahrungsangaben, llms.txt ohne /preise/ und Erwachsenen-Seiten, interner Prüfkommentar im Live-HTML. |
| **Local** | **66 / 100** | NAP auf allen geprüften Seiten, im Footer und im Schema identisch. Abzüge: zauberer-liar.de liefert weiterhin 200 (Duplikate zu den jetzt indexierbaren Stadtseiten), Öffnungszeiten inkonsistent, 4 Stadtseiten pro Stadt (Kannibalisierung), einige Stadtseiten stark templatisiert. |

## NAP-Abgleich (Ergebnis)

| Merkmal | Schema | Footer | Kontakt-Seite | llms.txt | Status |
|---|---|---|---|---|---|
| Name | „Clown Zauberer LIAR“ | „Clown Zauberer LIAR“ | ✓ | „Clown Zauberer LIAR“ | ✓ konsistent |
| Telefon | `+491721517578` | `0172-1517578` / `tel:+491721517578` | `+49 172 1517578` | `+49 172 1517578` | ✓ gleiche Nummer, nur Schreibweise variiert (ok) |
| Adresse | Beethovenstr. 15, 45966 Gladbeck, NW, DE | identisch | identisch | identisch | ✓ |
| Öffnungszeiten | Mo–So 09:00–20:00 | – | **Mo–Sa 8:00–20:00 Uhr** | – | ✗ Widerspruch (siehe H2) |
| Geo | 51.5658 / 6.9857 | – | – | – | ✓ plausibel Gladbeck |

Das LocalBusiness-Objekt ist auf allen 15 geprüften Seiten byte-identisch (gleicher Hash) — sehr gut.

---

## Befunde nach Priorität

### KRITISCH

**K1 — zauberer-liar.de ist weiter live (200) → Duplicate Content zu den jetzt indexierbaren Stadtseiten**
- Ist: `https://zauberer-liar.de/` und alle 25 URLs aus deren Sitemap (z. B. `https://zauberer-liar.de/zauberer-essen.html`) antworten mit **200**, eigenem Canonical und eigener Sitemap. Die Domain zeigt noch auf IONOS (217.160.0.180, `Server: Apache`), nicht auf Netlify. Gleichzeitig ist `ZAUBERER_CITIES_LIVE = true`: `/zauberer/zauberer-in-essen/` usw. (14 Seiten) + `/zauberer/close-up/` sind indexierbar und in der Sitemap.
- Folge: Inhalt 1:1 auf zwei Domains indexierbar; Google wählt evtl. die alte Domain als Original; Signale werden geteilt.
- Fix (eine Variante wählen, sofort):
  1. IONOS-DNS von zauberer-liar.de auf Netlify umstellen (A `@` + `www` → 75.2.60.5, AAAA löschen, MX unverändert) — die Seite-für-Seite-301s liegen bereits in `site/public/_redirects`; danach `node ops/check-live.mjs`-Gegenprobe für die 25 Alt-URLs.
  2. Falls die Domain auf IONOS bleibt: `ops/zauberer-liar.htaccess` dort hochladen.
  3. Übergangsweise (bis 1./2. erledigt): `ZAUBERER_CITIES_LIVE = false` (noindex) zurückstellen.
- Danach: in der GSC für zauberer-liar.de „Adressänderung“ einreichen.

### HOCH

**H1 — Ungültige Datumsformate in BlogPosting (Alt-Posts)**
- URLs: alle Alt-WP-Posts über den Catch-all, z. B. `/blog/was-kostet-ein-clown-fuer-ein-kindergeburtstag/` (`"datePublished":"2025-12-15 10:50:55"`), `/blog/kidzival-2024/` (`"2024-03-22 14:34:27"`).
- Kein ISO-8601 (Leerzeichen statt `T`, keine Zeitzone) → Rich-Results-Test meldet „Ungültiger Datums-/Uhrzeitwert“. Markdown-Posts (`/blog/clown-oder-zauberer-kindergeburtstag/`) sind korrekt (`2026-07-17T00:00:00.000Z`).
- Fix: in `site/src/pages/[...slug].astro` (Zeile ~1096) `datePublished`/`dateModified` normalisieren, z. B. `page.date.replace(' ', 'T') + '+01:00'` bzw. über `new Date(...).toISOString()`. Test in `tests/dist/blog.test.ts` ergänzen (Regex ISO-8601 für alle BlogPosting).

**H2 — Öffnungszeiten widersprechen sich**
- `/kontakt/` sichtbar: „Mo–Sa 8:00 – 20:00 Uhr“. Schema (alle Seiten, `Document.astro`): Mo–**So** **09:00**–20:00.
- Fix: eine Wahrheit festlegen (idealerweise identisch mit dem Google-Unternehmensprofil) und Schema in `site/src/layouts/Document.astro` daran angleichen. Wenn der sichtbare Text angepasst werden soll: **Textänderung – Freigabe nötig**.

**H3 — Person-Entität doppelt / nicht verknüpft**
- `/ueber-mich/`: eigenes `Person`-Objekt **ohne `@id`**, `alternateName: "LIAR"`, weniger `sameAs` (2 statt 4, Instagram ohne Slash). Global (`founder` im LocalBusiness) gibt es `@id: …/#person` mit `alternateName: "Clown Zauberer LIAR"`.
- Folge: Google/KI sehen zwei Personen-Entitäten statt einer; Autorenschaft der Blogposts (verweist auf `#person`) wird nicht mit der Über-mich-Seite zusammengeführt.
- Fix: in `site/src/pages/ueber-mich/index.astro` `"@id": "https://liar-entertainer.com/#person"` setzen, `sameAs`/`alternateName` mit dem globalen Objekt angleichen (beide Namen als Array: `["LIAR","Clown Zauberer LIAR"]`), `image` ergänzen ist bereits da. WebPage dort zusätzlich `"mainEntity": {"@id": "…/#person"}` (bzw. `ProfilePage`).

### MITTEL

**M1 — Speakable-Selektor `.hero-subtitle` existiert nicht mehr**
- Alle Seiten: `speakable.cssSelector: ["h1", ".hero-subtitle"]`, aber im v2-Markup gibt es kein Element mit Klasse `hero-subtitle` (0 Treffer auf 14 Seiten).
- Fix: in `Document.astro` (Zeile ~199) auf eine real vorhandene Lead-Klasse der v2-Heros umstellen oder `.hero-subtitle` als Zusatzklasse an den Hero-Lead (K3Hero / Adult-Hero / neutrale Heros) hängen.

**M2 — `logo` im LocalBusiness ist das OG-Foto**
- `"logo": "https://liar-entertainer.com/images/og-startseite.jpg"` (Foto, kein Logo). Fix: auf die echte Logodatei zeigen (z. B. `logo-clown-nrw.png`, mind. 112×112, quadratisch oder als `ImageObject` mit width/height). L6 bleibt unberührt (nur Verweis, kein neues Logo).

**M3 — Erfahrungsangaben veraltet/widersprüchlich (KI-Zitierfähigkeit)**
- „seit 2009“ = 17 Jahre (2026), überall steht aber „15 Jahre“ / „über 15 Jahre“ (`/`, `/ueber-mich/`, llms.txt „Über 15 Jahre“, llms-full.txt). Startseite zusätzlich „30 Jahre als Entertainer“ vs. `/ueber-mich/` Zeitleiste ab 2000 (= 26 J.). KI-Systeme bevorzugen widerspruchsfreie Fakten.
- Fix: einheitlich „seit 2009“ (zeitlos) verwenden. **Textänderung – Freigabe nötig** (L1). llms.txt/llms-full.txt gleich mitziehen.

**M4 — Interner Prüfkommentar im Live-HTML**
- `/ueber-mich/` enthält im Quelltext den HTML-Kommentar „… BITTE VON MICHAEL GEGENPRUEFEN …“ (Quelle: `site/src/pages/ueber-mich/index.astro:134`). Für Nutzer unsichtbar, aber für Crawler/KI lesbar.
- Fix: Kommentar als Astro-Kommentar (`{/* … */}`) schreiben, dann wird er nicht ausgeliefert. Inhaltliche Prüfung der Zeitleiste durch Michael bleibt offen.

**M5 — 4 Stadtseiten pro Stadt (Kannibalisierung)**
- Beispiel Essen: `/kinderzauberer/kinderzauberer-in-essen/`, `/clown/clownshow/clown-in-essen/`, `/kindergeburtstag/geburtstag-in-essen/`, `/zauberer/zauberer-in-essen/`. 83 Stadtseiten insgesamt (14 + 23 + 23 + 23). Titles zielen teils auf dieselbe Suchanfrage („Zauberer Kindergeburtstag Essen“ vs. „Kindergeburtstag Essen | Zaubershow“ vs. „Zauberer Essen – Zaubershow & Kinderzauberer“).
- Fix (kein Umbau jetzt, L1/L2): in der GSC je Stadt beobachten, welche URL rankt; die Familien klar trennen (Kinder-Seiten → „Kindergeburtstag/Kinderzauberer“, `/zauberer/zauberer-in-*` → nur Erwachsene/Events). Querlinks zwischen den 4 Seiten einer Stadt mit eindeutigem Ankertext. Title-Schärfung = **Textänderung – Freigabe nötig**.

**M6 — Einige Stadtseiten stark templatisiert**
- 5-Wort-Shingle-Ähnlichkeit (ohne Header/Footer/Nav): Median 0,17–0,26 je Familie (gut), aber Spitzen 0,50–0,55: Clown Wesel↔Moers (0,55), Wesel↔Castrop-Rauxel (0,54), Wesel↔Xanten, Castrop-Rauxel↔Moers/Waltrop; Kinderzauberer Datteln↔Dinslaken (0,53), Datteln↔Bochum (0,51).
- Betroffen v. a. `/clown/clownshow/clown-in-{wesel,moers,castrop-rauxel,xanten,waltrop}/`, `/kinderzauberer/kinderzauberer-in-datteln/`.
- Fix: je Seite 150–300 Wörter echter Lokalbezug (Stadtteile, typische Locations, Anfahrt/Fahrtkosten konkret, Blog-Einsatz in der Stadt verlinken). **Textänderung – Freigabe nötig**. Keine erfundenen Fakten (L3).

**M7 — Breadcrumb `/clown/clownshow/` mit doppelter URL**
- Position 2 „Clown“ und Position 3 „Clownshow“ zeigen beide auf `https://liar-entertainer.com/clown/clownshow/` (`/clown/` ist 301). Fix: Position 2 entfernen (Startseite → Clownshow) oder auf eine echte Hub-URL setzen.

### NIEDRIG

**N1 — Spezifischerer Typ:** `"@type": ["LocalBusiness","EntertainmentBusiness"]` (so war es auf zauberer-liar.de) — kein Risiko, präziser für Google/KI.

**N2 — VideoObject:** `publisher` als eigenes `Organization`-Objekt statt `{"@id": "…/#business"}`; `uploadDate: "2018-02-04"` ohne Zeitzone (Google empfiehlt `2018-02-04T00:00:00+01:00`). Das gleiche Video ist auf 5 Seiten ausgezeichnet — ok, aber Beschreibung variiert pro Seite.

**N3 — Service-Schema ergänzen:** `/kindergeburtstag/` und `/preise/` Service ohne `url`; Offers ohne `url`/`availability`; `/preise/` deckt nur Kindergeburtstag ab — die öffentlich genannten Preise 300 € (Kita/Schule/Karneval) und 800 € (Walk-Act, 3 h) fehlen als Offer. Nur bereits sichtbare Preise auszeichnen (L3).

**N4 — Blog-Übersicht `/blog/`:** kein `Blog`/`CollectionPage` + `ItemList`. Optional.

**N5 — BlogPosting-`description`** bei Alt-Posts ist abgeschnittener Fließtext („…Preisübersicht 2025 Sie planen einen Kindergeburtstag und fragen sich: "Was kostet ein Clown?“). Fix: Meta-Description der Seite verwenden statt `rawDesc`.

**N6 — WebSite `url`** ohne Schrägstrich (`https://liar-entertainer.com`) vs. Canonical `https://liar-entertainer.com/`. Kosmetisch angleichen.

**N7 — robots.txt-Kommentar veraltet:** verweist auf `public/.htaccess` (Netlify nutzt `_redirects`). Nur Kommentar, keine Wirkung.

---

## GEO / KI-Suche im Detail

**robots.txt** — ✓ `User-agent: *` Allow; explizit erlaubt: GPTBot, ChatGPT-User, OAI-SearchBot, ClaudeBot, PerplexityBot, Applebot-Extended, Bingbot. Google-Extended, CCBot, Meta etc. fallen unter `*` (erlaubt). Kein X-Robots-Tag-Header. Sitemap-Verweis korrekt.

**llms.txt** — ✓ vorhanden (200), gut strukturiert: Wer, Standort, Telefon, E-Mail, Leistungen, Einsatzgebiet (Kern/erweitert/NRW/international), Preistabellen, Warum-LIAR, Seitenliste; Verweis auf `llms-full.txt` (200, ~7 KB, Volltext-Fakten + FAQ).
- Lücken: Seitenliste ohne `/preise/`, ohne Erwachsenen-Seiten (`/zauberer/hochzeit/`, `/zauberer/firmenfeier/`, `/zauberer/buehnen-zauberer/`, `/zauberer/tisch-zauberer/`, `/zauberer/close-up/`), ohne `/blog/` und ohne Hinweis auf Stadtseiten. → ergänzen (reine Linkliste, keine Textänderung an Seiten).
- „Über 15 Jahre“ → siehe M3.

**Zitierfähigkeit der Kernseiten**
- `/kindergeburtstag/`: ✓ vorbildlicher Antwort-Absatz direkt unter dem Hero (Preis, Dauer, Gruppengröße, Name, Gebiet in 2 Sätzen).
- `/preise/`: ✓ klare Preis-H2s + FAQ; Erwachsenen-Preise „auf Anfrage“ (ok).
- `/`: Hero-Zeile mit Fakten (40 Min., ab 4 J., 2×2 m), FAQ mit Preisantwort ✓. Ein 1-Satz-„Wer/Wo/Ab-Preis“-Absatz wie auf `/kindergeburtstag/` fehlt im oberen Bereich. **Textänderung – Freigabe nötig**.
- `/zauberer/`: H2 „Der Zauberer in NRW mit TOP Bewertungen“ — Marketing statt Fakt; kein Satz mit Ort (Gladbeck) + Formaten + „Preis auf Anfrage“ oben. **Textänderung – Freigabe nötig**.
- `/kontakt/`: ✓ Telefon, E-Mail, Antwortzeit, Gebiet; nur Öffnungszeiten-Widerspruch (H2).
- FAQPage-Markup auf fast allen Kernseiten — passt zu den sichtbaren FAQs (Google zeigt FAQ-Rich-Results nur noch eingeschränkt, für KI-Extraktion aber nützlich).

## Local im Detail

- **Service-Area-Signale:** ✓ `areaServed` mit GeoCircle 20 km + 13 Städte + NRW; jede Stadtseite hat `Service.areaServed: City`; llms.txt nennt Kern-/Erweitertes Gebiet; Kontakt nennt Umkreis 20 km. Konsistent.
- **Adresse sichtbar** (Footer aller Seiten, Kontakt) und GBP-Maps-Link im `sameAs` + Footer („Bewertung auf Google schreiben“) ✓.
- **Stadtseiten:** 900–1.700 Wörter, eigene H1/Title/Breadcrumb/Service/FAQ je Stadt ✓; keine eingebettete Karte (bewusst, Performance — ok). Ähnlichkeit siehe M6, Kannibalisierung M5.
- **Titles mit „TOP Bewertungen“** auf Clown-Stadtseiten (z. B. „Clown Moers | TOP Bewertungen | Jetzt buchen“) — wenig Informationswert; besser Leistung + Preis. **Textänderung – Freigabe nötig** (Meta-Parität beachten → `meta-changes.json`).

## Empfohlene Reihenfolge

1. K1 zauberer-liar.de umleiten (oder Stadtseiten vorübergehend noindex) — heute.
2. H1 Datumsformat, H3 Person-`@id`, M1 Speakable, M2 Logo, M4 Kommentar, M7 Breadcrumb — reine Code-Fixes, keine Freigabe nötig, mit Tests.
3. H2 Öffnungszeiten mit GBP abgleichen (Entscheidung Michael).
4. Textänderungen (M3, M5, M6, Zitierabsätze) gesammelt zur Freigabe vorlegen.
