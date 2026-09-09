import { describe, expect, it } from "vitest";
import type { TrpcContext } from "./_core/context";
import { appRouter } from "./routers";
import { seedTeams, seedTournaments } from "./seed/data";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function context(user: AuthenticatedUser | null = null): TrpcContext {
  return { user, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: {} as TrpcContext["res"] };
}

function user(role: "user" | "admin" = "user", id = 7): AuthenticatedUser {
  return { id, openId: `contracts-${id}`, email: `contracts-${id}@example.com`, name: "Contracts", loginMethod: "manus", role, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() };
}

const publicCaller = appRouter.createCaller(context());
const liveId = seedTournaments.findIndex(row => row.key === "nightfall-val") + 1;
const completedId = seedTournaments.findIndex(row => row.key === "clash-03") + 1;

describe("competition router contracts", () => {
  it("exposes the tournament, match, prize, payment, and game procedures", () => {
    const names = Object.keys(appRouter._def.procedures);
    expect(names).toEqual(expect.arrayContaining([
      "tournaments.list", "tournaments.featured", "tournaments.byId", "tournaments.mine", "tournaments.create", "tournaments.update", "tournaments.setStatus",
      "tournaments.register", "tournaments.withdraw", "tournaments.checkIn", "tournaments.generateBracket", "tournaments.standings", "tournaments.nextSwissRound",
      "tournaments.announcements.list", "tournaments.announcements.create",
      "matches.byId", "matches.byTournament", "matches.matches", "matches.report", "matches.confirm", "matches.setLive", "matches.schedule", "matches.openDispute",
      "matches.disputes.open", "matches.disputes.mine", "matches.disputes.resolve",
      "prizes.breakdown", "prizes.payouts", "prizes.setPayoutStatus",
      "payments.mine", "payments.sandboxCharge",
      "games.list", "games.hub",
    ]));
  });

  it("guards protected and admin procedures", async () => {
    await expect(publicCaller.tournaments.mine()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(publicCaller.payments.mine()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(appRouter.createCaller(context(user("user"))).matches.disputes.open()).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(appRouter.createCaller(context(user("user"))).prizes.setPayoutStatus({ payoutId: 1, status: "paid" })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("validates inputs before touching persistence", async () => {
    const caller = appRouter.createCaller(context(user()));
    await expect(caller.tournaments.byId({ tournamentId: 0 })).rejects.toThrow();
    await expect(caller.tournaments.register({ tournamentId: 1, teamId: 1, acceptRules: false as unknown as true })).rejects.toThrow();
    await expect(caller.tournaments.create({ name: "ab", game: "Valorant", format: "single_elimination", startsAt: new Date() })).rejects.toThrow();
    await expect(caller.matches.schedule({ matchId: -1, scheduledAt: new Date() })).rejects.toThrow();
    await expect(caller.games.hub({ slug: "" })).rejects.toThrow();
  });

  it("fails clearly when a mutation needs the database", async () => {
    const caller = appRouter.createCaller(context(user()));
    await expect(caller.tournaments.register({ tournamentId: liveId, teamId: 1, acceptRules: true })).rejects.toMatchObject({ code: "PRECONDITION_FAILED" });
    await expect(caller.tournaments.generateBracket({ tournamentId: liveId })).rejects.toMatchObject({ code: "PRECONDITION_FAILED" });
    await expect(caller.matches.confirm({ matchId: 101 })).rejects.toMatchObject({ code: "PRECONDITION_FAILED" });
  });
});

describe("tournament discovery without a database", () => {
  it("lists the demo tournaments with counts, live first", async () => {
    const rows = await publicCaller.tournaments.list();
    expect(rows).toHaveLength(seedTournaments.length);
    expect(rows[0].status).toBe("live");
    expect(rows[0].name).toBe("Nightfall Circuit: Valorant Open");
    expect(rows[0].gameSlug).toBe("valorant");
    expect(rows[0].registeredCount).toBe(4);
    expect(rows[0].checkedInCount).toBe(4);
    expect(rows[0].prizeBreakdown.totalCents).toBe(660_000);
    expect(rows[0].organizer?.name).toBe("Nightfall Ops");
    expect(rows.slice(1).filter(row => row.status === "completed").every(row => row.startsAt < rows[1].startsAt)).toBe(true);
  });

  it("filters by game, status, format, and search", async () => {
    expect((await publicCaller.tournaments.list({ game: "valorant" })).map(row => row.name)).toEqual(["Nightfall Circuit: Valorant Open", "Astra Showdown: Valorant"]);
    expect((await publicCaller.tournaments.list({ game: "MLBB" })).every(row => row.gameSlug === "mobile-legends")).toBe(true);
    expect((await publicCaller.tournaments.list({ status: "registration" })).every(row => row.status === "registration")).toBe(true);
    expect((await publicCaller.tournaments.list({ format: "swiss" })).map(row => row.format)).toEqual(["swiss"]);
    expect((await publicCaller.tournaments.list({ search: "clash" })).map(row => row.name).sort()).toEqual(["Meno Arena Clash #03", "Meno Arena Clash #04"]);
    expect(await publicCaller.tournaments.list({ limit: 2 })).toHaveLength(2);
  });

  it("features only open or running tournaments", async () => {
    const rows = await publicCaller.tournaments.featured();
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.length).toBeLessThanOrEqual(6);
    expect(rows.every(row => ["live", "checkin", "registration"].includes(row.status))).toBe(true);
    expect(rows[0].status).toBe("live");
  });

  it("returns a full detail view for a live tournament and null for unknown ids", async () => {
    const detail = await publicCaller.tournaments.byId({ tournamentId: liveId });
    expect(detail).not.toBeNull();
    expect(detail?.registrations).toHaveLength(4);
    expect(detail?.registrations[0].team?.name).toBe("Astra Forge Valorant");
    expect(detail?.registrations[0].team?.clan?.tag).toBe("AST");
    expect(detail?.registrations.every(row => row.status === "checked_in")).toBe(true);
    expect(detail?.prize.totalCents).toBe(660_000);
    expect(detail?.matchSummary).toEqual({ total: 3, completed: 2, live: 0 });
    expect(detail?.viewer).toBeNull();
    expect(await publicCaller.tournaments.byId({ tournamentId: 999_999 })).toBeNull();

    const signedIn = await appRouter.createCaller(context(user("admin"))).tournaments.byId({ tournamentId: liveId });
    expect(signedIn?.viewer).toEqual({ eligibleTeams: [], registration: null, canManage: true });
  });

  it("serves payouts and placements for a completed tournament", async () => {
    const detail = await publicCaller.tournaments.byId({ tournamentId: completedId });
    expect(detail?.status).toBe("completed");
    expect(detail?.matchSummary.total).toBe(3);
    expect(detail?.matchSummary.completed).toBe(3);
    expect(detail?.payouts).toHaveLength(3);
    expect(detail?.payouts.map(row => row.placement)).toEqual([1, 2, 3]);
    expect(detail?.payouts[0].team).not.toBeNull();
    expect(detail?.payouts.reduce((sum, row) => sum + row.amountCents, 0)).toBe(detail?.prize.totalCents);

    const standings = await publicCaller.tournaments.standings({ tournamentId: completedId });
    expect(standings.placements).toHaveLength(3);
    expect(standings.placements[0].placement).toBe(1);
    expect(standings.placements[0].team?.id).toBe(detail?.payouts[0].teamId);
    expect(standings.standings).toEqual([]);
    expect(await publicCaller.prizes.payouts({ tournamentId: completedId })).toHaveLength(3);
    await expect(publicCaller.tournaments.standings({ tournamentId: 999_999 })).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("returns the prize breakdown for a tournament", async () => {
    const breakdown = await publicCaller.prizes.breakdown({ tournamentId: liveId });
    expect(breakdown.totalCents).toBe(660_000);
    expect(breakdown.placements.map(row => row.sharePercent)).toEqual([60, 30, 10]);
    await expect(publicCaller.prizes.breakdown({ tournamentId: 999_999 })).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("returns empty collections for signed-in personal queries", async () => {
    const caller = appRouter.createCaller(context(user()));
    expect(await caller.tournaments.mine()).toEqual({ organized: [], entered: [] });
    expect(await caller.payments.mine()).toEqual([]);
    expect(await caller.matches.disputes.mine()).toEqual([]);
    expect(await caller.tournaments.announcements.list({ tournamentId: liveId })).toEqual([]);
  });
});

describe("matches without a database", () => {
  it("renders a mid-flight bracket with team objects and round labels", async () => {
    const matches = await publicCaller.matches.matches({ tournamentId: liveId });
    expect(matches).toHaveLength(3);
    expect(matches.map(match => match.roundLabel)).toEqual(["Semifinals", "Semifinals", "Grand final"]);
    expect(matches.filter(match => match.status === "completed")).toHaveLength(2);
    expect(matches[0].homeTeam?.name).toBe("Astra Forge Valorant");
    expect(matches[0].awayTeam?.tag).toBe("HSH");
    expect(matches[2].status).toBe("upcoming");
    expect(matches[2].homeTeamId).not.toBeNull();
    expect(matches[2].awayTeamId).not.toBeNull();
    expect(matches[0].scheduledAt).toBeInstanceOf(Date);
    expect(await publicCaller.matches.byTournament({ tournamentId: liveId })).toEqual(matches);
    expect(await publicCaller.matches.matches({ tournamentId: 999_999 })).toEqual([]);
    expect(await publicCaller.matches.matches({ tournamentId: seedTournaments.findIndex(row => row.key === "codm-swiss") + 1 })).toEqual([]);
  });

  it("serves a single match with its tournament context", async () => {
    const [first] = await publicCaller.matches.matches({ tournamentId: liveId });
    const match = await publicCaller.matches.byId({ matchId: first.id });
    expect(match.tournament.name).toBe("Nightfall Circuit: Valorant Open");
    expect(match.tournament.bestOf).toBe(3);
    expect(match.reports).toEqual([]);
    expect(match.viewer).toBeNull();
    await expect(publicCaller.matches.byId({ matchId: 999_999 })).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("keeps the legacy tournament creation and dispute resolution shapes working", async () => {
    const caller = appRouter.createCaller(context(user()));
    const tournament = await caller.tournaments.create({ name: "Phase 2 Success Cup", game: "VALORANT", format: "single_elimination", startsAt: new Date("2026-10-01T18:00:00Z"), prizePoolCents: 50_000, maxTeams: 16, streamUrl: "https://twitch.tv/menoarena", clanEligible: true });
    expect(tournament).toMatchObject({ name: "Phase 2 Success Cup", game: "VALORANT", status: "registration", maxTeams: 16 });
    // The create page submits an empty stream URL when the field is left blank.
    await expect(caller.tournaments.create({ name: "Blank stream", game: "Valorant", format: "swiss", startsAt: new Date("2026-10-02T18:00:00Z"), streamUrl: "" })).resolves.toMatchObject({ name: "Blank stream" });

    const admin = appRouter.createCaller(context(user("admin", 1)));
    expect(await admin.matches.disputes.open()).toEqual([]);
    const resolved = await admin.matches.disputes.resolve({ disputeId: 5, winnerTeamId: 201, adminDecision: "Evidence reviewed and result confirmed." });
    expect(resolved).toMatchObject({ status: "resolved", winnerTeamId: 201 });
  });

  it("keeps the legacy reporting and dispute shapes working", async () => {
    const caller = appRouter.createCaller(context(user()));
    const report = await caller.matches.report({ matchId: 301, teamId: 201, scoreFor: 2, scoreAgainst: 1 });
    expect(report).toMatchObject({ matchId: 301, teamId: 201, status: "waiting_confirmation" });
    const dispute = await caller.matches.openDispute({ matchId: 301, reason: "Screenshot does not match the reported score." });
    expect(dispute).toMatchObject({ matchId: 301, status: "open" });
    await expect(caller.matches.openDispute({ matchId: 301, reason: "short" })).rejects.toThrow();
  });
});

describe("game hubs without a database", () => {
  it("lists every game with tournament and team counts", async () => {
    const games = await publicCaller.games.list();
    expect(games.map(game => game.slug)).toEqual(["mobile-legends", "valorant", "free-fire", "cod-mobile"]);
    const valorant = games.find(game => game.slug === "valorant");
    expect(valorant?.tournamentCount).toBe(2);
    expect(valorant?.teamCount).toBe(seedTeams.filter(team => team.game === "Valorant").length);
    expect(valorant?.liveCount).toBe(1);
  });

  it("builds a hub from the demo dataset and rejects unknown slugs", async () => {
    const hub = await publicCaller.games.hub({ slug: "valorant" });
    expect(hub.game.name).toBe("Valorant");
    expect(hub.stats.teamCount).toBe(4);
    expect(hub.upcomingTournaments.map(row => row.status)).toContain("live");
    expect(hub.topTeams).toHaveLength(4);
    expect(hub.topTeams[0].wins).toBeGreaterThanOrEqual(hub.topTeams[1].wins);
    expect(hub.topClans.map(clan => clan.tag)).toEqual(["AST", "K7", "NOX"]);
    expect(hub.leaderboard[0].rank).toBe(1);
    expect(hub.leaderboard[0].winRate).toBeGreaterThanOrEqual(hub.leaderboard[1].winRate);
    expect(hub.recentMatches.length).toBeGreaterThan(0);
    expect(hub.recentMatches.every(match => match.status === "completed" && match.homeTeam && match.awayTeam)).toBe(true);
    expect(hub.media.length).toBeGreaterThan(0);
    expect(hub.media.length).toBeLessThanOrEqual(6);
    expect(hub.media.every(item => item.game === "Valorant")).toBe(true);

    const alias = await publicCaller.games.hub({ slug: "MLBB" });
    expect(alias.game.slug).toBe("mobile-legends");
    await expect(publicCaller.games.hub({ slug: "chess" })).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});
