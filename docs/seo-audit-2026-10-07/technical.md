# Technisches SEO-Audit – https://liar-entertainer.com (Live, 07.10.2026)

Methode: Live-Crawl mit Node `fetch` (max. 5 parallel) über alle 158 Sitemap-URLs, dazu alle internen Links (unique, außerhalb der Sitemap), alle referenzierten Bilder/Assets (564, HEAD), externe Links (18) und gezielte Stichproben mit `curl` für Redirects und Legacy-URLs. Kein Lighthouse/PSI: Core Web Vitals sind aus dem HTML abgeleitet (Seitengewicht, Requests, LCP-Bild-Attribute).

## Gesamtnote: **84 / 100**

| Kategorie | Status | Kommentar |
|---|---|---|
| Crawlability (robots.txt, Sitemap) | PASS | robots.txt sauber, Sitemap 158/158 = 200 |
| Indexierbarkeit (Canonical, noindex, Duplikate) | PASS mit Einschränkung | intern perfekt; **domainübergreifendes Duplikat mit zauberer-liar.de** |
| Redirects | PASS mit Einschränkung | www/http/netlify.app korrekt; Doppel-Hop http://www; Catch-all → /blog/ |
| Interne Links | WARN | 1 sitewide 301-Link (Footer), 1 Link auf nicht existierende Subdomain |
| Bilder | WARN | 1 kaputtes Bild, 40 Blogartikel-Bilder ohne width/height, /blog/ lädt Originale |
| Security-Header | PASS mit Einschränkung | HSTS ohne includeSubDomains/preload, kein CSP |
| Mobil | PASS | Viewport auf allen Seiten, `lang="de"` überall |
| Core Web Vitals (Quellcode-Indizien) | PASS mit Einschränkung | LCP-Bilder eager + fetchpriority high, aber ~80 KB Inline-CSS pro Seite |
| Strukturierte Daten | PASS | Auf allen 158 Seiten gültiges JSON-LD, keine Parserfehler |
| JS-Rendering | PASS | Statisches SSG-HTML, 1 Modul-Script, Inhalte ohne JS sichtbar |
| hreflang / FR / EN | PASS (wie gewollt) | keine hreflang-Annotationen, FR/EN noindex und nicht in der Sitemap |
| IndexNow | FAIL (Low) | kein IndexNow-Key gefunden |

### Was gut ist (Belege)
- **Sitemap**: 158 URLs, alle **200**, keine Weiterleitungen, kein `noindex`, **alle self-canonical**, genau **1 H1** pro Seite, **keine doppelten Titles, Descriptions oder H1**. Alle Seiten haben eine Description und `og:image`.
- **Keine Seite ohne interne Links**: jede Sitemap-URL hat mindestens einen eingehenden internen Link.
- **Redirects**: `http://liar-entertainer.com/` → 301 https; `https://www.liar-entertainer.com/kindergeburtstag/` → 301 Apex; `https://liar-entertainer-relaunch.netlify.app/zauberer/` → 301 Apex; `/kindergeburtstag` → 301 mit Slash; `/Kindergeburtstag/` → 301 kleingeschrieben; `/sitemap_index.xml` → 301 `/sitemap.xml`.
- **Legacy WordPress**: `/clown/xyz` 410, `/attachment/bild/` 410, `/wp-content/uploads/…` 410, `/category/…` und `/tag/…` 301 → /blog/, `/feed/` 301 → /blog/, `/wp-admin/`, `/wp-login.php`, `/xmlrpc.php` 301 → /. `/?p=123` und `/?page_id=5` liefern 200 mit Canonical auf `/` (und sind per robots.txt gesperrt) – unkritisch.
- **Parameter**: `/kindergeburtstag/?utm_source=x` → Canonical auf die saubere URL. `/index.html` → 200, Canonical `/`.
- **FR/EN**: `/fr/`, `/en/`, `/fr/anniversaire-enfant/` → `noindex,follow`, self-canonical, `<html lang="fr">`, nicht in der Sitemap, keine `<link rel="alternate" hreflang>`. Das einzige `hreflang` steht als Attribut am `<a>` im Sprachumschalter (harmlos). Deutsche Seiten verlinken /fr/ und /en/ nicht.
- **Kategorie-Seiten**: Nicht-Sitemap-Kategorien (z. B. `/blog/kategorie/gladbeck/`, `/blog/kategorie/ratgeber/`) sind `noindex,follow` – konsistent.
- **Caching und Komprimierung**: HTML per Brotli (Startseite 162 KB → **33 KB** übertragen); `/_astro/*` mit `max-age=31536000, immutable`.
- **LCP-Bilder** auf /kindergeburtstag/ und /zauberer/: `loading="eager" fetchpriority="high"` mit `width`/`height` und `srcset`. Fonts der LCP-Texte werden per Preload geladen.

