# Schreib- und Bildregeln für die Content-Automation (Stand 20.10.2026)

Gilt für die Scheduled Tasks `liar-content-redaktion` (Montag) und `liar-content-verteilung` (Donnerstag). Grundlage: `docs/COWORK-SEO-ANWEISUNGEN.md` §0 + §1 (Faktenblatt, bindend) und `site/src/data/fact-rules.ts` (Zahlen).

## 1. Harte Regeln
- Nur Fakten aus `docs/COWORK-SEO-ANWEISUNGEN.md` §1. Zahlen: seit 2009, 17 Jahre (bis Januar), über 400 Auftritte/Jahr, 390+ Google-Bewertungen 5,0 ★. Die Content-Strategie (docx) nennt „15 Jahre“/„354 Bewertungen“ – **veraltet, nicht übernehmen.**
- Preise **nur** im Kontext Kindergeburtstag (150 € / +20 € Ballons / +40 € Glitzer / 210 € Paket, 0,40 €/km). Alle anderen Leistungen: „auf Anfrage“. Buchungsregeln Glitzer-Tattoos/Ballonmodellage exakt wie §1.
- Keine erfundenen Auftritte, Orte, Kunden, Zitate, Termine. Event-Rückblicke („Lokales“, „Behind the Scenes“) nur, wenn der Inhaber den Auftritt in `themen.md` (Spalte Fakten) bestätigt hat. Sonst Thema überspringen und in der Mail nachfragen.
- Kein Website-Text außerhalb `site/src/content/blog/` ändern. Keine Änderungen an Domains, DNS, Netlify, GitHub-Einstellungen. Keine Logins, keine Käufe.
- Jeder Artikel: `draft: true`, `freigabe: nein`. Veröffentlichung nur über den Freigabe-Marker des Inhabers.

## 2. Artikel (Blog)
- Länge 800–1.200 Wörter, Ich-Form (Michaël), Ton wie `site/src/content/blog/kindergeburtstag-herbstferien-drinnen.md`: konkret, ehrlich, aus der Praxis, keine Werbefloskeln.
- Struktur: H1 = Titel mit Hauptkeyword · erster Absatz beantwortet die Suchfrage direkt (Antwort-zuerst) · 3–5 H2 · 1 Liste max. · Abschnitt „Häufige Fragen“ mit 3 Fragen · Abschluss mit Kontakt (Telefon +49 172 1517578, `/kontakt/`).
- Frontmatter wie `site/src/content.config.ts`: `title`, `seoTitle` (≤ 60 Zeichen, Keyword vorn, „| LIAR“), `description` (120–160 Zeichen, Nutzen + CTA), `publishDate` (Montag des Laufs), `heroImage` (`https://liar-entertainer.com/blog-images/<slug>/cover.jpg`), `heroImageAlt`, `categories` (aus: Ratgeber, Saisonal, Behind the Scenes, Expertise, Lokales, Kindergeburtstag, Kita & Schule, Firmen), `tags` (3–5, kleingeschrieben, Bindestrich), `author: "Michaël Prescler"`, `draft: true`, `freigabe: nein`.
- Slug: `/blog/<keyword-fokus-titel>/`, nur a–z, 0–9, Bindestrich, max. 60 Zeichen. Vor dem Anlegen prüfen, dass der Slug weder in `site/src/content/blog/` noch in `site/public/blog-images/` noch in der Live-Sitemap existiert.
- Interne Links: mindestens 2 – immer die Ziel-URL aus `themen.md` plus eine passende zweite Leistungsseite (§1 „Wichtige URLs“). Ankertext beschreibend („Zaubershow für Kita und Kindergarten“), nicht „hier“.
- Keywords: Hauptkeyword in Titel, erstem Absatz, einer H2. Keine Keyword-Listen, keine Städte-Aufzählungen über 5 Namen.
- Bilder im Artikel: 1 Cover (`cover.jpg`) + 1–2 Inline (`inline-1.jpg`, `inline-2.jpg`) in `site/public/blog-images/<slug>/`, max. 1600 px, JPEG q85. Alt-Text nur aus den Fakten in `fotos.md` (Anlass, Ort, Jahr).

## 3. Bilder (Pool `site/public/content-fotos/`, Katalog `fotos.md`)
- Nur Bilder mit `Social-Freigabe: ja` für Facebook/Instagram/LinkedIn/GBP. Bilder mit erkennbaren Kindern **nur**, wenn der Inhaber in `fotos.md` „Einwilligung: ja“ eingetragen hat.
- **Themenbezug ist Pflicht**: Spalte „Themen“ in `fotos.md` muss zum Artikel passen (z. B. Karneval-Artikel → Bild mit Karneval-Tag). Passt kein Bild: zweite Quelle `site/public/images/**` und `site/public/blog-images/**` (gleiche Regeln, Alt-Text aus dem jeweiligen Artikel). Passt immer noch nichts: Artikel ohne Inline-Bild, Cover = passendstes Motiv, und in der Mail „Foto fehlt für Thema X“ melden.
- **Kein Bild zweimal im selben Quartal** (Blog-Cover, Inline, GBP, FB/IG, LinkedIn zählen alle). Spalte „Benutzt am“ in `fotos.md` wird bei jeder Verwendung ergänzt; vor der Auswahl prüfen, dass das letzte Datum nicht im laufenden Quartal (Jan–Mär, Apr–Jun, Jul–Sep, Okt–Dez) liegt.
- Zeitungsartikel (`zeitungsartikel-*`) nie als Social-Bild posten (Fremdrecht der Zeitung); nur als Beleg im Text verlinken oder als Inline-Bild mit Quellenangabe im Blog, wenn der Inhaber es freigegeben hat.
- Logos nur für LinkedIn, wenn kein passendes Foto frei ist.
- Instagram: Bild mit Seitenverhältnis zwischen 4:5 und 1.91:1; Hochformat-Bilder werden auf 4:5 beschnitten (zentriert), nie verzerrt.

