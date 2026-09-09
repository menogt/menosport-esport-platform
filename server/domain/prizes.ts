import { normalizePrizeSplit } from "@shared/arena";

export type PrizeBreakdown = {
  totalCents: number;
  entryFeeContributionCents: number;
  sponsorContributionCents: number;
  baseCents: number;
  placements: Array<{ placement: number; sharePercent: number; amountCents: number }>;
};

/**
 * Prize pool = declared base pool + entry-fee contributions + sponsor contribution.
 * Rounds down each placement to whole cents and assigns any remainder to 1st.
 */
export function computePrizeBreakdown(input: { prizePoolCents: number; entryFeeCents: number; paidRegistrations: number; sponsorContributionCents?: number; prizeSplit?: unknown }): PrizeBreakdown {
  const split = normalizePrizeSplit(input.prizeSplit);
  const entryFeeContributionCents = Math.max(0, input.entryFeeCents) * Math.max(0, input.paidRegistrations);
  const sponsorContributionCents = Math.max(0, input.sponsorContributionCents ?? 0);
  const baseCents = Math.max(0, input.prizePoolCents);
  const totalCents = baseCents + entryFeeContributionCents + sponsorContributionCents;

  const placements = split.map((sharePercent, index) => ({ placement: index + 1, sharePercent, amountCents: Math.floor((totalCents * sharePercent) / 100) }));
  const distributed = placements.reduce((sum, row) => sum + row.amountCents, 0);
  if (placements[0] && split.reduce((sum, value) => sum + value, 0) >= 99.999) placements[0].amountCents += totalCents - distributed;

  return { totalCents, entryFeeContributionCents, sponsorContributionCents, baseCents, placements };
}
