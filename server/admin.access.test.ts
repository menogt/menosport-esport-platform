import { describe, expect, it } from "vitest";
import type { TrpcContext } from "./_core/context";
import { appRouter } from "./routers";

function createContext(role: "user" | "admin" | null): TrpcContext {
  return {
    user: role ? {
      id: role === "admin" ? 1 : 2,
      openId: `${role}-user`,
      email: `${role}@example.com`,
      name: `${role} tester`,
      loginMethod: "manus",
      role,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    } : null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

const forbidden = expect.objectContaining({ code: "FORBIDDEN" });

describe("admin procedure access", () => {
  const user = appRouter.createCaller(createContext("user"));
  const anonymous = appRouter.createCaller(createContext(null));
  const admin = appRouter.createCaller(createContext("admin"));

  it("rejects regular users on every admin read", async () => {
    await expect(user.admin.overview()).rejects.toEqual(forbidden);
    await expect(user.admin.users.list({})).rejects.toEqual(forbidden);
    await expect(user.admin.teams.list({})).rejects.toEqual(forbidden);
    await expect(user.admin.clans.list({})).rejects.toEqual(forbidden);
    await expect(user.admin.tournaments.list({})).rejects.toEqual(forbidden);
    await expect(user.admin.matches.list({})).rejects.toEqual(forbidden);
    await expect(user.admin.registrations.list({})).rejects.toEqual(forbidden);
    await expect(user.admin.payments.list({})).rejects.toEqual(forbidden);
    await expect(user.admin.sponsors.list()).rejects.toEqual(forbidden);
    await expect(user.admin.products.list()).rejects.toEqual(forbidden);
    await expect(user.admin.orders.list()).rejects.toEqual(forbidden);
    await expect(user.admin.media.list({})).rejects.toEqual(forbidden);
    await expect(user.admin.announcements.list()).rejects.toEqual(forbidden);
    await expect(user.admin.disputes.list({})).rejects.toEqual(forbidden);
    await expect(user.analytics.overview()).rejects.toEqual(forbidden);
  });

  it("rejects regular users on every admin mutation", async () => {
    await expect(user.admin.users.setRole({ userId: 3, role: "organizer" })).rejects.toEqual(forbidden);
    await expect(user.admin.users.remove({ userId: 3 })).rejects.toEqual(forbidden);
    await expect(user.admin.teams.remove({ teamId: 1 })).rejects.toEqual(forbidden);
    await expect(user.admin.clans.setVerified({ clanId: 1, verified: true })).rejects.toEqual(forbidden);
    await expect(user.admin.clans.remove({ clanId: 1 })).rejects.toEqual(forbidden);
    await expect(user.admin.tournaments.remove({ tournamentId: 1 })).rejects.toEqual(forbidden);
    await expect(user.admin.matches.setStatus({ matchId: 1, status: "live" })).rejects.toEqual(forbidden);
    await expect(user.admin.matches.schedule({ matchId: 1, streamUrl: "https://twitch.tv/x" })).rejects.toEqual(forbidden);
    await expect(user.admin.registrations.setStatus({ registrationId: 1, status: "confirmed" })).rejects.toEqual(forbidden);
    await expect(user.admin.payments.refund({ paymentId: 1 })).rejects.toEqual(forbidden);
    await expect(user.admin.sponsors.upsert({ name: "X", mark: "X", tier: "partner", tone: "lime" })).rejects.toEqual(forbidden);
    await expect(user.admin.sponsors.remove({ sponsorId: 1 })).rejects.toEqual(forbidden);
    await expect(user.admin.campaigns.upsert({ sponsorId: 1, placement: "landing", headline: "Hello" })).rejects.toEqual(forbidden);
    await expect(user.admin.campaigns.remove({ campaignId: 1 })).rejects.toEqual(forbidden);
    await expect(user.admin.products.upsert({ sku: "X-1", name: "Thing", category: "digital", priceCents: 100 })).rejects.toEqual(forbidden);
    await expect(user.admin.products.remove({ productId: 1 })).rejects.toEqual(forbidden);
    await expect(user.admin.media.setPublished({ mediaId: 1, published: false })).rejects.toEqual(forbidden);
    await expect(user.admin.media.remove({ mediaId: 1 })).rejects.toEqual(forbidden);
    await expect(user.admin.announcements.create({ title: "Hi", body: "There" })).rejects.toEqual(forbidden);
    await expect(user.admin.announcements.remove({ announcementId: 1 })).rejects.toEqual(forbidden);
  });

  it("rejects anonymous callers", async () => {
    await expect(anonymous.admin.overview()).rejects.toEqual(forbidden);
    await expect(anonymous.admin.users.list({})).rejects.toEqual(forbidden);
    await expect(anonymous.analytics.overview()).rejects.toEqual(forbidden);
  });

  it("lets admins through the guard (then fails on the missing database, not on access)", async () => {
    await expect(admin.admin.overview()).rejects.toMatchObject({ code: "PRECONDITION_FAILED" });
    await expect(admin.admin.users.list({})).rejects.toMatchObject({ code: "PRECONDITION_FAILED" });
    await expect(admin.admin.clans.setVerified({ clanId: 1, verified: true })).rejects.toMatchObject({ code: "PRECONDITION_FAILED" });
    await expect(admin.admin.users.setRole({ userId: 1, role: "user" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(admin.admin.users.remove({ userId: 1 })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});
