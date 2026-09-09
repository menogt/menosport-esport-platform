/**
 * Game catalog shared by the client and server.
 *
 * Header artwork is copyrighted, so every game exposes a placeholder slot
 * (`headerImage`) sized for a 21:9 / 16:9 banner crop. Swapping in licensed or
 * original artwork later only requires replacing the URL — no layout changes.
 */
export type GameSlug = "mobile-legends" | "valorant" | "free-fire" | "cod-mobile";

export type HeroStatCard = {
  name: string;
  role: string;
  pickRate: number;
  winRate: number;
  banRate: number;
  tier: "S" | "A" | "B";
};

export type GameDefinition = {
  slug: GameSlug;
  name: string;
  shortName: string;
  publisher: string;
  genre: string;
  platform: "Mobile" | "PC" | "Cross-platform";
  teamSize: number;
  accent: "lime" | "blue" | "orange" | "violet";
  /** Placeholder slot: `[GAME_HEADER_IMAGE: <game name>]` until real artwork is supplied. */
  headerImage: string | null;
  headerLabel: string;
  tagline: string;
  description: string;
  heroCards: HeroStatCard[];
};

export const GAMES: readonly GameDefinition[] = [
  {
    slug: "mobile-legends",
    name: "Mobile Legends: Bang Bang",
    shortName: "MLBB",
    publisher: "Moonton",
    genre: "MOBA",
    platform: "Mobile",
    teamSize: 5,
    accent: "lime",
    headerImage: null,
    headerLabel: "[GAME_HEADER_IMAGE: Mobile Legends: Bang Bang]",
    tagline: "Five lanes. One Land of Dawn.",
    description: "The flagship mobile MOBA circuit. Draft-phase depth, objective control, and roster discipline decide every series.",
    heroCards: [
      { name: "Fanny", role: "Assassin", pickRate: 18.4, winRate: 52.1, banRate: 61.2, tier: "S" },
      { name: "Ling", role: "Assassin", pickRate: 22.7, winRate: 50.8, banRate: 48.9, tier: "S" },
      { name: "Tigreal", role: "Tank", pickRate: 31.5, winRate: 53.4, banRate: 12.3, tier: "A" },
      { name: "Chou", role: "Fighter", pickRate: 27.9, winRate: 51.6, banRate: 34.7, tier: "A" },
      { name: "Layla", role: "Marksman", pickRate: 14.2, winRate: 49.3, banRate: 2.1, tier: "B" },
    ],
  },
  {
    slug: "valorant",
    name: "Valorant",
    shortName: "VAL",
    publisher: "Riot Games",
    genre: "Tactical shooter",
    platform: "PC",
    teamSize: 5,
    accent: "blue",
    headerImage: null,
    headerLabel: "[GAME_HEADER_IMAGE: Valorant]",
    tagline: "Precision gunplay. Agent utility. Map control.",
    description: "Best-of series on a rotating map pool. Economy management and executes separate playoff rosters from open qualifiers.",
    heroCards: [
      { name: "Jett", role: "Duelist", pickRate: 41.2, winRate: 50.4, banRate: 0, tier: "S" },
      { name: "Omen", role: "Controller", pickRate: 38.6, winRate: 51.1, banRate: 0, tier: "S" },
      { name: "Sova", role: "Initiator", pickRate: 29.3, winRate: 49.8, banRate: 0, tier: "A" },
      { name: "Killjoy", role: "Sentinel", pickRate: 27.4, winRate: 52.0, banRate: 0, tier: "A" },
      { name: "Raze", role: "Duelist", pickRate: 24.8, winRate: 50.9, banRate: 0, tier: "A" },
    ],
  },
  {
    slug: "free-fire",
    name: "Free Fire",
    shortName: "FF",
    publisher: "Garena",
    genre: "Battle royale",
    platform: "Mobile",
    teamSize: 4,
    accent: "orange",
    headerImage: null,
    headerLabel: "[GAME_HEADER_IMAGE: Free Fire]",
    tagline: "Twelve squads. One survivor.",
    description: "Point-based lobbies across multiple rounds. Placement and eliminations both count toward the leaderboard.",
    heroCards: [
      { name: "Alok", role: "Support", pickRate: 52.3, winRate: 0, banRate: 0, tier: "S" },
      { name: "Chrono", role: "Defense", pickRate: 33.1, winRate: 0, banRate: 0, tier: "A" },
      { name: "K", role: "Sustain", pickRate: 28.7, winRate: 0, banRate: 0, tier: "A" },
      { name: "Kelly", role: "Mobility", pickRate: 21.4, winRate: 0, banRate: 0, tier: "B" },
    ],
  },
  {
    slug: "cod-mobile",
    name: "Call of Duty: Mobile",
    shortName: "CODM",
    publisher: "Activision",
    genre: "FPS",
    platform: "Mobile",
    teamSize: 5,
    accent: "violet",
    headerImage: null,
    headerLabel: "[GAME_HEADER_IMAGE: Call of Duty: Mobile]",
    tagline: "Search & Destroy. Hardpoint. Domination.",
    description: "Multi-mode series with map vetoes. Objective time and round conversion decide the bracket.",
    heroCards: [
      { name: "AK117", role: "Assault rifle", pickRate: 36.5, winRate: 0, banRate: 0, tier: "S" },
      { name: "DL Q33", role: "Sniper", pickRate: 29.2, winRate: 0, banRate: 0, tier: "A" },
      { name: "QQ9", role: "SMG", pickRate: 24.8, winRate: 0, banRate: 0, tier: "A" },
      { name: "M4", role: "Assault rifle", pickRate: 18.9, winRate: 0, banRate: 0, tier: "B" },
    ],
  },
] as const;

const GAME_ALIASES: Record<string, GameSlug> = {
  "mobile-legends": "mobile-legends",
  "mobile legends": "mobile-legends",
  "mobile legends: bang bang": "mobile-legends",
  mlbb: "mobile-legends",
  valorant: "valorant",
  val: "valorant",
  "free-fire": "free-fire",
  "free fire": "free-fire",
  ff: "free-fire",
  "cod-mobile": "cod-mobile",
  "cod mobile": "cod-mobile",
  "call of duty: mobile": "cod-mobile",
  "call of duty mobile": "cod-mobile",
  codm: "cod-mobile",
};

export function findGame(value: string | null | undefined): GameDefinition | undefined {
  if (!value) return undefined;
  const key = value.trim().toLowerCase();
  const slug = GAME_ALIASES[key] ?? (GAMES.find(game => game.slug === key || game.name.toLowerCase() === key)?.slug);
  return slug ? GAMES.find(game => game.slug === slug) : undefined;
}

export function gameSlugFor(value: string | null | undefined): GameSlug | null {
  return findGame(value)?.slug ?? null;
}

export function gameLabel(value: string | null | undefined): string {
  return findGame(value)?.name ?? (value ?? "Unknown game");
}
