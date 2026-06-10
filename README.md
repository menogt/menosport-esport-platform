# Esports Tournament Platform

## How to open this project

Do **not** open `index.html` directly. This is a React + Vite project, so it must be run with Vite.

```bash
npm install
npm run dev
```

Then open the local URL shown in the terminal, usually `http://localhost:5173/`.

Windows users can also double-click `RUN_WINDOWS.bat` after extracting the zip.

---

# Meno Arena Esports Tournament Platform

A premium dark-mode React/Vite esports tournament platform with role-based dashboards, team/tournament flows, bracket views, match reporting, dispute handling, sandbox payments, and prize-pool tracking.

## Run locally

```bash
npm install
npm run dev
```

## Demo accounts

- `player@demo.com`
- `captain@demo.com`
- `organizer@demo.com`
- `admin@demo.com`

Any password works in the current mock-auth build.

## Phase 5–7 completion notes

### Phase 5 — Bracket Generation & Match Scheduling

Added a reusable bracket engine in `src/app/lib/bracketEngine.ts`.

It supports:

- Single-elimination bracket generation from checked-in/registered teams
- Power-of-two bracket sizing
- Bye handling for odd or non-perfect team counts
- Round names and match scheduling
- Future-round match record creation
- Winner advancement into the correct next-round slot
- Round grouping for desktop and mobile bracket layouts
- Local-state bracket regeneration and result simulation on `/brackets/:id`

### Phase 6 — Match Reporting & Disputes

Improved match operations through:

- Result center on the full bracket page
- Score submission flow
- Screenshot proof attachment UI
- Opponent confirmation button
- Match dispute flow
- Activity log for bracket operations
- Admin dashboard dispute resolution actions
- Admin notes and award/replay decision controls
- Match detail page confirmation/dispute banners

### Phase 7 — Payments, Ticketing & Prize Pool UI

Expanded payment and prize tracking with:

- Sandbox payment modal for tournament registration
- Payment ledger data model
- Payment status tracking: paid, pending, failed, refunded
- Prize source breakdown: sponsor contribution, entry fee contribution, organizer contribution
- Payout records with pending, processing, and paid states
- Admin dashboard Payments tab
- Tournament prize-pool breakdown and payout status UI

## Important

This is still a frontend/sandbox implementation. It is structured so Supabase, Stripe test mode, and real storage can be connected later without redesigning the UI flow.

## Phase 8–10 completion notes

### Phase 8 — Notifications & Realtime Updates

Added a realtime-ready frontend layer through `src/app/context/RealtimeContext.tsx`.

It supports:

- Shared notification state across the navbar and notifications page
- Unread count tracking
- Mark-as-read, mark-all-read, and delete notification actions
- Simulated realtime event injection for bracket updates, disputes, streams, and Discord sync
- Admin alert queue for disputes, payment issues, webhook warnings, and registrations
- New `/live` Live Ops Center with event stream, admin alerts, live match snapshot, and broadcast status
- Admin dashboard `Live Ops` tab for realtime event review and alert handling

### Phase 9 — Game Hubs, Media & Community Features

Expanded the platform beyond tournament operations into a community hub.

Added:

- New `/community` page
- Community feed with announcements, recruitment posts, highlights, and moderation-ready metadata
- Player leaderboard with game filters
- Upcoming community events/watch parties/scrim nights
- Top teams panel linked to team profiles
- Admin dashboard `Media` tab for featured clip review and game-hub content management
- New community, leaderboard, and event data models in `src/app/data/dummy.ts`

### Phase 10 — Discord & Twitch Integrations

Added integration-ready UI and data models for esports community tooling.

Added:

- New `/integrations` page
- Discord webhook automation cards
- Webhook enable/disable toggles
- Test webhook simulation that pushes a realtime notification
- Twitch stream status cards and embed placeholders
- Integration delivery logs
- Admin dashboard `Integrations` tab
- Discord webhook, Twitch stream, and integration log data models

## Updated routes

New pages added:

- `/live`
- `/community`
- `/integrations`

Updated admin dashboard tabs:

- Live Ops
- Media
- Integrations

## Validation notes

A TypeScript sanity check was run with local module stubs because this environment does not have the full project `node_modules` installed. The check passed for the edited application files and the new Phase 8–10 modules.

To fully verify in your own machine:

```bash
npm install
npm run build
npm run dev
```

Then open:

```txt
http://localhost:5173/live
http://localhost:5173/community
http://localhost:5173/integrations
http://localhost:5173/dashboard/admin
```

---

## Phase 11–14 Completion Notes

This zip now includes the remaining safe frontend phases.

### Phase 11 — Sponsors & Brand Activation

Added a public `/sponsors` page and expanded the admin sponsor area with:

- Sponsor packages
- Sponsor campaign tracking
- Sponsor placement inventory
- Presented-by style campaign data
- Sponsor impressions, clicks, CTR, and budget preview data

### Phase 12 — E-Commerce Storefront

Added a public `/store` page and admin store controls with:

- Product listing
- Product categories and search
- Product cards
- Cart preview logic
- Checkout placeholder
- Stock status
- Recent order tracking

Important: checkout is still a placeholder. No real payment is processed.

### Phase 13 — Analytics & Admin Control Center

Expanded the admin dashboard with:

- Store management tab
- Sponsor campaign metrics
- Advanced platform analytics
- Revenue mix cards
- Readiness/health checks
- Order/product management previews

### Phase 14 — Testing, Optimization & Deployment Readiness

Phase 14 was completed as a local-readiness and deployment-prep phase, not as an actual deployment.

Added:

- Completion checklist
- Deployment guidance
- Health checks in the admin analytics tab
- Updated run instructions

Not done inside this zip:

- Real Vercel deployment
- Real Supabase project creation
- Real Stripe payments
- Real Discord/Twitch API credentials

Those require external accounts and secret environment variables.

### New Routes

```txt
/sponsors
/store
/dashboard/admin  → Sponsors, Store, Analytics, Integrations, Payments, Live Ops tabs
```

