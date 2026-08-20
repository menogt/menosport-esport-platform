import { ArrowUpRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SponsorCampaign } from "@shared/phase4";
import { toast } from "sonner";

const toneClass = {
  lime: "border-lime-300/25 bg-lime-300/[0.07]",
  amber: "border-amber-200/25 bg-amber-200/[0.07]",
  steel: "border-sky-200/20 bg-sky-200/[0.06]",
};

export function SponsorBanner({ campaign, compact = false }: { campaign: SponsorCampaign; compact?: boolean }) {
  return (
    <section className={`relative overflow-hidden border ${toneClass[campaign.tone]} ${compact ? "p-5" : "p-6 md:p-8"}`}>
      <div className="absolute inset-y-0 right-0 w-[42%] bg-[linear-gradient(120deg,transparent,rgba(255,255,255,0.07))]" />
      <div className="relative grid gap-6 md:grid-cols-[auto_1fr_auto] md:items-center">
        <div className="grid h-14 w-14 place-items-center rounded-full border border-white/15 bg-[#0d110d] font-mono text-sm font-bold tracking-[0.16em] text-white">{campaign.mark}</div>
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/40">Presented with {campaign.name}</p>
          <h2 className="mt-2 font-display text-2xl tracking-[-0.04em] text-white md:text-3xl">{campaign.headline}</h2>
          {!compact && <p className="mt-2 max-w-2xl text-sm leading-6 text-white/55">{campaign.body}</p>}
        </div>
        <Button onClick={() => toast.message(`${campaign.cta} is an integration-ready partner action; CRM routing is not connected yet.`)} variant="outline" className="w-fit border-white/15 bg-white/[0.03] text-white hover:bg-white/10"><Sparkles className="mr-2 h-4 w-4 text-lime-300" />{campaign.cta}<ArrowUpRight className="ml-2 h-4 w-4" /></Button>
      </div>
    </section>
  );
}
