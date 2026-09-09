/**
 * Seed-derived fallback dataset used by public read paths when Supabase is not
 * configured (local dev without keys, vitest). Ids are stable: array index + 1.
 */
import { gameSlugFor } from "@shared/games";
import {
  seedAchievements, seedClans, seedIntegrations, seedMedia, seedProducts, seedSponsors, seedStreamSchedule, seedTeams, seedTournaments, seedUsers,
} from "../seed/data";

const DAY = 86_400_000;
const daysAgo = (days: number) => new Date(Date.now() - days * DAY);

export const seedUserId = (key: string | null | undefined) => (key ? seedUsers.findIndex(user => user.key === key) + 1 : 0);
export const seedClanId = (key: string | null | undefined) => (key ? seedClans.findIndex(clan => clan.key === key) + 1 : 0);
export const seedTeamId = (key: string | null | undefined) => (key ? seedTeams.findIndex(team => team.key === key) + 1 : 0);
export const seedTournamentId = (key: string | null | undefined) => (key ? seedTournaments.findIndex(t => t.key === key) + 1 : 0);

export function fallbackUsers() {
  return seedUsers.map((user, index) => ({
    id: index + 1,
    name: user.name,
    email: user.email,
    role: user.role,
    handle: user.handle,
    avatarUrl: null as string | null,
    bannerUrl: null as string | null,
    region: user.region,
    primaryGame: user.primaryGame,
    bio: user.bio,
    wins: user.wins,
    losses: user.losses,
    socials: {} as Record<string, string>,
    createdAt: daysAgo(400 - index * 10),
  }));
}

export function fallbackUser(id: number) {
  return fallbackUsers().find(user => user.id === id) ?? null;
}

export type FallbackClanSummary = { id: number; name: string; tag: string; verified: boolean; logoUrl: string | null };

export function fallbackClanSummary(key: string | null | undefined): FallbackClanSummary | null {
  const index = seedClans.findIndex(clan => clan.key === key);
  if (index < 0) return null;
  const clan = seedClans[index]!;
  return { id: index + 1, name: clan.name, tag: clan.tag, verified: clan.verified, logoUrl: null };
}

export function fallbackTeams() {
  return seedTeams.map((team, index) => ({
    id: index + 1,
    ownerId: seedUserId(team.ownerKey),
    captainId: seedUserId(team.ownerKey),
    name: team.name,
    tag: team.tag,
    game: team.game,
    gameSlug: gameSlugFor(team.game),
    region: team.region,
    description: team.description,
    logoUrl: null as string | null,
    bannerUrl: null as string | null,
    socials: {} as Record<string, string>,
    lineupLockedAt: null as Date | null,
    wins: team.wins,
    losses: team.losses,
    memberCount: team.memberKeys.length,
    clan: fallbackClanSummary(team.clanKey),
    createdAt: daysAgo(300 - index * 12),
    updatedAt: daysAgo(3),
  }));
}

export function fallbackTeamRoster(teamId: number) {
  const seed = seedTeams[teamId - 1];
  if (!seed) return [];
  const users = fallbackUsers();
  return seed.memberKeys.map((key, index) => {
    const user = users[seedUserId(key) - 1]!;
    return { userId: user.id, name: user.name, handle: user.handle, avatarUrl: null as string | null, role: key === seed.ownerKey ? "captain" : "player", joinedAt: daysAgo(200 - index * 5) };
  });
}

export function fallbackClans() {
  const teams = fallbackTeams();
  return seedClans.map((clan, index) => {
    const id = index + 1;
    const clanTeams = teams.filter(team => team.clan?.id === id);
    const wins = clanTeams.reduce((sum, team) => sum + team.wins, 0);
    const losses = clanTeams.reduce((sum, team) => sum + team.losses, 0);
    return {
      id,
      ownerId: seedUserId(clan.ownerKey),
      name: clan.name,
      tag: clan.tag,
      region: clan.region,
      bio: clan.bio,
      foundedYear: clan.foundedYear,
      socials: null as string | null,
      socialLinks: clan.socialLinks,
      logoUrl: null as string | null,
      bannerUrl: null as string | null,
      verified: clan.verified,
      followerCount: clan.followerCount,
      prizeEarningsCents: clan.prizeEarningsCents,
      trophies: clan.trophies,
      accent: clan.accent,
      teamCount: clanTeams.length,
      games: Array.from(new Set(clanTeams.map(team => team.game))),
      stats: { wins, losses, winRate: wins + losses ? Math.round((wins / (wins + losses)) * 100) : 0, prizeEarningsCents: clan.prizeEarningsCents, trophies: clan.trophies },
      createdAt: daysAgo(500 - index * 30),
      updatedAt: daysAgo(2),
    };
  });
}

export function fallbackAchievements(clanId?: number) {
  return seedAchievements
    .map((achievement, index) => ({ id: index + 1, clanId: seedClanId(achievement.clanKey), tournamentId: null as number | null, teamId: null as number | null, title: achievement.title, placement: achievement.placement, prizeCents: achievement.prizeCents, achievedAt: new Date(achievement.achievedAt) }))
    .filter(achievement => !clanId || achievement.clanId === clanId);
}

