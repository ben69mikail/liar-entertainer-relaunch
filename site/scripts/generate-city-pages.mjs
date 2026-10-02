/**
 * Generator: Dedizierte Astro-Seiten für alle City-Pages
 * Extrahiert Inhalte aus scraped-pages.json und erzeugt saubere Astro-Dateien
 * nach dem Vorbild der Menü-Seiten (Design-System konform).
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const pagesData = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/pages.json'), 'utf-8'));
const scrapedData = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/scraped-pages.json'), 'utf-8'));

// === Config ===
const umlautMap = {
  'duesseldorf': 'Düsseldorf', 'muelheim': 'Mülheim',
  'haltern-am-see': 'Haltern am See', 'haltern': 'Haltern am See',
  'castrop-rauxel': 'Castrop-Rauxel',
};

function toDisplayCity(slug) {
  const citySlug = slug.replace(/^(geburtstag-in-|kinderzauberer-in-|clown-in-)/, '');
  if (umlautMap[citySlug]) return umlautMap[citySlug];
  return citySlug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

// Original H1 titles from WordPress
const originalH1 = {
  'geburtstag-in-essen': 'Geburtstag in Essen: Echter Pott-Zauber für Ihre Feier',
  'geburtstag-in-dortmund': 'Geburtstag in Dortmund: Der Guide für Eltern in der Großstadt',
  'geburtstag-in-oberhausen': 'Geburtstag in Oberhausen feiern – Clown Zauberer LIAR macht\'s unvergesslich!',
  'geburtstag-in-bottrop': 'Geburtstag in Bottrop feiern – Clown Zauberer für magische Momente',
  'geburtstag-in-gelsenkirchen': 'Geburtstag in Gelsenkirchen',
  'geburtstag-in-duisburg': 'Geburtstag in Duisburg',
  'geburtstag-in-bochum': 'Geburtstag in Bochum – Clown & Zauberer für unvergessliche Momente',
  'geburtstag-in-castrop-rauxel': 'Kindergeburtstag in Castrop-Rauxel – Witzig & Magisch!',
  'geburtstag-in-moers': 'Geburtstag in Moers',
  'geburtstag-in-wesel': 'Geburtstag in Wesel',
  'geburtstag-in-xanten': 'Geburtstag in Xanten',
  'geburtstag-in-waltrop': 'Geburtstag in Waltrop',
  'geburtstag-in-datteln': 'Geburtstag in Datteln',
  'geburtstag-in-haltern-am-see': 'Geburtstag in Haltern am See',
  'geburtstag-in-herne': 'Geburtstag in Herne',
  'geburtstag-in-herten': 'Geburtstag in Herten',
  'geburtstag-in-marl': 'Geburtstag in Marl',
  'geburtstag-in-gladbeck': 'Geburtstag in Gladbeck',
  'geburtstag-in-duesseldorf': 'Geburtstag in Düsseldorf',
  'geburtstag-in-recklinghausen': 'Geburtstag in Recklinghausen',
  'geburtstag-in-dinslaken': 'Geburtstag in Dinslaken',
  'geburtstag-in-dorsten': 'Geburtstag in Dorsten',
  'geburtstag-in-muelheim': 'Geburtstag in Mülheim',
  'kinderzauberer-in-essen': 'Kinderzauberer in Essen buchen 🎩 – Fantastische Momente für Ihre Kleinen',
  'kinderzauberer-in-dortmund': 'Kinderzauberer in Dortmund – Magische Shows für Ihr Event',
  'kinderzauberer-in-duisburg': 'Kinderzauberer in Duisburg buchen – Die lustigste Show in NRW',
  'kinderzauberer-in-gelsenkirchen': 'Kinderzauberer in Gelsenkirchen buchen | Beste Bewertungen',
  'kinderzauberer-in-bochum': 'Kinderzauberer in Bochum – Zaubershow für Kindergeburtstag & Events',
  'kinderzauberer-in-oberhausen': 'Kinderzauberer in Oberhausen',
  'kinderzauberer-in-bottrop': 'Kinderzauberer in Bottrop buchen – Zaubershow für Kindergeburtstag & Events',
  'kinderzauberer-in-herne': 'Kinderzauberer in Herne buchen – Unvergessliche Zaubershow für Ihr Event',
  'kinderzauberer-in-haltern': 'Buchen Sie DEN Kinderzauberer in Haltern am See',
  'kinderzauberer-in-marl': 'Kinderzauberer in Marl – TOP Zaubershow',
  'kinderzauberer-in-recklinghausen': 'Kinderzauberer in Recklinghausen',
  'kinderzauberer-in-moers': 'Kinderzauberer in Moers',
  'kinderzauberer-in-duesseldorf': 'TOP Show mit Kinderzauberer in Düsseldorf buchen',
  'kinderzauberer-in-dinslaken': 'Kinderzauberer in Dinslaken gesucht? TOP Zaubershow',
  'kinderzauberer-in-dorsten': 'Kinderzauberer in Dorsten buchen – Zaubershow, Ballonmodellage & mehr',
  'kinderzauberer-in-muelheim': 'Kinderzauberer in Mülheim mit TOP Bewertungen',
  'kinderzauberer-in-herten': 'Kinderzauberer in Herten buchen | Erlebnis-Show für Kinder',
  'kinderzauberer-in-datteln': 'Kinderzauberer in Datteln buchen | Zaubershow für Ihr Event',
  'clown-in-essen': 'Clown in Essen ⭐ | Shows & Events | TOP bewertet | Magie pur',
  'clown-in-dortmund': 'Clown in Dortmund – LIAR | Kindergeburtstag & Events',
  'clown-in-duisburg': 'Clown in Duisburg',
  'clown-in-gelsenkirchen': 'TOP Clown in Gelsenkirchen – LIAR | Shows & Zauberkunst',
  'clown-in-bochum': 'Clown in Bochum',
  'clown-in-oberhausen': 'Clown in Oberhausen',
  'clown-in-bottrop': 'Clown in Bottrop',
  'clown-in-gladbeck': 'Clown in Gladbeck buchen – Unvergessliche Kinderunterhaltung',
  'clown-in-haltern': 'Clown in Haltern am See buchen – Kinderunterhaltung',
  'clown-in-herne': 'Clown in Herne mit TOP Bewertungen',
  'clown-in-marl': 'Clown in Marl | Zaubershow & Walk Act',
  'clown-in-recklinghausen': 'Clown Recklinghausen – Ruhrfestspiele & Kultur | TOP',
  'clown-in-duesseldorf': 'Clown Düsseldorf – LIAR | Profi-Shows & Magie',
  'clown-in-dinslaken': 'Clown in Dinslaken – LIAR buchen | Zaubershow & Clownerie',
  'clown-in-dorsten': 'Clown Dorsten – LIAR | Show, Magie & Clownerie',
  'clown-in-muelheim': 'Clown in Mülheim – Kindershow TOP',
  'clown-in-herten': 'Clown in Herten',
  'clown-in-datteln': 'Clown in Datteln – Zauberspaß & gute Laune für Dein Event',
};

// Hero images per category
const heroImages = {
  geburtstag: 'https://liar-entertainer.com/wp-content/uploads/2023/08/CLown-Kinderzauberer-Geburtstag.jpg',
  kinderzauberer: 'https://liar-entertainer.com/wp-content/uploads/2023/08/CLown-Kinderzauberer-Geburtstag.jpg',
  clown: 'https://liar-entertainer.com/wp-content/uploads/2023/08/Clown-bei-Clownshow.jpg',
};

// === HTML parsing helpers ===
function stripTags(html) {
  return html.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
}

function extractSections(html) {
  // Split by H2 tags
  const sections = [];
  const h2Regex = /<h2[^>]*>([\s\S]*?)<\/h2>/gi;
  let lastIdx = 0;
  let match;
  const h2Positions = [];

  while ((match = h2Regex.exec(html)) !== null) {
    h2Positions.push({
      heading: stripTags(match[1]),
      fullMatch: match[0],
      startIdx: match.index,
      endIdx: match.index + match[0].length,
    });
  }

  for (let i = 0; i < h2Positions.length; i++) {
    const h2 = h2Positions[i];
    const nextH2Start = i + 1 < h2Positions.length ? h2Positions[i + 1].startIdx : html.length;
    const bodyHtml = html.substring(h2.endIdx, nextH2Start);

    // Extract paragraphs
    const paragraphs = [];
    const pRegex = /<p[^>]*>([\s\S]*?)<\/p>/gi;
    let pm;
    while ((pm = pRegex.exec(bodyHtml)) !== null) {
      const text = stripTags(pm[1]);
      if (text.length > 15) paragraphs.push(text);
    }

    // Extract H3 subheadings
    const h3s = [];
    const h3Regex = /<h3[^>]*>([\s\S]*?)<\/h3>/gi;
    let h3m;
    while ((h3m = h3Regex.exec(bodyHtml)) !== null) {
      h3s.push(stripTags(h3m[1]));
    }

    // Extract images
    const images = [];
    const imgRegex = /src="(https?:\/\/[^"]*(?:liar-entertainer|optimole)[^"]*\.(jpg|jpeg|png|webp))/gi;
    let im;
    while ((im = imgRegex.exec(bodyHtml)) !== null) {
      images.push(im[1]);
    }

    // Extract FAQ (details/summary)
    const faqs = [];
    const detailsRegex = /<details[^>]*>([\s\S]*?)<\/details>/gi;
    let dm;
    while ((dm = detailsRegex.exec(bodyHtml)) !== null) {
      const summMatch = dm[1].match(/<summary[^>]*>([\s\S]*?)<\/summary>/i);
      if (summMatch) {
        const question = stripTags(summMatch[1]);
        const answer = stripTags(dm[1].replace(/<summary[\s\S]*?<\/summary>/i, ''));
        if (question && answer) faqs.push({ question, answer });
      }
    }

    // Extract FAQ pattern 2: bold questions in quotes
    if (faqs.length === 0) {
      const faqRegex = /<strong>[„"]([^<]*\?)["""]<\/strong><br\s*\/?>\s*([\s\S]*?)(?=<strong>|$)/gi;
      let fqm;
      while ((fqm = faqRegex.exec(bodyHtml)) !== null) {
        const question = stripTags(fqm[1]);
        const answer = stripTags(fqm[2]);
        if (question && answer.length > 20) faqs.push({ question, answer });
      }
    }

    sections.push({
      heading: h2.heading,
      paragraphs,
      h3s,
      images,
      faqs,
      bodyHtml,
    });
  }

  return sections;
}

function getFirstImage(html) {
  const m = html.match(/src="(https?:\/\/[^"]*liar-entertainer\.com\/wp-content\/uploads\/[^"]*\.(jpg|jpeg|png|webp))/i);
  return m ? m[1] : null;
}

function escapeAstro(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/`/g, '&#96;')
    .replace(/\{/g, '&#123;')
    .replace(/\}/g, '&#125;');
}

function escapeForJSX(text) {
  // For text inside JSX - escape curly braces and backticks
  return text
    .replace(/\{/g, '&#123;')
    .replace(/\}/g, '&#125;')
    .replace(/`/g, '&#96;');
}

// === Content section builders ===

function buildIntroSection(sections, city, introImage, pageType) {
  // First meaningful section (often intro text about the city)
  const intro = sections[0];
  if (!intro) return '';

  const paras = intro.paragraphs.slice(0, 3);
  if (paras.length === 0) return '';

  const img = introImage || 'https://liar-entertainer.com/wp-content/uploads/2023/08/Geburtstag-mit-dem-Clown-768x1024.jpg';

  return `
  <!-- Intro Section -->
  <section class="bg-white py-14">
    <div class="max-w-6xl mx-auto px-4">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
        <div>
          <h2 class="text-[#d7393e] font-bold text-xl mb-4">${escapeForJSX(intro.heading)}</h2>
${paras.map(p => `          <p class="text-[#374151] mb-4 leading-relaxed">${escapeForJSX(p)}</p>`).join('\n')}
        </div>
        <div class="flex justify-center">
          <img
            src="${img}"
            alt="${escapeAstro(pageType)} in ${escapeAstro(city)}"
            class="rounded-full object-cover"
            style="width: 320px; height: 320px;"
            loading="lazy"
          />
        </div>
      </div>
    </div>
  </section>`;
}

function buildMiddleSections(sections) {
  // Build white content sections from H2 sections that are NOT price/faq/einsatzgebiet/stats
  const skipPatterns = /Preis|Leistungspaket|kostet|Einsatzgebiet|Auch unterwegs|Regional|FAQ|ANTWORTEN|Termin.*sichern|buchen|Kontakt aufnehmen|Shows im Jahr|Erfahrung/i;

  const middleSections = sections.slice(1).filter(s => !skipPatterns.test(s.heading) && s.paragraphs.length > 0);

  if (middleSections.length === 0) return '';

  // Take max 2 middle sections to keep page manageable
  const selected = middleSections.slice(0, 2);

  return selected.map((section, idx) => {
    const bgClass = idx % 2 === 0 ? 'bg-gray-50' : 'bg-white';

    // If section has H3 subheadings, render as card grid
    if (section.h3s.length >= 2) {
      // Split paragraphs among H3s
      const cardsPerH3 = Math.ceil(section.paragraphs.length / section.h3s.length);
      return `
  <!-- ${section.heading} -->
  <section class="${bgClass} py-14">
    <div class="max-w-5xl mx-auto px-4">
      <h2 class="text-[#1f2025] font-bold text-2xl sm:text-3xl text-center mb-10">${escapeForJSX(section.heading)}</h2>
      <div class="grid grid-cols-1 md:grid-cols-${Math.min(section.h3s.length, 3)} gap-6">
${section.h3s.slice(0, 4).map((h3, i) => {
  const para = section.paragraphs[i] || '';
  return `        <div class="bg-white rounded-xl p-6 shadow-sm">
          <h3 class="font-bold text-[#1f2025] text-lg mb-3">${escapeForJSX(h3)}</h3>
          <p class="text-[#374151] leading-relaxed">${escapeForJSX(para)}</p>
        </div>`;
}).join('\n')}
      </div>
    </div>
  </section>`;
    }

    // Simple text section
    return `
  <!-- ${section.heading} -->
  <section class="${bgClass} py-14">
    <div class="max-w-4xl mx-auto px-4">
      <h2 class="text-[#1f2025] font-bold text-2xl sm:text-3xl text-center mb-6">${escapeForJSX(section.heading)}</h2>
${section.paragraphs.slice(0, 4).map(p => `      <p class="text-[#374151] mb-4 leading-relaxed">${escapeForJSX(p)}</p>`).join('\n')}
    </div>
  </section>`;
  }).join('\n');
}

function buildBlueSection(sections, city, pageType) {
  // Find a good section for the blue highlight (Warum... or any distinctive section)
  const candidates = sections.filter(s =>
    /warum|besonder|vorteil|unterscheid|auszeichn/i.test(s.heading) && s.paragraphs.length >= 2
  );

  const section = candidates[0];
  if (!section) {
    // Fallback: generic blue section
    return `
  <!-- Wave: white → blue -->
  <div style="overflow:hidden;line-height:0;background:white;display:block;">
    <svg viewBox="0 0 1440 60" preserveAspectRatio="none" style="display:block;width:100%;height:60px;">
      <path d="M0,0 Q720,60 1440,0 L1440,60 L0,60 Z" fill="#3b55d5"/>
    </svg>
  </div>
  <section class="bg-[#3b55d5] py-14 text-white text-center">
    <div class="max-w-3xl mx-auto px-4">
      <p class="text-[#ffb546] font-bold text-sm uppercase tracking-widest mb-4">${escapeForJSX(city.toUpperCase())}</p>
      <h2 class="text-white font-bold text-3xl sm:text-4xl mb-6">✨ ${escapeForJSX(pageType)} in ${escapeForJSX(city)} – mit Herz &amp; Humor</h2>
      <p class="text-blue-100 leading-relaxed mb-4">
        Meine Show ist speziell auf Kinder abgestimmt: lebendig, interaktiv und voller Überraschungen.
      </p>
      <p class="text-blue-100 leading-relaxed">
        Die Kinder dürfen mitzaubern, lachen, staunen – und manchmal selbst zur kleinen Zauberin oder zum Zauberer werden.
        Dabei achte ich besonders auf Respekt, Empathie und ein liebevolles Miteinander.
      </p>
    </div>
  </section>
  <!-- Wave: blue → white -->
  <div style="overflow:hidden;line-height:0;background:#3b55d5;display:block;">
    <svg viewBox="0 0 1440 60" preserveAspectRatio="none" style="display:block;width:100%;height:60px;">
      <path d="M0,60 Q720,0 1440,60 L1440,60 L0,60 Z" fill="white"/>
    </svg>
  </div>`;
  }

  // Build from extracted content
  const hasH3s = section.h3s.length >= 2;
  let innerContent;

  if (hasH3s) {
    // 2-column layout with H3 subheadings
    const half = Math.ceil(section.h3s.length / 2);
    const leftH3s = section.h3s.slice(0, half);
    const rightH3s = section.h3s.slice(half);

    innerContent = `
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
${leftH3s.map((h3, i) => {
  const para = section.paragraphs[i] || '';
  return `          <h3 class="text-white font-bold text-lg mb-2">${escapeForJSX(h3)}</h3>
          <p class="text-blue-100 leading-relaxed mb-6">${escapeForJSX(para)}</p>`;
}).join('\n')}
        </div>
        <div>
${rightH3s.map((h3, i) => {
  const para = section.paragraphs[half + i] || '';
  return `          <h3 class="text-white font-bold text-lg mb-2">${escapeForJSX(h3)}</h3>
          <p class="text-blue-100 leading-relaxed mb-6">${escapeForJSX(para)}</p>`;
}).join('\n')}
        </div>
      </div>`;
  } else {
    innerContent = section.paragraphs.slice(0, 4).map(p =>
      `      <p class="text-blue-100 leading-relaxed mb-4">${escapeForJSX(p)}</p>`
    ).join('\n');
  }

  return `
  <!-- Wave: white → blue -->
  <div style="overflow:hidden;line-height:0;background:white;display:block;">
    <svg viewBox="0 0 1440 60" preserveAspectRatio="none" style="display:block;width:100%;height:60px;">
      <path d="M0,0 Q720,60 1440,0 L1440,60 L0,60 Z" fill="#3b55d5"/>
    </svg>
  </div>
  <section class="bg-[#3b55d5] py-14 text-white">
    <div class="max-w-5xl mx-auto px-4">
      <p class="text-[#ffb546] font-bold text-sm uppercase tracking-widest mb-4 text-center">${escapeForJSX(city.toUpperCase())}</p>
      <h2 class="text-white font-bold text-3xl sm:text-4xl mb-10 text-center">${escapeForJSX(section.heading)}</h2>
${innerContent}
    </div>
  </section>
  <!-- Wave: blue → white -->
  <div style="overflow:hidden;line-height:0;background:#3b55d5;display:block;">
    <svg viewBox="0 0 1440 60" preserveAspectRatio="none" style="display:block;width:100%;height:60px;">
      <path d="M0,60 Q720,0 1440,60 L1440,60 L0,60 Z" fill="white"/>
    </svg>
  </div>`;
}

function buildFAQSection(sections, city, defaultFAQs) {
  // Try to find FAQ from scraped content
  let faqs = [];
  for (const s of sections) {
    if (s.faqs.length > 0) {
      faqs = s.faqs;
      break;
    }
  }

  if (faqs.length === 0) faqs = defaultFAQs;
  if (faqs.length === 0) return '';

  return `
  <!-- FAQ -->
  <section class="bg-gray-50 py-14">
    <div class="max-w-3xl mx-auto px-4">
      <h2 class="text-center font-bold text-[#1f2025] text-sm uppercase tracking-widest mb-2">NOCH FRAGEN?</h2>
      <h3 class="text-center font-bold text-[#1f2025] text-2xl sm:text-3xl mb-10">
        Hier sind ein paar Antworten
      </h3>

      <div class="space-y-3" id="faq-list">
${faqs.slice(0, 5).map(faq => `        <div class="faq-item bg-white border border-gray-200 rounded-lg overflow-hidden">
          <button
            class="faq-btn w-full text-left px-6 py-4 font-semibold text-[#1f2025] flex items-center justify-between gap-4"
            aria-expanded="false"
          >
            <span>${escapeForJSX(faq.question)}</span>
            <svg class="w-5 h-5 flex-shrink-0 transition-transform faq-chevron" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <div class="faq-answer hidden px-6 pb-5 text-[#374151] leading-relaxed">
            ${escapeForJSX(faq.answer)}
          </div>
        </div>`).join('\n')}
      </div>
    </div>
  </section>`;
}

function getEinsatzgebietText(slug, city) {
  // Find einsatzgebiet section from scraped content
  const scraped = scrapedData[slug];
  if (!scraped) return null;
  const html = scraped.scrapedHtml;

  // Look for einsatzgebiet paragraph
  const match = html.match(/(?:Neben|regelmäßig in|unterwegs in|Einsatzgebiet)[^<]*(?:<[^>]+>[^<]*)*(?:Neuss|Ratingen|Oberhausen|Gelsenkirchen|Essen|Duisburg|Bochum|Dortmund)[^<]*/i);
  if (match) {
    return stripTags(match[0]);
  }
  return null;
}

