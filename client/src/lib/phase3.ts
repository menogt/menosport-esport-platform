export type Phase3PaymentState = "idle" | "processing" | "success" | "error";

export type Phase3Notification = {
  id: number;
  title: string;
  detail: string;
  unread: boolean;
};

export function isValidSandboxEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function markNotificationRead(items: Phase3Notification[], id: number) {
  return items.map(item => item.id === id ? { ...item, unread: false } : item);
}

export function unreadNotificationCount(items: Phase3Notification[]) {
  return items.reduce((total, item) => total + (item.unread ? 1 : 0), 0);
}
