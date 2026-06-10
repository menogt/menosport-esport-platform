import { type Match, type Team } from '../data/dummy';

export type SeedSlot = string | null;

export interface GeneratedBracketOptions {
  tournamentId: string;
  teams: Team[];
  startDate: string;
  matchDurationHours?: number;
}

export interface ResultInput {
  matchId: string;
  score1: number;
  score2: number;
  winnerId: string;
}

const ROUND_NAMES: Record<number, string> = {
  1: 'Round 1',
  2: 'Quarterfinals',
  3: 'Semifinals',
  4: 'Grand Final',
};

export function nextPowerOfTwo(value: number) {
  if (value <= 1) return 2;
  return 2 ** Math.ceil(Math.log2(value));
}

export function getRoundName(round: number, totalRounds: number) {
  if (round === totalRounds) return 'Grand Final';
  if (round === totalRounds - 1) return 'Semifinals';
  if (round === totalRounds - 2) return 'Quarterfinals';
  return ROUND_NAMES[round] ?? `Round ${round}`;
}

function seededSlots(teamIds: string[], bracketSize: number): SeedSlot[] {
  const slots: SeedSlot[] = Array.from({ length: bracketSize }, () => null);
  const half = bracketSize / 2;

  teamIds.forEach((teamId, index) => {
    // Basic anti-stacking seed order: 1 vs last slot, 2 vs opposite side, etc.
    const position = index % 2 === 0 ? Math.floor(index / 2) : bracketSize - 1 - Math.floor(index / 2);
    slots[position < bracketSize ? position : index] = teamId;
  });

  // Small cleanup for tiny brackets, preserving pairing readability.
  if (teamIds.length <= half) {
    return teamIds.flatMap(id => [id, null]).slice(0, bracketSize);
  }

  return slots;
}

function advanceByeTeams(matches: Match[]): Match[] {
  let changed = true;
  let working = matches;

  while (changed) {
    changed = false;
    working = working.map(match => {
      if (match.status !== 'completed' || !match.winnerId || !match.nextMatchId) return match;

      const nextMatch = working.find(m => m.id === match.nextMatchId);
      if (!nextMatch) return match;
      const sourceIndex = working.filter(m => m.round === match.round).findIndex(m => m.id === match.id);
      const targetSlot = sourceIndex % 2 === 0 ? 'team1Id' : 'team2Id';

      if (nextMatch[targetSlot] === match.winnerId) return match;
      changed = true;
      return match;
    });

    working = working.map(match => {
      const feederMatches = working.filter(m => m.nextMatchId === match.id);
      if (feederMatches.length === 0) return match;

      let updated = { ...match };
      feederMatches.forEach((feeder, index) => {
        if (!feeder.winnerId) return;
        if (index === 0 && updated.team1Id !== feeder.winnerId) updated.team1Id = feeder.winnerId;
        if (index === 1 && updated.team2Id !== feeder.winnerId) updated.team2Id = feeder.winnerId;
      });
      return updated;
    });
  }

  return working;
}

export function generateSingleEliminationBracket(options: GeneratedBracketOptions): Match[] {
  const { tournamentId, teams, startDate, matchDurationHours = 2 } = options;
  const activeTeams = teams.slice(0, Math.max(2, teams.length));
  const bracketSize = nextPowerOfTwo(activeTeams.length);
  const totalRounds = Math.log2(bracketSize);
  const firstRoundSlots = seededSlots(activeTeams.map(t => t.id), bracketSize);
  const matches: Match[] = [];
  const baseTime = new Date(`${startDate}T10:00:00`);

  let previousRoundMatchIds: string[] = [];

  for (let round = 1; round <= totalRounds; round++) {
    const matchesInRound = bracketSize / 2 ** round;
    const currentRoundMatchIds: string[] = [];

    for (let position = 1; position <= matchesInRound; position++) {
      const matchId = `gen-${tournamentId}-r${round}-m${position}`;
      const nextMatchId = round < totalRounds ? `gen-${tournamentId}-r${round + 1}-m${Math.ceil(position / 2)}` : null;
      const scheduledTime = new Date(baseTime.getTime() + ((round - 1) * matchesInRound + position - 1) * matchDurationHours * 60 * 60 * 1000).toISOString().slice(0, 16);

      let team1Id: string | null = null;
      let team2Id: string | null = null;
      let winnerId: string | null = null;
      let status: Match['status'] = 'upcoming';

      if (round === 1) {
        team1Id = firstRoundSlots[(position - 1) * 2] ?? null;
        team2Id = firstRoundSlots[(position - 1) * 2 + 1] ?? null;
        if ((team1Id && !team2Id) || (!team1Id && team2Id)) {
          winnerId = team1Id ?? team2Id;
          status = 'completed';
        }
      }

      matches.push({
        id: matchId,
        tournamentId,
        round,
        roundName: getRoundName(round, totalRounds),
        position,
        team1Id,
        team2Id,
        score1: winnerId === team1Id && team2Id === null ? 1 : null,
        score2: winnerId === team2Id && team1Id === null ? 1 : null,
        status,
        scheduledTime,
        winnerId,
        nextMatchId,
      });
      currentRoundMatchIds.push(matchId);
    }

    previousRoundMatchIds = currentRoundMatchIds;
  }

  return advanceByeTeams(matches);
}

export function advanceWinner(matches: Match[], result: ResultInput): Match[] {
  const sourceMatch = matches.find(match => match.id === result.matchId);
  if (!sourceMatch) return matches;

  const sourceRoundMatches = matches.filter(match => match.round === sourceMatch.round).sort((a, b) => a.position - b.position);
  const sourceIndex = sourceRoundMatches.findIndex(match => match.id === sourceMatch.id);
  const targetSlot = sourceIndex % 2 === 0 ? 'team1Id' : 'team2Id';

  return matches.map(match => {
    if (match.id === result.matchId) {
      return {
        ...match,
        score1: result.score1,
        score2: result.score2,
        winnerId: result.winnerId,
        status: 'completed' as const,
      };
    }

    if (sourceMatch.nextMatchId && match.id === sourceMatch.nextMatchId) {
      return {
        ...match,
        [targetSlot]: result.winnerId,
        status: match.status === 'completed' ? match.status : 'upcoming',
      };
    }

    return match;
  });
}

export function markMatchWaiting(matches: Match[], matchId: string, score1: number, score2: number): Match[] {
  return matches.map(match => match.id === matchId
    ? { ...match, score1, score2, status: 'waiting_result' as const }
    : match
  );
}

export function markMatchDisputed(matches: Match[], matchId: string): Match[] {
  return matches.map(match => match.id === matchId
    ? { ...match, status: 'disputed' as const }
    : match
  );
}

export function groupMatchesByRound(matches: Match[]) {
  return [...new Set(matches.map(match => match.round))]
    .sort((a, b) => a - b)
    .map(round => ({
      round,
      label: matches.find(match => match.round === round)?.roundName ?? `Round ${round}`,
      matches: matches.filter(match => match.round === round).sort((a, b) => a.position - b.position),
    }));
}