// === Page type configs ===
const pageTypeConfig = {
  geburtstag: {
    heroSubtitle: (city) => `Unvergessliche Kindergeburtstage mit Clown Zauberer LIAR – Lachen, Staunen und pure Magie!`,
    breadcrumbParent: { label: 'Kindergeburtstag', href: '/kindergeburtstag/' },
    seoPrefix: (city) => `Kindergeburtstag in ${city}`,
    serviceType: 'Kindergeburtstag',
    keywords: (city) => `Kindergeburtstag ${city}, Geburtstag ${city}, Clown Kindergeburtstag ${city}, Zauberer Geburtstag ${city}, Kinderparty ${city}, NRW`,
    outputDir: (slug) => `src/pages/kindergeburtstag/${slug}`,
    canonical: (slug) => `https://liar-entertainer.com/kindergeburtstag/${slug}/`,
    layoutImport: `import BaseLayout from '../../../layouts/BaseLayout.astro';
import karteImg from '../../../assets/images/home/clown-zauberer-gladbeck-karte.jpg';
import { Image } from 'astro:assets';
import GoogleReviews from '../../../components/GoogleReviews.astro';`,
  },
  kinderzauberer: {
    heroSubtitle: (city) => `Magische Zaubershow für Kinder in ${city} – Staunen, Lachen und unvergessliche Momente!`,
    breadcrumbParent: { label: 'Kinderzauberer', href: '/kinderzauberer/' },
    seoPrefix: (city) => `Kinderzauberer in ${city}`,
    serviceType: 'Kinderzauberer',
    keywords: (city) => `Kinderzauberer ${city}, Kinderzauberer in ${city}, Zauberer ${city}, Kindergeburtstag ${city}, Zaubershow ${city}, NRW`,
    outputDir: (slug) => `src/pages/kinderzauberer/${slug}`,
    canonical: (slug) => `https://liar-entertainer.com/kinderzauberer/${slug}/`,
    layoutImport: `import BaseLayout from '../../../layouts/BaseLayout.astro';
import karteImg from '../../../assets/images/home/clown-zauberer-gladbeck-karte.jpg';
import { Image } from 'astro:assets';
import GoogleReviews from '../../../components/GoogleReviews.astro';`,
  },
  clown: {
    heroSubtitle: (city) => `Clownshow und Unterhaltung in ${city} – Spaß, Lachen und gute Laune für Groß und Klein!`,
    breadcrumbParent: { label: 'Clownshow', href: '/clown/clownshow/' },
    seoPrefix: (city) => `Clown in ${city}`,
    serviceType: 'Clownshow',
    keywords: (city) => `Clown ${city}, Clown in ${city}, Clownshow ${city}, Clown buchen ${city}, Zauberer ${city}, NRW`,
    outputDir: (slug) => `src/pages/clown/clownshow/${slug}`,
    canonical: (slug) => `https://liar-entertainer.com/clown/clownshow/${slug}/`,
    layoutImport: `import BaseLayout from '../../../../layouts/BaseLayout.astro';
import karteImg from '../../../../assets/images/home/clown-zauberer-gladbeck-karte.jpg';
import { Image } from 'astro:assets';
import GoogleReviews from '../../../../components/GoogleReviews.astro';`,
  },
};

