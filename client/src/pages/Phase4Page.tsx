import DashboardLayout from "@/components/DashboardLayout";
import { ProductCard } from "@/components/ProductCard";
import { SponsorBanner } from "@/components/SponsorBanner";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { cartSubtotalCents, formatCurrency, type CartLine, type StoreProduct } from "@shared/phase4";
import { BrandMark } from "@/components/BrandMark";
import { BellRing, Bot, ChevronRight, CircleDot, Disc3, ExternalLink, Gamepad2, Radio, ShieldCheck, ShoppingBag, Twitch, UsersRound } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Link, useLocation } from "wouter";

type PhaseMode = "community" | "sponsors" | "store" | "analytics";

const pageCopy: Record<PhaseMode, { eyebrow: string; title: string; body: string }> = {
  community: { eyebrow: "PHASE 04 / COMMUNITY SIGNAL", title: "Bring the room with you.", body: "Discord roles, broadcast moments, and tournament calls designed as one community layer." },
  sponsors: { eyebrow: "PHASE 04 / PARTNER ACTIVATION", title: "Sponsor space, without the noise.", body: "Campaign surfaces designed for matches, brackets, clans, and the moments players actually return for." },
  store: { eyebrow: "PHASE 04 / MERCH BAY", title: "Wear your circuit.", body: "A storefront foundation for Meno Arena drops and future clan-branded merchandise." },
  analytics: { eyebrow: "ADMIN / CIRCUIT INTELLIGENCE", title: "See the circuit move.", body: "Operational signals for event health, player readiness, broadcast cadence, and competitive integrity." },
};

function LoadingPanel() {
  return <div className="h-52 animate-pulse border border-white/10 bg-white/[0.025]" />;
}

