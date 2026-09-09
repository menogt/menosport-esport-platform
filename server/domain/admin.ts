import type { MatchStatus, RegistrationStatus, UserRole } from "@shared/arena";
import { gameSlugFor } from "@shared/games";
import { badRequest, camel, camelRows, clean, db, fail, notFound } from "./_shared";
import { clansById, gameMatches, safeFilter, teamsById, tournamentsById, uniqueIds, userLabel, usersById, type Viewer } from "./lookups";
import { notify } from "./notifications";

const NOTIFY_BATCH = 500;

async function count(table: string, filter?: (query: any) => any) {
  let query = db().from(table).select("id", { count: "exact", head: true });
  if (filter) query = filter(query);
  const { count: total, error } = await query;
  if (error) fail(error, `${table} count failed`);
  return total ?? 0;
}

// ---------------------------------------------------------------------------
// Overview
// ---------------------------------------------------------------------------

export async function adminOverview() {
  db(); // assert configuration before fanning out, so no rejected promise is left unhandled
  const [users, teams, clans, tournaments, liveTournaments, registrations, openDisputes, payments, media, registrationsLatest, paymentsLatest, disputesLatest] = await Promise.all([
    count("users"), count("teams"), count("clans"), count("tournaments"), count("tournaments", q => q.eq("status", "live")), count("tournament_registrations"),
    count("disputes", q => q.neq("status", "resolved")), count("payments", q => q.eq("status", "succeeded")), count("media_assets"),
    db().from("tournament_registrations").select("*").order("created_at", { ascending: false }).limit(10),
    db().from("payments").select("*").order("created_at", { ascending: false }).limit(10),
    db().from("disputes").select("*").order("created_at", { ascending: false }).limit(10),
  ]);
  if (registrationsLatest.error) fail(registrationsLatest.error, "Registration lookup failed");
  if (paymentsLatest.error) fail(paymentsLatest.error, "Payment lookup failed");
  if (disputesLatest.error) fail(disputesLatest.error, "Dispute lookup failed");
  const [latestRegistrations, latestPayments, latestDisputes] = await Promise.all([
    decorateRegistrations(registrationsLatest.data ?? []), decoratePayments(paymentsLatest.data ?? []), decorateDisputes(disputesLatest.data ?? []),
  ]);
  return {
    counts: { users, teams, clans, tournaments, liveTournaments, registrations, openDisputes, payments, media },
    latestRegistrations, latestPayments, latestDisputes,
  };
}

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

export async function listUsers(input: { search?: string; role?: UserRole; limit?: number; cursor?: number }) {
  const limit = input.limit ?? 50;
  let query = db().from("users").select("*").order("id", { ascending: false }).limit(limit);
  if (input.role) query = query.eq("role", input.role);
  if (input.cursor) query = query.lt("id", input.cursor);
  if (input.search) {
    const term = safeFilter(input.search);
    if (term) query = query.or(`name.ilike.%${term}%,email.ilike.%${term}%`);
  }
  const { data, error } = await query;
  if (error) fail(error, "User lookup failed");
  const rows = camelRows(data);
  const profiles = await usersById(rows.map(row => row.id));
  const items = rows.map(row => {
    const profile = profiles.get(row.id);
    return { id: row.id, name: row.name ?? null, email: row.email ?? null, role: row.role, avatarUrl: profile?.avatarUrl ?? row.avatarUrl ?? null, handle: profile?.handle ?? null, region: profile?.region ?? null, primaryGame: profile?.primaryGame ?? null, createdAt: row.createdAt, lastSignedIn: row.lastSignedIn };
  });
  return { items, nextCursor: items.length === limit ? items[items.length - 1]!.id : null };
}

export async function setUserRole(viewer: Viewer, input: { userId: number; role: UserRole }) {
  if (input.userId === viewer.id && input.role !== "admin") badRequest("You cannot remove your own admin role.");
  const { data, error } = await db().from("users").update({ role: input.role }).eq("id", input.userId).select("id, name, email, role").maybeSingle();
  if (error) fail(error, "Role update failed");
  if (!data) notFound("User");
  await notify({ userId: input.userId, kind: "system", title: "Your account role changed", body: `An admin set your Meno Arena role to ${input.role}.`, href: "/dashboard" });
  return camel(data);
}

