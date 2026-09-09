/**
 * Match domain: result reporting, confirmation, disputes, and the glue between
 * the pure bracket engine (./bracket.ts) and Supabase persistence.
 *
 * This module also hosts the low-level helpers shared by the tournament, game,
 * prize, and payment domains (team summaries, roster lookups, team-wide
 * notifications, tournament loading and authorization) so the domain modules
 * form a DAG: games -> tournaments -> matches.
 */
import type { BracketKind, MatchStatus, NotificationKind, TournamentFormat, TournamentStatus } from "@shared/arena";
import { ordinal } from "@shared/arena";
import { advanceMatch, computePlacements, planBracket, roundLabel, type AdvanceResult, type BracketMatchLike, type PlannedMatch } from "./bracket";
import { notify } from "./notifications";
import { computePrizeBreakdown, type PrizeBreakdown } from "./prizes";
import { badRequest, camel, camelRows, clean, db, fail, forbidden, notFound, snake } from "./_shared";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Actor = { id: number; role: string };

export type ClanSummary = { id: number; name: string; tag: string; verified: boolean };
export type TeamSummary = { id: number; name: string; tag: string; logoUrl: string | null; game: string; wins: number; losses: number; clan: ClanSummary | null };

export type TournamentRow = {
  id: number;
  name: string;
  game: string;
  format: TournamentFormat;
  status: TournamentStatus;
  startsAt: Date;
  registrationClosesAt: Date | null;
  checkinOpensAt: Date | null;
  prizePoolCents: number;
  entryFeeCents: number;
  maxTeams: number;
  rules: string | null;
  sponsorName: string | null;
  streamUrl: string | null;
  clanEligible: boolean;
  createdBy: number;
  description: string | null;
  bannerUrl: string | null;
  bestOf: 1 | 3 | 5 | 7;
  prizeSplit: number[];
  sponsorContributionCents: number;
  region: string | null;
  discordUrl: string | null;
  bracketPublishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type MatchRow = {
  id: number;
  tournamentId: number;
  bracket: BracketKind;
  round: number;
  position: number;
  homeTeamId: number | null;
  awayTeamId: number | null;
  homeScore: number;
  awayScore: number;
  status: MatchStatus;
  scheduledAt: Date | null;
  winnerTeamId: number | null;
  bestOf: number;
  streamUrl: string | null;
  nextMatchId: number | null;
  nextMatchSlot: "home" | "away" | null;
  loserNextMatchId: number | null;
  loserNextMatchSlot: "home" | "away" | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type MatchView = MatchRow & { roundLabel: string; homeTeam: TeamSummary | null; awayTeam: TeamSummary | null };

export type ReportRow = {
  id: number;
  matchId: number;
  submittedBy: number;
  teamId: number;
  opponentTeamId: number | null;
  scoreFor: number;
  scoreAgainst: number;
  screenshotUrl: string | null;
  notes: string | null;
  status: "submitted" | "waiting_confirmation" | "confirmed" | "disputed" | "admin_resolved";
  confirmedBy: number | null;
  confirmedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type DisputeRow = {
  id: number;
  matchId: number;
  openedBy: number;
  reason: string;
  status: "open" | "under_review" | "resolved";
  adminDecision: string | null;
  winnerTeamId: number | null;
  resolvedBy: number | null;
  resolvedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type DisputeView = DisputeRow & {
  match: { id: number; tournamentId: number; bracket: BracketKind; round: number; position: number; status: MatchStatus; homeScore: number; awayScore: number; homeTeam: TeamSummary | null; awayTeam: TeamSummary | null } | null;
  tournament: { id: number; name: string; game: string; format: TournamentFormat } | null;
};

export type FinalizeInput = { matchId: number; winnerTeamId: number; homeScore: number; awayScore: number; actorUserId: number; source: "confirmed" | "admin" };
export type FinalizeResult = {
  matchId: number;
  winnerTeamId: number;
  champion: number | null;
  resetRequired: boolean;
  tournamentCompleted: boolean;
  placements: Array<{ teamId: number; placement: number; amountCents: number }>;
};

export const isAdmin = (actor: Actor | null | undefined): boolean => actor?.role === "admin";
export const ELIMINATION_FORMATS: TournamentFormat[] = ["single_elimination", "double_elimination"];
const BRACKET_ORDER: Record<BracketKind, number> = { winners: 0, losers: 1, grand_final: 2, round_robin: 0, swiss: 0 };

// ---------------------------------------------------------------------------
// Pure engine glue (no I/O) — reused by persistence, the seed script, and the
// no-database fallback views.
// ---------------------------------------------------------------------------

export type ResolvedResult = {
  /** Merged per-match patches, in application order. */
  patches: Array<{ id: number; patch: Partial<BracketMatchLike> }>;
  champion: number | null;
  resetRequired: boolean;
  /** Full post-result state of every match. */
  matches: BracketMatchLike[];
};

/**
 * Apply a result through the engine and cascade any losers-bracket byes that
 * become resolvable (a match with a single team whose feeders have all
 * completed). Returns merged patches plus the resulting in-memory state.
 */
export function resolveResult(matches: BracketMatchLike[], matchId: number, winnerTeamId: number, homeScore: number, awayScore: number, format: TournamentFormat): ResolvedResult {
  const state = matches.map(match => ({ ...match }));
  const byId = new Map<number, BracketMatchLike>();
  for (const match of state) byId.set(match.id, match);
  const merged = new Map<number, Partial<BracketMatchLike>>();
  const order: number[] = [];
  let champion: number | null = null;
  let resetRequired = false;

  const apply = (result: AdvanceResult) => {
    for (const update of result.updates) {
      const target = byId.get(update.id);
      if (!target) continue;
      Object.assign(target, update.patch);
      if (!merged.has(update.id)) order.push(update.id);
      merged.set(update.id, { ...(merged.get(update.id) ?? {}), ...update.patch });
    }
    if (result.champion) champion = result.champion;
    if (result.resetRequired) resetRequired = true;
  };

  apply(advanceMatch(state, matchId, winnerTeamId, homeScore, awayScore, format));

  if (ELIMINATION_FORMATS.includes(format)) {
    let changed = true;
    while (changed) {
      changed = false;
      for (const match of state) {
        if (match.status !== "upcoming" || match.bracket === "grand_final") continue;
        const present = [match.homeTeamId, match.awayTeamId].filter((id): id is number => id !== null);
        if (present.length === 2) continue;
        const feeders = state.filter(other => other.nextMatchId === match.id || other.loserNextMatchId === match.id);
        if (!feeders.length || !feeders.every(feeder => feeder.status === "completed")) continue;
        if (present.length === 1) {
          apply(advanceMatch(state, match.id, present[0], 0, 0, format));
        } else {
          // Both feeders were byes: nobody drops in, so the slot simply closes with no winner.
          apply({ updates: [{ id: match.id, patch: { status: "completed", winnerTeamId: null } }], champion: null, resetRequired: false });
        }
        changed = true;
      }
    }
  }

  return { patches: order.map(id => ({ id, patch: merged.get(id) ?? {} })), champion, resetRequired, matches: state };
}

/**
 * Re-derive losers-bracket advancement links from the actual per-round match
 * counts: a round that feeds an equally sized round advances 1:1 into the home
 * slot; a round that feeds a half-sized round pairs adjacent winners.
 * (planDoubleElimination has the parity of these two cases swapped for
 * brackets larger than four teams, which strands one lower-bracket winner.)
 */
export function repairDoubleEliminationLinks(plan: PlannedMatch[]): PlannedMatch[] {
  const perRound = new Map<number, number>();
  for (const match of plan) if (match.bracket === "losers") perRound.set(match.round, (perRound.get(match.round) ?? 0) + 1);
  const lastRound = Math.max(0, ...Array.from(perRound.keys()));
  return plan.map(match => {
    if (match.bracket !== "losers" || match.round === lastRound) return match;
    const current = perRound.get(match.round) ?? 0;
    const next = perRound.get(match.round + 1) ?? 0;
    if (current === next) return { ...match, nextMatchKey: `L${match.round + 1}-${match.position}`, nextMatchSlot: "home" };
    return { ...match, nextMatchKey: `L${match.round + 1}-${Math.ceil(match.position / 2)}`, nextMatchSlot: match.position % 2 === 1 ? "home" : "away" };
  });
}

/** planBracket with the double-elimination link repair applied. Use this instead of planBracket for persistence. */
export function planTournamentBracket(format: TournamentFormat, teamIds: number[]): PlannedMatch[] {
  const plan = planBracket(format, teamIds);
  return format === "double_elimination" ? repairDoubleEliminationLinks(plan) : plan;
}

export function toBracketLike(row: MatchRow | BracketMatchLike): BracketMatchLike {
  return {
    id: row.id,
    bracket: row.bracket,
    round: row.round,
    position: row.position,
    homeTeamId: row.homeTeamId,
    awayTeamId: row.awayTeamId,
    homeScore: row.homeScore,
    awayScore: row.awayScore,
    status: row.status,
    winnerTeamId: row.winnerTeamId,
    nextMatchId: row.nextMatchId,
    nextMatchSlot: row.nextMatchSlot,
    loserNextMatchId: row.loserNextMatchId,
    loserNextMatchSlot: row.loserNextMatchSlot,
  };
}

export function compareMatches<T extends { bracket: BracketKind; round: number; position: number }>(a: T, b: T): number {
  return BRACKET_ORDER[a.bracket] - BRACKET_ORDER[b.bracket] || a.round - b.round || a.position - b.position;
}

/** Deterministic, plausible series score for demo data: winner takes ceil(bestOf/2), loser takes a stable 0..(n-1). */
export function plausibleScore(matchId: number, bestOf: number): { winnerScore: number; loserScore: number } {
  const winnerScore = Math.max(1, Math.ceil(bestOf / 2));
  return { winnerScore, loserScore: matchId % winnerScore };
}

/** Pick the winner for a simulated match: the higher seed, with a stable upset every third match. */
export function plausibleWinner(match: Pick<BracketMatchLike, "id" | "homeTeamId" | "awayTeamId">, seedOrder: number[]): number {
  const home = match.homeTeamId as number;
  const away = match.awayTeamId as number;
  const homeSeed = seedOrder.indexOf(home);
  const awaySeed = seedOrder.indexOf(away);
  const favourite = homeSeed === -1 ? away : awaySeed === -1 ? home : homeSeed <= awaySeed ? home : away;
  const underdog = favourite === home ? away : home;
  return match.id % 3 === 0 ? underdog : favourite;
}

/** The next match that can be played: upcoming, both teams present, optionally restricted to the first `throughRound` rounds of the main bracket. */
export function pickNextPlayable<T extends BracketMatchLike>(matches: T[], throughRound?: number): T | null {
  const ordered = [...matches].sort(compareMatches);
  for (const match of ordered) {
    if (match.status !== "upcoming" || match.homeTeamId === null || match.awayTeamId === null) continue;
    if (throughRound !== undefined && (match.bracket === "losers" || match.bracket === "grand_final" || match.round > throughRound)) continue;
    return match;
  }
  return null;
}

/** Materialize a bracket plan as in-memory matches with stable ids (idBase + index + 1) and resolved links. */
export function materializePlan(plan: PlannedMatch[], idBase: number): BracketMatchLike[] {
  const idByKey = new Map<string, number>();
  plan.forEach((match, index) => idByKey.set(match.key, idBase + index + 1));
  return plan.map(match => ({
    id: idByKey.get(match.key) as number,
    bracket: match.bracket,
    round: match.round,
    position: match.position,
    homeTeamId: match.homeTeamId,
    awayTeamId: match.awayTeamId,
    homeScore: 0,
    awayScore: 0,
    status: match.status,
    winnerTeamId: match.winnerTeamId,
    nextMatchId: match.nextMatchKey ? idByKey.get(match.nextMatchKey) ?? null : null,
    nextMatchSlot: match.nextMatchSlot,
    loserNextMatchId: match.loserNextMatchKey ? idByKey.get(match.loserNextMatchKey) ?? null : null,
    loserNextMatchSlot: match.loserNextMatchSlot,
  }));
}

/**
 * Simulate a bracket in memory: play every playable match (or only the first
 * `throughRound` rounds) with deterministic scores. Used by the no-database
 * fallback so brackets render mid-flight or completed.
 */
export function simulateBracket(plan: PlannedMatch[], format: TournamentFormat, options: { idBase: number; seedOrder: number[]; bestOf: number; throughRound?: number }): { matches: BracketMatchLike[]; champion: number | null } {
  let matches = materializePlan(plan, options.idBase);
  let champion: number | null = null;
  for (let guard = 0; guard < 4096; guard++) {
    const next = pickNextPlayable(matches, options.throughRound);
    if (!next) break;
    const winner = plausibleWinner(next, options.seedOrder);
    const { winnerScore, loserScore } = plausibleScore(next.id, options.bestOf);
    const homeScore = winner === next.homeTeamId ? winnerScore : loserScore;
    const awayScore = winner === next.awayTeamId ? winnerScore : loserScore;
    const result = resolveResult(matches, next.id, winner, homeScore, awayScore, format);
    matches = result.matches;
    if (result.champion) champion = result.champion;
  }
  return { matches, champion };
}

export function labelForMatch(format: TournamentFormat, match: Pick<BracketMatchLike, "bracket" | "round">, matches: Array<Pick<BracketMatchLike, "bracket" | "round">>): string {
  const totalRounds = matches.reduce((max, other) => (other.bracket === "winners" ? Math.max(max, other.round) : max), 0);
  return roundLabel(format, match.bracket, match.round, totalRounds || match.round);
}

export function placementLabel(placement: number): string {
  if (placement === 1) return "Champions";
  if (placement === 2) return "Runners-up";
  return `${ordinal(placement)} place`;
}

// ---------------------------------------------------------------------------
// Shared persistence helpers
// ---------------------------------------------------------------------------

export function normalizeTournament(row: Record<string, any>): TournamentRow {
  const tournament = camel<TournamentRow>(row);
  tournament.prizeSplit = Array.isArray(tournament.prizeSplit) ? tournament.prizeSplit.map(Number) : [60, 30, 10];
  tournament.bestOf = ([1, 3, 5, 7] as const).includes(tournament.bestOf) ? tournament.bestOf : 1;
  return tournament;
}

export async function loadTournament(tournamentId: number): Promise<TournamentRow> {
  const { data, error } = await db().from("tournaments").select("*").eq("id", tournamentId).maybeSingle();
  if (error) fail(error, "Tournament lookup failed");
  if (!data) notFound("Tournament");
  return normalizeTournament(data);
}

export async function findTournament(tournamentId: number): Promise<TournamentRow | null> {
  const { data, error } = await db().from("tournaments").select("*").eq("id", tournamentId).maybeSingle();
  if (error) fail(error, "Tournament lookup failed");
  return data ? normalizeTournament(data) : null;
}

export function canManageTournament(tournament: Pick<TournamentRow, "createdBy">, actor: Actor | null | undefined): boolean {
  return Boolean(actor) && (tournament.createdBy === actor?.id || isAdmin(actor));
}

export function assertCanManage(tournament: Pick<TournamentRow, "createdBy">, actor: Actor): void {
  if (!canManageTournament(tournament, actor)) forbidden("Only the tournament organizer or an admin can do that.");
}

export function hasBracketStarted(tournament: Pick<TournamentRow, "status" | "bracketPublishedAt">): boolean {
  return Boolean(tournament.bracketPublishedAt) || tournament.status === "live" || tournament.status === "completed";
}

export async function loadMatch(matchId: number): Promise<MatchRow> {
  const { data, error } = await db().from("matches").select("*").eq("id", matchId).maybeSingle();
  if (error) fail(error, "Match lookup failed");
  if (!data) notFound("Match");
  return camel<MatchRow>(data);
}

export async function listMatchRows(tournamentId: number): Promise<MatchRow[]> {
  const { data, error } = await db().from("matches").select("*").eq("tournament_id", tournamentId);
  if (error) fail(error, "Match lookup failed");
  return camelRows<MatchRow>(data).sort(compareMatches);
}

function mapTeamSummary(row: Record<string, any>): TeamSummary {
  const link = Array.isArray(row.clan_teams) ? row.clan_teams[0] : null;
  const clan = link?.clan ?? link?.clans ?? null;
  return {
    id: Number(row.id),
    name: String(row.name),
    tag: String(row.tag),
    logoUrl: row.logo_url ?? null,
    game: String(row.game ?? ""),
    wins: Number(row.wins ?? 0),
    losses: Number(row.losses ?? 0),
    clan: clan ? { id: Number(clan.id), name: String(clan.name), tag: String(clan.tag), verified: Boolean(clan.verified) } : null,
  };
}

export const TEAM_SUMMARY_SELECT = "id,name,tag,logo_url,game,wins,losses,clan_teams(clan:clans(id,name,tag,verified))";

/** Team display info (with clan) keyed by team id. Missing ids are simply absent. */
export async function fetchTeamSummaries(teamIds: Array<number | null | undefined>): Promise<Map<number, TeamSummary>> {
  const ids = Array.from(new Set(teamIds.filter((id): id is number => typeof id === "number" && id > 0)));
  const result = new Map<number, TeamSummary>();
  if (!ids.length) return result;
  const { data, error } = await db().from("teams").select(TEAM_SUMMARY_SELECT).in("id", ids);
  if (error) fail(error, "Team lookup failed");
  for (const row of data ?? []) result.set(Number(row.id), mapTeamSummary(row));
  return result;
}

export async function fetchTeamSummariesWhere(build: (query: any) => any): Promise<TeamSummary[]> {
  const { data, error } = await build(db().from("teams").select(TEAM_SUMMARY_SELECT));
  if (error) fail(error, "Team lookup failed");
  return (data ?? []).map(mapTeamSummary);
}

/** All user ids attached to each team: members plus owner and captain. */
export async function teamMemberIds(teamIds: number[]): Promise<Map<number, number[]>> {
  const ids = Array.from(new Set(teamIds.filter(id => id > 0)));
  const result = new Map<number, Set<number>>();
  if (!ids.length) return new Map();
  const [members, teams] = await Promise.all([
    db().from("team_members").select("team_id,user_id").in("team_id", ids),
    db().from("teams").select("id,owner_id,captain_id").in("id", ids),
  ]);
  if (members.error) fail(members.error, "Team roster lookup failed");
  if (teams.error) fail(teams.error, "Team lookup failed");
  const add = (teamId: number, userId: number | null) => {
    if (!userId) return;
    if (!result.has(teamId)) result.set(teamId, new Set());
    result.get(teamId)?.add(userId);
  };
  for (const row of members.data ?? []) add(Number(row.team_id), Number(row.user_id));
  for (const row of teams.data ?? []) { add(Number(row.id), row.owner_id ? Number(row.owner_id) : null); add(Number(row.id), row.captain_id ? Number(row.captain_id) : null); }
  const out = new Map<number, number[]>();
  result.forEach((users, teamId) => out.set(teamId, Array.from(users)));
  return out;
}

/** Notify every member of the given teams. Never throws. */
export async function notifyTeams(teamIds: number[], kind: NotificationKind, title: string, body: string, href?: string | null): Promise<void> {
  try {
    const rosters = await teamMemberIds(teamIds);
    const userIds = new Set<number>();
    rosters.forEach(users => users.forEach(id => userIds.add(id)));
    await notify(Array.from(userIds).map(userId => ({ userId, kind, title, body, href })));
  } catch (error) {
    console.warn("[Notifications] team notification failed:", error instanceof Error ? error.message : error);
  }
}

export async function adminUserIds(): Promise<number[]> {
  const { data, error } = await db().from("users").select("id").eq("role", "admin");
  if (error) fail(error, "Admin lookup failed");
  return (data ?? []).map(row => Number(row.id));
}

export type UserTeamRoles = { memberTeamIds: number[]; captainTeamIds: number[] };

/** Teams the user belongs to, and the subset they captain (owner, captain_id, or captain membership). */
export async function userTeamRoles(userId: number): Promise<UserTeamRoles> {
  const [members, owned] = await Promise.all([
    db().from("team_members").select("team_id,role").eq("user_id", userId),
    db().from("teams").select("id,owner_id,captain_id").or(`owner_id.eq.${userId},captain_id.eq.${userId}`),
  ]);
  if (members.error) fail(members.error, "Team membership lookup failed");
  if (owned.error) fail(owned.error, "Team lookup failed");
  const member = new Set<number>();
  const captain = new Set<number>();
  for (const row of members.data ?? []) { member.add(Number(row.team_id)); if (row.role === "captain") captain.add(Number(row.team_id)); }
  for (const row of owned.data ?? []) { member.add(Number(row.id)); captain.add(Number(row.id)); }
  return { memberTeamIds: Array.from(member), captainTeamIds: Array.from(captain) };
}

export async function assertTeamCaptain(teamId: number, actor: Actor, message = "Only the team owner or captain can do that."): Promise<void> {
  if (isAdmin(actor)) return;
  const roles = await userTeamRoles(actor.id);
  if (!roles.captainTeamIds.includes(teamId)) forbidden(message);
}

export async function assertTeamMember(teamId: number, actor: Actor, message = "You are not a member of that team."): Promise<void> {
  if (isAdmin(actor)) return;
  const roles = await userTeamRoles(actor.id);
  if (!roles.memberTeamIds.includes(teamId)) forbidden(message);
}

export async function countPaidRegistrations(tournamentId: number): Promise<number> {
  const { count, error } = await db().from("payments").select("id", { count: "exact", head: true }).eq("tournament_id", tournamentId).eq("kind", "entry_fee").eq("status", "succeeded");
  if (error) fail(error, "Payment count failed");
  return count ?? 0;
}

export function breakdownFor(tournament: Pick<TournamentRow, "prizePoolCents" | "entryFeeCents" | "sponsorContributionCents" | "prizeSplit">, paidRegistrations: number): PrizeBreakdown {
  return computePrizeBreakdown({ prizePoolCents: tournament.prizePoolCents, entryFeeCents: tournament.entryFeeCents, paidRegistrations, sponsorContributionCents: tournament.sponsorContributionCents, prizeSplit: tournament.prizeSplit });
}

export async function attachTeams(rows: MatchRow[], format: TournamentFormat): Promise<MatchView[]> {
  const teams = await fetchTeamSummaries(rows.flatMap(row => [row.homeTeamId, row.awayTeamId]));
  return rows.map(row => ({ ...row, roundLabel: labelForMatch(format, row, rows), homeTeam: row.homeTeamId ? teams.get(row.homeTeamId) ?? null : null, awayTeam: row.awayTeamId ? teams.get(row.awayTeamId) ?? null : null }));
}

// ---------------------------------------------------------------------------
// Result finalization
// ---------------------------------------------------------------------------

async function bumpTeamRecord(teamId: number | null, field: "wins" | "losses"): Promise<void> {
  if (!teamId) return;
  const { data, error } = await db().from("teams").select(field).eq("id", teamId).maybeSingle();
  if (error || !data) return;
  const current = Number((data as Record<string, unknown>)[field] ?? 0);
  await db().from("teams").update({ [field]: current + 1 }).eq("id", teamId);
}

/** Mark a tournament completed and materialize payouts, clan achievements, and payout notifications. */
export async function completeTournament(tournament: TournamentRow, matches: BracketMatchLike[]): Promise<FinalizeResult["placements"]> {
  const client = db();
  const { error: statusError } = await client.from("tournaments").update({ status: "completed" }).eq("id", tournament.id);
  if (statusError) fail(statusError, "Tournament completion failed");

  const teamIds = Array.from(new Set(matches.flatMap(match => [match.homeTeamId, match.awayTeamId]).filter((id): id is number => id !== null)));
  const placements = computePlacements(matches, tournament.format, teamIds);
  const breakdown = breakdownFor(tournament, await countPaidRegistrations(tournament.id));
  const placed: FinalizeResult["placements"] = [];

  for (let index = 0; index < placements.length; index++) {
    const share = breakdown.placements[index];
    if (!share) break;
    const entry = placements[index];
    const rank = index + 1; // payouts are unique per (tournament, placement); ties take consecutive ranks
    const { error } = await client.from("prize_payouts").upsert({ tournament_id: tournament.id, team_id: entry.teamId, placement: rank, share_percent: share.sharePercent, amount_cents: share.amountCents, status: "pending" }, { onConflict: "tournament_id,placement" });
    if (error) fail(error, "Prize payout upsert failed");
    placed.push({ teamId: entry.teamId, placement: rank, amountCents: share.amountCents });
  }

  if (placed.length) {
    const { data: links, error: linkError } = await client.from("clan_teams").select("clan_id,team_id").in("team_id", placed.map(row => row.teamId));
    if (linkError) fail(linkError, "Clan lookup failed");
    for (const link of links ?? []) {
      const entry = placed.find(row => row.teamId === Number(link.team_id));
      if (!entry) continue;
      const clanId = Number(link.clan_id);
      await client.from("clan_achievements").insert({ clan_id: clanId, tournament_id: tournament.id, team_id: entry.teamId, title: `${tournament.name} — ${placementLabel(entry.placement)}`, placement: entry.placement, prize_cents: entry.amountCents, achieved_at: new Date().toISOString() });
      const { data: clan } = await client.from("clans").select("trophies,prize_earnings_cents").eq("id", clanId).maybeSingle();
      if (clan) await client.from("clans").update({ trophies: Number(clan.trophies ?? 0) + (entry.placement === 1 ? 1 : 0), prize_earnings_cents: Number(clan.prize_earnings_cents ?? 0) + entry.amountCents }).eq("id", clanId);
    }
    for (const entry of placed) {
      await notifyTeams([entry.teamId], "payout", `${placementLabel(entry.placement)} — ${tournament.name}`, entry.amountCents > 0 ? `Your team placed ${ordinal(entry.placement)}. A prize payout is pending.` : `Your team placed ${ordinal(entry.placement)}.`, `/tournaments/${tournament.id}`);
    }
  }
  return placed;
}

/**
 * Record a confirmed (or admin-decided) result, advance the bracket, update
 * team records, and — when a champion emerges — complete the tournament with
 * payouts, clan achievements, and notifications.
 */
export async function finalizeMatchResult(input: FinalizeInput): Promise<FinalizeResult> {
  const client = db();
  const match = await loadMatch(input.matchId);
  if (match.status === "completed") badRequest("This match is already completed.");
  if (match.homeTeamId === null || match.awayTeamId === null) badRequest("Both teams must be assigned before a result can be recorded.");
  if (input.winnerTeamId !== match.homeTeamId && input.winnerTeamId !== match.awayTeamId) badRequest("The winner must be one of the teams in this match.");
  if (input.homeScore < 0 || input.awayScore < 0) badRequest("Scores cannot be negative.");

  const tournament = await loadTournament(match.tournamentId);
  const rows = await listMatchRows(match.tournamentId);
  const result = resolveResult(rows.map(toBracketLike), match.id, input.winnerTeamId, input.homeScore, input.awayScore, tournament.format);
  const now = new Date().toISOString();

  for (const { id, patch } of result.patches) {
    const row = snake(patch);
    if (patch.status === "completed") row.completed_at = now;
    const { error } = await client.from("matches").update(row).eq("id", id);
    if (error) fail(error, "Match update failed");
  }

  const loserTeamId = input.winnerTeamId === match.homeTeamId ? match.awayTeamId : match.homeTeamId;
  await bumpTeamRecord(input.winnerTeamId, "wins");
  await bumpTeamRecord(loserTeamId, "losses");

  const placements = result.champion ? await completeTournament(tournament, result.matches) : [];
  return { matchId: match.id, winnerTeamId: input.winnerTeamId, champion: result.champion, resetRequired: result.resetRequired, tournamentCompleted: Boolean(result.champion), placements };
}

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

export async function listTournamentMatches(tournamentId: number): Promise<MatchView[]> {
  const tournament = await findTournament(tournamentId);
  if (!tournament) return [];
  return attachTeams(await listMatchRows(tournamentId), tournament.format);
}

export type MatchDetail = MatchView & {
  tournament: { id: number; name: string; game: string; format: TournamentFormat; bestOf: number; streamUrl: string | null; status: TournamentStatus; createdBy: number };
  reports: ReportRow[];
  disputes: DisputeRow[];
  viewer: { myTeamId: number | null; canReport: boolean; canConfirm: boolean; canManage: boolean; pendingReport: ReportRow | null } | null;
};

export async function getMatchDetail(matchId: number, actor: Actor | null): Promise<MatchDetail> {
  const match = await loadMatch(matchId);
  const tournament = await loadTournament(match.tournamentId);
  const [rows, reportsResult, disputesResult] = await Promise.all([
    listMatchRows(match.tournamentId),
    db().from("match_reports").select("*").eq("match_id", matchId).order("created_at", { ascending: true }),
    db().from("disputes").select("*").eq("match_id", matchId).order("created_at", { ascending: false }),
  ]);
  if (reportsResult.error) fail(reportsResult.error, "Report lookup failed");
  if (disputesResult.error) fail(disputesResult.error, "Dispute lookup failed");
  const [view] = await attachTeams([match], tournament.format);
  const reports = camelRows<ReportRow>(reportsResult.data);
  const disputes = camelRows<DisputeRow>(disputesResult.data);

  let viewer: MatchDetail["viewer"] = null;
  if (actor) {
    const roles = await userTeamRoles(actor.id);
    const myTeamId = [match.homeTeamId, match.awayTeamId].find(id => id !== null && roles.memberTeamIds.includes(id)) ?? null;
    const opponentPending = reports.find(report => report.status === "waiting_confirmation" && report.teamId !== myTeamId) ?? null;
    const minePending = reports.some(report => report.status === "waiting_confirmation" && report.teamId === myTeamId);
    const reportable = match.status === "upcoming" || match.status === "live" || match.status === "waiting";
    viewer = {
      myTeamId,
      canReport: myTeamId !== null && reportable && !minePending,
      canConfirm: myTeamId !== null && reportable && Boolean(opponentPending),
      canManage: canManageTournament(tournament, actor),
      pendingReport: myTeamId !== null ? opponentPending : null,
    };
  }

  return {
    ...view,
    roundLabel: labelForMatch(tournament.format, match, rows),
    tournament: { id: tournament.id, name: tournament.name, game: tournament.game, format: tournament.format, bestOf: tournament.bestOf, streamUrl: tournament.streamUrl, status: tournament.status, createdBy: tournament.createdBy },
    reports,
    disputes,
    viewer,
  };
}

// ---------------------------------------------------------------------------
// Reporting & confirmation
// ---------------------------------------------------------------------------

export type ReportInput = { matchId: number; teamId: number; scoreFor: number; scoreAgainst: number; screenshotUrl?: string; notes?: string };

function scoresFor(match: MatchRow, teamId: number, scoreFor: number, scoreAgainst: number): { homeScore: number; awayScore: number } {
  return teamId === match.homeTeamId ? { homeScore: scoreFor, awayScore: scoreAgainst } : { homeScore: scoreAgainst, awayScore: scoreFor };
}

export async function submitReport(actor: Actor, input: ReportInput): Promise<ReportRow> {
  const client = db();
  const match = await loadMatch(input.matchId);
  if (match.status === "completed") badRequest("This match is already completed.");
  if (match.status === "disputed") badRequest("This match is under dispute. Wait for an admin ruling.");
  if (input.teamId !== match.homeTeamId && input.teamId !== match.awayTeamId) badRequest("That team is not playing in this match.");
  if (match.homeTeamId === null || match.awayTeamId === null) badRequest("The opponent has not been decided yet.");
  if (input.scoreFor === input.scoreAgainst) badRequest("A series cannot end in a tie. Report the deciding score.");
  await assertTeamMember(input.teamId, actor, "Only members of the reporting team can submit its result.");
  const opponentTeamId = input.teamId === match.homeTeamId ? match.awayTeamId : match.homeTeamId;
  const tournament = await loadTournament(match.tournamentId);

  const { data: existing, error: existingError } = await client.from("match_reports").select("*").eq("match_id", match.id).eq("status", "waiting_confirmation");
  if (existingError) fail(existingError, "Report lookup failed");
  const pending = camelRows<ReportRow>(existing);
  if (pending.some(report => report.teamId === input.teamId)) badRequest("Your team already submitted a result for this match. Wait for the opponent to confirm.");
  const opponentReport = pending.find(report => report.teamId === opponentTeamId) ?? null;

  const base = { match_id: match.id, submitted_by: actor.id, team_id: input.teamId, opponent_team_id: opponentTeamId, score_for: input.scoreFor, score_against: input.scoreAgainst, screenshot_url: clean(input.screenshotUrl), notes: clean(input.notes) };
  const href = `/matches/${match.id}`;

  if (opponentReport) {
    const consistent = Number(opponentReport.scoreFor) === input.scoreAgainst && Number(opponentReport.scoreAgainst) === input.scoreFor;
    if (consistent) {
      const now = new Date().toISOString();
      const { data, error } = await client.from("match_reports").insert({ ...base, status: "confirmed", confirmed_by: actor.id, confirmed_at: now }).select().single();
      if (error) fail(error, "Report submission failed");
      await client.from("match_reports").update({ status: "confirmed", confirmed_by: actor.id, confirmed_at: now }).eq("id", opponentReport.id);
      const scores = scoresFor(match, input.teamId, input.scoreFor, input.scoreAgainst);
      const winnerTeamId = scores.homeScore > scores.awayScore ? match.homeTeamId : match.awayTeamId;
      await finalizeMatchResult({ matchId: match.id, winnerTeamId, homeScore: scores.homeScore, awayScore: scores.awayScore, actorUserId: actor.id, source: "confirmed" });
      await notifyTeams([opponentTeamId, input.teamId], "result", `Result confirmed — ${tournament.name}`, `Both teams reported ${scores.homeScore}-${scores.awayScore}. The bracket has advanced.`, href);
      return camel<ReportRow>(data);
    }
    const { data, error } = await client.from("match_reports").insert({ ...base, status: "disputed" }).select().single();
    if (error) fail(error, "Report submission failed");
    await client.from("match_reports").update({ status: "disputed" }).eq("id", opponentReport.id);
    await client.from("matches").update({ status: "disputed" }).eq("id", match.id);
    const { data: openDisputes } = await client.from("disputes").select("id").eq("match_id", match.id).in("status", ["open", "under_review"]);
    if (!openDisputes?.length) {
      await client.from("disputes").insert({ match_id: match.id, opened_by: actor.id, reason: "Conflicting score reports", status: "open" });
      await notifyDisputeReviewers(tournament, match.id, "Conflicting score reports");
    }
    await notifyTeams([opponentTeamId], "result", `Conflicting result — ${tournament.name}`, `The opponent reported ${input.scoreFor}-${input.scoreAgainst}, which conflicts with your report. An admin will review the match.`, href);
    return camel<ReportRow>(data);
  }

  const { data, error } = await client.from("match_reports").insert({ ...base, status: "waiting_confirmation" }).select().single();
  if (error) fail(error, "Report submission failed");
  const { error: matchError } = await client.from("matches").update({ status: "waiting" }).eq("id", match.id);
  if (matchError) fail(matchError, "Match status update failed");
  await notifyTeams([opponentTeamId], "result", `Result reported — ${tournament.name}`, `The opponent reported ${input.scoreFor}-${input.scoreAgainst}. Confirm or dispute the result.`, href);
  return camel<ReportRow>(data);
}

export async function confirmReport(actor: Actor, matchId: number) {
  const client = db();
  const match = await loadMatch(matchId);
  if (match.status === "completed") badRequest("This match is already completed.");
  if (match.status === "disputed") badRequest("This match is under dispute. Wait for an admin ruling.");
  const { data, error } = await client.from("match_reports").select("*").eq("match_id", matchId).eq("status", "waiting_confirmation").order("created_at", { ascending: false });
  if (error) fail(error, "Report lookup failed");
  const pending = camelRows<ReportRow>(data);
  if (!pending.length) badRequest("There is no result waiting for confirmation.");
  const roles = await userTeamRoles(actor.id);
  const report = pending.find(item => item.opponentTeamId && roles.memberTeamIds.includes(Number(item.opponentTeamId))) ?? (isAdmin(actor) ? pending[0] : null);
  if (!report) forbidden("Only the opposing team can confirm this result.");
  const now = new Date().toISOString();
  await client.from("match_reports").update({ status: "confirmed", confirmed_by: actor.id, confirmed_at: now }).eq("id", report.id);
  const scores = scoresFor(match, Number(report.teamId), Number(report.scoreFor), Number(report.scoreAgainst));
  const winnerTeamId = scores.homeScore > scores.awayScore ? (match.homeTeamId as number) : (match.awayTeamId as number);
  const result = await finalizeMatchResult({ matchId, winnerTeamId, homeScore: scores.homeScore, awayScore: scores.awayScore, actorUserId: actor.id, source: "confirmed" });
  const tournament = await loadTournament(match.tournamentId);
  await notifyTeams([Number(report.teamId)], "result", `Result confirmed — ${tournament.name}`, `The opponent confirmed ${report.scoreFor}-${report.scoreAgainst}. The bracket has advanced.`, `/matches/${matchId}`);
  return result;
}

export async function setMatchLive(actor: Actor, matchId: number): Promise<MatchRow> {
  const match = await loadMatch(matchId);
  const tournament = await loadTournament(match.tournamentId);
  assertCanManage(tournament, actor);
  if (match.status === "completed") badRequest("This match is already completed.");
  if (match.homeTeamId === null || match.awayTeamId === null) badRequest("Both teams must be assigned before the match goes live.");
  const { data, error } = await db().from("matches").update({ status: "live" }).eq("id", matchId).select().single();
  if (error) fail(error, "Match update failed");
  await notifyTeams([match.homeTeamId, match.awayTeamId], "match_start", `Match live — ${tournament.name}`, `Your ${labelForMatch(tournament.format, match, await listMatchRows(match.tournamentId)).toLowerCase()} match is live now.`, `/matches/${matchId}`);
  return camel<MatchRow>(data);
}

export async function scheduleMatch(actor: Actor, input: { matchId: number; scheduledAt: Date; streamUrl?: string | null }): Promise<MatchRow> {
  const match = await loadMatch(input.matchId);
  const tournament = await loadTournament(match.tournamentId);
  assertCanManage(tournament, actor);
  if (match.status === "completed") badRequest("Completed matches cannot be rescheduled.");
  const patch: Record<string, unknown> = { scheduled_at: input.scheduledAt.toISOString() };
  if (input.streamUrl !== undefined) patch.stream_url = clean(input.streamUrl);
  const { data, error } = await db().from("matches").update(patch).eq("id", input.matchId).select().single();
  if (error) fail(error, "Match update failed");
  if (match.homeTeamId && match.awayTeamId) await notifyTeams([match.homeTeamId, match.awayTeamId], "match_start", `Match scheduled — ${tournament.name}`, `Your match is scheduled for ${input.scheduledAt.toUTCString()}.`, `/matches/${input.matchId}`);
  return camel<MatchRow>(data);
}

// ---------------------------------------------------------------------------
// Disputes
// ---------------------------------------------------------------------------

async function notifyDisputeReviewers(tournament: TournamentRow, matchId: number, reason: string): Promise<void> {
  try {
    const admins = await adminUserIds();
    const recipients = Array.from(new Set([tournament.createdBy, ...admins]));
    await notify(recipients.map(userId => ({ userId, kind: "dispute" as const, title: `Dispute opened — ${tournament.name}`, body: reason, href: `/admin/disputes` })));
  } catch (error) {
    console.warn("[Notifications] dispute notification failed:", error instanceof Error ? error.message : error);
  }
}

export async function openDispute(actor: Actor, input: { matchId: number; reason: string }): Promise<DisputeRow> {
  const client = db();
  const match = await loadMatch(input.matchId);
  if (match.status === "completed" && !isAdmin(actor)) badRequest("Completed matches can only be disputed through an admin.");
  const tournament = await loadTournament(match.tournamentId);
  if (!isAdmin(actor) && !canManageTournament(tournament, actor)) {
    const roles = await userTeamRoles(actor.id);
    const involved = [match.homeTeamId, match.awayTeamId].some(id => id !== null && roles.memberTeamIds.includes(id));
    if (!involved) forbidden("Only teams playing this match can open a dispute.");
  }
  const { data, error } = await client.from("disputes").insert({ match_id: match.id, opened_by: actor.id, reason: input.reason.trim(), status: "open" }).select().single();
  if (error) fail(error, "Dispute creation failed");
  if (match.status !== "completed") {
    const { error: matchError } = await client.from("matches").update({ status: "disputed" }).eq("id", match.id);
    if (matchError) fail(matchError, "Dispute match update failed");
  }
  await notifyDisputeReviewers(tournament, match.id, input.reason.trim());
  return camel<DisputeRow>(data);
}

async function decorateDisputes(rows: Record<string, any>[]): Promise<DisputeView[]> {
  const disputes = camelRows<DisputeRow>(rows);
  if (!disputes.length) return [];
  const matchIds = Array.from(new Set(disputes.map(dispute => Number(dispute.matchId))));
  const { data: matchRows, error } = await db().from("matches").select("*, tournament:tournaments(id,name,game,format)").in("id", matchIds);
  if (error) fail(error, "Match lookup failed");
  const matches = new Map<number, Record<string, any>>();
  for (const row of matchRows ?? []) matches.set(Number(row.id), camel(row));
  const teams = await fetchTeamSummaries(Array.from(matches.values()).flatMap(match => [match.homeTeamId, match.awayTeamId]));
  return disputes.map(dispute => {
    const match = matches.get(Number(dispute.matchId)) ?? null;
    return {
      ...dispute,
      match: match ? { id: match.id, tournamentId: match.tournamentId, bracket: match.bracket, round: match.round, position: match.position, status: match.status, homeScore: match.homeScore, awayScore: match.awayScore, homeTeam: match.homeTeamId ? teams.get(match.homeTeamId) ?? null : null, awayTeam: match.awayTeamId ? teams.get(match.awayTeamId) ?? null : null } : null,
      tournament: match?.tournament ?? null,
    };
  });
}

export async function listOpenDisputes() {
  const { data, error } = await db().from("disputes").select("*").in("status", ["open", "under_review"]).order("created_at", { ascending: false });
  if (error) fail(error, "Dispute lookup failed");
  return decorateDisputes(data ?? []);
}

export async function listMyDisputes(actor: Actor) {
  const roles = await userTeamRoles(actor.id);
  if (!roles.memberTeamIds.length) return [];
  const teamList = roles.memberTeamIds.join(",");
  const { data: matchRows, error: matchError } = await db().from("matches").select("id").or(`home_team_id.in.(${teamList}),away_team_id.in.(${teamList})`);
  if (matchError) fail(matchError, "Match lookup failed");
  const matchIds = (matchRows ?? []).map(row => Number(row.id));
  if (!matchIds.length) return [];
  const { data, error } = await db().from("disputes").select("*").in("match_id", matchIds).order("created_at", { ascending: false });
  if (error) fail(error, "Dispute lookup failed");
  return decorateDisputes(data ?? []);
}

export async function resolveDispute(actor: Actor, input: { disputeId: number; winnerTeamId: number; adminDecision: string }): Promise<DisputeRow> {
  const client = db();
  const { data: existing, error: lookupError } = await client.from("disputes").select("*").eq("id", input.disputeId).maybeSingle();
  if (lookupError) fail(lookupError, "Dispute lookup failed");
  if (!existing) notFound("Dispute");
  if (existing.status === "resolved") badRequest("This dispute has already been resolved.");
  const match = await loadMatch(Number(existing.match_id));
  if (input.winnerTeamId !== match.homeTeamId && input.winnerTeamId !== match.awayTeamId) badRequest("The winner must be one of the teams in this match.");

  const { data, error } = await client.from("disputes").update({ status: "resolved", winner_team_id: input.winnerTeamId, admin_decision: input.adminDecision.trim(), resolved_by: actor.id, resolved_at: new Date().toISOString() }).eq("id", input.disputeId).select().single();
  if (error) fail(error, "Dispute resolution failed");

  if (match.status !== "completed") {
    const { data: reports } = await client.from("match_reports").select("*").eq("match_id", match.id).eq("team_id", input.winnerTeamId).order("created_at", { ascending: false }).limit(1);
    const winnerReport = reports?.[0] ? camel(reports[0]) : null;
    const scores = winnerReport ? scoresFor(match, input.winnerTeamId, Number(winnerReport.scoreFor), Number(winnerReport.scoreAgainst)) : scoresFor(match, input.winnerTeamId, 1, 0);
    if ((input.winnerTeamId === match.homeTeamId && scores.homeScore <= scores.awayScore) || (input.winnerTeamId === match.awayTeamId && scores.awayScore <= scores.homeScore)) {
      // The winner's own report disagrees with the ruling; record a nominal score instead.
      Object.assign(scores, scoresFor(match, input.winnerTeamId, 1, 0));
    }
    await finalizeMatchResult({ matchId: match.id, winnerTeamId: input.winnerTeamId, homeScore: scores.homeScore, awayScore: scores.awayScore, actorUserId: actor.id, source: "admin" });
  }
  await client.from("match_reports").update({ status: "admin_resolved" }).eq("match_id", match.id).in("status", ["waiting_confirmation", "disputed", "submitted"]);

  const tournament = await loadTournament(match.tournamentId);
  const teams = [match.homeTeamId, match.awayTeamId].filter((id): id is number => id !== null);
  await notifyTeams(teams, "admin_decision", `Dispute resolved — ${tournament.name}`, input.adminDecision.trim(), `/matches/${match.id}`);
  return camel<DisputeRow>(data);
}
