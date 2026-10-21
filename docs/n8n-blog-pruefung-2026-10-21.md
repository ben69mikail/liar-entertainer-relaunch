# n8n-Blog-Workflow – Prüfung 21.10.2026

Instanz: Hostinger `n8n.srv860817.hstgr.cloud` (nur gelesen, nichts geändert).

## Was der Workflow kann
Hauptworkflow **„LIAR-2026-01 Blog Montag (Geburtstag/Tipps)“** (52 Knoten, aktiv, zuletzt geändert 11.05.2026), gestartet über **„LIAR-2026-Topic-Master“** (Telegram-Bot):

1. Start per Telegram: „Plan“ (nächstes Thema aus Google Sheet `Redaktionsplan_StartTest.csv`) oder „Eigenes“ (Sprachnachricht → Whisper-Transkript + Fotos → Drive).
2. Fotos aus Google-Drive-Pool wählen (Cover + 2 Innenbilder, Tracking benutzter Fotos).
3. Artikel schreiben mit Claude Opus 4.7 (OpenRouter), Leistungsseiten als Faktenbasis.
4. Gegenprüfung mit Claude Haiku 4.5 auf Widersprüche (Preise, Kontaktdaten, Zahlen) → Telegram-Alarm.
5. Vorschau als HTML-Mail an info@ + Telegram mit Buttons „Veröffentlichen/Ablehnen“, wartet auf Klick.
6. Nach Freigabe: Bilder + Markdown per GitHub-API committen, Deploy-Status abfragen, Live-URL prüfen.
7. Danach automatisch: Facebook-Foto-Post, Instagram-Post, LinkedIn-Post mit Bild, Story-Repost nach 8 h, Sheet-Status „live“.

## Zustand
| Punkt | Befund |
|---|---|
| Letzte Läufe | 5 Läufe 29.–30.04.2026, alle **„waiting“** (Freigabe nie geklickt). Seitdem kein Lauf. |
| Zeitplan | Keiner. Läuft nur, wenn du dem Telegram-Bot schreibst. |
| Ziel-Repo | `ben69mikail/liar-entertainer-blog` – **nicht** die Live-Seite. Live = `liar-entertainer-relaunch` (Pfade `site/…`). Ein freigegebener Artikel käme heute **nie online**. |
| Deploy-Check | fragt GitHub Actions des alten Repos ab (IONOS-Deploy) – Netlify wird nicht geprüft. |
| Frontmatter | passt zum neuen Schema, aber `draft: false` direkt (kein `freigabe`-Weg, kein `seoTitle`). |
| Fakten im Prompt | „354+ Google-Bewertungen“ (aktuell 390+); „seit 2009“ stimmt; 400+ Shows, Preisregel (nur Geburtstag), Buchungsregeln Glitzer/Ballon im Prompt nicht gefunden. |
| Fallback-Bilder | `wp-content/uploads/…` – gibt es auf der neuen Seite nicht mehr (404). |
| Bilder-URLs | `hero-generated/<slug>.jpg`, `story-generated/<slug>.jpg` für Overlays – existieren im neuen Repo nicht. |
| Sicherheit | **GitHub-Token steht im Klartext in 3 Code-Knoten** (statt n8n-Credential). |
| Social-Tokens | Facebook/Instagram/LinkedIn-Zugänge seit Mai ungenutzt – Ablauf wahrscheinlich (LinkedIn/FB-Tokens ~60 Tage), ungeprüft. |
| Kein Test | keine Prüfung gegen Repo-Tests (Build, SEO-Assertions) vor dem Commit. |

## Vergleich für die Entscheidung
| | n8n (Plan A) | Claude-Lauf (Plan B, Spec 20.10.) |
|---|---|---|
| Start | Telegram, jederzeit, auch Sprachnachricht + Handyfotos | fest Mo 07:10 |
| Freigabe | 1 Klick in Telegram | `freigabe: ja` in Datei |
| Social | FB/IG/LinkedIn direkt + Story | Metricool (+ GBP) |
| GBP-Beitrag | nein | ja |
| Faktentreue | Prompt + Haiku-Check, Fakten veraltet | REGELN.md + Repo-Tests |
| Läuft heute | nein (falsches Repo, Tokens) | noch nicht eingerichtet |

## Nötig, damit n8n wieder funktioniert (Plan A)
1. Repo → `liar-entertainer-relaunch`, Pfade `site/src/content/blog/…`, `site/public/blog-images/…`.
2. Token aus Code in n8n-Credential, neuer Fine-grained-Token nur für dieses Repo; alten Token widerrufen.
3. Deploy-Check auf Netlify (oder nur Live-URL 200 abwarten).
4. Fakten im Prompt aus `site/src/data/fact-rules.ts`/`docs/COWORK-SEO-ANWEISUNGEN.md` (390+, seit 2009, Preise nur Geburtstag, Buchungsregeln).
5. Fallback-/Overlay-Bilder auf vorhandene Pfade.
6. Social-Tokens erneuern; ein Testlauf.
7. Optional: Commit als `draft: true` + `freigabe: ja` → GitHub-Action prüft Build + SEO-Tests vor Veröffentlichung.
