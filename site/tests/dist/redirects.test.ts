import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { parseRedirects, resolve, fileExists } from '../support/netlify-redirects';

// Go-live on Netlify (2026-10-07): public/_redirects replaces ops/legacy-apache/.htaccess.
// Expected values = what the old Apache produced (first real hop; Apache's extra
// "add trailing slash" hop is ignored because Netlify pretty URLs do the same).
const ROOT = join(import.meta.dirname, '../..');
const DIST = join(ROOT, 'dist');
const rules = parseRedirects(readFileSync(join(DIST, '_redirects'), 'utf8'));
const go = (url: string, host?: string) => {
  const hit = resolve(rules, url, DIST, host);
  return hit ? [hit.status, hit.status >= 400 ? null : hit.to] : null;
};
const GONE = [410, null];

// [old URL, expected [status, target]] — at least one sample per Apache rule / pattern group
const APACHE: [string, (number | string | null)[]][] = [
  // l.19 index.php
  ['/index.php', [301, '/']],
  ['/index.php/alte-seite/', [301, '/']],
  // l.48 / l.52 410
  ['/wp-content/uploads/2019/05/clown.jpg', GONE],
  ['/sport/', GONE],
  ['/sport/lokalsport/fussball-bottrop/', GONE],
  // l.82-92 query on /
  // l.97 / l.98 attachments
  ['/attachment/clown-bild-1/', GONE],
  ['/kindergeburtstag/attachment/foto-3/', GONE],
  ['/blog/kidzival-2024/attachment/foto/', GONE],
  // l.123
  ['/walk-act/', [301, '/clown/walk-act/']],
  // l.126-135 MUSTER 1
  ['/content/', [301, '/']],
  ['/content/kinderzauberer/', [301, '/kinderzauberer/']],
  ['/content/zauberer/tisch-zauberer/', [301, '/zauberer/tisch-zauberer/']],
  ['/content/zauberer/kinderzauberer/', [301, '/kinderzauberer/']],
  ['/content/zauberer/kinderzauberer/kinderzauberer-in-essen/', [301, '/kinderzauberer/kinderzauberer-in-essen/']],
  ['/content/clown/clown-in-bochum/', [301, '/clown/clownshow/clown-in-bochum/']],
  ['/content/glitzer-tattoos/', [301, '/clown/glitzer-tattoo/']],
  ['/content/preise-fuer-clown-oder-kinderzauberer/', [301, '/preise/']],
  ['/content/index.php', [301, '/']],
  ['/content/alter-beitrag/', [301, '/blog/']],
  ['/content/clown/', [301, '/blog/']], // l.306 was dead in Apache (l.135 fires first)
  // l.138-148
  ['/clown/kindergeburtstag/was-kostet-ein-clown-fuer-ein-kindergeburtstag/', [301, '/blog/was-kostet-ein-clown-fuer-ein-kindergeburtstag/']],
  ['/kindergeburtstag/was-kostet-ein-clown-fuer-ein-kindergeburtstag/', [301, '/blog/was-kostet-ein-clown-fuer-ein-kindergeburtstag/']],
  ['/zauberer-nrw/', [301, '/zauberer/']],
  ['/zauberer/zauberer-nrw/', [301, '/zauberer/']],
  ['/5-gruende-warum-zauberei-zum-karneval-gehoert/', [301, '/blog/5-gruende-warum-zauberei-zum-karneval-gehoert/']],
  ['/blog/was-kostet-ein-/', [301, '/blog/was-kostet-ein-clown-fuer-ein-kindergeburtstag/']],
  // l.151-156 MUSTER 2/3
  ['/clown/kindergeburtstag/', [301, '/kindergeburtstag/']],
  ['/clown/kindergeburtstag/geburtstag-in-essen/', [301, '/kindergeburtstag/geburtstag-in-essen/']],
  ['/clown/geburtstag/', [301, '/kindergeburtstag/']],
  ['/clown/geburtstag/geburtstag-in-bochum/', [301, '/kindergeburtstag/geburtstag-in-bochum/']],
  // l.159-162 MUSTER 4
  ['/clown/zauberer/kinderzauberer/', [301, '/kinderzauberer/']],
  ['/clown/zauberer/kinderzauberer/kinderzauberer-in-dortmund/', [301, '/kinderzauberer/kinderzauberer-in-dortmund/']],
  ['/clown/zauberer/kinderzauberer/kinderzauberer-in-dortmund/bild-2/', [301, '/kinderzauberer/kinderzauberer-in-dortmund/']],
  ['/clown/zauberer/zaubershow/schule/', [301, '/zauberer/zaubershow/schule/']],
  ['/clown/zauberer/', [301, '/zauberer/']], // l.303
  // l.165-168 MUSTER 5
  ['/clown-zauberer/clown/glitzer-tattoos/', [301, '/clown/glitzer-tattoo/']],
  ['/clown-zauberer/clown/geburtstag/geburtstag-in-herne/', [301, '/kindergeburtstag/geburtstag-in-herne/']],
  ['/clown-zauberer/', [301, '/clown/clownshow/']],
  ['/clown-zauberer/preise/', [301, '/clown/clownshow/']], // l.351 was dead in Apache
  // l.171-174 MUSTER 6
  ['/clown-nrw/clown-mieten-und-buchen-in-ihrer-stadt/clown-in-essen/', [301, '/clown/clownshow/clown-in-essen/']],
  ['/clown-nrw/clown-kinderzauberer-kindergeburtstag/', [301, '/kindergeburtstag/']],
  ['/clown-nrw/', [301, '/clown/clownshow/']],
  ['/clown-nrw/irgendwas/', [301, '/clown/clownshow/']],
  // l.177-180 MUSTER 7
  ['/clown/glitzer-tattoos/', [301, '/clown/glitzer-tattoo/']],
  ['/clown-kindergeburtstag-extras/glitzer-tattoos/', [301, '/clown/glitzer-tattoo/']],
  ['/glitzer-tattoos/', [301, '/clown/glitzer-tattoo/']],
  ['/glitzer-tattoos-den-kindergeburtstag/', [301, '/clown/glitzer-tattoo/']],
  // l.183-298 MUSTER 8
  ['/kindernachmittag-in-der-schnittbar-mit-liar/', [301, '/blog/']],
  ['/drehorgel-rolf/', [301, '/blog/']],
  ['/preise-fuer-clown-oder-kinderzauberer/', [301, '/preise/']],
  ['/bewertung-und-fotos-vom-clown/', [301, '/galerie/']],
  ['/familienfest-in-ramsdorf-mit-clown-liar/', [301, '/blog/']],
  // l.321-345
  ['/halloween-party-fuer-kinder/', [301, '/blog/']],
  ['/sommerfest-in-recklinghausen-mit-kinderzauberer/', [301, '/blog/']],
  // l.357-358 (page exists in dist, Apache redirected it anyway)
  ['/clown/clown-zauberer/', [301, '/clown/clownshow/']],
  ['/clown/clown-zauberer/kinder/', [301, '/clown/clownshow/']],
  // l.361-385 MUSTER 10 (RewriteRule runs before the RedirectMatch block)
  ['/category/kinderzauberer/', [301, '/kinderzauberer/']],
  ['/category/entertainer/seite-2/', [301, '/blog/']],
  ['/category/zaubershow/', [301, '/zauberer/zaubershow/']],
  ['/category/zauberer-2/', [301, '/zauberer/']],
  ['/category/clown-im-herzen/', [301, '/blog/']],
  ['/category/videos/', [301, '/galerie/']],
  ['/category/gelsenkirchen-buer/', [301, '/blog/']],
  // l.390-392 MUSTER 11
  ['/zauberer/kinderzauberer/', [301, '/kinderzauberer/']],
  ['/zauberer/kinderzauberer/kinderzauberer-in-marl/', [301, '/kinderzauberer/kinderzauberer-in-marl/']],
  ['/zauberer/kinderzauberer/foo/bar/', [301, '/kinderzauberer/']],
  // l.395-400
  ['/kinderschminken/', [301, '/clown/glitzer-tattoo/']],
  ['/ballonkuenstler/', [301, '/clown/ballonmodellage/']],
  ['/clown-kindergeburtstag/', [301, '/kindergeburtstag/']],
  ['/zauberer-kindergeburtstag/', [301, '/kindergeburtstag/']],
  ['/clown/20230628_155823/', [301, '/galerie/']],
  // l.403-407 old root//clown/ slugs -> existing article
  ['/kidzival-2024/', [301, '/blog/kidzival-2024/']],
  ['/clown/was-ist-ein-clown/', [301, '/blog/was-ist-ein-clown/']],
  ['/clown/zaubershow-in-dortmund/', [301, '/blog/zaubershow-in-dortmund/']],
  // l.414-417 root catch-all (>= 20 chars)
  ['/ein-alter-wordpress-artikel-zum-sommerfest/', [301, '/blog/']],
  // l.431-435 city pages -> 410, real pages untouched
  ['/clown/essen/', GONE],
  ['/zauberer/bochum/', GONE],
  ['/clown/feed/', GONE], // rewrite (410) beats the later RedirectMatch feed rule
  // RedirectMatch block l.35-113
  ['/wp-admin/', [301, '/']],
  ['/wp-admin/options.php', [301, '/']],
  ['/wp-login.php', [301, '/']],
  ['/wp-signup.php', [301, '/']],
  ['/wp-register.php', [301, '/']],
  ['/wp-cron.php', [301, '/']],
  ['/xmlrpc.php', [301, '/']],
  ['/wp-json/wp/v2/posts', [301, '/']],
  ['/wp-includes/js/jquery/jquery.js', [301, '/']],
  ['/wp-trackback.php', [301, '/']],
  ['/wp-comments-post.php', [301, '/']],
  ['/feed/', [301, '/blog/']],
  ['/rss/', [301, '/blog/']],
  ['/atom/', [301, '/blog/']],
  ['/comments/feed/', [301, '/blog/']],
  ['/kindergeburtstag/feed/', [301, '/kindergeburtstag/']],
  ['/blog/kidzival-2024/feed/', [301, '/blog/kidzival-2024/']],
  ['/blog/kidzival-2024/comments/', [301, '/blog/kidzival-2024/']],
  ['/sitemap_index.xml', [301, '/sitemap.xml']],
  ['/post-sitemap.xml', [301, '/sitemap.xml']],
  ['/page-sitemap.xml', [301, '/sitemap.xml']],
  ['/category-sitemap.xml', [301, '/sitemap.xml']],
  ['/author-sitemap.xml', [301, '/sitemap.xml']],
  ['/author/liar/', [301, '/']],
  ['/category/kindergeburtstag/', [301, '/kindergeburtstag/']],
  ['/category/kindergeburtstag/feiern/', [301, '/kindergeburtstag/']],
  ['/category/zaubershow/tricks/', [301, '/zauberer/zaubershow/']],
  ['/category/clown/', [301, '/clown/clownshow/']],
  ['/category/allgemein/', [301, '/blog/']],
  ['/tag/zauberer/', [301, '/blog/']],
  ['/schlagwort/clown/', [301, '/blog/']],
  ['/blog/page/2/', [301, '/blog/']],
  ['/kindergeburtstag/page/3/', [301, '/kindergeburtstag/']],
  ['/zauberer/zaubershow/karneval/', [301, '/clown/karneval/']], // page exists, Apache redirected anyway
  ['/sample-page/', [301, '/']],
  ['/hello-world/', [301, '/blog/']],
  ['/clown/', [301, '/clown/clownshow/']],
];

