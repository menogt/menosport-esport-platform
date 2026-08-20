import { createVercelApiApp } from "../../server/_core/app";

const app = createVercelApiApp();

type VercelResponse = {
  statusCode: number;
  setHeader(name: string, value: string): void;
  end(body?: string): void;
};

type VercelRequest = {
  url?: string;
};

export default function handler(req: VercelRequest, res: VercelResponse) {
  const originalUrl = req.url ?? "/";
  req.url = originalUrl.replace(/^\/api\/trpc/, "") || "/";
  return app(req as never, res as never);
}
