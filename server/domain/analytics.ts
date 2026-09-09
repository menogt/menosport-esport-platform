import { db, fail, hasDb } from "./_shared";
import { fallbackClans, fallbackMedia, fallbackProducts, fallbackTeams, fallbackTournaments, fallbackUsers } from "./seed";

const DAY = 86_400_000;
const WINDOW_DAYS = 30;

export type Metric = { key: string; label: string; value: string; delta?: string; detail: string; direction: "up" | "down" | "flat" };
export type SeriesPoint = { date: string; count: number };

const dayKey = (date: Date) => date.toISOString().slice(0, 10);

function emptySeries(days = WINDOW_DAYS): SeriesPoint[] {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  return Array.from({ length: days }, (_, index) => ({ date: dayKey(new Date(today.getTime() - (days - 1 - index) * DAY)), count: 0 }));
}

function bucket(series: SeriesPoint[], timestamps: Array<string | Date | null | undefined>, weight: (index: number) => number = () => 1) {
  const index = new Map(series.map((point, i) => [point.date, i]));
  timestamps.forEach((value, i) => {
    if (!value) return;
    const slot = index.get(dayKey(new Date(value)));
    if (slot !== undefined) series[slot]!.count += weight(i);
  });
  return series;
}

const pct = (part: number, whole: number) => (whole ? Math.round((part / whole) * 100) : 0);
const direction = (current: number, previous: number): Metric["direction"] => (current > previous ? "up" : current < previous ? "down" : "flat");
const deltaLabel = (current: number, previous: number) => {
  if (!previous) return current ? "new" : "0%";
  const change = Math.round(((current - previous) / previous) * 100);
  return `${change > 0 ? "+" : ""}${change}%`;
};
const money = (cents: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(cents / 100);

type Totals = {
  users: number; teams: number; clans: number; tournamentsByStatus: Record<string, number>; registrations: number;
  checkinConversion: number; bracketCompletion: number; openDisputeRate: number; revenueCents: number;
};

function buildOverview(params: {
  totals: Totals; series: { registrationsPerDay: SeriesPoint[]; matchesPerDay: SeriesPoint[]; revenuePerDay: SeriesPoint[] };
  window: { registrations: number; previousRegistrations: number; revenueCents: number; previousRevenueCents: number; matches: number; previousMatches: number; newUsers: number; previousNewUsers: number };
}) {
  const { totals, window } = params;
  const liveTournaments = totals.tournamentsByStatus.live ?? 0;
  const metrics: Metric[] = [
    { key: "registrations", label: "Registrations (30d)", value: String(window.registrations), delta: deltaLabel(window.registrations, window.previousRegistrations), detail: `${totals.registrations} all-time team entries`, direction: direction(window.registrations, window.previousRegistrations) },
    { key: "revenue", label: "Sandbox revenue (30d)", value: money(window.revenueCents), delta: deltaLabel(window.revenueCents, window.previousRevenueCents), detail: `${money(totals.revenueCents)} settled all-time`, direction: direction(window.revenueCents, window.previousRevenueCents) },
    { key: "matches", label: "Matches completed (30d)", value: String(window.matches), delta: deltaLabel(window.matches, window.previousMatches), detail: `${totals.bracketCompletion}% of scheduled matches resolved`, direction: direction(window.matches, window.previousMatches) },
    { key: "players", label: "New players (30d)", value: String(window.newUsers), delta: deltaLabel(window.newUsers, window.previousNewUsers), detail: `${totals.users} accounts · ${totals.teams} teams · ${totals.clans} clans`, direction: direction(window.newUsers, window.previousNewUsers) },
    { key: "checkin", label: "Check-in conversion", value: `${totals.checkinConversion}%`, detail: "Confirmed registrations that checked in", direction: totals.checkinConversion >= 70 ? "up" : totals.checkinConversion >= 40 ? "flat" : "down" },
    { key: "disputes", label: "Open dispute rate", value: `${totals.openDisputeRate}%`, detail: `${liveTournaments} live tournament${liveTournaments === 1 ? "" : "s"} right now`, direction: totals.openDisputeRate === 0 ? "flat" : totals.openDisputeRate > 10 ? "down" : "up" },
  ];
  return { metrics, series: params.series, totals, generatedAt: new Date() };
}

export async function analyticsOverview() {
  if (!hasDb()) return demoOverview();
  const since = new Date(Date.now() - WINDOW_DAYS * 2 * DAY).toISOString();
  const [users, teams, clans, tournaments, registrations, matches, disputes, payments, recentUsers, allRegistrations] = await Promise.all([
    db().from("users").select("id", { count: "exact", head: true }),
    db().from("teams").select("id", { count: "exact", head: true }),
    db().from("clans").select("id", { count: "exact", head: true }),
    db().from("tournaments").select("id, status"),
    db().from("tournament_registrations").select("id, status, checked_in_at, created_at, tournament_id").gte("created_at", since),
    db().from("matches").select("id, status, completed_at, created_at").limit(5000),
    db().from("disputes").select("id, status"),
    db().from("payments").select("id, amount_cents, status, created_at").eq("status", "succeeded").limit(5000),
    db().from("users").select("id, created_at").gte("created_at", since),
    db().from("tournament_registrations").select("id, status, checked_in_at", { count: "exact" }).limit(5000),
  ]);
  for (const result of [users, teams, clans, tournaments, registrations, matches, disputes, payments, recentUsers, allRegistrations]) {
    if (result.error) fail(result.error, "Analytics query failed");
  }

  const windowStart = Date.now() - WINDOW_DAYS * DAY;
  const inWindow = (value: string | null | undefined) => Boolean(value) && new Date(value!).getTime() >= windowStart;
  const inPrevious = (value: string | null | undefined) => Boolean(value) && new Date(value!).getTime() < windowStart;

  const tournamentsByStatus: Record<string, number> = {};
  for (const row of tournaments.data ?? []) tournamentsByStatus[row.status] = (tournamentsByStatus[row.status] ?? 0) + 1;

  const regRows = registrations.data ?? [];
  const allRegs = allRegistrations.data ?? [];
  const eligible = allRegs.filter((row: any) => row.status === "confirmed" || row.status === "checked_in");
  const checkedIn = allRegs.filter((row: any) => row.status === "checked_in" || row.checked_in_at);
  const matchRows = matches.data ?? [];
  const completedMatches = matchRows.filter((row: any) => row.status === "completed");
  const disputeRows = disputes.data ?? [];
  const openDisputes = disputeRows.filter((row: any) => row.status !== "resolved");
  const paymentRows = payments.data ?? [];
  const revenueCents = paymentRows.reduce((sum: number, row: any) => sum + Number(row.amount_cents ?? 0), 0);

  const totals: Totals = {
    users: users.count ?? 0, teams: teams.count ?? 0, clans: clans.count ?? 0, tournamentsByStatus, registrations: allRegistrations.count ?? allRegs.length,
    checkinConversion: pct(checkedIn.length, eligible.length), bracketCompletion: pct(completedMatches.length, matchRows.length),
    openDisputeRate: pct(openDisputes.length, Math.max(completedMatches.length + openDisputes.length, disputeRows.length)), revenueCents,
  };

  const series = {
    registrationsPerDay: bucket(emptySeries(), regRows.map((row: any) => row.created_at)),
    matchesPerDay: bucket(emptySeries(), completedMatches.map((row: any) => row.completed_at ?? row.created_at)),
    revenuePerDay: bucket(emptySeries(), paymentRows.map((row: any) => row.created_at), index => Number(paymentRows[index]?.amount_cents ?? 0)),
  };

  const window = {
    registrations: regRows.filter((row: any) => inWindow(row.created_at)).length,
    previousRegistrations: regRows.filter((row: any) => inPrevious(row.created_at)).length,
    revenueCents: paymentRows.filter((row: any) => inWindow(row.created_at)).reduce((sum: number, row: any) => sum + Number(row.amount_cents ?? 0), 0),
    previousRevenueCents: paymentRows.filter((row: any) => inPrevious(row.created_at) && new Date(row.created_at).getTime() >= windowStart - WINDOW_DAYS * DAY).reduce((sum: number, row: any) => sum + Number(row.amount_cents ?? 0), 0),
    matches: completedMatches.filter((row: any) => inWindow(row.completed_at ?? row.created_at)).length,
    previousMatches: completedMatches.filter((row: any) => inPrevious(row.completed_at ?? row.created_at) && new Date(row.completed_at ?? row.created_at).getTime() >= windowStart - WINDOW_DAYS * DAY).length,
    newUsers: (recentUsers.data ?? []).filter((row: any) => inWindow(row.created_at)).length,
    previousNewUsers: (recentUsers.data ?? []).filter((row: any) => inPrevious(row.created_at)).length,
  };
  return buildOverview({ totals, series, window });
}

/** Deterministic demo overview derived from the seed dataset (no database). */
export function demoOverview() {
  const users = fallbackUsers();
  const teams = fallbackTeams();
  const clans = fallbackClans();
  const tournaments = fallbackTournaments();
  const products = fallbackProducts();
  const tournamentsByStatus: Record<string, number> = {};
  for (const tournament of tournaments) tournamentsByStatus[tournament.status] = (tournamentsByStatus[tournament.status] ?? 0) + 1;
  const registrations = tournaments.reduce((sum, tournament) => sum + tournament.registeredTeamIds.length, 0);
  const entryRevenue = tournaments.reduce((sum, tournament) => sum + tournament.entryFeeCents * tournament.registeredTeamIds.length, 0);
  const storeRevenue = products.reduce((sum, product, index) => sum + product.priceCents * ((index % 3) + 1), 0);

  const wave = (index: number, base: number, amplitude: number) => Math.max(0, Math.round(base + amplitude * Math.sin(index / 3) + (index % 4 === 0 ? amplitude / 2 : 0)));
  const registrationsPerDay = emptySeries().map((point, index) => ({ ...point, count: wave(index, 3, 2) }));
  const matchesPerDay = emptySeries().map((point, index) => ({ ...point, count: wave(index, 4, 3) }));
  const revenuePerDay = emptySeries().map((point, index) => ({ ...point, count: wave(index, 14000, 9000) }));
  const sum = (series: SeriesPoint[]) => series.reduce((total, point) => total + point.count, 0);

  const totals: Totals = {
    users: users.length, teams: teams.length, clans: clans.length, tournamentsByStatus, registrations,
    checkinConversion: 82, bracketCompletion: 64, openDisputeRate: 4, revenueCents: entryRevenue + storeRevenue,
  };
  return buildOverview({
    totals,
    series: { registrationsPerDay, matchesPerDay, revenuePerDay },
    window: {
      registrations: sum(registrationsPerDay), previousRegistrations: Math.round(sum(registrationsPerDay) * 0.84),
      revenueCents: sum(revenuePerDay), previousRevenueCents: Math.round(sum(revenuePerDay) * 0.91),
      matches: sum(matchesPerDay), previousMatches: Math.round(sum(matchesPerDay) * 1.05),
      newUsers: Math.round(users.length * 0.4), previousNewUsers: Math.round(users.length * 0.3),
    },
  });
}

export async function platformStats() {
  if (!hasDb()) {
    const tournaments = fallbackTournaments();
    return {
      players: fallbackUsers().filter(user => user.role === "user").length,
      teams: fallbackTeams().length,
      clans: fallbackClans().length,
      tournaments: tournaments.filter(t => t.status !== "draft" && t.status !== "cancelled").length,
      liveMatches: tournaments.filter(t => t.status === "live").length * 2,
      prizePoolCents: tournaments.filter(t => t.status !== "cancelled").reduce((sum, t) => sum + t.prizePoolCents + t.sponsorContributionCents, 0),
      mediaClips: fallbackMedia().length,
    };
  }
  const [players, teams, clans, tournaments, liveMatches, prizePools, media] = await Promise.all([
    db().from("player_profiles").select("id", { count: "exact", head: true }),
    db().from("teams").select("id", { count: "exact", head: true }),
    db().from("clans").select("id", { count: "exact", head: true }),
    db().from("tournaments").select("id", { count: "exact", head: true }).in("status", ["registration", "checkin", "live", "completed"]),
    db().from("matches").select("id", { count: "exact", head: true }).eq("status", "live"),
    db().from("tournaments").select("prize_pool_cents, sponsor_contribution_cents").neq("status", "cancelled"),
    db().from("media_assets").select("id", { count: "exact", head: true }).eq("published", true),
  ]);
  for (const result of [players, teams, clans, tournaments, liveMatches, prizePools, media]) {
    if (result.error) fail(result.error, "Platform stats failed");
  }
  return {
    players: players.count ?? 0,
    teams: teams.count ?? 0,
    clans: clans.count ?? 0,
    tournaments: tournaments.count ?? 0,
    liveMatches: liveMatches.count ?? 0,
    prizePoolCents: (prizePools.data ?? []).reduce((sum: number, row: any) => sum + Number(row.prize_pool_cents ?? 0) + Number(row.sponsor_contribution_cents ?? 0), 0),
    mediaClips: media.count ?? 0,
  };
}
