import { animate, inView, scroll, stagger } from 'motion';

// Effects that need the motion library (springs, scroll-linked, value tweens). Loaded on idle by fx.ts.
const EASE_OUT = [0.23, 1, 0.32, 1] as const;
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = () => matchMedia('(hover: hover) and (pointer: fine)').matches;
const all = (sel: string) => [...document.querySelectorAll<HTMLElement>(sel)];

function countUp(): void {
  for (const el of all('[data-count]')) {
    const text = el.textContent ?? '';
    const m = text.match(/\d+/);
    if (!m) continue;
    const target = Number(m[0]);
    const render = (n: number) => (el.textContent = text.replace(m[0], String(Math.round(n))));
    // Server text stays until the count actually starts: never leave a wrong price on screen.
    inView(el, () => {
      render(0);
      animate(0, target, { duration: 1.1, ease: EASE_OUT, onUpdate: render });
    });
  }
}

const CONFETTI = ['#d7393e', '#3b55d5', '#ffb546', '#2b1d17', '#ffffff'];

function confetti(): void {
  for (const el of all('[data-confetti]')) {
    el.addEventListener('pointerdown', (e) => {
      const pieces = Array.from({ length: 22 }, (_, i) => {
        const p = document.createElement('span');
        p.className = 'fx-confetti';
        p.setAttribute('aria-hidden', 'true');
        p.style.cssText = `left:${e.clientX}px;top:${e.clientY}px;background:${CONFETTI[i % CONFETTI.length]}`;
        document.body.append(p);
        return p;
      });
      pieces.forEach((p, i) => {
        const angle = (i / pieces.length) * Math.PI * 2 + Math.random() * 0.4;
        const dist = 60 + Math.random() * 90;
        const x = Math.cos(angle) * dist;
        const y = Math.sin(angle) * dist - 40;
        animate(
          p,
          {
            transform: ['translate(-50%, -50%) rotate(0deg) scale(1)', `translate(${x}px, ${y + 70}px) rotate(${360 + Math.random() * 360}deg) scale(0.6)`],
            opacity: [1, 0],
          },
          { duration: 0.9 + Math.random() * 0.3, ease: EASE_OUT },
        ).then(() => p.remove());
      });
    });
  }
}

function sparkleTrail(): void {
  const kidsV2 = document.documentElement.dataset.zone === 'kids' && document.body.classList.contains('v2');
  if (!kidsV2 || !finePointer()) return;
  const pool = Array.from({ length: 14 }, () => {
    const s = document.createElement('span');
    s.className = 'fx-sparkle';
    s.setAttribute('aria-hidden', 'true');
    s.textContent = '✦';
    document.body.append(s);
    return s;
  });
  let i = 0;
  let last = 0;
  window.addEventListener(
    'pointermove',
    (e) => {
      const now = performance.now();
      if (now - last < 45) return;
      last = now;
      const s = pool[i++ % pool.length];
      s.style.left = `${e.clientX}px`;
      s.style.top = `${e.clientY}px`;
      s.style.color = CONFETTI[i % 3];
      animate(
        s,
        { transform: ['translate(-50%, -50%) scale(1) rotate(0deg)', 'translate(-50%, 10px) scale(0.2) rotate(90deg)'], opacity: [1, 0] },
        { duration: 0.6, ease: EASE_OUT },
      );
    },
    { passive: true },
  );
}

function tilt(): void {
  if (!finePointer()) return;
  for (const el of all('[data-tilt]')) {
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      el.style.transform = `perspective(900px) rotateX(${(-py * 9).toFixed(2)}deg) rotateY(${(px * 11).toFixed(2)}deg) translateZ(0)`;
    });
    el.addEventListener('pointerleave', () => {
      el.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg)';
    });
  }
}

function magnetic(): void {
  if (!finePointer()) return;
  for (const el of all('[data-magnetic]')) {
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - (r.left + r.width / 2)) * 0.25;
      const y = (e.clientY - (r.top + r.height / 2)) * 0.35;
      el.style.translate = `${x.toFixed(1)}px ${y.toFixed(1)}px`;
    });
    el.addEventListener('pointerleave', () => (el.style.translate = '0px 0px'));
  }
}

function scrollTilt(): void {
  for (const el of all('[data-scroll-tilt]')) {
    const deg = Number(el.dataset.scrollTilt || 4);
    scroll(animate(el, { transform: [`rotate(${-deg}deg)`, `rotate(${deg}deg)`] }, { ease: 'linear' }), {
      target: el,
      offset: ['start end', 'end start'],
    });
  }
}

