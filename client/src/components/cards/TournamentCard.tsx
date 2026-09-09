import { Link } from "wouter";
import { ArrowUpRight, Shield, Trophy, Users } from "lucide-react";
import { FORMAT_LABELS, formatCents, type TournamentFormat, type TournamentStatus } from "@shared/arena";
import { findGame } from "@shared/games";
import GameHeaderBanner from "@/components/GameHeaderBanner";
import { GameThumb } from "@/components/GameThumb";
import { StatusPill } from "@/components/StatusPill";
import { cn } from "@/lib/utils";

export type TournamentCardView = {
  id: number;
  name: string;
  game: string;
  format: TournamentFormat;
  status: TournamentStatus;
  startsAt: Date | string;
  registrationClosesAt?: Date | string | null;
  prizePoolCents: number;
  entryFeeCents: number;
  maxTeams: number;
  registeredCount?: number;
  sponsorName?: string | null;
  clanEligible?: boolean;
  bannerUrl?: string | null;
  region?: string | null;
  prizeBreakdown?: { totalCents: number } | null;
};

export function TournamentCard({ tournament, featured = false, className }: { tournament: TournamentCardView; featured?: boolean; className?: string }) {
  const game = findGame(tournament.game);
  const starts = new Date(tournament.startsAt);
  const prize = tournament.prizeBreakdown?.totalCents ?? tournament.prizePoolCents;
  return (
    <Link href={`/tournaments/${tournament.id}`} className={cn("group flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] transition-colors hover:border-lime-300/40", className)}>
      <GameHeaderBanner game={tournament.game} imageUrl={tournament.bannerUrl} variant="card" className={featured ? "aspect-[21/9]" : undefined}>
        <div className="flex h-full flex-col justify-between p-4">
          <div className="flex items-start justify-between gap-3">
            <StatusPill status={tournament.status} />
            {tournament.clanEligible && <span className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-black/40 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.14em] text-white/70"><Shield className="h-3 w-3" /> Clan eligible</span>}
          </div>
          <div className="flex items-end justify-between gap-3">
            <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-white/60"><GameThumb game={tournament.game} /> {game?.name ?? tournament.game}</div>
            <span className="grid h-9 w-9 place-items-center rounded-full border border-white/15 bg-black/40 text-white transition-transform group-hover:-translate-y-0.5 group-hover:border-lime-300/60 group-hover:text-lime-300"><ArrowUpRight size={15} /></span>
          </div>
        </div>
      </GameHeaderBanner>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.16em] text-white/40">
          <span>{FORMAT_LABELS[tournament.format]}</span>
          <span>{starts.toLocaleDateString([], { month: "short", day: "numeric" })} · {starts.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
        </div>
        <h3 className={cn("mt-2 font-display font-semibold tracking-[-0.04em] text-white", featured ? "text-2xl" : "text-xl")}>{tournament.name}</h3>
        {tournament.sponsorName && <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.16em] text-white/35">Presented by {tournament.sponsorName}</p>}
        <div className="mt-auto flex items-end justify-between gap-4 border-t border-white/10 pt-4">
          <span><small className="block font-mono text-[9px] uppercase tracking-[0.16em] text-white/35">Prize pool</small><strong className="mt-1 inline-flex items-center gap-1.5 font-display text-lg text-white"><Trophy className="h-4 w-4 text-lime-300" />{formatCents(prize)}</strong></span>
          <span><small className="block font-mono text-[9px] uppercase tracking-[0.16em] text-white/35">Entry</small><strong className="mt-1 block font-mono text-sm text-white">{tournament.entryFeeCents ? formatCents(tournament.entryFeeCents) : "Free"}</strong></span>
          <span><small className="block font-mono text-[9px] uppercase tracking-[0.16em] text-white/35">Teams</small><strong className="mt-1 inline-flex items-center gap-1.5 font-mono text-sm text-white"><Users className="h-3.5 w-3.5 text-white/40" />{tournament.registeredCount ?? 0} / {tournament.maxTeams}</strong></span>
        </div>
      </div>
    </Link>
  );
}
