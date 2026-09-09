/**
 * Game hub domain: per-title discovery (tournaments, top teams and clans,
 * leaderboards, recent results, media). Falls back to the demo dataset when
 * the database is not configured.
 */
import type { MediaKind } from "@shared/arena";
import { GAMES, findGame, gameSlugFor, type GameDefinition, type GameSlug } from "@shared/games";
import { seedClans, seedMedia, seedTeams, seedTournaments } from "../seed/data";
import { fetchTeamSummaries, labelForMatch, type MatchRow, type MatchView, type TeamSummary } from "./matches";
import { camelRows, db, fail, hasDb, notFound } from "./_shared";
import { listTournaments, seedId, seedMatchViews, seedTeamSummary, seedTournamentList, type TournamentListItem } from "./tournaments";

export type GameListItem = GameDefinition & { tournamentCount: number; teamCount: number; liveCount: number };

export type ClanCard = { id: number; name: string; tag: string; verified: boolean; region: string | null; logoUrl: string | null; trophies: number; prizeEarningsCents: number; followerCount: number; teamCount: number };
export type LeaderboardRow = TeamSummary & { played: number; winRate: number; rank: number };
export type MediaCard = { id: number; title: string; description: string | null; kind: MediaKind; game: string | null; tags: string[]; views: number; likes: number; durationSeconds: number | null; assetUrl: string | null; thumbnailUrl: string | null; clanId: number | null; createdAt: Date | null };
export type RecentMatch = MatchView & { tournament: { id: number; name: string; format: string } };

export type GameHub = {
  game: GameDefinition;
  stats: { tournamentCount: number; teamCount: number; liveCount: number; clanCount: number };
  upcomingTournaments: TournamentListItem[];
  topTeams: TeamSummary[];
  topClans: ClanCard[];
  leaderboard: LeaderboardRow[];
  recentMatches: RecentMatch[];
  media: MediaCard[];
};

function leaderboardFrom(teams: TeamSummary[]): LeaderboardRow[] {
  return teams
    .map(team => ({ ...team, played: team.wins + team.losses, winRate: team.wins + team.losses ? Math.round((team.wins / (team.wins + team.losses)) * 1000) / 10 : 0 }))
    .sort((a, b) => b.winRate - a.winRate || b.wins - a.wins || a.name.localeCompare(b.name))
    .map((row, index) => ({ ...row, rank: index + 1 }));
}

// ---------------------------------------------------------------------------
// Demo fallback
// ---------------------------------------------------------------------------

function seedGameList(): GameListItem[] {
  return GAMES.map(game => ({
    ...game,
    tournamentCount: seedTournaments.filter(row => gameSlugFor(row.game) === game.slug).length,
    teamCount: seedTeams.filter(row => gameSlugFor(row.game) === game.slug).length,
    liveCount: seedTournaments.filter(row => gameSlugFor(row.game) === game.slug && row.status === "live").length,
  }));
}

function seedClanCards(slug: GameSlug): ClanCard[] {
  return seedClans
    .map((clan, index) => ({ clan, id: index + 1, teamCount: seedTeams.filter(team => team.clanKey === clan.key && gameSlugFor(team.game) === slug).length }))
    .filter(entry => entry.teamCount > 0)
    .map(({ clan, id, teamCount }) => ({ id, name: clan.name, tag: clan.tag, verified: clan.verified, region: clan.region, logoUrl: null, trophies: clan.trophies, prizeEarningsCents: clan.prizeEarningsCents, followerCount: clan.followerCount, teamCount }))
    .sort((a, b) => b.trophies - a.trophies || b.prizeEarningsCents - a.prizeEarningsCents);
}

