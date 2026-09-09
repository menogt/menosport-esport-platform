import type { MediaKind } from "@shared/arena";
import { gameSlugFor } from "@shared/games";
import { camel, camelRows, clean, db, fail, forbidden, hasDb, notFound } from "./_shared";
import { clansById, gameMatches, isAdmin, safeFilter, userLabel, usersById, type Viewer } from "./lookups";
import { fallbackMedia } from "./seed";

export type MediaSort = "latest" | "views" | "likes";

type MediaRow = {
  id: number; uploadedBy: number; title: string; description: string | null; assetUrl: string; thumbnailUrl: string | null; kind: MediaKind; game: string | null;
  tags: string[]; views: number; likes: number; durationSeconds: number | null; published: boolean; clanId: number | null; tournamentId: number | null; createdAt: Date;
};

async function decorate(rows: Record<string, any>[]) {
  const assets = camelRows<MediaRow>(rows);
  const [users, clans] = await Promise.all([usersById(assets.map(asset => asset.uploadedBy)), clansById(assets.map(asset => asset.clanId))]);
  return assets.map(asset => {
    const uploader = users.get(asset.uploadedBy);
    const clan = asset.clanId ? clans.get(asset.clanId) : null;
    return {
      ...asset,
      tags: asset.tags ?? [],
      gameSlug: gameSlugFor(asset.game),
      uploader: { name: userLabel(uploader), handle: uploader?.handle ?? null, avatarUrl: uploader?.avatarUrl ?? null },
      clan: clan ? { name: clan.name, tag: clan.tag } : null,
    };
  });
}

