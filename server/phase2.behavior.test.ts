import { describe, expect, it } from "vitest";
import { getTournamentById, getTournamentMatches, updatePlayerProfile } from "./db";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { getTournamentIdFromPath } from "../client/src/pages/BracketPage";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 7,
    openId: "phase2-test-user",
    email: "phase2@example.com",
    name: "Phase 2 Test",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("Phase 2 behavior contracts", () => {
  it("normalizes and returns protected profile updates", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const profile = await caller.dashboard.updateProfile({ handle: "  nova_player ", bio: "  Entry fragger  ", region: " sea ", primaryGame: "VALORANT" });
    expect(profile.handle).toBe("NOVA_PLAYER");
    expect(profile.bio).toBe("Entry fragger");
    expect(profile.region).toBe("SEA");
  });

  it("refreshes dashboard profile data after a protected update", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    await caller.dashboard.updateProfile({ handle: "  refresh_me ", bio: "  Persisted bio  ", region: " na ", primaryGame: "VALORANT" });
    const dashboard = await caller.dashboard.player();
    expect(dashboard.profile).toMatchObject({ handle: "REFRESH_ME", bio: "Persisted bio", region: "NA", primaryGame: "VALORANT" });
  });

  it("returns route-specific tournament data and an empty result for an unknown bracket", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const tournament = await caller.tournaments.byId({ tournamentId: 999999 });
    const matches = await caller.matches.matches({ tournamentId: 999999 });
    expect(tournament).toBeNull();
    expect(matches).toEqual([]);
    expect((await getTournamentById(102)) === null || (await getTournamentById(102))?.id === 102).toBe(true);
    expect((await getTournamentMatches(999999))).toEqual([]);
  });

  it("rejects invalid tournament ids through both protected procedures", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    await expect(caller.tournaments.byId({ tournamentId: 0 })).rejects.toThrow();
    await expect(caller.matches.matches({ tournamentId: -1 })).rejects.toThrow();
  });

  it("maps valid and invalid bracket paths to route state", () => {
    expect(getTournamentIdFromPath("/brackets/102")).toBe(102);
    expect(getTournamentIdFromPath("/brackets/not-a-number")).toBeNull();
    expect(getTournamentIdFromPath("/brackets/0")).toBeNull();
  });

  it("exposes profile, tournament, and bracket procedures", () => {
    expect(Object.keys(appRouter._def.procedures)).toEqual(expect.arrayContaining([
      "dashboard.player",
      "dashboard.updateProfile",
      "tournaments.byId",
      "matches.matches",
    ]));
  });

  it("keeps the direct helper output aligned with the persisted profile contract", async () => {
    const profile = await updatePlayerProfile({ userId: 7, handle: "  sentinel ", bio: "  Ready  ", region: " eu ", primaryGame: "CS2" });
    expect(profile).toMatchObject({ handle: "SENTINEL", bio: "Ready", region: "EU", primaryGame: "CS2", userId: 7 });
  });
});


describe("Remaining Phase 2 procedures", () => {
  it("exposes protected clan, tournament creation, reporting, and dispute procedures", () => {
    expect(Object.keys(appRouter._def.procedures)).toEqual(expect.arrayContaining([
      "clans.create",
      "clans.dashboard",
      "tournaments.create",
      "matches.report",
      "matches.openDispute",
      "matches.disputes.open",
      "matches.disputes.resolve",
    ]));
  });

  it("rejects underspecified match reports and disputes", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    await expect(caller.matches.report({ matchId: 1, teamId: 1, scoreFor: -1, scoreAgainst: 0 })).rejects.toThrow();
    await expect(caller.matches.openDispute({ matchId: 1, reason: "short" })).rejects.toThrow();
  });
});


describe("Phase 2 success paths", () => {
  it("creates a normalized clan through the protected procedure", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const clan = await caller.clans.create({ name: "  Nova Unit ", tag: " nu ", region: " sea ", bio: "  High pressure roster  " });
    expect(clan).toMatchObject({ name: "Nova Unit", tag: "NU", region: "SEA", bio: "High pressure roster" });
  });

  it("creates a tournament with organizer fields through the protected procedure", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const tournament = await caller.tournaments.create({
      name: "Phase 2 Success Cup",
      game: "VALORANT",
      format: "single_elimination",
      startsAt: new Date("2026-10-01T18:00:00Z"),
      prizePoolCents: 50000,
      maxTeams: 16,
      streamUrl: "https://twitch.tv/menoarena",
      clanEligible: true,
    });
    expect(tournament).toMatchObject({ name: "Phase 2 Success Cup", game: "VALORANT", status: "registration", maxTeams: 16 });
  });

  it("accepts a match result report and screenshot placeholder", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const report = await caller.matches.report({
      matchId: 301,
      teamId: 201,
      scoreFor: 2,
      scoreAgainst: 1,
      screenshotUrl: "https://example.com/match-301.png",
      notes: "Clean final result.",
    });
    expect(report).toMatchObject({ matchId: 301, teamId: 201, scoreFor: 2, scoreAgainst: 1, status: "waiting_confirmation" });
  });

  it("opens and resolves a dispute through the role-gated admin path", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const opened = await caller.matches.openDispute({ matchId: 301, reason: "The submitted screenshot needs an admin review." });
    expect(opened).toMatchObject({ matchId: 301, status: "open" });

    const admin = appRouter.createCaller({
      ...createAuthContext(),
      user: { ...createAuthContext().user!, role: "admin" },
    });
    const openDisputes = await admin.matches.disputes.open();
    expect(openDisputes.some(dispute => dispute.id === opened.id)).toBe(true);

    const resolved = await admin.matches.disputes.resolve({
      disputeId: opened.id,
      winnerTeamId: 201,
      adminDecision: "Evidence reviewed and result confirmed for the home team.",
    });
    expect(resolved).toMatchObject({ id: opened.id, status: "resolved", winnerTeamId: 201 });
    const remainingOpenDisputes = await admin.matches.disputes.open();
    expect(remainingOpenDisputes.some(dispute => dispute.id === opened.id)).toBe(false);
  });
});
