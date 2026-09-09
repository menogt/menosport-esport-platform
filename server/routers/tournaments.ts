import { TOURNAMENT_FORMATS, TOURNAMENT_STATUSES } from "@shared/arena";
import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { createTournamentForUser } from "../db";
import { hasDb, notFound } from "../domain/_shared";
import {
  checkInTeam, createAnnouncement, createTournament, featuredTournaments, generateBracket, getStandings, getTournamentDetail, listAnnouncements, listTournaments, myTournaments,
  nextSwissRound, registerTeam, seedStandings, seedTournamentDetail, seedTournamentList, setTournamentStatus, updateTournament, withdrawTeam,
} from "../domain/tournaments";

const id = z.number().int().positive();
const bestOf = z.union([z.literal(1), z.literal(3), z.literal(5), z.literal(7)]);
const optionalText = (max: number) => z.string().max(max).optional();

const listInput = z.object({
  game: z.string().trim().max(80).optional(),
  status: z.enum(TOURNAMENT_STATUSES).optional(),
  format: z.enum(TOURNAMENT_FORMATS).optional(),
  search: z.string().trim().max(120).optional(),
  limit: z.number().int().min(1).max(100).optional(),
}).optional();

const createInput = z.object({
  name: z.string().trim().min(3).max(120),
  game: z.string().trim().min(2).max(80),
  format: z.enum(TOURNAMENT_FORMATS),
  startsAt: z.date(),
  registrationClosesAt: z.date().optional(),
  prizePoolCents: z.number().int().min(0).max(1_000_000_000).optional(),
  entryFeeCents: z.number().int().min(0).max(100_000_000).optional(),
  maxTeams: z.number().int().min(2).max(256).optional(),
  rules: optionalText(8000),
  sponsorName: optionalText(120),
  streamUrl: optionalText(500),
  clanEligible: z.boolean().optional(),
  description: optionalText(4000),
  checkinOpensAt: z.date().optional(),
  bestOf: bestOf.optional(),
  prizeSplit: z.array(z.number().min(0).max(100)).min(1).max(16).optional(),
  sponsorContributionCents: z.number().int().min(0).max(1_000_000_000).optional(),
  region: optionalText(60),
  discordUrl: optionalText(500),
  bannerUrl: optionalText(1000),
  status: z.enum(["draft", "registration"]).optional(),
});

const updateInput = createInput.omit({ status: true }).partial().extend({ tournamentId: id });

const teamAction = z.object({ tournamentId: id, teamId: id });

export const tournamentsRouter = router({
  list: publicProcedure.input(listInput).query(async ({ input }) => (hasDb() ? listTournaments(input ?? {}) : seedTournamentList(input ?? {}))),

  featured: publicProcedure.query(async () => (hasDb() ? featuredTournaments() : seedTournamentList({ limit: 50 }).filter(row => row.status === "live" || row.status === "checkin" || row.status === "registration").slice(0, 6))),

  byId: publicProcedure.input(z.object({ tournamentId: id })).query(async ({ ctx, input }) => {
    const actor = ctx.user ? { id: ctx.user.id, role: ctx.user.role } : null;
    return hasDb() ? getTournamentDetail(input.tournamentId, actor) : seedTournamentDetail(input.tournamentId, actor);
  }),

  mine: protectedProcedure.query(async ({ ctx }) => {
    if (!hasDb()) return { organized: [], entered: [] };
    return myTournaments({ id: ctx.user.id, role: ctx.user.role });
  }),

  create: protectedProcedure.input(createInput).mutation(async ({ ctx, input }) => {
    if (!hasDb()) {
      // Legacy in-memory path (tests / unconfigured deployments).
      return createTournamentForUser({ createdBy: ctx.user.id, name: input.name, game: input.game, format: input.format, startsAt: input.startsAt, registrationClosesAt: input.registrationClosesAt, prizePoolCents: input.prizePoolCents, entryFeeCents: input.entryFeeCents, maxTeams: input.maxTeams, rules: input.rules, sponsorName: input.sponsorName, streamUrl: input.streamUrl, clanEligible: input.clanEligible });
    }
    return createTournament({ id: ctx.user.id, role: ctx.user.role }, input);
  }),

  update: protectedProcedure.input(updateInput).mutation(async ({ ctx, input }) => {
    const { tournamentId, ...patch } = input;
    return updateTournament({ id: ctx.user.id, role: ctx.user.role }, tournamentId, patch);
  }),

  setStatus: protectedProcedure.input(z.object({ tournamentId: id, status: z.enum(TOURNAMENT_STATUSES) })).mutation(async ({ ctx, input }) => setTournamentStatus({ id: ctx.user.id, role: ctx.user.role }, input.tournamentId, input.status)),

  register: protectedProcedure.input(teamAction.extend({ acceptRules: z.literal(true) })).mutation(async ({ ctx, input }) => registerTeam({ id: ctx.user.id, role: ctx.user.role }, { tournamentId: input.tournamentId, teamId: input.teamId })),

  withdraw: protectedProcedure.input(teamAction).mutation(async ({ ctx, input }) => withdrawTeam({ id: ctx.user.id, role: ctx.user.role }, input)),

  checkIn: protectedProcedure.input(teamAction).mutation(async ({ ctx, input }) => checkInTeam({ id: ctx.user.id, role: ctx.user.role }, input)),

  generateBracket: protectedProcedure.input(z.object({ tournamentId: id, useCheckedInOnly: z.boolean().optional(), regenerate: z.boolean().optional() })).mutation(async ({ ctx, input }) => generateBracket({ id: ctx.user.id, role: ctx.user.role }, input)),

  standings: publicProcedure.input(z.object({ tournamentId: id })).query(async ({ input }) => {
    if (hasDb()) return getStandings(input.tournamentId);
    return seedStandings(input.tournamentId) ?? notFound("Tournament");
  }),

  nextSwissRound: protectedProcedure.input(z.object({ tournamentId: id })).mutation(async ({ ctx, input }) => nextSwissRound({ id: ctx.user.id, role: ctx.user.role }, input.tournamentId)),

  announcements: router({
    list: publicProcedure.input(z.object({ tournamentId: id })).query(async ({ input }) => (hasDb() ? listAnnouncements(input.tournamentId) : [])),
    create: protectedProcedure.input(z.object({ tournamentId: id, title: z.string().trim().min(3).max(140), body: z.string().trim().min(1).max(4000), pinned: z.boolean().optional() })).mutation(async ({ ctx, input }) => createAnnouncement({ id: ctx.user.id, role: ctx.user.role }, input)),
  }),
});