// Documented deviations (no regex on Netlify) — pinned so a change is noticed. Apache value in the comment.
const DEVIATIONS: [string, (number | string | null)[] | null][] = [
  ['/clown/ein-sehr-langer-alter-blog-slug/', GONE], // Apache l.409: 301 /blog/ (length >= 20)
  // query rules not ported (Netlify keeps the query -> self-redirect loop); pages answer 200 with a clean canonical
  ['/?s=zauberer', null], // Apache l.82-92: 301 /
  ['/?p=1234', null],
  ['/?page_id=45', null],
  ['/blog/?replytocom=12', null], // Apache l.313-318: 301 /blog/
  ['/kontakt/?share=facebook', null],
  ['/foo/', [301, '/blog/']], // Apache: 404 (catch-all needed >= 20 chars)
  ['/category/clowns-und-mehr/', [301, '/blog/']], // Apache l.76 prefix: 301 /clown/clownshow/
  ['/bild-attachment/foto/', null], // Apache l.102: 410
  ['/a/b/c/d/attachment/x/', null], // Apache l.98: 410 (we cover 1–3 leading segments)
  ['/apple-touch-icon-precomposed.png', [404, null]], // Apache: 404 — kept out of the root catch-all
  ['/wp-login.php?redirect_to=x', [301, '/?redirect_to=x']], // query passes through like on Apache
];

