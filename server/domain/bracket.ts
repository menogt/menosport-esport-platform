/**
 * Pure bracket engine. No I/O — every function takes plain data and returns
 * plain data so it can be unit-tested and reused by the Supabase persistence
 * layer (server/domain/tournaments.ts) and by client previews.
 */
import type { BracketKind, MatchStatus, TournamentFormat } from "@shared/arena";

export type PlannedMatch = {
  /** Stable key used to link matches before database ids exist. */
  key: string;
  bracket: BracketKind;
  round: number;
  position: number;
  homeTeamId: number | null;
  awayTeamId: number | null;
  /** Key of the match the winner advances to. */
  nextMatchKey: string | null;
  nextMatchSlot: "home" | "away" | null;
  /** Double elimination only: where the loser drops to. */
  loserNextMatchKey: string | null;
  loserNextMatchSlot: "home" | "away" | null;
  /** Bye matches are auto-completed with the single present team as winner. */
  status: MatchStatus;
  winnerTeamId: number | null;
};

export type BracketMatchLike = {
  id: number;
  bracket: BracketKind;
  round: number;
  position: number;
  homeTeamId: number | null;
  awayTeamId: number | null;
  homeScore: number;
  awayScore: number;
  status: MatchStatus;
  winnerTeamId: number | null;
  nextMatchId: number | null;
  nextMatchSlot: "home" | "away" | null;
  loserNextMatchId: number | null;
  loserNextMatchSlot: "home" | "away" | null;
};

export type StandingRow = {
  teamId: number;
  played: number;
  wins: number;
  losses: number;
  draws: number;
  scoreFor: number;
  scoreAgainst: number;
  points: number;
  /** Swiss tiebreaker: sum of opponents' points (Buchholz). */
  buchholz: number;
};

export function nextPowerOfTwo(n: number): number {
  let size = 1;
  while (size < n) size *= 2;
  return Math.max(size, 2);
}

export function roundCount(format: TournamentFormat, teamCount: number): number {
  if (teamCount < 2) return 0;
  if (format === "single_elimination") return Math.log2(nextPowerOfTwo(teamCount));
  if (format === "double_elimination") return Math.log2(nextPowerOfTwo(teamCount)) * 2;
  if (format === "round_robin") return teamCount % 2 === 0 ? teamCount - 1 : teamCount;
  return Math.ceil(Math.log2(teamCount));
}

/**
 * Standard seeded single-elimination order: 1 v N, 2 v N-1, ... arranged so the
 * top seeds meet as late as possible (1 and 2 land in opposite halves).
 */
export function seedOrder(size: number): number[] {
  let order = [1];
  while (order.length < size) {
    const next: number[] = [];
    const total = order.length * 2 + 1;
    for (const seed of order) next.push(seed, total - seed);
    order = next;
  }
  return order;
}

export function roundLabel(format: TournamentFormat, bracket: BracketKind, round: number, totalRounds: number): string {
  if (bracket === "grand_final") return round > 1 ? "Grand final reset" : "Grand final";
  if (bracket === "losers") return `Lower round ${round}`;
  if (format === "round_robin") return `Round ${round}`;
  if (format === "swiss") return `Swiss round ${round}`;
  const remaining = totalRounds - round;
  if (remaining === 0) return bracket === "winners" && format === "double_elimination" ? "Upper final" : "Grand final";
  if (remaining === 1) return "Semifinals";
  if (remaining === 2) return "Quarterfinals";
  return `Round of ${2 ** (remaining + 1)}`;
}

/** Ordered team ids (seed 1 first) -> full single elimination plan with byes. */
export function planSingleElimination(teamIds: number[]): PlannedMatch[] {
  if (teamIds.length < 2) return [];
  const size = nextPowerOfTwo(teamIds.length);
  const rounds = Math.log2(size);
  const slots: (number | null)[] = seedOrder(size).map(seed => teamIds[seed - 1] ?? null);
  const matches: PlannedMatch[] = [];

  for (let round = 1; round <= rounds; round++) {
    const matchCount = size / 2 ** round;
    for (let position = 1; position <= matchCount; position++) {
      const isLast = round === rounds;
      const nextPosition = Math.ceil(position / 2);
      matches.push({
        key: `W${round}-${position}`,
        bracket: "winners",
        round,
        position,
        homeTeamId: round === 1 ? slots[(position - 1) * 2] ?? null : null,
        awayTeamId: round === 1 ? slots[(position - 1) * 2 + 1] ?? null : null,
        nextMatchKey: isLast ? null : `W${round + 1}-${nextPosition}`,
        nextMatchSlot: isLast ? null : position % 2 === 1 ? "home" : "away",
        loserNextMatchKey: null,
        loserNextMatchSlot: null,
        status: "upcoming",
        winnerTeamId: null,
      });
    }
  }

  return resolveByes(matches);
}

