# 001 — Kids v3 „Manege im Zelt“: refined motion system

Commit: 7244c15 · Scope: kids zone, prototype `/kindergeburtstag/` first (CLAUDE.md „Kinder-Design v3“).

## Goal
Motion stays present but refined: calm resting state, a few deliberate moments. Lighthouse mobile ≥ 90, only transform/opacity (+ stroke-dashoffset / clip-path), LCP (hero photo + h1) never hidden, `prefers-reduced-motion` shows end states.

## Tokens (extend, don't fork) — `site/src/styles/tokens.css`
- `--ease-out: cubic-bezier(0.23, 1, 0.32, 1)` (UI, reveals)
- `--ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1)` (curtain, cards)
- `--ease-in-out: cubic-bezier(0.77, 0, 0.175, 1)` (line draw on screen)

## Remove (findings 1–3)
1. `site/src/lib/motion/fx-rich.ts` `sparkleTrail()` (line ~55) and its call (line ~211): cursor trail = decoration on a high-frequency action.
2. Kids page no longer uses `Bunting`, `SectionEdge` waves, `Balloons`, polka dots: their infinite animations go with them.
3. Hero sticker `.kg-sticker` (`stamp` + infinite `wobble`, kids-kit.css:71) not used in v3.

## Change (findings 4–5)
4. Reveals on kids v3 sections: use `data-reveal` (default „up“: translateY 16px → 0, 600 ms, `--ease-out`) instead of `pop`/`tilt`; stagger list items with `data-reveal-delay` 0, 0.06, 0.12 …(max 5 steps). Keep `pop` only for the hat/balloon moments.
5. Card hover (inside `@media (hover:hover) and (pointer:fine)`): `transform: translateY(-3px)` + softer, larger shadow, 300 ms `--ease-out`; no rotate.

## New moments
- **Curtain** (hero): two velvet halves frame left/right from first paint, never over h1/photo. On load: each half `transform: translateX(-6%) scaleX(0.92)` (left; mirrored right) from `none`, 1.2 s `--ease-out-expo`, delay 0.15 s, `transform-origin` at the outer edge. Reduced motion: no animation.
- **Bulb frame** (photos): bulbs `opacity .35 → 1` one after another when frame enters view (`data-stage` → `.is-staged`, see fx.ts `stage()`), 40 ms per bulb, then a slow shimmer: every bulb `opacity 1 ↔ .75`, 2.4 s, staggered by index, only while `.is-staged` and not reduced. Photo itself never animated.
- **Gold divider**: line `scaleX(0 → 1)` from center, 900 ms `--ease-in-out`, star `opacity 0 → 1` + `scale .6 → 1` at 600 ms; triggered by `data-stage`.
- **Side Rays**: warmer gold colour; unchanged lifecycle (after first interaction, off on software GL / reduced motion).

## Verify
- `npm run test:dist`, `npm run test:seo`, `npm run test:e2e` (preview :4322), `npm run test:perf -- /kindergeburtstag/` ≥ 90.
- Feel-check: DevTools Animations panel at 10–25 % speed for curtain + bulbs; real phone for scroll reveals; reduced motion via DevTools rendering emulation.
