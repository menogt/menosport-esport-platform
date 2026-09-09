/**
 * Meno Arena demo seed.
 *
 *   pnpm seed            (reads VITE_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY from .env)
 *
 * Idempotent: every entity is matched by a natural key (email, name, sku, ...)
 * and only inserted when missing, so the script can be re-run safely. Live
 * tournaments get a bracket with the first round played; completed tournaments
 * are played to a champion so payouts and clan achievements exist.
 */
import "dotenv/config";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  DEMO_PASSWORD, seedAchievements, seedClans, seedIntegrations, seedMedia, seedProducts, seedSponsors, seedTeams, seedTournaments, seedUsers,
} from "../server/seed/data";
import { finalizeMatchResult, listMatchRows, pickNextPlayable, plausibleScore, plausibleWinner, toBracketLike } from "../server/domain/matches";
import { generateBracket } from "../server/domain/tournaments";

const url = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL ?? "";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

if (!url || !serviceRoleKey) {
  console.error("Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Add them to .env before seeding.");
  process.exit(1);
}

const supabase: SupabaseClient = createClient(url, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });

const summary: Record<string, { created: number; existing: number }> = {};
const track = (entity: string, created: boolean) => {
  summary[entity] ??= { created: 0, existing: 0 };
  summary[entity][created ? "created" : "existing"]++;
};

function must<T>(result: { data: T; error: { message: string } | null }, context: string): NonNullable<T> {
  if (result.error) throw new Error(`${context}: ${result.error.message}`);
  if (result.data === null || result.data === undefined) throw new Error(`${context}: no data returned`);
  return result.data as NonNullable<T>;
}

/** Find a row by an equality filter, or insert it. Returns the row id. */
async function ensureRow(table: string, match: Record<string, unknown>, values: Record<string, unknown>, entity = table): Promise<number> {
  let query = supabase.from(table).select("id");
  for (const [key, value] of Object.entries(match)) query = value === null ? query.is(key, null) : query.eq(key, value);
  const existing = must(await query.limit(1), `${table} lookup`);
  if (existing[0]) { track(entity, false); return Number(existing[0].id); }
  const inserted = must(await supabase.from(table).insert({ ...match, ...values }).select("id").single(), `${table} insert`);
  track(entity, true);
  return Number(inserted.id);
}

async function ensureLink(table: string, values: Record<string, unknown>, entity = table): Promise<void> {
  let query = supabase.from(table).select("*");
  for (const [key, value] of Object.entries(values)) if (key.endsWith("_id")) query = query.eq(key, value);
  const existing = must(await query.limit(1), `${table} lookup`);
  if (existing[0]) { track(entity, false); return; }
  const { error } = await supabase.from(table).insert(values);
  if (error) throw new Error(`${table} insert: ${error.message}`);
  track(entity, true);
}

