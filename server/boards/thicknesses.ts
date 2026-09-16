import type { SupabaseClient } from "@supabase/supabase-js";
import type { BoardThickness } from "./types";

export type BoardThicknessInput = {
  value_mm: number;
};

export async function listBoardThicknesses(supabase: SupabaseClient): Promise<BoardThickness[]> {
  const { data, error } = await supabase
    .from("board_thicknesses")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("value_mm", { ascending: true });
  if (error) throw error;
  return data as BoardThickness[];
}

export async function createBoardThickness(
  supabase: SupabaseClient,
  input: BoardThicknessInput
): Promise<BoardThickness> {
  const { data, error } = await supabase
    .from("board_thicknesses")
    .insert({ value_mm: input.value_mm })
    .select("*")
    .single();
  if (error) throw error;
  return data as BoardThickness;
}

export async function updateBoardThickness(
  supabase: SupabaseClient,
  id: string,
  input: BoardThicknessInput
): Promise<BoardThickness> {
  const { data, error } = await supabase
    .from("board_thicknesses")
    .update({ value_mm: input.value_mm })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data as BoardThickness;
}

export async function deleteBoardThickness(supabase: SupabaseClient, id: string): Promise<void> {
  const { error } = await supabase.from("board_thicknesses").delete().eq("id", id);
  if (error) throw error;
}

/** Flips is_default on `id`, off on every other row — the partial unique index on
 * board_thicknesses(is_default) is the hard backstop if this ever raced. */
export async function setDefaultBoardThickness(supabase: SupabaseClient, id: string): Promise<void> {
  const { error: clearError } = await supabase
    .from("board_thicknesses")
    .update({ is_default: false })
    .neq("id", id);
  if (clearError) throw clearError;
  const { error: setError } = await supabase
    .from("board_thicknesses")
    .update({ is_default: true })
    .eq("id", id);
  if (setError) throw setError;
}
