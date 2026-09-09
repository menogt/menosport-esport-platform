import { useMemo, useState } from "react";
import { Link } from "wouter";
import { Check, ChevronDown, Circle, Radio, Trophy, AlertTriangle, Clock3 } from "lucide-react";
import type { BracketKind, MatchStatus, TournamentFormat } from "@shared/arena";
import { ClanTagBadge } from "@/components/ClanTagBadge";
import { cn } from "@/lib/utils";

export type BracketTeamView = { id: number; name: string; tag: string; logoUrl?: string | null; clan?: { id?: number; name?: string; tag: string; verified?: boolean } | null } | null;

export type BracketMatchView = {
  id: number;
  bracket: BracketKind;
  round: number;
  position: number;
  homeTeam: BracketTeamView;
  awayTeam: BracketTeamView;
  homeScore: number;
  awayScore: number;
  status: MatchStatus;
  winnerTeamId: number | null;
  scheduledAt: Date | string | null;
  roundLabel?: string;
  bestOf?: number;
};

type Column = { key: string; label: string; matches: BracketMatchView[] };

function groupRounds(matches: BracketMatchView[], bracket: BracketKind, fallbackLabel: (round: number, total: number) => string): Column[] {
  const subset = matches.filter(match => match.bracket === bracket);
  const rounds = Array.from(new Set(subset.map(match => match.round))).sort((a, b) => a - b);
  return rounds.map(round => {
    const inRound = subset.filter(match => match.round === round).sort((a, b) => a.position - b.position);
    return { key: `${bracket}-${round}`, label: inRound[0]?.roundLabel ?? fallbackLabel(round, rounds.length), matches: inRound };
  });
}

const eliminationLabel = (round: number, total: number) => {
  const remaining = total - round;
  if (remaining === 0) return "Final";
  if (remaining === 1) return "Semifinals";
  if (remaining === 2) return "Quarterfinals";
  return `Round ${round}`;
};

/**
 * Multi-format bracket renderer.
 * - single_elimination: one column per round, connectors implied by spacing.
 * - double_elimination: winners rows, losers rows, grand final.
 * - round_robin / swiss: rounds rendered as stacked lists (standings live in StandingsTable).
 * Mobile: rounds collapse into an accordion so nothing needs horizontal scrolling.
 */
export default function BracketView({ matches, format, highlightTeamId, linkMatches = true }: { matches: BracketMatchView[]; format: TournamentFormat; highlightTeamId?: number | null; linkMatches?: boolean }) {
  const sections = useMemo(() => {
    if (!matches.length) return [];
    if (format === "double_elimination") {
      return [
        { title: "Upper bracket", columns: groupRounds(matches, "winners", eliminationLabel) },
        { title: "Lower bracket", columns: groupRounds(matches, "losers", round => `Lower round ${round}`) },
        { title: "Grand final", columns: groupRounds(matches, "grand_final", round => (round > 1 ? "Reset" : "Grand final")) },
      ].filter(section => section.columns.length);
    }
    if (format === "round_robin") return [{ title: "Round robin", columns: groupRounds(matches, "round_robin", round => `Round ${round}`) }];
    if (format === "swiss") return [{ title: "Swiss rounds", columns: groupRounds(matches, "swiss", round => `Swiss round ${round}`) }];
    return [{ title: "Bracket", columns: groupRounds(matches, "winners", eliminationLabel) }];
  }, [matches, format]);

  if (!matches.length) {
    return (
      <div className="grid min-h-[320px] place-items-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-8 text-center">
        <div>
          <Trophy className="mx-auto h-8 w-8 text-white/20" />
          <p className="mt-4 text-sm font-semibold text-white/65">The bracket is waiting for its first match.</p>
          <p className="mt-2 max-w-sm text-xs leading-5 text-white/35">Once the organizer publishes the draw, every round and advancement will appear here and update live.</p>
        </div>
      </div>
    );
  }

  const listMode = format === "round_robin" || format === "swiss";

  return (
    <div className="space-y-10">
      {sections.map(section => (
        <div key={section.title}>
          {sections.length > 1 && <p className="mb-4 font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-white/40">{section.title}</p>}
          {/* Desktop: columns */}
          <div className={cn("hidden md:block", !listMode && "overflow-x-auto pb-3")}>
            <div className={cn(listMode ? "grid gap-4 md:grid-cols-2 xl:grid-cols-3" : "flex items-stretch gap-4", !listMode && `min-w-[${Math.max(section.columns.length * 250, 500)}px]`)}>
              {section.columns.map((column, columnIndex) => (
                <div key={column.key} className={cn("flex flex-col", !listMode && "min-w-[236px] flex-1")}>
                  <div className="mb-3 flex items-center justify-between px-1">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/35">{column.label}</p>
                    <span className="text-[10px] text-white/20">{String(columnIndex + 1).padStart(2, "0")}</span>
                  </div>
                  <div className={cn("flex flex-1 flex-col gap-3", !listMode && "justify-around")}>
                    {column.matches.map(match => <MatchCardCompact key={match.id} match={match} highlightTeamId={highlightTeamId} link={linkMatches} />)}
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* Mobile: accordion */}
          <div className="space-y-2 md:hidden">
            {section.columns.map((column, index) => <MobileRound key={column.key} column={column} defaultOpen={index === section.columns.length - 1 || column.matches.some(match => match.status === "live")} highlightTeamId={highlightTeamId} link={linkMatches} />)}
          </div>
        </div>
      ))}
    </div>
  );
}

function MobileRound({ column, defaultOpen, highlightTeamId, link }: { column: Column; defaultOpen: boolean; highlightTeamId?: number | null; link: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02]">
      <button type="button" onClick={() => setOpen(value => !value)} className="flex w-full items-center justify-between px-4 py-3 text-left">
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/50">{column.label}</span>
        <span className="flex items-center gap-2 text-[10px] text-white/30">{column.matches.length} matches <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} /></span>
      </button>
      {open && <div className="space-y-2 px-3 pb-3">{column.matches.map(match => <MatchCardCompact key={match.id} match={match} highlightTeamId={highlightTeamId} link={link} />)}</div>}
    </div>
  );
}

