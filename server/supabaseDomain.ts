import { supabaseAdmin } from "./_core/supabaseAdmin";

const toDate = (value: unknown) => value ? new Date(String(value)) : null;
const camel = (row: Record<string, any>) => {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(row)) {
    result[key.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase())] = value;
  }
  for (const key of ["createdAt", "updatedAt", "startsAt", "registrationClosesAt", "scheduledAt", "lastSignedIn", "resolvedAt", "readAt", "joinedAt"]) {
    if (key in result) result[key] = toDate(result[key]);
  }
  return result;
};

function requireClient() {
  if (!supabaseAdmin) throw new Error("Supabase domain client is not configured");
  return supabaseAdmin;
}

export async function supabaseUpdatePlayerProfile(input: { userId: number; handle: string; bio?: string; region?: string; primaryGame?: string }) {
  const row = {
    user_id: input.userId,
    handle: input.handle.trim().toUpperCase(),
    bio: input.bio?.trim() || null,
    region: input.region?.trim().toUpperCase() || null,
    primary_game: input.primaryGame?.trim() || null,
  };
  const { data, error } = await requireClient().from("player_profiles").upsert(row, { onConflict: "user_id" }).select().single();
  if (error) throw new Error(`[Supabase] Profile update failed: ${error.message}`);
  return camel(data);
}

export async function supabaseGetPlayerDashboard(userId: number) {
  const client = requireClient();
  const [profileResult, teamsResult, tournamentsResult, matchesResult, clanResult] = await Promise.all([
    client.from("player_profiles").select("*").eq("user_id", userId).maybeSingle(),
    client.from("team_members").select("team:teams(*)").eq("user_id", userId),
    client.from("tournaments").select("*").order("starts_at", { ascending: false }).limit(6),
    client.from("matches").select("*").order("scheduled_at", { ascending: false }).limit(8),
    client.from("clans").select("*").eq("owner_id", userId).limit(1),
  ]);
  const failed = [profileResult, teamsResult, tournamentsResult, matchesResult, clanResult].find(result => result.error);
  if (failed?.error) throw new Error(`[Supabase] Player dashboard failed: ${failed.error.message}`);
  return {
    profile: profileResult.data ? camel(profileResult.data) : { handle: "NEW_PLAYER", bio: null, region: "SEA", primaryGame: "VALORANT", wins: 0, losses: 0 },
    teams: (teamsResult.data ?? []).map((row: any) => camel(row.team)),
    tournaments: (tournamentsResult.data ?? []).map(camel),
    matches: (matchesResult.data ?? []).map(camel),
    clan: clanResult.data?.[0] ? camel(clanResult.data[0]) : null,
  };
}

export async function supabaseGetTeamsForUser(userId: number) {
  const { data, error } = await requireClient().from("team_members").select("team:teams(*)").eq("user_id", userId);
  if (error) throw new Error(`[Supabase] Team lookup failed: ${error.message}`);
  return (data ?? []).map((row: any) => camel(row.team));
}

export async function supabaseCreateTeam(input: { ownerId: number; name: string; tag: string; game: string; region?: string; description?: string }) {
  const client = requireClient();
  const { data, error } = await client.from("teams").insert({ owner_id: input.ownerId, name: input.name.trim(), tag: input.tag.trim().toUpperCase(), game: input.game.trim(), region: input.region?.trim().toUpperCase() || null, description: input.description?.trim() || null }).select().single();
  if (error) throw new Error(`[Supabase] Team creation failed: ${error.message}`);
  const { error: memberError } = await client.from("team_members").insert({ team_id: data.id, user_id: input.ownerId, role: "captain" });
  if (memberError) throw new Error(`[Supabase] Team membership failed: ${memberError.message}`);
  return camel(data);
}

export async function supabaseGetClansForUser(userId: number) {
  const { data, error } = await requireClient().from("clans").select("*").eq("owner_id", userId).order("created_at", { ascending: false });
  if (error) throw new Error(`[Supabase] Clan lookup failed: ${error.message}`);
  return (data ?? []).map(camel);
}

export async function supabaseCreateClan(input: { ownerId: number; name: string; tag: string; region?: string; bio?: string; foundedYear?: number; socials?: string }) {
  const client = requireClient();
  const { data, error } = await client.from("clans").insert({ owner_id: input.ownerId, name: input.name.trim(), tag: input.tag.trim().toUpperCase(), region: input.region?.trim().toUpperCase() || null, bio: input.bio?.trim() || null, founded_year: input.foundedYear ?? null, socials: input.socials?.trim() || null }).select().single();
  if (error) throw new Error(`[Supabase] Clan creation failed: ${error.message}`);
  const { error: memberError } = await client.from("clan_members").insert({ clan_id: data.id, user_id: input.ownerId, role: "owner" });
  if (memberError) throw new Error(`[Supabase] Clan membership failed: ${memberError.message}`);
  return camel(data);
}

