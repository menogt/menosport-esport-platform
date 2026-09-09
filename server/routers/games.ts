import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { gameHub, listGames } from "../domain/games";

export const gamesRouter = router({
  list: publicProcedure.query(async () => listGames()),
  hub: publicProcedure.input(z.object({ slug: z.string().trim().min(1).max(80) })).query(async ({ input }) => gameHub(input.slug)),
});
