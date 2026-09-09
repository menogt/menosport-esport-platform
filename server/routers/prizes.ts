import { PAYOUT_STATUSES } from "@shared/arena";
import { z } from "zod";
import { adminProcedure, publicProcedure, router } from "../_core/trpc";
import { hasDb, notFound } from "../domain/_shared";
import { listPayouts, prizeBreakdownFor, seedPayouts, seedTournamentListItem, setPayoutStatus } from "../domain/tournaments";
import { seedTournaments } from "../seed/data";

const id = z.number().int().positive();

function seedItem(tournamentId: number) {
  if (!seedTournaments[tournamentId - 1]) notFound("Tournament");
  return seedTournamentListItem(tournamentId - 1);
}

export const prizesRouter = router({
  breakdown: publicProcedure.input(z.object({ tournamentId: id })).query(async ({ input }) => (hasDb() ? prizeBreakdownFor(input.tournamentId) : seedItem(input.tournamentId).prizeBreakdown)),

  payouts: publicProcedure.input(z.object({ tournamentId: id })).query(async ({ input }) => {
    if (hasDb()) return listPayouts(input.tournamentId);
    return seedPayouts(input.tournamentId, seedItem(input.tournamentId));
  }),

  setPayoutStatus: adminProcedure.input(z.object({ payoutId: id, status: z.enum(PAYOUT_STATUSES) })).mutation(async ({ ctx, input }) => setPayoutStatus({ id: ctx.user.id, role: ctx.user.role }, input)),
});
