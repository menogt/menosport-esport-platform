import { DISPUTE_STATUSES, MATCH_STATUSES, PAYMENT_STATUSES, PRODUCT_CATEGORIES, REGISTRATION_STATUSES, SPONSOR_PLACEMENTS, SPONSOR_TIERS, TOURNAMENT_STATUSES, USER_ROLES } from "@shared/arena";
import { z } from "zod";
import { adminProcedure, router } from "../_core/trpc";
import {
  adminOverview, createAnnouncement, listAnnouncements, listClansAdmin, listDisputesAdmin, listMatchesAdmin, listMediaAdmin, listOrdersAdmin, listPaymentsAdmin, listProductsAdmin,
  listRegistrationsAdmin, listSponsorsAdmin, listTeamsAdmin, listTournamentsAdmin, listUsers, refundPayment, removeAnnouncement, removeCampaign, removeClanAdmin, removeMediaAdmin,
  removeProduct, removeSponsor, removeTeamAdmin, removeTournamentAdmin, removeUser, scheduleMatch, setClanVerified, setMatchStatus, setMediaPublished, setRegistrationStatus,
  setUserRole, upsertCampaign, upsertProduct, upsertSponsor,
} from "../domain/admin";

const id = z.number().int().positive();
const url = z.string().trim().url().max(500);
const search = z.string().trim().max(80).optional();

