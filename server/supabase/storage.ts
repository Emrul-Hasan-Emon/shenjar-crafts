import type { SupabaseClient } from "@supabase/supabase-js";

export const MEDIA_BUCKET = "media";

export function getPublicUrl(supabase: SupabaseClient, path: string): string {
  return supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path).data.publicUrl;
}

export async function uploadFile(
  supabase: SupabaseClient,
  path: string,
  file: File | Blob | Buffer,
  contentType?: string
) {
  const { error } = await supabase.storage
    .from(MEDIA_BUCKET)
    .upload(path, file, { upsert: true, contentType });
  if (error) throw error;
  return path;
}

export async function removeFile(supabase: SupabaseClient, path: string) {
  const { error } = await supabase.storage.from(MEDIA_BUCKET).remove([path]);
  if (error) throw error;
}

/** Slug-safe file name: keeps the extension, replaces everything else. */
export function safeFileName(originalName: string): string {
  const dot = originalName.lastIndexOf(".");
  const ext = dot >= 0 ? originalName.slice(dot) : "";
  const stem = (dot >= 0 ? originalName.slice(0, dot) : originalName)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  const unique = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  return `${stem || "file"}-${unique}${ext.toLowerCase()}`;
}