/**
 * Double elimination: a winners bracket, a losers bracket whose rounds
 * alternate between "drop-in" rounds (fed by winners-bracket losers) and
 * consolidation rounds, and a grand final (with a reset match if the lower
 * finalist wins).
 */
export function planDoubleElimination(teamIds: number[]): PlannedMatch[] {
  if (teamIds.length < 2) return [];
  const winners = planSingleElimination(teamIds).map(match => ({ ...match, key: match.key, nextMatchKey: match.nextMatchKey }));
  const size = nextPowerOfTwo(teamIds.length);
  const winnersRounds = Math.log2(size);
  if (size === 2) {
    // Two teams: the "losers bracket" is just the reset, model as winners final + grand final.
    const final = winners[0];
    final.nextMatchKey = "GF-1";
    final.nextMatchSlot = "home";
    final.loserNextMatchKey = "GF-1";
    final.loserNextMatchSlot = "away";
    return resolveByes([
      final,
      { key: "GF-1", bracket: "grand_final", round: 1, position: 1, homeTeamId: null, awayTeamId: null, nextMatchKey: null, nextMatchSlot: null, loserNextMatchKey: null, loserNextMatchSlot: null, status: "upcoming", winnerTeamId: null },
    ]);
  }

  const losers: PlannedMatch[] = [];
  const losersRounds = (winnersRounds - 1) * 2;
  // Losers round r has size/2^(ceil(r/2)+1) matches.
  for (let round = 1; round <= losersRounds; round++) {
    const matchCount = size / 2 ** (Math.ceil(round / 2) + 1);
    for (let position = 1; position <= matchCount; position++) {
      const isLast = round === losersRounds;
      const dropRound = round % 2 === 0; // even rounds consolidate 1:1, odd rounds pair two lower teams
      losers.push({
        key: `L${round}-${position}`,
        bracket: "losers",
        round,
        position,
        homeTeamId: null,
        awayTeamId: null,
        nextMatchKey: isLast ? "GF-1" : `L${round + 1}-${dropRound ? position : Math.ceil(position / 2)}`,
        nextMatchSlot: isLast ? "away" : dropRound ? "home" : position % 2 === 1 ? "home" : "away",
        loserNextMatchKey: null,
        loserNextMatchSlot: null,
        status: "upcoming",
        winnerTeamId: null,
      });
    }
  }

  // Wire winners-bracket losers into the losers bracket.
  for (const match of winners) {
    const isWinnersFinal = match.round === winnersRounds;
    if (isWinnersFinal) {
      match.nextMatchKey = "GF-1";
      match.nextMatchSlot = "home";
      match.loserNextMatchKey = `L${losersRounds}-1`;
      match.loserNextMatchSlot = "away";
      continue;
    }
    if (match.round === 1) {
      match.loserNextMatchKey = `L1-${Math.ceil(match.position / 2)}`;
      match.loserNextMatchSlot = match.position % 2 === 1 ? "home" : "away";
    } else {
      // Round r (>=2) losers drop into losers round 2(r-1) in the "away" slot.
      // Reverse position order to reduce rematches.
      const targetRound = 2 * (match.round - 1);
      const matchesInTargetRound = size / 2 ** (Math.ceil(targetRound / 2) + 1);
      const targetPosition = matchesInTargetRound - match.position + 1;
      match.loserNextMatchKey = `L${targetRound}-${targetPosition}`;
      match.loserNextMatchSlot = "away";
    }
  }

  const grandFinal: PlannedMatch[] = [
    { key: "GF-1", bracket: "grand_final", round: 1, position: 1, homeTeamId: null, awayTeamId: null, nextMatchKey: null, nextMatchSlot: null, loserNextMatchKey: null, loserNextMatchSlot: null, status: "upcoming", winnerTeamId: null },
    { key: "GF-2", bracket: "grand_final", round: 2, position: 1, homeTeamId: null, awayTeamId: null, nextMatchKey: null, nextMatchSlot: null, loserNextMatchKey: null, loserNextMatchSlot: null, status: "upcoming", winnerTeamId: null },
  ];

  return resolveByes([...winners, ...losers, ...grandFinal]);
}

