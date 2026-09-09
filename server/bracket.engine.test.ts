import { describe, expect, it } from "vitest";
import {
  computePlacements, computeStandings, nextPowerOfTwo, pairSwissRound, planBracket, planDoubleElimination, planRoundRobin, planSingleElimination, planSwissFirstRound, roundCount, roundLabel, seedOrder,
  type BracketMatchLike,
} from "./domain/bracket";
import { materializePlan, pickNextPlayable, planTournamentBracket, plausibleScore, plausibleWinner, repairDoubleEliminationLinks, resolveResult, simulateBracket } from "./domain/matches";

const ids = (count: number) => Array.from({ length: count }, (_, index) => index + 1);
const find = (matches: BracketMatchLike[], bracket: BracketMatchLike["bracket"], round: number, position: number) => {
  const match = matches.find(row => row.bracket === bracket && row.round === round && row.position === position);
  if (!match) throw new Error(`Missing ${bracket} ${round}-${position}`);
  return match;
};
const play = (matches: BracketMatchLike[], match: BracketMatchLike, winner: number, format: "single_elimination" | "double_elimination" = "double_elimination") => {
  const loserScore = 1;
  const homeScore = winner === match.homeTeamId ? 2 : loserScore;
  const awayScore = winner === match.awayTeamId ? 2 : loserScore;
  return resolveResult(matches, match.id, winner, homeScore, awayScore, format);
};

describe("single elimination", () => {
  it.each([4, 5, 8, 13])("plans a full bracket with byes for %i teams and plays to a champion", teamCount => {
    const teamIds = ids(teamCount);
    const plan = planSingleElimination(teamIds);
    const size = nextPowerOfTwo(teamCount);
    expect(plan).toHaveLength(size - 1);
    expect(roundCount("single_elimination", teamCount)).toBe(Math.log2(size));

    const firstRound = plan.filter(match => match.round === 1);
    const byes = firstRound.filter(match => match.homeTeamId === null || match.awayTeamId === null);
    expect(byes).toHaveLength(size - teamCount);
    for (const bye of byes) {
      expect(bye.status).toBe("completed");
      expect(bye.winnerTeamId).toBe(bye.homeTeamId ?? bye.awayTeamId);
    }

    // Seeds 1 and 2 land in opposite halves of the draw.
    expect(firstRound[0].homeTeamId).toBe(1);
    expect(firstRound[firstRound.length / 2].homeTeamId).toBe(2);

    // Every bye winner is already placed in the next round.
    for (const bye of byes) {
      const next = plan.find(match => match.key === bye.nextMatchKey);
      expect(next).toBeDefined();
      expect([next?.homeTeamId, next?.awayTeamId]).toContain(bye.winnerTeamId);
    }

    const { matches, champion } = simulateBracket(plan, "single_elimination", { idBase: 1000, seedOrder: teamIds, bestOf: 3 });
    expect(champion).not.toBeNull();
    expect(teamIds).toContain(champion);
    expect(matches.every(match => match.status === "completed")).toBe(true);
    // Exactly N-1 real (two-team) matches decide a champion.
    expect(matches.filter(match => match.homeTeamId !== null && match.awayTeamId !== null)).toHaveLength(teamCount - 1);

    const placements = computePlacements(matches, "single_elimination", teamIds);
    expect(placements[0]).toEqual({ teamId: champion, placement: 1 });
    expect(placements).toHaveLength(teamCount);
    expect(placements.filter(row => row.placement === 2)).toHaveLength(1);
  });

  it("stops after the first round when simulating mid-flight", () => {
    const plan = planSingleElimination(ids(8));
    const { matches, champion } = simulateBracket(plan, "single_elimination", { idBase: 0, seedOrder: ids(8), bestOf: 1, throughRound: 1 });
    expect(champion).toBeNull();
    expect(matches.filter(match => match.round === 1).every(match => match.status === "completed")).toBe(true);
    expect(matches.filter(match => match.round > 1).every(match => match.status === "upcoming")).toBe(true);
    expect(matches.filter(match => match.round === 2).every(match => match.homeTeamId !== null && match.awayTeamId !== null)).toBe(true);
    expect(pickNextPlayable(matches, 1)).toBeNull();
    expect(pickNextPlayable(matches)?.round).toBe(2);
  });

  it("labels rounds by distance from the final", () => {
    expect(roundLabel("single_elimination", "winners", 1, 3)).toBe("Quarterfinals");
    expect(roundLabel("single_elimination", "winners", 2, 3)).toBe("Semifinals");
    expect(roundLabel("single_elimination", "winners", 3, 3)).toBe("Grand final");
    expect(roundLabel("single_elimination", "winners", 1, 4)).toBe("Round of 16");
    expect(roundLabel("double_elimination", "winners", 3, 3)).toBe("Upper final");
    expect(roundLabel("double_elimination", "losers", 2, 3)).toBe("Lower round 2");
    expect(roundLabel("double_elimination", "grand_final", 2, 3)).toBe("Grand final reset");
  });

  it("orders seeds so the top seeds meet last", () => {
    expect(seedOrder(4)).toEqual([1, 4, 2, 3]);
    expect(seedOrder(8)).toEqual([1, 8, 4, 5, 2, 7, 3, 6]);
  });
});