export async function listMedia(input: { kind?: MediaKind; game?: string; clanId?: number; tag?: string; sort?: MediaSort; limit?: number }) {
  const limit = input.limit ?? 40;
  const sort = input.sort ?? "latest";
  const sorters: Record<MediaSort, (a: { views: number; likes: number; createdAt: Date }, b: { views: number; likes: number; createdAt: Date }) => number> = {
    latest: (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    views: (a, b) => b.views - a.views,
    likes: (a, b) => b.likes - a.likes,
  };
  if (!hasDb()) {
    return fallbackMedia()
      .filter(asset => !input.kind || asset.kind === input.kind)
      .filter(asset => gameMatches(asset.game, input.game, gameSlugFor))
      .filter(asset => !input.clanId || asset.clanId === input.clanId)
      .filter(asset => !input.tag || asset.tags.map(tag => tag.toLowerCase()).includes(input.tag.toLowerCase()))
      .sort(sorters[sort])
      .slice(0, limit);
  }
  let query = db().from("media_assets").select("*").eq("published", true);
  if (input.kind) query = query.eq("kind", input.kind);
  if (input.clanId) query = query.eq("clan_id", input.clanId);
  if (input.tag) query = query.contains("tags", [input.tag.toLowerCase()]);
  const column = sort === "views" ? "views" : sort === "likes" ? "likes" : "created_at";
  query = query.order(column, { ascending: false }).limit(input.game ? Math.max(limit * 4, 200) : limit);
  const { data, error } = await query;
  if (error) fail(error, "Media lookup failed");
  const rows = (data ?? []).filter((row: any) => gameMatches(row.game, input.game, gameSlugFor)).slice(0, limit);
  return decorate(rows);
}

export async function getMedia(mediaId: number, viewer: Viewer | null) {
  if (!hasDb()) {
    const asset = fallbackMedia().find(entry => entry.id === mediaId);
    if (!asset) notFound("Media");
    return { ...asset, liked: false };
  }
  const { data, error } = await db().from("media_assets").select("*").eq("id", mediaId).maybeSingle();
  if (error) fail(error, "Media lookup failed");
  if (!data) notFound("Media");
  const canSeeUnpublished = viewer && (isAdmin(viewer) || Number(data.uploaded_by) === viewer.id);
  if (!data.published && !canSeeUnpublished) notFound("Media");

  // Best-effort view counter; a failed increment must never fail the read.
  const nextViews = Number(data.views ?? 0) + 1;
  void db().from("media_assets").update({ views: nextViews }).eq("id", mediaId).then(result => {
    if (result.error) console.warn("[Media] view increment failed:", result.error.message);
  });

  let liked = false;
  if (viewer) {
    const like = await db().from("media_likes").select("media_id").eq("media_id", mediaId).eq("user_id", viewer.id).maybeSingle();
    if (like.error) fail(like.error, "Like lookup failed");
    liked = Boolean(like.data);
  }
  const [asset] = await decorate([{ ...data, views: nextViews }]);
  return { ...asset!, liked };
}

export async function createMedia(viewer: Viewer, input: { title: string; description?: string; assetUrl: string; thumbnailUrl?: string; kind: MediaKind; game?: string; tags?: string[]; durationSeconds?: number; clanId?: number; tournamentId?: number }) {
  const tags = Array.from(new Set((input.tags ?? []).map(tag => tag.trim().toLowerCase().replace(/^#/, "")).filter(Boolean))).slice(0, 12);
  const { data, error } = await db().from("media_assets").insert({
    uploaded_by: viewer.id, title: input.title.trim(), description: clean(input.description), asset_url: input.assetUrl.trim(), thumbnail_url: clean(input.thumbnailUrl),
    kind: input.kind, game: clean(input.game), tags, duration_seconds: input.durationSeconds ?? null, clan_id: input.clanId ?? null, tournament_id: input.tournamentId ?? null, published: true,
  }).select().single();
  if (error) fail(error, "Media upload failed");
  const [asset] = await decorate([data]);
  return { ...asset!, liked: false };
}

export async function toggleMediaLike(viewer: Viewer, mediaId: number) {
  const existing = await db().from("media_likes").select("media_id").eq("media_id", mediaId).eq("user_id", viewer.id).maybeSingle();
  if (existing.error) fail(existing.error, "Like lookup failed");
  if (existing.data) {
    const { error } = await db().from("media_likes").delete().eq("media_id", mediaId).eq("user_id", viewer.id);
    if (error) fail(error, "Unlike failed");
  } else {
    const asset = await db().from("media_assets").select("id, published").eq("id", mediaId).maybeSingle();
    if (asset.error) fail(asset.error, "Media lookup failed");
    if (!asset.data) notFound("Media");
    const { error } = await db().from("media_likes").insert({ media_id: mediaId, user_id: viewer.id });
    if (error) fail(error, "Like failed");
  }
  const { data, error } = await db().from("media_assets").select("likes").eq("id", mediaId).single();
  if (error) fail(error, "Like count failed");
  return { liked: !existing.data, likes: Number(data.likes ?? 0) };
}

export async function listMyMedia(viewer: Viewer) {
  if (!hasDb()) return [];
  const { data, error } = await db().from("media_assets").select("*").eq("uploaded_by", viewer.id).order("created_at", { ascending: false }).limit(100);
  if (error) fail(error, "Media lookup failed");
  return decorate(data ?? []);
}

export async function removeMedia(viewer: Viewer, mediaId: number) {
  const { data, error } = await db().from("media_assets").select("id, uploaded_by").eq("id", mediaId).maybeSingle();
  if (error) fail(error, "Media lookup failed");
  if (!data) notFound("Media");
  if (Number(data.uploaded_by) !== viewer.id && !isAdmin(viewer)) forbidden("Only the uploader or an admin can remove this clip.");
  const removal = await db().from("media_assets").delete().eq("id", mediaId);
  if (removal.error) fail(removal.error, "Media removal failed");
  return { success: true as const };
}

export const mediaSearchTerm = (value: string) => safeFilter(value);
export const presentMediaRow = (row: Record<string, any>) => camel<MediaRow>(row);