function seedGameHub(game: GameDefinition): GameHub {
  const teams = seedTeams.map((_, index) => seedTeamSummary(index + 1)).filter((team): team is TeamSummary => Boolean(team) && gameSlugFor(team?.game) === game.slug);
  const tournaments = seedTournamentList({ game: game.slug, limit: 100 });
  const recentMatches: RecentMatch[] = tournaments
    .filter(row => row.status === "live" || row.status === "completed")
    .flatMap(row => seedMatchViews(row.id).filter(match => match.status === "completed" && match.homeTeamId && match.awayTeamId).map(match => ({ ...match, tournament: { id: row.id, name: row.name, format: row.format } })))
    .sort((a, b) => (b.completedAt?.getTime() ?? 0) - (a.completedAt?.getTime() ?? 0))
    .slice(0, 8);
  const media: MediaCard[] = seedMedia
    .map((item, index) => ({ item, id: index + 1 }))
    .filter(({ item }) => gameSlugFor(item.game) === game.slug)
    .slice(0, 6)
    .map(({ item, id }) => ({ id, title: item.title, description: item.description, kind: item.kind, game: item.game, tags: item.tags, views: item.views, likes: item.likes, durationSeconds: item.durationSeconds, assetUrl: null, thumbnailUrl: null, clanId: item.clanKey ? seedId.clan(item.clanKey) : null, createdAt: null }));
  const clans = seedClanCards(game.slug);
  return {
    game,
    stats: { tournamentCount: tournaments.length, teamCount: teams.length, liveCount: tournaments.filter(row => row.status === "live").length, clanCount: clans.length },
    upcomingTournaments: tournaments.filter(row => row.status === "registration" || row.status === "checkin" || row.status === "live").slice(0, 6),
    topTeams: [...teams].sort((a, b) => b.wins - a.wins).slice(0, 8),
    topClans: clans.slice(0, 6),
    leaderboard: leaderboardFrom(teams).slice(0, 10),
    recentMatches,
    media,
  };
}

// ---------------------------------------------------------------------------
// Database
// ---------------------------------------------------------------------------

async function dbGameList(): Promise<GameListItem[]> {
  const [tournaments, teams] = await Promise.all([
    db().from("tournaments").select("game,status").neq("status", "draft"),
    db().from("teams").select("game"),
  ]);
  if (tournaments.error) fail(tournaments.error, "Tournament lookup failed");
  if (teams.error) fail(teams.error, "Team lookup failed");
  return GAMES.map(game => ({
    ...game,
    tournamentCount: (tournaments.data ?? []).filter(row => gameSlugFor(row.game) === game.slug).length,
    teamCount: (teams.data ?? []).filter(row => gameSlugFor(row.game) === game.slug).length,
    liveCount: (tournaments.data ?? []).filter(row => gameSlugFor(row.game) === game.slug && row.status === "live").length,
  }));
}

