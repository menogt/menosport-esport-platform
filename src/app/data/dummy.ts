export type GameId = 'mlbb' | 'valorant' | 'freefire' | 'codm';
export type TournamentStatus = 'upcoming' | 'registration' | 'ongoing' | 'completed';
export type TournamentFormat = 'single_elimination' | 'double_elimination' | 'round_robin' | 'swiss';
export type MatchStatus = 'upcoming' | 'live' | 'waiting_result' | 'disputed' | 'completed';
export type UserRole = 'player' | 'captain' | 'organizer' | 'admin' | 'sponsor';
export type PayoutStatus = 'pending' | 'processing' | 'paid';

export interface Game {
  id: GameId;
  name: string;
  shortName: string;
  color: string;
  secondaryColor: string;
  genre: string;
  activePlayers: string;
  tournaments: number;
}

export interface Player {
  id: string;
  username: string;
  realName: string;
  role: string;
  rank: string;
  avatar: string;
  teamId: string;
  wins: number;
  losses: number;
  kda: string;
  region: string;
}

export interface Team {
  id: string;
  name: string;
  tag: string;
  game: GameId;
  region: string;
  rank: number;
  wins: number;
  losses: number;
  points: number;
  logo: string;
  captain: string;
  members: string[];
  social: { discord?: string; twitter?: string; twitch?: string };
}

export interface Tournament {
  id: string;
  name: string;
  game: GameId;
  format: TournamentFormat;
  status: TournamentStatus;
  startDate: string;
  endDate: string;
  registrationDeadline: string;
  maxTeams: number;
  registeredTeams: number;
  entryFee: number;
  prizePool: number;
  prizeBreakdown: { place: string; percentage: number; amount: number }[];
  region: string;
  organizer: string;
  streamLink: string;
  sponsor: string;
  coverGradient: string;
  rules: string[];
  checkedIn: number;
}

export interface Match {
  id: string;
  tournamentId: string;
  round: number;
  roundName: string;
  position: number;
  team1Id: string | null;
  team2Id: string | null;
  score1: number | null;
  score2: number | null;
  status: MatchStatus;
  scheduledTime: string;
  winnerId: string | null;
  nextMatchId: string | null;
}

export interface Notification {
  id: string;
  type: 'match_soon' | 'checkin_open' | 'result_submitted' | 'dispute' | 'admin_decision' | 'payout' | 'team_invite' | 'stream_live' | 'discord_sync' | 'registration' | 'media_featured' | 'bracket_update';
  title: string;
  message: string;
  time: string;
  read: boolean;
}

export interface Sponsor {
  id: string;
  name: string;
  tier: 'platinum' | 'gold' | 'silver';
  logo: string;
  color: string;
}

export interface DisputeTicket {
  id: string;
  matchId: string;
  tournamentName: string;
  team1: string;
  team2: string;
  submittedScore1: string;
  submittedScore2: string;
  status: 'open' | 'under_review' | 'resolved';
  openedAt: string;
  evidence: string;
}

export interface MatchReport {
  id: string;
  matchId: string;
  submittedBy: string;
  teamId: string;
  score1: number;
  score2: number;
  claimedWinnerId: string;
  proofUrl: string;
  notes: string;
  status: 'submitted' | 'waiting_confirmation' | 'confirmed' | 'disputed' | 'admin_resolved';
  submittedAt: string;
}

export interface PaymentRecord {
  id: string;
  tournamentId: string;
  payer: string;
  teamId: string;
  amount: number;
  method: 'card' | 'gcash' | 'maya' | 'manual';
  status: 'unpaid' | 'pending' | 'paid' | 'failed' | 'refunded';
  reference: string;
  createdAt: string;
}

export interface PrizeSource {
  tournamentId: string;
  sponsorContribution: number;
  entryFeeContribution: number;
  organizerContribution: number;
}

export interface PayoutRecord {
  id: string;
  tournamentId: string;
  recipient: string;
  place: string;
  amount: number;
  status: 'pending' | 'processing' | 'paid';
}

// ─── GAMES ───────────────────────────────────────────────────────────────────

export const GAMES: Game[] = [
  {
    id: 'mlbb',
    name: 'Mobile Legends: Bang Bang',
    shortName: 'MLBB',
    color: '#00d4ff',
    secondaryColor: '#0066ff',
    genre: 'MOBA',
    activePlayers: '120M+',
    tournaments: 14,
  },
  {
    id: 'valorant',
    name: 'Valorant',
    shortName: 'VAL',
    color: '#ff4655',
    secondaryColor: '#bd3d4b',
    genre: 'Tactical FPS',
    activePlayers: '25M+',
    tournaments: 9,
  },
  {
    id: 'freefire',
    name: 'Free Fire',
    shortName: 'FF',
    color: '#ffd700',
    secondaryColor: '#ff9500',
    genre: 'Battle Royale',
    activePlayers: '80M+',
    tournaments: 11,
  },
  {
    id: 'codm',
    name: 'Call of Duty: Mobile',
    shortName: 'CODM',
    color: '#4ade80',
    secondaryColor: '#16a34a',
    genre: 'FPS',
    activePlayers: '35M+',
    tournaments: 7,
  },
];

// ─── PLAYERS ─────────────────────────────────────────────────────────────────

export const PLAYERS: Player[] = [
  { id: 'p1', username: 'ShadowFang', realName: 'Marco Reyes', role: 'Jungler', rank: 'Mythical Glory', avatar: 'SF', teamId: 't1', wins: 142, losses: 38, kda: '5.2', region: 'SEA' },
  { id: 'p2', username: 'IronVeil', realName: 'Jess Tan', role: 'Mid Lane', rank: 'Mythic', avatar: 'IV', teamId: 't1', wins: 130, losses: 42, kda: '4.8', region: 'SEA' },
  { id: 'p3', username: 'NeonStrike', realName: 'Ali Hassan', role: 'Gold Lane', rank: 'Mythical Glory', avatar: 'NS', teamId: 't1', wins: 155, losses: 30, kda: '6.1', region: 'SEA' },
  { id: 'p4', username: 'VoltEdge', realName: 'Kim Jun-seo', role: 'EXP Lane', rank: 'Mythic', avatar: 'VE', teamId: 't1', wins: 118, losses: 55, kda: '3.9', region: 'SEA' },
  { id: 'p5', username: 'CryptoZen', realName: 'Raj Patel', role: 'Roamer', rank: 'Mythic', avatar: 'CZ', teamId: 't1', wins: 122, losses: 50, kda: '4.2', region: 'SEA' },
  { id: 'p6', username: 'FrostBite', realName: 'Lena Kovac', role: 'Duelist', rank: 'Radiant', avatar: 'FB', teamId: 't2', wins: 280, losses: 60, kda: '3.1', region: 'EU' },
  { id: 'p7', username: 'PixelGhost', realName: 'Tomas Rivas', role: 'Initiator', rank: 'Immortal 3', avatar: 'PG', teamId: 't2', wins: 240, losses: 80, kda: '2.8', region: 'EU' },
  { id: 'p8', username: 'StormBreaker', realName: 'Yuki Tanaka', role: 'Controller', rank: 'Immortal 2', avatar: 'SB', teamId: 't2', wins: 210, losses: 95, kda: '2.5', region: 'EU' },
  { id: 'p9', username: 'ArcLight', realName: 'Diego Cruz', role: 'Sentinel', rank: 'Radiant', avatar: 'AL', teamId: 't3', wins: 320, losses: 45, kda: '3.5', region: 'LATAM' },
  { id: 'p10', username: 'DawnRift', realName: 'Sophie Bell', role: 'Booster', rank: 'Diamond', avatar: 'DR', teamId: 't4', wins: 88, losses: 42, kda: '2.2', region: 'NA' },
];