/** Circle-method round robin schedule: every team plays every other team once. */
export function planRoundRobin(teamIds: number[]): PlannedMatch[] {
  if (teamIds.length < 2) return [];
  const teams: (number | null)[] = [...teamIds];
  if (teams.length % 2 === 1) teams.push(null);
  const rounds = teams.length - 1;
  const half = teams.length / 2;
  const matches: PlannedMatch[] = [];
  const rotation = [...teams];

  for (let round = 1; round <= rounds; round++) {
    let position = 1;
    for (let index = 0; index < half; index++) {
      const home = rotation[index];
      const away = rotation[rotation.length - 1 - index];
      if (home === null || away === null) continue; // bye
      matches.push({
        key: `RR${round}-${position}`,
        bracket: "round_robin",
        round,
        position,
        homeTeamId: round % 2 === 0 ? away : home,
        awayTeamId: round % 2 === 0 ? home : away,
        nextMatchKey: null,
        nextMatchSlot: null,
        loserNextMatchKey: null,
        loserNextMatchSlot: null,
        status: "upcoming",
        winnerTeamId: null,
      });
      position++;
    }
    // rotate all but the first
    const fixed = rotation[0];
    const rest = rotation.slice(1);
    rest.unshift(rest.pop() as number | null);
    rotation.splice(0, rotation.length, fixed, ...rest);
  }
  return matches;
}

/** Swiss round 1: seeded top half vs bottom half. Later rounds use pairSwissRound(). */
export function planSwissFirstRound(teamIds: number[]): PlannedMatch[] {
  if (teamIds.length < 2) return [];
  const half = Math.ceil(teamIds.length / 2);
  const matches: PlannedMatch[] = [];
  for (let index = 0; index < half; index++) {
    const home = teamIds[index];
    const away = teamIds[index + half] ?? null;
    matches.push({
      key: `S1-${index + 1}`,
      bracket: "swiss",
      round: 1,
      position: index + 1,
      homeTeamId: home,
      awayTeamId: away,
      nextMatchKey: null,
      nextMatchSlot: null,
      loserNextMatchKey: null,
      loserNextMatchSlot: null,
      status: away === null ? "completed" : "upcoming",
      winnerTeamId: away === null ? home : null,
    });
  }
  return matches;
}

/**
 * Pair the next Swiss round: sort by points then Buchholz, pair adjacent teams
 * that have not met, and give the lowest unpaired team a bye when odd.
 */
export function pairSwissRound(standings: StandingRow[], previousMatches: Pick<BracketMatchLike, "homeTeamId" | "awayTeamId">[], round: number): PlannedMatch[] {
  const met = new Set(previousMatches.filter(m => m.homeTeamId && m.awayTeamId).map(m => pairKey(m.homeTeamId as number, m.awayTeamId as number)));
  const pool = [...standings].sort(compareStandings).map(row => row.teamId);
  const matches: PlannedMatch[] = [];
  let position = 1;

  while (pool.length) {
    const home = pool.shift() as number;
    let awayIndex = pool.findIndex(candidate => !met.has(pairKey(home, candidate)));
    if (awayIndex === -1) awayIndex = pool.length ? 0 : -1;
    const away = awayIndex >= 0 ? (pool.splice(awayIndex, 1)[0] as number) : null;
    matches.push({
      key: `S${round}-${position}`,
      bracket: "swiss",
      round,
      position,
      homeTeamId: home,
      awayTeamId: away,
      nextMatchKey: null,
      nextMatchSlot: null,
      loserNextMatchKey: null,
      loserNextMatchSlot: null,
      status: away === null ? "completed" : "upcoming",
      winnerTeamId: away === null ? home : null,
    });
    position++;
  }
  return matches;
}

export function planBracket(format: TournamentFormat, teamIds: number[]): PlannedMatch[] {
  switch (format) {
    case "single_elimination":
      return planSingleElimination(teamIds);
    case "double_elimination":
      return planDoubleElimination(teamIds);
    case "round_robin":
      return planRoundRobin(teamIds);
    case "swiss":
      return planSwissFirstRound(teamIds);
  }
}

