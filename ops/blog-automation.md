# Blog-Automatik (Stand 22.10.2026 – alles über n8n)

Ein System, zwei Startwege, ein Repo (`ben69mikail/liar-entertainer-relaunch`, Branch `main`).

| | Montags-Artikel (SEO-Plan) | Spontan-Artikel (Auftritte) |
|---|---|---|
| Start | n8n `LIAR-2026-10 Plan-Artikel (Montag)`, Mo 07:00 Berliner Zeit | Telegram an den Bot: Sprachnachricht/Text + 0–3 Fotos, dann „eigenes“ |
| Thema | nächstes offenes Thema aus n8n-Datentabelle `liar_themen` | Notiz des Inhabers |
| Fotos | automatisch 1–3 aus dem Google-Drive-Bildpool | die per Telegram geschickten; ohne Fotos → Bildpool |
| Schreiber | n8n `LIAR-2026-08 Artikel-Pipeline` (Claude Opus 5.5 via OpenRouter + Haiku-Faktencheck) | dieselbe Pipeline |
| Freigabe | ✅/❌ in Telegram oder Mail-Link (3 Tage, danach verworfen) | dito |
| Online | Pipeline committet Artikel (`draft: true`, `freigabe: ja`) + Bilder nach `site/public/blog-images/<slug>/` als **einen** Commit (Git Data API: Blobs → Baum → Commit → Branch; früher Einzel-PUTs → 409-Konflikt), startet `auto-publish.yml`, prüft Live-URL | dito |
| Social | n8n `LIAR-2026-07 Social-Post` direkt nach Live-Check (FB, IG, LinkedIn, Google-Unternehmensprofil; Story +8–12 h über `LIAR-2026-06 Story-Repost`) | dito |

## Web-Recherche (Spontan-Artikel)
- Vor dem Schreiben sucht die Pipeline im Internet nach den in der Notiz genannten Orten/Veranstaltungen (Knoten „Recherche vorbereiten“ → „Web-Recherche (Internet)“: Claude Haiku + `openrouter:web_search` → „Recherche auswerten“). Ergebnis: Adresse, Parken/ÖPNV, Termin, max. 5 Fakten – nur mit Quell-URL; Notiz des Inhabers hat Vorrang.
- Der Artikel bekommt daraus einen Anreise-Abschnitt mit „(Stand: MM/JJJJ, ohne Gewähr)“ und Quell-Link; Widersprüche zwischen Quellen erscheinen als Warnung in der Vorschau.
- Bildfunde (og:image der Quellseiten, z. B. Plakat oder Foto der Location) stehen nur in der Vorschau (Telegram + Mail), **nie automatisch im Artikel** – Bildrechte liegen bei Dritten. Darfst du ein Bild nutzen (Erlaubnis des Veranstalters), schick es per Telegram mit.
- Code: `ops/n8n/research-lib.cjs` (Tests `node --test ops/n8n/research.test.mjs`), Workflow-Quelle `ops/n8n/artikel-pipeline.sdk.js`.

## Artikel-Stil und Beitragsbild
- Artikel im LIAR-Stil mit Emojis (Titel, jede H2, Emoji-Listen, „🎉 Fazit“); seoTitle/description/slug ohne Emojis (Knoten „Prompt bauen“/„Artikel aufbereiten“).
- Beitragsbild = `site/public/hero-generated/<slug>.jpg`, beim Build erzeugt (`src/utils/heroOverlay.ts` + `overlayText.ts`): Titel in Fira Sans Extra Condensed als Pfade, erster Teil weiß, zweiter (nach „:“/„?“/„–“) gelb, rotes „CLOWN ZAUBERER LIAR“-Schild, Zuschnitt nach Motiv. Stiländerung: Dateien in `public/hero-generated/` löschen, Build erzeugt sie neu.
- Story-Bild = `site/public/story-generated/<slug>.jpg` (1080×1920, `src/utils/storyOverlay.ts`): Schild + großer Titel (≥ 72 px) oben, Foto fast randbreit mit weißem Rahmen darunter, alles zwischen 250 px oben und 340 px unten (dort liegen Profilzeile/Antwortfeld von FB/IG). Wächter: `tests/overlays.test.ts`.
- Titelbild-Fokus: Nach der Freigabe schaut eine Bild-KI (OpenRouter, Haiku Vision) auf das Titelbild und trägt `heroFocus: { x, top, bottom }` (Kopf bis Hüfte der Hauptperson in %) ins Frontmatter ein (`ops/n8n/focus-lib.cjs`). Die Site (`src/utils/focusCrop.ts`) schneidet Beitrags- und Story-Bild so zu, dass Kopf + Oberkörper immer sichtbar sind; passt die Person nicht unter den Titel (z. B. Hochkant-Foto), steht das Foto ungeschnitten rechts und der Titel links. Ohne Fokus werden Hochkant-Fotos nie blind beschnitten. Fokus von Hand korrigieren: Zeile `heroFocus` im Artikel ändern.
- LinkedIn-Vorschaubild: Die Posts-API liest das og:image des Artikels nicht. `LIAR-2026-07 Social-Post` lädt deshalb das Beitragsbild über die LinkedIn-Images-API hoch (`initializeUpload` → PUT) und setzt es als `content.article.thumbnail`. Scheitert der Upload, wird ohne Bild gepostet; der Telegram-Bericht sagt dann „OHNE Vorschaubild“. Code: `ops/n8n/linkedin-lib.cjs`, Workflow-Quelle `ops/n8n/social-post.sdk.js`.
- Stories: `LIAR-2026-06 Story-Repost` postet 8–12 h (oder genau `story_delay_minutes` ≥ 60 aus dem Social-Post-Body) nach dem Artikel eine Facebook- und eine Instagram-Story und meldet das echte Ergebnis je Kanal per Telegram. LinkedIn bietet keine Stories (seit 2021 eingestellt, keine API).

