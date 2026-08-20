# Esports Tournament Platform — Full Build Prompt (Manus 1.6)

You are a senior full-stack developer, UI/UX designer, esports product strategist, and SaaS architect.

Build a very modern, professional esports tournament platform for organizing competitive gaming events. This must feel like a premium esports product, not a basic bracket website.

The platform should be dark-mode first, mobile-optimized, fast, responsive, and visually strong enough to impress gamers, teams, clans/organizations, sponsors, and tournament organizers.

## Project Goal

Create a full esports tournament platform where organizers can create tournaments, players can register, teams can join, esports organizations ("clans") can recruit and manage multiple teams across games, matches can be scheduled, brackets can update, captains can report results, admins can resolve disputes, and the site can also act as a community hub with game pages, media galleries, sponsor spaces, and merchandise sections.

## Recommended Tech Stack

- Frontend: Next.js or React
- Styling: Tailwind CSS
- UI components: shadcn/ui as the base, styled with reference to Aceternity UI / Magic UI patterns for glow, spotlight, and grid-background effects (see Section 23c: Reference Libraries)
- Smooth scroll: **Lenis** (`npm i lenis`), initialized once at the root layout — this is what makes scrolling feel "heavy" and premium instead of default-browser-janky
- Scroll-linked animation: **Framer Motion** (`useScroll` + `useTransform`) for parallax hero, game headers, and clan banners; **GSAP + ScrollTrigger** for any pinned/staged scroll sequences too complex for Framer Motion alone
- Backend: Supabase or Firebase
- Authentication: Supabase Auth, Clerk, or Firebase Auth
- Database: PostgreSQL/Supabase
- File uploads: Supabase Storage or similar
- Payments: Stripe integration placeholder/sandbox mode
- Realtime updates: Supabase realtime or WebSockets
- Deployment-ready structure for Vercel

**Important:** Do not build this as a static landing page only. Build it as a real platform prototype with reusable components, realistic dummy data, clean structure, and clear places where backend integrations can be connected.

---

## Core Features to Build

### 1. Homepage

Create a premium esports landing page with:

- Hero section with bold headline and a **parallax background** (layered game art/graphic elements moving at different scroll speeds — see Section 23a: Parallax System)
- Upcoming tournaments section
- Featured games section — **each game shown with its own header/banner image** (see Section 23b: Game Header Images)
- Live matches / active brackets preview
- Prize pool highlights
- Team/player stats preview
- Top clans/organizations spotlight (see Section 4a: Clan/Organization System)
- Sponsor banner space
- CTA buttons: "Join Tournament", "Create Team", "Create/Join a Clan", "View Brackets"
- Modern dark UI with glowing gradients, glassmorphism cards, neon accent colors, subtle animations, and esports-style energy

**Design direction:** Dark background, high-contrast text, neon accent colors such as electric blue, purple, red, or cyan. Use modern cards, soft glows, animated hover effects, premium spacing, and clean typography. Avoid childish gaming design. It should feel like a serious esports league platform.

### 2. Authentication System

Create UI and logic-ready pages for:

- Sign up
- Login
- Player profile
- Organizer/admin profile
- Role-based navigation

User roles:

- Player
- Team Captain
- Clan/Org Owner or Manager (see Section 4a)
- Tournament Organizer
- Admin
- Sponsor

### 3. Player Dashboard

The player dashboard should include:

- Player profile card
- Joined tournaments
- Match schedule
- Past results
- Team membership
- Clan affiliation (if their team belongs to an org — see Section 4a)
- Tournament history
- Win/loss statistics
- Notifications
- Check-in status

### 4. Team Dashboard

Users must be able to:

- Create a team
- Invite players
- View roster
- Lock tournament lineup
- Manage captain role
- Link team to a parent clan/organization (optional)
- View team tournament history
- View team stats
- Show team logo, banner, region, game title, and social links

### 4a. Clan / Organization Creation (NEW)

Esports organizations ("clans") sit above individual teams — the same way real orgs like **T1**, **ONIC Esports**, **RRQ**, **EVOS**, or **TSM** field multiple teams across different games under one brand. Build this as its own layer, separate from single-game Teams.

**Clan/Org features:**

- Create a clan/organization with: org name, tag/abbreviation (e.g. `T1`, `ONIC`), logo, banner image, region/country, founding year, bio/description, official socials (Twitter/X, Instagram, YouTube, TikTok, Discord)
- Clan owner/manager role with permission to:
  - Create and attach multiple teams under the org, each tied to a specific game (e.g. `T1 Valorant`, `T1 League of Legends`, `ONIC MLBB`, `ONIC Free Fire`)
  - Recruit or invite existing teams/players to join the org
  - Assign team managers/captains per sub-team
  - Remove/retire a team from the org roster
