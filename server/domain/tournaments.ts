/**
 * Tournament domain: discovery, lifecycle, registration and check-in, bracket
 * generation, standings, Swiss pairing, and announcements.
 *
 * Every public read has a no-database fallback backed by the demo dataset in
 * server/seed/data.ts so discovery pages never render empty.
 */
import type { RegistrationStatus, TournamentFormat, TournamentStatus } from "@shared/arena";
import { findGame, gameSlugFor, type GameSlug } from "@shared/games";
import { seedClans, seedTeams, seedTournaments, seedUsers, type SeedTournament } from "../seed/data";
import { computePlacements, computeStandings, pairSwissRound, roundCount, type BracketMatchLike, type StandingRow } from "./bracket";
import type { PrizeBreakdown } from "./prizes";
import {
  assertCanManage, assertTeamCaptain, attachTeams, breakdownFor, canManageTournament, completeTournament, countPaidRegistrations, fetchTeamSummaries, hasBracketStarted,
  isAdmin, labelForMatch, listMatchRows, loadTournament, normalizeTournament, notifyTeams, planTournamentBracket, simulateBracket, toBracketLike, userTeamRoles,
  type Actor, type MatchRow, type MatchView, type TeamSummary, type TournamentRow,
} from "./matches";
import { badRequest, camel, camelRows, clean, db, fail, notFound } from "./_shared";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Organizer = { id: number; name: string | null };

export type TournamentListItem = TournamentRow & {
  gameSlug: GameSlug | null;
  registeredCount: number;
  checkedInCount: number;
  organizer: Organizer | null;
  prizeBreakdown: PrizeBreakdown;
};

export type RegistrationView = {
  id: number;
  tournamentId: number;
  teamId: number;
  registeredBy: number;
  status: RegistrationStatus;
  seed: number | null;
  checkedInAt: Date | null;
  acceptedRulesAt: Date | null;
  paymentId: number | null;
  createdAt: Date;
  updatedAt: Date;
  team: TeamSummary | null;
};

export type AnnouncementView = { id: number; tournamentId: number; authorId: number; title: string; body: string; pinned: boolean; createdAt: Date; author: Organizer | null };

export type PayoutView = { id: number; tournamentId: number; teamId: number | null; placement: number; sharePercent: number; amountCents: number; status: "pending" | "processing" | "paid"; paidAt: Date | null; createdAt: Date; updatedAt: Date; team: TeamSummary | null };

export type TournamentDetail = TournamentListItem & {
  registrations: RegistrationView[];
  announcements: AnnouncementView[];
  prize: PrizeBreakdown;
  payouts: PayoutView[];
  matchSummary: { total: number; completed: number; live: number };
  viewer: { eligibleTeams: TeamSummary[]; registration: RegistrationView | null; canManage: boolean } | null;
};

export type StandingView = StandingRow & { rank: number; team: TeamSummary | null };
export type PlacementView = { teamId: number; placement: number; team: TeamSummary | null };
export type StandingsView = { tournamentId: number; format: TournamentFormat; status: TournamentStatus; standings: StandingView[]; placements: PlacementView[] };

export type ListFilters = { game?: string; status?: TournamentStatus; format?: TournamentFormat; search?: string; limit?: number };

export type CreateTournamentInput = {
  name: string;
  game: string;
  format: TournamentFormat;
  startsAt: Date;
  registrationClosesAt?: Date;
  prizePoolCents?: number;
  entryFeeCents?: number;
  maxTeams?: number;
  rules?: string;
  sponsorName?: string;
  streamUrl?: string;
  clanEligible?: boolean;
  description?: string;
  checkinOpensAt?: Date;
  bestOf?: 1 | 3 | 5 | 7;
  prizeSplit?: number[];
  sponsorContributionCents?: number;
  region?: string;
  discordUrl?: string;
  bannerUrl?: string;
  status?: "draft" | "registration";
};

export type UpdateTournamentInput = Partial<Omit<CreateTournamentInput, "status">>;

const STATUS_FLOW: Record<TournamentStatus, TournamentStatus[]> = {
  draft: ["registration", "cancelled"],
  registration: ["checkin", "cancelled"],
  checkin: ["live", "cancelled"],
  live: ["completed", "cancelled"],
  completed: ["cancelled"],
  cancelled: [],
};

const ACTIVE_REGISTRATION: RegistrationStatus[] = ["confirmed", "checked_in"];
const ROUND_GAP_MS = 75 * 60 * 1000;

function sortTournaments<T extends { status: TournamentStatus; startsAt: Date }>(rows: T[]): T[] {
  const rank = (row: T) => (row.status === "live" ? 0 : row.status === "completed" || row.status === "cancelled" ? 2 : 1);
  return [...rows].sort((a, b) => {
    const diff = rank(a) - rank(b);
    if (diff) return diff;
    return rank(a) === 2 ? b.startsAt.getTime() - a.startsAt.getTime() : a.startsAt.getTime() - b.startsAt.getTime();
  });
}

function matchesGame(value: string, filter: string | undefined): boolean {
  if (!filter) return true;
  const wanted = gameSlugFor(filter);
  const actual = gameSlugFor(value);
  if (wanted && actual) return wanted === actual;
  return value.trim().toLowerCase() === filter.trim().toLowerCase();
}

function sameGame(a: string, b: string): boolean {
  return matchesGame(a, b);
}

function scheduledFor(startsAt: Date, round: number): string {
  return new Date(startsAt.getTime() + (round - 1) * ROUND_GAP_MS).toISOString();
}

// ---------------------------------------------------------------------------
// Demo-data fallback (no database configured)
// ---------------------------------------------------------------------------

