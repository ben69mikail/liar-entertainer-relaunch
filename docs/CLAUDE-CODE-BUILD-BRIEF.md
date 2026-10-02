# liar-entertainer.com — Relaunch Build-Brief (für Claude Code)

> **Für Claude Code / agentische Worker:** Diese Datei ist der verbindliche Projektauftrag. **Lies die GESAMTE Datei, bevor du startest.** Danach schlägst du die Skills vor, mit denen du die besten Ergebnisse erzielst (§Skill-Auswahl), und arbeitest task-by-task. Vor jedem Deploy die Abnahme-Gates (§8) bestehen. Schritte nutzen Checkbox-Syntax (`- [ ]`).

**Goal:** liar-entertainer.com visuell komplett neu gestalten (zwei klar getrennte Design-Welten: Kinder vs. Erwachsenen-Zauberei), **mehrsprachig (DE + FR/EN auf Kernseiten)**, über ein **neues, eigenständiges** GitHub-Repo + Netlify-Projekt ausrollen — **ohne Inhalte, Metas, URLs oder Rankings zu verlieren**.

**Architecture:** Astro (statisch) → GitHub-Repo → Netlify-Build/Deploy mit Netlify-CDN. Domain bleibt bei IONOS registriert, DNS zeigt auf Netlify. Sektions-basiertes Theming erzeugt zwei Gestaltungszonen auf **einer** Domain. zauberer-liar.de wird per 301 in die `/zauberer/`-Sektion konsolidiert. Mehrsprachigkeit über `/` (DE), `/fr/`, `/en/` mit hreflang (nur Kernseiten).

**Tech Stack:** Astro + TypeScript (bestätigt), Astro i18n-Routing, modulares CSS mit Design-Tokens (zwei Theme-Sets), View-Transitions/Scroll-Animationen (sparsam, performant), Netlify (Hosting/CDN/Redirects/HTTPS), GitHub, Google Search Console.

**Projekt-Root (verbindlich, verbunden):** C:\Users\ben_m\Claude\projects\Homepages KUNST

---

## Entscheidungen (geklärt 02.10.2026)

- **E1 — zauberer-liar.de → 301** auf `liar-entertainer.com/zauberer/`. Der elegante „Zauberer"-Look wird die Optik der `/zauberer/`-Sektion.
- **E2 — Mehrsprachig:** Deutsch (Standard) **+ Französisch (`/fr/`) + Englisch (`/en/`)** von Anfang an, mit hreflang — **aber nur für die Kernseiten**. Stadtseiten und Blog bleiben vorerst **nur DE**. Zielmärkte FR/EN: überregional, frankophon (BE/FR/LU/CH) und international.
  - **Kernseiten (FR/EN):** Startseite, Haupt-Leistungsseiten (`/zauberer/`, `/zauberer/close-up/`, `/zauberer/tisch-zauberer/`, `/zauberer/zaubershow/`, `/kinderzauberer/`, `/kindergeburtstag/`, `/clown/clownshow/`), `/ueber-mich/`, `/kontakt/`. (Umfang anpassbar.)
- **E3 — Reihenfolge:** Erst den 301 schalten (Ziel `/zauberer/` existiert → risikoarm), 4–6 Wochen messen; parallel den neuen Build auf Netlify-Preview entwickeln; DNS-Cutover der Hauptseite im Herbst-Tief, nicht vor der Hochsaison.
- **D1 — „tasteskill/polish":** Geschmacks-/Feinschliff-Pass über `impeccable` (Text), `ui-ux-pro-max` + `frontend-design` (visuell). Falls ein dedizierter „taste/polish"-Skill im Marketplace existiert → installieren und nutzen.
- **D2 — Blog:** **kompletter Blog inkl. aller Artikel 1:1 übernehmen.** Die bestehende Automatik (**n8n + Webhook**) bleibt **vorerst unverändert**; wie es mit dem Blog weitergeht, entscheidet der Nutzer in den nächsten Tagen. Bis dahin **nicht umbauen**.
- **D3 — Astro:** bestätigt. Ideal für Netlify + SEO.

