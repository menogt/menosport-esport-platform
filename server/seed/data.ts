/**
 * Canonical demo dataset for Meno Arena.
 *
 * Used by (1) `scripts/seed.ts` to populate a Supabase project and (2) the
 * server's public read paths as a graceful fallback when the database is not
 * configured, so discovery surfaces never render empty. All organisations,
 * teams, players, and brands are fictional.
 */
import type { MediaKind, ProductCategory, TournamentFormat, TournamentStatus } from "@shared/arena";

export type SeedUser = { key: string; email: string; name: string; role: "user" | "organizer" | "admin" | "sponsor"; handle: string; region: string; primaryGame: string; bio: string; wins: number; losses: number };
export type SeedClan = { key: string; name: string; tag: string; region: string; foundedYear: number; bio: string; ownerKey: string; verified: boolean; followerCount: number; prizeEarningsCents: number; trophies: number; socialLinks: Record<string, string>; accent: "lime" | "blue" | "orange" | "violet" };
export type SeedTeam = { key: string; name: string; tag: string; game: string; region: string; description: string; ownerKey: string; clanKey: string | null; memberKeys: string[]; wins: number; losses: number };
export type SeedTournament = { key: string; name: string; game: string; format: TournamentFormat; status: TournamentStatus; startsAt: string; registrationClosesAt: string; checkinOpensAt: string; prizePoolCents: number; entryFeeCents: number; maxTeams: number; rules: string; sponsorName: string | null; sponsorContributionCents: number; streamUrl: string | null; clanEligible: boolean; description: string; region: string; bestOf: 1 | 3 | 5; createdByKey: string; registeredTeamKeys: string[] };
export type SeedSponsor = { key: string; name: string; mark: string; tier: "presenting" | "partner" | "supporting"; tone: "lime" | "steel" | "amber"; websiteUrl: string; campaigns: Array<{ placement: "tournament" | "bracket" | "clan" | "landing"; headline: string; body: string; ctaLabel: string; ctaUrl: string }> };
export type SeedProduct = { sku: string; name: string; description: string; category: ProductCategory; priceCents: number; clanKey: string | null; orgLabel: string; color: string; badge: string | null; inventoryLabel: string };
export type SeedMedia = { key: string; title: string; description: string; kind: MediaKind; game: string; tags: string[]; views: number; likes: number; durationSeconds: number; uploadedByKey: string; clanKey: string | null };
export type SeedAchievement = { clanKey: string; title: string; placement: number; prizeCents: number; achievedAt: string };

const DEMO_DOMAIN = "demo.menoarena.gg";

