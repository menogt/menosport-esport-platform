import type { ReactNode } from "react";
import { Link } from "wouter";
import { ArrowUpRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/** Section heading in the arena visual language: mono eyebrow + display title + optional action link. */
export function PageHeading({ eyebrow, title, description, action, className }: { eyebrow?: string; title: ReactNode; description?: ReactNode; action?: { label: string; href: string } | ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-col gap-5 md:flex-row md:items-end md:justify-between", className)}>
      <div className="max-w-2xl">
        {eyebrow && <p className="section-label">{eyebrow}</p>}
        <h1 className="mt-3 font-display text-4xl font-semibold tracking-[-0.06em] text-white md:text-5xl">{title}</h1>
        {description && <p className="mt-4 max-w-xl text-sm leading-7 text-white/55">{description}</p>}
      </div>
      {action && (typeof action === "object" && action !== null && "href" in action ? <Link href={action.href} className="text-link inline-flex items-center gap-2 text-sm text-white/80">{action.label} <ArrowUpRight size={15} /></Link> : action)}
    </div>
  );
}

export function SectionTitle({ eyebrow, title, action, className }: { eyebrow?: string; title: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div className={cn("flex items-end justify-between gap-4", className)}>
      <div>
        {eyebrow && <p className="section-label">{eyebrow}</p>}
        <h2 className="mt-2 font-display text-2xl font-semibold tracking-[-0.05em] text-white md:text-3xl">{title}</h2>
      </div>
      {action}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, description, action, className }: { icon?: LucideIcon; title: string; description?: string; action?: ReactNode; className?: string }) {
  return (
    <div className={cn("grid place-items-center rounded-3xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-14 text-center", className)}>
      <div className="max-w-sm">
        {Icon && <Icon className="mx-auto h-8 w-8 text-white/20" />}
        <p className="mt-4 text-sm font-semibold text-white/70">{title}</p>
        {description && <p className="mt-2 text-xs leading-5 text-white/40">{description}</p>}
        {action && <div className="mt-5 flex justify-center">{action}</div>}
      </div>
    </div>
  );
}

export function Panel({ children, className, title, eyebrow, action }: { children: ReactNode; className?: string; title?: ReactNode; eyebrow?: string; action?: ReactNode }) {
  return (
    <section className={cn("rounded-3xl border border-white/10 bg-white/[0.03] p-5 md:p-6", className)}>
      {(title || eyebrow || action) && (
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            {eyebrow && <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/40">{eyebrow}</p>}
            {title && <h3 className="mt-1 font-display text-lg font-semibold tracking-[-0.03em] text-white">{title}</h3>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function Stat({ label, value, hint, className }: { label: string; value: ReactNode; hint?: ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-2xl border border-white/10 bg-white/[0.03] p-4", className)}>
      <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-white/40">{label}</p>
      <p className="mt-2 font-display text-2xl font-semibold tracking-[-0.04em] text-white">{value}</p>
      {hint && <p className="mt-1 text-[11px] text-white/40">{hint}</p>}
    </div>
  );
}

export function SkeletonBlock({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-2xl bg-white/[0.05]", className)} />;
}

export function ErrorNotice({ message, className }: { message: string; className?: string }) {
  return <div className={cn("rounded-2xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200", className)}>{message}</div>;
}