## 4. Social-Paket (`docs/content/queue/<slug>.md`)
- **GBP** (80–150 Wörter): Anlass → Nutzen → Fakten → Kontakt. Button „Weitere Informationen“ → Artikel-URL + `?utm_source=gbp&utm_medium=post`. Preise nur bei Kindergeburtstag.
- **Facebook** (60–120 Wörter): persönlich, 1 Frage an die Leser, Link zum Artikel mit `?utm_source=facebook&utm_medium=social`. 3–5 Hashtags am Ende.
- **Instagram** (= Facebook-Text ohne Link; „Link in der Bio“ nicht nötig – Artikel-URL in Klartext erlaubt), 8–12 Hashtags (#kinderzauberer #clown #kindergeburtstag #nrw #ruhrgebiet #gladbeck + Thema + Stadt).
- **LinkedIn** (80–150 Wörter): sachlich, Perspektive Firmen/Kitas/Veranstalter; bei Kinderthemen den Blick „für Personalverantwortliche/Elternvertreter“. Link mit `?utm_source=linkedin&utm_medium=social`. Max. 3 Hashtags.
- Alle vier Texte nennen dieselbe Kernaussage, keine Emojis-Ketten (max. 2 Emojis pro Text), keine Rabatte, keine Versprechen.

## 5. Freigabe-Werte (Inhaber trägt ein)
- Artikel-Frontmatter `freigabe: ja` → GitHub-Action veröffentlicht den Blog.
- Queue-Frontmatter `freigabe: ja` = alle vier Kanäle · `nur-gbp` · `nur-social` (FB/IG/LinkedIn) · `nein`.
- Freigabe für Social nur ausführen, wenn der Artikel bereits live ist (HTTP 200 ohne `draft`); sonst Social eine Woche schieben und in der Mail melden.

## 6. Themenwahl (`themen.md`)
- Reihenfolge: Status `offen` → Fenster passt zum Laufdatum (oder leer) → Priorität 1 vor 2 vor 3 → bei Gleichstand Keyword mit mehr GSC-Impressionen (28 Tage) → sonst Listenreihenfolge.
- Themen mit Status `faktencheck` erst, wenn Spalte „Fakten“ gefüllt ist.
- Liste leer oder nur `faktencheck` → kein Artikel, Mail mit Bitte um Nachschub. Claude erfindet keine Themen.

## 7. Repo-Schreibweg (technisch, Stand 21.10.2026)
- **GitHub ist die Quelle der Wahrheit** (Repo `ben69mikail/liar-entertainer-relaunch`, Branch `main`). Der Inhaber setzt Freigaben direkt auf GitHub; der lokale Ordner `Homepages KUNST` kann veraltet sein und wird von den Tasks nicht als Quelle benutzt.
- Jeder Lauf: Repo per `add_repo` (access `push`) anhängen, frisch klonen (`git clone --depth 1`), dort arbeiten, **ein Commit pro Lauf** (`content(<slug>): Entwurf <Datum>` bzw. `content: Verteilung <Datum>`), `git push origin HEAD:main`. Bei Push-Konflikt: `git pull --rebase origin main`, erneut pushen; scheitert es: melden, nicht erzwingen.
- Binärdateien (Fotos) dürfen so mit committet werden. Artikel-Bilder nach `site/public/blog-images/<slug>/` (cover.jpg, inline-1.jpg …) **oder** direkt die Pool-URL `https://liar-entertainer.com/content-fotos/<datei>` nutzen.
- Neue Fotos aus `C:\Users\ben_m\OneDrive\Desktop\Für Homepage` nur, wenn der Lauf Zugriff auf den Computer hat (Gerät verbunden); sonst überspringen und in der Mail „neue Fotos nicht geprüft (PC aus)“ melden.
- Bilder mit erkennbaren Kindern ohne „Einwilligung: ja“ und Zeitungsartikel werden **nicht** ins Repo gelegt (öffentlich!). Sie stehen in `fotos.md` mit „lokal (nicht im Repo)“.
- Commits mit `[skip netlify]` im Betreff, wenn nur Entwürfe/Queue/Kataloge geändert werden (kein Deploy nötig). Veröffentlichung macht die GitHub-Action `auto-publish.yml` (täglich 07:30 oder manuell), Netlify baut deren Commit.
- **Social-Posts (Facebook/Instagram/LinkedIn + Story) laufen über n8n**: Workflow `LIAR-2026-07 Social-Post` (ID `ZLm26Qc0IosVPprm`) per n8n-Connector `execute_workflow`, Webhook-Body siehe `docs/content/queue/README.md`. Kein zweites System (kein Metricool) für diese Kanäle – sonst Doppelposts.
- Spontane Artikel (Auftritte) erstellt der Inhaber per Telegram über n8n (`LIAR-2026-08 Spontan-Artikel`); sie landen direkt mit Freigabe im Repo und brauchen keine Queue-Datei.
