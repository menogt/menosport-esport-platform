// server/_core/app.ts
import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";

// shared/const.ts
var COOKIE_NAME = "app_session_id";
var ONE_YEAR_MS = 1e3 * 60 * 60 * 24 * 365;
var AXIOS_TIMEOUT_MS = 3e4;
var UNAUTHED_ERR_MSG = "Please login (10001)";
var NOT_ADMIN_ERR_MSG = "You do not have required permission (10002)";
var OAUTH_STATE_COOKIE = "__Host-oauth_state";
var decodeOAuthState = (state) => {
  let decoded;
  try {
    decoded = atob(state);
  } catch {
    return { redirectUri: "" };
  }
  try {
    const parsed = JSON.parse(decoded);
    if (parsed && typeof parsed.redirectUri === "string") return parsed;
  } catch {
  }
  return { redirectUri: decoded };
};

// server/_core/oauth.ts
import { parse as parseCookieHeader2 } from "cookie";

// server/db.ts
import { and, desc, eq } from "drizzle-orm";

// drizzle/schema.ts
import {
  int,
  mysqlEnum,
  mysqlTable,
  primaryKey,
  text,
  timestamp,
  unique,
  varchar
} from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";
var users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull()
});
var playerProfiles = mysqlTable(
  "player_profiles",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    handle: varchar("handle", { length: 48 }).notNull(),
    bio: text("bio"),
    region: varchar("region", { length: 64 }),
    primaryGame: varchar("primaryGame", { length: 64 }),
    wins: int("wins").default(0).notNull(),
    losses: int("losses").default(0).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
  },
  (table) => ({ userUnique: unique("player_profiles_user_unique").on(table.userId) })
);
var teams = mysqlTable("teams", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  name: varchar("name", { length: 80 }).notNull(),
  tag: varchar("tag", { length: 12 }).notNull(),
  game: varchar("game", { length: 64 }).notNull(),
  region: varchar("region", { length: 64 }),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});
var teamMembers = mysqlTable(
  "team_members",
  {
    teamId: int("teamId").notNull(),
    userId: int("userId").notNull(),
    role: mysqlEnum("role", ["captain", "player", "manager"]).default("player").notNull(),
    joinedAt: timestamp("joinedAt").defaultNow().notNull()
  },
  (table) => ({ pk: primaryKey({ columns: [table.teamId, table.userId] }) })
);
var clans = mysqlTable("clans", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  name: varchar("name", { length: 80 }).notNull(),
  tag: varchar("tag", { length: 12 }).notNull(),
  region: varchar("region", { length: 64 }),
  bio: text("bio"),
  foundedYear: int("foundedYear"),
  socials: text("socials"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});
var clanTeams = mysqlTable(
  "clan_teams",
  {
    clanId: int("clanId").notNull(),
    teamId: int("teamId").notNull(),
    addedAt: timestamp("addedAt").defaultNow().notNull()
  },
  (table) => ({ pk: primaryKey({ columns: [table.clanId, table.teamId] }) })
);
var clanMembers = mysqlTable(
  "clan_members",
  {
    clanId: int("clanId").notNull(),
    userId: int("userId").notNull(),
    role: mysqlEnum("role", ["owner", "manager", "scout", "member"]).default("member").notNull(),
    joinedAt: timestamp("joinedAt").defaultNow().notNull()
  },
  (table) => ({ pk: primaryKey({ columns: [table.clanId, table.userId] }) })
);
var tournaments = mysqlTable("tournaments", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  game: varchar("game", { length: 64 }).notNull(),
  format: mysqlEnum("format", ["single_elimination", "double_elimination", "round_robin", "swiss"]).default("single_elimination").notNull(),
  status: mysqlEnum("status", ["registration", "live", "completed"]).default("registration").notNull(),
  startsAt: timestamp("startsAt").notNull(),
  registrationClosesAt: timestamp("registrationClosesAt"),
  prizePoolCents: int("prizePoolCents").default(0).notNull(),
  entryFeeCents: int("entryFeeCents").default(0).notNull(),
  maxTeams: int("maxTeams").default(16).notNull(),
  rules: text("rules"),
  sponsorName: varchar("sponsorName", { length: 120 }),
  streamUrl: varchar("streamUrl", { length: 500 }),
  clanEligible: int("clanEligible").default(0).notNull(),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});