function parallaxUp(): void {
  for (const el of all('[data-parallax-up]')) {
    scroll(animate(el, { transform: ['translateY(5rem)', 'translateY(-7rem)'] }, { ease: 'linear' }), {
      target: el.closest('section') ?? el,
      offset: ['start end', 'end start'],
    });
  }
}

/** Kids hat trick: each tap brings something new out of the hat. First view: the rabbit peeks out. */
function hatTrick(): void {
  for (const root of all('[data-hat-trick]')) {
    const items = [...root.querySelectorAll<SVGElement>('.ht__item')];
    const puff = root.querySelector<HTMLElement>('.ht__puff');
    const hat = root.querySelector<HTMLElement>('.ht__hat');
    const live = root.querySelector<HTMLElement>('[data-hat-live]');
    if (!items.length || !hat) continue;
    const DOWN = 'translateY(105%) rotate(0deg)';
    const UP = 'translateY(-4%) rotate(-6deg)';
    items.forEach((it) => { it.classList.remove('is-up'); it.style.transform = DOWN; });
    let current = -1;
    const show = async (next: number) => {
      const prev = current;
      current = next;
      if (reduced()) {
        // same result, no flight: an interaction must keep working under reduced motion
        if (prev >= 0) items[prev].style.transform = DOWN;
        items[next].style.transform = UP;
        if (live) live.textContent = items[next].dataset.name ?? '';
        return;
      }
      animate(hat, { transform: ['scale(1, 1)', 'scale(1.08, 0.9)', 'scale(1, 1)'] }, { duration: 0.35, ease: EASE_OUT });
      if (prev >= 0) await animate(items[prev], { transform: DOWN }, { duration: 0.22, ease: EASE_OUT });
      if (puff) animate(puff, { opacity: [0.95, 0], transform: ['scale(0.6)', 'scale(1.35)'] }, { duration: 0.6, ease: EASE_OUT });
      await animate(items[next], { transform: [DOWN, UP] }, { duration: 0.55, ease: [0.16, 1, 0.3, 1] });
      const wing = items[next].querySelector('.ht__wing');
      if (wing) animate(wing, { transform: ['rotate(0deg)', 'rotate(-14deg)', 'rotate(0deg)'] }, { duration: 0.5, repeat: 2, ease: 'easeInOut' });
      if (live) live.textContent = items[next].dataset.name ?? '';
    };
    inView(root, () => { if (current < 0) show(0); }, { amount: 0.6 });
    hat.addEventListener('click', () => show((current + 1) % items.length));
  }
}

/** Balloon dog: parts inflate one after another the first time it is seen. */
function balloonDog(): void {
  for (const dog of all('[data-balloon-dog]')) {
    dog.querySelectorAll<SVGElement>('.bd__p').forEach((p, i) => (p.style.animationDelay = `${i * 0.09}s`));
    inView(dog, () => dog.classList.add('is-inflating'), { amount: 0.8 });
  }
}

function pickACard(): void {
  for (const root of all('[data-pick-a-card]')) {
    const deck = root.querySelector<HTMLElement>('.pac__deck');
    const result = root.querySelector<HTMLElement>('.pac__result');
    if (!deck || !result) continue;
    deck.hidden = false; // JS-only toy; without JS the result link is simply there
    result.hidden = true;
    const cards = [...deck.querySelectorAll<HTMLButtonElement>('button')];
    cards.forEach((card) =>
      card.addEventListener('click', async () => {
        cards.forEach((c) => (c.disabled = true));
        const others = cards.filter((c) => c !== card);
        if (!reduced()) {
          animate(others, { transform: 'translateY(30px) rotate(0deg) scale(0.9)', opacity: 0 }, { duration: 0.35, ease: EASE_OUT, delay: stagger(0.04) });
          await animate(card, { transform: 'translateY(-24px) rotateY(180deg) scale(1.08)' }, { duration: 0.6, ease: EASE_OUT });
        }
        card.classList.add('is-turned');
        await new Promise((r) => setTimeout(r, reduced() ? 0 : 450));
        deck.hidden = true;
        result.hidden = false;
        if (!reduced()) animate(result, { transform: ['scale(0.92) rotate(-4deg)', 'scale(1) rotate(0deg)'], opacity: [0, 1] }, { type: 'spring', bounce: 0, duration: 0.6 });
        result.querySelector<HTMLElement>('a')?.focus();
      }),
    );
  }
}

export function initRichFx(): void {
  pickACard();
  hatTrick(); // interactions work under reduced motion too (without flight)
  if (reduced()) return;
  countUp();
  confetti();
  sparkleTrail();
  tilt();
  magnetic();
  scrollTilt();
  parallaxUp();
  balloonDog();
}
