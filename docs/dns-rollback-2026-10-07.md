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