// Standard FAQs when none found in scraped content
const defaultFAQs = [
  {
    question: 'Was braucht Clown LIAR für einen Auftritt?',
    answer: 'Ohne Vorbereitungszeit und mit einer Fläche von 2×2 Meter kann ich eine Show vorführen: Wohnzimmer, Kinderzimmer, Partykeller, Terrasse, Gartenanlage, große und kleine Bühne, Kindergarten, Turnhalle… Ob drinnen oder draußen, das Programm lässt sich spontan und flexibel ausführen!',
  },
  {
    question: 'Wieviel Platz braucht man für das Programm?',
    answer: 'LIAR ist ziemlich pflegeleicht: für die Show ist es wichtig, dass die Kinder gemütlich und ungestört sitzen können!!! Bei der Ballonmodellage ist nichts weiteres nötig. Bei GLITZER TATTOOS wären schon 2 Stühle und einen Tisch wichtig!',
  },
  {
    question: 'Wie viele Kinder sollten überhaupt eingeladen werden?',
    answer: 'Natürlich soll das Kind seine Freunde einladen. Allerdings sollte man eine feste Zahl als Limit vorgeben. Pädagogen empfehlen, maximal genauso viele Gäste einzuladen, wie das Kind alt wird. Wer kommen darf, soll das Kind selbst bestimmen. Natürlich sind auch dabei die Aufsichtspersonen (mindestens 2) nicht zu vergessen.',
  },
];