/**
 * Auto-complete first-round matches with only one team (bye) and push that team
 * to the next match. Runs until no more byes cascade.
 */
export function resolveByes(matches: PlannedMatch[]): PlannedMatch[] {
  const byKey = new Map(matches.map(match => [match.key, match]));
  const feedersOf = new Map<string, PlannedMatch[]>();
  for (const match of matches) {
    if (!match.nextMatchKey) continue;
    feedersOf.set(match.nextMatchKey, [...(feedersOf.get(match.nextMatchKey) ?? []), match]);
  }

  let changed = true;
  while (changed) {
    changed = false;
    for (const match of matches) {
      if (match.status === "completed" || match.bracket !== "winners") continue;
      const feeders = feedersOf.get(match.key) ?? [];
      // Round 1 has no feeders; later rounds may only be auto-resolved once every feeder has settled.
      if (!feeders.every(feeder => feeder.status === "completed")) continue;
      const present = [match.homeTeamId, match.awayTeamId].filter((id): id is number => id !== null);
      if (present.length === 2) continue;
      if (present.length === 0 && match.round === 1) continue; // never happens with nextPowerOfTwo sizing, but stay safe

      match.status = "completed";
      match.winnerTeamId = present[0] ?? null;
      if (match.nextMatchKey && match.winnerTeamId !== null) {
        const next = byKey.get(match.nextMatchKey);
        if (next) {
          if (match.nextMatchSlot === "home") next.homeTeamId = match.winnerTeamId;
          else next.awayTeamId = match.winnerTeamId;
        }
      }
      changed = true;
    }
  }
  return matches;
}

export type AdvanceResult = {
  updates: Array<{ id: number; patch: Partial<BracketMatchLike> }>;
  champion: number | null;
  /** True when the grand final reset (GF-2) becomes required. */
  resetRequired: boolean;
};

/**
 * Apply a completed result and compute the follow-up updates: winner/loser
 * placement in linked matches, and champion detection.
 */
export function advanceMatch(matches: BracketMatchLike[], matchId: number, winnerTeamId: number, homeScore: number, awayScore: number, format: TournamentFormat): AdvanceResult {
  const byId = new Map(matches.map(match => [match.id, match]));
  const match = byId.get(matchId);
  if (!match) throw new Error(`Match ${matchId} not found`);
  const loserTeamId = match.homeTeamId === winnerTeamId ? match.awayTeamId : match.homeTeamId;
  const updates: AdvanceResult["updates"] = [
    { id: match.id, patch: { homeScore, awayScore, winnerTeamId, status: "completed" } },
  ];
  let champion: number | null = null;
  let resetRequired = false;

  if (format === "round_robin" || format === "swiss") {
    return { updates, champion: null, resetRequired: false };
  }

  const isGrandFinal = match.bracket === "grand_final";
  if (isGrandFinal && match.round === 1 && format === "double_elimination") {
    // Home = upper-bracket champion (undefeated). If the lower finalist wins, reset.
    if (winnerTeamId === match.awayTeamId) {
      resetRequired = true;
      const reset = matches.find(other => other.bracket === "grand_final" && other.round === 2);
      if (reset) updates.push({ id: reset.id, patch: { homeTeamId: match.homeTeamId, awayTeamId: match.awayTeamId, status: "upcoming" } });
    } else {
      champion = winnerTeamId;
    }
    return { updates, champion, resetRequired };
  }
  if (isGrandFinal && match.round === 2) {
    return { updates, champion: winnerTeamId, resetRequired: false };
  }

  if (match.nextMatchId) {
    const next = byId.get(match.nextMatchId);
    if (next) updates.push({ id: next.id, patch: match.nextMatchSlot === "home" ? { homeTeamId: winnerTeamId } : { awayTeamId: winnerTeamId } });
  } else if (match.bracket === "winners") {
    champion = winnerTeamId;
  }

  if (match.loserNextMatchId && loserTeamId) {
    const drop = byId.get(match.loserNextMatchId);
    if (drop) updates.push({ id: drop.id, patch: match.loserNextMatchSlot === "home" ? { homeTeamId: loserTeamId } : { awayTeamId: loserTeamId } });
  }

  return { updates, champion, resetRequired };
}

