import { describe, expect, it } from "vitest";
import { cartSubtotalCents, formatCurrency, type CartLine } from "@shared/phase4";
import { getPhase4Hub, getSponsorCampaigns, getStoreProducts } from "./phase4";

describe("Phase 4 contracts", () => {
  it("exposes integration, sponsor, store, and analytics placeholders without provider credentials", () => {
    const hub = getPhase4Hub();
    expect(hub.integrations.map(item => item.provider)).toEqual(expect.arrayContaining(["discord", "twitch"]));
    expect(getSponsorCampaigns()).toHaveLength(3);
    expect(getStoreProducts()).toHaveLength(4);
    expect(hub.analytics).toHaveLength(4);
  });

  it("calculates demo cart totals from immutable unit prices", () => {
    const [first, second] = getStoreProducts();
    const lines: CartLine[] = [{ ...first, quantity: 2 }, { ...second, quantity: 1 }];
    expect(cartSubtotalCents(lines)).toBe(first.priceCents * 2 + second.priceCents);
    expect(formatCurrency(cartSubtotalCents(lines))).toBe("$218.00");
  });
});
