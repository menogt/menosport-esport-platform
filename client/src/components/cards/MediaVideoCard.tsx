import { Eye, Heart, Play, Share2 } from "lucide-react";
import { toast } from "sonner";
import type { MediaKind } from "@shared/arena";
import { gameAccent } from "@/components/GameHeaderBanner";
import { cn } from "@/lib/utils";

export type MediaCardView = {
  id: number;
  title: string;
  description?: string | null;
  kind: MediaKind;
  game?: string | null;
  tags?: string[];
  views: number;
  likes: number;
  durationSeconds?: number | null;
  assetUrl?: string | null;
  thumbnailUrl?: string | null;
  uploader?: { name?: string | null; handle?: string | null } | null;
  clan?: { name?: string; tag: string } | null;
  liked?: boolean;
};

const KIND_LABEL: Record<MediaKind, string> = { short: "Short", reel: "Reel", highlight: "Highlight", meme: "Meme", reaction: "Reaction", promo: "Promo" };

function formatDuration(seconds?: number | null) {
  if (!seconds) return null;
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

const compact = (value: number) => Intl.NumberFormat("en", { notation: "compact" }).format(value);

/** Vertical 9:16 media card with hover preview, tags, views, likes, and share. */
export function MediaVideoCard({ media, onOpen, onLike, className }: { media: MediaCardView; onOpen?: (media: MediaCardView) => void; onLike?: (media: MediaCardView) => void; className?: string }) {
  const accent = gameAccent(media.game);
  const isVideo = media.assetUrl && /\.(mp4|webm)(\?|$)/i.test(media.assetUrl);
  const share = async (event: React.MouseEvent) => {
    event.stopPropagation();
    const url = `${window.location.origin}/media?item=${media.id}`;
    try {
      if (navigator.share) await navigator.share({ title: media.title, url });
      else { await navigator.clipboard.writeText(url); toast.success("Link copied"); }
    } catch { /* user cancelled */ }
  };
  return (
    <article className={cn("group relative aspect-[9/16] cursor-pointer overflow-hidden rounded-3xl border border-white/10 bg-[#101412]", className)} onClick={() => onOpen?.(media)}>
      {media.thumbnailUrl ? (
        <img src={media.thumbnailUrl} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
      ) : (
        <div className="absolute inset-0" style={{ background: `linear-gradient(160deg, color-mix(in srgb, ${accent} 28%, #0d110d) 0%, #0b0d0e 60%, color-mix(in srgb, ${accent} 12%, #0b0d0e) 100%)` }}>
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 font-display text-[88px] font-semibold tracking-[-0.08em] text-white/[0.06]">{(media.clan?.tag ?? media.kind).slice(0, 3).toUpperCase()}</span>
        </div>
      )}
      {isVideo && media.assetUrl && <video src={media.assetUrl} muted loop playsInline preload="none" className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-300 group-hover:opacity-100" onMouseEnter={event => void event.currentTarget.play().catch(() => undefined)} onMouseLeave={event => event.currentTarget.pause()} />}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(11,13,14,0.2)_0%,transparent_35%,rgba(11,13,14,0.95)_100%)]" />
      <div className="absolute left-3 top-3 flex items-center gap-2">
        <span className="rounded-full bg-black/50 px-2 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-white/80 backdrop-blur">{KIND_LABEL[media.kind]}</span>
        {media.durationSeconds ? <span className="rounded-full bg-black/50 px-2 py-1 font-mono text-[9px] text-white/70 backdrop-blur">{formatDuration(media.durationSeconds)}</span> : null}
      </div>
      <span className="absolute left-1/2 top-1/2 grid h-14 w-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-white/20 bg-black/40 text-white opacity-0 backdrop-blur transition-opacity group-hover:opacity-100"><Play className="ml-0.5 h-5 w-5" fill="currentColor" /></span>
      <div className="absolute inset-x-0 bottom-0 p-4">
        <p className="line-clamp-2 font-display text-base font-semibold leading-tight tracking-[-0.03em] text-white">{media.title}</p>
        <p className="mt-1 truncate font-mono text-[10px] uppercase tracking-[0.14em] text-white/45">{media.clan?.name ?? media.uploader?.handle ?? media.uploader?.name ?? "Meno Arena"}{media.game ? ` · ${media.game}` : ""}</p>
        {media.tags?.length ? <div className="mt-2 flex flex-wrap gap-1">{media.tags.slice(0, 3).map(tag => <span key={tag} className="rounded-md bg-white/10 px-1.5 py-0.5 font-mono text-[9px] text-white/60">#{tag}</span>)}</div> : null}
        <div className="mt-3 flex items-center gap-3 font-mono text-[10px] text-white/60">
          <span className="inline-flex items-center gap-1"><Eye className="h-3.5 w-3.5" />{compact(media.views)}</span>
          <button type="button" onClick={event => { event.stopPropagation(); onLike?.(media); }} className={cn("inline-flex items-center gap-1 transition-colors hover:text-lime-300", media.liked && "text-lime-300")}><Heart className="h-3.5 w-3.5" fill={media.liked ? "currentColor" : "none"} />{compact(media.likes)}</button>
          <button type="button" onClick={share} className="ml-auto inline-flex items-center gap-1 transition-colors hover:text-lime-300"><Share2 className="h-3.5 w-3.5" /> Share</button>
        </div>
      </div>
    </article>
  );
}
