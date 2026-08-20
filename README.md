# Meno Arena

Meno Arena is a premium esports tournament operations platform. Phase 1 delivers
the public competition experience and role-based dashboard prototypes using a
coherent in-memory dataset, with a production-ready data model documented for a
future Supabase/PostgreSQL backend.

## Phase 1 surface

- Premium responsive homepage with featured events, live matches, games, team rankings, sponsors, and platform metrics
- Tournament directory, detailed tournament pages, registration flow, check-in control, standings, rules, and prize information
- Responsive single-elimination bracket and individual match rooms
- Team directory and detailed organization profiles with rosters and match history
- Player, team-captain, and admin dashboard interfaces
- Typed demo data and documented database/RLS/realtime migration plan

All interactive actions are intentionally sandboxed UI demonstrations in this
phase. They update the current browser session but do not persist to a backend.

## Run locally

Requirements: Node.js 22.13 or newer and npm.

```bash
npm install
npm run dev
```

Open the local URL printed by the development server. To validate a production
build:

```bash
npm run build
```

## Project map

- `app/` — routes, metadata, and global visual system
- `components/` — reusable competition and dashboard components
- `lib/types.ts` — domain contracts
- `lib/data.ts` — coherent Phase 1 demo dataset and lookup helpers
- `docs/DATA_MODEL_PLAN.md` — planned Supabase/PostgreSQL schema, RLS, storage, realtime, and rollout path

## Next backend milestone

The recommended Phase 2 sequence is authentication and profiles, team lifecycle
and invitations, transactional tournament registration/check-in, then admin
operations and realtime notifications. The complete relational plan is in
`docs/DATA_MODEL_PLAN.md`.