var tournamentRegistrations = mysqlTable(
  "tournament_registrations",
  {
    id: int("id").autoincrement().primaryKey(),
    tournamentId: int("tournamentId").notNull(),
    teamId: int("teamId").notNull(),
    registeredBy: int("registeredBy").notNull(),
    status: mysqlEnum("status", ["pending", "confirmed", "checked_in", "withdrawn"]).default("pending").notNull(),
    acceptedRulesAt: timestamp("acceptedRulesAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
  },
  (table) => ({ uniqueRegistration: unique("tournament_team_unique").on(table.tournamentId, table.teamId) })
);
var matches = mysqlTable("matches", {
  id: int("id").autoincrement().primaryKey(),
  tournamentId: int("tournamentId").notNull(),
  round: int("round").notNull(),
  position: int("position").notNull(),
  homeTeamId: int("homeTeamId"),
  awayTeamId: int("awayTeamId"),
  homeScore: int("homeScore").default(0).notNull(),
  awayScore: int("awayScore").default(0).notNull(),
  status: mysqlEnum("status", ["upcoming", "live", "waiting", "disputed", "completed"]).default("upcoming").notNull(),
  scheduledAt: timestamp("scheduledAt"),
  winnerTeamId: int("winnerTeamId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});
var matchReports = mysqlTable("match_reports", {
  id: int("id").autoincrement().primaryKey(),
  matchId: int("matchId").notNull(),
  submittedBy: int("submittedBy").notNull(),
  teamId: int("teamId").notNull(),
  scoreFor: int("scoreFor").notNull(),
  scoreAgainst: int("scoreAgainst").notNull(),
  screenshotUrl: varchar("screenshotUrl", { length: 500 }),
  notes: text("notes"),
  status: mysqlEnum("status", ["submitted", "waiting_confirmation", "confirmed", "disputed", "admin_resolved"]).default("submitted").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});
var disputes = mysqlTable("disputes", {
  id: int("id").autoincrement().primaryKey(),
  matchId: int("matchId").notNull(),
  openedBy: int("openedBy").notNull(),
  reason: text("reason").notNull(),
  status: mysqlEnum("status", ["open", "under_review", "resolved"]).default("open").notNull(),
  adminDecision: text("adminDecision"),
  winnerTeamId: int("winnerTeamId"),
  resolvedBy: int("resolvedBy"),
  resolvedAt: timestamp("resolvedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
});
var usersRelations = relations(users, ({ one, many }) => ({
  profile: one(playerProfiles, { fields: [users.id], references: [playerProfiles.userId] }),
  teams: many(teamMembers),
  ownedTeams: many(teams),
  ownedClans: many(clans),
  clanMemberships: many(clanMembers),
  createdTournaments: many(tournaments)
}));
var teamsRelations = relations(teams, ({ one, many }) => ({
  owner: one(users, { fields: [teams.ownerId], references: [users.id] }),
  members: many(teamMembers),
  clanLinks: many(clanTeams),
  registrations: many(tournamentRegistrations),
  submittedReports: many(matchReports)
}));
var clansRelations = relations(clans, ({ one, many }) => ({
  owner: one(users, { fields: [clans.ownerId], references: [users.id] }),
  teams: many(clanTeams),
  members: many(clanMembers)
}));
var tournamentsRelations = relations(tournaments, ({ one, many }) => ({
  creator: one(users, { fields: [tournaments.createdBy], references: [users.id] }),
  matches: many(matches),
  registrations: many(tournamentRegistrations)
}));
var matchesRelations = relations(matches, ({ one, many }) => ({
  tournament: one(tournaments, { fields: [matches.tournamentId], references: [tournaments.id] }),
  homeTeam: one(teams, { fields: [matches.homeTeamId], references: [teams.id] }),
  awayTeam: one(teams, { fields: [matches.awayTeamId], references: [teams.id] }),
  winner: one(teams, { fields: [matches.winnerTeamId], references: [teams.id] }),
  reports: many(matchReports),
  disputes: many(disputes)
}));
var teamMembersRelations = relations(teamMembers, ({ one }) => ({
  team: one(teams, { fields: [teamMembers.teamId], references: [teams.id] }),
  user: one(users, { fields: [teamMembers.userId], references: [users.id] })
}));
var clanTeamsRelations = relations(clanTeams, ({ one }) => ({
  clan: one(clans, { fields: [clanTeams.clanId], references: [clans.id] }),
  team: one(teams, { fields: [clanTeams.teamId], references: [teams.id] })
}));
var clanMembersRelations = relations(clanMembers, ({ one }) => ({
  clan: one(clans, { fields: [clanMembers.clanId], references: [clans.id] }),
  user: one(users, { fields: [clanMembers.userId], references: [users.id] })
}));
var tournamentRegistrationsRelations = relations(tournamentRegistrations, ({ one }) => ({
  tournament: one(tournaments, { fields: [tournamentRegistrations.tournamentId], references: [tournaments.id] }),
  team: one(teams, { fields: [tournamentRegistrations.teamId], references: [teams.id] }),
  registeredByUser: one(users, { fields: [tournamentRegistrations.registeredBy], references: [users.id] })
}));
var matchReportsRelations = relations(matchReports, ({ one }) => ({
  match: one(matches, { fields: [matchReports.matchId], references: [matches.id] }),
  submitter: one(users, { fields: [matchReports.submittedBy], references: [users.id] }),
  team: one(teams, { fields: [matchReports.teamId], references: [teams.id] })
}));
var disputesRelations = relations(disputes, ({ one }) => ({
  match: one(matches, { fields: [disputes.matchId], references: [matches.id] }),
  opener: one(users, { fields: [disputes.openedBy], references: [users.id] }),
  resolver: one(users, { fields: [disputes.resolvedBy], references: [users.id] }),
  winner: one(teams, { fields: [disputes.winnerTeamId], references: [teams.id] })
}));

// server/_core/env.ts
var ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? ""
};

// server/_core/supabaseAdmin.ts
import { createClient } from "@supabase/supabase-js";
var url = process.env.VITE_SUPABASE_URL ?? "";
var serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
function createOptionalSupabaseAdmin(urlValue, key) {
  if (!urlValue || !key) {
    console.warn("[Supabase] Server domain client is not configured");
    return null;
  }
  try {
    new URL(urlValue);
    return createClient(urlValue, key, {
      auth: { autoRefreshToken: false, persistSession: false }
    });
  } catch (error) {
    console.warn("[Supabase] Ignoring invalid server domain client configuration", error);
    return null;
  }
}
var supabaseAdmin = createOptionalSupabaseAdmin(url, serviceRoleKey);
function hasSupabaseDomainClient() {
  return Boolean(supabaseAdmin);
}

// server/supabaseDomain.ts
var toDate = (value) => value ? new Date(String(value)) : null;
var camel = (row) => {
  const result = {};
  for (const [key, value] of Object.entries(row)) {
    result[key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())] = value;
  }
  for (const key of ["createdAt", "updatedAt", "startsAt", "registrationClosesAt", "scheduledAt", "lastSignedIn", "resolvedAt", "readAt", "joinedAt"]) {
    if (key in result) result[key] = toDate(result[key]);
  }
  return result;
};
function requireClient() {
  if (!supabaseAdmin) throw new Error("Supabase domain client is not configured");
  return supabaseAdmin;
}
async function supabaseUpdatePlayerProfile(input) {
  const row = {
    user_id: input.userId,
    handle: input.handle.trim().toUpperCase(),
    bio: input.bio?.trim() || null,
    region: input.region?.trim().toUpperCase() || null,
    primary_game: input.primaryGame?.trim() || null
  };
  const { data, error } = await requireClient().from("player_profiles").upsert(row, { onConflict: "user_id" }).select().single();
  if (error) throw new Error(`[Supabase] Profile update failed: ${error.message}`);
  return camel(data);
}
async function supabaseGetPlayerDashboard(userId) {
  const client = requireClient();
  const [profileResult, teamsResult, tournamentsResult, matchesResult, clanResult] = await Promise.all([
    client.from("player_profiles").select("*").eq("user_id", userId).maybeSingle(),
    client.from("team_members").select("team:teams(*)").eq("user_id", userId),
    client.from("tournaments").select("*").order("starts_at", { ascending: false }).limit(6),
    client.from("matches").select("*").order("scheduled_at", { ascending: false }).limit(8),
    client.from("clans").select("*").eq("owner_id", userId).limit(1)
  ]);
  const failed = [profileResult, teamsResult, tournamentsResult, matchesResult, clanResult].find((result) => result.error);
  if (failed?.error) throw new Error(`[Supabase] Player dashboard failed: ${failed.error.message}`);
  return {
    profile: profileResult.data ? camel(profileResult.data) : { handle: "NEW_PLAYER", bio: null, region: "SEA", primaryGame: "VALORANT", wins: 0, losses: 0 },
    teams: (teamsResult.data ?? []).map((row) => camel(row.team)),
    tournaments: (tournamentsResult.data ?? []).map(camel),
    matches: (matchesResult.data ?? []).map(camel),
    clan: clanResult.data?.[0] ? camel(clanResult.data[0]) : null
  };
}
async function supabaseGetTeamsForUser(userId) {
  const { data, error } = await requireClient().from("team_members").select("team:teams(*)").eq("user_id", userId);
  if (error) throw new Error(`[Supabase] Team lookup failed: ${error.message}`);
  return (data ?? []).map((row) => camel(row.team));
}
async function supabaseCreateTeam(input) {
  const client = requireClient();
  const { data, error } = await client.from("teams").insert({ owner_id: input.ownerId, name: input.name.trim(), tag: input.tag.trim().toUpperCase(), game: input.game.trim(), region: input.region?.trim().toUpperCase() || null, description: input.description?.trim() || null }).select().single();
  if (error) throw new Error(`[Supabase] Team creation failed: ${error.message}`);
  const { error: memberError } = await client.from("team_members").insert({ team_id: data.id, user_id: input.ownerId, role: "captain" });
  if (memberError) throw new Error(`[Supabase] Team membership failed: ${memberError.message}`);
  return camel(data);
}
async function supabaseGetClansForUser(userId) {
  const { data, error } = await requireClient().from("clans").select("*").eq("owner_id", userId).order("created_at", { ascending: false });
  if (error) throw new Error(`[Supabase] Clan lookup failed: ${error.message}`);
  return (data ?? []).map(camel);
}
async function supabaseCreateClan(input) {
  const client = requireClient();
  const { data, error } = await client.from("clans").insert({ owner_id: input.ownerId, name: input.name.trim(), tag: input.tag.trim().toUpperCase(), region: input.region?.trim().toUpperCase() || null, bio: input.bio?.trim() || null, founded_year: input.foundedYear ?? null, socials: input.socials?.trim() || null }).select().single();
  if (error) throw new Error(`[Supabase] Clan creation failed: ${error.message}`);
  const { error: memberError } = await client.from("clan_members").insert({ clan_id: data.id, user_id: input.ownerId, role: "owner" });
  if (memberError) throw new Error(`[Supabase] Clan membership failed: ${memberError.message}`);
  return camel(data);
}
async function supabaseGetClanDashboard(clanId, userId) {
  const client = requireClient();
  const { data: clan, error } = await client.from("clans").select("*").eq("id", clanId).eq("owner_id", userId).maybeSingle();
  if (error) throw new Error(`[Supabase] Clan dashboard failed: ${error.message}`);
  if (!clan) return { clan: null, teams: [] };
  const { data: links, error: linkError } = await client.from("clan_teams").select("team:teams(*)").eq("clan_id", clanId);
  if (linkError) throw new Error(`[Supabase] Clan teams failed: ${linkError.message}`);
  return { clan: camel(clan), teams: (links ?? []).map((row) => camel(row.team)) };
}
async function supabaseCreateTournament(input) {
  const { data, error } = await requireClient().from("tournaments").insert({ created_by: input.createdBy, name: input.name.trim(), game: input.game.trim(), format: input.format, status: "registration", starts_at: input.startsAt.toISOString(), registration_closes_at: input.registrationClosesAt?.toISOString() ?? null, prize_pool_cents: input.prizePoolCents ?? 0, entry_fee_cents: input.entryFeeCents ?? 0, max_teams: input.maxTeams ?? 16, rules: input.rules?.trim() || null, sponsor_name: input.sponsorName?.trim() || null, stream_url: input.streamUrl?.trim() || null, clan_eligible: Boolean(input.clanEligible) }).select().single();
  if (error) throw new Error(`[Supabase] Tournament creation failed: ${error.message}`);
  return camel(data);
}
async function supabaseGetTournament(tournamentId) {
  const { data, error } = await requireClient().from("tournaments").select("*").eq("id", tournamentId).maybeSingle();
  if (error) throw new Error(`[Supabase] Tournament lookup failed: ${error.message}`);
  return data ? camel(data) : null;
}
async function supabaseGetTournamentMatches(tournamentId) {
  const { data, error } = await requireClient().from("matches").select("*").eq("tournament_id", tournamentId).order("round", { ascending: true }).order("position", { ascending: true });
  if (error) throw new Error(`[Supabase] Match lookup failed: ${error.message}`);
  return (data ?? []).map(camel);
}
async function supabaseSubmitMatchReport(input) {
  const client = requireClient();
  const { data, error } = await client.from("match_reports").insert({ match_id: input.matchId, submitted_by: input.submittedBy, team_id: input.teamId, score_for: input.scoreFor, score_against: input.scoreAgainst, screenshot_url: input.screenshotUrl?.trim() || null, notes: input.notes?.trim() || null, status: "waiting_confirmation" }).select().single();
  if (error) throw new Error(`[Supabase] Match report failed: ${error.message}`);
  const { error: matchError } = await client.from("matches").update({ status: "waiting" }).eq("id", input.matchId);
  if (matchError) throw new Error(`[Supabase] Match status update failed: ${matchError.message}`);
  return camel(data);
}
async function supabaseOpenDispute(input) {
  const client = requireClient();
  const { data, error } = await client.from("disputes").insert({ match_id: input.matchId, opened_by: input.openedBy, reason: input.reason.trim(), status: "open" }).select().single();
  if (error) throw new Error(`[Supabase] Dispute creation failed: ${error.message}`);
  const { error: matchError } = await client.from("matches").update({ status: "disputed" }).eq("id", input.matchId);
  if (matchError) throw new Error(`[Supabase] Dispute match update failed: ${matchError.message}`);
  return camel(data);
}
async function supabaseGetOpenDisputes() {
  const { data, error } = await requireClient().from("disputes").select("*").eq("status", "open").order("created_at", { ascending: false });
  if (error) throw new Error(`[Supabase] Dispute lookup failed: ${error.message}`);
  return (data ?? []).map(camel);
}
async function supabaseResolveDispute(input) {
  const client = requireClient();
  const { data: dispute, error: lookupError } = await client.from("disputes").select("match_id").eq("id", input.disputeId).maybeSingle();
  if (lookupError) throw new Error(`[Supabase] Dispute lookup failed: ${lookupError.message}`);
  if (!dispute) return null;
  const { data, error } = await client.from("disputes").update({ status: "resolved", winner_team_id: input.winnerTeamId, admin_decision: input.adminDecision.trim(), resolved_by: input.resolvedBy, resolved_at: (/* @__PURE__ */ new Date()).toISOString() }).eq("id", input.disputeId).select().single();
  if (error) throw new Error(`[Supabase] Dispute resolution failed: ${error.message}`);
  const { error: matchError } = await client.from("matches").update({ status: "completed", winner_team_id: input.winnerTeamId }).eq("id", dispute.match_id);
  if (matchError) throw new Error(`[Supabase] Resolved match update failed: ${matchError.message}`);
  return camel(data);
}

// server/db.ts
var _db = null;
var isVitestRuntime = process.env.NODE_ENV === "test" || Boolean(process.env.VITEST_WORKER_ID) || process.argv.some((argument) => argument.includes("vitest"));
var shouldUseSupabaseDomain = () => !isVitestRuntime && hasSupabaseDomainClient();
async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      const { drizzle } = await import("drizzle-orm/mysql2");
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}
function normalizeSupabaseUserId(openId) {
  return openId.startsWith("supabase:") ? openId.slice("supabase:".length) : openId;
}
function mapSupabaseUser(row) {
  const supabaseUserId = String(row.supabase_user_id);
  return {
    id: Number(row.id),
    openId: `supabase:${supabaseUserId}`,
    name: row.name ?? null,
    email: row.email ?? null,
    loginMethod: "supabase",
    role: row.role ?? "user",
    lastSignedIn: new Date(String(row.last_signed_in)),
    createdAt: new Date(String(row.created_at)),
    updatedAt: new Date(String(row.updated_at))
  };
}
async function upsertUser(user) {
  if (!user.openId) throw new Error("User openId is required for upsert");
  if (shouldUseSupabaseDomain() && supabaseAdmin) {
    const row = {
      supabase_user_id: normalizeSupabaseUserId(user.openId),
      name: user.name ?? null,
      email: user.email ?? null,
      role: user.role ?? (user.openId === ENV.ownerOpenId ? "admin" : "user"),
      last_signed_in: (user.lastSignedIn ?? /* @__PURE__ */ new Date()).toISOString()
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
  const values = { openId: user.openId };
  const updateSet = {};
  const textFields = ["name", "email", "loginMethod"];
  for (const field of textFields) {
    if (user[field] === void 0) continue;
    const normalized = user[field] ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  }
  if (user.lastSignedIn !== void 0) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== void 0) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }
  values.lastSignedIn ??= /* @__PURE__ */ new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = /* @__PURE__ */ new Date();
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}
async function getUserByOpenId(openId) {
  if (shouldUseSupabaseDomain() && supabaseAdmin) {
    const { data, error } = await supabaseAdmin.from("users").select("*").eq("supabase_user_id", normalizeSupabaseUserId(openId)).maybeSingle();
    if (error) throw new Error(`[Supabase] Failed to load user: ${error.message}`);
    return data ? mapSupabaseUser(data) : void 0;
  }
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}
var fallbackTournaments = [
  {
    id: 101,
    name: "Neon Circuit: Open Qualifier",
    game: "VALORANT",
    format: "single_elimination",
    status: "registration",
    startsAt: /* @__PURE__ */ new Date("2026-09-12T18:00:00Z"),
    registrationClosesAt: /* @__PURE__ */ new Date("2026-09-10T18:00:00Z"),
    prizePoolCents: 25e4,
    maxTeams: 32,
    createdBy: 1,
    createdAt: /* @__PURE__ */ new Date(),
    updatedAt: /* @__PURE__ */ new Date()
  },
  {
    id: 102,
    name: "Meno Arena Clash #04",
    game: "Mobile Legends",
    format: "single_elimination",
    status: "live",
    startsAt: /* @__PURE__ */ new Date("2026-08-22T14:00:00Z"),
    registrationClosesAt: null,
    prizePoolCents: 5e5,
    maxTeams: 16,
    createdBy: 1,
    createdAt: /* @__PURE__ */ new Date(),
    updatedAt: /* @__PURE__ */ new Date()
  }
];
var fallbackTeams = [
  { id: 201, ownerId: 1, name: "Null Sector", tag: "NSEC", game: "VALORANT", region: "SEA", description: "Precision under pressure.", createdAt: /* @__PURE__ */ new Date(), updatedAt: /* @__PURE__ */ new Date() }
];
var fallbackMatches = [
  { id: 301, tournamentId: 102, round: 1, position: 1, homeTeamId: 201, awayTeamId: null, homeScore: 2, awayScore: 0, status: "live", scheduledAt: /* @__PURE__ */ new Date(), winnerTeamId: null, createdAt: /* @__PURE__ */ new Date(), updatedAt: /* @__PURE__ */ new Date() }
];
async function updatePlayerProfile(input) {
  if (shouldUseSupabaseDomain()) return supabaseUpdatePlayerProfile(input);
  const db = await getDb();
  const normalized = {
    userId: input.userId,
    handle: input.handle.trim().toUpperCase(),
    bio: input.bio?.trim() || null,
    region: input.region?.trim().toUpperCase() || null,
    primaryGame: input.primaryGame?.trim() || null
  };
  if (!db) return { ...normalized, id: 0, wins: 0, losses: 0, createdAt: /* @__PURE__ */ new Date(), updatedAt: /* @__PURE__ */ new Date() };
  await db.insert(playerProfiles).values(normalized).onDuplicateKeyUpdate({ set: { handle: normalized.handle, bio: normalized.bio, region: normalized.region, primaryGame: normalized.primaryGame } });
  const rows = await db.select().from(playerProfiles).where(eq(playerProfiles.userId, input.userId)).limit(1);
  return rows[0];
}
async function getPlayerDashboard(userId) {
  if (shouldUseSupabaseDomain()) return supabaseGetPlayerDashboard(userId);
  const db = await getDb();
  if (!db) {
    return {
      profile: { handle: "NOVA_PLAYER", bio: "Competing from the front line.", region: "SEA", primaryGame: "VALORANT", wins: 18, losses: 7 },
      teams: fallbackTeams,
      tournaments: fallbackTournaments,
      matches: fallbackMatches,
      clan: { name: "Axiom Collective", tag: "AXM", region: "SEA" }
    };
  }
  const [profileRows, memberships, tournamentRows, matchRows, ownedClans] = await Promise.all([
    db.select().from(playerProfiles).where(eq(playerProfiles.userId, userId)).limit(1),
    db.select({ team: teams }).from(teamMembers).innerJoin(teams, eq(teamMembers.teamId, teams.id)).where(eq(teamMembers.userId, userId)),
    db.select().from(tournaments).orderBy(desc(tournaments.startsAt)).limit(6),
    db.select().from(matches).orderBy(desc(matches.scheduledAt)).limit(8),
    db.select().from(clans).where(eq(clans.ownerId, userId)).limit(1)
  ]);
  return {
    profile: profileRows[0] ?? { handle: "NEW_PLAYER", bio: null, region: "SEA", primaryGame: "VALORANT", wins: 0, losses: 0 },
    teams: memberships.map((item) => item.team),
    tournaments: tournamentRows.length ? tournamentRows : fallbackTournaments,
    matches: matchRows.length ? matchRows : fallbackMatches,
    clan: ownedClans[0] ?? null
  };
}
async function getTeamsForUser(userId) {
  if (shouldUseSupabaseDomain()) return supabaseGetTeamsForUser(userId);
  const db = await getDb();
  if (!db) return fallbackTeams;
  const rows = await db.select({ team: teams }).from(teamMembers).innerJoin(teams, eq(teamMembers.teamId, teams.id)).where(eq(teamMembers.userId, userId));
  return rows.length ? rows.map((row) => row.team) : fallbackTeams;
}
async function createTeamForUser(input) {
  if (shouldUseSupabaseDomain()) return supabaseCreateTeam(input);
  const db = await getDb();
  if (!db) return { ...input, id: Date.now(), createdAt: /* @__PURE__ */ new Date(), updatedAt: /* @__PURE__ */ new Date() };
  const result = await db.insert(teams).values(input);
  const teamId = Number(result[0].insertId);
  await db.insert(teamMembers).values({ teamId, userId: input.ownerId, role: "captain" });
  const rows = await db.select().from(teams).where(eq(teams.id, teamId)).limit(1);
  return rows[0];
}
async function getTournamentById(tournamentId) {
  if (shouldUseSupabaseDomain()) return supabaseGetTournament(tournamentId);
  const db = await getDb();
  if (!db) return fallbackTournaments.find((tournament) => tournament.id === tournamentId) ?? null;
  const rows = await db.select().from(tournaments).where(eq(tournaments.id, tournamentId)).limit(1);
  return rows[0] ?? null;
}
async function getTournamentMatches(tournamentId) {
  if (shouldUseSupabaseDomain()) return supabaseGetTournamentMatches(tournamentId);
  const db = await getDb();
  if (!db) return fallbackMatches.filter((match) => match.tournamentId === tournamentId);
  const rows = await db.select().from(matches).where(eq(matches.tournamentId, tournamentId)).orderBy(matches.round, matches.position);
  return rows;
}
var fallbackClans = [
  { id: 401, ownerId: 1, name: "Axiom Collective", tag: "AXM", region: "SEA", bio: "A multi-title competitive collective built for high-pressure rooms.", foundedYear: 2022, socials: "discord.com/axiom", createdAt: /* @__PURE__ */ new Date(), updatedAt: /* @__PURE__ */ new Date() }
];
async function getClansForUser(userId) {
  if (shouldUseSupabaseDomain()) return supabaseGetClansForUser(userId);
  const db = await getDb();
  if (!db) return fallbackClans;
  const rows = await db.select().from(clans).where(eq(clans.ownerId, userId)).orderBy(desc(clans.createdAt));
  return rows.length ? rows : fallbackClans;
}
async function createClanForUser(input) {
  if (shouldUseSupabaseDomain()) return supabaseCreateClan(input);
  const db = await getDb();
  const values = {
    ownerId: input.ownerId,
    name: input.name.trim(),
    tag: input.tag.trim().toUpperCase(),
    region: input.region?.trim().toUpperCase() || null,
    bio: input.bio?.trim() || null,
    foundedYear: input.foundedYear ?? null,
    socials: input.socials?.trim() || null
  };
  if (!db) return { ...values, id: Date.now(), createdAt: /* @__PURE__ */ new Date(), updatedAt: /* @__PURE__ */ new Date() };
  const result = await db.insert(clans).values(values);
  const clanId = Number(result[0].insertId);
  await db.insert(clanMembers).values({ clanId, userId: input.ownerId, role: "owner" });
  const rows = await db.select().from(clans).where(eq(clans.id, clanId)).limit(1);
  return rows[0];
}
async function getClanDashboard(clanId, userId) {
  if (shouldUseSupabaseDomain()) return supabaseGetClanDashboard(clanId, userId);
  const db = await getDb();
  if (!db) return { clan: fallbackClans.find((clan) => clan.id === clanId) ?? null, teams: fallbackTeams };
  const clanRows = await db.select().from(clans).where(and(eq(clans.id, clanId), eq(clans.ownerId, userId))).limit(1);
  if (!clanRows[0]) return { clan: null, teams: [] };
  const teamRows = await db.select({ team: teams }).from(clanTeams).innerJoin(teams, eq(clanTeams.teamId, teams.id)).where(eq(clanTeams.clanId, clanId));
  return { clan: clanRows[0], teams: teamRows.map((row) => row.team) };
}
async function createTournamentForUser(input) {
  if (shouldUseSupabaseDomain()) return supabaseCreateTournament(input);
  const db = await getDb();
  const values = {
    createdBy: input.createdBy,
    name: input.name.trim(),
    game: input.game.trim(),
    format: input.format,
    status: "registration",
    startsAt: input.startsAt,
    registrationClosesAt: input.registrationClosesAt ?? null,
    prizePoolCents: input.prizePoolCents ?? 0,
    entryFeeCents: input.entryFeeCents ?? 0,
    maxTeams: input.maxTeams ?? 16,
    rules: input.rules?.trim() || null,
    sponsorName: input.sponsorName?.trim() || null,
    streamUrl: input.streamUrl?.trim() || null,
    clanEligible: input.clanEligible ? 1 : 0
  };
  if (!db) return { ...values, id: Date.now(), createdAt: /* @__PURE__ */ new Date(), updatedAt: /* @__PURE__ */ new Date() };
  const result = await db.insert(tournaments).values(values);
  const tournamentId = Number(result[0].insertId);
  const rows = await db.select().from(tournaments).where(eq(tournaments.id, tournamentId)).limit(1);
  return rows[0];
}
async function submitMatchReport(input) {
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
    status: "waiting_confirmation"
  };
  if (!db) return { ...values, id: Date.now(), createdAt: /* @__PURE__ */ new Date(), updatedAt: /* @__PURE__ */ new Date() };
  const result = await db.insert(matchReports).values(values);
  await db.update(matches).set({ status: "waiting" }).where(eq(matches.id, input.matchId));
  const reportId = Number(result[0].insertId);
  const rows = await db.select().from(matchReports).where(eq(matchReports.id, reportId)).limit(1);
  return rows[0];
}
async function openMatchDispute(input) {
  if (shouldUseSupabaseDomain()) return supabaseOpenDispute(input);
  const db = await getDb();
  const values = { matchId: input.matchId, openedBy: input.openedBy, reason: input.reason.trim(), status: "open" };
  if (!db) return { ...values, id: Date.now(), adminDecision: null, winnerTeamId: null, resolvedBy: null, resolvedAt: null, createdAt: /* @__PURE__ */ new Date(), updatedAt: /* @__PURE__ */ new Date() };
  const result = await db.insert(disputes).values(values);
  await db.update(matches).set({ status: "disputed" }).where(eq(matches.id, input.matchId));
  const disputeId = Number(result[0].insertId);
  const rows = await db.select().from(disputes).where(eq(disputes.id, disputeId)).limit(1);
  return rows[0];
}
async function getOpenDisputes() {
  if (shouldUseSupabaseDomain()) return supabaseGetOpenDisputes();
  const db = await getDb();
  if (!db) return [];
  return db.select().from(disputes).where(eq(disputes.status, "open")).orderBy(desc(disputes.createdAt));
}
async function resolveMatchDispute(input) {
  if (shouldUseSupabaseDomain()) return supabaseResolveDispute(input);
  const db = await getDb();
  if (!db) return { ...input, status: "resolved", resolvedAt: /* @__PURE__ */ new Date() };
  const disputeRows = await db.select().from(disputes).where(eq(disputes.id, input.disputeId)).limit(1);
  const dispute = disputeRows[0];
  if (!dispute) return null;
  await db.update(disputes).set({ status: "resolved", winnerTeamId: input.winnerTeamId, adminDecision: input.adminDecision.trim(), resolvedBy: input.resolvedBy, resolvedAt: /* @__PURE__ */ new Date() }).where(eq(disputes.id, input.disputeId));
  await db.update(matches).set({ status: "completed", winnerTeamId: input.winnerTeamId }).where(eq(matches.id, dispute.matchId));
  const rows = await db.select().from(disputes).where(eq(disputes.id, input.disputeId)).limit(1);
  return rows[0];
}

// server/_core/cookies.ts
function isSecureRequest(req) {
  if (req.protocol === "https") return true;
  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;
  const protoList = Array.isArray(forwardedProto) ? forwardedProto : forwardedProto.split(",");
  return protoList.some((proto) => proto.trim().toLowerCase() === "https");
}
function getSessionCookieOptions(req) {
  return {
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: isSecureRequest(req)
  };
}

// shared/_core/errors.ts
var HttpError = class extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.name = "HttpError";
  }
};
var ForbiddenError = (msg) => new HttpError(403, msg);