export async function removeUser(viewer: Viewer, userId: number) {
  if (userId === viewer.id) badRequest("You cannot delete your own account from the admin console.");
  const [teams, clans] = await Promise.all([count("teams", q => q.eq("owner_id", userId)), count("clans", q => q.eq("owner_id", userId))]);
  if (teams || clans) badRequest(`This user still owns ${teams} team(s) and ${clans} clan(s). Transfer or delete those first.`);
  const { data, error } = await db().from("users").delete().eq("id", userId).select("id");
  if (error) fail(error, "User removal failed");
  if (!data?.length) notFound("User");
  return { success: true as const };
}

// ---------------------------------------------------------------------------
// Teams & clans
// ---------------------------------------------------------------------------

export async function listTeamsAdmin(input: { search?: string; game?: string }) {
  let query = db().from("teams").select("*").order("created_at", { ascending: false }).limit(300);
  if (input.search) {
    const term = safeFilter(input.search);
    if (term) query = query.or(`name.ilike.%${term}%,tag.ilike.%${term}%`);
  }
  const { data, error } = await query;
  if (error) fail(error, "Team lookup failed");
  const teams = camelRows(data).filter(team => gameMatches(team.game, input.game, gameSlugFor));
  const owners = await usersById(teams.map(team => team.ownerId));
  return teams.map(team => ({ ...team, gameSlug: gameSlugFor(team.game), owner: { id: team.ownerId, name: userLabel(owners.get(team.ownerId)), email: owners.get(team.ownerId)?.email ?? null } }));
}

export async function removeTeamAdmin(teamId: number) {
  const { data, error } = await db().from("teams").delete().eq("id", teamId).select("id");
  if (error) fail(error, "Team removal failed");
  if (!data?.length) notFound("Team");
  return { success: true as const };
}

export async function listClansAdmin(input: { search?: string; verified?: boolean }) {
  let query = db().from("clans").select("*").order("created_at", { ascending: false }).limit(300);
  if (input.verified !== undefined) query = query.eq("verified", input.verified);
  if (input.search) {
    const term = safeFilter(input.search);
    if (term) query = query.or(`name.ilike.%${term}%,tag.ilike.%${term}%`);
  }
  const { data, error } = await query;
  if (error) fail(error, "Clan lookup failed");
  const clans = camelRows(data);
  const owners = await usersById(clans.map(clan => clan.ownerId));
  return clans.map(clan => ({ ...clan, owner: { id: clan.ownerId, name: userLabel(owners.get(clan.ownerId)), email: owners.get(clan.ownerId)?.email ?? null } }));
}

export async function setClanVerified(input: { clanId: number; verified: boolean }) {
  const { data, error } = await db().from("clans").update({ verified: input.verified }).eq("id", input.clanId).select().maybeSingle();
  if (error) fail(error, "Clan update failed");
  if (!data) notFound("Clan");
  await notify({ userId: Number(data.owner_id), kind: "system", title: input.verified ? `${data.name} is now verified` : `${data.name} verification removed`, body: input.verified ? "Your clan carries the verified badge across the platform." : "An admin removed the verified badge from your clan.", href: `/clans/${data.id}` });
  return camel(data);
}

export async function removeClanAdmin(clanId: number) {
  const { data, error } = await db().from("clans").delete().eq("id", clanId).select("id");
  if (error) fail(error, "Clan removal failed");
  if (!data?.length) notFound("Clan");
  return { success: true as const };
}

// ---------------------------------------------------------------------------
// Tournaments, matches, registrations
// ---------------------------------------------------------------------------

export async function listTournamentsAdmin(input: { status?: string }) {
  let query = db().from("tournaments").select("*").order("starts_at", { ascending: false }).limit(300);
  if (input.status) query = query.eq("status", input.status);
  const { data, error } = await query;
  if (error) fail(error, "Tournament lookup failed");
  const tournaments = camelRows(data);
  const ids = tournaments.map(t => t.id);
  const registrations = ids.length ? await db().from("tournament_registrations").select("tournament_id").in("tournament_id", ids).neq("status", "withdrawn") : { data: [], error: null };
  if (registrations.error) fail(registrations.error, "Registration count failed");
  const counts = new Map<number, number>();
  for (const row of registrations.data ?? []) counts.set(Number(row.tournament_id), (counts.get(Number(row.tournament_id)) ?? 0) + 1);
  const creators = await usersById(tournaments.map(t => t.createdBy));
  return tournaments.map(t => ({ ...t, gameSlug: gameSlugFor(t.game), registeredCount: counts.get(t.id) ?? 0, creator: { id: t.createdBy, name: userLabel(creators.get(t.createdBy), "Organizer") } }));
}

