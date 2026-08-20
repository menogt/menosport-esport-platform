import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.VITE_SUPABASE_URL ?? "";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

function createOptionalSupabaseAdmin(urlValue: string, key: string): SupabaseClient | null {
  if (!urlValue || !key) {
    console.warn("[Supabase] Server domain client is not configured");
    return null;
  }

  try {
    new URL(urlValue);
    return createClient(urlValue, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  } catch (error) {
    console.warn("[Supabase] Ignoring invalid server domain client configuration", error);
    return null;
  }
}

export const supabaseAdmin = createOptionalSupabaseAdmin(url, serviceRoleKey);

export function hasSupabaseDomainClient() {
  return Boolean(supabaseAdmin);
}
