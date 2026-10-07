# Go-live liar-entertainer.com (Grill 07.10.2026)

## Entscheidungen
| # | Thema | Entscheidung |
|---|---|---|
| G1 | Umfang | Alles laut Brief: DE komplett, FR/EN-Kernseiten, `/zauberer/close-up/`, 301 zauberer-liar.de |
| G2 | Hosting/DNS | Netlify; **DNS bleibt bei IONOS** (Variante B): nur A-Record `@` + CNAME `www`, MX/Mail unberührt |
| G3 | Hauptadresse | **https://liar-entertainer.com** (ohne www) bleibt kanonisch; `www` → 301 Apex (wie heute) |
| G4 | Blog-Automatik | n8n auf neues Repo `ben69mikail/liar-entertainer-relaunch`, Pfade mit Präfix `site/`; SEO-Autopilot pausieren bis umgestellt |
| G5 | FR/EN | Claude übersetzt inhaltstreu, Nutzer prüft; Sprachen erst nach OK freischalten (`PUBLISHED_LOCALES`). DE geht unabhängig live |
| G6 | Close-up | `/zauberer/close-up/` 1:1 von zauberer-liar.de/close-up-zauberer.html (Paritätstest) |
| G7 | 301 zauberer-liar.de | direkt nach Go-live + Prüfung der Hauptseite; dann `ZAUBERER_CITIES_LIVE = true` |
| G8 | Perf-Gate | hart: /zauberer/ vor Go-live auf ≥ 90 (zusätzlich PageSpeed Insights gegen Netlify-Vorschau) |
| G9 | Adult-Body | Salon-Look auch auf Bühnen-, Tisch-Zauberer, Hochzeit, Firmenfeier |
| G10 | Kartenränge | einheitlich deutsch: A, K, D, B |

## Ablauf
Legende: 🤖 = Claude (lokal) · 👤 = du (Zugänge/Logins)

### Sofort (läuft parallel)
- [ ] 👤 **IONOS-DNS: TTL senken** für `liar-entertainer.com` (`@`, `www`) auf den kleinsten Wert (IONOS: 5 Min / 1 Std). Je früher, desto schneller wirkt der Umzug und ein Rollback.
- [ ] 👤 **Werte notieren (Rollback):** aktuelle Einträge `@` A `217.160.0.180`, `@` AAAA `2001:8d8:100f:f000::2b1`, `www` (gleiche Werte). Screenshot der IONOS-DNS-Seite.

### Bauen (🤖, lokal, mit Tests)
- [x] 🤖 E1 Netlify-Konfiguration: `netlify.toml` (Basis `site/`), `_redirects` aus der alten `.htaccess`, www→Apex, Header
- [x] 🤖 E2 Perf-Gate: PageSpeed (Google) auf Netlify-Vorschau: / 97, /zauberer/ 96, /kindergeburtstag/ 99, /zauberer/hochzeit/ 100, Stadtseite 96
- [x] 🤖 E3 Salon-Look auf 4 Adult-Seiten + Kartenränge D
- [x] 🤖 E4 `/zauberer/close-up/`
- [x] 🤖 E5 FR/EN-Kernseiten (20) + Prüfliste für dich
- [x] 🤖 E6 `ops/blog-automation.md` (n8n-Umstellung), SEO-Autopilot pausieren
- [x] 🤖 E7 `.htaccess` für zauberer-liar.de vorbereiten (`ops/zauberer-liar.htaccess`)
- [ ] 🤖 Gates §8 lokal: Parität, SEO 45/45, e2e, Lighthouse je Template

### Veröffentlichen (👤 mit Anleitung)
- [ ] 👤 O1 `git push` (Repo liar-entertainer-relaunch)
- [ ] 👤 O2 Netlify: einloggen, „Add new project → Import from GitHub“ → Repo wählen; Base directory `site`, Build `npm run build`, Publish `site/dist` (steht in netlify.toml). Forms aktivieren, Benachrichtigung an info@liar-entertainer.com
- [ ] 🤖 Abnahme auf der Netlify-Vorschau (`*.netlify.app`): URL-Check aller DE-URLs, Redirects, Formular-Test, PageSpeed Insights
- [ ] 👤 O5 Netlify „Domain management“: `liar-entertainer.com` als Primary, `www` als Alias hinzufügen
- [ ] 👤 O5 IONOS-DNS: `@` A → Netlify-Load-Balancer-IP (Wert aus Netlify ablesen), **`@` AAAA löschen**, `www` → CNAME `<projekt>.netlify.app` (vorher www-A/AAAA löschen). MX/TXT nicht anfassen!
- [ ] 🤖 Propagation + HTTPS (Let's Encrypt) prüfen, Kern-URLs 200, www → Apex 301
- [ ] 👤 O4 Search Console (liar-entertainer.com): Sitemap neu einreichen, Startseite + Kernseiten „Indexierung beantragen“

### Danach (gleicher Tag, wenn alles grün)
- [ ] 👤 O3 `ops/zauberer-liar.htaccess` als `.htaccess` ins Webroot von zauberer-liar.de laden
- [ ] 🤖 `ZAUBERER_CITIES_LIVE = true`, Sitemap; 301-Check aller Alt-URLs → `docs/redirect-check.md`
- [ ] 👤 O4 GSC zauberer-liar.de: Adressänderung (Change of Address) auf liar-entertainer.com
- [ ] 👤 n8n: Repo + Pfad-Präfix umstellen; 🤖 Probe-Artikel prüfen
- [ ] 👤 FR/EN geprüft → 🤖 freischalten (hreflang + Sitemap)

## Rollback
IONOS-DNS auf die notierten Werte zurücksetzen (A + AAAA). Die alte Seite läuft auf IONOS unverändert weiter, bis wir sie bewusst abschalten. Kein Inhalt geht verloren.

## Sicherheit
Das öffentliche Altrepo enthält das IONOS-Mailpasswort (`contact.php`). Nach dem Umzug wird `contact.php` nicht mehr gebraucht — **Passwort bei IONOS ändern** (nur du).
