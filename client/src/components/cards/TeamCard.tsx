import { Link } from "wouter";
import { ArrowUpRight, Users } from "lucide-react";
import { GameThumb } from "@/components/GameThumb";
import { ClanTagBadge } from "@/components/ClanTagBadge";
import { cn } from "@/lib/utils";

export type TeamCardView = {
  id: number;
  name: string;
  tag: string;
  game: string;
  region?: string | null;
  logoUrl?: string | null;
  bannerUrl?: string | null;
  wins?: number;
  losses?: number;
  memberCount?: number;
  clan?: { id?: number; name?: string; tag: string; verified?: boolean } | null;
};

export function TeamAvatar({ team, size = "md", className }: { team: { name: string; tag: string; logoUrl?: string | null }; size?: "sm" | "md" | "lg"; className?: string }) {
  const sizes = { sm: "h-8 w-8 text-[9px]", md: "h-12 w-12 text-xs", lg: "h-20 w-20 text-lg" };
  return (
    <span className={cn("grid shrink-0 place-items-center overflow-hidden rounded-2xl border border-white/10 bg-white/[0.06] font-mono font-bold text-white/80", sizes[size], className)}>
      {team.logoUrl ? <img src={team.logoUrl} alt={team.name} className="h-full w-full object-cover" loading="lazy" /> : team.tag.slice(0, 3)}
    </span>
  );
}

export function TeamCard({ team, className, href }: { team: TeamCardView; className?: string; href?: string }) {
  const wins = team.wins ?? 0;
  const losses = team.losses ?? 0;
  const winRate = wins + losses ? Math.round((wins / (wins + losses)) * 100) : 0;
  return (
    <Link href={href ?? `/teams/${team.id}`} className={cn("group flex items-center gap-4 rounded-3xl border border-white/10 bg-white/[0.03] p-4 transition-colors hover:border-lime-300/40", className)}>
      <TeamAvatar team={team} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="truncate font-display text-lg font-semibold tracking-[-0.03em] text-white">{team.name}</h3>
          <ClanTagBadge clan={team.clan} link={false} />
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-white/40">
          <GameThumb game={team.game} /> <span>{team.region ?? "Global"}</span>
          {team.memberCount != null && <span className="inline-flex items-center gap-1"><Users className="h-3 w-3" />{team.memberCount}</span>}
        </div>
      </div>
      <div className="text-right">
        <p className="font-mono text-sm font-bold text-white">{wins}–{losses}</p>
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/35">{winRate}% WR</p>
      </div>
      <ArrowUpRight className="h-4 w-4 text-white/25 transition-colors group-hover:text-lime-300" />
    </Link>
  );
}
