# Content-Automation Blog + Social – Design (20.10.2026)

Entschieden mit dem Inhaber am 20.10.2026: Ansatz A (Zwei-Lauf-Modell), Freigabe pro Stück, 1 Artikel + 3 Social-Posts pro Woche, Verteilung über Metricool, Themen/Fotos als Repo-Dateien.

> **Änderung 21.10.2026 (Inhaber):** Hybrid. Plan-Artikel weiter über die beiden Claude-Tasks, aber **GitHub statt lokalem Ordner als Quelle** (Klon pro Lauf, siehe REGELN §7). **Social (FB/IG/LinkedIn + Story) über n8n** (`LIAR-2026-07 Social-Post`) statt Metricool. **Spontan-Artikel** per Telegram über n8n (`LIAR-2026-08 Spontan-Artikel`, Freigabe-Knopf → direkt Commit mit `freigabe: ja` → Auto-Publish). Der alte n8n-Montagsworkflow ist abgeschaltet. GBP-Beiträge bleiben beim Donnerstags-Task (Chrome).

## 1. Ziel
Jede Woche ein neuer, faktentreuer Blogartikel aus der Content-Strategie 2026 (48 Themen) plus passende Beiträge auf Google-Unternehmensprofil, Facebook, Instagram und LinkedIn – ohne dass etwas ohne Freigabe des Inhabers veröffentlicht wird. Kein Bild zweimal im Quartal, Bilder immer themenpassend.

## 2. Komponenten
| Komponente | Ort | Zweck |
|---|---|---|
| Redaktionsplan | `docs/content/themen.md` | 48 Themen, Status, Fenster, Ziel-URL, Fakten |
| Fotopool | `site/public/content-fotos/` + `docs/content/fotos.md` | Bilder + Katalog (Motiv, Themen, Einwilligung, Benutzt am) |
| Regeln | `docs/content/REGELN.md` | Fakten, Stil, Bildregeln, Freigabe-Werte, Schreibweg |
| Social-Queue | `docs/content/queue/<slug>.md` | 4 Texte + Bild + Freigabe pro Artikel |
| Artikel | `site/src/content/blog/<slug>.md` | bestehendes Schema, `draft`/`freigabe` |
| Lauf 1 | Scheduled Task `liar-content-redaktion`, Mo 07:10 | Thema wählen, Artikel + Queue schreiben, committen, Mail |
| Lauf 2 | Scheduled Task `liar-content-verteilung`, Do 09:10 | Freigaben lesen, GBP posten, Metricool planen, Status setzen, Mail |
| Veröffentlichung Blog | GitHub-Action `auto-publish.yml` (täglich 07:30) + Netlify | unverändert |
| Verteiler | Metricool-Connector (claude.ai) | FB/IG/LinkedIn (+ GBP, wenn dort verknüpft) |
| Fallback GBP | Chrome (Merchant-Panel) | Textbeitrag mit Button, wie Wochencheck |

## 3. Lauf 1 – Redaktion (Montag)
1. Vorbedingungen: Projektordner erreichbar, `git pull --ff-only` (nur ohne lokale Änderungen), GitHub-Connector antwortet (Lesen `ops/blog-automation.md`).
2. Neue Fotos aus `C:\Users\ben_m\OneDrive\Desktop\Für Homepage` (rekursiv) erkennen (Dateiname nicht in `fotos.md`), verkleinert kopieren, Katalogzeile mit Beschreibung anlegen (Einwilligung `?`, Social-Freigabe nach Regeln), in Mail „bitte committen“.
3. Thema nach REGELN §6 wählen. Kein Thema → Mail, Ende.
4. Bilder nach REGELN §3 wählen (Themen-Match, Quartalsregel, Online-Prüfung 200).
5. Artikel schreiben (REGELN §2), Slug-Kollision prüfen (Content, blog-images, Live-Sitemap).
6. Queue-Datei schreiben (REGELN §4), `termin_social` = Donnerstag der Folgewoche.
7. `themen.md`: Status `entwurf`, Slug, Datum. `fotos.md`: „Benutzt am“ für gewählte Bilder (vorläufig; bei Verwerfen durch Inhaber wieder entfernen).
8. Ein Commit via GitHub-Connector: Artikel, Queue, themen.md, fotos.md.
9. Mail an Inhaber (Betreff `LIAR Content – Entwurf <Datum>`): Titel, Keyword, Ziel-URL, Bilder, Link zu beiden Dateien auf GitHub, Freigabe-Anleitung (`freigabe: ja` in Artikel und/oder Queue), offene Fakten-Fragen, fehlende Fotos.