// server/_core/sdk.ts
import axios from "axios";
import { parse as parseCookieHeader } from "cookie";
import { SignJWT, jwtVerify } from "jose";
var isNonEmptyString = (value) => typeof value === "string" && value.length > 0;
var EXCHANGE_TOKEN_PATH = `/webdev.v1.WebDevAuthPublicService/ExchangeToken`;
var GET_USER_INFO_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfo`;
var GET_USER_INFO_WITH_JWT_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfoWithJwt`;
var OAuthService = class {
  constructor(client) {
    this.client = client;
    console.log("[OAuth] Initialized with baseURL:", ENV.oAuthServerUrl);
    if (!ENV.oAuthServerUrl) {
      console.error(
        "[OAuth] ERROR: OAUTH_SERVER_URL is not configured! Set OAUTH_SERVER_URL environment variable."
      );
    }
  }
  decodeState(state) {
    return decodeOAuthState(state).redirectUri;
  }
  async getTokenByCode(code, state) {
    const payload = {
      clientId: ENV.appId,
      grantType: "authorization_code",
      code,
      redirectUri: this.decodeState(state)
    };
    const { data } = await this.client.post(
      EXCHANGE_TOKEN_PATH,
      payload
    );
    return data;
  }
  async getUserInfoByToken(token) {
    const { data } = await this.client.post(
      GET_USER_INFO_PATH,
      {
        accessToken: token.accessToken
      }
    );
    return data;
  }
};
var createOAuthHttpClient = () => axios.create({
  baseURL: ENV.oAuthServerUrl,
  timeout: AXIOS_TIMEOUT_MS
});
var SDKServer = class {
  client;
  oauthService;
  constructor(client = createOAuthHttpClient()) {
    this.client = client;
    this.oauthService = new OAuthService(this.client);
  }
  deriveLoginMethod(platforms, fallback) {
    if (fallback && fallback.length > 0) return fallback;
    if (!Array.isArray(platforms) || platforms.length === 0) return null;
    const set = new Set(
      platforms.filter((p) => typeof p === "string")
    );
    if (set.has("REGISTERED_PLATFORM_EMAIL")) return "email";
    if (set.has("REGISTERED_PLATFORM_GOOGLE")) return "google";
    if (set.has("REGISTERED_PLATFORM_APPLE")) return "apple";
    if (set.has("REGISTERED_PLATFORM_MICROSOFT") || set.has("REGISTERED_PLATFORM_AZURE"))
      return "microsoft";
    if (set.has("REGISTERED_PLATFORM_GITHUB")) return "github";
    const first = Array.from(set)[0];
    return first ? first.toLowerCase() : null;
  }
  /**
   * Exchange OAuth authorization code for access token
   * @example
   * const tokenResponse = await sdk.exchangeCodeForToken(code, state);
   */
  async exchangeCodeForToken(code, state) {
    return this.oauthService.getTokenByCode(code, state);
  }
  /**
   * Get user information using access token
   * @example
   * const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
   */
  async getUserInfo(accessToken) {
    const data = await this.oauthService.getUserInfoByToken({
      accessToken
    });
    const loginMethod = this.deriveLoginMethod(
      data?.platforms,
      data?.platform ?? data.platform ?? null
    );
    return {
      ...data,
      platform: loginMethod,
      loginMethod
    };
  }
  parseCookies(cookieHeader) {
    if (!cookieHeader) {
      return /* @__PURE__ */ new Map();
    }
    const parsed = parseCookieHeader(cookieHeader);
    return new Map(Object.entries(parsed));
  }
  getSessionSecret() {
    const secret = ENV.cookieSecret;
    return new TextEncoder().encode(secret);
  }
  /**
   * Create a session token for a Manus user openId
   * @example
   * const sessionToken = await sdk.createSessionToken(userInfo.openId);
   */
  async createSessionToken(openId, options = {}) {
    return this.signSession(
      {
        openId,
        appId: ENV.appId,
        name: options.name || ""
      },
      options
    );
  }
  async signSession(payload, options = {}) {
    const issuedAt = Date.now();
    const expiresInMs = options.expiresInMs ?? ONE_YEAR_MS;
    const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1e3);
    const secretKey = this.getSessionSecret();
    return new SignJWT({
      openId: payload.openId,
      appId: payload.appId,
      name: payload.name
    }).setProtectedHeader({ alg: "HS256", typ: "JWT" }).setExpirationTime(expirationSeconds).sign(secretKey);
  }
  async verifySession(cookieValue) {
    if (!cookieValue) {
      console.warn("[Auth] Missing session cookie");
      return null;
    }
    try {
      const secretKey = this.getSessionSecret();
      const { payload } = await jwtVerify(cookieValue, secretKey, {
        algorithms: ["HS256"]
      });
      const { openId, appId, name } = payload;
      if (!isNonEmptyString(openId) || !isNonEmptyString(appId) || !isNonEmptyString(name)) {
        console.warn("[Auth] Session payload missing required fields");
        return null;
      }
      return {
        openId,
        appId,
        name
      };
    } catch (error) {
      console.warn("[Auth] Session verification failed", String(error));
      return null;
    }
  }
  async getUserInfoWithJwt(jwtToken) {
    const payload = {
      jwtToken,
      projectId: ENV.appId
    };
    const { data } = await this.client.post(
      GET_USER_INFO_WITH_JWT_PATH,
      payload
    );
    const loginMethod = this.deriveLoginMethod(
      data?.platforms,
      data?.platform ?? data.platform ?? null
    );
    return {
      ...data,
      platform: loginMethod,
      loginMethod
    };
  }
  async authenticateRequest(req) {
    const cookies = this.parseCookies(req.headers.cookie);
    let sessionToken = cookies.get(COOKIE_NAME);
    if (!sessionToken) {
      const authHeader = req.headers.authorization;
      if (typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
        sessionToken = authHeader.slice(7);
      }
    }
    const session = await this.verifySession(sessionToken);
    if (!session) {
      throw ForbiddenError("Invalid session cookie");
    }
    if (session.openId.startsWith(CRON_OPEN_ID_PREFIX)) {
      const userInfo = await this.getUserInfoWithJwt(sessionToken ?? "");
      const taskUid = userInfo.taskUid ?? null;
      if (!taskUid) {
        throw ForbiddenError("Cron session missing task_uid");
      }
      return buildCronUser(userInfo);
    }
    const sessionUserId = session.openId;
    const signedInAt = /* @__PURE__ */ new Date();
    let user = await getUserByOpenId(sessionUserId);
    if (!user) {
      try {
        const userInfo = await this.getUserInfoWithJwt(sessionToken ?? "");
        await upsertUser({
          openId: userInfo.openId,
          name: userInfo.name || null,
          email: userInfo.email ?? null,
          loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
          lastSignedIn: signedInAt
        });
        user = await getUserByOpenId(userInfo.openId);
      } catch (error) {
        console.error("[Auth] Failed to sync user from OAuth:", error);
        throw ForbiddenError("Failed to sync user info");
      }
    }
    if (!user) {
      throw ForbiddenError("User not found");
    }
    await upsertUser({
      openId: user.openId,
      lastSignedIn: signedInAt
    });
    return user;
  }
};
var CRON_OPEN_ID_PREFIX = "cron_";
function buildCronUser(userInfo) {
  const now = /* @__PURE__ */ new Date();
  return {
    id: -1,
    openId: userInfo.openId,
    name: userInfo.name || "Manus Scheduled Task",
    email: null,
    loginMethod: null,
    role: "user",
    createdAt: now,
    updatedAt: now,
    lastSignedIn: now,
    taskUid: userInfo.taskUid ?? void 0,
    isCron: true
  };
}
var sdk = new SDKServer();

