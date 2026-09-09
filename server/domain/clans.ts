import type { ClanRole } from "@shared/arena";
import { gameSlugFor } from "@shared/games";
import { badRequest, camel, camelRows, clean, db, fail, forbidden, hasDb, notFound } from "./_shared";
import {
  clanAccess, clansById, gameMatches, isAdmin, isoNow, memberCountsForTeams, requireClanManager, requireClanOwner, resolveUser, safeFilter, teamAccess, teamIdsForClans, teamsById,
  uniqueIds, userLabel, usersById, winRate, type ClanRow, type TeamRow, type Viewer,
} from "./lookups";
import { notify } from "./notifications";
import { fallbackAchievements, fallbackClans, fallbackSponsors, fallbackTeamRoster, fallbackTeams, fallbackUsers } from "./seed";
import { legacyTeamRow } from "./teams";
import { createClanForUser, getClanDashboard, getClansForUser } from "../db";

export type SocialLinks = { twitter?: string; instagram?: string; youtube?: string; tiktok?: string; discord?: string };
export type ClanSort = "trophies" | "earnings" | "followers" | "region" | "newest";

const normalizeTag = (tag: string) => tag.trim().toUpperCase().slice(0, 8);
const normalizeRegion = (region: string | null | undefined) => (clean(region)?.toUpperCase() ?? null);
const clanHref = (clanId: number) => `/clans/${clanId}`;

/** Normalises a legacy (drizzle / in-memory) clan row into the platform ClanRow shape. */
function legacyClanRow(clan: Record<string, any>): ClanRow {
  return {
    id: Number(clan.id), ownerId: Number(clan.ownerId), name: String(clan.name ?? ""), tag: String(clan.tag ?? ""), region: clan.region ?? null, bio: clan.bio ?? null, foundedYear: clan.foundedYear ?? null, socials: clan.socials ?? null,
    socialLinks: clan.socialLinks ?? {}, logoUrl: clan.logoUrl ?? null, bannerUrl: clan.bannerUrl ?? null, verified: Boolean(clan.verified), followerCount: Number(clan.followerCount ?? 0), prizeEarningsCents: Number(clan.prizeEarningsCents ?? 0), trophies: Number(clan.trophies ?? 0),
    createdAt: clan.createdAt ? new Date(clan.createdAt) : new Date(), updatedAt: clan.updatedAt ? new Date(clan.updatedAt) : new Date(),
  };
}

function presentClan(clan: ClanRow) {
  return {
    ...clan,
    socialLinks: clan.socialLinks ?? {},
    verified: Boolean(clan.verified),
    followerCount: clan.followerCount ?? 0,
    prizeEarningsCents: Number(clan.prizeEarningsCents ?? 0),
    trophies: clan.trophies ?? 0,
  };
}

const teamMini = (team: TeamRow, memberCount = 0) => ({
  id: team.id, name: team.name, tag: team.tag, game: team.game, gameSlug: gameSlugFor(team.game), region: team.region ?? null, logoUrl: team.logoUrl ?? null,
  memberCount, wins: team.wins ?? 0, losses: team.losses ?? 0, lineupLockedAt: team.lineupLockedAt ?? null, ownerId: team.ownerId,
});

/** Teams grouped per clan with aggregate stats. */
async function clanRosters(clanIds: number[]) {
  const links = await teamIdsForClans(clanIds);
  const teamIds = uniqueIds(Array.from(links.values()).flat());
  const [teams, counts] = await Promise.all([teamsById(teamIds), memberCountsForTeams(teamIds)]);
  const byClan = new Map<number, ReturnType<typeof teamMini>[]>();
  for (const [clanId, ids] of Array.from(links.entries())) {
    byClan.set(clanId, ids.map(id => teams.get(id)).filter((team): team is TeamRow => Boolean(team)).map(team => teamMini(team, counts.get(team.id) ?? 0)));
  }
  return byClan;
}

function statsFor(clan: ClanRow, teams: Array<{ wins: number; losses: number }>) {
  const wins = teams.reduce((sum, team) => sum + team.wins, 0);
  const losses = teams.reduce((sum, team) => sum + team.losses, 0);
  return { wins, losses, winRate: winRate(wins, losses), prizeEarningsCents: Number(clan.prizeEarningsCents ?? 0), trophies: clan.trophies ?? 0 };
}

async function loadClanRow(clanId: number) {
  const { data, error } = await db().from("clans").select("*").eq("id", clanId).maybeSingle();
  if (error) fail(error, "Clan lookup failed");
  if (!data) notFound("Clan");
  return camel<ClanRow>(data);
}

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

