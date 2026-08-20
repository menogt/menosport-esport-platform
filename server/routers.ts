import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import {
  createClanForUser,
  createTeamForUser,
  createTournamentForUser,
  getClanDashboard,
  getClansForUser,
  getPlayerDashboard,
  getTeamsForUser,
  getOpenDisputes,
  openMatchDispute,
  resolveMatchDispute,
  submitMatchReport,
  updatePlayerProfile,
  getTournamentById,
  getTournamentMatches,
} from "./db";

const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required." });
  return next({ ctx });
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  dashboard: router({
    player: protectedProcedure.query(({ ctx }) => getPlayerDashboard(ctx.user.id)),
    updateProfile: protectedProcedure
      .input(z.object({ handle: z.string().min(2).max(48), bio: z.string().max(500).optional(), region: z.string().max(64).optional(), primaryGame: z.string().max(64).optional() }))
      .mutation(({ ctx, input }) => updatePlayerProfile({ ...input, userId: ctx.user.id })),
  }),
  clans: router({
    mine: protectedProcedure.query(({ ctx }) => getClansForUser(ctx.user.id)),
    dashboard: protectedProcedure
      .input(z.object({ clanId: z.number().int().positive() }))
      .query(({ ctx, input }) => getClanDashboard(input.clanId, ctx.user.id)),
    create: protectedProcedure
      .input(z.object({
        name: z.string().min(2).max(80),
        tag: z.string().min(2).max(12),
        region: z.string().max(64).optional(),
        bio: z.string().max(500).optional(),
        foundedYear: z.number().int().min(1900).max(2100).optional(),
        socials: z.string().max(500).optional(),
      }))
      .mutation(({ ctx, input }) => createClanForUser({ ...input, ownerId: ctx.user.id })),
  }),
  teams: router({
    mine: protectedProcedure.query(({ ctx }) => getTeamsForUser(ctx.user.id)),
    create: protectedProcedure
      .input(z.object({
        name: z.string().min(2).max(80),
        tag: z.string().min(2).max(12),
        game: z.string().min(2).max(64),
        region: z.string().max(64).optional(),
        description: z.string().max(500).optional(),
      }))
      .mutation(({ ctx, input }) => createTeamForUser({ ...input, ownerId: ctx.user.id })),
  }),
  tournaments: router({
    create: protectedProcedure
      .input(z.object({
        name: z.string().min(3).max(120),
        game: z.string().min(2).max(64),
        format: z.enum(["single_elimination", "double_elimination", "round_robin", "swiss"]),
        startsAt: z.coerce.date(),
        registrationClosesAt: z.coerce.date().optional(),
        prizePoolCents: z.number().int().min(0).max(100000000).optional(),
        entryFeeCents: z.number().int().min(0).max(10000000).optional(),
        maxTeams: z.number().int().min(2).max(256).optional(),
        rules: z.string().max(5000).optional(),
        sponsorName: z.string().max(120).optional(),
        streamUrl: z.string().url().max(500).optional().or(z.literal("")),
        clanEligible: z.boolean().optional(),
      }))
      .mutation(({ ctx, input }) => createTournamentForUser({ ...input, createdBy: ctx.user.id })),
    byId: protectedProcedure
      .input(z.object({ tournamentId: z.number().int().positive() }))
      .query(({ input }) => getTournamentById(input.tournamentId)),
  }),
  matches: router({
    report: protectedProcedure
      .input(z.object({ matchId: z.number().int().positive(), teamId: z.number().int().positive(), scoreFor: z.number().int().min(0).max(99), scoreAgainst: z.number().int().min(0).max(99), screenshotUrl: z.string().url().max(500).optional().or(z.literal("")), notes: z.string().max(1000).optional() }))
      .mutation(({ ctx, input }) => submitMatchReport({ ...input, submittedBy: ctx.user.id })),
    openDispute: protectedProcedure
      .input(z.object({ matchId: z.number().int().positive(), reason: z.string().min(10).max(1000) }))
      .mutation(({ ctx, input }) => openMatchDispute({ ...input, openedBy: ctx.user.id })),
    disputes: router({
      open: adminProcedure.query(() => getOpenDisputes()),
      resolve: adminProcedure
        .input(z.object({ disputeId: z.number().int().positive(), winnerTeamId: z.number().int().positive(), adminDecision: z.string().min(10).max(1000) }))
        .mutation(({ ctx, input }) => resolveMatchDispute({ ...input, resolvedBy: ctx.user.id })),
    }),
    matches: protectedProcedure
      .input(z.object({ tournamentId: z.number().int().positive() }))
      .query(({ input }) => getTournamentMatches(input.tournamentId)),
  }),
});

export type AppRouter = typeof appRouter;