export function computeStandings(matches: BracketMatchLike[], teamIds: number[]): StandingRow[] {
  const rows = new Map<number, StandingRow>();
  for (const teamId of teamIds) rows.set(teamId, { teamId, played: 0, wins: 0, losses: 0, draws: 0, scoreFor: 0, scoreAgainst: 0, points: 0, buchholz: 0 });
  const ensure = (teamId: number) => {
    if (!rows.has(teamId)) rows.set(teamId, { teamId, played: 0, wins: 0, losses: 0, draws: 0, scoreFor: 0, scoreAgainst: 0, points: 0, buchholz: 0 });
    return rows.get(teamId) as StandingRow;
  };

  for (const match of matches) {
    if (match.status !== "completed") continue;
    if (match.homeTeamId && !match.awayTeamId) {
      // bye: counts as a win with no score
      const home = ensure(match.homeTeamId);
      home.played++; home.wins++; home.points += 3;
      continue;
    }
    if (!match.homeTeamId || !match.awayTeamId) continue;
    const home = ensure(match.homeTeamId);
    const away = ensure(match.awayTeamId);
    home.played++; away.played++;
    home.scoreFor += match.homeScore; home.scoreAgainst += match.awayScore;
    away.scoreFor += match.awayScore; away.scoreAgainst += match.homeScore;
    const winner = match.winnerTeamId ?? (match.homeScore > match.awayScore ? match.homeTeamId : match.awayScore > match.homeScore ? match.awayTeamId : null);
    if (winner === match.homeTeamId) { home.wins++; away.losses++; home.points += 3; }
    else if (winner === match.awayTeamId) { away.wins++; home.losses++; away.points += 3; }
    else { home.draws++; away.draws++; home.points += 1; away.points += 1; }
  }

  // Buchholz: sum of opponents' points.
  for (const match of matches) {
    if (match.status !== "completed" || !match.homeTeamId || !match.awayTeamId) continue;
    const home = rows.get(match.homeTeamId);
    const away = rows.get(match.awayTeamId);
    if (home && away) { home.buchholz += away.points; away.buchholz += home.points; }
  }

  return Array.from(rows.values()).sort(compareStandings);
}

export function compareStandings(a: StandingRow, b: StandingRow): number {
  return b.points - a.points
    || b.buchholz - a.buchholz
    || (b.scoreFor - b.scoreAgainst) - (a.scoreFor - a.scoreAgainst)
    || b.scoreFor - a.scoreFor
    || a.teamId - b.teamId;
}

/** Final placements for a completed bracket (1 = champion). */
export function computePlacements(matches: BracketMatchLike[], format: TournamentFormat, teamIds: number[]): Array<{ teamId: number; placement: number }> {
  if (format === "round_robin" || format === "swiss") {
    return computeStandings(matches, teamIds).map((row, index) => ({ teamId: row.teamId, placement: index + 1 }));
  }
  const eliminatedAt = new Map<number, number>(); // teamId -> "depth" score, higher is better
  const order = (match: BracketMatchLike) => (match.bracket === "grand_final" ? 1000 + match.round : match.bracket === "winners" ? 100 + match.round : match.round);
  let champion: number | null = null;
  for (const match of matches) {
    if (match.status !== "completed" || !match.winnerTeamId) continue;
    const loser = match.homeTeamId === match.winnerTeamId ? match.awayTeamId : match.homeTeamId;
    const isFinalMatch = format === "single_elimination" ? !match.nextMatchId && match.bracket === "winners" : match.bracket === "grand_final";
    if (isFinalMatch) champion = match.winnerTeamId;
    if (loser && (format === "single_elimination" || match.bracket !== "winners")) {
      eliminatedAt.set(loser, Math.max(eliminatedAt.get(loser) ?? 0, order(match)));
    }
  }
  const ranked = Array.from(eliminatedAt.entries()).filter(([teamId]) => teamId !== champion).sort((a, b) => b[1] - a[1]);
  const placements: Array<{ teamId: number; placement: number }> = [];
  if (champion) placements.push({ teamId: champion, placement: 1 });
  let placement = 2;
  let lastDepth: number | null = null;
  let lastPlacement = 2;
  for (const [teamId, depth] of ranked) {
    if (lastDepth !== null && depth === lastDepth) placements.push({ teamId, placement: lastPlacement });
    else { placements.push({ teamId, placement }); lastPlacement = placement; lastDepth = depth; }
    placement++;
  }
  return placements;
}

function pairKey(a: number, b: number): string {
  return a < b ? `${a}:${b}` : `${b}:${a}`;
}