// Einsatzgebiet city links by type
function buildCityLinks(pageType) {
  if (pageType === 'geburtstag') {
    return `            <a href="/kindergeburtstag/geburtstag-in-bochum/" class="text-[#d7393e] hover:underline text-sm">Bochum</a> |
            <a href="/kindergeburtstag/geburtstag-in-bottrop/" class="text-[#d7393e] hover:underline text-sm">Bottrop</a> |
            <a href="/kindergeburtstag/geburtstag-in-castrop-rauxel/" class="text-[#d7393e] hover:underline text-sm">Castrop-Rauxel</a> |
            <a href="/kindergeburtstag/geburtstag-in-datteln/" class="text-[#d7393e] hover:underline text-sm">Datteln</a> |
            <a href="/kindergeburtstag/geburtstag-in-dinslaken/" class="text-[#d7393e] hover:underline text-sm">Dinslaken</a> |
            <a href="/kindergeburtstag/geburtstag-in-dorsten/" class="text-[#d7393e] hover:underline text-sm">Dorsten</a> |
            <a href="/kindergeburtstag/geburtstag-in-dortmund/" class="text-[#d7393e] hover:underline text-sm">Dortmund</a> |
            <a href="/kindergeburtstag/geburtstag-in-duesseldorf/" class="text-[#d7393e] hover:underline text-sm">Düsseldorf</a> |
            <a href="/kindergeburtstag/geburtstag-in-duisburg/" class="text-[#d7393e] hover:underline text-sm">Duisburg</a> |
            <a href="/kindergeburtstag/geburtstag-in-essen/" class="text-[#d7393e] hover:underline text-sm">Essen</a> |
            <a href="/kindergeburtstag/geburtstag-in-gelsenkirchen/" class="text-[#d7393e] hover:underline text-sm">Gelsenkirchen</a> |
            <a href="/kindergeburtstag/geburtstag-in-gladbeck/" class="text-[#d7393e] hover:underline text-sm">Gladbeck</a> |
            <a href="/kindergeburtstag/geburtstag-in-haltern-am-see/" class="text-[#d7393e] hover:underline text-sm">Haltern am See</a> |
            <a href="/kindergeburtstag/geburtstag-in-herne/" class="text-[#d7393e] hover:underline text-sm">Herne</a> |
            <a href="/kindergeburtstag/geburtstag-in-herten/" class="text-[#d7393e] hover:underline text-sm">Herten</a> |
            <a href="/kindergeburtstag/geburtstag-in-marl/" class="text-[#d7393e] hover:underline text-sm">Marl</a> |
            <a href="/kindergeburtstag/geburtstag-in-moers/" class="text-[#d7393e] hover:underline text-sm">Moers</a> |
            <a href="/kindergeburtstag/geburtstag-in-muelheim/" class="text-[#d7393e] hover:underline text-sm">Mülheim</a> |
            <a href="/kindergeburtstag/geburtstag-in-oberhausen/" class="text-[#d7393e] hover:underline text-sm">Oberhausen</a> |
            <a href="/kindergeburtstag/geburtstag-in-recklinghausen/" class="text-[#d7393e] hover:underline text-sm">Recklinghausen</a> |
            <a href="/kindergeburtstag/geburtstag-in-waltrop/" class="text-[#d7393e] hover:underline text-sm">Waltrop</a> |
            <a href="/kindergeburtstag/geburtstag-in-wesel/" class="text-[#d7393e] hover:underline text-sm">Wesel</a> |
            <a href="/kindergeburtstag/geburtstag-in-xanten/" class="text-[#d7393e] hover:underline text-sm">Xanten</a>`;
  }
  if (pageType === 'kinderzauberer') {
    return `            <a href="/kinderzauberer/kinderzauberer-in-bochum/" class="text-[#d7393e] hover:underline text-sm">Bochum</a> |
            <a href="/kinderzauberer/kinderzauberer-in-bottrop/" class="text-[#d7393e] hover:underline text-sm">Bottrop</a> |
            <a href="/kinderzauberer/kinderzauberer-in-datteln/" class="text-[#d7393e] hover:underline text-sm">Datteln</a> |
            <a href="/kinderzauberer/kinderzauberer-in-dinslaken/" class="text-[#d7393e] hover:underline text-sm">Dinslaken</a> |
            <a href="/kinderzauberer/kinderzauberer-in-dorsten/" class="text-[#d7393e] hover:underline text-sm">Dorsten</a> |
            <a href="/kinderzauberer/kinderzauberer-in-dortmund/" class="text-[#d7393e] hover:underline text-sm">Dortmund</a> |
            <a href="/kinderzauberer/kinderzauberer-in-duesseldorf/" class="text-[#d7393e] hover:underline text-sm">Düsseldorf</a> |
            <a href="/kinderzauberer/kinderzauberer-in-duisburg/" class="text-[#d7393e] hover:underline text-sm">Duisburg</a> |
            <a href="/kinderzauberer/kinderzauberer-in-essen/" class="text-[#d7393e] hover:underline text-sm">Essen</a> |
            <a href="/kinderzauberer/kinderzauberer-in-gelsenkirchen/" class="text-[#d7393e] hover:underline text-sm">Gelsenkirchen</a> |
            <a href="/kinderzauberer/kinderzauberer-in-haltern/" class="text-[#d7393e] hover:underline text-sm">Haltern am See</a> |
            <a href="/kinderzauberer/kinderzauberer-in-herne/" class="text-[#d7393e] hover:underline text-sm">Herne</a> |
            <a href="/kinderzauberer/kinderzauberer-in-herten/" class="text-[#d7393e] hover:underline text-sm">Herten</a> |
            <a href="/kinderzauberer/kinderzauberer-in-marl/" class="text-[#d7393e] hover:underline text-sm">Marl</a> |
            <a href="/kinderzauberer/kinderzauberer-in-moers/" class="text-[#d7393e] hover:underline text-sm">Moers</a> |
            <a href="/kinderzauberer/kinderzauberer-in-muelheim/" class="text-[#d7393e] hover:underline text-sm">Mülheim</a> |
            <a href="/kinderzauberer/kinderzauberer-in-oberhausen/" class="text-[#d7393e] hover:underline text-sm">Oberhausen</a> |
            <a href="/kinderzauberer/kinderzauberer-in-recklinghausen/" class="text-[#d7393e] hover:underline text-sm">Recklinghausen</a>`;
  }
  // clown
  return `            <a href="/clown/clownshow/clown-in-bochum/" class="text-[#d7393e] hover:underline text-sm">Bochum</a> |
            <a href="/clown/clownshow/clown-in-bottrop/" class="text-[#d7393e] hover:underline text-sm">Bottrop</a> |
            <a href="/clown/clownshow/clown-in-datteln/" class="text-[#d7393e] hover:underline text-sm">Datteln</a> |
            <a href="/clown/clownshow/clown-in-dinslaken/" class="text-[#d7393e] hover:underline text-sm">Dinslaken</a> |
            <a href="/clown/clownshow/clown-in-dorsten/" class="text-[#d7393e] hover:underline text-sm">Dorsten</a> |
            <a href="/clown/clownshow/clown-in-dortmund/" class="text-[#d7393e] hover:underline text-sm">Dortmund</a> |
            <a href="/clown/clownshow/clown-in-duesseldorf/" class="text-[#d7393e] hover:underline text-sm">Düsseldorf</a> |
            <a href="/clown/clownshow/clown-in-duisburg/" class="text-[#d7393e] hover:underline text-sm">Duisburg</a> |
            <a href="/clown/clownshow/clown-in-essen/" class="text-[#d7393e] hover:underline text-sm">Essen</a> |
            <a href="/clown/clownshow/clown-in-gelsenkirchen/" class="text-[#d7393e] hover:underline text-sm">Gelsenkirchen</a> |
            <a href="/clown/clownshow/clown-in-gladbeck/" class="text-[#d7393e] hover:underline text-sm">Gladbeck</a> |
            <a href="/clown/clownshow/clown-in-haltern/" class="text-[#d7393e] hover:underline text-sm">Haltern am See</a> |
            <a href="/clown/clownshow/clown-in-herne/" class="text-[#d7393e] hover:underline text-sm">Herne</a> |
            <a href="/clown/clownshow/clown-in-herten/" class="text-[#d7393e] hover:underline text-sm">Herten</a> |
            <a href="/clown/clownshow/clown-in-marl/" class="text-[#d7393e] hover:underline text-sm">Marl</a> |
            <a href="/clown/clownshow/clown-in-muelheim/" class="text-[#d7393e] hover:underline text-sm">Mülheim</a> |
            <a href="/clown/clownshow/clown-in-oberhausen/" class="text-[#d7393e] hover:underline text-sm">Oberhausen</a> |
            <a href="/clown/clownshow/clown-in-recklinghausen/" class="text-[#d7393e] hover:underline text-sm">Recklinghausen</a>`;
}

