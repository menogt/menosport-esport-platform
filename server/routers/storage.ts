import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { STORAGE_BUCKETS, createUploadUrl } from "../domain/storage";

export const storageRouter = router({
  /**
   * Returns a signed upload URL for a Supabase Storage bucket. The client
   * uploads directly to `signedUrl` (or via `uploadToSignedUrl(path, token, file)`)
   * and then saves `publicUrl` on the profile/team/clan/media record.
   */
  createUploadUrl: protectedProcedure
    .input(z.object({
      bucket: z.enum(STORAGE_BUCKETS),
      fileName: z.string().trim().min(1).max(200),
      contentType: z.string().trim().min(3).max(100),
    }))
    .mutation(({ ctx, input }) => createUploadUrl(ctx.user.id, input)),
});