## Google-Unternehmensprofil
- Credential „Google Unternehmensprofil“ (Google-Cloud-Projekt `n8nKI`, API-Zugang von Google freigegeben). Standort `accounts/103330969593697494513/locations/9739402903237302654` im Knoten „GBP vorbereiten“ (Social-Post).
- Beitrag: eigener Text (ohne Link/Telefonnummer), Beitragsbild, Button „Mehr erfahren“ → Artikel mit `utm_source=gbp`.
- Zugänge prüfen: `POST https://n8n.srv860817.hstgr.cloud/webhook/liar-gbp-ids` (Workflow „LIAR Hilfe: Zugänge testen“: Drive, Sheets, Gmail, Google-Profil). Alle Google-Zugänge nutzen denselben OAuth-Client – wird dort ein Secret gelöscht, in allen vier Credentials das neue eintragen.

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
- `LIAR-2026-Topic-Master` (Telegram-Bot): sammelt Sprachnachrichten/Texte/Fotos in der Datentabelle `liar_inbox` (3 Std.; Alben werden vollständig gesammelt), Button „✍️ Artikel jetzt schreiben“ oder „eigenes“ startet die Pipeline, leitet ✅/❌ weiter. Sprache → Text über OpenRouter (`openai/whisper-1`); scheitert das, kommt eine Telegram-Meldung. Quelle: `ops/n8n/topic-master.sdk.js`. Test: `TM_SECRET=… node ops/n8n/test-topic-master-inbox.mjs` (mit `E2E_VOICE=<file_id>` zusätzlich Sprache→Pipeline als TESTLAUF).
- `LIAR-2026-08 Artikel-Pipeline (Spontan + Montag)` – braucht Credential **GitHub LIAR (relaunch)** (Fine-grained Token, nur dieses Repo, Contents + Actions: Read and write) in den Knoten „GitHub: Datei anlegen“ und „GitHub: Auto-Publish starten“.
- `LIAR-2026-09 Bildkatalog`, `LIAR-2026-10 Plan-Artikel (Montag)`.
- `LIAR-2026-07 Social-Post` (Webhook `/webhook/liar-social-post`, Body mit `secret`), `LIAR-2026-06 Story-Repost`.
- `LIAR-2026-01 Blog Montag` = **abgeschaltet** (altes Repo, Token im Code). Nicht wieder aktivieren.
- Claude-Tasks `liar-content-redaktion` und `liar-content-verteilung` = **pausiert** (22.10.2026), ersetzt durch n8n. `liar-seo-wochencheck` (Google-Unternehmensprofil) läuft weiter.

## Pflege
- Fakten im Knoten „Prompt bauen“ bei Änderungen an `docs/COWORK-SEO-ANWEISUNGEN.md` §1 / `site/src/data/fact-rules.ts` mitziehen (Bewertungszahl, Jahre im Januar).
- LinkedIn-Zugang in n8n läuft ca. alle 60 Tage ab → Credential „LinkedIn account“ neu verbinden.
- Google-OAuth (Drive, Gmail) muss in der Google-Cloud-App auf „In Produktion“ stehen, sonst laufen die Zugänge nach 7 Tagen ab.
