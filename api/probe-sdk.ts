import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sdk } from "../server/_core/sdk";
export default function handler(_req: VercelRequest, res: VercelResponse) { res.status(200).json({ ok: true, sdk: typeof sdk }); }
