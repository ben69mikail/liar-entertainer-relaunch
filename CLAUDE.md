# Projekt: liar-entertainer.com Relaunch (Homepages KUNST)

Verbindlicher Auftrag: siehe **docs/CLAUDE-CODE-BUILD-BRIEF.md**. Vor jeder Arbeit komplett lesen.

## Harte Leitplanken
- L1: Visueller Relaunch, KEIN Content-Rewrite. Inhalte/Titles/Metas/Schema/Canonicals/sitemap/robots/llms.txt 1:1 erhalten.
- L2: DE-URL-Vertrag einfrieren (gleiche URLs oder bewusster 301). FR/EN additiv unter /fr/ und /en/, nur Kernseiten.
- L3: Keine erfundenen Fakten/Preise (Karpathy).
- L4: Kein Blind-Cutover - erst Netlify-Preview + Gates, dann DNS.
- L5: Neues Repo, neues Netlify-Projekt, Ordner Homepages KUNST. Vom Altprojekt getrennt.
- L6: Logo, Favicon, Schluessel-Fotos NICHT aendern (Wiedererkennung).
- L7: Bilder muessen zum Seiteninhalt passen (Bildredaktion).

## Eckdaten
- Stack: Astro + Netlify + GitHub. zauberer-liar.de -> 301 auf /zauberer/.
- Sprachen: DE vollstaendig; FR/EN nur Kernseiten; Stadtseiten + Blog nur DE.
- Bildquelle: C:\Users\ben_m\OneDrive\Desktop\Für Homepage (alle Unterordner) + vorhandene Seitenfotos.
- Blog: komplett + alle Artikel 1:1 uebernehmen; Automatik (n8n + Webhook) vorerst unveraendert.

## Technische Entscheidungen (02.10.2026)
- Struktur: `site/` (Astro 7, TS strict), `docs/` (Brief, Inventare), `ops/` (Redirects, DNS, Parity-Check), `assets-source/`.
- Animation: Paket `motion` (Nachfolger framer-motion) als **Vanilla-API, kein React**. Scroll-Reveals via `data-reveal` (+ optional `data-reveal-delay`), Modul `site/src/lib/motion/reveal.ts`. Inhalt ohne JS immer sichtbar; versteckt nur unter `html.motion-ok`, das bei `prefers-reduced-motion` nie gesetzt wird. Nie `data-reveal` auf LCP-Hero. Animationsziel nie `transform: 'none'` (motion -> matrix(0…) = unsichtbar).
- Routing-Wissen zentral in `site/src/lib/site-map.ts`: `zoneFor()` (kids/adult/neutral), `alternatesFor()` (hreflang nur CORE_PAGES), `SITE` = https://liar-entertainer.com (Apex, wie Live-Sitemap). FR/EN mit **übersetzten Slugs** (z. B. /fr/anniversaire-enfant/), Tabelle `CORE_PAGES` = einzige Quelle.
- Zonen (vom Nutzer bestätigt): `/zauberer/zaubershow/kindergarten-kita/`, `/schule/`, `/strassen-sommer-fest/` = kids; Startseite/Kontakt/Preise/Galerie/Blog/Rechtliches = neutral.
- URL-Vertrag: `docs/url-contract-de.txt` (143 URLs aus Live-Sitemap).
- TDD: `npm test` (Unit, site-map) · `npm run test:dist` (Build + Tests gegen `dist/` HTML). Erst Test (RED), dann Code.
- Migration: Altcode (origin/main @ ec7dcd1) übernommen, wird Template für Template umgestaltet. Details + **Drift-Warnung vor Cutover**: `docs/migration-notes.md`.
- Tests: zusätzlich `npm run test:seo` (45 Legacy-SEO-Assertions, muss grün bleiben) und `npm run test:e2e` (braucht `astro preview` auf :4322).
- hreflang erst, wenn FR/EN gebaut: `PUBLISHED_LOCALES` in site-map.ts erweitern. Test `tests/dist/hreflang.test.ts` verbietet Ziele ohne Seite.
- Bewertungen: KEIN AggregateRating/Review-Schema (Nutzerentscheidung). Formular → Netlify Forms, reviews.php → Netlify Function.
- Design v2 (Phase 3): Seiten opt-in per `<BaseLayout design="v2">`. Tokens `site/src/styles/tokens.css` (kids/neutral = Zirkus-Plakat: Fredoka+Nunito, Creme, Logo-Farben, Sticker-Schatten; adult = Zauberei bei Nacht: Playfair+Jost, Nacht/Gold wie zauberer-liar.de). Komponenten `site/src/components/v2/`. Daten zentral `site/src/data/site.ts`.
- Logo je Zone (Nutzerentscheidung): kids/neutral bunt `logo-clown-nrw.png`, adult Gold `brand/logo-liar-gold.webp` (von zauberer-liar.de, unverändert).
- L1-Wächter: `tests/fixtures/content-baseline.json` (aus Alt-Build, aria-hidden ausgenommen). Abweichung erklären: `MSYS_NO_PATHCONV=1 npx tsx scripts/parity-diff.ts /pfad/`. Baseline NIE aus umgebautem Build neu ziehen — nur aus Alt-Stand (git worktree + `SNAPSHOT_DIST`).

