import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import type { AnalyticsMetric } from "@shared/phase4";

export function StatCard({ metric }: { metric: AnalyticsMetric }) {
  const DeltaIcon = metric.direction === "up" ? ArrowUpRight : metric.direction === "down" ? ArrowDownRight : Minus;
  const deltaTone = metric.direction === "down" && metric.label !== "Open dispute rate" ? "text-red-300" : metric.direction === "neutral" ? "text-white/40" : "text-lime-300";
  return (
    <article className="border-t border-white/10 pt-4">
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/40">{metric.label}</p>
      <div className="mt-3 flex items-end justify-between gap-4"><strong className="font-display text-3xl tracking-[-0.05em] text-white">{metric.value}</strong><span className={`flex items-center gap-1 font-mono text-xs ${deltaTone}`}><DeltaIcon className="h-3.5 w-3.5" />{metric.delta}</span></div>
      <p className="mt-2 text-xs leading-5 text-white/40">{metric.detail}</p>
    </article>
  );
}