export async function removeTournamentAdmin(tournamentId: number) {
  const { data, error } = await db().from("tournaments").delete().eq("id", tournamentId).select("id");
  if (error) fail(error, "Tournament removal failed");
  if (!data?.length) notFound("Tournament");
  return { success: true as const };
}

async function decorateMatches(rows: Record<string, any>[]) {
  const matches = camelRows(rows);
  const [teams, tournaments] = await Promise.all([teamsById(matches.flatMap(match => [match.homeTeamId, match.awayTeamId, match.winnerTeamId])), tournamentsById(matches.map(match => match.tournamentId))]);
  const mini = (id: number | null) => { const team = id ? teams.get(id) : null; return team ? { id: team.id, name: team.name, tag: team.tag, logoUrl: team.logoUrl ?? null } : null; };
  return matches.map(match => ({
    ...match,
    id: Number(match.id), tournamentId: Number(match.tournamentId), round: Number(match.round), position: Number(match.position), bracket: (match.bracket ?? "winners") as string, status: match.status as MatchStatus,
    homeScore: Number(match.homeScore ?? 0), awayScore: Number(match.awayScore ?? 0), bestOf: Number(match.bestOf ?? 1), scheduledAt: (match.scheduledAt ?? null) as Date | null, completedAt: (match.completedAt ?? null) as Date | null, streamUrl: (match.streamUrl ?? null) as string | null,
    homeTeam: mini(match.homeTeamId), awayTeam: mini(match.awayTeamId), winnerTeam: mini(match.winnerTeamId),
    tournament: (t => t ? { id: t.id, name: t.name, game: t.game, gameSlug: gameSlugFor(t.game), status: t.status } : null)(tournaments.get(match.tournamentId)),
  }));
}

export async function listMatchesAdmin(input: { tournamentId?: number; status?: MatchStatus }) {
  let query = db().from("matches").select("*").order("scheduled_at", { ascending: false, nullsFirst: false }).order("round", { ascending: true }).limit(400);
  if (input.tournamentId) query = query.eq("tournament_id", input.tournamentId);
  if (input.status) query = query.eq("status", input.status);
  const { data, error } = await query;
  if (error) fail(error, "Match lookup failed");
  return decorateMatches(data ?? []);
}

export async function setMatchStatus(input: { matchId: number; status: MatchStatus }) {
  const patch: Record<string, unknown> = { status: input.status };
  if (input.status === "completed") patch.completed_at = new Date().toISOString();
  const { data, error } = await db().from("matches").update(patch).eq("id", input.matchId).select().maybeSingle();
  if (error) fail(error, "Match update failed");
  if (!data) notFound("Match");
  const [match] = await decorateMatches([data]);
  return match!;
}

export async function scheduleMatch(input: { matchId: number; scheduledAt?: Date | null; streamUrl?: string | null }) {
  const patch: Record<string, unknown> = {};
  if (input.scheduledAt !== undefined) patch.scheduled_at = input.scheduledAt ? input.scheduledAt.toISOString() : null;
  if (input.streamUrl !== undefined) patch.stream_url = clean(input.streamUrl);
  if (!Object.keys(patch).length) badRequest("Nothing to update.");
  const { data, error } = await db().from("matches").update(patch).eq("id", input.matchId).select().maybeSingle();
  if (error) fail(error, "Match schedule failed");
  if (!data) notFound("Match");
  const [match] = await decorateMatches([data]);
  const recipients = uniqueIds([match!.homeTeam?.id, match!.awayTeam?.id]);
  if (recipients.length) {
    const teams = await teamsById(recipients);
    await notify(Array.from(teams.values()).map(team => ({ userId: team.ownerId, kind: "match_start" as const, title: `Match schedule updated`, body: `${match!.homeTeam?.name ?? "TBD"} vs ${match!.awayTeam?.name ?? "TBD"}${match!.scheduledAt ? ` · ${new Date(match!.scheduledAt).toUTCString()}` : ""}`, href: `/matches/${input.matchId}` })));
  }
  return match!;
}