function Phase4Content({ mode }: { mode: PhaseMode }) {
  const community = trpc.community.hub.useQuery();
  const sponsors = trpc.sponsors.featured.useQuery();
  const store = trpc.store.catalog.useQuery();
  const analytics = trpc.analytics.overview.useQuery();
  const [cart, setCart] = useState<CartLine[]>([]);
  const copy = pageCopy[mode];
  const subtotal = useMemo(() => cartSubtotalCents(cart), [cart]);

  const addToCart = (product: StoreProduct) => {
    setCart(lines => {
      const existing = lines.find(line => line.id === product.id);
      return existing ? lines.map(line => line.id === product.id ? { ...line, quantity: line.quantity + 1 } : line) : [...lines, { ...product, quantity: 1 }];
    });
    toast.success(`${product.name} added to the demo cart.`);
  };

  return (
    <div className="min-h-screen overflow-hidden bg-[#070907] text-white">
      <header className="sticky top-0 z-30 border-b border-white/[0.07] bg-[#070907]/90 px-5 py-4 backdrop-blur-xl md:px-10">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-6">
          <Link href="/"><BrandMark /></Link>
          <nav className="hidden items-center gap-6 text-xs font-semibold uppercase tracking-[0.16em] text-white/45 md:flex">
            <Link href="/arena" className={mode === "community" ? "text-lime-300" : "hover:text-white"}>Arena</Link>
            <Link href="/clans" className="hover:text-white">Clans</Link>
            <Link href="/media" className="hover:text-white">Media</Link>
            <Link href="/sponsors" className={mode === "sponsors" ? "text-lime-300" : "hover:text-white"}>Partners</Link>
            <Link href="/store" className={mode === "store" ? "text-lime-300" : "hover:text-white"}>Store</Link>
            <Link href="/dashboard/admin" className={mode === "analytics" ? "text-lime-300" : "hover:text-white"}>Intel</Link>
          </nav>
          <Link href="/tournaments/live"><Button variant="outline" className="hidden border-white/15 bg-white/[0.03] text-white hover:bg-white/10 sm:flex">Live circuit<ChevronRight className="ml-2 h-4 w-4" /></Button></Link>
        </div>
        <nav className="mx-auto mt-3 flex max-w-[1440px] gap-4 overflow-x-auto border-t border-white/[0.07] pt-3 font-mono text-[9px] uppercase tracking-[0.16em] text-white/55 md:hidden"><Link href="/arena" className="shrink-0 hover:text-lime-300">Arena</Link><Link href="/clans" className="shrink-0 hover:text-lime-300">Clans</Link><Link href="/media" className="shrink-0 hover:text-lime-300">Media</Link><Link href="/sponsors" className="shrink-0 hover:text-lime-300">Partners</Link><Link href="/store" className="shrink-0 hover:text-lime-300">Store</Link></nav>
      </header>

      <main className="mx-auto max-w-[1440px] px-5 pb-20 pt-12 md:px-10 md:pt-16">
        <section className="grid gap-10 border-b border-white/[0.08] pb-12 md:grid-cols-[minmax(0,1.25fr)_minmax(18rem,0.75fr)] md:items-end">
          <div>
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-lime-300">{copy.eyebrow}</p>
            <h1 className="mt-5 max-w-3xl font-display text-5xl leading-[0.9] tracking-[-0.065em] text-white md:text-7xl">{copy.title}</h1>
          </div>
          <p className="max-w-md text-sm leading-7 text-white/55 md:pb-1">{copy.body}</p>
        </section>

        {mode === "community" && (
          <div className="mt-10 grid gap-12 lg:grid-cols-[minmax(0,1.15fr)_minmax(21rem,0.85fr)]">
            <section>
              <div className="flex items-end justify-between gap-4"><div><p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">Integration console</p><h2 className="mt-2 font-display text-3xl tracking-[-0.05em]">Connection-ready. Provider-safe.</h2></div><Bot className="h-7 w-7 text-lime-300" /></div>
              <div className="mt-6 divide-y divide-white/10 border-y border-white/10">
                {community.isLoading ? <LoadingPanel /> : community.data?.integrations.map(integration => (
                  <article key={`${integration.provider}-${integration.title}`} className="grid gap-4 py-5 md:grid-cols-[2.5rem_1fr_auto] md:items-center">
                    <div className={`grid h-10 w-10 place-items-center rounded-full ${integration.provider === "discord" ? "bg-[#5865f2]/15 text-[#93a0ff]" : "bg-fuchsia-400/10 text-fuchsia-300"}`}>{integration.provider === "discord" ? <Disc3 className="h-4 w-4" /> : <Twitch className="h-4 w-4" />}</div>
                    <div><div className="flex items-center gap-2"><h3 className="font-semibold text-white">{integration.title}</h3><span className={`rounded-full px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.12em] ${integration.state === "ready" ? "bg-lime-300/10 text-lime-300" : "bg-amber-300/10 text-amber-200"}`}>{integration.state}</span></div><p className="mt-1 text-xs leading-5 text-white/45">{integration.detail}</p></div>
                    <Button onClick={() => toast.message(`${integration.action} is a Phase 4 connection placeholder.`)} variant="outline" size="sm" className="border-white/15 bg-white/[0.025] text-white hover:bg-white/10">{integration.action}<ExternalLink className="ml-2 h-3.5 w-3.5" /></Button>
                  </article>
                ))}
              </div>
            </section>
            <aside className="bg-[#0d110d] p-6 md:p-7"><div className="flex items-center justify-between"><div><p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">Broadcast relay</p><h2 className="mt-2 font-display text-2xl tracking-[-0.04em]">On air / next up</h2></div><Radio className="h-6 w-6 text-red-300" /></div><div className="mt-7 space-y-1">{community.isLoading ? <LoadingPanel /> : community.data?.streamSchedule.map(slot => <div key={slot.id} className="flex gap-4 border-t border-white/10 py-4"><div className="w-16 shrink-0 font-mono text-[10px] text-white/40">{slot.startsAt}</div><div className="min-w-0 flex-1"><p className="font-mono text-[9px] uppercase tracking-[0.14em] text-lime-300">{slot.game} · {slot.status}</p><p className="mt-1 text-sm font-semibold text-white">{slot.match}</p><p className="mt-1 text-xs text-white/40">/{slot.channel}</p></div></div>)}</div><Button onClick={() => toast.message("Twitch embed activation is awaiting a channel connection.")} className="mt-4 w-full bg-lime-300 text-black hover:bg-lime-200"><Twitch className="mr-2 h-4 w-4" />Open broadcast room</Button></aside>
          </div>
        )}

        {mode === "sponsors" && (
          <div className="mt-10 space-y-10">
            {sponsors.isLoading ? <LoadingPanel /> : sponsors.data?.slice(0, 1).map(campaign => <SponsorBanner key={campaign.id} campaign={campaign} />)}
            <section className="grid gap-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]"><div><p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">Activation map</p><h2 className="mt-2 font-display text-3xl tracking-[-0.05em]">Built into competitive moments.</h2><p className="mt-4 max-w-md text-sm leading-7 text-white/50">Sponsor placements are designed as context-aware modules rather than generic ad slots. Campaign metadata is ready for tournament, bracket, clan, and landing-page surfaces.</p><Button onClick={() => toast.message("Partner inquiries will connect to a CRM in a later integration step.")} className="mt-7 bg-white text-black hover:bg-white/90">Request partner deck<ChevronRight className="ml-2 h-4 w-4" /></Button></div><div className="space-y-3">{sponsors.data?.slice(1).map(campaign => <SponsorBanner key={campaign.id} campaign={campaign} compact />)}</div></section>
          </div>
        )}

        {mode === "store" && (
          <div className="mt-10 grid gap-12 lg:grid-cols-[minmax(0,1fr)_20rem]">
            <section><div className="flex items-end justify-between"><div><p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">Catalog / preview</p><h2 className="mt-2 font-display text-3xl tracking-[-0.05em]">Clan colors, arena runs.</h2></div><ShoppingBag className="h-6 w-6 text-lime-300" /></div><div className="mt-6">{store.isLoading ? <LoadingPanel /> : store.data?.map(product => <ProductCard key={product.id} product={product} onAdd={addToCart} />)}</div></section>
            <aside className="h-fit border border-white/10 bg-[#0d110d] p-6 lg:sticky lg:top-24"><div className="flex items-center justify-between"><p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">Demo cart</p><span className="grid h-7 min-w-7 place-items-center rounded-full bg-lime-300 px-2 text-xs font-bold text-black">{cart.reduce((total, item) => total + item.quantity, 0)}</span></div>{cart.length === 0 ? <div className="py-10"><ShoppingBag className="h-7 w-7 text-white/25" /><p className="mt-4 text-sm text-white/50">Your cart is waiting for a drop.</p></div> : <div className="mt-5 space-y-3">{cart.map(line => <div key={line.id} className="flex items-start justify-between gap-3 text-sm"><div><p className="font-medium text-white">{line.name}</p><p className="mt-1 font-mono text-[10px] text-white/40">Qty {line.quantity}</p></div><span className="font-mono text-xs text-white/70">{formatCurrency(line.priceCents * line.quantity)}</span></div>)}</div>}<div className="mt-6 border-t border-white/10 pt-4"><div className="flex justify-between font-mono text-xs text-white/55"><span>Subtotal</span><span className="text-white">{formatCurrency(subtotal)}</span></div><Button onClick={() => toast.message("Checkout is intentionally disabled until a payment provider is connected.")} disabled={cart.length === 0} className="mt-5 w-full bg-lime-300 text-black hover:bg-lime-200 disabled:bg-white/10 disabled:text-white/35">Checkout placeholder</Button><p className="mt-3 text-[11px] leading-5 text-white/35">No payment details are collected in this sandbox storefront.</p></div></aside>
          </div>
        )}

        {mode === "analytics" && (
          <div className="mt-10"><section className="grid gap-8 border-b border-white/10 pb-10 md:grid-cols-[minmax(0,1.1fr)_minmax(16rem,0.9fr)]"><div><p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">Live operations / sample telemetry</p><div className="mt-5 flex items-center gap-3"><span className="relative flex h-3 w-3"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-lime-300 opacity-50" /><span className="relative inline-flex h-3 w-3 rounded-full bg-lime-300" /></span><p className="text-sm text-white/65">Circuit telemetry is collecting metadata only. No third-party broadcast API is active.</p></div></div><div className="border-l border-white/10 pl-6"><p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">Integrity queue</p><p className="mt-3 font-display text-4xl tracking-[-0.06em] text-white">04</p><p className="mt-2 text-xs leading-5 text-white/45">Reports ready for review across the current competitive window.</p></div></section><div className="mt-8 grid gap-x-8 gap-y-6 md:grid-cols-2 xl:grid-cols-4">{analytics.isLoading ? <LoadingPanel /> : analytics.data?.map(metric => <StatCard key={metric.label} metric={metric} />)}</div><section className="mt-12 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.75fr)]"><div className="border border-white/10 bg-[linear-gradient(135deg,rgba(190,242,100,0.08),transparent_45%)] p-6"><div className="flex items-center justify-between"><div><p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">Event readiness</p><h2 className="mt-2 font-display text-2xl tracking-[-0.04em]">The next 72 hours</h2></div><Gamepad2 className="h-6 w-6 text-lime-300" /></div><div className="mt-9 grid h-32 grid-cols-8 items-end gap-2">{[34, 47, 38, 68, 54, 83, 64, 92].map((height, index) => <div key={index} className="bg-lime-300/15 p-[1px]"><div className="bg-lime-300" style={{ height: `${height}%` }} /></div>)}</div><div className="mt-4 flex justify-between font-mono text-[9px] uppercase tracking-[0.16em] text-white/35"><span>Registration</span><span>Check-in</span><span>Live</span></div></div><div className="bg-[#0d110d] p-6"><UsersRound className="h-6 w-6 text-lime-300" /><h3 className="mt-5 font-display text-2xl tracking-[-0.04em]">Audience segments</h3><p className="mt-3 text-sm leading-6 text-white/50">Retention, partner attribution, and stream referrals become live once provider integrations are configured. This panel intentionally uses sandbox metrics.</p><Button onClick={() => toast.message("Analytics exports are a planned provider connection.")} variant="outline" className="mt-6 border-white/15 bg-white/[0.025] text-white hover:bg-white/10"><BellRing className="mr-2 h-4 w-4" />Configure alerting</Button></div></section></div>
        )}
      </main>
    </div>
  );
}

export default function Phase4Page() {
  const [location] = useLocation();
  const mode: PhaseMode = location === "/sponsors" ? "sponsors" : location === "/store" ? "store" : location === "/dashboard/admin" ? "analytics" : "community";
  if (mode === "analytics") return <DashboardLayout><Phase4Content mode={mode} /></DashboardLayout>;
  return <Phase4Content mode={mode} />;
}
