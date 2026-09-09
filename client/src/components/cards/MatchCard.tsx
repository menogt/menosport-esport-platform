import { Link } from "wouter";
import { Play } from "lucide-react";
import type { MatchStatus } from "@shared/arena";
import { GameThumb } from "@/components/GameThumb";
import { ClanTagBadge } from "@/components/ClanTagBadge";
import { StatusPill } from "@/components/StatusPill";
import { cn } from "@/lib/utils";

export type MatchCardView = {
  id: number;
  status: MatchStatus;
  homeTeam: { id: number; name: string; tag: string; clan?: { id?: number; tag: string; verified?: boolean } | null } | null;
  awayTeam: { id: number; name: string; tag: string; clan?: { id?: number; tag: string; verified?: boolean } | null } | null;
  homeScore: number;
  awayScore: number;
  scheduledAt?: Date | string | null;
  roundLabel?: string | null;
  tournament?: { id: number; name: string; game: string } | null;
  game?: string | null;
  streamUrl?: string | null;
  winnerTeamId?: number | null;
};

/** Horizontal match row for live lists, schedules, and dashboards. */
export function MatchCard({ match, className, compact = false }: { match: MatchCardView; className?: string; compact?: boolean }) {
  const game = match.game ?? match.tournament?.game ?? null;
  const when = match.scheduledAt ? new Date(match.scheduledAt) : null;
  const homeWon = match.status === "completed" && match.winnerTeamId != null && match.winnerTeamId === match.homeTeam?.id;
  const awayWon = match.status === "completed" && match.winnerTeamId != null && match.winnerTeamId === match.awayTeam?.id;
  return (
    <Link href={`/matches/${match.id}`} className={cn("grid items-center gap-4 rounded-2xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 transition-colors hover:border-lime-300/40 md:grid-cols-[minmax(0,1.1fr)_minmax(0,2fr)_auto]", match.status === "live" && "border-lime-300/40", className)}>
      <div className="flex min-w-0 items-center gap-3">
        <GameThumb game={game} size={compact ? "sm" : "md"} />
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold text-white/80">{match.tournament?.name ?? game ?? "Match"}</p>
          <p className="mt-0.5 truncate font-mono text-[10px] uppercase tracking-[0.14em] text-white/35">{match.roundLabel ?? `Match #${match.id}`}{when ? ` · ${when.toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}` : ""}</p>
        </div>
      </div>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <span className={cn("flex min-w-0 items-center justify-end gap-2 text-sm font-semibold", homeWon ? "text-lime-200" : "text-white/85")}><span className="truncate">{match.homeTeam?.name ?? "TBD"}</span><ClanTagBadge clan={match.homeTeam?.clan} link={false} /></span>
        <span className="rounded-lg bg-white/[0.06] px-3 py-1 font-mono text-sm font-bold text-white">{match.homeTeam && match.awayTeam ? `${match.homeScore} — ${match.awayScore}` : "vs"}</span>
        <span className={cn("flex min-w-0 items-center gap-2 text-sm font-semibold", awayWon ? "text-lime-200" : "text-white/85")}><ClanTagBadge clan={match.awayTeam?.clan} link={false} /><span className="truncate">{match.awayTeam?.name ?? "TBD"}</span></span>
      </div>
      <div className="flex items-center justify-end gap-3">
        <StatusPill status={match.status} />
        {match.streamUrl && match.status === "live" && <span className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.14em] text-lime-300"><Play className="h-3 w-3" fill="currentColor" /> Watch</span>}
      </div>
    </Link>
  );
}