async function decorateRegistrations(rows: Record<string, any>[]) {
  const registrations = camelRows(rows);
  const [teams, tournaments, users] = await Promise.all([teamsById(registrations.map(r => r.teamId)), tournamentsById(registrations.map(r => r.tournamentId)), usersById(registrations.map(r => r.registeredBy))]);
  return registrations.map(reg => ({
    ...reg,
    id: Number(reg.id), tournamentId: Number(reg.tournamentId), teamId: Number(reg.teamId), registeredBy: Number(reg.registeredBy), status: reg.status as RegistrationStatus,
    checkedInAt: (reg.checkedInAt ?? null) as Date | null, seed: (reg.seed ?? null) as number | null, createdAt: reg.createdAt as Date,
    team: (t => t ? { id: t.id, name: t.name, tag: t.tag, logoUrl: t.logoUrl ?? null } : null)(teams.get(reg.teamId)),
    tournament: (t => t ? { id: t.id, name: t.name, game: t.game, gameSlug: gameSlugFor(t.game), status: t.status, startsAt: t.startsAt } : null)(tournaments.get(reg.tournamentId)),
    registeredByUser: (u => ({ id: reg.registeredBy, name: userLabel(u), email: u?.email ?? null }))(users.get(reg.registeredBy)),
  }));
}

export async function listRegistrationsAdmin(input: { tournamentId?: number }) {
  let query = db().from("tournament_registrations").select("*").order("created_at", { ascending: false }).limit(400);
  if (input.tournamentId) query = query.eq("tournament_id", input.tournamentId);
  const { data, error } = await query;
  if (error) fail(error, "Registration lookup failed");
  return decorateRegistrations(data ?? []);
}

export async function setRegistrationStatus(input: { registrationId: number; status: RegistrationStatus }) {
  const patch: Record<string, unknown> = { status: input.status };
  if (input.status === "checked_in") patch.checked_in_at = new Date().toISOString();
  const { data, error } = await db().from("tournament_registrations").update(patch).eq("id", input.registrationId).select().maybeSingle();
  if (error) fail(error, "Registration update failed");
  if (!data) notFound("Registration");
  const [registration] = await decorateRegistrations([data]);
  await notify({ userId: registration!.registeredBy, kind: "tournament", title: `Registration ${input.status.replace("_", " ")}`, body: `${registration!.team?.name ?? "Your team"} is now ${input.status.replace("_", " ")} for ${registration!.tournament?.name ?? "the tournament"}.`, href: `/tournaments/${registration!.tournamentId}` });
  return registration!;
}

// ---------------------------------------------------------------------------
// Payments
// ---------------------------------------------------------------------------

async function decoratePayments(rows: Record<string, any>[]) {
  const payments = camelRows(rows);
  const [users, tournaments, teams] = await Promise.all([usersById(payments.map(p => p.userId)), tournamentsById(payments.map(p => p.tournamentId)), teamsById(payments.map(p => p.teamId))]);
  return payments.map(payment => ({
    ...payment,
    user: (u => ({ id: payment.userId, name: userLabel(u), email: u?.email ?? null }))(users.get(payment.userId)),
    tournament: (t => t ? { id: t.id, name: t.name } : null)(payment.tournamentId ? tournaments.get(payment.tournamentId) : null),
    team: (t => t ? { id: t.id, name: t.name, tag: t.tag } : null)(payment.teamId ? teams.get(payment.teamId) : null),
    orderRef: payment.orderId ? `ORD-${payment.orderId}` : null,
  }));
}

export async function listPaymentsAdmin(input: { status?: string; kind?: string }) {
  let query = db().from("payments").select("*").order("created_at", { ascending: false }).limit(400);
  if (input.status) query = query.eq("status", input.status);
  if (input.kind) query = query.eq("kind", input.kind);
  const { data, error } = await query;
  if (error) fail(error, "Payment lookup failed");
  return decoratePayments(data ?? []);
}

