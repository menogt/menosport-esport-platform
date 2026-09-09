import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const getUser = vi.fn();
const upsertUser = vi.fn();
const getUserByOpenId = vi.fn();

vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({ auth: { getUser } }),
}));

vi.mock("./db", () => ({
  upsertUser: (...args: unknown[]) => upsertUser(...args),
  getUserByOpenId: (...args: unknown[]) => getUserByOpenId(...args),
}));

const authUser = {
  id: "2e22d474-ba59-4a45-bfe7-63954d318954",
  email: "player@example.com",
  user_metadata: { name: "Nova" },
  created_at: "2026-09-01T00:00:00.000Z",
};

async function loadModule(configured = true) {
  vi.resetModules();
  vi.stubEnv("VITE_SUPABASE_URL", configured ? "https://example.supabase.co" : "");
  vi.stubEnv("VITE_SUPABASE_ANON_KEY", configured ? "eyJtest" : "");
  vi.stubEnv("SUPABASE_URL", "");
  vi.stubEnv("SUPABASE_ANON_KEY", "");
  return import("./_core/supabase");
}

describe("authenticateSupabaseToken", () => {
  beforeEach(() => {
    getUser.mockReset();
    upsertUser.mockReset();
    getUserByOpenId.mockReset();
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("returns null when Supabase rejects the token", async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: { message: "invalid JWT" } });
    const { authenticateSupabaseToken } = await loadModule();

    expect(await authenticateSupabaseToken("bad-token")).toBeNull();
    expect(upsertUser).not.toHaveBeenCalled();
  });

  it("returns the persisted user row when the database is available", async () => {
    getUser.mockResolvedValue({ data: { user: authUser }, error: null });
    upsertUser.mockResolvedValue(undefined);
    const stored = { id: 42, openId: `supabase:${authUser.id}`, role: "admin" };
    getUserByOpenId.mockResolvedValue(stored);
    const { authenticateSupabaseToken } = await loadModule();

    expect(await authenticateSupabaseToken("token")).toBe(stored);
    expect(upsertUser).toHaveBeenCalledWith(
      expect.objectContaining({ openId: `supabase:${authUser.id}`, email: authUser.email, loginMethod: "supabase" })
    );
  });

  it("keeps the verified session when persisting the user throws", async () => {
    getUser.mockResolvedValue({ data: { user: authUser }, error: null });
    upsertUser.mockRejectedValue(new Error("[Supabase] Failed to upsert user: relation does not exist"));
    const { authenticateSupabaseToken, fallbackUserId } = await loadModule();

    const user = await authenticateSupabaseToken("token");

    expect(user).not.toBeNull();
    expect(user?.openId).toBe(`supabase:${authUser.id}`);
    expect(user?.email).toBe(authUser.email);
    expect(user?.name).toBe("Nova");
    expect(user?.role).toBe("user");
    expect(user?.id).toBe(fallbackUserId(authUser.id));
    expect(Number.isInteger(user?.id)).toBe(true);
    expect(user?.id).toBeGreaterThan(0);
  });

  it("keeps the verified session when no database is configured to read the row back", async () => {
    getUser.mockResolvedValue({ data: { user: authUser }, error: null });
    upsertUser.mockResolvedValue(undefined);
    getUserByOpenId.mockResolvedValue(undefined);
    const { authenticateSupabaseToken } = await loadModule();

    const user = await authenticateSupabaseToken("token");

    expect(user?.openId).toBe(`supabase:${authUser.id}`);
    expect(user?.loginMethod).toBe("supabase");
  });

  it("derives a stable id for the same Supabase user", async () => {
    const { fallbackUserId } = await loadModule();

    expect(fallbackUserId(authUser.id)).toBe(fallbackUserId(authUser.id));
    expect(fallbackUserId(authUser.id)).not.toBe(fallbackUserId("another-user"));
  });

  it("returns null and logs when the server has no Supabase configuration", async () => {
    const { authenticateSupabaseToken, isSupabaseAuthConfigured } = await loadModule(false);

    expect(isSupabaseAuthConfigured()).toBe(false);
    expect(await authenticateSupabaseToken("token")).toBeNull();
    expect(console.error).toHaveBeenCalled();
  });
});