export async function listMyClans(viewer: Viewer) {
  if (!hasDb()) {
    const legacy = await getClansForUser(viewer.id);
    return legacy.map(clan => {
      const row = legacyClanRow(clan);
      return { ...presentClan(row), myRole: "owner" as ClanRole, teamCount: 0, stats: statsFor(row, []) };
    });
  }
  const memberships = await db().from("clan_members").select("clan_id, role").eq("user_id", viewer.id);
  if (memberships.error) fail(memberships.error, "Clan membership lookup failed");
  const roleByClan = new Map((memberships.data ?? []).map((row: any) => [Number(row.clan_id), row.role as ClanRole]));
  const ids = uniqueIds(roleByClan.keys());
  const filter = ids.length ? `owner_id.eq.${viewer.id},id.in.(${ids.join(",")})` : `owner_id.eq.${viewer.id}`;
  const { data, error } = await db().from("clans").select("*").or(filter).order("created_at", { ascending: false });
  if (error) fail(error, "Clan lookup failed");
  const clans = camelRows<ClanRow>(data);
  const rosters = await clanRosters(clans.map(clan => clan.id));
  return clans.map(clan => ({
    ...presentClan(clan),
    myRole: clan.ownerId === viewer.id ? ("owner" as const) : (roleByClan.get(clan.id) ?? ("member" as const)),
    teamCount: rosters.get(clan.id)?.length ?? 0,
    stats: statsFor(clan, rosters.get(clan.id) ?? []),
  }));
}