describe("double elimination", () => {
  it("runs four teams through the lower bracket, a grand final reset, and a champion", () => {
    const plan = planDoubleElimination(ids(4));
    expect(plan.map(match => match.key).sort()).toEqual(["GF-1", "GF-2", "L1-1", "L2-1", "W1-1", "W1-2", "W2-1"]);
    let state = materializePlan(plan, 100);

    // Upper round 1: 1 beats 4, 2 beats 3.
    let result = play(state, find(state, "winners", 1, 1), 1);
    state = result.matches;
    result = play(state, find(state, "winners", 1, 2), 2);
    state = result.matches;
    const lower1 = find(state, "losers", 1, 1);
    expect([lower1.homeTeamId, lower1.awayTeamId].sort()).toEqual([3, 4]);
    const upperFinal = find(state, "winners", 2, 1);
    expect([upperFinal.homeTeamId, upperFinal.awayTeamId].sort()).toEqual([1, 2]);

    // Lower round 1: 3 eliminates 4. Upper final: 1 beats 2, who drops to the lower final.
    state = play(state, lower1, 3).matches;
    state = play(state, upperFinal, 1).matches;
    const lowerFinal = find(state, "losers", 2, 1);
    expect([lowerFinal.homeTeamId, lowerFinal.awayTeamId].sort()).toEqual([2, 3]);
    const grandFinal = find(state, "grand_final", 1, 1);
    expect(grandFinal.homeTeamId).toBe(1);

    // Lower final: 2 beats 3 and reaches the grand final from the lower side.
    state = play(state, lowerFinal, 2).matches;
    expect(find(state, "grand_final", 1, 1).awayTeamId).toBe(2);

    // Grand final: the lower-bracket team wins, forcing a reset.
    result = play(state, find(state, "grand_final", 1, 1), 2);
    state = result.matches;
    expect(result.resetRequired).toBe(true);
    expect(result.champion).toBeNull();
    const reset = find(state, "grand_final", 2, 1);
    expect(reset.status).toBe("upcoming");
    expect(reset.homeTeamId).toBe(1);
    expect(reset.awayTeamId).toBe(2);

    // Reset: 2 wins again and takes the title.
    result = play(state, reset, 2);
    state = result.matches;
    expect(result.champion).toBe(2);
    expect(computePlacements(state, "double_elimination", ids(4))).toEqual([
      { teamId: 2, placement: 1 },
      { teamId: 1, placement: 2 },
      { teamId: 3, placement: 3 },
      { teamId: 4, placement: 4 },
    ]);
  });

  it("crowns the upper-bracket team immediately when it wins the first grand final", () => {
    const plan = planDoubleElimination(ids(4));
    let state = materializePlan(plan, 200);
    state = play(state, find(state, "winners", 1, 1), 1).matches;
    state = play(state, find(state, "winners", 1, 2), 2).matches;
    state = play(state, find(state, "losers", 1, 1), 3).matches;
    state = play(state, find(state, "winners", 2, 1), 1).matches;
    state = play(state, find(state, "losers", 2, 1), 2).matches;
    const result = play(state, find(state, "grand_final", 1, 1), 1);
    expect(result.resetRequired).toBe(false);
    expect(result.champion).toBe(1);
    expect(find(result.matches, "grand_final", 2, 1).status).toBe("upcoming");
    expect(find(result.matches, "grand_final", 2, 1).homeTeamId).toBeNull();
  });

  it("repairs the lower-bracket links the engine mis-wires for eight-slot brackets", () => {
    const raw = planDoubleElimination(ids(8));
    const dangling = raw.filter(match => match.nextMatchKey && !raw.some(other => other.key === match.nextMatchKey));
    expect(dangling.map(match => match.key)).toEqual(["L2-2"]);

    const repaired = repairDoubleEliminationLinks(raw);
    expect(repaired.every(match => !match.nextMatchKey || repaired.some(other => other.key === match.nextMatchKey))).toBe(true);
    const link = (key: string) => repaired.find(match => match.key === key);
    expect(link("L1-1")).toMatchObject({ nextMatchKey: "L2-1", nextMatchSlot: "home" });
    expect(link("L1-2")).toMatchObject({ nextMatchKey: "L2-2", nextMatchSlot: "home" });
    expect(link("L2-1")).toMatchObject({ nextMatchKey: "L3-1", nextMatchSlot: "home" });
    expect(link("L2-2")).toMatchObject({ nextMatchKey: "L3-1", nextMatchSlot: "away" });
    expect(link("L3-1")).toMatchObject({ nextMatchKey: "L4-1", nextMatchSlot: "home" });
    expect(link("L4-1")).toMatchObject({ nextMatchKey: "GF-1", nextMatchSlot: "away" });
    // Upper-bracket drops are untouched and every lower-bracket away slot in an even round is reserved for one.
    expect(link("W2-1")).toMatchObject({ loserNextMatchKey: "L2-2", loserNextMatchSlot: "away" });
    expect(link("W3-1")).toMatchObject({ loserNextMatchKey: "L4-1", loserNextMatchSlot: "away" });
    // Four-team brackets are already correct and stay identical.
    expect(repairDoubleEliminationLinks(planDoubleElimination(ids(4)))).toEqual(planDoubleElimination(ids(4)));
    expect(planTournamentBracket("single_elimination", ids(5))).toEqual(planSingleElimination(ids(5)));
  });

  it.each([3, 5, 6, 7, 8, 12, 16])("cascades lower-bracket byes and completes with %i teams", teamCount => {
    const plan = planTournamentBracket("double_elimination", ids(teamCount));
    const { matches, champion } = simulateBracket(plan, "double_elimination", { idBase: 300, seedOrder: ids(teamCount), bestOf: 3 });
    expect(champion).not.toBeNull();
    const unfinished = matches.filter(match => match.status !== "completed" && !(match.bracket === "grand_final" && match.round === 2));
    expect(unfinished).toEqual([]);
    const placements = computePlacements(matches, "double_elimination", ids(teamCount));
    expect(placements[0].teamId).toBe(champion);
    expect(placements).toHaveLength(teamCount);
  });
});

