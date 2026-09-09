import { createClient, type SupabaseClient, type User as SupabaseAuthUser } from "@supabase/supabase-js";
import type { User } from "../../drizzle/schema";
import { getUserByOpenId, upsertUser } from "../db";

const supabaseUrl = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY ?? "";

export function createOptionalSupabaseClient(url: string, key: string): SupabaseClient | null {
  if (!url || !key) return null;

  try {
    new URL(url);
    return createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  } catch (error) {
    console.warn("[Supabase] Ignoring invalid server client configuration", error);
    return null;
  }
}

const supabase = createOptionalSupabaseClient(supabaseUrl, supabaseAnonKey);

export function isSupabaseAuthConfigured(): boolean {
  return Boolean(supabase);
}

type AuthUserLike = Pick<SupabaseAuthUser, "id" | "email" | "user_metadata" | "created_at">;

function displayName(authUser: AuthUserLike): string {
  return authUser.user_metadata?.full_name ?? authUser.user_metadata?.name ?? authUser.email ?? "Meno Arena player";
}

/**
 * Deterministic positive 31-bit integer derived from a Supabase auth user id (FNV-1a).
 * Only used when the user row could not be persisted, so protected procedures still
 * receive a stable numeric id for the duration of the session.
 */
export function fallbackUserId(supabaseUserId: string): number {
  let hash = 0x811c9dc5;
  for (let index = 0; index < supabaseUserId.length; index++) {
    hash ^= supabaseUserId.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 1) || 1;
}

export function buildFallbackUser(authUser: AuthUserLike, openId: string, now: Date = new Date()): User {
  return {
    id: fallbackUserId(authUser.id),
    openId,
    name: displayName(authUser),
    email: authUser.email ?? null,
    loginMethod: "supabase",
    role: "user",
    createdAt: authUser.created_at ? new Date(authUser.created_at) : now,
    updatedAt: now,
    lastSignedIn: now,
  };
}

/**
 * Resolve a Supabase access token to an application user.
 *
 * A verified Supabase session must never be discarded because persistence is unavailable:
 * if the user row cannot be written or read back (missing SUPABASE_SERVICE_ROLE_KEY /
 * DATABASE_URL, schema not applied, transient outage) the caller still receives a session
 * user built from the verified auth identity. Persistence problems are logged loudly so
 * they show up in the Vercel function logs instead of silently signing the player out.
 */
export async function authenticateSupabaseToken(token: string): Promise<User | null> {
  if (!token) return null;

  if (!supabase) {
    console.error(
      "[Supabase] Cannot verify bearer token: set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in the server environment"
    );
    return null;
  }

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    if (error) console.warn("[Supabase] Bearer token rejected:", error.message);
    return null;
  }

  const authUser = data.user;
  const openId = `supabase:${authUser.id}`;
  const now = new Date();

  try {
    await upsertUser({
      openId,
      name: displayName(authUser),
      email: authUser.email ?? null,
      loginMethod: "supabase",
      lastSignedIn: now,
    });

    const stored = await getUserByOpenId(openId);
    if (stored) return stored;

    console.warn("[Supabase] Authenticated user was not persisted (no database configured); using session-only user");
  } catch (persistError) {
    console.error("[Supabase] Failed to persist authenticated user; using session-only user", persistError);
  }

  return buildFallbackUser(authUser, openId, now);
}
