import { cn } from "@/lib/utils";
import { Check, Circle, Radio, Trophy } from "lucide-react";

type MatchData = { id: number; round: number; position: number; homeTeamId: number | null; awayTeamId: number | null; homeScore: number; awayScore: number; status: "upcoming" | "live" | "waiting" | "disputed" | "completed"; scheduledAt: Date | string | null };
type BracketTeam = { name: string; tag: string; score: number; winner?: boolean };
type BracketMatch = { id: string; time: string; status: "live" | "completed" | "upcoming"; teams: [BracketTeam, BracketTeam] };

const teamDirectory: Record<number, BracketTeam> = {
  201: { name: "Null Sector", tag: "NSEC", score: 0 },
  202: { name: "Kinetic", tag: "KNTC", score: 0 },
  203: { name: "Redline", tag: "RDLN", score: 0 },
  204: { name: "Vanta", tag: "VNTA", score: 0 },
};

export default function BracketView({ matches }: { matches: MatchData[] }) {
  if (!matches.length) return <div className="grid min-h-[320px] place-items-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-8 text-center"><div><Trophy className="mx-auto h-8 w-8 text-white/20" /><p className="mt-4 text-sm font-semibold text-white/65">The bracket is waiting for its first match.</p><p className="mt-2 max-w-sm text-xs leading-5 text-white/35">Once the tournament draw is published, every round and advancement will appear here.</p></div></div>;
  const rounds: { label: string; matches: BracketMatch[] }[] = [
    { label: "Quarterfinals", matches: matches.filter(match => match.round === 1).map(toBracketMatch) },
    { label: "Semifinals", matches: matches.filter(match => match.round === 2).map(toBracketMatch) },
    { label: "Grand final", matches: matches.filter(match => match.round >= 3).map(toBracketMatch) },
  ];

  return <div className="overflow-x-auto pb-3"><div className="flex min-w-[860px] items-center gap-4">{rounds.map((round, roundIndex) => <div key={round.label} className={cn("flex min-w-[236px] flex-1 flex-col", roundIndex === 1 && "gap-10", roundIndex === 2 && "justify-center")}><div className="mb-3 flex items-center justify-between px-1"><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/35">{round.label}</p><span className="text-[10px] text-white/20">0{roundIndex + 1}</span></div>{round.matches.length ? <div className={cn("flex flex-col gap-3", roundIndex === 1 && "gap-16", roundIndex === 2 && "gap-0")}>{round.matches.map(match => <BracketMatchCard key={match.id} match={match} />)}</div> : <div className="rounded-2xl border border-dashed border-white/10 px-4 py-10 text-center text-[11px] uppercase tracking-[0.14em] text-white/20">Awaiting advancement</div>}</div>)}</div></div>;
}

function toBracketMatch(match: MatchData): BracketMatch {
  const home = { ...(teamDirectory[match.homeTeamId ?? 0] ?? { name: match.homeTeamId ? `Team ${match.homeTeamId}` : "TBD", tag: match.homeTeamId ? `T${match.homeTeamId}` : "—", score: 0 }), score: match.homeScore, winner: match.homeScore > match.awayScore && match.status === "completed" };
  const away = { ...(teamDirectory[match.awayTeamId ?? 0] ?? { name: match.awayTeamId ? `Team ${match.awayTeamId}` : "TBD", tag: match.awayTeamId ? `T${match.awayTeamId}` : "—", score: 0 }), score: match.awayScore, winner: match.awayScore > match.homeScore && match.status === "completed" };
  const status = match.status === "live" ? "live" : match.status === "completed" ? "completed" : "upcoming";
  return { id: `match-${match.id}`, time: status === "live" ? "LIVE · NOW" : status === "completed" ? "FINAL" : match.scheduledAt ? new Date(match.scheduledAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "SCHEDULED", status, teams: [home, away] };
}

function BracketMatchCard({ match }: { match: BracketMatch }) {
  const icon = match.status === "live" ? <Radio className="h-3 w-3 animate-pulse" /> : match.status === "completed" ? <Check className="h-3 w-3" /> : <Circle className="h-3 w-3" />;
  return <div className={cn("rounded-2xl border bg-white/[0.035] p-2.5 transition-colors hover:border-lime-300/30", match.status === "live" ? "border-lime-300/50 shadow-[0_0_28px_rgba(190,242,100,0.08)]" : "border-white/[0.08]")}><div className="mb-2 flex items-center justify-between px-1 text-[9px] font-bold uppercase tracking-[0.16em] text-white/35"><span className={cn("flex items-center gap-1.5", match.status === "live" && "text-lime-300")}>{icon}{match.time}</span><span>#{match.id.replace("match-", "")}</span></div>{match.teams.map((team, index) => <div key={`${match.id}-${team.tag}-${index}`} className={cn("flex items-center gap-2 rounded-xl px-2 py-2", team.winner && "bg-white/[0.05]")}><span className={cn("grid h-6 w-6 place-items-center rounded-lg text-[9px] font-black", team.winner ? "bg-lime-300 text-black" : "bg-white/10 text-white/50")}>{team.tag.slice(0, 2)}</span><span className={cn("min-w-0 flex-1 truncate text-xs font-semibold", team.name === "TBD" ? "text-white/25" : "text-white/80")}>{team.name}</span><span className={cn("font-mono text-xs font-bold", team.winner ? "text-lime-300" : "text-white/35")}>{team.score}</span></div>)}</div>;
}

export function BracketLegend() { return <div className="flex flex-wrap items-center gap-4 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/35"><span className="flex items-center gap-2 text-lime-300"><Radio className="h-3 w-3" /> Live now</span><span className="flex items-center gap-2"><Check className="h-3 w-3" /> Completed</span><span className="flex items-center gap-2"><Circle className="h-3 w-3" /> Scheduled</span><span className="flex items-center gap-2"><Trophy className="h-3 w-3" /> Advancement</span></div>; }
