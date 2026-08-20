import type { VercelRequest, VercelResponse } from "@vercel/node";
import * as db from "../server/db";
export default function handler(_req: VercelRequest, res: VercelResponse) { res.status(200).json({ ok: true, exports: Object.keys(db).sort() }); }
