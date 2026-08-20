import { createVercelApiApp } from "../../server/_core/app";

const app = createVercelApiApp();

export default function handler(req: { url?: string }, res: unknown) {
  const originalUrl = req.url ?? "/";
  req.url = originalUrl.replace(/^\/api\/trpc/, "") || "/";
  return app(req as never, res as never);
}