// === MAIN GENERATOR ===
function generatePage(slug, pageType) {
  const config = pageTypeConfig[pageType];
  const scraped = scrapedData[slug];
  if (!scraped) {
    console.error(`  SKIP ${slug}: no scraped data`);
    return null;
  }

  const city = toDisplayCity(slug);
  const h1 = originalH1[slug] || `${config.seoPrefix(city)}`;
  const heroImg = heroImages[pageType];
  const sections = extractSections(scraped.scrapedHtml);
  const firstImage = getFirstImage(scraped.scrapedHtml);

  // Get SEO data from pages.json
  const pageData = pagesData.find(p => p.slug === slug);
  const seoTitle = pageData?.meta?.rank_math_title
    ? pageData.meta.rank_math_title
        .replace(/%title%/g, pageData.title)
        .replace(/%sitename%/g, 'Clown Zauberer LIAR')
        .replace(/%sep%/g, '|')
        .replace(/%page%/g, '')
        .replace(/\s{2,}/g, ' ')
        .trim()
    : `${h1} | Clown Zauberer LIAR`;

  const seoDesc = (pageData?.meta?.rank_math_description || '').trim() ||
    `${config.seoPrefix(city)} mit Clown Zauberer LIAR ✓ Zaubershow ab 150€ ✓ TOP bewertet ✓ Jetzt buchen!`;

  // Build page sections
  const introSection = buildIntroSection(sections, city, firstImage, config.serviceType);
  const blueSection = buildBlueSection(sections, city, config.serviceType);
  const middleSections = buildMiddleSections(sections);
  const faqSection = buildFAQSection(sections, city, defaultFAQs);
  const cityLinks = buildCityLinks(pageType);

  const astroContent = `---
${config.layoutImport}

const seoTitle = ${JSON.stringify(seoTitle)};
const seoDescription = ${JSON.stringify(seoDesc.substring(0, 160))};
const heroImg = '${heroImg}';

const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  name: '${config.serviceType} mit Clown Zauberer in ${city}',
  description: seoDescription,
  provider: {
    '@type': 'LocalBusiness',
    name: 'Clown Zauberer LIAR',
    url: 'https://liar-entertainer.com',
    telephone: '+491721517578',
  },
  areaServed: { '@type': 'City', name: '${city}' },
  offers: { '@type': 'Offer', price: '150', priceCurrency: 'EUR', description: '40 Minuten Zaubershow' },
};
---

<BaseLayout
  title={seoTitle}
  description={seoDescription}
  keywords="${config.keywords(city)}"
  canonical="${config.canonical(slug)}"
  ogImage={heroImg}
  structuredData={structuredData}
>

  <!-- Hero Section -->
  <section class="relative overflow-hidden" style="min-height: 500px;">
    <div class="absolute inset-0 bg-cover bg-center" style={\`background-image: url('\${heroImg}'); background-position: center 30%;\`}></div>
    <div class="absolute inset-0 bg-black/50"></div>
    <div class="relative flex flex-col items-center justify-center text-center px-6" style="min-height: 500px;">
      <div class="inline-flex items-center gap-2 bg-white/20 text-white rounded-full px-4 py-1.5 text-sm font-medium mb-4 backdrop-blur-sm">
        <span>📍</span> ${escapeForJSX(city)}
      </div>
      <h1 class="text-white font-extrabold text-center leading-tight mb-3" style="font-size: clamp(2rem, 5vw, 3.5rem); text-shadow: 2px 2px 8px rgba(0,0,0,0.5);">
        ${escapeForJSX(h1)}
      </h1>
      <p class="text-gray-200 text-base leading-relaxed max-w-xl mx-auto">
        ${escapeForJSX(config.heroSubtitle(city))}
      </p>
    </div>
  </section>

  <!-- Breadcrumb -->
  <section class="bg-white pt-4 pb-0">
    <div class="max-w-6xl mx-auto px-4">
      <nav class="text-sm text-[#7c7c7c]">
        <a href="/" class="text-[#d7393e] hover:underline">Clown</a>
        <span class="mx-1">»</span>
        <a href="${config.breadcrumbParent.href}" class="text-[#d7393e] hover:underline">${config.breadcrumbParent.label}</a>
        <span class="mx-1">»</span>
        <span>${escapeForJSX(h1)}</span>
      </nav>
    </div>
  </section>
${introSection}
${blueSection}

  <!-- Die Preise -->
  <section class="bg-white py-14">
    <div class="max-w-6xl mx-auto px-4">
      <h2 class="text-[#d7393e] font-bold text-3xl sm:text-4xl text-center mb-10">Die Preise</h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="bg-white rounded-xl p-8 shadow-sm border-t-4 border-[#d7393e]">
          <h3 class="font-bold text-[#1f2025] text-xl mb-2">🎩 Zaubershow</h3>
          <p class="text-[#d7393e] font-bold text-2xl mb-4">150 €</p>
          <ul class="space-y-2 text-[#374151] text-sm mb-6">
            <li class="flex items-start gap-2"><span class="text-[#d7393e]">✓</span> 40 Minuten voller Zauber, Lachen und Staunen</li>
            <li class="flex items-start gap-2"><span class="text-[#d7393e]">✓</span> Bis ca. 12 Kinder – Mindestalter: 4 Jahre</li>
            <li class="flex items-start gap-2"><span class="text-[#d7393e]">✓</span> Inkl. Material</li>
            <li class="flex items-start gap-2"><span class="text-[#d7393e]">✓</span> Das Geburtstagskind steht immer im Mittelpunkt</li>
            <li class="flex items-start gap-2"><span class="text-[#d7393e]">✓</span> zzgl. Fahrtkosten (0,4€/km) ab 45966 Gladbeck</li>
          </ul>
          <p class="text-[#374151] text-sm">Direkt ab der ersten Minute nimmt die Show die kleinen Gäste mit auf eine fantasievolle Reise!</p>
        </div>
        <div class="bg-white rounded-xl p-8 shadow-sm border-t-4 border-[#3b55d5]">
          <h3 class="font-bold text-[#1f2025] text-xl mb-2">🎈 Luftballonmodellage</h3>
          <p class="text-[#3b55d5] font-bold text-2xl mb-4">+ 20 €</p>
          <ul class="space-y-2 text-[#374151] text-sm mb-6">
            <li class="flex items-start gap-2"><span class="text-[#3b55d5]">✓</span> Für jedes Kind 1 Ballon</li>
            <li class="flex items-start gap-2"><span class="text-[#3b55d5]">✓</span> Ca. 15 Minuten</li>
            <li class="flex items-start gap-2"><span class="text-[#3b55d5]">✓</span> Tolle Erinnerung zum Mitnehmen</li>
            <li class="flex items-start gap-2"><span class="text-[#3b55d5]">✓</span> Große Auswahl an Figuren: Hund, Schwert, Blume u.v.m.</li>
            <li class="flex items-start gap-2"><span class="text-[#3b55d5]">✓</span> Perfekte Ergänzung zur Zaubershow</li>
          </ul>
          <p class="text-[#374151] text-sm">Ob Schwerter, Hunde oder Blumen – die Kinder staunen, wenn aus einem Ballon ihre Wunschfigur entsteht!</p>
        </div>
        <div class="bg-white rounded-xl p-8 shadow-sm border-t-4 border-[#ffb546]">
          <h3 class="font-bold text-[#1f2025] text-xl mb-2">✨ Glitzer-Tattoos</h3>
          <p class="text-[#d7393e] font-bold text-2xl mb-4">+ 40 €</p>
          <ul class="space-y-2 text-[#374151] text-sm mb-6">
            <li class="flex items-start gap-2"><span class="text-[#d7393e]">✓</span> Für jedes Kind 1 Tattoo</li>
            <li class="flex items-start gap-2"><span class="text-[#d7393e]">✓</span> Ca. 30 Minuten</li>
            <li class="flex items-start gap-2"><span class="text-[#d7393e]">✓</span> Hautverträglich &amp; langanhaltend</li>
            <li class="flex items-start gap-2"><span class="text-[#d7393e]">✓</span> Viele Motive: Einhörner, Schmetterlinge, Sterne u.v.m.</li>
            <li class="flex items-start gap-2"><span class="text-[#d7393e]">✓</span> Hält mehrere Tage auf der Haut</li>
          </ul>
          <p class="text-[#374151] text-sm">Ein funkelndes Highlight, das die Kinder noch Tage nach der Feier begeistert!</p>
        </div>
      </div>
      <div class="text-center mt-10">
        <a href="/kontakt/" class="inline-block bg-[#d7393e] hover:bg-[#b62e32] text-white font-bold px-10 py-4 rounded transition-colors text-base">
          Jetzt unverbindlich anfragen
        </a>
      </div>
    </div>
  </section>
${middleSections}

  <!-- Wave: white → red (Stats) -->
  <div style="overflow:hidden;line-height:0;background:white;display:block;">
    <svg viewBox="0 0 1440 60" preserveAspectRatio="none" style="display:block;width:100%;height:60px;">
      <path d="M0,0 Q720,60 1440,0 L1440,60 L0,60 Z" fill="#d7393e"/>
    </svg>
  </div>

  <!-- Stats Banner -->
  <section class="bg-[#d7393e] py-10 text-white text-center">
    <div class="max-w-5xl mx-auto px-4">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="bg-white/15 rounded-xl p-6">
          <div class="text-3xl mb-2">🪄</div>
          <div class="text-4xl font-extrabold">400</div>
          <div class="text-sm mt-1">Shows im Jahr</div>
        </div>
        <div class="bg-white/15 rounded-xl p-6">
          <div class="text-3xl mb-2">😊</div>
          <div class="text-4xl font-extrabold">110.000</div>
          <div class="text-sm mt-1">Lachende Kinder</div>
        </div>
        <div class="bg-white/15 rounded-xl p-6">
          <div class="text-3xl mb-2">🪄</div>
          <div class="text-4xl font-extrabold">15</div>
          <div class="text-sm mt-1">Jahre Erfahrung</div>
        </div>
      </div>
    </div>
  </section>

  <!-- Wave: red → white -->
  <div style="overflow:hidden;line-height:0;background:#d7393e;display:block;">
    <svg viewBox="0 0 1440 60" preserveAspectRatio="none" style="display:block;width:100%;height:60px;">
      <path d="M0,60 Q720,0 1440,60 L1440,60 L0,60 Z" fill="white"/>
    </svg>
  </div>

  <!-- Google Reviews -->
  <GoogleReviews />
${faqSection}

  <!-- Einsatzgebiet -->
  <section class="bg-white py-14">
    <div class="max-w-6xl mx-auto px-4">
      <h2 class="text-[#d7393e] font-bold text-2xl text-center mb-10">Regional und deutschlandweit</h2>
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
        <div>
          <h3 class="font-bold text-[#1f2025] mb-3">Haupteinsatzgebiet</h3>
          <p class="text-[#374151] mb-4 leading-relaxed">
            Gladbeck | Oberhausen | Gelsenkirchen | Essen | Duisburg | Bottrop | Bochum | Dinslaken | Wesel | Castrop-Rauxel | Dorsten | Herten | Herne | Marl | Mülheim | Recklinghausen
          </p>
          <h3 class="font-bold text-[#1f2025] mb-3">${escapeForJSX(config.serviceType)} in Ihrer Stadt</h3>
          <div class="flex flex-wrap gap-2 mb-6">
${cityLinks}
          </div>
          <p class="text-[#374151] leading-relaxed">
            Auf Anfrage bin ich auch außerhalb von NRW buchbar – inklusive Belgien, Frankreich, Österreich und Schweiz!
          </p>
        </div>
        <div>
          <Image
            src={karteImg}
            alt="Karte Einsatzgebiet ${config.serviceType} ${city}"
            class="rounded-lg w-full h-auto"
            widths={[400, 600, 800]}
            sizes="(max-width: 1024px) 100vw, 50vw"
            loading="lazy"
          />
        </div>
      </div>
    </div>
  </section>

  <!-- Contact Section -->
  <section class="bg-white py-10 border-t border-gray-100">
    <div class="max-w-3xl mx-auto px-4 text-center">
      <p class="font-bold text-[#1f2025] text-lg mb-2">Clown Zauberer LIAR</p>
      <p class="text-[#374151] mb-2">Anschrift: Beethovenstr. 15, 45966 Gladbeck</p>
      <p class="text-[#374151] mb-4">
        TEL: <a href="tel:+491721517578" class="hover:text-[#d7393e] transition-colors">0172 – 1517578</a>
        &nbsp;|&nbsp;
        Email: <a href="mailto:info@liar-entertainer.com" class="hover:text-[#d7393e] transition-colors">info@liar-entertainer.com</a>
      </p>
      <a href="/kontakt/" class="inline-block bg-[#d7393e] hover:bg-[#b62e32] text-white font-bold px-8 py-3 rounded transition-colors">
        Kontaktformular
      </a>
    </div>
  </section>

</BaseLayout>

<script>
  document.querySelectorAll('.faq-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const answer = btn.nextElementSibling as HTMLElement;
      const chevron = btn.querySelector('.faq-chevron');
      const isOpen = !answer?.classList.contains('hidden');
      if (isOpen) {
        answer?.classList.add('hidden');
        chevron?.classList.remove('rotate-180');
        btn.setAttribute('aria-expanded', 'false');
      } else {
        answer?.classList.remove('hidden');
        chevron?.classList.add('rotate-180');
        btn.setAttribute('aria-expanded', 'true');
      }
    });
  });
</script>
`;

  return astroContent;
}

