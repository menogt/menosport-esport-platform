import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";

describe("Phase 2 tRPC contracts", () => {
  const procedureNames = Object.keys(appRouter._def.procedures);

  it("exposes protected player dashboard and team procedures", () => {
    expect(procedureNames).toEqual(expect.arrayContaining(["dashboard.player", "teams.mine", "teams.create"]));
  });

  it("exposes tournament bracket match data", () => {
    expect(procedureNames).toContain("matches.matches");
  });
});
