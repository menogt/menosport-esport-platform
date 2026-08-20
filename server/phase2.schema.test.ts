import { describe, expect, it } from "vitest";
import { clans, matches, playerProfiles, teamMembers, teams, tournaments } from "../drizzle/schema";

describe("Phase 2 arena schema", () => {
  it("exposes the player and team operations tables", () => {
    expect(playerProfiles["userId"]).toBeDefined();
    expect(teams["ownerId"]).toBeDefined();
    expect(teamMembers["teamId"]).toBeDefined();
    expect(clans["ownerId"]).toBeDefined();
  });

  it("exposes tournament and match history fields required by the bracket", () => {
    expect(tournaments["format"]).toBeDefined();
    expect(tournaments["status"]).toBeDefined();
    expect(matches["tournamentId"]).toBeDefined();
    expect(matches["round"]).toBeDefined();
    expect(matches["position"]).toBeDefined();
    expect(matches["winnerTeamId"]).toBeDefined();
  });
});
