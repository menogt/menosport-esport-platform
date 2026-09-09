import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { adminRouter } from "./routers/admin";
import { analyticsRouter } from "./routers/analytics";
import { clansRouter } from "./routers/clans";
import { communityRouter, sponsorsRouter, storeRouter } from "./routers/commerce";
import { dashboardRouter } from "./routers/dashboard";
import { gamesRouter } from "./routers/games";
import { matchesRouter } from "./routers/matches";
import { mediaRouter } from "./routers/media";
import { notificationsRouter } from "./routers/notifications";
import { paymentsRouter } from "./routers/payments";
import { prizesRouter } from "./routers/prizes";
import { storageRouter } from "./routers/storage";
import { teamsRouter } from "./routers/teams";
import { tournamentsRouter } from "./routers/tournaments";

/**
 * Root tRPC router. Feature routers live in server/routers/* and their
 * persistence in server/domain/* (Supabase service-role client).
 */
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
  dashboard: dashboardRouter,
  clans: clansRouter,
  teams: teamsRouter,
  tournaments: tournamentsRouter,
  matches: matchesRouter,
  prizes: prizesRouter,
  payments: paymentsRouter,
  games: gamesRouter,
  notifications: notificationsRouter,
  media: mediaRouter,
  storage: storageRouter,
  community: communityRouter,
  sponsors: sponsorsRouter,
  store: storeRouter,
  analytics: analyticsRouter,
  admin: adminRouter,
});

export type AppRouter = typeof appRouter;
