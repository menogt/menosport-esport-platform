import { GAMES, findGame } from "@shared/games";
import { cn } from "@/lib/utils";

/**
 * Single source of truth for picking a game. Stores the canonical game name
 * from the shared catalog so profiles, teams, tournaments, hubs, and filters
 * all link on the same value.
 */
export function GameSelect({ value, onChange, required, allowAny = false, className, id }: { value: string; onChange: (game: string) => void; required?: boolean; allowAny?: boolean; className?: string; id?: string }) {
  const canonical = findGame(value)?.name ?? "";
  return (
    <select
      id={id}
      required={required}
      value={canonical}
      onChange={event => onChange(event.target.value)}
      className={cn("mt-2 h-10 w-full rounded-md border border-white/10 bg-white/[0.04] px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-lime-300/60 [&>option]:bg-[#101510]", className)}
    >
      <option value="" disabled={!allowAny}>{allowAny ? "All games" : "Select a game"}</option>
      {GAMES.map(game => <option key={game.slug} value={game.name}>{game.name}</option>)}
    </select>
  );
}
