import { gameSlugFor } from "@shared/games";
import { camel, camelRows, clean, db, fail, hasDb } from "./_shared";
import { clanLinksForTeams, clansById, teamsById, tournamentsById, uniqueIds, winRate, type ClanSummary, type Viewer } from "./lookups";
import { listNotifications, unreadCount } from "./notifications";
import { legacyTeamRow, listMyTeamsDb, presentTeam, type MyTeam, type MyTeamRole } from "./teams";
import { getPlayerDashboard, updatePlayerProfile } from "../db";

export type ProfileSocials = { twitter?: string; instagram?: string; youtube?: string; tiktok?: string; discord?: string };

const STAFF_STATUSES = ["upcoming", "live", "waiting", "disputed"];

function formStreak(results: Array<{ won: boolean }>) {
  if (!results.length) return "—";
  const first = results[0]!.won;
  let run = 0;
  for (const result of results) { if (result.won === first) run += 1; else break; }
  return `${first ? "W" : "L"}${run}`;
}

/** Legacy fallback shape adapted to the new dashboard contract (no database). */
async function fallbackDashboard(viewer: Viewer) {
  const legacy = await getPlayerDashboard(viewer.id);
  const profile = legacy.profile as { handle: string; bio: string | null; region: string | null; primaryGame: string | null; wins: number; losses: number; avatarUrl?: string | null; bannerUrl?: string | null; socials?: Record<string, string> };
  const wins = profile.wins ?? 0;
  const losses = profile.losses ?? 0;
  return {
    ...legacy,
    profile: { ...profile, avatarUrl: profile.avatarUrl ?? null, bannerUrl: profile.bannerUrl ?? null, socials: profile.socials ?? {} },
    stats: { wins, losses, winRate: winRate(wins, losses), formStreak: wins ? "W2" : "—", tournamentsPlayed: legacy.tournaments.length, titles: 0 },
    teams: legacy.teams.map(team => ({ ...presentTeam(legacyTeamRow(team), { memberCount: 1 }), myRole: "owner" as MyTeamRole })) as MyTeam[],
    clan: legacy.clan ? { id: 0, name: legacy.clan.name, tag: legacy.clan.tag, verified: false, logoUrl: null, myRole: "owner" } : null,
    registrations: [] as Array<Record<string, unknown>>,
    upcomingMatches: [] as Array<Record<string, unknown>>,
    recentResults: [] as Array<Record<string, unknown>>,
    tournamentHistory: [] as Array<Record<string, unknown>>,
    pendingInvites: { team: 0, clan: 0 },
    notifications: { unread: 0, latest: [] as Array<Record<string, unknown>> },
  };
}

