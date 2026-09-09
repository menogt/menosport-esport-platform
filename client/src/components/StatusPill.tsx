import { cn } from "@/lib/utils";
import { MATCH_STATUS_LABELS, REPORT_STATUS_LABELS, TOURNAMENT_STATUS_LABELS } from "@shared/arena";

const TONES: Record<string, string> = {
  // tournaments
  draft: "border-white/15 bg-white/[0.04] text-white/55",
  registration: "border-lime-300/40 bg-lime-300/10 text-lime-200",
  checkin: "border-sky-300/40 bg-sky-300/10 text-sky-200",
  live: "border-lime-300/60 bg-lime-300/15 text-lime-200 shadow-[0_0_18px_rgba(216,255,98,0.15)]",
  completed: "border-white/15 bg-white/[0.06] text-white/70",
  cancelled: "border-red-400/40 bg-red-400/10 text-red-200",
  // matches
  upcoming: "border-white/15 bg-white/[0.04] text-white/60",
  waiting: "border-amber-300/40 bg-amber-300/10 text-amber-200",
  disputed: "border-red-400/40 bg-red-400/10 text-red-200",
  // registrations / reports / payouts / payments
  pending: "border-amber-300/40 bg-amber-300/10 text-amber-200",
  confirmed: "border-lime-300/40 bg-lime-300/10 text-lime-200",
  checked_in: "border-lime-300/60 bg-lime-300/15 text-lime-200",
  withdrawn: "border-white/15 bg-white/[0.04] text-white/40",
  submitted: "border-sky-300/40 bg-sky-300/10 text-sky-200",
  waiting_confirmation: "border-amber-300/40 bg-amber-300/10 text-amber-200",
  admin_resolved: "border-violet-300/40 bg-violet-300/10 text-violet-200",
  processing: "border-sky-300/40 bg-sky-300/10 text-sky-200",
  paid: "border-lime-300/40 bg-lime-300/10 text-lime-200",
  succeeded: "border-lime-300/40 bg-lime-300/10 text-lime-200",
  failed: "border-red-400/40 bg-red-400/10 text-red-200",
  refunded: "border-white/15 bg-white/[0.06] text-white/60",
  open: "border-red-400/40 bg-red-400/10 text-red-200",
  under_review: "border-amber-300/40 bg-amber-300/10 text-amber-200",
  resolved: "border-lime-300/40 bg-lime-300/10 text-lime-200",
  ready: "border-lime-300/40 bg-lime-300/10 text-lime-200",
  disconnected: "border-white/15 bg-white/[0.04] text-white/45",
  error: "border-red-400/40 bg-red-400/10 text-red-200",
};

const LABELS: Record<string, string> = {
  ...TOURNAMENT_STATUS_LABELS,
  ...MATCH_STATUS_LABELS,
  ...REPORT_STATUS_LABELS,
  pending: "Pending",
  confirmed: "Confirmed",
  checked_in: "Checked in",
  withdrawn: "Withdrawn",
  processing: "Processing",
  paid: "Paid",
  succeeded: "Succeeded",
  failed: "Failed",
  refunded: "Refunded",
  open: "Open",
  under_review: "Under review",
  resolved: "Resolved",
  ready: "Ready",
  disconnected: "Disconnected",
  error: "Error",
};

export function StatusPill({ status, label, className, pulse }: { status: string; label?: string; className?: string; pulse?: boolean }) {
  const isLive = status === "live";
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.16em]", TONES[status] ?? TONES.upcoming, className)}>
      {(isLive || pulse) && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" />}
      {label ?? LABELS[status] ?? status.replace(/_/g, " ")}
    </span>
  );
}
