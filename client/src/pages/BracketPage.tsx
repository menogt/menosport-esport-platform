import DashboardLayout from "@/components/DashboardLayout";
import BracketView, { BracketLegend } from "@/components/BracketView";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Bell, CalendarClock, Loader2, Maximize2, Radio, Share2, Trophy, Users } from "lucide-react";
import { Link, useLocation } from "wouter";

export default function BracketPage() {
  const [location] = useLocation();
  const tournamentId = getTournamentIdFromPath(location);
  const tournamentQuery = trpc.tournaments.byId.useQuery({ tournamentId: tournamentId ?? 0 }, { enabled: tournamentId !== null });
  const matchesQuery = trpc.matches.matches.useQuery({ tournamentId: tournamentId ?? 0 }, { enabled: tournamentId !== null });

  if (!tournamentId) return <StatePage title="Bracket not found" detail="Use a valid tournament link to open a live bracket." />;
  if (tournamentQuery.isLoading || matchesQuery.isLoading) return <StatePage title="Syncing tournament" detail="Loading the latest bracket state from the arena." loading />;
  if (tournamentQuery.isError || matchesQuery.isError) return <StatePage title="Bracket unavailable" detail="We could not sync this tournament right now. Try again in a moment." />;
  if (!tournamentQuery.data) return <StatePage title="Tournament not found" detail={`No tournament exists for #${tournamentId}.`} />;

  const tournament = tournamentQuery.data;
  const matches = matchesQuery.data ?? [];
  const finalsDate = tournament.startsAt ? new Date(tournament.startsAt).toLocaleString([], { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "TBD";
  const liveMatches = matches.filter(match => match.status === "live").length;

  return <DashboardLayout><div className="min-h-screen px-5 py-8 text-white sm:px-8 lg:px-12"><div className="mx-auto max-w-[1400px] space-y-7"><Link href="/dashboard/player"><Button variant="ghost" className="-ml-3 gap-2 px-3 text-xs text-white/40 hover:bg-white/[0.05] hover:text-white"><ArrowLeft className="h-3.5 w-3.5" />Back to overview</Button></Link><header className="flex flex-col justify-between gap-6 border-b border-white/[0.08] pb-7 lg:flex-row lg:items-end"><div><div className="flex flex-wrap items-center gap-2"><Badge className="border-lime-300/20 bg-lime-300/10 text-lime-300"><Radio className="mr-1.5 h-3 w-3 animate-pulse" />{tournament.status === "live" ? "Live bracket" : tournament.status}</Badge><Badge className="border-white/10 bg-white/[0.04] text-white/45">{tournament.game}</Badge><span className="text-xs text-white/25">Tournament #{tournament.id}</span></div><h1 className="mt-4 text-4xl font-semibold tracking-[-0.05em]">{tournament.name}</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-white/45">{tournament.format.replaceAll("_", " ")} circuit. Follow every advancement live from first map to grand final.</p></div><div className="flex gap-2"><Button variant="outline" className="border-white/10 bg-white/[0.04] text-white/65 hover:bg-white/[0.08]"><Bell className="mr-2 h-4 w-4" />Follow bracket</Button><Button className="bg-lime-300 text-black hover:bg-lime-200"><Share2 className="mr-2 h-4 w-4" />Share</Button></div></header><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><InfoTile icon={<Trophy className="h-4 w-4" />} label="Prize pool" value={`$${(tournament.prizePoolCents / 100).toLocaleString()}`} /><InfoTile icon={<Users className="h-4 w-4" />} label="Team capacity" value={`${tournament.maxTeams} slots`} /><InfoTile icon={<CalendarClock className="h-4 w-4" />} label="Tournament start" value={finalsDate} /><InfoTile icon={<Radio className="h-4 w-4" />} label="Live matches" value={String(liveMatches).padStart(2, "0")} accent /></div><Card className="border-white/[0.08] bg-white/[0.025]"><CardContent className="p-5 sm:p-7"><div className="mb-7 flex flex-col justify-between gap-4 border-b border-white/[0.07] pb-5 sm:flex-row sm:items-center"><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-lime-300">Tournament map</p><p className="mt-2 text-sm capitalize text-white/45">{tournament.format.replaceAll("_", " ")} · {tournament.game} · tournament #{tournament.id}</p></div><div className="flex items-center gap-4"><BracketLegend /><Button variant="ghost" size="icon" className="text-white/35 hover:bg-white/[0.06] hover:text-white"><Maximize2 className="h-4 w-4" /></Button></div></div><BracketView matches={matches} /></CardContent></Card></div></div></DashboardLayout>;
}

function StatePage({ title, detail, loading = false }: { title: string; detail: string; loading?: boolean }) { return <DashboardLayout><div className="grid min-h-[70vh] place-items-center px-6 text-center text-white"><div>{loading ? <Loader2 className="mx-auto h-8 w-8 animate-spin text-lime-300" /> : <Radio className="mx-auto h-8 w-8 text-white/20" />}<h1 className="mt-5 text-2xl font-semibold">{title}</h1><p className="mt-2 max-w-sm text-sm leading-6 text-white/40">{detail}</p><Link href="/dashboard/player"><Button className="mt-6 bg-lime-300 text-black hover:bg-lime-200">Back to overview</Button></Link></div></div></DashboardLayout>; }

export function getTournamentIdFromPath(path: string) {
  const parsedId = Number(path.split("/").pop());
  return Number.isInteger(parsedId) && parsedId > 0 ? parsedId : null;
}

function InfoTile({ icon, label, value, accent = false }: { icon: React.ReactNode; label: string; value: string; accent?: boolean }) { return <Card className={`border-white/[0.08] bg-white/[0.025] ${accent ? "border-lime-300/20 bg-lime-300/[0.05]" : ""}`}><CardContent className="flex items-center gap-4 p-5"><div className={`grid h-10 w-10 place-items-center rounded-xl ${accent ? "bg-lime-300/15 text-lime-300" : "bg-white/[0.06] text-white/45"}`}>{icon}</div><div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/30">{label}</p><p className={`mt-1 text-lg font-semibold ${accent ? "text-lime-300" : "text-white"}`}>{value}</p></div></CardContent></Card>; }
