import { createClient } from "@supabase/supabase-js";
import type { User } from "../../drizzle/schema";
import { getUserByOpenId, upsertUser } from "../db";

const supabaseUrl = process.env.VITE_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY ?? "";

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

export async function authenticateSupabaseToken(token: string): Promise<User | null> {
  if (!supabaseUrl || !supabaseAnonKey || !token) return null;

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;

  const authUser = data.user;
  const openId = `supabase:${authUser.id}`;
  await upsertUser({
    openId,
    name: authUser.user_metadata?.full_name ?? authUser.user_metadata?.name ?? authUser.email ?? "Meno Arena player",
    email: authUser.email ?? null,
    loginMethod: "supabase",
    lastSignedIn: new Date(),
  });

  return (await getUserByOpenId(openId)) ?? null;
}
