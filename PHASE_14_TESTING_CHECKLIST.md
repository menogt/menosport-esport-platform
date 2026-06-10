# Phase 14 Testing Checklist

## Local Run

```bash
npm install
npm run dev
```

Open the local URL shown by Vite, usually:

```txt
http://localhost:5173/
```

## Route Checklist

Test these pages manually:

- [ ] `/`
- [ ] `/tournaments`
- [ ] `/tournaments/trn1`
- [ ] `/brackets/trn1`
- [ ] `/matches/m6`
- [ ] `/teams`
- [ ] `/games`
- [ ] `/media`
- [ ] `/live`
- [ ] `/community`
- [ ] `/integrations`
- [ ] `/sponsors`
- [ ] `/store`
- [ ] `/dashboard/player`
- [ ] `/dashboard/team`
- [ ] `/dashboard/admin`

## Feature Checklist

- [ ] Navbar opens on desktop and mobile.
- [ ] Sponsors page displays packages, campaigns, and placement inventory.
- [ ] Store page filters products correctly.
- [ ] Store cart Add / Plus / Minus buttons work.
- [ ] Admin Store tab displays products and recent orders.
- [ ] Admin Sponsors tab displays sponsors, campaigns, and placements.
- [ ] Admin Analytics tab displays advanced metrics and readiness checks.
- [ ] Live Ops and Integrations tabs still work after the Phase 11–14 additions.

## Deployment Prep

Before deploying to Vercel:

- [ ] Run `npm run build` locally.
- [ ] Fix any console errors.
- [ ] Create real environment variables only when backend is connected.
- [ ] Keep Stripe in test mode until the legal/payment setup is ready.
- [ ] Keep Discord/Twitch features as placeholders until API credentials are added.

