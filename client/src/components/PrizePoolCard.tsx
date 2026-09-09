import { Trophy } from "lucide-react";
import { formatCents, ordinal } from "@shared/arena";
import { StatusPill } from "@/components/StatusPill";
import { cn } from "@/lib/utils";

export type PrizeBreakdownView = {
  totalCents: number;
  baseCents: number;
  entryFeeContributionCents: number;
  sponsorContributionCents: number;
  placements: Array<{ placement: number; sharePercent: number; amountCents: number }>;
};

export type PayoutView = {
  id?: number;
  placement: number;
  amountCents: number;
  status: "pending" | "processing" | "paid";
  team?: { id: number; name: string; tag: string } | null;
};

export function PrizePoolCard({ prize, payouts = [], sponsorName, className }: { prize: PrizeBreakdownView; payouts?: PayoutView[]; sponsorName?: string | null; className?: string }) {
  const byPlacement = new Map(payouts.map(payout => [payout.placement, payout]));
  return (
    <section className={cn("rounded-3xl border border-white/10 bg-white/[0.03] p-6", className)}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/40">Prize pool</p>
          <p className="mt-2 font-display text-4xl tracking-[-0.05em] text-white">{formatCents(prize.totalCents)}</p>
        </div>
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-lime-300 text-black"><Trophy className="h-5 w-5" /></span>
      </div>
      <dl className="mt-5 grid grid-cols-3 gap-3 border-y border-white/10 py-4 text-xs">
        <div><dt className="text-white/40">Base pool</dt><dd className="mt-1 font-mono text-white">{formatCents(prize.baseCents)}</dd></div>
        <div><dt className="text-white/40">Entry fees</dt><dd className="mt-1 font-mono text-white">{formatCents(prize.entryFeeContributionCents)}</dd></div>
        <div><dt className="text-white/40">{sponsorName ? `Sponsor · ${sponsorName}` : "Sponsor"}</dt><dd className="mt-1 font-mono text-white">{formatCents(prize.sponsorContributionCents)}</dd></div>
      </dl>
      <ul className="mt-4 space-y-2">
        {prize.placements.map(row => {
          const payout = byPlacement.get(row.placement);
          return (
            <li key={row.placement} className="flex items-center gap-3 rounded-xl bg-white/[0.03] px-3 py-2.5">
              <span className={cn("grid h-8 w-8 place-items-center rounded-lg font-mono text-[10px] font-bold", row.placement === 1 ? "bg-lime-300 text-black" : "bg-white/10 text-white/70")}>{ordinal(row.placement)}</span>
              <span className="min-w-0 flex-1 text-sm text-white/80">
                {payout?.team ? <span className="truncate">{payout.team.name}</span> : <span className="text-white/35">{row.sharePercent}% of pool</span>}
              </span>
              <span className="font-mono text-sm text-white">{formatCents(payout?.amountCents ?? row.amountCents)}</span>
              {payout && <StatusPill status={payout.status} />}
            </li>
          );
        })}
      </ul>
      <p className="mt-4 text-[11px] leading-5 text-white/35">Payouts are tracked in sandbox mode. Real disbursement requires a secure payment provider to be connected.</p>
    </section>
  );
}
