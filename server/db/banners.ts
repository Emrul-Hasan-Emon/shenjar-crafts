import type { SupabaseClient } from "@supabase/supabase-js";
import { removeFile } from "../supabase/storage";
import type { Banner } from "./types";

export const MAX_BANNERS = 5;

export async function listBanners(supabase: SupabaseClient): Promise<Banner[]> {
  const { data, error } = await supabase
    .from("banners")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return data as Banner[];
}

export async function createBanner(
  supabase: SupabaseClient,
  imagePath: string
): Promise<Banner> {
  const existing = await listBanners(supabase);
  if (existing.length >= MAX_BANNERS) {
    throw new Error(`You can only have ${MAX_BANNERS} banners. Delete one first.`);
  }
  const nextOrder = existing.length ? Math.max(...existing.map((b) => b.sort_order)) + 1 : 0;
  const { data, error } = await supabase
    .from("banners")
    .insert({ image_path: imagePath, sort_order: nextOrder })
    .select("*")
    .single();
  if (error) throw error;
  return data as Banner;
}

export async function deleteBanner(supabase: SupabaseClient, id: string): Promise<void> {
  const { data: banner, error: fetchError } = await supabase
    .from("banners")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (fetchError) throw fetchError;
  if (!banner) return;

  const { error } = await supabase.from("banners").delete().eq("id", id);
  if (error) throw error;

  await removeFile(supabase, (banner as Banner).image_path);
}

export async function moveBanner(
  supabase: SupabaseClient,
  id: string,
  direction: "up" | "down"
): Promise<void> {
  const banners = await listBanners(supabase);
  const index = banners.findIndex((b) => b.id === id);
  const swapIndex = direction === "up" ? index - 1 : index + 1;
  if (index < 0 || swapIndex < 0 || swapIndex >= banners.length) return;

  const current = banners[index];
  const swapWith = banners[swapIndex];

  const { error: e1 } = await supabase
    .from("banners")
    .update({ sort_order: swapWith.sort_order })
    .eq("id", current.id);
  if (e1) throw e1;

  const { error: e2 } = await supabase
    .from("banners")
    .update({ sort_order: current.sort_order })
    .eq("id", swapWith.id);
  if (e2) throw e2;
}