export function fallbackTournaments() {
  return seedTournaments.map((tournament, index) => ({
    id: index + 1,
    name: tournament.name,
    game: tournament.game,
    gameSlug: gameSlugFor(tournament.game),
    format: tournament.format,
    status: tournament.status,
    startsAt: new Date(tournament.startsAt),
    registrationClosesAt: new Date(tournament.registrationClosesAt),
    checkinOpensAt: new Date(tournament.checkinOpensAt),
    prizePoolCents: tournament.prizePoolCents,
    entryFeeCents: tournament.entryFeeCents,
    maxTeams: tournament.maxTeams,
    sponsorName: tournament.sponsorName,
    sponsorContributionCents: tournament.sponsorContributionCents,
    streamUrl: tournament.streamUrl,
    region: tournament.region,
    bestOf: tournament.bestOf,
    clanEligible: tournament.clanEligible,
    description: tournament.description,
    createdBy: seedUserId(tournament.createdByKey),
    registeredTeamIds: tournament.registeredTeamKeys.map(seedTeamId),
  }));
}

export function fallbackSponsors() {
  return seedSponsors.map((sponsor, index) => ({
    id: index + 1,
    name: sponsor.name,
    mark: sponsor.mark,
    logoUrl: null as string | null,
    websiteUrl: sponsor.websiteUrl,
    tier: sponsor.tier,
    tone: sponsor.tone,
    clanId: null as number | null,
    active: true,
    campaignCount: sponsor.campaigns.length,
    createdAt: daysAgo(120 - index * 10),
  }));
}

export function fallbackCampaigns() {
  let id = 0;
  return seedSponsors.flatMap((sponsor, sponsorIndex) => sponsor.campaigns.map(campaign => {
    id += 1;
    return {
      id,
      sponsorId: sponsorIndex + 1,
      name: sponsor.name,
      mark: sponsor.mark,
      logoUrl: null as string | null,
      tier: sponsor.tier,
      tone: sponsor.tone,
      headline: campaign.headline,
      body: campaign.body,
      placement: campaign.placement,
      ctaLabel: campaign.ctaLabel,
      ctaUrl: campaign.ctaUrl,
      clanId: null as number | null,
      tournamentId: null as number | null,
      active: true,
    };
  }));
}

export function fallbackProducts() {
  return seedProducts.map((product, index) => {
    const clan = product.clanKey ? seedClans[seedClanId(product.clanKey) - 1] ?? null : null;
    return {
      id: index + 1,
      sku: product.sku,
      name: product.name,
      description: product.description,
      category: product.category,
      priceCents: product.priceCents,
      currency: "USD",
      imageUrl: null as string | null,
      inventoryLabel: product.inventoryLabel,
      badge: product.badge,
      color: product.color,
      orgLabel: product.orgLabel,
      clanId: product.clanKey ? seedClanId(product.clanKey) : null,
      clan: clan ? { name: clan.name, tag: clan.tag } : null,
      active: true,
      createdAt: daysAgo(90 - index * 3),
    };
  });
}

export function fallbackMedia() {
  const users = fallbackUsers();
  return seedMedia.map((media, index) => {
    const uploader = users[seedUserId(media.uploadedByKey) - 1]!;
    const clan = media.clanKey ? seedClans[seedClanId(media.clanKey) - 1]! : null;
    return {
      id: index + 1,
      uploadedBy: uploader.id,
      title: media.title,
      description: media.description,
      assetUrl: null as string | null,
      thumbnailUrl: null as string | null,
      kind: media.kind,
      game: media.game,
      gameSlug: gameSlugFor(media.game),
      tags: media.tags,
      views: media.views,
      likes: media.likes,
      durationSeconds: media.durationSeconds,
      published: true,
      clanId: media.clanKey ? seedClanId(media.clanKey) : null,
      tournamentId: null as number | null,
      uploader: { name: uploader.name, handle: uploader.handle, avatarUrl: null as string | null },
      clan: clan ? { name: clan.name, tag: clan.tag } : null,
      createdAt: daysAgo(30 - index * 3),
    };
  });
}

export function fallbackIntegrations() {
  return seedIntegrations.map((integration, index) => {
    const targetName = integration.scope === "clan"
      ? seedClans.find(clan => clan.key === integration.clanKey)?.name ?? "Clan"
      : seedTournaments.find(t => t.key === integration.tournamentKey)?.name ?? "Tournament";
    return {
      id: index + 1,
      provider: integration.provider,
      scope: integration.scope,
      clanId: integration.scope === "clan" ? seedClanId(integration.clanKey) : null,
      tournamentId: integration.scope === "tournament" ? seedTournamentId(integration.tournamentKey) : null,
      targetName,
      displayName: integration.displayName,
      status: integration.status,
      webhookUrl: null as string | null,
      createdAt: daysAgo(40 - index * 5),
    };
  });
}

export function fallbackStreamSchedule() {
  return seedStreamSchedule.map((slot, index) => ({
    id: index + 1,
    matchId: null as number | null,
    tournamentId: null as number | null,
    tournamentName: null as string | null,
    startsAt: new Date(slot.startsAt),
    game: slot.game,
    gameSlug: gameSlugFor(slot.game),
    match: slot.match,
    homeTeam: slot.match.split(" vs ")[0] ?? slot.match,
    awayTeam: slot.match.split(" vs ")[1] ?? "TBD",
    channel: slot.channel,
    streamUrl: `https://twitch.tv/${slot.channel}`,
    status: slot.status === "live" ? ("live" as const) : ("upcoming" as const),
    slot: slot.status,
  }));
}
