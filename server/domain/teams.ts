import type { TeamRole } from "@shared/arena";
import { gameSlugFor } from "@shared/games";
import { badRequest, camel, camelRows, clean, db, fail, forbidden, hasDb, notFound } from "./_shared";
import {
  clanAccess, clanLinksForTeams, gameMatches, isAdmin, isoNow, memberCountsForTeams, requireTeamLead, requireTeamManager, resolveUser, safeFilter,
  teamAccess, teamsById, tournamentsById, uniqueIds, userLabel, usersById, winRate, type ClanSummary, type TeamRow, type Viewer,
} from "./lookups";
import { notify } from "./notifications";
import { fallbackAchievements, fallbackTeamRoster, fallbackTeams, fallbackTournaments } from "./seed";
import { createTeamForUser, getTeamsForUser } from "../db";

export type Socials = { twitter?: string; instagram?: string; youtube?: string; tiktok?: string; discord?: string };

const normalizeTag = (tag: string) => tag.trim().toUpperCase().slice(0, 8);
const normalizeRegion = (region: string | null | undefined) => (clean(region)?.toUpperCase() ?? null);
const teamHref = (teamId: number) => `/teams/${teamId}`;

/** Normalises a legacy (drizzle / in-memory) team row into the platform TeamRow shape. */
export function legacyTeamRow(team: Record<string, any>): TeamRow {
  return {
    id: Number(team.id), ownerId: Number(team.ownerId), captainId: Number(team.captainId ?? team.ownerId), name: String(team.name ?? ""), tag: String(team.tag ?? ""), game: String(team.game ?? ""),
    region: team.region ?? null, description: team.description ?? null, logoUrl: team.logoUrl ?? null, bannerUrl: team.bannerUrl ?? null, socials: team.socials ?? {}, lineupLockedAt: team.lineupLockedAt ?? null,
    wins: Number(team.wins ?? 0), losses: Number(team.losses ?? 0), createdAt: team.createdAt ? new Date(team.createdAt) : new Date(), updatedAt: team.updatedAt ? new Date(team.updatedAt) : new Date(),
  };
}

export function presentTeam(team: TeamRow, extras: { memberCount?: number; clan?: ClanSummary | null } = {}) {
  return {
    ...team,
    gameSlug: gameSlugFor(team.game),
    socials: team.socials ?? {},
    wins: team.wins ?? 0,
    losses: team.losses ?? 0,
    memberCount: extras.memberCount ?? 0,
    clan: extras.clan ?? null,
  };
}

async function decorateTeams(teams: TeamRow[]) {
  const ids = teams.map(team => team.id);
  const [counts, clans] = await Promise.all([memberCountsForTeams(ids), clanLinksForTeams(ids)]);
  return teams.map(team => presentTeam(team, { memberCount: counts.get(team.id) ?? 0, clan: clans.get(team.id) ?? null }));
}

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

export type MyTeamRole = "owner" | TeamRole;
export type MyTeam = Awaited<ReturnType<typeof listMyTeamsDb>>[number];

export async function listMyTeams(viewer: Viewer): Promise<MyTeam[]> {
  if (!hasDb()) {
    const legacy = await getTeamsForUser(viewer.id);
    return legacy.map(team => ({ ...presentTeam(legacyTeamRow(team), { memberCount: 1 }), myRole: "owner" as MyTeamRole }));
  }
  return listMyTeamsDb(viewer);
}

/** Database-backed variant used by the dashboard (callers guarantee hasDb()). */
export async function listMyTeamsDb(viewer: Viewer) {
  const memberships = await db().from("team_members").select("team_id, role").eq("user_id", viewer.id);
  if (memberships.error) fail(memberships.error, "Team membership lookup failed");
  const roleByTeam = new Map((memberships.data ?? []).map((row: any) => [Number(row.team_id), row.role as TeamRole]));
  const ids = uniqueIds(roleByTeam.keys());
  const filter = ids.length ? `owner_id.eq.${viewer.id},id.in.(${ids.join(",")})` : `owner_id.eq.${viewer.id}`;
  const { data, error } = await db().from("teams").select("*").or(filter).order("created_at", { ascending: false });
  if (error) fail(error, "Team lookup failed");
  const decorated = await decorateTeams(camelRows<TeamRow>(data));
  return decorated.map(team => ({
    ...team,
    myRole: (team.ownerId === viewer.id ? "owner" : team.captainId === viewer.id ? "captain" : (roleByTeam.get(team.id) ?? "player")) as MyTeamRole,
  }));
}

