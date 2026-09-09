import { ClanTagBadge } from "@/components/ClanTagBadge";
import { cn } from "@/lib/utils";

export type StandingRowView = {
  teamId: number;
  team?: { id: number; name: string; tag: string; logoUrl?: string | null; clan?: { id?: number; tag: string; name?: string; verified?: boolean } | null } | null;
  played: number;
  wins: number;
  losses: number;
  draws: number;
  scoreFor: number;
  scoreAgainst: number;
  points: number;
  buchholz?: number;
};

export function StandingsTable({ rows, showBuchholz = false, className, highlightTeamId }: { rows: StandingRowView[]; showBuchholz?: boolean; className?: string; highlightTeamId?: number | null }) {
  if (!rows.length) return <p className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-sm text-white/40">Standings appear once the first results are confirmed.</p>;
  return (
    <div className={cn("overflow-x-auto rounded-2xl border border-white/10", className)}>
      <table className="w-full min-w-[560px] text-left text-sm">
        <thead className="bg-white/[0.03] font-mono text-[9px] uppercase tracking-[0.18em] text-white/40">
          <tr>
            <th className="px-4 py-3">#</th>
            <th className="px-4 py-3">Team</th>
            <th className="px-3 py-3 text-center">P</th>
            <th className="px-3 py-3 text-center">W</th>
            <th className="px-3 py-3 text-center">D</th>
            <th className="px-3 py-3 text-center">L</th>
            <th className="px-3 py-3 text-center">+/−</th>
            {showBuchholz && <th className="px-3 py-3 text-center">BH</th>}
            <th className="px-4 py-3 text-right">Pts</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={row.teamId} className={cn("border-t border-white/[0.06]", highlightTeamId === row.teamId && "bg-lime-300/[0.06]", index < 2 && "text-white", index >= 2 && "text-white/75")}>
              <td className="px-4 py-3 font-mono text-xs text-white/45">{String(index + 1).padStart(2, "0")}</td>
              <td className="px-4 py-3">
                <span className="inline-flex items-center gap-2">
                  <span className="grid h-7 w-7 place-items-center rounded-lg bg-white/10 font-mono text-[9px] font-bold text-white/70">{(row.team?.tag ?? "T").slice(0, 3)}</span>
                  <span className="font-semibold">{row.team?.name ?? `Team ${row.teamId}`}</span>
                  <ClanTagBadge clan={row.team?.clan} />
                </span>
              </td>
              <td className="px-3 py-3 text-center font-mono text-xs">{row.played}</td>
              <td className="px-3 py-3 text-center font-mono text-xs text-lime-200">{row.wins}</td>
              <td className="px-3 py-3 text-center font-mono text-xs">{row.draws}</td>
              <td className="px-3 py-3 text-center font-mono text-xs text-red-200/80">{row.losses}</td>
              <td className="px-3 py-3 text-center font-mono text-xs">{row.scoreFor - row.scoreAgainst > 0 ? "+" : ""}{row.scoreFor - row.scoreAgainst}</td>
              {showBuchholz && <td className="px-3 py-3 text-center font-mono text-xs text-white/50">{row.buchholz ?? 0}</td>}
              <td className="px-4 py-3 text-right font-mono text-sm font-bold">{row.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
