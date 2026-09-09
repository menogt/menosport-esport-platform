import { MEDIA_KINDS } from "@shared/arena";
import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { createMedia, getMedia, listMedia, listMyMedia, removeMedia, toggleMediaLike } from "../domain/media";

const id = z.number().int().positive();

export const mediaRouter = router({
  list: publicProcedure
    .input(z.object({
      kind: z.enum(MEDIA_KINDS).optional(),
      game: z.string().trim().max(80).optional(),
      clanId: id.optional(),
      tag: z.string().trim().max(40).optional(),
      sort: z.enum(["latest", "views", "likes"]).optional(),
      limit: z.number().int().min(1).max(100).optional(),
    }).optional())
    .query(({ input }) => listMedia(input ?? {})),

  byId: publicProcedure.input(z.object({ mediaId: id })).query(({ ctx, input }) => getMedia(input.mediaId, ctx.user)),

  create: protectedProcedure
    .input(z.object({
      title: z.string().trim().min(2).max(120),
      description: z.string().trim().max(600).optional(),
      assetUrl: z.string().trim().url().max(800),
      thumbnailUrl: z.string().trim().url().max(800).optional(),
      kind: z.enum(MEDIA_KINDS),
      game: z.string().trim().max(80).optional(),
      tags: z.array(z.string().trim().min(1).max(30)).max(12).optional(),
      durationSeconds: z.number().int().min(0).max(24 * 3600).optional(),
      clanId: id.optional(),
      tournamentId: id.optional(),
    }))
    .mutation(({ ctx, input }) => createMedia(ctx.user, input)),

  toggleLike: protectedProcedure.input(z.object({ mediaId: id })).mutation(({ ctx, input }) => toggleMediaLike(ctx.user, input.mediaId)),
  mine: protectedProcedure.query(({ ctx }) => listMyMedia(ctx.user)),
  remove: protectedProcedure.input(z.object({ mediaId: id })).mutation(({ ctx, input }) => removeMedia(ctx.user, input.mediaId)),
});