export const seedUsers: SeedUser[] = [
  { key: "admin", email: `admin@${DEMO_DOMAIN}`, name: "Circuit Admin", role: "admin", handle: "CIRCUIT_ADMIN", region: "SEA", primaryGame: "Valorant", bio: "Runs the Meno Arena circuit desk.", wins: 0, losses: 0 },
  { key: "organizer", email: `organizer@${DEMO_DOMAIN}`, name: "Nightfall Ops", role: "organizer", handle: "NIGHTFALL_OPS", region: "SEA", primaryGame: "Mobile Legends: Bang Bang", bio: "Tournament operations for the Nightfall circuit.", wins: 0, losses: 0 },
  { key: "sponsor", email: `sponsor@${DEMO_DOMAIN}`, name: "ARC / NINE Partnerships", role: "sponsor", handle: "ARC_NINE", region: "NA", primaryGame: "Valorant", bio: "Brand activation desk.", wins: 0, losses: 0 },
  { key: "astra-owner", email: `astra.owner@${DEMO_DOMAIN}`, name: "Rin Kastellan", role: "user", handle: "KASTELLAN", region: "SEA", primaryGame: "Valorant", bio: "Founder of Astra Forge.", wins: 48, losses: 19 },
  { key: "astra-igl", email: `astra.igl@${DEMO_DOMAIN}`, name: "Devan Cross", role: "user", handle: "CROSSFIRE", region: "SEA", primaryGame: "Valorant", bio: "In-game leader, Astra Forge Valorant.", wins: 41, losses: 22 },
  { key: "astra-mlbb", email: `astra.mlbb@${DEMO_DOMAIN}`, name: "Mira Sol", role: "user", handle: "SOLSTICE", region: "SEA", primaryGame: "Mobile Legends: Bang Bang", bio: "Jungle for Astra Forge MLBB.", wins: 56, losses: 24 },
  { key: "orbit-owner", email: `orbit.owner@${DEMO_DOMAIN}`, name: "Kenji Orbita", role: "user", handle: "ORBITA", region: "SEA", primaryGame: "Mobile Legends: Bang Bang", bio: "Orbit Syndicate director.", wins: 62, losses: 30 },
  { key: "orbit-mid", email: `orbit.mid@${DEMO_DOMAIN}`, name: "Lea Vantz", role: "user", handle: "VANTZ", region: "SEA", primaryGame: "Mobile Legends: Bang Bang", bio: "Mid lane, Orbit Syndicate.", wins: 58, losses: 27 },
  { key: "kairo-owner", email: `kairo.owner@${DEMO_DOMAIN}`, name: "Sasha Kairo", role: "user", handle: "KAIRO", region: "NA", primaryGame: "Call of Duty: Mobile", bio: "Kairo Seven org lead.", wins: 39, losses: 25 },
  { key: "kairo-slayer", email: `kairo.slayer@${DEMO_DOMAIN}`, name: "Tobi Ren", role: "user", handle: "RENEGADE", region: "NA", primaryGame: "Call of Duty: Mobile", bio: "Slayer, Kairo Seven CODM.", wins: 35, losses: 21 },
  { key: "nox-owner", email: `nox.owner@${DEMO_DOMAIN}`, name: "Ivo Noxen", role: "user", handle: "NOXEN", region: "EU", primaryGame: "Free Fire", bio: "Nox Division founder.", wins: 44, losses: 31 },
  { key: "nox-rusher", email: `nox.rusher@${DEMO_DOMAIN}`, name: "Ama Diallo", role: "user", handle: "DIALLO", region: "EU", primaryGame: "Free Fire", bio: "Rusher, Nox Division FF.", wins: 40, losses: 29 },
  { key: "haven-captain", email: `haven.captain@${DEMO_DOMAIN}`, name: "Jules Haven", role: "user", handle: "HAVEN", region: "SEA", primaryGame: "Mobile Legends: Bang Bang", bio: "Independent captain, Haven House.", wins: 21, losses: 18 },
  { key: "hush-captain", email: `hush.captain@${DEMO_DOMAIN}`, name: "Pio Marlo", role: "user", handle: "MARLO", region: "NA", primaryGame: "Valorant", bio: "Independent captain, Hush Protocol.", wins: 17, losses: 16 },
  { key: "free-agent", email: `player@${DEMO_DOMAIN}`, name: "Nova Player", role: "user", handle: "NOVA_PLAYER", region: "SEA", primaryGame: "Valorant", bio: "Looking for a roster.", wins: 12, losses: 9 },
];

export const seedClans: SeedClan[] = [
  { key: "astra", name: "Astra Forge", tag: "AST", region: "SEA", foundedYear: 2019, bio: "Multi-title organisation built around disciplined draft phases and a deep academy pipeline.", ownerKey: "astra-owner", verified: true, followerCount: 48210, prizeEarningsCents: 18650000, trophies: 14, socialLinks: { twitter: "https://x.com/astraforge", youtube: "https://youtube.com/@astraforge", discord: "https://discord.gg/astraforge" }, accent: "lime" },
  { key: "orbit", name: "Orbit Syndicate", tag: "ORB", region: "SEA", foundedYear: 2020, bio: "Mobile-first powerhouse. Three rosters, one broadcast identity.", ownerKey: "orbit-owner", verified: true, followerCount: 39480, prizeEarningsCents: 14200000, trophies: 11, socialLinks: { twitter: "https://x.com/orbitsyndicate", tiktok: "https://tiktok.com/@orbitsyndicate", discord: "https://discord.gg/orbit" }, accent: "blue" },
  { key: "kairo", name: "Kairo Seven", tag: "K7", region: "NA", foundedYear: 2021, bio: "Seven founding players, now a cross-platform org with a broadcast-first culture.", ownerKey: "kairo-owner", verified: true, followerCount: 27350, prizeEarningsCents: 9100000, trophies: 7, socialLinks: { twitter: "https://x.com/kairoseven", instagram: "https://instagram.com/kairoseven" }, accent: "violet" },
  { key: "nox", name: "Nox Division", tag: "NOX", region: "EU", foundedYear: 2018, bio: "Battle-royale specialists expanding into tactical shooters.", ownerKey: "nox-owner", verified: false, followerCount: 18900, prizeEarningsCents: 6400000, trophies: 5, socialLinks: { twitter: "https://x.com/noxdivision", youtube: "https://youtube.com/@noxdivision" }, accent: "orange" },
];

