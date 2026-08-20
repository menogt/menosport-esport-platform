import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Check, MapPin, Save, Shield, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "wouter";

export default function ProfilePage() {
  const { data } = trpc.dashboard.player.useQuery();
  const utils = trpc.useUtils();
  const updateProfile = trpc.dashboard.updateProfile.useMutation({
    onSuccess: async () => {
      setStatus("saved");
      await utils.dashboard.player.invalidate();
    },
    onError: () => setStatus("error"),
  });
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");
  const [form, setForm] = useState({ handle: "", bio: "", region: "", primaryGame: "" });

  useEffect(() => {
    if (data?.profile) setForm({ handle: data.profile.handle ?? "", bio: data.profile.bio ?? "", region: data.profile.region ?? "", primaryGame: data.profile.primaryGame ?? "" });
  }, [data?.profile]);

  return <DashboardLayout><div className="min-h-screen px-5 py-8 text-white sm:px-8 lg:px-12"><div className="mx-auto max-w-[980px] space-y-8"><Link href="/dashboard/player"><Button variant="ghost" className="-ml-3 gap-2 px-3 text-xs text-white/40 hover:bg-white/[0.05] hover:text-white"><ArrowLeft className="h-3.5 w-3.5" />Back to overview</Button></Link><header className="border-b border-white/[0.08] pb-7"><p className="text-[10px] font-bold uppercase tracking-[0.24em] text-lime-300">Identity / player profile</p><h1 className="mt-3 text-4xl font-semibold tracking-[-0.05em]">Make your signal <span className="text-lime-300">recognizable.</span></h1><p className="mt-3 max-w-xl text-sm leading-6 text-white/45">Your public player card is the source of truth for tournament registrations, teams, and match rooms.</p></header><div className="grid gap-6 lg:grid-cols-[0.7fr_1.3fr]"><Card className="border-lime-300/20 bg-lime-300/[0.06]"><CardContent className="p-6"><div className="grid h-16 w-16 place-items-center rounded-2xl bg-lime-300 text-xl font-black text-black">{form.handle.slice(0, 2) || "NA"}</div><h2 className="mt-6 text-2xl font-semibold">{form.handle || "New player"}</h2><p className="mt-2 text-sm leading-6 text-white/50">{form.bio || "Add a short competitive bio to tell the circuit what you bring."}</p><div className="mt-8 space-y-3 border-t border-lime-300/15 pt-5 text-xs text-white/50"><p className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5 text-lime-300" />{form.region || "Region not set"}</p><p className="flex items-center gap-2"><Shield className="h-3.5 w-3.5 text-lime-300" />{form.primaryGame || "Game not set"}</p><p className="flex items-center gap-2"><UserRound className="h-3.5 w-3.5 text-lime-300" />Verified Manus identity</p></div><Badge className="mt-7 border-lime-300/20 bg-lime-300/10 text-lime-300">PUBLIC PLAYER CARD</Badge></CardContent></Card><Card className="border-white/[0.08] bg-white/[0.025]"><CardHeader><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-lime-300">Edit profile</p><CardTitle className="mt-2 text-2xl">Player details</CardTitle></CardHeader><CardContent><form className="space-y-5" onSubmit={event => { event.preventDefault(); setStatus("idle"); updateProfile.mutate(form); }}><div className="grid gap-5 sm:grid-cols-[1fr_140px]"><div><Label className="text-white/55">Handle</Label><Input required value={form.handle} onChange={event => setForm({ ...form, handle: event.target.value.toUpperCase() })} className="mt-2 border-white/10 bg-white/[0.04] text-white" /></div><div><Label className="text-white/55">Region</Label><Input value={form.region} onChange={event => setForm({ ...form, region: event.target.value.toUpperCase() })} className="mt-2 border-white/10 bg-white/[0.04] text-white" /></div></div><div><Label className="text-white/55">Primary game</Label><Input value={form.primaryGame} onChange={event => setForm({ ...form, primaryGame: event.target.value })} className="mt-2 border-white/10 bg-white/[0.04] text-white" /></div><div><Label className="text-white/55">Competitive bio</Label><Textarea value={form.bio} onChange={event => setForm({ ...form, bio: event.target.value })} className="mt-2 min-h-32 border-white/10 bg-white/[0.04] text-white" placeholder="What do you bring to the server?" /></div><div className="flex items-center justify-between gap-4 border-t border-white/[0.07] pt-5"><p className={`text-xs ${status === "error" ? "text-red-300" : "text-white/35"}`}>{status === "error" ? "Could not save profile. Try again." : status === "saved" ? "Profile saved to your player card." : "Changes are stored on your protected player profile."}</p><Button type="submit" disabled={updateProfile.isPending} className="bg-lime-300 text-black hover:bg-lime-200">{status === "saved" ? <><Check className="mr-2 h-4 w-4" />Saved</> : <><Save className="mr-2 h-4 w-4" />{updateProfile.isPending ? "Saving..." : "Save profile"}</>}</Button></div></form></CardContent></Card></div></div></div></DashboardLayout>;
}
