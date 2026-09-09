import { describe, expect, it } from "vitest";
import { DEFAULT_PRIZE_SPLIT, normalizePrizeSplit } from "@shared/arena";
import { breakdownFor, placementLabel } from "./domain/matches";
import { computePrizeBreakdown } from "./domain/prizes";

describe("computePrizeBreakdown", () => {
  it("splits a declared pool with the default 60/30/10 split", () => {
    const breakdown = computePrizeBreakdown({ prizePoolCents: 100_000, entryFeeCents: 0, paidRegistrations: 0 });
    expect(breakdown.totalCents).toBe(100_000);
    expect(breakdown.baseCents).toBe(100_000);
    expect(breakdown.entryFeeContributionCents).toBe(0);
    expect(breakdown.sponsorContributionCents).toBe(0);
    expect(breakdown.placements).toEqual([
      { placement: 1, sharePercent: 60, amountCents: 60_000 },
      { placement: 2, sharePercent: 30, amountCents: 30_000 },
      { placement: 3, sharePercent: 10, amountCents: 10_000 },
    ]);
  });

  it("adds entry-fee and sponsor contributions to the pool", () => {
    const breakdown = computePrizeBreakdown({ prizePoolCents: 0, entryFeeCents: 2_500, paidRegistrations: 8, sponsorContributionCents: 5_000 });
    expect(breakdown.entryFeeContributionCents).toBe(20_000);
    expect(breakdown.sponsorContributionCents).toBe(5_000);
    expect(breakdown.totalCents).toBe(25_000);
    expect(breakdown.placements.reduce((sum, row) => sum + row.amountCents, 0)).toBe(25_000);
  });

  it("assigns rounding remainders to first place when the split covers 100%", () => {
    const breakdown = computePrizeBreakdown({ prizePoolCents: 1_001, entryFeeCents: 0, paidRegistrations: 0, prizeSplit: [50, 50] });
    expect(breakdown.placements.map(row => row.amountCents)).toEqual([501, 500]);
    const thirds = computePrizeBreakdown({ prizePoolCents: 100, entryFeeCents: 0, paidRegistrations: 0, prizeSplit: [33.33, 33.33, 33.34] });
    expect(thirds.placements.reduce((sum, row) => sum + row.amountCents, 0)).toBe(100);
  });

  it("leaves the remainder undistributed when the split is below 100%", () => {
    const breakdown = computePrizeBreakdown({ prizePoolCents: 1_000, entryFeeCents: 0, paidRegistrations: 0, prizeSplit: [50, 30] });
    expect(breakdown.placements.map(row => row.amountCents)).toEqual([500, 300]);
  });

  it("falls back to the default split for invalid input and clamps negative numbers", () => {
    expect(normalizePrizeSplit(null)).toEqual([...DEFAULT_PRIZE_SPLIT]);
    expect(normalizePrizeSplit([70, 40])).toEqual([...DEFAULT_PRIZE_SPLIT]);
    expect(normalizePrizeSplit([])).toEqual([...DEFAULT_PRIZE_SPLIT]);
    expect(normalizePrizeSplit(["50", "50"])).toEqual([50, 50]);
    const breakdown = computePrizeBreakdown({ prizePoolCents: -10, entryFeeCents: -5, paidRegistrations: 3, sponsorContributionCents: -1, prizeSplit: "bad" });
    expect(breakdown.totalCents).toBe(0);
    expect(breakdown.placements).toHaveLength(3);
    expect(breakdown.placements.every(row => row.amountCents === 0)).toBe(true);
  });

  it("supports single-winner and long splits", () => {
    expect(computePrizeBreakdown({ prizePoolCents: 500, entryFeeCents: 0, paidRegistrations: 0, prizeSplit: [100] }).placements).toEqual([{ placement: 1, sharePercent: 100, amountCents: 500 }]);
    const long = computePrizeBreakdown({ prizePoolCents: 10_000, entryFeeCents: 0, paidRegistrations: 0, prizeSplit: [40, 20, 10, 10, 5, 5, 5, 5] });
    expect(long.placements).toHaveLength(8);
    expect(long.placements.reduce((sum, row) => sum + row.amountCents, 0)).toBe(10_000);
  });
});

describe("tournament prize helpers", () => {
  it("derives a breakdown from a tournament row and the number of paid entries", () => {
    const breakdown = breakdownFor({ prizePoolCents: 500_000, entryFeeCents: 2_500, sponsorContributionCents: 150_000, prizeSplit: [60, 30, 10] }, 4);
    expect(breakdown.totalCents).toBe(660_000);
    expect(breakdown.placements[0].amountCents).toBe(396_000);
  });

  it("labels placements for achievements", () => {
    expect(placementLabel(1)).toBe("Champions");
    expect(placementLabel(2)).toBe("Runners-up");
    expect(placementLabel(3)).toBe("3rd place");
    expect(placementLabel(11)).toBe("11th place");
  });
});