export const seedTeams: SeedTeam[] = [
  { key: "astra-val", name: "Astra Forge Valorant", tag: "AST", game: "Valorant", region: "SEA", description: "Main Valorant roster.", ownerKey: "astra-owner", clanKey: "astra", memberKeys: ["astra-owner", "astra-igl"], wins: 31, losses: 9 },
  { key: "astra-mlbb", name: "Astra Forge MLBB", tag: "AST", game: "Mobile Legends: Bang Bang", region: "SEA", description: "Mobile Legends roster.", ownerKey: "astra-owner", clanKey: "astra", memberKeys: ["astra-owner", "astra-mlbb"], wins: 27, losses: 12 },
  { key: "orbit-mlbb", name: "Orbit Syndicate MLBB", tag: "ORB", game: "Mobile Legends: Bang Bang", region: "SEA", description: "Flagship Mobile Legends roster.", ownerKey: "orbit-owner", clanKey: "orbit", memberKeys: ["orbit-owner", "orbit-mid"], wins: 34, losses: 8 },
  { key: "orbit-ff", name: "Orbit Syndicate FF", tag: "ORB", game: "Free Fire", region: "SEA", description: "Free Fire squad.", ownerKey: "orbit-owner", clanKey: "orbit", memberKeys: ["orbit-owner"], wins: 19, losses: 14 },
  { key: "kairo-codm", name: "Kairo Seven CODM", tag: "K7", game: "Call of Duty: Mobile", region: "NA", description: "Call of Duty: Mobile roster.", ownerKey: "kairo-owner", clanKey: "kairo", memberKeys: ["kairo-owner", "kairo-slayer"], wins: 24, losses: 11 },
  { key: "kairo-val", name: "Kairo Seven Valorant", tag: "K7", game: "Valorant", region: "NA", description: "Valorant roster.", ownerKey: "kairo-owner", clanKey: "kairo", memberKeys: ["kairo-owner"], wins: 18, losses: 13 },
  { key: "nox-ff", name: "Nox Division FF", tag: "NOX", game: "Free Fire", region: "EU", description: "Free Fire squad.", ownerKey: "nox-owner", clanKey: "nox", memberKeys: ["nox-owner", "nox-rusher"], wins: 22, losses: 10 },
  { key: "nox-val", name: "Nox Division Valorant", tag: "NOX", game: "Valorant", region: "EU", description: "Valorant roster.", ownerKey: "nox-owner", clanKey: "nox", memberKeys: ["nox-owner"], wins: 12, losses: 15 },
  { key: "haven", name: "Haven House", tag: "HVN", game: "Mobile Legends: Bang Bang", region: "SEA", description: "Independent Mobile Legends team.", ownerKey: "haven-captain", clanKey: null, memberKeys: ["haven-captain"], wins: 14, losses: 12 },
  { key: "hush", name: "Hush Protocol", tag: "HSH", game: "Valorant", region: "NA", description: "Independent Valorant team.", ownerKey: "hush-captain", clanKey: null, memberKeys: ["hush-captain"], wins: 11, losses: 13 },
];

const day = (offset: number, hour = 18) => {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + offset);
  date.setUTCHours(hour, 0, 0, 0);
  return date.toISOString();
};

