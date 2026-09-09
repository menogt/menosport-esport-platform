import { useCallback, useState } from "react";
import { supabase } from "@/lib/supabase";
import { trpc } from "@/lib/trpc";

export type UploadBucket = "avatars" | "team-assets" | "clan-assets" | "match-proof" | "media";

const MAX_BYTES: Record<UploadBucket, number> = {
  avatars: 2 * 1024 * 1024,
  "team-assets": 3 * 1024 * 1024,
  "clan-assets": 4 * 1024 * 1024,
  "match-proof": 6 * 1024 * 1024,
  media: 25 * 1024 * 1024,
};

/**
 * Upload a file to Supabase Storage through a server-issued signed upload URL.
 * The server validates bucket/content type and namespaces the path per user.
 * Returns the public URL to persist on the relevant record.
 */
export function useUpload(bucket: UploadBucket) {
  const createUploadUrl = trpc.storage.createUploadUrl.useMutation();
  const [progress, setProgress] = useState<"idle" | "signing" | "uploading" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const upload = useCallback(
    async (file: File): Promise<string> => {
      setError(null);
      if (file.size > MAX_BYTES[bucket]) {
        const message = `File is too large. Maximum ${Math.round(MAX_BYTES[bucket] / 1024 / 1024)} MB.`;
        setError(message);
        setProgress("error");
        throw new Error(message);
      }
      try {
        setProgress("signing");
        const target = await createUploadUrl.mutateAsync({ bucket, fileName: file.name, contentType: file.type || "application/octet-stream" });
        setProgress("uploading");
        const { error: uploadError } = await supabase.storage.from(target.bucket).uploadToSignedUrl(target.path, target.token, file, { contentType: file.type || undefined, upsert: true });
        if (uploadError) throw new Error(uploadError.message);
        setProgress("done");
        return target.publicUrl;
      } catch (caught) {
        const message = caught instanceof Error ? caught.message : "Upload failed";
        setError(message);
        setProgress("error");
        throw caught;
      }
    },
    [bucket, createUploadUrl]
  );

  return { upload, progress, error, isUploading: progress === "signing" || progress === "uploading" };
}