// ─── TEAMS ────────────────────────────────────────────────────────────────────

export const TEAMS: Team[] = [
  { id: 't1', name: 'Phantom Ascent', tag: 'PHX', game: 'mlbb', region: 'SEA', rank: 1, wins: 34, losses: 6, points: 2840, logo: 'PA', captain: 'p1', members: ['p1','p2','p3','p4','p5'], social: { discord: '#', twitter: '#', twitch: '#' } },
  { id: 't2', name: 'Neon Wolves', tag: 'NWL', game: 'valorant', region: 'EU', rank: 2, wins: 28, losses: 10, points: 2610, logo: 'NW', captain: 'p6', members: ['p6','p7','p8'], social: { discord: '#', twitter: '#' } },
  { id: 't3', name: 'Cipher Squad', tag: 'CSQ', game: 'valorant', region: 'LATAM', rank: 3, wins: 25, losses: 13, points: 2400, logo: 'CS', captain: 'p9', members: ['p9'], social: { twitter: '#' } },
  { id: 't4', name: 'Iron Vanguard', tag: 'IVG', game: 'codm', region: 'NA', rank: 4, wins: 22, losses: 16, points: 2200, logo: 'IV', captain: 'p10', members: ['p10'], social: { discord: '#' } },
  { id: 't5', name: 'Blaze Protocol', tag: 'BLZ', game: 'freefire', region: 'SA', rank: 5, wins: 20, losses: 18, points: 2050, logo: 'BP', captain: 'p1', members: [], social: {} },
  { id: 't6', name: 'Zero Gravity', tag: 'ZRG', game: 'mlbb', region: 'SEA', rank: 6, wins: 18, losses: 20, points: 1920, logo: 'ZG', captain: 'p2', members: [], social: {} },
  { id: 't7', name: 'Apex Syndicate', tag: 'APX', game: 'codm', region: 'NA', rank: 7, wins: 16, losses: 22, points: 1800, logo: 'AS', captain: 'p3', members: [], social: {} },
  { id: 't8', name: 'Dark Matter', tag: 'DM', game: 'valorant', region: 'APAC', rank: 8, wins: 14, losses: 24, points: 1650, logo: 'DM', captain: 'p4', members: [], social: {} },
  { id: 't9', name: 'Nova Reapers', tag: 'NVR', game: 'mlbb', region: 'SEA', rank: 9, wins: 13, losses: 21, points: 1580, logo: 'NR', captain: 'p5', members: [], social: { discord: '#' } },
  { id: 't10', name: 'Crimson Byte', tag: 'CB', game: 'codm', region: 'EU', rank: 10, wins: 12, losses: 18, points: 1490, logo: 'CB', captain: 'p6', members: [], social: { twitter: '#' } },
  { id: 't11', name: 'Titan Bloom', tag: 'TBN', game: 'freefire', region: 'SA', rank: 11, wins: 11, losses: 19, points: 1410, logo: 'TB', captain: 'p7', members: [], social: {} },
  { id: 't12', name: 'Signal Rush', tag: 'SGR', game: 'mlbb', region: 'SEA', rank: 12, wins: 10, losses: 20, points: 1330, logo: 'SR', captain: 'p8', members: [], social: { discord: '#' } },
  { id: 't13', name: 'Omega Pulse', tag: 'OMG', game: 'valorant', region: 'NA', rank: 13, wins: 9, losses: 22, points: 1260, logo: 'OP', captain: 'p9', members: [], social: {} },
  { id: 't14', name: 'Rift Serpents', tag: 'RFS', game: 'mlbb', region: 'SEA', rank: 14, wins: 8, losses: 24, points: 1180, logo: 'RS', captain: 'p10', members: [], social: { twitch: '#' } },
  { id: 't15', name: 'Vortex Kings', tag: 'VK', game: 'codm', region: 'APAC', rank: 15, wins: 7, losses: 21, points: 1100, logo: 'VK', captain: 'p1', members: [], social: {} },
  { id: 't16', name: 'Solar Knights', tag: 'SLR', game: 'freefire', region: 'SEA', rank: 16, wins: 6, losses: 23, points: 990, logo: 'SK', captain: 'p2', members: [], social: {} },
];

// ─── TOURNAMENTS ──────────────────────────────────────────────────────────────