export const seedTournaments: SeedTournament[] = [
  { key: "nightfall-val", name: "Nightfall Circuit: Valorant Open", game: "Valorant", format: "single_elimination", status: "live", startsAt: day(-1), registrationClosesAt: day(-3), checkinOpensAt: day(-1, 16), prizePoolCents: 500000, entryFeeCents: 2500, maxTeams: 8, rules: "Best-of-3 through the semifinals; best-of-5 grand final. Map veto alternates starting with the higher seed. Pauses limited to two per map.", sponsorName: "ARC / NINE", sponsorContributionCents: 150000, streamUrl: "https://twitch.tv/menoarena_live", clanEligible: false, description: "The flagship open qualifier. Eight rosters, one broadcast night.", region: "Global", bestOf: 3, createdByKey: "organizer", registeredTeamKeys: ["astra-val", "kairo-val", "nox-val", "hush"] },
  { key: "clash-mlbb", name: "Meno Arena Clash #04", game: "Mobile Legends: Bang Bang", format: "double_elimination", status: "checkin", startsAt: day(1), registrationClosesAt: day(0, 12), checkinOpensAt: day(0, 12), prizePoolCents: 250000, entryFeeCents: 1500, maxTeams: 8, rules: "Double elimination. Draft mode ranked rules. Screenshots required for every game result.", sponsorName: "FIELD NOTES", sponsorContributionCents: 50000, streamUrl: "https://twitch.tv/orbitbroadcast", clanEligible: true, description: "Org-only Mobile Legends clash. Only clan-rostered teams may enter.", region: "SEA", bestOf: 3, createdByKey: "organizer", registeredTeamKeys: ["astra-mlbb", "orbit-mlbb"] },
  { key: "freefire-royale", name: "Nox Royale Series", game: "Free Fire", format: "round_robin", status: "registration", startsAt: day(6), registrationClosesAt: day(4), checkinOpensAt: day(6, 15), prizePoolCents: 120000, entryFeeCents: 0, maxTeams: 6, rules: "Round robin, three lobbies per round. Points: placement + eliminations.", sponsorName: null, sponsorContributionCents: 0, streamUrl: null, clanEligible: false, description: "Free-entry Free Fire league night.", region: "EU", bestOf: 1, createdByKey: "organizer", registeredTeamKeys: ["nox-ff", "orbit-ff"] },
  { key: "codm-swiss", name: "CODM Swiss Invitational", game: "Call of Duty: Mobile", format: "swiss", status: "registration", startsAt: day(9), registrationClosesAt: day(7), checkinOpensAt: day(9, 16), prizePoolCents: 300000, entryFeeCents: 2000, maxTeams: 16, rules: "Four Swiss rounds. Search & Destroy / Hardpoint rotation. Ties broken by Buchholz.", sponsorName: "SABLE AUDIO", sponsorContributionCents: 80000, streamUrl: null, clanEligible: false, description: "Swiss format invitational for Call of Duty: Mobile.", region: "NA", bestOf: 3, createdByKey: "organizer", registeredTeamKeys: ["kairo-codm"] },
  { key: "clash-03", name: "Meno Arena Clash #03", game: "Mobile Legends: Bang Bang", format: "single_elimination", status: "completed", startsAt: day(-14), registrationClosesAt: day(-16), checkinOpensAt: day(-14, 16), prizePoolCents: 200000, entryFeeCents: 1500, maxTeams: 8, rules: "Single elimination, best-of-3.", sponsorName: "FIELD NOTES", sponsorContributionCents: 25000, streamUrl: "https://twitch.tv/orbitbroadcast", clanEligible: false, description: "Previous Mobile Legends clash.", region: "SEA", bestOf: 3, createdByKey: "organizer", registeredTeamKeys: ["astra-mlbb", "orbit-mlbb", "haven"] },
  { key: "val-showdown", name: "Astra Showdown: Valorant", game: "Valorant", format: "single_elimination", status: "completed", startsAt: day(-30), registrationClosesAt: day(-32), checkinOpensAt: day(-30, 16), prizePoolCents: 150000, entryFeeCents: 0, maxTeams: 4, rules: "Single elimination, best-of-3.", sponsorName: null, sponsorContributionCents: 0, streamUrl: null, clanEligible: false, description: "Community showdown hosted by Astra Forge.", region: "Global", bestOf: 3, createdByKey: "organizer", registeredTeamKeys: ["astra-val", "kairo-val", "nox-val", "hush"] },
];

