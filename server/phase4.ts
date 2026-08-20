import type { Phase4Hub } from "@shared/phase4";

const phase4Hub: Phase4Hub = {
  integrations: [
    { provider: "discord", title: "Discord role sync", detail: "Assign tournament and clan roles after verified registration.", state: "ready", action: "Configure Discord" },
    { provider: "discord", title: "Tournament announcements", detail: "Send check-in windows, bracket changes, and final calls to one channel.", state: "pending", action: "Add webhook" },
    { provider: "twitch", title: "Match stream relay", detail: "Attach a broadcast channel to a live room and surface it in the schedule.", state: "ready", action: "Attach channel" },
  ],
  streamSchedule: [
    { id: "stream-1", startsAt: "18:30 UTC", game: "VALORANT", match: "Astra Forge vs Kairo Seven", channel: "menoarena_live", status: "live" },
    { id: "stream-2", startsAt: "20:00 UTC", game: "MOBILE LEGENDS", match: "Orbit Syndicate vs Haven House", channel: "orbitbroadcast", status: "up-next" },
    { id: "stream-3", startsAt: "21:30 UTC", game: "CS2", match: "Nox Division vs Hush Protocol", channel: "nightfallgg", status: "scheduled" },
  ],
  sponsors: [
    { id: "arc-nine", name: "ARC / NINE", mark: "A9", headline: "Fuel the nightfall circuit.", body: "A tournament presentation layer built for broadcasts, brackets, and community drops—not intrusive banner inventory.", placement: "tournament", cta: "View campaign brief", tone: "lime" },
    { id: "field-notes", name: "FIELD NOTES", mark: "FN", headline: "Precision in every round.", body: "A native bracket placement for strategic gear drops during key match windows.", placement: "bracket", cta: "Explore placement", tone: "steel" },
    { id: "sable-audio", name: "SABLE AUDIO", mark: "SA", headline: "Built for the comms that decide maps.", body: "Clan profile placement with a measurable path to sponsored roster activations.", placement: "clan", cta: "See clan package", tone: "amber" },
  ],
  products: [
    { id: "ast-jersey", name: "Astra Forge match jersey", org: "ASTRA FORGE", category: "jersey", priceCents: 6800, color: "Signal lime / charcoal", badge: "Limited run", inventoryLabel: "Sizes S–XXL" },
    { id: "orb-hoodie", name: "Orbit Syndicate heavyweight hoodie", org: "ORBIT SYNDICATE", category: "hoodie", priceCents: 8200, color: "Ink / cobalt stitch", inventoryLabel: "Sizes XS–XXL" },
    { id: "meno-cap", name: "Meno Arena split-panel cap", org: "MENO ARENA", category: "accessory", priceCents: 3400, color: "Charcoal / reflective trim", inventoryLabel: "One size" },
    { id: "nightfall-pack", name: "Nightfall broadcast pack", org: "MENO ARENA", category: "digital", priceCents: 1800, color: "Digital download", badge: "Instant access", inventoryLabel: "Includes overlays + panels" },
  ],
  analytics: [
    { label: "Bracket completion", value: "82.6%", delta: "+6.4%", detail: "Across the last three completed events", direction: "up" },
    { label: "Check-in conversion", value: "71.8%", delta: "+4.1%", detail: "From confirmed registration to ready status", direction: "up" },
    { label: "Broadcast watch time", value: "4h 12m", delta: "+28m", detail: "Median session for the Nightfall circuit", direction: "up" },
    { label: "Open dispute rate", value: "2.3%", delta: "−0.8%", detail: "Of reports submitted in the current window", direction: "down" },
  ],
};

export function getPhase4Hub(): Phase4Hub {
  return phase4Hub;
}

export function getStoreProducts() {
  return phase4Hub.products;
}

export function getSponsorCampaigns() {
  return phase4Hub.sponsors;
}
