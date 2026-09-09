import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { hasDb } from "../domain/_shared";
import { listMyPayments, sandboxCharge } from "../domain/payments";

const id = z.number().int().positive();

export const paymentsRouter = router({
  mine: protectedProcedure.query(async ({ ctx }) => (hasDb() ? listMyPayments({ id: ctx.user.id, role: ctx.user.role }) : [])),

  sandboxCharge: protectedProcedure
    .input(z.object({
      amountCents: z.number().int().min(0).max(100_000_000),
      purpose: z.enum(["entry_fee", "order"]),
      tournamentId: id.optional(),
      teamId: id.optional(),
      orderId: id.optional(),
    }))
    .mutation(async ({ ctx, input }) => sandboxCharge({ id: ctx.user.id, role: ctx.user.role }, input)),
});