## Design-Revision nach Gate-3-Feedback (Grill 04.10.2026, Nutzerentscheidungen)
- Kids-Design bleibt (Zirkus-Plakat), braucht VIEL mehr Animation: Hero-Auftritt, Scroll-Spaß, Mikro-Interaktionen, Zauber-Momente (alle vier).
- Adult NEU: **Spielkarten-Editorial** statt Nacht/Gold (zu nah an zauberer-liar.de, nicht kopieren). Cremepapier, tiefes Schwarz, Karten-Rot, Magazin-Typo **Bodoni Moda + Instrument Sans**. Animationen: Hero-Kartentrick, Scroll „Austeilen“, Hover-Flip/Tilt/magnetische Buttons, Mitmach-Trick „Ziehen Sie eine Karte“ → wird zum Anfrage-Button.
- Adult-Logo: Gold-Logo unverändert auf schwarzer Spielkarten-Rückseite im Header.
- Adult-Fotos: in Farbe, unverändert, im Spielkarten-Rahmen (weißer Rand, runde Ecken, Eckindex).
- Neutral: gemeinsames Cremepapier; Startseite links Zirkus-Plakat „Für Kinder“, rechts Spielkarte „Für Erwachsene“.
- Performance-Gate bleibt hart (Lighthouse mobil ≥ 90): nur transform/opacity, nichts blockiert LCP, kein WebGL/Video-BG.
- L6 Schlüssel-Fotos = Hero-Fotos der Hauptseiten + alle Porträts. Rest darf per L7 getauscht werden.
- Bewertungen: 370+ ist korrekt. „Über 400 …“ auf /zauberer/ wird korrigiert (doku in docs/CHANGES-METAS.md).
- Kein Framer-Motion-Skill verfügbar; Engine `motion` + lokale Skills animate / improve-animations / emil-design-eng nutzen.

## Umsetzung Design-Revision (04.10.2026)
- Layouts: `Document.astro` (head/SEO/Schema/Scripts, gemeinsam) + `BaseLayout.astro` (Alt-Look, lädt Tailwind+Poppins) + `V2Layout.astro` (neue Seiten, KEIN Alt-CSS). Neue Seiten importieren `V2Layout` (kein `design`-Prop mehr). Astro bündelt CSS aller *importierten* Komponenten → Alt- und v2-Chrome nie im selben Layout importieren.
- Effekte: `src/lib/motion/fx.ts` (Kern, ohne Bibliothek: Reveals via IntersectionObserver+WAAPI, `data-letters`) + `fx-rich.ts` (motion, per dynamischem Import im Idle: data-count/confetti/tilt/magnetic/scroll-tilt/hat/parallax-up/pick-a-card, Kids-Funkenspur). Reveal-Varianten: up/pop/puff/tilt/deal/flip/draw. Start-JS ~5 KB.
- Performance-Gate: `npm run test:perf -- /pfad/` (Lighthouse mobil). Stand: /kindergeburtstag/ 97, /zauberer/ 99, a11y 100, CLS ~0.
- Fonts nie inline (assetsInlineLimit-Funktion in astro.config). Bodoni Moda als **wght**-Variante (opsz war +44 KB und kostete LCP). Preload nur LCP-Schriften (FontPreloads.astro).
- Cookie-Banner auf v2: kompakte Karte unten links (vorher größtes Element → LCP).
- Dokumentierte Textänderungen: `site/tests/fixtures/content-changes.json` + `docs/CHANGES-METAS.md`.