export async function playerDashboard(viewer: Viewer) {
  if (!hasDb()) return fallbackDashboard(viewer);

  const [profileResult, userResult, teams] = await Promise.all([
    db().from("player_profiles").select("*").eq("user_id", viewer.id).maybeSingle(),
    db().from("users").select("avatar_url, name, email").eq("id", viewer.id).maybeSingle(),
    listMyTeamsDb(viewer),
  ]);
  if (profileResult.error) fail(profileResult.error, "Profile lookup failed");
  if (userResult.error) fail(userResult.error, "User lookup failed");
  const profileRow = profileResult.data ? camel(profileResult.data) : null;
  const profile = {
    handle: profileRow?.handle ?? "NEW_PLAYER", bio: profileRow?.bio ?? null, region: profileRow?.region ?? null, primaryGame: profileRow?.primaryGame ?? null,
    avatarUrl: profileRow?.avatarUrl ?? userResult.data?.avatar_url ?? null, bannerUrl: profileRow?.bannerUrl ?? null, socials: profileRow?.socials ?? {},
    wins: profileRow?.wins ?? 0, losses: profileRow?.losses ?? 0, name: userResult.data?.name ?? viewer.name ?? null, email: userResult.data?.email ?? viewer.email ?? null,
  };

  const teamIds = teams.map(team => team.id);
  const teamById = new Map(teams.map(team => [team.id, team]));
  const ownedTeamIds = teams.filter(team => team.ownerId === viewer.id).map(team => team.id);
  const teamFilter = teamIds.length ? `home_team_id.in.(${teamIds.join(",")}),away_team_id.in.(${teamIds.join(",")})` : null;

  const [registrationsResult, upcomingResult, completedResult, payoutsResult, clanMembership, teamInvites, clanInvites, unread, latest] = await Promise.all([
    teamIds.length ? db().from("tournament_registrations").select("*").in("team_id", teamIds).order("created_at", { ascending: false }).limit(60) : Promise.resolve({ data: [], error: null }),
    teamFilter ? db().from("matches").select("*").or(teamFilter).in("status", STAFF_STATUSES).order("scheduled_at", { ascending: true, nullsFirst: false }).limit(12) : Promise.resolve({ data: [], error: null }),
    teamFilter ? db().from("matches").select("*").or(teamFilter).eq("status", "completed").order("completed_at", { ascending: false, nullsFirst: false }).order("updated_at", { ascending: false }).limit(8) : Promise.resolve({ data: [], error: null }),
    teamIds.length ? db().from("prize_payouts").select("*").in("team_id", teamIds) : Promise.resolve({ data: [], error: null }),
    db().from("clan_members").select("clan_id, role").eq("user_id", viewer.id).order("joined_at", { ascending: true }).limit(1).maybeSingle(),
    db().from("team_invites").select("id", { count: "exact", head: true }).eq("status", "pending").or(viewer.email ? `invited_user_id.eq.${viewer.id},invited_email.ilike.${viewer.email.replace(/[,()]/g, "")}` : `invited_user_id.eq.${viewer.id}`),
    db().from("clan_invites").select("id, invited_by", { count: "exact" }).eq("status", "pending").or(ownedTeamIds.length ? `user_id.eq.${viewer.id},team_id.in.(${ownedTeamIds.join(",")})` : `user_id.eq.${viewer.id}`),
    unreadCount(viewer.id),
    listNotifications(viewer.id, 5),
  ]);
  for (const result of [registrationsResult, upcomingResult, completedResult, payoutsResult, clanMembership, teamInvites, clanInvites]) {
    if (result.error) fail(result.error, "Dashboard query failed");
  }

  const registrations = camelRows(registrationsResult.data);
  const upcoming = camelRows(upcomingResult.data);
  const completed = camelRows(completedResult.data);
  const payouts = camelRows(payoutsResult.data);

  const opponentIds = [...upcoming, ...completed].flatMap(match => [match.homeTeamId, match.awayTeamId]).filter(id => id && !teamById.has(id));
  const [opponents, tournaments] = await Promise.all([
    teamsById(opponentIds),
    tournamentsById([...registrations.map(reg => reg.tournamentId), ...upcoming.map(match => match.tournamentId), ...completed.map(match => match.tournamentId)]),
  ]);
  const opponentClans = await clanLinksForTeams(opponents.keys());

  const now = Date.now();
  const tournamentMini = (id: number) => {
    const t = tournaments.get(id);
    return t ? { id: t.id, name: t.name, game: t.game, gameSlug: gameSlugFor(t.game), status: t.status, startsAt: t.startsAt, checkinOpensAt: t.checkinOpensAt ?? null, format: t.format, prizePoolCents: t.prizePoolCents, bestOf: t.bestOf ?? 1 } : null;
  };

  const registrationItems = registrations.map(reg => {
    const tournament = tournamentMini(reg.tournamentId);
    const team = teamById.get(reg.teamId);
    const checkinOpen = tournament ? tournament.status === "checkin" || (tournament.status === "registration" && tournament.checkinOpensAt && new Date(tournament.checkinOpensAt).getTime() <= now) : false;
    const canManage = team ? team.myRole === "owner" || team.myRole === "captain" || team.myRole === "manager" : false;
    return {
      id: reg.id, status: reg.status, checkedInAt: reg.checkedInAt ?? null, seed: reg.seed ?? null, createdAt: reg.createdAt, tournament,
      team: team ? { id: team.id, name: team.name, tag: team.tag, logoUrl: team.logoUrl ?? null } : null,
      canCheckIn: Boolean(checkinOpen && canManage && reg.status === "confirmed" && !reg.checkedInAt),
    };
  }).filter(item => item.tournament);

  const describeMatch = (match: Record<string, any>) => {
    const mineId = teamById.has(match.homeTeamId) ? match.homeTeamId : match.awayTeamId;
    const isHome = mineId === match.homeTeamId;
    const opponentId = isHome ? match.awayTeamId : match.homeTeamId;
    const opponent = opponentId ? opponents.get(opponentId) ?? teamById.get(opponentId) : null;
    const opponentClan = opponentId ? opponentClans.get(opponentId) ?? (teamById.get(opponentId)?.clan ?? null) : null;
    const mine = teamById.get(mineId);
    const tournament = tournaments.get(match.tournamentId);
    return {
      id: match.id, tournamentId: match.tournamentId, tournamentName: tournament?.name ?? null, game: tournament?.game ?? null, gameSlug: gameSlugFor(tournament?.game),
      status: match.status, bracket: match.bracket ?? "winners", round: match.round, bestOf: match.bestOf ?? tournament?.bestOf ?? 1, scheduledAt: match.scheduledAt ?? null, completedAt: match.completedAt ?? null, streamUrl: match.streamUrl ?? null,
      team: mine ? { id: mine.id, name: mine.name, tag: mine.tag, logoUrl: mine.logoUrl ?? null } : null,
      opponent: opponent ? { id: opponent.id, name: opponent.name, tag: opponent.tag, logoUrl: opponent.logoUrl ?? null, clanTag: opponentClan?.tag ?? null } : null,
      scoreFor: isHome ? match.homeScore : match.awayScore, scoreAgainst: isHome ? match.awayScore : match.homeScore,
      won: match.status === "completed" ? (match.winnerTeamId ? match.winnerTeamId === mineId : (isHome ? match.homeScore > match.awayScore : match.awayScore > match.homeScore)) : null,
    };
  };

  const upcomingMatches = upcoming.map(describeMatch);
  const recentResults = completed.map(describeMatch).map(match => ({ ...match, won: Boolean(match.won), score: `${match.scoreFor}–${match.scoreAgainst}` }));

  const tournamentHistory = registrationItems
    .filter(item => item.tournament?.status === "completed")
    .map(item => {
      const payout = payouts.find(row => row.tournamentId === item.tournament!.id && row.teamId === item.team?.id) ?? null;
      return { ...item, placement: payout?.placement ?? null, prizeCents: payout ? Number(payout.amountCents ?? 0) : 0, payoutStatus: payout?.status ?? null };
    });

  // Clan affiliation: first clan among my teams, else my direct clan membership.
  let clan: (ClanSummary & { myRole: string | null }) | null = null;
  const teamClan = teams.find(team => team.clan)?.clan ?? null;
  if (teamClan) clan = { ...teamClan, myRole: null };
  if (clanMembership.data) {
    const direct = (await clansById([Number(clanMembership.data.clan_id)])).get(Number(clanMembership.data.clan_id));
    if (direct && (!clan || clan.id === direct.id)) clan = { id: direct.id, name: direct.name, tag: direct.tag, verified: Boolean(direct.verified), logoUrl: direct.logoUrl ?? null, myRole: clanMembership.data.role };
    else if (direct && clan) clan = { ...clan, myRole: null };
  }

  const wins = profile.wins || recentResults.filter(match => match.won).length;
  const losses = profile.losses || recentResults.filter(match => !match.won).length;
  const titles = payouts.filter(row => row.placement === 1).length;
  const clanInviteCount = (clanInvites.data ?? []).filter((row: any) => Number(row.invited_by) !== viewer.id).length;

  return {
    profile,
    stats: { wins, losses, winRate: winRate(wins, losses), formStreak: formStreak(recentResults), tournamentsPlayed: uniqueIds(registrationItems.filter(item => item.tournament && item.tournament.status !== "draft" && item.tournament.status !== "cancelled" && item.status !== "withdrawn").map(item => item.tournament!.id)).length, titles },
    teams,
    clan,
    registrations: registrationItems,
    upcomingMatches,
    recentResults,
    tournamentHistory,
    pendingInvites: { team: teamInvites.count ?? 0, clan: clanInviteCount },
    notifications: { unread, latest },
    // Legacy keys kept for older client surfaces.
    tournaments: Array.from(tournaments.values()).slice(0, 6),
    matches: [...upcoming, ...completed].slice(0, 8),
  };
}