export const seedId = {
  user: (key: string) => seedUsers.findIndex(user => user.key === key) + 1,
  clan: (key: string | null) => (key ? seedClans.findIndex(clan => clan.key === key) + 1 : 0),
  team: (key: string) => seedTeams.findIndex(team => team.key === key) + 1,
  tournament: (key: string) => seedTournaments.findIndex(tournament => tournament.key === key) + 1,
};

export function seedTeamSummary(teamId: number): TeamSummary | null {
  const team = seedTeams[teamId - 1];
  if (!team) return null;
  const clan = team.clanKey ? seedClans[seedId.clan(team.clanKey) - 1] : null;
  return { id: teamId, name: team.name, tag: team.tag, logoUrl: null, game: team.game, wins: team.wins, losses: team.losses, clan: clan ? { id: seedId.clan(team.clanKey), name: clan.name, tag: clan.tag, verified: clan.verified } : null };
}

export function seedTournamentRow(seed: SeedTournament, index: number): TournamentRow {
  const startsAt = new Date(seed.startsAt);
  const started = seed.status === "live" || seed.status === "completed";
  return {
    id: index + 1,
    name: seed.name,
    game: seed.game,
    format: seed.format,
    status: seed.status,
    startsAt,
    registrationClosesAt: new Date(seed.registrationClosesAt),
    checkinOpensAt: new Date(seed.checkinOpensAt),
    prizePoolCents: seed.prizePoolCents,
    entryFeeCents: seed.entryFeeCents,
    maxTeams: seed.maxTeams,
    rules: seed.rules,
    sponsorName: seed.sponsorName,
    streamUrl: seed.streamUrl,
    clanEligible: seed.clanEligible,
    createdBy: seedId.user(seed.createdByKey),
    description: seed.description,
    bannerUrl: null,
    bestOf: seed.bestOf,
    prizeSplit: [60, 30, 10],
    sponsorContributionCents: seed.sponsorContributionCents,
    region: seed.region,
    discordUrl: null,
    bracketPublishedAt: started ? startsAt : null,
    createdAt: new Date(startsAt.getTime() - 20 * 24 * 60 * 60 * 1000),
    updatedAt: startsAt,
  };
}

function seedOrganizer(seed: SeedTournament): Organizer {
  const user = seedUsers[seedId.user(seed.createdByKey) - 1];
  return { id: seedId.user(seed.createdByKey), name: user?.name ?? null };
}

function seedTeamIds(seed: SeedTournament): number[] {
  return seed.registeredTeamKeys.map(key => seedId.team(key)).filter(id => id > 0);
}

const seedMatchCache = new Map<number, BracketMatchLike[]>();

/** In-memory bracket for a demo tournament: mid-flight when live, fully played when completed, empty otherwise. */
export function seedBracket(tournamentId: number): BracketMatchLike[] {
  const cached = seedMatchCache.get(tournamentId);
  if (cached) return cached;
  const seed = seedTournaments[tournamentId - 1];
  if (!seed || (seed.status !== "live" && seed.status !== "completed")) return [];
  const teamIds = seedTeamIds(seed);
  const plan = planTournamentBracket(seed.format, teamIds);
  const { matches } = simulateBracket(plan, seed.format, { idBase: tournamentId * 100, seedOrder: teamIds, bestOf: seed.bestOf, throughRound: seed.status === "live" ? 1 : undefined });
  seedMatchCache.set(tournamentId, matches);
  return matches;
}

export function seedMatchViews(tournamentId: number): MatchView[] {
  const seed = seedTournaments[tournamentId - 1];
  if (!seed) return [];
  const startsAt = new Date(seed.startsAt);
  const bracket = seedBracket(tournamentId);
  const rows: MatchRow[] = bracket.map(match => ({
    ...match,
    tournamentId,
    scheduledAt: new Date(scheduledFor(startsAt, match.round)),
    bestOf: seed.bestOf,
    streamUrl: seed.streamUrl,
    completedAt: match.status === "completed" ? new Date(startsAt.getTime() + match.round * ROUND_GAP_MS) : null,
    createdAt: startsAt,
    updatedAt: startsAt,
  }));
  return rows.map(row => ({ ...row, roundLabel: labelForMatch(seed.format, row, rows), homeTeam: row.homeTeamId ? seedTeamSummary(row.homeTeamId) : null, awayTeam: row.awayTeamId ? seedTeamSummary(row.awayTeamId) : null }));
}

export function seedTournamentListItem(index: number): TournamentListItem {
  const seed = seedTournaments[index];
  const row = seedTournamentRow(seed, index);
  const teamIds = seedTeamIds(seed);
  const started = seed.status === "live" || seed.status === "completed";
  return {
    ...row,
    gameSlug: gameSlugFor(seed.game),
    registeredCount: teamIds.length,
    checkedInCount: started ? teamIds.length : 0,
    organizer: seedOrganizer(seed),
    prizeBreakdown: breakdownFor(row, seed.entryFeeCents > 0 ? teamIds.length : 0),
  };
}

export function seedTournamentList(filters: ListFilters = {}): TournamentListItem[] {
  const rows = seedTournaments.map((_, index) => seedTournamentListItem(index)).filter(row => {
    if (row.status === "draft") return false;
    if (filters.status && row.status !== filters.status) return false;
    if (filters.format && row.format !== filters.format) return false;
    if (!matchesGame(row.game, filters.game)) return false;
    if (filters.search && !row.name.toLowerCase().includes(filters.search.toLowerCase())) return false;
    return true;
  });
  return sortTournaments(rows).slice(0, filters.limit ?? 50);
}

