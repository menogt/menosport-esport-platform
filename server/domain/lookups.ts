/**
 * Batched lookups and authorization checks shared by the platform domains.
 * Every function expects a configured database (callers guard with hasDb()).
 */
import type { ClanRole, TeamRole } from "@shared/arena";
import { camel, camelRows, db, fail, forbidden, notFound } from "./_shared";

export type Viewer = { id: number; role: string; email?: string | null; name?: string | null };

export const isAdmin = (viewer: Viewer | null | undefined) => viewer?.role === "admin";

export const uniqueIds = (ids: Iterable<number | null | undefined>) => Array.from(new Set(Array.from(ids).filter((id): id is number => typeof id === "number" && id > 0)));

/** Strips characters that would break a PostgREST `or()` / `ilike` filter string. */
export const safeFilter = (value: string) => value.replace(/[,()%\\]/g, " ").trim();

export type UserSummary = {
  id: number; name: string | null; email: string | null; avatarUrl: string | null; handle: string | null;
  region: string | null; primaryGame: string | null; wins: number; losses: number; role: string;
};

export const userLabel = (user: UserSummary | null | undefined, fallback = "Player") => user?.name ?? user?.handle ?? fallback;

export async function usersById(ids: Iterable<number | null | undefined>): Promise<Map<number, UserSummary>> {
  const unique = uniqueIds(ids);
  const map = new Map<number, UserSummary>();
  if (!unique.length) return map;
  const [users, profiles] = await Promise.all([
    db().from("users").select("id, name, email, avatar_url, role").in("id", unique),
    db().from("player_profiles").select("user_id, handle, avatar_url, region, primary_game, wins, losses").in("user_id", unique),
  ]);
  if (users.error) fail(users.error, "User lookup failed");
  if (profiles.error) fail(profiles.error, "Profile lookup failed");
  const profileByUser = new Map((profiles.data ?? []).map((row: any) => [Number(row.user_id), row]));
  for (const row of users.data ?? []) {
    const profile: any = profileByUser.get(Number(row.id));
    map.set(Number(row.id), {
      id: Number(row.id), name: row.name ?? null, email: row.email ?? null, role: row.role ?? "user",
      avatarUrl: profile?.avatar_url ?? row.avatar_url ?? null, handle: profile?.handle ?? null,
      region: profile?.region ?? null, primaryGame: profile?.primary_game ?? null, wins: profile?.wins ?? 0, losses: profile?.losses ?? 0,
    });
  }
  return map;
}

export async function resolveUser(target: { userId?: number; handle?: string; email?: string }): Promise<{ id: number; name: string | null; email: string | null } | null> {
  if (target.userId) {
    const { data, error } = await db().from("users").select("id, name, email").eq("id", target.userId).maybeSingle();
    if (error) fail(error, "User lookup failed");
    return data ? { id: Number(data.id), name: data.name as string | null, email: data.email as string | null } : null;
  }
  if (target.handle) {
    const { data, error } = await db().from("player_profiles").select("user_id, handle").ilike("handle", safeFilter(target.handle)).limit(1).maybeSingle();
    if (error) fail(error, "Handle lookup failed");
    if (!data) return null;
    return resolveUser({ userId: Number(data.user_id) });
  }
  if (target.email) {
    const { data, error } = await db().from("users").select("id, name, email").ilike("email", safeFilter(target.email)).limit(1).maybeSingle();
    if (error) fail(error, "Email lookup failed");
    return data ? { id: Number(data.id), name: data.name as string | null, email: data.email as string | null } : null;
  }
  return null;
}

export type TeamRow = {
  id: number; ownerId: number; captainId: number | null; name: string; tag: string; game: string; region: string | null; description: string | null;
  logoUrl: string | null; bannerUrl: string | null; socials: Record<string, string>; lineupLockedAt: Date | null; wins: number; losses: number; createdAt: Date; updatedAt: Date;
};

