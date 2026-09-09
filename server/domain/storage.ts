import { nanoid } from "nanoid";
import { badRequest, db, fail } from "./_shared";

export const STORAGE_BUCKETS = ["avatars", "team-assets", "clan-assets", "match-proof", "media"] as const;
export type StorageBucket = (typeof STORAGE_BUCKETS)[number];

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const ALLOWED_TYPES: Record<StorageBucket, string[]> = {
  avatars: IMAGE_TYPES,
  "team-assets": IMAGE_TYPES,
  "clan-assets": IMAGE_TYPES,
  "match-proof": IMAGE_TYPES,
  media: [...IMAGE_TYPES, "image/gif", "video/mp4", "video/webm"],
};

export function sanitizeFileName(fileName: string): string {
  const base = fileName.split(/[\\/]/).pop() ?? "upload";
  const cleaned = base.toLowerCase().replace(/[^a-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "").replace(/-{2,}/g, "-");
  const trimmed = cleaned.slice(-80);
  return trimmed || "upload";
}

export function assertContentType(bucket: StorageBucket, contentType: string) {
  const normalized = contentType.trim().toLowerCase();
  if (!ALLOWED_TYPES[bucket].includes(normalized)) {
    badRequest(`Files of type ${contentType} are not allowed in ${bucket}. Allowed: ${ALLOWED_TYPES[bucket].join(", ")}.`);
  }
  return normalized;
}

export function buildObjectPath(userId: number, fileName: string) {
  return `${userId}/${Date.now()}-${nanoid(8)}-${sanitizeFileName(fileName)}`;
}

/**
 * Issues a short-lived signed upload URL. The client PUTs the file to
 * `signedUrl` (or calls `supabase.storage.from(bucket).uploadToSignedUrl(path, token, file)`),
 * then stores `publicUrl` on the entity it belongs to.
 */
export async function createUploadUrl(userId: number, input: { bucket: StorageBucket; fileName: string; contentType: string }) {
  const contentType = assertContentType(input.bucket, input.contentType);
  const client = db(); // throws PRECONDITION_FAILED when storage is not configured
  const path = buildObjectPath(userId, input.fileName);
  const { data, error } = await client.storage.from(input.bucket).createSignedUploadUrl(path);
  if (error || !data) fail(error, "Signed upload URL failed");
  const publicUrl = client.storage.from(input.bucket).getPublicUrl(data.path).data.publicUrl;
  return { bucket: input.bucket, path: data.path, token: data.token, signedUrl: data.signedUrl, publicUrl, contentType };
}