function seedRegistrations(tournamentId: number): RegistrationView[] {
  const seed = seedTournaments[tournamentId - 1];
  if (!seed) return [];
  const started = seed.status === "live" || seed.status === "completed";
  const startsAt = new Date(seed.startsAt);
  return seedTeamIds(seed).map((teamId, index) => ({
    id: tournamentId * 100 + index + 1,
    tournamentId,
    teamId,
    registeredBy: seedId.user(seedTeams[teamId - 1]?.ownerKey ?? ""),
    status: started ? "checked_in" : "confirmed",
    seed: index + 1,
    checkedInAt: started ? new Date(seed.checkinOpensAt) : null,
    acceptedRulesAt: new Date(seed.registrationClosesAt),
    paymentId: null,
    createdAt: new Date(startsAt.getTime() - 10 * 24 * 60 * 60 * 1000),
    updatedAt: startsAt,
    team: seedTeamSummary(teamId),
  }));
}

export function seedPayouts(tournamentId: number, item: TournamentListItem): PayoutView[] {
  const seed = seedTournaments[tournamentId - 1];
  if (!seed || seed.status !== "completed") return [];
  const bracket = seedBracket(tournamentId);
  const placements = computePlacements(bracket, seed.format, seedTeamIds(seed));
  return placements.slice(0, item.prizeBreakdown.placements.length).map((entry, index) => {
    const share = item.prizeBreakdown.placements[index];
    return { id: tournamentId * 10 + index + 1, tournamentId, teamId: entry.teamId, placement: index + 1, sharePercent: share.sharePercent, amountCents: share.amountCents, status: "paid" as const, paidAt: new Date(seed.startsAt), createdAt: new Date(seed.startsAt), updatedAt: new Date(seed.startsAt), team: seedTeamSummary(entry.teamId) };
  });
}

export function seedTournamentDetail(tournamentId: number, actor: Actor | null): TournamentDetail | null {
  const index = tournamentId - 1;
  if (!seedTournaments[index]) return null;
  const item = seedTournamentListItem(index);
  const bracket = seedBracket(tournamentId);
  return {
    ...item,
    registrations: seedRegistrations(tournamentId),
    announcements: [],
    prize: item.prizeBreakdown,
    payouts: seedPayouts(tournamentId, item),
    matchSummary: { total: bracket.length, completed: bracket.filter(match => match.status === "completed").length, live: bracket.filter(match => match.status === "live").length },
    viewer: actor ? { eligibleTeams: [], registration: null, canManage: isAdmin(actor) } : null,
  };
}

export function seedStandings(tournamentId: number): StandingsView | null {
  const seed = seedTournaments[tournamentId - 1];
  if (!seed) return null;
  const bracket = seedBracket(tournamentId);
  const teamIds = seedTeamIds(seed);
  return buildStandings({ id: tournamentId, format: seed.format, status: seed.status }, bracket, teamIds, id => seedTeamSummary(id));
}

function buildStandings(tournament: { id: number; format: TournamentFormat; status: TournamentStatus }, bracket: BracketMatchLike[], teamIds: number[], lookup: (teamId: number) => TeamSummary | null): StandingsView {
  const isTable = tournament.format === "round_robin" || tournament.format === "swiss";
  const standings = isTable ? computeStandings(bracket, teamIds).map((row, index) => ({ ...row, rank: index + 1, team: lookup(row.teamId) })) : [];
  const placements = tournament.status === "completed" ? computePlacements(bracket, tournament.format, teamIds).map(entry => ({ ...entry, team: lookup(entry.teamId) })) : [];
  return { tournamentId: tournament.id, format: tournament.format, status: tournament.status, standings, placements };
}

// ---------------------------------------------------------------------------
// Reads (database)
// ---------------------------------------------------------------------------

type CountMaps = { registered: Map<number, number>; checkedIn: Map<number, number>; paid: Map<number, number> };

async function countsFor(tournamentIds: number[]): Promise<CountMaps> {
  const registered = new Map<number, number>();
  const checkedIn = new Map<number, number>();
  const paid = new Map<number, number>();
  if (!tournamentIds.length) return { registered, checkedIn, paid };
  const [registrations, payments] = await Promise.all([
    db().from("tournament_registrations").select("tournament_id,status").in("tournament_id", tournamentIds).in("status", ACTIVE_REGISTRATION),
    db().from("payments").select("tournament_id").in("tournament_id", tournamentIds).eq("kind", "entry_fee").eq("status", "succeeded"),
  ]);
  if (registrations.error) fail(registrations.error, "Registration count failed");
  if (payments.error) fail(payments.error, "Payment count failed");
  for (const row of registrations.data ?? []) {
    const id = Number(row.tournament_id);
    registered.set(id, (registered.get(id) ?? 0) + 1);
    if (row.status === "checked_in") checkedIn.set(id, (checkedIn.get(id) ?? 0) + 1);
  }
  for (const row of payments.data ?? []) {
    const id = Number(row.tournament_id);
    paid.set(id, (paid.get(id) ?? 0) + 1);
  }
  return { registered, checkedIn, paid };
}

function toListItem(row: Record<string, any>, counts: CountMaps): TournamentListItem {
  const tournament = normalizeTournament(row);
  const organizer = row.organizer ? { id: Number(row.organizer.id), name: row.organizer.name ?? null } : null;
  const base = { ...tournament } as TournamentRow & { organizer?: unknown };
  delete base.organizer;
  return {
    ...base,
    gameSlug: gameSlugFor(tournament.game),
    registeredCount: counts.registered.get(tournament.id) ?? 0,
    checkedInCount: counts.checkedIn.get(tournament.id) ?? 0,
    organizer,
    prizeBreakdown: breakdownFor(tournament, counts.paid.get(tournament.id) ?? 0),
  };
}

