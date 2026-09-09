import { Link } from "wouter";
import { AlertTriangle, Bell, CheckCheck, Coins, Gavel, Megaphone, Radio, Shield, Swords, Trophy, UserPlus, Users } from "lucide-react";
import type { NotificationKind } from "@shared/arena";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type NotificationView = {
  id: number;
  kind: NotificationKind;
  title: string;
  body: string;
  href?: string | null;
  readAt?: Date | string | null;
  createdAt: Date | string;
};

const ICONS: Record<NotificationKind, typeof Bell> = {
  match_start: Radio,
  checkin: Swords,
  result: Trophy,
  dispute: AlertTriangle,
  admin_decision: Gavel,
  payout: Coins,
  team_invite: UserPlus,
  clan_invite: Shield,
  clan_roster: Users,
  tournament: Trophy,
  team: Users,
  system: Megaphone,
};

function relative(value: Date | string) {
  const diff = Date.now() - new Date(value).getTime();
  const minutes = Math.round(diff / 60000);
  if (minutes < 1) return "now";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.round(hours / 24)}d`;
}

export function NotificationPanel({ notifications, onMarkAllRead, onMarkRead, loading, className, emptyText = "You're all caught up." }: { notifications: NotificationView[]; onMarkAllRead?: () => void; onMarkRead?: (id: number) => void; loading?: boolean; className?: string; emptyText?: string }) {
  const unread = notifications.filter(item => !item.readAt).length;
  return (
    <section className={cn("rounded-3xl border border-white/10 bg-white/[0.03]", className)}>
      <header className="flex items-center justify-between border-b border-white/10 px-5 py-4">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-lime-300" />
          <h3 className="font-display text-base font-semibold tracking-[-0.03em] text-white">Notifications</h3>
          {unread > 0 && <span className="rounded-full bg-lime-300 px-1.5 py-0.5 font-mono text-[9px] font-bold text-black">{unread}</span>}
        </div>
        {onMarkAllRead && unread > 0 && <Button size="sm" variant="ghost" onClick={onMarkAllRead} className="h-8 text-xs text-white/60 hover:text-white"><CheckCheck className="mr-1.5 h-3.5 w-3.5" /> Mark all read</Button>}
      </header>
      <ul className="max-h-[420px] divide-y divide-white/[0.06] overflow-y-auto">
        {loading && <li className="px-5 py-6 text-center text-xs text-white/40">Loading…</li>}
        {!loading && !notifications.length && <li className="px-5 py-10 text-center text-xs text-white/40">{emptyText}</li>}
        {notifications.map(item => {
          const Icon = ICONS[item.kind] ?? Bell;
          const inner = (
            <div className={cn("flex gap-3 px-5 py-3.5 transition-colors hover:bg-white/[0.03]", !item.readAt && "bg-lime-300/[0.04]")} onClick={() => !item.readAt && onMarkRead?.(item.id)}>
              <span className={cn("mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-xl", item.readAt ? "bg-white/[0.06] text-white/50" : "bg-lime-300/15 text-lime-300")}><Icon className="h-4 w-4" /></span>
              <div className="min-w-0 flex-1">
                <p className={cn("text-sm", item.readAt ? "text-white/70" : "font-semibold text-white")}>{item.title}</p>
                <p className="mt-0.5 line-clamp-2 text-xs leading-5 text-white/45">{item.body}</p>
              </div>
              <span className="font-mono text-[10px] text-white/30">{relative(item.createdAt)}</span>
            </div>
          );
          return <li key={item.id}>{item.href ? <Link href={item.href}>{inner}</Link> : inner}</li>;
        })}
      </ul>
    </section>
  );
}