export const TOURNAMENTS: Tournament[] = [
  {
    id: 'trn1',
    name: 'SEA Championship Series — Season 4',
    game: 'mlbb',
    format: 'single_elimination',
    status: 'ongoing',
    startDate: '2026-06-10',
    endDate: '2026-06-20',
    registrationDeadline: '2026-06-08',
    maxTeams: 16,
    registeredTeams: 16,
    entryFee: 0,
    prizePool: 50000,
    prizeBreakdown: [
      { place: '1st', percentage: 60, amount: 30000 },
      { place: '2nd', percentage: 25, amount: 12500 },
      { place: '3rd-4th', percentage: 15, amount: 7500 },
    ],
    region: 'SEA',
    organizer: 'ProCircuit PH',
    streamLink: 'https://twitch.tv/placeholder',
    sponsor: 'TechGear Pro',
    coverGradient: 'from-cyan-600 via-blue-700 to-indigo-900',
    rules: [
      'Standard MLBB tournament ruleset applies.',
      'Teams must check in 30 minutes before their match.',
      'Match format: Best of 3 for all rounds, Best of 5 for Finals.',
      'No substitutions after check-in unless medically necessary.',
      'All results must be reported within 15 minutes of match end.',
    ],
    checkedIn: 14,
  },
  {
    id: 'trn2',
    name: 'Valorant Pro League — Invitational',
    game: 'valorant',
    format: 'double_elimination',
    status: 'registration',
    startDate: '2026-06-25',
    endDate: '2026-07-05',
    registrationDeadline: '2026-06-20',
    maxTeams: 8,
    registeredTeams: 5,
    entryFee: 25,
    prizePool: 30000,
    prizeBreakdown: [
      { place: '1st', percentage: 60, amount: 18000 },
      { place: '2nd', percentage: 30, amount: 9000 },
      { place: '3rd', percentage: 10, amount: 3000 },
    ],
    region: 'EU',
    organizer: 'EU Esports Hub',
    streamLink: 'https://twitch.tv/placeholder',
    sponsor: 'EnergyX',
    coverGradient: 'from-red-600 via-rose-700 to-pink-900',
    rules: [
      'Agents are banned by the opposing team before map selection.',
      'Maps are played in a veto format — Bo1 for group stage, Bo3 for playoffs.',
      'Players must have their in-game name matching their registered tag.',
    ],
    checkedIn: 0,
  },
  {
    id: 'trn3',
    name: 'Free Fire World Series — Qualifier',
    game: 'freefire',
    format: 'round_robin',
    status: 'upcoming',
    startDate: '2026-07-10',
    endDate: '2026-07-14',
    registrationDeadline: '2026-07-05',
    maxTeams: 12,
    registeredTeams: 8,
    entryFee: 10,
    prizePool: 15000,
    prizeBreakdown: [
      { place: '1st', percentage: 50, amount: 7500 },
      { place: '2nd', percentage: 30, amount: 4500 },
      { place: '3rd', percentage: 20, amount: 3000 },
    ],
    region: 'Global',
    organizer: 'Blaze Events',
    streamLink: '',
    sponsor: '',
    coverGradient: 'from-yellow-500 via-orange-600 to-red-800',
    rules: ['Standard Free Fire tournament rules.', 'No emulators allowed.'],
    checkedIn: 0,
  },
  {
    id: 'trn4',
    name: 'CODM Iron Cup — Season 2',
    game: 'codm',
    format: 'single_elimination',
    status: 'registration',
    startDate: '2026-06-28',
    endDate: '2026-07-02',
    registrationDeadline: '2026-06-24',
    maxTeams: 16,
    registeredTeams: 11,
    entryFee: 15,
    prizePool: 20000,
    prizeBreakdown: [
      { place: '1st', percentage: 60, amount: 12000 },
      { place: '2nd', percentage: 25, amount: 5000 },
      { place: '3rd-4th', percentage: 15, amount: 3000 },
    ],
    region: 'NA',
    organizer: 'Iron Cup Org',
    streamLink: 'https://twitch.tv/placeholder',
    sponsor: 'GrindFuel',
    coverGradient: 'from-green-600 via-emerald-700 to-teal-900',
    rules: ['All modes are default competitive settings.'],
    checkedIn: 0,
  },
  {
    id: 'trn5',
    name: 'MLBB Club Masters — Open',
    game: 'mlbb',
    format: 'swiss',
    status: 'completed',
    startDate: '2026-05-01',
    endDate: '2026-05-10',
    registrationDeadline: '2026-04-28',
    maxTeams: 32,
    registeredTeams: 32,
    entryFee: 5,
    prizePool: 10000,
    prizeBreakdown: [
      { place: '1st', percentage: 60, amount: 6000 },
      { place: '2nd', percentage: 25, amount: 2500 },
      { place: '3rd', percentage: 15, amount: 1500 },
    ],
    region: 'SEA',
    organizer: 'Masters Circuit',
    streamLink: '',
    sponsor: '',
    coverGradient: 'from-purple-600 via-violet-700 to-indigo-900',
    rules: [],
    checkedIn: 32,
  },
  {
    id: 'trn6',
    name: 'Valorant Challenger Series',
    game: 'valorant',
    format: 'single_elimination',
    status: 'upcoming',
    startDate: '2026-07-15',
    endDate: '2026-07-20',
    registrationDeadline: '2026-07-10',
    maxTeams: 16,
    registeredTeams: 3,
    entryFee: 20,
    prizePool: 25000,
    prizeBreakdown: [
      { place: '1st', percentage: 60, amount: 15000 },
      { place: '2nd', percentage: 25, amount: 6250 },
      { place: '3rd-4th', percentage: 15, amount: 3750 },
    ],
    region: 'APAC',
    organizer: 'VCT APAC',
    streamLink: '',
    sponsor: 'TechGear Pro',
    coverGradient: 'from-red-600 via-rose-700 to-purple-900',
    rules: [],
    checkedIn: 0,
  },
];

// ─── MATCHES ─────────────────────────────────────────────────────────────────
// Single elimination bracket for trn1 (16 teams → QF → SF → Final)
// For display purposes, we'll show an 8-team bracket (3 rounds)

export const MATCHES: Match[] = [
  // Round 1 — Quarterfinals
  { id: 'm1', tournamentId: 'trn1', round: 1, roundName: 'Quarterfinals', position: 1, team1Id: 't1', team2Id: 't8', score1: 2, score2: 0, status: 'completed', scheduledTime: '2026-06-10T10:00', winnerId: 't1', nextMatchId: 'm5' },
  { id: 'm2', tournamentId: 'trn1', round: 1, roundName: 'Quarterfinals', position: 2, team1Id: 't4', team2Id: 't5', score1: 2, score2: 1, status: 'completed', scheduledTime: '2026-06-10T12:00', winnerId: 't4', nextMatchId: 'm5' },
  { id: 'm3', tournamentId: 'trn1', round: 1, roundName: 'Quarterfinals', position: 3, team1Id: 't2', team2Id: 't7', score1: 2, score2: 0, status: 'completed', scheduledTime: '2026-06-10T14:00', winnerId: 't2', nextMatchId: 'm6' },
  { id: 'm4', tournamentId: 'trn1', round: 1, roundName: 'Quarterfinals', position: 4, team1Id: 't3', team2Id: 't6', score1: 1, score2: 2, status: 'completed', scheduledTime: '2026-06-10T16:00', winnerId: 't6', nextMatchId: 'm6' },
  // Round 2 — Semifinals
  { id: 'm5', tournamentId: 'trn1', round: 2, roundName: 'Semifinals', position: 1, team1Id: 't1', team2Id: 't4', score1: 2, score2: 1, status: 'completed', scheduledTime: '2026-06-15T14:00', winnerId: 't1', nextMatchId: 'm7' },
  { id: 'm6', tournamentId: 'trn1', round: 2, roundName: 'Semifinals', position: 2, team1Id: 't2', team2Id: 't6', score1: null, score2: null, status: 'live', scheduledTime: '2026-06-15T17:00', winnerId: null, nextMatchId: 'm7' },
  // Round 3 — Grand Final
  { id: 'm7', tournamentId: 'trn1', round: 3, roundName: 'Grand Final', position: 1, team1Id: 't1', team2Id: null, score1: null, score2: null, status: 'upcoming', scheduledTime: '2026-06-20T18:00', winnerId: null, nextMatchId: null },
];

// Live matches for homepage (cross-tournament)
export const LIVE_MATCHES = [
  { ...MATCHES[5], tournamentName: 'SEA Championship S4' },
];

// ─── NOTIFICATIONS ────────────────────────────────────────────────────────────

export const NOTIFICATIONS: Notification[] = [
  { id: 'n1', type: 'match_soon', title: 'Match Starting Soon', message: 'Your match vs Neon Wolves starts in 30 minutes. Check in now.', time: '28m ago', read: false },
  { id: 'n2', type: 'checkin_open', title: 'Check-in Open', message: 'SEA Championship S4 check-in is now open. Deadline in 2 hours.', time: '1h ago', read: false },
  { id: 'n3', type: 'result_submitted', title: 'Result Submitted', message: 'Cipher Squad submitted their result for Match #m3.', time: '3h ago', read: true },
  { id: 'n4', type: 'team_invite', title: 'Team Invite', message: 'Iron Vanguard has invited you to join their roster.', time: '5h ago', read: true },
  { id: 'n5', type: 'payout', title: 'Prize Payout Update', message: 'Your $1,500 payout from MLBB Club Masters is processing.', time: '1d ago', read: true },
];

// ─── SPONSORS ─────────────────────────────────────────────────────────────────

export const SPONSORS: Sponsor[] = [
  { id: 's1', name: 'TechGear Pro', tier: 'platinum', logo: 'TG', color: '#00d4ff' },
  { id: 's2', name: 'EnergyX', tier: 'platinum', logo: 'EX', color: '#ff4655' },
  { id: 's3', name: 'GrindFuel', tier: 'gold', logo: 'GF', color: '#ffd700' },
  { id: 's4', name: 'NexusPC', tier: 'gold', logo: 'NP', color: '#a855f7' },
  { id: 's5', name: 'StreamGear', tier: 'silver', logo: 'SG', color: '#4ade80' },
  { id: 's6', name: 'PixelZone', tier: 'silver', logo: 'PZ', color: '#f97316' },
];