## 4. Lauf 2 – Verteilung (Donnerstag)
1. `git pull`, Queue-Dateien mit `status: entwurf|verschoben` und `freigabe ≠ nein` lesen.
2. Artikel live? (`https://liar-entertainer.com/blog/<slug>/` HTTP 200, kein `draft`). Nein → `status: verschoben`, Mail-Hinweis, nächste Datei.
3. `freigabe` `ja` oder `nur-gbp`: GBP-Beitrag (Metricool, falls GBP dort verknüpft; sonst Chrome-Merchant-Panel, Textbeitrag + Button „Weitere Informationen“ + UTM).
4. `freigabe` `ja` oder `nur-social`: Facebook, Instagram, LinkedIn über Metricool `createScheduledPost` mit Bild-URL (`https://liar-entertainer.com/content-fotos/<datei>`), Zeit = `getBestTimeToPostByNetwork` am selben Tag, sonst 18:00.
5. Erfolg je Kanal in `veroeffentlicht` eintragen, `status: veröffentlicht`, `themen.md` → `veröffentlicht`, `fotos.md` „Benutzt am“ bestätigen. Commit via GitHub-Connector.
6. IndexNow (`node ops/indexnow.mjs /blog/<slug>/`).
7. Mail `LIAR Content – Verteilung <Datum>`: was wo gepostet (Links), was verschoben, Fehler.

## 5. Fehlerfälle
- Metricool nicht verbunden/nicht in diesem Chat aktiviert → Social überspringen, GBP trotzdem, Mail mit Hinweis.
- Chrome nicht erreichbar → GBP überspringen, Mail.
- GitHub-Connector-Fehler → Dateien bleiben lokal, Mail „bitte committen“ mit Pfaden.
- Bild nicht online (404) → nächstes passendes Bild; keins → ohne Bild (LinkedIn Logo-Fallback), Mail.
- Faktenlücke im Thema → Thema überspringen, nächstes wählen, Frage in Mail.
- Doppelte Veröffentlichung verhindern: vor jedem Post `veroeffentlicht.<kanal>` prüfen.

## 6. Tests / Kontrolle
- Artikel müssen die bestehenden Repo-Tests bestehen (`npm test`, `npm run test:seo` laufen in der GitHub-Action vor dem Publish; lokal optional `node site/scripts/auto-publish.mjs --dry-run`, falls vorhanden).
- Wochencheck (`liar-seo-wochencheck`) misst Blog-Klicks/Impressionen und UTM-Quellen (gbp/facebook/linkedin) in GA4/GSC; monatlich Vergleich in `docs/seo-reports/`.
- Quartalsregel prüfbar: `fotos.md` Spalte „Benutzt am“.

## 7. Nicht im Scope
n8n-Blog-Workflow wird abgeschaltet (Inhaber), kein zweiter Schreiber im Repo. Keine Website-Texte außerhalb des Blogs. Keine bezahlten Posts/Ads. Französische Inhalte folgen erst nach Freischaltung von `/fr/` (separates Vorhaben).

## 8. Einmalige Schritte für den Inhaber
1. Metricool in claude.ai verbinden (Konten FB-Seite, Instagram Business, LinkedIn, GBP in Metricool verknüpfen) und für die Scheduled Tasks aktivieren.
2. Einmal committen: `docs/content/`, `site/public/content-fotos/`, `docs/superpowers/specs/` (z. B. über Claude Code: „committe docs/content und site/public/content-fotos“).
3. `fotos.md`: Anlass/Ort/Jahr + Einwilligung ausfüllen; `themen.md`: Zeilen mit `faktencheck` befüllen.
4. n8n-Blog-Workflow deaktivieren.
5. Beide Scheduled Tasks in der Claude-App auf „Diesen Computer erforderlich“ + automatische Freigabe stellen (wie `liar-seo-wochencheck`).
