export type IntegrationProvider = "discord" | "twitch";
export type IntegrationState = "ready" | "pending" | "disconnected";
export type ProductCategory = "jersey" | "hoodie" | "accessory" | "digital";
export type CampaignPlacement = "tournament" | "bracket" | "clan" | "landing";

export type CommunityIntegration = {
  provider: IntegrationProvider;
  title: string;
  detail: string;
  state: IntegrationState;
  action: string;
};

export type StreamSlot = {
  id: string;
  startsAt: string;
  game: string;
  match: string;
  channel: string;
  status: "live" | "up-next" | "scheduled";
};

export type SponsorCampaign = {
  id: string;
  name: string;
  mark: string;
  headline: string;
  body: string;
  placement: CampaignPlacement;
  cta: string;
  tone: "lime" | "amber" | "steel";
};

export type StoreProduct = {
  id: string;
  name: string;
  org: string;
  category: ProductCategory;
  priceCents: number;
  color: string;
  badge?: string;
  inventoryLabel: string;
};

export type CartLine = StoreProduct & { quantity: number };

export type AnalyticsMetric = {
  label: string;
  value: string;
  delta: string;
  detail: string;
  direction: "up" | "down" | "neutral";
};

export type Phase4Hub = {
  integrations: CommunityIntegration[];
  streamSchedule: StreamSlot[];
  sponsors: SponsorCampaign[];
  products: StoreProduct[];
  analytics: AnalyticsMetric[];
};

export function cartSubtotalCents(lines: CartLine[]) {
  return lines.reduce((total, line) => total + line.priceCents * line.quantity, 0);
}

export function formatCurrency(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}