## Rollout v2 auf alle Seiten (Start 04.10.2026, Nutzerentscheidungen)
- Wellen mit Freigabe: W1 Startseite + Kids-Kernseiten · W2 Erwachsenen-Seiten · W3 Stadtseiten (3 Templates + extrahierte Daten, 1:1) · W4 Blog, Galerie, Kontakt (→ Netlify Forms), Preise, Über mich · W5 Rechtstexte, Alt-Posts (Catch-all), 404.
- Tests je Welle: Parität 1:1 (alle Seiten) · Seite nutzt V2-Layout ohne Alt-CSS (`tests/dist/rollout.test.ts`, Liste wächst je Welle) · richtige Zone + Logo · Lighthouse ≥ 90 je Template.
- Stadtseiten nie einzeln von Hand: Daten aus den Alt-Dateien extrahieren, ein Template pro Familie.
- W3 umgesetzt: `site/scripts/extract-cities.ts` (Quelle = gebautes Alt-HTML im Legacy-Worktree, `LEGACY_DIST=…`) → `site/src/data/cities/*.json` → `components/v2/kids/CityPage.astro` + `[city].astro` je Familie. Blöcke in Stadt-Reihenfolge; Tailwind → c-*-Klassen (c-grid/c-card/c-num/c-strip …); Alt-Slider wird statischer Fotostreifen. Extraktor-Fix statt Handarbeit an JSON.
- Meta-Parität: `tests/dist/meta-parity.test.ts` gegen `tests/fixtures/meta-baseline.json` (Alt-Build; title/description/canonical/robots/og:image/Schema-Typen).
- Performance-Lehren (Welle 2): Hero-Texte nie von opacity 0 animieren (langer Lead kann mobiles LCP sein). Adult lädt Instrument Sans + Bodoni-„symbols“ (Kartenfarben) vor. Emoji (✨ …) über `@font-face 'Emoji Glyphs'` (local, ohne ♠♥♦♣) — sonst lädt Bodoni-symbols-italic spät nach. `sizes` an gemessene Breite anpassen.
- Mobil-Wächter: `tests/e2e/mobile-layout.test.ts` (390 px: Hero-Foto nicht kollabiert, kein seitliches Scrollen). Seiten-eigene Grid-Spalten nur in `@media (min-width: 901px)`.
- W4/W5 umgesetzt (05.10.2026): ALLE Seiten auf V2 (`tests/dist/rollout.test.ts` läuft über jede Seite in dist/ + 404.html, keine Liste mehr). Artikel-Lesestil gemeinsam in `site/src/styles/article.css` (Blog-Posts + Alt-WP-Posts/Seiten im Catch-all). Blog-Karten: `components/v2/BlogCards.astro`, Vorschaubilder per Prebuild `scripts/generate-card-thumbs.mjs` → `public/card-thumbs/` (gitignored; n8n-Automatik unverändert, eigene absolute URLs werden relativ).
- Kontakt = Netlify Forms (`name="kontakt"`, Honeypot `website`, Rechenfrage nur clientseitig). Alte WPForms in gescrapten Seiten → Netlify-Form `kontakt-alt` (vorher posteten sie ins Leere).
- Zone `/zauberer/zaubershow/karneval/` = adult (Regel /zauberer/), Inhalt gemischt Kinderkarneval–Prunksitzung — bei Bedarf in site-map.ts umstellen.
- Adult-Fotos (Nutzer 06.10.2026, ersetzt Fotokarten): Fotos NIE in Spielkarten, sondern in `components/v2/adult/MagicFrame.astro` (Passepartout + sich zeichnende rote Haarlinie, OHNE Kartenfarben in den Ecken; 2 kleine Akzentkarten hinter einer Ecke, fächern beim Erscheinen via `data-stage`/.is-staged auf). Foto immer ganz, nie beschnitten. Alle Adult-Heros = Bühnen-Look: `.ce-hero--stage` (dunkle Bühne) + `.ce-spot` (Lichtkegel) + `.ce-spot__frame` in adult-kit.css. Wächter: e2e fx.test.ts „magic frames“ + „never cropped“.

