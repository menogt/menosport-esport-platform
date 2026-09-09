import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { hasDb } from "../domain/_shared";
import { listNotifications, markNotificationsRead, unreadCount } from "../domain/notifications";

export const notificationsRouter = router({
  list: protectedProcedure
    .input(z.object({ limit: z.number().int().min(1).max(100).optional() }).optional())
    .query(({ ctx, input }) => (hasDb() ? listNotifications(ctx.user.id, input?.limit ?? 40) : Promise.resolve([]))),

  unreadCount: protectedProcedure.query(({ ctx }) => (hasDb() ? unreadCount(ctx.user.id) : Promise.resolve(0))),

  markRead: protectedProcedure
    .input(z.object({ ids: z.array(z.number().int().positive()).max(200).optional() }).optional())
    .mutation(({ ctx, input }) => (hasDb() ? markNotificationsRead(ctx.user.id, input?.ids) : Promise.resolve({ success: true as const }))),
});