// === RUN ===
let generated = 0;
let skipped = 0;
let errors = 0;

for (const page of pagesData) {
  const slug = page.slug;
  let pageType = null;

  if (slug.startsWith('geburtstag-in-')) pageType = 'geburtstag';
  else if (slug.startsWith('kinderzauberer-in-')) pageType = 'kinderzauberer';
  else if (slug.startsWith('clown-in-')) pageType = 'clown';
  else continue;

  // Skip already-built Düsseldorf page
  if (slug === 'geburtstag-in-duesseldorf') {
    console.log(`  SKIP ${slug} (manually built)`);
    skipped++;
    continue;
  }

  const config = pageTypeConfig[pageType];
  const outDir = path.join(ROOT, config.outputDir(slug));
  const outFile = path.join(outDir, 'index.astro');

  try {
    const content = generatePage(slug, pageType);
    if (!content) {
      errors++;
      continue;
    }

    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(outFile, content, 'utf-8');
    console.log(`  OK ${slug} → ${config.outputDir(slug)}/index.astro`);
    generated++;
  } catch (err) {
    console.error(`  ERROR ${slug}: ${err.message}`);
    errors++;
  }
}

console.log(`\n=== DONE ===`);
console.log(`Generated: ${generated}`);
console.log(`Skipped: ${skipped}`);
console.log(`Errors: ${errors}`);
