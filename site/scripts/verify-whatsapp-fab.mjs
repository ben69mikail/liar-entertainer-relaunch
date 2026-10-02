/**
 * Visuelle + geometrische Verifikation des Floating-WhatsApp-Buttons.
 * Startet einen statischen Server auf dist/ und prueft mit Chromium:
 * Zentrierung, Ueberlappung mit der CTA-Leiste, Touch-Groesse, Kontrast,
 * Desktop-Ausblendung und das Zuruecktreten im Footer.
 *
 * Aufruf: node scripts/verify-whatsapp-fab.mjs   (setzt `npm run build` voraus)
 */
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { existsSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

// fileURLToPath statt .pathname: unter Windows liefert .pathname "/C:/Users/..."
// mit fuehrendem Slash, woraus "C:\C:\Users\..." wird. Gleiche Falle wie in
// hero-invarianten.mjs; redesign-tests.mjs umgeht sie mit einem eigenen Regex.
const ROOT = fileURLToPath(new URL('../dist/', import.meta.url));
const SHOTS = fileURLToPath(new URL('../.fab-shots/', import.meta.url));
const PORT = 4399;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
  '.xml': 'application/xml',
  '.txt': 'text/plain; charset=utf-8',
  '.json': 'application/json',
};

const server = createServer(async (req, res) => {
  try {
    const p = decodeURIComponent(req.url.split('?')[0]);
    let file = join(ROOT, p);
    if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');
    if (!existsSync(file)) {
      res.writeHead(404);
      return res.end('not found');
    }
    const body = await readFile(file);
    res.writeHead(200, { 'Content-Type': MIME[extname(file)] || 'application/octet-stream' });
    res.end(body);
  } catch (err) {
    res.writeHead(500);
    res.end(String(err));
  }
});

// ---- Kontrast (WCAG 2.x relative Luminanz) ----
const chan = (v) => {
  const s = v / 255;
  return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
};
const lum = ([r, g, b]) => 0.2126 * chan(r) + 0.7152 * chan(g) + 0.0722 * chan(b);
const ratio = (a, b) => {
  const [hi, lo] = lum(a) > lum(b) ? [a, b] : [b, a];
  return (lum(hi) + 0.05) / (lum(lo) + 0.05);
};
const parseRgb = (s) => s.match(/\d+/g).slice(0, 3).map(Number);

const results = [];
const check = (name, pass, detail) => results.push({ name, pass, detail });

await mkdir(SHOTS, { recursive: true });
await new Promise((r) => server.listen(PORT, r));

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });

