import { INTEGRATION_PROVIDERS, PRODUCT_CATEGORIES, SPONSOR_PLACEMENTS } from "@shared/arena";
import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { checkout, communityHub, connectIntegration, disconnectIntegration, featuredCampaigns, listSponsors, myOrders, rolePreview, storeCatalog, storeProduct } from "../domain/commerce";

const id = z.number().int().positive();

export const sponsorsRouter = router({
  featured: publicProcedure
    .input(z.object({ placement: z.enum(SPONSOR_PLACEMENTS).optional(), tournamentId: id.optional(), clanId: id.optional() }).optional())
    .query(({ input }) => featuredCampaigns(input ?? {})),
  list: publicProcedure.query(() => listSponsors()),
});

export const storeRouter = router({
  catalog: publicProcedure
    .input(z.object({ category: z.enum(PRODUCT_CATEGORIES).optional(), clanId: id.optional(), search: z.string().trim().max(80).optional() }).optional())
    .query(({ input }) => storeCatalog(input ?? {})),

  product: publicProcedure.input(z.object({ sku: z.string().trim().min(1).max(60) })).query(({ input }) => storeProduct(input.sku)),

  /** Sandbox checkout — settles immediately with a `sbx_` reference; no external provider. */
  checkout: protectedProcedure
    .input(z.object({
      items: z.array(z.object({ productId: id, quantity: z.number().int().min(1).max(99), variantLabel: z.string().trim().max(60).optional() })).min(1).max(30),
      email: z.string().trim().email().max(200).optional(),
    }))
    .mutation(({ ctx, input }) => checkout(ctx.user, input)),

  orders: router({
    mine: protectedProcedure.query(({ ctx }) => myOrders(ctx.user)),
  }),
});

const scopeInput = { clanId: id.optional(), tournamentId: id.optional() };

export const communityRouter = router({
  hub: publicProcedure.query(() => communityHub()),

  connect: protectedProcedure
    .input(z.object({
      provider: z.enum(INTEGRATION_PROVIDERS),
      ...scopeInput,
      displayName: z.string().trim().min(2).max(80),
      externalId: z.string().trim().max(120).optional(),
      webhookUrl: z.string().trim().url().max(500).optional(),
      roleMapping: z.record(z.string().max(60), z.string().max(60)).optional(),
    }).refine(value => Number(Boolean(value.clanId)) + Number(Boolean(value.tournamentId)) === 1, { message: "Provide exactly one of clanId or tournamentId." }))
    .mutation(({ ctx, input }) => connectIntegration(ctx.user, input)),

  disconnect: protectedProcedure.input(z.object({ integrationId: id })).mutation(({ ctx, input }) => disconnectIntegration(ctx.user, input.integrationId)),

  rolePreview: protectedProcedure
    .input(z.object(scopeInput).refine(value => Number(Boolean(value.clanId)) + Number(Boolean(value.tournamentId)) === 1, { message: "Provide exactly one of clanId or tournamentId." }))
    .query(({ ctx, input }) => rolePreview(ctx.user, input)),
});
