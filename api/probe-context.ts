import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createContext } from "../server/_core/context";
export default async function handler(req: VercelRequest, res: VercelResponse) { const ctx = await createContext({ req: req as never, res: res as never }); res.status(200).json({ ok: true, user: Boolean(ctx.user) }); }