---

## Befunde

### CRITICAL

#### C1 – zauberer-liar.de läuft noch auf IONOS → domainübergreifender Duplicate Content mit 15 jetzt indexierbaren Seiten
- **Beleg**: `zauberer-liar.de` löst noch auf **217.160.0.180** und eine IPv6-Adresse von IONOS auf (`Server: Apache`), nicht auf Netlify (75.2.60.5).
  - `https://zauberer-liar.de/` → **200**, `canonical = https://zauberer-liar.de/`
  - `https://zauberer-liar.de/zauberer-essen.html` → **200**, self-canonical
  - `https://zauberer-liar.de/close-up-zauberer.html` → **200**, self-canonical
  - Die alte Sitemap `https://zauberer-liar.de/sitemap.xml` ist weiter aktiv.
- Gleichzeitig stehen `https://liar-entertainer.com/zauberer/close-up/` und 14 Seiten `/zauberer/zauberer-in-<stadt>/` (lastmod 2026-10-07) **indexierbar in der Sitemap** (`ZAUBERER_CITIES_LIVE = true`). Der Inhalt ist 1:1 übernommen. Damit gibt es genau den Duplicate Content, den das Flag verhindern sollte. Die Netlify-301s (`_redirects`) greifen erst, wenn die DNS-Einträge von zauberer-liar.de auf Netlify zeigen.
- Nebenbefund: Ordner-URLs auf der alten Domain wie `https://zauberer-liar.de/close-up-zauberer/` liefern 301 auf `https://zauberer-liar.de/index.html` (Weiterleitung der alten .htaccess auf `index.html`).
- **Fix**: Sofort die DNS-Einträge von zauberer-liar.de bei IONOS umstellen (A `@` + `www` → 75.2.60.5, AAAA löschen, MX unverändert). Danach prüfen:
  - Jede alte URL aus der alten Sitemap liefert in **einem Hop** 301 auf die neue Zielseite.
  - Change-of-Address in der GSC für zauberer-liar.de.

  Falls die Umstellung heute nicht geht, bis dahin `ZAUBERER_CITIES_LIVE = false` setzen (noindex, nicht in der Sitemap) oder als Fallback `ops/zauberer-liar.htaccess` auf IONOS einspielen.

### HIGH

#### H1 – Sitewide interner Link auf eine 301-URL (Footer „Clown & Zauberer NRW“)
- **Beleg**: `https://liar-entertainer.com/clown/clown-zauberer/` → **301** → `/clown/clownshow/`. Der Link steht auf **allen 158 Seiten** (Footer, Quelle `site/src/data/site.ts:79`). Der Footer verlinkt `/clown/clownshow/` ohnehin schon direkt; es gibt also zwei Links auf dasselbe Ziel.
- **Fix**: Den Eintrag in `site/src/data/site.ts` entweder entfernen oder direkt auf eine passende 200-Seite zeigen lassen. Den Redirect in `_redirects` für externe Backlinks behalten.

#### H2 – Kaputtes Bild auf /zauberer/zauberer-in-gladbeck/
- **Beleg**: `<img src="assets/img/geburtstagsfeier-gladbeck-2.webp">` (relativer Pfad aus dem zauberer-liar.de-Extrakt) wird zu `https://liar-entertainer.com/zauberer/zauberer-in-gladbeck/assets/img/geburtstagsfeier-gladbeck-2.webp` aufgelöst → **404**. Quelle: `site/src/data/zauberer-cities/gladbeck.json` (Inline-`html`-Block).
- **Fix**: Im Extraktor `scripts/extract-zauberer-cities.ts` relative `<img>`-Pfade im HTML-Block auf das importierte Asset umschreiben, wie bei `heroImg` (laut Projektregel nicht von Hand im JSON ändern). Danach einen Test in `tests/dist/zauberer-cities.test.ts` ergänzen: „kein `src="assets/`“.

### MEDIUM

#### M1 – Catch-all `/:slug → /blog/ 301` erzeugt Soft-404-Signale und falsche Ziele
- **Beleg** (`site/public/_redirects` Zeile 766):
  - `https://liar-entertainer.com/nichtvorhanden-xyz/` → 301 `/blog/`
  - `https://liar-entertainer.com/foo` → 301 `/blog/`
  - `https://liar-entertainer.com/datenschutz/` → 301 **`/blog/`** (Nutzer erwarten die Datenschutzerklärung `/datenschutzerklaerung-2/`)
  - Uneinheitlich dazu: `/abc/def/` → 404, `/zauberer/gibtsnicht/` → 410, `/kindergeburtstag/gibtsnicht/` → 404.