export async function updateProfile(viewer: Viewer, input: { handle: string; bio?: string; region?: string; primaryGame?: string; avatarUrl?: string; bannerUrl?: string; socials?: ProfileSocials }) {
  if (!hasDb()) return updatePlayerProfile({ userId: viewer.id, handle: input.handle, bio: input.bio, region: input.region, primaryGame: input.primaryGame });
  const existing = await db().from("player_profiles").select("socials").eq("user_id", viewer.id).maybeSingle();
  if (existing.error) fail(existing.error, "Profile lookup failed");
  const row: Record<string, unknown> = {
    user_id: viewer.id, handle: input.handle.trim().toUpperCase(), bio: clean(input.bio), region: clean(input.region)?.toUpperCase() ?? null, primary_game: clean(input.primaryGame),
  };
  if (input.avatarUrl !== undefined) row.avatar_url = clean(input.avatarUrl);
  if (input.bannerUrl !== undefined) row.banner_url = clean(input.bannerUrl);
  if (input.socials !== undefined) row.socials = { ...((existing.data?.socials as Record<string, string> | null) ?? {}), ...input.socials };
  const { data, error } = await db().from("player_profiles").upsert(row, { onConflict: "user_id" }).select().single();
  if (error) fail(error, "Profile update failed");
  if (input.avatarUrl !== undefined) {
    const user = await db().from("users").update({ avatar_url: clean(input.avatarUrl) }).eq("id", viewer.id);
    if (user.error) console.warn("[Profile] avatar sync failed:", user.error.message);
  }
  return camel(data);
}