async function dbGameHub(game: GameDefinition): Promise<GameHub> {
  const tournaments = await listTournaments({ game: game.slug, limit: 200 });
  const { data: teamRows, error: teamError } = await db().from("teams").select("id,name,tag,logo_url,game,wins,losses,clan_teams(clan:clans(id,name,tag,verified))").limit(1000);
  if (teamError) fail(teamError, "Team lookup failed");
  const gameTeamIds = (teamRows ?? []).filter(row => gameSlugFor(row.game) === game.slug).map(row => Number(row.id));
  const teamMap = await fetchTeamSummaries(gameTeamIds);
  const teams = Array.from(teamMap.values());

  let clans: ClanCard[] = [];
  if (gameTeamIds.length) {
    const { data: links, error: linkError } = await db().from("clan_teams").select("clan_id,team_id").in("team_id", gameTeamIds);
    if (linkError) fail(linkError, "Clan lookup failed");
    const teamCounts = new Map<number, number>();
    for (const link of links ?? []) teamCounts.set(Number(link.clan_id), (teamCounts.get(Number(link.clan_id)) ?? 0) + 1);
    const clanIds = Array.from(teamCounts.keys());
    if (clanIds.length) {
      const { data: clanRows, error: clanError } = await db().from("clans").select("id,name,tag,verified,region,logo_url,trophies,prize_earnings_cents,follower_count").in("id", clanIds);
      if (clanError) fail(clanError, "Clan lookup failed");
      clans = (clanRows ?? [])
        .map(row => ({ id: Number(row.id), name: String(row.name), tag: String(row.tag), verified: Boolean(row.verified), region: row.region ?? null, logoUrl: row.logo_url ?? null, trophies: Number(row.trophies ?? 0), prizeEarningsCents: Number(row.prize_earnings_cents ?? 0), followerCount: Number(row.follower_count ?? 0), teamCount: teamCounts.get(Number(row.id)) ?? 0 }))
        .sort((a, b) => b.trophies - a.trophies || b.prizeEarningsCents - a.prizeEarningsCents);
    }
  }

  let recentMatches: RecentMatch[] = [];
  const playedTournaments = tournaments.filter(row => row.status === "live" || row.status === "completed").slice(0, 12);
  if (playedTournaments.length) {
    const { data: matchRows, error: matchError } = await db().from("matches").select("*").in("tournament_id", playedTournaments.map(row => row.id));
    if (matchError) fail(matchError, "Match lookup failed");
    const rows = camelRows<MatchRow>(matchRows);
    const summaries = await fetchTeamSummaries(rows.flatMap(row => [row.homeTeamId, row.awayTeamId]));
    recentMatches = rows
      .filter(row => row.status === "completed" && row.homeTeamId && row.awayTeamId)
      .sort((a, b) => (b.completedAt?.getTime() ?? 0) - (a.completedAt?.getTime() ?? 0))
      .slice(0, 8)
      .map(row => {
        const tournament = playedTournaments.find(item => item.id === row.tournamentId) as TournamentListItem;
        const siblings = rows.filter(other => other.tournamentId === row.tournamentId);
        return { ...row, roundLabel: labelForMatch(tournament.format, row, siblings), homeTeam: row.homeTeamId ? summaries.get(row.homeTeamId) ?? null : null, awayTeam: row.awayTeamId ? summaries.get(row.awayTeamId) ?? null : null, tournament: { id: tournament.id, name: tournament.name, format: tournament.format } };
      });
  }

  const { data: mediaRows, error: mediaError } = await db().from("media_assets").select("*").eq("published", true).order("created_at", { ascending: false }).limit(80);
  if (mediaError) fail(mediaError, "Media lookup failed");
  const media: MediaCard[] = camelRows(mediaRows)
    .filter(row => gameSlugFor(row.game) === game.slug)
    .slice(0, 6)
    .map(row => ({ id: Number(row.id), title: String(row.title), description: row.description ?? null, kind: row.kind ?? "highlight", game: row.game ?? null, tags: Array.isArray(row.tags) ? row.tags : [], views: Number(row.views ?? 0), likes: Number(row.likes ?? 0), durationSeconds: row.durationSeconds ?? null, assetUrl: row.assetUrl ?? null, thumbnailUrl: row.thumbnailUrl ?? null, clanId: row.clanId ?? null, createdAt: row.createdAt ?? null }));

  return {
    game,
    stats: { tournamentCount: tournaments.length, teamCount: teams.length, liveCount: tournaments.filter(row => row.status === "live").length, clanCount: clans.length },
    upcomingTournaments: tournaments.filter(row => row.status === "registration" || row.status === "checkin" || row.status === "live").slice(0, 6),
    topTeams: [...teams].sort((a, b) => b.wins - a.wins || a.name.localeCompare(b.name)).slice(0, 8),
    topClans: clans.slice(0, 6),
    leaderboard: leaderboardFrom(teams).slice(0, 10),
    recentMatches,
    media,
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function listGames(): Promise<GameListItem[]> {
  return hasDb() ? dbGameList() : seedGameList();
}

export async function gameHub(slug: string): Promise<GameHub> {
  const game = findGame(slug);
  if (!game) notFound("Game");
  return hasDb() ? dbGameHub(game) : seedGameHub(game);
}