- Google wertet massenhafte Weiterleitungen auf eine thematisch fremde Übersichtsseite als Soft-404. Echte Fehler-URLs werden dadurch in der GSC nicht mehr sichtbar.
- **Fix**: Catch-all auf die konkret bekannten Alt-Post-Slugs aus GSC/Wayback begrenzen (Einzelregeln, ist teilweise schon vorhanden), alles andere als echtes **404**. Zusätzlich die Regeln `/datenschutz/` → `/datenschutzerklaerung-2/` und ggf. `/agb/` → `/agbs/` anlegen.

#### M2 – 40 Blogartikel: Inhaltsbilder ohne width/height (CLS-Risiko)
- **Beleg**: alle 40 BlogPosting-Seiten, z. B.
  - `https://liar-entertainer.com/blog/kidzival-2024/` → `<img src="/blog-images/kidzival-2024/clown-zauberer-kinderfestival-rockbuehne.jpg" loading="lazy" class="bp-legacy-img">` ohne Maße
  - `https://liar-entertainer.com/blog/haltern-clown-in-freiheit/` (3 Bilder)
  - `https://liar-entertainer.com/blog/nussknacker-weihnachtsmarkt-gladbeck/`
- **Fix**: `width`/`height` beim Ersetzen in `src/utils/legacyImages.ts` und bei Markdown-Inline-Bildern aus den echten Bildmaßen setzen (die Maße zur Build-Zeit per `sharp`/`image-size` lesen). Alternativ `aspect-ratio` per CSS auf `.bp-legacy-img` setzen.

#### M3 – /blog/ lädt 30 Original-JPGs statt Card-Thumbs (~3,7 MB)
- **Beleg**: `https://liar-entertainer.com/blog/` referenziert 30 Bilder aus `/blog-images/…` (zusammen **3.761 KB**) und nur 10 aus `/card-thumbs/`. Beispiel: `/blog-images/tierparkfest-recklinghausen/familienfest-park-zaubershow-clown-liar.jpg` mit **330 KB**, angezeigt mit 400×240. Dieselben Originale nutzen auch die Kategorie-Seiten (`/blog/kategorie/allgemein/`, `/kultur-nrw/`, `/termine/`, `/pantomime-nrw/`). Zwar `loading="lazy"`, aber beim Scrollen fällt viel Datenvolumen an (mobil schlecht für INP und Datenverbrauch).
- **Fix**: `scripts/generate-card-thumbs.mjs` auch für Karten erweitern, deren Cover aus `/blog-images/` kommt (Altartikel). Ziel: WebP, ~600 px breit, < 60 KB, plus `srcset`.

#### M4 – ~75–83 KB Inline-CSS auf jeder Seite (nicht cachebar)
- **Beleg**: Startseite: HTML 161 KB, davon **83 KB `<style>`** und 11 KB Inline-Script; /zauberer/ 79 KB; /galerie/ 77 KB. HTML-Median über alle 158 Seiten: **144 KB** (Bereich 112–172 KB), 0 externe Stylesheets.
- Für das erste Laden ist das in Ordnung (kein renderblockierender Request). Bei jeder weiteren Seite wird das CSS aber neu übertragen, weil HTML mit `max-age=0` ausgeliefert wird. Das große DOM/CSSOM passt zur bekannten Erstlayout-Aufgabe von ~770 ms (Lighthouse /zauberer/ 86–91).
- **Fix**: In `astro.config` `build.inlineStylesheets: 'auto'` statt `'always'` setzen. Dann wird nur kleines kritisches CSS inline ausgeliefert, der Rest als `/_astro/*.css` (immutable gecacht). Danach den Lighthouse-Median neu messen. Zusätzlich ungenutztes CSS entfernen: kids-kit.css und siderays.ts sind laut Projektnotizen ungenutzt.

#### M5 – Interner Link auf nicht existierende Subdomain
- **Beleg**: `https://liar-entertainer.com/blog/pantomime-auf-dem-appeltatenfest/` verlinkt `https://www.pantomime.liar-entertainer.com/`. Der DNS-Name ist nicht auflösbar (Fehler).
- **Fix**: Link in `src/data/scraped-pages.json` bzw. in der Artikelquelle auf `https://www.pantomime-la-france.eu/` (wird schon im Footer verlinkt) oder auf eine interne Seite ändern.

