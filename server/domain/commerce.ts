import type { ProductCategory } from "@shared/arena";
import { gameSlugFor } from "@shared/games";
import { nanoid } from "nanoid";
import { badRequest, camel, camelRows, clean, db, fail, forbidden, hasDb, notFound } from "./_shared";
import { clanAccess, clansById, isAdmin, safeFilter, teamsById, tournamentsById, uniqueIds, userLabel, usersById, type Viewer } from "./lookups";
import { fallbackCampaigns, fallbackIntegrations, fallbackProducts, fallbackSponsors, fallbackStreamSchedule } from "./seed";

// ---------------------------------------------------------------------------
// Sponsors
// ---------------------------------------------------------------------------

export async function featuredCampaigns(input: { placement?: string; tournamentId?: number; clanId?: number }) {
  if (!hasDb()) {
    return fallbackCampaigns().filter(campaign => !input.placement || campaign.placement === input.placement);
  }
  const nowIso = new Date().toISOString();
  let query = db().from("sponsor_campaigns").select("*").eq("active", true).or(`starts_at.is.null,starts_at.lte.${nowIso}`).or(`ends_at.is.null,ends_at.gte.${nowIso}`).order("created_at", { ascending: false }).limit(50);
  if (input.placement) query = query.eq("placement", input.placement);
  if (input.tournamentId) query = query.or(`tournament_id.eq.${input.tournamentId},tournament_id.is.null`);
  if (input.clanId) query = query.or(`clan_id.eq.${input.clanId},clan_id.is.null`);
  const { data, error } = await query;
  if (error) fail(error, "Campaign lookup failed");
  const campaigns = camelRows(data);
  const sponsorIds = uniqueIds(campaigns.map(campaign => campaign.sponsorId));
  const sponsors = sponsorIds.length ? await db().from("sponsors").select("*").in("id", sponsorIds).eq("active", true) : { data: [], error: null };
  if (sponsors.error) fail(sponsors.error, "Sponsor lookup failed");
  const sponsorById = new Map(camelRows(sponsors.data).map(sponsor => [sponsor.id, sponsor]));
  return campaigns.flatMap(campaign => {
    const sponsor = sponsorById.get(campaign.sponsorId);
    if (!sponsor) return [];
    return [{
      id: campaign.id, sponsorId: sponsor.id, name: sponsor.name, mark: sponsor.mark, logoUrl: sponsor.logoUrl ?? null, tier: sponsor.tier, tone: sponsor.tone ?? "lime",
      headline: campaign.headline, body: campaign.body ?? null, placement: campaign.placement, ctaLabel: campaign.ctaLabel ?? null, ctaUrl: campaign.ctaUrl ?? null,
      clanId: campaign.clanId ?? null, tournamentId: campaign.tournamentId ?? null, active: true,
    }];
  });
}

