import { TEAM_ROLES } from "@shared/arena";
import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import {
  createTeam, getTeam, inviteToTeam, linkTeamToClan, listMyTeamInvites, listMyTeams, listTeamInvites, listTeams, lockLineup, removeTeamMember, respondToTeamInvite,
  revokeTeamInvite, transferCaptain, unlinkTeamFromClan, unlockLineup, updateTeam,
} from "../domain/teams";

const id = z.number().int().positive();
const url = z.string().trim().url().max(500);
const socialsSchema = z.object({
  twitter: z.string().trim().max(200).optional(),
  instagram: z.string().trim().max(200).optional(),
  youtube: z.string().trim().max(200).optional(),
  tiktok: z.string().trim().max(200).optional(),
  discord: z.string().trim().max(200).optional(),
}).strict();

export const teamsRouter = router({
  mine: protectedProcedure.query(({ ctx }) => listMyTeams(ctx.user)),

  list: publicProcedure
    .input(z.object({ game: z.string().trim().max(80).optional(), region: z.string().trim().max(40).optional(), search: z.string().trim().max(80).optional(), limit: z.number().int().min(1).max(200).optional() }).optional())
    .query(({ input }) => listTeams(input ?? {})),

  byId: publicProcedure.input(z.object({ teamId: id })).query(({ ctx, input }) => getTeam(input.teamId, ctx.user)),

  create: protectedProcedure
    .input(z.object({
      name: z.string().trim().min(2).max(60),
      tag: z.string().trim().min(2).max(8),
      game: z.string().trim().min(2).max(80),
      region: z.string().trim().max(40).optional(),
      description: z.string().trim().max(500).optional(),
      logoUrl: url.optional(),
      bannerUrl: url.optional(),
      socials: socialsSchema.optional(),
    }))
    .mutation(({ ctx, input }) => createTeam(ctx.user, input)),

  update: protectedProcedure
    .input(z.object({
      teamId: id,
      name: z.string().trim().min(2).max(60).optional(),
      tag: z.string().trim().min(2).max(8).optional(),
      region: z.string().trim().max(40).optional(),
      description: z.string().trim().max(500).optional(),
      logoUrl: url.or(z.literal("")).optional(),
      bannerUrl: url.or(z.literal("")).optional(),
      socials: socialsSchema.optional(),
    }))
    .mutation(({ ctx, input }) => updateTeam(ctx.user, input)),

  invite: protectedProcedure
    .input(z.object({
      teamId: id,
      email: z.string().trim().email().max(200).optional(),
      handle: z.string().trim().min(2).max(40).optional(),
      userId: id.optional(),
      role: z.enum(TEAM_ROLES).optional(),
      message: z.string().trim().max(300).optional(),
    }))
    .mutation(({ ctx, input }) => inviteToTeam(ctx.user, input)),

  invites: router({
    mine: protectedProcedure.query(({ ctx }) => listMyTeamInvites(ctx.user)),
    forTeam: protectedProcedure.input(z.object({ teamId: id })).query(({ ctx, input }) => listTeamInvites(ctx.user, input.teamId)),
    respond: protectedProcedure.input(z.object({ inviteId: id, accept: z.boolean() })).mutation(({ ctx, input }) => respondToTeamInvite(ctx.user, input)),
    revoke: protectedProcedure.input(z.object({ inviteId: id })).mutation(({ ctx, input }) => revokeTeamInvite(ctx.user, input.inviteId)),
  }),

  removeMember: protectedProcedure.input(z.object({ teamId: id, userId: id })).mutation(({ ctx, input }) => removeTeamMember(ctx.user, input)),
  transferCaptain: protectedProcedure.input(z.object({ teamId: id, userId: id })).mutation(({ ctx, input }) => transferCaptain(ctx.user, input)),
  lockLineup: protectedProcedure.input(z.object({ teamId: id })).mutation(({ ctx, input }) => lockLineup(ctx.user, input.teamId)),
  unlockLineup: protectedProcedure.input(z.object({ teamId: id })).mutation(({ ctx, input }) => unlockLineup(ctx.user, input.teamId)),

  linkClan: protectedProcedure.input(z.object({ teamId: id, clanId: id })).mutation(({ ctx, input }) => linkTeamToClan(ctx.user, input)),
  unlinkClan: protectedProcedure.input(z.object({ teamId: id })).mutation(({ ctx, input }) => unlinkTeamFromClan(ctx.user, input.teamId)),
});