### LOW

#### L1 – Doppel-Hop http://www → https://www → Apex
- **Beleg**: `http://www.liar-entertainer.com/zauberer/` → 301 `https://www.liar-entertainer.com/zauberer/` → 301 `https://liar-entertainer.com/zauberer/` (**2 Hops**). Ursache ist das Standardverhalten von Netlify (erst HTTPS, dann Domain).
- **Fix**: Optional `http://www.liar-entertainer.com/* https://liar-entertainer.com/:splat 301!` in `_redirects` eintragen. Wirkt nur, wenn Netlify die Regel vor dem HTTPS-Upgrade auswertet; sonst bleibt es unkritisch.

#### L2 – Security-Header unvollständig
- **Beleg** (`curl -I https://liar-entertainer.com/`): vorhanden sind `Strict-Transport-Security: max-age=31536000` (ohne `includeSubDomains; preload`), `X-Content-Type-Options`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy`, `Permissions-Policy`. Es **fehlt** `Content-Security-Policy`.
- **Fix**: In `netlify.toml` bzw. `_headers` zunächst eine CSP im Modus `Content-Security-Policy-Report-Only` setzen (`default-src 'self'; img-src 'self' data: https:; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; frame-src https://www.youtube-nocookie.com https://www.google.com; form-action 'self'`), danach scharf schalten. HSTS erst dann um `includeSubDomains` ergänzen, wenn alle Subdomains HTTPS sprechen (die Mail-Subdomains bei IONOS vorher prüfen).

#### L3 – Kein IndexNow
- **Beleg**: Im `public/` gibt es keine Key-Datei (`<32-hex>.txt`), es findet kein Ping statt.
- **Fix**: Key-Datei nach `site/public/<key>.txt` legen und nach jedem Netlify-Deploy die geänderten URLs an `https://api.indexnow.org/indexnow` senden (Netlify-Build-Plugin oder Post-Deploy-Function). Gerade nach dem Relaunch und für die 15 übernommenen zauberer-liar-Seiten beschleunigt das Bing/Yandex/Naver.

#### L4 – Großes Fallback-Bild in `src` des Porträts
- **Beleg**: Auf `https://liar-entertainer.com/` zeigt `src` auf `/_astro/michael-prescler-portrait.B4FHf2xx_ZYxqqV.webp` mit **662 KB** und `width="2560"`. Moderne Browser nutzen das `srcset` (max. 900w), deshalb geringe Auswirkung. Crawler und Vorschaugeneratoren holen aber oft `src`.
- **Fix**: Im `<Image>`/`<Picture>` `width={900}` setzen, damit auch `src` die 900er-Variante bekommt.

#### L5 – Eigen-Preconnect ohne Nutzen
- **Beleg**: `<link rel="preconnect" href="https://liar-entertainer.com">` auf jeder Seite. Zur eigenen Origin besteht die Verbindung bereits.
- **Fix**: Entfernen.

#### L6 – Weitere Kleinigkeiten
- **Descriptions knapp über 160 Zeichen** (161–162): `/`, `/kindergeburtstag/`, `/zauberer/`, `/zauberer/zaubershow/schule/`, `/zauberer/zaubershow/strassen-sommer-fest/`, `/blog/kategorie/clown-unterhaltung/`. Wegen L1 (keine Content-Änderung) bewusst so gelassen; der Snippet-Abschnitt ist minimal.
- **Kurze Titles** (< 30 Zeichen): `/clown/clownshow/clown-in-castrop-rauxel/` („Clown Castrop-Rauxel | Buchen“), `/blog/pantomime-bei-extraschicht/`, `/blog/haltern-clown-in-freiheit/`, `/blog/zaubershow-in-dortmund/`. Bei Gelegenheit um Marke/Ort ergänzen.
- **Schwach verlinkte Seiten** (≤ 2 eingehende interne Links): `/clown/clownshow/clown-in-moers/` (1), `/clown/clownshow/clown-in-castrop-rauxel/`, `…/clown-in-waltrop/`, `…/clown-in-wesel/`, `/kinderzauberer/kinderzauberer-in-castrop-rauxel/`, `…-waltrop/`, `…-xanten/`, `/blog/10-tipps-fuer-den-perfekten-kindergeburtstag/`, die indexierbaren Kategorien `/blog/kategorie/allgemein/`, `/termine/`, `/kultur-nrw/`, `/zauberei/`, `/clown-unterhaltung/` (je 1). In den Städtelisten der Nachbarstädte sind Orte wie „Moers“, „Castrop-Rauxel“ und „Duisburg“ reiner Text ohne Link (z. B. `src/data/cities/clownshow.json`). Diese per Extraktor verlinken, sofern eine Stadtseite existiert.
- **Sitemap-lastmod**: Nach dem visuellen Relaunch stehen 62 URLs noch auf 2023-08-xx. Das ist korrekt, solange sich der Inhalt nicht geändert hat (Google wertet lastmod nur bei echten Inhaltsänderungen). Nicht pauschal auf heute setzen.
- **Rechtstexte indexierbar** (`/impressum/`, `/datenschutzerklaerung-2/`, `/agbs/` in der Sitemap, `index`): unkritisch. Wer die Snippet-Fläche sauber halten will, setzt `noindex,follow` und nimmt sie aus der Sitemap (Meta-Baseline beachten → `meta-changes.json`).
- **Externe Links mit Fehlern** (je 1×, in Altartikeln): `https://www.kc-wittringer-ritter.de/` (DNS-Fehler), `https://www.ostseebad-prerow.de/…event.html?…` (404), `https://www.eventim-light.com/…` (403, evtl. Bot-Sperre), zwei `l.facebook.com/l.php?…`-Tracking-Links (durch direkte Ziel-URLs ersetzen), `http://www.reservix.de/` (auf https ändern), `https://zauberer-liar.de/stand-up-aus-frankreich/zaubershow-nrw/` (nach C1 auf die interne Zielseite umstellen).