export const seedAchievements: SeedAchievement[] = [
  { clanKey: "astra", title: "Astra Showdown: Valorant — Champions", placement: 1, prizeCents: 90000, achievedAt: day(-29) },
  { clanKey: "orbit", title: "Meno Arena Clash #03 — Champions", placement: 1, prizeCents: 135000, achievedAt: day(-13) },
  { clanKey: "astra", title: "Meno Arena Clash #03 — Runners-up", placement: 2, prizeCents: 67500, achievedAt: day(-13) },
  { clanKey: "kairo", title: "Astra Showdown: Valorant — Runners-up", placement: 2, prizeCents: 45000, achievedAt: day(-29) },
  { clanKey: "nox", title: "Astra Showdown: Valorant — Third", placement: 3, prizeCents: 15000, achievedAt: day(-29) },
];

export const seedSponsors: SeedSponsor[] = [
  { key: "arc-nine", name: "ARC / NINE", mark: "A9", tier: "presenting", tone: "lime", websiteUrl: "https://example.com/arc-nine", campaigns: [
    { placement: "tournament", headline: "Fuel the nightfall circuit.", body: "A tournament presentation layer built for broadcasts, brackets, and community drops — not intrusive banner inventory.", ctaLabel: "View campaign brief", ctaUrl: "https://example.com/arc-nine/brief" },
    { placement: "landing", headline: "Presented by ARC / NINE.", body: "Official presenting partner of the Nightfall Circuit.", ctaLabel: "Meet the partner", ctaUrl: "https://example.com/arc-nine" },
  ] },
  { key: "field-notes", name: "FIELD NOTES", mark: "FN", tier: "partner", tone: "steel", websiteUrl: "https://example.com/field-notes", campaigns: [
    { placement: "bracket", headline: "Precision in every round.", body: "A native bracket placement for strategic gear drops during key match windows.", ctaLabel: "Explore placement", ctaUrl: "https://example.com/field-notes" },
  ] },
  { key: "sable-audio", name: "SABLE AUDIO", mark: "SA", tier: "supporting", tone: "amber", websiteUrl: "https://example.com/sable", campaigns: [
    { placement: "clan", headline: "Built for the comms that decide maps.", body: "Clan profile placement with a measurable path to sponsored roster activations.", ctaLabel: "See clan package", ctaUrl: "https://example.com/sable/clans" },
  ] },
];

export const seedProducts: SeedProduct[] = [
  { sku: "AST-JERSEY-26", name: "Astra Forge match jersey", description: "Official 2026 match jersey with sublimated signal-lime panels.", category: "jersey", priceCents: 6800, clanKey: "astra", orgLabel: "ASTRA FORGE", color: "Signal lime / charcoal", badge: "Limited run", inventoryLabel: "Sizes S–XXL" },
  { sku: "ORB-HOODIE-26", name: "Orbit Syndicate heavyweight hoodie", description: "400gsm heavyweight hoodie with embroidered ORB tag.", category: "hoodie", priceCents: 8200, clanKey: "orbit", orgLabel: "ORBIT SYNDICATE", color: "Ink / cobalt stitch", badge: null, inventoryLabel: "Sizes XS–XXL" },
  { sku: "K7-JERSEY-26", name: "Kairo Seven pro jersey", description: "Lightweight pro-cut jersey with K7 chest mark.", category: "jersey", priceCents: 6400, clanKey: "kairo", orgLabel: "KAIRO SEVEN", color: "Violet / black", badge: "New", inventoryLabel: "Sizes S–XL" },
  { sku: "NOX-HOODIE-26", name: "Nox Division zip hoodie", description: "Full-zip hoodie with reflective NOX print.", category: "hoodie", priceCents: 7600, clanKey: "nox", orgLabel: "NOX DIVISION", color: "Ember / black", badge: null, inventoryLabel: "Sizes S–XXL" },
  { sku: "MENO-CAP-01", name: "Meno Arena split-panel cap", description: "Six-panel cap with reflective trim.", category: "accessory", priceCents: 3400, clanKey: null, orgLabel: "MENO ARENA", color: "Charcoal / reflective trim", badge: null, inventoryLabel: "One size" },
  { sku: "MENO-PACK-NF", name: "Nightfall broadcast pack", description: "Stream overlays, panels, and alerts in the Nightfall visual system.", category: "digital", priceCents: 1800, clanKey: null, orgLabel: "MENO ARENA", color: "Digital download", badge: "Instant access", inventoryLabel: "Includes overlays + panels" },
];

