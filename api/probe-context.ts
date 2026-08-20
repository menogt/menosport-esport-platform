import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createContext } from "../server/_core/context";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const context = await createContext({ req: req as never, res: res as never });
  res.status(200).json({ ok: true, module: "context", hasUser: Boolean(context.user) });
}