// server/_core/oauth.ts
function getQueryParam(req, key) {
  const value = req.query[key];
  return typeof value === "string" ? value : void 0;
}
function registerOAuthRoutes(app2) {
  app2.get("/api/oauth/callback", async (req, res) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");
    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }
    const { nonce } = decodeOAuthState(state);
    const expectedNonce = parseCookieHeader2(req.headers.cookie ?? "")[OAUTH_STATE_COOKIE];
    if (!nonce || nonce !== expectedNonce) {
      res.status(403).json({ error: "invalid oauth state" });
      return;
    }
    res.clearCookie(OAUTH_STATE_COOKIE, { path: "/", secure: true, sameSite: "none" });
    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }
      await upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: /* @__PURE__ */ new Date()
      });
      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS
      });
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      res.redirect(302, "/");
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}

// server/_core/storageProxy.ts
function registerStorageProxy(app2) {
  app2.get("/manus-storage/*", async (req, res) => {
    const key = req.params[0];
    if (!key) {
      res.status(400).send("Missing storage key");
      return;
    }
    if (!ENV.forgeApiUrl || !ENV.forgeApiKey) {
      res.status(500).send("Storage proxy not configured");
      return;
    }
    try {
      const forgeUrl = new URL(
        "v1/storage/presign/get",
        ENV.forgeApiUrl.replace(/\/+$/, "") + "/"
      );
      forgeUrl.searchParams.set("path", key);
      const forgeResp = await fetch(forgeUrl, {
        headers: { Authorization: `Bearer ${ENV.forgeApiKey}` }
      });
      if (!forgeResp.ok) {
        const body = await forgeResp.text().catch(() => "");
        console.error(`[StorageProxy] forge error: ${forgeResp.status} ${body}`);
        res.status(502).send("Storage backend error");
        return;
      }
      const { url: url2 } = await forgeResp.json();
      if (!url2) {
        res.status(502).send("Empty signed URL from backend");
        return;
      }
      res.set("Cache-Control", "no-store");
      res.redirect(307, url2);
    } catch (err) {
      console.error("[StorageProxy] failed:", err);
      res.status(502).send("Storage proxy error");
    }
  });
}