// ─── DISPUTE TICKETS ─────────────────────────────────────────────────────────

export const DISPUTE_TICKETS: DisputeTicket[] = [
  {
    id: 'dsp1',
    matchId: 'm3',
    tournamentName: 'SEA Championship S4',
    team1: 'Neon Wolves',
    team2: 'Apex Syndicate',
    submittedScore1: '2-0 (Wolves)',
    submittedScore2: '2-1 (Apex)',
    status: 'open',
    openedAt: '2026-06-10T16:30',
    evidence: 'Screenshot shows game disconnect during Map 2.',
  },
  {
    id: 'dsp2',
    matchId: 'm2',
    tournamentName: 'CODM Iron Cup S2',
    team1: 'Iron Vanguard',
    team2: 'Blaze Protocol',
    submittedScore1: '3-2 (Vanguard)',
    submittedScore2: '3-1 (Blaze)',
    status: 'under_review',
    openedAt: '2026-06-09T20:00',
    evidence: 'Disputed kill count in round 5.',
  },
];


// ─── PHASE 6: MATCH REPORTS ─────────────────────────────────────────────────

export const MATCH_REPORTS: MatchReport[] = [
  {
    id: 'rpt1',
    matchId: 'm6',
    submittedBy: 'FrostBite',
    teamId: 't2',
    score1: 1,
    score2: 1,
    claimedWinnerId: 't2',
    proofUrl: 'proof-m6-map2.png',
    notes: 'Map 2 screenshot uploaded. Awaiting opponent confirmation.',
    status: 'waiting_confirmation',
    submittedAt: '2026-06-15T18:04',
  },
];

// ─── PHASE 7: PAYMENT & PRIZE DATA ───────────────────────────────────────────

export const PAYMENT_RECORDS: PaymentRecord[] = [
  { id: 'pay1', tournamentId: 'trn2', payer: 'Neon Wolves', teamId: 't2', amount: 25, method: 'card', status: 'paid', reference: 'test_pi_NWL_0626', createdAt: '2026-06-08T13:12' },
  { id: 'pay2', tournamentId: 'trn4', payer: 'Iron Vanguard', teamId: 't4', amount: 15, method: 'gcash', status: 'pending', reference: 'test_pi_IVG_0628', createdAt: '2026-06-09T09:44' },
  { id: 'pay3', tournamentId: 'trn3', payer: 'Blaze Protocol', teamId: 't5', amount: 10, method: 'manual', status: 'failed', reference: 'manual_review_BLZ', createdAt: '2026-06-09T17:20' },
];

export const PRIZE_SOURCES: PrizeSource[] = [
  { tournamentId: 'trn1', sponsorContribution: 30000, entryFeeContribution: 0, organizerContribution: 20000 },
  { tournamentId: 'trn2', sponsorContribution: 22000, entryFeeContribution: 2000, organizerContribution: 6000 },
  { tournamentId: 'trn3', sponsorContribution: 7500, entryFeeContribution: 4500, organizerContribution: 3000 },
  { tournamentId: 'trn4', sponsorContribution: 12000, entryFeeContribution: 3000, organizerContribution: 5000 },
  { tournamentId: 'trn5', sponsorContribution: 4000, entryFeeContribution: 3500, organizerContribution: 2500 },
  { tournamentId: 'trn6', sponsorContribution: 18000, entryFeeContribution: 3000, organizerContribution: 4000 },
];

export const PAYOUT_RECORDS: PayoutRecord[] = [
  { id: 'po1', tournamentId: 'trn5', recipient: 'Phantom Ascent', place: '1st', amount: 6000, status: 'paid' },
  { id: 'po2', tournamentId: 'trn5', recipient: 'Zero Gravity', place: '2nd', amount: 2500, status: 'processing' },
  { id: 'po3', tournamentId: 'trn5', recipient: 'Nova Reapers', place: '3rd', amount: 1500, status: 'pending' },
];

// ─── MLBB HERO STATS (for game hub) ──────────────────────────────────────────

export const MLBB_HEROES = [
  { name: 'Fanny', role: 'Jungler', winRate: 52.3, pickRate: 18.7, banRate: 34.2, tier: 'S', color: '#00d4ff' },
  { name: 'Ling', role: 'Jungler', winRate: 50.1, pickRate: 22.4, banRate: 41.8, tier: 'S', color: '#00d4ff' },
  { name: 'Tigreal', role: 'Roamer/Tank', winRate: 55.8, pickRate: 14.3, banRate: 12.1, tier: 'A', color: '#4ade80' },
  { name: 'Chou', role: 'Fighter/Support', winRate: 51.6, pickRate: 19.8, banRate: 28.4, tier: 'S', color: '#a855f7' },
  { name: 'Layla', role: 'Gold Lane', winRate: 48.2, pickRate: 10.5, banRate: 4.2, tier: 'B', color: '#f97316' },
];

// ─── MEDIA POSTS ─────────────────────────────────────────────────────────────

export type MediaTag = 'highlights' | 'meme' | 'reaction' | 'promo' | 'tutorial' | 'clutch';

export interface MediaPost {
  id: string;
  title: string;
  creator: string;
  creatorAvatar: string;
  game: GameId;
  tag: MediaTag;
  views: string;
  likes: string;
  duration: string;
  thumbnail: string;
  gradient: string;
  posted: string;
  featured?: boolean;
}

