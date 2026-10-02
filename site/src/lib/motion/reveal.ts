import { animate, inView } from 'motion';

/** New markup uses data-reveal; legacy markup uses class="reveal" (+ delay-100/200/300). */
const REVEAL = '[data-reveal], .reveal';

function delayOf(el: HTMLElement): number {
  if (el.dataset.revealDelay) return Number(el.dataset.revealDelay);
  const legacy = el.className.match(/\bdelay-(\d+)\b/);
  return legacy ? Number(legacy[1]) / 1000 : 0;
}

/**
 * Scroll-reveal. Content is visible by default; it is only hidden (via
 * html.motion-ok) once this script runs and the user has not asked for
 * reduced motion. Never put a reveal on the LCP hero.
 */
export function initReveals(): void {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  document.documentElement.classList.add('motion-ok');

  inView(
    REVEAL,
    (el) => {
      animate(
        el,
        { opacity: 1, transform: 'translateY(0)' },
        { duration: 0.6, delay: delayOf(el as HTMLElement), ease: [0.22, 1, 0.36, 1] },
      );
    },
    { margin: '0px 0px -10% 0px' },
  );
}