const TOURNAMENT_SELECT = "*, organizer:users(id,name)";

export async function listTournaments(filters: ListFilters = {}): Promise<TournamentListItem[]> {
  let query = db().from("tournaments").select(TOURNAMENT_SELECT).neq("status", "draft");
  if (filters.status) query = query.eq("status", filters.status);
  if (filters.format) query = query.eq("format", filters.format);
  if (filters.search) query = query.ilike("name", `%${filters.search.replace(/[%_]/g, "")}%`);
  const { data, error } = await query.limit(400);
  if (error) fail(error, "Tournament lookup failed");
  const rows = (data ?? []).filter(row => matchesGame(String(row.game), filters.game));
  const counts = await countsFor(rows.map(row => Number(row.id)));
  return sortTournaments(rows.map(row => toListItem(row, counts))).slice(0, filters.limit ?? 50);
}

export async function featuredTournaments(): Promise<TournamentListItem[]> {
  const { data, error } = await db().from("tournaments").select(TOURNAMENT_SELECT).in("status", ["live", "checkin", "registration"]).limit(60);
  if (error) fail(error, "Tournament lookup failed");
  const counts = await countsFor((data ?? []).map(row => Number(row.id)));
  return sortTournaments((data ?? []).map(row => toListItem(row, counts))).slice(0, 6);
}

async function listRegistrations(tournamentId: number): Promise<RegistrationView[]> {
  const { data, error } = await db().from("tournament_registrations").select("*").eq("tournament_id", tournamentId).order("seed", { ascending: true, nullsFirst: false }).order("created_at", { ascending: true });
  if (error) fail(error, "Registration lookup failed");
  const rows = camelRows<Omit<RegistrationView, "team">>(data);
  const teams = await fetchTeamSummaries(rows.map(row => row.teamId));
  return rows.map(row => ({ ...row, team: teams.get(row.teamId) ?? null }));
}

export async function listPayouts(tournamentId: number): Promise<PayoutView[]> {
  const { data, error } = await db().from("prize_payouts").select("*").eq("tournament_id", tournamentId).order("placement", { ascending: true });
  if (error) fail(error, "Payout lookup failed");
  const rows = camelRows<Omit<PayoutView, "team">>(data).map(row => ({ ...row, sharePercent: Number(row.sharePercent), amountCents: Number(row.amountCents) }));
  const teams = await fetchTeamSummaries(rows.map(row => row.teamId));
  return rows.map(row => ({ ...row, team: row.teamId ? teams.get(row.teamId) ?? null : null }));
}

export async function listAnnouncements(tournamentId: number): Promise<AnnouncementView[]> {
  const { data, error } = await db().from("announcements").select("*, author:users(id,name)").eq("tournament_id", tournamentId).order("pinned", { ascending: false }).order("created_at", { ascending: false });
  if (error) fail(error, "Announcement lookup failed");
  return camelRows<AnnouncementView>(data).map(row => ({ ...row, author: row.author ? { id: Number(row.author.id), name: row.author.name ?? null } : null }));
}

export async function getTournamentDetail(tournamentId: number, actor: Actor | null): Promise<TournamentDetail | null> {
  const { data, error } = await db().from("tournaments").select(TOURNAMENT_SELECT).eq("id", tournamentId).maybeSingle();
  if (error) fail(error, "Tournament lookup failed");
  if (!data) return null;
  const tournament = normalizeTournament(data);
  if (tournament.status === "draft" && !canManageTournament(tournament, actor)) return null;

  const [counts, registrations, announcements, payouts, matchRows] = await Promise.all([
    countsFor([tournamentId]),
    listRegistrations(tournamentId),
    listAnnouncements(tournamentId),
    listPayouts(tournamentId),
    listMatchRows(tournamentId),
  ]);
  const item = toListItem(data, counts);

  let viewer: TournamentDetail["viewer"] = null;
  if (actor) {
    const roles = await userTeamRoles(actor.id);
    const captainTeams = roles.captainTeamIds.length ? await fetchTeamSummaries(roles.captainTeamIds) : new Map<number, TeamSummary>();
    const eligibleTeams = Array.from(captainTeams.values()).filter(team => sameGame(team.game, tournament.game));
    const registration = registrations.find(row => roles.memberTeamIds.includes(row.teamId) && row.status !== "withdrawn") ?? registrations.find(row => roles.memberTeamIds.includes(row.teamId)) ?? null;
    viewer = { eligibleTeams, registration, canManage: canManageTournament(tournament, actor) };
  }

  return {
    ...item,
    registrations,
    announcements,
    prize: item.prizeBreakdown,
    payouts,
    matchSummary: { total: matchRows.length, completed: matchRows.filter(row => row.status === "completed").length, live: matchRows.filter(row => row.status === "live").length },
    viewer,
  };
}