export const adminRouter = router({
  overview: adminProcedure.query(() => adminOverview()),

  users: router({
    list: adminProcedure
      .input(z.object({ search, role: z.enum(USER_ROLES).optional(), limit: z.number().int().min(1).max(200).optional(), cursor: id.optional() }).optional())
      .query(({ input }) => listUsers(input ?? {})),
    setRole: adminProcedure.input(z.object({ userId: id, role: z.enum(USER_ROLES) })).mutation(({ ctx, input }) => setUserRole(ctx.user, input)),
    remove: adminProcedure.input(z.object({ userId: id })).mutation(({ ctx, input }) => removeUser(ctx.user, input.userId)),
  }),

  teams: router({
    list: adminProcedure.input(z.object({ search, game: z.string().trim().max(80).optional() }).optional()).query(({ input }) => listTeamsAdmin(input ?? {})),
    remove: adminProcedure.input(z.object({ teamId: id })).mutation(({ input }) => removeTeamAdmin(input.teamId)),
  }),

  clans: router({
    list: adminProcedure.input(z.object({ search, verified: z.boolean().optional() }).optional()).query(({ input }) => listClansAdmin(input ?? {})),
    setVerified: adminProcedure.input(z.object({ clanId: id, verified: z.boolean() })).mutation(({ input }) => setClanVerified(input)),
    remove: adminProcedure.input(z.object({ clanId: id })).mutation(({ input }) => removeClanAdmin(input.clanId)),
  }),

  tournaments: router({
    list: adminProcedure.input(z.object({ status: z.enum(TOURNAMENT_STATUSES).optional() }).optional()).query(({ input }) => listTournamentsAdmin(input ?? {})),
    remove: adminProcedure.input(z.object({ tournamentId: id })).mutation(({ input }) => removeTournamentAdmin(input.tournamentId)),
  }),

  matches: router({
    list: adminProcedure.input(z.object({ tournamentId: id.optional(), status: z.enum(MATCH_STATUSES).optional() }).optional()).query(({ input }) => listMatchesAdmin(input ?? {})),
    setStatus: adminProcedure.input(z.object({ matchId: id, status: z.enum(MATCH_STATUSES) })).mutation(({ input }) => setMatchStatus(input)),
    schedule: adminProcedure
      .input(z.object({ matchId: id, scheduledAt: z.coerce.date().nullable().optional(), streamUrl: url.or(z.literal("")).nullable().optional() }))
      .mutation(({ input }) => scheduleMatch(input)),
  }),

  registrations: router({
    list: adminProcedure.input(z.object({ tournamentId: id.optional() }).optional()).query(({ input }) => listRegistrationsAdmin(input ?? {})),
    setStatus: adminProcedure.input(z.object({ registrationId: id, status: z.enum(REGISTRATION_STATUSES) })).mutation(({ input }) => setRegistrationStatus(input)),
  }),

  payments: router({
    list: adminProcedure.input(z.object({ status: z.enum(PAYMENT_STATUSES).optional(), kind: z.enum(["order", "entry_fee"]).optional() }).optional()).query(({ input }) => listPaymentsAdmin(input ?? {})),
    refund: adminProcedure.input(z.object({ paymentId: id })).mutation(({ input }) => refundPayment(input.paymentId)),
  }),

  sponsors: router({
    list: adminProcedure.query(() => listSponsorsAdmin()),
    upsert: adminProcedure
      .input(z.object({
        id: id.optional(), name: z.string().trim().min(2).max(80), mark: z.string().trim().min(1).max(4), logoUrl: url.optional(), websiteUrl: url.optional(),
        tier: z.enum(SPONSOR_TIERS), tone: z.enum(["lime", "steel", "amber"]), clanId: id.nullable().optional(), active: z.boolean().optional(),
      }))
      .mutation(({ input }) => upsertSponsor(input)),
    remove: adminProcedure.input(z.object({ sponsorId: id })).mutation(({ input }) => removeSponsor(input.sponsorId)),
  }),

  campaigns: router({
    upsert: adminProcedure
      .input(z.object({
        id: id.optional(), sponsorId: id, tournamentId: id.nullable().optional(), clanId: id.nullable().optional(), placement: z.enum(SPONSOR_PLACEMENTS),
        headline: z.string().trim().min(2).max(140), body: z.string().trim().max(600).optional(), ctaLabel: z.string().trim().max(60).optional(), ctaUrl: url.optional(),
        startsAt: z.coerce.date().nullable().optional(), endsAt: z.coerce.date().nullable().optional(), active: z.boolean().optional(),
      }))
      .mutation(({ input }) => upsertCampaign(input)),
    remove: adminProcedure.input(z.object({ campaignId: id })).mutation(({ input }) => removeCampaign(input.campaignId)),
  }),

  products: router({
    list: adminProcedure.query(() => listProductsAdmin()),
    upsert: adminProcedure
      .input(z.object({
        id: id.optional(), sku: z.string().trim().min(2).max(40), name: z.string().trim().min(2).max(120), description: z.string().trim().max(600).optional(), category: z.enum(PRODUCT_CATEGORIES),
        priceCents: z.number().int().min(0).max(10_000_000), currency: z.string().trim().length(3).optional(), imageUrl: url.optional(), inventoryLabel: z.string().trim().max(80).optional(),
        badge: z.string().trim().max(40).optional(), color: z.string().trim().max(80).optional(), orgLabel: z.string().trim().max(80).optional(), clanId: id.nullable().optional(), active: z.boolean().optional(),
      }))
      .mutation(({ input }) => upsertProduct(input)),
    remove: adminProcedure.input(z.object({ productId: id })).mutation(({ input }) => removeProduct(input.productId)),
  }),

  orders: router({
    list: adminProcedure.query(() => listOrdersAdmin()),
  }),

  media: router({
    list: adminProcedure.input(z.object({ published: z.boolean().optional() }).optional()).query(({ input }) => listMediaAdmin(input ?? {})),
    setPublished: adminProcedure.input(z.object({ mediaId: id, published: z.boolean() })).mutation(({ input }) => setMediaPublished(input)),
    remove: adminProcedure.input(z.object({ mediaId: id })).mutation(({ input }) => removeMediaAdmin(input.mediaId)),
  }),

  announcements: router({
    list: adminProcedure.query(() => listAnnouncements()),
    create: adminProcedure
      .input(z.object({ title: z.string().trim().min(2).max(140), body: z.string().trim().min(2).max(4000), pinned: z.boolean().optional(), tournamentId: id.nullable().optional() }))
      .mutation(({ ctx, input }) => createAnnouncement(ctx.user, input)),
    remove: adminProcedure.input(z.object({ announcementId: id })).mutation(({ input }) => removeAnnouncement(input.announcementId)),
  }),

  disputes: router({
    /** Read-only; resolution lives in `matches.disputes.resolve`. */
    list: adminProcedure.input(z.object({ status: z.enum(DISPUTE_STATUSES).optional() }).optional()).query(({ input }) => listDisputesAdmin(input ?? {})),
  }),
});
