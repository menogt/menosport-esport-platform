import { describe, expect, it } from "vitest";
import type { TrpcContext } from "./_core/context";
import { appRouter } from "./routers";
import { seedClans, seedMedia, seedTeams, seedUsers } from "./seed/data";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createContext(user: Partial<AuthenticatedUser> | null = null): TrpcContext {
  const base: AuthenticatedUser = {
    id: 42,
    openId: "contracts-user",
    email: "contracts@example.com",
    name: "Contracts Tester",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
  return {
    user: user ? { ...base, ...user } : null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

const procedureNames = Object.keys(appRouter._def.procedures);

describe("teams / clans / platform procedure contracts", () => {
  it("exposes every teams, clans, notifications, media, storage, and dashboard procedure", () => {
    expect(procedureNames).toEqual(expect.arrayContaining([
      "teams.mine", "teams.list", "teams.byId", "teams.create", "teams.update", "teams.invite",
      "teams.invites.mine", "teams.invites.forTeam", "teams.invites.respond", "teams.invites.revoke",
      "teams.removeMember", "teams.transferCaptain", "teams.lockLineup", "teams.unlockLineup", "teams.linkClan", "teams.unlinkClan",
      "clans.mine", "clans.create", "clans.dashboard", "clans.directory", "clans.leaderboard", "clans.byId", "clans.follow", "clans.unfollow", "clans.update",
      "clans.invite", "clans.invites.mine", "clans.invites.forClan", "clans.invites.respond", "clans.invites.revoke",
      "clans.members.setRole", "clans.members.remove", "clans.removeTeam",
      "notifications.list", "notifications.unreadCount", "notifications.markRead",
      "media.list", "media.byId", "media.create", "media.toggleLike", "media.mine", "media.remove",
      "storage.createUploadUrl",
      "dashboard.player", "dashboard.updateProfile",
      "analytics.overview", "analytics.platform",
    ]));
  });

  it("exposes the commerce, community, sponsor, and admin procedures", () => {
    expect(procedureNames).toEqual(expect.arrayContaining([
      "sponsors.featured", "sponsors.list", "store.catalog", "store.product", "store.checkout", "store.orders.mine",
      "community.hub", "community.connect", "community.disconnect", "community.rolePreview",
      "admin.overview", "admin.users.list", "admin.users.setRole", "admin.users.remove", "admin.teams.list", "admin.teams.remove",
      "admin.clans.list", "admin.clans.setVerified", "admin.clans.remove", "admin.tournaments.list", "admin.tournaments.remove",
      "admin.matches.list", "admin.matches.setStatus", "admin.matches.schedule", "admin.registrations.list", "admin.registrations.setStatus",
      "admin.payments.list", "admin.payments.refund", "admin.sponsors.list", "admin.sponsors.upsert", "admin.sponsors.remove",
      "admin.campaigns.upsert", "admin.campaigns.remove", "admin.products.list", "admin.products.upsert", "admin.products.remove", "admin.orders.list",
      "admin.media.list", "admin.media.setPublished", "admin.media.remove", "admin.announcements.list", "admin.announcements.create", "admin.announcements.remove",
      "admin.disputes.list",
    ]));
  });
});

describe("public fallbacks without a database", () => {
  const anonymous = appRouter.createCaller(createContext(null));

  it("serves the seed team directory with clan info and stable ids", async () => {
    const teams = await anonymous.teams.list({});
    expect(teams).toHaveLength(seedTeams.length);
    expect(teams[0]).toMatchObject({ id: 1, name: seedTeams[0]!.name, tag: seedTeams[0]!.tag, memberCount: seedTeams[0]!.memberKeys.length });
    expect(teams[0]!.clan).toMatchObject({ name: seedClans[0]!.name, tag: seedClans[0]!.tag, verified: true });
    const valorant = await anonymous.teams.list({ game: "valorant" });
    expect(valorant.length).toBeGreaterThan(0);
    expect(valorant.every(team => team.gameSlug === "valorant")).toBe(true);
    const searched = await anonymous.teams.list({ search: "haven" });
    expect(searched.map(team => team.name)).toEqual(["Haven House"]);
  });

  it("serves a seed team profile with roster, stats, and tournament history", async () => {
    const team = await anonymous.teams.byId({ teamId: 1 });
    expect(team.name).toBe(seedTeams[0]!.name);
    expect(team.roster.length).toBe(seedTeams[0]!.memberKeys.length);
    expect(team.roster[0]).toMatchObject({ role: "captain", handle: seedUsers.find(user => user.key === seedTeams[0]!.ownerKey)!.handle });
    expect(team.stats).toMatchObject({ wins: seedTeams[0]!.wins, losses: seedTeams[0]!.losses });
    expect(team.stats.winRate).toBeGreaterThan(0);
    expect(team.tournamentHistory.length).toBeGreaterThan(0);
    expect(team.viewer).toBeNull();
    await expect(anonymous.teams.byId({ teamId: 999 })).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("serves the seed clan directory sorted by trophies and a ranked leaderboard", async () => {
    const directory = await anonymous.clans.directory({});
    expect(directory).toHaveLength(seedClans.length);
    expect(directory[0]!.trophies).toBeGreaterThanOrEqual(directory[1]!.trophies);
    expect(directory[0]!.teamCount).toBeGreaterThan(0);
    expect(directory[0]!.games.length).toBeGreaterThan(0);
    const byFollowers = await anonymous.clans.directory({ sort: "followers", limit: 2 });
    expect(byFollowers).toHaveLength(2);
    expect(byFollowers[0]!.followerCount).toBeGreaterThanOrEqual(byFollowers[1]!.followerCount);
    const leaderboard = await anonymous.clans.leaderboard({ sort: "earnings" });
    expect(leaderboard.map(clan => clan.rank)).toEqual([1, 2, 3, 4]);
    const eu = await anonymous.clans.directory({ region: "eu" });
    expect(eu.map(clan => clan.tag)).toEqual(["NOX"]);
  });

  it("resolves a seed clan by tag (case-insensitive) or id with teams, achievements, and stats", async () => {
    const byTag = await anonymous.clans.byId({ tag: "ast" });
    expect(byTag).toMatchObject({ id: 1, name: "Astra Forge", verified: true });
    expect(byTag.teams.length).toBe(seedTeams.filter(team => team.clanKey === "astra").length);
    expect(byTag.teams[0]!.roster.length).toBeGreaterThan(0);
    expect(byTag.achievements.length).toBeGreaterThan(0);
    expect(byTag.stats.wins).toBeGreaterThan(0);
    expect(byTag.isFollowing).toBe(false);
    const byId = await anonymous.clans.byId({ clanId: 2 });
    expect(byId.tag).toBe("ORB");
    await expect(anonymous.clans.byId({})).rejects.toThrow();
    await expect(anonymous.clans.byId({ tag: "ZZZ" })).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("serves the seed media gallery with uploader and clan info", async () => {
    const media = await anonymous.media.list({});
    expect(media).toHaveLength(seedMedia.length);
    expect(media[0]!.uploader.handle).toBeTruthy();
    expect(media.find(item => item.clan)?.clan?.tag).toBeTruthy();
    const mostViewed = await anonymous.media.list({ sort: "views", limit: 1 });
    expect(mostViewed[0]!.views).toBe(Math.max(...seedMedia.map(item => item.views)));
    const memes = await anonymous.media.list({ kind: "meme" });
    expect(memes.every(item => item.kind === "meme")).toBe(true);
    const single = await anonymous.media.byId({ mediaId: 1 });
    expect(single).toMatchObject({ id: 1, liked: false, title: seedMedia[0]!.title });
  });

  it("serves homepage platform stats from the seed", async () => {
    const stats = await anonymous.analytics.platform();
    expect(stats.teams).toBe(seedTeams.length);
    expect(stats.clans).toBe(seedClans.length);
    expect(stats.prizePoolCents).toBeGreaterThan(0);
  });
});

describe("protected surfaces without a database", () => {
  const caller = appRouter.createCaller(createContext({ id: 7 }));

  it("keeps the legacy team and clan procedures working", async () => {
    const teams = await caller.teams.mine();
    expect(teams.length).toBeGreaterThan(0);
    expect(teams[0]).toMatchObject({ myRole: "owner" });
    const created = await caller.teams.create({ name: "  Null Sector ", tag: " nsec ", game: "VALORANT", region: " sea " });
    expect(created).toMatchObject({ name: "Null Sector", game: "VALORANT" });
    const clans = await caller.clans.mine();
    expect(clans[0]).toMatchObject({ myRole: "owner", verified: false });
    const dashboard = await caller.clans.dashboard({ clanId: 401 });
    expect(dashboard.clan).toMatchObject({ tag: "AXM" });
    expect(dashboard.stats).toMatchObject({ wins: 0, losses: 0 });
  });

  it("returns empty invite and notification lists instead of failing", async () => {
    expect(await caller.teams.invites.mine()).toEqual([]);
    expect(await caller.clans.invites.mine()).toEqual([]);
    expect(await caller.notifications.list()).toEqual([]);
    expect(await caller.notifications.unreadCount()).toBe(0);
    expect(await caller.notifications.markRead()).toEqual({ success: true });
    expect(await caller.media.mine()).toEqual([]);
  });

  it("returns the new dashboard shape on top of the legacy fallback", async () => {
    const dashboard = await caller.dashboard.player();
    expect(dashboard.profile.handle).toBeTruthy();
    expect(dashboard.stats).toMatchObject({ winRate: expect.any(Number), formStreak: expect.any(String) });
    expect(dashboard.pendingInvites).toEqual({ team: 0, clan: 0 });
    expect(dashboard.notifications).toEqual({ unread: 0, latest: [] });
    expect(Array.isArray(dashboard.registrations)).toBe(true);
    expect(Array.isArray(dashboard.upcomingMatches)).toBe(true);
  });

  it("refuses signed uploads and mutations that require the database with PRECONDITION_FAILED", async () => {
    await expect(caller.storage.createUploadUrl({ bucket: "avatars", fileName: "me.png", contentType: "image/png" })).rejects.toMatchObject({ code: "PRECONDITION_FAILED" });
    await expect(caller.storage.createUploadUrl({ bucket: "avatars", fileName: "clip.mp4", contentType: "video/mp4" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(caller.teams.invite({ teamId: 1, handle: "NOVA_PLAYER" })).rejects.toMatchObject({ code: "PRECONDITION_FAILED" });
    await expect(caller.clans.follow({ clanId: 1 })).rejects.toMatchObject({ code: "PRECONDITION_FAILED" });
  });

  it("validates invite targets before touching persistence", async () => {
    await expect(caller.teams.invite({ teamId: 1 })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(caller.teams.invite({ teamId: 1, handle: "NOVA", email: "nova@example.com" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(caller.clans.invite({ clanId: 1 })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});
