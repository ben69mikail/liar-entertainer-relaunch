# Claude Cowork – SEO-Aufgaben für liar-entertainer.com (Stand 09.10.2026)

Diese Datei ist der Arbeitsauftrag für **Claude Cowork**. Sie enthält alles, was Claude Code in der Website nicht selbst umsetzen kann: externe Konten, Profile und laufende Kontrolle. Grundlage: `docs/seo-audit-2026-10-09/GSC-ANALYSE.md` und die Umsetzung im Commit `fa6dda6`.

---

## 0. Freigaben und feste Grenzen (vom Inhaber, 09.10.2026)

- **Voll automatisch erlaubt** (Nutzerentscheidung A): Google-Unternehmensprofil bearbeiten, Beiträge veröffentlichen, Bewertungen beantworten, Fragen und Antworten pflegen, Leistungen anlegen. Bing Webmaster Tools konfigurieren. Profile in Branchenportalen ausfüllen. In der GSC Sitemaps einreichen und Indexierung beantragen.
- **Pflicht nach jeder Sitzung mit Änderungen:** eine E-Mail an **benmikail69@googlemail.com** mit allen vorgenommenen Änderungen:
  - was, wo, alter Wert → neuer Wert, Link
  - Betreff: `LIAR SEO – Änderungen <Datum>`
  - Versand über den Gmail-Connector
- **Niemals:**
  - Konten anlegen, Passwörter oder Codes eingeben, sich ein- oder ausloggen, Zugangsdaten ändern
  - etwas kaufen oder kostenpflichtige Pakete buchen (z. B. „DNS Pro“, Premium-Einträge)
  - Domains, DNS, Netlify-Build-Einstellungen oder das GitHub-Repo verändern
- **Logins macht der Inhaber einmal selbst** in dem Chrome-Profil, in dem die Claude-Erweiterung läuft (Google, Microsoft/Bing, Portale). Fehlt ein Login, die Aufgabe überspringen und in der Mail melden.
- **Keine erfundenen Fakten.** Nur die Fakten aus Abschnitt 1 verwenden. Was dort fehlt, als Frage in die Mail schreiben.
- **Website-Texte** ändert Cowork nicht. Vorschläge kommen in die Mail; umgesetzt wird über Claude Code im Projekt `C:\Users\ben_m\Claude\projects\Homepages KUNST` (Tests + Freigabe).

---

## 1. Faktenblatt (einzige Quelle für alle Texte)

| Feld | Wert |
|---|---|
| Name / Marke | Michaël Prescler – Clown Zauberer LIAR |
| Adresse | Beethovenstr. 15, 45966 Gladbeck, NRW |
| Telefon | +49 172 1517578 |
| E-Mail | info@liar-entertainer.com |
| Website | https://liar-entertainer.com (immer **ohne www**) |
| Hauptberuflich | seit 2009 (2026 = 17 Jahre; jeden Januar +1, siehe 7.3) |
| Auftritte | über 400 pro Jahr |
| Bewertungen | 5,0 ★, 370+ Google-Bewertungen (aktuelle Zahl im Profil prüfen) |
| Ausbildung | pädagogische Ausbildung |
| Sprachen | Shows auf Deutsch; auf Wunsch Französisch, Englisch, Spanisch |
| Technik | eigene Tonanlage auf Anfrage, ab ca. 50 Kindern nötig |
| Nachweise | erweitertes polizeiliches Führungszeugnis, Haftpflichtversicherung |
| Herkunft | Frankreich; seit 2004 in Gladbeck |
| Mitgliedschaften | keine – nichts dergleichen behaupten |
| Presse | WAZ-Bericht „Magic Dinner“ (Galerie) und Artikel auf der Website – nur verlinken, nichts hinzudichten |

