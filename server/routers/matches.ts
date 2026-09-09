import { z } from "zod";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { getOpenDisputes, openMatchDispute, resolveMatchDispute, submitMatchReport } from "../db";
import { hasDb, notFound } from "../domain/_shared";
import { confirmReport, getMatchDetail, listMyDisputes, listOpenDisputes, listTournamentMatches, openDispute, resolveDispute, scheduleMatch, setMatchLive, submitReport } from "../domain/matches";
import { seedMatchViews, seedTournamentListItem } from "../domain/tournaments";
import { seedTournaments } from "../seed/data";

const id = z.number().int().positive();

const reportInput = z.object({
  matchId: id,
  teamId: id,
  scoreFor: z.number().int().min(0).max(99),
  scoreAgainst: z.number().int().min(0).max(99),
  screenshotUrl: z.string().max(1000).optional(),
  notes: z.string().max(2000).optional(),
});

const disputeInput = z.object({ matchId: id, reason: z.string().trim().min(10).max(2000) });

/** Demo bracket lookup for a single match when no database is configured. */
function seedMatchDetail(matchId: number) {
  for (let index = 0; index < seedTournaments.length; index++) {
    const match = seedMatchViews(index + 1).find(row => row.id === matchId);
    if (!match) continue;
    const tournament = seedTournamentListItem(index);
    return {
      ...match,
      tournament: { id: tournament.id, name: tournament.name, game: tournament.game, format: tournament.format, bestOf: tournament.bestOf, streamUrl: tournament.streamUrl, status: tournament.status, createdBy: tournament.createdBy },
      reports: [] as Record<string, any>[],
      disputes: [] as Record<string, any>[],
      viewer: null,
    };
  }
  return notFound("Match");
}

const byTournament = publicProcedure.input(z.object({ tournamentId: id })).query(async ({ input }) => (hasDb() ? listTournamentMatches(input.tournamentId) : seedMatchViews(input.tournamentId)));

export const matchesRouter = router({
  byId: publicProcedure.input(z.object({ matchId: id })).query(async ({ ctx, input }) => {
    if (!hasDb()) return seedMatchDetail(input.matchId);
    return getMatchDetail(input.matchId, ctx.user ? { id: ctx.user.id, role: ctx.user.role } : null);
  }),

  byTournament,
  /** Legacy name kept for the bracket page. */
  matches: byTournament,

  report: protectedProcedure.input(reportInput).mutation(async ({ ctx, input }) => {
    if (!hasDb()) return submitMatchReport({ ...input, submittedBy: ctx.user.id });
    return submitReport({ id: ctx.user.id, role: ctx.user.role }, input);
  }),

  confirm: protectedProcedure.input(z.object({ matchId: id })).mutation(async ({ ctx, input }) => confirmReport({ id: ctx.user.id, role: ctx.user.role }, input.matchId)),

  setLive: protectedProcedure.input(z.object({ matchId: id })).mutation(async ({ ctx, input }) => setMatchLive({ id: ctx.user.id, role: ctx.user.role }, input.matchId)),

  schedule: protectedProcedure.input(z.object({ matchId: id, scheduledAt: z.date(), streamUrl: z.string().max(500).nullable().optional() })).mutation(async ({ ctx, input }) => scheduleMatch({ id: ctx.user.id, role: ctx.user.role }, input)),

  openDispute: protectedProcedure.input(disputeInput).mutation(async ({ ctx, input }) => {
    if (!hasDb()) return openMatchDispute({ matchId: input.matchId, openedBy: ctx.user.id, reason: input.reason });
    return openDispute({ id: ctx.user.id, role: ctx.user.role }, input);
  }),

  disputes: router({
    open: adminProcedure.query(async () => (hasDb() ? listOpenDisputes() : getOpenDisputes())),
    mine: protectedProcedure.query(async ({ ctx }) => (hasDb() ? listMyDisputes({ id: ctx.user.id, role: ctx.user.role }) : [])),
    resolve: adminProcedure.input(z.object({ disputeId: id, winnerTeamId: id, adminDecision: z.string().trim().min(10).max(2000) })).mutation(async ({ ctx, input }) => {
      if (!hasDb()) return resolveMatchDispute({ ...input, resolvedBy: ctx.user.id });
      return resolveDispute({ id: ctx.user.id, role: ctx.user.role }, input);
    }),
  }),
});
