import {
  int,
  mysqlEnum,
  mysqlTable,
  primaryKey,
  text,
  timestamp,
  unique,
  varchar,
} from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const playerProfiles = mysqlTable(
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
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({ userUnique: unique("player_profiles_user_unique").on(table.userId) }),
);

export type PlayerProfile = typeof playerProfiles.$inferSelect;
export type InsertPlayerProfile = typeof playerProfiles.$inferInsert;

export const teams = mysqlTable("teams", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  name: varchar("name", { length: 80 }).notNull(),
  tag: varchar("tag", { length: 12 }).notNull(),
  game: varchar("game", { length: 64 }).notNull(),
  region: varchar("region", { length: 64 }),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Team = typeof teams.$inferSelect;
export type InsertTeam = typeof teams.$inferInsert;

export const teamMembers = mysqlTable(
  "team_members",
  {
    teamId: int("teamId").notNull(),
    userId: int("userId").notNull(),
    role: mysqlEnum("role", ["captain", "player", "manager"]).default("player").notNull(),
    joinedAt: timestamp("joinedAt").defaultNow().notNull(),
  },
  table => ({ pk: primaryKey({ columns: [table.teamId, table.userId] }) }),
);

export type TeamMember = typeof teamMembers.$inferSelect;
export type InsertTeamMember = typeof teamMembers.$inferInsert;

export const clans = mysqlTable("clans", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  name: varchar("name", { length: 80 }).notNull(),
  tag: varchar("tag", { length: 12 }).notNull(),
  region: varchar("region", { length: 64 }),
  bio: text("bio"),
  foundedYear: int("foundedYear"),
  socials: text("socials"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Clan = typeof clans.$inferSelect;
export type InsertClan = typeof clans.$inferInsert;

export const clanTeams = mysqlTable(
  "clan_teams",
  {
    clanId: int("clanId").notNull(),
    teamId: int("teamId").notNull(),
    addedAt: timestamp("addedAt").defaultNow().notNull(),
  },
  table => ({ pk: primaryKey({ columns: [table.clanId, table.teamId] }) }),
);

export type ClanTeam = typeof clanTeams.$inferSelect;
export type InsertClanTeam = typeof clanTeams.$inferInsert;

export const clanMembers = mysqlTable(
  "clan_members",
  {
    clanId: int("clanId").notNull(),
    userId: int("userId").notNull(),
    role: mysqlEnum("role", ["owner", "manager", "scout", "member"]).default("member").notNull(),
    joinedAt: timestamp("joinedAt").defaultNow().notNull(),
  },
  table => ({ pk: primaryKey({ columns: [table.clanId, table.userId] }) }),
);

export type ClanMember = typeof clanMembers.$inferSelect;
export type InsertClanMember = typeof clanMembers.$inferInsert;

export const tournaments = mysqlTable("tournaments", {
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
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Tournament = typeof tournaments.$inferSelect;
export type InsertTournament = typeof tournaments.$inferInsert;

export const tournamentRegistrations = mysqlTable(
  "tournament_registrations",
  {
    id: int("id").autoincrement().primaryKey(),
    tournamentId: int("tournamentId").notNull(),
    teamId: int("teamId").notNull(),
    registeredBy: int("registeredBy").notNull(),
    status: mysqlEnum("status", ["pending", "confirmed", "checked_in", "withdrawn"]).default("pending").notNull(),
    acceptedRulesAt: timestamp("acceptedRulesAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({ uniqueRegistration: unique("tournament_team_unique").on(table.tournamentId, table.teamId) }),
);

export type TournamentRegistration = typeof tournamentRegistrations.$inferSelect;
export type InsertTournamentRegistration = typeof tournamentRegistrations.$inferInsert;

export const matches = mysqlTable("matches", {
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
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Match = typeof matches.$inferSelect;
export type InsertMatch = typeof matches.$inferInsert;

export const matchReports = mysqlTable("match_reports", {
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
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MatchReport = typeof matchReports.$inferSelect;
export type InsertMatchReport = typeof matchReports.$inferInsert;

export const disputes = mysqlTable("disputes", {
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
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Dispute = typeof disputes.$inferSelect;
export type InsertDispute = typeof disputes.$inferInsert;

export const usersRelations = relations(users, ({ one, many }) => ({
  profile: one(playerProfiles, { fields: [users.id], references: [playerProfiles.userId] }),
  teams: many(teamMembers),
  ownedTeams: many(teams),
  ownedClans: many(clans),
  clanMemberships: many(clanMembers),
  createdTournaments: many(tournaments),
}));

export const teamsRelations = relations(teams, ({ one, many }) => ({
  owner: one(users, { fields: [teams.ownerId], references: [users.id] }),
  members: many(teamMembers),
  clanLinks: many(clanTeams),
  registrations: many(tournamentRegistrations),
  submittedReports: many(matchReports),
}));

export const clansRelations = relations(clans, ({ one, many }) => ({
  owner: one(users, { fields: [clans.ownerId], references: [users.id] }),
  teams: many(clanTeams),
  members: many(clanMembers),
}));

export const tournamentsRelations = relations(tournaments, ({ one, many }) => ({
  creator: one(users, { fields: [tournaments.createdBy], references: [users.id] }),
  matches: many(matches),
  registrations: many(tournamentRegistrations),
}));

export const matchesRelations = relations(matches, ({ one, many }) => ({
  tournament: one(tournaments, { fields: [matches.tournamentId], references: [tournaments.id] }),
  homeTeam: one(teams, { fields: [matches.homeTeamId], references: [teams.id] }),
  awayTeam: one(teams, { fields: [matches.awayTeamId], references: [teams.id] }),
  winner: one(teams, { fields: [matches.winnerTeamId], references: [teams.id] }),
  reports: many(matchReports),
  disputes: many(disputes),
}));

export const teamMembersRelations = relations(teamMembers, ({ one }) => ({
  team: one(teams, { fields: [teamMembers.teamId], references: [teams.id] }),
  user: one(users, { fields: [teamMembers.userId], references: [users.id] }),
}));

export const clanTeamsRelations = relations(clanTeams, ({ one }) => ({
  clan: one(clans, { fields: [clanTeams.clanId], references: [clans.id] }),
  team: one(teams, { fields: [clanTeams.teamId], references: [teams.id] }),
}));

export const clanMembersRelations = relations(clanMembers, ({ one }) => ({
  clan: one(clans, { fields: [clanMembers.clanId], references: [clans.id] }),
  user: one(users, { fields: [clanMembers.userId], references: [users.id] }),
}));

export const tournamentRegistrationsRelations = relations(tournamentRegistrations, ({ one }) => ({
  tournament: one(tournaments, { fields: [tournamentRegistrations.tournamentId], references: [tournaments.id] }),
  team: one(teams, { fields: [tournamentRegistrations.teamId], references: [teams.id] }),
  registeredByUser: one(users, { fields: [tournamentRegistrations.registeredBy], references: [users.id] }),
}));

export const matchReportsRelations = relations(matchReports, ({ one }) => ({
  match: one(matches, { fields: [matchReports.matchId], references: [matches.id] }),
  submitter: one(users, { fields: [matchReports.submittedBy], references: [users.id] }),
  team: one(teams, { fields: [matchReports.teamId], references: [teams.id] }),
}));

export const disputesRelations = relations(disputes, ({ one }) => ({
  match: one(matches, { fields: [disputes.matchId], references: [matches.id] }),
  opener: one(users, { fields: [disputes.openedBy], references: [users.id] }),
  resolver: one(users, { fields: [disputes.resolvedBy], references: [users.id] }),
  winner: one(teams, { fields: [disputes.winnerTeamId], references: [teams.id] }),
}));

export const schema = {
  users,
  playerProfiles,
  teams,
  teamMembers,
  clans,
  clanTeams,
  clanMembers,
  tournaments,
  tournamentRegistrations,
  matches,
  matchReports,
  disputes,
};
