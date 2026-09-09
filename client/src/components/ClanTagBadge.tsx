import { BadgeCheck } from "lucide-react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";

type ClanLike = { id?: number | null; tag: string; name?: string | null; verified?: boolean | null } | null | undefined;

/** Small inline organisation tag shown next to team and player names. */
export function ClanTagBadge({ clan, className, link = true }: { clan: ClanLike; className?: string; link?: boolean }) {
  if (!clan?.tag) return null;
  const body = (
    <span
      title={clan.name ?? clan.tag}
      className={cn("inline-flex items-center gap-1 rounded-md border border-lime-300/25 bg-lime-300/[0.08] px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-lime-200", className)}
    >
      {clan.tag}
      {clan.verified && <BadgeCheck className="h-3 w-3 text-lime-300" aria-label="Verified organisation" />}
    </span>
  );
  return link && clan.id ? <Link href={`/clans/${clan.id}`} className="inline-flex">{body}</Link> : body;
}

/** Team name with its clan tag, used in brackets, match rows, and registrations. */
export function TeamLabel({ name, clan, className }: { name: string; clan?: ClanLike; className?: string }) {
  return (
    <span className={cn("inline-flex min-w-0 items-center gap-2", className)}>
      <span className="truncate">{name}</span>
      <ClanTagBadge clan={clan} link={false} />
    </span>
  );
}
