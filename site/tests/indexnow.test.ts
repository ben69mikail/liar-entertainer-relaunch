// IndexNow nach jedem Deploy (Netlify-Build-Plugin site/plugins/indexnow): nur geänderte URLs melden.
import { describe, it, expect } from 'vitest';
import { extractLocs, pageFingerprint, diffManifests, buildPayload } from '../plugins/indexnow/lib.mjs';

const page = (main: string, extra = '') => `<!doctype html><html><head><title>T</title>
<meta name="description" content="D"><link rel="stylesheet" href="/_astro/index.AbC123.css">
<script type="module" src="/_astro/page.XyZ.js"></script>${extra}</head>
<body><header>Nav</header><main>${main}</main><footer>Neueste Artikel: A, B</footer></body></html>`;

describe('extractLocs', () => {
  it('liest alle <loc> aus der Sitemap', () => {
    const xml = '<urlset><url><loc>https://liar-entertainer.com/</loc><image:image><image:loc>https://liar-entertainer.com/x.jpg</image:loc></image:image></url><url><loc>https://liar-entertainer.com/zauberer/</loc></url></urlset>';
    expect(extractLocs(xml)).toEqual(['https://liar-entertainer.com/', 'https://liar-entertainer.com/zauberer/']);
  });
});

describe('pageFingerprint', () => {
  it('ignoriert gehashte Asset-Namen, Skripte und Footer', () => {
    const a = page('<h1>Hallo</h1>');
    const b = a.replace('index.AbC123.css', 'index.Q9w8.css').replace('page.XyZ.js', 'page.N3u.js').replace('A, B', 'C, D');
    expect(pageFingerprint(b)).toBe(pageFingerprint(a));
  });
  it('erkennt Änderungen an Inhalt, Title und Description', () => {
    const a = page('<h1>Hallo</h1>');
    expect(pageFingerprint(page('<h1>Hallo Welt</h1>'))).not.toBe(pageFingerprint(a));
    expect(pageFingerprint(a.replace('<title>T</title>', '<title>Neu</title>'))).not.toBe(pageFingerprint(a));
    expect(pageFingerprint(a.replace('content="D"', 'content="Neu"'))).not.toBe(pageFingerprint(a));
  });
  it('ignoriert Inline-Skripte und Styles in <main>', () => {
    const a = page('<h1>X</h1><script>var t=1</script><style>.a{}</style>');
    const b = page('<h1>X</h1><script>var t=2</script><style>.b{}</style>');
    expect(pageFingerprint(b)).toBe(pageFingerprint(a));
  });
});

describe('diffManifests', () => {
  it('meldet neue, geänderte und entfernte URLs, nicht unveränderte', () => {
    const prev = { 'https://x/a/': '1', 'https://x/b/': '2', 'https://x/c/': '3' };
    const next = { 'https://x/a/': '1', 'https://x/b/': '9', 'https://x/d/': '4' };
    expect(diffManifests(prev, next).sort()).toEqual(['https://x/b/', 'https://x/c/', 'https://x/d/']);
  });
  it('ohne Vorgänger-Manifest: alle URLs (erster Lauf)', () => {
    expect(diffManifests(null, { 'https://x/a/': '1' })).toEqual(['https://x/a/']);
  });
});

describe('buildPayload', () => {
  it('baut den IndexNow-Body mit Schlüssel-Datei', () => {
    expect(buildPayload(['https://liar-entertainer.com/a/'])).toEqual({
      host: 'liar-entertainer.com',
      key: '3da0cf6edca8f56ea0dc1dea223dcdbe',
      keyLocation: 'https://liar-entertainer.com/3da0cf6edca8f56ea0dc1dea223dcdbe.txt',
      urlList: ['https://liar-entertainer.com/a/'],
    });
  });
  it('filtert fremde Hosts heraus', () => {
    expect(buildPayload(['https://evil.example/a/', 'https://liar-entertainer.com/b/']).urlList).toEqual(['https://liar-entertainer.com/b/']);
  });
});
