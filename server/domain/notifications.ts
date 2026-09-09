import type { NotificationKind } from "@shared/arena";
import { camelRows, db, fail, hasDb } from "./_shared";

export type NotificationInput = {
  userId: number;
  kind: NotificationKind;
  title: string;
  body: string;
  href?: string | null;
};

/** Fire-and-forget notification creation. Never throws — a failed notification must not fail the action. */
export async function notify(inputs: NotificationInput | NotificationInput[]): Promise<void> {
  const list = (Array.isArray(inputs) ? inputs : [inputs]).filter(item => item.userId > 0);
  if (!list.length || !hasDb()) return;
  const { error } = await db().from("notifications").insert(list.map(item => ({ user_id: item.userId, kind: item.kind, title: item.title, body: item.body, href: item.href ?? null })));
  if (error) console.warn("[Notifications] insert failed:", error.message);
}

export async function listNotifications(userId: number, limit = 40) {
  const { data, error } = await db().from("notifications").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(limit);
  if (error) fail(error, "Notification lookup failed");
  return camelRows(data);
}

export async function unreadCount(userId: number): Promise<number> {
  const { count, error } = await db().from("notifications").select("id", { count: "exact", head: true }).eq("user_id", userId).is("read_at", null);
  if (error) fail(error, "Notification count failed");
  return count ?? 0;
}

export async function markNotificationsRead(userId: number, ids?: number[]) {
  let query = db().from("notifications").update({ read_at: new Date().toISOString() }).eq("user_id", userId).is("read_at", null);
  if (ids?.length) query = query.in("id", ids);
  const { error } = await query;
  if (error) fail(error, "Notification update failed");
  return { success: true as const };
}