export async function clanDirectory(input: { sort?: ClanSort; region?: string; game?: string; search?: string; limit?: number }) {
  const limit = input.limit ?? 50;
  const sort = input.sort ?? "trophies";
  let rows: Array<ReturnType<typeof fallbackClans>[number] | (ReturnType<typeof presentClan> & { teamCount: number; games: string[]; stats: ReturnType<typeof statsFor> })>;

  if (!hasDb()) {
    rows = fallbackClans();
  } else {
    let query = db().from("clans").select("*").limit(Math.max(limit * 4, 200));
    if (input.region) query = query.ilike("region", safeFilter(input.region));
    if (input.search) {
      const term = safeFilter(input.search);
      if (term) query = query.or(`name.ilike.%${term}%,tag.ilike.%${term}%`);
    }
    const { data, error } = await query;
    if (error) fail(error, "Clan directory failed");
    const clans = camelRows<ClanRow>(data);
    const rosters = await clanRosters(clans.map(clan => clan.id));
    rows = clans.map(clan => {
      const teams = rosters.get(clan.id) ?? [];
      return { ...presentClan(clan), teamCount: teams.length, games: Array.from(new Set(teams.map(team => team.game))), stats: statsFor(clan, teams) };
    });
  }

  const filtered = rows
    .filter(clan => !input.region || clan.region?.toLowerCase() === input.region.toLowerCase())
    .filter(clan => !input.search || `${clan.name} ${clan.tag}`.toLowerCase().includes(input.search.toLowerCase()))
    .filter(clan => !input.game || clan.games.some(game => gameMatches(game, input.game, gameSlugFor)));

  const sorters: Record<ClanSort, (a: typeof filtered[number], b: typeof filtered[number]) => number> = {
    trophies: (a, b) => b.trophies - a.trophies || b.prizeEarningsCents - a.prizeEarningsCents,
    earnings: (a, b) => b.prizeEarningsCents - a.prizeEarningsCents || b.trophies - a.trophies,
    followers: (a, b) => b.followerCount - a.followerCount,
    region: (a, b) => (a.region ?? "").localeCompare(b.region ?? "") || b.trophies - a.trophies,
    newest: (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  };
  return filtered.sort(sorters[sort]).slice(0, limit);
}

export async function clanLeaderboard(input: { sort?: ClanSort; region?: string; game?: string; search?: string; limit?: number }) {
  const rows = await clanDirectory({ ...input, sort: input.sort ?? "trophies" });
  return rows.map((clan, index) => ({ ...clan, rank: index + 1 }));
}

export async function getClan(input: { clanId?: number; tag?: string }, viewer: Viewer | null) {
  if (!input.clanId && !input.tag) badRequest("Provide a clanId or tag.");
  if (!hasDb()) return getClanFallback(input, viewer);

  let query = db().from("clans").select("*");
  query = input.clanId ? query.eq("id", input.clanId) : query.ilike("tag", safeFilter(input.tag!));
  const { data, error } = await query.limit(1).maybeSingle();
  if (error) fail(error, "Clan lookup failed");
  if (!data) notFound("Clan");
  const clan = camel<ClanRow>(data);

  const [rosters, members, achievements, sponsors, following] = await Promise.all([
    clanRosters([clan.id]),
    db().from("clan_members").select("user_id, role, joined_at").eq("clan_id", clan.id).order("joined_at", { ascending: true }),
    db().from("clan_achievements").select("*").eq("clan_id", clan.id).order("achieved_at", { ascending: false }).limit(20),
    db().from("sponsors").select("*").eq("clan_id", clan.id).eq("active", true),
    viewer ? db().from("clan_followers").select("user_id").eq("clan_id", clan.id).eq("user_id", viewer.id).maybeSingle() : Promise.resolve({ data: null, error: null }),
  ]);
  if (members.error) fail(members.error, "Clan staff lookup failed");
  if (achievements.error) fail(achievements.error, "Achievement lookup failed");
  if (sponsors.error) fail(sponsors.error, "Sponsor lookup failed");
  if (following.error) fail(following.error, "Follow lookup failed");

  const teams = rosters.get(clan.id) ?? [];
  const teamIds = teams.map(team => team.id);
  const [teamMembers, completedMatches] = await Promise.all([
    teamIds.length ? db().from("team_members").select("team_id, user_id, role").in("team_id", teamIds) : Promise.resolve({ data: [], error: null }),
    teamIds.length ? db().from("matches").select("home_team_id, away_team_id, winner_team_id").eq("status", "completed").or(`home_team_id.in.(${teamIds.join(",")}),away_team_id.in.(${teamIds.join(",")})`).limit(500) : Promise.resolve({ data: [], error: null }),
  ]);
  if (teamMembers.error) fail(teamMembers.error, "Roster lookup failed");
  if (completedMatches.error) fail(completedMatches.error, "Rivalry lookup failed");

  const userIds = [clan.ownerId, ...(members.data ?? []).map((row: any) => Number(row.user_id)), ...(teamMembers.data ?? []).map((row: any) => Number(row.user_id))];
  const users = await usersById(userIds);

  const rosterByTeam = new Map<number, Array<{ userId: number; name: string; handle: string | null; avatarUrl: string | null; role: string }>>();
  for (const row of teamMembers.data ?? []) {
    const user = users.get(Number(row.user_id));
    const list = rosterByTeam.get(Number(row.team_id)) ?? [];
    list.push({ userId: Number(row.user_id), name: userLabel(user), handle: user?.handle ?? null, avatarUrl: user?.avatarUrl ?? null, role: row.role });
    rosterByTeam.set(Number(row.team_id), list);
  }

  // Rivalries: completed head-to-head results grouped by the opposing clan.
  const teamIdSet = new Set(teamIds);
  const opponentTeamIds = uniqueIds((completedMatches.data ?? []).flatMap((row: any) => [Number(row.home_team_id), Number(row.away_team_id)]).filter(id => !teamIdSet.has(id)));
  const opponentClanLinks = opponentTeamIds.length ? await db().from("clan_teams").select("clan_id, team_id").in("team_id", opponentTeamIds) : { data: [], error: null };
  if (opponentClanLinks.error) fail(opponentClanLinks.error, "Rivalry lookup failed");
  const clanByTeam = new Map((opponentClanLinks.data ?? []).map((row: any) => [Number(row.team_id), Number(row.clan_id)]));
  const rivalryTotals = new Map<number, { wins: number; losses: number; matches: number }>();
  for (const row of completedMatches.data ?? []) {
    const home = Number(row.home_team_id);
    const away = Number(row.away_team_id);
    const ours = teamIdSet.has(home) ? home : away;
    const theirs = ours === home ? away : home;
    const rivalClanId = clanByTeam.get(theirs);
    if (!rivalClanId || rivalClanId === clan.id) continue;
    const totals = rivalryTotals.get(rivalClanId) ?? { wins: 0, losses: 0, matches: 0 };
    totals.matches += 1;
    if (Number(row.winner_team_id) === ours) totals.wins += 1; else if (row.winner_team_id) totals.losses += 1;
    rivalryTotals.set(rivalClanId, totals);
  }
  const rivalClans = await clansById(rivalryTotals.keys());
  const rivalries = Array.from(rivalryTotals.entries())
    .sort((a, b) => b[1].matches - a[1].matches)
    .slice(0, 3)
    .map(([rivalId, totals]) => {
      const rival = rivalClans.get(rivalId);
      return { clan: rival ? { id: rival.id, name: rival.name, tag: rival.tag, verified: Boolean(rival.verified), logoUrl: rival.logoUrl ?? null } : { id: rivalId, name: "Unknown clan", tag: "???", verified: false, logoUrl: null }, ...totals };
    });

  const staff = (members.data ?? []).map((row: any) => {
    const user = users.get(Number(row.user_id));
    return { userId: Number(row.user_id), name: userLabel(user), handle: user?.handle ?? null, avatarUrl: user?.avatarUrl ?? null, role: row.role as ClanRole, joinedAt: new Date(String(row.joined_at)) };
  });
  if (!staff.some(member => member.userId === clan.ownerId)) {
    const owner = users.get(clan.ownerId);
    staff.unshift({ userId: clan.ownerId, name: userLabel(owner, "Owner"), handle: owner?.handle ?? null, avatarUrl: owner?.avatarUrl ?? null, role: "owner", joinedAt: clan.createdAt });
  }

  const access = viewer ? await clanAccess(clan.id, viewer) : null;
  return {
    ...presentClan(clan),
    teams: teams.map(team => ({ ...team, roster: rosterByTeam.get(team.id) ?? [] })),
    achievements: camelRows(achievements.data).map(row => ({ ...row, prizeCents: Number(row.prizeCents ?? 0) })),
    stats: statsFor(clan, teams),
    followerCount: clan.followerCount ?? 0,
    isFollowing: Boolean(following.data),
    sponsors: camelRows(sponsors.data),
    members: staff,
    rivalries,
    viewer: access ? { canManage: access.canManage, isOwner: access.isOwner, isMember: access.isMember, role: access.isOwner ? "owner" : access.memberRole } : null,
  };
}

function getClanFallback(input: { clanId?: number; tag?: string }, viewer: Viewer | null) {
  const clan = fallbackClans().find(entry => (input.clanId ? entry.id === input.clanId : entry.tag.toLowerCase() === input.tag?.toLowerCase()));
  if (!clan) notFound("Clan");
  const teams = fallbackTeams().filter(team => team.clan?.id === clan.id);
  const owner = fallbackUsers()[clan.ownerId - 1];
  const isOwner = viewer?.id === clan.ownerId;
  return {
    ...clan,
    teams: teams.map(team => ({ ...teamMini(team as unknown as TeamRow, team.memberCount), roster: fallbackTeamRoster(team.id) })),
    achievements: fallbackAchievements(clan.id),
    followerCount: clan.followerCount,
    isFollowing: false,
    sponsors: fallbackSponsors().filter(sponsor => sponsor.clanId === clan.id),
    members: owner ? [{ userId: owner.id, name: owner.name, handle: owner.handle, avatarUrl: null, role: "owner" as ClanRole, joinedAt: clan.createdAt }] : [],
    rivalries: [] as Array<{ clan: { id: number; name: string; tag: string; verified: boolean; logoUrl: string | null }; wins: number; losses: number; matches: number }>,
    viewer: viewer ? { canManage: isOwner || isAdmin(viewer), isOwner, isMember: isOwner, role: isOwner ? "owner" : null } : null,
  };
}

export async function clanDashboard(viewer: Viewer, clanId: number) {
  if (!hasDb()) {
    const legacy = await getClanDashboard(clanId, viewer.id);
    if (!legacy.clan) notFound("Clan");
    const row = legacyClanRow(legacy.clan);
    const teams = legacy.teams.map(team => teamMini(legacyTeamRow(team), 1));
    return {
      clan: presentClan(row),
      teams,
      members: [] as Array<{ userId: number; name: string; handle: string | null; avatarUrl: string | null; role: ClanRole; joinedAt: Date }>,
      pendingInvites: [] as Awaited<ReturnType<typeof decorateClanInvites>>,
      achievements: [] as Array<Record<string, any>>,
      followerCount: 0,
      sponsors: [] as Array<Record<string, any>>,
      stats: statsFor(row, teams),
      myRole: "owner" as ClanRole | null,
      viewer: { canManage: true, isOwner: true },
    };
  }
  const access = await clanAccess(clanId, viewer);
  if (!access.isMember && !isAdmin(viewer)) forbidden("You are not part of this clan.");
  const { clan } = access;
  const [rosters, members, invites, achievements, sponsors] = await Promise.all([
    clanRosters([clanId]),
    db().from("clan_members").select("user_id, role, joined_at").eq("clan_id", clanId).order("joined_at", { ascending: true }),
    access.canManage ? db().from("clan_invites").select("*").eq("clan_id", clanId).eq("status", "pending").order("created_at", { ascending: false }) : Promise.resolve({ data: [], error: null }),
    db().from("clan_achievements").select("*").eq("clan_id", clanId).order("achieved_at", { ascending: false }),
    db().from("sponsors").select("*").eq("clan_id", clanId),
  ]);
  if (members.error) fail(members.error, "Clan staff lookup failed");
  if (invites.error) fail(invites.error, "Invite lookup failed");
  if (achievements.error) fail(achievements.error, "Achievement lookup failed");
  if (sponsors.error) fail(sponsors.error, "Sponsor lookup failed");

  const teams = rosters.get(clanId) ?? [];
  const pendingInvites = await decorateClanInvites(invites.data ?? []);
  const users = await usersById([clan.ownerId, ...(members.data ?? []).map((row: any) => Number(row.user_id))]);
  const staff = (members.data ?? []).map((row: any) => {
    const user = users.get(Number(row.user_id));
    return { userId: Number(row.user_id), name: userLabel(user), handle: user?.handle ?? null, avatarUrl: user?.avatarUrl ?? null, role: row.role as ClanRole, joinedAt: new Date(String(row.joined_at)) };
  });
  if (!staff.some(member => member.userId === clan.ownerId)) {
    const owner = users.get(clan.ownerId);
    staff.unshift({ userId: clan.ownerId, name: userLabel(owner, "Owner"), handle: owner?.handle ?? null, avatarUrl: owner?.avatarUrl ?? null, role: "owner", joinedAt: clan.createdAt });
  }

  return {
    clan: presentClan(clan),
    teams,
    members: staff,
    pendingInvites,
    achievements: camelRows(achievements.data).map(row => ({ ...row, prizeCents: Number(row.prizeCents ?? 0) })),
    followerCount: clan.followerCount ?? 0,
    sponsors: camelRows(sponsors.data),
    stats: statsFor(clan, teams),
    myRole: access.isOwner ? ("owner" as ClanRole) : access.memberRole,
    viewer: { canManage: access.canManage, isOwner: access.isOwner },
  };
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export async function createClan(viewer: Viewer, input: { name: string; tag: string; region?: string; bio?: string; foundedYear?: number; socials?: string; logoUrl?: string; bannerUrl?: string; socialLinks?: SocialLinks }) {
  if (!hasDb()) return createClanForUser({ ownerId: viewer.id, name: input.name, tag: input.tag, region: input.region, bio: input.bio, foundedYear: input.foundedYear, socials: input.socials });
  const row = {
    owner_id: viewer.id, name: input.name.trim(), tag: normalizeTag(input.tag), region: normalizeRegion(input.region), bio: clean(input.bio), founded_year: input.foundedYear ?? null,
    socials: clean(input.socials), logo_url: clean(input.logoUrl), banner_url: clean(input.bannerUrl), social_links: input.socialLinks ?? {},
  };
  const { data, error } = await db().from("clans").insert(row).select().single();
  if (error) fail(error, "Clan creation failed");
  const membership = await db().from("clan_members").insert({ clan_id: data.id, user_id: viewer.id, role: "owner" });
  if (membership.error) fail(membership.error, "Clan ownership failed");
  return presentClan(camel<ClanRow>(data));
}

export async function updateClan(viewer: Viewer, input: { clanId: number; name?: string; tag?: string; region?: string; bio?: string; foundedYear?: number | null; socials?: string; logoUrl?: string; bannerUrl?: string; socialLinks?: SocialLinks }) {
  const access = await clanAccess(input.clanId, viewer);
  requireClanManager(access);
  const patch: Record<string, unknown> = {};
  if (input.name !== undefined) patch.name = input.name.trim();
  if (input.tag !== undefined) patch.tag = normalizeTag(input.tag);
  if (input.region !== undefined) patch.region = normalizeRegion(input.region);
  if (input.bio !== undefined) patch.bio = clean(input.bio);
  if (input.foundedYear !== undefined) patch.founded_year = input.foundedYear;
  if (input.socials !== undefined) patch.socials = clean(input.socials);
  if (input.logoUrl !== undefined) patch.logo_url = clean(input.logoUrl);
  if (input.bannerUrl !== undefined) patch.banner_url = clean(input.bannerUrl);
  if (input.socialLinks !== undefined) patch.social_links = { ...(access.clan.socialLinks ?? {}), ...input.socialLinks };
  if (!Object.keys(patch).length) badRequest("Nothing to update.");
  const { data, error } = await db().from("clans").update(patch).eq("id", input.clanId).select().single();
  if (error) fail(error, "Clan update failed");
  return presentClan(camel<ClanRow>(data));
}

export async function followClan(viewer: Viewer, clanId: number, follow: boolean) {
  await loadClanRow(clanId);
  if (follow) {
    const { error } = await db().from("clan_followers").upsert({ clan_id: clanId, user_id: viewer.id }, { onConflict: "clan_id,user_id", ignoreDuplicates: true });
    if (error) fail(error, "Follow failed");
  } else {
    const { error } = await db().from("clan_followers").delete().eq("clan_id", clanId).eq("user_id", viewer.id);
    if (error) fail(error, "Unfollow failed");
  }
  const clan = await loadClanRow(clanId);
  return { following: follow, followerCount: clan.followerCount ?? 0 };
}

export async function inviteToClan(viewer: Viewer, input: { clanId: number; teamId?: number; userId?: number; handle?: string; role?: ClanRole; message?: string }) {
  const targets = [input.teamId, input.userId, input.handle].filter(value => value !== undefined && value !== null && value !== "");
  if (targets.length !== 1) badRequest("Provide exactly one of teamId, userId, or handle.");
  const access = await clanAccess(input.clanId, viewer);
  requireClanManager(access);
  const role = input.role ?? "member";
  if (role === "owner") badRequest("Ownership cannot be granted through an invite.");

  if (input.teamId) {
    const team = (await teamsById([input.teamId])).get(input.teamId);
    if (!team) notFound("Team");
    const linked = await db().from("clan_teams").select("clan_id").eq("team_id", input.teamId).maybeSingle();
    if (linked.error) fail(linked.error, "Clan link lookup failed");
    if (linked.data) badRequest(Number(linked.data.clan_id) === input.clanId ? "That team is already in this clan." : "That team already belongs to another clan.");
    const pending = await db().from("clan_invites").select("id").eq("clan_id", input.clanId).eq("team_id", input.teamId).eq("status", "pending").maybeSingle();
    if (pending.error) fail(pending.error, "Invite check failed");
    if (pending.data) badRequest("An invite for that team is already pending.");
    const { data, error } = await db().from("clan_invites").insert({ clan_id: input.clanId, team_id: input.teamId, invited_by: viewer.id, role: "member", message: clean(input.message) }).select().single();
    if (error) fail(error, "Invite creation failed");
    await notify({ userId: team.ownerId, kind: "clan_invite", title: `${access.clan.name} invited ${team.name}`, body: `${viewer.name ?? "A clan manager"} invited your team ${team.name} [${team.tag}] to join ${access.clan.name}.`, href: "/dashboard" });
    return camel(data);
  }

  const user = await resolveUser({ userId: input.userId, handle: input.handle });
  if (!user) notFound("Player");
  if (user.id === access.clan.ownerId) badRequest("That player already owns this clan.");
  const member = await db().from("clan_members").select("user_id").eq("clan_id", input.clanId).eq("user_id", user.id).maybeSingle();
  if (member.error) fail(member.error, "Membership check failed");
  if (member.data) badRequest("That player is already a clan member.");
  const pending = await db().from("clan_invites").select("id").eq("clan_id", input.clanId).eq("user_id", user.id).eq("status", "pending").maybeSingle();
  if (pending.error) fail(pending.error, "Invite check failed");
  if (pending.data) badRequest("An invite for that player is already pending.");
  const { data, error } = await db().from("clan_invites").insert({ clan_id: input.clanId, user_id: user.id, invited_by: viewer.id, role, message: clean(input.message) }).select().single();
  if (error) fail(error, "Invite creation failed");
  await notify({ userId: user.id, kind: "clan_invite", title: `Invite to join ${access.clan.name}`, body: `${viewer.name ?? "A clan manager"} invited you to join ${access.clan.name} as ${role}.`, href: "/dashboard" });
  return camel(data);
}

async function decorateClanInvites(rows: Record<string, any>[]) {
  const invites = camelRows(rows);
  const [clans, teams, users] = await Promise.all([
    clansById(invites.map(invite => invite.clanId)),
    teamsById(invites.map(invite => invite.teamId)),
    usersById(invites.flatMap(invite => [invite.invitedBy, invite.userId])),
  ]);
  return invites.map(invite => {
    const clan = clans.get(invite.clanId);
    const team = invite.teamId ? teams.get(invite.teamId) : null;
    const user = invite.userId ? users.get(invite.userId) : null;
    const inviter = users.get(invite.invitedBy);
    const isRequest = Boolean(team && clan && inviter && inviter.id !== clan.ownerId && team.ownerId === inviter.id);
    return {
      ...invite,
      id: Number(invite.id), clanId: Number(invite.clanId), teamId: (invite.teamId ?? null) as number | null, userId: (invite.userId ?? null) as number | null, invitedBy: Number(invite.invitedBy),
      role: invite.role as ClanRole, status: invite.status as string, message: (invite.message ?? null) as string | null, createdAt: invite.createdAt as Date,
      kind: invite.teamId ? (isRequest ? ("team_request" as const) : ("team" as const)) : ("user" as const),
      clan: clan ? { id: clan.id, name: clan.name, tag: clan.tag, verified: Boolean(clan.verified), logoUrl: clan.logoUrl ?? null } : null,
      team: team ? { id: team.id, name: team.name, tag: team.tag, game: team.game, gameSlug: gameSlugFor(team.game), logoUrl: team.logoUrl ?? null, ownerId: team.ownerId } : null,
      user: user ? { id: user.id, name: userLabel(user), handle: user.handle, avatarUrl: user.avatarUrl } : null,
      inviter: { id: invite.invitedBy, name: userLabel(inviter, "Clan manager"), handle: inviter?.handle ?? null },
    };
  });
}

export async function listMyClanInvites(viewer: Viewer) {
  if (!hasDb()) return [];
  const owned = await db().from("teams").select("id").eq("owner_id", viewer.id);
  if (owned.error) fail(owned.error, "Team lookup failed");
  const teamIds = (owned.data ?? []).map((row: any) => Number(row.id));
  const filter = teamIds.length ? `user_id.eq.${viewer.id},team_id.in.(${teamIds.join(",")})` : `user_id.eq.${viewer.id}`;
  const { data, error } = await db().from("clan_invites").select("*").eq("status", "pending").or(filter).order("created_at", { ascending: false });
  if (error) fail(error, "Invite lookup failed");
  // Team-join requests raised by the team itself are shown to the clan, not back to the requester.
  const invites = await decorateClanInvites(data ?? []);
  return invites.filter(invite => invite.invitedBy !== viewer.id);
}

export async function listClanInvites(viewer: Viewer, clanId: number) {
  const access = await clanAccess(clanId, viewer);
  requireClanManager(access);
  const { data, error } = await db().from("clan_invites").select("*").eq("clan_id", clanId).eq("status", "pending").order("created_at", { ascending: false });
  if (error) fail(error, "Invite lookup failed");
  return decorateClanInvites(data ?? []);
}

async function loadClanInvite(inviteId: number) {
  const { data, error } = await db().from("clan_invites").select("*").eq("id", inviteId).maybeSingle();
  if (error) fail(error, "Invite lookup failed");
  if (!data) notFound("Invite");
  return camel(data);
}

export async function respondToClanInvite(viewer: Viewer, input: { inviteId: number; accept: boolean }) {
  const invite = await loadClanInvite(input.inviteId);
  if (invite.status !== "pending") badRequest("This invite has already been handled.");
  const clan = await loadClanRow(invite.clanId);

  if (invite.teamId) {
    const team = (await teamsById([invite.teamId])).get(invite.teamId);
    if (!team) notFound("Team");
    // A row created by someone with clan-manage rights is an invite (team leadership answers);
    // anything else is a join request raised by the team (clan managers answer).
    const inviterClanAccess = await clanAccess(clan.id, { id: invite.invitedBy, role: "user" });
    if (inviterClanAccess.canManage) {
      const access = await teamAccess(team.id, viewer);
      if (!access.canLead) forbidden("Only the team owner or captain can respond to this invite.");
    } else {
      const access = await clanAccess(clan.id, viewer);
      requireClanManager(access);
    }
    if (input.accept) {
      const linked = await db().from("clan_teams").select("clan_id").eq("team_id", team.id).maybeSingle();
      if (linked.error) fail(linked.error, "Clan link lookup failed");
      if (linked.data) badRequest("That team already belongs to a clan.");
      const { error } = await db().from("clan_teams").insert({ clan_id: clan.id, team_id: team.id });
      if (error) fail(error, "Clan roster update failed");
    }
    const { error } = await db().from("clan_invites").update({ status: input.accept ? "accepted" : "declined", responded_at: isoNow() }).eq("id", invite.id);
    if (error) fail(error, "Invite update failed");
    const recipients = uniqueIds([clan.ownerId, team.ownerId, invite.invitedBy]).filter(id => id !== viewer.id);
    await notify(recipients.map(userId => ({
      userId, kind: "clan_roster" as const,
      title: input.accept ? `${team.name} joined ${clan.name}` : `${team.name} will not join ${clan.name}`,
      body: input.accept ? `${team.name} [${team.tag}] is now part of the ${clan.name} roster.` : `The clan roster request between ${team.name} and ${clan.name} was declined.`,
      href: clanHref(clan.id),
    })));
    return { inviteId: invite.id, accepted: input.accept, clan: { id: clan.id, name: clan.name, tag: clan.tag }, team: { id: team.id, name: team.name, tag: team.tag } };
  }

  if (invite.userId !== viewer.id) forbidden("This invite was not sent to you.");
  if (input.accept) {
    const { error } = await db().from("clan_members").upsert({ clan_id: clan.id, user_id: viewer.id, role: invite.role }, { onConflict: "clan_id,user_id" });
    if (error) fail(error, "Joining the clan failed");
  }
  const { error } = await db().from("clan_invites").update({ status: input.accept ? "accepted" : "declined", responded_at: isoNow() }).eq("id", invite.id);
  if (error) fail(error, "Invite update failed");
  await notify({ userId: invite.invitedBy, kind: "clan_roster", title: input.accept ? `${viewer.name ?? "A player"} joined ${clan.name}` : `${viewer.name ?? "A player"} declined the clan invite`, body: input.accept ? `${viewer.name ?? "A player"} accepted the invite to ${clan.name} as ${invite.role}.` : `The invite to ${clan.name} was declined.`, href: clanHref(clan.id) });
  return { inviteId: invite.id, accepted: input.accept, clan: { id: clan.id, name: clan.name, tag: clan.tag }, team: null };
}

export async function revokeClanInvite(viewer: Viewer, inviteId: number) {
  const invite = await loadClanInvite(inviteId);
  if (invite.status !== "pending") badRequest("Only pending invites can be revoked.");
  const access = await clanAccess(invite.clanId, viewer);
  if (!access.canManage && invite.invitedBy !== viewer.id) forbidden("Only the clan's managers or the person who sent the invite can revoke it.");
  const { error } = await db().from("clan_invites").update({ status: "revoked", responded_at: isoNow() }).eq("id", inviteId);
  if (error) fail(error, "Invite revoke failed");
  return { success: true as const };
}

export async function setClanMemberRole(viewer: Viewer, input: { clanId: number; userId: number; role: ClanRole }) {
  const access = await clanAccess(input.clanId, viewer);
  requireClanOwner(access, viewer);
  if (input.userId === access.clan.ownerId) badRequest("The clan owner's role cannot be changed here.");
  if (input.role === "owner") badRequest("Ownership transfer is not supported yet.");
  const { data, error } = await db().from("clan_members").update({ role: input.role }).eq("clan_id", input.clanId).eq("user_id", input.userId).select("user_id");
  if (error) fail(error, "Role update failed");
  if (!data?.length) notFound("Clan member");
  await notify({ userId: input.userId, kind: "clan_roster", title: `Your role in ${access.clan.name} changed`, body: `You are now a ${input.role} of ${access.clan.name}.`, href: clanHref(input.clanId) });
  return { success: true as const };
}

export async function removeClanMember(viewer: Viewer, input: { clanId: number; userId: number }) {
  const access = await clanAccess(input.clanId, viewer);
  requireClanManager(access);
  if (input.userId === access.clan.ownerId) badRequest("The clan owner cannot be removed.");
  if (!access.isOwner && !isAdmin(viewer)) {
    const target = await db().from("clan_members").select("role").eq("clan_id", input.clanId).eq("user_id", input.userId).maybeSingle();
    if (target.error) fail(target.error, "Membership lookup failed");
    if (target.data?.role === "manager") forbidden("Only the clan owner can remove a manager.");
  }
  const { data, error } = await db().from("clan_members").delete().eq("clan_id", input.clanId).eq("user_id", input.userId).select("user_id");
  if (error) fail(error, "Roster update failed");
  if (!data?.length) notFound("Clan member");
  await notify({ userId: input.userId, kind: "clan_roster", title: `Removed from ${access.clan.name}`, body: `You are no longer a member of ${access.clan.name}.`, href: "/dashboard" });
  return { success: true as const };
}

export async function removeClanTeam(viewer: Viewer, input: { clanId: number; teamId: number }) {
  const access = await clanAccess(input.clanId, viewer);
  requireClanManager(access);
  const { data, error } = await db().from("clan_teams").delete().eq("clan_id", input.clanId).eq("team_id", input.teamId).select("team_id");
  if (error) fail(error, "Roster update failed");
  if (!data?.length) notFound("Clan team");
  const team = (await teamsById([input.teamId])).get(input.teamId);
  if (team && team.ownerId !== viewer.id) {
    await notify({ userId: team.ownerId, kind: "clan_roster", title: `${team.name} removed from ${access.clan.name}`, body: `${viewer.name ?? "A clan manager"} removed ${team.name} from the clan roster.`, href: clanHref(input.clanId) });
  }
  return { success: true as const };
}