async function main() {
  console.log(`Seeding ${url}`);

  // ------------------------------------------------------------------ users
  const authUsersByEmail = new Map<string, string>();
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw new Error(`auth.listUsers: ${error.message}`);
    for (const user of data.users) if (user.email) authUsersByEmail.set(user.email.toLowerCase(), user.id);
    if (data.users.length < 1000) break;
  }

  const userIds = new Map<string, number>();
  for (const user of seedUsers) {
    let authId = authUsersByEmail.get(user.email.toLowerCase());
    if (!authId) {
      const { data, error } = await supabase.auth.admin.createUser({ email: user.email, password: DEMO_PASSWORD, email_confirm: true, user_metadata: { name: user.name } });
      if (error || !data.user) throw new Error(`auth.createUser(${user.email}): ${error?.message ?? "no user"}`);
      authId = data.user.id;
      track("auth users", true);
    } else {
      track("auth users", false);
    }
    const row = must(await supabase.from("users").upsert({ supabase_user_id: authId, name: user.name, email: user.email, role: user.role }, { onConflict: "supabase_user_id" }).select("id").single(), `users upsert (${user.email})`);
    userIds.set(user.key, Number(row.id));
    const { error: profileError } = await supabase.from("player_profiles").upsert({ user_id: Number(row.id), handle: user.handle, bio: user.bio, region: user.region, primary_game: user.primaryGame, wins: user.wins, losses: user.losses }, { onConflict: "user_id" });
    if (profileError) throw new Error(`player_profiles upsert (${user.handle}): ${profileError.message}`);
    track("users + profiles", true);
  }
  const uid = (key: string) => {
    const id = userIds.get(key);
    if (!id) throw new Error(`Unknown seed user ${key}`);
    return id;
  };
  const adminActor = { id: uid("admin"), role: "admin" };

  // ------------------------------------------------------------------ clans
  const clanIds = new Map<string, number>();
  for (const clan of seedClans) {
    const id = await ensureRow("clans", { name: clan.name }, { owner_id: uid(clan.ownerKey), tag: clan.tag, region: clan.region, bio: clan.bio, founded_year: clan.foundedYear, verified: clan.verified, follower_count: clan.followerCount, prize_earnings_cents: clan.prizeEarningsCents, trophies: clan.trophies, social_links: clan.socialLinks });
    clanIds.set(clan.key, id);
    await ensureLink("clan_members", { clan_id: id, user_id: uid(clan.ownerKey), role: "owner" });
  }
  const cid = (key: string) => {
    const id = clanIds.get(key);
    if (!id) throw new Error(`Unknown seed clan ${key}`);
    return id;
  };

  // ------------------------------------------------------------------ teams
  const teamIds = new Map<string, number>();
  for (const team of seedTeams) {
    const id = await ensureRow("teams", { name: team.name }, { owner_id: uid(team.ownerKey), captain_id: uid(team.ownerKey), tag: team.tag, game: team.game, region: team.region, description: team.description, wins: team.wins, losses: team.losses });
    teamIds.set(team.key, id);
    for (const memberKey of team.memberKeys) {
      await ensureLink("team_members", { team_id: id, user_id: uid(memberKey), role: memberKey === team.ownerKey ? "captain" : "player" });
      if (team.clanKey) await ensureLink("clan_members", { clan_id: cid(team.clanKey), user_id: uid(memberKey), role: memberKey === seedClans.find(clan => clan.key === team.clanKey)?.ownerKey ? "owner" : "member" });
    }
    if (team.clanKey) await ensureLink("clan_teams", { clan_id: cid(team.clanKey), team_id: id });
  }
  const tid = (key: string) => {
    const id = teamIds.get(key);
    if (!id) throw new Error(`Unknown seed team ${key}`);
    return id;
  };

  for (const achievement of seedAchievements) {
    await ensureRow("clan_achievements", { clan_id: cid(achievement.clanKey), title: achievement.title }, { placement: achievement.placement, prize_cents: achievement.prizeCents, achieved_at: achievement.achievedAt }, "clan achievements");
  }

  // ------------------------------------------------------------ tournaments
  const tournamentIds = new Map<string, number>();
  for (const tournament of seedTournaments) {
    const started = tournament.status === "live" || tournament.status === "completed";
    const initialStatus = started ? "checkin" : tournament.status;
    const existing = must(await supabase.from("tournaments").select("id,status").eq("name", tournament.name).limit(1), "tournaments lookup");
    let id: number;
    if (existing[0]) {
      id = Number(existing[0].id);
      track("tournaments", false);
    } else {
      const inserted = must(await supabase.from("tournaments").insert({
        name: tournament.name, game: tournament.game, format: tournament.format, status: initialStatus, starts_at: tournament.startsAt, registration_closes_at: tournament.registrationClosesAt, checkin_opens_at: tournament.checkinOpensAt,
        prize_pool_cents: tournament.prizePoolCents, entry_fee_cents: tournament.entryFeeCents, max_teams: tournament.maxTeams, rules: tournament.rules, sponsor_name: tournament.sponsorName, sponsor_contribution_cents: tournament.sponsorContributionCents,
        stream_url: tournament.streamUrl, clan_eligible: tournament.clanEligible, description: tournament.description, region: tournament.region, best_of: tournament.bestOf, prize_split: [60, 30, 10], created_by: uid(tournament.createdByKey),
      }).select("id").single(), `tournaments insert (${tournament.name})`);
      id = Number(inserted.id);
      track("tournaments", true);
    }
    tournamentIds.set(tournament.key, id);

    // Registrations (seed order = list order), with sandbox entry-fee payments.
    for (let index = 0; index < tournament.registeredTeamKeys.length; index++) {
      const teamKey = tournament.registeredTeamKeys[index];
      const team = seedTeams.find(row => row.key === teamKey);
      if (!team) throw new Error(`Unknown seed team ${teamKey}`);
      const registered = must(await supabase.from("tournament_registrations").select("id").eq("tournament_id", id).eq("team_id", tid(teamKey)).limit(1), "registration lookup");
      if (registered[0]) { track("registrations", false); continue; }
      let paymentId: number | null = null;
      if (tournament.entryFeeCents > 0) {
        const payment = must(await supabase.from("payments").insert({ user_id: uid(team.ownerKey), kind: "entry_fee", tournament_id: id, team_id: tid(teamKey), amount_cents: tournament.entryFeeCents, currency: "USD", status: "succeeded", provider: "sandbox", reference: `sbx_seed_${tournament.key}_${teamKey}` }).select("id").single(), "payments insert");
        paymentId = Number(payment.id);
        track("payments", true);
      }
      const { error } = await supabase.from("tournament_registrations").insert({
        tournament_id: id, team_id: tid(teamKey), registered_by: uid(team.ownerKey), status: started ? "checked_in" : "confirmed", accepted_rules_at: tournament.registrationClosesAt,
        checked_in_at: started ? tournament.checkinOpensAt : null, seed: index + 1, payment_id: paymentId,
      });
      if (error) throw new Error(`registration insert (${tournament.name}/${teamKey}): ${error.message}`);
      track("registrations", true);
    }

    // Brackets: live tournaments play round one, completed tournaments play to a champion.
    if (started) {
      const matches = await listMatchRows(id);
      if (!matches.length) {
        await generateBracket(adminActor, { tournamentId: id });
        track("brackets", true);
      } else {
        track("brackets", false);
      }
      const seedOrder = tournament.registeredTeamKeys.map(key => tid(key));
      const throughRound = tournament.status === "live" ? 1 : undefined;
      for (let guard = 0; guard < 512; guard++) {
        const rows = (await listMatchRows(id)).map(toBracketLike);
        const next = pickNextPlayable(rows, throughRound);
        if (!next) break;
        const winner = plausibleWinner(next, seedOrder);
        const { winnerScore, loserScore } = plausibleScore(next.id, tournament.bestOf);
        await finalizeMatchResult({ matchId: next.id, winnerTeamId: winner, homeScore: winner === next.homeTeamId ? winnerScore : loserScore, awayScore: winner === next.awayTeamId ? winnerScore : loserScore, actorUserId: adminActor.id, source: "admin" });
        track("results", true);
      }
      if (tournament.status === "completed") {
        // Round robin / Swiss brackets never emit a champion; make sure the status matches the dataset.
        await supabase.from("tournaments").update({ status: "completed" }).eq("id", id);
      }
    }
  }
  const tourId = (key: string) => {
    const id = tournamentIds.get(key);
    if (!id) throw new Error(`Unknown seed tournament ${key}`);
    return id;
  };

  // --------------------------------------------------------------- sponsors
  for (const sponsor of seedSponsors) {
    const sponsorId = await ensureRow("sponsors", { name: sponsor.name }, { mark: sponsor.mark, website_url: sponsor.websiteUrl, tier: sponsor.tier, tone: sponsor.tone, active: true });
    const sponsored = seedTournaments.find(row => row.sponsorName === sponsor.name);
    for (const campaign of sponsor.campaigns) {
      await ensureRow("sponsor_campaigns", { sponsor_id: sponsorId, headline: campaign.headline }, {
        placement: campaign.placement, body: campaign.body, cta_label: campaign.ctaLabel, cta_url: campaign.ctaUrl, active: true,
        tournament_id: (campaign.placement === "tournament" || campaign.placement === "bracket") && sponsored ? tourId(sponsored.key) : null,
        clan_id: campaign.placement === "clan" ? cid(seedClans[0].key) : null,
        starts_at: new Date(Date.now() - 7 * 86_400_000).toISOString(), ends_at: new Date(Date.now() + 60 * 86_400_000).toISOString(),
      }, "sponsor campaigns");
    }
  }

  // --------------------------------------------------------------- products
  for (const product of seedProducts) {
    const { error } = await supabase.from("products").upsert({ sku: product.sku, name: product.name, description: product.description, category: product.category, price_cents: product.priceCents, currency: "USD", clan_id: product.clanKey ? cid(product.clanKey) : null, org_label: product.orgLabel, color: product.color, badge: product.badge, inventory_label: product.inventoryLabel, active: true }, { onConflict: "sku" });
    if (error) throw new Error(`products upsert (${product.sku}): ${error.message}`);
    track("products", true);
  }

  // ------------------------------------------------------------------ media
  for (const media of seedMedia) {
    await ensureRow("media_assets", { title: media.title }, { uploaded_by: uid(media.uploadedByKey), description: media.description, asset_url: `https://demo.menoarena.gg/media/${media.key}.mp4`, thumbnail_url: null, game: media.game, kind: media.kind, tags: media.tags, views: media.views, likes: media.likes, duration_seconds: media.durationSeconds, published: true, clan_id: media.clanKey ? cid(media.clanKey) : null }, "media assets");
  }

  // ----------------------------------------------------------- integrations
  for (const integration of seedIntegrations) {
    const scope = integration.scope === "clan" ? { clan_id: cid(integration.clanKey as string), tournament_id: null } : { tournament_id: tourId(integration.tournamentKey as string), clan_id: null };
    await ensureRow("integration_connections", { provider: integration.provider, ...scope }, { display_name: integration.displayName, status: integration.status, created_by: adminActor.id, external_id: `${integration.provider}:${integration.displayName.toLowerCase().replace(/\s+/g, "-")}` }, "integrations");
  }

  // ---------------------------------------------------------- notifications
  const playerId = uid("free-agent");
  const { count } = await supabase.from("notifications").select("id", { count: "exact", head: true }).eq("user_id", playerId);
  if (!count) {
    const { error } = await supabase.from("notifications").insert([
      { user_id: playerId, kind: "tournament", title: "Registration open: Nightfall Circuit", body: "The Valorant open qualifier is taking registrations. Find a roster and enter.", href: `/tournaments/${tourId("nightfall-val")}` },
      { user_id: playerId, kind: "team_invite", title: "Hush Protocol wants you", body: "Pio Marlo invited you to trial for Hush Protocol.", href: "/dashboard/team" },
      { user_id: playerId, kind: "system", title: "Welcome to Meno Arena", body: "Complete your player profile to appear in scouting searches.", href: "/profile" },
    ]);
    if (error) throw new Error(`notifications insert: ${error.message}`);
    track("notifications", true);
  } else {
    track("notifications", false);
  }

  // ---------------------------------------------------------------- summary
  console.log("\nSeed summary");
  for (const [entity, counts] of Object.entries(summary)) console.log(`  ${entity.padEnd(20)} created ${String(counts.created).padStart(3)}   existing ${String(counts.existing).padStart(3)}`);
  console.log("\nDemo logins (password for all: " + DEMO_PASSWORD + ")");
  for (const user of seedUsers) console.log(`  ${user.role.padEnd(9)} ${user.email}`);
}

main().then(() => process.exit(0)).catch(error => {
  console.error("\nSeed failed:", error instanceof Error ? error.message : error);
  process.exit(1);
});
