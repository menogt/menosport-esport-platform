import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createVercelApiApp } from "../server/_core/app";
const app = createVercelApiApp();
export default function handler(_req: VercelRequest, res: VercelResponse) { res.status(200).json({ ok: true, app: typeof app }); }
