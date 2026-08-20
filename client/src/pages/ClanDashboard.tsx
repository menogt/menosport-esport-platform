import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Globe2, Plus, Shield, Users } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { toast } from "sonner";

const initialForm = { name: "", tag: "", region: "SEA", bio: "", foundedYear: "2026", socials: "" };

export default function ClanDashboard() {
  const utils = trpc.useUtils();
  const clansQuery = trpc.clans.mine.useQuery();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(initialForm);
  const createClan = trpc.clans.create.useMutation({
    onSuccess: () => {
      toast.success("Clan created", { description: "Your organization is now ready for teams and scouting." });
      setForm(initialForm);
      setShowCreate(false);
      void utils.clans.mine.invalidate();
    },
    onError: error => toast.error("Clan creation failed", { description: error.message }),
  });
  const clan = clansQuery.data?.[0];

  return (
    <DashboardLayout>
      <div className="min-h-screen px-5 py-8 text-white sm:px-8 lg:px-12">
        <div className="mx-auto max-w-[1200px] space-y-8">
          <header className="flex flex-col justify-between gap-5 border-b border-white/[0.08] pb-7 sm:flex-row sm:items-end">
            <div>
              <Link href="/dashboard/player"><Button variant="ghost" className="mb-5 -ml-3 gap-2 px-3 text-xs text-white/40 hover:bg-white/[0.05] hover:text-white"><ArrowLeft className="h-3.5 w-3.5" />Back to overview</Button></Link>
              <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-lime-300">Organization control / clan desk</p>
              <h1 className="mt-3 text-4xl font-semibold tracking-[-0.05em]">Build the house behind the <span className="text-lime-300">signal.</span></h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-white/45">Create a clan identity, connect competitive teams, and give every roster a clearer place to grow.</p>
            </div>
            <Button onClick={() => setShowCreate(true)} className="bg-lime-300 text-black hover:bg-lime-200"><Plus className="mr-2 h-4 w-4" />Create clan</Button>
          </header>

          {clansQuery.isLoading ? <div className="rounded-2xl border border-white/10 p-8 text-white/45">Loading organization desk…</div> : clan ? <div className="grid gap-5 lg:grid-cols-[1fr_0.42fr]">
            <Card className="overflow-hidden border-lime-300/20 bg-[linear-gradient(120deg,rgba(190,242,100,0.13),rgba(255,255,255,0.02)_58%)]"><CardContent className="relative min-h-[270px] p-7"><div className="absolute -right-12 -top-24 h-72 w-72 rounded-full bg-lime-300/10 blur-3xl" /><div className="relative flex items-start justify-between gap-4"><div className="flex items-center gap-4"><div className="grid h-16 w-16 place-items-center rounded-2xl bg-lime-300 text-lg font-black text-black">{clan.tag}</div><div><p className="text-2xl font-semibold">{clan.name}</p><p className="mt-1 text-sm text-white/45">{clan.tag} <span className="mx-1 text-white/20">/</span> founded {clan.foundedYear ?? "—"}</p></div></div><Badge className="border-lime-300/20 bg-lime-300/10 text-lime-200">OWNER</Badge></div><p className="relative mt-10 max-w-lg text-sm leading-6 text-white/55">{clan.bio || "Your clan identity is live. Add a clear point of view for the teams and players you want to attract."}</p><div className="relative mt-7 flex flex-wrap gap-2"><Badge className="border-white/10 bg-black/10 text-white/45"><Globe2 className="mr-1.5 h-3 w-3" />{clan.region || "Global"}</Badge><Badge className="border-white/10 bg-black/10 text-white/45"><Shield className="mr-1.5 h-3 w-3" />Verified organization</Badge></div></CardContent></Card>
            <Card className="border-white/[0.08] bg-white/[0.025]"><CardHeader className="px-6 pb-2 pt-6"><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">Organization pulse</p><CardTitle className="mt-2 text-4xl font-semibold text-lime-300">01</CardTitle></CardHeader><CardContent className="px-6 pb-6"><p className="text-sm leading-6 text-white/45">Owner seat active. Link your first team to start building the clan competitive map.</p><Button onClick={() => toast.info("Team linking is staged", { description: "Clan-team linking will unlock with the roster service." })} variant="outline" className="mt-5 w-full border-white/10 bg-transparent text-white/60 hover:bg-white/[0.06]"><Users className="mr-2 h-4 w-4" />Link a team</Button></CardContent></Card>
          </div> : <div className="rounded-3xl border border-dashed border-white/15 bg-white/[0.02] p-12 text-center"><Shield className="mx-auto h-10 w-10 text-lime-300" /><h2 className="mt-5 text-2xl font-semibold">No clan identity yet.</h2><p className="mx-auto mt-3 max-w-md text-sm leading-6 text-white/45">Create an organization to coordinate teams, scouting, and your long-term competitive signal.</p><Button onClick={() => setShowCreate(true)} className="mt-7 bg-lime-300 text-black hover:bg-lime-200"><Plus className="mr-2 h-4 w-4" />Create your clan</Button></div>}

          {showCreate && <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-5 backdrop-blur-sm"><Card className="w-full max-w-xl border-white/10 bg-[#101510] text-white"><CardHeader><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-lime-300">New clan</p><CardTitle className="mt-2 text-2xl">Name the organization</CardTitle></CardHeader><CardContent><form className="space-y-4" onSubmit={event => { event.preventDefault(); createClan.mutate({ ...form, foundedYear: form.foundedYear ? Number(form.foundedYear) : undefined }); }}><div className="grid gap-4 sm:grid-cols-[1fr_120px]"><div><Label className="text-white/55">Clan name</Label><Input required value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} className="mt-2 border-white/10 bg-white/[0.04] text-white" placeholder="Axiom Collective" /></div><div><Label className="text-white/55">Tag</Label><Input required value={form.tag} onChange={event => setForm({ ...form, tag: event.target.value.toUpperCase() })} className="mt-2 border-white/10 bg-white/[0.04] text-white" placeholder="AXM" /></div></div><div className="grid gap-4 sm:grid-cols-2"><div><Label className="text-white/55">Region</Label><Input value={form.region} onChange={event => setForm({ ...form, region: event.target.value })} className="mt-2 border-white/10 bg-white/[0.04] text-white" /></div><div><Label className="text-white/55">Founded year</Label><Input type="number" value={form.foundedYear} onChange={event => setForm({ ...form, foundedYear: event.target.value })} className="mt-2 border-white/10 bg-white/[0.04] text-white" /></div></div><div><Label className="text-white/55">Identity note</Label><Input value={form.bio} onChange={event => setForm({ ...form, bio: event.target.value })} className="mt-2 border-white/10 bg-white/[0.04] text-white" placeholder="The line we hold." /></div><div><Label className="text-white/55">Social / Discord link</Label><Input value={form.socials} onChange={event => setForm({ ...form, socials: event.target.value })} className="mt-2 border-white/10 bg-white/[0.04] text-white" placeholder="discord.com/invite/axiom" /></div><div className="flex justify-end gap-2 pt-3"><Button type="button" variant="ghost" onClick={() => setShowCreate(false)} className="text-white/50">Cancel</Button><Button disabled={createClan.isPending} type="submit" className="bg-lime-300 text-black hover:bg-lime-200">{createClan.isPending ? "Creating…" : "Create clan"}</Button></div></form></CardContent></Card></div>}
        </div>
      </div>
    </DashboardLayout>
  );
}
