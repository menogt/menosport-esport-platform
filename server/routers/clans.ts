import { CLAN_ROLES } from "@shared/arena";
import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import {
  clanDashboard, clanDirectory, clanLeaderboard, createClan, followClan, getClan, inviteToClan, listClanInvites, listMyClanInvites, listMyClans, removeClanMember, removeClanTeam,
  respondToClanInvite, revokeClanInvite, setClanMemberRole, updateClan,
} from "../domain/clans";

const id = z.number().int().positive();
const url = z.string().trim().url().max(500);
const socialLinksSchema = z.object({
  twitter: z.string().trim().max(200).optional(),
  instagram: z.string().trim().max(200).optional(),
  youtube: z.string().trim().max(200).optional(),
  tiktok: z.string().trim().max(200).optional(),
  discord: z.string().trim().max(200).optional(),
}).strict();

const directoryInput = z.object({
  sort: z.enum(["trophies", "earnings", "followers", "region", "newest"]).optional(),
  region: z.string().trim().max(40).optional(),
  game: z.string().trim().max(80).optional(),
  search: z.string().trim().max(80).optional(),
  limit: z.number().int().min(1).max(200).optional(),
}).optional();

export const clansRouter = router({
  mine: protectedProcedure.query(({ ctx }) => listMyClans(ctx.user)),

  create: protectedProcedure
    .input(z.object({
      name: z.string().trim().min(2).max(60),
      tag: z.string().trim().min(2).max(8),
      region: z.string().trim().max(40).optional(),
      bio: z.string().trim().max(600).optional(),
      foundedYear: z.number().int().min(1900).max(2100).optional(),
      socials: z.string().trim().max(300).optional(),
      logoUrl: url.optional(),
      bannerUrl: url.optional(),
      socialLinks: socialLinksSchema.optional(),
    }))
    .mutation(({ ctx, input }) => createClan(ctx.user, input)),

  dashboard: protectedProcedure.input(z.object({ clanId: id })).query(({ ctx, input }) => clanDashboard(ctx.user, input.clanId)),

  directory: publicProcedure.input(directoryInput).query(({ input }) => clanDirectory(input ?? {})),
  leaderboard: publicProcedure.input(directoryInput).query(({ input }) => clanLeaderboard(input ?? {})),

  byId: publicProcedure
    .input(z.object({ clanId: id.optional(), tag: z.string().trim().min(1).max(8).optional() }).refine(value => value.clanId || value.tag, { message: "Provide a clanId or tag." }))
    .query(({ ctx, input }) => getClan(input, ctx.user)),

  follow: protectedProcedure.input(z.object({ clanId: id })).mutation(({ ctx, input }) => followClan(ctx.user, input.clanId, true)),
  unfollow: protectedProcedure.input(z.object({ clanId: id })).mutation(({ ctx, input }) => followClan(ctx.user, input.clanId, false)),

  update: protectedProcedure
    .input(z.object({
      clanId: id,
      name: z.string().trim().min(2).max(60).optional(),
      tag: z.string().trim().min(2).max(8).optional(),
      region: z.string().trim().max(40).optional(),
      bio: z.string().trim().max(600).optional(),
      foundedYear: z.number().int().min(1900).max(2100).nullable().optional(),
      socials: z.string().trim().max(300).optional(),
      logoUrl: url.or(z.literal("")).optional(),
      bannerUrl: url.or(z.literal("")).optional(),
      socialLinks: socialLinksSchema.optional(),
    }))
    .mutation(({ ctx, input }) => updateClan(ctx.user, input)),

  invite: protectedProcedure
    .input(z.object({
      clanId: id,
      teamId: id.optional(),
      userId: id.optional(),
      handle: z.string().trim().min(2).max(40).optional(),
      role: z.enum(CLAN_ROLES).optional(),
      message: z.string().trim().max(300).optional(),
    }))
    .mutation(({ ctx, input }) => inviteToClan(ctx.user, input)),

  invites: router({
    mine: protectedProcedure.input(z.object({}).optional()).query(({ ctx }) => listMyClanInvites(ctx.user)),
    forClan: protectedProcedure.input(z.object({ clanId: id })).query(({ ctx, input }) => listClanInvites(ctx.user, input.clanId)),
    respond: protectedProcedure.input(z.object({ inviteId: id, accept: z.boolean() })).mutation(({ ctx, input }) => respondToClanInvite(ctx.user, input)),
    revoke: protectedProcedure.input(z.object({ inviteId: id })).mutation(({ ctx, input }) => revokeClanInvite(ctx.user, input.inviteId)),
  }),

  members: router({
    setRole: protectedProcedure.input(z.object({ clanId: id, userId: id, role: z.enum(CLAN_ROLES) })).mutation(({ ctx, input }) => setClanMemberRole(ctx.user, input)),
    remove: protectedProcedure.input(z.object({ clanId: id, userId: id })).mutation(({ ctx, input }) => removeClanMember(ctx.user, input)),
  }),

  removeTeam: protectedProcedure.input(z.object({ clanId: id, teamId: id })).mutation(({ ctx, input }) => removeClanTeam(ctx.user, input)),
});
