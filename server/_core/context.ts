import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";
import { authenticateSupabaseToken } from "./supabase";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  const authorization = opts.req.headers.authorization;
  const bearerToken = authorization?.startsWith("Bearer ") ? authorization.slice("Bearer ".length) : null;

  if (bearerToken) {
    try {
      user = await authenticateSupabaseToken(bearerToken);
    } catch (error) {
      // Surface unexpected verification failures in the function logs; the request
      // continues unauthenticated so public procedures keep working.
      console.error("[Auth] Supabase bearer authentication failed", error);
      user = null;
    }
  }

  if (!user) {
    try {
      user = await sdk.authenticateRequest(opts.req);
    } catch (error) {
      // Authentication is optional for public procedures.
      user = null;
    }
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
