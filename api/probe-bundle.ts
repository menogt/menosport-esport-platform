import type { VercelRequest, VercelResponse } from "@vercel/node";
export default async function handler(_req: VercelRequest, res: VercelResponse) {
  try {
    const mod = await import("./trpc/[...path].js");
    res.status(200).json({ ok: true, exports: Object.keys(mod) });
  } catch (error) {
    res.status(200).json({ ok: false, error: error instanceof Error ? { name: error.name, message: error.message, stack: error.stack } : String(error) });
  }
}