## Kinder-Design v3 „Manege im Zelt“ (Grill 06.10.2026, Nutzerentscheidungen)
- Ziel: mehr Zirkus, aber NICHT grob. Weg: dicke Tintenränder, harte Versatz-Schatten, Wimpelkette, Wellenkanten, Punktemuster (keine Halbkreis-/Scallop-Kanten!).
- Schrift: Überschriften **Fraunces** (variable), Fließtext Nunito.
- Hero: **roter Samtvorhang** links/rechts; rahmt von Anfang an (verdeckt NIE Foto/H1 → LCP), rafft sich beim Laden weiter. Side Rays bleiben als warme goldene Scheinwerfer zwischen den Vorhanghälften (Start nach erster Interaktion).
- Fotos: feine Goldkontur mit Glühbirnen rundum, die beim Erscheinen nacheinander angehen und sanft funkeln; Fotos nie beschnitten.
- Abschnittsübergänge: dünne Goldlinie mit kleinem Stern in der Mitte, zeichnet sich beim Scrollen von der Mitte aus.
- Karten/Kästen: „Zirkusprogramm“ — helles Papier, feine Goldkontur mit Eck-Ornamenten, weicher Schatten; Highlight-Paket mit rotem Band.
- Bleiben: Hut-Trick, Ballon-Hund, Konfetti, hüpfende Buchstaben. Animationen mit Skill improve-animations prüfen.
- Ablauf: Prototyp /kindergeburtstag/ → Nutzerfreigabe → Kinder-Kernseiten + Stadtseiten → neutrale Seiten (teilen heute dieselben Tokens).
- Feedback 06.10.2026 (umgesetzt): Hero-Vorhang `kids/Curtain.astro` startet GESCHLOSSEN und öffnet sich ganz von der Mitte bis zur Seite (7 weiche Stoffbahnen, versetzt + Schwung, nur CSS; `trigger="stage"` für Video). Fotorahmen = `kids/StageFrame.astro` (roter Samtrand, Goldkante, Eck-Draperien raffen sich beim Erscheinen in den Rand — nie übers Foto). KEINE Lichterkette. Karte (Einsatzgebiet) ohne Rahmen. Video-Goldrahmen bündig, Vorhang davor. Bewertungen im Zirkusprogramm-Stil wie Preiskarten. Klassenname `.sf` ist vom Footer belegt.
- Feedback 06.10.2026 b: Hero-Vorhang mit `tieback` (Kordel + Quaste raffen jede Hälfte zur Taille, links/rechts verschieden hoch → nicht symmetrisch) und `valance` (schmaler Lambrequin mit Bögen, fällt nach dem Öffnen ein, bewegt sich kaum). Fotorahmen = `kids/CurtainFrame.astro` nach Nutzervorlage „Scenes & Curtain 56/57“ (blaue Vorhänge, als Vektor nachgebaut — Vorlage war Screenshot mit eingebranntem Schachbrett): `shape` portrait (56) / landscape (57) automatisch aus Bildmaßen. Foto füllt die ganze Fläche direkt HINTER den Vorhängen (wo die Vorlage kariert ist); Ränder dürfen bedeckt sein, Mitte (70 % × 75 %) bleibt frei (e2e-Test). Video-Vorhang = wie Header (tieback + valance, `span` = Boxbreite). Foto-Vorhänge ROT wie im Header (06.10.). Zusatzleistungen: dunkle Bühne `.k3-band--spot` mit rotem (links→Ballon) und blauem (rechts→Glitzer) Scheinwerferkegel, CSS-Nachbau der Nutzervorlage (Vorlage hat pngtree-Wasserzeichen → nicht als Bild verwenden). Hero: dieselben rot/blauen Scheinwerfer (`.k3-spot--hero`, weich maskiert, ersetzen dort die WebGL-Side-Rays). Intro-Foto „Clown Zauberer (5)“ unter dem Text (quality 60, fetchpriority low — sonst LCP > 2,5 s mobil).
- Performance-Lehren: keine Container-Queries in Deko (teures Erstlayout), SVG-Gruppen nicht dauerhaft animieren (Repaint je Frame) → ganzes Element transformieren; `innerText` erzwingt Layout (fx.ts nutzt textContent); Bewertungskarten „deal“ nur in Adult (Messung beim Start kostete Kids einen Long Task).