const pagesInDist = (): string[] => {
  const out: string[] = [];
  const walk = (dir: string) => {
    for (const name of readdirSync(dir)) {
      const p = join(dir, name);
      if (statSync(p).isDirectory()) walk(p);
      else if (name === 'index.html') out.push(`/${relative(DIST, dir).split(sep).join('/')}/`.replace('//', '/'));
    }
  };
  walk(DIST);
  return out;
};

describe('Netlify _redirects (parity with the old Apache .htaccess)', () => {
  it('is published into dist/', () => expect(rules.length).toBeGreaterThan(300));

  describe('old URLs behave like on Apache', () => {
    for (const [url, expected] of APACHE) it(url, () => expect(go(url)).toEqual(expected));
  });

  describe('documented deviations', () => {
    for (const [url, expected] of DEVIATIONS) it(url, () => expect(go(url)).toEqual(expected));
  });

  it('www -> apex (301, path kept)', () => {
    expect(go('/zauberer/', 'https://www.liar-entertainer.com')).toEqual([301, 'https://liar-entertainer.com/zauberer/']);
    expect(go('/', 'http://www.liar-entertainer.com')).toEqual([301, 'https://liar-entertainer.com/']);
  });

  it('the Netlify preview host sends everyone to the main URL (no duplicate site)', () => {
    expect(go('/zauberer/', 'https://liar-entertainer-relaunch.netlify.app')).toEqual([301, 'https://liar-entertainer.com/zauberer/']);
    expect(go('/', 'http://liar-entertainer-relaunch.netlify.app')).toEqual([301, 'https://liar-entertainer.com/']);
  });

  it('never touches a URL of the DE URL contract (with and without trailing slash)', () => {
    const contract = readFileSync(join(ROOT, '../docs/url-contract-de.txt'), 'utf8').split(/\r?\n/).filter(Boolean);
    expect(contract.length).toBe(143);
    const hit = contract.flatMap((u) => [u, u.length > 1 ? u.slice(0, -1) : u]).filter((u) => go(u) !== null);
    expect(hit).toEqual([]);
  });

  it('no built page is redirected except the two Apache also redirected', () => {
    const hit = pagesInDist().filter((u) => go(u) !== null).sort();
    expect(hit).toEqual(['/clown/clown-zauberer/', '/zauberer/zaubershow/karneval/']);
  });

  it('every literal site target exists in dist/', () => {
    const missing = rules
      .filter((r) => r.to.startsWith('/') && !r.to.includes(':'))
      .filter((r) => !fileExists(DIST, r.to))
      .map((r) => `${r.line}: ${r.to}`);
    expect(missing).toEqual([]);
  });

  it('city-enumerated targets of the samples exist (placeholder rules)', () => {
    const missing = APACHE.filter(([, e]) => typeof e[1] === 'string' && (e[1] as string).startsWith('/'))
      .map(([, e]) => e[1] as string)
      .filter((t) => !fileExists(DIST, t));
    expect(missing).toEqual([]);
  });
});

