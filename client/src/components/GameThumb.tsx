import { findGame } from "@shared/games";
import { cn } from "@/lib/utils";
import { gameAccent } from "@/components/GameHeaderBanner";

/** Tiny game badge for tournament cards, match cards, and clan sub-team rows. */
export function GameThumb({ game, size = "sm", className }: { game: string | null | undefined; size?: "sm" | "md"; className?: string }) {
  const definition = findGame(game);
  const accent = gameAccent(game);
  const initials = definition?.shortName ?? (game ?? "??").slice(0, 2).toUpperCase();
  return (
    <span
      className={cn("inline-grid shrink-0 place-items-center overflow-hidden rounded-md border font-mono font-bold tracking-[0.08em] text-white/80", size === "sm" ? "h-6 w-9 text-[8px]" : "h-9 w-14 text-[10px]", className)}
      style={{ borderColor: `color-mix(in srgb, ${accent} 35%, transparent)`, background: `linear-gradient(135deg, color-mix(in srgb, ${accent} 22%, #101412), #0d1110)` }}
      title={definition?.name ?? game ?? undefined}
    >
      {definition?.headerImage ? <img src={definition.headerImage} alt="" className="h-full w-full object-cover" loading="lazy" /> : initials}
    </span>
  );
}