try {
  // ---------- MOBILE ----------
  const mobile = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  const page = await mobile.newPage();
  await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200); // Eintrittsanimation abwarten

  const geo = await page.evaluate(() => {
    const fab = document.querySelector('.wa-fab');
    const bar = document.querySelector('.mobile-cta-bar');
    if (!fab) return null;
    const f = fab.getBoundingClientRect();
    const b = bar ? bar.getBoundingClientRect() : null;
    const cs = getComputedStyle(fab);
    // Echte Ausdehnung der Leisten-Beschriftungen (inkl. Telefon-Icon),
    // nicht die des halbbreiten Klickfeldes.
    const contentRect = (sel) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const range = document.createRange();
      range.selectNodeContents(el);
      const r = range.getBoundingClientRect();
      return { left: r.left, right: r.right };
    };
    return {
      fab: { x: f.x, y: f.y, w: f.width, h: f.height, bottom: f.bottom, centerX: f.x + f.width / 2 },
      bar: b ? { top: b.top, height: b.height } : null,
      labels: { call: contentRect('.mobile-cta-call'), contact: contentRect('.mobile-cta-contact') },
      bg: cs.backgroundColor,
      color: cs.color,
      opacity: Number(cs.opacity),
      zIndex: cs.zIndex,
      href: fab.getAttribute('href'),
      label: fab.getAttribute('aria-label'),
      target: fab.getAttribute('target'),
      rel: fab.getAttribute('rel'),
      viewportW: window.innerWidth,
    };
  });

  if (!geo) throw new Error('FAB nicht im DOM gefunden');

  check('FAB sichtbar auf Mobile', geo.opacity === 1, `opacity=${geo.opacity}`);
  check(
    'Horizontal zentriert',
    Math.abs(geo.fab.centerX - geo.viewportW / 2) < 1.5,
    `centerX=${geo.fab.centerX.toFixed(1)} vs ${geo.viewportW / 2}`
  );
  check(
    'Angedockt: haelftig in der Leiste, haelftig darueber',
    geo.bar !== null && geo.fab.bottom > geo.bar.top && geo.fab.y < geo.bar.top,
    `fab.top=${geo.fab.y.toFixed(1)} bar.top=${geo.bar ? geo.bar.top.toFixed(1) : 'n/a'} fab.bottom=${geo.fab.bottom.toFixed(1)}`
  );
  check(
    'Verdeckt keine Leisten-Beschriftung',
    geo.labels.call !== null &&
      geo.labels.contact !== null &&
      geo.fab.x >= geo.labels.call.right &&
      geo.fab.x + geo.fab.w <= geo.labels.contact.left,
    `"Anrufen" endet bei ${geo.labels.call?.right.toFixed(1)}, FAB ${geo.fab.x.toFixed(1)}–${(geo.fab.x + geo.fab.w).toFixed(1)}, "Jetzt anfragen" ab ${geo.labels.contact?.left.toFixed(1)}`
  );
  check(
    'Touch-Ziel >= 44px (PRODUCT.md)',
    geo.fab.w >= 44 && geo.fab.h >= 44,
    `${geo.fab.w}x${geo.fab.h}px`
  );
  check('z-index ueber der Leiste (60), unter Consent (9999)', geo.zIndex === '61', `z=${geo.zIndex}`);
  check('Link zeigt auf wa.me mit korrekter Nummer', geo.href === 'https://wa.me/491721517578', geo.href);
  check('Neuer Tab abgesichert', geo.target === '_blank' && /noopener/.test(geo.rel), `${geo.target} / ${geo.rel}`);
  check('Barrierefreier Name vorhanden', !!geo.label && geo.label.length > 10, geo.label);

  const cr = ratio(parseRgb(geo.color), parseRgb(geo.bg));
  check('Glyph-Kontrast >= 3:1 (WCAG 1.4.11)', cr >= 3, `${cr.toFixed(2)}:1 (${geo.color} auf ${geo.bg})`);
  const crWhite = ratio(parseRgb(geo.bg), [255, 255, 255]);
  check('Buttonflaeche gegen weisse Seite >= 3:1', crWhite >= 3, `${crWhite.toFixed(2)}:1`);

  await page.screenshot({ path: join(SHOTS, '01-mobile-home.png') });

  // Mitte der Seite (FAB ueber Inhalt)
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.45));
  await page.waitForTimeout(500);
  await page.screenshot({ path: join(SHOTS, '02-mobile-scrolled.png') });

  // Footer -> FAB soll zuruecktreten
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(900);
  const parked = await page.evaluate(() => {
    const fab = document.querySelector('.wa-fab');
    return { opacity: Number(getComputedStyle(fab).opacity), parked: fab.classList.contains('is-parked') };
  });
  check('Tritt im Footer zurueck', parked.parked && parked.opacity < 0.1, `opacity=${parked.opacity}`);
  await page.screenshot({ path: join(SHOTS, '03-mobile-footer.png') });

  // Unterseite gegenpruefen
  await page.goto(`http://localhost:${PORT}/kinderzauberer/kinderzauberer-in-essen/`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);
  const onCity = await page.evaluate(() => {
    const f = document.querySelector('.wa-fab');
    return f ? Number(getComputedStyle(f).opacity) : -1;
  });
  check('Auch auf Stadtseite aktiv', onCity === 1, `opacity=${onCity}`);
  await page.screenshot({ path: join(SHOTS, '04-mobile-stadtseite.png') });

  // ---------- REDUCED MOTION ----------
  const rm = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    reducedMotion: 'reduce',
  });
  const rmPage = await rm.newPage();
  await rmPage.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle' });
  await rmPage.waitForTimeout(300);
  const rmState = await rmPage.evaluate(() => {
    const cs = getComputedStyle(document.querySelector('.wa-fab'));
    return { opacity: Number(cs.opacity), animation: cs.animationName };
  });
  check(
    'prefers-reduced-motion: sofort sichtbar, keine Animation',
    rmState.opacity === 1 && rmState.animation === 'none',
    `opacity=${rmState.opacity} animation=${rmState.animation}`
  );
  await rm.close();

  // ---------- DESKTOP ----------
  const desktop = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const dPage = await desktop.newPage();
  await dPage.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle' });
  await dPage.waitForTimeout(600);
  const dState = await dPage.evaluate(() => {
    const f = document.querySelector('.wa-fab');
    return f ? getComputedStyle(f).display : 'absent';
  });
  check('Auf Desktop ausgeblendet', dState === 'none', `display=${dState}`);
  await dPage.screenshot({ path: join(SHOTS, '05-desktop.png') });
  await desktop.close();

  // ---------- KONSOLENFEHLER ----------
  const errPage = await mobile.newPage();
  const errors = [];
  errPage.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  errPage.on('pageerror', (e) => errors.push(String(e)));
  await errPage.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle' });
  await errPage.waitForTimeout(800);
  check('Keine Konsolenfehler', errors.length === 0, errors.slice(0, 3).join(' | ') || 'keine');

  await mobile.close();
} finally {
  await browser.close();
  server.close();
}

let failed = 0;
for (const r of results) {
  if (!r.pass) failed++;
  console.log(`${r.pass ? 'PASS' : 'FAIL'}  ${r.name.padEnd(52)} ${r.detail}`);
}
console.log('='.repeat(88));
console.log(`${results.length - failed}/${results.length} erfuellt, ${failed} verletzt.`);
process.exit(failed ? 1 : 0);
