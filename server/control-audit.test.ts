import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(path, "utf8");

describe("interactive control audit", () => {
  it("keeps homepage controls pointed at concrete routes or explicit feedback", () => {
    const home = read("client/src/pages/Home.tsx");
    expect(home).not.toMatch(/href="#(all-tournaments|all-games|leaderboard|sponsors|register)"/);
    expect(home).toContain('href="/tournaments/live"');
    expect(home).toContain('href="/clans"');
    expect(home).toContain('href="/profile"');
    expect(home).toContain("toast.message");
  });

  it("keeps sponsor and Phase 3 media actions interactive", () => {
    const sponsorBanner = read("client/src/components/SponsorBanner.tsx");
    const phase3 = read("client/src/pages/Phase3Page.tsx");
    expect(sponsorBanner).toContain("onClick");
    expect(phase3).toContain("setActiveMedia(item)");
    expect(phase3).toContain("/clans/${clan.slug}");
    expect(phase3).toContain("/matches/${match.id}");
  });
});
