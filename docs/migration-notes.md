# Migration-Notizen (Altprojekt → Relaunch)

## Quelle
- Code übernommen aus `ben69mikail/Liar-Entertainer` **origin/main @ ec7dcd1** (02.10.2026) via `git archive`.
  Der lokale Klon `Claude\Liar-Entertainer-fresh` lag 33 Commits zurück und wurde nicht verändert.
- Strategie (vom Nutzer gewählt): **Code übernehmen, dann Template für Template umgestalten.** Parität ab Tag 1, Tests bewachen sie.

## ⚠ Inhalts-Drift bis zum Cutover
Das Altprojekt lebt weiter: SEO-Autopilot (täglich), `seo-autofix.yml` und n8n-Blog (`auto-publish.yml`) committen auf `origin/main`.
Vor dem DNS-Cutover (Phase 7) müssen `src/content/blog/`, `src/data/`, die Seiten und `public/` erneut von `origin/main` übernommen werden,
und zwar als Diff seit `ec7dcd1`: `git -C Liar-Entertainer-fresh diff ec7dcd1 origin/main --stat`.

## Bewusste Abweichungen vom Altcode (Output identisch oder besser)
| Was | Warum |
|---|---|
| `[...slug].astro`: inline-Script "City-Page Design-System Enforcement" (~56 KB) entfernt | Es enthielt escapte Backticks (`` \` ``) und war damit ein **SyntaxError**. Live hat es nie ausgeführt (am Live-HTML von /impressum/ geprüft). Astro 7 bricht beim Kompilieren daran ab. Gerenderter Output bleibt gleich. |
| `.reveal`-System (CSS `opacity:0` ohne JS-Guard + IntersectionObserver-Script) → `motion` | Altsystem versteckte Inhalte auch ohne JS bzw. bei Script-Fehlern. Neu: versteckt nur unter `html.motion-ok`, nie bei `prefers-reduced-motion`. |
| `sharp` 0.34 → 0.35.5 | libvips/libheif-CVEs (Build-Zeit). |
| `public/.htaccess`, `contact.php`, `api/reviews.php` → `ops/legacy-apache/` | Netlify hat kein Apache/PHP. Ersatz: `_redirects` (aus .htaccess), Netlify Forms, Netlify Function. |
| `tailwind.config.mjs` nicht übernommen | Tailwind v4 nutzt ihn nicht (nirgends referenziert). |

| Bewertungen auf v2-Seiten: nur die 5 echten Bewertungen aus `testimonials.json`, serverseitig, ohne Client-Austausch | Das Alt-Widget mischte per JS 5 aus 20 Bewertungen mit Umschrift ("ae/ue") und holte `/api/reviews.php` (auf Netlify nicht vorhanden). Wortlaut im HTML = Baseline. |
| FAQ auf `/kindergeburtstag/` als `<details>` statt JS-Akkordeon | Funktioniert ohne JS; gleiche Texte. |
| YouTube auf `/kindergeburtstag/` per Klick-Facade (youtube-nocookie) statt direktem iframe | Ladezeit + DSGVO; Video, Titel, VideoObject-Schema unverändert. |

## Offene Inhaltsfragen (Nutzer entscheidet, 1:1 übernommen bis dahin)
- `/zauberer/` Hero: „Über 400 begeisterte 5-Sterne-Bewertungen auf Google“ widerspricht „370+“ überall sonst (L3).

## Bewusst NICHT geändert
- Kein `AggregateRating`/`Review`-Schema (Nutzerentscheidung 02.10.2026, wie live; Google-Richtlinie zu Self-Serving-Reviews).
- Alle Titles/Metas/Canonicals/JSON-LD unverändert: Legacy-Check `npm run test:seo` 45/45.