describe("round robin", () => {
  it("schedules every pair exactly once for five teams", () => {
    const plan = planRoundRobin(ids(5));
    expect(plan).toHaveLength(10);
    expect(roundCount("round_robin", 5)).toBe(5);
    const pairs = new Set(plan.map(match => [match.homeTeamId, match.awayTeamId].sort().join(":")));
    expect(pairs.size).toBe(10);
    for (let round = 1; round <= 5; round++) {
      const inRound = plan.filter(match => match.round === round);
      expect(inRound).toHaveLength(2);
      const teams = inRound.flatMap(match => [match.homeTeamId, match.awayTeamId]);
      expect(new Set(teams).size).toBe(teams.length);
    }
    for (const teamId of ids(5)) expect(plan.filter(match => match.homeTeamId === teamId || match.awayTeamId === teamId)).toHaveLength(4);
    expect(planBracket("round_robin", ids(4))).toHaveLength(6);
  });

  it("produces a standings table with points and score difference", () => {
    const plan = planRoundRobin(ids(4));
    const { matches, champion } = simulateBracket(plan, "round_robin", { idBase: 400, seedOrder: ids(4), bestOf: 1 });
    expect(champion).toBeNull();
    const standings = computeStandings(matches, ids(4));
    expect(standings).toHaveLength(4);
    expect(standings.every(row => row.played === 3)).toBe(true);
    expect(standings.reduce((sum, row) => sum + row.wins, 0)).toBe(6);
    expect(standings.reduce((sum, row) => sum + row.points, 0)).toBe(18);
    for (let index = 1; index < standings.length; index++) expect(standings[index - 1].points).toBeGreaterThanOrEqual(standings[index].points);
    expect(computePlacements(matches, "round_robin", ids(4)).map(row => row.placement)).toEqual([1, 2, 3, 4]);
  });
});

