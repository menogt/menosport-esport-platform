import { and, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  clanMembers,
  clanTeams,
  clans,
  disputes,
  matchReports,
  matches,
  playerProfiles,
  teamMembers,
  teams,
  tournamentRegistrations,
  tournaments,
  users,
} from "../drizzle/schema";
import { ENV } from "./_core/env";
import { hasSupabaseDomainClient, supabaseAdmin } from "./_core/supabaseAdmin";
import { supabaseCreateClan, supabaseCreateTeam, supabaseCreateTournament, supabaseGetClanDashboard, supabaseGetPlayerDashboard, supabaseGetClansForUser, supabaseGetOpenDisputes, supabaseGetTeamsForUser, supabaseGetTournament, supabaseGetTournamentMatches, supabaseOpenDispute, supabaseResolveDispute, supabaseSubmitMatchReport, supabaseUpdatePlayerProfile } from "./supabaseDomain";

let _db: ReturnType<typeof drizzle> | null = null;
const isVitestRuntime = process.env.NODE_ENV === "test" || Boolean(process.env.VITEST_WORKER_ID) || process.argv.some(argument => argument.includes("vitest"));
const shouldUseSupabaseDomain = () => !isVitestRuntime && hasSupabaseDomainClient();

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export function normalizeSupabaseUserId(openId: string) {
  return openId.startsWith("supabase:") ? openId.slice("supabase:".length) : openId;
}