export const MEDIA_POSTS: MediaPost[] = [
  { id: 'vid1', title: '1v5 Fanny Cable Steal — SEA Championship Finals', creator: 'ShadowFang', creatorAvatar: 'SF', game: 'mlbb', tag: 'clutch', views: '2.4M', likes: '184K', duration: '0:58', thumbnail: '', gradient: 'from-cyan-500 to-blue-700', posted: '2 days ago', featured: true },
  { id: 'vid2', title: 'How to solo carry with Ling in Mythic Glory', creator: 'NeonStrike', creatorAvatar: 'NS', game: 'mlbb', tag: 'tutorial', views: '890K', likes: '62K', duration: '1:14', thumbnail: '', gradient: 'from-blue-500 to-indigo-700', posted: '4 days ago' },
  { id: 'vid3', title: 'FrostBite ace in 11 seconds — Valorant Pro League', creator: 'IronVeil', creatorAvatar: 'IV', game: 'valorant', tag: 'highlights', views: '3.1M', likes: '241K', duration: '0:43', thumbnail: '', gradient: 'from-red-500 to-rose-700', posted: '1 day ago', featured: true },
  { id: 'vid4', title: 'When the clutch goes wrong 😂', creator: 'PixelGhost', creatorAvatar: 'PG', game: 'valorant', tag: 'meme', views: '5.7M', likes: '820K', duration: '0:31', thumbnail: '', gradient: 'from-pink-500 to-purple-700', posted: '3 days ago' },
  { id: 'vid5', title: 'Free Fire booyah montage — World Series Qualifiers', creator: 'VoltEdge', creatorAvatar: 'VE', game: 'freefire', tag: 'highlights', views: '1.2M', likes: '98K', duration: '1:02', thumbnail: '', gradient: 'from-yellow-400 to-orange-600', posted: '5 days ago' },
  { id: 'vid6', title: 'IronVanguard reaction to winning CODM Iron Cup', creator: 'DawnRift', creatorAvatar: 'DR', game: 'codm', tag: 'reaction', views: '430K', likes: '37K', duration: '0:22', thumbnail: '', gradient: 'from-green-500 to-emerald-700', posted: '6 days ago' },
  { id: 'vid7', title: 'SEA Championship S4 — Official Promo Trailer', creator: 'ProCircuit PH', creatorAvatar: 'PP', game: 'mlbb', tag: 'promo', views: '1.8M', likes: '140K', duration: '1:30', thumbnail: '', gradient: 'from-cyan-600 to-violet-700', posted: '1 week ago', featured: true },
  { id: 'vid8', title: 'Tigreal ultimate wombo combo breakdown', creator: 'CryptoZen', creatorAvatar: 'CZ', game: 'mlbb', tag: 'tutorial', views: '670K', likes: '51K', duration: '0:57', thumbnail: '', gradient: 'from-blue-600 to-purple-700', posted: '1 week ago' },
  { id: 'vid9', title: 'Chou outplay compilation — top 10 moments', creator: 'StormBreaker', creatorAvatar: 'SB', game: 'mlbb', tag: 'clutch', views: '2.1M', likes: '176K', duration: '1:45', thumbnail: '', gradient: 'from-purple-500 to-pink-700', posted: '2 weeks ago' },
  { id: 'vid10', title: 'CODM ranked grind — zero to Legendary', creator: 'ArcLight', creatorAvatar: 'AL', game: 'codm', tag: 'highlights', views: '344K', likes: '28K', duration: '0:48', thumbnail: '', gradient: 'from-emerald-500 to-teal-700', posted: '2 weeks ago' },
  { id: 'vid11', title: 'Valorant Challenger Series hype montage', creator: 'FrostBite', creatorAvatar: 'FB', game: 'valorant', tag: 'promo', views: '760K', likes: '60K', duration: '1:10', thumbnail: '', gradient: 'from-red-600 to-orange-700', posted: '3 weeks ago' },
  { id: 'vid12', title: 'When the lag decides to win the match for you', creator: 'DawnRift', creatorAvatar: 'DR', game: 'freefire', tag: 'meme', views: '9.2M', likes: '1.1M', duration: '0:17', thumbnail: '', gradient: 'from-amber-500 to-red-700', posted: '1 month ago' },
];

// ─── GAME HUB DATA ────────────────────────────────────────────────────────────

export const GAME_HUB_DATA: Record<string, {
  slug: string;
  banner: string;
  description: string;
  topPlayers: { name: string; team: string; stat: string; statLabel: string; avatar: string }[];
  recentHighlights: { title: string; views: string; duration: string; gradient: string }[];
}> = {
  mlbb: {
    slug: 'mobile-legends',
    banner: 'from-cyan-600 via-blue-700 to-indigo-900',
    description: 'The biggest mobile MOBA in Southeast Asia. Build your team, master your hero, dominate the ranked ladder and rise through Meno Arena tournaments.',
    topPlayers: [
      { name: 'ShadowFang', team: 'Phantom Ascent', stat: '5.2', statLabel: 'KDA', avatar: 'SF' },
      { name: 'NeonStrike', team: 'Phantom Ascent', stat: '6.1', statLabel: 'KDA', avatar: 'NS' },
      { name: 'IronVeil', team: 'Phantom Ascent', stat: '4.8', statLabel: 'KDA', avatar: 'IV' },
      { name: 'CryptoZen', team: 'Phantom Ascent', stat: '4.2', statLabel: 'KDA', avatar: 'CZ' },
    ],
    recentHighlights: [
      { title: '1v5 Fanny Cable Steal — SEA Championship', views: '2.4M', duration: '0:58', gradient: 'from-cyan-500 to-blue-700' },
      { title: 'SEA Championship S4 — Official Promo', views: '1.8M', duration: '1:30', gradient: 'from-blue-600 to-indigo-700' },
      { title: 'Chou outplay compilation — top 10', views: '2.1M', duration: '1:45', gradient: 'from-purple-500 to-pink-700' },
    ],
  },
  valorant: {
    slug: 'valorant',
    banner: 'from-red-600 via-rose-700 to-pink-900',
    description: 'Precise gunplay meets tactical agent abilities. Compete in Meno Arena\'s ranked Valorant tournaments and prove your aim at the highest level.',
    topPlayers: [
      { name: 'FrostBite', team: 'Neon Wolves', stat: '3.1', statLabel: 'KDA', avatar: 'FB' },
      { name: 'PixelGhost', team: 'Neon Wolves', stat: '2.8', statLabel: 'KDA', avatar: 'PG' },
      { name: 'StormBreaker', team: 'Neon Wolves', stat: '2.5', statLabel: 'KDA', avatar: 'SB' },
      { name: 'ArcLight', team: 'Cipher Squad', stat: '3.5', statLabel: 'KDA', avatar: 'AL' },
    ],
    recentHighlights: [
      { title: 'FrostBite ace in 11 seconds — Pro League', views: '3.1M', duration: '0:43', gradient: 'from-red-500 to-rose-700' },
      { title: 'Valorant Challenger Series hype montage', views: '760K', duration: '1:10', gradient: 'from-red-600 to-orange-700' },
      { title: 'When the clutch goes wrong 😂', views: '5.7M', duration: '0:31', gradient: 'from-pink-500 to-purple-700' },
    ],
  },
  freefire: {
    slug: 'free-fire',
    banner: 'from-yellow-500 via-orange-600 to-red-800',
    description: 'Drop in, gear up, and be the last squad standing. Free Fire\'s fast-paced battle royale format demands precision and strategy in equal measure.',
    topPlayers: [
      { name: 'VoltEdge', team: 'Phantom Ascent', stat: '8.4', statLabel: 'K/D', avatar: 'VE' },
      { name: 'DawnRift', team: 'Iron Vanguard', stat: '7.1', statLabel: 'K/D', avatar: 'DR' },
    ],
    recentHighlights: [
      { title: 'World Series Qualifiers — Booyah Montage', views: '1.2M', duration: '1:02', gradient: 'from-yellow-400 to-orange-600' },
      { title: 'When the lag decides the match', views: '9.2M', duration: '0:17', gradient: 'from-amber-500 to-red-700' },
    ],
  },
  codm: {
    slug: 'cod-mobile',
    banner: 'from-green-600 via-emerald-700 to-teal-900',
    description: 'Console-quality FPS on mobile. Master gunfights, coordinate your squad, and compete in Meno Arena\'s Call of Duty: Mobile seasonal leagues.',
    topPlayers: [
      { name: 'ArcLight', team: 'Cipher Squad', stat: '4.2', statLabel: 'K/D', avatar: 'AL' },
      { name: 'DawnRift', team: 'Iron Vanguard', stat: '3.8', statLabel: 'K/D', avatar: 'DR' },
    ],
    recentHighlights: [
      { title: 'IronVanguard reaction to winning Iron Cup', views: '430K', duration: '0:22', gradient: 'from-green-500 to-emerald-700' },
      { title: 'CODM ranked grind — zero to Legendary', views: '344K', duration: '0:48', gradient: 'from-emerald-500 to-teal-700' },
    ],
  },
};

// ─── PAYMENT SANDBOX ─────────────────────────────────────────────────────────

export const PAYMENT_METHODS = [
  { id: 'card', label: 'Credit / Debit Card', icon: '💳' },
  { id: 'gcash', label: 'GCash', icon: '📱' },
  { id: 'maya', label: 'Maya', icon: '🏦' },
];

// ─── PLATFORM STATS ───────────────────────────────────────────────────────────