export type ClanRow = {
  id: number; ownerId: number; name: string; tag: string; region: string | null; bio: string | null; foundedYear: number | null; socials: string | null;
  socialLinks: Record<string, string>; logoUrl: string | null; bannerUrl: string | null; verified: boolean; followerCount: number; prizeEarningsCents: number; trophies: number; createdAt: Date; updatedAt: Date;
};

export type ClanSummary = { id: number; name: string; tag: string; verified: boolean; logoUrl: string | null };

export const clanSummary = (clan: ClanRow | null | undefined): ClanSummary | null => clan ? { id: clan.id, name: clan.name, tag: clan.tag, verified: Boolean(clan.verified), logoUrl: clan.logoUrl ?? null } : null;

export async function teamsById(ids: Iterable<number | null | undefined>): Promise<Map<number, TeamRow>> {
  const unique = uniqueIds(ids);
  if (!unique.length) return new Map();
  const { data, error } = await db().from("teams").select("*").in("id", unique);
  if (error) fail(error, "Team lookup failed");
  return new Map(camelRows<TeamRow>(data).map(team => [team.id, team]));
}

export async function clansById(ids: Iterable<number | null | undefined>): Promise<Map<number, ClanRow>> {
  const unique = uniqueIds(ids);
  if (!unique.length) return new Map();
  const { data, error } = await db().from("clans").select("*").in("id", unique);
  if (error) fail(error, "Clan lookup failed");
  return new Map(camelRows<ClanRow>(data).map(clan => [clan.id, clan]));
}

export async function tournamentsById(ids: Iterable<number | null | undefined>): Promise<Map<number, Record<string, any>>> {
  const unique = uniqueIds(ids);
  if (!unique.length) return new Map();
  const { data, error } = await db().from("tournaments").select("*").in("id", unique);
  if (error) fail(error, "Tournament lookup failed");
  return new Map(camelRows(data).map(row => [Number(row.id), row]));
}

/** teamId -> clan summary for teams that belong to a clan. */
export async function clanLinksForTeams(teamIds: Iterable<number | null | undefined>): Promise<Map<number, ClanSummary>> {
  const unique = uniqueIds(teamIds);
  if (!unique.length) return new Map();
  const { data, error } = await db().from("clan_teams").select("clan_id, team_id").in("team_id", unique);
  if (error) fail(error, "Clan link lookup failed");
  const clans = await clansById((data ?? []).map((row: any) => Number(row.clan_id)));
  const map = new Map<number, ClanSummary>();
  for (const row of data ?? []) {
    const summary = clanSummary(clans.get(Number(row.clan_id)));
    if (summary) map.set(Number(row.team_id), summary);
  }
  return map;
}

export async function memberCountsForTeams(teamIds: Iterable<number | null | undefined>): Promise<Map<number, number>> {
  const unique = uniqueIds(teamIds);
  if (!unique.length) return new Map();
  const { data, error } = await db().from("team_members").select("team_id").in("team_id", unique);
  if (error) fail(error, "Team member count failed");
  const map = new Map<number, number>();
  for (const row of data ?? []) map.set(Number(row.team_id), (map.get(Number(row.team_id)) ?? 0) + 1);
  return map;
}

export async function teamIdsForClans(clanIds: Iterable<number | null | undefined>): Promise<Map<number, number[]>> {
  const unique = uniqueIds(clanIds);
  if (!unique.length) return new Map();
  const { data, error } = await db().from("clan_teams").select("clan_id, team_id").in("clan_id", unique);
  if (error) fail(error, "Clan roster lookup failed");
  const map = new Map<number, number[]>();
  for (const row of data ?? []) map.set(Number(row.clan_id), [...(map.get(Number(row.clan_id)) ?? []), Number(row.team_id)]);
  return map;
}

/** Team ids the viewer owns or belongs to. */
export async function myTeamIds(userId: number): Promise<number[]> {
  const [owned, memberships] = await Promise.all([
    db().from("teams").select("id").eq("owner_id", userId),
    db().from("team_members").select("team_id").eq("user_id", userId),
  ]);
  if (owned.error) fail(owned.error, "Team lookup failed");
  if (memberships.error) fail(memberships.error, "Team membership lookup failed");
  return uniqueIds([...(owned.data ?? []).map((row: any) => Number(row.id)), ...(memberships.data ?? []).map((row: any) => Number(row.team_id))]);
}

