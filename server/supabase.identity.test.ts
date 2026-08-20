import { describe, expect, it } from "vitest";
import { normalizeSupabaseUserId } from "./db";

describe("Supabase identity normalization", () => {
  it("removes the local openId prefix before storage and lookup", () => {
    expect(normalizeSupabaseUserId("supabase:2a4c-user-id")).toBe("2a4c-user-id");
    expect(normalizeSupabaseUserId("2a4c-user-id")).toBe("2a4c-user-id");
  });
});