export async function myTournaments(actor: Actor): Promise<{ organized: TournamentListItem[]; entered: Array<TournamentListItem & { registration: RegistrationView }> }> {
  const roles = await userTeamRoles(actor.id);
  const [organizedResult, registrationResult] = await Promise.all([
    db().from("tournaments").select(TOURNAMENT_SELECT).eq("created_by", actor.id),
    roles.memberTeamIds.length ? db().from("tournament_registrations").select("*").in("team_id", roles.memberTeamIds).neq("status", "withdrawn") : Promise.resolve({ data: [] as any[], error: null }),
  ]);
  if (organizedResult.error) fail(organizedResult.error, "Tournament lookup failed");
  if (registrationResult.error) fail(registrationResult.error, "Registration lookup failed");
  const registrations = camelRows<Omit<RegistrationView, "team">>(registrationResult.data);
  const enteredIds = Array.from(new Set(registrations.map(row => row.tournamentId)));
  const enteredResult = enteredIds.length ? await db().from("tournaments").select(TOURNAMENT_SELECT).in("id", enteredIds) : { data: [] as any[], error: null };
  if (enteredResult.error) fail(enteredResult.error, "Tournament lookup failed");

  const allRows = [...(organizedResult.data ?? []), ...(enteredResult.data ?? [])];
  const counts = await countsFor(Array.from(new Set(allRows.map(row => Number(row.id)))));
  const teams = await fetchTeamSummaries(registrations.map(row => row.teamId));
  const organized = sortTournaments((organizedResult.data ?? []).map(row => toListItem(row, counts)));
  const entered = sortTournaments((enteredResult.data ?? []).map(row => {
    const item = toListItem(row, counts);
    const registration = registrations.find(reg => reg.tournamentId === item.id) as Omit<RegistrationView, "team">;
    return { ...item, registration: { ...registration, team: teams.get(registration.teamId) ?? null } };
  }));
  return { organized, entered };
}

export async function getStandings(tournamentId: number): Promise<StandingsView> {
  const tournament = await loadTournament(tournamentId);
  const [rows, registrations] = await Promise.all([listMatchRows(tournamentId), listRegistrations(tournamentId)]);
  const bracket = rows.map(toBracketLike);
  const teamIds = Array.from(new Set([
    ...bracket.flatMap(match => [match.homeTeamId, match.awayTeamId]).filter((id): id is number => id !== null),
    ...registrations.filter(row => ACTIVE_REGISTRATION.includes(row.status)).map(row => row.teamId),
  ]));
  const teams = await fetchTeamSummaries(teamIds);
  return buildStandings(tournament, bracket, teamIds, id => teams.get(id) ?? null);
}

// ---------------------------------------------------------------------------
// Writes
// ---------------------------------------------------------------------------

function tournamentValues(input: CreateTournamentInput | UpdateTournamentInput): Record<string, unknown> {
  const values: Record<string, unknown> = {};
  if (input.name !== undefined) values.name = input.name.trim();
  if (input.game !== undefined) values.game = findGame(input.game)?.name ?? input.game.trim();
  if (input.format !== undefined) values.format = input.format;
  if (input.startsAt !== undefined) values.starts_at = input.startsAt.toISOString();
  if (input.registrationClosesAt !== undefined) values.registration_closes_at = input.registrationClosesAt?.toISOString() ?? null;
  if (input.checkinOpensAt !== undefined) values.checkin_opens_at = input.checkinOpensAt?.toISOString() ?? null;
  if (input.prizePoolCents !== undefined) values.prize_pool_cents = input.prizePoolCents;
  if (input.entryFeeCents !== undefined) values.entry_fee_cents = input.entryFeeCents;
  if (input.maxTeams !== undefined) values.max_teams = input.maxTeams;
  if (input.rules !== undefined) values.rules = clean(input.rules);
  if (input.sponsorName !== undefined) values.sponsor_name = clean(input.sponsorName);
  if (input.streamUrl !== undefined) values.stream_url = clean(input.streamUrl);
  if (input.clanEligible !== undefined) values.clan_eligible = Boolean(input.clanEligible);
  if (input.description !== undefined) values.description = clean(input.description);
  if (input.bestOf !== undefined) values.best_of = input.bestOf;
  if (input.prizeSplit !== undefined) values.prize_split = input.prizeSplit;
  if (input.sponsorContributionCents !== undefined) values.sponsor_contribution_cents = input.sponsorContributionCents;
  if (input.region !== undefined) values.region = clean(input.region);
  if (input.discordUrl !== undefined) values.discord_url = clean(input.discordUrl);
  if (input.bannerUrl !== undefined) values.banner_url = clean(input.bannerUrl);
  return values;
}

export async function createTournament(actor: Actor, input: CreateTournamentInput): Promise<TournamentRow> {
  if (input.prizeSplit && input.prizeSplit.reduce((sum, value) => sum + value, 0) > 100.0001) badRequest("Prize split percentages cannot exceed 100%.");
  if (input.registrationClosesAt && input.registrationClosesAt > input.startsAt) badRequest("Registration must close before the tournament starts.");
  const values = { ...tournamentValues(input), created_by: actor.id, status: input.status ?? "registration" };
  const { data, error } = await db().from("tournaments").insert(values).select().single();
  if (error) fail(error, "Tournament creation failed");
  return normalizeTournament(data);
}

export async function updateTournament(actor: Actor, tournamentId: number, input: UpdateTournamentInput): Promise<TournamentRow> {
  const tournament = await loadTournament(tournamentId);
  assertCanManage(tournament, actor);
  if (tournament.status === "completed" || tournament.status === "cancelled") badRequest("Finished tournaments cannot be edited.");
  if (input.prizeSplit && input.prizeSplit.reduce((sum, value) => sum + value, 0) > 100.0001) badRequest("Prize split percentages cannot exceed 100%.");
  if (hasBracketStarted(tournament) && (input.format !== undefined || input.maxTeams !== undefined)) badRequest("Format and capacity are locked once the bracket is published.");
  const values = tournamentValues(input);
  if (!Object.keys(values).length) return tournament;
  const { data, error } = await db().from("tournaments").update(values).eq("id", tournamentId).select().single();
  if (error) fail(error, "Tournament update failed");
  return normalizeTournament(data);
}

