import { Link } from "wouter";
import { ArrowUpRight, BadgeCheck, Heart, Trophy } from "lucide-react";
import { formatCents } from "@shared/arena";
import { GameThumb } from "@/components/GameThumb";
import { cn } from "@/lib/utils";

export type ClanCardView = {
  id: number;
  name: string;
  tag: string;
  region?: string | null;
  logoUrl?: string | null;
  bannerUrl?: string | null;
  verified?: boolean;
  followerCount?: number;
  trophies?: number;
  prizeEarningsCents?: number;
  teamCount?: number;
  games?: string[];
  foundedYear?: number | null;
};

const EMBLEM_TONES = ["#d8ff62", "#89c7ff", "#c4a8ff", "#ffab78"];

/** Shield-style placeholder emblem so no trademarked org logos are needed. */
export function ClanEmblem({ clan, size = "md", index = 0, className }: { clan: { name: string; tag: string; logoUrl?: string | null }; size?: "sm" | "md" | "lg" | "xl"; index?: number; className?: string }) {
  const tone = EMBLEM_TONES[index % EMBLEM_TONES.length];
  const sizes = { sm: "h-9 w-9 text-[9px]", md: "h-14 w-14 text-xs", lg: "h-20 w-20 text-base", xl: "h-28 w-28 text-xl" };
  return (
    <span className={cn("relative grid shrink-0 place-items-center overflow-hidden font-mono font-black tracking-[0.1em] text-black", sizes[size], className)} style={{ clipPath: "polygon(50% 0%, 100% 18%, 100% 62%, 50% 100%, 0% 62%, 0% 18%)", background: clan.logoUrl ? "#0d110d" : `linear-gradient(160deg, ${tone}, color-mix(in srgb, ${tone} 55%, #101410))` }}>
      {clan.logoUrl ? <img src={clan.logoUrl} alt={clan.name} className="h-full w-full object-cover" loading="lazy" /> : clan.tag.slice(0, 3)}
    </span>
  );
}

export function ClanCard({ clan, rank, index = 0, className }: { clan: ClanCardView; rank?: number; index?: number; className?: string }) {
  return (
    <Link href={`/clans/${clan.id}`} className={cn("group relative flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] transition-colors hover:border-lime-300/40", className)}>
      <div className="relative h-24 w-full overflow-hidden bg-[linear-gradient(135deg,#142b2b_0%,#0f1719_52%,#252b16_100%)]">
        {clan.bannerUrl && <img src={clan.bannerUrl} alt="" className="h-full w-full object-cover" loading="lazy" />}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent,rgba(11,13,14,0.9))]" />
        {rank != null && <span className="absolute left-4 top-3 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-white/50">#{String(rank).padStart(2, "0")}</span>}
      </div>
      <div className="-mt-8 flex items-end gap-4 px-5">
        <ClanEmblem clan={clan} size="lg" index={index} />
        <div className="min-w-0 flex-1 pb-1">
          <div className="flex items-center gap-1.5">
            <h3 className="truncate font-display text-xl font-semibold tracking-[-0.04em] text-white">{clan.name}</h3>
            {clan.verified && <BadgeCheck className="h-4 w-4 shrink-0 text-lime-300" aria-label="Verified" />}
          </div>
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/40">{clan.tag} · {clan.region ?? "Global"}{clan.foundedYear ? ` · est. ${clan.foundedYear}` : ""}</p>
        </div>
        <ArrowUpRight className="mb-2 h-4 w-4 text-white/25 transition-colors group-hover:text-lime-300" />
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2 border-t border-white/10 px-5 py-4 text-center">
        <div><p className="inline-flex items-center gap-1 font-display text-lg text-white"><Trophy className="h-3.5 w-3.5 text-lime-300" />{clan.trophies ?? 0}</p><p className="font-mono text-[9px] uppercase tracking-[0.16em] text-white/35">Trophies</p></div>
        <div><p className="font-display text-lg text-white">{formatCents(clan.prizeEarningsCents ?? 0)}</p><p className="font-mono text-[9px] uppercase tracking-[0.16em] text-white/35">Earnings</p></div>
        <div><p className="inline-flex items-center gap-1 font-display text-lg text-white"><Heart className="h-3.5 w-3.5 text-white/40" />{Intl.NumberFormat("en", { notation: "compact" }).format(clan.followerCount ?? 0)}</p><p className="font-mono text-[9px] uppercase tracking-[0.16em] text-white/35">Followers</p></div>
      </div>
      {clan.games?.length ? (
        <div className="flex flex-wrap items-center gap-1.5 px-5 pb-5">
          <span className="mr-1 font-mono text-[9px] uppercase tracking-[0.16em] text-white/35">{clan.teamCount ?? clan.games.length} rosters</span>
          {clan.games.map(game => <GameThumb key={game} game={game} />)}
        </div>
      ) : null}
    </Link>
  );
}
