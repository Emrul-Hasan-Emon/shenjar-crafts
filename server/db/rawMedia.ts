import type { SupabaseClient } from "@supabase/supabase-js";
import { removeFile } from "../supabase/storage";
import type { MediaKind, RawMedia } from "./types";

export async function listRawMedia(
  supabase: SupabaseClient,
  opts?: { categoryId?: string; kind?: MediaKind }
): Promise<RawMedia[]> {
  let query = supabase.from("raw_media").select("*").order("created_at", { ascending: false });
  if (opts?.categoryId) query = query.eq("category_id", opts.categoryId);
  if (opts?.kind) query = query.eq("kind", opts.kind);
  const { data, error } = await query;
  if (error) throw error;
  return data as RawMedia[];
}

export async function getRawMediaById(
  supabase: SupabaseClient,
  id: string
): Promise<RawMedia | null> {
  const { data, error } = await supabase
    .from("raw_media")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data as RawMedia | null;
}

export type RawMediaInput = {
  category_id: string;
  kind: MediaKind;
  media_path: string;
  width?: number | null;
  height?: number | null;
  name_en?: string | null;
  name_bn?: string | null;
  description_en?: string | null;
  description_bn?: string | null;
};

export async function createRawMedia(
  supabase: SupabaseClient,
  input: RawMediaInput
): Promise<RawMedia> {
  const { data, error } = await supabase
    .from("raw_media")
    .insert({
      category_id: input.category_id,
      kind: input.kind,
      media_path: input.media_path,
      width: input.width ?? null,
      height: input.height ?? null,
      name_en: input.name_en ?? null,
      name_bn: input.name_bn ?? null,
      description_en: input.description_en ?? null,
      description_bn: input.description_bn ?? null,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as RawMedia;
}

/**
 * `previousMediaPath` is only needed when the caller uploaded a replacement
 * file — pass the old storage path so it gets cleaned up after the row
 * update succeeds. Omit it for a text-only edit (name/category change).
 */
export async function updateRawMedia(
  supabase: SupabaseClient,
  id: string,
  input: Partial<RawMediaInput> & { previousMediaPath?: string }
): Promise<RawMedia> {
  const { previousMediaPath, ...rest } = input;
  const { data, error } = await supabase
    .from("raw_media")
    .update(rest)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  if (previousMediaPath && rest.media_path && previousMediaPath !== rest.media_path) {
    await removeFile(supabase, previousMediaPath).catch(() => {});
  }
  return data as RawMedia;
}

export async function deleteRawMedia(supabase: SupabaseClient, id: string): Promise<void> {
  const existing = await getRawMediaById(supabase, id);
  if (!existing) return;
  const { error } = await supabase.from("raw_media").delete().eq("id", id);
  if (error) throw error;
  await removeFile(supabase, existing.media_path);
}
