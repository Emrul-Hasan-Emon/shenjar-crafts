import type { SupabaseClient } from "@supabase/supabase-js";
import { removeFile } from "../supabase/storage";

export const MAX_SPEND_IMAGES = 3;

export type SpendImage = {
  id: string;
  finance_record_id: string;
  image_path: string;
  sort_order: number;
  created_at: string;
};

export async function listSpendImages(
  supabase: SupabaseClient,
  financeRecordId: string
): Promise<SpendImage[]> {
  const { data, error } = await supabase
    .from("spend_images")
    .select("*")
    .eq("finance_record_id", financeRecordId)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return data as SpendImage[];
}

export async function createSpendImage(
  supabase: SupabaseClient,
  financeRecordId: string,
  imagePath: string
): Promise<SpendImage> {
  const existing = await listSpendImages(supabase, financeRecordId);
  if (existing.length >= MAX_SPEND_IMAGES) {
    throw new Error(`You can only attach ${MAX_SPEND_IMAGES} images to a spend. Delete one first.`);
  }
  const nextOrder = existing.length ? Math.max(...existing.map((i) => i.sort_order)) + 1 : 0;
  const { data, error } = await supabase
    .from("spend_images")
    .insert({ finance_record_id: financeRecordId, image_path: imagePath, sort_order: nextOrder })
    .select("*")
    .single();
  if (error) throw error;
  return data as SpendImage;
}

export async function deleteSpendImage(supabase: SupabaseClient, id: string): Promise<void> {
  const { data: image, error: fetchError } = await supabase
    .from("spend_images")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (fetchError) throw fetchError;
  if (!image) return;

  const { error } = await supabase.from("spend_images").delete().eq("id", id);
  if (error) throw error;

  await removeFile(supabase, (image as SpendImage).image_path);
}
