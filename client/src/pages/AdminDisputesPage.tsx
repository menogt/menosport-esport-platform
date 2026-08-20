import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { Gavel, Loader2, ShieldAlert } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function AdminDisputesPage() {
  const disputes = trpc.matches.disputes.open.useQuery();
  const resolve = trpc.matches.disputes.resolve.useMutation({ onSuccess: () => { toast.success("Dispute resolved"); disputes.refetch(); }, onError: error => toast.error("Resolution failed", { description: error.message }) });
  const [activeId, setActiveId] = useState<number | null>(null);
  const [winnerTeamId, setWinnerTeamId] = useState("1");
  const [decision, setDecision] = useState("");

  return <DashboardLayout><div className="min-h-screen px-5 py-8 text-white sm:px-8 lg:px-12"><div className="mx-auto max-w-[1100px] space-y-8"><header className="border-b border-white/[0.08] pb-7"><Badge className="border-red-300/20 bg-red-300/10 text-red-200"><ShieldAlert className="mr-1.5 h-3.5 w-3.5" />Admin review queue</Badge><h1 className="mt-4 text-4xl font-semibold tracking-[-0.05em]">Dispute control room</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-white/45">Review submitted match evidence, record the ruling, and move the bracket back into a confirmed state.</p></header>{disputes.isLoading ? <div className="grid min-h-[40vh] place-items-center"><Loader2 className="h-7 w-7 animate-spin text-lime-300" /></div> : disputes.isError ? <Card className="border-red-300/20 bg-red-300/[0.05]"><CardContent className="p-6 text-sm text-red-100">Admin access is required to view this queue.</CardContent></Card> : disputes.data?.length === 0 ? <Card className="border-white/[0.08] bg-white/[0.025]"><CardContent className="p-10 text-center"><Gavel className="mx-auto h-8 w-8 text-white/20" /><h2 className="mt-4 text-xl font-semibold">No open disputes</h2><p className="mt-2 text-sm text-white/40">The bracket is clear. New match escalations will appear here.</p></CardContent></Card> : <div className="space-y-4">{disputes.data?.map(dispute => <Card key={dispute.id} className="border-white/[0.08] bg-white/[0.025]"><CardHeader className="flex flex-row items-start justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-red-200">Open dispute #{dispute.id}</p><CardTitle className="mt-2 text-xl">Match #{dispute.matchId}</CardTitle></div><Badge className="border-red-300/20 bg-red-300/10 text-red-200">Needs ruling</Badge></CardHeader><CardContent><p className="rounded-xl border border-white/[0.07] bg-black/20 p-4 text-sm leading-6 text-white/60">{dispute.reason}</p>{activeId === dispute.id ? <div className="mt-5 grid gap-4 md:grid-cols-[150px_1fr_auto] md:items-end"><div><Label className="text-white/50">Winner team id</Label><Input type="number" min="1" value={winnerTeamId} onChange={event => setWinnerTeamId(event.target.value)} className="mt-2 border-white/10 bg-white/[0.04] text-white" /></div><div><Label className="text-white/50">Admin decision</Label><Textarea minLength={10} value={decision} onChange={event => setDecision(event.target.value)} className="mt-2 border-white/10 bg-white/[0.04] text-white" placeholder="Explain the ruling…" /></div><Button disabled={resolve.isPending} onClick={() => resolve.mutate({ disputeId: dispute.id, winnerTeamId: Number(winnerTeamId), adminDecision: decision })} className="bg-lime-300 text-black hover:bg-lime-200">{resolve.isPending ? "Saving…" : "Resolve"}</Button></div> : <Button onClick={() => setActiveId(dispute.id)} className="mt-5 bg-white/[0.08] text-white hover:bg-white/[0.12]">Review ruling</Button>}</CardContent></Card>)}</div>}</div></div></DashboardLayout>;
}