/** Sandbox refund: flips the payment (and any order) to refunded without contacting a provider. */
export async function refundPayment(paymentId: number) {
  const { data: existing, error: lookupError } = await db().from("payments").select("*").eq("id", paymentId).maybeSingle();
  if (lookupError) fail(lookupError, "Payment lookup failed");
  if (!existing) notFound("Payment");
  if (existing.status !== "succeeded") badRequest(`Only succeeded payments can be refunded (current status: ${existing.status}).`);
  const { data, error } = await db().from("payments").update({ status: "refunded" }).eq("id", paymentId).select().single();
  if (error) fail(error, "Refund failed");
  if (existing.order_id) {
    const order = await db().from("orders").update({ status: "refunded" }).eq("id", existing.order_id);
    if (order.error) fail(order.error, "Order refund failed");
  }
  await notify({ userId: Number(existing.user_id), kind: "payout", title: "Payment refunded", body: `Your ${existing.kind === "order" ? "store order" : "entry fee"} payment of ${(Number(existing.amount_cents) / 100).toFixed(2)} ${existing.currency} was refunded (sandbox).`, href: "/dashboard" });
  const [payment] = await decoratePayments([data]);
  return payment!;
}

// ---------------------------------------------------------------------------
// Sponsors, campaigns, products, orders
// ---------------------------------------------------------------------------

export async function listSponsorsAdmin() {
  const [sponsors, campaigns] = await Promise.all([db().from("sponsors").select("*").order("name"), db().from("sponsor_campaigns").select("*").order("created_at", { ascending: false })]);
  if (sponsors.error) fail(sponsors.error, "Sponsor lookup failed");
  if (campaigns.error) fail(campaigns.error, "Campaign lookup failed");
  const campaignRows = camelRows(campaigns.data);
  const clans = await clansById(camelRows(sponsors.data).map(s => s.clanId));
  return camelRows(sponsors.data).map(sponsor => ({ ...sponsor, clan: (c => c ? { id: c.id, name: c.name, tag: c.tag } : null)(sponsor.clanId ? clans.get(sponsor.clanId) : null), campaigns: campaignRows.filter(c => c.sponsorId === sponsor.id) }));
}

export async function upsertSponsor(input: { id?: number; name: string; mark: string; logoUrl?: string; websiteUrl?: string; tier: string; tone: string; clanId?: number | null; active?: boolean }) {
  const row = { name: input.name.trim(), mark: input.mark.trim().toUpperCase().slice(0, 4), logo_url: clean(input.logoUrl), website_url: clean(input.websiteUrl), tier: input.tier, tone: input.tone, clan_id: input.clanId ?? null, active: input.active ?? true };
  const result = input.id ? await db().from("sponsors").update(row).eq("id", input.id).select().maybeSingle() : await db().from("sponsors").insert(row).select().single();
  if (result.error) fail(result.error, "Sponsor save failed");
  if (!result.data) notFound("Sponsor");
  return camel(result.data);
}

export async function removeSponsor(sponsorId: number) {
  const { data, error } = await db().from("sponsors").delete().eq("id", sponsorId).select("id");
  if (error) fail(error, "Sponsor removal failed");
  if (!data?.length) notFound("Sponsor");
  return { success: true as const };
}

export async function upsertCampaign(input: { id?: number; sponsorId: number; tournamentId?: number | null; clanId?: number | null; placement: string; headline: string; body?: string; ctaLabel?: string; ctaUrl?: string; startsAt?: Date | null; endsAt?: Date | null; active?: boolean }) {
  const row = {
    sponsor_id: input.sponsorId, tournament_id: input.tournamentId ?? null, clan_id: input.clanId ?? null, placement: input.placement, headline: input.headline.trim(), body: clean(input.body),
    cta_label: clean(input.ctaLabel), cta_url: clean(input.ctaUrl), starts_at: input.startsAt ? input.startsAt.toISOString() : null, ends_at: input.endsAt ? input.endsAt.toISOString() : null, active: input.active ?? true,
  };
  const result = input.id ? await db().from("sponsor_campaigns").update(row).eq("id", input.id).select().maybeSingle() : await db().from("sponsor_campaigns").insert(row).select().single();
  if (result.error) fail(result.error, "Campaign save failed");
  if (!result.data) notFound("Campaign");
  return camel(result.data);
}

export async function removeCampaign(campaignId: number) {
  const { data, error } = await db().from("sponsor_campaigns").delete().eq("id", campaignId).select("id");
  if (error) fail(error, "Campaign removal failed");
  if (!data?.length) notFound("Campaign");
  return { success: true as const };
}

export async function listProductsAdmin() {
  const { data, error } = await db().from("products").select("*").order("created_at", { ascending: false });
  if (error) fail(error, "Product lookup failed");
  const products = camelRows(data);
  const clans = await clansById(products.map(p => p.clanId));
  return products.map(product => ({ ...product, clan: (c => c ? { id: c.id, name: c.name, tag: c.tag } : null)(product.clanId ? clans.get(product.clanId) : null) }));
}

