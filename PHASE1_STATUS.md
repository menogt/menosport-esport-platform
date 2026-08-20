# Meno Arena — Phase 1 status

Phase 1 establishes the public-facing foundation for Meno Arena: a premium dark-mode esports landing experience with a responsive header, hero system, live match ticker, tournament discovery, game hub previews, global standings, sponsor strip, and a final registration call to action. The content is intentionally backed by realistic dummy data while tournament, Discord, Twitch, payments, realtime, and Supabase-specific product flows remain integration-ready follow-up work.

## Run locally

From the project root, run `pnpm install` once and then `pnpm dev`. The managed preview uses the same `pnpm dev` command. Use `pnpm check` for TypeScript validation and `pnpm test` for the Vitest suite.

## Completed in Phase 1

The starter page has been replaced with a distinct Meno Arena visual system: off-black surfaces, a single signal-lime brand accent, mono metadata, Space Grotesk display type, geometric arena/radar linework, responsive navigation, tournament cards, live match rows, game tiles, standings, sponsor messaging, and mobile-first layout rules.

A single `SmoothScrollProvider` owns the Lenis instance at the application root. It uses an explicit requestAnimationFrame loop, cleans up on unmount, and skips initialization when the user prefers reduced motion. The hero artwork also has an isolated Framer Motion scroll transform for restrained parallax without coupling scroll logic to the layout or Lenis lifecycle.

Game cards use reusable, clearly labeled `[GAME_HEADER_IMAGE: <game>]` slots so licensed or original artwork can be inserted later without changing the layout contract. The current abstract geometry is intentionally original and does not reuse the prior repository design.

## Next build

Phase 2 should introduce authentication and the signed-in product shell, then add player profiles, team and clan management, tournament registration, bracket data structures, and role-gated admin routes. Realtime scores, push alerts, LLM summaries, payments, media, Discord/Twitch, sponsors, storefront, and analytics should be layered in their specified later phases.
