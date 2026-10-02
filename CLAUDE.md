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
