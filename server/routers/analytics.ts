import { adminProcedure, publicProcedure, router } from "../_core/trpc";
import { analyticsOverview, platformStats } from "../domain/analytics";

export const analyticsRouter = router({
  /** Admin-only platform analytics computed from live tables (demo data without a database). */
  overview: adminProcedure.query(() => analyticsOverview()),
  /** Public homepage counters. */
  platform: publicProcedure.query(() => platformStats()),
});
