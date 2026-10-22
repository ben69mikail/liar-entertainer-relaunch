# Blog-Automatik (Stand 22.10.2026 – alles über n8n)

Ein System, zwei Startwege, ein Repo (`ben69mikail/liar-entertainer-relaunch`, Branch `main`).

| | Montags-Artikel (SEO-Plan) | Spontan-Artikel (Auftritte) |
|---|---|---|
| Start | n8n `LIAR-2026-10 Plan-Artikel (Montag)`, Mo 07:00 Berliner Zeit | Telegram an den Bot: Sprachnachricht/Text + 0–3 Fotos, dann „eigenes“ |
| Thema | nächstes offenes Thema aus n8n-Datentabelle `liar_themen` | Notiz des Inhabers |
| Fotos | automatisch 1–3 aus dem Google-Drive-Bildpool | die per Telegram geschickten; ohne Fotos → Bildpool |
| Schreiber | n8n `LIAR-2026-08 Artikel-Pipeline` (Claude Opus 5.5 via OpenRouter + Haiku-Faktencheck) | dieselbe Pipeline |
| Freigabe | ✅/❌ in Telegram oder Mail-Link (3 Tage, danach verworfen) | dito |
| Online | Pipeline committet Artikel (`draft: true`, `freigabe: ja`) + Bilder nach `site/public/blog-images/<slug>/`, startet `auto-publish.yml`, prüft Live-URL | dito |
| Social | n8n `LIAR-2026-07 Social-Post` direkt nach Live-Check (FB, IG, LinkedIn; Story +8–12 h über `LIAR-2026-06 Story-Repost`) | dito |

## Bildpool (Google Drive)
- Ordner: https://drive.google.com/drive/folders/16Fsb35rRsLWIyS2xQ9clzEvs831IWGkV (Unterordner eine Ebene tief werden mitgelesen; `user_topics`/`archiv` ignoriert).
- **Foto in den Ordner legen = Freigabe für Blog und Social** (inkl. Einwilligung bei Kinderfotos). Nur JPG/PNG/WEBP (HEIC vorher umwandeln).
- Unterordner `nur-blog` → Foto nie als Social-/Titelbild.
- n8n `LIAR-2026-09 Bildkatalog` (täglich 05:30 + Webhook `/webhook/liar-bildkatalog`) beschreibt neue Fotos per Claude-Vision und trägt sie in die Datentabelle `liar_bilder` ein (Beschreibung, Tags, Alt-Text, Kinder nein/fern/nah, Zeitung). Max. 25 pro Lauf, Doppelte werden gelöscht.
- Auswahlregeln (Knoten „Bilder auswählen“): passende Tags, nicht zweimal im selben Quartal, Zeitungsausschnitte nie (außer Thema Presse), Titelbild nie mit nahen Kindergesichtern/`nur-blog`, Format 4:5 bis 1,91:1. Nach Freigabe werden `zuletzt_benutzt`, `zuletzt_slug`, `benutzt_anzahl` gebucht.
- Foto aus dem Pool nehmen: in `liar_bilder` `aktiv` = false.

## Redaktionsplan
- Datentabelle `liar_themen` (48 Themen aus `docs/content/themen.md`): Status `offen` → wird gewählt; `vorhanden`/`faktencheck`/`verworfen` werden übersprungen; nach Veröffentlichung `veröffentlicht` + Slug + Datum.
- Reihenfolge: Fenster = aktueller Monat → nächster Monat → Rest; dann `prio`, `reihenfolge`.
- Thema überspringen: Status auf `verworfen`. Fakten ergänzen: Spalte `fakten` (geht in den Prompt).
- Test: `POST https://n8n.srv860817.hstgr.cloud/webhook/liar-plan-artikel` mit `{"test":true}` (Testlauf bucht nichts in den Tabellen; Vorschau mit ❌ verwerfen).

## n8n-Workflows
- `LIAR-2026-Topic-Master` (Telegram-Bot): sammelt Inhalte, „eigenes“ startet die Pipeline, leitet ✅/❌ weiter.
- `LIAR-2026-08 Artikel-Pipeline (Spontan + Montag)` – braucht Credential **GitHub LIAR (relaunch)** (Fine-grained Token, nur dieses Repo, Contents + Actions: Read and write) in den Knoten „GitHub: Datei anlegen“ und „GitHub: Auto-Publish starten“.
- `LIAR-2026-09 Bildkatalog`, `LIAR-2026-10 Plan-Artikel (Montag)`.
- `LIAR-2026-07 Social-Post` (Webhook `/webhook/liar-social-post`, Body mit `secret`), `LIAR-2026-06 Story-Repost`.
- `LIAR-2026-01 Blog Montag` = **abgeschaltet** (altes Repo, Token im Code). Nicht wieder aktivieren.
- Claude-Tasks `liar-content-redaktion` und `liar-content-verteilung` = **pausiert** (22.10.2026), ersetzt durch n8n. `liar-seo-wochencheck` (Google-Unternehmensprofil) läuft weiter.

## Pflege
- Fakten im Knoten „Prompt bauen“ bei Änderungen an `docs/COWORK-SEO-ANWEISUNGEN.md` §1 / `site/src/data/fact-rules.ts` mitziehen (Bewertungszahl, Jahre im Januar).
- LinkedIn-Zugang in n8n läuft ca. alle 60 Tage ab → Credential „LinkedIn account“ neu verbinden.
- Google-OAuth (Drive, Gmail) muss in der Google-Cloud-App auf „In Produktion“ stehen, sonst laufen die Zugänge nach 7 Tagen ab.
