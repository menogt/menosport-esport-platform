import { createClient } from "@supabase/supabase-js";

const url = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  console.warn("[Supabase] Server domain client is not configured");
}

export const supabaseAdmin = url && serviceRoleKey
  ? createClient(url, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  : null;

export function hasSupabaseDomainClient() {
  return Boolean(supabaseAdmin);
}
