import { useEffect, useState } from "react";
import { CheckCircle2, Clock3, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function countdown(target: Date) {
  const diff = Math.max(0, target.getTime() - Date.now());
  const hours = Math.floor(diff / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

type CheckInButtonProps = {
  status: "pending" | "confirmed" | "checked_in" | "withdrawn" | null;
  /** Whether the tournament currently accepts check-ins. */
  open: boolean;
  opensAt?: Date | string | null;
  checkedInAt?: Date | string | null;
  onCheckIn: () => void;
  pending?: boolean;
  className?: string;
};

export function CheckInButton({ status, open, opensAt, checkedInAt, onCheckIn, pending, className }: CheckInButtonProps) {
  const target = opensAt ? new Date(opensAt) : null;
  const [tick, setTick] = useState(() => (target ? countdown(target) : ""));
  useEffect(() => {
    if (!target || open) return;
    const id = window.setInterval(() => setTick(countdown(target)), 1000);
    return () => window.clearInterval(id);
  }, [target, open]);

  if (status === "checked_in") {
    return <div className={cn("inline-flex h-12 items-center gap-2 rounded-xl border border-lime-300/40 bg-lime-300/10 px-4 font-semibold text-lime-200", className)}><CheckCircle2 className="h-4 w-4" /> Checked in{checkedInAt ? ` · ${new Date(checkedInAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : ""}</div>;
  }
  if (!status || status === "withdrawn") return null;
  if (!open) {
    return <div className={cn("inline-flex h-12 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 font-mono text-xs text-white/55", className)}><Clock3 className="h-4 w-4" /> Check-in {target && target.getTime() > Date.now() ? `opens in ${tick}` : "not open yet"}</div>;
  }
  return <Button onClick={onCheckIn} disabled={pending} className={cn("h-12 rounded-xl bg-lime-300 px-5 font-semibold text-black hover:bg-lime-200", className)}><LogIn className="mr-2 h-4 w-4" />{pending ? "Checking in…" : "Check in now"}</Button>;
}