export async function listSponsors() {
  if (!hasDb()) return fallbackSponsors();
  const [sponsors, campaigns] = await Promise.all([
    db().from("sponsors").select("*").eq("active", true).order("tier", { ascending: true }).order("name", { ascending: true }),
    db().from("sponsor_campaigns").select("sponsor_id").eq("active", true),
  ]);
  if (sponsors.error) fail(sponsors.error, "Sponsor lookup failed");
  if (campaigns.error) fail(campaigns.error, "Campaign lookup failed");
  const counts = new Map<number, number>();
  for (const row of campaigns.data ?? []) counts.set(Number(row.sponsor_id), (counts.get(Number(row.sponsor_id)) ?? 0) + 1);
  return camelRows(sponsors.data).map(sponsor => ({ ...sponsor, tone: sponsor.tone ?? "lime", campaignCount: counts.get(sponsor.id) ?? 0 }));
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

async function decorateProducts(rows: Record<string, any>[]) {
  const products = camelRows(rows);
  const clans = await clansById(products.map(product => product.clanId));
  return products.map(product => {
    const clan = product.clanId ? clans.get(product.clanId) : null;
    return { ...product, clan: clan ? { name: clan.name, tag: clan.tag } : null };
  });
}

export async function storeCatalog(input: { category?: ProductCategory; clanId?: number; search?: string }) {
  if (!hasDb()) {
    return fallbackProducts()
      .filter(product => !input.category || product.category === input.category)
      .filter(product => !input.clanId || product.clanId === input.clanId)
      .filter(product => !input.search || `${product.name} ${product.orgLabel ?? ""} ${product.sku}`.toLowerCase().includes(input.search.toLowerCase()));
  }
  let query = db().from("products").select("*").eq("active", true).order("created_at", { ascending: false }).limit(200);
  if (input.category) query = query.eq("category", input.category);
  if (input.clanId) query = query.eq("clan_id", input.clanId);
  if (input.search) {
    const term = safeFilter(input.search);
    if (term) query = query.or(`name.ilike.%${term}%,sku.ilike.%${term}%,org_label.ilike.%${term}%`);
  }
  const { data, error } = await query;
  if (error) fail(error, "Catalog lookup failed");
  return decorateProducts(data ?? []);
}

export async function storeProduct(sku: string) {
  if (!hasDb()) {
    const product = fallbackProducts().find(entry => entry.sku.toLowerCase() === sku.toLowerCase());
    if (!product) notFound("Product");
    return product;
  }
  const { data, error } = await db().from("products").select("*").ilike("sku", safeFilter(sku)).eq("active", true).limit(1).maybeSingle();
  if (error) fail(error, "Product lookup failed");
  if (!data) notFound("Product");
  const [product] = await decorateProducts([data]);
  return product!;
}

/**
 * Sandbox checkout. No external provider is contacted: the payment row is
 * written directly as `succeeded` with a `sbx_` reference. A real provider
 * (Stripe Checkout, PayHere, etc.) would replace the payment insert with a
 * session creation and settle the order from its webhook.
 */
export async function checkout(viewer: Viewer, input: { items: Array<{ productId: number; quantity: number; variantLabel?: string }>; email?: string }) {
  if (!input.items.length) badRequest("Your cart is empty.");
  const merged = new Map<string, { productId: number; quantity: number; variantLabel: string }>();
  for (const item of input.items) {
    const variantLabel = clean(item.variantLabel) ?? "default";
    const key = `${item.productId}::${variantLabel}`;
    const existing = merged.get(key);
    if (existing) existing.quantity = Math.min(99, existing.quantity + item.quantity);
    else merged.set(key, { productId: item.productId, quantity: item.quantity, variantLabel });
  }
  const lines = Array.from(merged.values());
  const { data: productRows, error: productError } = await db().from("products").select("*").in("id", uniqueIds(lines.map(line => line.productId)));
  if (productError) fail(productError, "Product lookup failed");
  const products = new Map(camelRows(productRows).map(product => [product.id, product]));
  for (const line of lines) {
    const product = products.get(line.productId);
    if (!product) notFound(`Product #${line.productId}`);
    if (!product.active) badRequest(`${product.name} is no longer available.`);
  }
  const currency = products.get(lines[0]!.productId)?.currency ?? "USD";
  const subtotalCents = lines.reduce((sum, line) => sum + products.get(line.productId)!.priceCents * line.quantity, 0);

  const order = await db().from("orders").insert({ user_id: viewer.id, status: "pending_checkout", currency, subtotal_cents: subtotalCents, total_cents: subtotalCents }).select().single();
  if (order.error) fail(order.error, "Order creation failed");
  const orderId = Number(order.data.id);

  const items = await db().from("order_items").insert(lines.map(line => ({
    order_id: orderId, product_id: line.productId, quantity: line.quantity, unit_price_cents: products.get(line.productId)!.priceCents, variant_label: line.variantLabel,
  }))).select();
  if (items.error) {
    await db().from("orders").update({ status: "cancelled" }).eq("id", orderId);
    fail(items.error, "Order items failed");
  }

  const reference = `sbx_${nanoid(12)}`;
  const payment = await db().from("payments").insert({
    user_id: viewer.id, kind: "order", order_id: orderId, amount_cents: subtotalCents, currency, status: "succeeded", provider: "sandbox", reference,
  }).select().single();
  if (payment.error) fail(payment.error, "Payment failed");

  const paid = await db().from("orders").update({ status: "paid", provider_reference: reference }).eq("id", orderId).select().single();
  if (paid.error) fail(paid.error, "Order settlement failed");

  return {
    order: camel(paid.data),
    items: camelRows(items.data).map(item => ({ ...item, product: (({ id, sku, name, imageUrl, category }) => ({ id, sku, name, imageUrl: imageUrl ?? null, category }))(products.get(item.productId)!) })),
    payment: camel(payment.data),
    receiptEmail: clean(input.email) ?? viewer.email ?? null,
  };
}

export async function myOrders(viewer: Viewer) {
  if (!hasDb()) return [];
  const { data, error } = await db().from("orders").select("*").eq("user_id", viewer.id).order("created_at", { ascending: false }).limit(50);
  if (error) fail(error, "Order lookup failed");
  const orders = camelRows(data);
  const orderIds = orders.map(order => order.id);
  if (!orderIds.length) return [];
  const [items, payments] = await Promise.all([
    db().from("order_items").select("*").in("order_id", orderIds),
    db().from("payments").select("*").in("order_id", orderIds).eq("kind", "order"),
  ]);
  if (items.error) fail(items.error, "Order items lookup failed");
  if (payments.error) fail(payments.error, "Payment lookup failed");
  const productIds = uniqueIds((items.data ?? []).map((row: any) => Number(row.product_id)));
  const products = productIds.length ? await db().from("products").select("id, sku, name, image_url, category").in("id", productIds) : { data: [], error: null };
  if (products.error) fail(products.error, "Product lookup failed");
  const productById = new Map(camelRows(products.data).map(product => [product.id, product]));
  const itemRows = camelRows(items.data);
  const paymentRows = camelRows(payments.data);
  return orders.map(order => ({
    ...order,
    items: itemRows.filter(item => item.orderId === order.id).map(item => ({ ...item, product: productById.get(item.productId) ?? null })),
    payment: paymentRows.find(payment => payment.orderId === order.id) ?? null,
  }));
}

// ---------------------------------------------------------------------------
// Community hub: integrations and stream schedule
// ---------------------------------------------------------------------------

const maskWebhook = (url: string | null | undefined) => (url ? `••••••${url.slice(-6)}` : null);

async function decorateIntegrations(rows: Record<string, any>[]) {
  const integrations = camelRows(rows);
  const [clans, tournaments] = await Promise.all([clansById(integrations.map(row => row.clanId)), tournamentsById(integrations.map(row => row.tournamentId))]);
  return integrations.map(row => ({
    id: row.id, provider: row.provider as "discord" | "twitch", scope: row.clanId ? ("clan" as const) : ("tournament" as const), clanId: row.clanId ?? null, tournamentId: row.tournamentId ?? null,
    targetName: row.clanId ? clans.get(row.clanId)?.name ?? "Clan" : tournaments.get(row.tournamentId)?.name ?? "Tournament",
    displayName: row.displayName ?? null, externalId: row.externalId ?? null, status: row.status, webhookUrl: maskWebhook(row.webhookUrl), roleMapping: row.roleMapping ?? {}, createdAt: row.createdAt, createdBy: row.createdBy,
  }));
}

export async function communityHub() {
  if (!hasDb()) return { integrations: fallbackIntegrations(), streamSchedule: fallbackStreamSchedule() };
  const [integrations, matches] = await Promise.all([
    db().from("integration_connections").select("*").order("created_at", { ascending: false }).limit(50),
    db().from("matches").select("*").not("stream_url", "is", null).in("status", ["live", "upcoming"]).order("scheduled_at", { ascending: true, nullsFirst: false }).limit(12),
  ]);
  if (integrations.error) fail(integrations.error, "Integration lookup failed");
  if (matches.error) fail(matches.error, "Stream schedule failed");
  const matchRows = camelRows(matches.data);
  const [teams, tournaments] = await Promise.all([teamsById(matchRows.flatMap(match => [match.homeTeamId, match.awayTeamId])), tournamentsById(matchRows.map(match => match.tournamentId))]);
  const streamSchedule = matchRows.map(match => {
    const home = match.homeTeamId ? teams.get(match.homeTeamId) : null;
    const away = match.awayTeamId ? teams.get(match.awayTeamId) : null;
    const tournament = tournaments.get(match.tournamentId);
    const channel = (() => { try { return new URL(match.streamUrl).pathname.replace(/^\/+/, "").split("/")[0] || match.streamUrl; } catch { return match.streamUrl; } })();
    return {
      id: match.id, matchId: match.id, tournamentId: match.tournamentId, tournamentName: tournament?.name ?? null, startsAt: match.scheduledAt ?? tournament?.startsAt ?? null,
      game: tournament?.game ?? null, gameSlug: gameSlugFor(tournament?.game), match: `${home?.name ?? "TBD"} vs ${away?.name ?? "TBD"}`, homeTeam: home?.name ?? "TBD", awayTeam: away?.name ?? "TBD",
      channel, streamUrl: match.streamUrl, status: match.status === "live" ? ("live" as const) : ("upcoming" as const), slot: match.status === "live" ? "live" : "scheduled",
    };
  });
  return { integrations: await decorateIntegrations(integrations.data ?? []), streamSchedule };
}

async function assertIntegrationScopeAccess(viewer: Viewer, scope: { clanId?: number; tournamentId?: number }) {
  if (Number(Boolean(scope.clanId)) + Number(Boolean(scope.tournamentId)) !== 1) badRequest("Provide exactly one of clanId or tournamentId.");
  if (scope.clanId) {
    const access = await clanAccess(scope.clanId, viewer);
    if (!access.isOwner && !isAdmin(viewer)) forbidden("Only the clan owner can manage its integrations.");
    return;
  }
  const { data, error } = await db().from("tournaments").select("id, created_by").eq("id", scope.tournamentId!).maybeSingle();
  if (error) fail(error, "Tournament lookup failed");
  if (!data) notFound("Tournament");
  if (Number(data.created_by) !== viewer.id && !isAdmin(viewer)) forbidden("Only the tournament organizer can manage its integrations.");
}

/**
 * Records an integration in `pending` state. This is a placeholder: the real
 * flow would (Discord) redirect through the OAuth2 bot-install URL and store
 * the guild id + incoming webhook returned by the callback, or (Twitch)
 * exchange an OAuth code for the channel id and subscribe to EventSub
 * `stream.online` / `stream.offline`. No external call is made here.
 */
export async function connectIntegration(viewer: Viewer, input: { provider: "discord" | "twitch"; clanId?: number; tournamentId?: number; displayName: string; externalId?: string; webhookUrl?: string; roleMapping?: Record<string, string> }) {
  await assertIntegrationScopeAccess(viewer, input);
  let existing = db().from("integration_connections").select("id").eq("provider", input.provider);
  existing = input.clanId ? existing.eq("clan_id", input.clanId) : existing.eq("tournament_id", input.tournamentId!);
  const found = await existing.maybeSingle();
  if (found.error) fail(found.error, "Integration lookup failed");
  const row = {
    provider: input.provider, clan_id: input.clanId ?? null, tournament_id: input.tournamentId ?? null, display_name: input.displayName.trim(), external_id: clean(input.externalId),
    webhook_url: clean(input.webhookUrl), role_mapping: input.roleMapping ?? {}, status: "pending", created_by: viewer.id,
  };
  const result = found.data
    ? await db().from("integration_connections").update(row).eq("id", found.data.id).select().single()
    : await db().from("integration_connections").insert(row).select().single();
  if (result.error) fail(result.error, "Integration save failed");
  const [integration] = await decorateIntegrations([result.data]);
  return integration!;
}

export async function disconnectIntegration(viewer: Viewer, integrationId: number) {
  const { data, error } = await db().from("integration_connections").select("*").eq("id", integrationId).maybeSingle();
  if (error) fail(error, "Integration lookup failed");
  if (!data) notFound("Integration");
  await assertIntegrationScopeAccess(viewer, { clanId: data.clan_id ?? undefined, tournamentId: data.tournament_id ?? undefined });
  const removal = await db().from("integration_connections").delete().eq("id", integrationId);
  if (removal.error) fail(removal.error, "Integration removal failed");
  return { success: true as const };
}

const CLAN_ROLE_LABELS: Record<string, string> = { owner: "Clan Owner", manager: "Clan Manager", scout: "Scout", member: "Member" };
const TEAM_ROLE_LABELS: Record<string, string> = { captain: "Captain", manager: "Team Manager", player: "Player" };

/** What a Discord role sync would apply — computed from the database, no provider call. */
export async function rolePreview(viewer: Viewer, input: { clanId?: number; tournamentId?: number }) {
  if (!hasDb()) return [];
  await assertIntegrationScopeAccess(viewer, input);
  const entries: Array<{ userId: number; userName: string; handle: string | null; role: string }> = [];
  if (input.clanId) {
    const [members, teamLinks] = await Promise.all([
      db().from("clan_members").select("user_id, role").eq("clan_id", input.clanId),
      db().from("clan_teams").select("team_id").eq("clan_id", input.clanId),
    ]);
    if (members.error) fail(members.error, "Clan members lookup failed");
    if (teamLinks.error) fail(teamLinks.error, "Clan teams lookup failed");
    const teamIds = (teamLinks.data ?? []).map((row: any) => Number(row.team_id));
    const teamMembers = teamIds.length ? await db().from("team_members").select("user_id, role").in("team_id", teamIds) : { data: [], error: null };
    if (teamMembers.error) fail(teamMembers.error, "Team members lookup failed");
    const users = await usersById([...(members.data ?? []).map((row: any) => Number(row.user_id)), ...(teamMembers.data ?? []).map((row: any) => Number(row.user_id))]);
    const seen = new Set<number>();
    for (const row of members.data ?? []) {
      seen.add(Number(row.user_id));
      const user = users.get(Number(row.user_id));
      entries.push({ userId: Number(row.user_id), userName: userLabel(user), handle: user?.handle ?? null, role: CLAN_ROLE_LABELS[row.role] ?? "Member" });
    }
    for (const row of teamMembers.data ?? []) {
      if (seen.has(Number(row.user_id))) continue;
      seen.add(Number(row.user_id));
      const user = users.get(Number(row.user_id));
      entries.push({ userId: Number(row.user_id), userName: userLabel(user), handle: user?.handle ?? null, role: TEAM_ROLE_LABELS[row.role] ?? "Player" });
    }
    return entries;
  }
  const registrations = await db().from("tournament_registrations").select("team_id").eq("tournament_id", input.tournamentId!).neq("status", "withdrawn");
  if (registrations.error) fail(registrations.error, "Registration lookup failed");
  const teamIds = uniqueIds((registrations.data ?? []).map((row: any) => Number(row.team_id)));
  if (!teamIds.length) return [];
  const [teamMembers, teams] = await Promise.all([db().from("team_members").select("team_id, user_id, role").in("team_id", teamIds), teamsById(teamIds)]);
  if (teamMembers.error) fail(teamMembers.error, "Team members lookup failed");
  const users = await usersById((teamMembers.data ?? []).map((row: any) => Number(row.user_id)));
  for (const row of teamMembers.data ?? []) {
    const user = users.get(Number(row.user_id));
    const team = teams.get(Number(row.team_id));
    const isCaptain = row.role === "captain" || team?.captainId === Number(row.user_id);
    entries.push({ userId: Number(row.user_id), userName: userLabel(user), handle: user?.handle ?? null, role: `${isCaptain ? "Captain" : TEAM_ROLE_LABELS[row.role] ?? "Player"} · ${team?.tag ?? "TEAM"}` });
  }
  return entries;
}