export async function upsertProduct(input: { id?: number; sku: string; name: string; description?: string; category: string; priceCents: number; currency?: string; imageUrl?: string; inventoryLabel?: string; badge?: string; color?: string; orgLabel?: string; clanId?: number | null; active?: boolean }) {
  const row = {
    sku: input.sku.trim().toUpperCase(), name: input.name.trim(), description: clean(input.description), category: input.category, price_cents: input.priceCents, currency: (input.currency ?? "USD").toUpperCase().slice(0, 3),
    image_url: clean(input.imageUrl), inventory_label: clean(input.inventoryLabel), badge: clean(input.badge), color: clean(input.color), org_label: clean(input.orgLabel), clan_id: input.clanId ?? null, active: input.active ?? true,
  };
  const result = input.id ? await db().from("products").update(row).eq("id", input.id).select().maybeSingle() : await db().from("products").insert(row).select().single();
  if (result.error) fail(result.error, "Product save failed");
  if (!result.data) notFound("Product");
  return camel(result.data);
}

export async function removeProduct(productId: number) {
  const { data, error } = await db().from("products").delete().eq("id", productId).select("id");
  if (error) fail(error, "Product removal failed. Products with orders can be deactivated instead");
  if (!data?.length) notFound("Product");
  return { success: true as const };
}

export async function listOrdersAdmin() {
  db();
  const { data, error } = await db().from("orders").select("*").order("created_at", { ascending: false }).limit(300);
  if (error) fail(error, "Order lookup failed");
  const orders = camelRows(data);
  const orderIds = orders.map(order => order.id);
  const [users, items] = await Promise.all([usersById(orders.map(order => order.userId)), orderIds.length ? db().from("order_items").select("*").in("order_id", orderIds) : Promise.resolve({ data: [], error: null })]);
  if (items.error) fail(items.error, "Order items lookup failed");
  const itemRows = camelRows(items.data);
  const products = await db().from("products").select("id, sku, name").in("id", uniqueIds(itemRows.map(item => item.productId)).concat(0));
  const productById = new Map(camelRows(products.data).map(product => [product.id, product]));
  return orders.map(order => ({
    ...order,
    user: (u => ({ id: order.userId, name: userLabel(u), email: u?.email ?? null }))(users.get(order.userId)),
    items: itemRows.filter(item => item.orderId === order.id).map(item => ({ ...item, product: productById.get(item.productId) ?? null })),
  }));
}

// ---------------------------------------------------------------------------
// Media & announcements & disputes
// ---------------------------------------------------------------------------

export async function listMediaAdmin(input: { published?: boolean }) {
  let query = db().from("media_assets").select("*").order("created_at", { ascending: false }).limit(300);
  if (input.published !== undefined) query = query.eq("published", input.published);
  const { data, error } = await query;
  if (error) fail(error, "Media lookup failed");
  const assets = camelRows(data);
  const users = await usersById(assets.map(asset => asset.uploadedBy));
  return assets.map(asset => ({ ...asset, uploader: (u => ({ id: asset.uploadedBy, name: userLabel(u), handle: u?.handle ?? null }))(users.get(asset.uploadedBy)) }));
}

export async function setMediaPublished(input: { mediaId: number; published: boolean }) {
  const { data, error } = await db().from("media_assets").update({ published: input.published }).eq("id", input.mediaId).select().maybeSingle();
  if (error) fail(error, "Media update failed");
  if (!data) notFound("Media");
  return camel(data);
}

export async function removeMediaAdmin(mediaId: number) {
  const { data, error } = await db().from("media_assets").delete().eq("id", mediaId).select("id");
  if (error) fail(error, "Media removal failed");
  if (!data?.length) notFound("Media");
  return { success: true as const };
}

export async function listAnnouncements() {
  const { data, error } = await db().from("announcements").select("*").order("pinned", { ascending: false }).order("created_at", { ascending: false }).limit(200);
  if (error) fail(error, "Announcement lookup failed");
  const announcements = camelRows(data);
  const [authors, tournaments] = await Promise.all([usersById(announcements.map(a => a.authorId)), tournamentsById(announcements.map(a => a.tournamentId))]);
  return announcements.map(announcement => ({
    ...announcement,
    author: (u => ({ id: announcement.authorId, name: userLabel(u, "Admin") }))(authors.get(announcement.authorId)),
    tournament: (t => t ? { id: t.id, name: t.name } : null)(announcement.tournamentId ? tournaments.get(announcement.tournamentId) : null),
  }));
}

