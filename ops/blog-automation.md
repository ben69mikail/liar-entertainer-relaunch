# Blog-Automatik (Stand 21.10.2026)

## Zwei Wege, ein Repo (`ben69mikail/liar-entertainer-relaunch`, Branch `main`)

| | Plan-Artikel (SEO) | Spontan-Artikel (Auftritte) |
|---|---|---|
| Start | Claude-Task `liar-content-redaktion`, Mo 07:05 | Telegram an den Bot: Sprachnachricht/Text + 1–3 Fotos, dann „eigenes“ |
| Schreiber | Claude (Faktenblatt, REGELN.md, themen.md) | n8n `LIAR-2026-08 Spontan-Artikel` (Claude Opus 5.5 via OpenRouter + Haiku-Faktencheck) |
| Datei | `site/src/content/blog/<slug>.md` mit `draft: true`, `freigabe: nein` + Queue-Datei | `site/src/content/blog/<slug>.md` mit `draft: true`, `freigabe: ja` + Bilder in `site/public/blog-images/<slug>/` |
| Freigabe | Inhaber setzt `freigabe: ja` im Artikel auf GitHub | Knopf ✅ in Telegram (oder Mail-Link) |
| Online | GitHub-Action `auto-publish.yml` (täglich 07:30): `draft:false`, Build + `test:seo`, Commit → Netlify | n8n startet `auto-publish.yml` sofort (workflow_dispatch), prüft danach die Live-URL |
| Social | Claude-Task `liar-content-verteilung` (Do 09:10) ruft n8n `LIAR-2026-07 Social-Post` auf; GBP per Chrome | n8n ruft `LIAR-2026-07 Social-Post` direkt nach Live-Check auf |

Story-Repost (+8–12 h, FB/IG Story) = n8n `LIAR-2026-06 Story-Repost`, wird von Social-Post ausgelöst. Bilder dafür (`/hero-generated/<slug>.jpg`, `/story-generated/<slug>.jpg`) erzeugt der Astro-Prebuild (`scripts/generate-overlays.mjs`).

## n8n-Workflows
- `LIAR-2026-Topic-Master` (Telegram-Bot, aktiv): sammelt Inhalte, „eigenes“ startet Spontan-Artikel, leitet ✅/❌ weiter. „hilfe“/„artikel“ zeigt die Anleitung.
- `LIAR-2026-08 Spontan-Artikel` (aktiv) – braucht Credential **GitHub LIAR (relaunch)** (Fine-grained Token, nur dieses Repo, Contents + Actions: Read and write).
- `LIAR-2026-07 Social-Post` (aktiv, Webhook `/webhook/liar-social-post`, Body mit `secret`).
- `LIAR-2026-06 Story-Repost` (aktiv).
- `LIAR-2026-01 Blog Montag` = **abgeschaltet** (altes Repo, Token im Code). Nicht wieder aktivieren.

## Pflege
- Fakten im Spontan-Prompt (Knoten „Prompt bauen“) bei Änderungen an `docs/COWORK-SEO-ANWEISUNGEN.md` §1 / `site/src/data/fact-rules.ts` mitziehen (z. B. Bewertungszahl, Jahre im Januar).
- LinkedIn-Zugang in n8n läuft ca. alle 60 Tage ab → Credential „LinkedIn account“ neu verbinden (Social-Post meldet „LinkedIn-Zugang abgelaufen“).
