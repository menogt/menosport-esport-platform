import type { VercelRequest, VercelResponse } from "@vercel/node";

const modules = [
  "../server/_core/env",
  "../server/_core/supabaseAdmin",
  "../server/_core/supabase",
  "../server/db",
  "../server/_core/sdk",
  "../server/routers",
] as const;

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  const results: Record<string, unknown> = {};
  for (const modulePath of modules) {
    try {
      await import(modulePath);
      results[modulePath] = { ok: true };
    } catch (error) {
      results[modulePath] = { ok: false, error: error instanceof Error ? { name: error.name, message: error.message, stack: error.stack } : String(error) };
    }
  }
  res.status(200).json(results);
}
