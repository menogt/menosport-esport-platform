import type { VercelRequest, VercelResponse } from "@vercel/node";
import express from "express";

const app = express();

export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.status(200).json({ ok: true, module: "express", express: typeof app });
}
