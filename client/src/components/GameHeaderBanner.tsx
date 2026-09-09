import { useRef, type CSSProperties, type ReactNode } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { findGame, type GameDefinition } from "@shared/games";
import { cn } from "@/lib/utils";

const ACCENT: Record<GameDefinition["accent"], string> = {
  lime: "#d8ff62",
  blue: "#89c7ff",
  orange: "#ffab78",
  violet: "#c4a8ff",
};

const GRADIENT: Record<GameDefinition["accent"], string> = {
  lime: "linear-gradient(135deg, #142b2b 0%, #0f1719 52%, #252b16 100%)",
  blue: "linear-gradient(135deg, #172748 0%, #121c2a 58%, #1c1b37 100%)",
  orange: "linear-gradient(135deg, #302014 0%, #171819 58%, #342117 100%)",
  violet: "linear-gradient(135deg, #261a3d 0%, #151420 58%, #2a1a3a 100%)",
};

export function gameAccent(game: string | null | undefined): string {
  return ACCENT[findGame(game)?.accent ?? "lime"];
}

type GameHeaderBannerProps = {
  /** Game name, alias, or slug. Unknown games fall back to a neutral banner. */
  game: string | null | undefined;
  /** Override artwork (e.g. a tournament or clan banner). Falls back to the game's header image slot. */
  imageUrl?: string | null;
  /** "hero" = full page banner (21:9, parallax). "card" = compact 16:9 thumbnail. */
  variant?: "hero" | "card";
  className?: string;
  children?: ReactNode;
  /** Text shown in the placeholder slot when no image is supplied. */
  label?: string;
};

/**
 * Parallax-enabled header banner. Real game artwork is copyrighted, so when no
 * `imageUrl` is supplied the banner renders a labelled placeholder slot that is
 * already sized for the final crop — swapping in a real URL later requires no
 * layout changes. Motion is disabled for `prefers-reduced-motion`.
 */
export default function GameHeaderBanner({ game, imageUrl, variant = "hero", className, children, label }: GameHeaderBannerProps) {
  const definition = findGame(game);
  const accent = definition?.accent ?? "lime";
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const range = variant === "hero" ? 48 : 14;
  const y = useTransform(scrollYProgress, [0, 1], [-range, range]);
  const src = imageUrl ?? definition?.headerImage ?? null;
  const slotLabel = label ?? definition?.headerLabel ?? `[GAME_HEADER_IMAGE: ${game ?? "Unknown"}]`;

  return (
    <div
      ref={ref}
      className={cn("relative isolate overflow-hidden", variant === "hero" ? "aspect-[21/9] min-h-[260px] max-h-[520px] w-full" : "aspect-video w-full", className)}
      style={{ "--game-accent": ACCENT[accent] } as CSSProperties}
    >
      <motion.div className="absolute -inset-y-[12%] inset-x-0 will-change-transform" style={reduceMotion ? undefined : { y }}>
        {src ? (
          <img src={src} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full" style={{ background: GRADIENT[accent] }}>
            <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:56px_56px]" />
            <div className="absolute -right-[8%] top-1/2 h-[140%] w-[45%] -translate-y-1/2 rounded-full opacity-25 blur-3xl" style={{ background: ACCENT[accent] }} />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 select-none font-display text-[clamp(56px,14vw,180px)] font-semibold tracking-[-0.08em] text-white/[0.06]">{definition?.shortName ?? "MA"}</span>
          </div>
        )}
      </motion.div>
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(11,13,14,0.15)_0%,rgba(11,13,14,0.35)_55%,rgba(11,13,14,0.92)_100%)]" />
      {!src && (
        <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between border-t pt-2 font-mono text-[9px] uppercase tracking-[0.14em] text-white/35" style={{ borderColor: `color-mix(in srgb, ${ACCENT[accent]} 30%, transparent)` }}>
          <span>{slotLabel}</span>
          <i className="h-1.5 w-1.5 rotate-45 border" style={{ borderColor: ACCENT[accent] }} />
        </div>
      )}
      {children && <div className="absolute inset-0">{children}</div>}
    </div>
  );
}
