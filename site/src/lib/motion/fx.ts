import { initReveals } from './reveal';

/**
 * One entry point for every effect on a v2 page. Markup declares, this wires.
 * Core (this file, no library, runs at once): reveals (see reveal.ts) and
 *   data-letters        h1 letters hop once on load (transform only: text never hidden → LCP safe)
 * Rich (fx-rich.ts, loads the motion library when the browser is idle):
 *   data-count, data-confetti, data-tilt, data-magnetic, data-scroll-tilt, data-hat-trick,
 *   data-rabbit-run, data-balloon-dog,
 *   data-parallax-up, data-pick-a-card, kids sparkle trail.
 *
 * Reduced motion: decorative motion is skipped; the pick-a-card trick still works
 * (it is an interaction, not decoration) but without flight.
 */
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = () => matchMedia('(hover: hover) and (pointer: fine)').matches;
const all = (sel: string) => [...document.querySelectorAll<HTMLElement>(sel)];

function letters(): void {
  for (const h of all('[data-letters]')) {
    // innerText honours <br> as a break, so the spoken name keeps its word boundaries
    h.setAttribute('aria-label', h.innerText.replace(/\s+/g, ' ').trim());
    const walker = document.createTreeWalker(h, NodeFilter.SHOW_TEXT);
    const texts: Text[] = [];
    while (walker.nextNode()) texts.push(walker.currentNode as Text);
    for (const t of texts) {
      const frag = document.createDocumentFragment();
      for (const word of t.data.split(/(\s+)/)) {
        if (!word) continue;
        if (/^\s+$/.test(word)) { frag.append(word); continue; }
        const w = document.createElement('span');
        w.className = 'fx-word';
        w.setAttribute('aria-hidden', 'true');
        for (const ch of word) {
          const s = document.createElement('span');
          s.className = 'fx-letter';
          s.textContent = ch;
          w.append(s);
        }
        frag.append(w);
      }
      t.replaceWith(frag);
    }
    const hop = () =>
      h.querySelectorAll<HTMLElement>('.fx-letter').forEach((l, i) =>
        l.animate(
          [
            { transform: 'translateY(0em) rotate(0deg)' },
            { transform: 'translateY(-0.28em) rotate(-6deg)', offset: 0.4 },
            { transform: 'translateY(0em) rotate(0deg)' },
          ],
          { duration: 500, delay: i * 30, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' },
        ),
      );
    hop();
    if (finePointer()) h.addEventListener('pointerenter', hop);
  }
}

/** Run after first paint when the main thread is idle (keeps Total Blocking Time low). */
const whenIdle = (fn: () => void) =>
  'requestIdleCallback' in window ? requestIdleCallback(fn, { timeout: 1500 }) : setTimeout(fn, 300);

/** Heavy, purely decorative work waits until the visitor actually engages (keeps first load free). */
function afterFirstInteraction(fn: () => void): void {
  const events = ['pointermove', 'pointerdown', 'scroll', 'touchstart', 'keydown'] as const;
  const go = () => {
    events.forEach((e) => removeEventListener(e, go));
    whenIdle(fn);
  };
  events.forEach((e) => addEventListener(e, go, { once: true, passive: true }));
}

export function initFx(): void {
  initReveals();
  if (!reduced()) letters(); // hero entrance: needed right away
  const wantsRich = document.querySelector(
    '[data-count], [data-confetti], [data-tilt], [data-magnetic], [data-scroll-tilt], [data-hat-trick], [data-rabbit-run], [data-balloon-dog], [data-parallax-up], [data-pick-a-card]',
  );
  if (wantsRich) whenIdle(() => import('./fx-rich').then((m) => m.initRichFx()));
  const fluid = document.querySelector<HTMLCanvasElement>('canvas[data-ferrofluid]');
  if (fluid && !reduced())
    afterFirstInteraction(() =>
      import('./ferrofluid').then((m) => {
        try {
          m.mountFerrofluid(fluid, fluid.parentElement ?? fluid, JSON.parse(fluid.dataset.ferrofluid || '{}'));
        } catch {
          /* no WebGL / shader error: the static background simply stays */
        }
      }),
    );
}