---

## Core Web Vitals – Indizien aus dem Quellcode

| Seite | HTML roh / Brotli | Inline-CSS | Inline-JS | ext. Scripts | Bilder (inkl. aller srcset-Varianten) | LCP-Bild |
|---|---|---|---|---|---|---|
| `/` | 161 KB / 33 KB | 83 KB | 11 KB | 1 | 11 `<img>` | eager + fetchpriority |
| `/kindergeburtstag/` | 149 KB | 75 KB | 11 KB | 1 | 6 `<img>`, ~765 KB Varianten gesamt | eager + fetchpriority high, 1036×691 |
| `/zauberer/` | 141 KB | 79 KB | 9 KB | 1 | 7 `<img>`, ~781 KB Varianten gesamt | eager + fetchpriority high |
| `/galerie/` | 168 KB | 77 KB | 7 KB | 1 | 39 `<img>` (lazy) | – |
| `/blog/` | 162 KB | 75 KB | 6 KB | 1 | 42 `<img>`, 3,7 MB Original-JPGs | – |

- **LCP**: gute Voraussetzungen (kein renderblockierendes externes CSS/JS, LCP-Bild priorisiert, Fonts vorgeladen). Risiko: 75–83 KB Inline-CSS → Style-/Layout-Aufwand beim ersten Rendern auf schwachen Mobilgeräten.
- **INP**: geringes JS (1 Modul + `fx-rich` per Idle-Import). Risiko: die ~770-ms-Erstlayout-Aufgabe auf /zauberer/ (Projektnotiz). Wenn ein Nutzer in dieser Zeit tippt, verzögert sich die Reaktion.
- **CLS**: Kernseiten haben überall `width`/`height`; Risiko nur bei den Blog-Altbildern (M2).

## JavaScript-Rendering
Reines SSG: Alle Inhalte, Titles, Canonicals und JSON-LD stehen im ausgelieferten HTML. Kein Rendering für die Indexierung nötig.

## Strukturierte Daten (Überblick)
Alle 158 Seiten: `LocalBusiness + WebSite + WebPage`. Zusätzlich auf 87 Stadt- und Leistungsseiten `BreadcrumbList + Service + FAQPage`, auf 40 Blogartikeln `BlogPosting`, auf 10 Seiten `VideoObject`, auf /ueber-mich/ `Person`. Kein `AggregateRating`/`Review` (Nutzerentscheidung). Keine JSON-Parse-Fehler. Hinweis: FAQPage-Rich-Results zeigt Google seit 2023 nur noch für Behörden- und Gesundheitsseiten an. Das Markup schadet nicht, bringt aber keine Snippets.

## Prioritäten-Fahrplan
1. **Heute**: C1 (DNS zauberer-liar.de umstellen oder `ZAUBERER_CITIES_LIVE=false`).
2. **Diese Woche**: H1 (Footer-Link), H2 (Gladbeck-Bild), M5 (Subdomain-Link), M1 (Catch-all eingrenzen + `/datenschutz/`).
3. **Nächste Iteration**: M2–M4 (Bildmaße, Blog-Thumbs, CSS auslagern → Lighthouse-Gate /zauberer/), L2 (CSP), L3 (IndexNow).
