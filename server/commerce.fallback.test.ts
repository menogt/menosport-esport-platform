import { describe, expect, it } from "vitest";
import type { TrpcContext } from "./_core/context";
import { appRouter } from "./routers";
import { seedIntegrations, seedProducts, seedSponsors, seedStreamSchedule } from "./seed/data";

function createContext(role: "user" | "admin" | null): TrpcContext {
  return {
    user: role ? {
      id: 9,
      openId: "commerce-user",
      email: "commerce@example.com",
      name: "Commerce Tester",
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

const anonymous = appRouter.createCaller(createContext(null));

describe("store fallback", () => {
  it("serves the seed catalog with stable ids and clan labels", async () => {
    const catalog = await anonymous.store.catalog({});
    expect(catalog).toHaveLength(seedProducts.length);
    expect(catalog.map(product => product.id)).toEqual(seedProducts.map((_, index) => index + 1));
    expect(catalog[0]).toMatchObject({ sku: seedProducts[0]!.sku, priceCents: seedProducts[0]!.priceCents, active: true });
    expect(catalog[0]!.clan).toMatchObject({ tag: "AST" });
    expect(catalog.find(product => product.sku === "MENO-CAP-01")?.clan).toBeNull();
  });

  it("filters by category, clan, and search", async () => {
    const hoodies = await anonymous.store.catalog({ category: "hoodie" });
    expect(hoodies.every(product => product.category === "hoodie")).toBe(true);
    expect(hoodies.length).toBe(seedProducts.filter(product => product.category === "hoodie").length);
    const orbit = await anonymous.store.catalog({ clanId: 2 });
    expect(orbit.map(product => product.sku)).toEqual(["ORB-HOODIE-26"]);
    const searched = await anonymous.store.catalog({ search: "broadcast" });
    expect(searched.map(product => product.sku)).toEqual(["MENO-PACK-NF"]);
  });

  it("resolves a product by sku case-insensitively", async () => {
    const product = await anonymous.store.product({ sku: "ast-jersey-26" });
    expect(product).toMatchObject({ id: 1, name: seedProducts[0]!.name });
    await expect(anonymous.store.product({ sku: "NOPE" })).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("requires a database for checkout and a session for order history", async () => {
    const user = appRouter.createCaller(createContext("user"));
    await expect(user.store.checkout({ items: [{ productId: 1, quantity: 1 }] })).rejects.toMatchObject({ code: "PRECONDITION_FAILED" });
    await expect(anonymous.store.checkout({ items: [{ productId: 1, quantity: 1 }] })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    expect(await user.store.orders.mine()).toEqual([]);
  });
});

describe("sponsor fallback", () => {
  it("serves every seed campaign joined with its sponsor", async () => {
    const featured = await anonymous.sponsors.featured({});
    const expected = seedSponsors.reduce((sum, sponsor) => sum + sponsor.campaigns.length, 0);
    expect(featured).toHaveLength(expected);
    expect(featured[0]).toMatchObject({ id: 1, sponsorId: 1, name: seedSponsors[0]!.name, mark: seedSponsors[0]!.mark, tone: seedSponsors[0]!.tone, placement: "tournament" });
    const landing = await anonymous.sponsors.featured({ placement: "landing" });
    expect(landing.every(campaign => campaign.placement === "landing")).toBe(true);
    expect(landing.length).toBe(1);
  });

  it("lists sponsors with campaign counts", async () => {
    const sponsors = await anonymous.sponsors.list();
    expect(sponsors).toHaveLength(seedSponsors.length);
    expect(sponsors[0]!.campaignCount).toBe(seedSponsors[0]!.campaigns.length);
  });
});

describe("community hub fallback", () => {
  it("serves seed integrations with masked webhooks and a stream schedule", async () => {
    const hub = await anonymous.community.hub();
    expect(hub.integrations).toHaveLength(seedIntegrations.length);
    expect(hub.integrations[0]).toMatchObject({ provider: "discord", scope: "clan", targetName: "Astra Forge", status: "ready", webhookUrl: null });
    expect(hub.streamSchedule).toHaveLength(seedStreamSchedule.length);
    expect(hub.streamSchedule[0]).toMatchObject({ status: "live", homeTeam: "Astra Forge", awayTeam: "Kairo Seven", channel: "menoarena_live" });
    expect(hub.streamSchedule[1]!.status).toBe("upcoming");
  });

  it("validates integration scope before any persistence", async () => {
    const user = appRouter.createCaller(createContext("user"));
    await expect(user.community.connect({ provider: "discord", displayName: "HQ" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(user.community.connect({ provider: "discord", clanId: 1, tournamentId: 1, displayName: "HQ" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(user.community.connect({ provider: "discord", clanId: 1, displayName: "HQ" })).rejects.toMatchObject({ code: "PRECONDITION_FAILED" });
    expect(await user.community.rolePreview({ clanId: 1 })).toEqual([]);
  });
});

describe("analytics fallback", () => {
  it("returns a deterministic demo overview for admins", async () => {
    const admin = appRouter.createCaller(createContext("admin"));
    const overview = await admin.analytics.overview();
    expect(overview.metrics).toHaveLength(6);
    expect(overview.metrics.map(metric => metric.key)).toEqual(["registrations", "revenue", "matches", "players", "checkin", "disputes"]);
    expect(overview.series.registrationsPerDay).toHaveLength(30);
    expect(overview.series.revenuePerDay.every(point => /^\d{4}-\d{2}-\d{2}$/.test(point.date))).toBe(true);
    expect(overview.totals.clans).toBe(4);
    expect(overview.totals.tournamentsByStatus.live).toBe(1);
    const again = await admin.analytics.overview();
    expect(again.series).toEqual(overview.series);
  });
});
