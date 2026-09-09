/**
 * Payments domain (sandbox provider). No real money moves: every charge is a
 * `succeeded` sandbox row with an `sbx_` reference so the client can exercise
 * the full entry-fee and checkout flow.
 */
import type { PaymentStatus } from "@shared/arena";
import type { Actor } from "./matches";
import { badRequest, camelRows, db, fail, camel } from "./_shared";

export type PaymentView = {
  id: number;
  userId: number;
  kind: "entry_fee" | "order";
  tournamentId: number | null;
  teamId: number | null;
  orderId: number | null;
  amountCents: number;
  currency: string;
  status: PaymentStatus;
  provider: string;
  reference: string | null;
  createdAt: Date;
  updatedAt: Date;
  tournament: { id: number; name: string } | null;
  team: { id: number; name: string; tag: string } | null;
};

const PAYMENT_SELECT = "*, tournament:tournaments(id,name), team:teams(id,name,tag)";

function toView(row: Record<string, any>): PaymentView {
  const payment = camel<PaymentView>(row);
  return {
    ...payment,
    amountCents: Number(payment.amountCents),
    tournament: row.tournament ? { id: Number(row.tournament.id), name: String(row.tournament.name) } : null,
    team: row.team ? { id: Number(row.team.id), name: String(row.team.name), tag: String(row.team.tag) } : null,
  };
}

export async function listMyPayments(actor: Actor): Promise<PaymentView[]> {
  const { data, error } = await db().from("payments").select(PAYMENT_SELECT).eq("user_id", actor.id).order("created_at", { ascending: false }).limit(100);
  if (error) fail(error, "Payment lookup failed");
  return camelRows(data).length ? (data ?? []).map(toView) : [];
}

export function sandboxReference(): string {
  return `sbx_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`;
}

export type SandboxChargeInput = { amountCents: number; purpose: "entry_fee" | "order"; tournamentId?: number; teamId?: number; orderId?: number };

export async function sandboxCharge(actor: Actor, input: SandboxChargeInput): Promise<PaymentView> {
  if (input.purpose === "entry_fee" && !input.tournamentId) badRequest("Entry fee payments must reference a tournament.");
  if (input.purpose === "order" && !input.orderId) badRequest("Order payments must reference an order.");
  const { data, error } = await db().from("payments").insert({
    user_id: actor.id,
    kind: input.purpose,
    tournament_id: input.tournamentId ?? null,
    team_id: input.teamId ?? null,
    order_id: input.orderId ?? null,
    amount_cents: input.amountCents,
    currency: "USD",
    status: "succeeded",
    provider: "sandbox",
    reference: sandboxReference(),
  }).select(PAYMENT_SELECT).single();
  if (error) fail(error, "Sandbox charge failed");
  return toView(data);
}
