/**
 * Shared platform contracts: enums, labels, and small helpers used by both the
 * tRPC server and the React client. Keep this file dependency-free.
 */

export const USER_ROLES = ["user", "organizer", "sponsor", "admin"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const TEAM_ROLES = ["captain", "player", "manager"] as const;
export type TeamRole = (typeof TEAM_ROLES)[number];

export const CLAN_ROLES = ["owner", "manager", "scout", "member"] as const;
export type ClanRole = (typeof CLAN_ROLES)[number];

export const TOURNAMENT_FORMATS = ["single_elimination", "double_elimination", "round_robin", "swiss"] as const;
export type TournamentFormat = (typeof TOURNAMENT_FORMATS)[number];

export const TOURNAMENT_STATUSES = ["draft", "registration", "checkin", "live", "completed", "cancelled"] as const;
export type TournamentStatus = (typeof TOURNAMENT_STATUSES)[number];

export const REGISTRATION_STATUSES = ["pending", "confirmed", "checked_in", "withdrawn"] as const;
export type RegistrationStatus = (typeof REGISTRATION_STATUSES)[number];

export const MATCH_STATUSES = ["upcoming", "live", "waiting", "disputed", "completed"] as const;
export type MatchStatus = (typeof MATCH_STATUSES)[number];

export const BRACKET_KINDS = ["winners", "losers", "grand_final", "round_robin", "swiss"] as const;
export type BracketKind = (typeof BRACKET_KINDS)[number];

export const REPORT_STATUSES = ["submitted", "waiting_confirmation", "confirmed", "disputed", "admin_resolved"] as const;
export type ReportStatus = (typeof REPORT_STATUSES)[number];

export const DISPUTE_STATUSES = ["open", "under_review", "resolved"] as const;
export type DisputeStatus = (typeof DISPUTE_STATUSES)[number];

export const PAYOUT_STATUSES = ["pending", "processing", "paid"] as const;
export type PayoutStatus = (typeof PAYOUT_STATUSES)[number];

export const PAYMENT_STATUSES = ["pending", "succeeded", "failed", "refunded"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const NOTIFICATION_KINDS = [
  "match_start", "checkin", "result", "dispute", "admin_decision", "payout",
  "team_invite", "clan_invite", "clan_roster", "tournament", "team", "system",
] as const;
export type NotificationKind = (typeof NOTIFICATION_KINDS)[number];

export const MEDIA_KINDS = ["short", "reel", "highlight", "meme", "reaction", "promo"] as const;
export type MediaKind = (typeof MEDIA_KINDS)[number];

export const PRODUCT_CATEGORIES = ["jersey", "hoodie", "accessory", "digital"] as const;
export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

export const SPONSOR_TIERS = ["presenting", "partner", "supporting"] as const;
export const SPONSOR_PLACEMENTS = ["tournament", "bracket", "clan", "landing"] as const;

export const INTEGRATION_PROVIDERS = ["discord", "twitch"] as const;
export const INTEGRATION_STATUSES = ["ready", "pending", "disconnected", "error"] as const;

export const DEFAULT_PRIZE_SPLIT = [60, 30, 10] as const;

export const FORMAT_LABELS: Record<TournamentFormat, string> = {
  single_elimination: "Single elimination",
  double_elimination: "Double elimination",
  round_robin: "Round robin",
  swiss: "Swiss",
};

export const TOURNAMENT_STATUS_LABELS: Record<TournamentStatus, string> = {
  draft: "Draft",
  registration: "Registration open",
  checkin: "Check-in open",
  live: "Live",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const MATCH_STATUS_LABELS: Record<MatchStatus, string> = {
  upcoming: "Upcoming",
  live: "Live",
  waiting: "Waiting for result",
  disputed: "Under dispute",
  completed: "Completed",
};

export const REPORT_STATUS_LABELS: Record<ReportStatus, string> = {
  submitted: "Submitted",
  waiting_confirmation: "Waiting for opponent confirmation",
  confirmed: "Confirmed",
  disputed: "Disputed",
  admin_resolved: "Admin resolved",
};

export function formatCents(cents: number | null | undefined, currency = "USD"): string {
  const value = (cents ?? 0) / 100;
  return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: value % 1 === 0 ? 0 : 2 }).format(value);
}

export function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] ?? s[v] ?? s[0]}`;
}

/** Ranks that a prize split covers, e.g. [60,30,10] -> 3 paid placements. */
export function normalizePrizeSplit(split: unknown): number[] {
  if (!Array.isArray(split)) return [...DEFAULT_PRIZE_SPLIT];
  const values = split.map(Number).filter(value => Number.isFinite(value) && value >= 0);
  const total = values.reduce((sum, value) => sum + value, 0);
  if (!values.length || total <= 0 || total > 100.0001) return [...DEFAULT_PRIZE_SPLIT];
  return values;
}

export function slugify(value: string): string {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
