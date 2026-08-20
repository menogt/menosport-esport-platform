import { createVercelApiApp } from "../../server/_core/app";

type VercelResponse = {
  statusCode: number;
  setHeader(name: string, value: string): void;
  end(body?: string): void;
};

type VercelRequest = {
  url?: string;
};

let app: ReturnType<typeof createVercelApiApp> | undefined;

export default function handler(req: VercelRequest, res: VercelResponse) {
  try {
    app ??= createVercelApiApp();
    const originalUrl = req.url ?? "/";
    req.url = originalUrl.replace(/^\/api\/trpc/, "") || "/";
    return app(req as never, res as never);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[Vercel tRPC] Function initialization failed", error);
    res.statusCode = 500;
    res.setHeader("content-type", "application/json");
    res.end(JSON.stringify({ error: "Vercel tRPC initialization failed", message }));
  }
}
