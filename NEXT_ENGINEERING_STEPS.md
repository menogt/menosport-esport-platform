# Next Engineering Steps After Phase 14

The roadmap phases are complete. The next stage is not “Phase 15” unless you decide to create a new backend roadmap.

## Recommended Next Safe Order

### 1. Make the frontend stable locally

```bash
npm install
npm run dev
```

Open the local URL shown by Vite.

### 2. Deploy frontend only

Deploy the current frontend to Vercel first. Do not connect real payments yet.

### 3. Add Supabase

Create:

- Users table/profile table
- Teams table
- Tournament table
- Registrations table
- Matches table
- Match results table
- Disputes table
- Notifications table
- Sponsors/products/media tables later

### 4. Replace dummy data gradually

Do not replace all dummy data at once. Start with tournaments, then teams, then registrations, then matches.

### 5. Add Stripe test mode

Only after registration data is real.

### 6. Add Discord/Twitch integrations

Only after core tournament flows are stable.

## What Not To Do Yet

Do not add real money payouts, real prize distribution automation, or live sponsor payments until the platform has proper legal/payment setup.
