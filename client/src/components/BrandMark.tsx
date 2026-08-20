import { cn } from "@/lib/utils";

const markUrl = "/manus-storage/meno-arena-mark_57f6bc9f.png";

export function BrandMark({ compact = false, className }: { compact?: boolean; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)} aria-label="Meno Arena">
      <span className="grid h-8 w-8 place-items-center border border-lime-300/60 bg-lime-300/5 p-1.5 shadow-[0_0_18px_rgba(190,242,100,0.14)]">
        <img src={markUrl} alt="" className="h-full w-full object-contain" />
      </span>
      {!compact && <span className="font-display text-sm font-semibold tracking-[0.16em] text-white">MENO<span className="text-lime-300">ARENA</span></span>}
    </span>
  );
}
