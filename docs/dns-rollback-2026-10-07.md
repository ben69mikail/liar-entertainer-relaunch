# DNS liar-entertainer.com — Stand VOR dem Umzug (07.10.2026), für Rollback

Rollback = diese Werte bei IONOS (mein.ionos.de → Domains & SSL → liar-entertainer.com → DNS) wieder eintragen
und den CNAME `www` löschen.

| Typ | Host | Wert | Service |
|---|---|---|---|
| A | @ | 217.160.0.180 | Webhosting |
| AAAA | @ | 2001:8d8:100f:f000:0:0:0:2b1 | Webhosting |
| A | www | 217.160.0.180 | Webhosting |
| AAAA | www | 2001:8d8:100f:f000:0:0:0:2b1 | Webhosting |

Nicht verändert (bleiben): MX mx00/mx01.ionos.de, TXT SPF, DKIM-/DMARC-/autodiscover-CNAMEs,
google-site-verification, cloudflare-verify, `ftp`, alle `pantomime`-Records, `www.www`, `_dep_ws_mutex*`.

Neu (Netlify): A @ → 75.2.60.5 · CNAME www → liar-entertainer-relaunch.netlify.app

## zauberer-liar.de (Stand vor Umstellung, 07.10.2026 ~15:25)

| Typ | Host | Wert |
|---|---|---|
| A | @ | 217.160.0.180 |
| AAAA | @ | 2001:8d8:100f:f000::2b1 |
| A | www | 217.160.0.180 |
| AAAA | www | 2001:8d8:100f:f000::2b1 |
| MX | @ | mx00.ionos.de / mx01.ionos.de (10) — NICHT anfassen |
| TXT | @ | google-site-verification=2oJAV6mJ5IWTIOlrI8FT4o76kMiRkQRzK7iLW92j_xo — NICHT löschen (GSC) |
| TXT | @ | v=spf1 include:_spf-eu.ionos.com ~all |

Umgestellt am 08.10.2026: A @ und A www → 75.2.60.5 (Netlify, TTL 5 Min), AAAA @/www und TXT _dep_ws_mutex von IONOS deaktiviert. Rollback = alte Werte wieder eintragen.