export const seedMedia: SeedMedia[] = [
  { key: "ace-clutch", title: "1v4 clutch to close the map", description: "Crossfire holds site alone and converts.", kind: "highlight", game: "Valorant", tags: ["clutch", "valorant", "astra"], views: 128400, likes: 9120, durationSeconds: 42, uploadedByKey: "astra-owner", clanKey: "astra" },
  { key: "fanny-cables", title: "Fanny cable chain across three lanes", description: "Solstice tears through the backline.", kind: "short", game: "Mobile Legends: Bang Bang", tags: ["fanny", "mlbb", "astra"], views: 96300, likes: 7480, durationSeconds: 28, uploadedByKey: "astra-mlbb", clanKey: "astra" },
  { key: "orbit-comeback", title: "Orbit Syndicate lord steal comeback", description: "Down 8k gold, one lord, one throne.", kind: "highlight", game: "Mobile Legends: Bang Bang", tags: ["comeback", "mlbb", "orbit"], views: 210800, likes: 15600, durationSeconds: 61, uploadedByKey: "orbit-owner", clanKey: "orbit" },
  { key: "kairo-snd", title: "K7 ninja defuse in overtime", description: "Renegade with the smoke plant read.", kind: "reel", game: "Call of Duty: Mobile", tags: ["snd", "codm", "kairo"], views: 54200, likes: 4100, durationSeconds: 33, uploadedByKey: "kairo-owner", clanKey: "kairo" },
  { key: "nox-zone", title: "Nox Division final zone rotation", description: "Diallo reads the zone and takes the booyah.", kind: "highlight", game: "Free Fire", tags: ["booyah", "freefire", "nox"], views: 47800, likes: 3620, durationSeconds: 55, uploadedByKey: "nox-owner", clanKey: "nox" },
  { key: "clash-promo", title: "Meno Arena Clash #04 — official promo", description: "Org-only. Double elimination. One night.", kind: "promo", game: "Mobile Legends: Bang Bang", tags: ["promo", "clash"], views: 33100, likes: 2210, durationSeconds: 45, uploadedByKey: "organizer", clanKey: null },
  { key: "reaction-desk", title: "Desk reacts to the grand final reset", description: "Nobody saw the lower bracket run coming.", kind: "reaction", game: "Valorant", tags: ["reaction", "desk"], views: 28900, likes: 1980, durationSeconds: 39, uploadedByKey: "organizer", clanKey: null },
  { key: "meme-pause", title: "The 4th tactical pause", description: "We all know the feeling.", kind: "meme", game: "Valorant", tags: ["meme"], views: 76500, likes: 8800, durationSeconds: 12, uploadedByKey: "free-agent", clanKey: null },
];

export const seedIntegrations = [
  { provider: "discord" as const, scope: "clan" as const, clanKey: "astra", displayName: "Astra Forge HQ", status: "ready" as const },
  { provider: "twitch" as const, scope: "tournament" as const, tournamentKey: "nightfall-val", displayName: "menoarena_live", status: "ready" as const },
  { provider: "discord" as const, scope: "tournament" as const, tournamentKey: "clash-mlbb", displayName: "Clash #04 announcements", status: "pending" as const },
];

export const seedStreamSchedule = [
  { startsAt: day(0, 18), game: "Valorant", match: "Astra Forge vs Kairo Seven", channel: "menoarena_live", status: "live" as const },
  { startsAt: day(0, 20), game: "Mobile Legends: Bang Bang", match: "Orbit Syndicate vs Haven House", channel: "orbitbroadcast", status: "up-next" as const },
  { startsAt: day(1, 18), game: "Free Fire", match: "Nox Division vs Orbit Syndicate", channel: "nightfallgg", status: "scheduled" as const },
];

export const DEMO_PASSWORD = "MenoArena!2026";
