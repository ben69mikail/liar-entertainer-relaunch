import { animate, inView } from 'motion';

/**
 * Scroll-reveal for [data-reveal] elements. Content is visible by default;
 * it is only hidden (via html.motion-ok) once this script runs and the user
 * has not asked for reduced motion. Never put data-reveal on the LCP hero.
 */
export function initReveals(): void {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  document.documentElement.classList.add('motion-ok');

  inView(
    '[data-reveal]',
    (el) => {
      const delay = Number((el as HTMLElement).dataset.revealDelay ?? 0);
      animate(el, { opacity: 1, transform: 'translateY(0)' }, { duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] });
    },
    { margin: '0px 0px -10% 0px' },
  );
}