- Clan public profile page showing:
  - Roster grid of all sub-teams by game, each with its own mini roster preview
  - Org-wide trophy case / achievements (tournament wins, placements, prize money earned)
  - Org-wide stats (total wins/losses across all rostered teams)
  - Follower/fan count and a "Follow Clan" button
  - Sponsor logos tied to the org
- Clan leaderboard/ranking page (`/clans`) sortable by trophies, prize earnings, followers, or region
- Clan vs Clan rivalry/head-to-head stat block on tournament and match pages when both competing teams belong to known orgs
- Dummy data should include a few example orgs modeled conceptually after real multi-game esports organizations (use original/fictional names inspired by the structure of orgs like T1 and ONIC Esports — do not use real trademarked logos or copyrighted branding assets, use placeholder shield/emblem-style logos instead)

### 5. Tournament Creation

Organizers should be able to create tournaments with:

- Tournament name
- Game title
- Tournament type
- Start date and time
- Registration deadline
- Max teams / players
- Entry fee
- Prize pool
- Rules
- Sponsor
- Stream link
- Tournament format
- Option to flag tournament as "Clan-eligible" (only org-rostered teams may enter) vs open entry

Tournament formats required:

- Single elimination
- Double elimination
- Round-robin
- Swiss format

For now, create the structure and UI for all formats. Implement single elimination first if full logic is too large, but code should be written in a way that supports adding the other formats later.

### 6. Tournament Details Page

Each tournament page should include:

- Tournament overview
- Game (with game header image as the page banner — see Section 23b)
- Prize pool
- Entry fee
- Registration status
- Rules
- Registered teams (show clan tag/badge next to team name if the team belongs to an org)
- Bracket
- Match schedule
- Standings
- Check-in button
- Live stream embed section
- Sponsor section
- Admin announcements
- Media/highlights section

### 7. Automated Brackets & Standings

Build reusable bracket components that can display:

- Single elimination bracket
- Double elimination placeholder structure
- Round-robin standings table
- Swiss standings placeholder

The bracket should:

- Automatically update when match results are submitted
- Show team names, clan tags/badges, scores, match status, and next opponent
- Be mobile responsive
- Avoid frustrating horizontal scrolling on mobile as much as possible
- Use collapsible rounds or zoomable bracket UI for small screens

Match statuses:

- Upcoming
- Live
- Waiting for result
- Under dispute
- Completed

### 8. Registration & Ticketing

Create tournament registration flow:

- Player/team (optionally under a clan) chooses tournament
- Accepts rules
- Pays entry fee if required
- Gets registered
- Receives check-in reminder
- Can check in on tournament day

Payment should use placeholder/sandbox logic first. Do not implement real money transfer unless API keys and legal requirements are provided later.

### 9. Match Reporting

Team captains should be able to:

- Submit match result
- Enter score
- Upload screenshot proof
- Add notes
- Confirm opponent result

The system should show result status:

- Submitted
- Waiting for opponent confirmation
- Confirmed
- Disputed
- Admin resolved

### 10. Dispute Resolution

Build an admin dispute panel where admins can:

- View disputed matches
- See both teams' submitted results
- View uploaded screenshot proof
- Add admin decision
- Mark winner
- Update bracket
- Send notification to both teams

### 11. Prize Pool Distribution UI

Create a prize pool section showing:

- Total prize pool
- Entry-fee contribution
- Sponsor contribution
- Prize split

Example:

- 1st place: 60%
- 2nd place: 30%
- 3rd place: 10%

Add a payout status UI:

- Pending
- Processing
- Paid

Use placeholder payout logic. Do not create real payout handling unless a secure provider is added later.

### 12. Admin Dashboard

Create admin dashboard with:

- Tournament management
- User management
- Team management
- Clan/organization management (approve new orgs, manage verified badges)
- Match management
- Dispute tickets
- Payment/registration overview
- Sponsor management
- Media management
- Announcements
- Platform analytics

### 13. Game-Specific Hubs

Create dedicated game hub pages, each with a full-width **game header image** as the page hero banner (see Section 23b).

Start with:

- Mobile Legends: Bang Bang
- Valorant
- Free Fire
- Call of Duty Mobile

Each game hub should include:

- Header/banner image for the game
- Upcoming tournaments
- Top teams
- Top clans/orgs competing in this game
- Leaderboard
- Recent match highlights
- Hero/player stat cards
- Featured clips
- Game-specific banner design

For Mobile Legends: Bang Bang, include example hero stat cards for:

- Fanny
- Ling
- Tigreal
- Chou
- Layla