function mapSupabaseUser(row: Record<string, unknown>) {
  const supabaseUserId = String(row.supabase_user_id);
  return {
    id: Number(row.id),
    openId: `supabase:${supabaseUserId}`,
    name: (row.name as string | null) ?? null,
    email: (row.email as string | null) ?? null,
    loginMethod: "supabase",
    role: (row.role as "admin" | "user") ?? "user",
    lastSignedIn: new Date(String(row.last_signed_in)),
    createdAt: new Date(String(row.created_at)),
    updatedAt: new Date(String(row.updated_at)),
  };
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");

  if (shouldUseSupabaseDomain() && supabaseAdmin) {
    const row = {
      supabase_user_id: normalizeSupabaseUserId(user.openId),
      name: user.name ?? null,
      email: user.email ?? null,
      role: user.role ?? (user.openId === ENV.ownerOpenId ? "admin" : "user"),
      last_signed_in: (user.lastSignedIn ?? new Date()).toISOString(),
    };
    const { error } = await supabaseAdmin.from("users").upsert(row, { onConflict: "supabase_user_id" });
    if (error) throw new Error(`[Supabase] Failed to upsert user: ${error.message}`);
    return;
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;

  for (const field of textFields) {
    if (user[field] === undefined) continue;
    const normalized = user[field] ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  }

  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }
  values.lastSignedIn ??= new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  if (shouldUseSupabaseDomain() && supabaseAdmin) {
    const { data, error } = await supabaseAdmin.from("users").select("*").eq("supabase_user_id", normalizeSupabaseUserId(openId)).maybeSingle();
    if (error) throw new Error(`[Supabase] Failed to load user: ${error.message}`);
    return data ? mapSupabaseUser(data) : undefined;
  }

  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

const fallbackTournaments = [
  {
    id: 101,
    name: "Neon Circuit: Open Qualifier",
    game: "VALORANT",
    format: "single_elimination" as const,
    status: "registration" as const,
    startsAt: new Date("2026-09-12T18:00:00Z"),
    registrationClosesAt: new Date("2026-09-10T18:00:00Z"),
    prizePoolCents: 250000,
    maxTeams: 32,
    createdBy: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 102,
    name: "Meno Arena Clash #04",
    game: "Mobile Legends",
    format: "single_elimination" as const,
    status: "live" as const,
    startsAt: new Date("2026-08-22T14:00:00Z"),
    registrationClosesAt: null,
    prizePoolCents: 500000,
    maxTeams: 16,
    createdBy: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const fallbackTeams = [
  { id: 201, ownerId: 1, name: "Null Sector", tag: "NSEC", game: "VALORANT", region: "SEA", description: "Precision under pressure.", createdAt: new Date(), updatedAt: new Date() },
];

const fallbackMatches = [
  { id: 301, tournamentId: 102, round: 1, position: 1, homeTeamId: 201, awayTeamId: null, homeScore: 2, awayScore: 0, status: "live" as const, scheduledAt: new Date(), winnerTeamId: null, createdAt: new Date(), updatedAt: new Date() },
];

export async function updatePlayerProfile(input: { userId: number; handle: string; bio?: string; region?: string; primaryGame?: string }) {
  if (shouldUseSupabaseDomain()) return supabaseUpdatePlayerProfile(input);
  const db = await getDb();
  const normalized = {
    userId: input.userId,
    handle: input.handle.trim().toUpperCase(),
    bio: input.bio?.trim() || null,
    region: input.region?.trim().toUpperCase() || null,
    primaryGame: input.primaryGame?.trim() || null,
  };
  if (!db) return { ...normalized, id: 0, wins: 0, losses: 0, createdAt: new Date(), updatedAt: new Date() };
  await db.insert(playerProfiles).values(normalized).onDuplicateKeyUpdate({ set: { handle: normalized.handle, bio: normalized.bio, region: normalized.region, primaryGame: normalized.primaryGame } });
  const rows = await db.select().from(playerProfiles).where(eq(playerProfiles.userId, input.userId)).limit(1);
  return rows[0];
}

export async function getPlayerDashboard(userId: number) {
  if (shouldUseSupabaseDomain()) return supabaseGetPlayerDashboard(userId);
  const db = await getDb();
  if (!db) {
    return {
      profile: { handle: "NOVA_PLAYER", bio: "Competing from the front line.", region: "SEA", primaryGame: "VALORANT", wins: 18, losses: 7 },
      teams: fallbackTeams,
      tournaments: fallbackTournaments,
      matches: fallbackMatches,
      clan: { name: "Axiom Collective", tag: "AXM", region: "SEA" },
    };
  }

  const [profileRows, memberships, tournamentRows, matchRows, ownedClans] = await Promise.all([
    db.select().from(playerProfiles).where(eq(playerProfiles.userId, userId)).limit(1),
    db.select({ team: teams }).from(teamMembers).innerJoin(teams, eq(teamMembers.teamId, teams.id)).where(eq(teamMembers.userId, userId)),
    db.select().from(tournaments).orderBy(desc(tournaments.startsAt)).limit(6),
    db.select().from(matches).orderBy(desc(matches.scheduledAt)).limit(8),
    db.select().from(clans).where(eq(clans.ownerId, userId)).limit(1),
  ]);

  return {
    profile: profileRows[0] ?? { handle: "NEW_PLAYER", bio: null, region: "SEA", primaryGame: "VALORANT", wins: 0, losses: 0 },
    teams: memberships.map(item => item.team),
    tournaments: tournamentRows.length ? tournamentRows : fallbackTournaments,
    matches: matchRows.length ? matchRows : fallbackMatches,
    clan: ownedClans[0] ?? null,
  };
}

export async function getTeamsForUser(userId: number) {
  if (shouldUseSupabaseDomain()) return supabaseGetTeamsForUser(userId);
  const db = await getDb();
  if (!db) return fallbackTeams;
  const rows = await db.select({ team: teams }).from(teamMembers).innerJoin(teams, eq(teamMembers.teamId, teams.id)).where(eq(teamMembers.userId, userId));
  return rows.length ? rows.map(row => row.team) : fallbackTeams;
}

export async function createTeamForUser(input: { ownerId: number; name: string; tag: string; game: string; region?: string; description?: string }) {
  if (shouldUseSupabaseDomain()) return supabaseCreateTeam(input);
  const db = await getDb();
  if (!db) return { ...input, id: Date.now(), createdAt: new Date(), updatedAt: new Date() };
  const result = await db.insert(teams).values(input);
  const teamId = Number(result[0].insertId);
  await db.insert(teamMembers).values({ teamId, userId: input.ownerId, role: "captain" });
  const rows = await db.select().from(teams).where(eq(teams.id, teamId)).limit(1);
  return rows[0];
}

export async function getTournamentById(tournamentId: number) {
  if (shouldUseSupabaseDomain()) return supabaseGetTournament(tournamentId);
  const db = await getDb();
  if (!db) return fallbackTournaments.find(tournament => tournament.id === tournamentId) ?? null;
  const rows = await db.select().from(tournaments).where(eq(tournaments.id, tournamentId)).limit(1);
  return rows[0] ?? null;
}

export async function getTournamentMatches(tournamentId: number) {
  if (shouldUseSupabaseDomain()) return supabaseGetTournamentMatches(tournamentId);
  const db = await getDb();
  if (!db) return fallbackMatches.filter(match => match.tournamentId === tournamentId);
  const rows = await db.select().from(matches).where(eq(matches.tournamentId, tournamentId)).orderBy(matches.round, matches.position);
  return rows;
}

const fallbackClans = [
  { id: 401, ownerId: 1, name: "Axiom Collective", tag: "AXM", region: "SEA", bio: "A multi-title competitive collective built for high-pressure rooms.", foundedYear: 2022, socials: "discord.com/axiom", createdAt: new Date(), updatedAt: new Date() },
];

export async function getClansForUser(userId: number) {
  if (shouldUseSupabaseDomain()) return supabaseGetClansForUser(userId);
  const db = await getDb();
  if (!db) return fallbackClans;
  const rows = await db.select().from(clans).where(eq(clans.ownerId, userId)).orderBy(desc(clans.createdAt));
  return rows.length ? rows : fallbackClans;
}

export async function createClanForUser(input: { ownerId: number; name: string; tag: string; region?: string; bio?: string; foundedYear?: number; socials?: string }) {
  if (shouldUseSupabaseDomain()) return supabaseCreateClan(input);
  const db = await getDb();
  const values = {
    ownerId: input.ownerId,
    name: input.name.trim(),
    tag: input.tag.trim().toUpperCase(),
    region: input.region?.trim().toUpperCase() || null,
    bio: input.bio?.trim() || null,
    foundedYear: input.foundedYear ?? null,
    socials: input.socials?.trim() || null,
  };
  if (!db) return { ...values, id: Date.now(), createdAt: new Date(), updatedAt: new Date() };
  const result = await db.insert(clans).values(values);
  const clanId = Number(result[0].insertId);
  await db.insert(clanMembers).values({ clanId, userId: input.ownerId, role: "owner" });
  const rows = await db.select().from(clans).where(eq(clans.id, clanId)).limit(1);
  return rows[0];
}

export async function getClanDashboard(clanId: number, userId: number) {
  if (shouldUseSupabaseDomain()) return supabaseGetClanDashboard(clanId, userId);
  const db = await getDb();
  if (!db) return { clan: fallbackClans.find(clan => clan.id === clanId) ?? null, teams: fallbackTeams };
  const clanRows = await db.select().from(clans).where(and(eq(clans.id, clanId), eq(clans.ownerId, userId))).limit(1);
  if (!clanRows[0]) return { clan: null, teams: [] };
  const teamRows = await db.select({ team: teams }).from(clanTeams).innerJoin(teams, eq(clanTeams.teamId, teams.id)).where(eq(clanTeams.clanId, clanId));
  return { clan: clanRows[0], teams: teamRows.map(row => row.team) };
}

export async function createTournamentForUser(input: {
  createdBy: number;
  name: string;
  game: string;
  format: "single_elimination" | "double_elimination" | "round_robin" | "swiss";
  startsAt: Date;
  registrationClosesAt?: Date;
  prizePoolCents?: number;
  entryFeeCents?: number;
  maxTeams?: number;
  rules?: string;
  sponsorName?: string;
  streamUrl?: string;
  clanEligible?: boolean;
}) {
  if (shouldUseSupabaseDomain()) return supabaseCreateTournament(input);
  const db = await getDb();
  const values = {
    createdBy: input.createdBy,
    name: input.name.trim(),
    game: input.game.trim(),
    format: input.format,
    status: "registration" as const,
    startsAt: input.startsAt,
    registrationClosesAt: input.registrationClosesAt ?? null,
    prizePoolCents: input.prizePoolCents ?? 0,
    entryFeeCents: input.entryFeeCents ?? 0,
    maxTeams: input.maxTeams ?? 16,
    rules: input.rules?.trim() || null,
    sponsorName: input.sponsorName?.trim() || null,
    streamUrl: input.streamUrl?.trim() || null,
    clanEligible: input.clanEligible ? 1 : 0,
  };
  if (!db) return { ...values, id: Date.now(), createdAt: new Date(), updatedAt: new Date() };
  const result = await db.insert(tournaments).values(values);
  const tournamentId = Number(result[0].insertId);
  const rows = await db.select().from(tournaments).where(eq(tournaments.id, tournamentId)).limit(1);
  return rows[0];
}

export async function submitMatchReport(input: { matchId: number; submittedBy: number; teamId: number; scoreFor: number; scoreAgainst: number; screenshotUrl?: string; notes?: string }) {
  if (shouldUseSupabaseDomain()) return supabaseSubmitMatchReport(input);
  const db = await getDb();
  const values = {
    matchId: input.matchId,
    submittedBy: input.submittedBy,
    teamId: input.teamId,
    scoreFor: input.scoreFor,
    scoreAgainst: input.scoreAgainst,
    screenshotUrl: input.screenshotUrl?.trim() || null,
    notes: input.notes?.trim() || null,
    status: "waiting_confirmation" as const,
  };
  if (!db) return { ...values, id: Date.now(), createdAt: new Date(), updatedAt: new Date() };
  const result = await db.insert(matchReports).values(values);
  await db.update(matches).set({ status: "waiting" }).where(eq(matches.id, input.matchId));
  const reportId = Number(result[0].insertId);
  const rows = await db.select().from(matchReports).where(eq(matchReports.id, reportId)).limit(1);
  return rows[0];
}

export async function openMatchDispute(input: { matchId: number; openedBy: number; reason: string }) {
  if (shouldUseSupabaseDomain()) return supabaseOpenDispute(input);
  const db = await getDb();
  const values = { matchId: input.matchId, openedBy: input.openedBy, reason: input.reason.trim(), status: "open" as const };
  if (!db) return { ...values, id: Date.now(), adminDecision: null, winnerTeamId: null, resolvedBy: null, resolvedAt: null, createdAt: new Date(), updatedAt: new Date() };
  const result = await db.insert(disputes).values(values);
  await db.update(matches).set({ status: "disputed" }).where(eq(matches.id, input.matchId));
  const disputeId = Number(result[0].insertId);
  const rows = await db.select().from(disputes).where(eq(disputes.id, disputeId)).limit(1);
  return rows[0];
}

export async function getOpenDisputes() {
  if (shouldUseSupabaseDomain()) return supabaseGetOpenDisputes();
  const db = await getDb();
  if (!db) return [];
  return db.select().from(disputes).where(eq(disputes.status, "open")).orderBy(desc(disputes.createdAt));
}

export async function resolveMatchDispute(input: { disputeId: number; resolvedBy: number; winnerTeamId: number; adminDecision: string }) {
  if (shouldUseSupabaseDomain()) return supabaseResolveDispute(input);
  const db = await getDb();
  if (!db) return { ...input, status: "resolved" as const, resolvedAt: new Date() };
  const disputeRows = await db.select().from(disputes).where(eq(disputes.id, input.disputeId)).limit(1);
  const dispute = disputeRows[0];
  if (!dispute) return null;
  await db.update(disputes).set({ status: "resolved", winnerTeamId: input.winnerTeamId, adminDecision: input.adminDecision.trim(), resolvedBy: input.resolvedBy, resolvedAt: new Date() }).where(eq(disputes.id, input.disputeId));
  await db.update(matches).set({ status: "completed", winnerTeamId: input.winnerTeamId }).where(eq(matches.id, dispute.matchId));
  const rows = await db.select().from(disputes).where(eq(disputes.id, input.disputeId)).limit(1);
  return rows[0];
}