// server/routers.ts
import { z as z2 } from "zod";
import { TRPCError as TRPCError3 } from "@trpc/server";

// server/_core/systemRouter.ts
import { z } from "zod";

// server/_core/notification.ts
import { TRPCError } from "@trpc/server";
var TITLE_MAX_LENGTH = 1200;
var CONTENT_MAX_LENGTH = 2e4;
var trimValue = (value) => value.trim();
var isNonEmptyString2 = (value) => typeof value === "string" && value.trim().length > 0;
var buildEndpointUrl = (baseUrl) => {
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return new URL(
    "webdevtoken.v1.WebDevService/SendNotification",
    normalizedBase
  ).toString();
};
var validatePayload = (input) => {
  if (!isNonEmptyString2(input.title)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification title is required."
    });
  }
  if (!isNonEmptyString2(input.content)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification content is required."
    });
  }
  const title = trimValue(input.title);
  const content = trimValue(input.content);
  if (title.length > TITLE_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification title must be at most ${TITLE_MAX_LENGTH} characters.`
    });
  }
  if (content.length > CONTENT_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification content must be at most ${CONTENT_MAX_LENGTH} characters.`
    });
  }
  return { title, content };
};
async function notifyOwner(payload) {
  const { title, content } = validatePayload(payload);
  if (!ENV.forgeApiUrl) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service URL is not configured."
    });
  }
  if (!ENV.forgeApiKey) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service API key is not configured."
    });
  }
  const endpoint = buildEndpointUrl(ENV.forgeApiUrl);
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${ENV.forgeApiKey}`,
        "content-type": "application/json",
        "connect-protocol-version": "1"
      },
      body: JSON.stringify({ title, content })
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.warn(
        `[Notification] Failed to notify owner (${response.status} ${response.statusText})${detail ? `: ${detail}` : ""}`
      );
      return false;
    }
    return true;
  } catch (error) {
    console.warn("[Notification] Error calling notification service:", error);
    return false;
  }
}

// server/_core/trpc.ts
import { initTRPC, TRPCError as TRPCError2 } from "@trpc/server";
import superjson from "superjson";
var t = initTRPC.context().create({
  transformer: superjson
});
var router = t.router;
var publicProcedure = t.procedure;
var requireUser = t.middleware(async (opts) => {
  const { ctx, next } = opts;
  if (!ctx.user) {
    throw new TRPCError2({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user
    }
  });
});
var protectedProcedure = t.procedure.use(requireUser);
var adminProcedure = t.procedure.use(
  t.middleware(async (opts) => {
    const { ctx, next } = opts;
    if (!ctx.user || ctx.user.role !== "admin") {
      throw new TRPCError2({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }
    return next({
      ctx: {
        ...ctx,
        user: ctx.user
      }
    });
  })
);

// server/_core/systemRouter.ts
var systemRouter = router({
  health: publicProcedure.input(
    z.object({
      timestamp: z.number().min(0, "timestamp cannot be negative")
    })
  ).query(() => ({
    ok: true
  })),
  notifyOwner: adminProcedure.input(
    z.object({
      title: z.string().min(1, "title is required"),
      content: z.string().min(1, "content is required")
    })
  ).mutation(async ({ input }) => {
    const delivered = await notifyOwner(input);
    return {
      success: delivered
    };
  })
});

// server/routers.ts
var adminProcedure2 = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") throw new TRPCError3({ code: "FORBIDDEN", message: "Admin access required." });
  return next({ ctx });
});
var appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true };
    })
  }),
  dashboard: router({
    player: protectedProcedure.query(({ ctx }) => getPlayerDashboard(ctx.user.id)),
    updateProfile: protectedProcedure.input(z2.object({ handle: z2.string().min(2).max(48), bio: z2.string().max(500).optional(), region: z2.string().max(64).optional(), primaryGame: z2.string().max(64).optional() })).mutation(({ ctx, input }) => updatePlayerProfile({ ...input, userId: ctx.user.id }))
  }),
  clans: router({
    mine: protectedProcedure.query(({ ctx }) => getClansForUser(ctx.user.id)),
    dashboard: protectedProcedure.input(z2.object({ clanId: z2.number().int().positive() })).query(({ ctx, input }) => getClanDashboard(input.clanId, ctx.user.id)),
    create: protectedProcedure.input(z2.object({
      name: z2.string().min(2).max(80),
      tag: z2.string().min(2).max(12),
      region: z2.string().max(64).optional(),
      bio: z2.string().max(500).optional(),
      foundedYear: z2.number().int().min(1900).max(2100).optional(),
      socials: z2.string().max(500).optional()
    })).mutation(({ ctx, input }) => createClanForUser({ ...input, ownerId: ctx.user.id }))
  }),
  teams: router({
    mine: protectedProcedure.query(({ ctx }) => getTeamsForUser(ctx.user.id)),
    create: protectedProcedure.input(z2.object({
      name: z2.string().min(2).max(80),
      tag: z2.string().min(2).max(12),
      game: z2.string().min(2).max(64),
      region: z2.string().max(64).optional(),
      description: z2.string().max(500).optional()
    })).mutation(({ ctx, input }) => createTeamForUser({ ...input, ownerId: ctx.user.id }))
  }),
  tournaments: router({
    create: protectedProcedure.input(z2.object({
      name: z2.string().min(3).max(120),
      game: z2.string().min(2).max(64),
      format: z2.enum(["single_elimination", "double_elimination", "round_robin", "swiss"]),
      startsAt: z2.coerce.date(),
      registrationClosesAt: z2.coerce.date().optional(),
      prizePoolCents: z2.number().int().min(0).max(1e8).optional(),
      entryFeeCents: z2.number().int().min(0).max(1e7).optional(),
      maxTeams: z2.number().int().min(2).max(256).optional(),
      rules: z2.string().max(5e3).optional(),
      sponsorName: z2.string().max(120).optional(),
      streamUrl: z2.string().url().max(500).optional().or(z2.literal("")),
      clanEligible: z2.boolean().optional()
    })).mutation(({ ctx, input }) => createTournamentForUser({ ...input, createdBy: ctx.user.id })),
    byId: protectedProcedure.input(z2.object({ tournamentId: z2.number().int().positive() })).query(({ input }) => getTournamentById(input.tournamentId))
  }),
  matches: router({
    report: protectedProcedure.input(z2.object({ matchId: z2.number().int().positive(), teamId: z2.number().int().positive(), scoreFor: z2.number().int().min(0).max(99), scoreAgainst: z2.number().int().min(0).max(99), screenshotUrl: z2.string().url().max(500).optional().or(z2.literal("")), notes: z2.string().max(1e3).optional() })).mutation(({ ctx, input }) => submitMatchReport({ ...input, submittedBy: ctx.user.id })),
    openDispute: protectedProcedure.input(z2.object({ matchId: z2.number().int().positive(), reason: z2.string().min(10).max(1e3) })).mutation(({ ctx, input }) => openMatchDispute({ ...input, openedBy: ctx.user.id })),
    disputes: router({
      open: adminProcedure2.query(() => getOpenDisputes()),
      resolve: adminProcedure2.input(z2.object({ disputeId: z2.number().int().positive(), winnerTeamId: z2.number().int().positive(), adminDecision: z2.string().min(10).max(1e3) })).mutation(({ ctx, input }) => resolveMatchDispute({ ...input, resolvedBy: ctx.user.id }))
    }),
    matches: protectedProcedure.input(z2.object({ tournamentId: z2.number().int().positive() })).query(({ input }) => getTournamentMatches(input.tournamentId))
  })
});

// server/_core/supabase.ts
import { createClient as createClient2 } from "@supabase/supabase-js";
var supabaseUrl = process.env.VITE_SUPABASE_URL ?? "";
var supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY ?? "";
function createOptionalSupabaseClient(url2, key) {
  if (!url2 || !key) return null;
  try {
    new URL(url2);
    return createClient2(url2, key, {
      auth: { persistSession: false, autoRefreshToken: false }
    });
  } catch (error) {
    console.warn("[Supabase] Ignoring invalid server client configuration", error);
    return null;
  }
}
var supabase = createOptionalSupabaseClient(supabaseUrl, supabaseAnonKey);
async function authenticateSupabaseToken(token) {
  if (!supabase || !token) return null;
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;
  const authUser = data.user;
  const openId = `supabase:${authUser.id}`;
  await upsertUser({
    openId,
    name: authUser.user_metadata?.full_name ?? authUser.user_metadata?.name ?? authUser.email ?? "Meno Arena player",
    email: authUser.email ?? null,
    loginMethod: "supabase",
    lastSignedIn: /* @__PURE__ */ new Date()
  });
  return await getUserByOpenId(openId) ?? null;
}

// server/_core/context.ts
async function createContext(opts) {
  let user = null;
  const authorization = opts.req.headers.authorization;
  const bearerToken = authorization?.startsWith("Bearer ") ? authorization.slice("Bearer ".length) : null;
  try {
    user = bearerToken ? await authenticateSupabaseToken(bearerToken) : null;
    if (!user) user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    user = null;
  }
  return {
    req: opts.req,
    res: opts.res,
    user
  };
}

// server/_core/app.ts
function createConfiguredApp(trpcPath) {
  const app2 = express();
  app2.use(express.json({ limit: "50mb" }));
  app2.use(express.urlencoded({ limit: "50mb", extended: true }));
  registerStorageProxy(app2);
  registerOAuthRoutes(app2);
  app2.use(
    trpcPath,
    createExpressMiddleware({
      router: appRouter,
      createContext
    })
  );
  return app2;
}
function createVercelApiApp() {
  return createConfiguredApp("/");
}

// api/trpc-entry.ts
var app;
function handler(req, res) {
  try {
    app ??= createVercelApiApp();
    const originalUrl = req.url ?? "/";
    req.url = originalUrl.replace(/^\/api\/trpc/, "") || "/";
    return app(req, res);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[Vercel tRPC] App initialization failed", error);
    res.statusCode = 500;
    res.setHeader("content-type", "application/json");
    res.end(JSON.stringify({ error: "Vercel tRPC app initialization failed", message }));
  }
}
export {
  handler as default
};
