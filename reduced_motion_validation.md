# Reduced-motion validation

Chromium was launched against the active preview with `--force-prefers-reduced-motion=reduce` and a 1280x720 viewport.

Evidence:
- The rendered DOM contained the full homepage markers: `Meno Arena — Esports Tournament Platform`, `Play with`, and `There’s a bracket`.
- The runtime set `data-motion="reduced"` on the root document.
- All six `ScrollReveal` wrappers rendered with the `is-visible` state immediately, preventing hidden content and entrance transitions.
- The captured screenshot at `/tmp/meno-reduced-motion.png` shows the hero layout, navigation, artwork, CTA, and text fully visible with no clipping or layout shift.
- In reduced-motion mode the provider skips Lenis initialization, and CSS removes reveal transforms/transitions; the screenshot visually confirms the stable initial state.