export async function supabaseGetClanDashboard(clanId: number, userId: number) {
  const client = requireClient();
  const { data: clan, error } = await client.from("clans").select("*").eq("id", clanId).eq("owner_id", userId).maybeSingle();
  if (error) throw new Error(`[Supabase] Clan dashboard failed: ${error.message}`);
  if (!clan) return { clan: null, teams: [] };
  const { data: links, error: linkError } = await client.from("clan_teams").select("team:teams(*)").eq("clan_id", clanId);
  if (linkError) throw new Error(`[Supabase] Clan teams failed: ${linkError.message}`);
  return { clan: camel(clan), teams: (links ?? []).map((row: any) => camel(row.team)) };
}

export async function supabaseCreateTournament(input: any) {
  const { data, error } = await requireClient().from("tournaments").insert({ created_by: input.createdBy, name: input.name.trim(), game: input.game.trim(), format: input.format, status: "registration", starts_at: input.startsAt.toISOString(), registration_closes_at: input.registrationClosesAt?.toISOString() ?? null, prize_pool_cents: input.prizePoolCents ?? 0, entry_fee_cents: input.entryFeeCents ?? 0, max_teams: input.maxTeams ?? 16, rules: input.rules?.trim() || null, sponsor_name: input.sponsorName?.trim() || null, stream_url: input.streamUrl?.trim() || null, clan_eligible: Boolean(input.clanEligible) }).select().single();
  if (error) throw new Error(`[Supabase] Tournament creation failed: ${error.message}`);
  return camel(data);
}

export async function supabaseGetTournament(tournamentId: number) {
  const { data, error } = await requireClient().from("tournaments").select("*").eq("id", tournamentId).maybeSingle();
  if (error) throw new Error(`[Supabase] Tournament lookup failed: ${error.message}`);
  return data ? camel(data) : null;
}

export async function supabaseGetTournamentMatches(tournamentId: number) {
  const { data, error } = await requireClient().from("matches").select("*").eq("tournament_id", tournamentId).order("round", { ascending: true }).order("position", { ascending: true });
  if (error) throw new Error(`[Supabase] Match lookup failed: ${error.message}`);
  return (data ?? []).map(camel) as Array<{
    id: number;
    tournamentId: number;
    round: number;
    position: number;
    homeTeamId: number | null;
    awayTeamId: number | null;
    homeScore: number;
    awayScore: number;
    status: "upcoming" | "live" | "waiting" | "disputed" | "completed";
    scheduledAt: Date | null;
    winnerTeamId: number | null;
    createdAt: Date;
    updatedAt: Date;
  }>;
}

export async function supabaseSubmitMatchReport(input: any) {
  const client = requireClient();
  const { data, error } = await client.from("match_reports").insert({ match_id: input.matchId, submitted_by: input.submittedBy, team_id: input.teamId, score_for: input.scoreFor, score_against: input.scoreAgainst, screenshot_url: input.screenshotUrl?.trim() || null, notes: input.notes?.trim() || null, status: "waiting_confirmation" }).select().single();
  if (error) throw new Error(`[Supabase] Match report failed: ${error.message}`);
  const { error: matchError } = await client.from("matches").update({ status: "waiting" }).eq("id", input.matchId);
  if (matchError) throw new Error(`[Supabase] Match status update failed: ${matchError.message}`);
  return camel(data);
}

export async function supabaseOpenDispute(input: any) {
  const client = requireClient();
  const { data, error } = await client.from("disputes").insert({ match_id: input.matchId, opened_by: input.openedBy, reason: input.reason.trim(), status: "open" }).select().single();
  if (error) throw new Error(`[Supabase] Dispute creation failed: ${error.message}`);
  const { error: matchError } = await client.from("matches").update({ status: "disputed" }).eq("id", input.matchId);
  if (matchError) throw new Error(`[Supabase] Dispute match update failed: ${matchError.message}`);
  return camel(data);
}

export async function supabaseGetOpenDisputes() {
  const { data, error } = await requireClient().from("disputes").select("*").eq("status", "open").order("created_at", { ascending: false });
  if (error) throw new Error(`[Supabase] Dispute lookup failed: ${error.message}`);
  return (data ?? []).map(camel);
}

export async function supabaseResolveDispute(input: any) {
  const client = requireClient();
  const { data: dispute, error: lookupError } = await client.from("disputes").select("match_id").eq("id", input.disputeId).maybeSingle();
  if (lookupError) throw new Error(`[Supabase] Dispute lookup failed: ${lookupError.message}`);
  if (!dispute) return null;
  const { data, error } = await client.from("disputes").update({ status: "resolved", winner_team_id: input.winnerTeamId, admin_decision: input.adminDecision.trim(), resolved_by: input.resolvedBy, resolved_at: new Date().toISOString() }).eq("id", input.disputeId).select().single();
  if (error) throw new Error(`[Supabase] Dispute resolution failed: ${error.message}`);
  const { error: matchError } = await client.from("matches").update({ status: "completed", winner_team_id: input.winnerTeamId }).eq("id", dispute.match_id);
  if (matchError) throw new Error(`[Supabase] Resolved match update failed: ${matchError.message}`);
  return camel(data);
}