export type TeamAccess = {
  team: TeamRow; memberRole: TeamRole | null; isOwner: boolean; isCaptain: boolean; isMember: boolean;
  /** owner, captain, manager, or admin */ canManage: boolean;
  /** owner, captain, or admin */ canLead: boolean;
};

export async function teamAccess(teamId: number, viewer: Viewer | null | undefined): Promise<TeamAccess> {
  const { data, error } = await db().from("teams").select("*").eq("id", teamId).maybeSingle();
  if (error) fail(error, "Team lookup failed");
  if (!data) notFound("Team");
  const team = camel<TeamRow>(data);
  let memberRole: TeamRole | null = null;
  if (viewer) {
    const membership = await db().from("team_members").select("role").eq("team_id", teamId).eq("user_id", viewer.id).maybeSingle();
    if (membership.error) fail(membership.error, "Team membership lookup failed");
    memberRole = (membership.data?.role as TeamRole | undefined) ?? null;
  }
  const admin = isAdmin(viewer);
  const isOwner = Boolean(viewer && team.ownerId === viewer.id);
  const isCaptain = Boolean(viewer && (team.captainId === viewer.id || memberRole === "captain"));
  const isMember = isOwner || memberRole !== null;
  const canLead = admin || isOwner || isCaptain;
  return { team, memberRole, isOwner, isCaptain, isMember, canManage: canLead || memberRole === "manager", canLead };
}

export const requireTeamManager = (access: TeamAccess) => { if (!access.canManage) forbidden("Only the team owner, captain, or a manager can do that."); };
export const requireTeamLead = (access: TeamAccess) => { if (!access.canLead) forbidden("Only the team owner or captain can do that."); };

export type ClanAccess = { clan: ClanRow; memberRole: ClanRole | null; isOwner: boolean; isMember: boolean; canManage: boolean };

export async function clanAccess(clanId: number, viewer: Viewer | null | undefined): Promise<ClanAccess> {
  const { data, error } = await db().from("clans").select("*").eq("id", clanId).maybeSingle();
  if (error) fail(error, "Clan lookup failed");
  if (!data) notFound("Clan");
  const clan = camel<ClanRow>(data);
  let memberRole: ClanRole | null = null;
  if (viewer) {
    const membership = await db().from("clan_members").select("role").eq("clan_id", clanId).eq("user_id", viewer.id).maybeSingle();
    if (membership.error) fail(membership.error, "Clan membership lookup failed");
    memberRole = (membership.data?.role as ClanRole | undefined) ?? null;
  }
  const isOwner = Boolean(viewer && (clan.ownerId === viewer.id || memberRole === "owner"));
  const canManage = isAdmin(viewer) || isOwner || memberRole === "manager";
  return { clan, memberRole, isOwner, isMember: isOwner || memberRole !== null, canManage };
}

export const requireClanManager = (access: ClanAccess) => { if (!access.canManage) forbidden("Only the clan owner or a manager can do that."); };
export const requireClanOwner = (access: ClanAccess, viewer: Viewer) => { if (!access.isOwner && !isAdmin(viewer)) forbidden("Only the clan owner can do that."); };

/** Case-insensitive game match that tolerates slugs, short names, and full names. */
export function gameMatches(stored: string | null | undefined, wanted: string | null | undefined, slugOf: (value: string | null | undefined) => string | null) {
  if (!wanted) return true;
  if (!stored) return false;
  const wantedSlug = slugOf(wanted);
  const storedSlug = slugOf(stored);
  if (wantedSlug && storedSlug) return wantedSlug === storedSlug;
  return stored.trim().toLowerCase() === wanted.trim().toLowerCase();
}

export const winRate = (wins: number, losses: number) => (wins + losses ? Math.round((wins / (wins + losses)) * 100) : 0);

export const isoNow = () => new Date().toISOString();