export const PLATFORM_STATS = {
  totalTournaments: 241,
  activePlayers: '85,420',
  totalPrizeMoney: '$2.4M',
  teamsRegistered: '12,800',
  matchesPlayed: '48,900',
  countriesRepresented: 62,
};


// ─── PHASE 8: NOTIFICATIONS & REALTIME UPDATE MOCKS ─────────────────────────

export type RealtimeEventType = 'bracket' | 'match' | 'admin' | 'payment' | 'checkin' | 'media' | 'integration';

export interface RealtimeEvent {
  id: string;
  type: RealtimeEventType;
  title: string;
  message: string;
  tournamentId?: string;
  matchId?: string;
  severity: 'info' | 'success' | 'warning' | 'danger';
  createdAt: string;
}

export interface AdminAlert {
  id: string;
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  source: 'registration' | 'dispute' | 'payment' | 'match_report' | 'integration';
  createdAt: string;
  handled: boolean;
}

export const PHASE8_NOTIFICATIONS: Notification[] = [
  { id: 'n11', type: 'bracket_update', title: 'Bracket Updated', message: 'Phantom Ascent advanced to the SEA Championship Grand Final.', time: 'Just now', read: false },
  { id: 'n12', type: 'stream_live', title: 'Stream Live', message: 'SEA Championship S4 semifinal is now live on the featured stream.', time: '4m ago', read: false },
  { id: 'n13', type: 'discord_sync', title: 'Discord Role Synced', message: 'Registered players received the SEA Championship participant role.', time: '12m ago', read: true },
  { id: 'n14', type: 'registration', title: 'New Registration', message: 'Zero Gravity registered for MLBB Rising Stars.', time: '18m ago', read: true },
  { id: 'n15', type: 'media_featured', title: 'Clip Featured', message: 'Your highlight was promoted to the Mobile Legends game hub.', time: '35m ago', read: true },
];

export const REALTIME_EVENTS: RealtimeEvent[] = [
  { id: 'rt1', type: 'bracket', title: 'Winner advanced', message: 'Phantom Ascent moved into Grand Final slot A.', tournamentId: 'trn1', matchId: 'm5', severity: 'success', createdAt: '2026-06-09T21:10:00' },
  { id: 'rt2', type: 'match', title: 'Result waiting confirmation', message: 'Neon Wolves submitted a 2-1 result against Nova Reapers.', tournamentId: 'trn1', matchId: 'm6', severity: 'warning', createdAt: '2026-06-09T21:04:00' },
  { id: 'rt3', type: 'admin', title: 'Dispute opened', message: 'Match m3 has conflicting score reports and needs admin review.', tournamentId: 'trn1', matchId: 'm3', severity: 'danger', createdAt: '2026-06-09T20:52:00' },
  { id: 'rt4', type: 'checkin', title: 'Check-in window closing', message: 'SEA Championship check-in closes in 45 minutes.', tournamentId: 'trn1', severity: 'warning', createdAt: '2026-06-09T20:35:00' },
  { id: 'rt5', type: 'integration', title: 'Discord announcement sent', message: 'Bracket published announcement delivered to #tournament-updates.', tournamentId: 'trn1', severity: 'success', createdAt: '2026-06-09T20:20:00' },
  { id: 'rt6', type: 'media', title: 'Featured clip queued', message: 'Fanny Cable Steal highlight added to MLBB hub carousel.', tournamentId: 'trn1', severity: 'info', createdAt: '2026-06-09T20:10:00' },
];

export const ADMIN_ALERTS: AdminAlert[] = [
  { id: 'aa1', title: 'Critical dispute', message: 'SEA Championship semifinal has two conflicting screenshot proofs.', priority: 'critical', source: 'dispute', createdAt: '2026-06-09T21:02:00', handled: false },
  { id: 'aa2', title: 'Payment pending', message: 'Iron Vanguard payment is still pending after registration lock.', priority: 'high', source: 'payment', createdAt: '2026-06-09T20:40:00', handled: false },
  { id: 'aa3', title: 'Webhook delivery warning', message: 'Discord webhook retry succeeded after one failed attempt.', priority: 'medium', source: 'integration', createdAt: '2026-06-09T20:15:00', handled: true },
  { id: 'aa4', title: 'New team registration', message: 'Zero Gravity joined MLBB Rising Stars and needs organizer approval.', priority: 'low', source: 'registration', createdAt: '2026-06-09T19:55:00', handled: false },
];

// ─── PHASE 9: COMMUNITY, LEADERBOARD & EVENT DATA ───────────────────────────

export interface LeaderboardRow {
  id: string;
  rank: number;
  name: string;
  team: string;
  game: GameId;
  rating: number;
  winRate: number;
  streak: string;
  avatar: string;
}

export interface CommunityPost {
  id: string;
  author: string;
  avatar: string;
  role: string;
  game: GameId;
  title: string;
  body: string;
  likes: number;
  replies: number;
  tag: 'announcement' | 'recruitment' | 'highlight' | 'discussion' | 'scrim';
  createdAt: string;
}

export interface CommunityEvent {
  id: string;
  title: string;
  game: GameId;
  type: 'watch_party' | 'scrim_night' | 'creator_drop' | 'open_qualifier';
  startsAt: string;
  attendees: number;
  reward: string;
}

export const LEADERBOARD_ROWS: LeaderboardRow[] = [
  { id: 'lb1', rank: 1, name: 'ShadowFang', team: 'Phantom Ascent', game: 'mlbb', rating: 2840, winRate: 82, streak: 'W8', avatar: 'SF' },
  { id: 'lb2', rank: 2, name: 'FrostBite', team: 'Neon Wolves', game: 'valorant', rating: 2765, winRate: 78, streak: 'W5', avatar: 'FB' },
  { id: 'lb3', rank: 3, name: 'NeonStrike', team: 'Phantom Ascent', game: 'mlbb', rating: 2712, winRate: 81, streak: 'W4', avatar: 'NS' },
  { id: 'lb4', rank: 4, name: 'ArcLight', team: 'Cipher Squad', game: 'codm', rating: 2690, winRate: 76, streak: 'W3', avatar: 'AL' },
  { id: 'lb5', rank: 5, name: 'PixelGhost', team: 'Neon Wolves', game: 'valorant', rating: 2605, winRate: 73, streak: 'L1', avatar: 'PG' },
  { id: 'lb6', rank: 6, name: 'VoltEdge', team: 'Iron Vanguard', game: 'freefire', rating: 2520, winRate: 69, streak: 'W2', avatar: 'VE' },
];

export const COMMUNITY_POSTS: CommunityPost[] = [
  { id: 'cp1', author: 'ProCircuit PH', avatar: 'PP', role: 'Organizer', game: 'mlbb', title: 'SEA Championship check-in reminder', body: 'Captains must lock lineups before check-in closes. Late roster swaps will need admin approval.', likes: 420, replies: 38, tag: 'announcement', createdAt: '15m ago' },
  { id: 'cp2', author: 'Neon Wolves', avatar: 'NW', role: 'Team', game: 'valorant', title: 'Looking for a sentinel substitute', body: 'Need one Immortal+ sentinel for APAC scrim block. Drop tracker and availability.', likes: 120, replies: 24, tag: 'recruitment', createdAt: '42m ago' },
  { id: 'cp3', author: 'ShadowFang', avatar: 'SF', role: 'Player', game: 'mlbb', title: 'Fanny cable steal breakdown', body: 'Posted a short breakdown of the turtle steal timing. The key was watching roamer cooldowns, not just mechanics.', likes: 980, replies: 91, tag: 'highlight', createdAt: '1h ago' },
  { id: 'cp4', author: 'Meno Arena Mods', avatar: 'MA', role: 'Admin', game: 'codm', title: 'CODM Iron Cup dispute policy update', body: 'From today, final round screenshots must include scoreboard and timestamp to speed up reviews.', likes: 260, replies: 18, tag: 'announcement', createdAt: '2h ago' },
];

