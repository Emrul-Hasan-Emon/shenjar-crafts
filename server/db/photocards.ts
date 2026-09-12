import type { SupabaseClient } from "@supabase/supabase-js";
import { removeFile } from "../supabase/storage";
import type { Photocard } from "./types";

export async function listPhotocards(
  supabase: SupabaseClient,
  opts?: { categoryId?: string }
): Promise<Photocard[]> {
  let query = supabase.from("photocards").select("*").order("created_at", { ascending: false });
  if (opts?.categoryId) query = query.eq("category_id", opts.categoryId);
  const { data, error } = await query;
  if (error) throw error;
  return data as Photocard[];
}

export async function getPhotocardById(
  supabase: SupabaseClient,
  id: string
): Promise<Photocard | null> {
  const { data, error } = await supabase
    .from("photocards")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data as Photocard | null;
}

export type PhotocardInput = {
  category_id: string;
  image_path: string;
  width?: number | null;
  height?: number | null;
  name_en?: string | null;
  name_bn?: string | null;
  description_en?: string | null;
  description_bn?: string | null;
};

export async function createPhotocard(
  supabase: SupabaseClient,
  input: PhotocardInput
): Promise<Photocard> {
  const { data, error } = await supabase
    .from("photocards")
    .insert({
      category_id: input.category_id,
      image_path: input.image_path,
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
  return data as Photocard;
}

/**
 * `previousImagePath` is only needed when the caller uploaded a replacement
 * image — pass the old storage path so it gets cleaned up after the row
 * update succeeds. Omit it for a text-only edit (name/category change).
 */
export async function updatePhotocard(
  supabase: SupabaseClient,
  id: string,
  input: Partial<PhotocardInput> & { previousImagePath?: string }
): Promise<Photocard> {
  const { previousImagePath, ...rest } = input;
  const { data, error } = await supabase
    .from("photocards")
    .update(rest)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  if (previousImagePath && rest.image_path && previousImagePath !== rest.image_path) {
    await removeFile(supabase, previousImagePath).catch(() => {});
  }
  return data as Photocard;
}

export async function deletePhotocard(supabase: SupabaseClient, id: string): Promise<void> {
  const existing = await getPhotocardById(supabase, id);
  if (!existing) return;
  const { error } = await supabase.from("photocards").delete().eq("id", id);
  if (error) throw error;
  await removeFile(supabase, existing.image_path);
}
