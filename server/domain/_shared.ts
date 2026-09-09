import { TRPCError } from "@trpc/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "../_core/supabaseAdmin";

/** Service-role Supabase client, or a clear error when the deployment is not configured. */
export function db(): SupabaseClient {
  if (!supabaseAdmin) {
    throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Database is not configured. Set SUPABASE_SERVICE_ROLE_KEY on the server." });
  }
  return supabaseAdmin;
}

export function hasDb(): boolean {
  return Boolean(supabaseAdmin);
}

const DATE_KEYS = new Set([
  "createdAt", "updatedAt", "startsAt", "registrationClosesAt", "checkinOpensAt", "scheduledAt", "lastSignedIn",
  "resolvedAt", "readAt", "joinedAt", "addedAt", "respondedAt", "checkedInAt", "acceptedRulesAt", "lineupLockedAt",
  "paidAt", "achievedAt", "completedAt", "confirmedAt", "capturedAt", "endsAt", "bracketPublishedAt",
]);

export function camel<T = Record<string, any>>(row: Record<string, any>): T {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(row)) {
    const camelKey = key.replace(/_([a-z0-9])/g, (_, letter: string) => letter.toUpperCase());
    if (value && typeof value === "object" && !Array.isArray(value) && !(value instanceof Date)) {
      result[camelKey] = camel(value);
    } else if (Array.isArray(value) && value.length && value[0] && typeof value[0] === "object") {
      result[camelKey] = value.map(item => camel(item));
    } else {
      result[camelKey] = DATE_KEYS.has(camelKey) && value ? new Date(String(value)) : value;
    }
  }
  return result as T;
}

export function camelRows<T = Record<string, any>>(rows: Record<string, any>[] | null | undefined): T[] {
  return (rows ?? []).map(row => camel<T>(row));
}

export function snake(input: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    if (value === undefined) continue;
    const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    result[snakeKey] = value instanceof Date ? value.toISOString() : value;
  }
  return result;
}

export function fail(error: { message: string } | null | undefined, context: string): never {
  throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: `[Supabase] ${context}: ${error?.message ?? "unknown error"}` });
}

export function notFound(what: string): never {
  throw new TRPCError({ code: "NOT_FOUND", message: `${what} not found.` });
}

export function forbidden(message = "You do not have permission to do that."): never {
  throw new TRPCError({ code: "FORBIDDEN", message });
}

export function badRequest(message: string): never {
  throw new TRPCError({ code: "BAD_REQUEST", message });
}

export function clean(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}