**Preise** (identisch zu https://liar-entertainer.com/preise/ – vor Verwendung dort gegenprüfen). **Preise nur im Zusammenhang Kindergeburtstag nennen** (Inhaber, 09.10.2026); für alle anderen Leistungen nie einen Preis angeben, nur „auf Anfrage“:

| Leistung | Preis |
|---|---|
| Zaubershow Kindergeburtstag (40 Min., bis ca. 12 Kinder, ab 4 J.) | 150 € Festpreis |
| + Ballonmodellage | +20 € |
| + Glitzer-Tattoos | +40 € |
| Komplett-Paket | 210 € |
| Kita, Schule, Karneval, Stadtfest, Walk-Act | auf Anfrage |
| Fahrtkosten | 0,40 €/km Hin- und Rückfahrt ab Gladbeck |
| Erwachsene (Hochzeit, Firmenfeier, Gala) | auf Anfrage |

**Einsatzgebiet:**
- Gladbeck, Bottrop, Gelsenkirchen, Dorsten, Herten, Oberhausen, Essen, Marl, Recklinghausen, Dinslaken, Herne, Mülheim an der Ruhr, Bochum, Duisburg, Castrop-Rauxel, Haltern am See, Datteln, Wesel, Moers, Waltrop, Dortmund, Düsseldorf, Xanten
- darüber hinaus ganz NRW

**Wichtige URLs:**

| Seite | URL |
|---|---|
| Startseite | / |
| Kindergeburtstag | /kindergeburtstag/ |
| Kinderzauberer | /kinderzauberer/ |
| Zaubershow | /zauberer/zaubershow/ |
| Kita | /zauberer/zaubershow/kindergarten-kita/ |
| Schule | /zauberer/zaubershow/schule/ |
| Sommerfest | /zauberer/zaubershow/strassen-sommer-fest/ |
| Clownshow | /clown/clownshow/ |
| Ballonkünstler | /clown/ballonmodellage/ |
| Zauberer (Erwachsene) | /zauberer/ |
| Firmenfeier | /zauberer/firmenfeier/ |
| Hochzeit | /zauberer/hochzeit/ |
| Tischzauberer | /zauberer/tisch-zauberer/ |
| Close-up | /zauberer/close-up/ |
| Preise | /preise/ |
| Kontakt | /kontakt/ |

---

## 2. Google-Unternehmensprofil (größter Hebel – einmalig, dann wöchentlich)

Zugang: https://business.google.com (Inhaber-Login im Chrome).

### 2.1 Einmalig einrichten
1. **Kategorien:**
   - Primär: „Zauberer“. Falls nicht verfügbar: „Unterhaltungskünstler“.
   - Zusätzlich, soweit verfügbar: „Clown“, „Kinderunterhaltung“ bzw. „Partyservice für Kinder“, „Ballonkünstler“, „Unterhaltungsdienstleister“.
2. **Leistungen** einzeln anlegen. Einen Preis „ab“ bekommen nur die Kindergeburtstag-Leistungen; alle anderen ohne Preis:
   - Zaubershow Kindergeburtstag
   - Komplett-Paket Kindergeburtstag
   - Ballonmodellage
   - Glitzer-Tattoos
   - Zaubershow Kita
   - Zaubershow Schule
   - Clownshow
   - Walk-Act
   - Zauberer Firmenfeier/Weihnachtsfeier
   - Zauberer Hochzeit
   - Tischzauberei/Close-up

   Jede Leistung bekommt einen Satz Beschreibung plus Link zur passenden URL.
3. **Einsatzgebiet:** alle Städte aus Abschnitt 1. Es sind max. 20 Einträge möglich – Priorität: Gladbeck, Bottrop, Gelsenkirchen, Essen, Dorsten, Herten, Marl, Recklinghausen, Oberhausen, Dinslaken, Herne, Bochum, Mülheim, Duisburg, Dortmund, Düsseldorf, Wesel, Moers, Haltern am See, Castrop-Rauxel.
4. **Beschreibung** (≤ 750 Zeichen), Entwurf:
   > Clown Zauberer LIAR (Michaël Prescler) aus Gladbeck ist seit 2009 hauptberuflich Clown und Zauberer und spielt über 400 Shows pro Jahr in ganz NRW. Für Kindergeburtstage gibt es eine interaktive Mitmach-Zaubershow ab 4 Jahren (40 Minuten, 150 € Festpreis bis ca. 12 Kinder), auf Wunsch mit Ballonmodellage und Glitzer-Tattoos. Dazu Zaubershows für Kita, Schule, Karneval und Sommerfest sowie Bühnen- und Tischzauberei für Hochzeit, Firmenfeier und Gala. Pädagogisch ausgebildet; Shows auf Deutsch, auf Wunsch auf Französisch, Englisch oder Spanisch. 370+ Google-Bewertungen mit 5,0 Sternen.
5. **Website-Link:** `https://liar-entertainer.com/?utm_source=gbp&utm_medium=organic&utm_campaign=profil`
6. **Termin-/Buchungslink:** `https://liar-entertainer.com/kontakt/`
7. **Fragen & Antworten:** diese Fragen selbst einstellen und beantworten, jeweils mit Link:
   - „Was kostet ein Zauberer für den Kindergeburtstag?“ (150 € …, /preise/)
   - „Ab welchem Alter?“ (ab 4 Jahren; Kita ab ca. 3)
   - „Wie lange dauert die Show?“ (ca. 40 Minuten)
   - „In welcher Sprache?“ (DE; FR/EN/ES auf Wunsch)
   - „Bringen Sie eine Tonanlage mit?“ (auf Anfrage, ab ca. 50 Kindern nötig)
   - „Kommen Sie auch nach Düsseldorf/Dortmund/Köln?“ (ganz NRW, 0,40 €/km)
   - „Auftritte für Erwachsene?“ (Hochzeit, Firmenfeier, Gala → /zauberer/)
8. **Fotos:** die 10 besten Website-Fotos (Hero-Fotos der Hauptseiten), Dateiname und Beschreibung mit Ort und Anlass.

### 2.2 Wöchentlich (Teil des Wochen-Tasks)
- **1 Beitrag pro Woche:**
  - Rotation: Kindergeburtstag → Kita/Schule → Erwachsene/Firmenfeier → saisonal (Karneval Jan–Feb, Frühlingsfest März–Apr, Sommerfest Mai–Jul, Herbst/Halloween Sep–Okt, Weihnachtsfeier Nov–Dez).
  - Text 80–150 Wörter, ein Foto von der Website, Button „Mehr erfahren“ mit passender URL plus UTM `?utm_source=gbp&utm_medium=post`.
  - Nur Fakten aus Abschnitt 1, keine erfundenen Termine.
- **Neue Bewertungen beantworten,** innerhalb einer Woche:
  - persönlich, 2–3 Sätze, Anlass und Ort aus der Bewertung aufgreifen, Unterschrift „Michaël – Clown Zauberer LIAR“
  - keine Rabatte, keine Versprechen
  - Negative Bewertungen: sachlich, Angebot zum Telefonat (+49 172 1517578). Bei 1–2 ★ zusätzlich in der Mail hervorheben.
- **Neue Fragen** im Profil beantworten (Fakten aus Abschnitt 1).

---

## 3. Bing Webmaster Tools + IndexNow (wichtig für ChatGPT-Suche und Copilot)

Ein **einmaliger Login** mit einem Microsoft-Konto durch den Inhaber ist nötig.

1. https://www.bing.com/webmasters aufrufen → „Aus Google Search Console importieren“ → liar-entertainer.com auswählen.
2. Sitemap `https://liar-entertainer.com/sitemap.xml` einreichen.
3. IndexNow ist eingerichtet: Schlüsseldatei `https://liar-entertainer.com/3da0cf6edca8f56ea0dc1dea223dcdbe.txt`, Skript `ops/indexnow.mjs`.
   - Nach jedem Deploy mit Inhaltsänderung im Projektordner ausführen: `node ops/indexnow.mjs` für alle URLs der Sitemap, oder `node ops/indexnow.mjs /pfad/` für einzelne Seiten.
   - Erwartet wird HTTP 200 oder 202.
4. In Bing prüfen, ob die URL-Prüfung `/` und `/kindergeburtstag/` als indexiert zeigt.

---

## 4. Google Search Console

Properties:
- `sc-domain:liar-entertainer.com` (Haupt)
- `sc-domain:zauberer-liar.de`
- `https://zauberer-liar.de/` – von dort läuft die Adressänderung, seit 08.10.2026 aktiv

1. **Indexierung beantragen** (Tageslimit ~10): noch offen sind `/zauberer/tisch-zauberer/` und `/zauberer/zauberer-in-` + dorsten, dinslaken, haltern, herne, herten, marl, wesel. Danach jeweils die Seiten aus dem jüngsten Commit (Startseite, /zauberer/, /kinderzauberer/, /zauberer/zaubershow/, Schule, Sommerfest, Kita, Preise, Über mich, Ballonmodellage).
2. **Sitemap neu einreichen**, wenn ein Deploy die Seitenzahl ändert.
3. **Nicht tun:** keine Validierung für „404“ oder „Seite mit Weiterleitung“ starten – das sind gewollte Alt-URLs. Kein Entfernen-Tool benutzen.
4. **Adressänderung zauberer-liar.de:** monatlich prüfen, ob sie aktiv ist. Mindestens 180 Tage aktiv lassen. Die Domain zauberer-liar.de bei IONOS muss weiterlaufen (Verlängerung nicht kündigen) – bei Ablauf-Warnung in der Mail melden.

---

## 5. Branchenportale (Erwähnungen + Links für KI-Antworten)

Diese Portale tauchen in den Top-10 bzw. KI-Quellen der Haupt-Keywords auf:
- eventzone.de
- eventpeppers.com
- kinderpartyworld.de
- kindergeburtstag.events
- gelbeseiten.de
- 11880.com
- Das Örtliche
- (gutefrage.net nicht aktiv bespielen)

Vorgehen:
1. Für jedes Portal prüfen, ob ein Profil existiert (Suche „LIAR Gladbeck“ bzw. „Michaël Prescler“).
2. **Profil vorhanden und eingeloggt:** NAP, Beschreibung, Leistungen, Preise „ab“, Fotos und Website-Link (ohne www) exakt nach Abschnitt 1 setzen.
3. **Kein Profil:** NICHT anlegen. In der Mail auflisten: „Für Portal X bitte Konto anlegen; danach fülle ich es aus.“
4. **Kostenpflichtige Optionen:** nie buchen.

---

## 6. Website-Vorschläge für die nächste Claude-Code-Sitzung (nicht von Cowork umsetzen)

- **Erwachsenen-Stadtseiten** Düsseldorf, Dortmund, Bochum, Mülheim, Krefeld (Nutzerentscheidung B). Vorher beim Inhaber pro Stadt abfragen:
  - 3–5 echte Auftritte (Anlass, Location, Jahr)
  - Locations, an denen er schon war
  - Kunden-Typen (Firmen/Hotels)
  - ein passendes Foto

  Die Antworten in die Mail aufnehmen, Bau dann über Claude Code (Template `src/pages/zauberer/[city].astro`).
- **Startseite vs. /kindergeburtstag/** (GSC-ANALYSE Abschnitt 4): ab ca. 20.11.2026 entscheiden, wenn die www→Apex-Übertragung abgeschlossen ist.
- **Technik:**
  - `/:slug → /blog/` (Soft-404-Risiko): bewusst noch nicht geändert, da Parität mit der alten .htaccess. Erst ändern, wenn die GSC „Soft 404“ meldet.
  - Thumbnails für /blog/
  - width/height für Blog-Bilder
  - Inline-CSS (Lighthouse-Gate beachten)
- **Dünne Kinder-Stadtseiten** (Bottrop, Dinslaken, Datteln, Herne): pro Stadt echte Auftritte vom Inhaber erfragen.

---

## 7. Laufende Aufgaben (Task „liar-seo-wochencheck“)

### 7.1 Wöchentlich – Montag 08:30
1. **GSC Leistung** 7 Tage vs. Vorwoche (Klicks, Impressionen, CTR, Ø Position) sowie 28 Tage.
2. **Positionen der Haupt-Keywords** (exakte Suchanfrage, Filter `query=!<keyword>`, Spalte Seite):
   - clown
   - zauberer
   - kinderzauberer
   - zaubershow nrw
   - zaubershow für kinder
   - kindergeburtstag
   - zauberer kindergeburtstag
   - zauberer für kindergeburtstag
   - clown kindergeburtstag
   - clown für kindergeburtstag
   - clown mieten
   - clown buchen
   - zauberer nrw
   - zauberer mieten
   - zauberer geburtstag
   - zauberer kindergarten
   - zauberer kinder schulen
   - zauberer sommerfest
   - zauberer firmenfeier
   - zauberer weihnachtsfeier
   - tischzauberer
   - ballonkünstler
3. **www→Apex:** Impressionen von `https://www.liar-entertainer.com/` vs. `https://liar-entertainer.com/`. Ziel: www → 0, Apex übernimmt die Positionen (≤ 7 bei „zauberer kindergeburtstag“, „zauberer nrw“, „zauberer mieten“).
4. **Indexierung:** Anzahl indexierter Seiten (Ziel ~158) und neue Fehlergründe.
5. **Live-Check** im Projektordner: `node ops/check-live.mjs` → PASS/FAIL.
6. **Indexierung beantragen** für bis zu 10 offene URLs (Liste in Abschnitt 4).
7. **Unternehmensprofil:** Wochenbeitrag, Bewertungen beantworten (Abschnitt 2.2).
8. **Bericht** `docs/seo-reports/<JJJJ-MM-TT>-woche.md` mit:
   - Tabelle der Keywords: Position, Δ zur Vorwoche, rankende URL
   - Auffälligkeiten
   - 3 konkrete Empfehlungen
9. **E-Mail** an benmikail69@googlemail.com mit:
   - Kurzfassung (5 Zeilen)
   - alle vorgenommenen Änderungen
   - Fragen an den Inhaber
   - Link bzw. Pfad zum Bericht

### 7.2 Monatlich – erster Montag im Monat, zusätzlich
- **Google-Live-Ergebnisse** (google.de, `hl=de`) für:
  - zauberer kindergeburtstag
  - clown kindergeburtstag
  - kinderzauberer
  - zaubershow kita
  - zauberer nrw
  - was kostet ein zauberer für kindergeburtstag
  - ballonkünstler nrw
  - zauberer firmenfeier nrw

  Festhalten: Top-10, Kartenpaket ja/nein, KI-Übersicht ja/nein und ob/wie LIAR darin genannt wird (Ziel: nicht mehr „semiprofessionell/Einsteiger“).
- **Konkurrenzvergleich:** wer neu in den Top-5 ist.
- **zauberer-liar.de:** Klicks und Impressionen sollten fallen; Adressänderung aktiv?
- **Bing Webmaster Tools:** Klicks/Impressionen, Crawl-Fehler.
- Bericht `docs/seo-reports/<JJJJ-MM>-monat.md`.

### 7.3 Jährlich – erste Januarwoche
- **Jahreszahl hochsetzen:** „17 Jahre“ ist eine feste Zahl. Im Januar Claude Code beauftragen, sie per Regel in `site/src/data/fact-rules.ts` zu aktualisieren (17 → 18 usw.). „Seit 2009“-Formulierungen bleiben.

---

## 8. Alte Cowork-Tasks aufräumen

| Task | Was tun | Warum |
|---|---|---|
| `zauberer-liar-seo-daily` | **deaktivieren** | zauberer-liar.de leitet seit 08.10.2026 komplett um |
| `liar-gsc-wochen-check` | **deaktivieren** | ersetzt durch `liar-seo-wochencheck` |
| `liar-daily-seo-autopilot`, `liar-seo-wellen-autopilot` | pausiert lassen, bis auf das neue Repo umgestellt | neues Repo `ben69mikail/liar-entertainer-relaunch`, Code unter `site/`, Deploy über Netlify statt IONOS; Website-Textänderungen nur mit Tests (`npm test`, `npm run test:dist`, `npm run test:seo`) |
| `gsc-daily-optimization`, `gsc-indexierung-beantragen`, `gsc-check-2026-05-27` | prüfen; deaktivieren, wenn sie sich auf die alte Seite oder www beziehen | |
| `pantomime-la-france-seo-daily` | unverändert lassen | andere Website |