export async function setTournamentStatus(actor: Actor, tournamentId: number, status: TournamentStatus): Promise<TournamentRow> {
  const tournament = await loadTournament(tournamentId);
  assertCanManage(tournament, actor);
  if (tournament.status === status) return tournament;
  if (!STATUS_FLOW[tournament.status].includes(status)) badRequest(`A ${tournament.status} tournament cannot move to ${status}.`);

  const values: Record<string, unknown> = { status };
  if (status === "checkin" && !tournament.checkinOpensAt) values.checkin_opens_at = new Date().toISOString();
  const { data, error } = await db().from("tournaments").update(values).eq("id", tournamentId).select().single();
  if (error) fail(error, "Tournament status update failed");
  const updated = normalizeTournament(data);

  if (status === "completed") {
    const { count } = await db().from("prize_payouts").select("id", { count: "exact", head: true }).eq("tournament_id", tournamentId);
    if (!count) {
      const rows = await listMatchRows(tournamentId);
      if (rows.some(row => row.status === "completed")) await completeTournament(updated, rows.map(toBracketLike));
    }
  }

  const registeredTeams = await activeTeamIds(tournamentId);
  if (status === "checkin") await notifyTeams(registeredTeams, "checkin", `Check-in open — ${tournament.name}`, "Check in now to secure your slot in the bracket.", `/tournaments/${tournamentId}`);
  if (status === "live") await notifyTeams(registeredTeams, "tournament", `${tournament.name} is live`, "The tournament has started. Watch the bracket for your match times.", `/tournaments/${tournamentId}`);
  if (status === "cancelled") await notifyTeams(registeredTeams, "tournament", `${tournament.name} was cancelled`, "The organizer cancelled this tournament.", `/tournaments/${tournamentId}`);
  return updated;
}

async function activeTeamIds(tournamentId: number): Promise<number[]> {
  const { data, error } = await db().from("tournament_registrations").select("team_id").eq("tournament_id", tournamentId).in("status", ACTIVE_REGISTRATION);
  if (error) fail(error, "Registration lookup failed");
  return (data ?? []).map(row => Number(row.team_id));
}

async function loadRegistration(tournamentId: number, teamId: number): Promise<Omit<RegistrationView, "team"> | null> {
  const { data, error } = await db().from("tournament_registrations").select("*").eq("tournament_id", tournamentId).eq("team_id", teamId).maybeSingle();
  if (error) fail(error, "Registration lookup failed");
  return data ? camel<Omit<RegistrationView, "team">>(data) : null;
}

async function withTeam(row: Omit<RegistrationView, "team">): Promise<RegistrationView> {
  const teams = await fetchTeamSummaries([row.teamId]);
  return { ...row, team: teams.get(row.teamId) ?? null };
}

export async function registerTeam(actor: Actor, input: { tournamentId: number; teamId: number }): Promise<RegistrationView> {
  const client = db();
  const tournament = await loadTournament(input.tournamentId);
  if (tournament.status !== "registration" && tournament.status !== "checkin") badRequest("Registration is closed for this tournament.");
  if (tournament.registrationClosesAt && tournament.registrationClosesAt.getTime() < Date.now() && tournament.status === "registration") badRequest("The registration deadline has passed.");

  const { data: team, error: teamError } = await client.from("teams").select("id,name,game,owner_id,captain_id").eq("id", input.teamId).maybeSingle();
  if (teamError) fail(teamError, "Team lookup failed");
  if (!team) notFound("Team");
  if (!sameGame(String(team.game), tournament.game)) badRequest(`${team.name} plays ${team.game}; this tournament is for ${tournament.game}.`);
  await assertTeamCaptain(input.teamId, actor, "Only the team owner or captain can register the team.");

  if (tournament.clanEligible) {
    const { count } = await client.from("clan_teams").select("team_id", { count: "exact", head: true }).eq("team_id", input.teamId);
    if (!count) badRequest("This tournament is clan-only. The team must belong to a clan to register.");
  }

  const existing = await loadRegistration(input.tournamentId, input.teamId);
  if (existing && existing.status !== "withdrawn") badRequest("This team is already registered.");

  const { count: taken } = await client.from("tournament_registrations").select("id", { count: "exact", head: true }).eq("tournament_id", input.tournamentId).in("status", ACTIVE_REGISTRATION);
  if ((taken ?? 0) >= tournament.maxTeams) badRequest("This tournament is full.");

  let paymentId: number | null = null;
  if (tournament.entryFeeCents > 0) {
    const { data: payment, error: paymentError } = await client.from("payments").insert({ user_id: actor.id, kind: "entry_fee", tournament_id: tournament.id, team_id: input.teamId, amount_cents: tournament.entryFeeCents, currency: "USD", status: "succeeded", provider: "sandbox", reference: `sbx_${Math.random().toString(36).slice(2, 12)}` }).select("id").single();
    if (paymentError) fail(paymentError, "Entry fee payment failed");
    paymentId = Number(payment.id);
  }

  const now = new Date().toISOString();
  const values = { status: "confirmed", registered_by: actor.id, accepted_rules_at: now, payment_id: paymentId, checked_in_at: null, seed: null };
  const result = existing
    ? await client.from("tournament_registrations").update(values).eq("id", existing.id).select().single()
    : await client.from("tournament_registrations").insert({ ...values, tournament_id: input.tournamentId, team_id: input.teamId }).select().single();
  if (result.error) fail(result.error, "Registration failed");

  await notifyTeams([input.teamId], "tournament", `Registered — ${tournament.name}`, tournament.entryFeeCents > 0 ? `Your team is confirmed. Entry fee paid in the sandbox. Check-in opens before the bracket is published.` : `Your team is confirmed. Check-in opens before the bracket is published.`, `/tournaments/${tournament.id}`);
  return withTeam(camel(result.data));
}