describe("swiss", () => {
  it("pairs later rounds without rematches and gives byes to odd fields", () => {
    const teamIds = ids(8);
    const round1 = materializePlan(planSwissFirstRound(teamIds), 500);
    expect(round1).toHaveLength(4);
    expect(round1.map(match => [match.homeTeamId, match.awayTeamId])).toEqual([[1, 5], [2, 6], [3, 7], [4, 8]]);

    let history: BracketMatchLike[] = round1.map(match => ({ ...match, status: "completed", winnerTeamId: match.homeTeamId, homeScore: 2, awayScore: 0 }));
    const played = new Set(history.map(match => [match.homeTeamId, match.awayTeamId].sort().join(":")));

    for (let round = 2; round <= roundCount("swiss", 8); round++) {
      const standings = computeStandings(history, teamIds);
      const pairing = pairSwissRound(standings, history, round);
      expect(pairing).toHaveLength(4);
      for (const match of pairing) {
        const key = [match.homeTeamId, match.awayTeamId].sort().join(":");
        expect(played.has(key)).toBe(false);
        played.add(key);
      }
      const next = materializePlan(pairing, 500 + round * 10).map(match => ({ ...match, status: "completed" as const, winnerTeamId: (match.id % 2 === 0 ? match.homeTeamId : match.awayTeamId) as number, homeScore: match.id % 2 === 0 ? 2 : 1, awayScore: match.id % 2 === 0 ? 1 : 2 }));
      history = [...history, ...next];
    }

    // An odd field: drop team 8 from the history and pair seven teams.
    const sevenHistory = history.filter(match => match.homeTeamId !== 8 && match.awayTeamId !== 8);
    const sevenStandings = computeStandings(sevenHistory, ids(7));
    const odd = pairSwissRound(sevenStandings, sevenHistory, 4);
    expect(odd).toHaveLength(4);
    const bye = odd.find(match => match.awayTeamId === null);
    expect(bye?.status).toBe("completed");
    expect(bye?.winnerTeamId).toBe(bye?.homeTeamId);
    expect(odd.filter(match => match.awayTeamId !== null).every(match => !played.has([match.homeTeamId, match.awayTeamId].sort().join(":")))).toBe(true);
  });

  it("breaks ties with Buchholz and score difference", () => {
    const row = (id: number, round: number, home: number, away: number, winner: number): BracketMatchLike => ({ id, bracket: "swiss", round, position: 1, homeTeamId: home, awayTeamId: away, homeScore: winner === home ? 2 : 0, awayScore: winner === away ? 2 : 0, status: "completed", winnerTeamId: winner, nextMatchId: null, nextMatchSlot: null, loserNextMatchId: null, loserNextMatchSlot: null });
    // Round 1: 1 beats 2, 3 beats 4. Round 2: 2 beats 4. Teams 1, 2, and 3 all sit on 3 points.
    const standings = computeStandings([row(1, 1, 1, 2, 1), row(2, 1, 3, 4, 3), row(3, 2, 2, 4, 2)], ids(4));
    expect(standings.map(team => team.teamId)).toEqual([1, 2, 3, 4]);
    const byTeam = new Map(standings.map(team => [team.teamId, team]));
    // 1 and 2 share Buchholz 3 (both faced a 3-point opponent); 1 wins on score difference. 3 only beat a winless team.
    expect(byTeam.get(1)?.buchholz).toBe(3);
    expect(byTeam.get(2)?.buchholz).toBe(3);
    expect(byTeam.get(3)?.buchholz).toBe(0);
    expect(byTeam.get(4)?.points).toBe(0);
    expect(byTeam.get(4)?.losses).toBe(2);
  });
});

describe("simulation helpers", () => {
  it("produces deterministic, plausible series scores", () => {
    expect(plausibleScore(7, 3)).toEqual({ winnerScore: 2, loserScore: 1 });
    expect(plausibleScore(8, 3)).toEqual({ winnerScore: 2, loserScore: 0 });
    expect(plausibleScore(5, 1)).toEqual({ winnerScore: 1, loserScore: 0 });
    expect(plausibleScore(4, 5)).toEqual({ winnerScore: 3, loserScore: 1 });
  });

  it("favours the higher seed with a stable upset", () => {
    expect(plausibleWinner({ id: 1, homeTeamId: 10, awayTeamId: 20 }, [10, 20])).toBe(10);
    expect(plausibleWinner({ id: 3, homeTeamId: 10, awayTeamId: 20 }, [10, 20])).toBe(20);
    expect(plausibleWinner({ id: 1, homeTeamId: 20, awayTeamId: 10 }, [10, 20])).toBe(10);
  });

  it("rejects results for unknown matches and reports the winner patch first", () => {
    const state = materializePlan(planSingleElimination(ids(2)), 0);
    expect(() => resolveResult(state, 999, 1, 2, 0, "single_elimination")).toThrow();
    const result = resolveResult(state, state[0].id, 1, 2, 0, "single_elimination");
    expect(result.patches[0]).toEqual({ id: state[0].id, patch: { homeScore: 2, awayScore: 0, winnerTeamId: 1, status: "completed" } });
    expect(result.champion).toBe(1);
  });
});
