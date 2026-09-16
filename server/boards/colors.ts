import type { SupabaseClient } from "@supabase/supabase-js";
import type { BoardColor } from "./types";

export type BoardColorInput = {
  name_en: string;
  name_bn?: string | null;
  description_en?: string | null;
  description_bn?: string | null;
};

export async function listBoardColors(supabase: SupabaseClient): Promise<BoardColor[]> {
  const { data, error } = await supabase
    .from("board_colors")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("name_en", { ascending: true });
  if (error) throw error;
  return data as BoardColor[];
}

export async function createBoardColor(
  supabase: SupabaseClient,
  input: BoardColorInput
): Promise<BoardColor> {
  const { data, error } = await supabase
    .from("board_colors")
    .insert({
      name_en: input.name_en,
      name_bn: input.name_bn ?? null,
      description_en: input.description_en ?? null,
      description_bn: input.description_bn ?? null,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as BoardColor;
}

export async function updateBoardColor(
  supabase: SupabaseClient,
  id: string,
  input: BoardColorInput
): Promise<BoardColor> {
  const { data, error } = await supabase
    .from("board_colors")
    .update({
      name_en: input.name_en,
      name_bn: input.name_bn ?? null,
      description_en: input.description_en ?? null,
      description_bn: input.description_bn ?? null,
    })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data as BoardColor;
}

export async function deleteBoardColor(supabase: SupabaseClient, id: string): Promise<void> {
  const { error } = await supabase.from("board_colors").delete().eq("id", id);
  if (error) throw error;
}

/** Flips is_default on `id`, off on every other row — the partial unique index on
 * board_colors(is_default) is the hard backstop if this ever raced. */
export async function setDefaultBoardColor(supabase: SupabaseClient, id: string): Promise<void> {
  const { error: clearError } = await supabase
    .from("board_colors")
    .update({ is_default: false })
    .neq("id", id);
  if (clearError) throw clearError;
  const { error: setError } = await supabase
    .from("board_colors")
    .update({ is_default: true })
    .eq("id", id);
  if (setError) throw setError;
}