export const COMMUNITY_EVENTS: CommunityEvent[] = [
  { id: 'ce1', title: 'SEA Championship Watch Party', game: 'mlbb', type: 'watch_party', startsAt: '2026-06-10T18:00', attendees: 1240, reward: 'Viewer badge' },
  { id: 'ce2', title: 'Valorant Friday Scrim Night', game: 'valorant', type: 'scrim_night', startsAt: '2026-06-12T20:00', attendees: 320, reward: 'Team rating boost' },
  { id: 'ce3', title: 'Free Fire Creator Drop', game: 'freefire', type: 'creator_drop', startsAt: '2026-06-13T16:30', attendees: 870, reward: 'Featured clip slot' },
  { id: 'ce4', title: 'CODM Open Qualifier Lobby', game: 'codm', type: 'open_qualifier', startsAt: '2026-06-14T19:00', attendees: 510, reward: '$500 prize pool' },
];

// ─── PHASE 10: DISCORD & TWITCH INTEGRATION MOCKS ───────────────────────────

export interface DiscordWebhookConfig {
  id: string;
  name: string;
  channel: string;
  event: 'registration_open' | 'bracket_published' | 'match_starting' | 'winner_announcement' | 'dispute_alert';
  enabled: boolean;
  lastSent: string;
}

export interface TwitchStreamConfig {
  id: string;
  channelName: string;
  tournamentId: string;
  title: string;
  status: 'live' | 'scheduled' | 'offline';
  viewers: number;
  startsAt: string;
}

export interface IntegrationLog {
  id: string;
  provider: 'discord' | 'twitch';
  action: string;
  status: 'success' | 'warning' | 'failed';
  message: string;
  createdAt: string;
}

export const DISCORD_WEBHOOKS: DiscordWebhookConfig[] = [
  { id: 'dw1', name: 'Tournament Updates', channel: '#tournament-updates', event: 'bracket_published', enabled: true, lastSent: '2026-06-09T20:20:00' },
  { id: 'dw2', name: 'Match Reminders', channel: '#match-reminders', event: 'match_starting', enabled: true, lastSent: '2026-06-09T19:40:00' },
  { id: 'dw3', name: 'Admin Alerts', channel: '#admin-war-room', event: 'dispute_alert', enabled: false, lastSent: 'Never' },
  { id: 'dw4', name: 'Winners Feed', channel: '#hall-of-fame', event: 'winner_announcement', enabled: true, lastSent: '2026-06-08T22:10:00' },
];

export const TWITCH_STREAMS: TwitchStreamConfig[] = [
  { id: 'tw1', channelName: 'MenoArenaOfficial', tournamentId: 'trn1', title: 'SEA Championship S4 — Semifinals', status: 'live', viewers: 18420, startsAt: '2026-06-09T18:00:00' },
  { id: 'tw2', channelName: 'VCT_APAC', tournamentId: 'trn2', title: 'Valorant Pro League Draft Show', status: 'scheduled', viewers: 0, startsAt: '2026-06-11T20:00:00' },
  { id: 'tw3', channelName: 'MobileMasters', tournamentId: 'trn5', title: 'MLBB Club Masters Replay Room', status: 'offline', viewers: 0, startsAt: '2026-06-08T17:00:00' },
];

export const INTEGRATION_LOGS: IntegrationLog[] = [
  { id: 'il1', provider: 'discord', action: 'Bracket published', status: 'success', message: 'Announcement delivered to #tournament-updates.', createdAt: '2026-06-09T20:20:00' },
  { id: 'il2', provider: 'discord', action: 'Match reminder', status: 'success', message: 'Reminder sent 30 minutes before semifinal.', createdAt: '2026-06-09T19:40:00' },
  { id: 'il3', provider: 'twitch', action: 'Stream sync', status: 'success', message: 'Live viewer count refreshed for MenoArenaOfficial.', createdAt: '2026-06-09T19:30:00' },
  { id: 'il4', provider: 'discord', action: 'Role sync retry', status: 'warning', message: 'First attempt failed, retry succeeded after 18 seconds.', createdAt: '2026-06-09T18:50:00' },
];

// ─── PHASE 11: SPONSOR ACTIVATION DATA ──────────────────────────────────────

export interface SponsorCampaign {
  id: string;
  sponsorId: string;
  tournamentId: string;
  title: string;
  placement: 'homepage_hero' | 'tournament_presented_by' | 'bracket_takeover' | 'match_card' | 'game_hub' | 'media_feature';
  status: 'draft' | 'scheduled' | 'active' | 'completed';
  budget: number;
  impressions: number;
  clicks: number;
  ctr: number;
}

export interface SponsorPackage {
  id: string;
  name: string;
  price: string;
  accent: string;
  bestFor: string;
  benefits: string[];
}

export interface SponsorPlacement {
  id: string;
  name: string;
  page: string;
  description: string;
  sponsorId: string;
  live: boolean;
}

export const SPONSOR_PACKAGES: SponsorPackage[] = [
  {
    id: 'pkg1',
    name: 'Presented By Tournament',
    price: '$1,500+',
    accent: '#00d4ff',
    bestFor: 'Main event sponsors',
    benefits: ['Tournament naming block', 'Hero banner logo', 'Bracket page placement', 'Winner announcement mention'],
  },
  {
    id: 'pkg2',
    name: 'MVP Highlight Partner',
    price: '$750+',
    accent: '#a855f7',
    bestFor: 'Brands targeting creators',
    benefits: ['Sponsored MVP award', 'Media gallery feature', 'Short-form clip branding', 'Creator spotlight placement'],
  },
  {
    id: 'pkg3',
    name: 'Community Boost',
    price: '$300+',
    accent: '#4ade80',
    bestFor: 'Local shops and small brands',
    benefits: ['Community post pin', 'Game hub card', 'Discord announcement placeholder', 'Basic campaign analytics'],
  },
];

export const SPONSOR_CAMPAIGNS: SponsorCampaign[] = [
  { id: 'sc1', sponsorId: 's1', tournamentId: 'trn1', title: 'TechGear Pro SEA Championship Takeover', placement: 'tournament_presented_by', status: 'active', budget: 5000, impressions: 184200, clicks: 8420, ctr: 4.57 },
  { id: 'sc2', sponsorId: 's2', tournamentId: 'trn2', title: 'EnergyX Valorant Draft Show', placement: 'media_feature', status: 'scheduled', budget: 3000, impressions: 65200, clicks: 1840, ctr: 2.82 },
  { id: 'sc3', sponsorId: 's3', tournamentId: 'trn4', title: 'GrindFuel CODM Iron Cup Boost', placement: 'bracket_takeover', status: 'active', budget: 2200, impressions: 98200, clicks: 3900, ctr: 3.97 },
  { id: 'sc4', sponsorId: 's5', tournamentId: 'trn6', title: 'StreamGear Challenger Stream Pack', placement: 'match_card', status: 'draft', budget: 1200, impressions: 0, clicks: 0, ctr: 0 },
];

