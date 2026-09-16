import type { SupabaseClient } from "@supabase/supabase-js";
import type { Board } from "./types";

export type BoardInput = {
  name_en?: string | null;
  name_bn?: string | null;
  description_en?: string | null;
  description_bn?: string | null;
  color_id: string;
  thickness_id: string;
  sheet_length_inches: number;
  sheet_length_shuta: number;
  sheet_width_inches: number;
  sheet_width_shuta: number;
  price_per_sheet: number;
  wastage_percent: number;
};

function toRow(input: BoardInput) {
  return {
    name_en: input.name_en ?? null,
    name_bn: input.name_bn ?? null,
    description_en: input.description_en ?? null,
    description_bn: input.description_bn ?? null,
    color_id: input.color_id,
    thickness_id: input.thickness_id,
    sheet_length_inches: input.sheet_length_inches,
    sheet_length_shuta: input.sheet_length_shuta,
    sheet_width_inches: input.sheet_width_inches,
    sheet_width_shuta: input.sheet_width_shuta,
    price_per_sheet: input.price_per_sheet,
    wastage_percent: input.wastage_percent,
  };
}

/** Postgres unique_violation → a friendly message instead of a raw DB error. */
function rethrowFriendly(error: { code?: string; message: string }): never {
  if (error.code === "23505") {
    throw new Error("A board with this color and thickness already exists.");
  }
  throw error;
}

export async function listBoards(supabase: SupabaseClient): Promise<Board[]> {
  const { data, error } = await supabase
    .from("boards")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as Board[];
}

export async function createBoard(supabase: SupabaseClient, input: BoardInput): Promise<Board> {
  const { data, error } = await supabase
    .from("boards")
    .insert(toRow(input))
    .select("*")
    .single();
  if (error) rethrowFriendly(error);
  return data as Board;
}

export async function updateBoard(
  supabase: SupabaseClient,
  id: string,
  input: BoardInput
): Promise<Board> {
  const { data, error } = await supabase
    .from("boards")
    .update(toRow(input))
    .eq("id", id)
    .select("*")
    .single();
  if (error) rethrowFriendly(error);
  return data as Board;
}

export async function deleteBoard(supabase: SupabaseClient, id: string): Promise<void> {
  const { error } = await supabase.from("boards").delete().eq("id", id);
  if (error) throw error;
}
