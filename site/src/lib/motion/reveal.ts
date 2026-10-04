/**
 * Scroll reveals, library-free (IntersectionObserver + Web Animations API) so they cost
 * almost nothing on first load. Markup opts in with data-reveal (or legacy class="reveal"):
 *   data-reveal            – rise in (default)
 *   data-reveal="pop"      – springy pop (kids)
 *   data-reveal="puff"     – pop + a little smoke puff (kids "magic", CSS in motion.css)
 *   data-reveal="tilt"     – swing in from a slight angle
 *   data-reveal="deal"     – dealt like a playing card from the top of its section (adult)
 *   data-reveal="flip"     – turned over from its back (needs a .card-back child)
 *   data-reveal="draw"     – line drawn left to right (clip-path, see motion.css)
 *   data-reveal-delay="0.1" – seconds, for hand-made staggers
 *
 * Content is visible by default. Hiding only happens under html.motion-ok, which is set
 * here and never under prefers-reduced-motion. Never reveal the LCP hero.
 */
const SELECTOR = '[data-reveal], .reveal';
const IDENTITY_2D = 'translate(0px, 0px) rotate(0deg) scale(1)';
// curves from the animate skill (tokens.css --ease-out / --ease-spring)
const EASE_OUT = 'cubic-bezier(0.23, 1, 0.32, 1)';
const EASE_SPRING = 'cubic-bezier(0.34, 1.56, 0.64, 1)';

type Variant = { from: string; to: string; spring?: boolean; duration: number };

const VARIANTS: Record<string, Variant> = {
  up: { from: 'translate(0px, 16px) rotate(0deg) scale(1)', to: IDENTITY_2D, duration: 600 },
  pop: { from: 'translate(0px, 24px) rotate(-3deg) scale(0.92)', to: IDENTITY_2D, spring: true, duration: 650 },
  puff: { from: 'translate(0px, 8px) rotate(0deg) scale(0.9)', to: IDENTITY_2D, spring: true, duration: 600 },
  tilt: { from: 'translate(0px, 32px) rotate(-5deg) scale(1)', to: IDENTITY_2D, duration: 700 },
  deal: { from: IDENTITY_2D, to: IDENTITY_2D, spring: true, duration: 750 }, // "from" is measured per card
  flip: { from: 'perspective(1000px) rotateY(180deg)', to: 'perspective(1000px) rotateY(0deg)', duration: 900 },
  draw: { from: IDENTITY_2D, to: IDENTITY_2D, duration: 900 },
};

function variantOf(el: HTMLElement): Variant {
  return VARIANTS[el.dataset.reveal || 'up'] ?? VARIANTS.up;
}

/** A dealt card starts on a virtual deck above the centre of its section, rotated. */
function dealOrigin(el: HTMLElement): string {
  const section = el.closest('section') ?? document.body;
  const s = section.getBoundingClientRect();
  const r = el.getBoundingClientRect();
  const dx = s.left + s.width / 2 - (r.left + r.width / 2);
  const dy = Math.max(-260, -(r.top - s.top) - 80);
  const spin = (Math.random() * 24 - 12).toFixed(1);
  return `translate(${dx.toFixed(0)}px, ${dy.toFixed(0)}px) rotate(${spin}deg) scale(0.9)`;
}

function legacyDelay(el: Element): number {
  // getAttribute, not className: on <svg> className is an SVGAnimatedString.
  const m = (el.getAttribute('class') ?? '').match(/\bdelay-(\d+)\b/);
  return m ? Number(m[1]) / 1000 : 0;
}

function reveal(el: HTMLElement): void {
  el.classList.add('is-revealing'); // CSS-driven parts (draw wipe, puff cloud) start with the reveal
  const v = variantOf(el);
  const delay = Number(el.dataset.revealDelay ?? legacyDelay(el)) * 1000;
  const anim = el.animate(
    [
      { transform: el.style.transform || v.from, opacity: 0 },
      { transform: v.to, opacity: 1 },
    ],
    { duration: v.duration, delay, easing: v.spring ? EASE_SPRING : EASE_OUT, fill: 'both' },
  );
  anim.finished
    .then(() => {
      el.classList.add('is-in'); // first: CSS stops hiding
      el.style.transform = '';
      anim.cancel(); // drop the fill; the element now rests in its natural state
    })
    .catch(() => el.classList.add('is-in'));
}

export function initReveals(): void {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  document.documentElement.classList.add('motion-ok');

  // Measure everything first, then write: interleaving reads and writes forces a layout per card.
  const els = [...document.querySelectorAll<HTMLElement>(SELECTOR)];
  const starts = els.map((el) => (el.dataset.reveal === 'deal' ? dealOrigin(el) : variantOf(el).from));
  els.forEach((el, i) => (el.style.transform = starts[i]));

  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        io.unobserve(e.target);
        // One broken element must never stop its neighbours from appearing.
        try {
          reveal(e.target as HTMLElement);
        } catch {
          e.target.classList.add('is-in');
        }
      }
    },
    { rootMargin: '0px 0px -10% 0px' },
  );
  els.forEach((el) => io.observe(el));
}
