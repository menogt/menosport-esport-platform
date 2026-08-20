import { describe, expect, it } from "vitest";

describe("Supabase configuration", () => {
  it("accepts the configured project URL and anon key", async () => {
    const url = process.env.VITE_SUPABASE_URL;
    const anonKey = process.env.VITE_SUPABASE_ANON_KEY;

    expect(url).toMatch(/^https:\/\/[a-z0-9]+\.supabase\.co$/);
    expect(anonKey).toMatch(/^eyJ/);

    const response = await fetch(`${url}/auth/v1/settings`, {
      headers: { apikey: anonKey as string },
    });

    expect(response.ok).toBe(true);
    const settings = (await response.json()) as { external?: Record<string, unknown> };
    expect(settings).toHaveProperty("external");
  }, 15_000);
});