describe('no redirect loops', () => {
  // Netlify passes the query string on to the target: a rule with a query condition whose target
  // is its own path (e.g. "/ p=:p / 301!", "/* share=:s /:splat 301!") redirects to itself forever.
  const rules = parseRedirects(readFileSync(join(DIST, '_redirects'), 'utf8'));
  it('no query rule points back to its own path', () => {
    const loops = rules.filter((r) => Object.keys(r.query).length > 0 && (r.to === r.from || (r.from.endsWith('/*') && r.to.endsWith('/:splat') && r.from.slice(0, -1) === r.to.slice(0, -6))));
    expect(loops.map((r) => r.from + ' ' + JSON.stringify(r.query))).toEqual([]);
  });
});

describe('zauberer-liar.de -> liar-entertainer.com (page by page, ops/redirects-zauberer-liar.csv)', () => {
  // The old domain is served by this Netlify project as a domain alias (2026-10-07); every old URL
  // goes in ONE 301 to its matching new page, everything else to /zauberer/. http/https, www/apex.
  const map = readFileSync(join(ROOT, '../ops/redirects-zauberer-liar.csv'), 'utf8')
    .split(/\r?\n/).slice(1).filter(Boolean).map((l) => l.split(','));
  for (const host of ['https://zauberer-liar.de', 'https://www.zauberer-liar.de', 'http://zauberer-liar.de', 'http://www.zauberer-liar.de']) {
    it(`${host}: every old page -> its new page in one 301`, () => {
      const wrong = map
        .map(([from, to]) => [from, go(from, host), [301, `https://liar-entertainer.com${to}`]] as const)
        .filter(([, got, want]) => JSON.stringify(got) !== JSON.stringify(want))
        .map(([from, got]) => `${from} -> ${JSON.stringify(got)}`);
      expect(wrong).toEqual([]);
    });
  }
  it('unknown old URLs and assets -> /zauberer/', () => {
    expect(go('/assets/img/logo-liar.webp', 'https://zauberer-liar.de')).toEqual([301, 'https://liar-entertainer.com/zauberer/']);
    expect(go('/irgendwas.html', 'https://www.zauberer-liar.de')).toEqual([301, 'https://liar-entertainer.com/zauberer/']);
  });
  it('the main site is not affected by the old-domain rules', () => {
    expect(go('/kontakt/')).toBeNull();
    expect(go('/zauberer/zauberer-in-essen/')).toBeNull();
  });
});