export async function withdrawTeam(actor: Actor, input: { tournamentId: number; teamId: number }): Promise<RegistrationView> {
  const client = db();
  const tournament = await loadTournament(input.tournamentId);
  const registration = await loadRegistration(input.tournamentId, input.teamId);
  if (!registration || registration.status === "withdrawn") badRequest("This team is not registered.");
  await assertTeamCaptain(input.teamId, actor, "Only the team owner or captain (or an admin) can withdraw the team.");
  if (hasBracketStarted(tournament) && !isAdmin(actor)) badRequest("Teams cannot withdraw once the bracket is published.");

  const { data, error } = await client.from("tournament_registrations").update({ status: "withdrawn" }).eq("id", registration.id).select().single();
  if (error) fail(error, "Withdrawal failed");
  if (registration.paymentId) await client.from("payments").update({ status: "refunded" }).eq("id", registration.paymentId);
  await notifyTeams([input.teamId], "tournament", `Withdrawn — ${tournament.name}`, registration.paymentId ? "Your team withdrew. The sandbox entry fee was refunded." : "Your team withdrew from the tournament.", `/tournaments/${tournament.id}`);
  return withTeam(camel(data));
}

export async function checkInTeam(actor: Actor, input: { tournamentId: number; teamId: number }): Promise<RegistrationView> {
  const tournament = await loadTournament(input.tournamentId);
  const open = tournament.status === "checkin" || (tournament.status === "live" && !tournament.bracketPublishedAt);
  if (!open) badRequest(tournament.status === "registration" ? "Check-in has not opened yet." : "Check-in is closed.");
  const registration = await loadRegistration(input.tournamentId, input.teamId);
  if (!registration || registration.status === "withdrawn") badRequest("This team is not registered.");
  if (registration.status === "checked_in") badRequest("This team is already checked in.");
  await assertTeamCaptain(input.teamId, actor, "Only the team owner or captain can check in.");
  const { data, error } = await db().from("tournament_registrations").update({ status: "checked_in", checked_in_at: new Date().toISOString() }).eq("id", registration.id).select().single();
  if (error) fail(error, "Check-in failed");
  await notifyTeams([input.teamId], "checkin", `Checked in — ${tournament.name}`, "Your team is checked in. The bracket will be published shortly.", `/tournaments/${tournament.id}`);
  return withTeam(camel(data));
}

export type GenerateBracketInput = { tournamentId: number; useCheckedInOnly?: boolean; regenerate?: boolean };

export async function generateBracket(actor: Actor, input: GenerateBracketInput): Promise<MatchView[]> {
  const client = db();
  const tournament = await loadTournament(input.tournamentId);
  assertCanManage(tournament, actor);
  if (tournament.status === "completed" || tournament.status === "cancelled" || tournament.status === "draft") badRequest(`A ${tournament.status} tournament cannot publish a bracket.`);

  const existing = await listMatchRows(tournament.id);
  if (existing.length) {
    if (!input.regenerate) badRequest("A bracket already exists. Pass regenerate to rebuild it (all results will be discarded).");
    const matchIds = existing.map(row => row.id);
    const { error: reportError } = await client.from("match_reports").delete().in("match_id", matchIds);
    if (reportError) fail(reportError, "Report cleanup failed");
    const { error: disputeError } = await client.from("disputes").delete().in("match_id", matchIds);
    if (disputeError) fail(disputeError, "Dispute cleanup failed");
    const { error: unlinkError } = await client.from("matches").update({ next_match_id: null, loser_next_match_id: null }).eq("tournament_id", tournament.id);
    if (unlinkError) fail(unlinkError, "Match cleanup failed");
    const { error: matchError } = await client.from("matches").delete().eq("tournament_id", tournament.id);
    if (matchError) fail(matchError, "Match cleanup failed");
    await client.from("prize_payouts").delete().eq("tournament_id", tournament.id);
  }

  const registrations = (await listRegistrations(tournament.id)).filter(row => ACTIVE_REGISTRATION.includes(row.status));
  const checkedIn = registrations.filter(row => row.status === "checked_in");
  const useCheckedInOnly = input.useCheckedInOnly ?? checkedIn.length > 0;
  const pool = useCheckedInOnly ? checkedIn : registrations;
  if (pool.length < 2) badRequest(useCheckedInOnly ? "At least two checked-in teams are required to publish a bracket." : "At least two registered teams are required to publish a bracket.");
  const teamIds = pool.map(row => row.teamId);

  const plan = planTournamentBracket(tournament.format, teamIds);
  const rows = plan.map(match => ({
    tournament_id: tournament.id,
    bracket: match.bracket,
    round: match.round,
    position: match.position,
    home_team_id: match.homeTeamId,
    away_team_id: match.awayTeamId,
    status: match.status,
    winner_team_id: match.winnerTeamId,
    best_of: tournament.bestOf,
    stream_url: tournament.streamUrl,
    scheduled_at: scheduledFor(tournament.startsAt, match.round),
    completed_at: match.status === "completed" ? new Date().toISOString() : null,
  }));
  const { data: inserted, error: insertError } = await client.from("matches").insert(rows).select("id,bracket,round,position");
  if (insertError) fail(insertError, "Bracket insert failed");

  const idByKey = new Map<string, number>();
  for (const row of inserted ?? []) idByKey.set(`${row.bracket}:${row.round}:${row.position}`, Number(row.id));
  const idFor = (key: string | null) => {
    if (!key) return null;
    const planned = plan.find(match => match.key === key);
    return planned ? idByKey.get(`${planned.bracket}:${planned.round}:${planned.position}`) ?? null : null;
  };
  for (const match of plan) {
    if (!match.nextMatchKey && !match.loserNextMatchKey) continue;
    const id = idByKey.get(`${match.bracket}:${match.round}:${match.position}`);
    if (!id) continue;
    const { error } = await client.from("matches").update({ next_match_id: idFor(match.nextMatchKey), next_match_slot: match.nextMatchSlot, loser_next_match_id: idFor(match.loserNextMatchKey), loser_next_match_slot: match.loserNextMatchSlot }).eq("id", id);
    if (error) fail(error, "Bracket link update failed");
  }

  for (let index = 0; index < pool.length; index++) {
    if (pool[index].seed !== index + 1) await client.from("tournament_registrations").update({ seed: index + 1 }).eq("id", pool[index].id);
  }

  const { error: statusError } = await client.from("tournaments").update({ status: "live", bracket_published_at: new Date().toISOString() }).eq("id", tournament.id);
  if (statusError) fail(statusError, "Tournament update failed");

  await notifyTeams(teamIds, "match_start", `Bracket published — ${tournament.name}`, "The bracket is live. Check your first match time and opponent.", `/tournaments/${tournament.id}/bracket`);
  return attachTeams(await listMatchRows(tournament.id), tournament.format);
}

