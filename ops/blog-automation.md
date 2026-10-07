# Blog-Automatik nach dem Umzug (07.10.2026)

## Heute (altes Repo `ben69mikail/Liar-Entertainer`)
1. **n8n (NAS)** erzeugt Artikel + Bilder und committet per GitHub-API:
   - `src/content/blog/<slug>.md` (Frontmatter mit `draft: true`, `freigabe: nein`)
   - `public/blog-images/<slug>/cover.jpg`, `inline-1.jpg`, `inline-2.jpg` …
2. Du setzt im Artikel `freigabe: ja`.
3. **GitHub-Action `auto-publish.yml`** (täglich 07:30) setzt `draft: false`, prüft (Build + SEO-Tests) und pusht.
4. **`deploy.yml`** baut und lädt per SFTP auf IONOS hoch.

## Neu (Repo `ben69mikail/liar-entertainer-relaunch`, Netlify)
- Schritt 3 ist portiert: `.github/workflows/auto-publish.yml` + `site/scripts/auto-publish.mjs` (gleiche Regeln).
- Schritt 4 entfällt: Netlify baut jeden Push auf `main` selbst.

### Was du in n8n änderst (je GitHub-Knoten, der eine Datei anlegt/ändert)
| Feld | alt | neu |
|---|---|---|
| Repository | `Liar-Entertainer` | `liar-entertainer-relaunch` |
| Owner | `ben69mikail` | `ben69mikail` (gleich) |
| File Path Artikel | `src/content/blog/{{slug}}.md` | `site/src/content/blog/{{slug}}.md` |
| File Path Bilder | `public/blog-images/{{slug}}/…` | `site/public/blog-images/{{slug}}/…` |
| Branch | `main` | `main` (gleich) |
| Bild-URLs im Artikel (`https://liar-entertainer.com/blog-images/…`) | bleiben | bleiben |

Der GitHub-Token in n8n braucht Schreibrechte auf das neue Repo (bei einem Fine-grained-Token: Repo zur Liste hinzufügen, „Contents: Read and write“).

### Prüfung nach der Umstellung
- In n8n einen Entwurf erzeugen lassen → er erscheint als Commit im neuen Repo unter `site/src/content/blog/`.
- Netlify baut; ein Entwurf (`draft: true`) erscheint **nicht** auf der Seite.
- `freigabe: ja` setzen, in GitHub → Actions → „Auto-Publish Blog“ → „Run workflow“ → Artikel ist nach dem Netlify-Build online.

### Altes System stilllegen (erst wenn das neue läuft)
- Im alten Repo `deploy.yml` und `auto-publish.yml` deaktivieren (GitHub → Actions → Workflow → „Disable workflow“), damit die alte IONOS-Seite nicht mehr beschrieben wird.
- Den lokalen Scheduled Task `liar-daily-seo-autopilot-v2` (06:00) pausieren, bis er auf das neue Repo umgestellt ist — er arbeitet im alten Repo.

## Repo-Secrets
Das neue Repo braucht für die Automatik **keine** Secrets (GITHUB_TOKEN reicht). IONOS-SFTP-Secrets entfallen.
