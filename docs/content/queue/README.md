# Social-Queue
Eine Datei pro Artikel: `<slug>.md`. Erzeugt vom Montagslauf (`liar-content-redaktion`), verteilt vom Donnerstagslauf (`liar-content-verteilung`), sobald `freigabe` ≠ `nein`.

Frontmatter:
```yaml
slug: <slug>
artikel: site/src/content/blog/<slug>.md
artikel_url: https://liar-entertainer.com/blog/<slug>/
bild: site/public/content-fotos/<datei>        # Social-Bild (muss REGELN §3 erfüllen)
bild_ig: site/public/content-fotos/<datei>     # optional, 4:5-Zuschnitt
freigabe: nein                          # Inhaber: ja | nur-gbp | nur-social | nein
status: entwurf                         # entwurf | freigegeben | veröffentlicht | verschoben
termin_social: JJJJ-MM-TT
erstellt: JJJJ-MM-TT
veroeffentlicht: {gbp: "", facebook: "", instagram: "", linkedin: ""}
```
Abschnitte: `## GBP`, `## Facebook`, `## Instagram`, `## LinkedIn` (Texte nach REGELN §4).

## Verteilung (Donnerstag) – Social über n8n
Facebook/Instagram/LinkedIn gehen über den n8n-Workflow `LIAR-2026-07 Social-Post` (ID `ZLm26Qc0IosVPprm`), Aufruf mit dem n8n-Connector:
`execute_workflow(workflowId: "ZLm26Qc0IosVPprm", inputs: {type: "webhook", webhookData: {method: "POST", body: {...}}})`

Body:
```json
{
  "secret": "liar-social-2026-k7Qx9mPz",
  "source": "Plan-Artikel <slug>",
  "title": "<Artikeltitel>",
  "description": "<description aus dem Artikel>",
  "live_url": "https://liar-entertainer.com/blog/<slug>/",
  "image_url": "https://liar-entertainer.com/content-fotos/<datei>",
  "image_url_ig": "https://liar-entertainer.com/content-fotos/<datei für bild_ig oder gleiche>",
  "story": true,
  "story_image_url": "https://liar-entertainer.com/story-generated/<slug>.jpg",
  "channels": ["facebook", "instagram", "linkedin"],
  "texts": { "facebook": "<## Facebook>", "instagram": "<## Instagram>", "linkedin": "<## LinkedIn>" }
}
```
`channels` nur mit den freigegebenen Kanälen füllen, die in `veroeffentlicht` noch leer sind. Ergebnis (pro Kanal ok/FEHLER) kommt als Telegram-Bericht und steht in der Ausführung (`get_execution`, Knoten „Bericht bauen“).