export async function listTeams(input: { game?: string; region?: string; search?: string; limit?: number }) {
  const limit = input.limit ?? 60;
  if (!hasDb()) {
    return fallbackTeams()
      .filter(team => gameMatches(team.game, input.game, gameSlugFor))
      .filter(team => !input.region || team.region?.toLowerCase() === input.region.toLowerCase())
      .filter(team => !input.search || `${team.name} ${team.tag}`.toLowerCase().includes(input.search.toLowerCase()))
      .slice(0, limit);
  }
  let query = db().from("teams").select("*").order("wins", { ascending: false }).order("created_at", { ascending: false }).limit(input.game ? Math.max(limit * 4, 200) : limit);
  if (input.region) query = query.ilike("region", safeFilter(input.region));
  if (input.search) {
    const term = safeFilter(input.search);
    if (term) query = query.or(`name.ilike.%${term}%,tag.ilike.%${term}%`);
  }
  const { data, error } = await query;
  if (error) fail(error, "Team directory failed");
  const rows = camelRows<TeamRow>(data).filter(team => gameMatches(team.game, input.game, gameSlugFor)).slice(0, limit);
  return decorateTeams(rows);
}

export async function getTeam(teamId: number, viewer: Viewer | null) {
  if (!hasDb()) return getTeamFallback(teamId, viewer);

  const access = await teamAccess(teamId, viewer);
  const { team } = access;
  const [members, clanLinks, matchesResult, registrationsResult, payoutsResult] = await Promise.all([
    db().from("team_members").select("user_id, role, joined_at").eq("team_id", teamId).order("joined_at", { ascending: true }),
    clanLinksForTeams([teamId]),
    db().from("matches").select("*").or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`).order("scheduled_at", { ascending: false, nullsFirst: false }).limit(8),
    db().from("tournament_registrations").select("*").eq("team_id", teamId).order("created_at", { ascending: false }).limit(20),
    db().from("prize_payouts").select("*").eq("team_id", teamId),
  ]);
  if (members.error) fail(members.error, "Roster lookup failed");
  if (matchesResult.error) fail(matchesResult.error, "Match lookup failed");
  if (registrationsResult.error) fail(registrationsResult.error, "Registration lookup failed");
  if (payoutsResult.error) fail(payoutsResult.error, "Payout lookup failed");

  const memberRows = members.data ?? [];
  const matches = camelRows(matchesResult.data);
  const registrations = camelRows(registrationsResult.data);
  const payouts = camelRows(payoutsResult.data);

  const [users, opponents, tournaments] = await Promise.all([
    usersById([team.ownerId, ...memberRows.map((row: any) => Number(row.user_id))]),
    teamsById(matches.flatMap(match => [match.homeTeamId, match.awayTeamId])),
    tournamentsById([...matches.map(match => match.tournamentId), ...registrations.map(reg => reg.tournamentId)]),
  ]);

  const roster = memberRows.map((row: any) => {
    const user = users.get(Number(row.user_id));
    return { userId: Number(row.user_id), name: userLabel(user), handle: user?.handle ?? null, avatarUrl: user?.avatarUrl ?? null, role: row.role as TeamRole, joinedAt: new Date(String(row.joined_at)) };
  });
  if (!roster.some(member => member.userId === team.ownerId)) {
    const owner = users.get(team.ownerId);
    roster.unshift({ userId: team.ownerId, name: userLabel(owner, "Owner"), handle: owner?.handle ?? null, avatarUrl: owner?.avatarUrl ?? null, role: "captain", joinedAt: team.createdAt });
  }

  const recentMatches = matches.map(match => {
    const isHome = match.homeTeamId === teamId;
    const opponentId = isHome ? match.awayTeamId : match.homeTeamId;
    const opponent = opponentId ? opponents.get(opponentId) : null;
    const result = match.status === "completed"
      ? (match.winnerTeamId === teamId ? "win" : match.winnerTeamId ? "loss" : (isHome ? match.homeScore > match.awayScore : match.awayScore > match.homeScore) ? "win" : "loss")
      : "pending";
    return {
      id: match.id, tournamentId: match.tournamentId, tournamentName: tournaments.get(match.tournamentId)?.name ?? null, status: match.status, scheduledAt: match.scheduledAt ?? null,
      completedAt: match.completedAt ?? null, streamUrl: match.streamUrl ?? null, isHome,
      opponent: opponent ? { id: opponent.id, name: opponent.name, tag: opponent.tag, logoUrl: opponent.logoUrl ?? null } : null,
      scoreFor: isHome ? match.homeScore : match.awayScore, scoreAgainst: isHome ? match.awayScore : match.homeScore, result,
    };
  });

  const tournamentHistory = registrations.map(reg => {
    const tournament = tournaments.get(reg.tournamentId);
    const payout = payouts.find(row => row.tournamentId === reg.tournamentId) ?? null;
    return {
      id: reg.id, status: reg.status, checkedInAt: reg.checkedInAt ?? null, seed: reg.seed ?? null, createdAt: reg.createdAt,
      tournament: tournament ? { id: tournament.id, name: tournament.name, game: tournament.game, gameSlug: gameSlugFor(tournament.game), status: tournament.status, startsAt: tournament.startsAt, format: tournament.format, prizePoolCents: tournament.prizePoolCents } : null,
      placement: payout?.placement ?? null, prizeCents: payout ? Number(payout.amountCents ?? 0) : 0,
    };
  }).filter(entry => entry.tournament);

  const wins = team.wins ?? 0;
  const losses = team.losses ?? 0;
  return {
    ...presentTeam(team, { memberCount: memberRows.length, clan: clanLinks.get(teamId) ?? null }),
    roster,
    stats: { wins, losses, winRate: winRate(wins, losses) },
    recentMatches,
    tournamentHistory,
    viewer: viewer ? { canManage: access.canManage, canLead: access.canLead, isMember: access.isMember, isOwner: access.isOwner, role: access.isOwner ? "owner" : access.memberRole } : null,
  };
}

function getTeamFallback(teamId: number, viewer: Viewer | null) {
  const team = fallbackTeams().find(entry => entry.id === teamId);
  if (!team) notFound("Team");
  const roster = fallbackTeamRoster(teamId);
  const history = fallbackTournaments().filter(t => t.registeredTeamIds.includes(teamId));
  const achievements = fallbackAchievements(team.clan?.id);
  return {
    ...team,
    roster,
    stats: { wins: team.wins, losses: team.losses, winRate: winRate(team.wins, team.losses) },
    recentMatches: [] as Array<Record<string, unknown>>,
    tournamentHistory: history.map((tournament, index) => {
      const achievement = achievements.find(entry => entry.title.startsWith(tournament.name)) ?? null;
      return {
        id: teamId * 100 + index + 1, status: tournament.status === "completed" ? "checked_in" : "confirmed", checkedInAt: null, seed: null, createdAt: tournament.registrationClosesAt,
        tournament: { id: tournament.id, name: tournament.name, game: tournament.game, gameSlug: tournament.gameSlug, status: tournament.status, startsAt: tournament.startsAt, format: tournament.format, prizePoolCents: tournament.prizePoolCents },
        placement: achievement?.placement ?? null, prizeCents: achievement?.prizeCents ?? 0,
      };
    }),
    viewer: viewer ? { canManage: isAdmin(viewer) || team.ownerId === viewer.id, canLead: isAdmin(viewer) || team.ownerId === viewer.id, isMember: roster.some(member => member.userId === viewer.id), isOwner: team.ownerId === viewer.id, role: team.ownerId === viewer.id ? "owner" : null } : null,
  };
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export async function createTeam(viewer: Viewer, input: { name: string; tag: string; game: string; region?: string; description?: string; logoUrl?: string; bannerUrl?: string; socials?: Socials }) {
  if (!hasDb()) return createTeamForUser({ ownerId: viewer.id, name: input.name, tag: input.tag, game: input.game, region: input.region, description: input.description });
  const row = {
    owner_id: viewer.id, captain_id: viewer.id, name: input.name.trim(), tag: normalizeTag(input.tag), game: input.game.trim(), region: normalizeRegion(input.region),
    description: clean(input.description), logo_url: clean(input.logoUrl), banner_url: clean(input.bannerUrl), socials: input.socials ?? {},
  };
  const { data, error } = await db().from("teams").insert(row).select().single();
  if (error) fail(error, "Team creation failed");
  const membership = await db().from("team_members").insert({ team_id: data.id, user_id: viewer.id, role: "captain" });
  if (membership.error) fail(membership.error, "Captain membership failed");
  return presentTeam(camel<TeamRow>(data), { memberCount: 1 });
}

export async function updateTeam(viewer: Viewer, input: { teamId: number; name?: string; tag?: string; region?: string; description?: string; logoUrl?: string; bannerUrl?: string; socials?: Socials }) {
  const access = await teamAccess(input.teamId, viewer);
  requireTeamManager(access);
  const patch: Record<string, unknown> = {};
  if (input.name !== undefined) patch.name = input.name.trim();
  if (input.tag !== undefined) patch.tag = normalizeTag(input.tag);
  if (input.region !== undefined) patch.region = normalizeRegion(input.region);
  if (input.description !== undefined) patch.description = clean(input.description);
  if (input.logoUrl !== undefined) patch.logo_url = clean(input.logoUrl);
  if (input.bannerUrl !== undefined) patch.banner_url = clean(input.bannerUrl);
  if (input.socials !== undefined) patch.socials = { ...(access.team.socials ?? {}), ...input.socials };
  if (!Object.keys(patch).length) badRequest("Nothing to update.");
  const { data, error } = await db().from("teams").update(patch).eq("id", input.teamId).select().single();
  if (error) fail(error, "Team update failed");
  return presentTeam(camel<TeamRow>(data));
}

export async function inviteToTeam(viewer: Viewer, input: { teamId: number; email?: string; handle?: string; userId?: number; role?: TeamRole; message?: string }) {
  const targets = [input.email, input.handle, input.userId].filter(value => value !== undefined && value !== null && value !== "");
  if (targets.length !== 1) badRequest("Provide exactly one of email, handle, or userId.");
  const access = await teamAccess(input.teamId, viewer);
  requireTeamManager(access);
  if (access.team.lineupLockedAt) badRequest("The lineup is locked. Unlock it before inviting players.");
  const role = input.role ?? "player";
  if (role === "captain" && !access.canLead) forbidden("Only the owner or captain can invite a captain.");

  const resolved = await resolveUser({ userId: input.userId, handle: input.handle, email: input.email });
  if ((input.userId || input.handle) && !resolved) notFound("Player");
  const email = resolved?.email ?? clean(input.email);
  if (resolved?.id === viewer.id) badRequest("You are already on this team.");

  if (resolved) {
    if (resolved.id === access.team.ownerId) badRequest("That player already owns this team.");
    const existing = await db().from("team_members").select("user_id").eq("team_id", input.teamId).eq("user_id", resolved.id).maybeSingle();
    if (existing.error) fail(existing.error, "Membership check failed");
    if (existing.data) badRequest("That player is already on the roster.");
  }

  let pending = db().from("team_invites").select("id").eq("team_id", input.teamId).eq("status", "pending");
  pending = resolved ? pending.eq("invited_user_id", resolved.id) : pending.ilike("invited_email", safeFilter(email ?? ""));
  const pendingResult = await pending.maybeSingle();
  if (pendingResult.error) fail(pendingResult.error, "Invite check failed");
  if (pendingResult.data) badRequest("An invite is already pending for that player.");

  const { data, error } = await db().from("team_invites").insert({
    team_id: input.teamId, invited_user_id: resolved?.id ?? null, invited_email: resolved ? null : email?.toLowerCase() ?? null,
    invited_by: viewer.id, role, message: clean(input.message),
  }).select().single();
  if (error) fail(error, "Invite creation failed");

  if (resolved) {
    await notify({ userId: resolved.id, kind: "team_invite", title: `Invite to join ${access.team.name}`, body: `${viewer.name ?? "A team manager"} invited you to join ${access.team.name} [${access.team.tag}] as ${role}.`, href: "/dashboard" });
  }
  return { ...camel(data), invitee: resolved ? { id: resolved.id, name: resolved.name, email: resolved.email } : { id: null, name: null, email } };
}

async function decorateInvites(rows: Record<string, any>[]) {
  const invites = camelRows(rows);
  const teamIds = invites.map(invite => invite.teamId);
  const [teams, clans, users] = await Promise.all([
    teamsById(teamIds), clanLinksForTeams(teamIds), usersById(invites.flatMap(invite => [invite.invitedBy, invite.invitedUserId])),
  ]);
  return invites.map(invite => {
    const team = teams.get(invite.teamId);
    const inviter = users.get(invite.invitedBy);
    const invitee = invite.invitedUserId ? users.get(invite.invitedUserId) : null;
    return {
      ...invite,
      team: team ? { id: team.id, name: team.name, tag: team.tag, game: team.game, gameSlug: gameSlugFor(team.game), logoUrl: team.logoUrl ?? null, region: team.region ?? null } : null,
      clan: clans.get(invite.teamId) ?? null,
      inviter: { id: invite.invitedBy, name: userLabel(inviter, "Team manager"), handle: inviter?.handle ?? null },
      invitee: invitee ? { id: invitee.id, name: userLabel(invitee), handle: invitee.handle, email: invitee.email } : { id: null, name: null, handle: null, email: invite.invitedEmail ?? null },
    };
  });
}

export async function listMyTeamInvites(viewer: Viewer) {
  if (!hasDb()) return [];
  const email = clean(viewer.email);
  const filter = email ? `invited_user_id.eq.${viewer.id},invited_email.ilike.${safeFilter(email)}` : `invited_user_id.eq.${viewer.id}`;
  const { data, error } = await db().from("team_invites").select("*").eq("status", "pending").or(filter).order("created_at", { ascending: false });
  if (error) fail(error, "Invite lookup failed");
  return decorateInvites(data ?? []);
}

export async function listTeamInvites(viewer: Viewer, teamId: number) {
  const access = await teamAccess(teamId, viewer);
  requireTeamManager(access);
  const { data, error } = await db().from("team_invites").select("*").eq("team_id", teamId).eq("status", "pending").order("created_at", { ascending: false });
  if (error) fail(error, "Invite lookup failed");
  return decorateInvites(data ?? []);
}

async function loadInvite(inviteId: number) {
  const { data, error } = await db().from("team_invites").select("*").eq("id", inviteId).maybeSingle();
  if (error) fail(error, "Invite lookup failed");
  if (!data) notFound("Invite");
  return camel(data);
}

export async function respondToTeamInvite(viewer: Viewer, input: { inviteId: number; accept: boolean }) {
  const invite = await loadInvite(input.inviteId);
  const email = clean(viewer.email)?.toLowerCase();
  const isTarget = invite.invitedUserId === viewer.id || (Boolean(email) && invite.invitedEmail?.toLowerCase() === email);
  if (!isTarget) forbidden("This invite was not sent to you.");
  if (invite.status !== "pending") badRequest("This invite has already been handled.");

  const team = (await teamsById([invite.teamId])).get(invite.teamId);
  if (!team) notFound("Team");
  if (input.accept) {
    if (team.lineupLockedAt) badRequest("The team lineup is currently locked. Ask the captain to unlock it first.");
    const membership = await db().from("team_members").upsert({ team_id: team.id, user_id: viewer.id, role: invite.role }, { onConflict: "team_id,user_id" });
    if (membership.error) fail(membership.error, "Joining the team failed");
  }
  const { data, error } = await db().from("team_invites").update({ status: input.accept ? "accepted" : "declined", responded_at: isoNow(), invited_user_id: invite.invitedUserId ?? viewer.id, invited_email: invite.invitedUserId ? invite.invitedEmail : null }).eq("id", invite.id).select().single();
  if (error) fail(error, "Invite update failed");

  await notify({ userId: invite.invitedBy, kind: "team", title: input.accept ? `${viewer.name ?? "A player"} joined ${team.name}` : `${viewer.name ?? "A player"} declined your invite`, body: input.accept ? `${viewer.name ?? "A player"} accepted the invite to ${team.name} as ${invite.role}.` : `The invite to ${team.name} was declined.`, href: teamHref(team.id) });
  return { ...camel(data), team: { id: team.id, name: team.name, tag: team.tag } };
}

export async function revokeTeamInvite(viewer: Viewer, inviteId: number) {
  const invite = await loadInvite(inviteId);
  const access = await teamAccess(invite.teamId, viewer);
  requireTeamManager(access);
  if (invite.status !== "pending") badRequest("Only pending invites can be revoked.");
  const { error } = await db().from("team_invites").update({ status: "revoked", responded_at: isoNow() }).eq("id", inviteId);
  if (error) fail(error, "Invite revoke failed");
  return { success: true as const };
}

export async function removeTeamMember(viewer: Viewer, input: { teamId: number; userId: number }) {
  const access = await teamAccess(input.teamId, viewer);
  requireTeamLead(access);
  if (input.userId === access.team.ownerId) badRequest("The team owner cannot be removed.");
  if (access.team.lineupLockedAt && !isAdmin(viewer)) badRequest("The lineup is locked. Unlock it before changing the roster.");
  const { data, error } = await db().from("team_members").delete().eq("team_id", input.teamId).eq("user_id", input.userId).select("user_id");
  if (error) fail(error, "Roster update failed");
  if (!data?.length) notFound("Team member");
  if (access.team.captainId === input.userId) {
    const reset = await db().from("teams").update({ captain_id: access.team.ownerId }).eq("id", input.teamId);
    if (reset.error) fail(reset.error, "Captain reset failed");
  }
  await notify({ userId: input.userId, kind: "team", title: `Removed from ${access.team.name}`, body: `You are no longer on the ${access.team.name} roster.`, href: "/dashboard" });
  return { success: true as const };
}

export async function transferCaptain(viewer: Viewer, input: { teamId: number; userId: number }) {
  const access = await teamAccess(input.teamId, viewer);
  requireTeamLead(access);
  const target = await db().from("team_members").select("user_id, role").eq("team_id", input.teamId).eq("user_id", input.userId).maybeSingle();
  if (target.error) fail(target.error, "Membership lookup failed");
  if (!target.data && input.userId !== access.team.ownerId) badRequest("The new captain must already be on the roster.");
  const previousCaptain = access.team.captainId;
  const update = await db().from("teams").update({ captain_id: input.userId }).eq("id", input.teamId);
  if (update.error) fail(update.error, "Captain transfer failed");
  if (previousCaptain && previousCaptain !== input.userId) {
    const demote = await db().from("team_members").update({ role: "player" }).eq("team_id", input.teamId).eq("user_id", previousCaptain).eq("role", "captain");
    if (demote.error) fail(demote.error, "Captain demotion failed");
  }
  const promote = await db().from("team_members").upsert({ team_id: input.teamId, user_id: input.userId, role: "captain" }, { onConflict: "team_id,user_id" });
  if (promote.error) fail(promote.error, "Captain promotion failed");
  await notify({ userId: input.userId, kind: "team", title: `You are now captain of ${access.team.name}`, body: `${viewer.name ?? "The team owner"} transferred the captaincy to you.`, href: teamHref(input.teamId) });
  return { success: true as const, captainId: input.userId };
}

async function setLineupLock(viewer: Viewer, teamId: number, locked: boolean) {
  const access = await teamAccess(teamId, viewer);
  requireTeamLead(access);
  const { data, error } = await db().from("teams").update({ lineup_locked_at: locked ? isoNow() : null }).eq("id", teamId).select().single();
  if (error) fail(error, "Lineup lock update failed");
  const members = await db().from("team_members").select("user_id").eq("team_id", teamId);
  const recipients = uniqueIds([...(members.data ?? []).map((row: any) => Number(row.user_id)), access.team.ownerId]).filter(id => id !== viewer.id);
  await notify(recipients.map(userId => ({
    userId, kind: "team" as const,
    title: locked ? `${access.team.name} lineup locked` : `${access.team.name} lineup unlocked`,
    body: locked ? "The roster is frozen for the upcoming bracket. Contact the captain for changes." : "Roster changes are open again.",
    href: teamHref(teamId),
  })));
  return presentTeam(camel<TeamRow>(data));
}

export const lockLineup = (viewer: Viewer, teamId: number) => setLineupLock(viewer, teamId, true);
export const unlockLineup = (viewer: Viewer, teamId: number) => setLineupLock(viewer, teamId, false);

export async function linkTeamToClan(viewer: Viewer, input: { teamId: number; clanId: number }) {
  const access = await teamAccess(input.teamId, viewer);
  requireTeamManager(access);
  const existingLink = await db().from("clan_teams").select("clan_id").eq("team_id", input.teamId).maybeSingle();
  if (existingLink.error) fail(existingLink.error, "Clan link lookup failed");
  if (existingLink.data) {
    if (Number(existingLink.data.clan_id) === input.clanId) badRequest("This team is already part of that clan.");
    badRequest("This team already belongs to a clan. Leave it before joining another.");
  }
  const clan = await clanAccess(input.clanId, viewer);
  if (clan.canManage) {
    const { error } = await db().from("clan_teams").insert({ clan_id: input.clanId, team_id: input.teamId });
    if (error) fail(error, "Clan link failed");
    return { linked: true as const, requested: false as const, clan: { id: clan.clan.id, name: clan.clan.name, tag: clan.clan.tag } };
  }
  const pending = await db().from("clan_invites").select("id").eq("clan_id", input.clanId).eq("team_id", input.teamId).eq("status", "pending").maybeSingle();
  if (pending.error) fail(pending.error, "Clan request lookup failed");
  if (pending.data) badRequest("A request to join this clan is already pending.");
  const { error } = await db().from("clan_invites").insert({ clan_id: input.clanId, team_id: input.teamId, invited_by: viewer.id, role: "member", message: `${access.team.name} requested to join ${clan.clan.name}.` });
  if (error) fail(error, "Clan request failed");
  await notify({ userId: clan.clan.ownerId, kind: "clan_invite", title: `${access.team.name} wants to join ${clan.clan.name}`, body: `${viewer.name ?? "A team manager"} requested to add ${access.team.name} [${access.team.tag}] to your clan.`, href: `/clans/${clan.clan.id}` });
  return { linked: false as const, requested: true as const, clan: { id: clan.clan.id, name: clan.clan.name, tag: clan.clan.tag } };
}

export async function unlinkTeamFromClan(viewer: Viewer, teamId: number) {
  const access = await teamAccess(teamId, viewer);
  const link = await db().from("clan_teams").select("clan_id").eq("team_id", teamId).maybeSingle();
  if (link.error) fail(link.error, "Clan link lookup failed");
  if (!link.data) badRequest("This team is not part of a clan.");
  const clanId = Number(link.data.clan_id);
  const clan = await clanAccess(clanId, viewer);
  if (!access.isOwner && !clan.canManage) forbidden("Only the team owner or the clan's managers can unlink this team.");
  const { error } = await db().from("clan_teams").delete().eq("team_id", teamId).eq("clan_id", clanId);
  if (error) fail(error, "Clan unlink failed");
  const recipients = uniqueIds([access.team.ownerId, clan.clan.ownerId]).filter(id => id !== viewer.id);
  await notify(recipients.map(userId => ({ userId, kind: "clan_roster" as const, title: `${access.team.name} left ${clan.clan.name}`, body: `${viewer.name ?? "A manager"} removed ${access.team.name} from the clan roster.`, href: `/clans/${clanId}` })));
  return { success: true as const };
}