export async function nextSwissRound(actor: Actor, tournamentId: number): Promise<MatchView[]> {
  const client = db();
  const tournament = await loadTournament(tournamentId);
  assertCanManage(tournament, actor);
  if (tournament.format !== "swiss") badRequest("Only Swiss tournaments pair additional rounds.");
  const rows = await listMatchRows(tournamentId);
  if (!rows.length) badRequest("Publish the first round before pairing the next one.");
  if (rows.some(row => row.status !== "completed")) badRequest("Every match in the current round must be completed first.");
  const bracket = rows.map(toBracketLike);
  const teamIds = Array.from(new Set(bracket.flatMap(match => [match.homeTeamId, match.awayTeamId]).filter((id): id is number => id !== null)));
  const round = rows.reduce((max, row) => Math.max(max, row.round), 0) + 1;
  if (round > roundCount("swiss", teamIds.length)) badRequest("All Swiss rounds have been played. Mark the tournament completed to finalize standings.");

  const plan = pairSwissRound(computeStandings(bracket, teamIds), bracket, round);
  const now = new Date().toISOString();
  const { error } = await client.from("matches").insert(plan.map(match => ({
    tournament_id: tournamentId,
    bracket: match.bracket,
    round: match.round,
    position: match.position,
    home_team_id: match.homeTeamId,
    away_team_id: match.awayTeamId,
    status: match.status,
    winner_team_id: match.winnerTeamId,
    best_of: tournament.bestOf,
    stream_url: tournament.streamUrl,
    scheduled_at: scheduledFor(tournament.startsAt, match.round),
    completed_at: match.status === "completed" ? now : null,
  })));
  if (error) fail(error, "Swiss round insert failed");
  await notifyTeams(teamIds, "match_start", `Swiss round ${round} — ${tournament.name}`, "New pairings are up. Check your opponent and match time.", `/tournaments/${tournamentId}/bracket`);
  return attachTeams(await listMatchRows(tournamentId), tournament.format);
}

export async function prizeBreakdownFor(tournamentId: number): Promise<PrizeBreakdown> {
  const tournament = await loadTournament(tournamentId);
  return breakdownFor(tournament, await countPaidRegistrations(tournamentId));
}

export async function setPayoutStatus(actor: Actor, input: { payoutId: number; status: "pending" | "processing" | "paid" }): Promise<PayoutView> {
  if (!isAdmin(actor)) badRequest("Only admins can update payouts.");
  const { data: existing, error: lookupError } = await db().from("prize_payouts").select("*").eq("id", input.payoutId).maybeSingle();
  if (lookupError) fail(lookupError, "Payout lookup failed");
  if (!existing) notFound("Payout");
  const values: Record<string, unknown> = { status: input.status };
  if (input.status === "paid") values.paid_at = existing.paid_at ?? new Date().toISOString();
  const { data, error } = await db().from("prize_payouts").update(values).eq("id", input.payoutId).select().single();
  if (error) fail(error, "Payout update failed");
  const row = camel<Omit<PayoutView, "team">>(data);
  const payout = { ...row, sharePercent: Number(row.sharePercent), amountCents: Number(row.amountCents) };
  if (payout.teamId) {
    const tournament = await loadTournament(payout.tournamentId);
    const label = input.status === "paid" ? "Prize paid" : input.status === "processing" ? "Prize payout processing" : "Prize payout pending";
    await notifyTeams([payout.teamId], "payout", `${label} — ${tournament.name}`, `Placement ${payout.placement}: ${(payout.amountCents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" })} is now ${input.status}.`, `/tournaments/${tournament.id}`);
  }
  const teams = await fetchTeamSummaries([payout.teamId]);
  return { ...payout, team: payout.teamId ? teams.get(payout.teamId) ?? null : null };
}

export async function createAnnouncement(actor: Actor, input: { tournamentId: number; title: string; body: string; pinned?: boolean }): Promise<AnnouncementView> {
  const tournament = await loadTournament(input.tournamentId);
  assertCanManage(tournament, actor);
  const { data, error } = await db().from("announcements").insert({ tournament_id: tournament.id, author_id: actor.id, title: input.title.trim(), body: input.body.trim(), pinned: Boolean(input.pinned) }).select("*, author:users(id,name)").single();
  if (error) fail(error, "Announcement failed");
  const teamIds = await activeTeamIds(tournament.id);
  await notifyTeams(teamIds, "tournament", `${tournament.name}: ${input.title.trim()}`, input.body.trim().slice(0, 240), `/tournaments/${tournament.id}`);
  const row = camel<AnnouncementView>(data);
  return { ...row, author: row.author ? { id: Number(row.author.id), name: row.author.name ?? null } : null };
}
