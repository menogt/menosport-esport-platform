import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { Bell, Check, ChevronRight, Clock3, CreditCard, Flame, Gamepad2, Image as ImageIcon, Radio, ShieldCheck, Trophy, Users, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import { isValidSandboxEmail, markNotificationRead, unreadNotificationCount } from "@/lib/phase3";
import { BrandMark } from "@/components/BrandMark";

const matches = [
  { id: 1, game: "VALORANT", round: "Grand Final", left: "Astra Forge", right: "Kairo Seven", score: "1 — 0", status: "LIVE", accent: "lime" },
  { id: 2, game: "MOBILE LEGENDS", round: "Map 5", left: "Orbit Syndicate", right: "Haven House", score: "2 — 2", status: "LIVE", accent: "violet" },
  { id: 3, game: "CS2", round: "Round 18", left: "Nox Division", right: "Hush Protocol", score: "0 — 1", status: "UP NEXT", accent: "blue" },
];

const games = [
  { name: "Valorant", code: "V", events: "44 active events", tone: "from-lime-300/30 via-lime-300/5 to-transparent", image: "/manus-storage/meno-tactical-keyart_59e83184.jpg", category: "Tactical circuit" },
  { name: "Mobile Legends", code: "M", events: "28 active events", tone: "from-fuchsia-300/30 via-fuchsia-300/5 to-transparent", image: "/manus-storage/meno-strategy-keyart_8f9b39ce.jpg", category: "Mobile strategy" },
  { name: "CS2", code: "C", events: "19 active events", tone: "from-sky-300/30 via-sky-300/5 to-transparent", image: "/manus-storage/meno-arena-keyart_ca264d4a.jpg", category: "Arena combat" },
  { name: "EA FC 26", code: "F", events: "12 active events", tone: "from-orange-300/30 via-orange-300/5 to-transparent", image: "/manus-storage/meno-arena-keyart_ca264d4a.jpg", category: "Arena sport" },
];

const clans = [
  { name: "Astra Forge", tag: "AST", slug: "ast", rating: "8,420", delta: "+412" },
  { name: "Orbit Syndicate", tag: "ORB", slug: "orb", rating: "7,960", delta: "+188" },
  { name: "Kairo Seven", tag: "K7", slug: "k7", rating: "7,540", delta: "+96" },
  { name: "Nox Division", tag: "NOX", slug: "nox", rating: "7,215", delta: "−24" },
];

const media = [
  { id: "01", title: "THE LAST ROTATION", description: "Astra Forge close out the nightfall final", category: "Highlights", tone: "from-lime-300/30 via-lime-900/20 to-black", image: "/manus-storage/meno-media-relay_42538009.jpg" },
  { id: "02", title: "CLUTCH THEORY", description: "Three clean rounds from the Orbit Syndicate", category: "Analysis", tone: "from-violet-300/30 via-violet-900/20 to-black", image: "/manus-storage/meno-tactical-keyart_59e83184.jpg" },
  { id: "03", title: "RIVAL SIGNAL", description: "Inside the CS2 room before map three", category: "Behind the scenes", tone: "from-sky-300/30 via-sky-900/20 to-black", image: "/manus-storage/meno-arena-keyart_ca264d4a.jpg" },
  { id: "04", title: "MOBILITY WINDOW", description: "A mobile strategy final through the Meno Arena relay", category: "Highlights", tone: "from-fuchsia-300/30 via-fuchsia-900/20 to-black", image: "/manus-storage/meno-strategy-keyart_8f9b39ce.jpg" },
];

function SectionLabel({ children }: { children: string }) {
  return <p className="mb-3 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.28em] text-lime-300"><span className="h-1.5 w-1.5 rounded-full bg-lime-300 shadow-[0_0_12px_rgba(190,255,71,.9)]" />{children}</p>;
}

export default function Phase3Page() {
  const [location] = useLocation();
  const [paymentState, setPaymentState] = useState<"idle" | "processing" | "success" | "error">("idle");
  const [email, setEmail] = useState("captain@yourorg.gg");
  const [notifications, setNotifications] = useState([
    { id: 1, title: "Match room opens in 22 min", detail: "Nightfall Open · Astra Forge vs Kairo Seven", unread: true },
    { id: 2, title: "Dispute evidence received", detail: "A moderator is reviewing match #2048", unread: true },
    { id: 3, title: "Roster lock confirmed", detail: "Your lineup is ready for check-in", unread: false },
  ]);
  const [mediaFilter, setMediaFilter] = useState("All");
  const [activeMedia, setActiveMedia] = useState<(typeof media)[number] | null>(null);

  useEffect(() => {
    const channel = supabase.channel("meno-arena-live-matches").on("postgres_changes", { event: "*", schema: "public", table: "matches" }, () => {
      setNotifications(current => [{ id: Date.now(), title: "Live bracket refreshed", detail: "A match state changed in the arena", unread: true }, ...current].slice(0, 5));
    }).subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    const target = location === "/games" ? "games" : location === "/clans" ? "clans" : location === "/media" ? "media" : "live";
    document.getElementById(target)?.scrollIntoView({ block: "start" });
  }, [location]);

  const unreadCount = useMemo(() => unreadNotificationCount(notifications), [notifications]);
  const visibleMedia = useMemo(() => mediaFilter === "All" ? media : media.filter(item => item.category === mediaFilter), [mediaFilter]);
  const pay = () => {
    if (!isValidSandboxEmail(email)) { setPaymentState("error"); return; }
    setPaymentState("processing");
    window.setTimeout(() => setPaymentState("success"), 700);
  };

  return (
    <main className="min-h-screen bg-[#090a0b] pb-24 text-white">
      <header className="border-b border-white/10 bg-[#090a0b]/90 px-6 py-4 backdrop-blur md:px-12">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-5">
          <Link href="/"><BrandMark /></Link>
          <nav className="hidden gap-5 font-mono text-[10px] uppercase tracking-[0.18em] text-white/50 md:flex"><Link href="/tournaments/live" className="hover:text-lime-300">Live room</Link><Link href="/games" className="hover:text-lime-300">Games</Link><Link href="/clans" className="hover:text-lime-300">Clans</Link><Link href="/media" className="hover:text-lime-300">Media</Link></nav>
          <Badge variant="outline" className="gap-2 border-lime-300/30 text-lime-300"><Radio className="h-3 w-3" />{unreadCount} alerts</Badge>
        </div>
        <nav className="mx-auto mt-3 flex max-w-7xl gap-4 overflow-x-auto border-t border-white/10 pt-3 font-mono text-[9px] uppercase tracking-[0.16em] text-white/55 md:hidden"><Link href="/tournaments/live" className="shrink-0 hover:text-lime-300">Live</Link><Link href="/games" className="shrink-0 hover:text-lime-300">Games</Link><Link href="/clans" className="shrink-0 hover:text-lime-300">Clans</Link><Link href="/media" className="shrink-0 hover:text-lime-300">Media</Link></nav>
      </header>

      <section className="mx-auto max-w-7xl px-6 pb-16 pt-20 md:px-12 md:pt-28">
        <SectionLabel>Phase 03 · the room is live</SectionLabel>
        <div className="grid gap-8 lg:grid-cols-[1.2fr_.8fr] lg:items-end"><div><h1 className="max-w-4xl font-display text-5xl leading-[.95] tracking-[-.06em] md:text-8xl">Competition<br /><span className="text-lime-300">without static.</span></h1></div><p className="max-w-sm text-sm leading-7 text-white/50">Live brackets, payment-safe registration, signal-rich notifications, and the places where your next rivalry starts.</p></div>
      </section>

      <section id="live" className="scroll-mt-10 border-y border-white/10 bg-white/[.02] px-6 py-16 md:px-12"><div className="mx-auto max-w-7xl"><div className="mb-8 flex items-end justify-between"><div><SectionLabel>01 / real-time room</SectionLabel><h2 className="font-display text-4xl tracking-[-.04em] md:text-6xl">Live matches.</h2></div><Badge className="border border-lime-300/30 bg-lime-300/10 text-lime-300"><Radio className="mr-2 h-3 w-3" /> Supabase channel ready</Badge></div><div className="grid gap-4 lg:grid-cols-3">{matches.map(match => <Card key={match.id} className="border-white/10 bg-black/30"><CardHeader className="flex-row items-center justify-between pb-3"><CardTitle className="font-mono text-[10px] tracking-[.22em] text-white/45">{match.game} · {match.round}</CardTitle><span className={match.status === "LIVE" ? "font-mono text-[10px] text-lime-300" : "font-mono text-[10px] text-white/40"}>{match.status}</span></CardHeader><CardContent><div className="space-y-3 text-sm"><div className="flex justify-between"><span>{match.left}</span><strong>{match.score.split(" — ")[0]}</strong></div><div className="flex justify-between text-white/55"><span>{match.right}</span><strong>{match.score.split(" — ")[1]}</strong></div></div><div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4 font-mono text-[10px] uppercase tracking-[.2em] text-white/40"><span>Bracket node 0{match.id}</span><Button asChild variant="ghost" size="sm" className="h-7 px-0 text-lime-300 hover:bg-transparent hover:text-white"><Link href={`/matches/${match.id}`}>Open room <ChevronRight className="ml-1 h-3 w-3" /></Link></Button></div></CardContent></Card>)}</div></div></section>

      <section className="mx-auto grid max-w-7xl gap-6 px-6 py-16 md:px-12 lg:grid-cols-[1.1fr_.9fr]"><Card className="border-white/10 bg-white/[.03]"><CardHeader><SectionLabel>02 / payment sandbox</SectionLabel><CardTitle className="font-display text-3xl tracking-[-.04em]">Reserve your slot.</CardTitle><p className="text-sm text-white/45">Test mode only · no money moves.</p></CardHeader><CardContent><div className="space-y-4"><div className="flex items-center justify-between border-b border-white/10 pb-4 text-sm"><span className="text-white/50">Nightfall Open entry</span><strong>$24.00</strong></div><div className="flex items-center justify-between text-sm"><span className="text-white/50">Platform fee</span><span>$0.00</span></div><Input value={email} onChange={event => setEmail(event.target.value)} className="border-white/10 bg-black/30" placeholder="captain@yourorg.gg" aria-label="Captain email" />{paymentState === "error" && <p className="text-xs text-red-300">Enter a valid captain email to continue.</p>}{paymentState === "success" && <p className="flex items-center gap-2 text-xs text-lime-300"><Check className="h-4 w-4" /> Sandbox registration confirmed. Your slot is held.</p>}<Button onClick={pay} disabled={paymentState === "processing"} className="w-full bg-lime-300 text-black hover:bg-lime-200"><CreditCard className="mr-2 h-4 w-4" />{paymentState === "processing" ? "Holding slot…" : "Simulate secure entry"}</Button></div></CardContent></Card>
        <Card className="border-white/10 bg-[#101114]"><CardHeader><SectionLabel>03 / signal center</SectionLabel><CardTitle className="flex items-center gap-2 font-display text-3xl tracking-[-.04em]"><Bell className="h-5 w-5 text-lime-300" /> Notifications</CardTitle></CardHeader><CardContent className="space-y-3">{notifications.map(item => <button key={item.id} onClick={() => setNotifications(current => markNotificationRead(current, item.id))} className="w-full border-b border-white/10 pb-3 text-left last:border-0"><div className="flex items-start gap-3"><span className={item.unread ? "mt-1 h-2 w-2 rounded-full bg-lime-300" : "mt-1 h-2 w-2 rounded-full bg-white/15"} /><span><strong className="block text-sm font-medium">{item.title}</strong><span className="mt-1 block text-xs leading-5 text-white/40">{item.detail}</span></span></div></button>)}</CardContent></Card></section>

      <section id="games" className="scroll-mt-10 border-y border-white/10 px-6 py-16 md:px-12"><div className="mx-auto max-w-7xl"><SectionLabel>04 / game hubs</SectionLabel><div className="mb-8 flex items-end justify-between"><h2 className="font-display text-4xl tracking-[-.04em] md:text-6xl">Pick your arena.</h2><Gamepad2 className="h-8 w-8 text-white/20" /></div><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{games.map(game => <Card key={game.name} className={`group relative min-h-72 overflow-hidden border-white/10 bg-gradient-to-br ${game.tone}`}><img src={game.image} alt="" className="absolute inset-0 h-full w-full object-cover opacity-45 transition duration-500 group-hover:scale-105 group-hover:opacity-60" /><div className="absolute inset-0 bg-gradient-to-t from-[#090a0b] via-[#090a0b]/45 to-transparent" /><CardContent className="relative flex min-h-72 flex-col justify-between p-6"><div className="flex items-center justify-between"><span className="grid h-11 w-11 place-items-center border border-lime-300/50 bg-black/30 font-display text-2xl text-lime-300">{game.code}</span><span className="font-mono text-[9px] uppercase tracking-[.18em] text-white/60">{game.category}</span></div><div><h3 className="font-display text-2xl">{game.name}</h3><p className="mt-1 text-xs text-white/60">{game.events}</p></div></CardContent></Card>)}</div><p className="mt-5 font-mono text-[9px] uppercase tracking-[.16em] text-white/30">Original Meno Arena category artwork · no third-party game marks used</p></div></section>

      <section id="clans" className="scroll-mt-10 mx-auto grid max-w-7xl gap-10 px-6 py-16 md:px-12 lg:grid-cols-[.8fr_1.2fr]"><div><SectionLabel>05 / clan directory</SectionLabel><h2 className="font-display text-4xl tracking-[-.04em] md:text-6xl">Built by<br /><span className="text-lime-300">the best.</span></h2><p className="mt-6 max-w-sm text-sm leading-7 text-white/45">Find the organizations shaping the room. Rankings update as match results settle.</p><div className="relative mt-7 aspect-[16/7] overflow-hidden border border-lime-300/20"><img src="/manus-storage/meno-arena-keyart_ca264d4a.jpg" alt="Abstract Meno Arena competition circuit" className="h-full w-full object-cover opacity-55" /><div className="absolute inset-0 bg-gradient-to-r from-[#090a0b] via-[#090a0b]/25 to-transparent" /><div className="absolute bottom-3 left-4 font-mono text-[9px] uppercase tracking-[.18em] text-lime-300">Clan signal / global board</div></div><Button asChild variant="outline" className="mt-8 border-white/15 text-white hover:bg-white/10"><Link href="/dashboard/clan">Manage your clan <ChevronRight className="ml-2 h-4 w-4" /></Link></Button></div><Card className="border-white/10 bg-white/[.03]"><CardHeader className="flex-row items-center justify-between"><CardTitle className="font-display text-2xl">Global ranking</CardTitle><Trophy className="h-5 w-5 text-lime-300" /></CardHeader><CardContent className="space-y-1">{clans.map((clan, index) => <Link key={clan.tag} href={`/clans/${clan.slug}`} className="grid grid-cols-[32px_1fr_90px_60px] items-center gap-3 border-t border-white/10 py-4 text-sm transition-colors hover:bg-white/[.035]"><span className="font-mono text-xs text-white/35">0{index + 1}</span><span><strong className="block">{clan.name}</strong><span className="font-mono text-[10px] text-white/35">{clan.tag} · GLOBAL</span></span><strong>{clan.rating}</strong><span className={clan.delta.startsWith("+") ? "text-lime-300" : "text-red-300"}>{clan.delta}</span></Link>)}</CardContent></Card></section>

      <section id="media" className="scroll-mt-10 border-t border-white/10 bg-white/[.02] px-6 py-16 md:px-12"><div className="mx-auto max-w-7xl"><div className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between"><div><SectionLabel>06 / media gallery</SectionLabel><h2 className="font-display text-4xl tracking-[-.04em] md:text-6xl">Watch the room.</h2></div><div className="flex flex-wrap gap-2" aria-label="Filter media"><Button onClick={() => setMediaFilter("All")} size="sm" variant={mediaFilter === "All" ? "default" : "outline"} className={mediaFilter === "All" ? "bg-lime-300 text-black hover:bg-lime-200" : "border-white/15 text-white hover:bg-white/10"}>All</Button>{["Highlights", "Analysis", "Behind the scenes"].map(category => <Button key={category} onClick={() => setMediaFilter(category)} size="sm" variant="outline" className={mediaFilter === category ? "border-lime-300 bg-lime-300/10 text-lime-300" : "border-white/15 text-white hover:bg-white/10"}>{category}</Button>)}</div></div><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{visibleMedia.map(item => <button key={item.id} onClick={() => setActiveMedia(item)} className={`group relative min-h-80 overflow-hidden border border-white/10 bg-gradient-to-br ${item.tone} text-left transition-transform duration-300 hover:-translate-y-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-lime-300`}><img src={item.image} alt="" className="absolute inset-0 h-full w-full object-cover opacity-45 transition duration-500 group-hover:scale-105 group-hover:opacity-60" /><div className="absolute inset-0 bg-gradient-to-t from-[#090a0b] via-[#090a0b]/25 to-transparent" /><span className="relative flex h-full min-h-80 flex-col justify-between p-6"><span className="flex justify-between font-mono text-[10px] tracking-[.2em] text-white/65"><span>{item.id}</span><Flame className="h-4 w-4 text-lime-300" /></span><span><span className="font-mono text-[10px] tracking-[.2em] text-lime-300">{item.category}</span><strong className="mt-2 block font-display text-2xl leading-tight">{item.title}</strong><span className="mt-3 flex items-center font-mono text-[10px] uppercase tracking-[.16em] text-white/65">Open viewer <ChevronRight className="ml-1 h-3 w-3" /></span></span></span></button>)}</div></div></section>
      {activeMedia && <div className="fixed inset-0 z-50 grid place-items-center bg-black/85 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={activeMedia.title} onMouseDown={() => setActiveMedia(null)}><div className="relative max-h-[90vh] w-full max-w-5xl overflow-auto border border-white/15 bg-[#0d110d]" onMouseDown={event => event.stopPropagation()}><img src={activeMedia.image} alt={activeMedia.description} className="max-h-[65vh] w-full object-cover" /><div className="p-6 md:p-8"><div className="flex items-start justify-between gap-6"><div><p className="font-mono text-[10px] uppercase tracking-[.2em] text-lime-300">{activeMedia.category} / {activeMedia.id}</p><h2 className="mt-3 font-display text-4xl tracking-[-.05em]">{activeMedia.title}</h2><p className="mt-3 max-w-xl text-sm leading-6 text-white/55">{activeMedia.description}</p></div><Button onClick={() => setActiveMedia(null)} variant="outline" className="shrink-0 border-white/15 text-white hover:bg-white/10"><X className="mr-2 h-4 w-4" />Close</Button></div></div></div></div>}

      <footer className="mx-auto flex max-w-7xl flex-col gap-3 px-6 pt-10 font-mono text-[10px] uppercase tracking-[.2em] text-white/30 md:flex-row md:justify-between md:px-12"><span className="flex items-center gap-2"><ShieldCheck className="h-3 w-3 text-lime-300" /> Supabase secured · sandbox payments</span><span className="flex items-center gap-2"><Users className="h-3 w-3" /> 18,620 competitors already in the arena</span></footer>
    </main>
  );
}