---

## 0. Leitplanken (nicht verhandelbar)

- [ ] **L1 — Visueller Relaunch, kein Content-Rewrite.** Deutsche Inhalte, Titles, Meta-Descriptions, H-Struktur, Schema/JSON-LD, Canonicals, `sitemap.xml`, `robots.txt`, `llms.txt` werden **1:1 übernommen**. Nur Design/Layout neu. Kleine Meta-Verbesserungen nur **dokumentiert** in `docs/CHANGES-METAS.md`.
- [ ] **L2 — URL-Vertrag (DE) einfrieren.** Jede heute indexierte deutsche URL bleibt **exakt** gleich (200) oder bekommt einen bewussten 301. Keine Pfad-/Slug-/Trailing-Slash-Änderung. (~1.710 Klicks/Quartal, Pos 1–2 für „zauberer gladbeck/bottrop/dorsten".) FR/EN sind **additiv** unter `/fr/` bzw. `/en/` und berühren den DE-Vertrag nicht.
- [ ] **L3 — Keine erfundenen Fakten (Karpathy).** Keine neuen Preise/Leistungen/Orte/Bewertungen erfinden. Übersetzungen FR/EN sind inhaltstreu.
- [ ] **L4 — Kein Blind-Cutover.** Erst Netlify-Preview vollständig abnehmen (§8), dann DNS. TTL vorher senken, Rollback bereit.
- [ ] **L5 — Projekt-Trennung.** Neues Repo, neues Netlify-Projekt, Ordner `Homepages KUNST`. Nichts ans Altprojekt anhängen.
- [ ] **L6 — Visuelle Konstanten erhalten.** **Logo, Favicon und definierte Schlüssel-Fotos bleiben unverändert** (Wiedererkennungswert). Diese werden als „fix" markiert und nicht ersetzt.
- [ ] **L7 — Bild-Content-Fit (Bildredaktion).** Jedes nicht-fixe Foto muss **thematisch zur Unterseite passen** (siehe §Bildredaktion). Fehlbesetzungen (z. B. Event-Foto auf einer Kindergeburtstag-Seite, oder 4–5 Kinder im Freien bei Karnevals-Inhalt) sind nicht zulässig.

---

## Qualitätskriterien & UX-Ziele (Maßstab für die Abnahme)

Die Seite soll sein: **schnell, angenehm, unterhaltsam — mit einigen Animationen.** Konkret:
- **Schnell:** Lighthouse Performance ≥ 90 mobil, LCP < 2,5 s, CLS < 0,1. Animationen dürfen Performance/CLS nicht verschlechtern (GPU-freundlich, `prefers-reduced-motion` respektieren).
- **Angenehm & unterhaltsam:** dezente, hochwertige Animationen (Scroll-Reveals, sanfte Übergänge, zonen-typische Effekte — verspielt in Kids, elegant/„magisch" in Adult). Nie aufdringlich.
- **Bewertungen prominent:** Die 5★-Bewertungen (Google u. a.) sind ein **zentrales Vertrauens-Element** — oberhalb des Folds sichtbar, auf Money-Pages wiederholt, mit `AggregateRating`/`Review`-Schema (nur reale Werte).
- **Eltern schnell zu den Infos:** Auf dem Kinder-Pfad (Clown/Kindergeburtstag) führen Eltern in **≤ 2 Klicks** zu: Was wird geboten, Dauer/Ablauf, Preis (150 € Kindergeburtstag), Verfügbarkeit/Anfrage, Bewertungen. Sticky-CTA „Anfragen" + Telefon/WhatsApp immer erreichbar.

---

## Skill-Auswahl (vor Baubeginn)

- [ ] **S1** Claude Code liest **zuerst diese komplette Datei**, dann das Inventar (§2).
- [ ] **S2** Danach schlägt Claude dem Nutzer eine **Skill-Auswahl** vor und wählt die für das Ergebnis besten. Vom Nutzer gewünschte Basis: `anthropic-skills:frontend-design`, `everything-claude-code:design-system`, `ui-ux-pro-max:ui-ux-pro-max`, `impeccable:impeccable` (+ „taste/polish", D1). Ergänzend sinnvoll: `everything-claude-code:seo` (nur Erhalt/Verifikation), `deployment-patterns`, `github-ops`, ggf. ein Animations-/Frontend-Pattern-Skill. Nutzer hat „alle für wichtig erachteten Skills" freigegeben.

---

## Phase 1 — Projekt-Setup & Trennung

- [ ] **1.1** `Homepages KUNST` als Git-Repo initialisieren. Unterordner: `site/` (Astro), `docs/` (Brief, Inventar, Mapping, CHANGES-METAS), `ops/` (Redirects, DNS), `assets-source/` (Verweis auf Bildquelle, §Bildredaktion).
- [ ] **1.2** Neues **GitHub-Repo** anlegen (z. B. `liar-entertainer-relaunch`), lokal verknüpfen. (Owner O1)
- [ ] **1.3** Astro-Grundgerüst in `site/` (`npm create astro@latest`), statischer Output, Node-LTS, **i18n-Routing** (de default, fr, en). Commit.
- [ ] **1.4** Neues **Netlify-Projekt** mit dem Repo verbinden (Build `npm run build`, Publish `dist/`), vorerst nur Preview-Subdomain. (Owner O2)
- [ ] **1.5** `CLAUDE.md` im Repo-Root (Kurzfassung + Leitplanken L1–L7) ablegen.

---

## Phase 2 — Inhalts-, URL-, Meta- & Bild-Inventar (Pflicht VOR dem Design)

- [ ] **2.1** `liar-entertainer.com/sitemap.xml` crawlen → `docs/url-inventory.csv` (URL, Titel, Meta-Description, H1, Canonical, Schema-Typen, lastmod). Sektionen: `/`, `/clown/*`, `/zauberer/*`, `/kinderzauberer/*`, `/kindergeburtstag/*`, `/preise/`, `/galerie/`, `/kontakt/`, `/ueber-mich/`, `/blog/*`.
- [ ] **2.2** Bestehenden Quellcode/Repo lokalisieren und sichten (Astro-Migration; Inhalte/Metas/Schema von dort nehmen, zuverlässiger als Crawl).
- [ ] **2.3** Seiteninhalte als Content-Quellen (`site/src/content/`, pro Sprache) ablegen — DE 1:1; FR/EN als inhaltstreue Übersetzungen **nur für Kernseiten** (Nutzer prüft FR/EN gegen; er ist frz. Muttersprachler, spricht EN).
- [ ] **2.4** **Bild-Inventar** `docs/image-inventory.csv`: vorhandene Seitenbilder (Pfad, Alt-Text, Maße) **plus** die bereitgestellte Bildquelle (§Bildredaktion) — inkl. der aus Blog-Fototiteln ableitbaren Stadt + Event-Art. Schlüssel-Fotos/Logo/Favicon als `fix=true` markieren (L6).
- [ ] **2.5** `robots.txt`, `sitemap.xml`, `llms.txt`, Rechtstexte sichern.
- [ ] **Gate 2:** `url-inventory.csv` vollständig vs. `sitemap.xml` (0 fehlende URLs).

---

## Phase 3 — Design-System & zwei Gestaltungszonen

- [ ] **3.1** Design-Tokens (`site/src/styles/tokens.css`), zwei Theme-Sets:
  - **Zone KIDS** (bunt, verspielt, hell) — `/kindergeburtstag/*`, `/kinderzauberer/*`, `/clown/*`, Kindershow/Kinderevents/Kinderveranstaltungen.
  - **Zone ADULT/ZAUBER** (elegant, dunkel, „zauberhaft", Orientierung aktuelle zauberer-liar.de) — `/zauberer/`, `/zauberer/close-up/`, `/zauberer/tisch-zauberer/`, `/zauberer/buehnen-zauberer/`, `/zauberer/zaubershow/`, `/zauberer/hochzeit/`, `/zauberer/firmenfeier/`.
- [ ] **3.2** Zonen-Umschaltung via `data-zone="kids|adult"` am Layout, pro Routen-Sektion. Gemeinsame Komponenten erben die Zonen-Tokens. Animationen zonen-typisch (verspielt vs. elegant), `prefers-reduced-motion` respektieren.
- [ ] **3.3** Startseite `/`: „Dach"-Einstieg mit zwei klar getrennten Einstiegen „Für Kinder" / „Für Erwachsene"; Bewertungen above the fold.
- [ ] **3.4** Skills anwenden (S2). WCAG 2.2 AA, Mobile-First.
- [ ] **3.5** Zwei Zonen-Prototypen (Kids: `/kindergeburtstag/`; Adult: `/zauberer/`) dem Nutzer zur Freigabe vorlegen, bevor alles ausgerollt wird.
- [ ] **Gate 3:** Nutzer-Freigabe der zwei Zonen.

---

## Bildredaktion (Bildauswahl-Regeln, L6/L7)

- [ ] **B1** **Bildquelle:** `C:\Users\ben_m\OneDrive\Desktop\Für Homepage` — **alle Unterordner** nutzbar. **Zusätzlich** alle Fotos verwenden, die bereits auf der aktuellen Seite im Einsatz sind. Die Ordner-Fotos dürfen auch genutzt werden, um einzelne Seitenfotos zwischendurch auszutauschen/zu ersetzen. In `docs/image-sources.md` dokumentieren.
- [ ] **B2** **Fix-Assets nie ersetzen:** Logo, Favicon, definierte Schlüssel-Fotos (Wiedererkennung).
- [ ] **B3** **Content-Fit:** Jedes Bild muss zum Thema/zur Unterseite passen. Negativ-Beispiele (verboten): Event-/Großveranstaltungs-Foto auf einer Kindergeburtstag-Seite; bei Karnevals-Inhalt ein Foto mit nur 4–5 Kindern im Freien.
- [ ] **B4** **Orientierung über Fototitel:** Blog-/Quellfotos tragen Titel mit **Stadt + Event-Art** — danach die passende Seite/Stadt/Anlass zuordnen.
- [ ] **B5** Alt-Texte beschreibend, lazy-loading, WebP, korrekte Maße (CLS-sicher).

---

## Phase 4 — Seiten-Build (DE vollständig, FR/EN nur Kernseiten)

- [ ] **4.1** Astro-Routing: **jede DE-URL exakt** erzeugen (L2). FR/EN additiv unter `/fr/…` bzw. `/en/…` **nur für die Kernseiten (E2)**, mit `hreflang`-Alternates (de/fr/en + x-default) nur auf diesen Seiten. Reine DE-Seiten ohne FR/EN-Alternate.
- [ ] **4.2** Inhalte 1:1 (DE) bzw. inhaltstreu (FR/EN, Kernseiten) einsetzen; Titles/Meta/JSON-LD je Sprache. `AggregateRating`/`Review`-Schema mit realen Werten.
- [ ] **4.3** **Blog `/blog/*`** vollständig übernehmen (siehe §Blog-Migration). **Nur DE.** Bestehende Posts statisch 1:1.
- [ ] **4.4** Neue Ziel-Leistungsseite `/zauberer/close-up/` anlegen (für den 301; „close up zauberer" heute Pos 48), real & knapp, Adult-Theme.
- [ ] **4.5** `sitemap.xml`, `robots.txt`, `llms.txt`, `404`, Favicons (fix), OG-Bilder.
- [ ] **Gate 4:** Build grün (EXIT 0); DE-Seitenzahl ≥ Inventar; FR/EN-Kernseiten vorhanden.

---

## Blog-Migration (D2)

- [ ] **BL1** **Alle** bestehenden Blog-Posts als Astro-Content (Markdown) ins neue Repo migrieren (Inhalte/Metas 1:1, nur DE, Bilder gemäß Bildredaktion). Nichts auslassen.
- [ ] **BL2** **Automatik vorerst NICHT umbauen.** Das bestehende System (n8n + Webhook) bleibt unverändert, bis der Nutzer entscheidet, wie es mit dem Blog weitergeht (in den nächsten Tagen). Nur dokumentieren, nicht verändern.
- [ ] **BL3** Aufbau der Alt-Automatik (n8n-Flow, Webhook, Tokens) in `ops/blog-automation.md` festhalten — für die spätere Entscheidung/Migration.

---

## Phase 5 — SEO-Erhalt-Verifikation (Parität)

- [ ] **5.1** `ops/check-parity.mjs`: je DE-URL Preview vs. Live auf identische `<title>`, Meta-Description, Canonical, JSON-LD-Typen → `docs/parity-report.md`.
- [ ] **5.2** Abweichungen auf 0 (außer dokumentierte Mini-Verbesserungen).
- [ ] **5.3** hreflang-Validierung (de/fr/en + x-default, bidirektional korrekt — nur auf den Kernseiten).
- [ ] **Gate 5:** Parität-Report 0 unbeabsichtigte Abweichungen; hreflang valide.

---

## Phase 6 — 301-Konsolidierung zauberer-liar.de (zuerst live)

- [ ] **6.1** Sicherstellen, dass alle 301-Zielseiten existieren (`/zauberer/*` + neue `/zauberer/close-up/`).
- [ ] **6.2** Seitengenaue 301-Mapping-Tabelle (`ops/redirects-zauberer-liar.csv`), 1:1, nicht pauschal auf Start:

  | zauberer-liar.de (alt) | → 301-Ziel |
  |---|---|
  | `/` | `/zauberer/` |
  | `/kinderzauberer.html` | `/kinderzauberer/` |
  | `/close-up-zauberer.html` | `/zauberer/close-up/` |
  | `/tisch-zauberer.html` | `/zauberer/tisch-zauberer/` |
  | `/walk-act-zauberer.html` | `/clown/walk-act/` |
  | `/buehnenshow.html` | `/zauberer/buehnen-zauberer/` |
  | `/zaubershow-erwachsene.html` | `/zauberer/zaubershow/` |
  | `/fotogalerie.html` | `/galerie/` |
  | `/videogalerie.html` | `/galerie/` |
  | `/referenzen.html` | `/ueber-mich/` |
  | `/kontakt.html` | `/kontakt/` |
  | `/zauberer-{stadt}.html` (21x) | `/zauberer/` |
  | Rechtstexte | jeweiliges Pendant |

- [ ] **6.3** 301 auf dem aktuellen zauberer-liar.de-Host umsetzen (IONOS/Apache → `.htaccess`). Domain bleibt als Weiterleitung aktiv. (Owner O3)
- [ ] **6.4** `curl -sI` je Alt-URL → `301` + korrektes `Location` → `docs/redirect-check.md`.
- [ ] **6.5** **GSC zauberer-liar.de:** Property behalten, 301 per URL-Prüfung bestätigen, alte Sitemap vorerst eingereicht lassen, **Change-of-Address** nutzen, falls Google den Ziel-Host akzeptiert. (Owner O4)
- [ ] **6.6** 4–6 Wochen beobachten (Impressionen wandern zu `/zauberer/`, keine 404-Spitzen).
- [ ] **Gate 6:** Alle Alt-URLs 301 (0 Fehler); keine neuen 404-Cluster.

---

## Phase 7 — Deploy & DNS-Cutover (Netlify statt IONOS)

- [ ] **7.1** Netlify Custom-Domain `liar-entertainer.com` (+ `www`), Let's-Encrypt-HTTPS.
- [ ] **7.2** DNS-Weg (Owner O5, IONOS-DNS) — **eine** Variante:
  - **A (empfohlen, Netlify-DNS):** IONOS-Nameserver auf Netlify-DNS umstellen; Netlify verwaltet Records + CDN.
  - **B (DNS bei IONOS):** Apex als ALIAS/ANAME bzw. A-Record auf Netlifys Load-Balancer (Wert aus Netlify ablesen, historisch `75.2.60.5`), `www` CNAME auf `<site>.netlify.app`. Exakte Werte immer aus Netlify, nie raten.
- [ ] **7.3** Vor Cutover TTL auf 300 s senken (24 h vorher). Altsystem bis Bestätigung erreichbar (Rollback).
- [ ] **7.4** `netlify.toml`/`_redirects`: www↔apex konsistent zum Canonical, HTTP→HTTPS.
- [ ] **7.5** Cutover im Herbst-Tief. Danach Propagation prüfen, HTTPS grün, Kern-URLs 200.
- [ ] **7.6** GSC (liar-entertainer.com): neue Sitemap einreichen, Core-URLs indexieren lassen.
- [ ] **Gate 7:** Live über Netlify, HTTPS gültig, Kern-URLs 200, keine Mixed-Content-Fehler.

---

## Phase 8 — Abnahme-Gates vor Live (alle müssen bestehen)

- [ ] **8.1** URL-Parität: 100 % der DE-Inventar-URLs 200 (oder gewollter 301); 0 unbeabsichtigte 404.
- [ ] **8.2** Meta-/Schema-Parität: `parity-report.md` ohne unbeabsichtigte Abweichung; hreflang valide.
- [ ] **8.3** Lighthouse (mobil) je ≥ 90; LCP < 2,5 s; CLS < 0,1 (auch mit Animationen).
- [ ] **8.4** Mobil/Responsive: beide Zonen fehlerfrei, kein horizontales Scrollen.
- [ ] **8.5** Redirect-Tests: §6-Mapping + www/HTTPS grün.
- [ ] **8.6** Bildredaktion: Stichprobe je Sektion — Bilder passen zum Inhalt (L7), Fix-Assets unverändert (L6).
- [ ] **8.7** UX-Ziele: Bewertungen prominent; Eltern-Pfad ≤ 2 Klicks zu Kerninfos; Sticky-CTA.
- [ ] **8.8** Visuelle QA: Nutzer-Freigabe. Rollback-Plan dokumentiert.

---

## Owner-Aufgaben (benötigen deine Zugänge/Freigaben)

- **O1** GitHub: Repo-Erstellung/Push.
- **O2** Netlify: Konto + GitHub-Verknüpfung.
- **O3** zauberer-liar.de-Hosting (IONOS): Zugriff für `.htaccess`-301.
- **O4** Google Search Console: 301-Verifikation + Change-of-Address.
- **O5** IONOS-DNS: Nameserver-/Record-Änderung für Netlify-Cutover.
- **O6** Ordnerfreigabe `Homepages KUNST` — **erledigt**.

---

## Geklärte Punkte (02.10.2026)

- **P1 — Bildquelle:** `C:\Users\ben_m\OneDrive\Desktop\Für Homepage` (alle Unterordner) + alle bereits genutzten Seitenfotos; Ordner-Fotos auch für späteren Einzelaustausch. (B1)
- **P2 — Blog-Automatik:** läuft mit **n8n + Webhook**; Blog + alle Artikel 1:1 übernehmen, Automatik vorerst unverändert; Weiteres in den nächsten Tagen. (D2/BL)
- **P3 — Sprachumfang:** FR/EN **nur Kernseiten**; Stadtseiten & Blog vorerst nur DE. (E2)
