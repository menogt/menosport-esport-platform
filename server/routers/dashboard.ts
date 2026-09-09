import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { playerDashboard, updateProfile } from "../domain/dashboard";

const url = z.string().trim().url().max(500);

export const dashboardRouter = router({
  player: protectedProcedure.query(({ ctx }) => playerDashboard(ctx.user)),

  updateProfile: protectedProcedure
    .input(z.object({
      handle: z.string().trim().min(2).max(24),
      bio: z.string().trim().max(400).optional(),
      region: z.string().trim().max(40).optional(),
      primaryGame: z.string().trim().max(80).optional(),
      avatarUrl: url.or(z.literal("")).optional(),
      bannerUrl: url.or(z.literal("")).optional(),
      socials: z.object({
        twitter: z.string().trim().max(200).optional(),
        instagram: z.string().trim().max(200).optional(),
        youtube: z.string().trim().max(200).optional(),
        tiktok: z.string().trim().max(200).optional(),
        discord: z.string().trim().max(200).optional(),
      }).strict().optional(),
    }))
    .mutation(({ ctx, input }) => updateProfile(ctx.user, input)),
});