function statusMeta(match: BracketMatchView) {
  switch (match.status) {
    case "live": return { icon: <Radio className="h-3 w-3 animate-pulse" />, label: "LIVE · NOW", tone: "text-lime-300" };
    case "completed": return { icon: <Check className="h-3 w-3" />, label: "FINAL", tone: "text-white/45" };
    case "waiting": return { icon: <Clock3 className="h-3 w-3" />, label: "AWAITING RESULT", tone: "text-amber-200" };
    case "disputed": return { icon: <AlertTriangle className="h-3 w-3" />, label: "DISPUTED", tone: "text-red-300" };
    default: return { icon: <Circle className="h-3 w-3" />, label: match.scheduledAt ? new Date(match.scheduledAt).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "SCHEDULED", tone: "text-white/35" };
  }
}

export function MatchCardCompact({ match, highlightTeamId, link = true }: { match: BracketMatchView; highlightTeamId?: number | null; link?: boolean }) {
  const meta = statusMeta(match);
  const body = (
    <div className={cn("rounded-2xl border bg-white/[0.035] p-2.5 transition-colors hover:border-lime-300/30", match.status === "live" ? "border-lime-300/50 shadow-[0_0_28px_rgba(190,242,100,0.08)]" : match.status === "disputed" ? "border-red-400/40" : "border-white/[0.08]")}>
      <div className="mb-2 flex items-center justify-between px-1 text-[9px] font-bold uppercase tracking-[0.16em] text-white/35">
        <span className={cn("flex items-center gap-1.5", meta.tone)}>{meta.icon}{meta.label}</span>
        <span>#{match.id}{match.bestOf && match.bestOf > 1 ? ` · BO${match.bestOf}` : ""}</span>
      </div>
      <TeamRow team={match.homeTeam} score={match.homeScore} winner={match.status === "completed" && match.winnerTeamId !== null && match.winnerTeamId === match.homeTeam?.id} highlighted={highlightTeamId != null && highlightTeamId === match.homeTeam?.id} />
      <TeamRow team={match.awayTeam} score={match.awayScore} winner={match.status === "completed" && match.winnerTeamId !== null && match.winnerTeamId === match.awayTeam?.id} highlighted={highlightTeamId != null && highlightTeamId === match.awayTeam?.id} />
    </div>
  );
  return link ? <Link href={`/matches/${match.id}`} className="block">{body}</Link> : body;
}

function TeamRow({ team, score, winner, highlighted }: { team: BracketTeamView; score: number; winner: boolean; highlighted: boolean }) {
  return (
    <div className={cn("flex items-center gap-2 rounded-xl px-2 py-2", winner && "bg-white/[0.05]", highlighted && "ring-1 ring-lime-300/40")}>
      <span className={cn("grid h-6 w-6 shrink-0 place-items-center overflow-hidden rounded-lg text-[9px] font-black", winner ? "bg-lime-300 text-black" : "bg-white/10 text-white/50")}>
        {team?.logoUrl ? <img src={team.logoUrl} alt="" className="h-full w-full object-cover" /> : (team?.tag ?? "—").slice(0, 2)}
      </span>
      <span className={cn("flex min-w-0 flex-1 items-center gap-1.5 text-xs font-semibold", team ? "text-white/80" : "text-white/25")}>
        <span className="truncate">{team?.name ?? "TBD"}</span>
        {team?.clan && <ClanTagBadge clan={team.clan} link={false} className="px-1 py-0 text-[8px]" />}
      </span>
      <span className={cn("font-mono text-xs font-bold", winner ? "text-lime-300" : "text-white/35")}>{team ? score : "–"}</span>
    </div>
  );
}

export function BracketLegend() {
  return (
    <div className="flex flex-wrap items-center gap-4 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/35">
      <span className="flex items-center gap-2 text-lime-300"><Radio className="h-3 w-3" /> Live now</span>
      <span className="flex items-center gap-2"><Check className="h-3 w-3" /> Completed</span>
      <span className="flex items-center gap-2"><Clock3 className="h-3 w-3" /> Awaiting result</span>
      <span className="flex items-center gap-2 text-red-300"><AlertTriangle className="h-3 w-3" /> Disputed</span>
      <span className="flex items-center gap-2"><Circle className="h-3 w-3" /> Scheduled</span>
    </div>
  );
}
