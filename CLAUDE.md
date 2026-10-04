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
