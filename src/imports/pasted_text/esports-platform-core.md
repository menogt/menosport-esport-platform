You are a senior full-stack developer, UI/UX designer, esports product strategist, and SaaS architect.

Build a very modern, professional esports tournament platform for organizing competitive gaming events. This must feel like a premium esports product, not a basic bracket website.

The platform should be dark-mode first, mobile-optimized, fast, responsive, and visually strong enough to impress gamers, teams, sponsors, and tournament organizers.

Project goal:
Create a full esports tournament platform where organizers can create tournaments, players can register, teams can join, matches can be scheduled, brackets can update, captains can report results, admins can resolve disputes, and the site can also act as a community hub with game pages, media galleries, sponsor spaces, and merchandise sections.

Recommended tech stack:

* Frontend: Next.js or React
* Styling: Tailwind CSS
* UI components: shadcn/ui or custom reusable components
* Animations: Framer Motion
* Backend: Supabase or Firebase
* Authentication: Supabase Auth, Clerk, or Firebase Auth
* Database: PostgreSQL/Supabase
* File uploads: Supabase Storage or similar
* Payments: Stripe integration placeholder/sandbox mode
* Realtime updates: Supabase realtime or WebSockets
* Deployment-ready structure for Vercel

Important:
Do not build this as a static landing page only. Build it as a real platform prototype with reusable components, realistic dummy data, clean structure, and clear places where backend integrations can be connected.

Core features to build:

1. Homepage
   Create a premium esports landing page with:

* Hero section with bold headline
* Upcoming tournaments section
* Featured games section
* Live matches / active brackets preview
* Prize pool highlights
* Team/player stats preview
* Sponsor banner space
* CTA buttons: “Join Tournament”, “Create Team”, “View Brackets”
* Modern dark UI with glowing gradients, glassmorphism cards, neon accent colors, subtle animations, and esports-style energy

Design direction:
Dark background, high-contrast text, neon accent colors such as electric blue, purple, red, or cyan. Use modern cards, soft glows, animated hover effects, premium spacing, and clean typography. Avoid childish gaming design. It should feel like a serious esports league platform.

2. Authentication System
   Create UI and logic-ready pages for:

* Sign up
* Login
* Player profile
* Organizer/admin profile
* Role-based navigation

User roles:

* Player
* Team Captain
* Tournament Organizer
* Admin
* Sponsor

3. Player Dashboard
   The player dashboard should include:

* Player profile card
* Joined tournaments
* Match schedule
* Past results
* Team membership
* Tournament history
* Win/loss statistics
* Notifications
* Check-in status

4. Team Dashboard
   Users must be able to:

* Create a team
* Invite players
* View roster
* Lock tournament lineup
* Manage captain role
* View team tournament history
* View team stats
* Show team logo, banner, region, game title, and social links

5. Tournament Creation
   Organizers should be able to create tournaments with:

* Tournament name
* Game title
* Tournament type
* Start date and time
* Registration deadline
* Max teams / players
* Entry fee
* Prize pool
* Rules
* Sponsor
* Stream link
* Tournament format

Tournament formats required:

* Single elimination
* Double elimination
* Round-robin
* Swiss format

For now, create the structure and UI for all formats. Implement single elimination first if full logic is too large, but code should be written in a way that supports adding the other formats later.

6. Tournament Details Page
   Each tournament page should include:

* Tournament overview
* Game
* Prize pool
* Entry fee
* Registration status
* Rules
* Registered teams
* Bracket
* Match schedule
* Standings
* Check-in button
* Live stream embed section
* Sponsor section
* Admin announcements
* Media/highlights section

7. Automated Brackets & Standings
   Build reusable bracket components that can display:

* Single elimination bracket
* Double elimination placeholder structure
* Round-robin standings table
* Swiss standings placeholder

The bracket should:

* Automatically update when match results are submitted
* Show team names, scores, match status, and next opponent
* Be mobile responsive
* Avoid frustrating horizontal scrolling on mobile as much as possible
* Use collapsible rounds or zoomable bracket UI for small screens

Match statuses:

* Upcoming
* Live
* Waiting for result
* Under dispute
* Completed

8. Registration & Ticketing
   Create tournament registration flow:

* Player/team chooses tournament
* Accepts rules
* Pays entry fee if required
* Gets registered
* Receives check-in reminder
* Can check in on tournament day

Payment should use placeholder/sandbox logic first. Do not implement real money transfer unless API keys and legal requirements are provided later.

9. Match Reporting
   Team captains should be able to:

* Submit match result
* Enter score
* Upload screenshot proof
* Add notes
* Confirm opponent result

The system should show result status:

* Submitted
* Waiting for opponent confirmation
* Confirmed
* Disputed
* Admin resolved

10. Dispute Resolution
    Build an admin dispute panel where admins can:

* View disputed matches
* See both teams’ submitted results
* View uploaded screenshot proof
* Add admin decision
* Mark winner
* Update bracket
* Send notification to both teams

11. Prize Pool Distribution UI
    Create a prize pool section showing:

* Total prize pool
* Entry-fee contribution
* Sponsor contribution
* Prize split

Example:

* 1st place: 60%
* 2nd place: 30%
* 3rd place: 10%