export async function createAnnouncement(viewer: Viewer, input: { title: string; body: string; pinned?: boolean; tournamentId?: number | null }) {
  const { data, error } = await db().from("announcements").insert({ title: input.title.trim(), body: input.body.trim(), pinned: input.pinned ?? false, tournament_id: input.tournamentId ?? null, author_id: viewer.id }).select().single();
  if (error) fail(error, "Announcement failed");

  const href = input.tournamentId ? `/tournaments/${input.tournamentId}` : "/";
  const body = input.body.trim().slice(0, 240);
  let recipients: number[] = [];
  if (input.tournamentId) {
    // Tournament-scoped: every member and owner of a registered team.
    const registrations = await db().from("tournament_registrations").select("team_id").eq("tournament_id", input.tournamentId).neq("status", "withdrawn");
    if (registrations.error) fail(registrations.error, "Registration lookup failed");
    const teamIds = uniqueIds((registrations.data ?? []).map((row: any) => Number(row.team_id)));
    if (teamIds.length) {
      const [members, teams] = await Promise.all([db().from("team_members").select("user_id").in("team_id", teamIds), teamsById(teamIds)]);
      if (members.error) fail(members.error, "Team member lookup failed");
      recipients = uniqueIds([...(members.data ?? []).map((row: any) => Number(row.user_id)), ...Array.from(teams.values()).map(team => team.ownerId)]);
    }
  } else {
    // Platform-wide: page through every user id.
    const pageSize = 1000;
    for (let from = 0; ; from += pageSize) {
      const page = await db().from("users").select("id").order("id", { ascending: true }).range(from, from + pageSize - 1);
      if (page.error) fail(page.error, "User lookup failed");
      recipients.push(...(page.data ?? []).map((row: any) => Number(row.id)));
      if ((page.data ?? []).length < pageSize) break;
    }
  }
  const kind = input.tournamentId ? ("tournament" as const) : ("system" as const);
  for (let index = 0; index < recipients.length; index += NOTIFY_BATCH) {
    await notify(recipients.slice(index, index + NOTIFY_BATCH).map(userId => ({ userId, kind, title: input.title.trim(), body, href })));
  }
  return { ...camel(data), notified: recipients.length };
}

export async function removeAnnouncement(announcementId: number) {
  const { data, error } = await db().from("announcements").delete().eq("id", announcementId).select("id");
  if (error) fail(error, "Announcement removal failed");
  if (!data?.length) notFound("Announcement");
  return { success: true as const };
}

async function decorateDisputes(rows: Record<string, any>[]) {
  const disputes = camelRows(rows);
  const matchIds = uniqueIds(disputes.map(d => d.matchId));
  const matches = matchIds.length ? await db().from("matches").select("*").in("id", matchIds) : { data: [], error: null };
  if (matches.error) fail(matches.error, "Match lookup failed");
  const matchRows = await decorateMatches(matches.data ?? []);
  const matchById = new Map(matchRows.map(match => [match.id, match]));
  const users = await usersById(disputes.flatMap(d => [d.openedBy, d.resolvedBy]));
  return disputes.map(dispute => {
    const match = matchById.get(dispute.matchId) ?? null;
    return {
      ...dispute,
      match: match ? { id: match.id, status: match.status, round: match.round, homeTeam: match.homeTeam, awayTeam: match.awayTeam, homeScore: match.homeScore, awayScore: match.awayScore, tournament: match.tournament } : null,
      openedByUser: (u => ({ id: dispute.openedBy, name: userLabel(u) }))(users.get(dispute.openedBy)),
      resolvedByUser: dispute.resolvedBy ? (u => ({ id: dispute.resolvedBy, name: userLabel(u, "Admin") }))(users.get(dispute.resolvedBy)) : null,
    };
  });
}

export async function listDisputesAdmin(input: { status?: string }) {
  let query = db().from("disputes").select("*").order("created_at", { ascending: false }).limit(300);
  if (input.status) query = query.eq("status", input.status);
  const { data, error } = await query;
  if (error) fail(error, "Dispute lookup failed");
  return decorateDisputes(data ?? []);
}