### 14. Short-Form Media Gallery

Create a media gallery page for:

- TikTok-style vertical video cards
- Reels
- YouTube Shorts
- Match highlights
- Meme clips
- Player reactions
- Event promos

The design should support vertical 9:16 thumbnails, hover preview effects, tags, views, likes, and share buttons.

### 15. Discord & Twitch Integration UI

Create integration-ready sections for:

- Discord server linking (per-clan and per-tournament)
- Automatic Discord role assignment based on tournament registration or clan membership
- Tournament announcement webhook placeholder
- Twitch stream embed on live match pages
- Stream schedule section

Use placeholder integrations unless API credentials are provided.

### 16. Sponsor / Brand Activation Spaces

Create sponsor-friendly sections:

- "Presented by" tournament banners
- Sponsor cards
- Native sponsor placement inside bracket pages
- Sponsor landing block
- CTA button for sponsor campaigns
- Custom sponsor tournament page layout
- Sponsor logo placement on clan/org profile pages

The sponsor placement should feel natural and premium, not spammy.

### 17. E-Commerce Storefront

Create a simple esports merchandise storefront with:

- Team jerseys
- Clan/org merch (org-branded jerseys, hoodies with tag/logo)
- Organization merch
- Hoodies
- Digital goods
- Product cards
- Cart UI placeholder
- Checkout placeholder

### 18. Notifications System

Create UI for:

- Match starting soon
- Tournament check-in open
- Result submitted
- Dispute opened
- Admin decision made
- Prize payout update
- Team invite received
- Clan/org invite received
- Team added to or removed from a clan

### 19. Data Models

Create a clean database/schema plan for:

- Users
- Player profiles
- Teams
- Team members
- **Clans/Organizations** (NEW)
- **Clan Teams** (join table linking orgs to their per-game teams) (NEW)
- **Clan Members** (org-level staff/roles separate from in-game rosters) (NEW)
- Tournaments
- Registrations
- Matches
- Brackets
- Match results
- Disputes
- Prize pools
- Payouts
- Sponsors
- Media posts
- Products
- Orders
- Notifications

### 20. Performance Requirements

The site must be optimized:

- Lazy-load heavy images (especially game header images and clan/org banners)
- Use optimized image components (e.g. `next/image`)
- Keep reusable components clean
- Avoid unnecessary animation overload — parallax and motion should be tasteful accents, not overused on every element
- Ensure mobile responsiveness
- Disable or simplify parallax on low-power/mobile devices if it affects scroll performance
- Keep bracket pages fast
- Use skeleton loaders where useful
- Use dummy data first, but structure the code for real APIs

### 21. UI Pages to Build

Build these pages:

- `/`
- `/tournaments`
- `/tournaments/[id]`
- `/brackets/[id]`
- `/matches/[id]`
- `/dashboard/player`
- `/dashboard/team`
- `/dashboard/clan` (NEW — clan/org management dashboard)
- `/dashboard/admin`
- `/teams`
- `/teams/[id]`
- `/clans` (NEW — clan/org leaderboard and directory)
- `/clans/[id]` (NEW — public clan/org profile page)
- `/games`
- `/games/mobile-legends`
- `/media`
- `/store`
- `/sponsors`
- `/login`
- `/register`

### 22. Design Components Required

Create reusable components:

- Navbar
- Sidebar dashboard navigation
- TournamentCard
- TeamCard
- **ClanCard / OrgCard** (NEW)
- **ClanRosterGrid** (NEW — shows sub-teams by game)
- **ClanTagBadge** (NEW — small inline org tag shown next to team/player names)
- PlayerCard
- MatchCard
- BracketView
- StandingsTable
- PrizePoolCard
- DisputeTicketCard
- MediaVideoCard
- SponsorBanner
- GameHubCard
- **GameHeaderBanner** (NEW — parallax-enabled hero banner using each game's header image)
- ProductCard
- NotificationPanel
- StatCard
- AdminTable
- CheckInButton
- ResultSubmissionModal

### 23. Visual Style

Use:

- Dark mode as default
- Neon gradients
- Glassmorphism panels
- Subtle grid backgrounds
- Smooth hover animations
- Big esports-style hero typography
- Premium spacing
- Clean dashboard layouts
- Mobile-first responsiveness
- Professional SaaS polish

Avoid:

- Cheap gaming fonts
- Overcrowded design
- Too many random colors
- Fake buttons with no structure
- Messy file organization
- Static-only design

#### 23a. Parallax System (NEW)

Since this is an esports platform, scroll depth should feel cinematic. Build it as two layers working together, not one animation library doing everything:

**Layer 1 — Lenis (smooth scroll foundation):**
- Install with `npm i lenis` and initialize a single `new Lenis()` instance in the root layout (e.g. a `SmoothScrollProvider` wrapping the app)
- This alone changes how the whole site *feels* — it's the difference between default browser scroll and the "heavy, controlled" feel of sites like lenis.dev, GTA VI's site, or Netflix Careers (all built on it)
- Honors `prefers-reduced-motion` automatically — no extra work needed there
- Keeps `position: sticky`, anchor links, and accessibility intact (it wraps native scroll rather than hijacking it)

**Layer 2 — Framer Motion (`useScroll` + `useTransform`) for the actual parallax motion, riding on top of Lenis:**
- Homepage hero: background layers (glow shapes, grid lines, faint game silhouettes) move at a slower scroll speed than the foreground text/CTA layer, creating depth. Pattern: `const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })` then map to `y` with `useTransform`
- Featured games section: game header images shift slightly on scroll (subtle vertical parallax, not full-speed — offset a few dozen pixels max)
- Game hub pages: the top banner image uses a parallax scroll effect similar to the homepage hero
- Clan/org profile pages: banner image parallaxes behind the org logo and stats overlay
- For any pinned or multi-stage scroll sequence (e.g. a scrollytelling section on the homepage) that outgrows plain `useTransform`, use **GSAP + ScrollTrigger** instead of forcing it through Framer Motion
- Use GPU-friendly transforms (`translateY`, not layout-shifting properties like `top`/`margin`)
- Keep parallax subtle — this is a professional SaaS product, not a marketing gimmick site

#### 23b. Game Header Images (NEW)

- Every game (Mobile Legends: Bang Bang, Valorant, Free Fire, Call of Duty Mobile) needs a wide banner/header image used as:
  - The featured-games card thumbnail on the homepage
  - The hero banner on that game's `/games/[game]` hub page
  - A small thumbnail badge next to the game name on tournament cards, match cards, and clan sub-team entries
- Since real game artwork is copyrighted, use placeholder image slots (clearly labeled `[GAME_HEADER_IMAGE: <game name>]` in dummy data) sized for a 21:9 or 16:9 banner crop, so the org can swap in licensed or original artwork later
- Structure the image component so swapping in a real image URL later requires no layout changes

#### 23c. Reference Libraries (NEW)

Do not build glow/spotlight/glassmorphism effects from scratch with raw CSS. Reach for these first so the UI reads as intentional rather than generic:

- **Lenis** — smooth scroll foundation (`lenis.dev`)
- **Framer Motion** (`motion.dev`) — `useScroll`/`useTransform` for parallax and scroll-linked motion
- **GSAP + ScrollTrigger** (`gsap.com/docs/v3/Plugins/ScrollTrigger`) — pinned sections, staged/scrubbed scroll sequences
- **Aceternity UI** (`ui.aceternity.com`) — glowing beams, spotlight effects, 3D cards, parallax hero image patterns; reference for the neon/glass aesthetic
- **Magic UI** (`magicui.design`) — grid/dot backgrounds, gradient beams, shimmer text for landing-page sections
- **shadcn/ui** — base component primitives (buttons, dialogs, forms) underneath the custom visual layer

Treat these as patterns to reference and adapt, not necessarily packages to install wholesale — copy the technique, reskin it in the platform's neon/glass palette rather than using their default look verbatim.

### 24. First Build Priority

Build the project in phases.

**Phase 1:**

- Modern homepage with parallax hero
- Tournament listing
- Tournament details page
- Single elimination bracket UI
- Player/team dashboard UI
- Registration UI
- Admin dashboard UI with dummy data
- Game header image placeholders wired into homepage + game cards

**Phase 2:**

- Authentication
- Team creation
- Clan/organization creation and dashboard
- Tournament creation
- Match reporting
- Screenshot upload placeholder
- Dispute panel

**Phase 3:**

- Realtime bracket updates
- Payment sandbox
- Notifications
- Game hubs with full parallax header banners
- Clan leaderboard/directory page
- Media gallery

**Phase 4:**

- Discord/Twitch integration
- Sponsor activation spaces
- Storefront (including clan-branded merch)
- Advanced analytics

Start by creating Phase 1 fully with clean, production-quality code and dummy data. Do not try to rush every feature at once. Make the foundation scalable.

### 25. Output Requirements

When generating the project:

- Create clean folder structure
- Use reusable components
- Add realistic dummy data (including a few example clans/orgs and their sub-teams)
- Add comments only where helpful
- Make UI look premium
- Make it responsive
- Make sure pages do not break
- Explain how to run the project
- Explain what features are completed
- Explain what should be built next

Final result should feel like a real esports tournament platform that could become a startup product.