Add a payout status UI:

* Pending
* Processing
* Paid

Use placeholder payout logic. Do not create real payout handling unless a secure provider is added later.

12. Admin Dashboard
    Create admin dashboard with:

* Tournament management
* User management
* Team management
* Match management
* Dispute tickets
* Payment/registration overview
* Sponsor management
* Media management
* Announcements
* Platform analytics

13. Game-Specific Hubs
    Create dedicated game hub pages.

Start with:

* Mobile Legends: Bang Bang
* Valorant
* Free Fire
* Call of Duty Mobile

Each game hub should include:

* Upcoming tournaments
* Top teams
* Leaderboard
* Recent match highlights
* Hero/player stat cards
* Featured clips
* Game-specific banner design

For Mobile Legends: Bang Bang, include example hero stat cards for:

* Fanny
* Ling
* Tigreal
* Chou
* Layla

14. Short-Form Media Gallery
    Create a media gallery page for:

* TikTok-style vertical video cards
* Reels
* YouTube Shorts
* Match highlights
* Meme clips
* Player reactions
* Event promos

The design should support vertical 9:16 thumbnails, hover preview effects, tags, views, likes, and share buttons.

15. Discord & Twitch Integration UI
    Create integration-ready sections for:

* Discord server linking
* Automatic Discord role assignment based on tournament registration
* Tournament announcement webhook placeholder
* Twitch stream embed on live match pages
* Stream schedule section

Use placeholder integrations unless API credentials are provided.

16. Sponsor / Brand Activation Spaces
    Create sponsor-friendly sections:

* “Presented by” tournament banners
* Sponsor cards
* Native sponsor placement inside bracket pages
* Sponsor landing block
* CTA button for sponsor campaigns
* Custom sponsor tournament page layout

The sponsor placement should feel natural and premium, not spammy.

17. E-Commerce Storefront
    Create a simple esports merchandise storefront with:

* Team jerseys
* Organization merch
* Hoodies
* Digital goods
* Product cards
* Cart UI placeholder
* Checkout placeholder

18. Notifications System
    Create UI for:

* Match starting soon
* Tournament check-in open
* Result submitted
* Dispute opened
* Admin decision made
* Prize payout update
* Team invite received

19. Data Models
    Create a clean database/schema plan for:

* Users
* Player profiles
* Teams
* Team members
* Tournaments
* Registrations
* Matches
* Brackets
* Match results
* Disputes
* Prize pools
* Payouts
* Sponsors
* Media posts
* Products
* Orders
* Notifications

20. Performance Requirements
    The site must be optimized:

* Lazy-load heavy images
* Use optimized image components
* Keep reusable components clean
* Avoid unnecessary animation overload
* Ensure mobile responsiveness
* Keep bracket pages fast
* Use skeleton loaders where useful
* Use dummy data first, but structure the code for real APIs

21. UI Pages to Build
    Build these pages:

* /
* /tournaments
* /tournaments/[id]
* /brackets/[id]
* /matches/[id]
* /dashboard/player
* /dashboard/team
* /dashboard/admin
* /teams
* /teams/[id]
* /games
* /games/mobile-legends
* /media
* /store
* /sponsors
* /login
* /register

22. Design Components Required
    Create reusable components:

* Navbar
* Sidebar dashboard navigation
* TournamentCard
* TeamCard
* PlayerCard
* MatchCard
* BracketView
* StandingsTable
* PrizePoolCard
* DisputeTicketCard
* MediaVideoCard
* SponsorBanner
* GameHubCard
* ProductCard
* NotificationPanel
* StatCard
* AdminTable
* CheckInButton
* ResultSubmissionModal

23. Visual Style
    Use:

* Dark mode as default
* Neon gradients
* Glassmorphism panels
* Subtle grid backgrounds
* Smooth hover animations
* Big esports-style hero typography
* Premium spacing
* Clean dashboard layouts
* Mobile-first responsiveness
* Professional SaaS polish

Avoid:

* Cheap gaming fonts
* Overcrowded design
* Too many random colors
* Fake buttons with no structure
* Messy file organization
* Static-only design

24. First Build Priority
    Build the project in phases.

Phase 1:

* Modern homepage
* Tournament listing
* Tournament details page
* Single elimination bracket UI
* Player/team dashboard UI
* Registration UI
* Admin dashboard UI with dummy data

Phase 2:

* Authentication
* Team creation
* Tournament creation
* Match reporting
* Screenshot upload placeholder
* Dispute panel

Phase 3:

* Realtime bracket updates
* Payment sandbox
* Notifications
* Game hubs
* Media gallery

Phase 4:

* Discord/Twitch integration
* Sponsor activation spaces
* Storefront
* Advanced analytics

Start by creating Phase 1 fully with clean, production-quality code and dummy data. Do not try to rush every feature at once. Make the foundation scalable.

25. Output Requirements
    When generating the project:

* Create clean folder structure
* Use reusable components
* Add realistic dummy data
* Add comments only where helpful
* Make UI look premium
* Make it responsive
* Make sure pages do not break
* Explain how to run the project
* Explain what features are completed
* Explain what should be built next

Final result should feel like a real esports tournament platform that could become a startup product.
