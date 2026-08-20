# Lenis-inspired scroll effects validation

The homepage now uses the existing Lenis provider with a slower lerp, smooth wheel settings, and a scroll event that writes progress, velocity, and direction to CSS variables on the root element. The new `ScrollReveal` primitive uses IntersectionObserver, is one-shot, and immediately disables animation under `prefers-reduced-motion: reduce`.

Desktop verification at 1280x720 shows the full landing page retaining the dark tactical command-center composition while sections enter with depth and staggered opacity/translation. Hero grid/orb/copy movement is subtle and tied to the scroll signal rather than layout changes.

Mobile verification at 390x844 shows the hero, tournament cards, live matches, game cards, leaderboard, sponsor strip, and final CTA remain legible and within the viewport flow. Hero transforms are intentionally disabled at the narrow breakpoint to avoid touch discomfort and horizontal drift.

Validation results: TypeScript passed; Vitest passed with 14 tests across 5 files; production build passed with Vite 7.1.9. The build emitted only the existing large-client-chunk advisory.