export const SPONSOR_PLACEMENTS: SponsorPlacement[] = [
  { id: 'sp1', name: 'Homepage sponsor strip', page: '/', description: 'Premium sponsor row below live matches and featured tournaments.', sponsorId: 's1', live: true },
  { id: 'sp2', name: 'Presented by block', page: '/tournaments/trn1', description: 'Tournament detail sponsorship panel with CTA and campaign message.', sponsorId: 's1', live: true },
  { id: 'sp3', name: 'Bracket side rail', page: '/brackets/trn1', description: 'Non-intrusive sponsor card beside bracket progression.', sponsorId: 's3', live: true },
  { id: 'sp4', name: 'Game hub sponsor card', page: '/games/mobile-legends', description: 'Game-specific placement for brands targeting one title.', sponsorId: 's5', live: false },
  { id: 'sp5', name: 'Media gallery feature', page: '/media', description: 'Sponsored highlight reel slot for creator campaigns.', sponsorId: 's2', live: true },
];

// ─── PHASE 12: STORE, CART & ORDER DATA ─────────────────────────────────────

export interface Product {
  id: string;
  name: string;
  category: 'jersey' | 'hoodie' | 'accessory' | 'digital' | 'event_pass';
  price: number;
  stock: number;
  imageGradient: string;
  badge: string;
  description: string;
  sizes?: string[];
  featured?: boolean;
}

export interface StoreOrder {
  id: string;
  customer: string;
  total: number;
  items: number;
  status: 'pending' | 'paid' | 'packed' | 'shipped' | 'completed';
  createdAt: string;
}

export const PRODUCTS: Product[] = [
  { id: 'prd1', name: 'Meno Arena Pro Jersey', category: 'jersey', price: 49, stock: 42, imageGradient: 'from-cyan-500 to-blue-700', badge: 'Best Seller', description: 'Lightweight tournament jersey with breathable esports fit.', sizes: ['S', 'M', 'L', 'XL'], featured: true },
  { id: 'prd2', name: 'Phantom Ascent Team Jersey', category: 'jersey', price: 59, stock: 18, imageGradient: 'from-blue-600 to-indigo-800', badge: 'Team Drop', description: 'Official Phantom Ascent fan jersey for the SEA Championship run.', sizes: ['S', 'M', 'L'], featured: true },
  { id: 'prd3', name: 'Neon Wolves Hoodie', category: 'hoodie', price: 72, stock: 12, imageGradient: 'from-purple-600 to-pink-800', badge: 'Limited', description: 'Premium fleece hoodie with neon wolf crest and oversized streetwear cut.', sizes: ['M', 'L', 'XL'], featured: true },
  { id: 'prd4', name: 'Meno Arena Mousepad XL', category: 'accessory', price: 29, stock: 80, imageGradient: 'from-zinc-600 to-slate-900', badge: 'Gear', description: 'Large stitched mousepad for FPS and MOBA players.', featured: false },
  { id: 'prd5', name: 'Digital Event Pass', category: 'event_pass', price: 9, stock: 500, imageGradient: 'from-yellow-500 to-orange-700', badge: 'Digital', description: 'Viewer pass with badge, prediction access, and community rewards.', featured: false },
  { id: 'prd6', name: 'Creator Overlay Pack', category: 'digital', price: 19, stock: 999, imageGradient: 'from-emerald-500 to-teal-700', badge: 'Download', description: 'Stream overlays, score bars, and tournament lower-thirds for creators.', featured: false },
  { id: 'prd7', name: 'Champion Cap', category: 'accessory', price: 24, stock: 33, imageGradient: 'from-red-500 to-rose-800', badge: 'New', description: 'Minimal black cap with embroidered Meno Arena champion mark.', featured: false },
  { id: 'prd8', name: 'Grand Finals Poster Pack', category: 'digital', price: 7, stock: 999, imageGradient: 'from-violet-500 to-indigo-800', badge: 'Digital', description: 'High-resolution digital posters from the latest championship events.', featured: false },
];

export const STORE_ORDERS: StoreOrder[] = [
  { id: 'ord1', customer: 'ShadowFang', total: 108, items: 2, status: 'paid', createdAt: '2026-06-08T12:20:00' },
  { id: 'ord2', customer: 'Neon Wolves', total: 216, items: 3, status: 'packed', createdAt: '2026-06-08T16:40:00' },
  { id: 'ord3', customer: 'PixelGhost', total: 19, items: 1, status: 'completed', createdAt: '2026-06-07T09:10:00' },
  { id: 'ord4', customer: 'DawnRift', total: 49, items: 1, status: 'pending', createdAt: '2026-06-09T19:25:00' },
];

// ─── PHASE 13: ANALYTICS & CONTROL CENTER DATA ──────────────────────────────

export interface AnalyticsMetric {
  id: string;
  label: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'flat';
  color: string;
}

export interface RevenueSnapshot {
  source: 'entry_fees' | 'store_sales' | 'sponsorships' | 'digital_goods';
  label: string;
  amount: number;
  percentage: number;
  color: string;
}

export interface AdminHealthCheck {
  id: string;
  area: string;
  status: 'healthy' | 'warning' | 'attention';
  message: string;
}

export const ANALYTICS_METRICS: AnalyticsMetric[] = [
  { id: 'am1', label: 'Monthly registrations', value: '4,820', change: '+18%', trend: 'up', color: '#00d4ff' },
  { id: 'am2', label: 'Check-in completion', value: '87%', change: '+6%', trend: 'up', color: '#4ade80' },
  { id: 'am3', label: 'Dispute rate', value: '2.8%', change: '-1.1%', trend: 'down', color: '#ff4655' },
  { id: 'am4', label: 'Store conversion', value: '4.4%', change: '+0.8%', trend: 'up', color: '#ffd700' },
  { id: 'am5', label: 'Sponsor CTR', value: '3.9%', change: '+0.4%', trend: 'up', color: '#a855f7' },
  { id: 'am6', label: 'Avg. match delay', value: '7m', change: '-3m', trend: 'down', color: '#f97316' },
];

export const REVENUE_SNAPSHOTS: RevenueSnapshot[] = [
  { source: 'sponsorships', label: 'Sponsorships', amount: 11400, percentage: 48, color: '#00d4ff' },
  { source: 'entry_fees', label: 'Entry Fees', amount: 5200, percentage: 22, color: '#4ade80' },
  { source: 'store_sales', label: 'Store Sales', amount: 4500, percentage: 19, color: '#ffd700' },
  { source: 'digital_goods', label: 'Digital Goods', amount: 2600, percentage: 11, color: '#a855f7' },
];

export const ADMIN_HEALTH_CHECKS: AdminHealthCheck[] = [
  { id: 'hc1', area: 'Auth & roles', status: 'healthy', message: 'Role-based pages are wired for frontend demo mode.' },
  { id: 'hc2', area: 'Payments', status: 'warning', message: 'Sandbox payment UI only. Real payouts must stay manual until legal/payment setup is ready.' },
  { id: 'hc3', area: 'Integrations', status: 'warning', message: 'Discord/Twitch controls are placeholders until API credentials are added.' },
  { id: 'hc4', area: 'Mobile UX', status: 'healthy', message: 'Main public routes use responsive grid layouts and mobile-friendly cards.' },
  { id: 'hc5', area: 'Deployment', status: 'attention', message: 'Ready for local build test after npm install; production deployment is not performed inside this zip.' },
];
